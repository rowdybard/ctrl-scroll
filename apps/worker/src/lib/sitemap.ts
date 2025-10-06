import { promises as fs } from 'fs';
import { join } from 'path';
import { config } from '../config';
import { atomicWrite } from '@ctrlscroll/shared';
import { PublishedPost } from '@ctrlscroll/shared';

export async function generateSitemap(): Promise<string> {
  const posts = await getLatestPosts(1000); // Limit to 1000 for sitemap
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${config.publicOrigin}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  ${posts.map(post => `
  <url>
    <loc>${config.publicOrigin}${post.permalink}</loc>
    <lastmod>${new Date(post.createdUtc * 1000).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

  const sitemapPath = join(config.dataDir, 'sitemap.xml');
  await atomicWrite(sitemapPath, sitemap);
  
  console.log(`🗺️  Generated sitemap with ${posts.length} posts`);
  return sitemap;
}

async function getLatestPosts(limit: number): Promise<PublishedPost[]> {
  const postsIndexPath = join(config.dataDir, 'index', 'posts.jsonl');
  
  try {
    const content = await fs.readFile(postsIndexPath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    // Parse JSONL and sort by createdUtc (newest first)
    const posts = lines
      .map(line => JSON.parse(line))
      .sort((a, b) => b.createdUtc - a.createdUtc)
      .slice(0, limit);
    
    return posts;
  } catch (error) {
    console.error('Failed to read posts index:', error);
    return [];
  }
}
