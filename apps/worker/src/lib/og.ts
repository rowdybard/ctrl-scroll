import { promises as fs } from 'fs';
import { join } from 'path';
import { config } from '../config';
import { atomicWrite } from '@ctrlscroll/shared';
import { PublishedPost } from '@ctrlscroll/shared';

export async function generateOGImage(post: PublishedPost): Promise<string> {
  // For now, generate a simple text-based OG image
  // In production, this would use a canvas library or call an image generation API
  
  const ogHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title}</title>
</head>
<body style="margin: 0; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; flex-direction: column; justify-content: center;">
  <div style="max-width: 800px; margin: 0 auto;">
    <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; border: 1px solid rgba(255, 255, 255, 0.2);">
      <h1 style="font-size: 32px; margin: 0 0 20px 0; line-height: 1.2; font-weight: 700;">${post.title}</h1>
      <p style="font-size: 18px; margin: 0 0 20px 0; opacity: 0.9; line-height: 1.4;">${post.micro}</p>
      <div style="display: flex; align-items: center; gap: 20px; margin-top: 30px;">
        <span style="background: rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">r/${post.subreddit}</span>
        <span style="font-size: 14px; opacity: 0.8;">Ctrl+Scroll</span>
      </div>
    </div>
  </div>
</body>
</html>`;

  const ogPath = join(config.dataDir, 'og', `${post.id}.html`);
  await atomicWrite(ogPath, ogHtml);
  
  // Return the URL path for the OG image
  return `/og/${post.id}.html`;
}

export async function generateOGImages(posts: PublishedPost[]): Promise<void> {
  for (const post of posts.slice(0, 10)) { // Limit to latest 10 posts
    try {
      await generateOGImage(post);
      console.log(`🎨 Generated OG image for ${post.id}`);
    } catch (error) {
      console.error(`Failed to generate OG image for ${post.id}:`, error);
    }
  }
}
