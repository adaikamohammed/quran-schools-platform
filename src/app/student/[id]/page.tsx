"use client";

/**
 * صفحة متابعة الطالب العامة — لأولياء الأمور
 * ─────────────────────────────────────────────
 * لا تحتاج حساباً. المعلم يرسل الرابط عبر واتساب:
 *   https://yourapp.com/student/STUDENT_ID
 *
 * الحماية: ولي الأمر يُدخل رقم هاتفه — إذا طابق أحد
 * أرقام هواتف الولي المسجّلة، يُمنح الوصول لمدة 30 يوماً
 * (محفوظ في localStorage — بدون سيرفر).
 */

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { getDB } from "@/lib/storage/db";
import type { Student, DailySession, SurahProgress } from "@/lib/types";
import { surahs } from "@/lib/surahs";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Phone, CheckCircle2, AlertTriangle,
  Loader2, KeyRound, Star, Calendar, Users2, BookCheck,
  Shield,
} from "lucide-react";

// ─── مفتاح التحقق المحفوظ (localStorage) ─────────────────

function verifyKey(studentId: string) {
  return `qsp-parent-verified-${studentId}`;
}

function isVerifiedLocally(studentId: string): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(verifyKey(studentId));
  if (!raw) return false;
  try {
    const { ts } = JSON.parse(raw);
    return Date.now() - ts < 30 * 24 * 60 * 60 * 1000; // 30 يوماً
  } catch { return false; }
}

function saveVerification(studentId: string) {
  localStorage.setItem(verifyKey(studentId), JSON.stringify({ ts: Date.now() }));
}

// ─── مكون: شاشة التحقق ───────────────────────────────────

function PhoneVerification({
  student,
  onVerified,
}: {
  student: Student;
  onVerified: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleVerify = () => {
    setChecking(true);
    setError("");
    const clean = (n: string) => n.replace(/\s+/g, "").replace(/^00/, "+");
    const input = clean(phone);
    const p1 = clean(student.phone1 ?? "");
    const p2 = clean(student.phone2 ?? "");

    if (input && (input === p1 || input === p2)) {
      saveVerification(student.id);
      onVerified();
    } else {
      setError("الرقم غير صحيح. تأكد من الرقم المسجّل في المدرسة.");
    }
    setChecking(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-1" style={{ fontFamily: "var(--font-headline)" }}>
            بوابة ولي الأمر
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            لعرض بيانات <strong className="text-gray-800">{student.fullName}</strong>،
            أدخل رقم هاتف ولي الأمر المسجّل في المدرسة للتحقق.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              رقم هاتف ولي الأمر
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleVerify()}
              placeholder="0612345678 أو +213612345678"
              dir="ltr"
              className="w-full h-11 border-2 border-gray-100 rounded-xl px-4 text-sm text-center focus:outline-none focus:border-[var(--color-primary)]/50 transition-all"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleVerify}
            disabled={checking || !phone.trim()}
            className="w-full h-11 bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            تحقق وعرض البيانات
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed">
          🔒 هذا الرابط خاص بك. لا تشاركه مع غيرك.
          <br />
          التحقق يُحفظ لمدة 30 يوماً على هذا الجهاز.
        </p>
      </motion.div>
    </div>
  );
}

// ─── مكون: بيانات الطالب ─────────────────────────────────

