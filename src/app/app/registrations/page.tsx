"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import { createRegistration, updateRegistrationStatus } from "@/lib/storage/mutations";
import type { PreRegistration, PreRegistrationStatus } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Search, Plus, X, ChevronDown, Phone,
  CheckCircle2, Clock, XCircle, User, Calendar,
  Loader2, Filter, Send, AlertTriangle, RefreshCw,
  MessageSquare,
} from "lucide-react";

// ─── حالات التسجيل ────────────────────────────────────────

const STATUS_CFG: Record<PreRegistrationStatus, { label: string; color: string; bg: string; border: string }> = {
  "مرشح": { label: "مرشح", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  "تم الإتصال": { label: "تم الاتصال", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  "مؤجل": { label: "مؤجل", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  "تم الإنضمام": { label: "انضم", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  "مرفوض": { label: "مرفوض", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  "إنضم لمدرسة أخرى": { label: "مدرسة أخرى", color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-300" },
  "مكرر": { label: "مكرر", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
  "لم يرد": { label: "لم يرد", color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200" },
};

const ALL_STATUSES = Object.keys(STATUS_CFG) as PreRegistrationStatus[];

// ─── Modal تسجيل جديد ─────────────────────────────────────

function NewRegModal({ schoolId, onSave, onClose }: {
  schoolId: string;
  onSave: (r: PreRegistration) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    fullName: "", gender: "ذكر" as "ذكر" | "أنثى",
    birthDate: "", educationalLevel: "",
    guardianName: "", phone1: "", phone2: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const up = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.phone1.trim()) return;
    setSaving(true);
    const reg = await createRegistration({
      schoolId,
      fullName: form.fullName.trim(),
      gender: form.gender,
      birthDate: form.birthDate,
      educationalLevel: form.educationalLevel || undefined,
      guardianName: form.guardianName || undefined,
      phone1: form.phone1.trim(),
      phone2: form.phone2 || undefined,
      notes: form.notes || undefined,
      status: "مرشح",
    });
    onSave(reg);
    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              <h3 className="font-black text-sm">تسجيل مرشح جديد</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
            {/* الاسم + الجنس */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="label-xs">الاسم الكامل *</label>
                <input value={form.fullName} onChange={(e) => up("fullName", e.target.value)} className="input-field text-sm py-2 mt-1.5" placeholder="الاسم الكامل" />
              </div>
              <div>
                <label className="label-xs">الجنس</label>
                <div className="flex gap-1 mt-1.5">
                  {(["ذكر", "أنثى"] as const).map((g) => (
                    <button key={g} onClick={() => up("gender", g)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        form.gender === g ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}>{g}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* ولي الأمر + الهاتف */}
            <div>
              <label className="label-xs">ولي الأمر</label>
              <input value={form.guardianName} onChange={(e) => up("guardianName", e.target.value)} className="input-field text-sm py-2 mt-1.5" placeholder="اسم ولي الأمر" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label-xs">هاتف 1 *</label>
                <input value={form.phone1} onChange={(e) => up("phone1", e.target.value)} className="input-field text-sm py-2 mt-1.5" placeholder="+213..." dir="ltr" />
              </div>
              <div>
                <label className="label-xs">هاتف 2</label>
                <input value={form.phone2} onChange={(e) => up("phone2", e.target.value)} className="input-field text-sm py-2 mt-1.5" placeholder="+213..." dir="ltr" />
              </div>
            </div>

            {/* تاريخ + مستوى */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label-xs">تاريخ الميلاد</label>
                <input type="date" value={form.birthDate} onChange={(e) => up("birthDate", e.target.value)} className="input-field text-sm py-2 mt-1.5" />
              </div>
              <div>
                <label className="label-xs">المستوى الدراسي</label>
                <input value={form.educationalLevel} onChange={(e) => up("educationalLevel", e.target.value)} className="input-field text-sm py-2 mt-1.5" placeholder="مثال: السنة 3..." />
              </div>
            </div>

            {/* ملاحظات */}
            <div>
              <label className="label-xs">ملاحظات</label>
              <textarea value={form.notes} onChange={(e) => up("notes", e.target.value)} rows={2}
                className="w-full mt-1.5 resize-none border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]/50" />
            </div>
          </div>

          <div className="flex gap-3 px-5 pb-5">
            <button onClick={onClose} className="btn-secondary flex-1 py-2.5 justify-center text-sm">إلغاء</button>
            <button onClick={handleSave} disabled={!form.fullName.trim() || !form.phone1.trim() || saving}
              className="btn-primary flex-1 py-2.5 justify-center text-sm disabled:opacity-40">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> حفظ...</> : <><Send className="w-4 h-4" /> تسجيل</>}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── الصفحة ───────────────────────────────────────────────

export default function RegistrationsPage() {
  const { user, school } = useAuth();
  const [registrations, setRegistrations] = useState<PreRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<PreRegistrationStatus | "الكل">("الكل");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!school?.id) return;
    setLoading(true);
    const db = getDB();
    const regs = await db.registrations.where("schoolId").equals(school.id).toArray();
    regs.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    setRegistrations(regs);
    setLoading(false);
  }, [school?.id]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, status: PreRegistrationStatus) => {
    setUpdating(id);
    await updateRegistrationStatus(id, status, user?.id);
    setRegistrations((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    setUpdating(null);
  };

  const filtered = useMemo(() => {
    return registrations.filter((r) => {
      const matchSearch = !search || r.fullName.includes(search) || r.phone1.includes(search);
      const matchStatus = filterStatus === "الكل" || r.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [registrations, search, filterStatus]);

  const stats = {
    total: registrations.length,
    candidate: registrations.filter((r) => r.status === "مرشح").length,
    joined: registrations.filter((r) => r.status === "تم الإنضمام").length,
    pending: registrations.filter((r) => ["مرشح", "تم الإتصال", "مؤجل"].includes(r.status)).length,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>التسجيلات الجديدة</h1>
          <p className="text-xs text-gray-400 mt-0.5">{stats.total} مرشح · {stats.joined} انضم</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary py-2.5 text-sm shrink-0">
          <Plus className="w-4 h-4" /> مرشح جديد
        </button>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "إجمالي", value: stats.total, color: "text-gray-700", bg: "bg-gray-50" },
          { label: "قيد المتابعة", value: stats.pending, color: "text-amber-700", bg: "bg-amber-50" },
          { label: "انضم", value: stats.joined, color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "مرشح جديد", value: stats.candidate, color: "text-purple-700", bg: "bg-purple-50" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <p className={`text-xl font-black ${color}`} style={{ fontFamily: "var(--font-headline)" }}>{value}</p>
            <p className={`text-xs font-medium ${color} opacity-70`}>{label}</p>
          </div>
        ))}
      </div>

      {/* فلاتر */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث باسم أو هاتف..."
            className="w-full h-10 border border-gray-200 rounded-xl pr-10 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 bg-white" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
          className="input-field text-sm py-2">
          <option value="الكل">كل الحالات</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
        </select>
      </div>

      {/* القائمة */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <UserPlus className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">{registrations.length === 0 ? "لا يوجد مرشحون بعد" : "لا توجد نتائج"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((reg) => {
            const cfg = STATUS_CFG[reg.status];
            return (
              <div key={reg.id} className="bg-white rounded-2xl border border-[var(--color-border)] p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shrink-0 ${
                    reg.gender === "أنثى" ? "bg-gradient-to-br from-pink-400 to-rose-500" : "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]"
                  }`}>{reg.fullName[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-black text-gray-800">{reg.fullName}</p>
                      <span className="text-xs text-gray-400">{reg.gender}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <a href={`tel:${reg.phone1}`} className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors font-medium" dir="ltr">
                        📞 {reg.phone1}
                      </a>
                      {reg.guardianName && <span>👤 {reg.guardianName}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      {cfg.label}
                    </span>
                    <select
                      value={reg.status}
                      onChange={(e) => handleStatusChange(reg.id, e.target.value as PreRegistrationStatus)}
                      disabled={updating === reg.id}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[var(--color-primary)]/50 bg-white disabled:opacity-50 cursor-pointer"
                    >
                      {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                    </select>
                  </div>
                </div>
                {reg.notes && (
                  <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">{reg.notes}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">{new Date(reg.requestedAt).toLocaleDateString("ar-DZ")}</p>
              </div>
            );
          })}
        </div>
      )}

      {showModal && school && (
        <NewRegModal
          schoolId={school.id}
          onSave={(r) => setRegistrations((prev) => [r, ...prev])}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
