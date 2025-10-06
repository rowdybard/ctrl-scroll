// API client utilities

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface Post {
  id: string;
  title: string;
  micro: string;
  createdUtc: number;
  subreddit: string;
  score: number;
  tags: string[];
  permalink: string;
}

export interface PostDetail extends Post {
  bullets: string[];
  originalUrl?: string;
  externalTitle?: string;
  publishedAt: string;
  headlines: {
    A: string;
    B: string;
    C: string;
  };
}

export interface PostsResponse {
  items: Post[];
  nextPage?: number;
}

export async function fetchPosts(page: number = 1, size: number = 30, topic?: string): Promise<PostsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  
  if (topic) {
    params.set('topic', topic);
  }
  
  const response = await fetch(`${API_BASE}/api/v1/posts?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }
  
  return response.json();
}

export async function fetchPost(id: string): Promise<PostDetail> {
  const response = await fetch(`${API_BASE}/api/v1/posts/${id}`);
  
  if (!response.ok) {
    throw new Error('Post not found');
  }
  
  return response.json();
}

export async function trackEvent(postId: string, variant: 'A' | 'B' | 'C', event: 'impression' | 'click'): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      postId,
      variant,
      event
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to track event');
  }
}
