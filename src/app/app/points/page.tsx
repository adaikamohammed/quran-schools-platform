"use client";
import SchoolGuard from "@/components/layout/SchoolGuard";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import type { Student, DailySession, AppUser } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Star, TrendingUp, Award, Zap,
  Crown, Medal, Target, ChevronDown,
  Users, BookOpen, CheckCircle2,
  BarChart3, Sparkles, Calendar,
  Gift, Bell, PartyPopper, Filter,
  ChevronUp, Minus, TrendingDown,
} from "lucide-react";

// ─── تكوين النقاط الافتراضي ────────────────────────────

const DEFAULT_POINTS = {
  attendance: { حاضر: 5, متأخر: 2, تعويض: 3, غائب: 0 },
  evaluation: { ممتاز: 10, "جيد جداً": 8, جيد: 6, حسن: 4, متوسط: 2, "لم يحفظ": 0 },
  behavior: { هادئ: 3, متوسط: 1, "غير منضبط": -2 },
  review: 3,
  surah: { memorized: 15, mastered: 25 },
};

// ─── أسباب النقاط السريعة ───────────────────────────────

const QUICK_REASONS = [
  { label: "حضور منتظم", icon: "✅", points: 5, category: "حضور" },
  { label: "حفظ ممتاز", icon: "📖", points: 10, category: "تحفيظ" },
  { label: "سلوك هادئ", icon: "🌟", points: 3, category: "سلوك" },
  { label: "مراجعة السورة", icon: "🔄", points: 3, category: "مراجعة" },
  { label: "إنجاز سورة كاملة", icon: "🏆", points: 15, category: "إنجاز" },
  { label: "تفوق وتميز", icon: "⭐", points: 8, category: "تميز" },
  { label: "مشاركة فعّالة", icon: "🙋", points: 5, category: "مشاركة" },
  { label: "مساعدة زملائه", icon: "🤝", points: 4, category: "قيادة" },
];

// ─── الشارات ────────────────────────────────────────────

