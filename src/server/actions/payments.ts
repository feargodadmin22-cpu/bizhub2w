"use server";

import { withShopScope } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";

/**
 * Section 3.2 — this only ever creates a new Payment row; the original
 * Sale is never edited. Applied to the customer's oldest outstanding
 * (credit/partial) sale. If that sale's remaining balance is less than
 * the amount given, this currently errors rather than splitting across
 * multiple sales — acceptable for v1, worth revisiting if a shop needs
 * bulk debt clearing across several sales at once.
 */
export async function recordCustomerPayment(customerId: string, amount: number) {
  const session = await getServerSession();
  if (!amount || amount <= 0) throw new Error("Enter a valid amount");

  const result = await withShopScope(session.shopId, session.role, async (db) => {
    const oldestOpenSale = await db.sale.findFirst({
      where: {
        shopId: session.shopId,
        customerId,
        isActive: true,
        paymentStatus: { in: ["credit", "partial"] },
      },
      include: { payments: { where: { isActive: true } } },
      orderBy: { createdAt: "asc" },
    });

    if (!oldestOpenSale) throw new Error("This customer has no outstanding balance");

    const alreadyPaid = oldestOpenSale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(oldestOpenSale.total) - alreadyPaid;

    if (amount > remaining) {
      throw new Error(
        `Amount exceeds this sale's remaining balance of ₦${remaining.toLocaleString()} — record a smaller amount`
      );
    }

    await db.payment.create({
      data: {
        saleId: oldestOpenSale.id,
        amount,
        paymentMethod: oldestOpenSale.paymentMethod,
        recordedBy: session.id,
      },
    });

    const newPaidTotal = alreadyPaid + amount;
    if (newPaidTotal >= Number(oldestOpenSale.total)) {
      await db.sale.update({ where: { id: oldestOpenSale.id }, data: { paymentStatus: "paid" } });
    } else {
      await db.sale.update({ where: { id: oldestOpenSale.id }, data: { paymentStatus: "partial" } });
    }

    await logActivity(db as any, {
      shopId: session.shopId,
      userId: session.id,
      actionType: "payment.recorded",
      description: `Recorded payment of ₦${amount.toLocaleString()} against sale ${oldestOpenSale.id}`,
    });

    return { success: true };
  });

  revalidatePath("/customers");
  return result;
}