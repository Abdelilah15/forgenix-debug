import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma'; // Connexion à notre base de données

export async function POST(request: Request) {
    try {
        const { address, timeframe } = await request.json();
        if (!address) return NextResponse.json({ error: "Adresse requise" }, { status: 400 });

        const apiKey = process.env.ZERION_API_KEY;
        if (!apiKey) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });

        const encodedKey = Buffer.from(`${apiKey}:`).toString('base64');
        const headers = { 'accept': 'application/json', 'authorization': `Basic ${encodedKey}` };
        const safeAddress = address.toLowerCase();

        // 1. MISE À JOUR EN TEMPS RÉEL (On sauvegarde le solde exact de la seconde actuelle)
        try {
            const portfolioRes = await fetch(`https://api.zerion.io/v1/wallets/${address}/portfolio?currency=usd&filter[positions]=no_filter`, { headers });
            if (portfolioRes.ok) {
                const portfolioData = await portfolioRes.json();
                const currentBalance = portfolioData.data?.attributes?.total?.positions;
                if (currentBalance !== undefined) {
                    await prisma.portfolioSnapshot.create({
                        data: {
                            address: safeAddress,
                            timestamp: new Date(),
                            balance: currentBalance
                        }
                    });
                }
            }
        } catch (e) {
            console.error("Erreur de sauvegarde du solde actuel :", e);
        }

        // 2. CHECK POSTGRESQL : Est-ce qu'on a déjà téléchargé l'historique de ce wallet ?
        const existingHistory = await prisma.portfolioSnapshot.count({
            where: { address: safeAddress }
        });

        // 3. LE SEED INITIAL : Si le wallet est nouveau, on télécharge tout l'historique de Zerion (Mode MAX)
        if (existingHistory < 10) {
            console.log("Nouvel utilisateur détecté. Indexation de l'historique Zerion vers PostgreSQL...");
            const chartRes = await fetch(`https://api.zerion.io/v1/wallets/${address}/charts/max?currency=usd&filter[positions]=no_filter`, { headers });
            
            if (chartRes.ok) {
                const chartData = await chartRes.json();
                const points = chartData.data?.attributes?.charts || [];
                
                if (points.length > 0) {
                    const snapshotsToInsert = points.map((p: any) => ({
                        address: safeAddress,
                        timestamp: new Date(p[0] * 1000),
                        balance: parseFloat(Number(p[1]).toFixed(2))
                    }));

                    // Sauvegarde massive dans PostgreSQL (skipDuplicates empêche les erreurs de collision)
                    await prisma.portfolioSnapshot.createMany({
                        data: snapshotsToInsert,
                        skipDuplicates: true,
                    });
                    console.log(`✅ ${snapshotsToInsert.length} points sauvegardés dans la base !`);
                }
            }
        }

        // 4. RÉPONSE ULTRA-RAPIDE : On lit uniquement notre propre base de données !
        const now = new Date();
        let limitDate = new Date(0); // Par défaut: Max
        
        if (timeframe === '1J') limitDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        else if (timeframe === '1S') limitDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        else if (timeframe === '1M') limitDate.setMonth(now.getMonth() - 1);
        else if (timeframe === '3M') limitDate.setMonth(now.getMonth() - 3);
        else if (timeframe === '1A') limitDate.setFullYear(now.getFullYear() - 1);

        // On interroge Prisma
        const dbSnapshots = await prisma.portfolioSnapshot.findMany({
            where: { 
                address: safeAddress,
                timestamp: { gte: limitDate } // gte = "Greater Than or Equal" (Plus grand ou égal à la date limite)
            },
            orderBy: { timestamp: 'asc' }
        });

        // Le VRAI solde total est simplement le tout dernier point de notre base de données
        const totalBalance = dbSnapshots.length > 0 ? dbSnapshots[dbSnapshots.length - 1].balance : 0;

        return NextResponse.json({ chartData: dbSnapshots, totalBalance }, { status: 200 });

    } catch (error) {
        console.error("❌ CRASH API INDEXEUR :", error);
        return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
    }
}