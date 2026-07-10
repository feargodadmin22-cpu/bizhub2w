"use client";

import { useState } from "react";
import { formatNaira, formatDate } from "@/lib/format";

// TEMPORARY MOCK DATA — replace with a real query joining Customer +
// Sale (payment_status != 'paid') once connected. Outstanding balance
// = total of credit/partial sales minus recorded Payments for that sale.
type Customer = {
  id: string;
  name: string;
  phone: string;
  outstandingBalance: number;
  lastSaleDate: string;
};

const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "Blessing Okoro",
    phone: "0803 123 4567",
    outstandingBalance: 15000,
    lastSaleDate: "2026-07-05",
  },
  {
    id: "2",
    name: "Emeka Nwosu",
    phone: "0812 987 6543",
    outstandingBalance: 42000,
    lastSaleDate: "2026-07-04",
  },
  {
    id: "3",
    name: "Fatima Bello",
    phone: "0701 555 2211",
    outstandingBalance: 0,
    lastSaleDate: "2026-07-02",
  },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState(mockCustomers);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const debtors = customers.filter((c) => c.outstandingBalance > 0);

  function openPaymentFor(id: string) {
    setPayingId(id);
    setPaymentAmount("");
    setError(null);
  }

  function handleRecordPayment(customer: Customer) {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return setError("Enter a valid amount");
    if (amount > customer.outstandingBalance)
      return setError("Amount exceeds outstanding balance");

    // TODO: replace with the real recordPayment() server action once
    // connected. That action creates a new Payment row against the
    // relevant credit Sale — Section 3.2 means we never edit the
    // original Sale or Payment rows, only add new ones.
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customer.id
          ? { ...c, outstandingBalance: c.outstandingBalance - amount }
          : c,
      ),
    );
    setPayingId(null);
  }

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-forest text-cream p-3">
        <h1 className="font-semibold text-lg">Customers / Debt</h1>
      </nav>

      <main className="p-3 max-w-3xl mx-auto space-y-3">
        <section className="bg-white rounded p-3">
          <h2 className="font-semibold text-charcoal mb-3">
            Outstanding Balances ({debtors.length})
          </h2>
          {debtors.length === 0 ? (
            <p className="text-sm text-charcoal opacity-60">
              No customers currently owe money.
            </p>
          ) : (
            <ul className="space-y-2">
              {debtors.map((c) => (
                <li key={c.id} className="p-3 rounded border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-charcoal font-medium">{c.name}</p>
                      <p className="text-xs text-charcoal opacity-60">
                        {c.phone} · Last sale {formatDate(c.lastSaleDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-700 font-semibold">
                        {formatNaira(c.outstandingBalance)}
                      </p>
                      <button
                        onClick={() => openPaymentFor(c.id)}
                        className="text-sm text-forest font-semibold mt-1"
                      >
                        Record Payment
                      </button>
                    </div>
                  </div>

                  {payingId === c.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-end gap-2">
                      <label className="block flex-1">
                        <span className="text-sm font-medium text-charcoal">
                          Amount (₦)
                        </span>
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
                        className="bg-gold text-charcoal font-semibold px-3 py-2 rounded"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setPayingId(null)}
                        className="text-charcoal opacity-60 px-3 py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {payingId === c.id && error && (
                    <p className="text-sm text-red-700 mt-2">{error}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded p-3">
          <h2 className="font-semibold text-charcoal mb-3">All Customers</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="p-2 font-medium text-charcoal">Name</th>
                <th className="p-2 font-medium text-charcoal">Phone</th>
                <th className="p-2 font-medium text-charcoal text-right">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="p-2 text-charcoal">{c.name}</td>
                  <td className="p-2 text-charcoal">{c.phone}</td>
                  <td
                    className={`p-2 text-right ${c.outstandingBalance > 0 ? "text-red-700" : "text-charcoal opacity-60"}`}
                  >
                    {formatNaira(c.outstandingBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
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
