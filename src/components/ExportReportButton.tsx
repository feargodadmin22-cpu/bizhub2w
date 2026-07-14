"use client";

type ReportSummary = {
  totalSales: number;
  totalCOGS: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
};

export function ExportReportButton({
  data,
  startDate,
  endDate,
}: {
  data: ReportSummary;
  startDate: string;
  endDate: string;
}) {
  function handleExport() {
    const rows = [
      ["Metric", "Amount"],
      ["Total Sales", String(data.totalSales)],
      ["COGS", String(data.totalCOGS)],
      ["Gross Profit", String(data.grossProfit)],
      ["Total Expenses", String(data.totalExpenses)],
      ["Net Profit", String(data.netProfit)],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={handleExport} className="bg-gold text-charcoal font-semibold px-3 py-2 rounded text-sm">
      Export
    </button>
  );
}