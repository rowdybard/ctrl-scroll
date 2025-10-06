'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { trackClick } from '../lib/ab';

interface Post {
  id: string;
  title: string;
  micro: string;
  createdUtc: number;
  subreddit: string;
  score: number;
  tags: string[];
  permalink: string;
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
}

interface PostCardProps {
  post: Post;
  index: number;
  variant: 'A' | 'B' | 'C';
  onImpression: () => void;
}

export default function PostCard({ post, index, variant, onImpression }: PostCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            hasTracked.current = true;
            onImpression();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [onImpression]);

  const formatDate = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 3600) { // Less than 1 hour
      const minutes = Math.floor(diff / 60);
      return `${minutes}m ago`;
    } else if (diff < 86400) { // Less than 1 day
      const hours = Math.floor(diff / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diff / 86400);
      return `${days}d ago`;
    }
  };

  const isRecent = (timestamp: number) => {
    const now = Date.now() / 1000;
    return (now - timestamp) < 15 * 60; // 15 minutes
  };

  const heroImage = post.images?.hero;

  return (
    <div ref={cardRef} className="card hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Hero Image */}
      {heroImage && (
        <div className="relative h-48 w-full overflow-hidden">
          <img 
            src={`/api/images/${heroImage.localPath.split('/').pop()}`}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-3 left-3">
            <span className="badge badge-reddit">r/{post.subreddit}</span>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          {!heroImage && (
            <div className="flex items-center gap-2">
              <span className="badge badge-reddit">r/{post.subreddit}</span>
              {isRecent(post.createdUtc) && (
                <span className="badge badge-live">LIVE</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{post.score} ↑</span>
            <span>•</span>
            <span>{formatDate(post.createdUtc)}</span>
          </div>
        </div>

        <Link 
        href={post.permalink}
        className="block group"
        onClick={() => trackClick(post.id, variant)}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
          {post.title}
        </h2>
        
        <p className="text-gray-600 mb-4 line-clamp-2">
          {post.micro}
        </p>
      </Link>

      {/* Rich Context Preview */}
      {post.richContext?.background && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 line-clamp-2">
            {post.richContext.background}
          </p>
        </div>
      )}

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {post.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="badge bg-gray-100 text-gray-700 text-xs">
              {tag}
            </span>
          ))}
          {post.tags.length > 3 && (
            <span className="badge bg-gray-100 text-gray-700 text-xs">
              +{post.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link 
          href={post.permalink}
          className="btn btn-primary text-sm"
          onClick={() => trackClick(post.id, variant)}
        >
          Read More
        </Link>
        
        <div className="text-xs text-gray-400">
          Variant {variant}
        </div>
        </div>
      </div>
    </div>
  );
}
