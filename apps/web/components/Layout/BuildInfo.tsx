/** Deployed git SHA + date — baked at Docker/CI build time. */
export default function BuildInfo() {
  const sha = process.env.NEXT_PUBLIC_BUILD_SHA;
  const date = process.env.NEXT_PUBLIC_BUILD_DATE;

  if (!sha && !date) {
    return null;
  }

  const shortSha = sha?.slice(0, 7);
  const dateLabel = date
    ? new Date(date).toISOString().slice(0, 10)
    : null;

  return (
    <p className="font-mono text-[10px] text-charcoal/35">
      {shortSha}
      {shortSha && dateLabel ? " · " : null}
      {dateLabel}
    </p>
  );
}
