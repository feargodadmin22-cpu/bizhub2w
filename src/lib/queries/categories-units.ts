import { withShopScope } from "@/lib/prisma";
import { SessionUser } from "@/lib/permissions";

export async function getShopCategoriesAndUnits(session: SessionUser) {
  return withShopScope(session.shopId, session.role, async (db) => {
    const [categories, units] = await Promise.all([
      db.category.findMany({ where: { shopId: session.shopId }, orderBy: { name: "asc" } }),
      db.unit.findMany({ where: { shopId: session.shopId }, orderBy: { name: "asc" } }),
    ]);
    return {
      categories: categories.map((c) => c.name),
      units: units.map((u) => u.name),
    };
  });
}