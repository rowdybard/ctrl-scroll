import { NextRequest, NextResponse } from 'next/server';
import { incrMetric } from '@/lib/metrics';
import { join } from 'path';

const config = {
  dataDir: process.env.DATA_DIR || './data'
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, variant, event } = body;
    
    if (!postId || !variant || !event) {
      return NextResponse.json({ error: 'Missing required fields: postId, variant, event' }, { status: 400 });
    }
    
    if (!['A', 'B', 'C'].includes(variant)) {
      return NextResponse.json({ error: 'Invalid variant. Must be A, B, or C' }, { status: 400 });
    }
    
    if (!['impression', 'click'].includes(event)) {
      return NextResponse.json({ error: 'Invalid event. Must be impression or click' }, { status: 400 });
    }
    
    // Track metrics
    const metricPath = join(config.dataDir, 'metrics', `${postId}_${variant}.json`);
    await incrMetric(metricPath, event === 'impression' ? 'impressions' : 'clicks');
    
    console.log(`📊 Tracked ${event} for ${postId} variant ${variant}`);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to track event:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}
