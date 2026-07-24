import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/app/lib/auth';
import { createAirdrop } from '@/app/lib/airdrops';

export async function POST(request: Request) {
  try {
    // 1. Récupération et vérification du cookie de session
    const cookieStore = await cookies();
    const token = cookieStore.get('nexulayer_admin_session')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Non autorisé. Veuillez vous connecter avec votre portefeuille.' },
        { status: 401 }
      );
    }

    // 2. Décodage et validation du JWT
    const payload = await verifyAdminSession(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Session invalide ou expirée.' },
        { status: 401 }
      );
    }

    // 3. Traitement de la requête
    const body = await request.json();
    const newAirdrop = await createAirdrop(body);

    return NextResponse.json(
      { success: true, data: newAirdrop },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Erreur POST /api/admin/airdrops:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne lors de la création.' },
      { status: 500 }
    );
  }
}
