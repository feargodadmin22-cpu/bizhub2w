"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira } from "@/lib/format";
import { addExpense } from "@/server/actions/expenses";

// Common categories from Section 7's user story example (rent, transport,
// wages, etc.) — shops can also type a custom one.
const commonCategories = [
  "Rent",
  "Transport",
  "Wages",
  "Utilities",
  "Supplies",
  "Other",
];

export default function AddExpensePage() {
  const router = useRouter();
  const [category, setCategory] = useState(commonCategories[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const finalCategory = category === "Other" ? customCategory.trim() : category;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amt = Number(amount);
    if (!finalCategory) return setError("Category is required");
    if (!amt || amt <= 0) return setError("Enter a valid amount");

    setLoading(true);
    try {
      await addExpense({ category: finalCategory, amount: amt, note });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save expense");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-forest text-cream p-3">
        <h1 className="font-semibold text-lg">Add Expense</h1>
      </nav>

      <main className="p-3 max-w-lg mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded p-3 space-y-3"
        >
          <label className="block">
            <span className="text-sm font-medium text-charcoal">Category</span>
            <select
              className="input mt-1"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {commonCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          {category === "Other" && (
            <label className="block">
              <span className="text-sm font-medium text-charcoal">
                Custom category
              </span>
              <input
                className="input mt-1"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Generator fuel"
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-medium text-charcoal">
              Amount (₦)
            </span>
            <input
              required
              type="number"
              min="0"
              className="input mt-1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {Number(amount) > 0 && (
              <p className="text-xs text-charcoal opacity-60 mt-1">
                {formatNaira(Number(amount))}
              </p>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-charcoal">
              Note (optional)
            </span>
            <textarea
              className="input mt-1"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. July generator fuel, 2 drums"
            />
          </label>

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
            {loading ? "Saving..." : "Save Expense"}
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
