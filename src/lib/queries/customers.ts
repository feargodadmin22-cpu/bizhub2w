import { withShopScope } from "@/lib/prisma";
import { SessionUser } from "@/lib/permissions";

export async function getCustomersWithBalances(session: SessionUser) {
  return withShopScope(session.shopId, session.role, async (db) => {
    const customers = await db.customer.findMany({
      where: { shopId: session.shopId },
      include: {
        sales: {
          where: { isActive: true, paymentStatus: { in: ["credit", "partial"] } },
          include: { payments: { where: { isActive: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return customers.map((c) => {
      const outstandingBalance = c.sales.reduce((sum, sale) => {
        const paid = sale.payments.reduce((psum, p) => psum + Number(p.amount), 0);
        return sum + Math.max(Number(sale.total) - paid, 0);
      }, 0);

      const lastSale = c.sales[c.sales.length - 1];

      return {
        id: c.id,
        name: c.name,
        phone: c.phone ?? "",
        outstandingBalance,
        lastSaleDate: lastSale ? lastSale.createdAt.toISOString().slice(0, 10) : null,
      };
    });
  });
}