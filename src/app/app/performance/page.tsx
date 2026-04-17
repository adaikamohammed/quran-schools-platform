"use client";
import SchoolGuard from "@/components/layout/SchoolGuard";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import type { Student, DailySession, AppUser } from "@/lib/types";
import {
  getCurrentSeason, getSeasonDateRange, formatSeasonLabel,
  SEASONS, type SeasonNumber,
} from "@/lib/seasons";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, TrendingDown, Users,
  CheckCircle, AlertCircle, Clock,
  Star, BookOpen, Activity, Award, ChevronDown,
  Filter, RefreshCw, Trophy, Medal, BookCheck, Flame,
  Minus, Printer, ArrowUpRight, ArrowDownRight,
  Calendar, Layers,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// مساعدات
// ─────────────────────────────────────────────────────────────

function getMonthLabel(monthIndex: number): string {
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  return months[monthIndex] ?? String(monthIndex + 1);
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const week = Math.ceil(d.getDate() / 7);
  return `أ${week} ${getMonthLabel(d.getMonth()).slice(0, 3)}`;
}

/** حساب ميل الانحدار الخطي البسيط — يُعيد قيمة موجبة أو سالبة */
function calcLinearTrendSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  values.forEach((y, x) => {
    num += (x - xMean) * (y - yMean);
    den += (x - xMean) ** 2;
  });
  return den === 0 ? 0 : num / den;
}

// ─────────────────────────────────────────────────────────────
// مكوّن شريط التقدم
// ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color = "bg-emerald-400" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-xs font-black text-gray-600 dark:text-gray-300 w-10 text-left">{pct}%</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// مكوّن مؤشر الاتجاه
// ─────────────────────────────────────────────────────────────

function TrendIndicator({ slope, className = "" }: { slope: number; className?: string }) {
  if (Math.abs(slope) < 0.5) {
    return (
      <span className={`flex items-center gap-1 text-[11px] font-bold text-gray-400 ${className}`}>
        <Minus className="w-3 h-3" /> مستقر
      </span>
    );
  }
  const isUp = slope > 0;
  return (
    <span className={`flex items-center gap-1 text-[11px] font-bold ${isUp ? "text-emerald-600" : "text-red-500"} ${className}`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isUp ? "اتجاه نمو" : "اتجاه تراجع"}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// رسم بياني مع خط الاتجاه (CSS + SVG)
// ─────────────────────────────────────────────────────────────

function BarChartWithTrend({
  data,
  color = "bg-[var(--color-primary)]",
  label,
  showTrend = true,
}: {
  data: { label: string; value: number; max: number }[];
  color?: string;
  label: string;
  showTrend?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const globalMax = Math.max(...data.map(d => d.max || 1), 1);
  const values = data.map(d => d.value);
  const slope = calcLinearTrendSlope(values);

  // نقاط خط الاتجاه (أعلى كل عضادة + خط الانحدار)
  const BAR_HEIGHT = 20; // px — ارتفاع كل عضادة
  const BAR_GAP = 8;     // px — مسافة بين العضادات
  const LABEL_W = 52;    // px — عرض اللصيقة الجانبية

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
        {showTrend && values.filter(v => v > 0).length >= 3 && (
          <TrendIndicator slope={slope} />
        )}
      </div>

      {/* العضادات */}
      <div ref={containerRef} className="space-y-2 relative">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 w-13 shrink-0 text-left" style={{ width: LABEL_W }}>{d.label}</span>
            <div className="flex-1 h-5 bg-gray-100 dark:bg-white/8 rounded-lg overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((d.value / globalMax) * 100)}%` }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className={`h-full ${color} rounded-lg`}
              />
            </div>
            <span className="text-[11px] font-black text-gray-600 dark:text-gray-300 w-8 shrink-0">{d.value}</span>
          </div>
        ))}

        {/* خط الاتجاه SVG — يُرسم فوق العضادات */}
        {showTrend && values.filter(v => v > 0).length >= 3 && containerWidth > 0 && (() => {
          const n = data.length;
          const totalH = n * (BAR_HEIGHT + BAR_GAP) - BAR_GAP;
          const barAreaW = containerWidth - LABEL_W - 36; // 36 = gap + رقم
          const xMean = (n - 1) / 2;
          const yMean = values.reduce((a, b) => a + b, 0) / n;
          let num = 0, den = 0;
          values.forEach((y, x) => { num += (x - xMean) * (y - yMean); den += (x - xMean) ** 2; });
          const slope2 = den === 0 ? 0 : num / den;
          const intercept = yMean - slope2 * xMean;



          // نقاط بسيطة: وسط كل عضادة أفقياً، وارتفاع الاتجاه المتوقع
          const pts = data.map((d, i) => {
            const predictedPct = Math.max(0, Math.min(100, ((slope2 * i + intercept) / globalMax) * 100));
            const xPx = LABEL_W + 6 + (barAreaW * i / Math.max(n - 1, 1));
            const yPx = (BAR_HEIGHT + BAR_GAP) * i + BAR_HEIGHT / 2;
            return { x: xPx, y: yPx, pct: predictedPct };
          });

          const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

          return (
            <svg
              className="absolute inset-0 pointer-events-none"
              width={containerWidth}
              height={n * (BAR_HEIGHT + BAR_GAP)}
              style={{ top: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="trendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={slope > 0 ? "#10b981" : "#ef4444"} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={slope > 0 ? "#10b981" : "#ef4444"} stopOpacity="1" />
                </linearGradient>
              </defs>
              <path
                d={pathD}
                fill="none"
                stroke="url(#trendGrad)"
                strokeWidth="2"
                strokeDasharray="5 3"
                strokeLinecap="round"
              />
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3"
                  fill={slope > 0 ? "#10b981" : "#ef4444"}
                  opacity="0.8"
                />
              ))}
            </svg>
          );
        })()}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// بطاقة KPI
