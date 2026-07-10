import { create } from "zustand";

export type CartItem = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

// Zustand — UI state only, per Section 1. The cart is transient: nothing
// here is the source of truth for stock or price. When the sale is
// completed, the server re-fetches real product data and re-checks
// stock inside a transaction (Section 2.7) — this cart is just what the
// cashier sees on screen while building the sale.
export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: Math.min(i.quantity + 1, i.availableStock) }
              : i,
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    }),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items
        .map((i) => (i.productId === productId ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0),
    })),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),
  clear: () => set({ items: [] }),
}));
