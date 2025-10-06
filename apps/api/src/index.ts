import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { promises as fs } from 'fs';
import { join } from 'path';
import { incrMetric } from '@ctrlscroll/shared';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

// CORS
await fastify.register(cors, {
  origin: true
});

// Rate limiting
await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
});

const config = {
  dataDir: process.env.DATA_DIR || './data'
};

// GET /v1/posts - Paginated post feed
fastify.get('/v1/posts', async (request, reply) => {
  try {
    const { page = '1', size = '30', topic } = request.query as { page?: string; size?: string; topic?: string };
    
    const pageNum = parseInt(page);
    const pageSize = Math.min(parseInt(size), 100); // Max 100 per page
    const offset = (pageNum - 1) * pageSize;
    
    const posts = await getPostsFromIndex(offset, pageSize, topic);
    const hasMore = posts.length === pageSize;
    
    return {
      items: posts,
      nextPage: hasMore ? pageNum + 1 : undefined
    };
  } catch (error) {
    console.error('Failed to get posts:', error);
    reply.status(500);
    return { error: 'Failed to fetch posts' };
  }
});

// GET /v1/posts/:id - Individual post
fastify.get('/v1/posts/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    
    const postPath = join(config.dataDir, 'derived', 'posts', `${id}.json`);
    
    try {
      const content = await fs.readFile(postPath, 'utf8');
      const post = JSON.parse(content);
      return post;
    } catch (error) {
      reply.status(404);
      return { error: 'Post not found' };
    }
  } catch (error) {
    console.error('Failed to get post:', error);
    reply.status(500);
    return { error: 'Failed to fetch post' };
  }
});

// POST /v1/track - A/B test tracking
fastify.post('/v1/track', async (request, reply) => {
  try {
    const { postId, variant, event } = request.body as { 
      postId: string; 
      variant: 'A' | 'B' | 'C'; 
      event: 'impression' | 'click' 
    };
    
    if (!postId || !variant || !event) {
      reply.status(400);
      return { error: 'Missing required fields: postId, variant, event' };
    }
    
    if (!['A', 'B', 'C'].includes(variant)) {
      reply.status(400);
      return { error: 'Invalid variant. Must be A, B, or C' };
    }
    
    if (!['impression', 'click'].includes(event)) {
      reply.status(400);
      return { error: 'Invalid event. Must be impression or click' };
    }
    
    // Track metrics
    const metricPath = join(config.dataDir, 'metrics', `${postId}_${variant}.json`);
    await incrMetric(metricPath, event === 'impression' ? 'impressions' : 'clicks');
    
    console.log(`📊 Tracked ${event} for ${postId} variant ${variant}`);
    
    return { ok: true };
  } catch (error) {
    console.error('Failed to track event:', error);
    reply.status(500);
    return { error: 'Failed to track event' };
  }
});

// GET /v1/rss.xml - RSS feed
fastify.get('/v1/rss.xml', async (request, reply) => {
  try {
    const rssPath = join(config.dataDir, 'feeds', 'rss.xml');
    const rss = await fs.readFile(rssPath, 'utf8');
    
    reply.type('application/rss+xml');
    return rss;
  } catch (error) {
    console.error('Failed to serve RSS:', error);
    reply.status(404);
    return { error: 'RSS feed not found' };
  }
});

// GET /v1/feed.json - JSON feed
fastify.get('/v1/feed.json', async (request, reply) => {
  try {
    const jsonPath = join(config.dataDir, 'feeds', 'feed.json');
    const feed = await fs.readFile(jsonPath, 'utf8');
    
    reply.type('application/json');
    return JSON.parse(feed);
  } catch (error) {
    console.error('Failed to serve JSON feed:', error);
    reply.status(404);
    return { error: 'JSON feed not found' };
  }
});

// GET /sitemap.xml - Sitemap
fastify.get('/sitemap.xml', async (request, reply) => {
  try {
    const sitemapPath = join(config.dataDir, 'sitemap.xml');
    const sitemap = await fs.readFile(sitemapPath, 'utf8');
    
    reply.type('application/xml');
    return sitemap;
  } catch (error) {
    console.error('Failed to serve sitemap:', error);
    reply.status(404);
    return { error: 'Sitemap not found' };
  }
});

async function getPostsFromIndex(offset: number, limit: number, topic?: string): Promise<any[]> {
  const postsIndexPath = join(config.dataDir, 'index', 'posts.jsonl');
  
  try {
    const content = await fs.readFile(postsIndexPath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    // Parse JSONL and sort by createdUtc (newest first)
    let posts = lines
      .map(line => JSON.parse(line))
      .sort((a, b) => b.createdUtc - a.createdUtc);
    
    // Filter by topic if specified
    if (topic) {
      posts = posts.filter(post => 
        post.tags.some((tag: string) => tag.toLowerCase().includes(topic.toLowerCase())) ||
        post.subreddit.toLowerCase().includes(topic.toLowerCase())
      );
    }
    
    return posts.slice(offset, offset + limit);
  } catch (error) {
    console.error('Failed to read posts index:', error);
    return [];
  }
}

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 API server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
