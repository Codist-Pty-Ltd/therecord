import { Injectable } from '@nestjs/common';

/** Minimum heuristic score for review-queue inclusion (matches Python + Nest YoutubeService). */
export const YOUTUBE_RELEVANCE_THRESHOLD = 0.4;

export const TRUSTED_YOUTUBE_CHANNELS: Record<string, string> = {
  UCvjBNumU6EvSKBjyMorRgqg: 'Parliament of South Africa',
  UCHMENjA6QZqLRMcJ2LCHPRA: 'SABC News',
};

export interface YoutubeScoreInput {
  title: string;
  description?: string | null;
  channelId?: string | null;
  publishedAt?: Date | null;
  durationSeconds?: number | null;
  viewCount?: number | null;
  channelSubscribers?: Record<string, number>;
  commissionKey?: string | null;
  chairName?: string | null;
  domainKeyword?: string | null;
  announcedYear?: string | null;
}

export interface YoutubeScoreResult {
  score: number;
  reason: string;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

@Injectable()
export class YoutubeScorerService {
  /** Heuristic relevance score (mirrors apps/intelligence/routers/youtube.py `_score_video`). */
  scoreVideo(input: YoutubeScoreInput): YoutubeScoreResult {
    const t = norm(input.title);
    const parts: string[] = [];
    let score = 0.3;

    const ck = input.commissionKey ? norm(input.commissionKey) : '';
    if (ck && t.includes(ck)) {
      score += 0.3;
      parts.push('exact entity phrase in title');
    } else if (ck) {
      const cwords = ck.split(/[^\w]+/).filter((w) => w.length > 3);
      const hit = cwords.filter((w) => t.includes(w)).length;
      if (hit >= 2) {
        score += 0.2;
        parts.push('multiple entity tokens in title');
      }
    }

    const ch = input.chairName ? norm(input.chairName) : '';
    if (ch) {
      const chparts = ch.split(/[^\w]+/).filter((p) => p.length > 2);
      if (chparts.some((p) => t.includes(p))) {
        score += 0.2;
        parts.push('chair name match');
      }
    }

    if (input.channelId && input.channelId in TRUSTED_YOUTUBE_CHANNELS) {
      score += 0.2;
      parts.push('trusted channel');
    }

    if (['reaction', 'rant', 'exposed', 'shocking'].some((w) => t.includes(w))) {
      score -= 0.1;
      parts.push('clickbait penalty');
    }

    if (input.viewCount != null && input.viewCount < 1000) {
      score -= 0.05;
      parts.push('low views');
    }

    if (input.durationSeconds != null && input.durationSeconds < 60) {
      score -= 0.1;
      parts.push('very short video');
    }

    score = Math.max(0, Math.min(1, Math.round(score * 100) / 100));
    return {
      score,
      reason: parts.length > 0 ? parts.join('; ') : 'baseline',
    };
  }

  passesThreshold(score: number): boolean {
    return score >= YOUTUBE_RELEVANCE_THRESHOLD;
  }
}
