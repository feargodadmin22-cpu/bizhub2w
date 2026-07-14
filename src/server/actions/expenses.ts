"use server";

import { withShopScope } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { assertOwner } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";

type AddExpenseInput = {
  category: string;
  amount: number;
  note?: string;
};

/**
 * Section 2.5 — addExpense is Owner-only. assertOwner() runs first,
 * before any other work, so a non-owner never gets partial execution.
 * Section 3.2 — this is always an INSERT; expenses are never edited in
 * place, only corrected via a new row (that correction flow isn't built
 * yet, but the schema/model already supports it via is_active).
 */
export async function addExpense(input: AddExpenseInput) {
  const session = await getServerSession();
  assertOwner(session);

  if (!input.category.trim()) throw new Error("Category is required");
  if (!input.amount || input.amount <= 0) throw new Error("Enter a valid amount");

  const result = await withShopScope(session.shopId, session.role, async (db) => {
    const branch = await db.branch.findFirstOrThrow({ where: { shopId: session.shopId } });

    const expense = await db.expense.create({
      data: {
        shopId: session.shopId,
        branchId: branch.id,
        category: input.category.trim(),
        amount: input.amount,
        note: input.note?.trim() || null,
        recordedBy: session.id,
      },
    });

    await logActivity(db as any, {
      shopId: session.shopId,
      userId: session.id,
      actionType: "expense.created",
      description: `Added expense — ${expense.category} ₦${input.amount.toLocaleString()}`,
    });

    return { id: expense.id, category: expense.category, amount: Number(expense.amount) };
  });

  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return result;
}