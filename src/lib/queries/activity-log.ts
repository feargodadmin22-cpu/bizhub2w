import { withShopScope } from "@/lib/prisma";
import { SessionUser, assertOwner } from "@/lib/permissions";

/**
 * Section 5.3 — ActivityLog is append-only; this is a pure read. Every
 * sale, expense, product, and staff action across the app has been
 * writing here via logActivity() since we connected each screen, so
 * this should show real history by now if you've tested anything.
 */
export async function getActivityLog(session: SessionUser) {
  assertOwner(session);

  return withShopScope(session.shopId, session.role, async (db) => {
    const entries = await db.activityLog.findMany({
      where: { shopId: session.shopId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return entries.map((e) => ({
      id: e.id,
      userName: e.user.name,
      actionType: e.actionType,
      description: e.description,
      createdAt: e.createdAt.toISOString(),
    }));
  });
}