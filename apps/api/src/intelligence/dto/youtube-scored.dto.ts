/** Intelligence wire type for scored YouTube candidates (see `routers/youtube.py`). */
export interface YoutubeScoredVideoDto {
  youtube_id: string;
  title: string;
  channel_name: string | null;
  channel_id: string | null;
  description: string | null;
  published_at: string | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  view_count: number | null;
  relevance_score: number;
  relevance_reason: string | null;
}
