import type { Metadata } from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Ctrl+Scroll - AI-Curated Reddit News & Technology Insights',
  description: 'AI-powered summaries and analysis of Reddit\'s most engaging discussions. Stay informed with curated content from technology, programming, and trending topics.',
  keywords: [
    'Reddit news',
    'AI summaries',
    'technology insights',
    'programming discussions',
    'tech news',
    'Reddit analysis',
    'AI curation',
    'technology trends',
    'developer news',
    'startup insights'
  ],
  authors: [{ name: 'Ctrl+Scroll' }],
  creator: 'Ctrl+Scroll',
  publisher: 'Ctrl+Scroll',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_API_ORIGIN || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': '/v1/rss.xml',
      'application/json': '/v1/feed.json',
    },
  },
  openGraph: {
    title: 'Ctrl+Scroll - AI-Curated Reddit News & Technology Insights',
    description: 'AI-powered summaries and analysis of Reddit\'s most engaging discussions. Stay informed with curated content from technology, programming, and trending topics.',
    url: '/',
    siteName: 'Ctrl+Scroll',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ctrl+Scroll - AI-Curated Reddit News',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ctrl+Scroll - AI-Curated Reddit News & Technology Insights',
    description: 'AI-powered summaries and analysis of Reddit\'s most engaging discussions.',
    creator: '@ctrlscroll',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="dark" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://reddit.com" />
        <link rel="preconnect" href="https://www.reddit.com" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Ctrl+Scroll",
              "url": process.env.NEXT_PUBLIC_API_ORIGIN || 'http://localhost:3000',
              "description": "AI-powered summaries and analysis of Reddit's most engaging discussions",
              "publisher": {
                "@type": "Organization",
                "name": "Ctrl+Scroll"
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${process.env.NEXT_PUBLIC_API_ORIGIN || 'http://localhost:3000'}/v1/posts?topic={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className="min-h-screen bg-black text-white font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
