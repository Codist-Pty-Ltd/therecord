"use client";

import { useCallback, useState } from "react";

import { trackStoryShare, type StorySharePlatform } from "@/lib/umami";

interface StoryShareButtonsProps {
  slug: string;
  title: string;
}

export default function StoryShareButtons({
  slug,
  title,
}: StoryShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/story/${slug}`
      : `https://therecord.co.za/story/${slug}`;

  const share = useCallback(
    (platform: StorySharePlatform) => {
      trackStoryShare(platform, slug);
      if (platform === "whatsapp") {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }
      if (platform === "twitter") {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }
      void navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      });
    },
    [slug, title, url],
  );

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-charcoal/45">
        Share
      </span>
      <button
        type="button"
        onClick={() => share("whatsapp")}
        className="rounded border border-charcoal/12 px-2 py-1 font-mono text-[10px] text-charcoal/75 hover:border-amber/40 hover:text-amber"
      >
        WhatsApp
      </button>
      <button
        type="button"
        onClick={() => share("twitter")}
        className="rounded border border-charcoal/12 px-2 py-1 font-mono text-[10px] text-charcoal/75 hover:border-amber/40 hover:text-amber"
      >
        X
      </button>
      <button
        type="button"
        onClick={() => share("copy")}
        className="rounded border border-charcoal/12 px-2 py-1 font-mono text-[10px] text-charcoal/75 hover:border-amber/40 hover:text-amber"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
