import { NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { prisma } from '@/app/lib/prisma'; 


// GET: Fetch Prisma (PostgreSQL) credits
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: wallet.toLowerCase() }
    });

    return NextResponse.json({ credits: user?.credits || 0 }, { status: 200 });
  } catch (error) {
    console.error("User API Error (GET):", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create or fetch MongoDB user profile
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { address } = body;

        if (!address) {
            return NextResponse.json({ error: "Address is required" }, { status: 400 });
        }

        console.log("Attempting MongoDB connection for address:", address);

        // Database connection
        const client = await clientPromise;
        const db = client.db('Forgenix');
        const collection = db.collection('users');

        // Search for user
        let user = await collection.findOne({ address: address });

        // Create if does not exist
        if (!user) {
            console.log("New user! Creating profile...");
            const defaultAvatars = [
                "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Alpha",
                "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Beta",
                "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Gamma",
                "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Delta"
            ];
            
            // Randomly select one of the 4 avatars
            const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

            const newUser = {
                address: address,
                username: `Forger_${address.substring(2, 6).toUpperCase()}`,
                role: "Creator",
                domain: "", 
                avatar: randomAvatar, 
                joinedAt: new Date().toISOString()
            };
            
            await collection.insertOne(newUser);
            user = newUser as any;
            console.log("Profile created successfully:", newUser.username);
        } else {
            console.log("Existing user found:", user.username);
        }

        return NextResponse.json(user, { status: 200 });

    } catch (error) {
        console.error("❌ MONGODB API CRASH (POST):", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT: Update MongoDB user profile details
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { address, username, avatar } = body;

        if (!address) {
            return NextResponse.json({ error: "Address is required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('Forgenix');
        const collection = db.collection('users');

        // Prepare data to update
        const updateDoc: any = {};
        if (username) updateDoc.username = username;
        if (avatar) updateDoc.avatar = avatar;

        // Update user in MongoDB
        await collection.updateOne(
            { address: address },
            { $set: updateDoc }
        );

        // Fetch and return the updated profile
        const updatedUser = await collection.findOne({ address: address });
        return NextResponse.json(updatedUser, { status: 200 });

    } catch (error) {
        console.error("❌ MONGODB API CRASH (PUT):", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH: Deduct 1 credit in Prisma (PostgreSQL)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
    }

    const normalizedAddress = walletAddress.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress }
    });

    if (!user || user.credits <= 0) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 400 });
    }

    // Deduct 1 credit securely using Prisma's atomic decrement
    const updatedUser = await prisma.user.update({
      where: { walletAddress: normalizedAddress },
      data: {
        credits: { decrement: 1 }
      }
    });

    return NextResponse.json({ success: true, credits: updatedUser.credits }, { status: 200 });
  } catch (error) {
    console.error("Credit deduction error (PATCH):", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}