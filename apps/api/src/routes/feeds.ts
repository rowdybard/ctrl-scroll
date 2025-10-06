import { FastifyInstance } from 'fastify';
import { promises as fs } from 'fs';
import { join } from 'path';

export async function feedsRoutes(fastify: FastifyInstance) {
  const config = {
    dataDir: process.env.DATA_DIR || './data'
  };

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
}
