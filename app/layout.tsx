// app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '配偶者居住権評価計算アプリ',
  description: '配偶者居住権の評価額を計算するためのアプリケーション',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BEQ7SYMQJ3"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-BEQ7SYMQJ3');
          `}
        </Script>
      </head>
      <body className={inter.className} suppressHydrationWarning>{children}</body>
    </html>
  );
}