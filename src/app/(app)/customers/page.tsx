import { requireSession } from "@/lib/auth";
import { getCustomersWithBalances } from "@/lib/queries/customers";
import { CustomersList } from "@/components/CustomersList";

export default async function CustomersPage() {
  const session = await requireSession();
  const customers = await getCustomersWithBalances(session);

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-forest text-cream p-3">
        <h1 className="font-semibold text-lg">Customers / Debt</h1>
      </nav>

      <main className="p-3 max-w-3xl mx-auto">
        <CustomersList customers={customers} />
      </main>
    </div>
  );
}