import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ArticleLayoutF from '@/components/ArticleLayoutF';
import ImpressionsBeacon from '@/components/ImpressionsBeacon';
import { getPost, getRelated, getNeighbors, mapToArticleSource, trackEvent } from '@/lib/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const post = await getPost(id);
    
    return {
      title: post.title,
      description: post.micro,
      openGraph: {
        title: post.title,
        description: post.micro,
        type: 'article',
        publishedTime: new Date(post.createdUtc * 1000).toISOString(),
        authors: post.subreddit ? [`r/${post.subreddit}`] : undefined,
        tags: post.tags,
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.micro,
      },
    };
  } catch {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.',
    };
  }
}

export default async function PostPage({ params }: PageProps) {
  try {
    const { id } = await params;
    
    // Fetch post data
    const post = await getPost(id);
    
    // Map to ArticleSource format
    const article = mapToArticleSource(post);
    
    // Fetch related posts and neighbors
    const [related, neighbors] = await Promise.all([
      getRelated(post.subreddit || 'technology', 6),
      getNeighbors(id)
    ]);
    
    // Track click events handler
    const handleTrackClick = async (postId: string, variant: string, event: 'click') => {
      try {
        await trackEvent(postId, variant as 'F' | 'A' | 'B' | 'C', event);
      } catch (error) {
        console.warn('Failed to track click:', error);
      }
    };

    return (
      <>
        {/* Impression tracking beacon */}
        <ImpressionsBeacon postId={id} variant="F" />
        
        {/* Main article layout */}
        <ArticleLayoutF
          article={article}
          related={related}
          prevNeighbor={neighbors.prev}
          nextNeighbor={neighbors.next}
          onTrackClick={handleTrackClick}
        />
        
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              "headline": post.title,
              "description": post.micro,
              "datePublished": new Date(post.createdUtc * 1000).toISOString(),
              "dateModified": new Date(post.publishedAt).toISOString(),
              "author": {
                "@type": "Organization",
                "name": post.subreddit ? `r/${post.subreddit}` : "Ctrl+Scroll"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Ctrl+Scroll",
                "url": process.env.NEXT_PUBLIC_API_ORIGIN || ''
              },
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `${process.env.NEXT_PUBLIC_API_ORIGIN || ''}/post/${id}`
              },
              "articleSection": post.subreddit,
              "keywords": post.tags?.join(', '),
              ...(post.originalUrl && {
                "url": post.originalUrl
              })
            })
          }}
        />
      </>
    );
  } catch (error) {
    console.error('Error loading post:', error);
    notFound();
  }
}