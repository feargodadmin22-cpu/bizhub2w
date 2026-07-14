"use server";

import { withShopScope } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { assertOwner } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";

/**
 * Section 3.2 — money records are never edited in place. This marks the
 * old Expense is_active=false and creates a fresh corrected row, so the
 * original always remains in the database for audit purposes.
 */
export async function correctExpense(
  originalExpenseId: string,
  corrected: { category: string; amount: number; note?: string }
) {
  const session = await getServerSession();
  assertOwner(session);

  if (!corrected.category.trim()) throw new Error("Category is required");
  if (!corrected.amount || corrected.amount <= 0) throw new Error("Enter a valid amount");

  const result = await withShopScope(session.shopId, session.role, async (db) => {
    const original = await db.expense.findFirstOrThrow({
      where: { id: originalExpenseId, shopId: session.shopId },
    });

    await db.expense.update({ where: { id: original.id }, data: { isActive: false } });

    const replacement = await db.expense.create({
      data: {
        shopId: session.shopId,
        branchId: original.branchId,
        category: corrected.category.trim(),
        amount: corrected.amount,
        note: corrected.note?.trim() || null,
        recordedBy: session.id,
      },
    });

    await logActivity(db as any, {
      shopId: session.shopId,
      userId: session.id,
      actionType: "expense.corrected",
      description: `Corrected expense ${original.id} → new entry ${replacement.id} (₦${corrected.amount.toLocaleString()})`,
    });

    return { id: replacement.id };
  });

  revalidatePath("/expenses/history");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return result;
}

export async function voidExpense(expenseId: string, reason: string) {
  const session = await getServerSession();
  assertOwner(session);

  const result = await withShopScope(session.shopId, session.role, async (db) => {
    const expense = await db.expense.findFirstOrThrow({
      where: { id: expenseId, shopId: session.shopId },
    });

    await db.expense.update({ where: { id: expense.id }, data: { isActive: false } });

    await logActivity(db as any, {
      shopId: session.shopId,
      userId: session.id,
      actionType: "expense.voided",
      description: `Voided expense ${expense.id} (${expense.category}, ₦${Number(expense.amount).toLocaleString()}) — ${reason || "no reason given"}`,
    });

    return { success: true };
  });

  revalidatePath("/expenses/history");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return result;
}