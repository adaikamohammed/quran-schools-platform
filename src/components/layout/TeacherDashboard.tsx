"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Student, DailySession } from "@/lib/types";
import { surahs } from "@/lib/surahs";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Users, BookCheck, ClipboardList, Star, ArrowLeft, AlertTriangle,
  Clock, BookOpen, CheckCircle2, XCircle, TrendingUp, Award,
  Calendar, Flame, ChevronRight, BellRing, Zap, Phone,
  TrendingDown, Minus, BookMarked, Target, Sparkles, ChevronDown,
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────
function getDayName(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ar-DZ", { weekday: "long" });
}

// ─── Compact Student Row ─────────────────────────────────────
function StudentRow({
  student,
  absent,
}: {
  student: Student;
  absent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/3 transition-colors rounded-xl">
      <Link
        href={`/app/students/${student.id}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0
          ${absent
              ? "bg-red-500"
              : "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]"
            }`}
        >
          {student.fullName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
            {student.fullName}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {student.memorizedSurahsCount ?? 0} سورة محفوظة
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-1.5 shrink-0">
        {absent && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/15 text-red-600">
            غائب أمس
          </span>
        )}
        {absent && student.phone1 && (
          <a
            href={`tel:${student.phone1}`}
            title={`اتصل بولي أمر ${student.fullName}`}
            className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 hover:bg-emerald-200 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        )}
        {!absent && (
          <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
        )}
      </div>
    </div>
  );
}

