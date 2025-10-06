// API client utilities

const API_BASE = process.env.NEXT_PUBLIC_API_ORIGIN || '';

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
  headlines?: {
    A: string;
    B: string;
    C: string;
  };
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

export interface PostsResponse {
  items: Post[];
  nextPage?: number;
}

export interface RelatedItem { 
  id: string; 
  title: string; 
  href: string;
  micro?: string;
  subreddit?: string;
}

export interface Neighbor { 
  id: string; 
  title: string; 
  href: string 
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

export async function trackEvent(postId: string, variant: 'F' | 'A' | 'B' | 'C', event: 'impression' | 'click'): Promise<void> {
  const response = await fetch(`${API_BASE}/v1/track`, {
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

// Get a single post by ID
export async function getPost(id: string): Promise<PostDetail> {
  const response = await fetch(`${API_BASE}/v1/posts/${id}`);
  
  if (!response.ok) {
    throw new Error('Post not found');
  }
  
  return response.json();
}

// Get related posts by topic or subreddit
export async function getRelated(topicOrSub: string, limit: number = 6): Promise<RelatedItem[]> {
  try {
    const response = await fetch(`${API_BASE}/v1/posts?topic=${encodeURIComponent(topicOrSub)}&size=${limit}`);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.items.map((post: Post) => ({
      id: post.id,
      title: post.title,
      href: `/post/${post.id}`,
      micro: post.micro,
      subreddit: post.subreddit
    }));
  } catch (error) {
    console.warn('Failed to fetch related posts:', error);
    return [];
  }
}

// Get neighboring posts (prev/next by date)
export async function getNeighbors(id: string): Promise<{ prev: Neighbor | null; next: Neighbor | null }> {
  try {
    // Fetch recent posts to find neighbors
    const response = await fetch(`${API_BASE}/v1/posts?size=100`);
    
    if (!response.ok) {
      return { prev: null, next: null };
    }
    
    const data = await response.json();
    const posts = data.items;
    
    // Sort by created_utc descending (newest first)
    posts.sort((a: Post, b: Post) => b.createdUtc - a.createdUtc);
    
    const currentIndex = posts.findIndex((post: Post) => post.id === id);
    
    if (currentIndex === -1) {
      return { prev: null, next: null };
    }
    
    const prev = currentIndex < posts.length - 1 ? {
      id: posts[currentIndex + 1].id,
      title: posts[currentIndex + 1].title,
      href: `/post/${posts[currentIndex + 1].id}`
    } : null;
    
    const next = currentIndex > 0 ? {
      id: posts[currentIndex - 1].id,
      title: posts[currentIndex - 1].title,
      href: `/post/${posts[currentIndex - 1].id}`
    } : null;
    
    return { prev, next };
  } catch (error) {
    console.warn('Failed to fetch neighbors:', error);
    return { prev: null, next: null };
  }
}

// Map PostDetail to ArticleSource format
export function mapToArticleSource(post: PostDetail): import('../components/ArticleLayoutF').ArticleSource {
  // Determine title: prefer AB winner if available, else alt[0], else title
  const title = post.headlines?.A || post.title;
  
  // Map to ArticleSource format
  return {
    id: post.id,
    title,
    micro: post.micro,
    bullets: post.bullets,
    created_utc: post.createdUtc,
    subreddit: post.subreddit,
    author: undefined, // Not available in current API
    heroImage: post.images?.hero ? `/api/images/${post.images.hero.localPath.split('/').pop()}` : undefined,
    tags: post.tags,
    sources: [
      { label: 'Reddit Post', url: `https://reddit.com${post.permalink}` },
      ...(post.originalUrl ? [{ label: 'Original Source', url: post.originalUrl }] : [])
    ],
    content: post.richContext?.background ? [post.richContext.background] : undefined,
    images: post.images,
    richContext: post.richContext
  };
}
