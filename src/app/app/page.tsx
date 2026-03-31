"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getStudentsBySchool } from "@/lib/storage/db";
import type { Student } from "@/lib/types";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  BookCheck,
  ClipboardList,
  TrendingUp,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  Star,
} from "lucide-react";

// ─── بطاقة الإحصاء ───────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  href,
  delay = 0,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  href: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Link
        href={href}
        className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-[var(--color-border)] hover:shadow-lg hover:border-[var(--color-primary)]/20 transition-all duration-300 group"
      >
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>
            {value}
          </p>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
        </div>
        <ArrowLeft className="w-4 h-4 text-gray-300 group-hover:text-[var(--color-primary)] group-hover:-translate-x-1 transition-all" />
      </Link>
    </motion.div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

export default function DashboardPage() {
  const { user, school } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!school?.id) return;
    getStudentsBySchool(school.id).then((data) => {
      setStudents(data);
      setLoading(false);
    });
  }, [school?.id]);

  // إحصائيات سريعة
  const activeStudents = students.filter((s) => s.status === "نشط");
  const todayKey = new Date().toISOString().slice(0, 10);

  // التاريخ الهجري (تقريبي)
  const hijriDate = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const miladiDate = new Intl.DateTimeFormat("ar-DZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const stats = [
    {
      label: "طالب نشط",
      value: loading ? "..." : activeStudents.length,
      icon: Users,
      color: "bg-gradient-to-br from-emerald-400 to-emerald-600",
      href: "/app/students",
    },
    {
      label: "حصص هذا الأسبوع",
      value: loading ? "..." : 0,
      icon: ClipboardList,
      color: "bg-gradient-to-br from-blue-400 to-blue-600",
      href: "/app/sessions",
    },
    {
      label: "سور مكتملة (المجموع)",
      value: loading ? "..." : activeStudents.reduce((s, st) => s + (st.memorizedSurahsCount ?? 0), 0),
      icon: BookCheck,
      color: "bg-gradient-to-br from-amber-400 to-amber-600",
      href: "/app/quran",
    },
    {
      label: "نسبة الحضور الأسبوعي",
      value: "—",
      icon: TrendingUp,
      color: "bg-gradient-to-br from-purple-400 to-purple-600",
      href: "/app/reports",
    },
  ];

  // بطاقات الإجراءات السريعة
  const quickActions = [
    {
      label: "تسجيل حصة اليوم",
      desc: "ابدأ تسجيل الحضور والتحفيظ",
      icon: ClipboardList,
      href: "/app/sessions",
      color: "from-[var(--color-primary)] to-[var(--color-primary-dark)]",
    },
    {
      label: "إضافة طالب جديد",
      desc: "تسجيل طالب في المجموعة",
      icon: Users,
      href: "/app/students",
      color: "from-blue-500 to-blue-700",
    },
    {
      label: "متابعة الحفظ",
      desc: "تحديث خريطة السور",
      icon: BookOpen,
      href: "/app/quran",
      color: "from-amber-500 to-amber-700",
    },
    {
      label: "التقرير اليومي",
      desc: "كتابة ملاحظات اليوم",
      icon: Star,
      href: "/app/reports",
      color: "from-purple-500 to-purple-700",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-3xl p-6 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 islamic-pattern opacity-10" />
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium mb-1">{miladiDate}</p>
          <h2
            className="text-2xl font-black mb-1"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            أهلاً وسهلاً، {user?.displayName?.split(" ")[0] ?? "المعلم"} 👋
          </h2>
          <p className="text-white/75 text-sm">{school?.name}</p>
          <div className="mt-4 flex items-center gap-2 text-white/60 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>{hijriDate}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div>
        <h3
          className="text-sm font-black text-gray-500 uppercase tracking-wider mb-4"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          نظرة سريعة
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} delay={i * 0.08} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3
          className="text-sm font-black text-gray-500 uppercase tracking-wider mb-4"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          إجراءات سريعة
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.07 }}
            >
              <Link
                href={action.href}
                className="flex flex-col items-center text-center p-5 bg-white rounded-2xl border border-[var(--color-border)] hover:shadow-lg hover:border-[var(--color-primary)]/20 transition-all duration-300 group h-full"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <p
                  className="text-sm font-black text-gray-800 mb-1"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  {action.label}
                </p>
                <p className="text-xs text-gray-400 font-medium">{action.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Empty / First Use Banner */}
      {!loading && students.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4"
        >
          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p
              className="font-black text-amber-800 mb-1"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              لا يوجد طلاب مسجّلون بعد
            </p>
            <p className="text-amber-700 text-sm mb-3">
              ابدأ بإضافة طلابك لتتمكن من تسجيل الحصص ومتابعة الحفظ.
            </p>
            <Link
              href="/app/students"
              className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:text-amber-900 transition-colors"
            >
              إضافة أول طالب
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* Recent Students (if any) */}
      {!loading && students.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-sm font-black text-gray-500 uppercase tracking-wider"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              آخر الطلاب
            </h3>
            <Link
              href="/app/students"
              className="text-sm font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
            >
              عرض الكل
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-[var(--color-border)] divide-y divide-gray-50">
            {activeStudents.slice(0, 5).map((student, i) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.06 }}
                className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white font-black text-sm shrink-0">
                  {student.fullName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{student.fullName}</p>
                  <p className="text-xs text-gray-400">{student.groupName} · {student.memorizedSurahsCount} سورة محفوظة</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  student.status === "نشط"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}>
                  {student.status}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
