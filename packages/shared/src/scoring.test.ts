import { sigmoid, clamp, calculateScore, PostMetrics } from './scoring';

describe('sigmoid', () => {
  it('should return 0.5 for input 0', () => {
    expect(sigmoid(0)).toBeCloseTo(0.5, 5);
  });

  it('should return values close to 1 for large positive inputs', () => {
    expect(sigmoid(10)).toBeCloseTo(1, 5);
    expect(sigmoid(100)).toBeCloseTo(1, 5);
  });

  it('should return values close to 0 for large negative inputs', () => {
    expect(sigmoid(-10)).toBeCloseTo(0, 5);
    expect(sigmoid(-100)).toBeCloseTo(0, 5);
  });

  it('should be monotonic', () => {
    expect(sigmoid(-5)).toBeLessThan(sigmoid(-4));
    expect(sigmoid(-1)).toBeLessThan(sigmoid(0));
    expect(sigmoid(0)).toBeLessThan(sigmoid(1));
    expect(sigmoid(4)).toBeLessThan(sigmoid(5));
  });
});

describe('clamp', () => {
  it('should return value within bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('should handle edge cases', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
    expect(clamp(5, 5, 5)).toBe(5);
  });
});

describe('calculateScore', () => {
  const createMetrics = (overrides: Partial<PostMetrics> = {}): PostMetrics => ({
    minutesSincePost: 120,
    upvotes: 100,
    comments: 50,
    sentimentStddev: 0.5,
    entityPopularity: 5,
    externalAuthority: 30,
    ...overrides
  });

  it('should return a score between 0 and 1', () => {
    const metrics = createMetrics();
    const score = calculateScore(metrics);
    
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('should give higher scores to recent posts', () => {
    const recentMetrics = createMetrics({ minutesSincePost: 30 });
    const oldMetrics = createMetrics({ minutesSincePost: 480 });
    
    const recentScore = calculateScore(recentMetrics);
    const oldScore = calculateScore(oldMetrics);
    
    expect(recentScore).toBeGreaterThan(oldScore);
  });

  it('should give higher scores to posts with more engagement', () => {
    const highEngagement = createMetrics({ upvotes: 1000, comments: 200 });
    const lowEngagement = createMetrics({ upvotes: 10, comments: 5 });
    
    const highScore = calculateScore(highEngagement);
    const lowScore = calculateScore(lowEngagement);
    
    expect(highScore).toBeGreaterThan(lowScore);
  });

  it('should give higher scores to more controversial posts', () => {
    const controversial = createMetrics({ sentimentStddev: 0.8 });
    const neutral = createMetrics({ sentimentStddev: 0.1 });
    
    const controversialScore = calculateScore(controversial);
    const neutralScore = calculateScore(neutral);
    
    expect(controversialScore).toBeGreaterThan(neutralScore);
  });

  it('should give higher scores to posts with more entities', () => {
    const manyEntities = createMetrics({ entityPopularity: 10 });
    const fewEntities = createMetrics({ entityPopularity: 2 });
    
    const manyScore = calculateScore(manyEntities);
    const fewScore = calculateScore(fewEntities);
    
    expect(manyScore).toBeGreaterThan(fewScore);
  });

  it('should give higher scores to posts with external authority', () => {
    const withAuthority = createMetrics({ externalAuthority: 60 });
    const withoutAuthority = createMetrics({ externalAuthority: 0 });
    
    const authorityScore = calculateScore(withAuthority);
    const noAuthorityScore = calculateScore(withoutAuthority);
    
    expect(authorityScore).toBeGreaterThan(noAuthorityScore);
  });

  it('should handle extreme values', () => {
    const extremeMetrics = createMetrics({
      minutesSincePost: 10000,
      upvotes: 100000,
      comments: 50000,
      sentimentStddev: 2.0,
      entityPopularity: 100,
      externalAuthority: 1000
    });
    
    const score = calculateScore(extremeMetrics);
    
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
