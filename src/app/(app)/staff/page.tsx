"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";

// TEMPORARY MOCK DATA — replace with a real query + the createStaffInvite
// server action once connected. Section 2.5/2.6: only Owner can manage
// staff, and invite codes are one-time-use, expiring in 24h.
type StaffMember = {
  id: string;
  name: string;
  contact: string;
  role: "manager" | "staff";
  canSeeCostAndProfit: boolean;
  status: "active" | "disabled";
};

const mockStaff: StaffMember[] = [
  {
    id: "1",
    name: "Ngozi Adeyemi",
    contact: "ngozi@example.com",
    role: "manager",
    canSeeCostAndProfit: true,
    status: "active",
  },
  {
    id: "2",
    name: "Tunde Bakare",
    contact: "tunde@example.com",
    role: "staff",
    canSeeCostAndProfit: false,
    status: "active",
  },
  {
    id: "3",
    name: "Ifeoma Chukwu",
    contact: "0803 222 1111",
    role: "staff",
    canSeeCostAndProfit: false,
    status: "disabled",
  },
];

export default function StaffManagementPage() {
  const [staff, setStaff] = useState(mockStaff);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteContact, setInviteContact] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "staff">("staff");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!inviteName.trim() || !inviteContact.trim())
      return setError("Name and contact are required");

    // TODO: replace with the real createStaffInvite() server action once
    // connected — assertOwner(session) runs first, and the code expires
    // in exactly 24h and can only ever be redeemed once (Section 2.6).
    const code = Math.random().toString(36).slice(2, 10).toUpperCase();
    setGeneratedCode(code);
    setStaff((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        name: inviteName,
        contact: inviteContact,
        role: inviteRole,
        canSeeCostAndProfit: inviteRole === "manager",
        status: "disabled",
      },
    ]);
    setInviteName("");
    setInviteContact("");
  }

  function toggleCostVisibility(id: string) {
    // TODO: real server action — owner-only, Section 2.5/2 (manageStaff).
    setStaff((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, canSeeCostAndProfit: !s.canSeeCostAndProfit } : s,
      ),
    );
  }

  function toggleStatus(id: string) {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "active" ? "disabled" : "active" }
          : s,
      ),
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-forest text-cream p-3 flex items-center justify-between">
        <h1 className="font-semibold text-lg">Staff Management</h1>
        <button
          onClick={() => {
            setShowInviteForm((v) => !v);
            setGeneratedCode(null);
          }}
          className="bg-gold text-charcoal font-semibold px-3 py-2 rounded text-sm"
        >
          Invite Staff
        </button>
      </nav>

      <main className="p-3 max-w-3xl mx-auto space-y-3">
        {showInviteForm && (
          <section className="bg-white rounded p-3">
            {generatedCode ? (
              <div>
                <p className="text-charcoal">
                  Invite created. Share this code — it expires in 24hr and can
                  only be used once:
                </p>
                <p className="text-2xl font-mono font-semibold text-forest mt-2 tracking-widest">
                  {generatedCode}
                </p>
                <button
                  onClick={() => {
                    setShowInviteForm(false);
                    setGeneratedCode(null);
                  }}
                  className="text-sm text-charcoal opacity-60 mt-3"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-charcoal">
                    Name
                  </span>
                  <input
                    className="input mt-1"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-charcoal">
                    Email or phone
                  </span>
                  <input
                    className="input mt-1"
                    value={inviteContact}
                    onChange={(e) => setInviteContact(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-charcoal">
                    Role
                  </span>
                  <select
                    className="input mt-1"
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as "manager" | "staff")
                    }
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                  </select>
                  <p className="text-xs text-charcoal opacity-60 mt-1">
                    Manager sees cost price and profit by default. Staff does
                    not.
                  </p>
                </label>
                {error && (
                  <p className="text-sm text-red-700 bg-red-50 p-3 rounded">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full bg-gold text-charcoal font-semibold p-3 rounded"
                >
                  Generate Invite Code
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
                <th className="p-3 font-medium text-charcoal">
                  Sees Cost/Profit
                </th>
                <th className="p-3 font-medium text-charcoal">Status</th>
                <th className="p-3 font-medium text-charcoal"></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="p-3 text-charcoal">
                    {s.name}
                    <p className="text-xs opacity-60">{s.contact}</p>
                  </td>
                  <td className="p-3 text-charcoal capitalize">{s.role}</td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleCostVisibility(s.id)}
                      className={`text-xs font-medium px-3 py-1 rounded border ${
                        s.canSeeCostAndProfit
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-charcoal opacity-70 border-gray-200"
                      }`}
                    >
                      {s.canSeeCostAndProfit ? "Yes" : "No"}
                    </button>
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
                    <button
                      onClick={() => toggleStatus(s.id)}
                      className="text-sm text-forest font-semibold"
                    >
                      {s.status === "active" ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>

      <style jsx global>{`
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
