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
  Users, Calendar, BookOpen, CheckCircle2,
  BarChart3, Sparkles, Shield,
} from "lucide-react";

// ─── تكوين النقاط الافتراضي ────────────────────────────

const DEFAULT_POINTS = {
  attendance: { حاضر: 5, متأخر: 2, تعويض: 3, غائب: 0 },
  evaluation: { ممتاز: 10, "جيد جداً": 8, جيد: 6, حسن: 4, متوسط: 2, "لم يحفظ": 0 },
  behavior: { هادئ: 3, متوسط: 1, "غير منضبط": -2 },
  review: 3,
  surah: { memorized: 15, mastered: 25 },
};

// ─── الشارات ────────────────────────────────────────────

const BADGES = [
  { id: "first_star", name: "نجم الانطلاق", icon: "⭐", threshold: 50, color: "text-amber-500 bg-amber-50" },
  { id: "consistent", name: "المواظب", icon: "🕐", threshold: 100, color: "text-blue-600 bg-blue-50" },
  { id: "memorizer", name: "الحافظ", icon: "📖", threshold: 150, color: "text-emerald-600 bg-emerald-50" },
  { id: "excellence", name: "التميز", icon: "🏆", threshold: 250, color: "text-purple-600 bg-purple-50" },
  { id: "champion", name: "البطل", icon: "👑", threshold: 400, color: "text-yellow-600 bg-yellow-50" },
  { id: "legend", name: "الأسطورة", icon: "✨", threshold: 600, color: "text-rose-600 bg-rose-50" },
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

      // الحضور
      if (rec.attendance === "حاضر") { const p = DEFAULT_POINTS.attendance["حاضر"]; attendance += p; total += p; }
      else if (rec.attendance === "متأخر") { const p = DEFAULT_POINTS.attendance["متأخر"]; attendance += p; total += p; }
      else if (rec.attendance === "تعويض") { const p = DEFAULT_POINTS.attendance["تعويض"]; attendance += p; total += p; }

      // التحفيظ
      if (rec.memorization && rec.memorization in DEFAULT_POINTS.evaluation) {
        const p = DEFAULT_POINTS.evaluation[rec.memorization as keyof typeof DEFAULT_POINTS.evaluation];
        memorization += p; total += p;
      }

      // السلوك
      if (rec.behavior && rec.behavior in DEFAULT_POINTS.behavior) {
        const p = DEFAULT_POINTS.behavior[rec.behavior as keyof typeof DEFAULT_POINTS.behavior];
        behavior += p; total += p;
      }

      // المراجعة
      if (rec.review) { review += DEFAULT_POINTS.review; total += DEFAULT_POINTS.review; }
    }
  }

  return { total: Math.max(0, total), attendance, memorization, behavior, review };
}

// ─── بطاقة الترتيب ──────────────────────────────────────

function RankCard({
  rank, student, points, expanded, onToggle,
}: {
  rank: number;
  student: Student;
  points: ReturnType<typeof calcStudentPoints>;
  expanded: boolean;
  onToggle: () => void;
}) {
  const badges = getBadges(points.total);
  const maxPossible = 650;
  const pct = Math.min(100, Math.round((points.total / maxPossible) * 100));

  const topRank = rank <= 3;

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
            <p className="text-sm font-black text-gray-900 truncate" style={{ fontFamily: "var(--font-headline)" }}>
              {student.fullName}
            </p>
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

          {/* النقاط + توسيع */}
          <div className="flex items-center gap-2 shrink-0">
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
              <span key={b.id} className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.color}`}>
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
                  { label: "حضور", value: points.attendance, icon: "✅", color: "text-emerald-600" },
                  { label: "تحفيظ", value: points.memorization, icon: "📖", color: "text-blue-600" },
                  { label: "مراجعة", value: points.review, icon: "🔄", color: "text-purple-600" },
                  { label: "سلوك", value: points.behavior, icon: "🌟", color: "text-amber-600" },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-2">
                    <p className="text-lg">{icon}</p>
                    <p className={`text-sm font-black ${color}`}>{value > 0 ? "+" : ""}{value}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

function PointsPage() {
  const { user, school, isPrincipal } = useAuth();
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");

  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [period, setPeriod] = useState<"all" | "month" | "week">("all");

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

  // حساب نقاط كل طالب وترتيبهم
  const ranked = useMemo(() => {
    return students
      .map((s) => ({ student: s, points: calcStudentPoints(s.id, filteredSessions) }))
      .sort((a, b) => b.points.total - a.points.total);
  }, [students, filteredSessions]);

  const totalPoints = ranked.reduce((sum, r) => sum + r.points.total, 0);
  const topStudent = ranked[0];

  return (
    <div className="max-w-2xl mx-auto space-y-5">

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

      {/* بطل الفوج */}
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
        </motion.div>
      )}

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "إجمالي النقاط", value: totalPoints, icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "جلسات محسوبة", value: filteredSessions.length, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "متوسط الطالب", value: students.length ? Math.round(totalPoints / students.length) : 0, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <p className={`text-xl font-black ${color}`} style={{ fontFamily: "var(--font-headline)" }}>{value}</p>
            <p className={`text-xs font-medium ${color} opacity-70`}>{label}</p>
          </div>
        ))}
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

      {/* لوحة الترتيب */}
      <div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 px-1">
          🏅 لوحة الترتيب
        </p>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : ranked.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">لا يوجد طلاب نشطون بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ranked.map(({ student, points }, idx) => (
              <RankCard
                key={student.id}
                rank={idx + 1}
                student={student}
                points={points}
                expanded={expandedId === student.id}
                onToggle={() => setExpandedId(expandedId === student.id ? null : student.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* الشارات الممكنة */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4">
        <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">🎖️ الشارات المتاحة</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {BADGES.map((b) => (
            <div key={b.id} className={`rounded-xl p-2 text-center ${b.color}`}>
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
