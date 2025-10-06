export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  subreddit: string;
  author: string;
  created_utc: number;
  score: number;
  num_comments: number;
  upvote_ratio: number;
  is_self: boolean;
  is_video: boolean;
  is_gallery: boolean;
  over_18: boolean;
  thumbnail: string;
  preview?: {
    images?: Array<{
      source: { url: string; width: number; height: number };
    }>;
  };
}

export interface RedditComment {
  id: string;
  body: string;
  author: string;
  score: number;
  created_utc: number;
  replies?: { data: { children: RedditComment[] } };
}

export interface RawPostData {
  post: RedditPost;
  comments: RedditComment[];
  fetchedAt: string;
}

export interface EnrichedPost {
  id: string;
  title: string;
  url: string;
  normalizedUrl: string;
  subreddit: string;
  author: string;
  createdUtc: number;
  score: number;
  comments: number;
  upvoteRatio: number;
  isNsfw: boolean;
  topComments: string[];
  externalTitle?: string;
  canonicalUrl?: string;
  entities: string[];
  sentimentScores: number[];
  controversyScore: number;
}

export interface SummarizedPost {
  id: string;
  micro: string; // 1-sentence lead ≤22 words
  bullets: string[]; // 3-5 bullets ≤20 words each
  headlines: {
    A: string; // straight fact ≤65 chars
    B: string; // ethical curiosity ≤65 chars  
    C: string; // action/outcome ≤65 chars
  };
}

export interface ScoredPost {
  id: string;
  score: number;
  recency: number;
  engagement: number;
  controversy: number;
  popularity: number;
  authority: number;
}

export interface PublishedPost {
  id: string;
  title: string; // variant headline
  micro: string;
  bullets: string[];
  createdUtc: number;
  subreddit: string;
  score: number;
  tags: string[];
  permalink: string;
  originalUrl?: string;
  externalTitle?: string;
  duplicateOf?: string;
  publishedAt: string;
  // Enhanced content
  images?: {
    hero: {
      url: string;
      prompt: string;
      localPath: string;
    };
    context?: {
      url: string;
      prompt: string;
      localPath: string;
    };
  };
  richContext?: {
    background: string;
    keyPoints: string[];
    relatedTopics: string[];
    timeline?: string[];
  };
}

export interface WatchlistConfig {
  subreddit: string;
  sort: 'new' | 'hot';
  limit: number;
  keywords?: string[];
}

export interface OptOutConfig {
  subreddits: string[];
  authors: string[];
  domains: string[];
}
