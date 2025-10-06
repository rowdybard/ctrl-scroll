import Fastify from 'fastify';
import basicAuth from '@fastify/basic-auth';
import { config } from './config';
import { ingestAllWatchlists } from './jobs/ingestSubreddit';
import { processRawPosts } from './jobs/normalizeAndEnrich';
import { summarizePosts } from './jobs/summarize';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

// Basic auth for internal endpoints
await fastify.register(basicAuth, {
  validate: (username, password, req, reply, done) => {
    if (username === config.auth.user && password === config.auth.pass) {
      done();
    } else {
      done(new Error('Unauthorized'));
    }
  }
});

// Internal endpoints for scheduled jobs
fastify.addHook('preHandler', fastify.basicAuth);

// POST /internal/run/ingest - Ingest from all watchlists
fastify.post('/internal/run/ingest', async (request, reply) => {
  try {
    console.log('🔄 Starting ingest job...');
    const results = await ingestAllWatchlists();
    
    const totalProcessed = Object.values(results).reduce((sum, ids) => sum + ids.length, 0);
    
    return {
      success: true,
      message: `Processed ${totalProcessed} posts`,
      results
    };
  } catch (error) {
    console.error('❌ Ingest job failed:', error);
    reply.status(500);
    return { success: false, error: error.message };
  }
});

// POST /internal/run/refresh - Refresh hot posts
fastify.post('/internal/run/refresh', async (request, reply) => {
  try {
    console.log('🔄 Starting refresh job...');
    
    // Ingest new posts
    const results = await ingestAllWatchlists();
    const totalIngested = Object.values(results).reduce((sum, ids) => sum + ids.length, 0);
    
    // Process and normalize raw posts
    const enrichedPosts = await processRawPosts();
    
    // Summarize posts
    const summarizedPosts = await summarizePosts(enrichedPosts);
    
    return {
      success: true,
      message: `Processed ${totalIngested} new posts, enriched ${enrichedPosts.length}, summarized ${summarizedPosts.length}`,
      results: {
        ingested: totalIngested,
        enriched: enrichedPosts.length,
        summarized: summarizedPosts.length
      }
    };
  } catch (error) {
    console.error('❌ Refresh job failed:', error);
    reply.status(500);
    return { success: false, error: error.message };
  }
});

// POST /internal/run/feeds - Rebuild feeds and sitemap
fastify.post('/internal/run/feeds', async (request, reply) => {
  try {
    console.log('🔄 Starting feeds rebuild job...');
    
    // TODO: Implement in M5
    return {
      success: true,
      message: 'Feeds rebuild completed (placeholder)'
    };
  } catch (error) {
    console.error('❌ Feeds job failed:', error);
    reply.status(500);
    return { success: false, error: error.message };
  }
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3002');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Worker server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
