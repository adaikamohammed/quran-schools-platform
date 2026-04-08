"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Mail, Lock, Eye, EyeOff, Loader2,
  User, Phone, MapPin, Globe, ArrowLeft, CheckCircle2,
} from "lucide-react";

interface FormData {
  schoolName: string;
  adminName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  city: string;
  country: string;
}

const EMPTY: FormData = {
  schoolName: "", adminName: "", email: "",
  password: "", confirmPassword: "", phone: "",
  city: "", country: "",
};

const COUNTRIES = [
  "الجزائر", "المغرب", "تونس", "مصر", "السعودية",
  "الإمارات", "قطر", "الكويت", "الأردن", "فلسطين",
  "ليبيا", "سوريا", "العراق", "اليمن", "السودان",
  "موريتانيا", "تشاد", "النيجر", "مالي", "السنغال",
  "إندونيسيا", "ماليزيا", "نيجيريا", "باكستان", "أخرى",
];

export default function RegisterPage() {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const router = useRouter();

  const set = (k: keyof FormData, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    if (form.password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/schools/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName: form.schoolName,
          adminName: form.adminName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          city: form.city,
          country: form.country,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "حدث خطأ أثناء التسجيل");
        return;
      }

      setSuccess(true);
      // توجيه بعد 3 ثوان
      setTimeout(() => router.replace("/login"), 3000);

    } catch {
      setError("تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.");
    } finally {
      setLoading(false);
    }
  };

  // ─── شاشة النجاح ─────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-6" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3" style={{ fontFamily: "var(--font-headline)" }}>
            تم التسجيل بنجاح! 🎉
          </h1>
          <p className="text-gray-400 leading-relaxed mb-2">
            تم إنشاء حساب مدرستك. يمكنك تسجيل الدخول الآن وبدء إدارة طلابك.
          </p>
          <p className="text-gray-600 text-sm">سيتم توجيهك لصفحة الدخول تلقائياً...</p>
          <Link
            href="/login"
            className="inline-block mt-6 px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
          >
            دخول لوحة التحكم الآن
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden" dir="rtl">
      {/* خلفية */}
      <div className="absolute inset-0 bg-gray-950" />
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-[var(--color-primary)]/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-secondary)]/10 rounded-full blur-[100px]" />
      <div className="absolute inset-0 islamic-pattern opacity-[0.04]" />

      {/* اللوحة اليسرى — تزيينية */}
      <div className="hidden lg:flex lg:w-2/5 items-center justify-center relative z-10 p-12">
        <div className="text-right space-y-6 max-w-xs">
          <Link href="/" className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center shadow-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-lg" style={{ fontFamily: "var(--font-headline)" }}>
                منصة المدارس القرآنية
              </p>
              <p className="text-[var(--color-primary)] text-xs font-bold opacity-80">
                لكل مدرسة في العالم
              </p>
            </div>
          </Link>

          <h1 className="text-3xl font-black text-white leading-[1.5]" style={{ fontFamily: "var(--font-headline)" }}>
            سجّل مدرستك
            <span className="text-[var(--color-primary)]"> مجاناً</span>
          </h1>
          <p className="text-gray-400 leading-relaxed">
            منصة متكاملة لإدارة الطلاب، الحصص اليومية، الحضور، الاشتراكات، ونظام دوري التميز.
          </p>

          {[
            "✅ تسجيل فوري — لا انتظار",
            "🌍 تعمل من أي دولة",
            "📱 تنبيهات واتساب للغياب",
            "🔒 بيانات مدرستك معزولة تماماً",
          ].map((f) => (
            <p key={f} className="text-gray-300 text-sm font-medium">{f}</p>
          ))}
        </div>
      </div>

      {/* نموذج التسجيل */}
      <div className="w-full lg:w-3/5 flex items-center justify-center relative z-10 p-5 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl"
        >
          {/* شعار موبايل */}
          <Link href="/" className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <p className="text-white font-black" style={{ fontFamily: "var(--font-headline)" }}>
              منصة المدارس القرآنية
            </p>
          </Link>

          <div className="glass-dark rounded-3xl p-7 border border-white/10 shadow-2xl">
            <div className="mb-7">
              <h2 className="text-2xl font-black text-white mb-1" style={{ fontFamily: "var(--font-headline)" }}>
                تسجيل مدرسة جديدة
              </h2>
              <p className="text-gray-400 text-sm">
                أنشئ حسابك الآن وابدأ فوراً — لا يحتاج موافقة
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ─── معلومات المدرسة ─── */}
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">معلومات المدرسة</p>
                <div className="space-y-3">
                  {/* اسم المدرسة */}
                  <div className="relative">
                    <BookOpen className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      value={form.schoolName}
                      onChange={e => set("schoolName", e.target.value)}
                      required
                      placeholder="اسم المدرسة / الحلقة القرآنية *"
                      className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 pr-11 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/60 transition-all"
                    />
                  </div>

                  {/* الدولة + المدينة */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Globe className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <select
                        value={form.country}
                        onChange={e => set("country", e.target.value)}
                        className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-white pr-11 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/60 transition-all appearance-none"
                        style={{ color: form.country ? 'white' : '#4b5563' }}
                        title="الدولة"
                      >
                        <option value="" disabled className="bg-gray-900 text-gray-400">الدولة</option>
                        {COUNTRIES.map(c => (
                          <option key={c} value={c} className="bg-gray-900">{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative">
                      <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        value={form.city}
                        onChange={e => set("city", e.target.value)}
                        placeholder="المدينة / الولاية"
                        className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 pr-11 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/60 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── معلومات المدير ─── */}
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">معلومات مدير المدرسة</p>
                <div className="space-y-3">
                  <div className="relative">
                    <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      value={form.adminName}
                      onChange={e => set("adminName", e.target.value)}
                      required
                      placeholder="الاسم الكامل للمدير *"
                      className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 pr-11 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/60 transition-all"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => set("email", e.target.value)}
                      required
                      placeholder="البريد الإلكتروني (للدخول) *"
                      dir="ltr"
                      className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 pr-11 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/60 transition-all text-right"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => set("phone", e.target.value)}
                      placeholder="رقم الهاتف (واتساب)"
                      dir="ltr"
                      className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 pr-11 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/60 transition-all text-right"
                    />
                  </div>
                </div>
              </div>

              {/* ─── كلمة المرور ─── */}
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">كلمة المرور</p>
                <div className="space-y-3">
                  <div className="relative">
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showPwd ? "text" : "password"}
                      value={form.password}
                      onChange={e => set("password", e.target.value)}
                      required
                      minLength={8}
                      placeholder="كلمة المرور (8 أحرف على الأقل) *"
                      className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 pr-11 pl-11 text-sm focus:outline-none focus:border-[var(--color-primary)]/60 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={e => set("confirmPassword", e.target.value)}
                      required
                      placeholder="تأكيد كلمة المرور *"
                      className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 pr-11 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/60 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* خطأ */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* زر التسجيل */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-dark)] hover:opacity-90 disabled:opacity-60 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 mt-2"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ إنشاء المدرسة...</>
                ) : (
                  <>تسجيل المدرسة مجاناً ✨</>
                )}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-white/10 text-center">
              <p className="text-gray-500 text-sm">
                لديك حساب بالفعل؟{" "}
                <Link href="/login" className="text-[var(--color-primary)] font-bold hover:underline flex items-center gap-1 inline-flex">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  تسجيل الدخول
                </Link>
              </p>
            </div>
          </div>

          {/* ملاحظة خصوصية */}
          <p className="text-center text-gray-700 text-xs mt-4">
            بيانات مدرستك معزولة تماماً عن باقي المدارس 🔒
          </p>
        </motion.div>
      </div>
    </div>
  );
}
