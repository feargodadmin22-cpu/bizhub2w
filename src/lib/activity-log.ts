import { Prisma, PrismaClient } from "@prisma/client";

type LogInput = { shopId: string; userId: string; actionType: string; description: string };

export async function logActivity(db: PrismaClient | Prisma.TransactionClient, input: LogInput) {
  await db.activityLog.create({ data: input });
}