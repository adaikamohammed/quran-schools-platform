"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Student, DailySession } from "@/lib/types";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users, BookCheck, ClipboardList, Star, ArrowLeft, AlertTriangle,
  Clock, BookOpen, CheckCircle2, XCircle, TrendingUp, Award,
  Calendar, Flame, ChevronRight, BellRing, Zap
} from "lucide-react";

// ─── Compact Student Row ─────────────────────────────────
function StudentRow({ student, absent }: { student: Student; absent?: boolean }) {
  return (
    <Link
      href={`/app/students/${student.id}`}
      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/3 transition-colors rounded-xl"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0
        ${absent ? "bg-red-500" : "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]"}`}>
        {student.fullName[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{student.fullName}</p>
        <p className="text-xs text-gray-400 mt-0.5">{student.memorizedSurahsCount ?? 0} سورة محفوظة</p>
      </div>
      {absent && (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/15 text-red-600">
          غائب أمس
        </span>
      )}
      <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
    </Link>
  );
}

// ─── Quick Action Card ────────────────────────────────────
function QuickAction({ label, desc, icon: Icon, href, color }: {
  label: string; desc: string; icon: React.ElementType; href: string; color: string;
}) {
  return (
    <Link href={href}
      className="flex flex-col items-center text-center gap-2.5 p-4 bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] hover:shadow-lg hover:border-[var(--color-primary)]/20 transition-all duration-300 group">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm font-black text-gray-800 dark:text-white">{label}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}

// ─── Mini Stat ───────────────────────────────────────────
function MiniStat({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 p-4 rounded-2xl border ${color}`}>
      <Icon className="w-5 h-5 opacity-80" />
      <p className="text-3xl font-black" style={{ fontFamily: "var(--font-headline)" }}>{value}</p>
      <p className="text-xs font-bold opacity-75">{label}</p>
    </div>
  );
}

