/**
 * Coerce Postgres bigint / numeric aggregate strings to JS numbers.
 * South African accountability amounts stay within Number.MAX_SAFE_INTEGER for current seeded data.
 */
export function bigIntStringToNumber(value: string | null | undefined): number {
  if (value == null || value === '') return 0;
  const n = Number(value);
  if (!Number.isFinite(n)) return Number(BigInt(String(value).split('.')[0]));
  return n;
}
