"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Star,
  CheckCircle,
  BookOpen,
  Users,
  Building2,
  Globe,
} from "lucide-react";

const stats = [
  { value: "50+", label: "مدرسة منضمة", icon: Building2 },
  { value: "5,000+", label: "طالب مسجّل", icon: Users },
  { value: "12", label: "دولة عربية", icon: Globe },
];

const highlights = [
  "إدارة الطلاب والحلقات بدقة",
  "تتبع الحفظ والتقدم يومياً",
  "تواصل مباشر مع أولياء الأمور",
  "تقارير وإحصائيات شاملة",
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center hero-bg islamic-pattern overflow-hidden pt-20">
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--color-primary)]/6 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[var(--color-secondary)]/8 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8 text-right"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="badge-green w-fit"
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              الحل الأمثل لإدارة المدارس القرآنية
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="text-5xl lg:text-6xl font-black leading-[1.3] text-gray-900"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              منصتك الذكية{" "}
              <br />
              <span className="shimmer-text">لإدارة المدارس القرآنية</span>
            </motion.h1>

            {/* Sub-heading */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="text-lg text-gray-500 leading-relaxed max-w-lg mr-auto"
            >
              نظام متكامل يمكّن أي مدرسة قرآنية من إدارة طلابها، تتبّع تقدم
              الحفظ، توليد التقارير، والتواصل مع الأولياء — كل ذلك في مكان
              واحد.
            </motion.p>

            {/* Highlights */}
            <motion.ul
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="space-y-3"
            >
              {highlights.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className="flex items-center gap-3 text-gray-700 font-medium"
                >
                  <CheckCircle className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
                  {item}
                </motion.li>
              ))}
            </motion.ul>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-wrap gap-4 pt-2"
            >
              <Link href="/register" className="btn-primary text-base">
                ابدأ مجاناً الآن
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Link href="/#features" className="btn-secondary text-base">
                <Play className="w-4 h-4 fill-current text-[var(--color-primary)]" />
                اكتشف الميزات
              </Link>
            </motion.div>

            {/* Trust badge */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-xs text-gray-400 font-medium"
            >
              ✦ لا يلزم بطاقة ائتمان • مجاني للبدء • إعداد في أقل من 5 دقائق
            </motion.p>
          </motion.div>

          {/* Right: Visual Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative hidden lg:flex justify-center items-center"
          >
            {/* Main Card */}
            <div className="relative w-full max-w-md">
              {/* Dashboard Preview Card */}
              <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-float">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] p-5 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm">لوحة التحكم</span>
                    </div>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">2026</span>
                  </div>
                  <p className="text-2xl font-black" style={{ fontFamily: "var(--font-headline)" }}>
                    مدرستنا القرآنية
                  </p>
                  <p className="text-white/70 text-xs mt-1">المدينة المنورة، السعودية</p>
                </div>

                {/* Stats Grid */}
                <div className="p-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "طالب", value: "142", color: "bg-emerald-50 text-emerald-700" },
                    { label: "معلم", value: "12", color: "bg-amber-50 text-amber-700" },
                    { label: "حلقة", value: "9", color: "bg-blue-50 text-blue-700" },
                  ].map((s, i) => (
                    <div key={i} className={`rounded-2xl p-3 text-center ${s.color}`}>
                      <p className="text-xl font-black" style={{ fontFamily: "var(--font-headline)" }}>{s.value}</p>
                      <p className="text-xs font-bold opacity-70">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Student List Preview */}
                <div className="px-4 pb-4 space-y-2">
                  {[
                    { name: "أحمد محمد السيد", progress: 85, surah: "البقرة" },
                    { name: "فاطمة علي حسن", progress: 72, surah: "آل عمران" },
                    { name: "عمر خالد رشيد", progress: 90, surah: "الكهف" },
                  ].map((student, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-2xl">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white text-xs font-bold">
                        {student.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{student.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-light)]  rounded-full"
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 shrink-0">{student.surah}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating notification card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
                className="absolute -right-12 top-12 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 w-48 animate-float-delay"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">حفظ جديد</span>
                </div>
                <p className="text-xs text-gray-500">أتمّ أحمد حفظ سورة يس 🎉</p>
              </motion.div>

              {/* Floating stat card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 }}
                className="absolute -left-10 bottom-16 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 w-40 animate-float"
              >
                <p className="text-[10px] text-gray-500 mb-1">نسبة الحضور</p>
                <p className="text-2xl font-black text-[var(--color-primary)]" style={{ fontFamily: "var(--font-headline)" }}>
                  94%
                </p>
                <p className="text-[10px] text-green-600 font-bold">↑ هذا الأسبوع</p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-20 grid grid-cols-3 gap-8 max-w-xl mr-auto"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + i * 0.1 }}
              className="text-center"
            >
              <p
                className="text-3xl font-black text-gray-900 mb-1"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
