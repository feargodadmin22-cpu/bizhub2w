import { withShopScope } from "@/lib/prisma";
import { SessionUser, assertOwner } from "@/lib/permissions";

export async function getExpenseHistory(session: SessionUser) {
  assertOwner(session);

  return withShopScope(session.shopId, session.role, async (db) => {
    const expenses = await db.expense.findMany({
      where: { shopId: session.shopId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return expenses.map((e) => ({
      id: e.id,
      category: e.category,
      amount: Number(e.amount),
      note: e.note,
      isActive: e.isActive,
      createdAt: e.createdAt.toISOString(),
    }));
  });
}