// ─────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, gradient, delay = 0, trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; gradient: string; delay?: number;
  trend?: { value: number; up: boolean };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5 relative overflow-hidden group hover:shadow-lg transition-shadow"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-5 -translate-y-6 translate-x-6`} />
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-sm`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-white" style={{ fontFamily: "var(--font-headline)" }}>
        {value}
      </p>
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trend.up ? "text-emerald-600" : "text-red-500"}`}>
          {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend.value > 0 ? `+${trend.value}` : trend.value}%
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// المقارنة الفصلية
// ─────────────────────────────────────────────────────────────

interface SeasonStats {
  label: string;
  emoji: string;
  color: string;
  attendanceRate: number;
  memExcellentRate: number;
  sessionsCount: number;
  studentsCount: number;
  bestStudent: string | null;
  totalPresent: number;
  totalAbsent: number;
}

function computeSeasonStats(
  seasonNum: SeasonNumber,
  year: number,
  sessions: DailySession[],
  students: Student[]
): SeasonStats {
  const season = SEASONS[seasonNum];
  const { from, to } = getSeasonDateRange(seasonNum, year);
  const filtered = sessions.filter(s =>
    s.date >= from && s.date <= to &&
    s.sessionType !== "يوم عطلة" && s.sessionType !== "غياب المعلم"
  );

  const studentIds = new Set(students.map(s => s.id));
  let totalPresent = 0, totalAbsent = 0, totalAttendance = 0;
  let totalMemExcellent = 0, totalMem = 0;
  const studentScores: Record<string, { name: string; present: number; total: number }> = {};

  filtered.forEach(session => {
    session.records.forEach(rec => {
      if (!studentIds.has(rec.studentId)) return;
      if (rec.attendance) {
        totalAttendance++;
        if (["حاضر", "تعويض", "متأخر"].includes(rec.attendance)) totalPresent++;
        if (rec.attendance === "غائب") totalAbsent++;
      }
      if (rec.memorization === "ممتاز") totalMemExcellent++;
      if (rec.memorization) totalMem++;

      if (!studentScores[rec.studentId]) {
        const st = students.find(s => s.id === rec.studentId);
        studentScores[rec.studentId] = { name: st?.fullName ?? "مجهول", present: 0, total: 0 };
      }
      studentScores[rec.studentId].total++;
      if (["حاضر", "تعويض"].includes(rec.attendance ?? "")) {
        studentScores[rec.studentId].present++;
      }
    });
  });

  const bestStudent = Object.values(studentScores)
    .filter(s => s.total >= 3)
    .sort((a, b) => (b.present / b.total) - (a.present / a.total))[0]?.name ?? null;

  return {
    label: season.name,
    emoji: season.emoji,
    color: season.color,
    attendanceRate: totalAttendance > 0 ? Math.round((totalPresent / totalAttendance) * 100) : 0,
    memExcellentRate: totalMem > 0 ? Math.round((totalMemExcellent / totalMem) * 100) : 0,
    sessionsCount: filtered.length,
    studentsCount: students.length,
    totalPresent,
    totalAbsent,
    bestStudent,
  };
}

