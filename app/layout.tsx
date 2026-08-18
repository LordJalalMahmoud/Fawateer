import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'منظومة إدارة الفواتير والمبيعات | المنظفات والمستودعات',
  description: 'نظام متكامل لإدارة فواتير المبيعات، كشوف حسابات العملاء، تتبع الديون والتحصيلات، وتحويل النصوص إلى فواتير منظمة.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
