'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { trackClick } from '@/lib/ab';

interface PostDetail {
  id: string;
  title: string;
  micro: string;
  bullets: string[];
  createdUtc: number;
  subreddit: string;
  score: number;
  tags: string[];
  permalink: string;
  originalUrl?: string;
  externalTitle?: string;
  publishedAt: string;
  headlines: {
    A: string;
    B: string;
    C: string;
  };
}

export default function PostPage() {
  const params = useParams();
  const postId = params.id as string;
  
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`/api/v1/posts/${postId}`);
        if (!response.ok) {
          throw new Error('Post not found');
        }
        const data = await response.json();
        setPost(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isRecent = (timestamp: number) => {
    const now = Date.now() / 1000;
    return (now - timestamp) < 15 * 60; // 15 minutes
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Post Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested post could not be found.'}</p>
          <a href="/" className="btn btn-primary">← Back to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <a href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700">
            ← Back to Ctrl+Scroll
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Post Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="badge badge-reddit">r/{post.subreddit}</span>
              {isRecent(post.createdUtc) && (
                <span className="badge badge-live">LIVE</span>
              )}
              <span className="text-sm text-gray-500">
                {post.score} upvotes
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {post.title}
            </h1>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
              <span>Posted {formatDate(post.createdUtc)}</span>
              <span>•</span>
              <span>Published {new Date(post.publishedAt).toLocaleDateString()}</span>
            </div>
          </header>

          {/* Summary */}
          <div className="prose prose-lg max-w-none mb-8">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <p className="text-blue-900 font-medium m-0">{post.micro}</p>
            </div>
            
            {post.bullets.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Points:</h3>
                <ul className="list-none space-y-2">
                  {post.bullets.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-gray-700">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Topics:</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span key={index} className="badge bg-gray-100 text-gray-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Attribution */}
          <footer className="border-t pt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Sources:</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Reddit post:</span>{' '}
                  <a 
                    href={`https://reddit.com/r/${post.subreddit}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                    onClick={() => trackClick(post.id, 'A')}
                  >
                    r/{post.subreddit}
                  </a>
                </div>
                
                {post.originalUrl && (
                  <div>
                    <span className="text-gray-600">Original link:</span>{' '}
                    <a 
                      href={post.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                      onClick={() => trackClick(post.id, 'B')}
                    >
                      {post.externalTitle || 'View original'}
                    </a>
                  </div>
                )}
              </div>
              
              <div className="mt-3 text-xs text-gray-500">
                Content summarized by Ctrl+Scroll • Reddit attribution required
              </div>
            </div>
          </footer>
        </article>

        {/* Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              "headline": post.title,
              "description": post.micro,
              "datePublished": new Date(post.createdUtc * 1000).toISOString(),
              "dateModified": post.publishedAt,
              "author": {
                "@type": "Organization",
                "name": `r/${post.subreddit}`
              },
              "publisher": {
                "@type": "Organization",
                "name": "Ctrl+Scroll",
                "url": "https://ctrlscroll.com"
              },
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://ctrlscroll.com${post.permalink}`
              }
            })
          }}
        />
      </main>
    </div>
  );
}
