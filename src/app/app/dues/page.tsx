"use client";
import SchoolGuard from "@/components/layout/SchoolGuard";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import { createPayment, updatePaymentStatus } from "@/lib/storage/mutations";
import { getCurrencySymbol } from "@/lib/utils";
import type { Student, Payment, PaymentStatus } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, CheckCircle2, Clock, Shield,
  Search, X, Loader2,
  AlertTriangle, TrendingUp, Filter,
  ChevronDown, Wallet, MessageCircle, Bell,
  Send, Users, BarChart3, ArrowUpRight,
  CalendarCheck, BadgeDollarSign, RefreshCw, Info,
  SortAsc, SortDesc, Printer,
} from "lucide-react";
import {
  getCurrentSeason, getYearSeasons,
  type SeasonNumber,
} from "@/lib/seasons";

// ─────────────────────────────────────────────────────────────
// فترات الاشتراك
// ─────────────────────────────────────────────────────────────

function buildSeasonOptions() {
  const currentYear = new Date().getFullYear();
  const options: { value: string; label: string }[] = [];
  for (const year of [currentYear, currentYear - 1]) {
    getYearSeasons(year).forEach((s) => {
      options.push({
        value: `${year}-Q${s.number}`,
        label: `${s.emoji} ${s.name} ${year} (${s.from.slice(5, 7)}/${s.to.slice(5, 7)})`,
      });
    });
  }
  return options;
}

const SEASON_OPTIONS = buildSeasonOptions();
const currentSeasonDefault = (() => {
  const s = getCurrentSeason();
  return `${new Date().getFullYear()}-Q${s.number}`;
})();

const STATUS_CFG: Record<PaymentStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  paid:     { label: "مدفوع",     color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", icon: CheckCircle2 },
  unpaid:   { label: "غير مدفوع", color: "text-red-600 dark:text-red-400",        bg: "bg-red-50 dark:bg-red-500/10",         border: "border-red-200 dark:border-red-500/20",         icon: Clock        },
  exempted: { label: "معفى",      color: "text-blue-600 dark:text-blue-400",      bg: "bg-blue-50 dark:bg-blue-500/10",       border: "border-blue-200 dark:border-blue-500/20",       icon: Shield       },
};

// ─────────────────────────────────────────────────────────────
// WhatsApp
// ─────────────────────────────────────────────────────────────

function sendWhatsApp(student: Student, payment: Payment, season: string, schoolName: string, schoolCountry?: string) {
  const phone = student.phone1.replace(/\D/g, "");
  const normalizedPhone = phone.startsWith("0") ? "213" + phone.slice(1) : phone;
  const receiptNum = payment.id.slice(-6).toUpperCase();
  const seasonLabel = SEASON_OPTIONS.find(s => s.value === season)?.label ?? season;
  const curr = getCurrencySymbol(schoolCountry);
  const msg = [
    `📌 مدرسة ${schoolName}`,
    ``,
    `السلام عليكم ورحمة الله وبركاته`,
    `نؤكد استلام اشتراك الطالب: *${student.fullName}*`,
    ``,
    `• الفصل: ${seasonLabel}`,
    `• المبلغ: *${payment.amount} ${curr}*`,
    `• رقم الوصل: #${receiptNum}`,
    ``,
    `جزاكم الله خيراً 🌿`,
  ].join("\n");
  window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(msg)}`, "_blank");
}

function sendReminderWhatsApp(student: Student, season: string, amount: number, schoolName: string, schoolCountry?: string) {
  const phone = student.phone1.replace(/\D/g, "");
  const normalizedPhone = phone.startsWith("0") ? "213" + phone.slice(1) : phone;
  const seasonLabel = SEASON_OPTIONS.find(s => s.value === season)?.label ?? season;
  const curr = getCurrencySymbol(schoolCountry);
  const msg = [
    `📌 تذكير من مدرسة ${schoolName}`,
    ``,
    `السلام عليكم ورحمة الله وبركاته`,
    `نودّ تذكيركم بسداد اشتراك الطالب: *${student.fullName}*`,
    ``,
    `• الفصل: ${seasonLabel}`,
    `• المبلغ المستحق: *${amount} ${curr}*`,
    ``,
    `نرجو التكرم بالتسوية في أقرب وقت، جزاكم الله خيراً 🌿`,
  ].join("\n");
  window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(msg)}`, "_blank");
}

// ─────────────────────────────────────────────────────────────
// بطاقة الإحصاء المالي العلوية
// ─────────────────────────────────────────────────────────────

