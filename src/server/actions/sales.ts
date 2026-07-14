"use server";

import { withShopScope } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { assertActive } from "@/lib/permissions";
import { assertStockWontGoNegative } from "@/lib/stock";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";

type SaleItemInput = {
  productId: string;
  quantity: number;
};

type RecordSaleInput = {
  customerId?: string;
  items: SaleItemInput[];
  discount: number;
  paymentMethod: "cash" | "transfer" | "pos_card" | "credit";
  amountPaidNow: number;
};

/**
 * Records a sale. Section 2.4 — Sale + SaleItem[] + StockMovement[] +
 * Payment? all happen inside one transaction (withShopScope gives us
 * that transaction). Section 2.7 — product price is re-fetched from the
 * DB here, never trusted from the client's cart state.
 */
export async function findOrCreateCustomer(name: string, phone: string) {
  const session = await getServerSession();
  return withShopScope(session.shopId, session.role, async (db) => {
    const existing = await db.customer.findFirst({ where: { shopId: session.shopId, phone } });
    if (existing) return { id: existing.id, name: existing.name };
    const customer = await db.customer.create({ data: { shopId: session.shopId, name, phone } });
    return { id: customer.id, name: customer.name };
  });
}


export async function recordSale(input: RecordSaleInput) {
  const session = await getServerSession();
  assertActive(session);

  if (input.items.length === 0) {
    throw new Error("Sale must have at least one item");
  }

  const result = await withShopScope(session.shopId, session.role, async (db) => {
    const branch = await db.branch.findFirstOrThrow({ where: { shopId: session.shopId } });

    const productIds = input.items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, shopId: session.shopId, isActive: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    if (products.length !== new Set(productIds).size) {
      throw new Error("One or more products not found or inactive");
    }

    let subtotal = 0;
    const saleItemsData = input.items.map((item) => {
      const product = productMap.get(item.productId)!;
      subtotal += Number(product.sellingPrice) * item.quantity;
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
      input.amountPaidNow >= total ? "paid" : input.amountPaidNow > 0 ? "partial" : "credit";

    for (const item of input.items) {
      await assertStockWontGoNegative(db as any, item.productId, -item.quantity);
    }

    const sale = await db.sale.create({
      data: {
        shopId: session.shopId,
        branchId: branch.id,
        customerId: input.customerId,
        soldBy: session.id,
        subtotal,
        discount: input.discount,
        total,
        paymentStatus,
        paymentMethod: input.paymentMethod,
        items: { create: saleItemsData },
      },
    });

    await db.stockMovement.createMany({
      data: input.items.map((item) => ({
        productId: item.productId,
        type: "sale" as const,
        quantityChange: -item.quantity,
        note: `Sale ${sale.id}`,
        performedBy: session.id,
      })),
    });

    if (input.amountPaidNow > 0) {
      await db.payment.create({
        data: {
          saleId: sale.id,
          amount: input.amountPaidNow,
          paymentMethod: input.paymentMethod,
          recordedBy: session.id,
        },
      });
    }

    await logActivity(db as any, {
      shopId: session.shopId,
      userId: session.id,
      actionType: "sale.created",
      description: `Recorded sale ${sale.id} — total ₦${total.toLocaleString()}`,
    });

    // Plain values only — this crosses back to the Client Component.
    return { id: sale.id, total };
  });

  revalidatePath("/stock");
  revalidatePath("/dashboard");
  return result;
}