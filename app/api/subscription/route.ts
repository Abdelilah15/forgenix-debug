import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma'; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { txHash, walletAddress, tier, creditsAdded, amountUSDC } = body;

    if (!txHash || !walletAddress || !tier || !creditsAdded || amountUSDC === undefined) {
      return NextResponse.json(
        { error: "Données manquantes ou invalides." }, 
        { status: 400 }
      );
    }

    const normalizedAddress = walletAddress.toLowerCase();

    const user = await prisma.user.upsert({
      where: { 
        walletAddress: normalizedAddress 
      },
      update: {
        credits: {
          increment: creditsAdded // Ajoute les nouveaux crédits au solde existant
        }
      },
      create: {
        walletAddress: normalizedAddress,
        credits: creditsAdded
      }
    });

    const purchase = await prisma.purchase.create({
      data: {
        txHash: txHash,
        walletAddress: user.walletAddress,
        tier: tier,
        creditsAdded: creditsAdded,
        amountUSDC: amountUSDC,
      }
    });

    return NextResponse.json({ success: true, purchase }, { status: 200 });

  } catch (error: any) {
    console.error("Erreur API Subscription:", error);
    
    if (error.code === 'P2002' && error.meta?.target?.includes('txHash')) {
      return NextResponse.json(
        { error: "Cette transaction a déjà été enregistrée." }, 
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erreur serveur lors de l'enregistrement." }, 
      { status: 500 }
    );
  }
}