"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AppSidebar from "@/components/layout/AppSidebar";
import AppHeader from "@/components/layout/AppHeader";
import { OnboardingTour } from "@/components/layout/OnboardingTour";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import OfflineBanner from "@/components/layout/OfflineBanner";
import { Loader2 } from "lucide-react";

// ─── مفتاح localStorage للحالة المصغّرة ────────────────────
const SIDEBAR_COLLAPSED_KEY = "qsp-sidebar-collapsed";

// مهلة أقصى للتحميل (5 ثوانٍ)
const LOADING_TIMEOUT_MS = 5000;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  // استعادة حالة الشريط الجانبي من localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (saved !== null) setSidebarCollapsed(saved === "true");
    } catch { /* ignore */ }
  }, []);

  // timeout للتحميل — لمنع الشاشة الدوّارة إلى الأبد
  useEffect(() => {
    if (loading) {
      timeoutRef.current = setTimeout(() => setTimedOut(true), LOADING_TIMEOUT_MS);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setTimedOut(false);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [loading]);

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next)); } catch { /*ignore*/ }
      return next;
    });
  };

  // حماية المسارات
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (timedOut && !user) router.replace("/login");
  }, [loading, user, router, timedOut]);

  const handleCloseSidebar = () => setSidebarOpen(false);

  // شاشة التحميل — تختفي بعد LOADING_TIMEOUT_MS
  if (loading && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center shadow-xl">
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          </div>
          <p className="text-[var(--color-muted-foreground)] font-bold text-sm" style={{ fontFamily: "var(--font-headline)" }}>
            جارٍ تحميل النظام...
          </p>
        </div>
      </div>
    );
  }

  // غير مسجّل → لا تعرض شيئاً (جارٍ التوجيه)
  if (!user) return null;

  return (
    <div
      className="flex h-screen bg-[var(--color-background)] overflow-hidden transition-colors duration-300"
      dir="rtl"
    >
      {/* Sidebar */}
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <AppHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 relative scrollbar-thin app-main-content">
          {children}
          <OnboardingTour />
        </main>
      </div>

      {/* ⚠️  PushNotificationManager مُزال — التحكم في الإشعارات من صفحة الإعدادات فقط */}

      {/* Offline Banner */}
      <OfflineBanner />

      {/* Mobile Bottom Navigation — يظهر على الهاتف فقط */}
      <MobileBottomNav />
    </div>
  );
}
