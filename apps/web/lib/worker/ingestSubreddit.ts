import { RedditClient } from '../lib/reddit';
import { config } from '../config';
import { WatchlistConfig } from '@ctrlscroll/shared';

export async function ingestSubreddit(watchlist: WatchlistConfig): Promise<string[]> {
  const client = new RedditClient();
  const processedIds: string[] = [];

  try {
    console.log(`📥 Ingesting r/${watchlist.subreddit} (${watchlist.sort}, limit: ${watchlist.limit})`);
    
    const { posts } = await client.fetchSubredditPosts(
      watchlist.subreddit, 
      watchlist.sort, 
      watchlist.limit
    );

    for (const post of posts) {
      // Skip NSFW posts
      if (post.over_18) {
        console.log(`⏭️  Skipping NSFW post: ${post.title.substring(0, 50)}...`);
        continue;
      }

      // Skip if keywords filter is specified and no matches
      if (watchlist.keywords && watchlist.keywords.length > 0) {
        const text = `${post.title} ${post.selftext}`.toLowerCase();
        const hasKeyword = watchlist.keywords.some(keyword => 
          text.includes(keyword.toLowerCase())
        );
        if (!hasKeyword) {
          console.log(`⏭️  No keyword match: ${post.title.substring(0, 50)}...`);
          continue;
        }
      }

      try {
        // Fetch top comments
        const comments = await client.fetchPostComments(post.id, 15);
        
        // Save raw data
        await client.saveRawPost(post, comments);
        processedIds.push(post.id);
        
        console.log(`✅ Processed: ${post.title.substring(0, 50)}... (${comments.length} comments)`);
        
        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to process post ${post.id}:`, error);
      }
    }

    console.log(`📊 Ingested ${processedIds.length}/${posts.length} posts from r/${watchlist.subreddit}`);
    return processedIds;

  } catch (error) {
    console.error(`❌ Failed to ingest r/${watchlist.subreddit}:`, error);
    throw error;
  }
}

export async function ingestAllWatchlists(): Promise<{ [subreddit: string]: string[] }> {
  const results: { [subreddit: string]: string[] } = {};

  for (const watchlist of config.watchlists) {
    try {
      const ids = await ingestSubreddit(watchlist);
      results[watchlist.subreddit] = ids;
    } catch (error) {
      console.error(`Failed to ingest ${watchlist.subreddit}:`, error);
      results[watchlist.subreddit] = [];
    }
  }

  return results;
}
