import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma'; 

export async function POST(request: Request) {
    try {
        const { address, timeframe } = await request.json();
        if (!address) return NextResponse.json({ error: "Adresse requise" }, { status: 400 });

        const apiKey = process.env.ZERION_API_KEY;
        if (!apiKey) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });

        const encodedKey = Buffer.from(`${apiKey}:`).toString('base64');
        const headers = { 'accept': 'application/json', 'authorization': `Basic ${encodedKey}` };
        const safeAddress = address.toLowerCase();

        // 1. VÉRIFICATION DU SEED (A-t-on le VRAI historique complet ?)
        const existingHistoryCount = await prisma.portfolioSnapshot.count({
            where: { address: safeAddress }
        });

        // Si moins de 50 points, c'est que la base est polluée ou vide. On nettoie !
        if (existingHistoryCount < 50) {
            console.log("Historique incomplet détecté. Nettoyage et téléchargement complet...");
            
            // On supprime les mauvaises données (les clones d'aujourd'hui)
            await prisma.portfolioSnapshot.deleteMany({
                where: { address: safeAddress }
            });

            // On télécharge le vrai historique depuis le début (Max)
            const chartRes = await fetch(`https://api.zerion.io/v1/wallets/${address}/charts/max?currency=usd&filter[positions]=no_filter`, { headers });
            
            if (chartRes.ok) {
                const chartData = await chartRes.json();
                const points = chartData.data?.attributes?.charts || [];
                
                if (points.length > 0) {
                    const snapshotsToInsert = points.map((p: any) => ({
                        address: safeAddress,
                        timestamp: new Date(p[0] * 1000), // Vrai timestamp Zerion
                        balance: parseFloat(Number(p[1]).toFixed(2))
                    }));

                    await prisma.portfolioSnapshot.createMany({
                        data: snapshotsToInsert,
                        skipDuplicates: true,
                    });
                    console.log(`✅ ${snapshotsToInsert.length} points historiques sauvegardés !`);
                }
            }
        }

        // 2. MISE À JOUR EN TEMPS RÉEL (Sécurisée contre le spam)
        try {
            const portfolioRes = await fetch(`https://api.zerion.io/v1/wallets/${address}/portfolio?currency=usd&filter[positions]=no_filter`, { headers });
            if (portfolioRes.ok) {
                const portfolioData = await portfolioRes.json();
                const currentBalance = portfolioData.data?.attributes?.total?.positions;
                
                if (currentBalance !== undefined) {
                    // TECHNIQUE PRO : On arrondit à l'heure pile (ex: 14:00:00)
                    const now = new Date();
                    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);

                    // Cherche si on a déjà mis à jour le solde pendant cette heure
                    const existingPoint = await prisma.portfolioSnapshot.findFirst({
                        where: { address: safeAddress, timestamp: currentHour }
                    });

                    if (!existingPoint) {
                        // S'il n'y a pas de point pour cette heure, on le crée
                        await prisma.portfolioSnapshot.create({
                            data: { address: safeAddress, timestamp: currentHour, balance: parseFloat(Number(currentBalance).toFixed(2)) }
                        });
                    } else {
                        // S'il existe déjà, on le met à jour pour avoir la dernière précision
                        await prisma.portfolioSnapshot.update({
                            where: { id: existingPoint.id },
                            data: { balance: parseFloat(Number(currentBalance).toFixed(2)) }
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Erreur de sauvegarde du solde actuel :", e);
        }

        // 3. RÉPONSE ULTRA-RAPIDE DEPUIS POSTGRESQL
        const now = new Date();
        let limitDate = new Date(0); 
        
        if (timeframe === '1J') limitDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        else if (timeframe === '1S') limitDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        else if (timeframe === '1M') limitDate.setMonth(now.getMonth() - 1);
        else if (timeframe === '3M') limitDate.setMonth(now.getMonth() - 3);
        else if (timeframe === '1A') limitDate.setFullYear(now.getFullYear() - 1);

        const dbSnapshots = await prisma.portfolioSnapshot.findMany({
            where: { 
                address: safeAddress,
                timestamp: { gte: limitDate } 
            },
            orderBy: { timestamp: 'asc' }
        });

        // Le VRAI solde total est le tout dernier point enregistré
        const totalBalance = dbSnapshots.length > 0 ? dbSnapshots[dbSnapshots.length - 1].balance : 0;

        return NextResponse.json({ chartData: dbSnapshots, totalBalance }, { status: 200 });

    } catch (error) {
        console.error("❌ CRASH API INDEXEUR :", error);
        return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
    }
}