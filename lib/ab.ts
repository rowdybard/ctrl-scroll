// Simple A/B testing utilities

export type Variant = 'A' | 'B' | 'C';

// Assign variant based on post ID (deterministic)
export function assignVariant(postId: string): Variant {
  // Simple hash function to get consistent variant per post
  let hash = 0;
  for (let i = 0; i < postId.length; i++) {
    const char = postId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Map to A, B, or C variants
  const variantIndex = Math.abs(hash) % 3;
  return ['A', 'B', 'C'][variantIndex] as Variant;
}

// Track impression event
export async function trackImpression(postId: string, variant: Variant) {
  try {
    await fetch('/api/v1/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId,
        variant,
        event: 'impression'
      })
    });
  } catch (error) {
    console.error('Failed to track impression:', error);
  }
}

// Track click event
export async function trackClick(postId: string, variant: Variant) {
  try {
    await fetch('/api/v1/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId,
        variant,
        event: 'click'
      })
    });
  } catch (error) {
    console.error('Failed to track click:', error);
  }
}
