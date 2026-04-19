"use client";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useSound } from "@/context/SoundContext";
import SyncIndicator from "./SyncIndicator";
import { Menu, Bell, Home, Moon, Sun, Volume2, VolumeX } from "lucide-react";
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
  "/app/notifications": { title: "مركز الإشعارات", subtitle: "تنبيهات النظام والمتابعة" },
  "/app/settings/backup": { title: "النسخ الاحتياطي", subtitle: "تصدير واستيراد بيانات المدرسة" },
  "/app/settings/features": { title: "تخصيص الواجهة", subtitle: "اختر الصفحات التي تظهر في الشريط الجانبي" },
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
  "/app/guide": { title: "دليل المنصة", subtitle: "تعرّف على كيفية استخدام المنصة" },
  "/app/teachers": { title: "أفواج المدرسة", subtitle: "إدارة الفصول والمعلمين" },
  "/app/schools-admin": { title: "المدارس المسجلة", subtitle: "كل المدارس في المنصة" },
  "/app/school-requests": { title: "طلبات التسجيل", subtitle: "مراجعة طلبات المدارس الجديدة" },
};

function getPageInfo(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [key, val] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(key) && key !== "/app") return val;
  }
  return { title: "لوحة التحكم", subtitle: "" };
}

// ─── تحية ديناميكية ────────────────────────────────────────
function getGreeting(name?: string | null): string {
  const hour = new Date().getHours();
  const firstName = name?.split(" ")[0] ?? "";
  if (hour < 12) return `صباح الخير${firstName ? `، ${firstName}` : ""}`;
  if (hour < 17) return `مساء الخير${firstName ? `، ${firstName}` : ""}`;
  return `مساء النور${firstName ? `، ${firstName}` : ""}`;
}

// ─── Props ────────────────────────────────────────────────

interface AppHeaderProps {
  onMenuToggle: () => void;
}

// ─── المكوّن ──────────────────────────────────────────────

export default function AppHeader({ onMenuToggle }: AppHeaderProps) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { enabled: soundEnabled, toggle: toggleSound } = useSound();
  const pathname = usePathname();
  const pageInfo = getPageInfo(pathname);
  const isHome = pathname === "/app";

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#13161f]/90 backdrop-blur-xl border-b border-[var(--color-border)] dark:border-white/8 px-4 sm:px-6 transition-colors duration-300">
      <div className="flex items-center justify-between h-16 gap-4">

        {/* Right: Menu toggle + Title */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile menu button */}
          <button
            id="mobile-menu-btn"
            onClick={onMenuToggle}
            className="lg:hidden w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label="القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title / Greeting */}
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="min-w-0"
          >
            <h1
              className="text-base font-black text-gray-900 dark:text-white leading-tight truncate"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              {isHome ? getGreeting(user?.displayName) : pageInfo.title}
            </h1>
            {pageInfo.subtitle && !isHome && (
              <p className="text-xs text-[var(--color-muted-foreground)] font-medium hidden sm:block">
                {pageInfo.subtitle}
              </p>
            )}
            {isHome && (
              <p className="text-xs text-[var(--color-muted-foreground)] font-medium hidden sm:block">
                {pageInfo.subtitle}
              </p>
            )}
          </motion.div>
        </div>

        {/* Left: Actions */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Sync indicator */}
          <SyncIndicator />

          {/* Dark mode toggle */}
          <button
            id="header-theme-toggle"
            onClick={toggleTheme}
            title={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {isDark
              ? <Sun className="w-4.5 h-4.5 text-amber-400" />
              : <Moon className="w-4.5 h-4.5 text-indigo-500" />
            }
          </button>

          {/* Sound toggle */}
          <button
            id="header-sound-toggle"
            onClick={toggleSound}
            title={soundEnabled ? "كتم الأصوات" : "تفعيل الأصوات"}
            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {soundEnabled
              ? <Volume2 className="w-4 h-4 text-emerald-500" />
              : <VolumeX className="w-4 h-4 text-gray-400" />
            }
          </button>

          {/* Notifications */}
          <Link
            href="/app/notifications"
            id="notifications-btn"
            className="relative w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label="الإشعارات"
            title="مركز الإشعارات"
          >
            <Bell className="w-4.5 h-4.5" />
            {pathname !== "/app/notifications" && (
              <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#13161f]" />
            )}
          </Link>

          {/* Public site link */}
          <Link
            href="/"
            className="hidden sm:flex w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="الواجهة العامة"
          >
            <Home className="w-4 h-4" />
          </Link>

          {/* User avatar */}
          <Link
            href="/app/profile"
            id="user-avatar-btn"
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white font-black text-sm hover:opacity-90 transition-opacity shadow-sm"
            title="الملف الشخصي"
          >
            {user?.displayName?.[0] ?? "م"}
          </Link>
        </div>
      </div>
    </header>
  );
}
