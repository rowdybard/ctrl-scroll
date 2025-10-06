import type { Metadata } from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Ctrl+Scroll - AI-Curated Reddit News',
  description: 'AI-curated summaries from Reddit\'s top discussions',
  openGraph: {
    title: 'Ctrl+Scroll - AI-Curated Reddit News',
    description: 'AI-curated summaries from Reddit\'s top discussions',
    url: 'https://ctrlscroll.com',
    siteName: 'Ctrl+Scroll',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ctrl+Scroll - AI-Curated Reddit News',
    description: 'AI-curated summaries from Reddit\'s top discussions',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
