import { requireSession } from "@/lib/auth";
import { getRecentSales } from "@/lib/queries/sales-history";
import { SalesHistoryList } from "@/components/SalesHistoryList";

export default async function SalesHistoryPage() {
  const session = await requireSession();
  const sales = await getRecentSales(session);

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-forest text-cream p-3">
        <h1 className="font-semibold text-lg">Sales History &amp; Returns</h1>
      </nav>

      <main className="p-3 max-w-3xl mx-auto">
        <SalesHistoryList sales={sales} />
      </main>
    </div>
  );
}