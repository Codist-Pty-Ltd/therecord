/**
 * Parses numbered argument blocks stored as a single string (e.g. B-BBEE seed).
 */

export interface NumberedArgumentPoint {
  title: string;
  detail: string;
}

export function parseNumberedPolicyArguments(
  raw: string,
): NumberedArgumentPoint[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  const matchStart = normalized.search(/\n\d+\.\s/m);
  const body =
    matchStart === -1 ? normalized : normalized.slice(matchStart + 1);

  const chunks = body.split(/\n(?=\d+\.\s)/);
  const out: NumberedArgumentPoint[] = [];

  for (const chunk of chunks) {
    const lines = chunk.trim().split("\n");
    const first = lines[0]?.replace(/^\d+\.\s*/, "").trim() ?? "";
    const detail = lines.slice(1).join("\n").trim();
    if (!first && !detail) continue;
    out.push({ title: first, detail });
  }

  return out;
}
