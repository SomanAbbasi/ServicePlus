export const CURRENCY_SYMBOL = "AED";

export function formatMoney(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return `${CURRENCY_SYMBOL} ${Math.round(n).toLocaleString("en-AE")}`;
}

export function num(value: number | string | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : fallback;
}
