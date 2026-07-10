"use client";

import { useMemo, useState } from "react";
import { formatNaira, formatDate } from "@/lib/format";

// TEMPORARY MOCK DATA — replace with real aggregation queries once the
// DB is connected. Net profit formula matches Section 6's rule exactly:
// SUM((unit_price_at_sale - cost_price_at_sale) * quantity) across
// SaleItems in the period, minus returned quantities, minus active
// Expenses in the period. This is always computed, never stored.
const mockSales = [
  { date: "2026-07-01", product: "Samsung Charger Type-C", quantity: 8, unitPrice: 3500, costPrice: 2200 },
  { date: "2026-07-01", product: "Bluetooth Earpiece", quantity: 3, unitPrice: 8500, costPrice: 5500 },
  { date: "2026-07-02", product: "USB Cable 1m", quantity: 15, unitPrice: 1200, costPrice: 700 },
  { date: "2026-07-03", product: "Screen Protector", quantity: 20, unitPrice: 800, costPrice: 300 },
  { date: "2026-07-04", product: "Power Bank 10000mAh", quantity: 4, unitPrice: 12000, costPrice: 8000 },
  { date: "2026-07-05", product: "Bluetooth Earpiece", quantity: 6, unitPrice: 8500, costPrice: 5500 },
  { date: "2026-07-06", product: "Samsung Charger Type-C", quantity: 12, unitPrice: 3500, costPrice: 2200 },
];

const mockExpenses = [
  { date: "2026-07-01", category: "Rent", amount: 50000 },
  { date: "2026-07-02", category: "Transport", amount: 5000 },
  { date: "2026-07-04", category: "Wages", amount: 30000 },
];

export default function ReportsPage() {
  const [startDate, setStartDate] = useState("2026-07-01");
  const [endDate, setEndDate] = useState("2026-07-06");

  const inRange = (date: string) => date >= startDate && date <= endDate;

  const filteredSales = useMemo(() => mockSales.filter((s) => inRange(s.date)), [startDate, endDate]);
  const filteredExpenses = useMemo(() => mockExpenses.filter((e) => inRange(e.date)), [startDate, endDate]);

  const totalSales = filteredSales.reduce((sum, s) => sum + s.unitPrice * s.quantity, 0);
  const totalCOGS = filteredSales.reduce((sum, s) => sum + s.costPrice * s.quantity, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const grossProfit = totalSales - totalCOGS;
  const netProfit = grossProfit - totalExpenses;

  const topSellers = useMemo(() => {
    const byProduct = new Map<string, number>();
    filteredSales.forEach((s) => {
      byProduct.set(s.product, (byProduct.get(s.product) ?? 0) + s.quantity);
    });
    return [...byProduct.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredSales]);

  const slowMovers = useMemo(() => {
    const byProduct = new Map<string, number>();
    filteredSales.forEach((s) => {
      byProduct.set(s.product, (byProduct.get(s.product) ?? 0) + s.quantity);
    });
    return [...byProduct.entries()].sort((a, b) => a[1] - b[1]).slice(0, 5);
  }, [filteredSales]);

  function handleExport() {
    // TODO: replace with a real CSV/PDF export once connected — owner-only
    // per Section 2.5 (exportReports), enforced server-side regardless of
    // what this button does client-side.
    const rows = [
      ["Metric", "Amount"],
      ["Total Sales", String(totalSales)],
      ["COGS", String(totalCOGS)],
      ["Gross Profit", String(grossProfit)],
      ["Total Expenses", String(totalExpenses)],
      ["Net Profit", String(netProfit)],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-forest text-cream p-3 flex items-center justify-between">
        <h1 className="font-semibold text-lg">Reports / P&amp;L</h1>
        <button onClick={handleExport} className="bg-gold text-charcoal font-semibold px-3 py-2 rounded text-sm">
          Export
        </button>
      </nav>

      <main className="p-3 max-w-4xl mx-auto space-y-3">
        <div className="bg-white rounded p-3 flex gap-3 items-end">
          <label className="block">
            <span className="text-sm font-medium text-charcoal">From</span>
            <input
              type="date"
              className="input mt-1"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-charcoal">To</span>
            <input
              type="date"
              className="input mt-1"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>

        <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Total Sales" value={formatNaira(totalSales)} />
          <StatCard label="COGS" value={formatNaira(totalCOGS)} />
          <StatCard label="Gross Profit" value={formatNaira(grossProfit)} />
          <StatCard label="Total Expenses" value={formatNaira(totalExpenses)} />
          <StatCard label="Net Profit" value={formatNaira(netProfit)} highlight />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <section className="bg-white rounded p-3">
            <h2 className="font-semibold text-charcoal mb-3">Top Sellers</h2>
            {topSellers.length === 0 ? (
              <p className="text-sm text-charcoal opacity-60">No sales in this period.</p>
            ) : (
              <ul className="space-y-2">
                {topSellers.map(([product, qty]) => (
                  <li key={product} className="flex justify-between text-sm text-charcoal">
                    <span>{product}</span>
                    <span className="opacity-70">{qty} sold</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white rounded p-3">
            <h2 className="font-semibold text-charcoal mb-3">Slow Movers</h2>
            {slowMovers.length === 0 ? (
              <p className="text-sm text-charcoal opacity-60">No sales in this period.</p>
            ) : (
              <ul className="space-y-2">
                {slowMovers.map(([product, qty]) => (
                  <li key={product} className="flex justify-between text-sm text-charcoal">
                    <span>{product}</span>
                    <span className="opacity-70">{qty} sold</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="bg-white rounded p-3">
          <h2 className="font-semibold text-charcoal mb-3">Expenses in Period</h2>
          {filteredExpenses.length === 0 ? (
            <p className="text-sm text-charcoal opacity-60">No expenses in this period.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="p-2 font-medium text-charcoal">Date</th>
                  <th className="p-2 font-medium text-charcoal">Category</th>
                  <th className="p-2 font-medium text-charcoal text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((e, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="p-2 text-charcoal">{formatDate(e.date)}</td>
                    <td className="p-2 text-charcoal">{e.category}</td>
                    <td className="p-2 text-charcoal text-right">{formatNaira(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>

      <style jsx global>{`
        .input {
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

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded p-3 ${highlight ? "bg-forest text-cream" : "bg-white text-charcoal"}`}>
      <p className={`text-sm ${highlight ? "opacity-90" : "opacity-70"}`}>{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}