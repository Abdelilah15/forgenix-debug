import { NextRequest, NextResponse } from "next/server";
import { prisma } from '../../lib/prisma';
import { fetchAllWalletAssets } from "@/lib/wallet/orchestrator"; // Ton nouveau chef d'orchestre
import { mergeAssets } from "@/lib/wallet/merge";
import type { Asset, ApiError } from "@/lib/wallet/types";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const address = body?.address as string | undefined;
        const timeframe = body?.timeframe as string | undefined || '1M';

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
            console.log("🔄 Nettoyage de la base et téléchargement de l'historique complet...");
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
                        console.log(`✅ ${snapshotsToInsert.length} points historiques sauvegardés !`);
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
        // 2) LANCEMENT DE L'ORCHESTRATEUR GLOBAL (API MULTIPLES)
        // ====================================================================
        
        let allAssetsResponse = { assets: [], partial: false, errors: [] as ApiError[] };
        
        try {
            // C'est désormais l'orchestrateur qui va gérer ses propres limites de temps
            allAssetsResponse = await fetchAllWalletAssets(safeAddress);
        } catch (e: any) {
            console.warn("⚠️ Orchestrateur crashé globalement :", e.message);
            allAssetsResponse.partial = true;
            allAssetsResponse.errors.push({ source: "orchestrator", reason: e.message });
        }


        // ====================================================================
        // 3) FUSION ET RÉPONSE FINALE
        // ====================================================================

        const merged = mergeAssets(allAssetsResponse.assets, allAssetsResponse.errors);

        // Calcul du total basé sur les actifs fusionnés
        const totalBalanceMerged = merged.assets.reduce((sum, a) => sum + (a.valueUsd || 0), 0);

        return NextResponse.json({
            totalBalance: totalBalanceMerged,
            chartTotalBalance: finalTotalBalance,
            assets: merged.assets,
            native: merged.native,
            tokens: merged.tokens,
            defi: merged.defi,
            partial: merged.partial || allAssetsResponse.partial,
            errors: merged.errors,
            chartData: dbSnapshots,
        });

    } catch (e: any) {
        console.error("❌ CRASH API PORTFOLIO :", e);
        return NextResponse.json(
            { error: e?.message || "portfolio route failed" },
            { status: 500 }
        );
    }
}