function StudentView({ student, sessions, surahProgress }: {
  student: Student;
  sessions: DailySession[];
  surahProgress: SurahProgress[];
}) {
  const records = useMemo(() =>
    sessions.flatMap(s => s.records.filter(r => r.studentId === student.id)),
  [sessions, student.id]);

  const presentCount = records.filter(r => ["حاضر", "متأخر", "تعويض"].includes(r.attendance)).length;
  const absentCount = records.filter(r => r.attendance === "غائب").length;
  const attendanceRate = records.length ? Math.round((presentCount / records.length) * 100) : 0;

  const memorizedSurahs = surahProgress.filter(
    sp => ["تم الحفظ", "تمت المراجعة", "محفوظة", "مُتقنة"].includes(sp.status)
  );

  // نقاط بسيطة
  const PTS_ATT: Record<string, number> = { حاضر: 5, متأخر: 2, تعويض: 3, غائب: 0 };
  const PTS_EVL: Record<string, number> = { ممتاز: 10, "جيد جداً": 8, جيد: 6, حسن: 4, متوسط: 2, "لم يحفظ": 0 };
  let totalPts = 0;
  records.forEach(r => {
    totalPts += PTS_ATT[r.attendance] ?? 0;
    if (r.memorization) totalPts += PTS_EVL[r.memorization] ?? 0;
  });

  // تقييمات آخر 5 حصص
  const lastRecords = records.slice(0, 5);
  const evalSummary: Record<string, number> = {};
  lastRecords.forEach(r => {
    if (r.memorization) evalSummary[r.memorization] = (evalSummary[r.memorization] ?? 0) + 1;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-10" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-dark)] p-6 text-white">
        <div className="max-w-lg mx-auto">
          <p className="text-white/60 text-xs font-medium mb-3">بوابة ولي الأمر</p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black shrink-0" style={{ fontFamily: "var(--font-headline)" }}>
              {student.fullName[0]}
            </div>
            <div>
              <h1 className="text-xl font-black" style={{ fontFamily: "var(--font-headline)" }}>
                {student.fullName}
              </h1>
              <p className="text-white/70 text-sm">{student.groupName}</p>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full mt-1 inline-block ${
                student.status === "نشط" ? "bg-emerald-400/20 text-emerald-100" : "bg-red-400/20 text-red-200"
              }`}>
                {student.status}
              </span>
            </div>
          </div>

          {/* إحصائيات رئيسية */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/20 text-center">
            <div>
              <p className="text-2xl font-black" style={{ fontFamily: "var(--font-headline)" }}>{memorizedSurahs.length}</p>
              <p className="text-white/60 text-xs">سورة محفوظة</p>
            </div>
            <div>
              <p className="text-2xl font-black" style={{ fontFamily: "var(--font-headline)" }}>{attendanceRate}%</p>
              <p className="text-white/60 text-xs">نسبة الحضور</p>
            </div>
            <div>
              <p className="text-2xl font-black" style={{ fontFamily: "var(--font-headline)" }}>{totalPts}</p>
              <p className="text-white/60 text-xs">نقاط الدوري</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-5 space-y-4">

        {/* الحضور */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            سجل الحضور (إجمالي)
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-emerald-700" style={{ fontFamily: "var(--font-headline)" }}>{presentCount}</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">حاضر</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-red-600" style={{ fontFamily: "var(--font-headline)" }}>{absentCount}</p>
              <p className="text-[10px] text-red-500 font-medium mt-0.5">غائب</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-blue-700" style={{ fontFamily: "var(--font-headline)" }}>{sessions.length}</p>
              <p className="text-[10px] text-blue-600 font-medium mt-0.5">حصة</p>
            </div>
          </div>
          {records.length > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>نسبة الحضور</span>
                <span>{attendanceRate}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-[var(--color-primary)] to-emerald-400 rounded-full transition-all"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* آخر 7 حصص */}
        {sessions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              آخر الحصص
            </h2>
            <div className="divide-y divide-gray-50">
              {sessions.slice(0, 7).map(ses => {
                const rec = ses.records.find(r => r.studentId === student.id);
                if (!rec) return null;
                return (
                  <div key={ses.id} className="flex items-center gap-3 py-2.5">
                    <span className="text-xs text-gray-400 font-mono w-20 shrink-0">{ses.date}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      rec.attendance === "حاضر" ? "bg-emerald-100 text-emerald-700" :
                      rec.attendance === "غائب" ? "bg-red-100 text-red-600" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {rec.attendance || "—"}
                    </span>
                    {rec.memorization && (
                      <span className="text-xs text-gray-500 font-medium">{rec.memorization}</span>
                    )}
                    {rec.notes && (
                      <span className="text-xs text-gray-400 mr-auto truncate max-w-[120px]">{rec.notes}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* تقييم التحفيظ */}
        {Object.keys(evalSummary).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" />
              تقييم التحفيظ (آخر 5 حصص)
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(evalSummary).map(([e, n]) => (
                <div key={e} className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-sm font-black text-gray-800">{e}</span>
                  <span className="text-xs text-gray-400 font-bold">{n}×</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* السور المحفوظة */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BookCheck className="w-4 h-4" />
            السور المحفوظة ({memorizedSurahs.length})
          </h2>
          {memorizedSurahs.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">لم يتم تسجيل سور محفوظة بعد</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {memorizedSurahs.map(sp => (
                <span key={sp.id} className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                  {sp.surahName}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ملاحظات المعلم */}
        {student.notes && (
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
            <p className="text-xs font-black text-amber-600 uppercase tracking-wider mb-2">ملاحظات المعلم</p>
            <p className="text-sm text-amber-800 leading-relaxed">{student.notes}</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pt-3 font-medium">
          منصة المدارس القرآنية · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

export default function PublicStudentPage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [surahProgress, setSurahProgress] = useState<SurahProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const load = async () => {
      const db = getDB();
      const s = await db.students.get(id);
      if (!s) { setNotFound(true); setLoading(false); return; }
      setStudent(s);

      const [sess, surah] = await Promise.all([
        db.sessions.where("teacherId").equals(s.teacherId).toArray()
          .then(all => all.filter(ses => ses.records.some(r => r.studentId === s.id))
            .sort((a, b) => b.date.localeCompare(a.date))
          ),
        db.surahProgress.where("studentId").equals(s.id).toArray(),
      ]);

      setSessions(sess);
      setSurahProgress(surah);

      // تحقق من التحقق المحفوظ
      setVerified(isVerifiedLocally(id));
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)] mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (notFound || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6" dir="rtl">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-black text-gray-800 mb-2">رابط غير صحيح</h1>
          <p className="text-gray-500 text-sm">لا يمكن العثور على بيانات الطالب. تواصل مع المعلم للحصول على رابط صحيح.</p>
        </div>
      </div>
    );
  }

  if (!verified) {
    return (
      <PhoneVerification
        student={student}
        onVerified={() => setVerified(true)}
      />
    );
  }

  return <StudentView student={student} sessions={sessions} surahProgress={surahProgress} />;
}
