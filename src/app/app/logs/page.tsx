"use client";
import SchoolGuard from "@/components/layout/SchoolGuard";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import type { ActivityLog, LogAction, LogEntityType, AppUser } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Search, Filter, User, BookOpen, DollarSign,
  Calendar, FileText, Shield, LogIn, LogOut, Plus, Edit, Trash2,
  Download, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  Printer, ChevronDown, X, SlidersHorizontal,
} from "lucide-react";

// ─── إعدادات الأيقونات والألوان ──────────────────────────

const ACTION_CONFIG: Record<LogAction, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  login:                  { label: "تسجيل دخول",      icon: LogIn,      color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15" },
  logout:                 { label: "تسجيل خروج",      icon: LogOut,     color: "text-gray-600 dark:text-gray-400",       bg: "bg-gray-100 dark:bg-white/8"           },
  create_student:         { label: "إضافة طالب",       icon: Plus,       color: "text-blue-700 dark:text-blue-400",       bg: "bg-blue-50 dark:bg-blue-500/15"        },
  update_student:         { label: "تعديل طالب",       icon: Edit,       color: "text-amber-700 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-500/15"      },
  delete_student:         { label: "حذف طالب",         icon: Trash2,     color: "text-red-700 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-500/15"          },
  create_session:         { label: "تسجيل حصة",        icon: BookOpen,   color: "text-indigo-700 dark:text-indigo-400",   bg: "bg-indigo-50 dark:bg-indigo-500/15"    },
  update_session:         { label: "تعديل حصة",        icon: Edit,       color: "text-amber-700 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-500/15"      },
  create_payment:         { label: "تسجيل دفعة",       icon: DollarSign, color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15"  },
  update_payment:         { label: "تعديل دفعة",       icon: Edit,       color: "text-amber-700 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-500/15"      },
  create_covenant:        { label: "إضافة تعهد",       icon: Shield,     color: "text-orange-700 dark:text-orange-400",   bg: "bg-orange-50 dark:bg-orange-500/15"    },
  create_meeting:         { label: "إنشاء اجتماع",     icon: Calendar,   color: "text-purple-700 dark:text-purple-400",   bg: "bg-purple-50 dark:bg-purple-500/15"    },
  create_registration:    { label: "تسجيل جديد",       icon: User,       color: "text-teal-700 dark:text-teal-400",       bg: "bg-teal-50 dark:bg-teal-500/15"        },
  update_registration:    { label: "تحديث تسجيل",      icon: Edit,       color: "text-amber-700 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-500/15"      },
  create_report:          { label: "إنشاء تقرير",      icon: FileText,   color: "text-gray-700 dark:text-gray-300",       bg: "bg-gray-100 dark:bg-white/8"           },
  update_school_settings: { label: "تعديل الإعدادات",  icon: Edit,       color: "text-amber-700 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-500/15"      },
  export_document:        { label: "تصدير وثيقة",      icon: Download,   color: "text-green-700 dark:text-green-400",     bg: "bg-green-50 dark:bg-green-500/15"      },
  other:                  { label: "أخرى",              icon: Activity,   color: "text-gray-600 dark:text-gray-400",       bg: "bg-gray-100 dark:bg-white/8"           },
};

const ENTITY_LABELS: Record<LogEntityType, string> = {
  student: "طالب", session: "حصة", payment: "دفعة",
  covenant: "تعهد", meeting: "اجتماع", registration: "تسجيل",
  report: "تقرير", school: "مدرسة", system: "النظام",
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "مدير النظام", principal: "مدير مدرسة", teacher: "معلم", parent: "ولي أمر",
};

// ─── دالة الوقت المنقضي ───────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `منذ ${days} يوم`;
  if (hours > 0) return `منذ ${hours} ساعة`;
  if (mins > 0) return `منذ ${mins} دقيقة`;
  return "الآن";
}

// ─── بطاقة سجل واحد ──────────────────────────────────────

