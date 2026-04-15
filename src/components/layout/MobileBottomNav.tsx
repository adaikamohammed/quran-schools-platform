"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, ClipboardList, Users, BookCheck, MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/app",          label: "الرئيسية", icon: LayoutDashboard },
  { href: "/app/sessions", label: "الحصص",    icon: ClipboardList   },
  { href: "/app/students", label: "الطلاب",   icon: Users           },
  { href: "/app/quran",    label: "الحفظ",    icon: BookCheck       },
];

const MORE_ITEMS = [
  { href: "/app/reports",       label: "التقارير"    },
  { href: "/app/performance",   label: "الأداء"      },
  { href: "/app/annual-report", label: "تقرير سنوي"  },
  { href: "/app/timetable",     label: "جدول الحصص" },
  { href: "/app/profile",       label: "ملفي"        },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showMore, setShowMore] = useState(false);

  // Only show on mobile for authenticated users in /app
  if (!user || !pathname.startsWith("/app")) return null;

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <>
      {/* More drawer */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-[72px] left-4 right-4 z-50 lg:hidden bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden"
            >
              <div className="p-2 grid grid-cols-3 gap-1">
                {MORE_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl text-xs font-bold transition-colors ${
                      isActive(item.href)
                        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8"
                    }`}
                  >
                    <span className="text-lg">
                      {item.href.includes("reports") ? "📋" :
                       item.href.includes("performance") ? "📊" :
                       item.href.includes("annual") ? "📄" :
                       item.href.includes("timetable") ? "📅" : "👤"}
                    </span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Nav Bar */}
      <nav className="mobile-bottom-nav lg:hidden" dir="rtl">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-bottom-nav-item ${active ? "active" : ""}`}
            >
              <div className="relative">
                <item.icon className={`w-5 h-5 transition-all ${active ? "scale-110" : ""}`} />
                {active && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-1.5 right-1/2 translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-primary)]"
                  />
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setShowMore((v) => !v)}
          className={`mobile-bottom-nav-item ${showMore ? "active" : ""}`}
        >
          <MoreHorizontal className={`w-5 h-5 transition-all ${showMore ? "scale-110" : ""}`} />
          <span>المزيد</span>
        </button>
      </nav>
    </>
  );
}
