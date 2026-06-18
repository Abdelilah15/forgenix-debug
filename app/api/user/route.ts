import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { address } = body;

        if (!address) {
            return NextResponse.json({ error: "Adresse requise" }, { status: 400 });
        }

        // ⚠️ ICI, NOUS CONNECTERONS VOTRE VRAIE BASE DE DONNÉES BIENTÔT
        // Exemple de logique à venir : 
        // 1. const user = await db.collection('users').findOne({ address });
        // 2. if (!user) { await db.collection('users').insertOne({ address, username: "NewForger" }) }

        // En attendant, on simule une réponse de la base de données :
        const mockUserProfile = {
            address: address,
            username: `Forger_${address.substring(2, 6).toUpperCase()}`, // Génère un nom stylé (ex: Forger_1A2B)
            role: "Creator",
            joinedAt: new Date().toISOString()
        };

        return NextResponse.json(mockUserProfile, { status: 200 });

    } catch (error) {
        console.error("Erreur API User:", error);
        return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
    }
}