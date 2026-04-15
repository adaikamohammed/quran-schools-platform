"use client";

import React, { useState, useEffect } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  BookOpen,
  Users,
  ClipboardList,
  BarChart3,
  BookCheck,
  DollarSign,
  UserPlus,
  Calendar,
  Settings,
  ChevronDown,
  LayoutDashboard,
  Trophy,
  FileText,
  Award,
  LogOut,
  X,
  Gavel,
  UserCog,
  Globe,
  Activity,
  Building2,
  ShieldCheck,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  ScrollText,
  FolderOpen,
  Bell,
} from "lucide-react";

// ─── تعريف التنقل ──────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  featureKey?: string; // مفتاح الميزة للتخصيص
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// ── الميزات المتاحة في الوضع البسيط ─────────────────────────
export const SIMPLE_MODE_KEYS = new Set([
  "dashboard", "sessions", "students", "quran", "registrations",
  "profile", "settings", "backup", "features", "certificates", "annual_report"
]);

// ── روابط المدرسة (معلم / مدير مدرسة) ──────────────────────
const SCHOOL_NAV_GROUPS: NavGroup[] = [
  {
    title: "الميدان التربوي",
    items: [
      { href: "/app",           label: "لوحة التحكم",       icon: LayoutDashboard, featureKey: "dashboard" },
      { href: "/app/guide",     label: "دليل المنصة",       icon: Trophy,          featureKey: "guide",        badge: "خريطة" },
      { href: "/app/sessions",  label: "الحصص اليومية",    icon: ClipboardList,   featureKey: "sessions" },
      { href: "/app/timetable", label: "جدول الحصص",       icon: Calendar,        featureKey: "timetable" },
      { href: "/app/students",  label: "إدارة الطلاب",      icon: Users,           featureKey: "students" },
      { href: "/app/quran",     label: "متابعة الحفظ",      icon: BookCheck,       featureKey: "quran" },
      { href: "/app/covenants", label: "العهود والعقوبات",  icon: Gavel,           featureKey: "covenants" },
    ],
  },
  {
    title: "بوصلة المتابعة",
    items: [
      { href: "/app/notifications",   label: "الإشعارات",         icon: Bell,      featureKey: "notifications" },
      { href: "/app/reports",         label: "التقارير اليومية",  icon: FileText,  featureKey: "reports" },
      { href: "/app/student-history", label: "سجل الطالب",        icon: BarChart3, featureKey: "student_history" },
      { href: "/app/performance",     label: "لوحة الأداء",       icon: Activity,  featureKey: "performance" },
      { href: "/app/annual-report",   label: "التقرير السنوي",    icon: FileText,  featureKey: "annual_report", badge: "PDF" },
    ],
  },
  {
    title: "سباق التميز",
    items: [
      { href: "/app/points", label: "نظام النقاط", icon: Award, featureKey: "points" },
    ],
  },
  {
    title: "الإدارة",
    items: [
      { href: "/app/teachers",          label: "أفواج المدرسة",       icon: Users,       featureKey: "teachers" },
      { href: "/app/sheikh-monitoring", label: "مراقبة المشايخ",      icon: ShieldCheck, featureKey: "sheikh_monitoring" },
      { href: "/app/dues",              label: "الاشتراكات الفصلية",  icon: DollarSign,  featureKey: "dues" },
      { href: "/app/registrations",     label: "التسجيلات الجديدة",   icon: UserPlus,    featureKey: "registrations" },
      { href: "/app/meetings",          label: "الاجتماعات والمناسبات", icon: Calendar,  featureKey: "meetings" },
      { href: "/app/camp",              label: "مستلزمات المخيم",     icon: FolderOpen,  featureKey: "camp",  badge: "جديد" },
      { href: "/app/documents",         label: "مركز الوثائق",        icon: FolderOpen,  featureKey: "documents" },
      { href: "/app/certificates",      label: "نظام الشهادات",        icon: Award,       featureKey: "certificates", badge: "جديد" },
      { href: "/app/logs",              label: "سجل النشاطات",        icon: ScrollText,  featureKey: "logs" },
    ],
  },
  {
    title: "الإعدادات",
    items: [
      { href: "/app/profile",           label: "الملف الشخصي",   icon: UserCog,    featureKey: "profile" },
      { href: "/app/settings",          label: "إعدادات المدرسة", icon: Settings,   featureKey: "settings" },
      { href: "/app/settings/features", label: "تخصيص الواجهة",  icon: FolderOpen, featureKey: "features" },
      { href: "/app/settings/backup",   label: "النسخ الاحتياطي", icon: FolderOpen, featureKey: "backup" },
    ],
  },
];

// ── روابط إدارة المنصة (super_admin فقط) ───────────────────
const PLATFORM_NAV_GROUPS: NavGroup[] = [
  {
    title: "مركز التحكم",
    items: [
      { href: "/app", label: "لوحة المنصة", icon: Activity },
    ],
  },
  {
    title: "إدارة المدارس",
    items: [
      { href: "/app/schools-admin", label: "المدارس المسجلة", icon: Building2 },
      { href: "/app/school-requests", label: "طلبات التسجيل", icon: ClipboardList, badge: "جديد" },
    ],
  },
  {
    title: "حسابي",
    items: [
      { href: "/app/profile", label: "الملف الشخصي", icon: UserCog },
    ],
  },
];

