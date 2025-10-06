import { promises as fs } from 'fs';
import { join } from 'path';
import { config } from '../config';
import { atomicWrite, appendJsonl } from '@ctrlscroll/shared';
import { EnrichedPost, SummarizedPost, ScoredPost, PublishedPost } from '@ctrlscroll/shared';

export async function publishPosts(
  posts: Array<EnrichedPost & SummarizedPost>, 
  scoredPosts: ScoredPost[]
): Promise<PublishedPost[]> {
  const published: PublishedPost[] = [];
  
  // Sort by score (highest first)
  const sortedPosts = posts
    .map((post, index) => ({
      post,
      score: scoredPosts[index]?.score || 0
    }))
    .sort((a, b) => b.score - a.score);

  for (const { post, score } of sortedPosts) {
    try {
      const publishedPost = await publishPost(post, score);
      published.push(publishedPost);
    } catch (error) {
      console.error(`Failed to publish post ${post.id}:`, error);
    }
  }

  // Update indexes
  await updateIndexes(published);

  console.log(`📝 Published ${published.length} posts`);
  return published;
}

async function publishPost(
  post: EnrichedPost & SummarizedPost, 
  score: number
): Promise<PublishedPost> {
  // Select headline variant (for now, use A - later this will be A/B tested)
  const title = post.headlines.A;
  
  // Extract tags from entities
  const tags = post.entities.slice(0, 3);

  const publishedPost: PublishedPost = {
    id: post.id,
    title,
    micro: post.micro,
    bullets: post.bullets,
    createdUtc: post.createdUtc,
    subreddit: post.subreddit,
    score,
    tags,
    permalink: `/post/${post.id}`,
    originalUrl: post.url,
    externalTitle: post.externalTitle,
    publishedAt: new Date().toISOString()
  };

  // Save to derived/posts directory
  const postPath = join(config.dataDir, 'derived', 'posts', `${post.id}.json`);
  await atomicWrite(postPath, JSON.stringify(publishedPost, null, 2));

  return publishedPost;
}

async function updateIndexes(published: PublishedPost[]): Promise<void> {
  // Update main posts index
  const postsIndexPath = join(config.dataDir, 'index', 'posts.jsonl');
  for (const post of published) {
    await appendJsonl(postsIndexPath, {
      id: post.id,
      title: post.title,
      micro: post.micro,
      createdUtc: post.createdUtc,
      subreddit: post.subreddit,
      score: post.score,
      tags: post.tags,
      permalink: post.permalink
    });
  }

  // Update subreddit indexes
  const subredditIndexes = new Map<string, PublishedPost[]>();
  for (const post of published) {
    if (!subredditIndexes.has(post.subreddit)) {
      subredditIndexes.set(post.subreddit, []);
    }
    subredditIndexes.get(post.subreddit)!.push(post);
  }

  for (const [subreddit, posts] of subredditIndexes) {
    const subredditPath = join(config.dataDir, 'index', 'by_subreddit', `${subreddit}.jsonl`);
    for (const post of posts) {
      await appendJsonl(subredditPath, {
        id: post.id,
        title: post.title,
        micro: post.micro,
        createdUtc: post.createdUtc,
        score: post.score,
        tags: post.tags,
        permalink: post.permalink
      });
    }
  }

  console.log(`📊 Updated indexes: main + ${subredditIndexes.size} subreddit indexes`);
}
