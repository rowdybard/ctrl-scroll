'use client';

import { useEffect, useRef } from 'react';

interface ImpressionsBeaconProps {
  postId: string;
  variant?: 'F' | 'A' | 'B' | 'C';
}

export default function ImpressionsBeacon({ postId, variant = 'F' }: ImpressionsBeaconProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    
    const trackImpression = async () => {
      try {
        const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN || '';
        const response = await fetch(`${apiOrigin}/v1/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId,
            variant,
            event: 'impression'
          }),
        });

        if (response.ok) {
          hasTracked.current = true;
          console.log('Impression tracked:', { postId, variant, event: 'impression' });
        } else {
          console.warn('Failed to track impression:', response.status);
        }
      } catch (error) {
        console.error('Error tracking impression:', error);
      }
    };

    // Debounce to ensure single fire
    const timeoutId = setTimeout(trackImpression, 1000);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [postId, variant]);

  // This component doesn't render anything
  return null;
}
