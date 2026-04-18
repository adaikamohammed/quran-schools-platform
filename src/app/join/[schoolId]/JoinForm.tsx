"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, CheckCircle2, MapPin, Loader2, Send, Phone, UserCircle2, Contact, HelpCircle
} from "lucide-react";
import Image from "next/image";

interface JoinFormProps {
  schoolId: string;
  schoolName: string;
  location: string;
}

export default function JoinForm({ schoolId, schoolName, location }: JoinFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    gender: "ذكر",
    birthDate: "",
    educationalLevel: "",
    guardianName: "",
    phone1: "",
    phone2: "",
    address: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.fullName.trim() || !form.phone1.trim()) {
      setError("يرجى ملء جميع الحقول المطلوبة (الاسم الكامل ورقم الهاتف).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/join/${schoolId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
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

  const update = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

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
          <h1 className="text-3xl font-black text-gray-900 mb-4" style={{ fontFamily: "var(--font-headline)" }}>تم استلام طلبك!</h1>
          <p className="text-gray-600 font-medium leading-relaxed mb-8">
            شكرًا لك. لقد تم تحويل بيانات الطالب <strong className="text-emerald-700">{form.fullName}</strong> إلى إدارة <strong>{schoolName}</strong> بنجاح.
            سيتم التواصل معك عبر رقم الهاتف المدخل لاستكمال القبول والمقابلة.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-gray-50 flex justify-center" dir="rtl">
      <div className="w-full max-w-2xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 mb-4 overflow-hidden outline outline-4 outline-white">
             <Image src="/icons/icon-192x192.png" alt="Logo" width={64} height={64} className="object-cover scale-110" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 whitespace-pre-wrap leading-tight" style={{ fontFamily: "var(--font-headline)" }}>
            التسجيل الإلكتروني <br className="hidden sm:block" /> {schoolName}
          </h1>
          <p className="text-gray-500 font-bold flex items-center justify-center gap-1.5 opacity-80">
            <MapPin size={16} /> <span>{location}</span>
          </p>
        </motion.div>

        {/* Form Section */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">الاسم الكامل للطالب *</label>
                <div className="relative">
                  <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" required value={form.fullName} onChange={e => update("fullName", e.target.value)}
                    placeholder="الاسم الرباعي"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-xl pr-11 pl-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-white transition-all" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">رقم هاتف ولي الأمر (واتساب) *</label>
                <div className="relative">
                  <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" required value={form.phone1} onChange={e => update("phone1", e.target.value)}
                    placeholder="05..."
                    dir="ltr"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-xl pr-11 pl-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-white text-left transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">الجنس</label>
                <select value={form.gender} onChange={e => update("gender", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-white transition-all">
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">المستوى الدراسي للحفظ</label>
                <select value={form.educationalLevel} onChange={e => update("educationalLevel", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-white transition-all">
                  <option value="">-- اختياري --</option>
                  <option value="ابتدائي">ابتدائي</option>
                  <option value="متوسط">متوسط</option>
                  <option value="ثانوي">ثانوي</option>
                  <option value="جامعي">جامعي</option>
                  <option value="غير محدد">غير ذلك</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">اسم ولي الأمر</label>
              <div className="relative">
                <Contact size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={form.guardianName} onChange={e => update("guardianName", e.target.value)}
                  placeholder="اسم الأب أو الكفيل (اختياري)"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-xl pr-11 pl-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-white transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <HelpCircle size={14} className="text-gray-400"/>
                ملاحظات
              </label>
              <textarea value={form.notes} onChange={e => update("notes", e.target.value)}
                placeholder="كم يحفظ الطالب تقريبًا؟ أو أي أمور تود إضافتها..."
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-white transition-all resize-none" />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <p className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-xl border border-red-100 flex items-center gap-2">
                    <span className="bg-red-100 p-1 rounded-full"><HelpCircle size={14} /></span>
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading}
              className="w-full bg-[var(--color-primary)] hover:bg-emerald-600 active:scale-[0.99] transition-all text-white font-black text-lg py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-[var(--color-primary)]/20">
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
