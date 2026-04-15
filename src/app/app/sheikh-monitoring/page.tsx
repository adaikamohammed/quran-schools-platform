"use client";
import SchoolGuard from "@/components/layout/SchoolGuard";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import type { Student, DailySession, AppUser } from "@/lib/types";
import { motion } from "framer-motion";
import {
  ShieldCheck, Users, Activity, TrendingUp, TrendingDown,
  CheckCircle2, AlertTriangle, AlertCircle, Clock,
  BarChart3, Calendar, Star, BookOpen, Loader2, RefreshCw,
  Award, ChevronDown, ChevronRight, User,
} from "lucide-react";

// ─── بطاقة شيخ ────────────────────────────────────────────

interface TeacherStats {
  teacher: AppUser;
  totalStudents: number;
  activeStudents: number;
  sessionsThisMonth: number;
  sessionsThisWeek: number;
  attendanceRate: number;
  memExcellentRate: number;
  reviewRate: number;
  absentDays: number;
  lastSessionDate: string | null;
  score: number;
  level: "ممتاز" | "جيد" | "متوسط" | "ضعيف";
}

function getLevel(score: number): "ممتاز" | "جيد" | "متوسط" | "ضعيف" {
  if (score >= 80) return "ممتاز";
  if (score >= 60) return "جيد";
  if (score >= 40) return "متوسط";
  return "ضعيف";
}