const BADGES = [
  { id: "first_star", name: "نجم الانطلاق", icon: "⭐", threshold: 50, color: "text-amber-500 bg-amber-50 border-amber-200" },
  { id: "consistent", name: "المواظب", icon: "🕐", threshold: 100, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "memorizer", name: "الحافظ", icon: "📖", threshold: 150, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "excellence", name: "التميز", icon: "🏆", threshold: 250, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { id: "champion", name: "البطل", icon: "👑", threshold: 400, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  { id: "legend", name: "الأسطورة", icon: "✨", threshold: 600, color: "text-rose-600 bg-rose-50 border-rose-200" },
];

function getBadges(points: number) {
  return BADGES.filter((b) => points >= b.threshold);
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
  return <span className="w-5 h-5 text-center text-xs font-black text-gray-400">{rank}</span>;
}

// ─── حساب نقاط الطالب ──────────────────────────────────

function calcStudentPoints(studentId: string, sessions: DailySession[]): {
  total: number; attendance: number; memorization: number; behavior: number; review: number;
} {
  let total = 0, attendance = 0, memorization = 0, behavior = 0, review = 0;

  for (const session of sessions) {
    for (const rec of session.records) {
      if (rec.studentId !== studentId) continue;

      if (rec.attendance === "حاضر") { const p = DEFAULT_POINTS.attendance["حاضر"]; attendance += p; total += p; }
      else if (rec.attendance === "متأخر") { const p = DEFAULT_POINTS.attendance["متأخر"]; attendance += p; total += p; }
      else if (rec.attendance === "تعويض") { const p = DEFAULT_POINTS.attendance["تعويض"]; attendance += p; total += p; }

      if (rec.memorization && rec.memorization in DEFAULT_POINTS.evaluation) {
        const p = DEFAULT_POINTS.evaluation[rec.memorization as keyof typeof DEFAULT_POINTS.evaluation];
        memorization += p; total += p;
      }

      if (rec.behavior && rec.behavior in DEFAULT_POINTS.behavior) {
        const p = DEFAULT_POINTS.behavior[rec.behavior as keyof typeof DEFAULT_POINTS.behavior];
        behavior += p; total += p;
      }

      if (rec.review) { review += DEFAULT_POINTS.review; total += DEFAULT_POINTS.review; }
    }
  }

  return { total: Math.max(0, total), attendance, memorization, behavior, review };
}

// ─── مكوّن تهنئة 100 نقطة ────────────────────────────────

function CongratsBanner({ student, onClose }: { student: Student; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        className="relative max-w-sm w-full bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 rounded-3xl p-8 text-white shadow-2xl text-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        animate={{ rotate: [0, -1, 1, -1, 0] }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {/* confetti-like decoration */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L40 20 60 30 40 40 30 60 20 40 0 30 20 20z' fill='%23fff'/%3E%3C/svg%3E\")",
        }} />

        <div className="relative z-10">
          <div className="text-6xl mb-3">🎉</div>
          <h2 className="text-2xl font-black mb-1" style={{ fontFamily: "var(--font-headline)" }}>
            مبروك! 100 نقطة
          </h2>
          <p className="text-white/90 font-bold mb-2">
            {student.fullName}
          </p>
          <p className="text-white/75 text-sm mb-6">
            وصل إلى 100 نقطة وأصبح من "المواظبين" 🏅
          </p>
          <div className="text-4xl mb-4">👑🌟📖</div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 transition-all text-white font-black px-8 py-3 rounded-2xl text-sm backdrop-blur-sm border border-white/30"
          >
            رائع! استمر ✨
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── بطاقة الترتيب المُحسّنة ──────────────────────────────────────────

function RankCard({
  rank, student, points, weekPoints, expanded, onToggle, showCongrats,
}: {
  rank: number;
  student: Student;
  points: ReturnType<typeof calcStudentPoints>;
  weekPoints: ReturnType<typeof calcStudentPoints>;
  expanded: boolean;
  onToggle: () => void;
  showCongrats?: boolean;
}) {
  const badges = getBadges(points.total);
  const maxPossible = 650;
  const pct = Math.min(100, Math.round((points.total / maxPossible) * 100));
  const topRank = rank <= 3;

  // Growth indicator: this week vs average
  const weekTotal = weekPoints.total;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.04 }}
      className={`rounded-2xl border-2 overflow-hidden transition-shadow hover:shadow-md ${
        rank === 1 ? "border-yellow-300 bg-gradient-to-l from-yellow-50 to-white" :
        rank === 2 ? "border-gray-300 bg-gradient-to-l from-gray-50 to-white" :
        rank === 3 ? "border-amber-200 bg-gradient-to-l from-amber-50 to-white" :
        "border-[var(--color-border)] bg-white"
      }`}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* الترتيب */}
          <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${topRank ? "text-center" : ""}`}>
            {getRankIcon(rank)}
          </div>

          {/* الأفاتار */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 ${
            rank === 1 ? "bg-gradient-to-br from-yellow-400 to-amber-500" :
            rank === 2 ? "bg-gradient-to-br from-gray-400 to-gray-500" :
            rank === 3 ? "bg-gradient-to-br from-amber-600 to-yellow-700" :
            student.gender === "أنثى"
              ? "bg-gradient-to-br from-pink-400 to-rose-500"
              : "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]"
          }`} style={{ fontFamily: "var(--font-headline)" }}>
            {student.fullName[0]}
          </div>

          {/* الاسم والنقاط */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-black text-gray-900 truncate" style={{ fontFamily: "var(--font-headline)" }}>
                {student.fullName}
              </p>
              {showCongrats && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-0.5 shrink-0">
                  <PartyPopper className="w-2.5 h-2.5" /> جديد!
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden flex-1 max-w-24">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    rank === 1 ? "bg-yellow-400" :
                    rank <= 3 ? "bg-amber-500" :
                    "bg-[var(--color-primary)]"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 font-medium shrink-0">{pct}%</span>
            </div>
          </div>

          {/* النقاط الأسبوعية + الإجمالية + توسيع */}
          <div className="flex items-center gap-2 shrink-0">
            {weekTotal > 0 && (
              <div className="text-center hidden sm:block">
                <p className="text-xs font-black text-emerald-600">+{weekTotal}</p>
                <p className="text-[9px] text-gray-400 -mt-0.5">أسبوع</p>
              </div>
            )}
            <div className="text-center">
              <p className={`text-lg font-black ${rank === 1 ? "text-yellow-500" : "text-gray-800"}`} style={{ fontFamily: "var(--font-headline)" }}>
                {points.total}
              </p>
              <p className="text-[10px] text-gray-400 font-medium -mt-0.5">نقطة</p>
            </div>
            <button
              onClick={onToggle}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* الشارات */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {badges.map((b) => (
              <span key={b.id} className={`text-xs font-bold px-2 py-0.5 rounded-full border ${b.color}`}>
                {b.icon} {b.name}
              </span>
            ))}
          </div>
        )}

        {/* تفاصيل النقاط */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-4 gap-3 text-center">
                {[
                  { label: "حضور", value: points.attendance, icon: "✅", color: "text-emerald-600", weekVal: weekPoints.attendance },
                  { label: "تحفيظ", value: points.memorization, icon: "📖", color: "text-blue-600", weekVal: weekPoints.memorization },
                  { label: "مراجعة", value: points.review, icon: "🔄", color: "text-purple-600", weekVal: weekPoints.review },
                  { label: "سلوك", value: points.behavior, icon: "🌟", color: "text-amber-600", weekVal: weekPoints.behavior },
                ].map(({ label, value, icon, color, weekVal }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-2">
                    <p className="text-lg">{icon}</p>
                    <p className={`text-sm font-black ${color}`}>{value > 0 ? "+" : ""}{value}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{label}</p>
                    {weekVal > 0 && (
                      <p className="text-[9px] text-emerald-500 font-bold mt-0.5">+{weekVal} أسبوع</p>
                    )}
                  </div>
                ))}
              </div>

              {/* شريط التقدم نحو الشارة التالية */}
              {(() => {
                const nextBadge = BADGES.find(b => points.total < b.threshold);
                if (!nextBadge) return null;
                const prev = BADGES.findLast(b => points.total >= b.threshold);
                const from = prev?.threshold ?? 0;
                const p = Math.round(((points.total - from) / (nextBadge.threshold - from)) * 100);
                return (
                  <div className="mt-3 p-3 bg-indigo-50 rounded-xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-bold text-indigo-700">نحو شارة: {nextBadge.icon} {nextBadge.name}</p>
                      <p className="text-xs font-black text-indigo-600">{nextBadge.threshold - points.total} نقطة متبقية</p>
                    </div>
                    <div className="w-full h-1.5 bg-indigo-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${p}%` }} />
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── تبويب لوحة الصدارة الأسبوعية ──────────────────────────────

function WeeklyLeaderboard({ ranked, weekRanked }: {
  ranked: { student: Student; points: ReturnType<typeof calcStudentPoints> }[];
  weekRanked: { student: Student; points: ReturnType<typeof calcStudentPoints> }[];
}) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-black text-indigo-900">لوحة الصدارة الأسبوعية</p>
          <p className="text-[10px] text-indigo-600/70">أفضل المتقدمين هذا الأسبوع</p>
        </div>
      </div>

      {weekRanked.filter(r => r.points.total > 0).length === 0 ? (
        <p className="text-center text-sm text-indigo-400 py-4">لا توجد نقاط هذا الأسبوع بعد</p>
      ) : (
        <div className="space-y-2">
          {weekRanked.filter(r => r.points.total > 0).slice(0, 5).map(({ student, points }, idx) => {
            const overallRank = ranked.findIndex(r => r.student.id === student.id) + 1;
            return (
              <div key={student.id} className="flex items-center gap-3 bg-white/70 rounded-xl p-3">
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  {idx === 0 ? <Crown className="w-4 h-4 text-yellow-500" /> :
                   idx === 1 ? <Medal className="w-4 h-4 text-gray-400" /> :
                   idx === 2 ? <Medal className="w-4 h-4 text-amber-600" /> :
                   <span className="text-xs font-black text-indigo-400">{idx + 1}</span>}
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0 ${
                  student.gender === "أنثى" ? "bg-pink-400" : "bg-indigo-500"
                }`}>
                  {student.fullName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-800 truncate">{student.fullName}</p>
                  <p className="text-[10px] text-gray-400">ترتيب عام: #{overallRank}</p>
                </div>
                <div className="text-center shrink-0">
                  <p className="text-base font-black text-indigo-700">+{points.total}</p>
                  <p className="text-[9px] text-indigo-400">نقطة</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

type ViewMode = "all" | "weekly";

function PointsPage() {
  const { user, school, isPrincipal } = useAuth();
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");

  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [period, setPeriod] = useState<"all" | "month" | "week">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [congratsStudent, setCongratsStudent] = useState<Student | null>(null);
  const [seenCongrats, setSeenCongrats] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user?.id || !school?.id) return;
    setLoading(true);
    const db = getDB();

    let studs: Student[] = [];
    let allSessions: DailySession[] = [];

    if (isPrincipal || user.role === "super_admin") {
      const schoolTeachers = await db.users.where("schoolId").equals(school.id).filter(u => u.role === "teacher").toArray();
      setTeachers(schoolTeachers.sort((a,b) => a.displayName.localeCompare(b.displayName, "ar")));

      studs = await db.students.where("schoolId").equals(school.id).and(s => s.status === "نشط").toArray();
      allSessions = await db.sessions.where("schoolId").equals(school.id).toArray();

      if (selectedTeacherId !== "all") {
        studs = studs.filter(s => s.teacherId === selectedTeacherId);
        allSessions = allSessions.filter(s => s.teacherId === selectedTeacherId);
      }
    } else {
      studs = await db.students
        .where("teacherId").equals(user.id)
        .and((s) => s.status === "نشط")
        .toArray();

      allSessions = await db.sessions
        .where("teacherId").equals(user.id)
        .toArray();
    }

    setStudents(studs);
    setSessions(allSessions);
    setLoading(false);
  }, [user?.id, school?.id, isPrincipal, selectedTeacherId]);

  useEffect(() => { load(); }, [load]);

  // فلترة الجلسات حسب الفترة
  const filteredSessions = useMemo(() => {
    if (period === "all") return sessions;
    const now = new Date();
    const since = new Date();
    if (period === "week") since.setDate(now.getDate() - 7);
    else since.setDate(now.getDate() - 30);
    const sinceStr = since.toISOString().slice(0, 10);
    return sessions.filter((s) => s.date >= sinceStr);
  }, [sessions, period]);

  // جلسات هذا الأسبوع فقط للوحة الصدارة الأسبوعية
  const weekSessions = useMemo(() => {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceStr = since.toISOString().slice(0, 10);
    return sessions.filter((s) => s.date >= sinceStr);
  }, [sessions]);

  // حساب نقاط كل طالب وترتيبهم (الكلي)
  const ranked = useMemo(() => {
    return students
      .map((s) => ({ student: s, points: calcStudentPoints(s.id, filteredSessions) }))
      .sort((a, b) => b.points.total - a.points.total);
  }, [students, filteredSessions]);

  // حساب نقاط هذا الأسبوع لكل طالب
  const weekRanked = useMemo(() => {
    return students
      .map((s) => ({ student: s, points: calcStudentPoints(s.id, weekSessions) }))
      .sort((a, b) => b.points.total - a.points.total);
  }, [students, weekSessions]);

  // خريطة النقاط الأسبوعية
  const weekPointsMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof calcStudentPoints>> = {};
    weekRanked.forEach(r => { map[r.student.id] = r.points; });
    return map;
  }, [weekRanked]);

  // إشعار التهنئة عند 100 نقطة
  useEffect(() => {
    if (loading) return;
    for (const { student, points } of ranked) {
      if (points.total >= 100 && !seenCongrats.has(student.id)) {
        // تحقق من أن النقاط كانت أقل من 100 قبل الفترة
        const prevPoints = calcStudentPoints(student.id,
          sessions.filter(s => {
            const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 1);
            return s.date < cutoff.toISOString().slice(0, 10);
          })
        );
        if (prevPoints.total < 100 && points.total >= 100) {
          setCongratsStudent(student);
          setSeenCongrats(prev => new Set([...prev, student.id]));
          break;
        }
      }
    }
  }, [ranked, loading, seenCongrats, sessions]);

  const totalPoints = ranked.reduce((sum, r) => sum + r.points.total, 0);
  const topStudent = ranked[0];
  const weekTopStudent = weekRanked.find(r => r.points.total > 0);

  // نقاط هذا الأسبوع الإجمالية
  const weekTotalPoints = weekRanked.reduce((sum, r) => sum + r.points.total, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* تهنئة 100 نقطة */}
      <AnimatePresence>
        {congratsStudent && (
          <CongratsBanner
            student={congratsStudent}
            onClose={() => setCongratsStudent(null)}
          />
        )}
      </AnimatePresence>

      {/* رأس الصفحة */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>
            نظام النقاط
          </h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            {students.length} طالب · {totalPoints} نقطة إجمالية
          </p>
        </div>
        {/* فلتر الفترة */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[
            { key: "week", label: "أسبوع" },
            { key: "month", label: "شهر" },
            { key: "all", label: "الكل" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key as typeof period)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === key ? "bg-white shadow text-gray-800" : "text-gray-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── فلتر المعلم (للمدراء فقط) ─── */}
      {(isPrincipal || user?.role === "super_admin") && teachers.length > 0 && (
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <p className="text-sm font-bold text-gray-700">تصفح لوحة نقاط مُعلم:</p>
          </div>
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-bold bg-indigo-50 text-indigo-700 border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
          >
            <option value="all">كل المعلمين والأفواج</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.displayName} ({t.groupName || "بدون فوج"})</option>
            ))}
          </select>
        </div>
      )}

      {/* بطل الفوج الكلي */}
      {!loading && topStudent && topStudent.points.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-l from-yellow-500 to-amber-400 text-white"
        >
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L53 27 80 40 53 53 40 80 27 53 0 40 27 27z' fill='%23fff'/%3E%3C/svg%3E\")"
          }} />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black" style={{ fontFamily: "var(--font-headline)" }}>
              {topStudent.student.fullName[0]}
            </div>
            <div className="flex-1">
              <p className="text-white/70 text-xs font-medium">🏆 بطل الفوج</p>
              <p className="text-xl font-black" style={{ fontFamily: "var(--font-headline)" }}>
                {topStudent.student.fullName}
              </p>
              <p className="text-white/80 text-sm font-bold mt-0.5">
                {topStudent.points.total} نقطة · {getBadges(topStudent.points.total).length} شارة
              </p>
            </div>
            <Crown className="w-10 h-10 text-white/40" />
          </div>

          {/* نجم الأسبوع */}
          {weekTopStudent && weekTopStudent.student.id !== topStudent.student.id && (
            <div className="relative z-10 mt-3 pt-3 border-t border-white/20 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white/70" />
              <p className="text-white/80 text-xs font-bold">
                نجم هذا الأسبوع: <b className="text-white">{weekTopStudent.student.fullName}</b> (+{weekTopStudent.points.total} نقطة)
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "إجمالي النقاط", value: totalPoints, icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "نقاط الأسبوع", value: weekTotalPoints, icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "متوسط الطالب", value: students.length ? Math.round(totalPoints / students.length) : 0, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <p className={`text-xl font-black ${color}`} style={{ fontFamily: "var(--font-headline)" }}>{value}</p>
            <p className={`text-xs font-medium ${color} opacity-70`}>{label}</p>
          </div>
        ))}
      </div>

      {/* أسباب النقاط السريعة */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4">
        <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Gift className="w-3.5 h-3.5" /> أسباب النقاط الشائعة
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUICK_REASONS.map(({ label, icon, points, category }) => (
            <div
              key={label}
              className="bg-gray-50 hover:bg-[var(--color-primary)]/5 border border-gray-100 hover:border-[var(--color-primary)]/20 rounded-xl p-2.5 cursor-default transition-all group"
            >
              <p className="text-xl mb-1">{icon}</p>
              <p className="text-[11px] font-black text-gray-700 group-hover:text-[var(--color-primary)] leading-tight">{label}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-gray-400">{category}</p>
                <p className="text-xs font-black text-[var(--color-primary)]">+{points}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* مفتاح النقاط */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4">
        <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">كيف تُحسب النقاط؟</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          {[
            { icon: "✅", label: "حضور", value: "+5" },
            { icon: "📖", label: "ممتاز", value: "+10" },
            { icon: "🔄", label: "مراجعة", value: "+3" },
            { icon: "🌟", label: "سلوك هادئ", value: "+3" },
          ].map(({ icon, label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-2">
              <p className="text-base">{icon}</p>
              <p className="text-[10px] text-gray-500 font-medium">{label}</p>
              <p className="text-sm font-black text-[var(--color-primary)]">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* تبديل العرض: الكل / أسبوعي */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-gray-400 uppercase tracking-wider">
          🏅 لوحة الترتيب
        </p>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setViewMode("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "all" ? "bg-white shadow text-gray-800" : "text-gray-500"}`}
          >
            الكلي
          </button>
          <button
            onClick={() => setViewMode("weekly")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${viewMode === "weekly" ? "bg-white shadow text-indigo-700" : "text-gray-500"}`}
          >
            <Calendar className="w-3 h-3" /> أسبوعي
          </button>
        </div>
      </div>

      {/* لوحة الترتيب */}
      <div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : viewMode === "weekly" ? (
          <WeeklyLeaderboard ranked={ranked} weekRanked={weekRanked} />
        ) : ranked.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">لا يوجد طلاب نشطون بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ranked.map(({ student, points }, idx) => {
              const weekPts = weekPointsMap[student.id] ?? { total: 0, attendance: 0, memorization: 0, behavior: 0, review: 0 };
              const prevPoints = calcStudentPoints(student.id,
                sessions.filter(s => {
                  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 1);
                  return s.date < cutoff.toISOString().slice(0, 10);
                })
              );
              const justReached100 = prevPoints.total < 100 && points.total >= 100;

              return (
                <RankCard
                  key={student.id}
                  rank={idx + 1}
                  student={student}
                  points={points}
                  weekPoints={weekPts}
                  expanded={expandedId === student.id}
                  onToggle={() => setExpandedId(expandedId === student.id ? null : student.id)}
                  showCongrats={justReached100}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* الشارات الممكنة */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4">
        <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">🎖️ الشارات المتاحة</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {BADGES.map((b) => (
            <div key={b.id} className={`rounded-xl p-2 text-center border ${b.color}`}>
              <p className="text-xl">{b.icon}</p>
              <p className="text-[10px] font-black mt-1">{b.name}</p>
              <p className="text-[9px] opacity-70">{b.threshold}+ نقطة</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Guard wrapper (auto-generated) ──
export default function PointsPagePage() {
  return (
    <SchoolGuard>
      <PointsPage />
    </SchoolGuard>
  );
}
