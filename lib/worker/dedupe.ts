import { promises as fs } from 'fs';
import { join } from 'path';
import { config } from '../config';
import { atomicWrite } from '@/lib/atomicWrite';
import { simhash, hamming } from '@/lib/simhash';
import { EnrichedPost, SummarizedPost } from '@/lib/types';

interface SimHashEntry {
  id: string;
  hash: bigint;
  title: string;
}

export async function dedupePosts(
  enrichedPosts: EnrichedPost[], 
  summarizedPosts: SummarizedPost[]
): Promise<{ published: Array<EnrichedPost & SummarizedPost>; duplicates: string[] }> {
  const simhashPath = join(config.dataDir, 'index', 'simhash.json');
  
  // Load existing simhash index
  let existingHashes: SimHashEntry[] = [];
  try {
    const data = await fs.readFile(simhashPath, 'utf8');
    existingHashes = JSON.parse(data);
  } catch {
    // File doesn't exist yet, start empty
  }

  const published: Array<EnrichedPost & SummarizedPost> = [];
  const duplicates: string[] = [];
  const newHashes: SimHashEntry[] = [...existingHashes];

  for (let i = 0; i < enrichedPosts.length; i++) {
    const enriched = enrichedPosts[i];
    const summarized = summarizedPosts[i];
    
    if (!summarized) continue;

    // Create text for simhash (title + top comments)
    const textForHash = `${enriched.title} ${enriched.topComments.join(' ')}`;
    const newHash = simhash(textForHash);

    // Check for near duplicates (Hamming distance <= 3)
    let isDuplicate = false;
    let duplicateOf: string | undefined;

    for (const existing of existingHashes) {
      const distance = hamming(newHash, existing.hash);
      if (distance <= 3) {
        isDuplicate = true;
        duplicateOf = existing.id;
        break;
      }
    }

    if (isDuplicate) {
      console.log(`🔄 Duplicate detected: ${enriched.title.substring(0, 50)}... (similar to ${duplicateOf})`);
      duplicates.push(enriched.id);
    } else {
      // Add to published posts
      const combined = { ...enriched, ...summarized };
      published.push(combined);

      // Add to simhash index
      newHashes.push({
        id: enriched.id,
        hash: newHash,
        title: enriched.title
      });

      console.log(`✅ Published: ${enriched.title.substring(0, 50)}...`);
    }
  }

  // Save updated simhash index
  await atomicWrite(simhashPath, JSON.stringify(newHashes, null, 2));

  console.log(`📊 Deduplication complete: ${published.length} published, ${duplicates.length} duplicates`);
  
  return { published, duplicates };
}

export async function loadOptOutConfig(): Promise<{ subreddits: string[]; authors: string[]; domains: string[] }> {
  const optOutPath = join(config.dataDir, 'optout.json');
  
  try {
    const data = await fs.readFile(optOutPath, 'utf8');
    return JSON.parse(data);
  } catch {
    // Return default empty config
    return { subreddits: [], authors: [], domains: [] };
  }
}

export async function applyOptOut(posts: Array<EnrichedPost & SummarizedPost>): Promise<Array<EnrichedPost & SummarizedPost>> {
  const optOut = await loadOptOutConfig();
  
  return posts.filter(post => {
    // Check subreddit opt-out
    if (optOut.subreddits.includes(post.subreddit)) {
      console.log(`⏭️  Opted out subreddit: r/${post.subreddit}`);
      return false;
    }

    // Check author opt-out
    if (optOut.authors.includes(post.author)) {
      console.log(`⏭️  Opted out author: u/${post.author}`);
      return false;
    }

    // Check domain opt-out
    if (post.normalizedUrl) {
      try {
        const url = new URL(post.normalizedUrl);
        const domain = url.hostname;
        if (optOut.domains.some(optOutDomain => domain.includes(optOutDomain))) {
          console.log(`⏭️  Opted out domain: ${domain}`);
          return false;
        }
      } catch {
        // Invalid URL, skip domain check
      }
    }

    return true;
  });
}
