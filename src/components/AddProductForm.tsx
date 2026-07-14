"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/server/actions/products";

type ProductForm = {
  name: string;
  category: string;
  unit: string;
  costPrice: string;
  sellingPrice: string;
  openingStock: string;
  lowStockThreshold: string;
};

export function AddProductForm({
  existingCategories,
  existingUnits,
}: {
  existingCategories: string[];
  existingUnits: string[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>({
    name: "",
    category: "",
    unit: existingUnits[0] ?? "Piece",
    costPrice: "",
    sellingPrice: "",
    openingStock: "",
    lowStockThreshold: "",
  });
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
    if (!form.category.trim()) return setError("Category is required — type a new one or pick an existing one");
    if (cost < 0 || selling < 0) return setError("Prices cannot be negative");
    if (selling < cost) return setError("Selling price is below cost price — check this is intentional");
    if (opening < 0) return setError("Opening stock cannot be negative");

    setLoading(true);
    try {
      await createProduct({
        name: form.name,
        categoryName: form.category.trim(),
        unitName: form.unit,
        costPrice: cost,
        sellingPrice: selling,
        openingStock: opening,
        lowStockThreshold: threshold,
      });
      router.push("/stock");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded p-3 space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-charcoal">Product name</span>
        <input
          required
          className="input mt-1"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-charcoal">Category</span>
          <input
            required
            list="category-options"
            className="input mt-1"
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            placeholder="e.g. 777 Rice, 54 iches SolarPanel..."
          />
          <datalist id="category-options">
            {existingCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          
        </label>
        <label className="block">
          <span className="text-sm font-medium text-charcoal">Unit</span>
          <input
            required
            list="unit-options"
            className="input mt-1"
            value={form.unit}
            onChange={(e) => update("unit", e.target.value)}
          />
          <datalist id="unit-options">
            {existingUnits.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-charcoal">Cost price (₦)</span>
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
          <span className="text-sm font-medium text-charcoal">Selling price (₦)</span>
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
          <span className="text-sm font-medium text-charcoal">Opening stock</span>
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
          <span className="text-sm font-medium text-charcoal">Low-stock threshold</span>
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

      {error && <p className="text-sm text-red-700 bg-red-50 p-3 rounded">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gold text-charcoal font-semibold p-3 rounded disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save Product"}
      </button>

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
    </form>
  );
}