/**
 * CommissionPlainEnglish — the always-visible plain-English foundation for
 * a commission. Gold left border (constitutional weight — commissions are
 * first-class public institutions) rather than the amber border used for
 * stories.
 *
 * Server Component — no client state needed, it's never collapsed.
 */

interface CommissionPlainEnglishProps {
  text: string;
}

export default function CommissionPlainEnglish({
  text,
}: CommissionPlainEnglishProps) {
  return (
    <section
      aria-label="Plain English summary"
      className="relative bg-cream border-l-4 border-constitutional-gold rounded-r-2xl md:rounded-r-3xl px-5 md:px-7 py-5 md:py-6 max-w-4xl shadow-[inset_0_1px_0_rgba(212,160,23,0.08)]"
    >
      <div className="flex items-center gap-2 mb-3">
        <span aria-hidden className="text-lg md:text-xl leading-none">
          🏛️
        </span>
        <span className="label-smallcaps text-constitutional-gold">
          Plain English · why this commission exists
        </span>
      </div>
      <p className="font-serif text-[17px] md:text-xl lg:text-[22px] leading-[1.4] text-charcoal">
        {text}
      </p>
    </section>
  );
}
