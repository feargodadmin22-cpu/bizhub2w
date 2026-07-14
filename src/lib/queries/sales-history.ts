import { withShopScope } from "@/lib/prisma";
import { SessionUser, assertManagerOrOwner } from "@/lib/permissions";

export async function getRecentSales(session: SessionUser) {
  assertManagerOrOwner(session);

  return withShopScope(session.shopId, session.role, async (db) => {
    const sales = await db.sale.findMany({
      where: { shopId: session.shopId, isActive: true },
      include: {
        items: { include: { product: { select: { name: true } }, returnedAgainst: true } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return sales.map((s) => ({
      id: s.id,
      customerName: s.customer?.name ?? "Walk-in",
      total: Number(s.total),
      paymentStatus: s.paymentStatus,
      createdAt: s.createdAt.toISOString(),
      items: s.items.map((i) => {
        const alreadyReturned = i.returnedAgainst.reduce((sum, r) => sum + r.quantityReturned, 0);
        return {
          id: i.id,
          productName: i.product.name,
          quantity: i.quantity,
          unitPrice: Number(i.unitPriceAtSale),
          returnableQuantity: i.quantity - alreadyReturned,
        };
      }),
    }));
  });
}