"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import { createReport } from "@/lib/storage/mutations";
import type { DailyReport, AppUser } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Send, Clock, CheckCircle2,
  AlertTriangle, MessageSquare, Pin, Star,
  Search, Filter, ChevronDown, X, Loader2,
  Tag, Calendar, User, Bell, MoreVertical,
  RefreshCw, Archive, Eye, BookOpen, Zap, Users
} from "lucide-react";
import { v4 as uuid } from "uuid";

// ─── الثوابت ─────────────────────────────────────────────

const CATEGORIES = [
  "عام",
  "غياب طالب",
  "مشكلة سلوكية",
  "إنجاز حفظ",
  "طلب إداري",
  "ملاحظة صحية",
  "شكوى ولي أمر",
  "إجراء تأديبي",
  "تقييم دوري",
  "اقتراح",
];

const PRIORITY_CONFIG = {
  normal: { label: "عادي", color: "text-gray-500", bg: "bg-gray-100", border: "border-gray-200" },
  important: { label: "مهم", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  urgent: { label: "عاجل", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
} as const;

const STATUS_CONFIG = {
  pending: { label: "قيد المراجعة", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  in_progress: { label: "جارٍ التنفيذ", color: "text-blue-600", bg: "bg-blue-50", icon: Loader2 },
  reviewed: { label: "تمت المراجعة", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
} as const;

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("ar-DZ", {
    weekday: "short", day: "numeric", month: "long",
  });
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("ar-DZ", {
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── بطاقة التقرير ───────────────────────────────────────

function ReportCard({
  report,
  onPin,
  isExpanded,
  onToggle,
}: {
  report: DailyReport;
  onPin: (id: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const priority = PRIORITY_CONFIG[report.priority ?? "normal"];
  const status = STATUS_CONFIG[report.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border-2 overflow-hidden transition-shadow hover:shadow-md ${
        report.isPinned ? "border-[var(--color-primary)]/30" : "border-[var(--color-border)]"
      }`}
    >
      {/* شريط الأولوية */}
      <div className={`h-1 ${
        report.priority === "urgent" ? "bg-red-400" :
        report.priority === "important" ? "bg-amber-400" :
        "bg-transparent"
      }`} />

      <div className="p-4">
        {/* رأس البطاقة */}
        <div className="flex items-start gap-3 mb-3">
          {/* أيقونة التصنيف */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${priority.bg}`}>
            <Tag className={`w-5 h-5 ${priority.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* التصنيف */}
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${priority.bg} ${priority.color} ${priority.border} border`}>
                {report.category}
              </span>
              {/* الأولوية */}
              {report.priority !== "normal" && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${priority.bg} ${priority.color}`}>
                  {report.priority === "urgent" ? "🚨 عاجل" : "⚠️ مهم"}
                </span>
              )}
              {/* مثبّت */}
              {report.isPinned && (
                <span className="text-[10px] font-black text-[var(--color-primary)] bg-[var(--color-primary-light)] px-2 py-0.5 rounded-full">
                  📌 مثبّت
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-medium mt-1">
              {formatDate(report.timestamp)} · {formatTime(report.timestamp)}
            </p>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onPin(report.id)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                report.isPinned
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
              title={report.isPinned ? "إلغاء التثبيت" : "تثبيت"}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToggle}
              className="w-8 h-8 rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* نص التقرير */}
        <p className={`text-sm text-gray-700 leading-relaxed ${!isExpanded && "line-clamp-2"}`}>
          {report.note}
        </p>

        {/* التفاصيل المطوّلة */}
        <AnimatePresence>
          {isExpanded && report.adminNotes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-black text-gray-400 mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  ردّ الإدارة
                </p>
                <div className="bg-[var(--color-primary-light)] rounded-xl p-3">
                  <p className="text-sm text-[var(--color-primary-dark)] leading-relaxed">
                    {report.adminNotes}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* حالة التقرير */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <div className={`flex items-center gap-1.5 text-xs font-bold ${status.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {status.label}
          </div>
          {report.adminNotes && (
            <span className="text-xs text-[var(--color-primary)] font-bold bg-[var(--color-primary-light)] px-2 py-0.5 rounded-full">
              رد الإدارة ✓
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Modal إنشاء تقرير ────────────────────────────────────

function NewReportModal({
  authorName,
  onSave,
  onClose,
}: {
  authorName: string;
  onSave: (data: {
    note: string;
    category: string;
    priority: "normal" | "important" | "urgent";
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("عام");
  const [priority, setPriority] = useState<"normal" | "important" | "urgent">("normal");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!note.trim()) return;
    setSaving(true);
    await onSave({ note: note.trim(), category, priority });
    setSaving(false);
    onClose();
  };

  const priorities: { value: typeof priority; label: string; color: string }[] = [
    { value: "normal", label: "عادي", color: "bg-gray-100 text-gray-600" },
    { value: "important", label: "⚠️ مهم", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { value: "urgent", label: "🚨 عاجل", color: "bg-red-50 text-red-600 border-red-200" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40 }}
        className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg z-50"
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-[var(--color-primary)] text-white">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <h3 className="font-black text-base" style={{ fontFamily: "var(--font-headline)" }}>
                تقرير جديد
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* التصنيف */}
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 block">
                التصنيف
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      category === cat
                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* الأولوية */}
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 block">
                الأولوية
              </label>
              <div className="flex gap-2">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black border-2 transition-all ${
                      priority === p.value
                        ? `${p.color} border-current shadow-sm scale-105`
                        : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* النص */}
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 block">
                نص التقرير
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="اكتب تقريرك هنا... وصف دقيق للموقف أو الملاحظة أو المطلوب"
                rows={5}
                className="w-full resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 leading-relaxed focus:outline-none focus:border-[var(--color-primary)]/50 transition-all"
                dir="rtl"
              />
              <p className="text-xs text-gray-400 text-left mt-1">{note.length} حرف</p>
            </div>

            {/* معلومات المرسِل */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
              <User className="w-4 h-4 text-gray-400 shrink-0" />
              <p className="text-xs text-gray-500 font-medium">
                سيُرسَل التقرير باسم: <strong className="text-gray-700">{authorName}</strong>
              </p>
            </div>
          </div>

          {/* أزرار */}
          <div className="flex gap-3 px-5 pb-5">
            <button onClick={onClose} className="btn-secondary flex-1 py-3 justify-center text-sm">
              إلغاء
            </button>
            <button
              onClick={handleSubmit}
              disabled={!note.trim() || saving}
              className="btn-primary flex-1 py-3 justify-center text-sm disabled:opacity-40"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الإرسال...</>
              ) : (
                <><Send className="w-4 h-4" /> إرسال التقرير</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

export default function ReportsPage() {
  const { user, school, isPrincipal } = useAuth();
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");

  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("الكل");
  const [filterStatus, setFilterStatus] = useState<"الكل" | "pending" | "reviewed" | "in_progress">("الكل");
  const [filterPriority, setFilterPriority] = useState<"الكل" | "urgent" | "important">("الكل");

  // ─── تحميل التقارير ──────────────────────────────────────

  const loadReports = useCallback(async () => {
    if (!user?.id || !school?.id) return;
    setLoading(true);
    const db = getDB();
    
    let all: DailyReport[] = [];

    if (isPrincipal || user.role === "super_admin") {
      const schoolTeachers = await db.users.where("schoolId").equals(school.id).filter(u => u.role === "teacher").toArray();
      setTeachers(schoolTeachers.sort((a,b) => a.displayName.localeCompare(b.displayName, "ar")));

      all = await db.reports.where("schoolId").equals(school.id).toArray();
      if (selectedTeacherId !== "all") {
        all = all.filter(r => r.teacherId === selectedTeacherId);
      }
    } else {
      all = await db.reports.where("teacherId").equals(user.id).toArray();
    }

    // الأحدث أولاً + المثبّتة في القمة
    all.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.timestamp.localeCompare(a.timestamp);
    });

    setReports(all);
    setLoading(false);
  }, [user?.id, school?.id, isPrincipal, selectedTeacherId]);

  useEffect(() => { loadReports(); }, [loadReports]);

  // ─── إنشاء تقرير جديد ────────────────────────────────────

  const handleCreate = async ({ note, category, priority }: {
    note: string;
    category: string;
    priority: "normal" | "important" | "urgent";
  }) => {
    if (!user?.id || !school?.id) return;

    await createReport({
      schoolId: school.id,
      teacherId: user.id,
      date: new Date().toISOString().slice(0, 10),
      note,
      authorName: user.displayName,
      category,
      priority,
      status: "pending",
      adminNotes: null,
      isPinned: false,
    });

    await loadReports();
  };

  // ─── تثبيت/إلغاء تثبيت ───────────────────────────────────

  const handlePin = async (id: string) => {
    const db = getDB();
    const rep = await db.reports.get(id);
    if (!rep) return;
    await db.reports.update(id, { isPinned: !rep.isPinned });
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, isPinned: !r.isPinned } : r)
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.timestamp.localeCompare(a.timestamp);
      })
    );
  };

  // ─── فلترة ───────────────────────────────────────────────

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch = !search || r.note.includes(search) || r.category.includes(search);
      const matchCat = filterCategory === "الكل" || r.category === filterCategory;
      const matchStatus = filterStatus === "الكل" || r.status === filterStatus;
      const matchPriority = filterPriority === "الكل" || r.priority === filterPriority;
      return matchSearch && matchCat && matchStatus && matchPriority;
    });
  }, [reports, search, filterCategory, filterStatus, filterPriority]);

  // ─── إحصائيات ────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    reviewed: reports.filter((r) => r.status === "reviewed").length,
    urgent: reports.filter((r) => r.priority === "urgent").length,
    pinned: reports.filter((r) => r.isPinned).length,
  }), [reports]);

  const hasFilters = search || filterCategory !== "الكل" || filterStatus !== "الكل" || filterPriority !== "الكل";
  const clearFilters = () => {
    setSearch("");
    setFilterCategory("الكل");
    setFilterStatus("الكل");
    setFilterPriority("الكل");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ─── رأس الصفحة ─── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>
            التقارير اليومية
          </h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            {stats.total} تقرير · {stats.pending} قيد المراجعة
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="btn-primary shrink-0 py-2.5 text-sm"
        >
          <Plus className="w-4 h-4" />
          تقرير جديد
        </button>
      </div>

      {/* ─── فلتر المعلم (للمدراء فقط) ─── */}
      {(isPrincipal || user?.role === "super_admin") && teachers.length > 0 && (
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <p className="text-sm font-bold text-gray-700">تصفح تقارير المُعلم:</p>
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

      {/* ─── إحصائيات سريعة ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "إجمالي", value: stats.total, icon: FileText, color: "text-gray-600", bg: "bg-gray-50" },
          { label: "قيد المراجعة", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "تمت المراجعة", value: stats.reviewed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "عاجلة", value: stats.urgent, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 flex items-center gap-3`}>
            <Icon className={`w-5 h-5 ${color} shrink-0`} />
            <div>
              <p className={`text-xl font-black ${color}`} style={{ fontFamily: "var(--font-headline)" }}>{value}</p>
              <p className={`text-xs font-medium ${color} opacity-70`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── شريط البحث والفلترة ─── */}
      <div className="space-y-2">
        {/* بحث */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في التقارير..."
            className="w-full h-10 border border-gray-200 rounded-xl pr-10 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 transition-all bg-white"
          />
        </div>

        {/* فلاتر */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* الحالة */}
          <div className="flex gap-1.5 flex-wrap">
            {(["الكل", "pending", "in_progress", "reviewed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  filterStatus === s
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {s === "الكل" ? "الكل" : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>

          {/* أولوية عاجل */}
          <button
            onClick={() => setFilterPriority(filterPriority === "urgent" ? "الكل" : "urgent")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              filterPriority === "urgent"
                ? "bg-red-500 text-white border-red-500 shadow-sm"
                : "bg-white border-gray-200 text-gray-500 hover:border-red-200"
            }`}
          >
            🚨 عاجل فقط
          </button>

          {/* مسح الفلاتر */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
            >
              <X className="w-3 h-3" />
              مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* ─── قائمة التقارير ─── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          {reports.length === 0 ? (
            <>
              <FileText className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <h3 className="font-black text-gray-400 mb-2">لا يوجد تقارير بعد</h3>
              <p className="text-sm text-gray-400 mb-5">
                أرسل أول تقرير يومي لمتابعة أحداث الفوج
              </p>
              <button
                onClick={() => setShowNew(true)}
                className="btn-primary py-2.5 text-sm mx-auto"
              >
                <Plus className="w-4 h-4" />
                إنشاء أول تقرير
              </button>
            </>
          ) : (
            <>
              <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">لا توجد نتائج</p>
              <button onClick={clearFilters} className="mt-3 text-sm text-[var(--color-primary)] font-bold hover:underline">
                مسح الفلاتر
              </button>
            </>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onPin={handlePin}
              isExpanded={expandedId === report.id}
              onToggle={() => setExpandedId(expandedId === report.id ? null : report.id)}
            />
          ))}

          <p className="text-center text-xs text-gray-400 font-medium pb-4">
            {filtered.length} تقرير معروض
          </p>
        </div>
      )}

      {/* Modal التقرير الجديد */}
      {showNew && (
        <NewReportModal
          authorName={user?.displayName ?? "مجهول"}
          onSave={handleCreate}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  );
}
