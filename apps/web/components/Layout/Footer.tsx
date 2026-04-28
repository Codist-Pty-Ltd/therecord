/**
 * Site footer — server component.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-charcoal/10 mt-16 md:mt-24">
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-6 md:py-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs text-charcoal/60 font-sans">
        <p>
          © {year} The Record — a{" "}
          <a
            href="https://codist.co.za"
            className="text-amber hover:underline underline-offset-4"
            rel="noreferrer"
          >
            Codist
          </a>{" "}
          project.
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em]">
          Johannesburg · SAST (UTC+2)
        </p>
      </div>
    </footer>
  );
}
