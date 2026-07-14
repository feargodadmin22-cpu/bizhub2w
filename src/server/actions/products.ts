"use server";

import { withShopScope } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { assertManagerOrOwner } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

type CreateProductInput = {
  name: string;
  categoryName: string;
  unitName: string;
  costPrice: number;
  sellingPrice: number;
  openingStock: number;
  lowStockThreshold: number;
};

export async function createProduct(input: CreateProductInput) {
  const session = await getServerSession();
  assertManagerOrOwner(session);

  if (!input.name.trim()) throw new Error("Product name is required");
  if (input.costPrice < 0 || input.sellingPrice < 0)
    throw new Error("Prices cannot be negative");
  if (input.openingStock < 0)
    throw new Error("Opening stock cannot be negative");

  const result = await withShopScope(
    session.shopId,
    session.role,
    async (db) => {
      // Section 6: exactly one Branch per shop in v1 — find it rather than
      // asking the form for a branch (branches aren't exposed in v1 UI).
      const branch = await db.branch.findFirstOrThrow({
        where: { shopId: session.shopId },
      });

      // Category has no unique constraint on (shopId, name) in the schema,
      // so this is a manual find-or-create rather than a Prisma upsert.
      let category = await db.category.findFirst({
        where: { shopId: session.shopId, name: input.categoryName },
      });
      if (!category) {
        category = await db.category.create({
          data: { shopId: session.shopId, name: input.categoryName },
        });
      }
      const unit = await db.unit.findFirst({
        where: { shopId: session.shopId, name: input.unitName },
      });
      if (!unit)
        throw new Error(
          `Unit "${input.unitName}" not found — seed units on signup should include this`,
        );

      // Section 2.4/5.1 — Product create + opening StockMovement in the
      // same transaction (withShopScope already gives us one). Stock is
      // never a stored column; opening stock is just the first movement.
      const product = await db.product.create({
        data: {
          shopId: session.shopId,
          branchId: branch.id,
          name: input.name,
          categoryId: category.id,
          unitId: unit.id,
          costPrice: input.costPrice,
          sellingPrice: input.sellingPrice,
          lowStockThreshold: input.lowStockThreshold,
          createdBy: session.id,
        },
      });

      if (input.openingStock > 0) {
        await db.stockMovement.create({
          data: {
            productId: product.id,
            type: "restock",
            quantityChange: input.openingStock,
            note: "Opening stock",
            performedBy: session.id,
          },
        });
      }

      await logActivity(db as any, {
        shopId: session.shopId,
        userId: session.id,
        actionType: "product.created",
        description: `Added product "${product.name}"`,
      });

      return {
        id: product.id,
        name: product.name,
      };
    },
  );

  revalidatePath("/stock");
  return result;
}
