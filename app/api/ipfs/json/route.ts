import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify({ pinataContent: body }),
    });

    if (!res.ok) throw new Error("Erreur Pinata JSON");

    const data = await res.json();
    return NextResponse.json({ ipfsHash: data.IpfsHash }, { status: 200 });
  } catch (error) {
    console.error("Erreur IPFS JSON:", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'upload JSON" }, { status: 500 });
  }
}