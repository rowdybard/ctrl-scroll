import { NextRequest, NextResponse } from 'next/server';
import { generateRSSFeed, generateJSONFeed } from '../../../lib/worker/feeds';
import { generateSitemap } from '../../../lib/worker/sitemap';

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

    console.log('🔄 Starting feeds rebuild job...');
    
    // Generate RSS feed
    await generateRSSFeed();
    
    // Generate JSON feed
    await generateJSONFeed();
    
    // Generate sitemap
    await generateSitemap();
    
    return NextResponse.json({
      success: true,
      message: 'Feeds, sitemap, and OG images rebuilt successfully'
    });
  } catch (error) {
    console.error('❌ Feeds job failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
