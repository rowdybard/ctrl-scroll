import { calculateScore, PostMetrics } from '@/lib/scoring';
import { EnrichedPost, SummarizedPost, ScoredPost } from '@/lib/types';

export function scorePost(post: EnrichedPost & SummarizedPost): ScoredPost {
  // Calculate time since post
  const now = Date.now() / 1000; // Convert to seconds
  const minutesSincePost = (now - post.createdUtc) / 60;

  // Calculate entity popularity (simple heuristic)
  const entityPopularity = Math.min(post.entities.length * 2, 10); // Max 10

  // Calculate external authority (placeholder - would need domain authority data)
  const externalAuthority = post.externalTitle ? 30 : 0; // Basic boost for external links

  const metrics: PostMetrics = {
    minutesSincePost,
    upvotes: post.score,
    comments: post.comments,
    sentimentStddev: post.controversyScore,
    entityPopularity,
    externalAuthority
  };

  const score = calculateScore(metrics);

  return {
    id: post.id,
    score,
    recency: metrics.minutesSincePost < 240 ? 1 - (metrics.minutesSincePost / 240) : 0,
    engagement: Math.min((metrics.upvotes + metrics.comments * 2) / 500, 1),
    controversy: post.controversyScore,
    popularity: entityPopularity / 10,
    authority: externalAuthority / 60
  };
}

export function scorePosts(posts: Array<EnrichedPost & SummarizedPost>): ScoredPost[] {
  return posts.map(post => scorePost(post));
}
