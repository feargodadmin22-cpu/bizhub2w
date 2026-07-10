import { withShopScope } from "@/lib/prisma";
import { getCurrentQuantities } from "@/lib/stock";
import { filterCostFields, SessionUser } from "@/lib/permissions";

export async function getDashboardData(session: SessionUser) {
  return withShopScope(session.shopId, session.role, async (db) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todaySales, allProducts, sevenDayRaw] = await Promise.all([
      db.sale.findMany({
        where: { shopId: session.shopId, createdAt: { gte: todayStart }, isActive: true },
        include: { items: true },
      }),
      db.product.findMany({ where: { shopId: session.shopId, isActive: true } }),
      db.sale.findMany({
        where: {
          shopId: session.shopId,
          isActive: true,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        select: { total: true, createdAt: true },
      }),
    ]);

    const todayTotalSales = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
    const todayProfit = todaySales.reduce(
      (sum, s) =>
        sum +
        s.items.reduce(
          (isum, i) => isum + (Number(i.unitPriceAtSale) - Number(i.costPriceAtSale)) * i.quantity,
          0
        ),
      0
    );
    const todayItemsSold = todaySales.reduce(
      (sum, s) => sum + s.items.reduce((isum, i) => isum + i.quantity, 0),
      0
    );

    const quantities = await getCurrentQuantities(db as any, allProducts.map((p) => p.id));
    const lowStock = allProducts
      .filter((p) => (quantities[p.id] ?? 0) <= p.lowStockThreshold)
      .map((p) => ({ id: p.id, name: p.name, quantity: quantities[p.id] ?? 0, threshold: p.lowStockThreshold }));

    const byDay = new Map<string, number>();
    sevenDayRaw.forEach((s) => {
      const day = s.createdAt.toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + Number(s.total));
    });
    const sevenDayTrend = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total }));

    return filterCostFields(
      { today: { sales: todayTotalSales, profit: todayProfit, itemsSold: todayItemsSold }, lowStock, sevenDayTrend },
      session
    ) as any;
  });
}