// ─── Quick Action Card ────────────────────────────────────────
function QuickAction({
  label,
  desc,
  icon: Icon,
  href,
  color,
  badge,
}: {
  label: string;
  desc: string;
  icon: React.ElementType;
  href: string;
  color: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center text-center gap-2.5 p-4 bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] hover:shadow-lg hover:border-[var(--color-primary)]/20 transition-all duration-300 group"
    >
      {badge && (
        <span className="absolute top-2 left-2 text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <div
        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm font-black text-gray-800 dark:text-white">
          {label}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {desc}
        </p>
      </div>
    </Link>
  );
}

// ─── Mini Stat with Growth ────────────────────────────────────
function MiniStat({
  label,
  value,
  icon: Icon,
  color,
  growth,
  growthLabel,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  growth?: number | null; // positive = up, negative = down, 0 = same
  growthLabel?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 p-4 rounded-2xl border ${color}`}>
      <div className="flex items-center justify-between">
        <Icon className="w-5 h-5 opacity-80" />
        {growth !== undefined && growth !== null && (
          <span
            className={`flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full ${growth > 0
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                : growth < 0
                  ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                  : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
              }`}
          >
            {growth > 0 ? (
              <TrendingUp className="w-2.5 h-2.5" />
            ) : growth < 0 ? (
              <TrendingDown className="w-2.5 h-2.5" />
            ) : (
              <Minus className="w-2.5 h-2.5" />
            )}
            {growth > 0 ? `+${growth}` : growth === 0 ? "=" : growth}
            {growthLabel ? ` ${growthLabel}` : "%"}
          </span>
        )}
      </div>
      <p
        className="text-3xl font-black"
        style={{ fontFamily: "var(--font-headline)" }}
      >
        {value}
      </p>
      <p className="text-xs font-bold opacity-75">{label}</p>
    </div>
  );
}

// ─── Attendance Heatmap (7 days) ─────────────────────────────
function WeekHeatmap({
  sessions,
}: {
  sessions: DailySession[];
  studentCount: number;
}) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const daySessions = sessions.filter(
        (s) =>
          s.date === dateStr &&
          !["يوم عطلة", "غياب المعلم"].includes(s.sessionType)
      );

      let presentCount = 0,
        totalCount = 0;
      daySessions.forEach((s) =>
        s.records.forEach((r) => {
          if (r.attendance) {
            totalCount++;
            if (["حاضر", "متأخر", "تعويض"].includes(r.attendance))
              presentCount++;
          }
        })
      );

      const rate =
        totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : null;
      const dayName = d.toLocaleDateString("ar-DZ", { weekday: "short" });
      const isHoliday = sessions.some(
        (s) => s.date === dateStr && s.sessionType === "يوم عطلة"
      );
      const isAbsent = sessions.some(
        (s) => s.date === dateStr && s.sessionType === "غياب المعلم"
      );
      const isToday = i === 0;
      result.push({
        date: dateStr,
        rate,
        dayName,
        recorded: daySessions.length > 0,
        isHoliday,
        isAbsent,
        isToday,
        presentCount,
        totalCount,
      });
    }
    return result;
  }, [sessions]);

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 justify-between">
        {days.map((d) => (
          <div
            key={d.date}
            className="flex flex-col items-center gap-1.5 flex-1 relative"
            onMouseEnter={() => setHoveredDay(d.date)}
            onMouseLeave={() => setHoveredDay(null)}
          >
            {/* Tooltip */}
            <AnimatePresence>
              {hoveredDay === d.date && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.92 }}
                  className="absolute bottom-full mb-2 z-10 bg-gray-900 dark:bg-gray-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl whitespace-nowrap shadow-xl pointer-events-none"
                >
                  <p className="text-white/70">{d.date}</p>
                  {d.isHoliday && <p className="text-amber-300">يوم عطلة 🏖️</p>}
                  {d.isAbsent && <p className="text-red-300">غياب المعلم ❌</p>}
                  {!d.recorded && !d.isHoliday && !d.isAbsent && (
                    <p className="text-gray-300">لم تُسجَّل</p>
                  )}
                  {d.recorded && d.rate !== null && (
                    <>
                      <p className="text-emerald-300">حضور: {d.rate}%</p>
                      <p className="text-white/60">
                        {d.presentCount} / {d.totalCount} طالب
                      </p>
                    </>
                  )}
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800" />
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className={`w-full h-10 rounded-xl transition-all duration-200 cursor-pointer ${d.isToday
                  ? "ring-2 ring-[var(--color-primary)] ring-offset-1 dark:ring-offset-gray-900"
                  : ""
                } ${d.isHoliday
                  ? "bg-amber-100 dark:bg-amber-500/20"
                  : d.isAbsent
                    ? "bg-gray-200 dark:bg-white/10 opacity-50"
                    : !d.recorded
                      ? "bg-gray-100 dark:bg-white/5"
                      : d.rate! >= 80
                        ? "bg-emerald-400 dark:bg-emerald-500"
                        : d.rate! >= 60
                          ? "bg-amber-400 dark:bg-amber-500"
                          : "bg-red-400 dark:bg-red-500"
                } hover:opacity-80`}
            />
            <p
              className={`text-[10px] font-bold ${d.isToday
                  ? "text-[var(--color-primary)]"
                  : "text-gray-400 dark:text-gray-500"
                }`}
            >
              {d.dayName}
            </p>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 justify-center flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-400" />≥80%
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-400" />60–79%
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-400" />
          &lt;60%
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-500/20 border border-amber-300" />
          عطلة
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-200 dark:bg-white/10" />
          بدون تسجيل
        </div>
      </div>
    </div>
  );
}

// ─── Surah Progress Card ──────────────────────────────────────
function SurahProgressCard({ sessions }: { sessions: DailySession[] }) {
  // أحدث حصة فيها surahId
  const lastSessionWithSurah = useMemo(() => {
    return [...sessions]
      .filter(
        (s) =>
          s.surahId &&
          s.toVerse &&
          !["يوم عطلة", "غياب المعلم"].includes(s.sessionType)
      )
      .sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [sessions]);

  if (!lastSessionWithSurah) return null;

  const surah = surahs.find((s) => s.id === lastSessionWithSurah.surahId);
  if (!surah) return null;

  const toVerse = lastSessionWithSurah.toVerse ?? 0;
  const pct = Math.round((toVerse / surah.verses) * 100);
  const isComplete = toVerse >= surah.verses;
  const remaining = surah.verses - toVerse;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 dark:bg-emerald-400/20 flex items-center justify-center">
            <BookMarked className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wide">
              تقدم الحفظ الجماعي
            </p>
            <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400/60">
              آخر حصة مسجلة
            </p>
          </div>
        </div>
        {isComplete ? (
          <span className="flex items-center gap-1 text-[11px] font-black bg-emerald-500 text-white px-2.5 py-1 rounded-full">
            <Sparkles className="w-3 h-3" />
            أُنجزت ✓
          </span>
        ) : (
          <Link
            href="/app/sessions"
            className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            تسجيل حصة <ArrowLeft className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Surah info */}
      <div className="flex items-end justify-between">
        <div>
          <p
            className="text-2xl font-black text-emerald-800 dark:text-emerald-200"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            سورة {surah.name}
          </p>
          {!isComplete ? (
            <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
              من آية{" "}
              <b>{lastSessionWithSurah.fromVerse ?? 1}</b> إلى{" "}
              <b>{toVerse}</b>{" "}
              <span className="text-emerald-600/60 dark:text-emerald-500/60">
                (باقي {remaining} آية)
              </span>
            </p>
          ) : (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
              تم إنجاز كامل السورة ({surah.verses} آية) 🎉
            </p>
          )}
        </div>
        <div className="text-left">
          <p
            className="text-3xl font-black text-emerald-600 dark:text-emerald-400"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            {pct}%
          </p>
          <p className="text-[10px] text-emerald-500/70 text-left">
            {toVerse}/{surah.verses} آية
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="w-full h-2.5 bg-emerald-200/60 dark:bg-emerald-800/40 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className={`h-full rounded-full ${isComplete
                ? "bg-gradient-to-r from-emerald-500 to-green-400"
                : "bg-gradient-to-r from-emerald-500 to-teal-400"
              }`}
          />
        </div>
        <div className="flex justify-between text-[10px] text-emerald-600/60 dark:text-emerald-500/60 font-medium">
          <span>آية 1</span>
          <span>آية {surah.verses}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Weekly Goal Card ─────────────────────────────────────────
function WeeklyGoalCard({
  weekSessionsCount,
  targetPerWeek = 5,
}: {
  weekSessionsCount: number;
  targetPerWeek?: number;
}) {
  const pct = Math.min(100, Math.round((weekSessionsCount / targetPerWeek) * 100));
  const achieved = weekSessionsCount >= targetPerWeek;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 ${achieved
          ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-500/30"
          : "bg-white dark:bg-[var(--color-card)] border-[var(--color-border)]"
        }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target
            className={`w-4 h-4 ${achieved
                ? "text-amber-600 dark:text-amber-400"
                : "text-[var(--color-primary)]"
              }`}
          />
          <p
            className={`text-sm font-black ${achieved
                ? "text-amber-800 dark:text-amber-200"
                : "text-gray-800 dark:text-white"
              }`}
          >
            هدف الأسبوع
          </p>
        </div>
        {achieved && (
          <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            أُنجز!
          </span>
        )}
      </div>

      <div className="flex items-end gap-2 mb-2">
        <p
          className={`text-3xl font-black ${achieved
              ? "text-amber-700 dark:text-amber-300"
              : "text-gray-900 dark:text-white"
            }`}
          style={{ fontFamily: "var(--font-headline)" }}
        >
          {weekSessionsCount}
        </p>
        <p className="text-base text-gray-400 dark:text-gray-500 pb-1">
          / {targetPerWeek} حصة
        </p>
      </div>

      <div className="w-full h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`h-full rounded-full ${achieved
              ? "bg-gradient-to-r from-amber-400 to-orange-500"
              : "bg-gradient-to-r from-[var(--color-primary)] to-teal-500"
            }`}
        />
      </div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
        {achieved
          ? "أحسنت! حققت هدف هذا الأسبوع"
          : `${targetPerWeek - weekSessionsCount} حصة متبقية لإكمال الهدف`}
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherDashboard() {
  const { user, school } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysSinceLastSession, setDaysSinceLastSession] = useState<
    number | null
  >(null);
  const [lastSessionDate, setLastSessionDate] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !school?.id) return;

    const load = async () => {
      const { getDB } = await import("@/lib/storage/db");
      const db = getDB();

      // Fetch teacher's students
      const studs = await db.students
        .where("teacherId")
        .equals(user.id)
        .filter((s) => s.status === "نشط")
        .toArray();
      studs.sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
      setStudents(studs);

      // Fetch last 30 days of sessions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

      const sess = await db.sessions
        .where("teacherId")
        .equals(user.id)
        .filter((s) => s.date >= cutoff)
        .toArray();
      sess.sort((a, b) => b.date.localeCompare(a.date));
      setSessions(sess);

      // Days since last actual session
      const realSessions = sess.filter(
        (s) => !["يوم عطلة", "غياب المعلم"].includes(s.sessionType)
      );
      if (realSessions.length > 0) {
        const lastDate = new Date(realSessions[0].date);
        const diffMs = Date.now() - lastDate.getTime();
        setDaysSinceLastSession(Math.floor(diffMs / 86400000));
        setLastSessionDate(realSessions[0].date);
      } else {
        setDaysSinceLastSession(null);
        setLastSessionDate(null);
      }

      setLoading(false);
    };

    load();
  }, [user?.id, school?.id]);

  // === Computed Stats ===
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();
  const lastWeekStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  })();
  const sevenDaysAgoStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  })();

  const todaySessions = useMemo(
    () =>
      sessions.filter(
        (s) =>
          s.date === todayStr &&
          !["يوم عطلة", "غياب المعلم"].includes(s.sessionType)
      ),
    [sessions, todayStr]
  );

  const yesterdaySessions = useMemo(
    () => sessions.filter((s) => s.date === yesterdayStr),
    [sessions, yesterdayStr]
  );

  const todayRecorded = todaySessions.length > 0;

  // Today attendance
  const { presentToday, totalToday } = useMemo(() => {
    let present = 0,
      total = 0;
    todaySessions.forEach((s) =>
      s.records.forEach((r) => {
        if (r.attendance) {
          total++;
          if (["حاضر", "متأخر", "تعويض"].includes(r.attendance)) present++;
        }
      })
    );
    return { presentToday: present, totalToday: total };
  }, [todaySessions]);

  const todayRate =
    totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : null;

  // Students absent yesterday
  const absentYesterday = useMemo(() => {
    const absentIds = new Set<string>();
    yesterdaySessions.forEach((s) =>
      s.records.forEach((r) => {
        if (r.attendance === "غائب") absentIds.add(r.studentId);
      })
    );
    return students.filter((s) => absentIds.has(s.id));
  }, [yesterdaySessions, students]);

  // At-risk students (3+ absences in last 7 sessions)
  const atRisk = useMemo(() => {
    const recentSess = sessions.filter((s) => s.date >= sevenDaysAgoStr);
    const absentCount: Record<string, number> = {};
    recentSess.forEach((s) =>
      s.records.forEach((r) => {
        if (r.attendance === "غائب")
          absentCount[r.studentId] = (absentCount[r.studentId] || 0) + 1;
      })
    );
    return students.filter((s) => (absentCount[s.id] || 0) >= 3);
  }, [sessions, students, sevenDaysAgoStr]);

  // Week sessions count (this week vs last week)
  const weekSessionsCount = useMemo(
    () =>
      sessions.filter(
        (s) =>
          s.date >= sevenDaysAgoStr &&
          !["يوم عطلة", "غياب المعلم"].includes(s.sessionType)
      ).length,
    [sessions, sevenDaysAgoStr]
  );

  const lastWeekSessionsCount = useMemo(
    () =>
      sessions.filter(
        (s) =>
          s.date >= lastWeekStr &&
          s.date < sevenDaysAgoStr &&
          !["يوم عطلة", "غياب المعلم"].includes(s.sessionType)
      ).length,
    [sessions, lastWeekStr, sevenDaysAgoStr]
  );

  const sessionGrowth =
    lastWeekSessionsCount > 0
      ? weekSessionsCount - lastWeekSessionsCount
      : null;

  // Total memorized surahs (this week vs prev)
  const totalSurahs = useMemo(
    () => students.reduce((sum, s) => sum + (s.memorizedSurahsCount || 0), 0),
    [students]
  );

  // Attendance this week vs last week
  const weekAttendanceRate = useMemo(() => {
    const weeklySess = sessions.filter(
      (s) =>
        s.date >= sevenDaysAgoStr &&
        !["يوم عطلة", "غياب المعلم"].includes(s.sessionType)
    );
    let present = 0, total = 0;
    weeklySess.forEach(s => s.records.forEach(r => {
      if (r.attendance) { total++; if (["حاضر", "متأخر", "تعويض"].includes(r.attendance)) present++; }
    }));
    return total > 0 ? Math.round((present / total) * 100) : null;
  }, [sessions, sevenDaysAgoStr]);

  const prevWeekAttendanceRate = useMemo(() => {
    const prevSess = sessions.filter(
      (s) =>
        s.date >= lastWeekStr && s.date < sevenDaysAgoStr &&
        !["يوم عطلة", "غياب المعلم"].includes(s.sessionType)
    );
    let present = 0, total = 0;
    prevSess.forEach(s => s.records.forEach(r => {
      if (r.attendance) { total++; if (["حاضر", "متأخر", "تعويض"].includes(r.attendance)) present++; }
    }));
    return total > 0 ? Math.round((present / total) * 100) : null;
  }, [sessions, lastWeekStr, sevenDaysAgoStr]);

  const attendanceGrowth = weekAttendanceRate !== null && prevWeekAttendanceRate !== null
    ? weekAttendanceRate - prevWeekAttendanceRate
    : null;

  const miladiDate = new Intl.DateTimeFormat("ar-DZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const hijriDate = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4" dir="rtl">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5" dir="rtl">

      {/* ── Header Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-3xl p-6 text-white"
      >
        <div className="absolute inset-0 islamic-pattern opacity-10" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-white/60 text-sm font-medium">{miladiDate}</p>
            <h1
              className="text-2xl font-black mt-1"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              أهلاً وسهلاً، {user?.displayName?.split(" ")[0] ?? "أستاذ"} 👋
            </h1>
            <p className="text-white/70 text-sm mt-0.5">
              {user?.groupName ? `فوج ${user.groupName}` : "المعلم"} ·{" "}
              {school?.name}
            </p>
            <div className="flex items-center gap-2 mt-2 text-white/50 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>{hijriDate}</span>
            </div>
          </div>

          {/* Session status indicator */}
          <div
            className={`rounded-2xl px-5 py-3 ${todayRecorded
                ? "bg-white/15 border border-white/20"
                : "bg-amber-500/30 border border-amber-300/30 animate-pulse"
              }`}
          >
            <div className="flex items-center gap-2">
              {todayRecorded ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
              ) : (
                <BellRing className="w-5 h-5 text-amber-200 shrink-0" />
              )}
              <div>
                <p className="font-black text-sm">
                  {todayRecorded ? "الحصة مسجّلة ✓" : "لم تُسجَّل حصة اليوم"}
                </p>
                <p className="text-white/60 text-xs">
                  {todayRecorded
                    ? todayRate !== null
                      ? `نسبة الحضور: ${todayRate}%`
                      : ""
                    : "اضغط لتسجيل الحصة الآن"}
                </p>
              </div>
            </div>
            {!todayRecorded && (
              <Link
                href="/app/sessions"
                className="mt-2 block text-center text-xs font-black bg-white/20 hover:bg-white/30 rounded-xl py-1.5 transition-colors"
              >
                تسجيل الحصة →
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Critical Reminder: No session for X days ── */}
      {daysSinceLastSession !== null && daysSinceLastSession >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-black text-amber-900 dark:text-amber-200 text-sm">
              لم تُسجّل حصة منذ{" "}
              {daysSinceLastSession === 2
                ? "يومين"
                : `${daysSinceLastSession} أيام`}
            </p>
            <p className="text-amber-700 dark:text-amber-300 text-xs mt-0.5">
              {lastSessionDate ? (
                <>
                  آخر حصة كانت يوم{" "}
                  <b>{getDayName(lastSessionDate)}</b>{" "}
                  <span className="opacity-70">({lastSessionDate})</span>
                </>
              ) : (
                "يُنصح بتسجيل الحضور يومياً لمتابعة الطلاب بدقة."
              )}
            </p>
          </div>
          <Link
            href="/app/sessions"
            className="shrink-0 text-xs font-black bg-amber-500 text-white px-3 py-2 rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-1"
          >
            <Zap className="w-3 h-3" /> تسجيل
          </Link>
        </motion.div>
      )}

      {/* ── At-Risk Students Alert ── */}
      {atRisk.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl"
        >
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-red-900 dark:text-red-200 text-sm mb-1.5">
              {atRisk.length} طالب يحتاج متابعة عاجلة (3+ غيابات هذا الأسبوع)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {atRisk.slice(0, 5).map((s) => (
                <Link
                  key={s.id}
                  href={`/app/students/${s.id}`}
                  className="text-xs font-bold px-2.5 py-1 bg-white dark:bg-[var(--color-card)] border border-red-200 dark:border-red-500/30 rounded-full text-red-700 dark:text-red-300 hover:bg-red-50 transition-colors flex items-center gap-1"
                >
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

      {/* ── Surah Progress Card ── */}
      <SurahProgressCard sessions={sessions} />

      {/* ── Mini Stats Row ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <MiniStat
          label="طلابي النشطون"
          value={students.length}
          icon={Users}
          color="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
        />
        <MiniStat
          label="حصص الأسبوع"
          value={weekSessionsCount}
          icon={ClipboardList}
          color="bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400"
          growth={sessionGrowth}
          growthLabel="عن الأسبوع الماضي"
        />
        <MiniStat
          label="إجمالي السور المحفوظة"
          value={totalSurahs}
          icon={BookCheck}
          color="bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400"
        />
        <MiniStat
          label={weekAttendanceRate !== null ? "متوسط الحضور الأسبوعي" : "يحتاج تسجيل"}
          value={weekAttendanceRate !== null ? `${weekAttendanceRate}%` : "—"}
          icon={TrendingUp}
          color={
            weekAttendanceRate !== null
              ? "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400"
              : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500"
          }
          growth={attendanceGrowth}
          growthLabel="عن أسبوع قبل"
        />
      </motion.div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left Col (wider): Quick Actions + Heatmap + Goal */}
        <div className="lg:col-span-2 space-y-5">

          {/* Quick Actions */}
          <div>
            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              إجراءات سريعة
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QuickAction
                label="حصة اليوم"
                desc="تسجيل الحضور"
                icon={ClipboardList}
                href="/app/sessions"
                color="from-[var(--color-primary)] to-[var(--color-primary-dark)]"
                badge={!todayRecorded ? "!" : undefined}
              />
              <QuickAction
                label="طلابي"
                desc="ملفات الفوج"
                icon={Users}
                href="/app/students"
                color="from-blue-500 to-blue-700"
              />
              <QuickAction
                label="الحفظ"
                desc="متابعة السور"
                icon={BookOpen}
                href="/app/quran"
                color="from-amber-500 to-amber-700"
              />
              <QuickAction
                label="التقرير"
                desc="ملاحظات اليوم"
                icon={Star}
                href="/app/reports"
                color="from-purple-500 to-purple-700"
              />
            </div>
          </div>

          {/* Attendance Heatmap */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-gray-800 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
                خريطة الحضور (7 أيام)
              </h3>
              <Link
                href="/app/performance"
                className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1 hover:underline"
              >
                تفاصيل <ArrowLeft className="w-3 h-3" />
              </Link>
            </div>
            <WeekHeatmap sessions={sessions} studentCount={students.length} />
          </motion.div>

          {/* Weekly Goal */}
          <WeeklyGoalCard weekSessionsCount={weekSessionsCount} />

          {/* Absent Yesterday */}
          {absentYesterday.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5 bg-amber-50/50 dark:bg-amber-500/5">
                <h3 className="text-sm font-black text-gray-800 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  غابوا أمس ({absentYesterday.length})
                </h3>
                <p className="text-xs text-gray-400">
                  اضغط{" "}
                  <Phone className="inline w-3 h-3 text-emerald-500" /> للاتصال
                  بالولي
                </p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {absentYesterday.slice(0, 5).map((s) => (
                  <StudentRow key={s.id} student={s} absent />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Col: Students + Leaderboard */}
        <div className="space-y-5">

          {/* Students List */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-sm font-black text-gray-800 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--color-primary)]" />
                طلاب الفوج ({students.length})
              </h3>
              <Link
                href="/app/students"
                className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1 hover:underline"
              >
                الكل <ArrowLeft className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-white/5 max-h-80 overflow-y-auto">
              {students.length > 0 ? (
                students
                  .slice(0, 10)
                  .map((s) => <StudentRow key={s.id} student={s} />)
              ) : (
                <div className="p-6 text-center">
                  <Users className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">لا يوجد طلاب بعد</p>
                  <Link
                    href="/app/students"
                    className="mt-2 inline-block text-xs font-bold text-[var(--color-primary)] hover:underline"
                  >
                    إضافة طالب
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Top memorizers with last surah */}
          {students.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden"
            >
              <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-white/5">
                <Award className="w-4 h-4 text-[#d4af37]" />
                <h3 className="text-sm font-black text-gray-800 dark:text-white">
                  أكثر حفظاً
                </h3>
              </div>
              <div className="p-3 space-y-1.5">
                {[...students]
                  .sort(
                    (a, b) =>
                      (b.memorizedSurahsCount || 0) -
                      (a.memorizedSurahsCount || 0)
                  )
                  .slice(0, 3)
                  .map((s, i) => {
                    // اجلب آخر سورة محفوظها من currentSurahId
                    const lastSurah = s.currentSurahId
                      ? surahs.find((sr) => sr.id === s.currentSurahId)
                      : null;

                    return (
                      <Link
                        key={s.id}
                        href={`/app/students/${s.id}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                      >
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${i === 0
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                              : i === 1
                                ? "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                                : "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                            }`}
                        >
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
                            {s.fullName.split(" ").slice(0, 2).join(" ")}
                          </p>
                          {lastSurah && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                              📖 {lastSurah.name}
                            </p>
                          )}
                        </div>
                        <div className="text-left shrink-0">
                          <p className="text-sm font-black text-[var(--color-primary)]">
                            {s.memorizedSurahsCount ?? 0}
                          </p>
                          <p className="text-[9px] text-gray-400">سورة</p>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </motion.div>
          )}

          {/* Quick links card */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden"
          >
            <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-white/5">
              <BookCheck className="w-4 h-4 text-[var(--color-primary)]" />
              <h3 className="text-sm font-black text-gray-800 dark:text-white">
                روابط سريعة
              </h3>
            </div>
            <div className="p-2 space-y-1">
              {[
                { label: "لوحة الأداء", href: "/app/performance", desc: "إحصاءات الحضور" },
                { label: "العهود والعقوبات", href: "/app/covenants", desc: "متابعة السلوك" },
                { label: "نظام النقاط", href: "/app/points", desc: "مكافأة التميز" },
                { label: "شهادات الطلاب", href: "/app/certificates", desc: "إصدار الشهادات" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-[var(--color-primary)] transition-colors">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-gray-400">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[var(--color-primary)] transition-colors" />
                </Link>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
