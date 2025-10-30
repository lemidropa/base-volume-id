import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import NavBar from '@/components/NavBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Base Volume ID',
  description: 'Your on-chain volume badge on Base',
  openGraph: {
    title: 'Base Volume ID',
    description: 'Track your on-chain volume across wallets on Base and onboard friends.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_BASE_URL || undefined,
    images: [
      {
        url: (process.env.NEXT_PUBLIC_BASE_URL || '') + '/api/og/demo',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Base Volume ID',
    description: 'Track your on-chain volume across wallets on Base and onboard friends.',
    images: [(process.env.NEXT_PUBLIC_BASE_URL || '') + '/api/og/demo'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <NavBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
