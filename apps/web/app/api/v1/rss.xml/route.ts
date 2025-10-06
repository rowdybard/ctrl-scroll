import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

const config = {
  dataDir: process.env.DATA_DIR || './data'
};

export async function GET() {
  try {
    const rssPath = join(config.dataDir, 'feeds', 'rss.xml');
    const rss = await fs.readFile(rssPath, 'utf8');
    
    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml',
      },
    });
  } catch (error) {
    console.error('Failed to serve RSS:', error);
    return NextResponse.json({ error: 'RSS feed not found' }, { status: 404 });
  }
}