const LEVEL_CONFIG = {
  "ممتاز": { color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", bar: "bg-emerald-500" },
  "جيد":   { color: "text-blue-700 dark:text-blue-300",     bg: "bg-blue-50 dark:bg-blue-500/10",     border: "border-blue-200 dark:border-blue-500/20",     bar: "bg-blue-500"    },
  "متوسط": { color: "text-amber-700 dark:text-amber-300",   bg: "bg-amber-50 dark:bg-amber-500/10",   border: "border-amber-200 dark:border-amber-500/20",   bar: "bg-amber-400"   },
  "ضعيف":  { color: "text-red-700 dark:text-red-300",       bg: "bg-red-50 dark:bg-red-500/10",       border: "border-red-200 dark:border-red-500/20",       bar: "bg-red-500"     },
};

function TeacherCard({ stats, index }: { stats: TeacherStats; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = LEVEL_CONFIG[stats.level];

  const daysSinceLast = stats.lastSessionDate
    ? Math.floor((Date.now() - new Date(stats.lastSessionDate).getTime()) / 86400000)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`bg-white dark:bg-[var(--color-card)] rounded-2xl border ${cfg.border} overflow-hidden hover:shadow-md transition-shadow`}
    >
      {/* شريط النسبة العلوي */}
      <div className="h-1.5 bg-gray-100 dark:bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${stats.score}%` }}
          transition={{ delay: index * 0.07 + 0.3, duration: 0.7 }}
          className={`h-full ${cfg.bar} rounded-full`}
        />
      </div>

      <div className="p-5">
        {/* رأس البطاقة */}
        <div className="flex items-start gap-4">
          {/* الأفاتار */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md">
            {stats.teacher.displayName[0]}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="font-black text-gray-900 dark:text-white">{stats.teacher.displayName}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {stats.teacher.groupName ?? "—"} · {stats.totalStudents} طالب
                </p>
              </div>

              {/* المستوى */}
              <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${cfg.bg} ${cfg.color} shrink-0`}>
                {stats.level}
              </span>
            </div>

            {/* النقاط */}
            <div className="flex items-center gap-2 mt-2.5">
              <div className="flex-1 h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.score}%` }}
                  transition={{ delay: index * 0.07 + 0.4, duration: 0.6 }}
                  className={`h-full ${cfg.bar}`}
                />
              </div>
              <span className={`text-sm font-black ${cfg.color}`}>{stats.score}/100</span>
            </div>
          </div>
        </div>

        {/* إحصائيات مدمجة */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            {
              label: "الحضور",
              value: `${stats.attendanceRate}%`,
              icon: CheckCircle2,
              color: stats.attendanceRate >= 70 ? "text-emerald-600" : "text-red-500",
            },
            {
              label: "الحفظ الممتاز",
              value: `${stats.memExcellentRate}%`,
              icon: Star,
              color: stats.memExcellentRate >= 30 ? "text-amber-600" : "text-gray-500",
            },
            {
              label: "جلسات هذا الشهر",
              value: stats.sessionsThisMonth,
              icon: Calendar,
              color: "text-indigo-600",
            },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 text-center">
                <Icon className={`w-4 h-4 mx-auto mb-1 ${item.color}`} />
                <p className={`text-base font-black ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-gray-400">{item.label}</p>
              </div>
            );
          })}
        </div>

        {/* تحذير آخر حصة */}
        {daysSinceLast !== null && daysSinceLast > 3 && (
          <div className="mt-3 flex items-center gap-2 p-2.5 bg-orange-50 dark:bg-orange-500/10 rounded-xl border border-orange-200 dark:border-orange-500/20">
            <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
            <p className="text-xs font-bold text-orange-700 dark:text-orange-300">
              آخر حصة مسجلة منذ {daysSinceLast} يوم
              {daysSinceLast > 7 && " — يحتاج متابعة"}
            </p>
          </div>
        )}

        {/* تفاصيل موسّعة */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-center gap-1 mt-3 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          {expanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 space-y-2">
              {[
                { label: "جلسات هذا الأسبوع", value: `${stats.sessionsThisWeek}`, icon: Activity },
                { label: "نسبة إتمام المراجعة", value: `${stats.reviewRate}%`, icon: BookOpen },
                { label: "أيام غياب المعلم", value: `${stats.absentDays} يوم`, icon: AlertCircle },
                { label: "الطلاب النشطون", value: `${stats.activeStudents}`, icon: Users },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </div>
                    <span className="text-xs font-black text-gray-700 dark:text-gray-200">{item.value}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

function SheikhMonitoringPage() {
  const { user, school, isPrincipal } = useAuth();
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allSessions, setAllSessions] = useState<DailySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"score" | "sessions" | "attendance">("score");

  const load = useCallback(async () => {
    if (!school?.id) return;
    setLoading(true);
    const db = getDB();

    const schoolTeachers = await db.users
      .where("schoolId").equals(school.id)
      .filter(u => u.role === "teacher").toArray();
    setTeachers(schoolTeachers);

    const studs = await db.students.where("schoolId").equals(school.id).toArray();
    setAllStudents(studs);

    const sessions = await db.sessions.where("schoolId").equals(school.id).toArray();
    setAllSessions(sessions);

    setLoading(false);
  }, [school?.id]);

  useEffect(() => { load(); }, [load]);

  // ─── احتساب إحصائيات كل شيخ ──────────────────────────

  const teacherStats = useMemo<TeacherStats[]>(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const startOfWeek = new Date(now.getTime() - (now.getDay() * 86400000)).toISOString().slice(0, 10);

    return teachers.map(teacher => {
      const teacherStudents = allStudents.filter(s => s.teacherId === teacher.id);
      const activeStudents = teacherStudents.filter(s => s.status === "نشط");
      const teacherSessions = allSessions.filter(s => s.teacherId === teacher.id);

      const sessionsThisMonth = teacherSessions.filter(s =>
        s.date >= startOfMonth && s.sessionType !== "يوم عطلة"
      ).length;
      const sessionsThisWeek = teacherSessions.filter(s =>
        s.date >= startOfWeek && s.sessionType !== "يوم عطلة"
      ).length;
      const absentDays = teacherSessions.filter(s => s.sessionType === "غياب المعلم").length;

      // آخر حصة
      const validSessions = teacherSessions.filter(s =>
        s.sessionType !== "يوم عطلة" && s.sessionType !== "غياب المعلم"
      ).sort((a, b) => b.date.localeCompare(a.date));
      const lastSessionDate = validSessions[0]?.date ?? null;

      // معدلات من السجلات
      let totalPresent = 0, totalAttendance = 0;
      let totalMemExcellent = 0, totalMem = 0;
      let totalReviewDone = 0, totalReview = 0;

      teacherSessions.forEach(session => {
        if (session.sessionType === "يوم عطلة" || session.sessionType === "غياب المعلم") return;
        session.records.forEach(rec => {
          if (rec.attendance !== "") {
            totalAttendance++;
            if (rec.attendance === "حاضر" || rec.attendance === "تعويض") totalPresent++;
          }
          if (rec.memorization) {
            totalMem++;
            if (rec.memorization === "ممتاز") totalMemExcellent++;
          }
          if (rec.review !== null) {
            totalReview++;
            if (rec.review === true) totalReviewDone++;
          }
        });
      });

      const attendanceRate = totalAttendance > 0 ? Math.round((totalPresent / totalAttendance) * 100) : 0;
      const memExcellentRate = totalMem > 0 ? Math.round((totalMemExcellent / totalMem) * 100) : 0;
      const reviewRate = totalReview > 0 ? Math.round((totalReviewDone / totalReview) * 100) : 0;

      // احتساب النقاط
      const sessionScore = Math.min(sessionsThisMonth * 4, 40); // max 40
      const attendanceScore = Math.round(attendanceRate * 0.3); // max 30
      const memScore = Math.round(memExcellentRate * 0.2); // max 20
      const absentPenalty = Math.min(absentDays * 3, 15);
      const score = Math.max(0, Math.min(100, sessionScore + attendanceScore + memScore - absentPenalty));

      return {
        teacher,
        totalStudents: teacherStudents.length,
        activeStudents: activeStudents.length,
        sessionsThisMonth,
        sessionsThisWeek,
        attendanceRate,
        memExcellentRate,
        reviewRate,
        absentDays,
        lastSessionDate,
        score,
        level: getLevel(score),
      };
    });
  }, [teachers, allStudents, allSessions]);

  const sorted = useMemo(() => {
    return [...teacherStats].sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "sessions") return b.sessionsThisMonth - a.sessionsThisMonth;
      return b.attendanceRate - a.attendanceRate;
    });
  }, [teacherStats, sortBy]);

  // إجماليات
  const summary = useMemo(() => ({
    total: teachers.length,
    excellent: teacherStats.filter(t => t.level === "ممتاز").length,
    good: teacherStats.filter(t => t.level === "جيد").length,
    needsAttention: teacherStats.filter(t => t.level === "متوسط" || t.level === "ضعيف").length,
    avgScore: teacherStats.length > 0
      ? Math.round(teacherStats.reduce((s, t) => s + t.score, 0) / teacherStats.length)
      : 0,
  }), [teacherStats]);

  if (!isPrincipal && user?.role !== "super_admin") {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center" dir="rtl">
        <ShieldCheck className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
        <p className="font-black text-gray-500 dark:text-gray-400">هذه الصفحة للمدراء فقط</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
      {/* رأس */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1
            className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            <ShieldCheck className="w-6 h-6 text-[var(--color-primary)]" />
            مراقبة المشايخ
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            تقييم شامل لأداء والتزام المعلمين والمشايخ
          </p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl border border-[var(--color-border)] bg-white dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-[var(--color-primary)] transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ملخص */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "إجمالي المشايخ", value: summary.total, color: "text-gray-800 dark:text-gray-100", bg: "bg-gray-100 dark:bg-white/8" },
            { label: "مستوى ممتاز", value: summary.excellent, color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
            { label: "يحتاج متابعة", value: summary.needsAttention, color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-500/10" },
            { label: "متوسط النقاط", value: `${summary.avgScore}/100`, color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-500/10" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl p-4`}>
              <p className={`text-xl font-black ${color}`} style={{ fontFamily: "var(--font-headline)" }}>{value}</p>
              <p className={`text-xs font-medium ${color} opacity-70 mt-0.5`}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* الترتيب */}
      {!loading && (
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">رتّب حسب:</p>
          {(["score", "sessions", "attendance"] as const).map(key => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                sortBy === key
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                  : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400"
              }`}
            >
              {key === "score" ? "النقاط الإجمالية" : key === "sessions" ? "عدد الجلسات" : "نسبة الحضور"}
            </button>
          ))}
        </div>
      )}

      {/* القائمة */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)]">
          <Users className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="font-bold text-gray-400 dark:text-gray-500">لا يوجد مشايخ مسجلون في هذه المدرسة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((stats, i) => (
            <TeacherCard key={stats.teacher.id} stats={stats} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SheikhMonitoringWrapper() {
  return (
    <SchoolGuard>
      <SheikhMonitoringPage />
    </SchoolGuard>
  );
}
