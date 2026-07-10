"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// TEMPORARY MOCK DATA — categories and units will come from the shop's
// own Category/Unit tables once connected. Units below match the seeded
// defaults from Section 6 (Piece, Carton, Bag, Kg, Litre, Dozen, Pack).
const mockCategories = ["Accessories", "Audio", "Phones", "Chargers"];
const mockUnits = ["Piece", "Carton", "Bag", "Kg", "Litre", "Dozen", "Pack"];

type ProductForm = {
  name: string;
  category: string;
  unit: string;
  costPrice: string;
  sellingPrice: string;
  openingStock: string;
  lowStockThreshold: string;
};

const emptyForm: ProductForm = {
  name: "",
  category: mockCategories[0],
  unit: mockUnits[0],
  costPrice: "",
  sellingPrice: "",
  openingStock: "",
  lowStockThreshold: "",
};
export default function AddProductPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cost = Number(form.costPrice);
    const selling = Number(form.sellingPrice);
    const opening = Number(form.openingStock);
    const threshold = Number(form.lowStockThreshold);

    if (!form.name.trim()) return setError("Product name is required");
    if (cost < 0 || selling < 0) return setError("Prices cannot be negative");
    if (selling < cost)
      return setError(
        "Selling price is below cost price — check this is intentional",
      );
    if (opening < 0) return setError("Opening stock cannot be negative");

    setLoading(true);
    try {
      // TODO: replace with the real server action once the DB is connected —
      // createProduct(form) will create the Product row, then write an
      // opening StockMovement (type "restock") inside the same
      // transaction, per Section 5.1 (stock is never a stored column).
      console.log("Would create product:", {
        ...form,
        cost,
        selling,
        opening,
        threshold,
      });
      await new Promise((r) => setTimeout(r, 400));
      router.push("/stock");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save product");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-forest text-cream p-3">
        <h1 className="font-semibold text-lg">Add Product</h1>
      </nav>

      <main className="p-3 max-w-lg mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded p-3 space-y-3"
        >
          <label className="block">
            <span className="text-sm font-medium text-charcoal">
              Product name
            </span>
            <input
              required
              className="input mt-1"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-charcoal">
                Category
              </span>
              <select
                className="input mt-1"
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
              >
                {mockCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-charcoal">Unit</span>
              <select
                className="input mt-1"
                value={form.unit}
                onChange={(e) => update("unit", e.target.value)}
              >
                {mockUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-charcoal">
                Cost price (₦)
              </span>
              <input
                required
                type="number"
                min="0"
                className="input mt-1"
                value={form.costPrice}
                onChange={(e) => update("costPrice", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-charcoal">
                Selling price (₦)
              </span>
              <input
                required
                type="number"
                min="0"
                className="input mt-1"
                value={form.sellingPrice}
                onChange={(e) => update("sellingPrice", e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-charcoal">
                Opening stock
              </span>
              <input
                required
                type="number"
                min="0"
                className="input mt-1"
                value={form.openingStock}
                onChange={(e) => update("openingStock", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-charcoal">
                Low-stock threshold
              </span>
              <input
                required
                type="number"
                min="0"
                className="input mt-1"
                value={form.lowStockThreshold}
                onChange={(e) => update("lowStockThreshold", e.target.value)}
              />
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 p-3 rounded">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-charcoal font-semibold p-3 rounded disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Product"}
          </button>
        </form>
      </main>

      <style jsx global>{`
        .input {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: white;
          color: #1f1f1f;
        }
      `}</style>
    </div>
  );
}
