"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira, formatDate } from "@/lib/format";
import { processReturn } from "@/server/actions/returns";

type SaleItem = {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  returnableQuantity: number;
};

type Sale = {
  id: string;
  customerName: string;
  total: number;
  paymentStatus: string;
  createdAt: string;
  items: SaleItem[];
};

export function SalesHistoryList({ sales }: { sales: Sale[] }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleExpand(saleId: string) {
    setExpandedId(expandedId === saleId ? null : saleId);
    setReturnQuantities({});
    setReason("");
    setError(null);
  }

  async function handleSubmitReturn(sale: Sale) {
    setError(null);
    const items = Object.entries(returnQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([saleItemId, quantity]) => ({ saleItemId, quantity }));

    if (items.length === 0) return setError("Select at least one item and quantity to return");

    setLoading(true);
    try {
      await processReturn(sale.id, items, reason);
      setExpandedId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not process return");
    } finally {
      setLoading(false);
    }
  }

  if (sales.length === 0) {
    return <p className="text-sm text-charcoal opacity-60 bg-white rounded p-3">No sales recorded yet.</p>;
  }

  return (
    <div className="space-y-2">
      {sales.map((sale) => (
        <div key={sale.id} className="bg-white rounded overflow-hidden">
          <button
            onClick={() => toggleExpand(sale.id)}
            className="w-full flex items-center justify-between p-3 text-left"
          >
            <div>
              <p className="text-charcoal font-medium">{sale.customerName}</p>
              <p className="text-xs text-charcoal opacity-60">
                {formatDate(sale.createdAt)} · {sale.items.length} item{sale.items.length !== 1 ? "s" : ""}
              </p>
            </div>
            <span className="text-charcoal font-semibold">{formatNaira(sale.total)}</span>
          </button>

          {expandedId === sale.id && (
            <div className="border-t border-gray-100 p-3 space-y-3">
              <p className="text-sm font-medium text-charcoal">Select items to return</p>
              {sale.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm text-charcoal">{item.productName}</p>
                    <p className="text-xs text-charcoal opacity-60">
                      {item.returnableQuantity} of {item.quantity} returnable
                    </p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={item.returnableQuantity}
                    disabled={item.returnableQuantity === 0}
                    value={returnQuantities[item.id] ?? ""}
                    onChange={(e) =>
                      setReturnQuantities((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                    }
                    className="w-16 p-2 rounded border border-gray-300 text-center disabled:opacity-40"
                  />
                </div>
              ))}

              <label className="block">
                <span className="text-sm font-medium text-charcoal">Reason (optional)</span>
                <input
                  className="w-full p-3 rounded border border-gray-300 mt-1"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Wrong item, damaged, customer changed mind"
                />
              </label>

              {error && <p className="text-sm text-red-700 bg-red-50 p-3 rounded">{error}</p>}

              <button
                onClick={() => handleSubmitReturn(sale)}
                disabled={loading}
                className="w-full bg-gold text-charcoal font-semibold p-3 rounded disabled:opacity-60"
              >
                {loading ? "Processing..." : "Process Return"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}