import { NextRequest, NextResponse } from 'next/server';
import { ingestAllWatchlists } from '@/lib/worker/ingestSubreddit';
import { processRawPosts } from '@/lib/worker/normalizeAndEnrich';
import { summarizePosts } from '@/lib/worker/summarize';
import { dedupePosts, applyOptOut } from '@/lib/worker/dedupe';
import { scorePosts } from '@/lib/worker/score';
import { publishPosts } from '@/lib/worker/publish';

export async function POST(request: NextRequest) {
  try {
    // Check basic auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [user, pass] = credentials.split(':');
    
    if (user !== process.env.BASIC_AUTH_USER || pass !== process.env.BASIC_AUTH_PASS) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting refresh job...');
    
    // Ingest new posts
    const results = await ingestAllWatchlists();
    const totalIngested = Object.values(results).reduce((sum, ids) => sum + ids.length, 0);
    
    // Process and normalize raw posts
    const enrichedPosts = await processRawPosts();
    
    // Summarize posts
    const summarizedPosts = await summarizePosts(enrichedPosts);
    
    // Deduplicate posts
    const { published: dedupeResults, duplicates } = await dedupePosts(enrichedPosts, summarizedPosts);
    
    // Apply opt-out filters
    const filteredPosts = await applyOptOut(dedupeResults);
    
    // Score posts
    const scoredPosts = scorePosts(filteredPosts);
    
    // Publish posts
    const publishedPosts = await publishPosts(filteredPosts, scoredPosts);
    
    return NextResponse.json({
      success: true,
      message: `Processed ${totalIngested} new posts, enriched ${enrichedPosts.length}, summarized ${summarizedPosts.length}, published ${publishedPosts.length}`,
      results: {
        ingested: totalIngested,
        enriched: enrichedPosts.length,
        summarized: summarizedPosts.length,
        duplicates: duplicates.length,
        published: publishedPosts.length
      }
    });
  } catch (error) {
    console.error('❌ Refresh job failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
