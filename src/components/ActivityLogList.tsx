"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";

type LogEntry = {
  id: string;
  userName: string;
  actionType: string;
  description: string;
  createdAt: string;
};

const actionTypeStyles: Record<string, string> = {
  "sale.created": "bg-green-50 text-green-700 border-green-200",
  "expense.created": "bg-red-50 text-red-700 border-red-200",
  "product.created": "bg-blue-50 text-blue-700 border-blue-200",
  "staff.invited": "bg-purple-50 text-purple-700 border-purple-200",
  "staff.invite_redeemed": "bg-purple-50 text-purple-700 border-purple-200",
  "staff.permission_changed": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "staff.status_changed": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "payment.recorded": "bg-green-50 text-green-700 border-green-200",
  "shop.created": "bg-gray-50 text-charcoal border-gray-200",
};

export function ActivityLogList({ entries }: { entries: LogEntry[] }) {
  const [filter, setFilter] = useState<string>("all");

  const actionTypes = ["all", ...Array.from(new Set(entries.map((e) => e.actionType)))];
  const filtered = filter === "all" ? entries : entries.filter((e) => e.actionType === filter);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {actionTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-2 rounded text-sm font-medium ${
              filter === type ? "bg-forest text-cream" : "bg-white text-charcoal border border-gray-300"
            }`}
          >
            {type === "all" ? "All" : type}
          </button>
        ))}
      </div>

      <section className="bg-white rounded overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-3 text-sm text-charcoal opacity-60">No activity for this filter.</p>
        ) : (
          <ul>
            {filtered.map((entry) => (
              <li key={entry.id} className="p-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-charcoal">{entry.description}</p>
                    <p className="text-xs text-charcoal opacity-60 mt-1">
                      {entry.userName} · {formatDate(entry.createdAt)} ·{" "}
                      {new Date(entry.createdAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded border whitespace-nowrap ${
                      actionTypeStyles[entry.actionType] ?? "bg-gray-50 text-charcoal border-gray-200"
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
    </div>
  );
}