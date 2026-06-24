import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function POST(request: Request) {
    try {
        const { address, timeframe } = await request.json();
        if (!address) return NextResponse.json({ error: "Adresse requise" }, { status: 400 });

        const apiKey = process.env.ZERION_API_KEY;
        const encodedKey = Buffer.from(`${apiKey}:`).toString('base64');
        const headers = { 'accept': 'application/json', 'authorization': `Basic ${encodedKey}` };
        const safeAddress = address.toLowerCase();

        // 1. MISE À JOUR DU SOLDE ACTUEL (Jetons + DeFi)
        let liveBalance = 0;
        try {
            // VOTRE IDÉE : filter[positions]=no_filter (Demande à Zerion d'inclure Tokens + DeFi)
            const portfolioRes = await fetch(`https://api.zerion.io/v1/wallets/${safeAddress}/portfolio?currency=usd&filter[positions]=no_filter`, { headers });
            if (portfolioRes.ok) {
                const portfolioData = await portfolioRes.json();
                const totalObj = portfolioData.data?.attributes?.total;

                if (totalObj) {
                    liveBalance = Number(totalObj.positions) || 0;
                    liveBalance = parseFloat(liveBalance.toFixed(2));

                    if (liveBalance > 0) {
                        const now = new Date();
                        const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);

                        const existingPoint = await prisma.portfolioSnapshot.findFirst({
                            where: { address: safeAddress, timestamp: currentHour }
                        });

                        if (!existingPoint) {
                            await prisma.portfolioSnapshot.create({
                                data: { address: safeAddress, timestamp: currentHour, balance: liveBalance }
                            });
                        } else {
                            await prisma.portfolioSnapshot.update({
                                where: { id: existingPoint.id },
                                data: { balance: liveBalance }
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Erreur fetch live portfolio", e);
        }

        // 2. GESTION DE L'HISTORIQUE VÉRITABLE (Jetons + DeFi)
        const dbSnapshotsCheck = await prisma.portfolioSnapshot.findMany({
            where: { address: safeAddress },
            orderBy: { timestamp: 'asc' }
        });
        const existingHistoryCount = dbSnapshotsCheck.length;

        // DÉTECTION DU BUG DE LA LIGNE PLATE :
        // Si le point le plus vieux et le plus récent ont la même valeur, on détruit l'ancien bug !
        const isFlatLine = existingHistoryCount > 1 && dbSnapshotsCheck[0].balance === dbSnapshotsCheck[existingHistoryCount - 1].balance;

        if (existingHistoryCount < 400 || isFlatLine) {
            console.log("🔄 Nettoyage de la base et téléchargement de l'historique complet (Tokens + DeFi)...");
            await prisma.portfolioSnapshot.deleteMany({ where: { address: safeAddress } });

            try {
                // VOTRE IDÉE : filter[positions]=no_filter inclus dans l'historique
                const chartRes = await fetch(`https://api.zerion.io/v1/wallets/${safeAddress}/charts/max?currency=usd&filter[positions]=no_filter`, { headers });

                if (chartRes.ok) {
                    const chartData = await chartRes.json();
                    const attrs = chartData.data?.attributes || {};

                    // CORRECTION DU BUG ZERION : Le tableau s'appelle "points", pas "charts" !
                    const points = attrs.points || attrs.charts || attrs.chart || [];

                    if (points.length > 0) {
                        const snapshotsToInsert = points.map((p: any) => ({
                            address: safeAddress,
                            timestamp: new Date(p[0] * 1000),
                            balance: parseFloat(Number(p[1]).toFixed(2))
                        }));

                        await prisma.portfolioSnapshot.createMany({
                            data: snapshotsToInsert,
                            skipDuplicates: true,
                        });
                        console.log(`✅ ${snapshotsToInsert.length} vrais points historiques (DeFi + Jetons) sauvegardés !`);
                    } else {
                        console.log("⚠️ L'API Zerion n'a retourné aucun historique pour cette adresse.");
                    }
                }
            } catch (e) {
                console.error("Erreur historique", e);
            }
        }

        // 3. PRÉPARATION DES DONNÉES POUR LE GRAPHIQUE 
        const now = new Date();
        let limitDate = new Date(0);

        if (timeframe === '1J') limitDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        else if (timeframe === '1S') limitDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        else if (timeframe === '1M') limitDate.setMonth(now.getMonth() - 1);
        else if (timeframe === '3M') limitDate.setMonth(now.getMonth() - 3);
        else if (timeframe === '1A') limitDate.setFullYear(now.getFullYear() - 1);
        else if (timeframe === 'Max') limitDate = new Date(0);

        const dbSnapshots = await prisma.portfolioSnapshot.findMany({
            where: { address: safeAddress, timestamp: { gte: limitDate } },
            orderBy: { timestamp: 'asc' }
        });

        // Le VRAI solde total actuel (ex: 33$)
        const finalTotalBalance = liveBalance > 0 ? liveBalance : (dbSnapshots.length > 0 ? dbSnapshots[dbSnapshots.length - 1].balance : 0);

        // 🔥 L'ALGORITHME DE SYNCHRONISATION (A + Delta A) 🔥
        if (dbSnapshots.length > 0 && finalTotalBalance > 0) {
            // On regarde à quelle altitude se trouve la fin de la courbe (ex: 1$)
            const lastChartBalance = dbSnapshots[dbSnapshots.length - 1].balance;

            // On calcule l'actif historique "oublié" par le graphe (ex: 33 - 1 = 32$)
            const missingActif = finalTotalBalance - lastChartBalance;

            // Si le graphe est décalé par rapport à la réalité
            if (Math.abs(missingActif) > 0.1) {
                dbSnapshots.forEach(snap => {
                    // APPLICATION DE VOTRE FORMULE : Actif Moment = A (missingActif) + Delta A (snap.balance)
                    let adjustedBalance = snap.balance + missingActif;

                    // Sécurité mathématique : un portefeuille ne peut pas être négatif
                    snap.balance = adjustedBalance > 0 ? parseFloat(adjustedBalance.toFixed(2)) : 0;
                });
            }
        }

        // === BLOC DE RÉCUPÉRATION ZERION AVEC LE CATALOGUE DES RÉSEAUX ===
        let assets: any[] = [];
        try {
            // 1. NOUVEAUTÉ : On récupère le catalogue complet et officiel des réseaux Zerion
            // (1 seul appel ultra rapide pour récupérer toutes les icônes)
            const chainsRes = await fetch("https://api.zerion.io/v1/chains", { headers });
            const chainIconsMap: Record<string, string | null> = {};

            if (chainsRes.ok) {
                const chainsData = await chainsRes.json();
                // On crée un dictionnaire : "binance-smart-chain" -> "https://..."
                chainsData.data?.forEach((chain: any) => {
                    chainIconsMap[chain.id] = chain.attributes?.icon?.url || null;
                });
            }

            // 2. Récupération unifiée de tous les actifs (Tokens + DeFi)
            const positionsRes = await fetch(
                `https://api.zerion.io/v1/wallets/${safeAddress}/positions?currency=usd&filter[positions]=no_filter&sort=value`,
                { headers }
            );

            if (positionsRes.ok) {
                const positionsData = await positionsRes.json();
                const rawPositions = positionsData.data || [];

                rawPositions.forEach((pos: any) => {
                    const attrs = pos.attributes;
                    if (!attrs) return;

                    const tokenInfo = attrs.fungible_info || {};
                    const balance = attrs.quantity?.numeric ? parseFloat(attrs.quantity.numeric) : 0;

                    // On conserve même les centimes et petits soldes
                    if (balance <= 0) return;

                    const chainId = pos.relationships?.chain?.data?.id || "unknown";
                    const chainName = chainId
                        .split('-')
                        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');

                    // 3. LA MAGIE ICI : On associe instantanément l'icône HD depuis notre dictionnaire
                    const chainIcon = chainIconsMap[chainId] || null;

                    const price = attrs.price || 0;
                    const value = attrs.value || (balance * price);
                    const isWallet = attrs.position_type === 'wallet';

                    assets.push({
                        id: pos.id || `${tokenInfo.symbol}-${chainId}`,
                        name: tokenInfo.name || "Unknown Token",
                        symbol: tokenInfo.symbol || "???",
                        balance: balance,
                        price: price,
                        value: parseFloat(value.toFixed(2)),
                        icon: tokenInfo.icon?.url || null, // Icône du Token fournie nativement
                        chainId: chainId,
                        chainName: chainName,
                        chainIcon: chainIcon,              // Icône du Réseau officielle Zerion !
                        positionType: isWallet ? "wallet" : "defi",
                        protocolName: !isWallet ? (pos.relationships?.protocol?.data?.id || "DeFi Position") : null
                    });
                });
            }
        } catch (e) {
            console.error("Erreur récupération actifs avec Zerion Positions Forcé:", e);
        }


        
       // === L'USINE EXPLORATEUR GLOBALE (BLOCKSCOUT + COINGECKO) ===
        try {
            console.log(`\n⚙️ Lancement de l'Usine Explorateur Universelle...`);

            // CATALOGUE GLOBAL : Ajoutez ici n'importe quel réseau Blockscout V2
            const explorerNetworks = [
                {
                    chainId: "morph",
                    chainName: "Morph",
                    baseUrl: `https://explorer.morphl2.io/api/v2/addresses/${safeAddress}`,
                    cgNetworkId: "morph",
                    nativeSymbol: "ETH",
                    nativeCgId: "ethereum" 
                },
                {
                    chainId: "lisk",
                    chainName: "Lisk",
                    baseUrl: `https://blockscout.lisk.com/api/v2/addresses/${safeAddress}`,
                    cgNetworkId: "lisk",
                    nativeSymbol: "ETH",
                    nativeCgId: "ethereum"
                },
                {
                    chainId: "plume",
                    chainName: "Plume",
                    baseUrl: `https://phoenix-explorer.plumenetwork.xyz/api/v2/addresses/${safeAddress}`,
                    cgNetworkId: "plume-network", 
                    nativeSymbol: "PLUME",
                    nativeCgId: "plume-network" // Correction : Identifiant officiel pour obtenir le 0.0096$
                }
            ];

            for (const network of explorerNetworks) {
                try {
                    let itemsFound = 0;
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 4000); 

                    // --- ETAPE A : MONNAIE NATIVE (GAS) ---
                    const nativeRes = await fetch(network.baseUrl, { 
                        headers: { 'accept': 'application/json' }, cache: 'no-store', signal: controller.signal
                    });
                    
                    if (nativeRes.ok) {
                        const nativeData = await nativeRes.json();
                        const coinBalance = parseFloat(nativeData.coin_balance || "0") / 1e18; 

                        if (coinBalance > 0) {
                            itemsFound++;
                            
                            // 1. Cherche le prix sur l'explorateur
                            let price = nativeData.exchange_rate ? parseFloat(nativeData.exchange_rate) : 0;

                            // 2. Fallback CoinGecko Global (Règle le problème du 0$)
                            if (price === 0 && network.nativeCgId) {
                                try {
                                    const cgRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${network.nativeCgId}&vs_currencies=usd`);
                                    if (cgRes.ok) {
                                        const cgData = await cgRes.json();
                                        if (cgData[network.nativeCgId]?.usd) price = cgData[network.nativeCgId].usd;
                                    }
                                } catch (e) {}
                            }

                            const value = coinBalance * price;
                            
                            assets.push({
                                id: `explorer-native-${network.chainId}`,
                                name: network.nativeSymbol,
                                symbol: network.nativeSymbol,
                                balance: coinBalance,
                                price: price,
                                value: value > 0 ? parseFloat(value.toFixed(4)) : 0.0001, 
                                icon: `https://icons.llamao.fi/icons/chains/rsz_${network.chainId}?width=40&height=40`,
                                chainId: network.chainId,
                                chainName: network.chainName,
                                chainIcon: `https://icons.llamao.fi/icons/chains/rsz_${network.chainId}?width=40&height=40`, 
                                positionType: "wallet",
                                protocolName: null
                            });
                        }
                    }

                    // --- ETAPE B : CONTRATS (ERC-20, NFTs, JETONS DE REÇUS DEFI) ---
                    const tokenRes = await fetch(`${network.baseUrl}/token-balances`, { 
                        headers: { 'accept': 'application/json' }, cache: 'no-store', signal: controller.signal
                    });
                    clearTimeout(timeoutId); 

                    if (tokenRes.ok) {
                        const data = await tokenRes.json();
                        const tokens = data.items || [];

                        for (const item of tokens) {
                            const tokenInfo = item.token || {};
                            
                            // CORRECTION MATHÉMATIQUE GLOBALE : S'il n'y a pas de décimales (ex: NFT), on divise par 1.
                            const decimals = tokenInfo.decimals ? parseInt(tokenInfo.decimals, 10) : 0;
                            const balance = parseFloat(item.value || "0") / Math.pow(10, decimals);

                            if (balance <= 0) continue;
                            itemsFound++;

                            const contractAddress = tokenInfo.address || "";
                            const symbol = tokenInfo.symbol || "Unknown";
                            const name = tokenInfo.name || "Unknown Token";
                            let finalIcon = tokenInfo.icon_url || null;
                            
                            // 1. Cherche le prix de l'ERC-20 directement sur l'explorateur (Meilleure source)
                            let price = tokenInfo.exchange_rate ? parseFloat(tokenInfo.exchange_rate) : 0;

                            // 2. Fallback CoinGecko si l'explorateur ne connaît pas le prix
                            if (price === 0 && contractAddress && network.cgNetworkId) {
                                try {
                                    const cgRes = await fetch(
                                        `https://api.coingecko.com/api/v3/onchain/networks/${network.cgNetworkId}/tokens/${contractAddress}/info`,
                                        { headers: { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY || '' } }
                                    );
                                    if (cgRes.ok) {
                                        const cgData = await cgRes.json();
                                        const cgAttrs = cgData.data?.attributes || {};
                                        if (cgAttrs.image?.large) finalIcon = cgAttrs.image.large;
                                        if (cgAttrs.price_usd) price = parseFloat(cgAttrs.price_usd);
                                    }
                                } catch (e) {}
                            }

                            const value = balance * price;
                            
                            // DÉTECTION GLOBALE DEFI : Si c'est un jeton de reçu (Staked, Receipt, aToken, etc.)
                            const nameLower = name.toLowerCase();
                            const isDeFi = nameLower.includes("staked") || nameLower.includes("receipt") || symbol.toLowerCase().startsWith("st");

                            assets.push({
                                id: `explorer-${contractAddress}-${network.chainId}`,
                                name: name,
                                symbol: symbol,
                                balance: balance,
                                price: price,
                                value: value > 0 ? parseFloat(value.toFixed(4)) : 0.0001,
                                icon: finalIcon,
                                chainId: network.chainId,
                                chainName: network.chainName,
                                chainIcon: `https://icons.llamao.fi/icons/chains/rsz_${network.chainId}?width=40&height=40`, 
                                positionType: isDeFi ? "defi" : "wallet",
                                protocolName: isDeFi ? "DeFi Protocol" : null
                            });
                        }
                    }
                    if (itemsFound > 0) {
                        console.log(`✅ ${network.chainName} : ${itemsFound} actifs (dont jetons) intégrés.`);
                    }
                } catch (netError: any) {
                    console.error(`❌ Timeout sur l'explorateur ${network.chainName}.`);
                }
            }
        } catch (e) {
            console.error("Erreur critique Usine Explorateur :", e);
        }
        // === FIN DE L'USINE EXPLORATEUR GLOBALE ===


        return NextResponse.json({ chartData: dbSnapshots, totalBalance: finalTotalBalance, assets }, { status: 200 });
    } catch (error) {
        console.error("❌ CRASH API PORTFOLIO :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}