import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "منصة المدارس القرآنية | نظام إدارة الحلقات",
  description:
    "منصة رقمية متكاملة لإدارة المدارس القرآنية — تتبّع الحفظ، إدارة الطلاب، التقارير، والتواصل مع الأولياء، كل ذلك في مكان واحد.",
  keywords: "مدارس قرآنية، تحفيظ القرآن، إدارة الحلقات، نظام إدارة",
  authors: [{ name: "منصة المدارس القرآنية" }],
  openGraph: {
    title: "منصة المدارس القرآنية",
    description: "نظام متكامل لإدارة المدارس القرآنية",
    type: "website",
    locale: "ar_DZ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