function FinancialHeader({
  stats, total, currency, collectionRate,
}: {
  stats: { paid: number; unpaid: number; exempted: number; collected: number; expectedTotal: number };
  total: number;
  currency: string;
  collectionRate: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-l from-[var(--color-primary-dark)] to-[var(--color-primary)] rounded-3xl p-5 text-white relative overflow-hidden shadow-lg"
    >
      {/* خلفية زخرفية */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-white -translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-white translate-x-12 translate-y-12" />
      </div>

      <div className="relative z-10">
        {/* السطر الأول: إجمالي المُحصَّل */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-white/70 text-xs font-bold mb-1">إجمالي المُحصَّل هذا الفصل</p>
            <p className="text-3xl font-black" style={{ fontFamily: "var(--font-headline)" }}>
              {stats.collected.toLocaleString("ar-DZ")}
              <span className="text-lg font-bold text-white/70 mr-1">{currency}</span>
            </p>
            <p className="text-white/60 text-xs mt-1">
              من أصل {stats.expectedTotal.toLocaleString("ar-DZ")} {currency} مُتوَقَّع
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* شريط التحصيل */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-white/70 text-xs font-bold">نسبة التحصيل</p>
            <p className="text-white text-sm font-black">{collectionRate}%</p>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${collectionRate}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={`h-full rounded-full ${collectionRate >= 80 ? "bg-emerald-300" : collectionRate >= 50 ? "bg-amber-300" : "bg-red-300"}`}
            />
          </div>
          {/* نسبة السداد المعجبة */}
          <p className="text-white/60 text-[11px] mt-1.5 font-medium">
            {stats.paid} دفع من {total} طالب
            {stats.exempted > 0 && ` · ${stats.exempted} معفى`}
          </p>
        </div>

        {/* بطاقات صغيرة */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "مدفوع", value: stats.paid, color: "bg-emerald-500/30 border-emerald-400/30", icon: "✅" },
            { label: "غير مدفوع", value: stats.unpaid, color: "bg-red-500/30 border-red-400/30", icon: "⏳" },
            { label: "معفى", value: stats.exempted, color: "bg-blue-400/30 border-blue-300/30", icon: "🛡️" },
          ].map(item => (
            <div key={item.label} className={`rounded-xl border p-2.5 text-center ${item.color}`}>
              <p className="text-base">{item.icon}</p>
              <p className="text-lg font-black text-white">{item.value}</p>
              <p className="text-[10px] text-white/70">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// سطر الطالب المُحسَّن
// ─────────────────────────────────────────────────────────────

function StudentPaymentRow({
  student, payment, season, schoolName, schoolCountry,
  onToggle, defaultAmount, isSaving,
  sortBy,
}: {
  student: Student;
  payment?: Payment;
  season: string;
  schoolName: string;
  schoolCountry?: string;
  onToggle: (status: PaymentStatus) => void;
  defaultAmount: number;
  isSaving: boolean;
  sortBy: "name" | "status" | "date";
}) {
  const status: PaymentStatus = payment?.status ?? "unpaid";
  const cfg = STATUS_CFG[status];
  const Icon = cfg.icon;
  const next: PaymentStatus = status === "unpaid" ? "paid" : status === "paid" ? "exempted" : "unpaid";

  const paidDate = payment?.paidAt
    ? new Date(payment.paidAt).toLocaleDateString("ar-DZ", { day: "2-digit", month: "short" })
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 p-3.5 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/3 transition-colors"
    >
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 ${
        student.gender === "أنثى"
          ? "bg-gradient-to-br from-pink-400 to-rose-500"
          : "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]"
      }`}>{student.fullName[0]}</div>

      {/* الاسم */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-gray-800 dark:text-white truncate">{student.fullName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-gray-400 dark:text-gray-500">{student.subscriptionTier}</p>
          {paidDate && status === "paid" && (
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
              <CalendarCheck className="w-2.5 h-2.5" /> {paidDate}
            </span>
          )}
          {status === "unpaid" && (
            <span className="text-[10px] font-bold text-gray-400">
              {defaultAmount.toLocaleString("ar-DZ")} {getCurrencySymbol(schoolCountry)}
            </span>
          )}
        </div>
      </div>

      {/* حالة */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black border ${cfg.bg} ${cfg.color} ${cfg.border} shrink-0`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </div>

      {/* أزرار */}
      <div className="flex items-center gap-1 shrink-0">
        {/* تذكير واتسآب للغير مدفوع */}
        {status === "unpaid" && student.phone1 && (
          <button
            onClick={() => sendReminderWhatsApp(student, season, defaultAmount, schoolName, schoolCountry)}
            className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 flex items-center justify-center text-orange-500 transition-colors"
            title="إرسال تذكير بالدفع"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
        )}

        {/* وصل واتسآب للمدفوع */}
        {status === "paid" && payment && student.phone1 && (
          <button
            onClick={() => sendWhatsApp(student, payment, season, schoolName, schoolCountry)}
            className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-colors"
            title="إرسال وصل واتسآب"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </button>
        )}

        {/* تغيير الحالة */}
        {isSaving ? (
          <div className="w-7 h-7 flex items-center justify-center">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
          </div>
        ) : (
          <button
            onClick={() => onToggle(next)}
            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            title={`تغيير إلى ${STATUS_CFG[next].label}`}
          >
            <ChevronDown className="w-3.5 h-3.5 rotate-90" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// مودال التذكير الجماعي
// ─────────────────────────────────────────────────────────────

function BulkReminderModal({
  unpaidStudents, season, schoolName, schoolCountry, defaultAmount,
  onClose,
}: {
  unpaidStudents: Student[];
  season: string;
  schoolName: string;
  schoolCountry?: string;
  defaultAmount: number;
  onClose: () => void;
}) {
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [sendingAll, setSendingAll] = useState(false);

  const handleSendOne = (student: Student) => {
    sendReminderWhatsApp(student, season, defaultAmount, schoolName, schoolCountry);
    setSent(prev => new Set([...prev, student.id]));
  };

  const handleSendAll = async () => {
    setSendingAll(true);
    for (const student of unpaidStudents.filter(s => s.phone1)) {
      sendReminderWhatsApp(student, season, defaultAmount, schoolName, schoolCountry);
      setSent(prev => new Set([...prev, student.id]));
      await new Promise(r => setTimeout(r, 500));
    }
    setSendingAll(false);
  };

  const withPhone = unpaidStudents.filter(s => s.phone1);
  const noPhone = unpaidStudents.filter(s => !s.phone1);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-x-4 bottom-0 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50"
      >
        <div className="bg-white dark:bg-[var(--color-card)] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden" dir="rtl">
          {/* رأس */}
          <div className="flex items-center justify-between p-5 bg-gradient-to-l from-orange-500 to-amber-500 text-white">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <div>
                <p className="font-black text-sm">إرسال تذكير بالدفع</p>
                <p className="text-white/70 text-xs">{withPhone.length} طالب غير مدفوع لديهم رقم هاتف</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {withPhone.map(student => (
              <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/10">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white text-xs font-black shrink-0">
                  {student.fullName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{student.fullName}</p>
                  <p className="text-xs text-gray-400">{student.phone1}</p>
                </div>
                {sent.has(student.id) ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> أُرسل
                  </span>
                ) : (
                  <button
                    onClick={() => handleSendOne(student)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors border border-orange-200"
                  >
                    <Send className="w-3 h-3 inline ml-1" /> إرسال
                  </button>
                )}
              </div>
            ))}
            {noPhone.length > 0 && (
              <p className="text-xs text-gray-400 text-center py-2">
                {noPhone.length} طالب بدون رقم هاتف — لا يمكن إرسال تذكير لهم
              </p>
            )}
          </div>

          <div className="flex gap-3 p-4 border-t border-gray-100 dark:border-white/10">
            <button onClick={onClose} className="btn-secondary flex-1 py-3 text-sm justify-center">إغلاق</button>
            <button
              onClick={handleSendAll}
              disabled={sendingAll || withPhone.every(s => sent.has(s.id))}
              className="flex-1 py-3 rounded-xl text-sm font-black bg-gradient-to-l from-orange-500 to-amber-500 text-white flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sendingAll ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الإرسال...</>
                : withPhone.every(s => sent.has(s.id)) ? <><CheckCircle2 className="w-4 h-4" /> أُرسل للجميع</>
                : <><Send className="w-4 h-4" /> إرسال للجميع ({withPhone.length})</>}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// الصفحة الرئيسية
// ─────────────────────────────────────────────────────────────

function DuesPage() {
  const { user, school } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState(currentSeasonDefault);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | "الكل">("الكل");
  const [sortBy, setSortBy] = useState<"name" | "status" | "date">("status");
  const [saving, setSaving] = useState<string | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);

  // الأسعار
  const DEFAULT_PRICE: Record<string, number> = (
    school?.settings?.prices?.renewal as Record<string, number> | undefined
  ) ?? { "فئة الأكابر": 1500, "فئة الأصاغر": 1200 };

  const getDefaultAmount = (student: Student) =>
    DEFAULT_PRICE[student.subscriptionTier] ?? (Object.values(DEFAULT_PRICE)[0] ?? 1200);

  const load = useCallback(async () => {
    if (!user?.id || !school?.id) return;
    setLoading(true);
    const db = getDB();
    const isPrincipal = user.role === "principal" || user.role === "super_admin";
    let studs: Student[] = [];
    if (isPrincipal) {
      studs = await db.students.where("schoolId").equals(school.id)
        .and((s) => s.status === "نشط").toArray();
    } else {
      studs = await db.students.where("teacherId").equals(user.id)
        .and((s) => s.status === "نشط").toArray();
    }
    studs.sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
    const pays = await db.payments.where("schoolId").equals(school.id)
      .and((p) => p.date === season).toArray();
    setStudents(studs);
    setPayments(pays);
    setLoading(false);
  }, [user?.id, school?.id, season]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (student: Student, next: PaymentStatus) => {
    if (!school?.id) return;
    setSaving(student.id);
    const existing = payments.find((p) => p.studentId === student.id && p.date === season);
    if (existing) {
      await updatePaymentStatus(existing.id, next);
      setPayments((prev) => prev.map((p) => p.id === existing.id
        ? { ...p, status: next, paidAt: next === "paid" ? new Date().toISOString() : undefined }
        : p));
    } else {
      const p = await createPayment({
        schoolId: school.id,
        studentId: student.id,
        amount: getDefaultAmount(student),
        date: season,
        status: next,
      });
      setPayments((prev) => [...prev, p]);
    }
    setSaving(null);
  };

  const getPayment = (studentId: string) => payments.find((p) => p.studentId === studentId && p.date === season);

  // ─── فلترة وترتيب ─────────────────────────────────────

  const filtered = useMemo(() => {
    let list = students.filter((s) => {
      const pay = getPayment(s.id);
      const status: PaymentStatus = pay?.status ?? "unpaid";
      const matchSearch = !search || s.fullName.includes(search);
      const matchStatus = filterStatus === "الكل" || status === filterStatus;
      return matchSearch && matchStatus;
    });

    // الترتيب
    list = [...list].sort((a, b) => {
      if (sortBy === "name") return a.fullName.localeCompare(b.fullName, "ar");
      if (sortBy === "status") {
        const order = { unpaid: 0, paid: 1, exempted: 2 };
        const sa = getPayment(a.id)?.status ?? "unpaid";
        const sb = getPayment(b.id)?.status ?? "unpaid";
        return order[sa] - order[sb];
      }
      if (sortBy === "date") {
        const da = getPayment(a.id)?.paidAt ?? "0";
        const db2 = getPayment(b.id)?.paidAt ?? "0";
        return db2.localeCompare(da); // أحدث أولاً
      }
      return 0;
    });
    return list;
  }, [students, payments, search, filterStatus, season, sortBy]);

  // ─── الإحصاءات ────────────────────────────────────────

  const stats = useMemo(() => {
    const paid = students.filter((s) => getPayment(s.id)?.status === "paid").length;
    const unpaid = students.filter((s) => (getPayment(s.id)?.status ?? "unpaid") === "unpaid").length;
    const exempted = students.filter((s) => getPayment(s.id)?.status === "exempted").length;
    const collected = payments.filter((p) => p.date === season && p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);
    const expectedTotal = students.reduce((sum, s) => sum + getDefaultAmount(s), 0);
    return { paid, unpaid, exempted, collected, expectedTotal };
  }, [students, payments, season]);

  const collectionRate = students.length > 0
    ? Math.round((stats.paid / students.length) * 100)
    : 0;

  const unpaidStudents = students.filter(s =>
    (getPayment(s.id)?.status ?? "unpaid") === "unpaid"
  );

  const currency = getCurrencySymbol(school?.country);
  const defaultAmountForReminder = Number(Object.values(DEFAULT_PRICE)[0] ?? 1200);

  return (
    <div className="max-w-3xl mx-auto space-y-5" dir="rtl">
      {/* رأس */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2"
            style={{ fontFamily: "var(--font-headline)" }}>
            <BadgeDollarSign className="w-6 h-6 text-[var(--color-primary)]" />
            الاشتراكات الفصلية
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {students.length} طالب · {stats.paid} مدفوع · نسبة التحصيل {collectionRate}%
          </p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl border border-[var(--color-border)] bg-white dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-[var(--color-primary)] transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ─── الإجمالي المالي (مُحسَّن) ─── */}
      {!loading && students.length > 0 && (
        <FinancialHeader
          stats={stats}
          total={students.length}
          currency={currency}
          collectionRate={collectionRate}
        />
      )}

      {/* ─── شريط الأدوات ─── */}
      <div className="space-y-2">
        {/* الصف الأول: الفصل + بحث */}
        <div className="flex flex-wrap gap-2">
          <select value={season} onChange={(e) => setSeason(e.target.value)}
            className="input-field text-sm py-2 flex-1 min-w-44">
            {SEASON_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <div className="relative flex-1 min-w-36">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم..."
              className="w-full h-10 border border-gray-200 dark:border-white/10 rounded-xl pr-10 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 bg-white dark:bg-white/5 dark:text-white" />
          </div>
        </div>

        {/* الصف الثاني: فلاتر الحالة + ترتيب + إرسال تذكير */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* فلتر الحالة */}
          <div className="flex gap-1.5 flex-wrap">
            {(["الكل", "unpaid", "paid", "exempted"] as const).map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  filterStatus === s
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300"
                }`}>
                {s === "الكل" ? "الكل" : STATUS_CFG[s].label}
                {s === "unpaid" && stats.unpaid > 0 && (
                  <span className="mr-1.5 text-[10px] bg-red-100 text-red-600 px-1 rounded-full">{stats.unpaid}</span>
                )}
              </button>
            ))}
          </div>

          {/* الترتيب */}
          <div className="flex gap-1 mr-auto">
            {(["status", "name", "date"] as const).map(key => (
              <button key={key} onClick={() => setSortBy(key)}
                title={key === "status" ? "رتّب بالحالة" : key === "name" ? "رتّب بالاسم" : "رتّب بتاريخ الدفع"}
                className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs transition-all ${
                  sortBy === key
                    ? "bg-gray-800 dark:bg-white text-white dark:text-gray-800 border-gray-800"
                    : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400"
                }`}>
                {key === "status" ? <Filter className="w-3.5 h-3.5" />
                  : key === "name" ? <SortAsc className="w-3.5 h-3.5" />
                  : <CalendarCheck className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>

          {/* زر إرسال تذكير للجميع الغير مدفوعين */}
          {unpaidStudents.length > 0 && (
            <button
              onClick={() => setShowReminderModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
              تذكير الغير مدفوعين ({unpaidStudents.length})
            </button>
          )}
        </div>
      </div>

      {/* ─── القائمة ─── */}
      <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
        {/* رأس القائمة */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/3">
          <Users className="w-4 h-4 text-gray-400" />
          <p className="text-xs font-black text-gray-500 dark:text-gray-400">
            {filtered.length} طالب
            {filterStatus !== "الكل" && ` · عرض: ${filterStatus === "paid" ? "المدفوعون" : filterStatus === "unpaid" ? "الغير مدفوعين" : "المعفيون"}`}
          </p>

          {/* إحصاء سريع للنتائج المعروضة */}
          {filtered.length > 0 && (
            <div className="mr-auto flex items-center gap-2">
              {(() => {
                const paidInFilter = filtered.filter(s => getPayment(s.id)?.status === "paid").length;
                const pct = Math.round((paidInFilter / filtered.length) * 100);
                return (
                  <span className="text-[10px] font-bold text-gray-400">
                    {paidInFilter}/{filtered.length} = {pct}%
                  </span>
                );
              })()}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <DollarSign className="w-10 h-10 mx-auto mb-2 text-gray-200" />
            <p className="font-medium">لا يوجد طلاب في هذا الفلتر</p>
            {search && (
              <button onClick={() => setSearch("")} className="mt-2 text-xs text-[var(--color-primary)] underline">
                مسح البحث
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((student) => (
              <StudentPaymentRow
                key={student.id}
                student={student}
                payment={getPayment(student.id)}
                season={season}
                schoolName={school?.name ?? "المدرسة"}
                schoolCountry={school?.country}
                onToggle={(next) => handleToggle(student, next)}
                defaultAmount={getDefaultAmount(student)}
                isSaving={saving === student.id}
                sortBy={sortBy}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* ─── Modal التذكير الجماعي ─── */}
      <AnimatePresence>
        {showReminderModal && (
          <BulkReminderModal
            unpaidStudents={unpaidStudents}
            season={season}
            schoolName={school?.name ?? "المدرسة"}
            schoolCountry={school?.country}
            defaultAmount={defaultAmountForReminder}
            onClose={() => setShowReminderModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DuesPageWrapper() {
  return (
    <SchoolGuard>
      <DuesPage />
    </SchoolGuard>
  );
}
