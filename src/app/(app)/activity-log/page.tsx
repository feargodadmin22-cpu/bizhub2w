import { requireSession } from "@/lib/auth";
import { getActivityLog } from "@/lib/queries/activity-log";
import { ActivityLogList } from "@/components/ActivityLogList";

export default async function ActivityLogPage() {
  const session = await requireSession();
  const entries = await getActivityLog(session);

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-forest text-cream p-3">
        <h1 className="font-semibold text-lg">Activity Log</h1>
      </nav>

      <main className="p-3 max-w-3xl mx-auto">
        <ActivityLogList entries={entries} />
      </main>
    </div>
  );
}