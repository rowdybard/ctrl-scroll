export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function clamp(x: number, min: number, max: number): number {
  return Math.min(Math.max(x, min), max);
}

export interface PostMetrics {
  minutesSincePost: number;
  upvotes: number;
  comments: number;
  sentimentStddev: number;
  entityPopularity: number;
  externalAuthority: number;
}

export function calculateScore(metrics: PostMetrics): number {
  const recency = sigmoid(-metrics.minutesSincePost / 240);
  const engagement = sigmoid((metrics.upvotes + metrics.comments * 2) / 500);
  const controversy = clamp(metrics.sentimentStddev, 0, 1);
  const popularity = sigmoid(metrics.entityPopularity / 5);
  const authority = sigmoid(metrics.externalAuthority / 60);

  return 0.35 * recency + 0.25 * engagement + 0.2 * controversy + 0.1 * popularity + 0.1 * authority;
}
