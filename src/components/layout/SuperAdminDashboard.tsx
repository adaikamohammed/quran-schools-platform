"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Building2,
  Users,
  ClipboardList,
  Globe,
  ArrowLeft,
  BookOpen,
  AlertCircle,
} from "lucide-react";

// ─── أنواع ─────────────────────────────────────────────────

interface PlatformStats {
  totalSchools: number;
  pendingRequests: number;
  totalTeachers: number;
  totalStudents: number;
  recentSchools: RecentSchool[];
}

interface RecentSchool {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  principalName: string | null;
  email: string | null;
  teacherCount: number;
  studentCount: number;
  createdAt: string;
}

// ─── بطاقة KPI ─────────────────────────────────────────────

function KpiCard({
  label, value, icon: Icon, color, href, delay = 0, sublabel,
}: {
  label: string; value: number | string; icon: React.ElementType;
  color: string; href: string; delay?: number; sublabel?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}>
      <Link href={href}
        className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-[var(--color-border)] hover:shadow-lg hover:border-[var(--color-primary)]/20 transition-all duration-300 group">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>{value}</p>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
        </div>
        <ArrowLeft className="w-4 h-4 text-gray-300 group-hover:text-[var(--color-primary)] group-hover:-translate-x-1 transition-all" />
      </Link>
    </motion.div>
  );
}

// ─── مكوّن لوحة المنصة ─────────────────────────────────────

export default function SuperAdminDashboard({ displayName }: { displayName?: string }) {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/platform-stats");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const data: PlatformStats = await res.json();
        setStats(data);
      } catch (e: any) {
        console.error("SuperAdminDashboard:", e?.message ?? e);
        setError(e?.message ?? "تعذّر تحميل البيانات");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const miladiDate = new Intl.DateTimeFormat("ar-DZ", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date());

  const hijriDate = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date());

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* ── banner ترحيب ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-l from-amber-600 to-orange-700 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #ffffff30 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">{miladiDate}</p>
            <h2 className="text-2xl font-black mb-1" style={{ fontFamily: "var(--font-headline)" }}>
              أهلاً، {displayName?.split(" ")[0] ?? "مدير النظام"} 🛡️
            </h2>
            <p className="text-white/80 text-sm">مركز التحكم الرئيسي — منصة مدارس القرآن</p>
            <p className="text-white/50 text-xs mt-2">📅 {hijriDate}</p>
          </div>
          <div className="flex items-center gap-2 bg-white/15 rounded-2xl px-4 py-3 shrink-0">
            <Globe className="w-5 h-5 text-amber-200" />
            <div>
              <p className="text-xs text-white/70">المدارس النشطة</p>
              <p className="text-2xl font-black">{loading ? "—" : (stats?.totalSchools ?? 0)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── KPIs ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="مدرسة مسجلة" value={stats!.totalSchools}
            icon={Building2} color="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]"
            href="/app/schools-admin" delay={0} />
          <KpiCard label="معلمون ومشايخ" value={stats!.totalTeachers}
            icon={Users} color="bg-gradient-to-br from-blue-500 to-blue-700"
            href="/app/schools-admin" delay={0.08} />
          <KpiCard label="طلاب في المنصة" value={stats!.totalStudents}
            icon={BookOpen} color="bg-gradient-to-br from-emerald-500 to-emerald-700"
            href="/app/schools-admin" delay={0.16} />
          <KpiCard
            label="طلبات قيد الانتظار"
            value={stats!.pendingRequests}
            icon={ClipboardList}
            color={stats!.pendingRequests > 0
              ? "bg-gradient-to-br from-amber-500 to-orange-600"
              : "bg-gradient-to-br from-gray-400 to-gray-500"}
            href="/app/school-requests"
            delay={0.24}
            sublabel={stats!.pendingRequests > 0 ? "تحتاج مراجعة" : "لا توجد طلبات"}
          />
        </div>
      )}

      {/* ── الإجراءات السريعة ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-4"
          style={{ fontFamily: "var(--font-headline)" }}>إجراءات سريعة</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: "مراجعة طلبات المدارس",
              desc: "قبول أو رفض المدارس الجديدة",
              icon: ClipboardList,
              href: "/app/school-requests",
              color: "from-amber-500 to-orange-600",
              badge: stats?.pendingRequests && stats.pendingRequests > 0
                ? `${stats.pendingRequests} جديد` : null,
            },
            {
              label: "عرض المدارس المسجلة",
              desc: "تفاصيل جميع المدارس النشطة",
              icon: Building2,
              href: "/app/schools-admin",
              color: "from-[var(--color-primary)] to-[var(--color-primary-dark)]",
              badge: null,
            },
          ].map((action, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + i * 0.07 }}>
              <Link href={action.href}
                className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-[var(--color-border)] hover:shadow-lg hover:border-[var(--color-primary)]/20 transition-all duration-300 group">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-800" style={{ fontFamily: "var(--font-headline)" }}>
                    {action.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{action.desc}</p>
                </div>
                {action.badge && (
                  <span className="text-[10px] font-black bg-red-500 text-white px-2 py-1 rounded-full shrink-0">
                    {action.badge}
                  </span>
                )}
                <ArrowLeft className="w-4 h-4 text-gray-300 group-hover:text-[var(--color-primary)] group-hover:-translate-x-1 transition-all shrink-0" />
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── أحدث المدارس ── */}
      {!loading && !error && stats && stats.recentSchools.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider"
              style={{ fontFamily: "var(--font-headline)" }}>أحدث المدارس المسجلة</h3>
            <Link href="/app/schools-admin"
              className="text-sm font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
              عرض الكل <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-[var(--color-border)] divide-y divide-gray-50 overflow-hidden">
            {stats.recentSchools.map((school, i) => (
              <motion.div key={school.id}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.06 }}
                className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white font-black text-base shrink-0">
                  {school.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{school.name}</p>
                  <p className="text-xs text-gray-400">
                    {[school.city, school.country].filter(Boolean).join("، ")}
                    {school.principalName && ` · ${school.principalName}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center hidden sm:block">
                    <p className="text-sm font-black text-blue-600">{school.teacherCount}</p>
                    <p className="text-[10px] text-gray-400">معلم</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-sm font-black text-emerald-600">{school.studentCount}</p>
                    <p className="text-[10px] text-gray-400">طالب</p>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">
                    {new Date(school.createdAt).toLocaleDateString("ar-DZ")}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && stats && stats.recentSchools.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-600 text-sm">لا توجد مدارس مسجلة بعد</p>
          <p className="text-gray-400 text-xs mt-1">ابدأ بمراجعة طلبات التسجيل وقبول المدارس الجديدة.</p>
          <Link href="/app/school-requests"
            className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-[var(--color-primary)] hover:underline">
            مراجعة الطلبات <ArrowLeft className="w-4 h-4" />
          </Link>
        </motion.div>
      )}
    </div>
  );
}
