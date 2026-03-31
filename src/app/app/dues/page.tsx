"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import { createPayment, updatePaymentStatus } from "@/lib/storage/mutations";
import type { Student, Payment, PaymentStatus } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, CheckCircle2, Clock, Shield,
  Search, Plus, X, Loader2, User,
  AlertTriangle, CreditCard, TrendingUp, Filter,
  ChevronDown, Wallet, Check,
} from "lucide-react";

// ─── فترات الاشتراك ──────────────────────────────────────

const SEASONS = [
  { value: "2025-S1", label: "الفصل الأول 2025" },
  { value: "2025-S2", label: "الفصل الثاني 2025" },
  { value: "2026-S1", label: "الفصل الأول 2026" },
  { value: "2026-S2", label: "الفصل الثاني 2026" },
];

const STATUS_CFG: Record<PaymentStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  paid: { label: "مدفوع", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 },
  unpaid: { label: "غير مدفوع", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: Clock },
  exempted: { label: "معفى", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: Shield },
};

// ─── سطر الطالب ──────────────────────────────────────────

function StudentPaymentRow({
  student,
  payment,
  onToggle,
}: {
  student: Student;
  payment?: Payment;
  onToggle: (status: PaymentStatus) => void;
}) {
  const status: PaymentStatus = payment?.status ?? "unpaid";
  const cfg = STATUS_CFG[status];
  const Icon = cfg.icon;

  const next: PaymentStatus = status === "unpaid" ? "paid" : status === "paid" ? "exempted" : "unpaid";

  return (
    <div className={`flex items-center gap-3 p-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 ${
        student.gender === "أنثى" ? "bg-gradient-to-br from-pink-400 to-rose-500" : "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]"
      }`}>{student.fullName[0]}</div>

      {/* اسم + تصنيف */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-gray-800 truncate">{student.fullName}</p>
        <p className="text-xs text-gray-400 font-medium">{student.subscriptionTier}</p>
      </div>

      {/* حالة */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${cfg.bg} ${cfg.color} shrink-0`}>
        <Icon className="w-3.5 h-3.5" />
        {cfg.label}
      </div>

      {/* تغيير */}
      <button onClick={() => onToggle(next)}
        className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors shrink-0"
        title={`تغيير إلى ${STATUS_CFG[next].label}`}>
        <ChevronDown className="w-3.5 h-3.5 rotate-90" />
      </button>
    </div>
  );
}

// ─── الصفحة ───────────────────────────────────────────────

export default function DuesPage() {
  const { user, school } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState(SEASONS[2].value);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | "الكل">("الكل");
  const [saving, setSaving] = useState<string | null>(null);

  const DEFAULT_PRICE = { "فئة الأكابر": 1500, "فئة الأصاغر": 1200 };

  const load = useCallback(async () => {
    if (!user?.id || !school?.id) return;
    setLoading(true);
    const db = getDB();
    const studs = await db.students.where("teacherId").equals(user.id)
      .and((s) => s.status === "نشط").toArray();
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
      setPayments((prev) => prev.map((p) => p.id === existing.id ? { ...p, status: next, paidAt: next === "paid" ? new Date().toISOString() : undefined } : p));
    } else {
      const p = await createPayment({
        schoolId: school.id,
        studentId: student.id,
        amount: DEFAULT_PRICE[student.subscriptionTier] ?? 1200,
        date: season,
        status: next,
      });
      setPayments((prev) => [...prev, p]);
    }
    setSaving(null);
  };

  const getPayment = (studentId: string) => payments.find((p) => p.studentId === studentId && p.date === season);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const pay = getPayment(s.id);
      const status: PaymentStatus = pay?.status ?? "unpaid";
      const matchSearch = !search || s.fullName.includes(search);
      const matchStatus = filterStatus === "الكل" || status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [students, payments, search, filterStatus, season]);

  const stats = useMemo(() => {
    const paid = students.filter((s) => getPayment(s.id)?.status === "paid").length;
    const unpaid = students.filter((s) => (getPayment(s.id)?.status ?? "unpaid") === "unpaid").length;
    const exempted = students.filter((s) => getPayment(s.id)?.status === "exempted").length;
    const collected = payments.filter((p) => p.date === season && p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);
    return { paid, unpaid, exempted, collected };
  }, [students, payments, season]);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* رأس */}
      <div>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>الاشتراكات الفصلية</h1>
        <p className="text-xs text-gray-400 font-medium mt-0.5">{students.length} طالب · {stats.paid} مدفوع</p>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "مدفوع", value: stats.paid, color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "غير مدفوع", value: stats.unpaid, color: "text-red-600", bg: "bg-red-50" },
          { label: "معفى", value: stats.exempted, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "المحصّل (دج)", value: stats.collected.toLocaleString("ar-DZ"), color: "text-[var(--color-primary-dark)]", bg: "bg-[var(--color-primary-light)]" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <p className={`text-xl font-black ${color}`} style={{ fontFamily: "var(--font-headline)" }}>{value}</p>
            <p className={`text-xs font-medium ${color} opacity-70`}>{label}</p>
          </div>
        ))}
      </div>

      {/* شريط الأدوات */}
      <div className="flex flex-wrap gap-2">
        {/* الفصل */}
        <select value={season} onChange={(e) => setSeason(e.target.value)}
          className="input-field text-sm py-2 flex-1 min-w-40">
          {SEASONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {/* بحث */}
        <div className="relative flex-1 min-w-36">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث..."
            className="w-full h-10 border border-gray-200 rounded-xl pr-10 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 bg-white" />
        </div>

        {/* فلتر الحالة */}
        {(["الكل", "paid", "unpaid", "exempted"] as const).map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              filterStatus === s
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
            }`}>
            {s === "الكل" ? "الكل" : STATUS_CFG[s].label}
          </button>
        ))}
      </div>

      {/* شريط التقدم */}
      {students.length > 0 && (
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4">
          <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
            <span>نسبة السداد</span>
            <span>{Math.round((stats.paid / students.length) * 100)}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
            <div className="bg-emerald-400 h-full transition-all duration-500" style={{ width: `${(stats.paid / students.length) * 100}%` }} />
            <div className="bg-blue-300 h-full transition-all duration-500" style={{ width: `${(stats.exempted / students.length) * 100}%` }} />
          </div>
        </div>
      )}

      {/* القائمة */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <DollarSign className="w-10 h-10 mx-auto mb-2 text-gray-200" />
            <p className="font-medium">لا يوجد طلاب</p>
          </div>
        ) : (
          filtered.map((student) => (
            <StudentPaymentRow
              key={student.id}
              student={student}
              payment={getPayment(student.id)}
              onToggle={(next) => handleToggle(student, next)}
            />
          ))
        )}
      </div>
    </div>
  );
}
