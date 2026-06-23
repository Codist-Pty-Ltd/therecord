import { Injectable } from '@nestjs/common';

import type { ClusterMatchResult, StoryCandidate } from './dto/intelligence.dto';

/** Match threshold (mirrors apps/intelligence/services/nlp_service.py). */
export const CLUSTER_CONFIDENCE_THRESHOLD = 0.6;

const ENGLISH_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'shall', 'can', 'this', 'that', 'these', 'those',
  'it', 'its', 'they', 'them', 'their', 'he', 'she', 'his', 'her', 'we', 'our',
  'you', 'your', 'i', 'my', 'me', 'not', 'no', 'so', 'if', 'than', 'then',
]);

const LEMMA_SUFFIXES = ['ing', 'ed', 'es', 's'] as const;

function lemmatise(token: string): string {
  let lemma = token.toLowerCase();
  for (const suffix of LEMMA_SUFFIXES) {
    if (lemma.length > suffix.length + 2 && lemma.endsWith(suffix)) {
      lemma = lemma.slice(0, -suffix.length);
      break;
    }
  }
  return lemma;
}

function tokenSet(text: string): Set<string> {
  if (!text.trim()) return new Set();
  const tokens = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map(lemmatise)
    .filter((t) => t.length > 2 && !ENGLISH_STOPWORDS.has(t));
  return new Set(tokens);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  return intersection / union.size;
}

function headlineRatio(a: string, b: string): number {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return 0;
  if (left === right) return 1;
  const shorter = left.length <= right.length ? left : right;
  const longer = left.length > right.length ? left : right;
  return shorter.length > 0 && longer.includes(shorter)
    ? shorter.length / longer.length
    : 0;
}

@Injectable()
export class StoryClusterService {
  matchCluster(
    headline: string,
    text: string,
    storyCandidates: StoryCandidate[] | null | undefined,
  ): ClusterMatchResult {
    const candidates = storyCandidates ?? [];
    if (candidates.length === 0) {
      return {
        matched_story_id: null,
        confidence: 0,
        reasoning: 'No candidate stories provided.',
      };
    }

    const incomingTokens = tokenSet(`${headline} ${text}`);
    const incomingHeadline = headline.trim().toLowerCase();

    let bestId: string | null = null;
    let bestScore = 0;
    let bestReason = '';

    for (const candidate of candidates) {
      const parts = [
        candidate.title ?? '',
        candidate.summary ?? '',
        candidate.plain_english_summary ?? '',
        ...(candidate.keywords ?? []).map(String),
      ];
      const candidateTokens = tokenSet(parts.join(' '));
      const jac = jaccard(incomingTokens, candidateTokens);
      const hRatio = headlineRatio(
        incomingHeadline,
        (candidate.title ?? '').trim(),
      );
      const combined = 0.7 * jac + 0.3 * hRatio;

      if (combined > bestScore) {
        bestScore = combined;
        bestId = candidate.id;
        bestReason = `Jaccard=${jac.toFixed(2)}, headline_ratio=${hRatio.toFixed(2)}, combined=${combined.toFixed(2)}`;
      }
    }

    if (bestScore < CLUSTER_CONFIDENCE_THRESHOLD) {
      return {
        matched_story_id: null,
        confidence: Math.round(bestScore * 1000) / 1000,
        reasoning: `Best candidate scored ${bestScore.toFixed(3)}, below threshold ${CLUSTER_CONFIDENCE_THRESHOLD}. Likely a new story.`,
      };
    }

    return {
      matched_story_id: bestId,
      confidence: Math.round(bestScore * 1000) / 1000,
      reasoning: bestReason,
    };
  }

  /** Exposed for unit tests verifying weighting formula. */
  computeCombinedScore(
    incomingText: string,
    candidateText: string,
    incomingHeadline: string,
    candidateHeadline: string,
  ): { jaccard: number; headlineRatio: number; combined: number } {
    const jac = jaccard(tokenSet(incomingText), tokenSet(candidateText));
    const hRatio = headlineRatio(incomingHeadline, candidateHeadline);
    return {
      jaccard: jac,
      headlineRatio: hRatio,
      combined: 0.7 * jac + 0.3 * hRatio,
    };
  }

  /** Exposed for unit tests verifying token normalisation. */
  tokenSetForTest(text: string): Set<string> {
    return tokenSet(text);
  }
}
