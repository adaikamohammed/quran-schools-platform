"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Building2,
  User,
  Mail,
  Lock,
  MapPin,
  Phone,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  CheckCircle,
} from "lucide-react";

type FormData = {
  schoolName: string;
  directorName: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const countries = [
  "الجزائر", "السعودية", "مصر", "المغرب", "تونس", "الإمارات",
  "قطر", "الكويت", "الأردن", "العراق", "سوريا", "ليبيا",
  "السودان", "اليمن", "عُمان", "البحرين", "موريتانيا", "فلسطين",
];

export default function RegisterPage() {
  const [form, setForm] = useState<FormData>({
    schoolName: "",
    directorName: "",
    city: "",
    country: "الجزائر",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }
    if (form.password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }

    setLoading(true);
    // Placeholder — will connect to Supabase later
    await new Promise((r) => setTimeout(r, 2000));
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 relative overflow-hidden" dir="rtl">
        <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-[var(--color-primary)]/15 rounded-full blur-[120px]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-dark border border-white/10 rounded-3xl p-12 max-w-md w-full mx-4 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[var(--color-primary)]" />
          </div>
          <h2
            className="text-2xl font-black text-white mb-3"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            تم التسجيل بنجاح! 🎉
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            سيتم مراجعة طلبك وإرسال بيانات الدخول إلى بريدك الإلكتروني
            خلال 24 ساعة.
          </p>
          <Link href="/" className="btn-primary inline-flex w-full justify-center">
            العودة للرئيسية
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden py-12 px-4" dir="rtl">
      {/* Background */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-[var(--color-primary)]/12 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[35%] h-[35%] bg-[var(--color-secondary)]/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 islamic-pattern opacity-[0.03]" />

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center shadow-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-white font-black text-lg" style={{ fontFamily: "var(--font-headline)" }}>
                منصة المدارس القرآنية
              </p>
              <p className="text-[var(--color-primary)] text-xs font-bold opacity-80">
                نظام إدارة الحلقات
              </p>
            </div>
          </Link>

          <h1
            className="text-3xl font-black text-white mb-2"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            سجّل مدرستك{" "}
            <span className="text-[var(--color-primary)]">مجاناً</span>
          </h1>
          <p className="text-gray-400 text-sm">
            أنشئ حسابك وابدأ إدارة مدرستك القرآنية خلال دقائق
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-dark border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* School Info Section */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
                <h3 className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-headline)" }}>
                  معلومات المدرسة
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-gray-300 text-xs font-bold">اسم المدرسة *</label>
                  <input
                    name="schoolName"
                    value={form.schoolName}
                    onChange={handleChange}
                    required
                    placeholder="مثال: مدرسة النور القرآنية"
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 px-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-300 text-xs font-bold">البلد *</label>
                  <select
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    required
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-white px-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 transition-all"
                  >
                    {countries.map((c) => (
                      <option key={c} value={c} className="bg-gray-900 text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-300 text-xs font-bold">المدينة *</label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                    placeholder="مثال: الجزائر العاصمة"
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 px-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Director Info */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                <User className="w-4 h-4 text-[var(--color-primary)]" />
                <h3 className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-headline)" }}>
                  معلومات المدير
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-gray-300 text-xs font-bold">اسم المدير *</label>
                  <input
                    name="directorName"
                    value={form.directorName}
                    onChange={handleChange}
                    required
                    placeholder="الاسم الكامل"
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 px-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-300 text-xs font-bold">رقم الهاتف</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+213 6XX XXX XXX"
                    dir="ltr"
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 px-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 transition-all text-right"
                  />
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                <Lock className="w-4 h-4 text-[var(--color-primary)]" />
                <h3 className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-headline)" }}>
                  بيانات الحساب
                </h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-gray-300 text-xs font-bold">البريد الإلكتروني *</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="admin@school.com"
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 px-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 transition-all"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-gray-300 text-xs font-bold">كلمة المرور *</label>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={handleChange}
                        required
                        placeholder="8 أحرف على الأقل"
                        className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 px-4 pl-10 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-gray-300 text-xs font-bold">تأكيد كلمة المرور *</label>
                    <input
                      name="confirmPassword"
                      type="password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                      className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 px-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Error */}
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-dark)] hover:opacity-90 disabled:opacity-60 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 py-3.5"
              style={{ fontFamily: "var(--font-headline)", fontSize: "1rem" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جارٍ إنشاء الحساب...
                </>
              ) : (
                <>
                  إنشاء حساب مدرستي
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-center text-gray-500 text-xs">
              لديك حساب بالفعل؟{" "}
              <Link
                href="/login"
                className="text-[var(--color-primary)] font-bold hover:underline"
              >
                تسجيل الدخول
              </Link>
            </p>
          </form>
        </motion.div>

        <p className="text-center text-gray-600 text-xs mt-6">
          بالتسجيل، أنت توافق على{" "}
          <a href="#" className="hover:text-gray-400">شروط الاستخدام</a> و{" "}
          <a href="#" className="hover:text-gray-400">سياسة الخصوصية</a>
        </p>
      </div>
    </div>
  );
}
