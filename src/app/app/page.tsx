"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Student } from "@/lib/types";
import { motion } from "framer-motion";
import Link from "next/link";
import SuperAdminDashboard from "@/components/layout/SuperAdminDashboard";
import TeacherDashboard from "@/components/layout/TeacherDashboard";
import {
  Users, BookCheck, ClipboardList, TrendingUp,
  ArrowLeft, AlertTriangle, Clock, BookOpen, Star,
  CreditCard, Calendar, CheckCircle2, XCircle
} from "lucide-react";

// ─── بطاقة إحصاء ─────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, href, delay = 0 }: {
  label: string; value: number | string; icon: React.ElementType;
  color: string; href: string; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }}>
      <Link href={href}
        className="flex items-center gap-4 p-5 bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] hover:shadow-lg hover:border-[var(--color-primary)]/20 transition-all duration-300 group">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-black text-gray-900 dark:text-white" style={{ fontFamily: "var(--font-headline)" }}>{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        </div>
        <ArrowLeft className="w-4 h-4 text-gray-300 group-hover:text-[var(--color-primary)] group-hover:-translate-x-1 transition-all" />
      </Link>
    </motion.div>
  );
}

// ─── لوحة تحكم المدرسة ───────────────────────────────────

function SchoolDashboard() {
  const { user, school, isPrincipal } = useAuth();
  const [students, setStudents]       = useState<Student[]>([]);
  const [loading, setLoading]         = useState(true);
  const [weekSessions, setWeekSessions]     = useState(0);
  const [todayAttendanceRate, setTodayAttendanceRate] = useState<number | null>(null);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [atRiskStudents, setAtRiskStudents] = useState<Student[]>([]);
  const [teacherAbsentYesterday, setTeacherAbsentYesterday] = useState<Student[]>([]);
  const [seasonProgress, setSeasonProgress] = useState({
    percent: 0, daysLeft: 0, elapsed: 0, totalDays: 0,
    seasonName: "", seasonEmoji: "📅", seasonColor: "#107a57",
    yearPercent: 0, yearElapsed: 0, yearTotal: 365, year: new Date().getFullYear(),
  });

  const [alerts, setAlerts]     = useState<{ msg: string; href: string; color: string }[]>([]);
  const [recentLogs, setRecentLogs] = useState<{ desc: string; time: string }[]>([]);

  useEffect(() => {
    if (!school?.id) { setLoading(false); return; }

    const load = async () => {
      const { getDB } = await import("@/lib/storage/db");
      const db = getDB();

      // ── تقدم الفصل الحالي والسنة ──
      const today = new Date();
      const { getCurrentSeason, getSeasonDateRange } = await import("@/lib/seasons");
      const currentSeason = getCurrentSeason();
      const curYear = today.getFullYear();

      // ── تقدم الفصل ──
      const { from: sFrom, to: sTo } = getSeasonDateRange(currentSeason.number, curYear);
      const seasonStart = new Date(sFrom + "T00:00:00");
      const seasonEnd   = new Date(sTo   + "T23:59:59");
      const sTotalDays  = Math.round((seasonEnd.getTime() - seasonStart.getTime()) / 86400000);
      const sElapsed    = Math.max(0, Math.round((today.getTime() - seasonStart.getTime()) / 86400000));
      const sPct        = Math.max(0, Math.min(100, Math.round((sElapsed / sTotalDays) * 100)));
      const sDaysLeft   = Math.max(0, sTotalDays - sElapsed);

      // ── تقدم السنة كاملة ──
      const yearStart  = new Date(curYear, 0, 1);  // 1 يناير
      const yearEnd    = new Date(curYear, 11, 31, 23, 59, 59);
      const yTotalDays = Math.round((yearEnd.getTime() - yearStart.getTime()) / 86400000);
      const yElapsed   = Math.round((today.getTime() - yearStart.getTime()) / 86400000);
      const yPct       = Math.max(0, Math.min(100, Math.round((yElapsed / yTotalDays) * 100)));

      setSeasonProgress({
        percent: sPct,
        daysLeft: sDaysLeft,
        elapsed: sElapsed,
        // حقول إضافية للعرض
        seasonName: currentSeason.name,
        seasonEmoji: currentSeason.emoji,
        seasonColor: currentSeason.color,
        totalDays: sTotalDays,
        yearPercent: yPct,
        yearElapsed: yElapsed,
        yearTotal: yTotalDays,
        year: curYear,
      });

      // ── الطلاب ──
      const allStudents = (isPrincipal || user?.role === "super_admin")
        ? await db.students.where("schoolId").equals(school.id).toArray()
        : await db.students.where("teacherId").equals(user!.id).toArray();
      setStudents(allStudents);
      const activeSts = allStudents.filter(s => s.status === "نشط");

      // ── الحصص والغيابات ──
      const weekStart  = new Date(today);
      weekStart.setDate(today.getDate() - 7);
      const weekStr    = weekStart.toISOString().slice(0, 10);
      const todayStr   = today.toISOString().slice(0, 10);
      
      const yesterdayStart = new Date(today);
      yesterdayStart.setDate(today.getDate() - 1);
      const yesterdayStr = yesterdayStart.toISOString().slice(0, 10);

      const sessions = (isPrincipal || user?.role === "super_admin")
        ? await db.sessions.where("schoolId").equals(school.id).toArray()
        : await db.sessions.where("teacherId").equals(user!.id).toArray();

      const validSessions = sessions.filter(s =>
        s.date >= weekStr && s.date <= todayStr &&
        s.sessionType !== "يوم عطلة" && s.sessionType !== "غياب المعلم"
      );
      setWeekSessions(validSessions.length);

      // مؤشر الطلاب في خطر (3 غيابات فأكثر في آخر 7 أيام)
      const absentCounts: Record<string, number> = {};
      validSessions.forEach(s => {
        s.records.forEach(r => {
          if (r.attendance === "غائب" || r.attendance === "متأخر") { // متأخر قد يعامل كنصف لكن سنركز على الغائب
            if (r.attendance === "غائب") absentCounts[r.studentId] = (absentCounts[r.studentId] || 0) + 1;
          }
        });
      });
      const atRiskIds = Object.keys(absentCounts).filter(id => absentCounts[id] >= 3);
      setAtRiskStudents(activeSts.filter(s => atRiskIds.includes(s.id)));

      // للمعلم: من غاب بالأمس
      if (!isPrincipal && user?.role === "teacher") {
        const yestSessions = sessions.filter(s => s.date === yesterdayStr);
        const yestAbsentIds = new Set<string>();
        yestSessions.forEach(s => s.records.forEach(r => {
          if (r.attendance === "غائب") yestAbsentIds.add(r.studentId);
        }));
        setTeacherAbsentYesterday(activeSts.filter(s => yestAbsentIds.has(s.id)));
      }

      // نسبة حضور اليوم
      const todaySessions = sessions.filter(s => s.date === todayStr && s.sessionType !== "يوم عطلة" && s.sessionType !== "غياب المعلم");
      let presentToday = 0, totalToday = 0;
      todaySessions.forEach(s => s.records.forEach(r => {
        if (r.attendance) {
          totalToday++;
          if (["حاضر", "تعويض", "متأخر"].includes(r.attendance)) presentToday++;
        }
      }));
      setTodayAttendanceRate(totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : null);

      // ── تنبيهات ──
      const newAlerts: { msg: string; href: string; color: string }[] = [];

      const pendingReg = await db.registrations
        .where("schoolId").equals(school.id)
        .filter(r => r.status === "مرشح" || r.status === "تم الإتصال").count();
      if (pendingReg > 0) {
        newAlerts.push({
          msg: `${pendingReg} طلب تسجيل جديد ينتظر المراجعة`,
          href: "/app/registrations",
          color: "border-amber-400 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200",
        });
      }

      if (isPrincipal || user?.role === "super_admin") {
        // المدفوعات المعلقة
        const unpaid = await db.payments.where("schoolId").equals(school.id)
          .filter(p => p.status === "unpaid").count();
        setPendingPaymentsCount(unpaid);

        const teachers = await db.users
          .where("schoolId").equals(school.id)
          .filter(u => u.role === "teacher").toArray();
        const cutoff = new Date(today.getTime() - 4 * 86400000).toISOString().slice(0, 10);
        let inactive = 0;
        for (const t of teachers) {
          const last = await db.sessions.where("teacherId").equals(t.id)
            .filter(s => s.sessionType !== "يوم عطلة" && s.sessionType !== "غياب المعلم")
            .reverse().first();
          if (!last || last.date < cutoff) inactive++;
        }
        if (inactive > 0) {
          newAlerts.push({
            msg: `${inactive} ${inactive === 1 ? "معلم لم يسجّل حصة" : "معلمون لم يسجّلوا"} منذ 4 أيام`,
            href: "/app/sheikh-monitoring",
            color: "border-red-400 bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-200",
          });
        }
      }
      setAlerts(newAlerts);

      // ── آخر النشاطات (5 نشاطات بدل 4) ──
      const logs = await db.activityLogs
        .where("schoolId").equals(school.id)
        .reverse().sortBy("createdAt");
      setRecentLogs(logs.slice(0, 5).map(l => {
        const mins = Math.round((Date.now() - new Date(l.createdAt).getTime()) / 60000);
        const time = mins < 60 ? `${mins} د` : mins < 1440 ? `${Math.round(mins / 60)} س` : `${Math.round(mins / 1440)} يوم`;
        return { desc: l.description, time: `منذ ${time}` };
      }));

      setLoading(false);
    };

    load();
  }, [school?.id, isPrincipal, user?.id, user?.role]);

  const activeStudents = students.filter(s => s.status === "نشط");

  const hijriDate  = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const miladiDate = new Intl.DateTimeFormat("ar-DZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

  const isManager = isPrincipal || user?.role === "super_admin";
  const stats = isManager ? [
    { label: "طالب نشط", value: loading ? "..." : activeStudents.length, icon: Users, color: "bg-gradient-to-br from-emerald-400 to-emerald-600", href: "/app/students" },
    { label: "نسبة حضور اليوم", value: loading ? "..." : todayAttendanceRate !== null ? `${todayAttendanceRate}%` : "—", icon: TrendingUp, color: "bg-gradient-to-br from-blue-400 to-blue-600", href: "/app/performance" },
    { label: "دفعات معلقة", value: loading ? "..." : pendingPaymentsCount, icon: CreditCard, color: "bg-gradient-to-br from-rose-400 to-rose-600", href: "/app/dues" },
    { label: "تنبيهات نشطة", value: loading ? "..." : alerts.length + (atRiskStudents.length > 0 ? 1 : 0), icon: AlertTriangle, color: "bg-gradient-to-br from-amber-400 to-amber-600", href: "/app/notifications" },
  ] : [
    { label: "طلابي النشطين", value: loading ? "..." : activeStudents.length, icon: Users, color: "bg-gradient-to-br from-emerald-400 to-emerald-600", href: "/app/students" },
    { label: "حضور فصلي اليوم", value: loading ? "..." : todayAttendanceRate !== null ? `${todayAttendanceRate}%` : "—", icon: TrendingUp, color: "bg-gradient-to-br from-blue-400 to-blue-600", href: "/app/sessions" },
    { label: "حصص الأسبوع", value: loading ? "..." : weekSessions, icon: ClipboardList, color: "bg-gradient-to-br from-purple-400 to-purple-600", href: "/app/sessions" },
    { label: "إجمالي السور", value: loading ? "..." : activeStudents.reduce((s, st) => s + (st.memorizedSurahsCount ?? 0), 0), icon: BookOpen, color: "bg-gradient-to-br from-amber-400 to-amber-600", href: "/app/quran" },
  ];

  const quickActions = [
    { label: "تسجيل حصة اليوم", desc: "ابدأ تسجيل الحضور", icon: ClipboardList, href: "/app/sessions",  color: "from-[var(--color-primary)] to-[var(--color-primary-dark)]" },
    { label: "إضافة طالب جديد",  desc: "تسجيل طالب جديد",  icon: Users,         href: "/app/students",  color: "from-blue-500 to-blue-700"  },
    { label: "متابعة الحفظ",     desc: "تحديث خريطة السور", icon: BookOpen,      href: "/app/quran",     color: "from-amber-500 to-amber-700" },
    { label: "التقرير اليومي",   desc: "كتابة ملاحظات اليوم",icon: Star,         href: "/app/reports",   color: "from-purple-500 to-purple-700" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir="rtl">

      {/* ── ترحيب ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="tour-step-dashboard-welcome bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-10" />
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium mb-1">{miladiDate}</p>
          <h2 className="text-2xl font-black mb-1" style={{ fontFamily: "var(--font-headline)" }}>
            أهلاً وسهلاً، {user?.displayName?.split(" ")[0] ?? "المعلم"} 👋
          </h2>
          <p className="text-white/75 text-sm">{school?.name}</p>
          <div className="mt-3 flex items-center gap-2 text-white/60 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>{hijriDate}</span>
          </div>
        </div>
      </motion.div>

      {/* ── مؤشر الطلاب في خطر (At-Risk) ── */}
      {!loading && atRiskStudents.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-red-800 dark:text-red-200 mb-1 text-sm sm:text-base">تنبيه: طلاب في خطر (غياب متكرر)</h3>
            <p className="text-red-700 dark:text-red-300 text-xs sm:text-sm mb-3">
              هؤلاء الطلاب تغيبوا 3 مرات أو أكثر خلال آخر 7 أيام ويحتاجون إلى متابعة فورية.
            </p>
            <div className="flex flex-wrap gap-2">
              {atRiskStudents.slice(0, 5).map(s => (
                <Link key={s.id} href={`/app/students/${s.id}`} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[var(--color-card)] border border-red-200 dark:border-red-500/30 rounded-full text-xs font-bold text-red-700 hover:bg-red-50 transition-colors">
                  <XCircle className="w-3.5 h-3.5 opacity-70" />
                  {s.fullName.split(' ').slice(0,2).join(' ')}
                </Link>
              ))}
              {atRiskStudents.length > 5 && (
                <span className="inline-flex items-center px-3 py-1 bg-red-100 dark:bg-red-500/20 rounded-full text-xs font-bold text-red-700">
                  +{atRiskStudents.length - 5} آخرين
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── تنبيهات المعلم: غيابات الأمس ── */}
      {!loading && teacherAbsentYesterday.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-amber-800 dark:text-amber-200 mb-1 text-sm sm:text-base">تذكير بالمتابعة: غيابات الأمس</h3>
            <p className="text-amber-700 dark:text-amber-300 text-xs sm:text-sm mb-2">تأكد من متابعة الطلاب الذين غابوا يوم أمس:</p>
            <div className="text-xs font-bold text-amber-700 dark:text-amber-300 flex flex-wrap gap-x-3 gap-y-1">
              {teacherAbsentYesterday.map(st => <span key={st.id}>• {st.fullName}</span>)}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── تنبيهات النظام ── */}
      {!loading && alerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="space-y-2">
          {alerts.map((a, i) => (
            <Link key={i} href={a.href}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border-r-4 ${a.color} hover:opacity-90 transition-opacity`}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <p className="text-sm font-bold flex-1">{a.msg}</p>
              <ArrowLeft className="w-4 h-4 shrink-0 opacity-50" />
            </Link>
          ))}
        </motion.div>
      )}

      {/* ── إحصائيات ── */}
      <div>
        <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">نظرة سريعة</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => <StatCard key={i} {...s} delay={i * 0.06} />)}
        </div>
      </div>

      {/* ── إجراءات و تقدم الموسم ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">إجراءات سريعة</h3>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.05 }}>
                <Link href={a.href}
                  className="flex flex-col md:flex-row items-center text-center md:text-right gap-3 p-4 bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] hover:shadow-lg hover:border-[var(--color-primary)]/20 transition-all duration-300 group h-full">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md`}>
                    <a.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-800 dark:text-white mb-0.5">{a.label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{a.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* تقدم السنة الدراسية */}
        <div>
          <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">مسار الموسم الدراسي</h3>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="p-5 bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] h-[calc(100%-28px)] flex flex-col justify-center gap-4">

            {/* ── شريط الفصل الحالي ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{seasonProgress.seasonEmoji || "📅"}</span>
                  <span className="text-xs font-black text-gray-600 dark:text-gray-300">
                    {seasonProgress.seasonName || "الفصل الحالي"}
                  </span>
                </div>
                <span className="text-lg font-black" style={{ color: seasonProgress.seasonColor || "var(--color-primary)" }}>
                  {seasonProgress.percent}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-1.5">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${seasonProgress.percent}%` }} transition={{ duration: 1, delay: 0.5 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${seasonProgress.seasonColor || "#107a57"}, ${seasonProgress.seasonColor || "#107a57"}cc)` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-medium text-gray-400">
                <span>انقضى <b className="text-gray-700 dark:text-gray-200">{seasonProgress.elapsed}</b> يوم</span>
                <span>باقي <b className="text-gray-700 dark:text-gray-200">
                  {seasonProgress.daysLeft > 7
                    ? `${Math.ceil(seasonProgress.daysLeft / 7)} أسبوع`
                    : `${seasonProgress.daysLeft} يوم`}
                </b></span>
              </div>
            </div>

            {/* ── فاصل ── */}
            <div className="h-px bg-gray-100 dark:bg-white/5" />

            {/* ── شريط السنة كاملة ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">📆</span>
                  <span className="text-xs font-black text-gray-600 dark:text-gray-300">
                    السنة {seasonProgress.year}
                  </span>
                </div>
                <span className="text-lg font-black text-[var(--color-secondary)]">
                  {seasonProgress.yearPercent}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-1.5 relative">
                {/* شرائح الفصول الأربعة داخل الشريط */}
                {["#3b82f6", "#10b981", "#f59e0b", "#ef4444"].map((color, i) => (
                  <div key={i} className="absolute top-0 h-full w-[25%]" style={{ left: `${i * 25}%`, opacity: 0.15, background: color }} />
                ))}
                {/* فواصل بين الفصول */}
                {[25, 50, 75].map(pos => (
                  <div key={pos} className="absolute top-0 h-full w-px bg-white/60" style={{ left: `${pos}%` }} />
                ))}
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${seasonProgress.yearPercent}%` }} transition={{ duration: 1.2, delay: 0.6 }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 relative z-10"
                />
              </div>
              <div className="flex justify-between text-[11px] font-medium text-gray-400">
                <span>اليوم <b className="text-gray-700 dark:text-gray-200">{seasonProgress.yearElapsed}</b> من {seasonProgress.yearTotal}</span>
                <span className="text-[10px] flex gap-2">
                  {["❄️","🌸","☀️","🍂"].map((e, i) => (
                    <span key={i} className={`opacity-${Math.ceil((seasonProgress.yearPercent || 0) / 25) > i ? "100" : "30"}`}>{e}</span>
                  ))}
                </span>
              </div>
            </div>

          </motion.div>
        </div>
      </div>

      {/* ── الصف السفلي ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* آخر الطلاب */}
        {!loading && activeStudents.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">آخر الطلاب</h3>
              <Link href="/app/students" className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1 hover:underline">
                عرض الكل <ArrowLeft className="w-3 h-3" />
              </Link>
            </div>
            <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] divide-y divide-gray-100 dark:divide-white/5">
              {activeStudents.slice(0, 5).map(student => (
                <div key={student.id} className="flex items-center gap-3 p-3.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white font-black text-sm shrink-0">
                    {student.fullName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800 dark:text-white truncate">{student.fullName}</p>
                    <p className="text-xs text-gray-400">{student.groupName} · {student.memorizedSurahsCount ?? 0} سورة</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    نشط
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* آخر النشاطات */}
        {!loading && recentLogs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">آخر النشاطات</h3>
              <Link href="/app/logs" className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1 hover:underline">
                عرض الكل <ArrowLeft className="w-3 h-3" />
              </Link>
            </div>
            <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] divide-y divide-gray-100 dark:divide-white/5">
              {recentLogs.map((log, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
                  <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 font-medium leading-snug">{log.desc}</p>
                  <span className="text-[11px] text-gray-400 shrink-0">{log.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* رسالة فارغة */}
        {!loading && students.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-6 flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-amber-800 dark:text-amber-200 mb-1">لا يوجد طلاب مسجّلون بعد</p>
              <p className="text-amber-700 dark:text-amber-300 text-sm mb-3">ابدأ بإضافة طلابك لتتمكن من تسجيل الحصص ومتابعة الحفظ.</p>
              <Link href="/app/students"
                className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 transition-colors">
                إضافة أول طالب <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

export default function DashboardPage() {
  const { role, user } = useAuth();
  if (role === "super_admin") return <SuperAdminDashboard displayName={user?.displayName} />;
  if (role === "teacher") return <TeacherDashboard />;
  return <SchoolDashboard />;
}
