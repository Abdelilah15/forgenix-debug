import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/app/lib/auth';
import { updateAirdrop, deleteAirdrop } from '@/app/lib/airdrops';

// Fonction utilitaire pour vérifier l'authentification sur chaque méthode
async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexulayer_admin_session')?.value;
  if (!token) return false;

  const payload = await verifyAdminSession(token);
  if (!payload || payload.role !== 'admin') return false;

  return true;
}

// MISE À JOUR (PUT)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAuth = await checkAuth();
    if (!isAuth) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const body = await request.json();
    await updateAirdrop(params.id, body);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Erreur PUT /api/admin/airdrops/${params.id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// SUPPRESSION (DELETE)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAuth = await checkAuth();
    if (!isAuth) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    await deleteAirdrop(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Erreur DELETE /api/admin/airdrops/${params.id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
