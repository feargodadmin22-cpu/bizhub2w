import { withShopScope } from "@/lib/prisma";
import { getCurrentQuantities } from "@/lib/stock";
import { SessionUser } from "@/lib/permissions";

// Section 8 permission table: viewing stock and selling price is allowed
// for every role, so this query never needs cost-field filtering — only
// screens touching cost_price/profit do (see queries/dashboard.ts).
export async function getStockList(session: SessionUser) {
  return withShopScope(session.shopId, session.role, async (db) => {
    const products = await db.product.findMany({
      where: { shopId: session.shopId, isActive: true },
      include: { category: true, unit: true },
      orderBy: { name: "asc" },
    });

    const quantities = await getCurrentQuantities(db as any, products.map((p) => p.id));

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category?.name ?? "Uncategorized",
      unit: p.unit.name,
      sellingPrice: Number(p.sellingPrice),
      quantity: quantities[p.id] ?? 0,
      lowStockThreshold: p.lowStockThreshold,
    }));
  });
}