import { requireSession } from "@/lib/auth";
import { getExpenseHistory } from "@/lib/queries/expenses-history";
import { ExpenseHistoryList } from "@/components/ExpenseHistoryList";

export default async function ExpenseHistoryPage() {
  const session = await requireSession();
  const expenses = await getExpenseHistory(session);

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-forest text-cream p-3">
        <h1 className="font-semibold text-lg">Expense History</h1>
      </nav>

      <main className="p-3 max-w-3xl mx-auto">
        <ExpenseHistoryList expenses={expenses} />
      </main>
    </div>
  );
}