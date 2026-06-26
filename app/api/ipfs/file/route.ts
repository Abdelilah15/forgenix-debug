import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }

    // Reconstruction du FormData pour l'API Pinata
    const pinataData = new FormData();
    pinataData.append('file', file);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: pinataData,
    });

    if (!res.ok) throw new Error("Erreur Pinata");
    
    const data = await res.json();
    return NextResponse.json({ ipfsHash: data.IpfsHash }, { status: 200 });
  } catch (error) {
    console.error("Erreur IPFS File:", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'upload du fichier" }, { status: 500 });
  }
}