function DeltaBadge({ current, prev, unit = "%" }: { current: number; prev: number; unit?: string }) {
  const diff = current - prev;
  if (prev === 0) return null;
  const isUp = diff > 0;
  const isZero = diff === 0;
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
      isZero ? "bg-gray-100 text-gray-500"
      : isUp ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700"
      : "bg-red-100 dark:bg-red-500/20 text-red-600"
    }`}>
      {isZero ? <Minus className="w-2.5 h-2.5" /> : isUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
      {isZero ? "نفسه" : `${isUp ? "+" : ""}${diff}${unit}`}
    </span>
  );
}

function SeasonComparison({
  sessions,
  students,
}: {
  sessions: DailySession[];
  students: Student[];
}) {
  const now = new Date();
  const currentSeasonNum = getCurrentSeason().number;
  const currentYear = now.getFullYear();

  // الفصل السابق
  const prevSeasonNum = currentSeasonNum === 1 ? 4 : (currentSeasonNum - 1) as SeasonNumber;
  const prevYear = currentSeasonNum === 1 ? currentYear - 1 : currentYear;

  const current = useMemo(() =>
    computeSeasonStats(currentSeasonNum, currentYear, sessions, students),
    [sessions, students, currentSeasonNum, currentYear]
  );
  const prev = useMemo(() =>
    computeSeasonStats(prevSeasonNum, prevYear, sessions, students),
    [sessions, students, prevSeasonNum, prevYear]
  );

  const metrics = [
    {
      label: "نسبة الحضور",
      icon: CheckCircle,
      currentVal: `${current.attendanceRate}%`,
      prevVal: `${prev.attendanceRate}%`,
      diff: current.attendanceRate - prev.attendanceRate,
      unit: "%",
      color: "text-emerald-600",
    },
    {
      label: "الحفظ الممتاز",
      icon: Star,
      currentVal: `${current.memExcellentRate}%`,
      prevVal: `${prev.memExcellentRate}%`,
      diff: current.memExcellentRate - prev.memExcellentRate,
      unit: "%",
      color: "text-amber-600",
    },
    {
      label: "الحصص المسجلة",
      icon: Calendar,
      currentVal: String(current.sessionsCount),
      prevVal: String(prev.sessionsCount),
      diff: current.sessionsCount - prev.sessionsCount,
      unit: "",
      color: "text-indigo-600",
    },
    {
      label: "حضور إجمالي",
      icon: Users,
      currentVal: String(current.totalPresent),
      prevVal: String(prev.totalPresent),
      diff: current.totalPresent - prev.totalPresent,
      unit: "",
      color: "text-blue-600",
    },
  ];

  return (
    <div className="space-y-5">
      {/* رأس المقارنة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* الفصل الحالي */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-[var(--color-card)] rounded-2xl border-2 p-5 relative overflow-hidden"
          style={{ borderColor: current.color }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -translate-y-4 translate-x-4"
            style={{ background: current.color }} />
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{current.emoji}</span>
            <div>
              <p className="font-black text-gray-800 dark:text-white text-sm">{current.label}</p>
              <p className="text-[10px] text-gray-400">الفصل الحالي — {currentYear}</p>
            </div>
            <span className="mr-auto text-xs font-black px-2 py-0.5 rounded-full text-white"
              style={{ background: current.color }}>
              الحالي
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
              <p className="text-xl font-black" style={{ color: current.color }}>{current.attendanceRate}%</p>
              <p className="text-[10px] text-gray-400">نسبة الحضور</p>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
              <p className="text-xl font-black text-amber-600">{current.memExcellentRate}%</p>
              <p className="text-[10px] text-gray-400">حفظ ممتاز</p>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
              <p className="text-xl font-black text-indigo-600">{current.sessionsCount}</p>
              <p className="text-[10px] text-gray-400">حصة مسجلة</p>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
              <p className="text-xl font-black text-blue-600">{current.totalPresent}</p>
              <p className="text-[10px] text-gray-400">حضور إجمالي</p>
            </div>
          </div>
          {current.bestStudent && (
            <div className="mt-3 flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
              <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300 truncate">
                الأفضل: {current.bestStudent}
              </p>
            </div>
          )}
        </motion.div>

        {/* الفصل الماضي */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5 relative overflow-hidden opacity-80"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{prev.emoji}</span>
            <div>
              <p className="font-black text-gray-800 dark:text-white text-sm">{prev.label}</p>
              <p className="text-[10px] text-gray-400">الفصل الماضي — {prevYear}</p>
            </div>
            <span className="mr-auto text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500">
              السابق
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
              <p className="text-xl font-black text-gray-600">{prev.attendanceRate}%</p>
              <p className="text-[10px] text-gray-400">نسبة الحضور</p>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
              <p className="text-xl font-black text-gray-500">{prev.memExcellentRate}%</p>
              <p className="text-[10px] text-gray-400">حفظ ممتاز</p>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
              <p className="text-xl font-black text-gray-500">{prev.sessionsCount}</p>
              <p className="text-[10px] text-gray-400">حصة مسجلة</p>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
              <p className="text-xl font-black text-gray-500">{prev.totalPresent}</p>
              <p className="text-[10px] text-gray-400">حضور إجمالي</p>
            </div>
          </div>
          {prev.bestStudent && (
            <div className="mt-3 flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-white/5 rounded-xl">
              <Trophy className="w-4 h-4 text-gray-400 shrink-0" />
              <p className="text-xs font-bold text-gray-500 truncate">
                الأفضل: {prev.bestStudent}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* جدول الفروقات */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden"
      >
        <div className="flex items-center gap-2 p-4 border-b border-[var(--color-border)]">
          <Layers className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-black text-gray-800 dark:text-white">مقارنة تفصيلية بين الفصلين</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {metrics.map(m => {
            const Icon = m.icon;
            const isUp = m.diff > 0;
            const isZero = m.diff === 0;
            return (
              <div key={m.label} className="flex items-center gap-4 p-4">
                <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{m.label}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">السابق</p>
                    <p className="text-sm font-black text-gray-500">{m.prevVal}</p>
                  </div>
                  <div className="w-8 flex items-center justify-center">
                    {isZero ? (
                      <Minus className="w-4 h-4 text-gray-300" />
                    ) : isUp ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">الحالي</p>
                    <p className={`text-sm font-black ${isZero ? "text-gray-600" : isUp ? "text-emerald-600" : "text-red-500"}`}>
                      {m.currentVal}
                    </p>
                  </div>
                  <DeltaBadge current={Number(m.currentVal.replace("%",""))} prev={Number(m.prevVal.replace("%",""))} unit={m.unit} />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* جميع فصول السنة */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5"
      >
        <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">نسبة الحضور — جميع فصول {currentYear}</p>
        <div className="grid grid-cols-4 gap-3">
          {([1, 2, 3, 4] as SeasonNumber[]).map(sn => {
            const s = computeSeasonStats(sn, currentYear, sessions, students);
            const isActive = sn === currentSeasonNum;
            return (
              <div key={sn}
                className={`rounded-xl p-3 text-center border transition-all ${isActive
                  ? "border-2 shadow-sm"
                  : "border-[var(--color-border)] opacity-70"
                }`}
                style={{ borderColor: isActive ? SEASONS[sn].color : undefined }}
              >
                <p className="text-xl mb-1">{SEASONS[sn].emoji}</p>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{SEASONS[sn].name}</p>
                <p className="text-lg font-black" style={{ color: SEASONS[sn].color }}>
                  {s.attendanceRate > 0 ? `${s.attendanceRate}%` : "—"}
                </p>
                <p className="text-[10px] text-gray-400">{s.sessionsCount} حصة</p>
                {isActive && <span className="inline-block mt-1 text-[9px] font-black text-white px-1.5 py-0.5 rounded-full" style={{ background: SEASONS[sn].color }}>الحالي</span>}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// مقارنة الأفواج
// ─────────────────────────────────────────────────────────────

interface GroupStat {
  groupName: string;
  teacherName: string;
  studentCount: number;
  attendanceRate: number;
  weeklyMemRate: number;
  totalSurahs: number;
  activeSessions: number;
  score: number;
}

function getMedalStyle(rank: number) {
  if (rank === 0) return { bg: "bg-amber-100 dark:bg-amber-500/20", text: "text-amber-700 dark:text-amber-400", label: "🥇", border: "border-amber-300 dark:border-amber-500/40" };
  if (rank === 1) return { bg: "bg-gray-100 dark:bg-white/10", text: "text-gray-600 dark:text-gray-300", label: "🥈", border: "border-gray-300 dark:border-white/20" };
  if (rank === 2) return { bg: "bg-orange-50 dark:bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", label: "🥉", border: "border-orange-200 dark:border-orange-500/30" };
  return { bg: "bg-white dark:bg-[var(--color-card)]", text: "text-gray-500", label: String(rank + 1), border: "border-[var(--color-border)]" };
}

function GroupsComparison({ teachers, allStudents, allSessions }: {
  teachers: AppUser[];
  allStudents: Student[];
  allSessions: DailySession[];
}) {
  const groups: GroupStat[] = useMemo(() => {
    return teachers.map(t => {
      const studs = allStudents.filter(s => s.teacherId === t.id && s.status === "نشط");
      const sess = allSessions.filter(s =>
        s.teacherId === t.id && !["يوم عطلة", "غياب المعلم"].includes(s.sessionType)
      );
      let present = 0, total = 0, memoSum = 0, memoCount = 0;
      const MEM_SCORES: Record<string, number> = { "ممتاز": 100, "جيد جداً": 80, "جيد": 65, "حسن": 55, "متوسط": 35, "لم يحفظ": 0 };
      const studSet = new Set(studs.map(s => s.id));
      sess.forEach(s => s.records.forEach(r => {
        if (!studSet.has(r.studentId)) return;
        if (r.attendance) { total++; if (["حاضر", "متأخر", "تعويض"].includes(r.attendance)) present++; }
        if (r.memorization && MEM_SCORES[r.memorization] !== undefined) { memoSum += MEM_SCORES[r.memorization]; memoCount++; }
      }));
      const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
      const weeklyMemRate = memoCount > 0 ? Math.round(memoSum / memoCount) : 0;
      const totalSurahs = studs.reduce((acc, s) => acc + (s.memorizedSurahsCount || 0), 0);
      const score = Math.round(attendanceRate * 0.5 + weeklyMemRate * 0.3 + Math.min(totalSurahs, 100) * 0.2);
      return { groupName: t.groupName || t.displayName, teacherName: t.displayName, studentCount: studs.length, attendanceRate, weeklyMemRate, totalSurahs, activeSessions: sess.length, score };
    }).filter(g => g.studentCount > 0).sort((a, b) => b.score - a.score);
  }, [teachers, allStudents, allSessions]);

  if (groups.length === 0) {
    return (
      <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-12 text-center">
        <Trophy className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
        <p className="font-bold text-gray-500">لا توجد بيانات أفواج كافية للمقارنة</p>
        <p className="text-xs text-gray-400 mt-1">سجّل حصصاً لأكثر من فوج لتظهر هنا المقارنة</p>
      </div>
    );
  }

  const maxAtt = Math.max(...groups.map(g => g.attendanceRate), 1);
  const maxMem = Math.max(...groups.map(g => g.weeklyMemRate), 1);

  return (
    <div className="space-y-5">
      {/* لوحة الشرف */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-l from-[#1a1a2e] to-[#16213e] rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-black">لوحة شرف الأفواج</h2>
              <p className="text-white/50 text-xs">مرتبة بحسب النقاط المركّبة (حضور + حفظ + سور)</p>
            </div>
          </div>
          <div className="flex items-end justify-center gap-3 mt-2 mb-4">
            {groups[1] && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="flex-1 max-w-[160px] text-center">
                <div className="bg-white/10 rounded-2xl p-4 pt-5 border border-white/10">
                  <p className="text-3xl mb-2">🥈</p>
                  <p className="text-sm font-black leading-tight truncate">{groups[1].groupName}</p>
                  <p className="text-white/50 text-[10px] mt-0.5 truncate">{groups[1].teacherName}</p>
                  <p className="text-2xl font-black text-gray-300 mt-2" style={{ fontFamily: "var(--font-headline)" }}>
                    {groups[1].score}<span className="text-xs font-medium text-white/40"> نقطة</span>
                  </p>
                </div>
                <div className="h-8 bg-gray-400/20 rounded-b-xl" />
              </motion.div>
            )}
            {groups[0] && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="flex-1 max-w-[180px] text-center -translate-y-4">
                <div className="bg-gradient-to-b from-amber-500/30 to-amber-600/10 rounded-2xl p-5 border border-amber-400/30 shadow-lg shadow-amber-500/10">
                  <p className="text-4xl mb-2">🥇</p>
                  <p className="text-sm font-black leading-tight truncate">{groups[0].groupName}</p>
                  <p className="text-amber-300/60 text-[10px] mt-0.5 truncate">{groups[0].teacherName}</p>
                  <p className="text-3xl font-black text-amber-300 mt-2" style={{ fontFamily: "var(--font-headline)" }}>
                    {groups[0].score}<span className="text-xs font-medium text-amber-300/60"> نقطة</span>
                  </p>
                </div>
                <div className="h-12 bg-amber-400/20 rounded-b-xl" />
              </motion.div>
            )}
            {groups[2] && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="flex-1 max-w-[160px] text-center">
                <div className="bg-white/10 rounded-2xl p-4 pt-5 border border-white/10">
                  <p className="text-3xl mb-2">🥉</p>
                  <p className="text-sm font-black leading-tight truncate">{groups[2].groupName}</p>
                  <p className="text-white/50 text-[10px] mt-0.5 truncate">{groups[2].teacherName}</p>
                  <p className="text-2xl font-black text-orange-300 mt-2" style={{ fontFamily: "var(--font-headline)" }}>
                    {groups[2].score}<span className="text-xs font-medium text-white/40"> نقطة</span>
                  </p>
                </div>
                <div className="h-4 bg-orange-400/20 rounded-b-xl" />
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* مقارنة الحضور والحفظ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-black text-gray-800 dark:text-white">مقارنة معدل الحضور</h3>
          </div>
          <div className="space-y-3">
            {groups.map((g, i) => {
              const medal = getMedalStyle([...groups].sort((a, b) => b.attendanceRate - a.attendanceRate).findIndex(x => x.groupName === g.groupName));
              return (
                <div key={g.groupName} className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${medal.bg} ${medal.text}`}>{medal.label}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{g.groupName}</span>
                      <span className={`text-xs font-black shrink-0 ${g.attendanceRate >= 80 ? "text-emerald-600" : g.attendanceRate >= 60 ? "text-amber-600" : "text-red-500"}`}>{g.attendanceRate}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-white/8 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((g.attendanceRate / maxAtt) * 100)}%` }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                        className={`h-full rounded-full ${g.attendanceRate >= 80 ? "bg-emerald-500" : g.attendanceRate >= 60 ? "bg-amber-500" : "bg-red-500"}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{g.studentCount} طالب</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookCheck className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-black text-gray-800 dark:text-white">مقارنة معدل الحفظ</h3>
          </div>
          <div className="space-y-3">
            {groups.map((g, i) => {
              const medal = getMedalStyle([...groups].sort((a, b) => b.weeklyMemRate - a.weeklyMemRate).findIndex(x => x.groupName === g.groupName));
              return (
                <div key={g.groupName} className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${medal.bg} ${medal.text}`}>{medal.label}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{g.groupName}</span>
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400 shrink-0">{g.weeklyMemRate}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-white/8 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${maxMem > 0 ? Math.round((g.weeklyMemRate / maxMem) * 100) : 0}%` }}
                        transition={{ delay: 0.35 + i * 0.05, duration: 0.5 }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{g.totalSurahs} سورة</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* جدول كامل */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
        <div className="flex items-center gap-2 p-5 border-b border-[var(--color-border)]">
          <Flame className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-black text-gray-800 dark:text-white">الترتيب الكامل للأفواج</h3>
          <span className="mr-auto text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-white/8 px-2 py-0.5 rounded-full">
            النقاط = 50% حضور + 30% حفظ + 20% سور
          </span>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {groups.map((g, i) => {
            const { bg, text, label, border } = getMedalStyle(i);
            return (
              <div key={g.groupName} className={`flex items-center gap-4 p-4 ${i === 0 ? "bg-amber-50/50 dark:bg-amber-500/5" : ""}`}>
                <div className={`w-9 h-9 rounded-xl ${bg} ${text} flex items-center justify-center text-sm font-black shrink-0 border ${border}`}>{label}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-gray-800 dark:text-white truncate">{g.groupName}</p>
                    {i === 0 && <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-md shrink-0">الأفضل</span>}
                  </div>
                  <p className="text-xs text-gray-400">{g.teacherName} · {g.studentCount} طالب · {g.activeSessions} حصة</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center shrink-0">
                  <div>
                    <p className={`text-xs font-black ${g.attendanceRate >= 80 ? "text-emerald-600" : g.attendanceRate >= 60 ? "text-amber-600" : "text-red-500"}`}>{g.attendanceRate}%</p>
                    <p className="text-[10px] text-gray-400">حضور</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-blue-600 dark:text-blue-400">{g.weeklyMemRate}%</p>
                    <p className="text-[10px] text-gray-400">حفظ</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-purple-600 dark:text-purple-400">{g.score}</p>
                    <p className="text-[10px] text-gray-400">نقطة</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CSS الطباعة (مُدرج في الصفحة)
// ─────────────────────────────────────────────────────────────

function PrintStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @media print {
        body { direction: rtl; font-family: serif; }
        .no-print { display: none !important; }
        .print-break { page-break-before: always; }
        nav, header, aside, .sidebar, [data-sidebar] { display: none !important; }
        .max-w-5xl { max-width: 100% !important; }
        .dark\\:bg-\\[var\\(--color-card\\)\\] { background: white !important; }
        * { color: black !important; border-color: #ddd !important; }
      }
    `}} />
  );
}

// ─────────────────────────────────────────────────────────────
// الصفحة الرئيسية
// ─────────────────────────────────────────────────────────────

function PerformancePage() {
  const { user, school, isPrincipal } = useAuth();
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"annual" | "weekly" | "seasonal" | "groups">("annual");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [printing, setPrinting] = useState(false);

  // بيانات المقارنة غير المُصفاة
  const [compStudents, setCompStudents] = useState<Student[]>([]);
  const [compSessions, setCompSessions] = useState<DailySession[]>([]);

  const load = useCallback(async () => {
    if (!school?.id) return;
    setLoading(true);
    const db = getDB();

    const schoolTeachers = await db.users
      .where("schoolId").equals(school.id)
      .filter(u => u.role === "teacher").toArray();
    setTeachers(schoolTeachers.sort((a, b) => a.displayName.localeCompare(b.displayName, "ar")));

    let studs: Student[];
    let allSessions: DailySession[];

    if (isPrincipal || user?.role === "super_admin") {
      studs = await db.students.where("schoolId").equals(school.id).filter(s => s.status === "نشط").toArray();
      allSessions = await db.sessions.where("schoolId").equals(school.id).toArray();
    } else {
      studs = await db.students.where("teacherId").equals(user!.id).filter(s => s.status === "نشط").toArray();
      allSessions = await db.sessions.where("teacherId").equals(user!.id).toArray();
    }

    // نحتفظ بنسخة غير مُصفاة للمقارنة
    setCompStudents([...studs]);
    setCompSessions([...allSessions]);

    if (selectedTeacherId !== "all") {
      studs = studs.filter(s => s.teacherId === selectedTeacherId);
      allSessions = allSessions.filter(s => s.teacherId === selectedTeacherId);
    }

    setStudents(studs);
    setSessions(allSessions.filter(s => new Date(s.date).getFullYear() === selectedYear));
    setLoading(false);
  }, [school?.id, isPrincipal, user?.id, selectedTeacherId, selectedYear]);

  useEffect(() => { load(); }, [load]);

  // ─── تحليل البيانات ─────────────────────────────────────

  const analytics = useMemo(() => {
    const studentIds = new Set(students.map(s => s.id));
    let totalPresent = 0, totalAbsent = 0, totalLate = 0;
    let totalMemExcellent = 0, totalMemGood = 0, totalMemPoor = 0;
    let totalReviewDone = 0, totalReviewTotal = 0;

    const monthlyData: Record<number, { sessions: number; present: number; absent: number; memo: number; memoCount: number }> = {};
    for (let m = 0; m < 12; m++) monthlyData[m] = { sessions: 0, present: 0, absent: 0, memo: 0, memoCount: 0 };

    const weekMap: Record<string, { present: number; absent: number; total: number }> = {};

    sessions.forEach(session => {
      if (session.sessionType === "يوم عطلة" || session.sessionType === "غياب المعلم") return;
      const month = new Date(session.date).getMonth();
      monthlyData[month].sessions++;
      const weekLabel = getWeekLabel(session.date);
      weekMap[weekLabel] = weekMap[weekLabel] ?? { present: 0, absent: 0, total: 0 };

      session.records.forEach(rec => {
        if (!studentIds.has(rec.studentId)) return;
        if (rec.attendance === "حاضر" || rec.attendance === "تعويض") {
          totalPresent++; monthlyData[month].present++;
          weekMap[weekLabel].present++; weekMap[weekLabel].total++;
        } else if (rec.attendance === "غائب") {
          totalAbsent++; monthlyData[month].absent++;
          weekMap[weekLabel].absent++; weekMap[weekLabel].total++;
        } else if (rec.attendance === "متأخر") {
          totalLate++; weekMap[weekLabel].total++;
        }
        const MEM_SCORES: Record<string, number> = { "ممتاز": 5, "جيد جداً": 4, "جيد": 3, "حسن": 3, "متوسط": 2, "لم يحفظ": 1 };
        const memoScore = rec.memorization ? (MEM_SCORES[rec.memorization] ?? 0) : 0;
        if (memoScore > 0) { monthlyData[month].memo += memoScore; monthlyData[month].memoCount++; }
        if (rec.memorization === "ممتاز") totalMemExcellent++;
        else if (rec.memorization === "جيد جداً" || rec.memorization === "جيد") totalMemGood++;
        else if (rec.memorization === "لم يحفظ") totalMemPoor++;
        if (rec.review === true) totalReviewDone++;
        if (rec.review !== null) totalReviewTotal++;
      });
    });

    const totalAttendance = totalPresent + totalAbsent + totalLate;
    const attendanceRate = totalAttendance > 0 ? Math.round((totalPresent / totalAttendance) * 100) : 0;
    const reviewRate = totalReviewTotal > 0 ? Math.round((totalReviewDone / totalReviewTotal) * 100) : 0;

    // أفضل الطلاب
    const studentScores: Record<string, { name: string; present: number; total: number; memo: number; memoCount: number }> = {};
    students.forEach(s => { studentScores[s.id] = { name: s.fullName, present: 0, total: 0, memo: 0, memoCount: 0 }; });
    sessions.forEach(session => {
      if (session.sessionType === "يوم عطلة" || session.sessionType === "غياب المعلم") return;
      session.records.forEach(rec => {
        if (!studentScores[rec.studentId]) return;
        studentScores[rec.studentId].total++;
        if (rec.attendance === "حاضر" || rec.attendance === "تعويض") studentScores[rec.studentId].present++;
        const MEM_SCORES2: Record<string, number> = { "ممتاز": 5, "جيد جداً": 4, "جيد": 3, "حسن": 3, "متوسط": 2, "لم يحفظ": 1 };
        const ms = rec.memorization ? (MEM_SCORES2[rec.memorization] ?? 0) : 0;
        if (ms > 0) { studentScores[rec.studentId].memo += ms; studentScores[rec.studentId].memoCount++; }
      });
    });

    const topStudents = Object.values(studentScores)
      .filter(s => s.total > 0)
      .map(s => ({
        name: s.name,
        attendanceRate: Math.round((s.present / s.total) * 100),
        memoAvg: s.memoCount > 0 ? Math.round((s.memo / s.memoCount) * 20) : 0,
        score: Math.round((s.present / s.total) * 60) + (s.memoCount > 0 ? Math.round((s.memo / s.memoCount) * 8) : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return {
      attendanceRate, reviewRate, totalPresent, totalAbsent, totalLate,
      totalMemExcellent, totalMemGood, totalMemPoor,
      monthlyData, weekMap, topStudents,
    };
  }, [sessions, students]);

  // بيانات الرسوم
  const hasData = (m: typeof analytics.monthlyData[0]) => m.present + m.absent > 0;
  const monthlyChartData = Array.from({ length: 12 }, (_, m) => {
    const d = analytics.monthlyData[m];
    const total = d.present + d.absent;
    return { label: getMonthLabel(m).slice(0, 3), value: total > 0 ? Math.round((d.present / total) * 100) : 0, max: 100 };
  }).filter((_, m) => hasData(analytics.monthlyData[m]));

  const weeklyKeys = Object.keys(analytics.weekMap).slice(-8);
  const weeklyChartData = weeklyKeys.map(week => {
    const d = analytics.weekMap[week];
    return { label: week, value: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0, max: 100 };
  });

  // خط الاتجاه للـ KPI
  const attendanceTrend = useMemo(() => {
    const vals = monthlyChartData.map(d => d.value).filter(v => v > 0);
    if (vals.length < 3) return null;
    const slope = calcLinearTrendSlope(vals);
    const diff = Math.abs(Math.round(slope));
    return { up: slope > 0.5, value: diff };
  }, [monthlyChartData]);

  // ─── تصدير PDF ──────────────────────────────────────────

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 300);
  };

  const years = [new Date().getFullYear(), new Date().getFullYear() - 1];
  const isManager = isPrincipal || user?.role === "super_admin";
  const chartData = viewMode === "annual" ? monthlyChartData : weeklyChartData;

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir="rtl">
      <PrintStyles />

      {/* رأس */}
      <div className="flex items-start justify-between gap-3 flex-wrap no-print">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2"
            style={{ fontFamily: "var(--font-headline)" }}>
            <BarChart3 className="w-6 h-6 text-[var(--color-primary)]" />
            لوحة الأداء
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            تحليل شامل للحضور والحفظ والأداء — مع خط الاتجاه والمقارنة الفصلية
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* السنة */}
          {viewMode !== "groups" && viewMode !== "seasonal" && (
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(+e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-bold bg-white dark:bg-white/5 border border-[var(--color-border)] text-gray-700 dark:text-gray-300 focus:outline-none"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}

          {/* التبويبات */}
          <div className="flex rounded-xl overflow-hidden border border-[var(--color-border)]">
            {(["annual", "weekly", "seasonal", "groups"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 text-xs font-bold transition-colors ${
                  viewMode === mode
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50"
                }`}
              >
                {mode === "annual" ? "📅 سنوي"
                  : mode === "weekly" ? "📆 أسبوعي"
                  : mode === "seasonal" ? "🌸 فصلي"
                  : "🏆 الأفواج"}
              </button>
            ))}
          </div>

          {/* تصدير PDF */}
          <button
            onClick={handlePrint}
            disabled={printing}
            title="تصدير PDF"
            className="no-print w-9 h-9 rounded-xl border border-[var(--color-border)] bg-white dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-[var(--color-primary)] transition-colors disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button onClick={load} className="no-print w-9 h-9 rounded-xl border border-[var(--color-border)] bg-white dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-[var(--color-primary)] transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* فلتر المعلم */}
      {isManager && teachers.length > 0 && viewMode !== "groups" && (
        <div className="no-print bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4 flex items-center gap-3">
          <Filter className="w-4 h-4 text-indigo-500 shrink-0" />
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300 shrink-0">الفوج:</p>
          <select
            value={selectedTeacherId}
            onChange={e => setSelectedTeacherId(e.target.value)}
            className="flex-1 text-sm font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-xl border-0 px-3 py-2 focus:outline-none"
          >
            <option value="all">جميع الأفواج</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.displayName} — {t.groupName ?? "بدون فوج"}</option>
            ))}
          </select>
        </div>
      )}

      {/* المحتوى */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : viewMode === "groups" ? (
        isManager ? (
          <GroupsComparison
            teachers={teachers}
            allStudents={compStudents.length > 0 ? compStudents : students}
            allSessions={compSessions.length > 0 ? compSessions : sessions}
          />
        ) : (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-8 text-center">
            <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="font-black text-amber-800 dark:text-amber-200">متاح للمدير فقط</p>
          </div>
        )
      ) : viewMode === "seasonal" ? (
        <SeasonComparison
          sessions={compSessions.length > 0 ? compSessions : sessions}
          students={compStudents.length > 0 ? compStudents : students}
        />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              label="نسبة الحضور"
              value={`${analytics.attendanceRate}%`}
              sub={`${analytics.totalPresent} حاضر · ${analytics.totalAbsent} غائب`}
              icon={CheckCircle}
              gradient="from-emerald-500 to-green-600"
              delay={0}
              trend={attendanceTrend ?? undefined}
            />
            <KpiCard label="المراجعة المنجزة" value={`${analytics.reviewRate}%`}
              icon={BookOpen} gradient="from-blue-500 to-indigo-600" delay={0.06} />
            <KpiCard label="تقييم ممتاز" value={analytics.totalMemExcellent}
              sub="في تقييم الحفظ"
              icon={Star} gradient="from-amber-500 to-orange-500" delay={0.12} />
            <KpiCard label="إجمالي الطلاب" value={students.length}
              icon={Users} gradient="from-purple-500 to-violet-600" delay={0.18} />
          </div>

          {/* الرسوم البيانية مع خط الاتجاه */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5"
            >
              <BarChartWithTrend
                data={chartData}
                color="bg-gradient-to-l from-[var(--color-primary)] to-emerald-400"
                label={viewMode === "annual" ? "نسبة الحضور الشهرية (%)" : "نسبة الحضور الأسبوعية (%)"}
                showTrend={true}
              />
              {chartData.length === 0 && (
                <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">لا توجد بيانات كافية</p>
              )}
            </motion.div>

            {/* توزيع الحفظ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5"
            >
              <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                توزيع تقييم الحفظ
              </p>
              <div className="space-y-3">
                {[
                  { label: "ممتاز", value: analytics.totalMemExcellent, color: "bg-emerald-500", text: "text-emerald-700" },
                  { label: "جيد / جيد جداً", value: analytics.totalMemGood, color: "bg-blue-400", text: "text-blue-700" },
                  { label: "لم يحفظ", value: analytics.totalMemPoor, color: "bg-red-400", text: "text-red-700" },
                ].map(item => {
                  const total = analytics.totalMemExcellent + analytics.totalMemGood + analytics.totalMemPoor;
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                        <span className={item.text}>{item.value} ({pct}%)</span>
                      </div>
                      <ProgressBar value={item.value} max={total} color={item.color} />
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5 grid grid-cols-3 gap-3">
                {[
                  { label: "حاضر", value: analytics.totalPresent, color: "text-emerald-600" },
                  { label: "متأخر", value: analytics.totalLate, color: "text-amber-600" },
                  { label: "غائب", value: analytics.totalAbsent, color: "text-red-500" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* أفضل الطلاب */}
          {analytics.topStudents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-black text-gray-800 dark:text-white">أفضل الطلاب أداءً</h3>
              </div>
              <div className="space-y-3">
                {analytics.topStudents.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                      i === 0 ? "bg-amber-100 text-amber-700" :
                      i === 1 ? "bg-gray-100 text-gray-600" :
                      "bg-orange-50 text-orange-600"
                    }`}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{s.name}</p>
                      <p className="text-xs text-gray-400">حضور {s.attendanceRate}%</p>
                    </div>
                    <p className="text-sm font-black text-[var(--color-primary)] shrink-0">{s.score} نقطة</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* رسالة فارغة */}
          {sessions.length === 0 && (
            <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="font-bold text-gray-500 dark:text-gray-400">لا توجد بيانات لعام {selectedYear}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">ابدأ بتسجيل الحصص اليومية لتظهر هنا الإحصائيات</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function PerformancePageWrapper() {
  return (
    <SchoolGuard>
      <PerformancePage />
    </SchoolGuard>
  );
}
