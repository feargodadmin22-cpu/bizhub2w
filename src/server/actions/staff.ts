"use server";

import { withShopScope } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { assertOwner } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";

/** Section 2.5/8 — manageStaff is Owner-only, enforced server-side. */
export async function toggleCostVisibility(staffUserId: string) {
  const session = await getServerSession();
  assertOwner(session);

  const result = await withShopScope(session.shopId, session.role, async (db) => {
    const target = await db.user.findFirstOrThrow({
      where: { id: staffUserId, shopId: session.shopId },
    });

    const updated = await db.user.update({
      where: { id: staffUserId },
      data: { canSeeCostAndProfit: !target.canSeeCostAndProfit },
    });

    await logActivity(db as any, {
      shopId: session.shopId,
      userId: session.id,
      actionType: "staff.permission_changed",
      description: `${updated.canSeeCostAndProfit ? "Granted" : "Revoked"} cost/profit visibility for ${updated.name}`,
    });

    return { canSeeCostAndProfit: updated.canSeeCostAndProfit };
  });

  revalidatePath("/staff");
  return result;
}

export async function toggleStaffStatus(staffUserId: string) {
  const session = await getServerSession();
  assertOwner(session);

  const result = await withShopScope(session.shopId, session.role, async (db) => {
    const target = await db.user.findFirstOrThrow({
      where: { id: staffUserId, shopId: session.shopId },
    });

    const newStatus = target.status === "active" ? "disabled" : "active";
    const updated = await db.user.update({
      where: { id: staffUserId },
      data: { status: newStatus },
    });

    await logActivity(db as any, {
      shopId: session.shopId,
      userId: session.id,
      actionType: "staff.status_changed",
      description: `${updated.name} was ${newStatus === "disabled" ? "disabled" : "re-enabled"}`,
    });

    return { status: updated.status };
  });

  revalidatePath("/staff");
  return result;
}