import { promises as fs } from 'fs';
import { join } from 'path';
import { config } from '../config';
import { atomicWrite } from '@ctrlscroll/shared';
import { PublishedPost } from '@ctrlscroll/shared';

export async function generateRSSFeed(): Promise<string> {
  const posts = await getLatestPosts(50);
  
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Ctrl+Scroll</title>
    <description>AI-curated summaries from Reddit's top discussions</description>
    <link>${config.publicOrigin}</link>
    <atom:link href="${config.publicOrigin}/v1/rss.xml" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    
    ${posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.micro}<br/><br/>${post.bullets.map(b => `• ${b}`).join('<br/>')}]]></description>
      <link>${config.publicOrigin}${post.permalink}</link>
      <guid isPermaLink="true">${config.publicOrigin}${post.permalink}</guid>
      <pubDate>${new Date(post.createdUtc * 1000).toUTCString()}</pubDate>
      <category>r/${post.subreddit}</category>
      ${post.tags.map(tag => `<category>${tag}</category>`).join('')}
    </item>`).join('')}
    
  </channel>
</rss>`;

  const rssPath = join(config.dataDir, 'feeds', 'rss.xml');
  await atomicWrite(rssPath, rss);
  
  console.log(`📰 Generated RSS feed with ${posts.length} posts`);
  return rss;
}

export async function generateJSONFeed(): Promise<string> {
  const posts = await getLatestPosts(50);
  
  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "Ctrl+Scroll",
    description: "AI-curated summaries from Reddit's top discussions",
    home_page_url: config.publicOrigin,
    feed_url: `${config.publicOrigin}/v1/feed.json`,
    language: "en",
    items: posts.map(post => ({
      id: post.id,
      title: post.title,
      content_text: `${post.micro}\n\n${post.bullets.map(b => `• ${b}`).join('\n')}`,
      content_html: `${post.micro}<br/><br/>${post.bullets.map(b => `• ${b}`).join('<br/>')}`,
      url: `${config.publicOrigin}${post.permalink}`,
      external_url: post.originalUrl,
      date_published: new Date(post.createdUtc * 1000).toISOString(),
      date_modified: post.publishedAt,
      tags: [post.subreddit, ...post.tags],
      authors: [
        {
          name: `r/${post.subreddit}`,
          url: `https://reddit.com/r/${post.subreddit}`
        }
      ]
    }))
  };

  const jsonPath = join(config.dataDir, 'feeds', 'feed.json');
  await atomicWrite(jsonPath, JSON.stringify(feed, null, 2));
  
  console.log(`📄 Generated JSON feed with ${posts.length} posts`);
  return JSON.stringify(feed, null, 2);
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
