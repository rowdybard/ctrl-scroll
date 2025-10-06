'use client';

import Link from 'next/link';
import { useState } from 'react';

export type ArticleSource = {
  id: string;
  title: string;          // pick winning headline or alt[0] if not set
  micro: string;          // 1-sentence lead
  bullets?: string[];     // 3–5 bullets
  created_utc: number;
  subreddit?: string;
  author?: string;
  heroImage?: string;     // optional OG or external
  tags?: string[];
  sources?: { label: string; url: string }[];
  content?: string[];     // optional paragraphs if available
  images?: {
    hero: {
      url: string;
      prompt: string;
      localPath: string;
    };
    context?: {
      url: string;
      prompt: string;
      localPath: string;
    };
  };
  richContext?: {
    background: string;
    keyPoints: string[];
    relatedTopics: string[];
    timeline?: string[];
  };
};

export type RelatedItem = { 
  id: string; 
  title: string; 
  href: string;
  micro?: string;
  subreddit?: string;
};

export type Neighbor = { 
  id: string; 
  title: string; 
  href: string 
} | null;

interface ArticleLayoutFProps {
  article: ArticleSource;
  related: RelatedItem[];
  prevNeighbor: Neighbor;
  nextNeighbor: Neighbor;
  onTrackClick: (postId: string, variant: string, event: 'click') => void;
}

export default function ArticleLayoutF({ 
  article, 
  related, 
  prevNeighbor, 
  nextNeighbor,
  onTrackClick 
}: ArticleLayoutFProps) {
  const [heroImageError, setHeroImageError] = useState(false);
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSectionLabel = () => {
    if (article.tags?.includes('investigation')) return 'Investigation';
    if (article.tags?.includes('analysis')) return 'Analysis';
    if (article.subreddit === 'technology') return 'Technology';
    if (article.subreddit === 'programming') return 'Programming';
    return 'Article';
  };

  const handleRelatedClick = (item: RelatedItem) => {
    onTrackClick(article.id, 'F', 'click');
  };

  const handleNeighborClick = (neighbor: Neighbor) => {
    if (neighbor) {
      onTrackClick(article.id, 'F', 'click');
    }
  };

  const heroImageUrl = article.images?.hero 
    ? `/api/images/${article.images.hero.localPath.split('/').pop()}`
    : article.heroImage;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-4 max-w-7xl mx-auto px-4 py-8">
        
        {/* Main Content */}
        <main className="col-span-12 md:col-span-8 space-y-6">
          
          {/* Header Block */}
          <header className="space-y-4">
            <div className="text-sm font-medium text-white/60 uppercase tracking-wide">
              {getSectionLabel()}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              {article.title}
            </h1>
            <div className="text-xl text-white/80 leading-relaxed">
              {article.micro}
            </div>
          </header>

          {/* Hero Section */}
          <div className="aspect-[2/1] rounded-2xl bg-neutral-800/70 overflow-hidden">
            {heroImageUrl && !heroImageError ? (
              <img
                src={heroImageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
                onError={() => setHeroImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                <div className="text-center text-white/40">
                  <div className="text-4xl mb-2">📰</div>
                  <div className="text-sm">No image available</div>
                </div>
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="space-y-6">
            {article.content && article.content.length > 0 ? (
              /* Paragraphs */
              <div className="prose prose-lg prose-invert max-w-none">
                {article.content.map((paragraph, index) => (
                  <p key={index} className="leading-relaxed mb-4 text-white/90">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : article.bullets && article.bullets.length > 0 ? (
              /* Bullets as Facts List */
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-white">Key Facts</h2>
                <ul className="space-y-3">
                  {article.bullets.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-white/60 mt-2 flex-shrink-0" />
                      <span className="text-white/90 leading-relaxed">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Rich Context */}
            {article.richContext && (
              <div className="rounded-2xl bg-neutral-900 border border-white/5 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Background</h3>
                <p className="text-white/80 leading-relaxed mb-4">
                  {article.richContext.background}
                </p>
                
                {article.richContext.keyPoints && article.richContext.keyPoints.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-white mb-2">Key Developments</h4>
                    <ul className="space-y-2">
                      {article.richContext.keyPoints.map((point, index) => (
                        <li key={index} className="text-white/70 text-sm leading-relaxed">
                          • {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Prev/Next Navigation */}
          <div className="flex justify-between items-center pt-6 border-t border-white/10">
            <div className="flex-1">
              {prevNeighbor ? (
                <Link
                  href={prevNeighbor.href}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  onClick={() => handleNeighborClick(prevNeighbor)}
                >
                  <span>←</span>
                  <div className="text-left">
                    <div className="text-xs text-white/60">Previous</div>
                    <div className="text-sm font-medium truncate max-w-48">
                      {prevNeighbor.title}
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="px-4 py-2 text-white/40 text-sm">
                  No previous article
                </div>
              )}
            </div>
            
            <div className="flex-1 text-right">
              {nextNeighbor ? (
                <Link
                  href={nextNeighbor.href}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors ml-auto"
                  onClick={() => handleNeighborClick(nextNeighbor)}
                >
                  <div className="text-right">
                    <div className="text-xs text-white/60">Next</div>
                    <div className="text-sm font-medium truncate max-w-48">
                      {nextNeighbor.title}
                    </div>
                  </div>
                  <span>→</span>
                </Link>
              ) : (
                <div className="px-4 py-2 text-white/40 text-sm">
                  No next article
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Rail */}
        <aside className="col-span-12 md:col-span-4 space-y-6">
          
          {/* Related Articles */}
          {related.length > 0 && (
            <div className="rounded-2xl bg-neutral-900 border border-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Related</h3>
              <div className="space-y-4">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block group"
                    onClick={() => handleRelatedClick(item)}
                  >
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-white group-hover:text-white/80 transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                      {item.micro && (
                        <p className="text-xs text-white/60 line-clamp-2">
                          {item.micro}
                        </p>
                      )}
                      {item.subreddit && (
                        <div className="text-xs text-white/40">
                          r/{item.subreddit}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Author & Topic */}
          <div className="rounded-2xl bg-neutral-900 border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
            <div className="space-y-3">
              {article.author && (
                <div>
                  <div className="text-xs text-white/60 mb-1">Author</div>
                  <div className="text-sm text-white">u/{article.author}</div>
                </div>
              )}
              {article.subreddit && (
                <div>
                  <div className="text-xs text-white/60 mb-1">Community</div>
                  <div className="text-sm text-white">r/{article.subreddit}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-white/60 mb-1">Published</div>
                <div className="text-sm text-white">{formatDate(article.created_utc)}</div>
              </div>
              {article.tags && article.tags.length > 0 && (
                <div>
                  <div className="text-xs text-white/60 mb-2">Topics</div>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.slice(0, 6).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded-lg bg-white/10 text-xs text-white/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Attribution */}
      {article.sources && article.sources.length > 0 && (
        <footer className="border-t border-white/10 bg-neutral-950/50">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="text-sm text-white/60 mb-2">Sources</div>
            <div className="flex flex-wrap gap-4">
              {article.sources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/80 hover:text-white transition-colors"
                  onClick={() => onTrackClick(article.id, 'F', 'click')}
                >
                  {source.label}
                </a>
              ))}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
