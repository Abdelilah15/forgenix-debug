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

        // 1. MISE À JOUR DU SOLDE ACTUEL (STRICTEMENT LES JETONS)
        let liveBalance = 0;
        try {
            // L'API par défaut (sans no_filter) exclut automatiquement les spams et petits restes
            const portfolioRes = await fetch(`https://api.zerion.io/v1/wallets/${safeAddress}/portfolio?currency=usd`, { headers });
            if (portfolioRes.ok) {
                const portfolioData = await portfolioRes.json();
                const totalObj = portfolioData.data?.attributes?.total;
                
                if (totalObj) {
                    // On cible UNIQUEMENT la valeur des jetons dans le portefeuille ("positions")
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

        // 2. GESTION DE L'HISTORIQUE VÉRITABLE (SANS FAUSSES DONNÉES)
        const existingHistoryCount = await prisma.portfolioSnapshot.count({
            where: { address: safeAddress }
        });

        // 👈 On utilise < 400 pour forcer la suppression des 365 faux points générés tout à l'heure !
        if (existingHistoryCount < 400) {
            await prisma.portfolioSnapshot.deleteMany({ where: { address: safeAddress } });
            
            try {
                // Téléchargement de l'historique strict (Jetons uniquement, pas de NFTs ni de spams)
                const chartRes = await fetch(`https://api.zerion.io/v1/wallets/${safeAddress}/charts/max?currency=usd`, { headers });
                
                if (chartRes.ok) {
                    const chartData = await chartRes.json();
                    const points = chartData.data?.attributes?.charts || [];
                    
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
                    }
                    // Le générateur de fausses données a été totalement supprimé. 
                    // S'il n'y a pas d'historique réel, le graphique utilisera uniquement les vraies données à partir d'aujourd'hui.
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

        const finalTotalBalance = liveBalance > 0 ? liveBalance : (dbSnapshots.length > 0 ? dbSnapshots[dbSnapshots.length - 1].balance : 0);

        return NextResponse.json({ chartData: dbSnapshots, totalBalance: finalTotalBalance }, { status: 200 });

    } catch (error) {
        console.error("❌ CRASH API PORTFOLIO :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}