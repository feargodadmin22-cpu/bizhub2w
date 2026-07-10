"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";

// TEMPORARY MOCK DATA — replace with a real ActivityLog query once
// connected. Section 5.3: this table is append-only, and every sale,
// expense, price edit, and staff add/remove writes here automatically
// from inside the same transaction as the action itself.
type LogEntry = {
  id: string;
  userName: string;
  actionType: string;
  description: string;
  createdAt: string;
};

const mockLog: LogEntry[] = [
  {
    id: "1",
    userName: "Chidi",
    actionType: "sale.created",
    description: "Recorded sale — total ₦12,500",
    createdAt: "2026-07-06T14:32:00",
  },
  {
    id: "2",
    userName: "Ngozi",
    actionType: "sale.created",
    description: "Recorded sale — total ₦8,000",
    createdAt: "2026-07-06T13:10:00",
  },
  {
    id: "3",
    userName: "Chidi",
    actionType: "expense.created",
    description: "Added expense — Rent ₦50,000",
    createdAt: "2026-07-06T09:05:00",
  },
  {
    id: "4",
    userName: "Chidi",
    actionType: "staff.invited",
    description: "Invited Tunde as staff",
    createdAt: "2026-07-05T16:45:00",
  },
  {
    id: "5",
    userName: "Chidi",
    actionType: "product.price_edited",
    description: "Updated cost price on Bluetooth Earpiece",
    createdAt: "2026-07-05T11:20:00",
  },
  {
    id: "6",
    userName: "Tunde",
    actionType: "staff.invite_redeemed",
    description: "Tunde activated their account",
    createdAt: "2026-07-05T10:00:00",
  },
];

const actionTypeStyles: Record<string, string> = {
  "sale.created": "bg-green-50 text-green-700 border-green-200",
  "expense.created": "bg-red-50 text-red-700 border-red-200",
  "staff.invited": "bg-blue-50 text-blue-700 border-blue-200",
  "staff.invite_redeemed": "bg-blue-50 text-blue-700 border-blue-200",
  "product.price_edited": "bg-yellow-50 text-yellow-700 border-yellow-200",
};

export default function ActivityLogPage() {
  const [filter, setFilter] = useState<string>("all");

  const actionTypes = [
    "all",
    ...Array.from(new Set(mockLog.map((l) => l.actionType))),
  ];
  const filtered =
    filter === "all" ? mockLog : mockLog.filter((l) => l.actionType === filter);

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-forest text-cream p-3">
        <h1 className="font-semibold text-lg">Activity Log</h1>
      </nav>

      <main className="p-3 max-w-3xl mx-auto space-y-3">
        <div className="flex gap-2 flex-wrap">
          {actionTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-2 rounded text-sm font-medium ${
                filter === type
                  ? "bg-forest text-cream"
                  : "bg-white text-charcoal border border-gray-300"
              }`}
            >
              {type === "all" ? "All" : type}
            </button>
          ))}
        </div>

        <section className="bg-white rounded overflow-hidden">
          {filtered.length === 0 ? (
            <p className="p-3 text-sm text-charcoal opacity-60">
              No activity for this filter.
            </p>
          ) : (
            <ul>
              {filtered.map((entry) => (
                <li
                  key={entry.id}
                  className="p-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-charcoal">{entry.description}</p>
                      <p className="text-xs text-charcoal opacity-60 mt-1">
                        {entry.userName} · {formatDate(entry.createdAt)} ·{" "}
                        {new Date(entry.createdAt).toLocaleTimeString("en-NG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded border whitespace-nowrap ${
                        actionTypeStyles[entry.actionType] ??
                        "bg-gray-50 text-charcoal border-gray-200"
                      }`}
                    >
                      {entry.actionType}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