function LogEntry({ log, index, forPrint = false }: { log: ActivityLog; index: number; forPrint?: boolean }) {
  const cfg = ACTION_CONFIG[log.action] ?? ACTION_CONFIG.other;
  const Icon = cfg.icon;

  if (forPrint) {
    return (
      <tr style={{ borderBottom: "1px solid #e5e7eb", fontSize: 11 }}>
        <td style={{ padding: "6px 10px", color: "#6b7280" }}>{index + 1}</td>
        <td style={{ padding: "6px 10px", fontWeight: 700 }}>{cfg.label}</td>
        <td style={{ padding: "6px 10px" }}>{log.description}</td>
        <td style={{ padding: "6px 10px" }}>{log.userName}</td>
        <td style={{ padding: "6px 10px" }}>{ROLE_LABELS[log.userRole] ?? log.userRole}</td>
        <td style={{ padding: "6px 10px", color: "#9ca3af" }}>
          {new Date(log.createdAt).toLocaleString("ar-DZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </td>
      </tr>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.015, 0.3) }}
      className="flex items-start gap-3 p-4 hover:bg-gray-50/70 dark:hover:bg-white/3 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{log.description}</p>
            {log.entityName && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {ENTITY_LABELS[log.entityType]}: <span className="font-bold text-gray-700 dark:text-gray-300">{log.entityName}</span>
              </p>
            )}
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
            <User className="w-3 h-3" />
            {log.userName}
            <span className="text-gray-300 dark:text-gray-600 mx-1">·</span>
            {ROLE_LABELS[log.userRole] ?? log.userRole}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
            <Clock className="w-3 h-3" />
            {timeAgo(log.createdAt)}
            <span className="mx-1 text-gray-300 dark:text-gray-600">·</span>
            {new Date(log.createdAt).toLocaleString("ar-DZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── مكوّن الطباعة ────────────────────────────────────────

function PrintView({ logs, filters }: { logs: ActivityLog[]; filters: string }) {
  const today = new Date().toLocaleDateString("ar-DZ", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div id="audit-log-print" className="hidden print:block" dir="rtl" style={{ fontFamily: "Arial, sans-serif", fontSize: 12 }}>
      <style>{`
        @page { size: A4 landscape; margin: 12mm; }
        @media print {
          body > div:not(#audit-log-print) { display: none !important; }
          #audit-log-print { display: block !important; }
        }
      `}</style>
      <div style={{ borderBottom: "3px solid #107a57", paddingBottom: 10, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: "#107a57", margin: 0 }}>سجل التدقيق — النشاطات</h1>
          {filters && <p style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>الفلاتر: {filters}</p>}
        </div>
        <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>طُبع في: {today} · {logs.length} سجل</p>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#107a57", color: "white", fontSize: 11 }}>
            {["#", "الفعل", "الوصف", "المستخدم", "الدور", "التوقيت"].map(h => (
              <th key={h} style={{ padding: "7px 10px", textAlign: "right", fontWeight: 700 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.map((log, i) => <LogEntry key={log.id} log={log} index={i} forPrint />)}
        </tbody>
      </table>
    </div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

function LogsPage() {
  const { user, school, isPrincipal } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<LogAction | "الكل">("الكل");
  const [filterEntity, setFilterEntity] = useState<LogEntityType | "الكل">("الكل");
  const [filterUser, setFilterUser] = useState<string>("الكل");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;

  const load = useCallback(async () => {
    if (!school?.id) return;
    setLoading(true);
    const db = getDB();
    const [all, users] = await Promise.all([
      db.activityLogs.where("schoolId").equals(school.id).reverse().sortBy("createdAt"),
      db.users.where("schoolId").equals(school.id).toArray(),
    ]);
    setLogs(all);
    setTeachers(users.filter(u => u.role !== "super_admin"));
    setLoading(false);
  }, [school?.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const matchSearch = !search ||
        l.description.includes(search) ||
        l.userName.includes(search) ||
        l.entityName?.includes(search);
      const matchAction = filterAction === "الكل" || l.action === filterAction;
      const matchEntity = filterEntity === "الكل" || l.entityType === filterEntity;
      const matchUser = filterUser === "الكل" || l.userId === filterUser;
      const matchFrom = !filterDateFrom || l.createdAt >= filterDateFrom;
      const matchTo = !filterDateTo || l.createdAt <= filterDateTo + "T23:59:59";
      return matchSearch && matchAction && matchEntity && matchUser && matchFrom && matchTo;
    });
  }, [logs, search, filterAction, filterEntity, filterUser, filterDateFrom, filterDateTo]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: logs.length,
      today: logs.filter(l => l.createdAt.startsWith(today)).length,
      uniqueUsers: new Set(logs.map(l => l.userId)).size,
      filtered: filtered.length,
    };
  }, [logs, filtered]);

  const activeFilterCount = [
    filterAction !== "الكل",
    filterEntity !== "الكل",
    filterUser !== "الكل",
    !!filterDateFrom,
    !!filterDateTo,
    !!search,
  ].filter(Boolean).length;

  const filterDescription = [
    filterAction !== "الكل" ? `الفعل: ${ACTION_CONFIG[filterAction as LogAction]?.label}` : "",
    filterEntity !== "الكل" ? `النوع: ${ENTITY_LABELS[filterEntity as LogEntityType]}` : "",
    filterUser !== "الكل" ? `المستخدم: ${teachers.find(t => t.id === filterUser)?.displayName}` : "",
    filterDateFrom ? `من: ${filterDateFrom}` : "",
    filterDateTo ? `إلى: ${filterDateTo}` : "",
  ].filter(Boolean).join(" | ");

  const resetFilters = () => {
    setSearch(""); setFilterAction("الكل"); setFilterEntity("الكل");
    setFilterUser("الكل"); setFilterDateFrom(""); setFilterDateTo("");
    setPage(1);
  };

  const handlePrint = () => window.print();

  const topActions: Array<LogAction | "الكل"> = [
    "الكل", "create_student", "create_session", "create_payment", "login", "update_student", "delete_student",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5" dir="rtl">
      {/* Print view (hidden on screen) */}
      <PrintView logs={filtered} filters={filterDescription} />

      {/* رأس الصفحة */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
            <Activity className="w-6 h-6 text-[var(--color-primary)]" />
            سجل التدقيق
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
            سجل كامل لجميع العمليات — {stats.total.toLocaleString("ar")} سجل إجمالي
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} title="طباعة / حفظ PDF"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-white/8 border border-[var(--color-border)] text-gray-600 dark:text-gray-400 hover:text-emerald-600 hover:border-emerald-500/40 transition-all">
            <Printer className="w-3.5 h-3.5" /> طباعة
          </button>
          <button onClick={load} title="تحديث"
            className="w-9 h-9 rounded-xl bg-white dark:bg-white/8 border border-[var(--color-border)] flex items-center justify-center text-gray-500 hover:text-[var(--color-primary)] transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "إجمالي السجلات", value: stats.total, color: "text-gray-900 dark:text-gray-100", bg: "bg-gray-100 dark:bg-white/8" },
          { label: "أنشطة اليوم",    value: stats.today, color: "text-blue-700 dark:text-blue-300",  bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "مستخدمون",       value: stats.uniqueUsers, color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "بعد الفلترة",    value: stats.filtered, color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-500/10" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <p className={`text-2xl font-black ${color}`} style={{ fontFamily: "var(--font-headline)" }}>{value.toLocaleString("ar")}</p>
            <p className={`text-xs font-medium ${color} opacity-70 mt-0.5`}>{label}</p>
          </div>
        ))}
      </div>

      {/* أدوات الفلترة */}
      <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4 space-y-3">
        {/* بحث + زر فلاتر متقدمة */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="بحث في السجلات..."
              className="w-full h-10 border border-gray-200 dark:border-white/10 rounded-xl pr-10 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 bg-white dark:bg-white/5 dark:text-white"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border transition-all ${
              showAdvanced || activeFilterCount > 0
                ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 text-[var(--color-primary)]"
                : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            فلاتر
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[var(--color-primary)] text-white text-[10px] flex items-center justify-center font-black">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={resetFilters} className="px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border border-red-200 dark:border-red-500/30">
              مسح الكل
            </button>
          )}
        </div>

        {/* فلاتر سريعة للأفعال */}
        <div className="flex gap-1.5 flex-wrap">
          {topActions.map((a) => (
            <button
              key={a}
              onClick={() => { setFilterAction(a); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                filterAction === a
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                  : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300"
              }`}
            >
              {a === "الكل" ? "📋 الكل" : ACTION_CONFIG[a]?.label ?? a}
            </button>
          ))}
        </div>

        {/* الفلاتر المتقدمة */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-gray-100 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* فلتر المستخدم */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">المستخدم</label>
                  <select
                    value={filterUser}
                    onChange={e => { setFilterUser(e.target.value); setPage(1); }}
                    className="w-full h-9 text-xs font-bold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 focus:outline-none text-gray-700 dark:text-gray-300"
                  >
                    <option value="الكل">جميع المستخدمين</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.displayName} ({ROLE_LABELS[t.role] ?? t.role})</option>
                    ))}
                  </select>
                </div>

                {/* فلتر نوع الكيان */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">نوع السجل</label>
                  <select
                    value={filterEntity}
                    onChange={e => { setFilterEntity(e.target.value as any); setPage(1); }}
                    className="w-full h-9 text-xs font-bold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 focus:outline-none text-gray-700 dark:text-gray-300"
                  >
                    <option value="الكل">جميع الأنواع</option>
                    {Object.entries(ENTITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* من تاريخ */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">من تاريخ</label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }}
                    className="w-full h-9 text-xs font-bold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 focus:outline-none text-gray-700 dark:text-gray-300"
                  />
                </div>

                {/* إلى تاريخ */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">إلى تاريخ</label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={e => { setFilterDateTo(e.target.value); setPage(1); }}
                    className="w-full h-9 text-xs font-bold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 focus:outline-none text-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>

              {activeFilterCount > 0 && (
                <p className="text-[10px] text-gray-400 mt-3">
                  📊 يتم عرض <strong className="text-gray-600 dark:text-gray-300">{filtered.length}</strong> سجل من أصل <strong className="text-gray-600 dark:text-gray-300">{logs.length}</strong>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* قائمة السجلات */}
      <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm">
        {loading ? (
          <div className="space-y-px">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-3 p-4 border-b border-gray-100 dark:border-white/5 last:border-0">
                <div className="w-9 h-9 rounded-xl skeleton-shimmer shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton-shimmer rounded-xl w-3/4" />
                  <div className="h-3 skeleton-shimmer rounded-xl w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="font-bold text-gray-500 dark:text-gray-400">
              {logs.length === 0 ? "لا توجد سجلات بعد" : "لا توجد نتائج مطابقة"}
            </p>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="mt-3 text-xs font-bold text-[var(--color-primary)] hover:underline">
                مسح الفلاتر
              </button>
            )}
          </div>
        ) : (
          <>
            <div>
              {paginated.map((log, i) => <LogEntry key={log.id} log={log} index={i} />)}
            </div>
            {hasMore && (
              <div className="p-4 border-t border-gray-100 dark:border-white/5 text-center">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="px-6 py-2.5 text-sm font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10 rounded-xl transition-colors"
                >
                  تحميل {Math.min(PAGE_SIZE, filtered.length - paginated.length)} سجل إضافي
                </button>
              </div>
            )}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/2 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">عرض {paginated.length} من {filtered.length} سجل</p>
              <button onClick={handlePrint} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-600 transition-colors">
                <Printer className="w-3.5 h-3.5" /> تصدير للطباعة
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function LogsPageWrapper() {
  return <SchoolGuard><LogsPage /></SchoolGuard>;
}
