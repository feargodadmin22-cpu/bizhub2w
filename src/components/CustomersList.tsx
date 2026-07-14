"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira, formatDate } from "@/lib/format";
import { recordCustomerPayment } from "@/server/actions/payments";

type Customer = {
  id: string;
  name: string;
  phone: string;
  outstandingBalance: number;
  lastSaleDate: string | null;
};

export function CustomersList({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const debtors = customers.filter((c) => c.outstandingBalance > 0);

  function openPaymentFor(id: string) {
    setPayingId(id);
    setPaymentAmount("");
    setError(null);
  }

  async function handleRecordPayment(customer: Customer) {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return setError("Enter a valid amount");
    if (amount > customer.outstandingBalance) return setError("Amount exceeds total outstanding balance");

    setLoading(true);
    try {
      await recordCustomerPayment(customer.id, amount);
      setPayingId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <section className="bg-white rounded p-3">
        <h2 className="font-semibold text-charcoal mb-3">Outstanding Balances ({debtors.length})</h2>
        {debtors.length === 0 ? (
          <p className="text-sm text-charcoal opacity-60">No customers currently owe money.</p>
        ) : (
          <ul className="space-y-2">
            {debtors.map((c) => (
              <li key={c.id} className="p-3 rounded border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-charcoal font-medium">{c.name}</p>
                    <p className="text-xs text-charcoal opacity-60">
                      {c.phone} {c.lastSaleDate && `· Last sale ${formatDate(c.lastSaleDate)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-700 font-semibold">{formatNaira(c.outstandingBalance)}</p>
                    <button onClick={() => openPaymentFor(c.id)} className="text-sm text-forest font-semibold mt-1">
                      Record Payment
                    </button>
                  </div>
                </div>

                {payingId === c.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-end gap-2">
                    <label className="block flex-1">
                      <span className="text-sm font-medium text-charcoal">Amount (₦)</span>
                      <input
                        type="number"
                        min="0"
                        max={c.outstandingBalance}
                        className="input mt-1"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                      />
                    </label>
                    <button
                      onClick={() => handleRecordPayment(c)}
                      disabled={loading}
                      className="bg-gold text-charcoal font-semibold px-3 py-2 rounded disabled:opacity-60"
                    >
                      {loading ? "Saving..." : "Confirm"}
                    </button>
                    <button onClick={() => setPayingId(null)} className="text-charcoal opacity-60 px-3 py-2">
                      Cancel
                    </button>
                  </div>
                )}
                {payingId === c.id && error && <p className="text-sm text-red-700 mt-2">{error}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded p-3">
        <h2 className="font-semibold text-charcoal mb-3">All Customers</h2>
        {customers.length === 0 ? (
          <p className="text-sm text-charcoal opacity-60">No customers yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="p-2 font-medium text-charcoal">Name</th>
                <th className="p-2 font-medium text-charcoal">Phone</th>
                <th className="p-2 font-medium text-charcoal text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 last:border-0">
                  <td className="p-2 text-charcoal">{c.name}</td>
                  <td className="p-2 text-charcoal">{c.phone}</td>
                  <td className={`p-2 text-right ${c.outstandingBalance > 0 ? "text-red-700" : "text-charcoal opacity-60"}`}>
                    {formatNaira(c.outstandingBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <style>{`
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