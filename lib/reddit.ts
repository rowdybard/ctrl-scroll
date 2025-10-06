import { promises as fs } from 'fs';
import { join } from 'path';
import { config } from '@/lib/config';
import { atomicWrite } from '@/lib/atomicWrite';
import { RedditPost, RedditComment, RawPostData } from '@/lib/types';

interface RedditToken {
  access_token: string;
  token_type: string;
  expires_at: number;
}

interface RedditResponse<T> {
  data: {
    children: Array<{ data: T }>;
    after?: string;
    before?: string;
  };
}

export class RedditClient {
  private token: RedditToken | null = null;

  private get tokenPath(): string {
    return join(config.dataDir, 'reddit', 'token.json');
  }

  async ensureToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expires_at - 60000) {
      return this.token.access_token;
    }

    try {
      const tokenData = await fs.readFile(this.tokenPath, 'utf8');
      const cached = JSON.parse(tokenData) as RedditToken;
      if (Date.now() < cached.expires_at - 60000) {
        this.token = cached;
        return cached.access_token;
      }
    } catch {
      // No cached token or expired
    }

    return this.refreshToken();
  }

  private async refreshToken(): Promise<string> {
    const auth = Buffer.from(`${config.reddit.clientId}:${config.reddit.clientSecret}`).toString('base64');
    
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': config.reddit.userAgent
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: config.reddit.username,
        password: config.reddit.password
      })
    });

    if (!response.ok) {
      throw new Error(`Reddit auth failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.token = {
      access_token: data.access_token,
      token_type: data.token_type,
      expires_at: Date.now() + (data.expires_in * 1000)
    };

    await atomicWrite(this.tokenPath, JSON.stringify(this.token));
    return data.access_token;
  }

  async fetchSubredditPosts(subreddit: string, sort: 'new' | 'hot' = 'hot', limit: number = 25, after?: string): Promise<{ posts: RedditPost[]; after?: string }> {
    const token = await this.ensureToken();
    const url = new URL(`https://oauth.reddit.com/r/${subreddit}/${sort}.json`);
    url.searchParams.set('limit', limit.toString());
    if (after) url.searchParams.set('after', after);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': config.reddit.userAgent
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Token expired, refresh and retry once
        this.token = null;
        const newToken = await this.ensureToken();
        return this.fetchSubredditPosts(subreddit, sort, limit, after);
      }
      throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
    }

    // Check rate limits
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');
    
    if (remaining && parseInt(remaining) < 5 && reset) {
      const resetTime = parseInt(reset) * 1000;
      const sleepTime = resetTime - Date.now() + 1000; // Add 1s buffer
      if (sleepTime > 0) {
        console.log(`Rate limit low (${remaining} remaining), sleeping ${sleepTime}ms`);
        await new Promise(resolve => setTimeout(resolve, sleepTime));
      }
    }

    const data: RedditResponse<RedditPost> = await response.json();
    return {
      posts: data.data.children.map(child => child.data),
      after: data.data.after
    };
  }

  async fetchPostComments(postId: string, limit: number = 15): Promise<RedditComment[]> {
    const token = await this.ensureToken();
    const url = `https://oauth.reddit.com/comments/${postId}.json?limit=${limit}&depth=1&sort=top`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': config.reddit.userAgent
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.token = null;
        const newToken = await this.ensureToken();
        return this.fetchPostComments(postId, limit);
      }
      throw new Error(`Reddit comments error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    // Comments are in the second element of the array
    const commentsData = data[1] as RedditResponse<RedditComment>;
    
    return commentsData.data.children
      .map(child => child.data)
      .filter(comment => comment.body && comment.body !== '[deleted]' && comment.body !== '[removed]')
      .slice(0, limit);
  }

  async saveRawPost(post: RedditPost, comments: RedditComment[]): Promise<string> {
    const date = new Date(post.created_utc * 1000);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const rawData: RawPostData = {
      post,
      comments,
      fetchedAt: new Date().toISOString()
    };

    const filename = `t3_${post.id}.json`;
    const commentsFilename = `t3_${post.id}.comments.json`;
    
    const postPath = join(config.dataDir, 'raw', dateStr, filename);
    const commentsPath = join(config.dataDir, 'raw', dateStr, commentsFilename);

    await atomicWrite(postPath, JSON.stringify(rawData));
    await atomicWrite(commentsPath, JSON.stringify(comments));

    return filename;
  }
}
