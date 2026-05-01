import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IPO 动态监控｜A 股 / H 股 拟发行公司',
  description:
    '汇总沪深北交易所与港交所公开披露的拟发行公司审核进度，每日自动更新。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
