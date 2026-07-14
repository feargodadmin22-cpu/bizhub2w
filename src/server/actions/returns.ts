"use server";

import { withShopScope } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { assertManagerOrOwner } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";

type ReturnItemInput = { saleItemId: string; quantity: number };

/**
 * Section 6 — returns restore stock via a NEW StockMovement (type
 * "return"), never by editing the original Sale or SaleItem. Section
 * 3.2 — same append-only rule as everything else touching money/stock.
 */
export async function processReturn(saleId: string, items: ReturnItemInput[], reason: string) {
  const session = await getServerSession();
  assertManagerOrOwner(session);

  if (items.length === 0) throw new Error("Select at least one item to return");

  const result = await withShopScope(session.shopId, session.role, async (db) => {
    const sale = await db.sale.findFirstOrThrow({
      where: { id: saleId, shopId: session.shopId },
      include: { items: { include: { returnedAgainst: true } } },
    });

    let totalRefunded = 0;
    for (const item of items) {
      const saleItem = sale.items.find((si) => si.id === item.saleItemId);
      if (!saleItem) throw new Error("Sale item not found on this sale");

      const alreadyReturned = saleItem.returnedAgainst.reduce((sum, r) => sum + r.quantityReturned, 0);
      const returnable = saleItem.quantity - alreadyReturned;
      if (item.quantity > returnable) {
        throw new Error(`Cannot return ${item.quantity} — only ${returnable} returnable on this item`);
      }
      if (item.quantity <= 0) throw new Error("Return quantity must be positive");

      totalRefunded += Number(saleItem.unitPriceAtSale) * item.quantity;
    }

    const saleReturn = await db.saleReturn.create({
      data: {
        originalSaleId: sale.id,
        returnedBy: session.id,
        reason: reason.trim() || null,
        totalRefunded,
        items: {
          create: items.map((item) => ({
            saleItemId: item.saleItemId,
            quantityReturned: item.quantity,
          })),
        },
      },
    });

    // Section 6 — restock via a new StockMovement, type "return".
    for (const item of items) {
      const saleItem = sale.items.find((si) => si.id === item.saleItemId)!;
      await db.stockMovement.create({
        data: {
          productId: saleItem.productId,
          type: "return",
          quantityChange: item.quantity,
          note: `Return against sale ${sale.id}`,
          performedBy: session.id,
        },
      });
    }

    await logActivity(db as any, {
      shopId: session.shopId,
      userId: session.id,
      actionType: "sale.returned",
      description: `Processed return on sale ${sale.id} — ₦${totalRefunded.toLocaleString()} refunded`,
    });

    return { id: saleReturn.id, totalRefunded };
  });

  revalidatePath("/sales/history");
  revalidatePath("/stock");
  return result;
}