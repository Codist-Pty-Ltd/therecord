import type { AdhocCommitteeDetail } from "@the-record/shared-types";

export default function AdhocEnablingPanel({
  committee,
}: {
  committee: AdhocCommitteeDetail;
}) {
  return (
    <aside
      aria-label="Enabling provision and constitutional basis"
      className="pl-4 md:pl-5 border-l-4 border-legal-blue rounded-r-xl bg-white/60 py-4 md:py-5"
    >
      <p className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-legal-blue mb-2">
        Created under
      </p>
      <p className="font-sans text-sm md:text-base text-charcoal/90 leading-relaxed max-w-3xl">
        {committee.enabling_provision?.trim() || "—"}
      </p>

      <p className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/50 mt-5 mb-2">
        Constitutional basis
      </p>
      <p className="font-sans text-sm md:text-[15px] text-charcoal/80 leading-relaxed max-w-3xl">
        Constitution §55(2) charges the National Assembly with
        choosing its own processes and structures. Ad hoc committees are created
        under those rules — they are instruments of the legislature, not the
        executive.
      </p>
      <p className="mt-4 font-sans text-xs md:text-[13px] text-charcoal/55 leading-relaxed max-w-3xl border-t border-charcoal/10 pt-4">
        Ad hoc committees are creatures of Parliament (the legislature), not the
        President (the executive). That distinguishes them from commissions of
        inquiry established under section 84(2)(f).
      </p>
    </aside>
  );
}
