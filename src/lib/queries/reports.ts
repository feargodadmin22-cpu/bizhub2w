import { withShopScope } from "@/lib/prisma";
import { SessionUser, assertOwner } from "@/lib/permissions";

export async function getReportsData(session: SessionUser, startDate: string, endDate: string) {
  // Section 8 permission table — viewing reports is Owner-only.
  assertOwner(session);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return withShopScope(session.shopId, session.role, async (db) => {
    const [saleItems, expenses] = await Promise.all([
      db.saleItem.findMany({
        where: {
          sale: { shopId: session.shopId, isActive: true, createdAt: { gte: start, lte: end } },
        },
        include: { product: { select: { name: true } } },
      }),
      db.expense.findMany({
        where: { shopId: session.shopId, isActive: true, createdAt: { gte: start, lte: end } },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Section 6 — net profit is always computed, never stored.
    const totalSales = saleItems.reduce((sum, i) => sum + Number(i.unitPriceAtSale) * i.quantity, 0);
    const totalCOGS = saleItems.reduce((sum, i) => sum + Number(i.costPriceAtSale) * i.quantity, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const grossProfit = totalSales - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    const byProduct = new Map<string, number>();
    saleItems.forEach((i) => {
      byProduct.set(i.product.name, (byProduct.get(i.product.name) ?? 0) + i.quantity);
    });
    const sorted = [...byProduct.entries()].sort((a, b) => b[1] - a[1]);
    const topSellers = sorted.slice(0, 5);
    const slowMovers = [...sorted].reverse().slice(0, 5);

    return {
      totalSales,
      totalCOGS,
      totalExpenses,
      grossProfit,
      netProfit,
      topSellers,
      slowMovers,
      expenses: expenses.map((e) => ({
        date: e.createdAt.toISOString().slice(0, 10),
        category: e.category,
        amount: Number(e.amount),
      })),
    };
  });
}