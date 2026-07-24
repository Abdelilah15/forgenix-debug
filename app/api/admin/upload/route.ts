import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function POST(request: Request) {
  try {
    // 1. Vérification de la sécurité (Cookie Admin)
    const cookieStore = await cookies();
    const token = cookieStore.get('nexulayer_admin_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const payload = await verifyAdminSession(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Session invalide.' }, { status: 401 });
    }

    // 2. Récupération du fichier depuis la requête FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 });
    }

    // (Optionnel) Vérification du type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Le fichier doit être une image.' }, { status: 400 });
    }

    // 3. Préparation du fichier pour Supabase
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Générer un nom de fichier unique pour éviter les collisions
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uniqueSuffix}.${fileExtension}`;

    // 4. Upload vers le bucket Supabase "airdrop-assets"
    const adminClient = supabaseAdmin();
    const { data, error } = await adminClient
      .storage
      .from('airdrop-assets')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Erreur Supabase Storage: ${error.message}`);
    }

    // 5. Récupération de l'URL publique
    const { data: publicUrlData } = adminClient
      .storage
      .from('airdrop-assets')
      .getPublicUrl(fileName);

    return NextResponse.json(
      {
        success: true,
        url: publicUrlData.publicUrl
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Erreur POST /api/admin/upload:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
