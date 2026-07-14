"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStaffInvite } from "@/server/actions/auth";
import { toggleCostVisibility, toggleStaffStatus } from "@/server/actions/staff";

type StaffMember = {
  id: string;
  name: string;
  contact: string;
  role: "owner" | "manager" | "staff";
  canSeeCostAndProfit: boolean;
  status: "active" | "disabled";
};

export function StaffManagementClient({ staff }: { staff: StaffMember[] }) {
  const router = useRouter();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteContact, setInviteContact] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "staff">("staff");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!inviteName.trim() || !inviteContact.trim()) return setError("Name and contact are required");

    setLoading(true);
    try {
      const { code } = await createStaffInvite({ name: inviteName, contact: inviteContact, role: inviteRole });
      setGeneratedCode(code);
      setInviteName("");
      setInviteContact("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create invite");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleCost(id: string) {
    await toggleCostVisibility(id);
    router.refresh();
  }

  async function handleToggleStatus(id: string) {
    await toggleStaffStatus(id);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => { setShowInviteForm((v) => !v); setGeneratedCode(null); }}
          className="bg-gold text-charcoal font-semibold px-3 py-2 rounded text-sm"
        >
          Invite Staff
        </button>
      </div>

      {showInviteForm && (
        <section className="bg-white rounded p-3">
          {generatedCode ? (
            <div>
              <p className="text-charcoal">Invite created. Share this code — it expires in 24hr and can only be used once:</p>
              <p className="text-2xl font-mono font-semibold text-forest mt-2 tracking-widest">{generatedCode}</p>
              <button
                onClick={() => { setShowInviteForm(false); setGeneratedCode(null); }}
                className="text-sm text-charcoal opacity-60 mt-3"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateInvite} className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-charcoal">Name</span>
                <input className="input mt-1" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-charcoal">Email</span>
                <input className="input mt-1" value={inviteContact} onChange={(e) => setInviteContact(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-charcoal">Role</span>
                <select className="input mt-1" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "manager" | "staff")}>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                </select>
                <p className="text-xs text-charcoal opacity-60 mt-1">
                  Manager sees cost price and profit by default. Staff does not.
                </p>
              </label>
              {error && <p className="text-sm text-red-700 bg-red-50 p-3 rounded">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-gold text-charcoal font-semibold p-3 rounded disabled:opacity-60">
                {loading ? "Generating..." : "Generate Invite Code"}
              </button>
            </form>
          )}
        </section>
      )}

      <section className="bg-white rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left bg-gray-50">
              <th className="p-3 font-medium text-charcoal">Name</th>
              <th className="p-3 font-medium text-charcoal">Role</th>
              <th className="p-3 font-medium text-charcoal">Sees Cost/Profit</th>
              <th className="p-3 font-medium text-charcoal">Status</th>
              <th className="p-3 font-medium text-charcoal"></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-b border-gray-100 last:border-0">
                <td className="p-3 text-charcoal">
                  {s.name}
                  <p className="text-xs opacity-60">{s.contact}</p>
                </td>
                <td className="p-3 text-charcoal capitalize">{s.role}</td>
                <td className="p-3">
                  {s.role === "owner" ? (
                    <span className="text-xs text-charcoal opacity-40">—</span>
                  ) : (
                    <button
                      onClick={() => handleToggleCost(s.id)}
                      className={`text-xs font-medium px-3 py-1 rounded border ${
                        s.canSeeCostAndProfit
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-charcoal opacity-70 border-gray-200"
                      }`}
                    >
                      {s.canSeeCostAndProfit ? "Yes" : "No"}
                    </button>
                  )}
                </td>
                <td className="p-3">
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded border ${
                      s.status === "active"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="p-3">
                  {s.role !== "owner" && (
                    <button onClick={() => handleToggleStatus(s.id)} className="text-sm text-forest font-semibold">
                      {s.status === "active" ? "Disable" : "Enable"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <style>{`
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