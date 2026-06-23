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

        let assets: any[] = [];
        try {
            let chainsMeta: Record<string, any> = {};

            const mobulaHeaders = {
                'accept': 'application/json',
                ...(process.env.MOBULA_API_KEY && { 'Authorization': process.env.MOBULA_API_KEY })
            };

            const [chainsRes, portfolioRes, defiRes] = await Promise.all([
                fetch('https://api.mobula.io/api/1/blockchains', { headers: mobulaHeaders }).catch(() => null),
                fetch(`https://api.mobula.io/api/1/wallet/portfolio?wallet=${safeAddress}`, { headers: mobulaHeaders }).catch(() => null),
                fetch(`https://api.mobula.io/api/2/wallet/defi-positions?wallet=${safeAddress}`, { headers: mobulaHeaders }).catch(() => null)
            ]);

            // 1. Nettoyage strict (en minuscules) pour ne pas rater les icônes de Base ou Plume
            const cleanChainId = (cid: any) => cid ? cid.toString().replace('evm:', '').toLowerCase() : "unknown";

            if (chainsRes && chainsRes.ok) {
                const chainsData = await chainsRes.json();
                if (chainsData.data) {
                    chainsData.data.forEach((chain: any) => {
                        const cid = cleanChainId(chain.chainId || chain.name);
                        chainsMeta[cid] = {
                            name: chain.name,
                            icon: chain.logo || chain.icon || null
                        };
                    });
                }
            }

            if (portfolioRes && portfolioRes.ok) {
                const portfolioData = await portfolioRes.json();
                
                if (portfolioData.data && portfolioData.data.assets) {
                    portfolioData.data.assets.forEach((assetItem: any) => {
                        const tokenInfo = assetItem.asset;
                        
                        // 2. Filtre Anti-Spam : On bloque Matma manuellement
                        if (tokenInfo.name?.toLowerCase().includes("matma") || assetItem.is_spam) return;

                        const balancesArray = assetItem.contracts_balances || [];
                        
                        balancesArray.forEach((contract: any) => {
                            // On affiche tout tant que le solde est supérieur à 0
                            if (contract.balance <= 0) return;

                            const cid = cleanChainId(contract.chainId);
                            const networkData = chainsMeta[cid] || { name: cid, icon: null };
                            
                            assets.push({
                                id: `${tokenInfo.id || tokenInfo.symbol}-${cid}`,
                                name: tokenInfo.name || "Unknown",
                                symbol: tokenInfo.symbol || "???",
                                balance: contract.balance,
                                price: assetItem.price || 0,
                                value: contract.balance * (assetItem.price || 0),
                                icon: tokenInfo.logo || null,
                                chainId: cid,
                                chainName: networkData.name || cid,
                                chainIcon: networkData.icon || null,
                                positionType: "wallet",
                                protocolName: null
                            });
                        });
                    });
                }
            }

            if (defiRes && defiRes.ok) {
                const defiData = await defiRes.json();
                const positions = defiData.data || (Array.isArray(defiData) ? defiData : []);
                
                // 3. CORRECTION VS CODE : Ajout de "index: number" pour résoudre la ligne rouge
                positions.forEach((position: any, index: number) => {
                    const tokenInfo = position.asset || position.underlying_token || {};
                    const cid = cleanChainId(position.chainId || position.chain);
                    const networkData = chainsMeta[cid] || { name: cid, icon: null };
                    
                    const balance = position.balance || position.amount || 0;
                    const price = position.price || tokenInfo.price || 0;
                    
                    assets.push({
                        id: `defi-${position.id || tokenInfo.symbol || index}-${cid}`,
                        name: tokenInfo.name || position.protocol || "DeFi Position",
                        symbol: tokenInfo.symbol || "???",
                        balance: balance,
                        price: price,
                        value: position.value || (balance * price) || 0,
                        icon: tokenInfo.logo || position.logo || null,
                        chainId: cid,
                        chainName: networkData.name || cid,
                        chainIcon: networkData.icon || null,
                        positionType: position.type || "defi",
                        protocolName: position.protocol || "DeFi Protocol"
                    });
                });
            }
        } catch (e) {
            console.error("Erreur récupération actifs avec Mobula:", e);
        }

        return NextResponse.json({ chartData: dbSnapshots, totalBalance: finalTotalBalance, assets }, { status: 200 });

    } catch (error) {
        console.error("❌ CRASH API PORTFOLIO :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}