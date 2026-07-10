"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/stores/cart-store";
import { formatNaira } from "@/lib/format";

// TEMPORARY MOCK DATA — replace with a TanStack Query call to a real
// product search endpoint once the DB is connected (Section 1 mandates
// TanStack Query for all server data fetching).
const mockProducts = [
  { id: "1", name: "Samsung Charger Type-C", sellingPrice: 3500, quantity: 3 },
  { id: "2", name: "Infinix Phone Pouch", sellingPrice: 1500, quantity: 1 },
  { id: "3", name: "USB Cable 1m", sellingPrice: 1200, quantity: 4 },
  { id: "4", name: "Bluetooth Earpiece", sellingPrice: 8500, quantity: 22 },
  { id: "5", name: "Power Bank 10000mAh", sellingPrice: 12000, quantity: 0 },
  { id: "6", name: "Screen Protector", sellingPrice: 800, quantity: 45 },
];

type PaymentMethod = "cash" | "transfer" | "pos_card" | "credit";
export default function RecordSalePage() {
  const router = useRouter();
  const { items, addItem, updateQuantity, removeItem, clear } = useCartStore();
  const [search, setSearch] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const searchResults = useMemo(
    () =>
      search.trim()
        ? mockProducts.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase()),
          )
        : [],
    [search],
  );

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const discountAmount = Number(discount) || 0;
  const total = Math.max(subtotal - discountAmount, 0);
  const paid = paymentMethod === "credit" ? Number(amountPaid) || 0 : total;

  async function handleCompleteSale() {
    setError(null);

    if (items.length === 0)
      return setError("Add at least one item to the cart");
    if (discountAmount > subtotal)
      return setError("Discount cannot exceed subtotal");
    if (paymentMethod === "credit" && paid > total)
      return setError("Amount paid cannot exceed total");

    setLoading(true);
    try {
      // TODO: replace with the real recordSale() server action from
      // src/server/actions/sales.ts once the DB is connected. That
      // action re-fetches authoritative prices server-side and blocks
      // the whole transaction if stock would go negative (Section 2.4,
      // 2.7) — this screen never trusts its own cart prices for the
      // actual write.
      console.log("Would record sale:", {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        discount: discountAmount,
        paymentMethod,
        amountPaidNow: paid,
      });
      await new Promise((r) => setTimeout(r, 400));
      clear();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete sale");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-forest text-cream p-3">
        <h1 className="font-semibold text-lg">Record Sale</h1>
      </nav>

      <main className="p-3 max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Left: product search */}
        <section className="space-y-3">
          <input
            placeholder="Search products to add..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
          <div className="bg-white rounded overflow-hidden">
            {searchResults.length === 0 ? (
              <p className="p-3 text-sm text-charcoal opacity-60">
                {search.trim()
                  ? "No products match."
                  : "Start typing to search."}
              </p>
            ) : (
              searchResults.map((p) => (
                <button
                  key={p.id}
                  disabled={p.quantity === 0}
                  onClick={() =>
                    addItem({
                      productId: p.id,
                      name: p.name,
                      unitPrice: p.sellingPrice,
                      availableStock: p.quantity,
                    })
                  }
                  className="w-full flex items-center justify-between p-3 border-b border-gray-100 last:border-0 text-left disabled:opacity-40"
                >
                  <span className="text-charcoal">{p.name}</span>
                  <span className="text-sm text-charcoal opacity-70">
                    {p.quantity === 0
                      ? "Out of stock"
                      : formatNaira(p.sellingPrice)}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
        {/* Right: cart */}
        <section className="bg-white rounded p-3 space-y-3">
          <h2 className="font-semibold text-charcoal">Cart</h2>

          {items.length === 0 ? (
            <p className="text-sm text-charcoal opacity-60">No items yet.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex-1">
                    <p className="text-charcoal text-sm">{item.name}</p>
                    <p className="text-xs text-charcoal opacity-60">
                      {formatNaira(item.unitPrice)} each
                    </p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={item.availableStock}
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.productId, Number(e.target.value))
                    }
                    className="w-16 p-2 rounded border border-gray-300 text-center"
                  />
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label className="block">
            <span className="text-sm font-medium text-charcoal">
              Discount (₦)
            </span>
            <input
              type="number"
              min={0}
              className="input mt-1"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-charcoal">
              Payment method
            </span>
            <select
              className="input mt-1"
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethod)
              }
            >
              <option value="cash">Cash</option>
              <option value="transfer">Transfer</option>
              <option value="pos_card">POS / Card</option>
              <option value="credit">Credit</option>
            </select>
          </label>

          {paymentMethod === "credit" && (
            <label className="block">
              <span className="text-sm font-medium text-charcoal">
                Amount paid now (₦, 0 for full credit)
              </span>
              <input
                type="number"
                min={0}
                className="input mt-1"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
            </label>
          )}

          <div className="border-t border-gray-200 pt-3 space-y-1">
            <div className="flex justify-between text-sm text-charcoal">
              <span>Subtotal</span>
              <span>{formatNaira(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-charcoal">
              <span>Discount</span>
              <span>-{formatNaira(discountAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold text-charcoal">
              <span>Total</span>
              <span>{formatNaira(total)}</span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 p-3 rounded">
              {error}
            </p>
          )}

          <button
            onClick={handleCompleteSale}
            disabled={loading}
            className="w-full bg-gold text-charcoal font-semibold p-3 rounded disabled:opacity-60"
          >
            {loading ? "Completing..." : "Complete Sale"}
          </button>
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
