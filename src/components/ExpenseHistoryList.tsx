"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira, formatDate } from "@/lib/format";
import { correctExpense, voidExpense } from "@/server/actions/corrections";

type Expense = {
  id: string;
  category: string;
  amount: number;
  note: string | null;
  isActive: boolean;
  createdAt: string;
};

export function ExpenseHistoryList({ expenses }: { expenses: Expense[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ category: "", amount: "", note: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function startCorrection(expense: Expense) {
    setEditingId(expense.id);
    setForm({ category: expense.category, amount: String(expense.amount), note: expense.note ?? "" });
    setError(null);
  }

  async function handleCorrect(expense: Expense) {
    setError(null);
    const amount = Number(form.amount);
    if (!form.category.trim()) return setError("Category is required");
    if (!amount || amount <= 0) return setError("Enter a valid amount");

    setLoading(true);
    try {
      await correctExpense(expense.id, { category: form.category, amount, note: form.note });
      setEditingId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not correct expense");
    } finally {
      setLoading(false);
    }
  }

  async function handleVoid(expense: Expense) {
    if (!confirm(`Void this expense? "${expense.category}" — ${formatNaira(expense.amount)}. This can't be undone.`)) return;
    setLoading(true);
    try {
      await voidExpense(expense.id, "Voided by owner");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not void expense");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded overflow-hidden">
      {expenses.length === 0 ? (
        <p className="p-3 text-sm text-charcoal opacity-60">No expenses recorded yet.</p>
      ) : (
        <ul>
          {expenses.map((e) => (
            <li key={e.id} className={`p-3 border-b border-gray-100 last:border-0 ${!e.isActive ? "opacity-50" : ""}`}>
              {editingId === e.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="p-2 rounded border border-gray-300"
                      value={form.category}
                      onChange={(ev) => setForm({ ...form, category: ev.target.value })}
                      placeholder="Category"
                    />
                    <input
                      type="number"
                      className="p-2 rounded border border-gray-300"
                      value={form.amount}
                      onChange={(ev) => setForm({ ...form, amount: ev.target.value })}
                      placeholder="Amount"
                    />
                  </div>
                  <input
                    className="w-full p-2 rounded border border-gray-300"
                    value={form.note}
                    onChange={(ev) => setForm({ ...form, note: ev.target.value })}
                    placeholder="Note (optional)"
                  />
                  {error && <p className="text-sm text-red-700">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCorrect(e)}
                      disabled={loading}
                      className="bg-gold text-charcoal font-semibold px-3 py-2 rounded text-sm disabled:opacity-60"
                    >
                      {loading ? "Saving..." : "Save Correction"}
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-charcoal opacity-60 px-3 py-2 text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-charcoal">
                      {e.category}
                      {!e.isActive && <span className="text-xs text-red-700 ml-2">(voided)</span>}
                    </p>
                    <p className="text-xs text-charcoal opacity-60">
                      {formatDate(e.createdAt)} {e.note && `· ${e.note}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-charcoal font-medium">{formatNaira(e.amount)}</span>
                    {e.isActive && (
                      <>
                        <button onClick={() => startCorrection(e)} className="text-sm text-forest font-semibold">
                          Correct
                        </button>
                        <button onClick={() => handleVoid(e)} className="text-sm text-red-700 font-semibold">
                          Void
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}