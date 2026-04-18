"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import type { Student, DailySession, Payment } from "@/lib/types";
import { motion } from "framer-motion";
import {
  BookOpen, Users, Star, DollarSign, LogOut,
  CheckCircle2, Clock, AlertTriangle, Calendar,
} from "lucide-react";

export default function ParentPortalPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState<Student[]>([]);
  const [sessionsByChild, setSessionsByChild] = useState<Record<string, DailySession[]>>({});
  const [paymentsByChild, setPaymentsByChild] = useState<Record<string, Payment[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // للوصول لهذه الصفحة يجب أن يكون دور المستخدم "parent"
    if (user.role !== "parent") {
      router.replace("/app");
      return;
    }
    const load = async () => {
      const db = getDB();
      const ids = user.studentIds ?? [];
      if (ids.length === 0) { setLoading(false); return; }

      const kids = await db.students.where("id").anyOf(ids).toArray();
      setChildren(kids);

      const sessMap: Record<string, DailySession[]> = {};
      const payMap: Record<string, Payment[]> = {};

      for (const kid of kids) {
        const sessions = await db.sessions
          .where("teacherId").equals(kid.teacherId)
          .toArray()
          .then(all => all
            .filter(s => s.records.some(r => r.studentId === kid.id))
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 7)
          );
        sessMap[kid.id] = sessions;

        const pays = await db.payments.where("studentId").equals(kid.id).toArray();
        payMap[kid.id] = pays;
      }

      setSessionsByChild(sessMap);
      setPaymentsByChild(payMap);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 font-medium text-sm">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      {/* رأس بوابة الأولياء */}
      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-xl font-black text-gray-900">
              أهلاً، {user?.displayName?.split(" ")[0] ?? "ولي الأمر"} 👋
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">بوابة متابعة أبنائكم</p>
          </div>
          <button
            onClick={() => { logout(); router.replace("/login"); }}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button>
        </motion.div>

        {children.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-10 text-center">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">
              لم يتم ربط أي طالب بحسابكم بعد.
            </p>
            <p className="text-gray-400 text-sm mt-1">تواصلوا مع إدارة المدرسة لتفعيل المتابعة.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {children.map((child, i) => {
              const sessions = sessionsByChild[child.id] ?? [];
              const payments = paymentsByChild[child.id] ?? [];

              const allRecords = sessions.flatMap(s => s.records.filter(r => r.studentId === child.id));
              const presentCount = allRecords.filter(r => ["حاضر", "متأخر", "تعويض"].includes(r.attendance)).length;
              const absentCount = allRecords.filter(r => r.attendance === "غائب").length;

              const unpaidCount = payments.filter(p => p.status === "unpaid").length;

              return (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-3xl border border-[var(--color-border)] overflow-hidden shadow-sm"
                >
                  {/* هوية الطالب */}
                  <div className="bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-dark)] p-5 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-black">
                        {child.fullName[0]}
                      </div>
                      <div>
                        <h2 className="text-lg font-black">{child.fullName}</h2>
                        <p className="text-white/70 text-sm">{child.groupName}</p>
                      </div>
                      <span className={`mr-auto text-xs font-bold px-2.5 py-1 rounded-full ${
                        child.status === "نشط" ? "bg-emerald-400/20 text-emerald-100" : "bg-red-400/20 text-red-200"
                      }`}>
                        {child.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* إحصائيات الأسبوع */}
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        آخر 7 أيام
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-emerald-50 rounded-xl p-3 text-center">
                          <p className="text-xl font-black text-emerald-700">{presentCount}</p>
                          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">حاضر</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-3 text-center">
                          <p className="text-xl font-black text-red-600">{absentCount}</p>
                          <p className="text-[10px] text-red-500 font-medium mt-0.5">غائب</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-3 text-center">
                          <p className="text-xl font-black text-amber-700">{child.memorizedSurahsCount}</p>
                          <p className="text-[10px] text-amber-600 font-medium mt-0.5">سورة</p>
                        </div>
                      </div>
                    </div>

                    {/* آخر حصص (آخر 5) */}
                    {sessions.length > 0 && (
                      <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          سجل الحصص الأخيرة
                        </p>
                        <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 overflow-hidden">
                          {sessions.slice(0, 5).map(ses => {
                            const rec = ses.records.find(r => r.studentId === child.id);
                            if (!rec) return null;
                            return (
                              <div key={ses.id} className="flex items-center gap-3 px-3 py-2.5">
                                <span className="text-xs text-gray-400 font-mono w-20 shrink-0">{ses.date}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  rec.attendance === "حاضر" ? "bg-emerald-100 text-emerald-700" :
                                  rec.attendance === "غائب" ? "bg-red-100 text-red-600" :
                                  "bg-amber-100 text-amber-700"
                                }`}>
                                  {rec.attendance || "—"}
                                </span>
                                {rec.memorization && (
                                  <span className="text-xs text-gray-500 font-medium">{rec.memorization}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* الاشتراكات */}
                    {unpaidCount > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-black text-amber-800">
                            اشتراكات غير مسددة ({unpaidCount})
                          </p>
                          <p className="text-xs text-amber-600 mt-0.5">
                            يرجى مراجعة إدارة المدرسة لتسوية الاشتراكات.
                          </p>
                        </div>
                      </div>
                    )}
                    {unpaidCount === 0 && payments.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-emerald-600 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        جميع الاشتراكات مسددة ✅
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* تذييل */}
        <p className="text-center text-xs text-gray-300 mt-8 font-medium">
          منصة فرسان القرآن · للتواصل راجع إدارة المدرسة
        </p>
      </div>
    </div>
  );
}
