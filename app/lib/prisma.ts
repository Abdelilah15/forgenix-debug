import { PrismaClient } from '@prisma/client';
import { PrismaNeonHttp } from '@prisma/adapter-neon';  // ← HTTP, pas WebSocket

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL ?? '';
  const dbUrl = rawUrl.replace(/^["']|["']$/g, '').trim();

  if (!dbUrl || !dbUrl.startsWith('postgres')) {
    throw new Error(
      `[Prisma] DATABASE_URL invalide. Reçu : "${rawUrl}". Vérifiez votre .env.local`
    );
  }

  const adapter = new PrismaNeonHttp(dbUrl, {});
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
