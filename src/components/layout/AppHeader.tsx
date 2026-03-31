"use client";

import { useAuth } from "@/context/AuthContext";
import SyncIndicator from "./SyncIndicator";
import { Menu, Bell, Search, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

// ─── خريطة عناوين الصفحات ────────────────────────────────

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/app": { title: "لوحة التحكم", subtitle: "نظرة عامة على المدرسة" },
  "/app/students": { title: "إدارة الطلاب", subtitle: "كل طلاب مدرستك" },
  "/app/sessions": { title: "الحصص اليومية", subtitle: "تسجيل وإدارة الحصص" },
  "/app/quran": { title: "متابعة الحفظ", subtitle: "تتبع تقدم حفظ القرآن" },
  "/app/covenants": { title: "العهود والعقوبات", subtitle: "إدارة الالتزام والانضباط" },
  "/app/reports": { title: "التقارير اليومية", subtitle: "تقارير المعلمين والإدارة" },
  "/app/student-history": { title: "سجل الطالب", subtitle: "التاريخ الكامل لكل طالب" },
  "/app/notifications": { title: "مركز الإشعارات", subtitle: "تنبيهات وإشعارات النظام" },
  "/app/communication": { title: "قناة التواصل", subtitle: "التواصل مع أولياء الأمور" },
  "/app/points": { title: "نظام النقاط", subtitle: "مكافآت وترتيب الطلاب" },
  "/app/ranking": { title: "ترتيب الطلاب", subtitle: "لوحة الشرف الأسبوعية" },
  "/app/dues": { title: "الاشتراكات الفصلية", subtitle: "متابعة الرسوم والمدفوعات" },
  "/app/registrations": { title: "التسجيلات الجديدة", subtitle: "قائمة انتظار الطلاب الجدد" },
  "/app/meetings": { title: "الاجتماعات", subtitle: "محاضر وقرارات الاجتماعات" },
  "/app/occasions": { title: "المناسبات الدينية", subtitle: "الأحداث والمناسبات الإسلامية" },
  "/app/updates": { title: "تحديثات النظام", subtitle: "آخر تحديثات المنصة" },
  "/app/profile": { title: "الملف الشخصي", subtitle: "بياناتك الشخصية" },
  "/app/settings": { title: "إعدادات المدرسة", subtitle: "تخصيص وإعداد النظام" },
};

function getPageInfo(pathname: string) {
  // تطابق دقيق أولاً
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // تطابق جزئي (مسارات فرعية)
  for (const [key, val] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(key) && key !== "/app") return val;
  }
  return { title: "لوحة التحكم", subtitle: "" };
}

// ─── Props ────────────────────────────────────────────────

interface AppHeaderProps {
  onMenuToggle: () => void;
}

// ─── المكوّن ──────────────────────────────────────────────

export default function AppHeader({ onMenuToggle }: AppHeaderProps) {
  const { user, school } = useAuth();
  const pathname = usePathname();
  const pageInfo = getPageInfo(pathname);

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-[var(--color-border)] px-4 sm:px-6">
      <div className="flex items-center justify-between h-16 gap-4">

        {/* Right: Menu toggle + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile menu button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors shrink-0"
            aria-label="القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="min-w-0"
          >
            <h1
              className="text-base font-black text-gray-900 leading-tight truncate"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              {pageInfo.title}
            </h1>
            {pageInfo.subtitle && (
              <p className="text-xs text-gray-400 font-medium hidden sm:block">
                {pageInfo.subtitle}
              </p>
            )}
          </motion.div>
        </div>

        {/* Left: Actions */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Sync indicator */}
          <SyncIndicator />

          {/* Notifications */}
          <button
            className="relative w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
            aria-label="الإشعارات"
          >
            <Bell className="w-4.5 h-4.5" />
            {/* badge */}
            <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Public site link */}
          <Link
            href="/"
            className="hidden sm:flex w-9 h-9 rounded-xl bg-gray-100 items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
            title="الواجهة العامة"
          >
            <Home className="w-4 h-4" />
          </Link>

          {/* User avatar */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white font-black text-sm cursor-pointer hover:opacity-90 transition-opacity shadow-sm">
            {user?.displayName?.[0] ?? "م"}
          </div>
        </div>
      </div>
    </header>
  );
}
