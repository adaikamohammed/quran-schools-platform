"use client";

/**
 * SchoolGuard
 * ===========
 * يُستخدم لحماية الصفحات التي تعتمد على `schoolId`.
 * إذا كان المستخدم `super_admin` (بدون مدرسة)، يُعرض له تنبيه بدلاً من الصفحة.
 * 
 * الاستخدام:
 *   <SchoolGuard>
 *     <YourPageContent />
 *   </SchoolGuard>
 */

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Building2 } from "lucide-react";

interface SchoolGuardProps {
  children: React.ReactNode;
}

export default function SchoolGuard({ children }: SchoolGuardProps) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // مدير النظام ليس له مدرسة → لا معنى لهذه الصفحة
  if (role === "super_admin") {
    return (
      <div className="max-w-2xl mx-auto mt-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-[var(--color-border)] p-10 text-center shadow-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-2" style={{ fontFamily: "var(--font-headline)" }}>
            هذه الصفحة خاصة بالمدارس
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            بما أنك مدير النظام، فأنت لا تنتمي لمدرسة بعينها.
            <br />
            هذه الصفحة متاحة فقط لمدراء ومعلمي المدارس المسجلة.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/app"
              className="btn-primary px-6 py-2.5 text-sm inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة للوحة المنصة
            </Link>
            <Link
              href="/app/schools-admin"
              className="border border-gray-200 rounded-2xl px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              عرض المدارس المسجلة
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
