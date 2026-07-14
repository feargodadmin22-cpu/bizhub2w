import { requireSession } from "@/lib/auth";
import { getStockList } from "@/lib/queries/stock";
import { StockTable } from "@/components/StockTable";

export default async function StockListPage() {
  const session = await requireSession();
  const data = await getStockList(session);

  return (
    <div className="min-h-screen bg-cream">
     <nav className="bg-forest text-cream p-3 flex items-center justify-between">
        <h1 className="font-semibold text-lg">Stock List</h1>
        {session.role !== "staff" && (
          <a href="/products/new" className="bg-gold text-charcoal font-semibold px-3 py-2 rounded text-sm">
            Add Product
          </a>
        )}
      </nav>

      <main className="p-3 max-w-4xl mx-auto">
        <StockTable data={data} />
      </main>
    </div>
  );
}