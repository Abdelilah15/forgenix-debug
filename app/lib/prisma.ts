import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Traversée du pare-feu
neonConfig.webSocketConstructor = ws;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error("🚨 ALERTE ROUGE : DATABASE_URL est introuvable dans .env.local !");
    // On crée un client vide provisoire pour éviter de faire crasher tout le site
    prisma = new PrismaClient();
  } else {
    // Si l'URL est là, on se connecte normalement à Neon
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaNeon(pool as any);
    prisma = new PrismaClient({ adapter });
  }
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { prisma };