import Image from "next/image";
import type { YoutubeVideo, YoutubeVideoType } from "@the-record/shared-types";

const TYPE_GROUPS: {
  types: YoutubeVideoType[];
  heading: string;
}[] = [
  { types: ["commission_hearing"], heading: "Hearing recordings" },
  { types: ["parliamentary"], heading: "Parliamentary" },
  { types: ["news_report"], heading: "News coverage" },
  { types: ["documentary"], heading: "Documentaries" },
  { types: ["analysis", "interview"], heading: "Analysis & commentary" },
];

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatViews(viewCount: string | null | undefined): string {
  if (viewCount == null || viewCount === "") return "—";
  const n = Number(viewCount);
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return `${n.toLocaleString("en-ZA")} views`;
}

export interface VideoSectionProps {
  videos: YoutubeVideo[];
  heading?: string;
}

export default function VideoSection({
  videos,
  heading = "Video resources",
}: VideoSectionProps) {
  if (!videos || videos.length === 0) return null;

  const byType = new Map<YoutubeVideoType, YoutubeVideo[]>();
  for (const v of videos) {
    const t = v.video_type;
    const list = byType.get(t) ?? [];
    list.push(v);
    byType.set(t, list);
  }

  const strayTypes: YoutubeVideoType[] = [];
  for (const t of byType.keys()) {
    const inGroup = TYPE_GROUPS.some((g) => g.types.includes(t));
    if (!inGroup) strayTypes.push(t);
  }

  return (
    <section
      aria-label={heading}
      className="w-full max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14 border-t border-charcoal/10"
    >
      <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-6 md:mb-8">
        {heading}
      </h2>

      <div className="flex flex-col gap-10">
        {TYPE_GROUPS.map(({ types, heading: gh }) => {
          const grouped = types.flatMap((t) => byType.get(t) ?? []);
          if (grouped.length === 0) return null;
          return (
            <div key={gh}>
              <h3 className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.22em] text-amber mb-4">
                {gh}
              </h3>
              <ul className="flex flex-col gap-4" role="list">
                {grouped.map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </ul>
            </div>
          );
        })}

        {strayTypes.length > 0 ? (
          <div>
            <h3 className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.22em] text-amber mb-4">
              Other
            </h3>
            <ul className="flex flex-col gap-4" role="list">
              {strayTypes.flatMap((t) => byType.get(t) ?? []).map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function VideoCard({ video }: { video: YoutubeVideo }) {
  const href = `https://www.youtube.com/watch?v=${encodeURIComponent(video.youtube_id)}`;
  const thumb = video.thumbnail_url;

  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-row gap-3 md:gap-4 rounded-lg border border-charcoal/15 bg-cream/40 p-2 md:p-3 transition-[border-color,transform] hover:-translate-y-px hover:border-amber/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
      >
        <div className="relative h-[68px] w-[120px] flex-shrink-0 overflow-hidden rounded bg-charcoal/90">
          {thumb ? (
            <Image
              src={thumb}
              alt=""
              fill
              className="object-cover"
              sizes="120px"
              unoptimized
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-cream/80"
              aria-hidden
            >
              <PlayIcon className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          {video.channel_name ? (
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber line-clamp-1">
              {video.channel_name}
            </p>
          ) : null}
          <p className="mt-1 font-serif text-sm text-charcoal line-clamp-2 leading-snug group-hover:text-charcoal">
            {video.title}
          </p>
          <p className="mt-1.5 font-mono text-[11px] text-charcoal/50 tabular-nums">
            {formatDuration(video.duration_seconds)} ·{" "}
            {formatViews(video.view_count)}
          </p>
        </div>
      </a>
    </li>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}
