"use client";
import SchoolGuard from "@/components/layout/SchoolGuard";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import { createReport } from "@/lib/storage/mutations";
import type { Student, DailySession, AppUser, Covenant } from "@/lib/types";
import { surahs } from "@/lib/surahs";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Users, Activity, TrendingUp,
  CheckCircle2, AlertTriangle, AlertCircle,
  Calendar, Star, BookOpen, Loader2, RefreshCw,
  ChevronDown, Target, BellRing,
  Trophy, MessageSquare, Send, X,
  BadgeAlert,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// الأنواع
// ─────────────────────────────────────────────────────────────

interface TeacherStats {
  teacher: AppUser;
  totalStudents: number;
  activeStudents: number;
  sessionsThisMonth: number;
  sessionsThisWeek: number;
  lastWeekSessions: number;
  attendanceRate: number;
  weekAttendanceRate: number;
  memExcellentRate: number;
  reviewRate: number;
  absentDays: number;
  lastSessionDate: string | null;
  consecutiveAbsentDays: number;   // أيام تشغيلية متتالية بدون حصة
  score: number;
  level: "ممتاز" | "جيد" | "متوسط" | "ضعيف";
  // تفاصيل إضافية
  recentAchievements: { studentName: string; surahName: string; date: string }[];
  studentsAtRisk: { id: string; name: string; absences: number }[];
  badBehaviorStudents: { id: string; name: string; count: number }[];
  activeCovenantsCount: number;
  weeklyGoalPct: number; // نسبة تحقيق هدف الأسبوع (target=5)
}

type SmartAlert = {
  id: string;
  type:
    | "consecutive_absence"   // 🔴 غياب متتالي
    | "monthly_absence"       // 🟠 غياب متكرر
    | "long_inactivity"       // 🟠 انقطاع طويل
    | "low_attendance"        // 🟡 ضعف حضور الطلاب
    | "achievement"           // ✅ إنجاز
    | "discipline"            // 🟠 سلوك سيء متكرر
    | "top_teacher";          // 🏆 أفضل معلم
  teacherId: string;
  teacherName: string;
  message: string;
  detail?: string;
  priority: "urgent" | "important" | "normal" | "positive";
  date: string;
  autoReportCreated?: boolean;
};

// ─────────────────────────────────────────────────────────────
// ثوابت
// ─────────────────────────────────────────────────────────────

const WEEKLY_SESSION_TARGET = 5;
const CONSECUTIVE_ABSENCE_THRESHOLD = 2;
const MONTHLY_ABSENCE_THRESHOLD = 3;
const INACTIVITY_DAYS_THRESHOLD = 4;
const LOW_ATTENDANCE_THRESHOLD = 65;
const BAD_BEHAVIOR_THRESHOLD = 3;

const LEVEL_CONFIG = {
  "ممتاز": { color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", bar: "bg-emerald-500" },
  "جيد":   { color: "text-blue-700 dark:text-blue-300",     bg: "bg-blue-50 dark:bg-blue-500/10",     border: "border-blue-200 dark:border-blue-500/20",     bar: "bg-blue-500"    },
  "متوسط": { color: "text-amber-700 dark:text-amber-300",   bg: "bg-amber-50 dark:bg-amber-500/10",   border: "border-amber-200 dark:border-amber-500/20",   bar: "bg-amber-400"   },
  "ضعيف":  { color: "text-red-700 dark:text-red-300",       bg: "bg-red-50 dark:bg-red-500/10",       border: "border-red-200 dark:border-red-500/20",       bar: "bg-red-500"     },
};

const ALERT_CONFIG = {
  consecutive_absence: { icon: "🔴", label: "غياب متتالي", border: "border-red-200 dark:border-red-500/30", bg: "bg-red-50 dark:bg-red-900/20", badge: "bg-red-500" },
  monthly_absence:     { icon: "🟠", label: "غياب متكرر",  border: "border-orange-200 dark:border-orange-500/30", bg: "bg-orange-50 dark:bg-orange-900/20", badge: "bg-orange-500" },
  long_inactivity:     { icon: "⏰", label: "انقطاع طويل", border: "border-amber-200 dark:border-amber-500/30", bg: "bg-amber-50 dark:bg-amber-900/20", badge: "bg-amber-500" },
  low_attendance:      { icon: "📉", label: "ضعف الحضور",  border: "border-yellow-200 dark:border-yellow-500/30", bg: "bg-yellow-50 dark:bg-yellow-900/20", badge: "bg-yellow-500" },
  achievement:         { icon: "✅", label: "إنجاز",        border: "border-emerald-200 dark:border-emerald-500/30", bg: "bg-emerald-50 dark:bg-emerald-900/20", badge: "bg-emerald-500" },
  discipline:          { icon: "⚠️", label: "سلوك سيء",    border: "border-rose-200 dark:border-rose-500/30", bg: "bg-rose-50 dark:bg-rose-900/20", badge: "bg-rose-500" },
  top_teacher:         { icon: "🏆", label: "الأفضل",       border: "border-purple-200 dark:border-purple-500/30", bg: "bg-purple-50 dark:bg-purple-900/20", badge: "bg-purple-500" },
};

// ─────────────────────────────────────────────────────────────
// حساب المستوى
// ─────────────────────────────────────────────────────────────

function getLevel(score: number): "ممتاز" | "جيد" | "متوسط" | "ضعيف" {
  if (score >= 80) return "ممتاز";
  if (score >= 60) return "جيد";
  if (score >= 40) return "متوسط";
  return "ضعيف";
}

// ─────────────────────────────────────────────────────────────
// خوارزمية الغياب المتتالي الدقيقة
// ─────────────────────────────────────────────────────────────

/**
 * تكتشف كم يوم تشغيلي متتالياً مضى دون أن يسجل المعلم حصة.
 * تستثني أيام العطل المسجلة ويوم الجمعة/السبت.
 */
function calcConsecutiveAbsentDays(teacherSessions: DailySession[]): number {
  const today = new Date();
  const holidayDates = new Set(
    teacherSessions
      .filter(s => s.sessionType === "يوم عطلة")
      .map(s => s.date)
  );
  const recordedDates = new Set(
    teacherSessions
      .filter(s => s.sessionType !== "يوم عطلة" && s.sessionType !== "غياب المعلم")
      .map(s => s.date)
  );

  let consecutive = 0;
  // نبدأ من أمس ونذهب للخلف
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dow = d.getDay(); // 0=Sunday, 5=Friday, 6=Saturday
    const dateStr = d.toISOString().slice(0, 10);

    // استثنِ أيام العطل الأسبوعية (الجمعة=5, السبت=6)
    if (dow === 5 || dow === 6) continue;
    // استثنِ أيام العطل المسجلة
    if (holidayDates.has(dateStr)) continue;

    if (recordedDates.has(dateStr)) break; // وجدنا حصة مسجلة → توقف
    consecutive++;
  }
  return consecutive;
}

