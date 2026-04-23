"use client";
import SchoolGuard from "@/components/layout/SchoolGuard";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import { createClient } from "@/lib/supabase/client";
import { getCurrencySymbol } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, AlertTriangle, Clock, UserX, CreditCard,
  UserPlus, CheckCircle2, RefreshCw, X, Filter, Megaphone
} from "lucide-react";

import { useRouter } from "next/navigation";

// ─── أنواع التنبيهات ──────────────────────────────────────

type AlertSeverity = "critical" | "warning" | "info";

interface AppAlert {
  id: string;
  type: "absent_student" | "overdue_payment" | "pending_registration" | "inactive_teacher" | "upcoming_meeting" | "system_notification";
  severity: AlertSeverity;
  title: string;
  description: string;
  entityId?: string;
  imageUrl?: string;
  createdAt: string;
  isRead: boolean;
}

const SEVERITY_CFG: Record<AlertSeverity, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: "text-red-700", bg: "bg-red-50", border: "border-red-200", label: "عاجل" },
  warning:  { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", label: "تحذير" },
  info:     { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", label: "معلومة" },
};

const TYPE_ICON = {
  absent_student:      { icon: UserX,      color: "text-red-500",    bg: "bg-red-100" },
  overdue_payment:     { icon: CreditCard,  color: "text-amber-500", bg: "bg-amber-100" },
  pending_registration:{ icon: UserPlus,    color: "text-blue-500",  bg: "bg-blue-100" },
  inactive_teacher:    { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-100" },
  upcoming_meeting:    { icon: Bell,        color: "text-indigo-500", bg: "bg-indigo-100" },
  system_notification: { icon: Megaphone,   color: "text-pink-500",   bg: "bg-pink-100" },
};

// ─── الصفحة الرئيسية ──────────────────────────────────────

function NotificationsPage() {
  const { user, school, role } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<AppAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | AlertSeverity>("all");

  const isPrincipal = role === "principal" || role === "super_admin";

  const buildAlerts = useCallback(async () => {
    if (!school?.id || !user?.id) return;
    setLoading(true);
    const db = getDB();
    const now = new Date();
    const generated: AppAlert[] = [];

    // ── 1. طلاب بغياب متكرر (3+ مرات خلال آخر 30 يوم) ──
    try {
      const thirtyAgo = new Date(now);
      thirtyAgo.setDate(thirtyAgo.getDate() - 30);
      const thirtyStr = thirtyAgo.toISOString().slice(0, 10);
      const todayStr = now.toISOString().slice(0, 10);

      const recentSessions = await db.sessions
        .where("schoolId").equals(school.id)
        .and(s => s.date >= thirtyStr && s.date <= todayStr)
        .toArray();

      // بناء خريطة الغياب أولاً
      const absenceCountMap: Record<string, number> = {};
      for (const session of recentSessions) {
        for (const rec of session.records) {
          if (rec.attendance === "غائب" || rec.attendance === "متأخر") {
            absenceCountMap[rec.studentId] = (absenceCountMap[rec.studentId] ?? 0) + 1;
          }
        }
      }

      // جلب أسماء الطلاب ذوي الغياب الكثير
      const heavyAbsentIds = Object.entries(absenceCountMap)
        .filter(([, count]) => count >= 4)
        .map(([id]) => id);

      if (heavyAbsentIds.length > 0) {
        const absentStudents = await db.students.where("id").anyOf(heavyAbsentIds).toArray();
        for (const student of absentStudents) {
          const count = absenceCountMap[student.id] ?? 0;
          generated.push({
            id: `absent-${student.id}`,
            type: "absent_student",
            severity: count >= 7 ? "critical" : "warning",
            title: `${student.fullName} — غياب متكرر`,
            description: `غاب ${count} مرة خلال آخر 30 يوماً. ينصح بالتواصل مع ولي الأمر.`,
            entityId: student.id,
            createdAt: now.toISOString(),
            isRead: false,
          });
        }
      }
    } catch {}

    // ── 2. مدفوعات متأخرة (غير مدفوعة للفصل الحالي) ──
    try {
      const currentSeason = now.getMonth() < 6 ? `${now.getFullYear()}-S1` : `${now.getFullYear()}-S2`;
      const unpaidPayments = await db.payments
        .where("schoolId").equals(school.id)
        .and(p => p.status === "unpaid" && p.date === currentSeason)
        .toArray();

      if (unpaidPayments.length > 0) {
        // جلب أسماء الطلاب
        const studentIds = unpaidPayments.map(p => p.studentId);
        const students = await db.students
          .where("id").anyOf(studentIds).toArray();
        const nameMap: Record<string, string> = {};
        for (const s of students) nameMap[s.id] = s.fullName;

        for (const p of unpaidPayments.slice(0, 10)) { // max 10
          generated.push({
            id: `payment-${p.id}`,
            type: "overdue_payment",
            severity: "warning",
            title: `دفع متأخر — ${nameMap[p.studentId] ?? "طالب"}`,
            description: `لم يُسدَّد اشتراك الفصل الحالي. المبلغ: ${p.amount} ${getCurrencySymbol(school.country)}.`,
            entityId: p.studentId,
            createdAt: now.toISOString(),
            isRead: false,
          });
        }
      }
    } catch {}

    // ── 3. طلبات تسجيل معلقة (للمدراء فقط) ──
    if (isPrincipal) {
      try {
        const pending = await db.registrations
          .where("schoolId").equals(school.id)
          .and(r => r.status === "مرشح" || r.status === "تم الإتصال")
          .toArray();

        if (pending.length > 0) {
          generated.push({
            id: "pending-reg",
            type: "pending_registration",
            severity: "info",
            title: `${pending.length} طلب تسجيل ينتظر المراجعة`,
            description: "يوجد طلبات تسجيل لطلاب جدد في قائمة الانتظار ولم يتم اعتمادها بعد.",
            createdAt: now.toISOString(),
            isRead: false,
          });
        }
      } catch {}
    }

    // ── 4. معلمون لم يسجلوا حصة منذ 4 أيام (للمدراء) ──
    if (isPrincipal) {
      try {
        const teachers = await db.users
          .where("schoolId").equals(school.id)
          .and(u => u.role === "teacher" && u.isActive)
          .toArray();

        const fourAgo = new Date(now);
        fourAgo.setDate(fourAgo.getDate() - 4);
        const fourStr = fourAgo.toISOString().slice(0, 10);
        const todayStr = now.toISOString().slice(0, 10);

        for (const teacher of teachers) {
          const recent = await db.sessions
            .where("teacherId").equals(teacher.id)
            .and(s => s.date >= fourStr && s.date <= todayStr)
            .count();

          if (recent === 0) {
            generated.push({
              id: `inactive-${teacher.id}`,
              type: "inactive_teacher",
              severity: "warning",
              title: `الشيخ ${teacher.displayName} — لا حصص مسجلة`,
              description: `لم يسجل الشيخ أي حصة منذ أكثر من 4 أيام. يُرجى المتابعة.`,
              entityId: teacher.id,
              createdAt: now.toISOString(),
              isRead: false,
            });
          }
        }
      } catch {}
    }

    // ── 5. اجتماعات أو مناسبات قادمة خلال 3 أيام ──
    try {
      const threeDays = new Date(now);
      threeDays.setDate(threeDays.getDate() + 3);
      const todayStr = now.toISOString().slice(0, 10);
      const threeStr = threeDays.toISOString().slice(0, 10);

      const upcoming = await db.meetings
        .where("schoolId").equals(school.id)
        .and(m => m.status === "upcoming" && m.date >= todayStr && m.date <= threeStr)
        .toArray();

      for (const mtg of upcoming) {
        generated.push({
          id: `meeting-${mtg.id}`,
          type: "upcoming_meeting",
          severity: "info",
          title: `قادم: ${mtg.title}`,
          description: `موعد: ${new Date(mtg.date).toLocaleDateString("ar-DZ", { weekday: "long", day: "numeric", month: "long" })} — خلال أقل من 3 أيام.`,
          entityId: mtg.id,
          createdAt: now.toISOString(),
          isRead: false,
        });
      }
    } catch {}

    // ── 6. إشعارات النظام — جلب مباشر من Supabase لضمان الوصول الفوري ──
    try {
      const supabase = createClient();
      const { data: systemNotifs, error: notifErr } = await supabase
        .from("system_notifications")
        .select("*")
        .or(`school_id.eq.${school.id},school_id.is.null`)
        .order("created_at", { ascending: false });

      if (!notifErr && systemNotifs) {
        for (const n of systemNotifs) {
          const targetType: string = n.target_type;
          const targetIds: string[] = Array.isArray(n.target_ids) ? n.target_ids : [];

          // عرض الإشعار إذا كان للجميع أو يشمل هذا المستخدم أو هذه المدرسة
          if (
            targetType === "all" ||
            (user?.id && targetIds.includes(user.id)) ||
            (school?.id && targetIds.includes(school.id))
          ) {
            let plainText = (n.message || "").replace(/<[^>]+>/g, " ").trim();
            if (plainText.length > 100) plainText = plainText.substring(0, 100) + "...";

            generated.push({
              id: `sys-${n.id}`,
              type: "system_notification",
              severity: n.type === "default" ? "info" : (n.type as AlertSeverity),
              title: n.title,
              description: plainText || "لا يوجد وصف",
              imageUrl: n.image_url ?? undefined,
              entityId: n.id,
              createdAt: n.created_at,
              isRead: false,
            });
          }
        }
      }
    } catch {}

    // ترتيب: الحرج أولاً
    const sortOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
    generated.sort((a, b) => sortOrder[a.severity] - sortOrder[b.severity]);

    setAlerts(generated);
    setLoading(false);
  }, [school?.id, user?.id, isPrincipal]);

  useEffect(() => { buildAlerts(); }, [buildAlerts]);

  const markRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  };

  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
  };

  const filtered = filter === "all" ? alerts : alerts.filter(a => a.severity === filter);
  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
            <Bell className="w-6 h-6 text-[var(--color-primary)]" />
            مركز الإشعارات
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} إشعار يحتاج انتباهك` : "لا توجد إشعارات جديدة"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:underline">
              <CheckCircle2 className="w-3.5 h-3.5" />
              قراءة الكل
            </button>
          )}
          <button onClick={buildAlerts}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            title="تحديث">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* فلاتر */}
      <div className="flex gap-2 flex-wrap">
        {([["all", "الكل", alerts.length], ["critical", "عاجل", alerts.filter(a => a.severity === "critical").length], ["warning", "تحذير", alerts.filter(a => a.severity === "warning").length], ["info", "معلومة", alerts.filter(a => a.severity === "info").length]] as const).map(([val, label, count]) => (
          <button key={val} onClick={() => setFilter(val as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              filter === val
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            }`}>
            {label}
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              filter === val ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
            }`}>{count}</span>
          </button>
        ))}
      </div>

      {/* القائمة */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-lg font-black text-gray-700 mb-1">كل شيء على ما يرام!</p>
          <p className="text-sm text-gray-400">لا توجد إشعارات تستحق الانتباه في هذا القسم.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((alert, idx) => {
              const sev = SEVERITY_CFG[alert.severity];
              const typeIconCfg = TYPE_ICON[alert.type];
              const Icon = typeIconCfg.icon;

              const isClickable = alert.type === "absent_student" && alert.entityId;

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => {
                    if (isClickable) {
                      markRead(alert.id);
                      router.push(`/app/student-history?studentId=${alert.entityId}`);
                    }
                  }}
                  className={`relative bg-white rounded-2xl border-2 p-4 flex items-start gap-4 transition-all hover:shadow-sm ${
                    isClickable ? "cursor-pointer hover:border-[var(--color-primary)]/40" : ""
                  } ${
                    alert.isRead
                      ? "border-gray-100 opacity-60"
                      : `${sev.border}`
                  }`}
                >
                  {/* نقطة الحالة */}
                  {!alert.isRead && (
                    <span className={`absolute top-3 left-3 w-2 h-2 rounded-full ${
                      alert.severity === "critical" ? "bg-red-500" :
                      alert.severity === "warning" ? "bg-amber-500" : "bg-blue-500"
                    }`} />
                  )}

                  {/* أيقونة */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${typeIconCfg.bg}`}>
                    <Icon className={`w-5 h-5 ${typeIconCfg.color}`} />
                  </div>

                  {/* المحتوى */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-black text-gray-900">{alert.title}</h3>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${sev.bg} ${sev.color}`}>
                        {sev.label}
                      </span>
                    </div>
                    {alert.type === "system_notification" && alert.imageUrl && (
                      <div className="my-2">
                        <img src={alert.imageUrl} alt="مرفق" className="max-w-[200px] h-auto object-cover rounded-xl border border-gray-100 shadow-sm" />
                      </div>
                    )}
                    <p className="text-xs text-gray-500 leading-relaxed">{alert.description}</p>
                    <p className="text-[10px] text-gray-400 mt-1.5 font-bold">
                      {new Date(alert.createdAt).toLocaleString('ar-DZ', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: 'numeric', minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* إجراء */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    {!alert.isRead && (
                      <button onClick={(e) => { e.stopPropagation(); markRead(alert.id); }}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                        title="تحديد كمقروء">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default function NotificationsPageWrapper() {
  return (
    <SchoolGuard>
      <NotificationsPage />
    </SchoolGuard>
  );
}
