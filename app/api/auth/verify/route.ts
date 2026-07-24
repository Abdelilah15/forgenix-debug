import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyWalletSignature, isAddressPublisher, createAdminSession } from '@/app/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, signature } = body;

    if (!message || !signature) {
      return NextResponse.json(
        { error: 'Le message et la signature sont requis.' },
        { status: 400 }
      );
    }

    // 1. On récupère l'adresse publique depuis la signature
    const address = await verifyWalletSignature(message, signature);

    console.log("🔍 [DEBUG] Adresse extraite de la signature :", address);
    console.log("🔍 [DEBUG] Adresse du contrat interrogé :", process.env.NEXT_PUBLIC_PUBLISHER_CONTRACT_ADDRESS);

    if (!address) {
      return NextResponse.json(
        { error: 'Signature invalide.' },
        { status: 401 }
      );
    }

    // 2. On interroge le Smart Contract pour savoir si c'est un administrateur
    const isAuthorized = await isAddressPublisher(address);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Accès refusé. Cette adresse n'est pas autorisée à publier des airdrops." },
        { status: 403 }
      );
    }

    // 3. Si tout est bon, on génère la session admin (JWT)
    const token = await createAdminSession(address);

    // 4. On stocke le JWT dans un Cookie HTTP-Only ultra sécurisé
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'nexulayer_admin_session',
      value: token,
      httpOnly: true, // Empêche le JavaScript côté client d'accéder au cookie (anti-XSS)
      secure: process.env.NODE_ENV === 'production', // Uniquement sur HTTPS en production
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // Expire dans 24 heures
    });

    return NextResponse.json(
      { success: true, address },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors de la vérification auth:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
