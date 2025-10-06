import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

const config = {
  dataDir: process.env.DATA_DIR || './data'
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sitemapPath = join(config.dataDir, 'sitemap.xml');
    const sitemap = await fs.readFile(sitemapPath, 'utf8');
    
    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Failed to serve sitemap:', error);
    return NextResponse.json({ error: 'Sitemap not found' }, { status: 404 });
  }
}
