import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { ClerkProvider } from '@clerk/nextjs';

import { Toaster } from '@/components/ui/sonner';
import { TRPCReactProvider } from '@/trpc/client';
import { TooltipProvider } from '@/components/ui/tooltip';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'YouTube',
  description:
    'A YouTube clone built with Next.js, Clerk, tRPC, and Tailwind CSS.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TRPCReactProvider>
          <ClerkProvider afterSignOutUrl="/">
            <TooltipProvider>
              <Toaster />
              {children}
            </TooltipProvider>
          </ClerkProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
