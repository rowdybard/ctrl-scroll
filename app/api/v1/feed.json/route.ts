import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

const config = {
  dataDir: process.env.DATA_DIR || './data'
};

export async function GET() {
  try {
    const jsonPath = join(config.dataDir, 'feeds', 'feed.json');
    const feed = await fs.readFile(jsonPath, 'utf8');
    
    return new NextResponse(feed, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Failed to serve JSON feed:', error);
    return NextResponse.json({ error: 'JSON feed not found' }, { status: 404 });
  }
}
