export function formatNaira(amount: number): string {
  const hasKobo = Math.round(amount * 100) % 100 !== 0;
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: hasKobo ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatHours(hours: number): string {
  return `${hours}hr`;
}
