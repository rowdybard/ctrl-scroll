import { EnrichedPost, SummarizedPost } from '@ctrlscroll/shared';

export async function summarizePost(post: EnrichedPost): Promise<SummarizedPost> {
  // For now, implement simple summarization without external AI
  // In production, this would call OpenAI/Claude API
  
  const micro = generateMicroSummary(post);
  const bullets = generateBullets(post);
  const headlines = generateHeadlines(post);

  return {
    id: post.id,
    micro,
    bullets,
    headlines
  };
}

function generateMicroSummary(post: EnrichedPost): string {
  // Preserve existing 1-sentence summary if available, otherwise generate
  const title = post.title;
  const subreddit = post.subreddit;
  
  // Simple template-based micro summary
  if (post.externalTitle) {
    return `${post.externalTitle.substring(0, 80)} from r/${subreddit}.`;
  }
  
  return `${title.substring(0, 80)} discussed in r/${subreddit}.`;
}

function generateBullets(post: EnrichedPost): string[] {
  const bullets: string[] = [];
  
  // Extract key points from comments
  const topComments = post.topComments.slice(0, 3);
  
  for (const comment of topComments) {
    // Simple extraction of first sentence or key phrase
    const sentences = comment.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
      let bullet = sentences[0].trim().substring(0, 100);
      if (bullet.length < comment.length) bullet += '...';
      bullets.push(bullet);
    }
  }
  
  // Add metadata bullets if needed
  if (bullets.length < 3) {
    if (post.score > 1000) {
      bullets.push(`High engagement with ${post.score} upvotes and ${post.comments} comments.`);
    }
    if (post.entities.length > 0) {
      bullets.push(`Topics include: ${post.entities.slice(0, 3).join(', ')}.`);
    }
  }
  
  return bullets.slice(0, 5);
}

function generateHeadlines(post: EnrichedPost): { A: string; B: string; C: string } {
  const title = post.title;
  const subreddit = post.subreddit;
  
  // A: Straight fact
  const headlineA = title.length > 65 ? title.substring(0, 62) + '...' : title;
  
  // B: Ethical curiosity
  const headlineB = `What ${subreddit} thinks about: ${title.substring(0, 40)}...`;
  
  // C: Action/outcome
  const headlineC = `Reddit discusses: ${title.substring(0, 45)}...`;
  
  return {
    A: headlineA.length > 65 ? headlineA.substring(0, 62) + '...' : headlineA,
    B: headlineB.length > 65 ? headlineB.substring(0, 62) + '...' : headlineB,
    C: headlineC.length > 65 ? headlineC.substring(0, 62) + '...' : headlineC
  };
}

export async function summarizePosts(posts: EnrichedPost[]): Promise<SummarizedPost[]> {
  const summarized: SummarizedPost[] = [];
  
  for (const post of posts) {
    try {
      const summary = await summarizePost(post);
      summarized.push(summary);
    } catch (error) {
      console.error(`Failed to summarize post ${post.id}:`, error);
    }
  }
  
  console.log(`📝 Summarized ${summarized.length}/${posts.length} posts`);
  return summarized;
}
