import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaAdmin?: PrismaClient;
};

const adapter = new PrismaPg({ connectionString: process.env.RUNTIME_DATABASE_URL });
export const rawPrisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

const adminAdapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const adminPrisma = globalForPrisma.prismaAdmin ?? new PrismaClient({ adapter: adminAdapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = rawPrisma;
  globalForPrisma.prismaAdmin = adminPrisma;
}

/**
 * Section 2.1 — RLS via Postgres session variables, one transaction per
 * request rather than one per query. Opening a separate transaction for
 * every individual query (the old approach) meant a page loading three
 * things at once opened three simultaneous transactions and starved
 * Neon's pooled connection — this fixes that by running the whole
 * request's queries inside a single transaction, set up once.
 */

export async function withShopScope<T>(
  shopId: string,
  role: string,
  callback: (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>
): Promise<T> {
  return rawPrisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.shop_id', ${shopId}, true), set_config('app.role', ${role}, true)`;
      return callback(tx);
    },
    { maxWait: 30000, timeout: 30000 }
  );
}