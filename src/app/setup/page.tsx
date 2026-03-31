"use client";

import { useState } from "react";
import { getDB } from "@/lib/storage/db";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import type { School, AppUser } from "@/lib/types";

// ─── صفحة الإعداد الأولي (Demo Seed) ─────────────────────
// هذه الصفحة مؤقتة للتطوير — ستُزال في الإنتاج
// تُستخدم لإنشاء بيانات تجريبية في IndexedDB

export default function SetupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSeed = async () => {
    setStatus("loading");
    setMessage("جارٍ إنشاء البيانات التجريبية...");

    try {
      const db = getDB();

      // 1. المدرسة
      const school: School = {
        id: "school-demo-001",
        name: "مدرسة النور القرآنية",
        city: "الوادي",
        country: "الجزائر",
        directorName: "الأستاذ محمد أمين",
        email: "admin@nour-school.dz",
        phone: "+213 6 XX XX XX XX",
        seasonStartDate: "2025-09-01",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {
          prices: {
            renewal: { "فئة الأكابر": 2000, "فئة الأصاغر": 1500 },
          },
          points: {
            attendance: { "حاضر": 1, "متأخر": 0.5, "تعويض": 0.5, "غائب": -1 },
            evaluation: { "ممتاز": 5, "جيد جداً": 4, "جيد": 3, "متوسط": 1, "لم يحفظ": 0 },
            behavior: { "هادئ": 1, "متوسط": 0, "غير منضبط": -1 },
            review: { completed: 2 },
            surah: { memorized: 10, mastered: 15 },
            covenantCompleted: 5,
          },
          rewards: [],
          badges: [],
        },
      };
      await db.schools.put(school);

      // 2. مدير النظام
      const admin: AppUser = {
        id: "user-admin-001",
        schoolId: "school-demo-001",
        email: "admin@nour-school.dz",
        passwordHash: "admin123", // للتطوير فقط
        displayName: "محمد أمين بلعيد",
        role: "super_admin",
        phone: "+213 6 00 00 00 00",
        gender: "ذكر",
        joinDate: "2025-09-01",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.users.put(admin);

      // 3. معلم
      const teacher: AppUser = {
        id: "user-teacher-001",
        schoolId: "school-demo-001",
        email: "sheikh@nour-school.dz",
        passwordHash: "teacher123",
        displayName: "الشيخ خالد رشيد",
        role: "teacher",
        groupName: "فوج النور",
        phone: "+213 6 00 00 00 01",
        gender: "ذكر",
        joinDate: "2025-09-01",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.users.put(teacher);

      // 4. بعض الطلاب التجريبيين
      const studentsData = [
        { name: "أحمد محمد بن يوسف", surahs: 18 },
        { name: "فاطمة الزهراء حمدي", surahs: 22, gender: "أنثى" as const },
        { name: "عبد الرحمن كريم", surahs: 15 },
        { name: "مريم بوبكر", surahs: 30, gender: "أنثى" as const },
        { name: "يوسف الأمين سعد", surahs: 10 },
      ];

      for (let i = 0; i < studentsData.length; i++) {
        const s = studentsData[i];
        await db.students.put({
          id: `student-demo-00${i + 1}`,
          schoolId: "school-demo-001",
          teacherId: "user-teacher-001",
          groupName: "فوج النور",
          fullName: s.name,
          gender: s.gender ?? "ذكر",
          birthDate: "2012-01-01",
          educationalLevel: "ابتدائي",
          guardianName: "ولي أمر تجريبي",
          phone1: "+213 6 00 00 00 0" + i,
          registrationDate: "2025-09-01",
          status: "نشط",
          subscriptionTier: "فئة الأصاغر",
          memorizedSurahsCount: s.surahs,
          dailyMemorizationAmount: "ربع",
          covenants: [],
          expulsionHistory: [],
          transferHistory: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      setStatus("done");
      setMessage("✓ تم إنشاء البيانات التجريبية بنجاح!");

      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setStatus("error");
      setMessage(`حدث خطأ: ${err.message}`);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-950 relative overflow-hidden"
      dir="rtl"
    >
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[var(--color-primary)]/15 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center mx-auto mb-6 shadow-xl">
            <BookOpen className="w-8 h-8 text-white" />
          </div>

          <h1
            className="text-2xl font-black text-white mb-2"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            الإعداد الأولي للنظام
          </h1>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            هذه الصفحة مخصصة للتطوير فقط. ستُنشئ بيانات تجريبية (مدرسة + مستخدمين + طلاب) في قاعدة البيانات المحلية.
          </p>

          {/* Credentials info */}
          <div className="bg-white/5 rounded-2xl p-4 mb-6 text-right space-y-2">
            <p className="text-xs font-black text-gray-500 mb-3">بيانات الدخول التجريبية:</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">المدير:</span>
              <span className="text-white font-mono text-xs">admin@nour-school.dz / admin123</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">المعلم:</span>
              <span className="text-white font-mono text-xs">sheikh@nour-school.dz / teacher123</span>
            </div>
          </div>

          {/* Status message */}
          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-sm font-medium ${
              status === "done"
                ? "bg-emerald-500/15 text-emerald-400"
                : status === "error"
                ? "bg-red-500/15 text-red-400"
                : "bg-blue-500/15 text-blue-400"
            }`}>
              {status === "done" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {status === "error" && <AlertTriangle className="w-4 h-4 shrink-0" />}
              {status === "loading" && <Loader2 className="w-4 h-4 shrink-0 animate-spin" />}
              {message}
            </div>
          )}

          {/* Button */}
          <button
            onClick={handleSeed}
            disabled={status === "loading" || status === "done"}
            className="w-full py-3.5 rounded-xl bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white font-bold text-base disabled:opacity-60 transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            {status === "loading" && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === "done" ? "تم! جارٍ التوجيه..." : "إنشاء البيانات التجريبية"}
          </button>
        </div>
      </div>
    </div>
  );
}
