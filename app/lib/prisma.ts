import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// 1. On force le passage à travers le pare-feu (WebSockets)
neonConfig.webSocketConstructor = ws;

// 2. LE LIEN EN DUR : Collez votre vrai lien Neon ici entre les guillemets
const NEON_URL = "NEON_URL";

// 3. Gestion propre du cache pour éviter que Next.js ne plante
const globalForPrisma = global as unknown as { prisma: PrismaClient };

if (!globalForPrisma.prisma) {
  const pool = new Pool({ connectionString: NEON_URL });
  const adapter = new PrismaNeon(pool as any);
  globalForPrisma.prisma = new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma;