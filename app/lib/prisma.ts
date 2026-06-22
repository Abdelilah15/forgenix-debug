import 'dotenv/config'; 
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
// 👈 Remarquez que nous avons supprimé 'Pool', 'neonConfig' et 'ws'. Prisma v7 gère cela tout seul maintenant !

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? (() => {
  const rawUrl = process.env.DATABASE_URL || "";
  const dbUrl = rawUrl.replace(/^["']|["']$/g, '').trim();
  
  if (!dbUrl || !dbUrl.startsWith("postgres")) {
    throw new Error(`🚨 CRITIQUE : L'URL de la base de données est invalide. Reçu : ${rawUrl}`);
  }

  // PRISMA V7 FIX : On passe la connectionString directement à l'adaptateur
  // Cela empêche le bug du retour à "localhost"
  const adapter = new PrismaNeon({ connectionString: dbUrl }); 
  
  return new PrismaClient({ adapter });
})();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}