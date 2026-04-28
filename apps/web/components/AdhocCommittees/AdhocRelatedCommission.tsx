import Link from "next/link";

import type { AdhocCommitteeDetail } from "@the-record/shared-types";

export default function AdhocRelatedCommission({
  committee,
}: {
  committee: AdhocCommitteeDetail;
}) {
  const rc = committee.related_commission;
  if (!rc) return null;

  return (
    <aside
      aria-label="Related commission of inquiry"
      className="relative bg-amber/10 border-l-4 border-amber rounded-r-2xl px-5 md:px-6 py-5 md:py-6 max-w-3xl"
    >
      <p className="label-smallcaps text-amber mb-2">Same matter</p>
      <p className="font-sans text-sm md:text-base text-charcoal/85 leading-relaxed">
        This committee and the{" "}
        <Link
          href={`/commissions/${rc.slug}`}
          className="text-amber font-medium underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 rounded"
        >
          {rc.popular_name}
        </Link>{" "}
        are investigating the same matter simultaneously. The commission is
        an executive body (section 84(2)(f)); this committee is a
        legislative one — they can run in parallel, answering to different
        branches of government.
      </p>
    </aside>
  );
}
