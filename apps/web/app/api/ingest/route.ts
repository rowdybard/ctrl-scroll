import { NextRequest, NextResponse } from 'next/server';
import { ingestAllWatchlists } from '../../../lib/worker/ingestSubreddit';

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

    console.log('🔄 Starting ingest job...');
    const results = await ingestAllWatchlists();
    
    const totalProcessed = Object.values(results).reduce((sum, ids) => sum + ids.length, 0);
    
    return NextResponse.json({
      success: true,
      message: `Processed ${totalProcessed} posts`,
      results
    });
  } catch (error) {
    console.error('❌ Ingest job failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