// ─── Attendance Heatmap (7 days) ─────────────────────────
function WeekHeatmap({ sessions, studentCount }: {
  sessions: DailySession[];
  studentCount: number;
}) {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const daySessions = sessions.filter(s => s.date === dateStr && !["يوم عطلة", "غياب المعلم"].includes(s.sessionType));

    let presentCount = 0, totalCount = 0;
    daySessions.forEach(s => s.records.forEach(r => {
      if (r.attendance) {
        totalCount++;
        if (["حاضر", "متأخر", "تعويض"].includes(r.attendance)) presentCount++;
      }
    }));

    const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : null;
    const dayName = d.toLocaleDateString("ar-DZ", { weekday: "short" });
    days.push({ date: dateStr, rate, dayName, recorded: daySessions.length > 0 });
  }

  return (
    <div className="flex gap-1.5 justify-between">
      {days.map((d) => (
        <div key={d.date} className="flex flex-col items-center gap-1.5 flex-1">
          <div
            className={`w-full h-10 rounded-xl transition-colors ${
              !d.recorded
                ? "bg-gray-100 dark:bg-white/5"
                : d.rate! >= 80
                  ? "bg-emerald-400 dark:bg-emerald-500"
                  : d.rate! >= 60
                    ? "bg-amber-400 dark:bg-amber-500"
                    : "bg-red-400 dark:bg-red-500"
            }`}
            title={d.recorded ? `${d.date}: ${d.rate}%` : `${d.date}: لم تُسجَّل`}
          />
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{d.dayName}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────
export default function TeacherDashboard() {
  const { user, school } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysSinceLastSession, setDaysSinceLastSession] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id || !school?.id) return;

    const load = async () => {
      const { getDB } = await import("@/lib/storage/db");
      const db = getDB();

      // Fetch teacher's students
      const studs = await db.students
        .where("teacherId").equals(user.id)
        .filter(s => s.status === "نشط")
        .toArray();
      studs.sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
      setStudents(studs);

      // Fetch last 30 days of sessions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

      const sess = await db.sessions
        .where("teacherId").equals(user.id)
        .filter(s => s.date >= cutoff)
        .toArray();
      sess.sort((a, b) => b.date.localeCompare(a.date));
      setSessions(sess);

      // Days since last actual session
      const realSessions = sess.filter(s => !["يوم عطلة", "غياب المعلم"].includes(s.sessionType));
      if (realSessions.length > 0) {
        const lastDate = new Date(realSessions[0].date);
        const diffMs = Date.now() - lastDate.getTime();
        setDaysSinceLastSession(Math.floor(diffMs / 86400000));
      } else {
        setDaysSinceLastSession(null);
      }

      setLoading(false);
    };

    load();
  }, [user?.id, school?.id]);

  // === Computed Stats ===
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = (() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  const todaySessions = useMemo(() =>
    sessions.filter(s => s.date === todayStr && !["يوم عطلة", "غياب المعلم"].includes(s.sessionType)),
    [sessions, todayStr]);

  const yesterdaySessions = useMemo(() =>
    sessions.filter(s => s.date === yesterdayStr),
    [sessions, yesterdayStr]);

  const todayRecorded = todaySessions.length > 0;

  // Today attendance
  const { presentToday, totalToday } = useMemo(() => {
    let present = 0, total = 0;
    todaySessions.forEach(s => s.records.forEach(r => {
      if (r.attendance) {
        total++;
        if (["حاضر", "متأخر", "تعويض"].includes(r.attendance)) present++;
      }
    }));
    return { presentToday: present, totalToday: total };
  }, [todaySessions]);

  const todayRate = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : null;

  // Students absent yesterday
  const absentYesterday = useMemo(() => {
    const absentIds = new Set<string>();
    yesterdaySessions.forEach(s => s.records.forEach(r => {
      if (r.attendance === "غائب") absentIds.add(r.studentId);
    }));
    return students.filter(s => absentIds.has(s.id));
  }, [yesterdaySessions, students]);

  // At-risk students (3+ absences in last 7 sessions)
  const atRisk = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().slice(0, 10);
    const recentSess = sessions.filter(s => s.date >= cutoff);
    const absentCount: Record<string, number> = {};
    recentSess.forEach(s => s.records.forEach(r => {
      if (r.attendance === "غائب") absentCount[r.studentId] = (absentCount[r.studentId] || 0) + 1;
    }));
    return students.filter(s => (absentCount[s.id] || 0) >= 3);
  }, [sessions, students]);

  // Week sessions count
  const weekSessionsCount = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().slice(0, 10);
    return sessions.filter(s => s.date >= cutoff && !["يوم عطلة", "غياب المعلم"].includes(s.sessionType)).length;
  }, [sessions]);

  // Total memorized surahs
  const totalSurahs = useMemo(() =>
    students.reduce((sum, s) => sum + (s.memorizedSurahsCount || 0), 0),
    [students]);

  const miladiDate = new Intl.DateTimeFormat("ar-DZ", {
    weekday: "long", day: "numeric", month: "long"
  }).format(new Date());

  const hijriDate = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
    day: "numeric", month: "long", year: "numeric"
  }).format(new Date());

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4" dir="rtl">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5" dir="rtl">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-3xl p-6 text-white"
      >
        <div className="absolute inset-0 islamic-pattern opacity-10" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-white/60 text-sm font-medium">{miladiDate}</p>
            <h1 className="text-2xl font-black mt-1" style={{ fontFamily: "var(--font-headline)" }}>
              أهلاً وسهلاً، {user?.displayName?.split(" ")[0] ?? "أستاذ"} 👋
            </h1>
            <p className="text-white/70 text-sm mt-0.5">{user?.groupName ? `فوج ${user.groupName}` : "المعلم"} · {school?.name}</p>
            <div className="flex items-center gap-2 mt-2 text-white/50 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>{hijriDate}</span>
            </div>
          </div>

          {/* Quick session indicator */}
          <div className={`rounded-2xl px-5 py-3 ${todayRecorded
            ? "bg-white/15 border border-white/20"
            : "bg-amber-500/30 border border-amber-300/30 animate-pulse"}`}>
            <div className="flex items-center gap-2">
              {todayRecorded
                ? <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                : <BellRing className="w-5 h-5 text-amber-200 shrink-0" />
              }
              <div>
                <p className="font-black text-sm">
                  {todayRecorded ? "الحصة مسجّلة ✓" : "لم تُسجَّل حصة اليوم"}
                </p>
                <p className="text-white/60 text-xs">
                  {todayRecorded
                    ? (todayRate !== null ? `نسبة الحضور: ${todayRate}%` : "")
                    : "اضغط لتسجيل الحصة الآن"}
                </p>
              </div>
            </div>
            {!todayRecorded && (
              <Link href="/app/sessions" className="mt-2 block text-center text-xs font-black bg-white/20 hover:bg-white/30 rounded-xl py-1.5 transition-colors">
                تسجيل الحصة →
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Critical Reminder: No session for X days ── */}
      {daysSinceLastSession !== null && daysSinceLastSession >= 2 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-black text-amber-900 dark:text-amber-200 text-sm">
              لم تُسجّل حصة منذ {daysSinceLastSession} {daysSinceLastSession === 2 ? "يومين" : `${daysSinceLastSession} أيام`}
            </p>
            <p className="text-amber-700 dark:text-amber-300 text-xs mt-0.5">
              يُنصح بتسجيل الحضور يومياً لمتابعة الطلاب بدقة.
            </p>
          </div>
          <Link href="/app/sessions"
            className="shrink-0 text-xs font-black bg-amber-500 text-white px-3 py-2 rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-1">
            <Zap className="w-3 h-3" /> تسجيل
          </Link>
        </motion.div>
      )}

      {/* ── At-Risk Students Alert ── */}
      {atRisk.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-red-900 dark:text-red-200 text-sm mb-1.5">
              {atRisk.length} طالب يحتاج متابعة عاجلة (3+ غيابات)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {atRisk.slice(0, 5).map(s => (
                <Link key={s.id} href={`/app/students/${s.id}`}
                  className="text-xs font-bold px-2.5 py-1 bg-white dark:bg-[var(--color-card)] border border-red-200 dark:border-red-500/30 rounded-full text-red-700 dark:text-red-300 hover:bg-red-50 transition-colors flex items-center gap-1">
                  <XCircle className="w-3 h-3 opacity-70" />
                  {s.fullName.split(" ").slice(0, 2).join(" ")}
                </Link>
              ))}
              {atRisk.length > 5 && (
                <span className="text-xs font-bold px-2.5 py-1 bg-red-100 dark:bg-red-500/20 rounded-full text-red-700 dark:text-red-300">
                  +{atRisk.length - 5} آخرين
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Mini Stats Row ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="طلابي النشطون" value={students.length}
          icon={Users} color="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400" />
        <MiniStat label="حصص الأسبوع" value={weekSessionsCount}
          icon={ClipboardList} color="bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400" />
        <MiniStat label="إجمالي السور" value={totalSurahs}
          icon={BookCheck} color="bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400" />
        <MiniStat
          label={todayRate !== null ? "حضور اليوم" : "يحتاج تسجيل"}
          value={todayRate !== null ? `${todayRate}%` : "—"}
          icon={TrendingUp}
          color={todayRate !== null
            ? "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400"
            : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500"} />
      </motion.div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left Col (wider): Quick Actions + Heatmap */}
        <div className="lg:col-span-2 space-y-5">

          {/* Quick Actions */}
          <div>
            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">إجراءات سريعة</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QuickAction label="حصة اليوم" desc="تسجيل الحضور" icon={ClipboardList} href="/app/sessions" color="from-[var(--color-primary)] to-[var(--color-primary-dark)]" />
              <QuickAction label="طلابي" desc="ملفات الفوج" icon={Users} href="/app/students" color="from-blue-500 to-blue-700" />
              <QuickAction label="الحفظ" desc="متابعة السور" icon={BookOpen} href="/app/quran" color="from-amber-500 to-amber-700" />
              <QuickAction label="التقرير" desc="ملاحظات اليوم" icon={Star} href="/app/reports" color="from-purple-500 to-purple-700" />
            </div>
          </div>

          {/* Attendance Heatmap */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-gray-800 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
                خريطة الحضور (7 أيام)
              </h3>
              <Link href="/app/performance" className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1 hover:underline">
                تفاصيل <ArrowLeft className="w-3 h-3" />
              </Link>
            </div>
            <WeekHeatmap sessions={sessions} studentCount={students.length} />
            <div className="flex items-center gap-4 mt-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 justify-center">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-400" />≥80%</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-400" />60–79%</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400" />&lt;60%</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-200 dark:bg-white/10" />بدون تسجيل</div>
            </div>
          </motion.div>

          {/* Absent Yesterday */}
          {absentYesterday.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5 bg-amber-50/50 dark:bg-amber-500/5">
                <h3 className="text-sm font-black text-gray-800 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  غابوا أمس ({absentYesterday.length})
                </h3>
                <p className="text-xs text-gray-400">تذكير بالمتابعة</p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {absentYesterday.slice(0, 5).map(s => (
                  <StudentRow key={s.id} student={s} absent />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Col: Students + Leaderboard hints */}
        <div className="space-y-5">

          {/* Students List */}
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-sm font-black text-gray-800 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--color-primary)]" />
                طلاب الفوج ({students.length})
              </h3>
              <Link href="/app/students" className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1 hover:underline">
                الكل <ArrowLeft className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-white/5 max-h-80 overflow-y-auto">
              {students.length > 0
                ? students.slice(0, 10).map(s => <StudentRow key={s.id} student={s} />)
                : (
                  <div className="p-6 text-center">
                    <Users className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">لا يوجد طلاب بعد</p>
                    <Link href="/app/students" className="mt-2 inline-block text-xs font-bold text-[var(--color-primary)] hover:underline">
                      إضافة طالب
                    </Link>
                  </div>
                )
              }
            </div>
          </motion.div>

          {/* Top memorizers mini-list */}
          {students.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
              className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
              <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-white/5">
                <Award className="w-4 h-4 text-[#d4af37]" />
                <h3 className="text-sm font-black text-gray-800 dark:text-white">أكثر حفظاً</h3>
              </div>
              <div className="p-3 space-y-1.5">
                {[...students]
                  .sort((a, b) => (b.memorizedSurahsCount || 0) - (a.memorizedSurahsCount || 0))
                  .slice(0, 3)
                  .map((s, i) => (
                    <Link key={s.id} href={`/app/students/${s.id}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                        i === 1 ? "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400" :
                        "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                      }`}>{i + 1}</span>
                      <p className="flex-1 text-sm font-bold text-gray-800 dark:text-white truncate">
                        {s.fullName.split(" ").slice(0, 2).join(" ")}
                      </p>
                      <span className="text-xs font-black text-[var(--color-primary)]">{s.memorizedSurahsCount ?? 0} ✦</span>
                    </Link>
                  ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
