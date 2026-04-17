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
import SchoolsRegistrationChart from "../analytics/SchoolsRegistrationChart";

// ─── أنواع ─────────────────────────────────────────────────

interface PlatformStats {
  totalSchools: number;
  schoolsGrowth: string;
  pendingRequests: number;
  requestsGrowth: string;
  totalTeachers: number;
  teachersGrowth: string;
  totalStudents: number;
  studentsGrowth: string;
  totalGroups: number;
  groupsGrowth: string;
  recentSchools: RecentSchool[];
}

interface SchoolAnalytics {
  id: string;
  name: string;
  country: string;
  city: string;
  createdAt: string;
  teacherCount: number;
  groupCount: number;
  recentRecordsCount: number;
  lastActivity: string | null;
  engagementRate: number;
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
  label, value, icon: Icon, color, href, delay = 0, sublabel, growth
}: {
  label: string; value: number | string; icon: React.ElementType;
  color: string; href: string; delay?: number; sublabel?: string; growth?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}>
      <Link href={href}
        className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-[var(--color-border)] hover:shadow-lg hover:border-[var(--color-primary)]/20 transition-all duration-300 group">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>{value}</p>
            {growth && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${growth.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {growth}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
        </div>
      </Link>
    </motion.div>
  );
}

// ─── مكوّن لوحة المنصة ─────────────────────────────────────

export default function SuperAdminDashboard({ displayName }: { displayName?: string }) {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [analytics, setAnalytics] = useState<SchoolAnalytics[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          fetch("/api/admin/platform-stats"),
          fetch("/api/admin/schools-analytics")
        ]);

        if (!statsRes.ok) throw new Error(`HTTP stats ${statsRes.status}`);
        if (!analyticsRes.ok) throw new Error(`HTTP analytics ${analyticsRes.status}`);

        const data: PlatformStats = await statsRes.json();
        const analyticsData: SchoolAnalytics[] = await analyticsRes.json();

        setStats(data);
        setAnalytics(analyticsData);
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard label="مدرسة مسجلة" value={stats!.totalSchools}
            icon={Building2} color="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]"
            href="/app/schools-admin" delay={0} growth={stats!.schoolsGrowth} />
          <KpiCard label="معلمون ومشايخ" value={stats!.totalTeachers}
            icon={Users} color="bg-gradient-to-br from-blue-500 to-blue-700"
            href="/app/schools-admin" delay={0.08} growth={stats!.teachersGrowth} />
          <KpiCard label="طلاب في المنصة" value={stats!.totalStudents}
            icon={BookOpen} color="bg-gradient-to-br from-emerald-500 to-emerald-700"
            href="/app/schools-admin" delay={0.16} growth={stats!.studentsGrowth} />
          <KpiCard label="أفواج وحلقات" value={stats!.totalGroups || 0}
            icon={Users} color="bg-gradient-to-br from-purple-500 to-purple-700"
            href="/app/schools-admin" delay={0.20} growth={stats!.groupsGrowth} />
          <KpiCard
            label="طلبات قيد الانتظار"
            value={stats!.pendingRequests}
            icon={ClipboardList}
            color={stats!.pendingRequests > 0
              ? "bg-gradient-to-br from-amber-500 to-orange-600"
              : "bg-gradient-to-br from-gray-400 to-gray-500"}
            href="/app/school-requests"
            delay={0.24}
            growth={stats!.requestsGrowth}
            sublabel={stats!.pendingRequests > 0 ? "تحتاج مراجعة" : "لا توجد طلبات"}
          />
        </div>
      )}

      {/* ── الإجراءات السريعة ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-4"
          style={{ fontFamily: "var(--font-headline)" }}>إجراءات سريعة</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            {
              label: "المستخدمون النشطون اليوم",
              desc: "متابعة النشاط اللحظي",
              icon: Users,
              href: "/app/schools-admin",
              color: "from-emerald-500 to-emerald-700",
              badge: "لايف 🟢",
            },
            {
              label: "إحصاءات المنصة",
              desc: "تقارير ونمو المنصة",
              icon: AlertCircle,
              href: "#",
              color: "from-purple-500 to-indigo-600",
              badge: null,
            },
          ].map((action, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + i * 0.07 }}>
              <Link href={action.href}
                className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-[var(--color-border)] hover:shadow-md hover:border-[var(--color-primary)]/30 transition-all duration-300 group h-full relative overflow-hidden">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-gray-800" style={{ fontFamily: "var(--font-headline)" }}>
                    {action.label}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">{action.desc}</p>
                </div>
                {action.badge && (
                  <span className="absolute top-4 left-4 text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full">
                    {action.badge}
                  </span>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── لوحة الأداء والتوزيع الجغرافي ── */}
      {!loading && !error && analytics && analytics.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* التوزيع الجغرافي */}
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
            <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-[var(--color-primary)]" />
              أكثر البلدان نشاطاً
            </h3>
            <div className="space-y-4">
              {(() => {
                const countryCounts = Object.entries(
                  analytics.reduce((acc, s) => {
                    acc[s.country] = (acc[s.country] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).sort((a, b) => b[1] - a[1]);
                
                const topTotal = countryCounts.slice(0, 5).reduce((sum, curr) => sum + curr[1], 0);

                return countryCounts.slice(0, 5).map(([country, count], i) => (
                  <div key={country}>
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="font-bold text-gray-700">{country}</span>
                      <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{count} مدرسة</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${(count / topTotal) * 100}%` }} transition={{ duration: 0.8, delay: 0.5 + (i * 0.1) }}
                        className="h-full bg-indigo-400" 
                      />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* أفضل المدارس التزاماً */}
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
            <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-emerald-500" />
              أعلى المدارس التزاماً (تصنيف)
            </h3>
            <div className="space-y-3">
              {[...analytics].sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 5).map((school, i) => {
                let badge = "";
                if (i === 0) badge = "🥇 الأولى";
                else if (i === 1) badge = "🥈 الثانية";
                else if (i === 2) badge = "🥉 الثالثة";
                else badge = `#${i+1}`;
                
                return (
                  <div key={school.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className={`w-10 text-center font-black text-xs shrink-0 ${i === 0 ? 'text-yellow-600' : i === 1 ? 'text-gray-500' : i === 2 ? 'text-amber-700' : 'text-gray-400'}`}>
                        {badge}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-gray-800 truncate">{school.name}</p>
                        <p className="text-[10px] text-gray-500">آخر نشاط: {school.lastActivity ? new Date(school.lastActivity).toLocaleDateString('ar-DZ') : 'غير متوفر'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">{school.engagementRate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── الرسم البياني لتسجيل المدارس ── */}
      {!loading && !error && analytics && analytics.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}>
          <SchoolsRegistrationChart data={analytics} />
        </motion.div>
      )}

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
