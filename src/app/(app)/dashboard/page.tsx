import { requireSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries/dashboard";
import { formatNaira, formatDate } from "@/lib/format";

const CHART_HEIGHT_PX = 160;

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getDashboardData(session);

  const maxTrend = Math.max(1, ...data.sevenDayTrend.map((d: any) => d.total));

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-forest text-cream p-3">
        <h1 className="font-semibold text-lg">Dashboard</h1>
        <p className="text-sm opacity-80 capitalize">{session.role}</p>
      </nav>

      <main className="p-3 max-w-4xl mx-auto space-y-3">
        <section className="grid grid-cols-3 gap-3">
          <StatCard label="Today's Sales" value={formatNaira(data.today.sales)} />
          {"profit" in data.today && (
            <StatCard label="Today's Profit" value={formatNaira(data.today.profit)} />
          )}
          <StatCard label="Items Sold" value={String(data.today.itemsSold)} />
        </section>

        <section className="grid grid-cols-2 gap-3">
          <a href="/sales/new" className="bg-gold text-charcoal font-semibold p-3 rounded text-center">
            Record Sale
          </a>
          <a href="/products/new" className="bg-gold text-charcoal font-semibold p-3 rounded text-center">
            Add Product
          </a>
        </section>

        <section className="bg-white rounded p-3">
          <h2 className="font-semibold text-charcoal mb-3">Low Stock Alerts</h2>
          {data.lowStock.length === 0 ? (
            <p className="text-sm text-charcoal opacity-70">No low-stock items right now.</p>
          ) : (
            <ul className="space-y-2">
              {data.lowStock.map((item: any) => (
                <li key={item.id} className="flex items-center justify-between p-3 rounded bg-red-50 border border-red-200">
                  <span className="text-charcoal font-medium">{item.name}</span>
                  <span className="text-sm text-red-700">{item.quantity} left (threshold {item.threshold})</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded p-3">
          <h2 className="font-semibold text-charcoal mb-3">7-Day Sales Trend</h2>
          {data.sevenDayTrend.length === 0 ? (
            <p className="text-sm text-charcoal opacity-70">No sales recorded yet.</p>
          ) : (
            <div className="flex items-end gap-2" style={{ height: CHART_HEIGHT_PX }}>
              {data.sevenDayTrend.map((day: any) => {
                const barHeight = Math.max(4, Math.round((day.total / maxTrend) * CHART_HEIGHT_PX));
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                    <div style={{ height: barHeight, backgroundColor: "#166534" }} className="w-full rounded" title={formatNaira(day.total)} />
                    <span className="text-xs text-charcoal opacity-70">{formatDate(day.date).slice(0, 5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded p-3">
      <p className="text-sm text-charcoal opacity-70">{label}</p>
      <p className="text-xl font-semibold text-charcoal mt-1">{value}</p>
    </div>
  );
}