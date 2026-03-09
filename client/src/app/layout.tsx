import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Note Maker - AI Mind Capture',
  description: 'Voice-first AI notes, tasks, and goals tracker.',
  themeColor: '#09090b',
  appleWebApp: {
    capable: true,
    title: 'Note Maker',
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-50 min-h-screen selection:bg-zinc-800`}>
        {children}
        <Toaster theme="dark" position="bottom-center" />
      </body>
    </html>
  );
}
