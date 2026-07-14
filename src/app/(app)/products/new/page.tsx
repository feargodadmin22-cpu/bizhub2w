import { requireSession } from "@/lib/auth";
import { getShopCategoriesAndUnits } from "@/lib/queries/categories-units";
import { AddProductForm } from "@/components/AddProductForm";

export default async function AddProductPage() {
  const session = await requireSession();
  const { categories, units } = await getShopCategoriesAndUnits(session);

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-forest text-cream p-3">
        <h1 className="font-semibold text-lg">Add Product</h1>
      </nav>

      <main className="p-3 max-w-lg mx-auto">
        <AddProductForm existingCategories={categories} existingUnits={units} />
      </main>
    </div>
  );
}