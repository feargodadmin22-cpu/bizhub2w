"use server";

import { withShopScope } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { getCurrentQuantities } from "@/lib/stock";

export async function searchProducts(query: string) {
  const session = await getServerSession();
  if (!query.trim()) return [];

  return withShopScope(session.shopId, session.role, async (db) => {
    const products = await db.product.findMany({
      where: {
        shopId: session.shopId,
        isActive: true,
        name: { contains: query, mode: "insensitive" },
      },
      take: 10,
    });

    const quantities = await getCurrentQuantities(db as any, products.map((p) => p.id));

    // Plain objects only — Decimal fields must be converted before this
    // crosses back to the Client Component that calls this action.
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      sellingPrice: Number(p.sellingPrice),
      quantity: quantities[p.id] ?? 0,
    }));
  });
}