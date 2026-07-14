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

type StockRow = {
  id: string;
  name: string;
  category: string;
  unit: string;
  sellingPrice: number;
  quantity: number;
  lowStockThreshold: number;
};

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
        <span className={`text-xs font-medium px-3 py-1 rounded border ${healthStyles[health]}`}>
          {healthLabel[health]}
        </span>
      );
    },
  }),
];

export function StockTable({ data }: { data: StockRow[] }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");

  const filtered = useMemo(() => {
    return data.filter((row) => {
      const matchesSearch = row.name.toLowerCase().includes(search.toLowerCase());
      const health = stockHealth(row);
      const matchesTab =
        tab === "all" || (tab === "low" && health === "yellow") || (tab === "out" && health === "red");
      return matchesSearch && matchesTab;
    });
  }, [data, search, tab]);

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-3">
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
              tab === t ? "bg-forest text-cream" : "bg-white text-charcoal border border-gray-300"
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
                  <th key={header.id} className="text-left p-3 font-medium text-charcoal">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 last:border-0">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3 text-charcoal">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-3 text-center text-charcoal opacity-60">
                  No products match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}