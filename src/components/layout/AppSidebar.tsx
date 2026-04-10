"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
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
  ChevronRight,
  LayoutDashboard,
  Trophy,
  FileText,
  Award,
  LogOut,
  X,
  Gavel,
  MessageSquare,
  Bell,
  Sparkles,
  Moon,
  UserCog,
} from "lucide-react";

// ─── تعريف التنقل ──────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[]; // undefined = للجميع
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "الميدان التربوي",
    items: [
      { href: "/app", label: "لوحة التحكم", icon: LayoutDashboard },
      { href: "/app/guide", label: "دليل المنصة", icon: Trophy, badge: "خريطة" },
      { href: "/app/sessions", label: "الحصص اليومية", icon: ClipboardList },
      { href: "/app/students", label: "إدارة الطلاب", icon: Users },
      { href: "/app/quran", label: "متابعة الحفظ", icon: BookCheck },
      { href: "/app/covenants", label: "العهود والعقوبات", icon: Gavel },
    ],
  },
  {
    title: "بوصلة المتابعة",
    items: [
      { href: "/app/reports", label: "التقارير اليومية", icon: FileText },
      { href: "/app/student-history", label: "سجل الطالب", icon: BarChart3 },
    ],
  },
  {
    title: "سباق التميز",
    items: [
      { href: "/app/points", label: "نظام النقاط", icon: Award },
    ],
  },
  {
    title: "النافذة الإدارية",
    items: [
      { href: "/app/teachers", label: "أفواج المدرسة", icon: Users, roles: ["super_admin", "principal"] },
      { href: "/app/dues", label: "الاشتراكات الفصلية", icon: DollarSign, roles: ["super_admin", "principal"] },
      { href: "/app/registrations", label: "التسجيلات الجديدة", icon: UserPlus, roles: ["super_admin", "principal"] },
      { href: "/app/meetings", label: "الاجتماعات", icon: Calendar, roles: ["super_admin", "principal"] },
    ],
  },
  {
    title: "إدارة المنصة",
    items: [
      { href: "/app/schools-admin", label: "المدارس المسجلة", icon: Sparkles, roles: ["super_admin"] },
      { href: "/app/school-requests", label: "طلبات المدارس", icon: ClipboardList, roles: ["super_admin"], badge: "جديد" },
    ],
  },
  {
    title: "الإعدادات",
    items: [
      { href: "/app/profile", label: "الملف الشخصي", icon: UserCog },
      { href: "/app/settings", label: "إعدادات المدرسة", icon: Settings, roles: ["super_admin", "principal"] },
    ],
  },
];

// ─── Props ────────────────────────────────────────────────

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── المكوّن ──────────────────────────────────────────────

export default function AppSidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, school, role, logout } = useAuth();

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  const canSee = (item: NavItem) => {
    if (!item.roles) return true;
    return role ? item.roles.includes(role) : false;
  };

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
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 right-0 h-full z-40 w-72 flex flex-col
          bg-gray-950 text-white
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          lg:translate-x-0 lg:static lg:h-screen
        `}
      >
        {/* Header Logo */}
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <Link href="/app" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center shadow-lg group-hover:shadow-[var(--color-primary)]/30 transition-shadow">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <p
                className="text-[0.95rem] font-black text-white"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                {school?.name ?? "منصة المدارس"}
              </p>
              <p className="text-[0.7rem] text-[var(--color-primary)] font-bold opacity-80">
                نظام إدارة الحلقات
              </p>
            </div>
          </Link>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/15 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* School info pill */}
        {school && (
          <div className="mx-4 mt-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/8 text-center">
            <p className="text-xs text-gray-500 font-medium">{school.city}، {school.country}</p>
          </div>
        )}

        {/* Nav Groups */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(canSee);
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.title}>
                <p className="text-[0.65rem] font-black text-gray-600 uppercase tracking-widest px-3 mb-2">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group relative
                            ${active
                              ? "bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25"
                              : "text-gray-400 hover:text-white hover:bg-white/8"
                            }
                          `}
                        >
                          {/* Active indicator */}
                          {active && (
                            <motion.div
                              layoutId="activeNav"
                              className="absolute inset-0 rounded-xl bg-[var(--color-primary)]"
                              style={{ zIndex: -1 }}
                              transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                            />
                          )}
                          <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-gray-500 group-hover:text-white"}`} />
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="text-[10px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                          {!active && (
                            <ChevronRight className="w-3.5 h-3.5 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* User Card + Logout */}
        <div className="p-4 border-t border-white/8 space-y-3">
          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white font-black text-sm shrink-0">
              {user?.displayName?.[0] ?? "م"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {user?.displayName ?? "المستخدم"}
              </p>
              <p className="text-xs text-gray-500 font-medium">
                {roleLabel(role)}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-red-400 hover:bg-red-500/8 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
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
