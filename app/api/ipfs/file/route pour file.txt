import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. On utilise request.formData() pour lire le fichier (et non request.json())
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // 2. On prépare un nouveau FormData à envoyer à l'API de Pinata
    const pinataFormData = new FormData();
    pinataFormData.append("file", file);

    // 3. On appelle le point de terminaison spécifique aux Fichiers (pinFileToIPFS)
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        // ⚠️ TRÈS IMPORTANT : Ne mettez PAS de "Content-Type" ici. 
        // Laissez `fetch` générer automatiquement le boundary pour le multipart/form-data.
      },
      body: pinataFormData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Détail de l'erreur Pinata:", errorText);
      throw new Error("Erreur Pinata lors de l'upload du fichier");
    }

    const data = await res.json();
    
    // 4. On renvoie le hash IPFS au frontend pour qu'il puisse l'inclure dans les métadonnées
    return NextResponse.json({ ipfsHash: data.IpfsHash }, { status: 200 });

  } catch (error) {
    console.error("Erreur IPFS File:", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'upload de l'image" }, { status: 500 });
  }
}