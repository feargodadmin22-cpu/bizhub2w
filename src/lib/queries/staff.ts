import { withShopScope } from "@/lib/prisma";
import { SessionUser, assertOwner } from "@/lib/permissions";

export async function getStaffList(session: SessionUser) {
  assertOwner(session);

  return withShopScope(session.shopId, session.role, async (db) => {
    const staff = await db.user.findMany({
      where: { shopId: session.shopId },
      orderBy: { createdAt: "asc" },
    });

    return staff.map((s) => ({
      id: s.id,
      name: s.name,
      contact: s.contact,
      role: s.role,
      canSeeCostAndProfit: s.canSeeCostAndProfit,
      status: s.status,
    }));
  });
}