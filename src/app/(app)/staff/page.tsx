import { requireSession } from "@/lib/auth";
import { getStaffList } from "@/lib/queries/staff";
import { StaffManagementClient } from "@/components/StaffManagementClient";

export default async function StaffManagementPage() {
  const session = await requireSession();
  const staff = await getStaffList(session);

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-forest text-cream p-3">
        <h1 className="font-semibold text-lg">Staff Management</h1>
      </nav>

      <main className="p-3 max-w-3xl mx-auto">
        <StaffManagementClient staff={staff} />
      </main>
    </div>
  );
}