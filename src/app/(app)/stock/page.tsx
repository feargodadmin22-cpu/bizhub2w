"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { formatNaira } from "@/lib/format";

// TEMPORARY MOCK DATA — same shape the real getCurrentQuantities() +
// product query will eventually return. See src/lib/stock.ts.
type StockRow = {
  id: string;
  name: string;
  category: string;
  unit: string;
  sellingPrice: number;
  quantity: number;
  lowStockThreshold: number;
};

const mockStock: StockRow[] = [
  {
    id: "1",
    name: "Samsung Charger Type-C",
    category: "Accessories",
    unit: "Piece",
    sellingPrice: 3500,
    quantity: 3,
    lowStockThreshold: 5,
  },
  {
    id: "2",
    name: "Infinix Phone Pouch",
    category: "Accessories",
    unit: "Piece",
    sellingPrice: 1500,
    quantity: 1,
    lowStockThreshold: 5,
  },
  {
    id: "3",
    name: "USB Cable 1m",
    category: "Accessories",
    unit: "Piece",
    sellingPrice: 1200,
    quantity: 4,
    lowStockThreshold: 10,
  },
  {
    id: "4",
    name: "Bluetooth Earpiece",
    category: "Audio",
    unit: "Piece",
    sellingPrice: 8500,
    quantity: 22,
    lowStockThreshold: 5,
  },
  {
    id: "5",
    name: "Power Bank 10000mAh",
    category: "Accessories",
    unit: "Piece",
    sellingPrice: 12000,
    quantity: 0,
    lowStockThreshold: 5,
  },
  {
    id: "6",
    name: "Screen Protector",
    category: "Accessories",
    unit: "Piece",
    sellingPrice: 800,
    quantity: 45,
    lowStockThreshold: 10,
  },
];
type FilterTab = "all" | "low" | "out";

function stockHealth(row: StockRow): "green" | "yellow" | "red" {
  if (row.quantity <= 0) return "red";
  if (row.quantity <= row.lowStockThreshold) return "yellow";
  return "green";
}

const healthStyles = {
  green: "bg-green-50 text-green-700 border-green-200",
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
  red: "bg-red-50 text-red-700 border-red-200",
};

const healthLabel = {
  green: "In stock",
  yellow: "Low stock",
  red: "Out of stock",
};

const columnHelper = createColumnHelper<StockRow>();

const columns = [
  columnHelper.accessor("name", { header: "Product" }),
  columnHelper.accessor("category", { header: "Category" }),
  columnHelper.accessor("quantity", {
    header: "Quantity",
    cell: (info) => `${info.getValue()} ${info.row.original.unit}`,
  }),
  columnHelper.accessor("sellingPrice", {
    header: "Selling Price",
    cell: (info) => formatNaira(info.getValue()),
  }),
  columnHelper.display({
    id: "health",
    header: "Status",
    cell: (info) => {
      const health = stockHealth(info.row.original);
      return (
        <span
          className={`text-xs font-medium px-3 py-1 rounded border ${healthStyles[health]}`}
        >
          {healthLabel[health]}
        </span>
      );
    },
  }),
];
export default function StockListPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");

  const filtered = useMemo(() => {
    return mockStock.filter((row) => {
      const matchesSearch = row.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const health = stockHealth(row);
      const matchesTab =
        tab === "all" ||
        (tab === "low" && health === "yellow") ||
        (tab === "out" && health === "red");
      return matchesSearch && matchesTab;
    });
  }, [search, tab]);

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-forest text-cream p-3 flex items-center justify-between">
        <h1 className="font-semibold text-lg">Stock List</h1>
        <a
          href="/products/new"
          className="bg-gold text-charcoal font-semibold px-3 py-2 rounded text-sm"
        >
          Add Product
        </a>
      </nav>

      <main className="p-3 max-w-4xl mx-auto space-y-3">
        <input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 rounded border border-gray-300 bg-white text-charcoal"
        />

        <div className="flex gap-2">
          {(["all", "low", "out"] as FilterTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 rounded text-sm font-medium ${
                tab === t
                  ? "bg-forest text-cream"
                  : "bg-white text-charcoal border border-gray-300"
              }`}
            >
              {t === "all" ? "All" : t === "low" ? "Low Stock" : "Out of Stock"}
            </button>
          ))}
        </div>

        <div className="bg-white rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left p-3 font-medium text-charcoal"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 last:border-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3 text-charcoal">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-3 text-center text-charcoal opacity-60"
                  >
                    No products match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
