import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

const config = {
  dataDir: process.env.DATA_DIR || './data'
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const size = searchParams.get('size') || '30';
    const topic = searchParams.get('topic') || undefined;
    
    const pageNum = parseInt(page);
    const pageSize = Math.min(parseInt(size), 100); // Max 100 per page
    const offset = (pageNum - 1) * pageSize;
    
    const posts = await getPostsFromIndex(offset, pageSize, topic);
    const hasMore = posts.length === pageSize;
    
    return NextResponse.json({
      items: posts,
      nextPage: hasMore ? pageNum + 1 : undefined
    });
  } catch (error) {
    console.error('Failed to get posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

async function getPostsFromIndex(offset: number, limit: number, topic?: string): Promise<any[]> {
  const postsIndexPath = join(config.dataDir, 'index', 'posts.jsonl');
  
  try {
    const content = await fs.readFile(postsIndexPath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    // Parse JSONL and sort by createdUtc (newest first)
    let posts = lines
      .map(line => JSON.parse(line))
      .sort((a, b) => b.createdUtc - a.createdUtc);
    
    // Filter by topic if specified
    if (topic) {
      posts = posts.filter(post => 
        post.tags.some((tag: string) => tag.toLowerCase().includes(topic.toLowerCase())) ||
        post.subreddit.toLowerCase().includes(topic.toLowerCase())
      );
    }
    
    return posts.slice(offset, offset + limit);
  } catch (error) {
    console.error('Failed to read posts index:', error);
    return [];
  }
}