// ─────────────────────────────────────────────────────────────
// مكوّن بطاقة التنبيه
// ─────────────────────────────────────────────────────────────

function AlertCard({
  alert, onCreateReport, onDismiss, reportCreating,
}: {
  alert: SmartAlert;
  onCreateReport: (alert: SmartAlert) => void;
  onDismiss: (id: string) => void;
  reportCreating: string | null;
}) {
  const cfg = ALERT_CONFIG[alert.type];
  const isUrgent = alert.priority === "urgent";
  const isPositive = alert.priority === "positive";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10, height: 0 }}
      className={`rounded-2xl border-2 p-4 ${cfg.border} ${cfg.bg} ${isUrgent ? "ring-1 ring-red-300 dark:ring-red-500/30" : ""}`}
    >
      <div className="flex items-start gap-3">
        {/* الأيقونة */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${cfg.bg} border ${cfg.border}`}>
          {cfg.icon}
        </div>

        {/* المحتوى */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white ${cfg.badge}`}>
                  {cfg.label}
                </span>
                {isUrgent && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                    عاجل
                  </span>
                )}
              </div>
              <p className="text-sm font-black text-gray-800 dark:text-white mt-1.5">
                {alert.message}
              </p>
              {alert.detail && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{alert.detail}</p>
              )}
            </div>
            {/* زر الإغلاق */}
            <button
              onClick={() => onDismiss(alert.id)}
              className="w-6 h-6 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          </div>

          {/* الأزرار */}
          {!isPositive && (
            <div className="flex items-center gap-2 mt-3">
              {(alert.type === "consecutive_absence" || alert.type === "monthly_absence" || alert.type === "long_inactivity") && (
                <button
                  onClick={() => onCreateReport(alert)}
                  disabled={!!reportCreating || alert.autoReportCreated}
                  className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl transition-all ${
                    alert.autoReportCreated
                      ? "bg-emerald-100 text-emerald-700 cursor-default"
                      : "bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  }`}
                >
                  {reportCreating === alert.id ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> جارٍ الإنشاء...</>
                  ) : alert.autoReportCreated ? (
                    <><CheckCircle2 className="w-3 h-3" /> تم إنشاء التقرير</>
                  ) : (
                    <><MessageSquare className="w-3 h-3" /> إنشاء تقرير تلقائي</>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// لوحة التنبيهات الذكية
// ─────────────────────────────────────────────────────────────

function SmartAlertsPanel({
  alerts, onCreateReport, onDismissAll, onDismiss, reportCreating,
}: {
  alerts: SmartAlert[];
  onCreateReport: (alert: SmartAlert) => void;
  onDismissAll: () => void;
  onDismiss: (id: string) => void;
  reportCreating: string | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const urgentCount = alerts.filter(a => a.priority === "urgent").length;
  const importantCount = alerts.filter(a => a.priority === "important").length;

  if (alerts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[var(--color-card)] rounded-3xl border-2 border-[var(--color-border)] overflow-hidden shadow-sm"
    >
      {/* رأس اللوحة */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer select-none"
        onClick={() => setCollapsed(v => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-md">
              <BellRing className="w-5 h-5 text-white" />
            </div>
            {urgentCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                {urgentCount}
              </span>
            )}
          </div>
          <div>
            <p className="font-black text-gray-900 dark:text-white text-sm">
              التنبيهات الذكية
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {urgentCount > 0 && (
                <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full">
                  {urgentCount} عاجل
                </span>
              )}
              {importantCount > 0 && (
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded-full">
                  {importantCount} مهم
                </span>
              )}
              <span className="text-[10px] text-gray-400">{alerts.length} إجمالي</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onDismissAll(); }}
            className="text-[10px] font-bold text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-all"
          >
            تجاهل الكل
          </button>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* قائمة التنبيهات */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* العاجلة أولاً ثم المهمة ثم الإيجابية */}
              {[...alerts]
                .sort((a, b) => {
                  const order = { urgent: 0, important: 1, normal: 2, positive: 3 };
                  return order[a.priority] - order[b.priority];
                })
                .map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onCreateReport={onCreateReport}
                    onDismiss={onDismiss}
                    reportCreating={reportCreating}
                  />
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal إرسال رسالة للمعلم
// ─────────────────────────────────────────────────────────────

function SendMessageModal({
  teacher, schoolId, senderName, senderId,
  onClose, onSent,
}: {
  teacher: AppUser;
  schoolId: string;
  senderName: string;
  senderId: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const TEMPLATES = [
    { label: "تذكير بالتسجيل", text: `الأستاذ ${teacher.displayName} حفظه الله، نرجو منكم تسجيل حصص الفوج بانتظام لمتابعة مسيرة الطلاب. شكراً لتعاونكم.` },
    { label: "غياب متكرر", text: `الأستاذ ${teacher.displayName} وفقه الله، لوحظ تكرار الغياب عن الحلقة مؤخراً مما يؤثر على الطلاب. نأمل منكم الالتزام أو إعلامنا بالأسباب.` },
    { label: "تهنئة بالإنجاز", text: `بارك الله فيكم أستاذ ${teacher.displayName}، نبارك لكم ولطلابكم التقدم الملحوظ في الحفظ. نسأل الله أن يبارك في جهودكم.` },
    { label: "طلب مراجعة الوضع", text: `الأستاذ ${teacher.displayName} أكرمكم الله، نودّ الاجتماع لمناقشة أوضاع الفوج وتطوير الأداء. هل يناسبكم الأسبوع القادم؟` },
  ];

  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!note.trim()) return;
    setSending(true);
    await createReport({
      schoolId,
      teacherId: teacher.id,
      date: new Date().toISOString().slice(0, 10),
      note: note.trim(),
      authorName: senderName,
      category: "طلب إداري",
      priority: "important",
      status: "pending",
      adminNotes: null,
      isPinned: false,
      isManagementMessage: true,
      recipientId: teacher.id,
    });
    setSending(false);
    onSent();
    onClose();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50"
      >
        <div className="bg-white dark:bg-[var(--color-card)] rounded-3xl shadow-2xl overflow-hidden" dir="rtl">
          {/* رأس */}
          <div className="flex items-center justify-between p-5 bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <div>
                <p className="font-black text-sm">رسالة إلى المعلم</p>
                <p className="text-white/70 text-xs mt-0.5">{teacher.displayName}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* قوالب سريعة */}
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">قوالب سريعة</p>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATES.map(t => (
                  <button
                    key={t.label}
                    onClick={() => setNote(t.text)}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold border border-gray-200 bg-gray-50 text-gray-600 hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)] transition-all"
                  >
                    {t.label} →
                  </button>
                ))}
              </div>
            </div>

            {/* النص */}
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              rows={5}
              className="w-full resize-none border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm bg-white dark:bg-white/5 text-gray-800 dark:text-white leading-relaxed focus:outline-none focus:border-[var(--color-primary)]/50 transition-all"
            />
          </div>

          <div className="flex gap-3 px-5 pb-5">
            <button onClick={onClose} className="btn-secondary flex-1 py-3 justify-center text-sm">إلغاء</button>
            <button
              onClick={handleSend}
              disabled={!note.trim() || sending}
              className="btn-primary flex-1 py-3 justify-center text-sm disabled:opacity-40"
            >
              {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الإرسال</> : <><Send className="w-4 h-4" /> إرسال</>}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// بطاقة المعلم المُحسَّنة
// ─────────────────────────────────────────────────────────────

function TeacherCard({
  stats, index, onSendMessage,
}: {
  stats: TeacherStats;
  index: number;
  onSendMessage: (teacher: AppUser) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = LEVEL_CONFIG[stats.level];

  const daysSinceLast = stats.lastSessionDate
    ? Math.floor((Date.now() - new Date(stats.lastSessionDate).getTime()) / 86400000)
    : null;

  const consecutiveColor =
    stats.consecutiveAbsentDays >= CONSECUTIVE_ABSENCE_THRESHOLD
      ? "text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200"
      : stats.consecutiveAbsentDays >= 1
      ? "text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200"
      : "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`bg-white dark:bg-[var(--color-card)] rounded-2xl border-2 ${cfg.border} overflow-hidden hover:shadow-md transition-shadow`}
    >
      {/* شريط المستوى */}
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
              <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${cfg.bg} ${cfg.color} shrink-0`}>
                {stats.level}
              </span>
            </div>

            {/* شريط النقاط */}
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

        {/* الإحصائيات الرئيسية */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: "حضور الطلاب", value: `${stats.weekAttendanceRate}%`, icon: CheckCircle2,
              color: stats.weekAttendanceRate >= 70 ? "text-emerald-600" : "text-red-500" },
            { label: "حفظ ممتاز", value: `${stats.memExcellentRate}%`, icon: Star,
              color: stats.memExcellentRate >= 30 ? "text-amber-600" : "text-gray-500" },
            { label: "جلسات/شهر", value: stats.sessionsThisMonth, icon: Calendar, color: "text-indigo-600" },
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

        {/* شريط تقدم الأسبوع */}
        <div className="mt-3 bg-gray-50 dark:bg-white/5 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              <p className="text-xs font-bold text-gray-600 dark:text-gray-300">هدف الأسبوع</p>
            </div>
            <p className="text-xs font-black text-gray-700 dark:text-gray-200">
              {stats.sessionsThisWeek}/{WEEKLY_SESSION_TARGET} حصة
            </p>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.weeklyGoalPct}%` }}
              transition={{ delay: index * 0.07 + 0.5, duration: 0.6 }}
              className={`h-full rounded-full ${
                stats.weeklyGoalPct >= 100 ? "bg-emerald-500" :
                stats.weeklyGoalPct >= 60 ? "bg-indigo-500" : "bg-amber-400"
              }`}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-gray-400">
            <span>{stats.weeklyGoalPct >= 100 ? "✅ أُنجز الهدف!" : `${stats.weeklyGoalPct}%`}</span>
            <span>آخر سجّل: {daysSinceLast === 0 ? "اليوم" : daysSinceLast === 1 ? "أمس" : daysSinceLast !== null ? `${daysSinceLast} أيام` : "لا يوجد"}</span>
          </div>
        </div>

        {/* مؤشر الغياب المتتالي */}
        {(stats.consecutiveAbsentDays > 0 || stats.absentDays > 0) && (
          <div className="mt-2 flex gap-2">
            {stats.consecutiveAbsentDays > 0 && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold flex-1 ${consecutiveColor}`}>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>غياب متتالي: {stats.consecutiveAbsentDays} يوم</span>
                {stats.consecutiveAbsentDays >= CONSECUTIVE_ABSENCE_THRESHOLD && (
                  <span className="mr-auto text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">تنبيه!</span>
                )}
              </div>
            )}
            {stats.absentDays > 0 && (
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 dark:text-gray-400">
                <span>{stats.absentDays} غياب/شهر</span>
              </div>
            )}
          </div>
        )}

        {/* زر التفاصيل */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-center gap-1 mt-3 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          {expanded ? "إخفاء التفاصيل" : "عرض التفاصيل الكاملة"}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {/* التفاصيل الموسعة */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 space-y-3">

                {/* الإحصائيات التفصيلية */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "جلسات هذا الأسبوع", value: `${stats.sessionsThisWeek}`, icon: Activity,
                      sub: stats.lastWeekSessions ? `الأسبوع الماضي: ${stats.lastWeekSessions}` : "" },
                    { label: "نسبة إتمام المراجعة", value: `${stats.reviewRate}%`, icon: BookOpen, sub: "" },
                    { label: "الطلاب النشطون", value: `${stats.activeStudents}`, icon: Users, sub: "" },
                    { label: "نسبة حضور كلية", value: `${stats.attendanceRate}%`, icon: TrendingUp, sub: "" },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-gray-700 dark:text-gray-200">{item.value}</p>
                          <p className="text-[10px] text-gray-400 truncate">{item.label}</p>
                          {item.sub && <p className="text-[9px] text-gray-300">{item.sub}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* آخر الإنجازات */}
                {stats.recentAchievements.length > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3">
                    <p className="text-xs font-black text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" /> إنجازات حديثة ({stats.recentAchievements.length})
                    </p>
                    <div className="space-y-1">
                      {stats.recentAchievements.slice(0, 3).map((a, i) => (
                        <p key={i} className="text-xs text-emerald-700 dark:text-emerald-400">
                          • <b>{a.studentName}</b> — أتم حفظ سورة {a.surahName}
                        </p>
                      ))}
                      {stats.recentAchievements.length > 3 && (
                        <p className="text-[10px] text-emerald-500">+{stats.recentAchievements.length - 3} إنجازات أخرى...</p>
                      )}
                    </div>
                  </div>
                )}

                {/* الطلاب في خطر */}
                {stats.studentsAtRisk.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-3">
                    <p className="text-xs font-black text-red-700 dark:text-red-300 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> طلاب في خطر ({stats.studentsAtRisk.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {stats.studentsAtRisk.map(s => (
                        <span key={s.id} className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/20">
                          {s.name} ({s.absences} غياب)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* السلوك السيء */}
                {stats.badBehaviorStudents.length > 0 && (
                  <div className="bg-rose-50 dark:bg-rose-500/10 rounded-xl p-3">
                    <p className="text-xs font-black text-rose-700 dark:text-rose-300 mb-2 flex items-center gap-1">
                      <BadgeAlert className="w-3.5 h-3.5" /> سلوك يستدعي المتابعة
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {stats.badBehaviorStudents.map(s => (
                        <span key={s.id} className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300">
                          {s.name} ({s.count}×)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* التعهدات النشطة */}
                {stats.activeCovenantsCount > 0 && (
                  <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                      {stats.activeCovenantsCount} تعهد نشط لدى الطلاب
                    </p>
                  </div>
                )}

                {/* أزرار الإجراءات */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => onSendMessage(stats.teacher)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> إرسال رسالة
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// الصفحة الرئيسية
// ─────────────────────────────────────────────────────────────

function SheikhMonitoringPage() {
  const { user, school, isPrincipal } = useAuth();
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allSessions, setAllSessions] = useState<DailySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"score" | "sessions" | "attendance">("score");
  const [filterView, setFilterView] = useState<"all" | "needs_attention" | "excellent" | "absent">("all");
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [autoReportCreatedFor, setAutoReportCreatedFor] = useState<Set<string>>(new Set());
  const [reportCreating, setReportCreating] = useState<string | null>(null);
  const [messageTo, setMessageTo] = useState<AppUser | null>(null);

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

  // ─── احتساب إحصائيات كل معلم ──────────────────────────────

  const teacherStats = useMemo<TeacherStats[]>(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const startOfWeek = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const startOfLastWeek = new Date(now.getTime() - 14 * 86400000).toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);

    // surahs imported at top of file

    return teachers.map(teacher => {
      const teacherStudents = allStudents.filter(s => s.teacherId === teacher.id);
      const activeStudents = teacherStudents.filter(s => s.status === "نشط");
      const teacherSessions = allSessions.filter(s => s.teacherId === teacher.id);

      const sessionsThisMonth = teacherSessions.filter(s =>
        s.date >= startOfMonth && s.sessionType !== "يوم عطلة"
      ).length;
      const sessionsThisWeek = teacherSessions.filter(s =>
        s.date >= startOfWeek && s.sessionType !== "يوم عطلة" && s.sessionType !== "غياب المعلم"
      ).length;
      const lastWeekSessions = teacherSessions.filter(s =>
        s.date >= startOfLastWeek && s.date < startOfWeek &&
        s.sessionType !== "يوم عطلة" && s.sessionType !== "غياب المعلم"
      ).length;
      const absentDays = teacherSessions.filter(s =>
        s.date >= startOfMonth && s.sessionType === "غياب المعلم"
      ).length;

      // آخر حصة
      const validSessions = teacherSessions
        .filter(s => s.sessionType !== "يوم عطلة" && s.sessionType !== "غياب المعلم")
        .sort((a, b) => b.date.localeCompare(a.date));
      const lastSessionDate = validSessions[0]?.date ?? null;

      // الغياب المتتالي
      const consecutiveAbsentDays = calcConsecutiveAbsentDays(teacherSessions);

      // هدف الأسبوع
      const weeklyGoalPct = Math.min(100, Math.round((sessionsThisWeek / WEEKLY_SESSION_TARGET) * 100));

      // معدلات كلية
      let totalPresent = 0, totalAttendance = 0;
      let weekPresent = 0, weekAttendance = 0;
      let totalMemExcellent = 0, totalMem = 0;
      let totalReviewDone = 0, totalReview = 0;

      teacherSessions.forEach(session => {
        if (session.sessionType === "يوم عطلة" || session.sessionType === "غياب المعلم") return;
        const isThisWeek = session.date >= startOfWeek;
        session.records.forEach(rec => {
          if (rec.attendance !== "") {
            totalAttendance++;
            if (rec.attendance === "حاضر" || rec.attendance === "تعويض") {
              totalPresent++;
              if (isThisWeek) { weekAttendance++; weekPresent++; }
            } else {
              if (isThisWeek) weekAttendance++;
            }
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
      const weekAttendanceRate = weekAttendance > 0 ? Math.round((weekPresent / weekAttendance) * 100) : 0;
      const memExcellentRate = totalMem > 0 ? Math.round((totalMemExcellent / totalMem) * 100) : 0;
      const reviewRate = totalReview > 0 ? Math.round((totalReviewDone / totalReview) * 100) : 0;

      // ── الإنجازات: الطلاب الذين أنهوا سوراً هذا الشهر ──
      const recentAchievements: { studentName: string; surahName: string; date: string }[] = [];
      teacherSessions
        .filter(s => s.date >= thirtyDaysAgo && s.sessionType !== "يوم عطلة")
        .forEach(session => {
          session.records.forEach(rec => {
            if (rec.memorization === "ممتاز" && rec.surahId) {
              const student = teacherStudents.find(s => s.id === rec.studentId);
              if (student) {
                const surah = surahs.find((s: any) => s.id === rec.surahId);
                // تجنب التكرار
                if (!recentAchievements.find(a => a.studentName === student.fullName && a.surahName === surah?.name)) {
                  recentAchievements.push({
                    studentName: student.fullName.split(" ").slice(0, 2).join(" "),
                    surahName: surah?.name ?? `${rec.surahId}`,
                    date: session.date,
                  });
                }
              }
            }
          });
        });

      // ── الطلاب في خطر: 3+ غيابات في آخر 7 أيام ──
      const absentCount: Record<string, number> = {};
      teacherSessions
        .filter(s => s.date >= sevenDaysAgo && s.sessionType !== "يوم عطلة")
        .forEach(s => s.records.forEach(r => {
          if (r.attendance === "غائب") {
            absentCount[r.studentId] = (absentCount[r.studentId] || 0) + 1;
          }
        }));
      const studentsAtRisk = activeStudents
        .filter(s => (absentCount[s.id] || 0) >= 3)
        .map(s => ({ id: s.id, name: s.fullName.split(" ").slice(0, 2).join(" "), absences: absentCount[s.id] }));

      // ── السلوك السيء المتكرر ──
      const badBehaviorCount: Record<string, number> = {};
      teacherSessions
        .filter(s => s.date >= thirtyDaysAgo)
        .forEach(s => s.records.forEach(r => {
          if (r.behavior === "غير منضبط") {
            badBehaviorCount[r.studentId] = (badBehaviorCount[r.studentId] || 0) + 1;
          }
        }));
      const badBehaviorStudents = activeStudents
        .filter(s => (badBehaviorCount[s.id] || 0) >= BAD_BEHAVIOR_THRESHOLD)
        .map(s => ({ id: s.id, name: s.fullName.split(" ").slice(0, 2).join(" "), count: badBehaviorCount[s.id] }));

      // ── التعهدات النشطة ──
      const activeCovenantsCount = teacherStudents.reduce((sum, s) => {
        const active = (s.covenants || []).filter((c: Covenant) => c.status === "نشط").length;
        return sum + active;
      }, 0);

      // احتساب النقاط الإجمالية
      const sessionScore = Math.min(sessionsThisMonth * 4, 40);
      const attendanceScore = Math.round(attendanceRate * 0.3);
      const memScore = Math.round(memExcellentRate * 0.2);
      const absentPenalty = Math.min(absentDays * 3, 15);
      const consecutivePenalty = consecutiveAbsentDays >= CONSECUTIVE_ABSENCE_THRESHOLD ? 10 : 0;
      const score = Math.max(0, Math.min(100, sessionScore + attendanceScore + memScore - absentPenalty - consecutivePenalty));

      return {
        teacher,
        totalStudents: teacherStudents.length,
        activeStudents: activeStudents.length,
        sessionsThisMonth,
        sessionsThisWeek,
        lastWeekSessions,
        attendanceRate,
        weekAttendanceRate,
        memExcellentRate,
        reviewRate,
        absentDays,
        lastSessionDate,
        consecutiveAbsentDays,
        weeklyGoalPct,
        score,
        level: getLevel(score),
        recentAchievements,
        studentsAtRisk,
        badBehaviorStudents,
        activeCovenantsCount,
      };
    });
  }, [teachers, allStudents, allSessions]);

  // ─── حساب التنبيهات الذكية ─────────────────────────────────

  const smartAlerts = useMemo<SmartAlert[]>(() => {
    const alerts: SmartAlert[] = [];
    const todayStr = new Date().toISOString().slice(0, 10);

    teacherStats.forEach(stats => {
      const tid = stats.teacher.id;
      const tname = stats.teacher.displayName;

      // 🔴 1. غياب متتالي - الأعلى أولوية
      if (stats.consecutiveAbsentDays >= CONSECUTIVE_ABSENCE_THRESHOLD) {
        alerts.push({
          id: `consecutive_${tid}`,
          type: "consecutive_absence",
          teacherId: tid,
          teacherName: tname,
          message: `${tname} — غياب ${stats.consecutiveAbsentDays} أيام متتالية دون تسجيل حصة`,
          detail: `آخر حصة مسجلة: ${stats.lastSessionDate ?? "لا يوجد"} · يستدعي تدخلاً فورياً`,
          priority: "urgent",
          date: todayStr,
          autoReportCreated: autoReportCreatedFor.has(tid),
        });
      }

      // 🟠 2. غياب متكرر هذا الشهر
      if (stats.absentDays >= MONTHLY_ABSENCE_THRESHOLD && stats.consecutiveAbsentDays < CONSECUTIVE_ABSENCE_THRESHOLD) {
        alerts.push({
          id: `monthly_${tid}`,
          type: "monthly_absence",
          teacherId: tid,
          teacherName: tname,
          message: `${tname} — ${stats.absentDays} غيابات مسجلة هذا الشهر`,
          detail: "تجاوز العتبة الشهرية المسموحة",
          priority: "important",
          date: todayStr,
          autoReportCreated: autoReportCreatedFor.has(`monthly_${tid}`),
        });
      }

      // 🟠 3. انقطاع طويل (4+ أيام) مع عدم غياب رسمي
      const daysSinceLast = stats.lastSessionDate
        ? Math.floor((Date.now() - new Date(stats.lastSessionDate).getTime()) / 86400000)
        : null;
      if (
        daysSinceLast !== null &&
        daysSinceLast >= INACTIVITY_DAYS_THRESHOLD &&
        stats.consecutiveAbsentDays < CONSECUTIVE_ABSENCE_THRESHOLD &&
        stats.absentDays < MONTHLY_ABSENCE_THRESHOLD
      ) {
        alerts.push({
          id: `inactivity_${tid}`,
          type: "long_inactivity",
          teacherId: tid,
          teacherName: tname,
          message: `${tname} — آخر حصة مسجلة منذ ${daysSinceLast} يوم`,
          detail: "لم يُسجّل الغياب رسمياً — يحتاج للمتابعة",
          priority: "important",
          date: todayStr,
          autoReportCreated: autoReportCreatedFor.has(`inactivity_${tid}`),
        });
      }

      // 📉 4. ضعف نسبة الحضور هذا الأسبوع
      if (stats.weekAttendanceRate > 0 && stats.weekAttendanceRate < LOW_ATTENDANCE_THRESHOLD) {
        alerts.push({
          id: `attendance_${tid}`,
          type: "low_attendance",
          teacherId: tid,
          teacherName: tname,
          message: `${tname} — نسبة حضور الطلاب ${stats.weekAttendanceRate}% هذا الأسبوع`,
          detail: `أقل من المعدل المطلوب (${LOW_ATTENDANCE_THRESHOLD}%)`,
          priority: "normal",
          date: todayStr,
        });
      }

      // ✅ 5. إنجازات بارزة هذا الشهر
      if (stats.recentAchievements.length >= 3) {
        alerts.push({
          id: `achievement_${tid}`,
          type: "achievement",
          teacherId: tid,
          teacherName: tname,
          message: `${tname} — ${stats.recentAchievements.length} طالب أتموا حفظ سوراً هذا الشهر 🎉`,
          detail: stats.recentAchievements.slice(0, 2).map(a => `${a.studentName} (${a.surahName})`).join("، "),
          priority: "positive",
          date: todayStr,
        });
      }

      // ⚠️ 6. سلوك سيء متكرر
      if (stats.badBehaviorStudents.length >= 2) {
        alerts.push({
          id: `discipline_${tid}`,
          type: "discipline",
          teacherId: tid,
          teacherName: tname,
          message: `${tname} — ${stats.badBehaviorStudents.length} طلاب بسلوك غير منضبط متكرر`,
          detail: stats.badBehaviorStudents.map(s => s.name).join("، "),
          priority: "important",
          date: todayStr,
        });
      }
    });

    // 🏆 7. أفضل معلم هذا الأسبوع
    const topThisWeek = [...teacherStats]
      .filter(t => t.sessionsThisWeek > 0)
      .sort((a, b) => b.score - a.score)[0];
    if (topThisWeek && teacherStats.length > 1) {
      alerts.push({
        id: `top_teacher_${topThisWeek.teacher.id}`,
        type: "top_teacher",
        teacherId: topThisWeek.teacher.id,
        teacherName: topThisWeek.teacher.displayName,
        message: `${topThisWeek.teacher.displayName} — أفضل معلم هذا الأسبوع 🏆`,
        detail: `نقاط: ${topThisWeek.score}/100 · ${topThisWeek.sessionsThisWeek} حصص · ${topThisWeek.weekAttendanceRate}% حضور`,
        priority: "positive",
        date: todayStr,
      });
    }

    return alerts.filter(a => !dismissedAlerts.has(a.id));
  }, [teacherStats, dismissedAlerts, autoReportCreatedFor]);

  // ─── إنشاء تقرير تلقائي ───────────────────────────────────

  const handleCreateReport = async (alert: SmartAlert) => {
    if (!school?.id || !user?.id) return;
    setReportCreating(alert.id);

    const messageMap: Record<SmartAlert["type"], string> = {
      consecutive_absence: `⚠️ تنبيه تلقائي: الأستاذ ${alert.teacherName} غاب عن تسجيل الحصص لأكثر من يومين متتاليين. يستدعي الأمر متابعة عاجلة من الإدارة.`,
      monthly_absence: `📋 تنبيه: الأستاذ ${alert.teacherName} سجّل ${teacherStats.find(t => t.teacher.id === alert.teacherId)?.absentDays ?? 0} غيابات هذا الشهر. يرجى مراجعة الوضع.`,
      long_inactivity: `⏰ تنبيه: الأستاذ ${alert.teacherName} لم يسجّل حصة منذ أكثر من ${INACTIVITY_DAYS_THRESHOLD} أيام بدون غياب رسمي. يحتاج للمتابعة.`,
      low_attendance: `📉 تقرير انخفاض الحضور: فوج الأستاذ ${alert.teacherName} حضور أقل من ${LOW_ATTENDANCE_THRESHOLD}% هذا الأسبوع.`,
      achievement: `✅ تقرير إنجاز: فوج الأستاذ ${alert.teacherName} حقق إنجازات متميزة في الحفظ هذا الشهر.`,
      discipline: `⚠️ تنبيه سلوكي: يوجد في فوج الأستاذ ${alert.teacherName} عدة طلاب يديمون السلوك السيء. يرجى التدخل.`,
      top_teacher: `🏆 تهنئة: الأستاذ ${alert.teacherName} حقق أفضل أداء هذا الأسبوع.`,
    };

    const priorityMap: Record<SmartAlert["type"], "urgent" | "important" | "normal"> = {
      consecutive_absence: "urgent",
      monthly_absence: "important",
      long_inactivity: "important",
      low_attendance: "normal",
      achievement: "normal",
      discipline: "important",
      top_teacher: "normal",
    };

    try {
      await createReport({
        schoolId: school.id,
        teacherId: alert.teacherId,
        date: new Date().toISOString().slice(0, 10),
        note: messageMap[alert.type],
        authorName: "النظام — تنبيه تلقائي",
        category: alert.type === "achievement" ? "إنجاز حفظ" : alert.type === "discipline" ? "مشكلة سلوكية" : "إجراء تأديبي",
        priority: priorityMap[alert.type],
        status: "pending",
        adminNotes: null,
        isPinned: alert.priority === "urgent",
        isManagementMessage: false,
      });

      setAutoReportCreatedFor(prev => new Set([...prev, alert.teacherId]));
    } catch (err) {
      console.error("فشل إنشاء التقرير التلقائي", err);
    } finally {
      setReportCreating(null);
    }
  };

  // ─── ترتيب وفلترة ────────────────────────────────────────

  const sorted = useMemo(() => {
    let list = [...teacherStats];

    // فلترة
    if (filterView === "needs_attention") {
      list = list.filter(t => t.level === "متوسط" || t.level === "ضعيف" || t.consecutiveAbsentDays >= CONSECUTIVE_ABSENCE_THRESHOLD);
    } else if (filterView === "excellent") {
      list = list.filter(t => t.level === "ممتاز");
    } else if (filterView === "absent") {
      list = list.filter(t => t.consecutiveAbsentDays > 0 || t.absentDays >= 2);
    }

    // ترتيب
    return list.sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "sessions") return b.sessionsThisMonth - a.sessionsThisMonth;
      return b.weekAttendanceRate - a.weekAttendanceRate;
    });
  }, [teacherStats, sortBy, filterView]);

  // الإجماليات
  const summary = useMemo(() => ({
    total: teachers.length,
    excellent: teacherStats.filter(t => t.level === "ممتاز").length,
    needsAttention: teacherStats.filter(t => t.level === "متوسط" || t.level === "ضعيف").length,
    consecutiveAbsent: teacherStats.filter(t => t.consecutiveAbsentDays >= CONSECUTIVE_ABSENCE_THRESHOLD).length,
    avgScore: teacherStats.length > 0
      ? Math.round(teacherStats.reduce((s, t) => s + t.score, 0) / teacherStats.length)
      : 0,
  }), [teacherStats, teachers.length]);

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

      {/* رأس الصفحة */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
            <ShieldCheck className="w-6 h-6 text-[var(--color-primary)]" />
            مراقبة المشايخ
            {smartAlerts.filter(a => a.priority === "urgent").length > 0 && (
              <span className="text-sm font-black bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                {smartAlerts.filter(a => a.priority === "urgent").length} عاجل
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            تقييم شامل للالتزام والأداء مع تنبيهات ذكية تلقائية
          </p>
        </div>
        <button
          onClick={load}
          className="w-9 h-9 rounded-xl border border-[var(--color-border)] bg-white dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-[var(--color-primary)] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* لوحة التنبيهات الذكية */}
      {!loading && (
        <AnimatePresence>
          <SmartAlertsPanel
            alerts={smartAlerts}
            onCreateReport={handleCreateReport}
            onDismissAll={() => setDismissedAlerts(new Set(smartAlerts.map(a => a.id)))}
            onDismiss={id => setDismissedAlerts(prev => new Set([...prev, id]))}
            reportCreating={reportCreating}
          />
        </AnimatePresence>
      )}

      {/* الملخص الإحصائي */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "إجمالي المشايخ", value: summary.total, color: "text-gray-800 dark:text-gray-100", bg: "bg-gray-100 dark:bg-white/8" },
            { label: "مستوى ممتاز", value: summary.excellent, color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
            { label: "يحتاج متابعة", value: summary.needsAttention, color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-500/10" },
            { label: "غياب متتالي 🔴", value: summary.consecutiveAbsent, color: summary.consecutiveAbsent > 0 ? "text-red-700 dark:text-red-300" : "text-gray-500", bg: summary.consecutiveAbsent > 0 ? "bg-red-50 dark:bg-red-500/10" : "bg-gray-100 dark:bg-white/5" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl p-4`}>
              <p className={`text-xl font-black ${color}`} style={{ fontFamily: "var(--font-headline)" }}>{value}</p>
              <p className={`text-xs font-medium ${color} opacity-70 mt-0.5`}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* شريط الفلترة والترتيب */}
      {!loading && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* عرض */}
          <div className="flex gap-1.5 flex-wrap">
            {([
              { key: "all", label: "الكل" },
              { key: "needs_attention", label: "⚠️ يحتاج متابعة" },
              { key: "excellent", label: "✅ ممتاز" },
              { key: "absent", label: "🔴 غائبون" },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterView(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  filterView === key
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                    : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ترتيب */}
          <div className="flex gap-1.5 mr-auto">
            <p className="text-xs font-bold text-gray-400 self-center shrink-0">رتّب:</p>
            {(["score", "sessions", "attendance"] as const).map(key => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  sortBy === key
                    ? "bg-gray-800 dark:bg-white text-white dark:text-gray-800 border-gray-800"
                    : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500"
                }`}
              >
                {key === "score" ? "النقاط" : key === "sessions" ? "الجلسات" : "الحضور"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* قائمة المعلمين */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)]">
          <Users className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="font-bold text-gray-400 dark:text-gray-500">
            {filterView !== "all" ? "لا يوجد معلمون في هذه الفئة" : "لا يوجد مشايخ مسجلون"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((stats, i) => (
            <TeacherCard
              key={stats.teacher.id}
              stats={stats}
              index={i}
              onSendMessage={setMessageTo}
            />
          ))}
        </div>
      )}

      {/* Modal إرسال رسالة */}
      <AnimatePresence>
        {messageTo && school && user && (
          <SendMessageModal
            key={messageTo.id}
            teacher={messageTo}
            schoolId={school.id}
            senderName={user.displayName}
            senderId={user.id}
            onClose={() => setMessageTo(null)}
            onSent={() => {}}
          />
        )}
      </AnimatePresence>
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
