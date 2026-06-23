import {
  TRUSTED_YOUTUBE_CHANNELS,
  YOUTUBE_RELEVANCE_THRESHOLD,
  YoutubeScorerService,
} from './youtube-scorer.service';

describe('YouTubeRelevancyScorer', () => {
  const scorer = new YoutubeScorerService();

  describe('trusted channel bonus', () => {
    it('gives +0.20 for SABC News channel ID UCHMENjA6QZqLRMcJ2LCHPRA', () => {
      const { score } = scorer.scoreVideo({
        title: 'Evening news bulletin',
        channelId: 'UCHMENjA6QZqLRMcJ2LCHPRA',
      });
      expect(score).toBeGreaterThanOrEqual(0.5);
      expect(TRUSTED_YOUTUBE_CHANNELS['UCHMENjA6QZqLRMcJ2LCHPRA']).toBe(
        'SABC News',
      );
    });

    it('gives +0.20 for Parliament of SA channel ID UCvjBNumU6EvSKBjyMorRgqg', () => {
      const { score } = scorer.scoreVideo({
        title: 'Committee hearing',
        channelId: 'UCvjBNumU6EvSKBjyMorRgqg',
      });
      expect(score).toBeGreaterThanOrEqual(0.5);
    });

    it('gives no trusted channel bonus for unknown channel ID', () => {
      const trusted = scorer.scoreVideo({
        title: 'Committee hearing',
        channelId: 'UCvjBNumU6EvSKBjyMorRgqg',
      });
      const unknown = scorer.scoreVideo({
        title: 'Committee hearing',
        channelId: 'UCunknownchannel000000',
      });
      expect(unknown.score).toBeLessThan(trusted.score);
    });
  });

  describe('entity name matching', () => {
    it('gives +0.30 when exact commission key appears in title', () => {
      const { score, reason } = scorer.scoreVideo({
        title: 'Zondo Commission hearing day 1',
        commissionKey: 'Zondo Commission',
      });
      expect(score).toBeGreaterThanOrEqual(0.6);
      expect(reason).toContain('exact entity phrase in title');
    });

    it('gives +0.20 when multiple entity tokens appear in title', () => {
      const { score, reason } = scorer.scoreVideo({
        title: 'State Capture evidence hearing update',
        commissionKey: 'State Capture Commission',
      });
      expect(score).toBeGreaterThanOrEqual(0.5);
      expect(reason).toContain('multiple entity tokens in title');
    });

    it('gives +0.20 when chair name appears in title', () => {
      const { score, reason } = scorer.scoreVideo({
        title: 'Raymond Zondo opens proceedings',
        chairName: 'Raymond Zondo',
      });
      expect(score).toBeGreaterThanOrEqual(0.5);
      expect(reason).toContain('chair name match');
    });
  });

  describe('penalties', () => {
    it('applies -0.10 for "shocking" in title', () => {
      const base = scorer.scoreVideo({ title: 'Commission update' });
      const penalised = scorer.scoreVideo({ title: 'Shocking commission update' });
      expect(penalised.score).toBeLessThan(base.score);
    });

    it('applies -0.10 for "exposed" in title', () => {
      const base = scorer.scoreVideo({ title: 'Commission update' });
      const penalised = scorer.scoreVideo({ title: 'Corruption exposed today' });
      expect(penalised.score).toBeLessThan(base.score);
    });

    it('applies -0.10 for video under 60 seconds duration', () => {
      const base = scorer.scoreVideo({ title: 'Commission update' });
      const short = scorer.scoreVideo({
        title: 'Commission update',
        durationSeconds: 45,
      });
      expect(short.score).toBeLessThan(base.score);
    });

    it('applies -0.05 for view count under 1000', () => {
      const base = scorer.scoreVideo({ title: 'Commission update' });
      const lowViews = scorer.scoreVideo({
        title: 'Commission update',
        viewCount: 500,
      });
      expect(lowViews.score).toBeLessThan(base.score);
    });
  });

  describe('combined scoring', () => {
    it('scores a Parliament channel video about Zondo Commission above 0.6', () => {
      const { score } = scorer.scoreVideo({
        title: 'Zondo Commission hearing testimony',
        channelId: 'UCvjBNumU6EvSKBjyMorRgqg',
        commissionKey: 'Zondo Commission',
        durationSeconds: 900,
        viewCount: 50_000,
      });
      expect(score).toBeGreaterThan(0.6);
    });

    it('filters out videos scoring below 0.4 threshold', () => {
      const { score } = scorer.scoreVideo({
        title: 'Random vlog',
        channelId: 'UCunknown000000000000000000',
        durationSeconds: 30,
        viewCount: 100,
      });
      expect(scorer.passesThreshold(score)).toBe(false);
      expect(score).toBeLessThan(YOUTUBE_RELEVANCE_THRESHOLD);
    });

    it('clamps score to maximum 1.0', () => {
      const { score } = scorer.scoreVideo({
        title: 'Zondo Commission hearing testimony evidence',
        channelId: 'UCvjBNumU6EvSKBjyMorRgqg',
        commissionKey: 'Zondo Commission',
        chairName: 'Raymond Zondo',
        durationSeconds: 3600,
        viewCount: 1_000_000,
      });
      expect(score).toBeLessThanOrEqual(1);
    });

    it('clamps score to minimum 0.0', () => {
      const { score } = scorer.scoreVideo({
        title: 'Shocking exposed rant reaction',
        channelId: 'UCunknown000000000000000000',
        durationSeconds: 20,
        viewCount: 50,
      });
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });
});
