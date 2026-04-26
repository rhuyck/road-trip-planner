import type { Metadata } from 'next';
import { Lora } from 'next/font/google';
import './globals.css';

const lora = Lora({ variable: '--font-serif', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Road Trip Planner 2026',
  description: 'Interactive road trip planning with Google Maps 3D',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lora.variable} h-full dark`}>
      <body className="h-full flex flex-col">{children}</body>
    </html>
  );
}
