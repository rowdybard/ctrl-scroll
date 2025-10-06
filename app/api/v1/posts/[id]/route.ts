import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

const config = {
  dataDir: process.env.DATA_DIR || './data'
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const postPath = join(config.dataDir, 'derived', 'posts', `${id}.json`);
    
    try {
      const content = await fs.readFile(postPath, 'utf8');
      const post = JSON.parse(content);
      return NextResponse.json(post);
    } catch (error) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Failed to get post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}
