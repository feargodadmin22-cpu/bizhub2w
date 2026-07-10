"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { assertActive } from "@/lib/permissions";
import { assertStockWontGoNegative } from "@/lib/stock";
import { logActivity } from "@/lib/activity-log";
import { PaymentMethod } from "@prisma/client";

type SaleItemInput = {
  productId: string;
  quantity: number;
  // NOTE: client may send a price for display purposes only.
  // It is NEVER trusted (Section 2.7) — see re-fetch below.
};

type RecordSaleInput = {
  branchId: string;
  customerId?: string;
  items: SaleItemInput[];
  discount: number;
  paymentMethod: PaymentMethod;
  amountPaidNow: number; // 0 for full credit
};

/**
 * Records a sale. Every write (Sale, SaleItem[], StockMovement[], Payment?)
 * happens inside one prisma.$transaction — Section 2.4. If any line would
 * take stock negative, the whole transaction aborts: no partial writes.
 *
 * Section 2.7 — product price is re-fetched from the DB inside the
 * transaction. The client-submitted price is never trusted or used.
 */
export async function recordSale(input: RecordSaleInput) {
  const session = await getServerSession();
  assertActive(session);

  if (input.items.length === 0) {
    throw new Error("Sale must have at least one item");
  }

  return prisma.$transaction(async (tx) => {
    // Re-fetch authoritative product data — never trust client price/qty.
    const productIds = input.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, shopId: session.shopId, isActive: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    if (products.length !== new Set(productIds).size) {
      throw new Error("One or more products not found or inactive");
    }

    let subtotal = 0;
    const saleItemsData = input.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const lineTotal = Number(product.sellingPrice) * item.quantity;
      subtotal += lineTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPriceAtSale: product.sellingPrice,
        costPriceAtSale: product.costPrice,
      };
    });

    const total = subtotal - input.discount;
    if (total < 0) throw new Error("Discount cannot exceed subtotal");

    const paymentStatus =
      input.amountPaidNow >= total
        ? "paid"
        : input.amountPaidNow > 0
        ? "partial"
        : "credit";

    // Stock guard for every line BEFORE any write — Section 2.4.
    for (const item of input.items) {
      await assertStockWontGoNegative(tx, item.productId, -item.quantity);
    }

    const sale = await tx.sale.create({
      data: {
        shopId: session.shopId,
        branchId: input.branchId,
        customerId: input.customerId,
        soldBy: session.id,
        subtotal,
        discount: input.discount,
        total,
        paymentStatus,
        paymentMethod: input.paymentMethod,
        items: { create: saleItemsData },
      },
      include: { items: true },
    });

    // Stock movement per line, inside the same transaction — Section 6.
    await tx.stockMovement.createMany({
      data: input.items.map((item) => ({
        productId: item.productId,
        type: "sale" as const,
        quantityChange: -item.quantity,
        note: `Sale ${sale.id}`,
        performedBy: session.id,
      })),
    });

    if (input.amountPaidNow > 0) {
      await tx.payment.create({
        data: {
          saleId: sale.id,
          amount: input.amountPaidNow,
          paymentMethod: input.paymentMethod,
          recordedBy: session.id,
        },
      });
    }

    await logActivity(tx, {
      shopId: session.shopId,
      userId: session.id,
      actionType: "sale.created",
      description: `Recorded sale ${sale.id} — total ₦${total.toLocaleString()}`,
    });

    return sale;
  });
}
