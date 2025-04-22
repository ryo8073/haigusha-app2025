// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '配偶者居住権評価計算',
  description: '配偶者居住権の評価額を計算するアプリケーション',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="bg-gray-50" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}