import { StoryClusterService } from './story-cluster.service';

describe('StoryClusterService', () => {
  const cluster = new StoryClusterService();

  it('matches an article to existing story when combined score >= 0.6', () => {
    const headline = 'PRASA corruption investigation hearing';
    const result = cluster.matchCluster(
      headline,
      'PRASA corruption investigation hearing evidence fraud tender',
      [
        {
          id: 'story-1',
          title: headline,
          summary: 'PRASA corruption investigation hearing fraud tender probe',
          keywords: ['prasa', 'corruption', 'investigation'],
        },
      ],
    );
    expect(result.matched_story_id).toBe('story-1');
    expect(result.confidence).toBeGreaterThanOrEqual(0.6);
  });

  it('returns null story ID when best score < 0.6 (new story)', () => {
    const result = cluster.matchCluster(
      'Local pothole protest in Kimberley',
      'Residents blocked roads over municipal service delivery failures',
      [
        {
          id: 'story-1',
          title: 'Zondo Commission state capture inquiry',
          summary: 'National corruption commission hearings',
        },
      ],
    );
    expect(result.matched_story_id).toBeNull();
    expect(result.confidence).toBeLessThan(0.6);
  });

  it('returns null when no candidate stories provided', () => {
    const result = cluster.matchCluster('Headline', 'Body text', []);
    expect(result.matched_story_id).toBeNull();
    expect(result.reasoning).toContain('No candidate stories provided');
  });

  it('uses Jaccard similarity for token overlap calculation', () => {
    const { jaccard } = cluster.computeCombinedScore(
      'state capture corruption zondo',
      'state capture corruption commission',
      'headline a',
      'headline b',
    );
    expect(jaccard).toBeGreaterThan(0);
    expect(jaccard).toBeLessThanOrEqual(1);
  });

  it('weights Jaccard at 70% and headline ratio at 30%', () => {
    const scores = cluster.computeCombinedScore(
      'zondo commission corruption',
      'zondo commission corruption evidence',
      'Zondo Commission hearing',
      'Zondo Commission hearing day 2',
    );
    expect(scores.combined).toBeCloseTo(
      0.7 * scores.jaccard + 0.3 * scores.headlineRatio,
      5,
    );
  });

  it('ignores stop words in token comparison', () => {
    const withStopwords = cluster.tokenSetForTest(
      'the commission and the inquiry on corruption',
    );
    const withoutStopwords = cluster.tokenSetForTest(
      'commission inquiry corruption',
    );
    expect(withStopwords).toEqual(withoutStopwords);
  });

  it('lemmatises tokens before comparison', () => {
    const tokens = cluster.tokenSetForTest('hearing hearings heard');
    expect(tokens.has('hear')).toBe(true);
    expect(tokens.has('hearings')).toBe(false);
  });

  it('picks the highest scoring candidate from multiple options', () => {
    const headline = 'PRASA corruption fraud investigation';
    const result = cluster.matchCluster(
      headline,
      'PRASA corruption fraud investigation tender irregularities SIU',
      [
        {
          id: 'weak-match',
          title: 'Unrelated municipal budget dispute',
          summary: 'City council budget vote in Cape Town',
        },
        {
          id: 'strong-match',
          title: headline,
          summary: 'PRASA corruption fraud investigation tender probe by SIU',
          keywords: ['prasa', 'corruption', 'fraud'],
        },
      ],
    );
    expect(result.matched_story_id).toBe('strong-match');
  });

  it('handles candidates with empty title gracefully', () => {
    const result = cluster.matchCluster(
      'Some headline',
      'Some article body text here',
      [{ id: 'empty-title', title: '', summary: '' }],
    );
    expect(result.matched_story_id).toBeNull();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });
});
