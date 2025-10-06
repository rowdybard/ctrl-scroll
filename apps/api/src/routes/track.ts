import { FastifyInstance } from 'fastify';
import { join } from 'path';
import { incrMetric } from '@ctrlscroll/shared';

export async function trackRoutes(fastify: FastifyInstance) {
  const config = {
    dataDir: process.env.DATA_DIR || './data'
  };

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
}
