import { FastifyInstance } from 'fastify';
import { promises as fs } from 'fs';
import { join } from 'path';

export async function postsRoutes(fastify: FastifyInstance) {
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
}
