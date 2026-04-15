"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDB } from "@/lib/storage/db";
import type { Student, DailySession, SurahProgress } from "@/lib/types";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Phone,
  Calendar,
  BookOpen,
  BookCheck,
  User,
  Edit,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Star,
  TargetIcon,
  Users2,
  Printer,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import MemorizationChart from "@/components/analytics/MemorizationChart";

// ─── حساب العمر ──────────────────────────────────────────

function calcAge(birthDate: string): string {
  const diff = Date.now() - new Date(birthDate).getTime();
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return `${years} سنة`;
}

// ─── بطاقة المعلومة ───────────────────────────────────────

function InfoItem({ label, value, icon: Icon }: { label: string; value?: string; icon?: React.ElementType }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-[var(--color-primary)]" />
        </div>
      )}
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── الصفحة ───────────────────────────────────────────────

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [surahProgress, setSurahProgress] = useState<SurahProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "sessions" | "quran" | "covenants" | "analytics">("info");

  useEffect(() => {
    const load = async () => {
      const db = getDB();
      const s = await db.students.get(id);
      if (!s) { router.replace("/app/students"); return; }
      setStudent(s);

      const [sess, surah] = await Promise.all([
        db.sessions
          .where("teacherId").equals(s.teacherId)
          .toArray()
          .then((all) => all.filter((ses) =>
            ses.records.some((r) => r.studentId === s.id)
          )),
        db.surahProgress.where("studentId").equals(s.id).toArray(),
      ]);

      setSessions(sess.sort((a, b) => b.date.localeCompare(a.date)));
      setSurahProgress(surah);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-xl" />
        <div className="h-48 bg-gray-100 rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-gray-100 rounded-2xl" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!student) return null;

  const attendanceRate = (() => {
    const records = sessions.flatMap((s) =>
      s.records.filter((r) => r.studentId === student.id)
    );
    if (!records.length) return null;
    const present = records.filter((r) =>
      ["حاضر", "متأخر", "تعويض"].includes(r.attendance)
    ).length;
    return Math.round((present / records.length) * 100);
  })();

  const TABS = [
    { id: "info", label: "المعلومات" },
    { id: "sessions", label: `الحصص (${sessions.length})` },
    { id: "quran", label: `الحفظ (${surahProgress.length})` },
    { id: "covenants", label: `العهود (${student.covenants?.length ?? 0})` },
    { id: "analytics", label: "التحليلات" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* رجوع */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        العودة لقائمة الطلاب
      </button>

      {/* بطاقة الهوية */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-3xl p-6 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 islamic-pattern opacity-10" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl shrink-0 ${
            student.gender === "أنثى"
              ? "bg-white/20 border-2 border-white/30"
              : "bg-white/20 border-2 border-white/30"
          }`} style={{ fontFamily: "var(--font-headline)" }}>
            {student.fullName[0]}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-black mb-1" style={{ fontFamily: "var(--font-headline)" }}>
                  {student.fullName}
                </h1>
                <p className="text-white/70 text-sm">
                  {student.groupName} · {student.subscriptionTier}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/app/students/${student.id}/report`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-xs font-bold text-white"
                  title="طباعة تقرير الأداء"
                >
                  <Printer className="w-4 h-4" />
                  تقرير
                </Link>
                <Link
                  href={`/app/students`}
                  className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
                  title="تعديل"
                >
                  <Edit className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                student.status === "نشط"
                  ? "bg-emerald-400/20 text-emerald-100"
                  : "bg-red-400/20 text-red-200"
              }`}>
                {student.status}
              </span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/15 text-white/80">
                {student.gender}
              </span>
              {student.educationalLevel && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/15 text-white/80">
                  {student.educationalLevel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/20">
          <div className="text-center">
            <p className="text-2xl font-black" style={{ fontFamily: "var(--font-headline)" }}>
              {student.memorizedSurahsCount}
            </p>
            <p className="text-white/60 text-xs font-medium">سورة محفوظة</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black" style={{ fontFamily: "var(--font-headline)" }}>
              {sessions.length}
            </p>
            <p className="text-white/60 text-xs font-medium">حصة مسجّلة</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black" style={{ fontFamily: "var(--font-headline)" }}>
              {attendanceRate !== null ? `${attendanceRate}%` : "—"}
            </p>
            <p className="text-white/60 text-xs font-medium">نسبة الحضور</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
              activeTab === tab.id
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* المحتوى حسب التبويب */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* ─── المعلومات ─────────────────────────────────── */}
        {activeTab === "info" && (
          <div className="grid sm:grid-cols-2 gap-4">
            {/* معلومات شخصية */}
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 space-y-4">
              <h3 className="font-black text-sm text-gray-500 uppercase tracking-widest">معلومات شخصية</h3>
              <InfoItem label="الاسم الكامل" value={student.fullName} icon={User} />
              <InfoItem label="العمر" value={student.birthDate ? calcAge(student.birthDate) : undefined} icon={Calendar} />
              <InfoItem label="المستوى الدراسي" value={student.educationalLevel} icon={BookOpen} />
              <InfoItem label="كمية التحفيظ اليومي" value={student.dailyMemorizationAmount} icon={BookCheck} />
              <InfoItem label="تاريخ التسجيل" value={student.registrationDate ? new Date(student.registrationDate).toLocaleDateString("ar-DZ") : undefined} icon={Calendar} />
              {student.notes && (
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">ملاحظات</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">{student.notes}</p>
                </div>
              )}
            </div>

            {/* ولي الأمر */}
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 space-y-4">
              <h3 className="font-black text-sm text-gray-500 uppercase tracking-widest">ولي الأمر</h3>
              <InfoItem label="الاسم" value={student.guardianName} icon={Users2} />
              <InfoItem label="هاتف 1" value={student.phone1} icon={Phone} />
              {student.phone2 && <InfoItem label="هاتف 2" value={student.phone2} icon={Phone} />}

              {/* أزرار تواصل */}
              <div className="flex gap-2 pt-2">
                <a
                  href={`tel:${student.phone1}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] text-sm font-bold hover:opacity-80 transition-opacity"
                >
                  <Phone className="w-4 h-4" />
                  اتصال
                </a>
                <a
                  href={`https://wa.me/${student.phone1.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold hover:opacity-80 transition-opacity"
                >
                  واتساب
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ─── الحصص ─────────────────────────────────────── */}
        {activeTab === "sessions" && (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">لا توجد حصص مسجّلة بعد</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {sessions.slice(0, 30).map((session) => {
                  const record = session.records.find((r) => r.studentId === student.id);
                  if (!record) return null;
                  const attendanceColor =
                    record.attendance === "حاضر" ? "text-emerald-600 bg-emerald-50" :
                    record.attendance === "متأخر" ? "text-amber-600 bg-amber-50" :
                    record.attendance === "غائب" ? "text-red-500 bg-red-50" :
                    "text-gray-400 bg-gray-50";

                  return (
                    <div key={session.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                      <div className="text-xs text-gray-400 font-mono w-24 shrink-0">{session.date}</div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${attendanceColor}`}>{record.attendance || "—"}</span>
                      <span className="text-xs text-gray-500 font-medium">{record.memorization || "—"}</span>
                      {record.review && <span className="text-xs bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">مراجعة ✓</span>}
                      <span className="text-xs text-gray-400 mr-auto">{session.sessionType}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── الحفظ ─────────────────────────────────────── */}
        {activeTab === "quran" && (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
            {surahProgress.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">لم يتم تسجيل تقدم الحفظ بعد</p>
              </div>
            ) : (
              <div className="space-y-2">
                {surahProgress.map((sp) => (
                  <div key={sp.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      sp.status === "تم الحفظ" || sp.status === "تمت المراجعة" ? "bg-emerald-500" :
                      sp.status === "قيد الحفظ" ? "bg-amber-500" : "bg-gray-300"
                    }`} />
                    <span className="font-bold text-sm text-gray-800 flex-1">{sp.surahName}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      sp.status === "تم الحفظ" ? "bg-emerald-50 text-emerald-700" :
                      sp.status === "قيد الحفظ" ? "bg-amber-50 text-amber-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {sp.status}
                    </span>
                    {sp.completionDate && (
                      <span className="text-xs text-gray-400">{new Date(sp.completionDate).toLocaleDateString("ar-DZ")}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── العهود ─────────────────────────────────────── */}
        {activeTab === "covenants" && (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
            {!student.covenants?.length ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">لا توجد عهود مسجّلة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {student.covenants.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-gray-500">{c.type}</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        c.status === "نشط" ? "bg-amber-50 text-amber-700" :
                        c.status === "تم الوفاء بها" ? "bg-emerald-50 text-emerald-700" :
                        "bg-red-50 text-red-700"
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{c.text}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(c.date).toLocaleDateString("ar-DZ")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── التحليلات ──────────────────────────────────── */}
        {activeTab === "analytics" && (
          <div className="space-y-4">
            <MemorizationChart studentId={student.id} sessions={sessions} />
          </div>
        )}
      </motion.div>
    </div>
  );
}
