import { NextRequest, NextResponse } from "next/server";
import { prisma } from '../../lib/prisma'; // Assure-toi que le chemin correspond à ton projet
import { CHAINS, getEnabledChains } from "@/lib/wallet/chains";
import { runLocalFactory } from "@/lib/wallet/localFactory";
import { mergeAssets } from "@/lib/wallet/merge";
import type { Asset, FactoryError } from "@/lib/wallet/types";

/**
 * Fonction dédiée à la récupération des actifs (Tokens + DeFi) via Zerion.
 * Retourne des Asset[] normalisés.
 */
async function getZerionAssetsNormalized(address: string): Promise<Asset[]> {
    const apiKey = process.env.ZERION_API_KEY;
    if (!apiKey) return [];

    const encodedKey = Buffer.from(`${apiKey}:`).toString('base64');
    const headers = { 'accept': 'application/json', 'authorization': `Basic ${encodedKey}` };
    const safeAddress = address.toLowerCase();

    const assets: any[] = [];

    try {
        // 1. Récupération du catalogue complet et officiel des réseaux Zerion
        const chainsRes = await fetch("https://api.zerion.io/v1/chains", { headers });
        const chainIconsMap: Record<string, string | null> = {};

        if (chainsRes.ok) {
            const chainsData = await chainsRes.json();
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

                const chainIcon = chainIconsMap[chainId] || null;

                const price = attrs.price || 0;
                const value = attrs.value || (balance * price);
                const isWallet = attrs.position_type === 'wallet';

                assets.push({
                    id: pos.id || `${tokenInfo.symbol}-${chainId}`,
                    wallet: safeAddress, // ✅ FIX 1 : Indispensable pour a.wallet.toLowerCase()
                    chain: chainId as any, // ✅ On cast car Zerion renvoie "ethereum" etc, qui déborde du type ("plume"|"lisk"|"morph")
                    chainId: 0, // Fallback numérique car Zerion utilise des strings pour l'ID
                    chainName: chainName,
                    chainIcon: chainIcon,
                    positionType: isWallet ? "wallet" : "defi",
                    assetType: isWallet ? "erc20" : "vault", // ✅ FIX 2 : Requis pour la clé de déduplication
                    protocol: !isWallet ? (pos.relationships?.protocol?.data?.id || "DeFi Position") : null,
                    contractAddress: tokenInfo.implementations?.[0]?.address || null, // ✅ FIX 3 : Requis pour éviter un autre crash
                    symbol: tokenInfo.symbol || "???",
                    name: tokenInfo.name || "Unknown Token",
                    decimals: tokenInfo.decimals || 18,
                    rawBalance: attrs.quantity?.int || "0",
                    formattedBalance: attrs.quantity?.numeric || "0",
                    quantity: balance,
                    priceUsd: price,
                    valueUsd: parseFloat(value.toFixed(2)),
                    source: "zerion", // ✅ FIX 4 : Essentiel pour la priorité dans merge.ts
                    updatedAt: new Date().toISOString()
                } as Asset);
            });
        }
    } catch (e) {
        console.error("Erreur récupération actifs avec Zerion Positions Forcé:", e);
    }

    return assets;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const address = body?.address as string | undefined;
        const chainsInput = body?.chains as string | undefined; // ex: "plume,lisk,morph"
        const timeframe = body?.timeframe as string | undefined || '1M'; // Intégration du timeframe

        if (!address) {
            return NextResponse.json({ error: "address is required" }, { status: 400 });
        }

        const safeAddress = address.toLowerCase();
        const apiKey = process.env.ZERION_API_KEY;
        const encodedKey = Buffer.from(`${apiKey}:`).toString('base64');
        const headers = { 'accept': 'application/json', 'authorization': `Basic ${encodedKey}` };

        // ====================================================================
        // 1) GESTION DU GRAPHIQUE HISTORIQUE (PRISMA + ZERION PORTFOLIO)
        // ====================================================================
        let liveBalance = 0;
        try {
            // Mise à jour du solde actuel
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

        // Vérification et nettoyage historique (Flatline bug)
        const dbSnapshotsCheck = await prisma.portfolioSnapshot.findMany({
            where: { address: safeAddress },
            orderBy: { timestamp: 'asc' }
        });
        const existingHistoryCount = dbSnapshotsCheck.length;
        const isFlatLine = existingHistoryCount > 1 && dbSnapshotsCheck[0].balance === dbSnapshotsCheck[existingHistoryCount - 1].balance;

        if (existingHistoryCount < 400 || isFlatLine) {
            console.log("🔄 Nettoyage de la base et téléchargement de l'historique complet (Tokens + DeFi)...");
            await prisma.portfolioSnapshot.deleteMany({ where: { address: safeAddress } });

            try {
                const chartRes = await fetch(`https://api.zerion.io/v1/wallets/${safeAddress}/charts/max?currency=usd&filter[positions]=no_filter`, { headers });

                if (chartRes.ok) {
                    const chartData = await chartRes.json();
                    const attrs = chartData.data?.attributes || {};
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
                        console.log(`✅ ${snapshotsToInsert.length} vrais points historiques sauvegardés !`);
                    }
                }
            } catch (e) {
                console.error("Erreur historique", e);
            }
        }

        // Préparation des données du graphique en fonction du timeframe
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

        const finalTotalBalance = liveBalance > 0 ? liveBalance : (dbSnapshots.length > 0 ? dbSnapshots[dbSnapshots.length - 1].balance : 0);

        // Algorithme de synchronisation du graphe (A + Delta A)
        if (dbSnapshots.length > 0 && finalTotalBalance > 0) {
            const lastChartBalance = dbSnapshots[dbSnapshots.length - 1].balance;
            const missingActif = finalTotalBalance - lastChartBalance;

            if (Math.abs(missingActif) > 0.1) {
                dbSnapshots.forEach(snap => {
                    let adjustedBalance = snap.balance + missingActif;
                    snap.balance = adjustedBalance > 0 ? parseFloat(adjustedBalance.toFixed(2)) : 0;
                });
            }
        }


        // ====================================================================
        // 2) LANCEMENT DES USINES DE RÉCUPÉRATION (ZERION + LOCAL)
        // ====================================================================

        // Lancement Zerion en parallèle
        const zerionPromise = getZerionAssetsNormalized(address);

        // Lancement usine locale sur réseaux cibles
        const chains = getEnabledChains(chainsInput || "plume,lisk,morph");
        const localSettled = await Promise.allSettled(
            chains.map((chainKey) => runLocalFactory(address, CHAINS[chainKey]))
        );

        const localNative: Asset[] = [];
        const localTokens: Asset[] = [];
        const localDefi: Asset[] = [];
        const errors: FactoryError[] = [];
        let partial = false;

        for (const r of localSettled) {
            if (r.status === "fulfilled") {
                localNative.push(...r.value.native);
                localTokens.push(...r.value.tokens);
                localDefi.push(...r.value.defi);
                errors.push(...r.value.errors);
                if (r.value.partial) partial = true;
            } else {
                partial = true;
                errors.push({
                    scope: "merge",
                    reason: r.reason?.message || "local factory execution failed",
                });
            }
        }

        let zerionAssets: Asset[] = [];
        try {
            // On ajoute un timeout manuel de sécurité de 8 secondes maximum pour Zerion
            // Si Zerion bloque, on l'ignore et on charge le reste du dashboard
            const timeoutPromise = new Promise<Asset[]>((_, reject) =>
                setTimeout(() => reject(new Error("Zerion API Timeout ou bloqué")), 8000)
            );
            zerionAssets = await Promise.race([zerionPromise, timeoutPromise]);
        } catch (e: any) {
            console.warn("⚠️ Zerion ignoré (Réseau ou Timeout) :", e.message);
            partial = true; // Le dashboard s'affichera quand même avec le flag "données partielles"
            errors.push({
                scope: "merge",
                reason: e?.message || "Zerion bloqué par le réseau",
            });
        }

        // ====================================================================
        // 3) FUSION ET RÉPONSE FINALE
        // ====================================================================

        const merged = mergeAssets({
            zerionAssets,
            localNative,
            localTokens,
            localDefi,
            errors,
            partial,
        });

        // Calcul du total incluant Zerion + les usines locales ajoutées
        const totalBalanceMerged = merged.assets.reduce((sum, a) => sum + (a.valueUsd || 0), 0);

        return NextResponse.json({
            totalBalance: totalBalanceMerged, // Le total qui intègre bien les ajouts locaux
            chartTotalBalance: finalTotalBalance, // Gardé à part si tu as besoin du total Zerion strict pour l'UI
            assets: merged.assets,
            native: merged.native,
            tokens: merged.tokens,
            defi: merged.defi,
            partial: merged.partial,
            errors: merged.errors,
            chartData: dbSnapshots, // Ton historique de graph inséré ici !
        });

    } catch (e: any) {
        console.error("❌ CRASH API PORTFOLIO :", e);
        return NextResponse.json(
            { error: e?.message || "portfolio route failed" },
            { status: 500 }
        );
    }
}