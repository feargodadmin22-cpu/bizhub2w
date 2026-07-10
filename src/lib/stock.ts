import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Section 5.1 — current_quantity is always SUM(StockMovement.quantity_change).
 * Never add a stored "quantity" column to Product. Every screen that shows
 * stock must call this (or getCurrentQuantities for a batch) rather than
 * reading a cached number.
 */
export async function getCurrentQuantity(
  db: PrismaClient | Prisma.TransactionClient,
  productId: string
): Promise<number> {
  const result = await db.stockMovement.aggregate({
    where: { productId },
    _sum: { quantityChange: true },
  });
  return result._sum.quantityChange ?? 0;
}

export async function getCurrentQuantities(
  db: PrismaClient | Prisma.TransactionClient,
  productIds: string[]
): Promise<Record<string, number>> {
  if (productIds.length === 0) return {};
  const rows = await db.stockMovement.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds } },
    _sum: { quantityChange: true },
  });
  const out: Record<string, number> = Object.fromEntries(
    productIds.map((id) => [id, 0])
  );
  for (const r of rows) out[r.productId] = r._sum.quantityChange ?? 0;
  return out;
}

/**
 * Throws if applying `change` to `productId` would push stock below zero.
 * Must be called INSIDE the same transaction that writes the movement
 * (Section 2.4) so the check and the write are atomic — otherwise a
 * concurrent sale could race past this check.
 */
export async function assertStockWontGoNegative(
  tx: Prisma.TransactionClient,
  productId: string,
  change: number
) {
  if (change >= 0) return;
  const current = await getCurrentQuantity(tx, productId);
  if (current + change < 0) {
    throw new Error(
      `Insufficient stock for product ${productId}: have ${current}, need ${-change}`
    );
  }
}
