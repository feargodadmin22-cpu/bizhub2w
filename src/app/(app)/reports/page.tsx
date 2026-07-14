import { requireSession } from "@/lib/auth";
import { getReportsData } from "@/lib/queries/reports";
import { formatNaira, formatDate } from "@/lib/format";
import { ExportReportButton } from "@/components/ExportReportButton";

function defaultDates() {
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return { start, end };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const defaults = defaultDates();
  const startDate = params.start ?? defaults.start;
  const endDate = params.end ?? defaults.end;

  const data = await getReportsData(session, startDate, endDate);

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-forest text-cream p-3 flex items-center justify-between">
        <h1 className="font-semibold text-lg">Reports / P&amp;L</h1>
        <ExportReportButton
          data={data}
          startDate={startDate}
          endDate={endDate}
        />
      </nav>

      <main className="p-3 max-w-4xl mx-auto space-y-3">
        <form
          method="GET"
          className="bg-white rounded p-3 flex flex-wrap gap-3 items-end"
        >
          <label className="block">
            <span className="text-sm font-medium text-charcoal">From</span>
            <input
              type="date"
              name="start"
              defaultValue={startDate}
              className="input mt-1"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-charcoal">To</span>
            <input
              type="date"
              name="end"
              defaultValue={endDate}
              className="input mt-1"
            />
          </label>
          <button
            type="submit"
            className="bg-gold text-charcoal font-semibold px-3 py-2 rounded"
          >
            Apply
          </button>
        </form>

        <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Total Sales" value={formatNaira(data.totalSales)} />
          <StatCard label="COGS" value={formatNaira(data.totalCOGS)} />
          <StatCard
            label="Gross Profit"
            value={formatNaira(data.grossProfit)}
          />
          <StatCard
            label="Total Expenses"
            value={formatNaira(data.totalExpenses)}
          />
          <StatCard
            label="Net Profit"
            value={formatNaira(data.netProfit)}
            highlight
          />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <section className="bg-white rounded p-3">
            <h2 className="font-semibold text-charcoal mb-3">Top Sellers</h2>
            {data.topSellers.length === 0 ? (
              <p className="text-sm text-charcoal opacity-60">
                No sales in this period.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.topSellers.map(([product, qty]) => (
                  <li
                    key={product}
                    className="flex justify-between text-sm text-charcoal"
                  >
                    <span>{product}</span>
                    <span className="opacity-70">{qty} sold</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white rounded p-3">
            <h2 className="font-semibold text-charcoal mb-3">Slow Movers</h2>
            {data.slowMovers.length === 0 ? (
              <p className="text-sm text-charcoal opacity-60">
                No sales in this period.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.slowMovers.map(([product, qty]) => (
                  <li
                    key={product}
                    className="flex justify-between text-sm text-charcoal"
                  >
                    <span>{product}</span>
                    <span className="opacity-70">{qty} sold</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="bg-white rounded p-3">
          <h2 className="font-semibold text-charcoal mb-3">
            Expenses in Period
          </h2>
          {data.expenses.length === 0 ? (
            <p className="text-sm text-charcoal opacity-60">
              No expenses in this period.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="p-2 font-medium text-charcoal">Date</th>
                  <th className="p-2 font-medium text-charcoal">Category</th>
                  <th className="p-2 font-medium text-charcoal text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.expenses.map((e, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="p-2 text-charcoal">{formatDate(e.date)}</td>
                    <td className="p-2 text-charcoal">{e.category}</td>
                    <td className="p-2 text-charcoal text-right">
                      {formatNaira(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>

      <style global>{`
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

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded p-3 ${highlight ? "bg-forest text-cream" : "bg-white text-charcoal"}`}
    >
      <p className={`text-sm ${highlight ? "opacity-90" : "opacity-70"}`}>
        {label}
      </p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}
