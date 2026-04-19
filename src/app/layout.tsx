import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Road Trip Planner 2025',
  description: 'Interactive road trip planning with Google Maps 3D',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full dark`}>
      <body className="h-full flex flex-col">{children}</body>
    </html>
  );
}
