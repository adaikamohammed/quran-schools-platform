"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  BookOpen,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      router.replace("/app");
    } catch (err: any) {
      setError(err.message ?? "حدث خطأ في تسجيل الدخول.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden" dir="rtl">
      {/* Background */}
      <div className="absolute inset-0 bg-gray-950" />
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-[var(--color-primary)]/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-secondary)]/10 rounded-full blur-[100px]" />
      <div className="absolute inset-0 islamic-pattern opacity-[0.04]" />

      {/* Left panel - decorative (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative z-10 p-12">
        <div className="text-right space-y-8 max-w-md">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center shadow-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-lg" style={{ fontFamily: "var(--font-headline)" }}>
                منصة المدارس القرآنية
              </p>
              <p className="text-[var(--color-primary)] text-xs font-bold opacity-80">
                نظام إدارة الحلقات
              </p>
            </div>
          </Link>

          <h1
            className="text-4xl font-black text-white leading-[1.4]"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            مرحباً بك{" "}
            <span className="text-[var(--color-primary)]">من جديد</span>
          </h1>
          <p className="text-gray-400 leading-relaxed text-lg">
            سجّل الدخول للوصول إلى لوحة تحكم مدرستك وإدارة الطلاب والحلقات.
          </p>

          {/* Decorative stats */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: "مدرسة منضمة", value: "50+" },
              { label: "طالب مسجّل", value: "5,000+" },
            ].map((s, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-2xl font-black text-white mb-1" style={{ fontFamily: "var(--font-headline)" }}>
                  {s.value}
                </p>
                <p className="text-gray-500 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center relative z-10 p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <p className="text-white font-black" style={{ fontFamily: "var(--font-headline)" }}>
              منصة المدارس القرآنية
            </p>
          </Link>

          <div className="glass-dark rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="mb-8">
              <h2
                className="text-2xl font-black text-white mb-2"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                تسجيل الدخول
              </h2>
              <p className="text-gray-400 text-sm">
                أدخل بيانات حسابك للوصول إلى لوحة التحكم
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-300">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@school.com"
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 pr-11 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/60 focus:bg-white/8 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-300">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 pr-11 pl-11 text-sm focus:outline-none focus:border-[var(--color-primary)]/60 focus:bg-white/8 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
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
                className="w-full h-12 bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-dark)] hover:opacity-90 disabled:opacity-60 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 mt-2"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جارٍ التحقق...
                    </motion.div>
                  ) : (
                    <motion.span
                      key="text"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      دخول لوحة التحكم
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-gray-500 text-sm">
                ليس لديك حساب؟{" "}
                <Link
                  href="/register"
                  className="text-[var(--color-primary)] font-bold hover:underline"
                >
                  سجّل مدرستك الآن
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-gray-600 text-xs mt-6">
            بتسجيل دخولك، أنت توافق على{" "}
            <a href="#" className="hover:text-gray-400 transition-colors">
              شروط الاستخدام
            </a>{" "}
            و{" "}
            <a href="#" className="hover:text-gray-400 transition-colors">
              سياسة الخصوصية
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
