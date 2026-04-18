import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "منصة فرسان القرآن | نظام إدارة المدارس القرآنية",
  description:
    "منصة فرسان القرآن — منصة رقمية متكاملة لإدارة المدارس القرآنية، تتبّع الحفظ، إدارة الطلاب، التقارير، والتواصل مع الأولياء، كل ذلك في مكان واحد.",
  keywords: "فرسان القرآن، مدارس قرآنية، تحفيظ القرآن، إدارة الحلقات، نظام إدارة",
  authors: [{ name: "منصة فرسان القرآن" }],
  openGraph: {
    title: "منصة فرسان القرآن - لإدارة المدارس القرآنية",
    description: "نظام متكامل لإدارة المدارس القرآنية",
    type: "website",
    locale: "ar_DZ",
  },
};

// سكريبت الثيم المُضمَّن مباشرةً في HTML قبل أي React hydration
// يمنع الوميض (flash) عند تحميل الصفحة
const themeScript = `(function(){try{var t=localStorage.getItem('qsp-theme');if(t==='dark'){document.documentElement.classList.add('dark')}else if(!t){if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark')}}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* تطبيق الثيم قبل أي render لمنع الوميض — strategy: beforeInteractive */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          // suppressHydrationWarning يمنع خطأ React 19 مع dangerouslySetInnerHTML
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />

        {/* ─── PWA Meta Tags ─── */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16a34a" />
        <meta name="application-name" content="فرسان القرآن" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="فرسان القرآن" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
