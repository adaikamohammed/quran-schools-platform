"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDB } from "@/lib/storage/db";
import type { Student, DailySession, SurahProgress } from "@/lib/types";
import { ArrowRight, Printer, BookOpen, Users, CheckCircle2 } from "lucide-react";

// ─── حساب نقاط الطالب ─────────────────────────────────────

const PTS = {
  attendance: { حاضر: 5, متأخر: 2, تعويض: 3, غائب: 0 },
  evaluation: { ممتاز: 10, "جيد جداً": 8, جيد: 6, حسن: 4, متوسط: 2, "لم يحفظ": 0 },
  behavior: { هادئ: 3, متوسط: 1, "غير منضبط": -2 },
};

export default function StudentReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [surahProgress, setSurahProgress] = useState<SurahProgress[]>([]);
  const [schoolName, setSchoolName] = useState<string>("");
  const [teacherName, setTeacherName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const db = getDB();
      const s = await db.students.get(id);
      if (!s) { router.replace("/app/students"); return; }
      setStudent(s);

      const [sess, surah, teacher, school] = await Promise.all([
        db.sessions.where("teacherId").equals(s.teacherId).toArray()
          .then(all => all.filter(ses => ses.records.some(r => r.studentId === s.id))),
        db.surahProgress.where("studentId").equals(s.id).toArray(),
        db.users.get(s.teacherId),
        db.schools.where("id").equals(s.schoolId).first(),
      ]);

      setSessions(sess.sort((a, b) => b.date.localeCompare(a.date)));
      setSurahProgress(surah);
      setTeacherName(teacher?.displayName ?? "");
      setSchoolName(school?.name ?? "");
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8 animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!student) return null;

  // ─── إحصائيات الحضور ─────────────────────────────────────
  const studentRecords = sessions.flatMap(s => s.records.filter(r => r.studentId === student.id));
  const presentCount = studentRecords.filter(r => ["حاضر", "متأخر", "تعويض"].includes(r.attendance)).length;
  const absentCount = studentRecords.filter(r => r.attendance === "غائب").length;
  const attendanceRate = studentRecords.length ? Math.round((presentCount / studentRecords.length) * 100) : 0;

  // ─── إحصائيات التقييم (آخر 4 أسابيع) ───────────────────
  const recentSessions = sessions.slice(0, 8);
  const evalCounts: Record<string, number> = {};
  recentSessions.forEach(ses => {
    const rec = ses.records.find(r => r.studentId === student.id);
    if (rec?.memorization) {
      evalCounts[rec.memorization] = (evalCounts[rec.memorization] ?? 0) + 1;
    }
  });

  // ─── النقاط ──────────────────────────────────────────────
  let total = 0;
  studentRecords.forEach(rec => {
    if (rec.attendance in PTS.attendance) total += PTS.attendance[rec.attendance as keyof typeof PTS.attendance] ?? 0;
    if (rec.memorization && rec.memorization in PTS.evaluation) total += PTS.evaluation[rec.memorization as keyof typeof PTS.evaluation] ?? 0;
    if (rec.behavior && rec.behavior in PTS.behavior) total += PTS.behavior[rec.behavior as keyof typeof PTS.behavior] ?? 0;
  });

  const memorizedCount = surahProgress.filter(sp => sp.status === "تم الحفظ" || sp.status === "تمت المراجعة" || sp.status === "محفوظة" || sp.status === "مُتقنة").length;

  return (
    <>
      {/* أزرار التحكم — تُخفى عند الطباعة */}
      <div className="max-w-2xl mx-auto mb-4 flex gap-3 print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة
        </button>
        <div className="flex-1" />
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <Printer className="w-4 h-4" />
          طباعة / حفظ PDF
        </button>
      </div>

      {/* ─── التقرير القابل للطباعة ─── */}
      <div
        id="student-report"
        className="max-w-2xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-sm p-8 print:shadow-none print:border-0 print:rounded-none print:p-6"
        style={{ direction: "rtl" }}
      >
        {/* رأس التقرير */}
        <div className="text-center border-b border-gray-100 pb-6 mb-6">
          <p className="text-xs text-gray-400 font-medium mb-1">{schoolName}</p>
          <h1 className="text-2xl font-black text-gray-900 mb-1" style={{ fontFamily: "var(--font-headline)" }}>
            تقرير أداء الطالب
          </h1>
          <p className="text-sm text-gray-500">
            صادر بتاريخ: {new Date().toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* هوية الطالب */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white text-2xl font-black shrink-0" style={{ fontFamily: "var(--font-headline)" }}>
            {student.fullName[0]}
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>
              {student.fullName}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {student.groupName}
              {teacherName && ` · المعلم: ${teacherName}`}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {student.subscriptionTier} · {student.status}
            </p>
          </div>
        </div>

        {/* ─── إحصائيات الحضور ─── */}
        <section className="mb-6">
          <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            الحضور والغياب
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "إجمالي الحصص", value: studentRecords.length, color: "bg-gray-50 text-gray-700" },
              { label: "حاضر", value: presentCount, color: "bg-emerald-50 text-emerald-700" },
              { label: "غائب", value: absentCount, color: "bg-red-50 text-red-700" },
              { label: "نسبة الحضور", value: `${attendanceRate}%`, color: "bg-blue-50 text-blue-700" },
            ].map(({ label, value, color }) => (
              <div key={label} className={`${color} rounded-2xl p-3 text-center`}>
                <p className="text-xl font-black" style={{ fontFamily: "var(--font-headline)" }}>{value}</p>
                <p className="text-[10px] font-medium opacity-70 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── تقييم التحفيظ (آخر جلسات) ─── */}
        {Object.keys(evalCounts).length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              تقييم التحفيظ (آخر 8 حصص)
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(evalCounts).map(([eval_, count]) => (
                <div key={eval_} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                  <span className="text-sm font-black text-gray-800">{eval_}</span>
                  <span className="text-xs font-bold bg-white text-gray-500 px-2 py-0.5 rounded-full shadow-sm">{count} مرة</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── السور المحفوظة ─── */}
        <section className="mb-6">
          <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            الحفظ
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-emerald-700" style={{ fontFamily: "var(--font-headline)" }}>
                {memorizedCount}
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1">سورة محفوظة</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-amber-700" style={{ fontFamily: "var(--font-headline)" }}>
                {total}
              </p>
              <p className="text-xs text-amber-600 font-medium mt-1">
                نقطة في الدوري
              </p>
            </div>
          </div>
          {/* سرد السور المحفوظة */}
          {memorizedCount > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {surahProgress
                .filter(sp => ["تم الحفظ", "تمت المراجعة", "محفوظة", "مُتقنة"].includes(sp.status))
                .map(sp => (
                  <span key={sp.id} className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                    {sp.surahName}
                  </span>
                ))
              }
            </div>
          )}
        </section>

        {/* ملاحظات المعلم */}
        {student.notes && (
          <section className="mb-6">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3">ملاحظات المعلم</h3>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-2xl p-4 leading-relaxed">{student.notes}</p>
          </section>
        )}

        {/* توقيع */}
        <div className="border-t border-gray-100 pt-5 flex justify-between items-end text-xs text-gray-400">
          <div>
            <p className="font-bold text-gray-600 mb-4">توقيع المعلم</p>
            <div className="border-b border-gray-300 w-32" />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-600 mb-4">توقيع مدير المدرسة</p>
            <div className="border-b border-gray-300 w-32" />
          </div>
          <div className="text-left">
            <p>{schoolName}</p>
            <p className="mt-1">{new Date().toLocaleDateString("ar-DZ")}</p>
          </div>
        </div>
      </div>

      {/* CSS للطباعة */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          nav, header, .print\\:hidden { display: none !important; }
          #student-report { max-width: 100% !important; }
        }
      `}</style>
    </>
  );
}
