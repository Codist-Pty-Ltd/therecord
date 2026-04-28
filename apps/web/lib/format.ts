/**
 * Shared display formatters for the homepage and editorial surfaces.
 * Safe for server and client — no IO.
 */

/**
 * Format Rand amounts. Accepts API bigint strings, plain numbers, or null.
 * When `compact` is true (narrow mobile), billions drop the decimal to save width.
 */
export function formatRands(
  amount: number | string | null | undefined,
  opts?: { compact?: boolean },
): string {
  if (amount === null || amount === undefined || amount === "") return "N/A";
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n) || n <= 0) return "N/A";
  const compact = opts?.compact ?? false;
  if (n >= 1_000_000_000) {
    const b = n / 1_000_000_000;
    if (compact) return `R${Math.round(b)}bn`;
    return `R${b.toFixed(1).replace(/\.0$/, "")}bn`;
  }
  if (n >= 1_000_000) return `R${Math.round(n / 1_000_000)}m`;
  if (n >= 1_000) return `R${Math.round(n / 1_000)}k`;
  return `R${n.toLocaleString("en-ZA")}`;
}

export function formatEventDate(date: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(date));
}

export function getPersonInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Avatar / chip backgrounds for legal status (homepage key-people strip). */
export function getStatusColour(status: string): string {
  const map: Record<string, string> = {
    active: "#1C1C1E",
    suspended: "#C8651B",
    charged: "#B91C1C",
    acquitted: "#3B5EA6",
    concluded: "#16A34A",
    resigned: "#78716C",
    unknown: "#1C1C1E",
  };
  return map[status] ?? "#1C1C1E";
}