// ─── Props ────────────────────────────────────────────────

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// ─── شارة Super Admin ──────────────────────────────────────
function SuperAdminBadge({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={`mx-3 mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 overflow-hidden transition-all duration-300 ${
        collapsed ? "px-2 py-2" : "px-3 py-2"
      }`}
    >
      <div className="flex items-center gap-2 justify-center">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        {!collapsed && (
          <p className="text-[0.68rem] text-amber-300 font-black uppercase tracking-wider">
            مدير النظام
          </p>
        )}
      </div>
      {!collapsed && (
        <p className="text-[0.6rem] text-amber-400/70 mt-0.5 font-medium">
          صلاحيات المنصة الكاملة
        </p>
      )}
    </div>
  );
}

// ─── Hover Popup (للوضع المصغّر) ─────────────────────────────
function HoverPopup({
  group,
  pathname,
  onClose,
}: {
  group: NavGroup;
  pathname: string;
  onClose: () => void;
}) {
  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <motion.div
      initial={{ opacity: 0, x: 8, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute right-full top-0 mr-3 w-52 rounded-2xl shadow-2xl border z-50 overflow-hidden pointer-events-auto
        bg-white border-gray-200 dark:bg-gray-900 dark:border-white/10"
      style={{ filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.18))" }}
    >
      <div className="px-4 py-3 border-b border-gray-100 dark:border-white/8 bg-gray-50/80 dark:bg-white/5">
        <p className="text-xs font-black text-gray-700 dark:text-gray-200">{group.title}</p>
      </div>
      <div className="p-1.5">
        {group.items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200
                ${active
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="mr-auto text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── المكوّن الرئيسي ──────────────────────────────────────

export default function AppSidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, school, role, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  const isSuperAdmin = role === "super_admin";
  const navGroups = isSuperAdmin ? PLATFORM_NAV_GROUPS : SCHOOL_NAV_GROUPS;

  // حساب الميزات الفعالة لهذه المدرسة
  const platformMode = school?.settings?.platformMode ?? 'full';
  const hiddenFeatures = new Set(school?.settings?.hiddenFeatures ?? []);

  const filteredGroups = navGroups
    .map((group) => {
      if (isSuperAdmin) return group;
      // فلترة صلاحيات الإدارة للمعلمين
      const isTeacher = role === 'teacher';
      const adminOnlyGroups = ["الإدارة"];
      if (isTeacher && adminOnlyGroups.includes(group.title)) {
        return { ...group, items: [] };
      }
      // تصفية العناصر حسب الوضع والمخفية
      const items = group.items.filter((item) => {
        const key = item.featureKey;
        if (!key) return true; // بدون مفتاح دائماً ظاهر
        if (platformMode === 'simple') return SIMPLE_MODE_KEYS.has(key);
        return !hiddenFeatures.has(key); // الوضع الكامل: كل شيء إلا المخفي
      });
      return { ...group, items };
    })
    .filter((group) => group.items.length > 0);

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // تلقائياً افتح المجموعة الحاوية للصفحة الحالية
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    filteredGroups.forEach((g) => {
      if (g.items.some((i) => isActive(i.href))) {
        initial[g.title] = true;
      }
    });
    setOpenGroups(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        id="app-sidebar"
        className={`
          fixed top-0 right-0 h-full z-40 flex flex-col sidebar-transition
          bg-white dark:bg-[#13161f] text-gray-800 dark:text-gray-200
          border-l border-[var(--color-border)] dark:border-white/8
          print:hidden
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          lg:translate-x-0 lg:static lg:h-screen
          ${isCollapsed ? "w-[4.5rem]" : "w-72"}
        `}
      >
        {/* ── Header ── */}
        <div
          className={`flex items-center border-b border-[var(--color-border)] dark:border-white/8 shrink-0 overflow-hidden
            ${isCollapsed ? "justify-center p-3 h-16" : "justify-between p-4 h-16"}`}
        >
          {!isCollapsed && (
            <Link href="/app" className="flex items-center gap-3 group" onClick={onClose}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center shadow-md group-hover:shadow-[var(--color-primary)]/30 transition-shadow shrink-0">
                {isSuperAdmin
                  ? <Globe className="w-4.5 h-4.5 text-white" />
                  : <BookOpen className="w-4.5 h-4.5 text-white" />
                }
              </div>
              <div className="leading-tight min-w-0">
                <p
                  className="text-[0.85rem] font-black text-gray-900 dark:text-white truncate"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  {isSuperAdmin ? "منصة المدارس" : (school?.name ?? "منصة المدارس")}
                </p>
                <p className="text-[0.65rem] text-[var(--color-primary)] font-bold opacity-80">
                  {isSuperAdmin ? "إدارة النظام" : "إدارة الحلقات"}
                </p>
              </div>
            </Link>
          )}

          {isCollapsed && (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center shadow-md">
              {isSuperAdmin
                ? <Globe className="w-4.5 h-4.5 text-white" />
                : <BookOpen className="w-4.5 h-4.5 text-white" />
              }
            </div>
          )}

          {/* Close on mobile */}
          {!isCollapsed && (
            <button
              onClick={onClose}
              className="lg:hidden w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
              aria-label="إغلاق القائمة"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Super Admin badge */}
        {isSuperAdmin && <SuperAdminBadge collapsed={isCollapsed} />}

        {/* School info pill */}
        {!isSuperAdmin && school && !isCollapsed && (
          <div className="mx-4 mt-4 px-4 py-2.5 rounded-2xl bg-[var(--color-muted)] dark:bg-white/5 border border-[var(--color-border)] dark:border-white/8 text-center">
            <p className="text-[0.7rem] text-[var(--color-muted-foreground)] font-semibold">
              {school.city}، {school.country}
            </p>
          </div>
        )}

        {/* ── Nav Groups ── */}
        <nav
          className={`flex-1 overflow-visible py-4 space-y-1 ${isCollapsed ? "px-2" : "px-3"}`}
        >
          {filteredGroups.map((group) => {
            const isGroupHovered = hoveredGroup === group.title;
            const hasActive = group.items.some((i) => isActive(i.href));
            const FirstIcon = group.items[0]?.icon;

            /* ── COLLAPSED MODE ── */
            if (isCollapsed) {
              return (
                <div
                  key={group.title}
                  className="relative py-1"
                  onMouseEnter={() => setHoveredGroup(group.title)}
                  onMouseLeave={() => setHoveredGroup(null)}
                >
                  <button
                    className={`w-full h-11 rounded-xl flex items-center justify-center transition-all duration-200
                      ${hasActive
                        ? "bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20"
                        : "text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    title={group.title}
                  >
                    {FirstIcon && <FirstIcon className="w-5 h-5" />}
                  </button>

                  <AnimatePresence>
                    {isGroupHovered && (
                      <HoverPopup
                        group={group}
                        pathname={pathname}
                        onClose={onClose}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            /* ── EXPANDED MODE (SUPABASE STYLE FLYOUT) ── */
            return (
              <div 
                key={group.title} 
                className="mb-0.5 relative"
                onMouseEnter={() => setHoveredGroup(group.title)}
                onMouseLeave={() => setHoveredGroup(null)}
              >
                {/* Group header */}
                <div
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer
                    ${hasActive
                      ? "bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-white"
                    }`}
                >
                  {FirstIcon && (
                    <FirstIcon
                      className={`w-4 h-4 shrink-0 ${hasActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"}`}
                    />
                  )}
                  <span className="flex-1 sidebar-label">{group.title}</span>
                </div>

                {/* Hover popup */}
                <AnimatePresence>
                  {isGroupHovered && (
                    <HoverPopup
                      group={group}
                      pathname={pathname}
                      onClose={onClose}
                    />
                  )}
                </AnimatePresence>
              </div>
            );

          })}
        </nav>

        {/* ── Footer ── */}
        <div
          className={`border-t border-[var(--color-border)] dark:border-white/8 shrink-0 space-y-1 ${
            isCollapsed ? "p-2" : "p-3"
          }`}
        >
          {/* User card */}
          {!isCollapsed && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-[var(--color-muted)] dark:bg-white/5 mb-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 ${
                  isSuperAdmin
                    ? "bg-gradient-to-br from-amber-500 to-orange-600"
                    : "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]"
                }`}
              >
                {user?.displayName?.[0] ?? "م"}
              </div>
              <div className="flex-1 min-w-0 sidebar-user-info">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {user?.displayName ?? "المستخدم"}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)] font-medium">
                  {roleLabel(role)}
                </p>
              </div>
            </div>
          )}

          {/* Dark mode toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
              text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8
              ${isCollapsed ? "justify-center" : ""}`}
          >
            {isDark
              ? <Sun className="w-4 h-4 shrink-0 text-amber-400" />
              : <Moon className="w-4 h-4 shrink-0 text-indigo-500" />
            }
            {!isCollapsed && (
              <span>{isDark ? "الوضع الفاتح" : "الوضع الداكن"}</span>
            )}
          </button>

          {/* Collapse toggle (desktop only) */}
          <button
            id="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? "توسيع القائمة" : "تصغير القائمة"}
            className={`hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
              text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8
              ${isCollapsed ? "justify-center" : ""}`}
          >
            {isCollapsed
              ? <PanelLeftOpen className="w-4 h-4 shrink-0" />
              : <PanelLeftClose className="w-4 h-4 shrink-0" />
            }
            {!isCollapsed && <span>تصغير القائمة</span>}
          </button>

          {/* Logout */}
          <button
            id="logout-btn"
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
              text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/8
              ${isCollapsed ? "justify-center" : ""}`}
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── مساعد: ترجمة الدور ───────────────────────────────────

function roleLabel(role: string | null): string {
  switch (role) {
    case "super_admin": return "مدير النظام";
    case "principal": return "مدير المدرسة";
    case "teacher": return "معلم / شيخ";
    case "parent": return "ولي أمر";
    default: return "مستخدم";
  }
}
