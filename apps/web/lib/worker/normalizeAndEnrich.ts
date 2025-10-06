import { promises as fs } from 'fs';
import { join } from 'path';
import * as cheerio from 'cheerio';
import { config } from '../config';
import { normalizeUrl } from '@ctrlscroll/shared';
import { RawPostData, EnrichedPost } from '@ctrlscroll/shared';

export async function normalizeAndEnrich(rawData: RawPostData): Promise<EnrichedPost> {
  const { post, comments } = rawData;

  // Normalize URL
  const normalizedUrl = normalizeUrl(post.url);

  // Extract top comments text
  const topComments = comments
    .slice(0, 5) // Top 5 comments
    .map(comment => comment.body)
    .filter(body => body && body.length > 10);

  // Basic entity extraction (simple regex-based)
  const entities = extractEntities(post.title + ' ' + post.selftext + ' ' + topComments.join(' '));

  // Basic sentiment analysis (simple keyword-based)
  const sentimentScores = calculateSentimentScores(topComments);

  // Calculate controversy score
  const controversyScore = calculateControversy(sentimentScores);

  // Fetch external page data if it's an outbound link
  let externalTitle: string | undefined;
  let canonicalUrl: string | undefined;

  if (!post.is_self && normalizedUrl !== post.url) {
    try {
      const externalData = await fetchExternalPage(normalizedUrl);
      externalTitle = externalData.title;
      canonicalUrl = externalData.canonical;
    } catch (error) {
      console.log(`Failed to fetch external page for ${normalizedUrl}:`, error.message);
    }
  }

  return {
    id: post.id,
    title: post.title,
    url: post.url,
    normalizedUrl,
    subreddit: post.subreddit,
    author: post.author,
    createdUtc: post.created_utc,
    score: post.score,
    comments: post.num_comments,
    upvoteRatio: post.upvote_ratio,
    isNsfw: post.over_18,
    topComments,
    externalTitle,
    canonicalUrl,
    entities,
    sentimentScores,
    controversyScore
  };
}

function extractEntities(text: string): string[] {
  const entities: string[] = [];
  
  // Extract capitalized words/phrases (simple NER)
  const capitalized = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  
  // Extract common tech/company names
  const techTerms = ['AI', 'API', 'CEO', 'CTO', 'GDPR', 'GDP', 'IPO', 'NFT', 'COVID', 'NASA', 'FBI', 'CIA'];
  
  // Extract hashtags
  const hashtags = text.match(/#\w+/g) || [];
  
  // Combine and deduplicate
  const all = [...capitalized, ...techTerms, ...hashtags];
  const unique = [...new Set(all)];
  
  // Filter out common words and keep only meaningful entities
  const commonWords = ['The', 'This', 'That', 'There', 'They', 'Their', 'These', 'Those'];
  return unique
    .filter(entity => !commonWords.includes(entity))
    .filter(entity => entity.length >= 2)
    .slice(0, 10); // Limit to top 10
}

function calculateSentimentScores(comments: string[]): number[] {
  // Simple sentiment analysis using keyword counting
  const positiveWords = ['good', 'great', 'awesome', 'amazing', 'love', 'best', 'excellent', 'fantastic', 'wonderful', 'brilliant'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'stupid', 'dumb', 'idiot', 'fail'];

  return comments.map(comment => {
    const text = comment.toLowerCase();
    const positiveCount = positiveWords.reduce((count, word) => count + (text.split(word).length - 1), 0);
    const negativeCount = negativeWords.reduce((count, word) => count + (text.split(word).length - 1), 0);
    
    const total = positiveCount + negativeCount;
    if (total === 0) return 0.5; // Neutral
    
    return positiveCount / total; // 0 = very negative, 1 = very positive
  });
}

function calculateControversy(sentimentScores: number[]): number {
  if (sentimentScores.length === 0) return 0;
  
  // Calculate standard deviation of sentiment scores
  const mean = sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
  const variance = sentimentScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / sentimentScores.length;
  const stdDev = Math.sqrt(variance);
  
  // Clamp between 0 and 1
  return Math.min(Math.max(stdDev, 0), 1);
}

async function fetchExternalPage(url: string): Promise<{ title?: string; canonical?: string }> {
  try {
    // Check robots.txt first (simplified - just respect common patterns)
    if (url.includes('facebook.com') || url.includes('instagram.com') || url.includes('twitter.com')) {
      throw new Error('Robots.txt disallowed');
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CtrlScrollBot/2.0 (+https://ctrlscroll.com)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    const title = $('title').first().text().trim() ||
                  $('meta[property="og:title"]').attr('content') ||
                  $('meta[name="title"]').attr('content');

    // Extract canonical URL
    const canonical = $('link[rel="canonical"]').attr('href') ||
                     $('meta[property="og:url"]').attr('content');

    return {
      title: title ? title.substring(0, 200) : undefined,
      canonical: canonical ? normalizeUrl(canonical) : undefined
    };

  } catch (error) {
    throw new Error(`Failed to fetch external page: ${error.message}`);
  }
}

export async function processRawPosts(): Promise<EnrichedPost[]> {
  const enrichedPosts: EnrichedPost[] = [];
  const rawDir = join(config.dataDir, 'raw');

  try {
    // Get all date directories
    const dateDirs = await fs.readdir(rawDir);
    
    for (const dateDir of dateDirs) {
      const datePath = join(rawDir, dateDir);
      const stat = await fs.stat(datePath);
      
      if (!stat.isDirectory()) continue;

      // Get all post files (not comments)
      const files = await fs.readdir(datePath);
      const postFiles = files.filter(f => f.endsWith('.json') && !f.includes('.comments.json'));

      for (const postFile of postFiles) {
        try {
          const postPath = join(datePath, postFile);
          const rawData: RawPostData = JSON.parse(await fs.readFile(postPath, 'utf8'));
          
          const enriched = await normalizeAndEnrich(rawData);
          enrichedPosts.push(enriched);
          
        } catch (error) {
          console.error(`Failed to process ${postFile}:`, error);
        }
      }
    }

    console.log(`📊 Processed ${enrichedPosts.length} raw posts`);
    return enrichedPosts;

  } catch (error) {
    console.error('Failed to process raw posts:', error);
    return [];
  }
}
