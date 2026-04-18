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
import type { Student, DailySession, SurahProgress, TimetableEntry } from "@/lib/types";
import { surahs } from "@/lib/surahs";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Phone, CheckCircle2, AlertTriangle,
  Loader2, KeyRound, Star, Calendar, Users2, BookCheck,
  Shield, MessageCircle, Map, Grid, CheckCircle, Clock
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

function StudentView({ student, sessions, surahProgress, timetable }: {
  student: Student;
  sessions: DailySession[];
  surahProgress: SurahProgress[];
  timetable: TimetableEntry[];
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

  // 1. رسالة المعلم الحديثة وتحدي المنزل
  const latestSession = sessions.length > 0 ? sessions[0] : null; // Already sorted
  const latestRecord = latestSession ? latestSession.records.find(r => r.studentId === student.id) : null;
  const homeChallenge = latestRecord?.notes?.match(/(مراجعة|تحدي|واجب|حفظ)/) ? latestRecord.notes : null;

  // 2. خريطة الحضور لآخر 30 حصة
  const last30Sessions = sessions.slice(0, 30).slice().reverse();

  // 3. شجرة جزء عم
  const juzAmmaSurahs = [1, ...Array.from({length: 37}, (_, i) => 114 - i)];
  const getSurahStatus = (id: number) => surahProgress.find(s => s.surahId === id)?.status || 'غير محفوظة';
  const getSurahColor = (status: string) => {
    if (["تم الحفظ", "تمت المراجعة", "محفوظة", "مُتقنة"].includes(status)) return 'bg-emerald-500 border-emerald-600 text-white';
    if (["قيد الحفظ", "إعادة حفظ"].includes(status)) return 'bg-amber-400 border-amber-500 text-white';
    return 'bg-gray-100 border-gray-200 text-gray-500';
  };

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

        {/* 1. رسالة المعلم وملاحظة اليوم */}
        {latestRecord && (latestRecord.notes || latestRecord.memorization) && (
          <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-black text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              رسالة اليوم من الشيخ
              {latestSession && <span className="text-[10px] font-medium text-blue-600 mr-auto bg-blue-100/50 px-2 py-0.5 rounded-full">{latestSession.date}</span>}
            </h2>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100/50">
              {latestRecord.notes && (
                <p className="text-sm text-gray-700 leading-relaxed font-medium mb-3">"{latestRecord.notes}"</p>
              )}
              {latestRecord.memorization && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">تقييم التحفيظ:</span>
                  <span className="font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">{latestRecord.memorization}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 4. تحدي المنزل */}
        {homeChallenge && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5 shadow-sm">
            <h2 className="text-sm font-black text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Star className="w-4 h-4" />
              مهمة المنزل
            </h2>
            <p className="text-sm text-amber-900 leading-relaxed font-bold mb-4">
              "{homeChallenge}"
            </p>
            <button
              onClick={(e) => {
                const btn = e.currentTarget;
                btn.innerHTML = '<span class="flex items-center gap-2 justify-center"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg> تم إنجاز المهمة بنجاح!</span>';
                btn.className = "w-full h-11 bg-emerald-500 text-white font-bold rounded-xl transition-colors cursor-default";
                btn.disabled = true;
              }}
              className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              تأكيد إنجاز المهمة
            </button>
          </div>
        )}

        {/* 3. سجل الحضور ورسم بياني لآخر 30 حصة */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            الحضور آخر 30 حصة
          </h2>
          {last30Sessions.length > 0 ? (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-emerald-700" style={{ fontFamily: "var(--font-headline)" }}>{presentCount}</p>
                  <p className="text-[10px] text-emerald-600 font-medium mt-0.5">إجمالي الحضور</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-red-600" style={{ fontFamily: "var(--font-headline)" }}>{absentCount}</p>
                  <p className="text-[10px] text-red-500 font-medium mt-0.5">إجمالي الغياب</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-3">
                <span>خريطة الحضور</span>
                <span>{attendanceRate}%</span>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex flex-wrap gap-1.5" dir="ltr">
                {last30Sessions.map(ses => {
                  const rec = ses.records.find(r => r.studentId === student.id);
                  const isPresent = rec && ["حاضر", "متأخر", "تعويض"].includes(rec.attendance);
                  const isAbsent  = rec?.attendance === "غائب";
                  const bg = isPresent ? 'bg-emerald-500' : isAbsent ? 'bg-red-500' : 'bg-gray-200';
                  return (
                    <div key={ses.id} title={`${ses.date}: ${rec?.attendance || "غير مسجل"}`} className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md ${bg} shadow-sm transition-transform hover:scale-110`} />
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400 py-4">لم يتم تسجيل حصص بعد.</p>
          )}
        </div>

        {/* 2. شجرة الحفظ المرئية (جزء عم والفاتحة) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Map className="w-4 h-4" />
            شجرة الحفظ المرئية
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {juzAmmaSurahs.map(id => {
              const surah = surahs.find(s => s.id === id);
              if (!surah) return null;
              const status = getSurahStatus(id);
              return (
                <div key={id} title={`${surah.name} : ${status}`} className={`flex flex-col items-center justify-center p-2 rounded-xl border ${getSurahColor(status)} transition-colors duration-300`}>
                  <span className="text-[10px] sm:text-xs font-bold leading-tight truncate w-full text-center">{surah.name}</span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-5 pt-4 border-t border-gray-50 text-[10px] sm:text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600"/>محفوظة متقنة</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500"/>قيد الحفظ</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-200"/>لم تحفظ بعد</div>
          </div>
        </div>

        {/* جدول الحصص */}
        {timetable.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              أوقات دوام الفوج
            </h2>
            <div className="space-y-2">
              {timetable.map(entry => (
                <div key={entry.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100"
                  style={{ borderRightWidth: 3, borderRightColor: entry.color || '#3b82f6' }}>
                  <div>
                    <p className="text-sm font-black text-gray-800">{entry.dayOfWeek}</p>
                    {entry.subject && <p className="text-xs text-gray-500">{entry.subject}</p>}
                  </div>
                  <div className="mr-auto flex items-center gap-1.5 text-sm font-bold text-gray-700" dir="ltr">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {entry.startTime} — {entry.endTime}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ملاحظات عامة ثابتة للمعلم */}
        {student.notes && (
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">ملاحظة عامة عن الطالب</p>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">{student.notes}</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pt-3 font-medium">
          منصة فرسان القرآن · {new Date().getFullYear()}
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
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const load = async () => {
      const db = getDB();
      const s = await db.students.get(id);
      if (!s) { setNotFound(true); setLoading(false); return; }
      setStudent(s);

      const [sess, surah, tmt] = await Promise.all([
        db.sessions.where("teacherId").equals(s.teacherId).toArray()
          .then(all => all.filter(ses => ses.records.some(r => r.studentId === s.id))
            .sort((a, b) => b.date.localeCompare(a.date))
          ),
        db.surahProgress.where("studentId").equals(s.id).toArray(),
        db.timetables.where("groupName").equals(s.groupName).toArray()
          .then(entries => entries.sort((a, b) => {
            const days = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
            return days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek);
          })),
      ]);

      setSessions(sess);
      setSurahProgress(surah);
      setTimetable(tmt);

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

  return <StudentView student={student} sessions={sessions} surahProgress={surahProgress} timetable={timetable} />;
}
