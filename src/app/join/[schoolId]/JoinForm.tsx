"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, CheckCircle2, MapPin, Loader2, Send, Phone,
  UserCircle2, Contact, HelpCircle, Calendar, BookOpen,
  Home, ChevronDown,
} from "lucide-react";
import Image from "next/image";

interface JoinFormProps {
  schoolId: string;
  schoolName: string;
  location: string;
}

// ── مجموعات المستوى الدراسي (مطابقة لصفحة التسجيلات) ────────
const LEVEL_GROUPS = [
  { label: "الطور الابتدائي", levels: ["1 ابتدائي","2 ابتدائي","3 ابتدائي","4 ابتدائي","5 ابتدائي","6 ابتدائي"] },
  { label: "الطور المتوسط",   levels: ["1 متوسط","2 متوسط","3 متوسط","4 متوسط"] },
  { label: "الطور الثانوي",   levels: ["1 ثانوي","2 ثانوي","3 ثانوي"] },
  { label: "أخرى",            levels: ["تمهيدي","تحضيري","جامعي","غير محدد"] },
];

const MEMORIZATION_OPTIONS = [
  "لم يحفظ بعد",
  "بعض السور القصيرة",
  "جزء عم كاملاً",
  "5 أجزاء فأقل",
  "10 أجزاء فأقل",
  "15 جزءاً فأقل",
  "20 جزءاً فأقل",
  "أكثر من 20 جزء",
  "حافظ للقرآن كامل",
];

function LevelPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      {LEVEL_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{group.label}</p>
          <div className="flex flex-wrap gap-2">
            {group.levels.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => onChange(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  value === lvl
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:border-[var(--color-primary)]/40"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── مكوّن حقل الإدخال ────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-black text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-white transition-all";

export default function JoinForm({ schoolId, schoolName, location }: JoinFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    gender: "ذكر",
    birthDate: "",
    educationalLevel: "",
    memorizationLevel: "",
    guardianName: "",
    phone1: "",
    phone2: "",
    address: "",
    subscriptionTier: "",
    notes: "",
  });

  const update = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.fullName.trim() || !form.phone1.trim()) {
      setError("يرجى ملء الاسم الكامل ورقم الهاتف على الأقل.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/join/${schoolId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطأ غير متوقع");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "فشل الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  };

  // ── شاشة النجاح ─────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-[2rem] p-10 max-w-lg w-full text-center shadow-xl border border-emerald-100"
        >
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4" style={{ fontFamily: "var(--font-headline)" }}>
            تم استلام طلبك!
          </h1>
          <p className="text-gray-600 font-medium leading-relaxed mb-4">
            شكرًا لك. تم تحويل بيانات الطالب <strong className="text-emerald-700">{form.fullName}</strong> إلى إدارة{" "}
            <strong>{schoolName}</strong> بنجاح.
          </p>
          <p className="text-gray-500 text-sm font-medium border-t border-gray-100 pt-4 mt-2">
            تم إدراج الطالب في قائمة الانتظار، ونلفت انتباهكم أن <strong className="text-gray-800">القبول النهائي ودخول الطالب يعتمد على أولوية التسجيل وحرص الولي</strong> على المتابعة.
          </p>
        </motion.div>
      </div>
    );
  }

  // ── النموذج ──────────────────────────────────────────────
  return (
    <div className="min-h-screen py-12 px-4 bg-gray-50 flex justify-center" dir="rtl">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 mb-4 overflow-hidden outline outline-4 outline-white">
            <Image src="/icons/icon-192x192.png" alt="Logo" width={64} height={64} className="object-cover scale-110" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 leading-tight" style={{ fontFamily: "var(--font-headline)" }}>
            التسجيل الإلكتروني<br />{schoolName}
          </h1>
          <p className="text-gray-500 font-bold flex items-center justify-center gap-1.5 opacity-80">
            <MapPin size={16} /> <span>{location}</span>
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-6 sm:p-10"
        >
          <h2 className="text-xl font-black mb-6 text-gray-800 border-b border-gray-100 pb-4 flex items-center gap-2">
            <UserCircle2 className="text-[var(--color-primary)]" />
            بيانات الطالب المرشح
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── القسم 1: المعلومات الأساسية ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="الاسم الكامل للطالب" required>
                <div className="relative">
                  <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text" required value={form.fullName}
                    onChange={e => update("fullName", e.target.value)}
                    placeholder="الاسم الرباعي"
                    className={`${inputCls} pr-11`}
                  />
                </div>
              </Field>

              <Field label="الجنس">
                <select
                  value={form.gender} onChange={e => update("gender", e.target.value)}
                  className={inputCls}
                >
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </Field>

              <Field label="تاريخ الميلاد">
                <div className="relative">
                  <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date" value={form.birthDate}
                    onChange={e => update("birthDate", e.target.value)}
                    className={`${inputCls} pr-11`}
                  />
                </div>
              </Field>

              <Field label="أو أدخل عُمر الطالب (وسنحسب السنة)">
                <div className="relative">
                  <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    placeholder="مثال: 10" min="4" max="80"
                    onChange={e => {
                      const age = parseInt(e.target.value);
                      if (age > 0) {
                        const year = new Date().getFullYear() - age;
                        update("birthDate", `${year}-01-01`);
                      }
                    }}
                    className={`${inputCls} pr-11`}
                  />
                </div>
              </Field>

              <Field label="اسم ولي الأمر">
                <div className="relative">
                  <Contact size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text" value={form.guardianName}
                    onChange={e => update("guardianName", e.target.value)}
                    placeholder="اسم الأب أو الكفيل"
                    className={`${inputCls} pr-11`}
                  />
                </div>
              </Field>

              <Field label="رقم هاتف ولي الأمر (واتساب)" required>
                <div className="relative">
                  <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel" required value={form.phone1}
                    onChange={e => update("phone1", e.target.value)}
                    placeholder="0555..."
                    dir="ltr"
                    className={`${inputCls} pr-11 text-left`}
                  />
                </div>
              </Field>

              <Field label="رقم هاتف بديل">
                <div className="relative">
                  <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel" value={form.phone2}
                    onChange={e => update("phone2", e.target.value)}
                    placeholder="0555... (اختياري)"
                    dir="ltr"
                    className={`${inputCls} pr-11 text-left`}
                  />
                </div>
              </Field>
            </div>

            {/* ── القسم 2: المستوى الدراسي ── */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3">
              <p className="text-sm font-black text-gray-700 flex items-center gap-2">
                <BookOpen size={16} className="text-[var(--color-primary)]" />
                المستوى الدراسي
              </p>
              <LevelPicker value={form.educationalLevel} onChange={v => update("educationalLevel", v)} />
            </div>

            {/* ── القسم 3: مستوى الحفظ ── */}
            <Field label="مستوى الحفظ الحالي">
              <div className="relative">
                <BookOpen size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <ChevronDown size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select
                  value={form.memorizationLevel}
                  onChange={e => update("memorizationLevel", e.target.value)}
                  className={`${inputCls} pr-11 appearance-none`}
                >
                  <option value="">-- اختر مستوى الحفظ --</option>
                  {MEMORIZATION_OPTIONS.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </Field>

            {/* ── القسم 4: العنوان ── */}
            <Field label="العنوان / المنطقة">
              <div className="relative">
                <Home size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" value={form.address}
                  onChange={e => update("address", e.target.value)}
                  placeholder="الحي أو المنطقة السكنية (اختياري)"
                  className={`${inputCls} pr-11`}
                />
              </div>
            </Field>

            {/* ── القسم 5: الملاحظات ── */}
            <Field label="ملاحظات إضافية">
              <div className="relative">
                <HelpCircle size={18} className="absolute right-4 top-4 text-gray-400" />
                <textarea
                  value={form.notes} onChange={e => update("notes", e.target.value)}
                  placeholder="أي معلومات إضافية: كيف عرفتم المدرسة؟ هل سبق للطالب الدراسة في حلقة؟..."
                  className={`${inputCls} pr-11 min-h-[100px] resize-none`}
                />
              </div>
            </Field>

            {/* ── خطأ ── */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 text-red-600 text-sm font-bold p-4 rounded-2xl border border-red-100 flex items-center gap-2"
                >
                  <span className="bg-red-100 p-1 rounded-full shrink-0">⚠️</span>
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* ── زر الإرسال ── */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] hover:bg-emerald-600 active:scale-[0.99] transition-all text-white font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-[var(--color-primary)]/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              إرسال طلب التسجيل
            </button>
          </form>
        </motion.div>

        <p className="text-center mt-6 text-xs text-gray-400 font-bold opacity-60">
          يعمل بواسطة منصة <strong>فرسان القرآن</strong>
        </p>
      </div>
    </div>
  );
}
