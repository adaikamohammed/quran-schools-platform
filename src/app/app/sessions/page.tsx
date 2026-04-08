"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import { createOrUpdateSession } from "@/lib/storage/mutations";
import { surahs } from "@/lib/surahs";
import type {
  Student,
  DailySession,
  DailyRecord,
  SessionType,
  AttendanceStatus,
  PerformanceLevel,
  BehaviorLevel,
  AppUser,
} from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, Calendar, ClipboardList,
  Save, CheckCircle2, AlertTriangle, Loader2, BookOpen,
  MessageSquare, Plus, RefreshCw, ChevronDown, Users,
  Clock, X, Info,
} from "lucide-react";
import { v4 as uuid } from "uuid";

// ─── الثوابت ─────────────────────────────────────────────

const SESSION_TYPES: SessionType[] = [
  "حصة أساسية", "حصة تعويضية", "حصة أنشطة",
  "يوم عطلة", "غياب المعلم", "حصة إضافية",
];

const ATTENDANCE_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "حاضر", label: "حاضر", color: "bg-emerald-500" },
  { value: "غائب", label: "غائب", color: "bg-red-500" },
  { value: "متأخر", label: "متأخر", color: "bg-amber-500" },
  { value: "تعويض", label: "تعويض", color: "bg-blue-400" },
];

const MEMORIZATION_OPTIONS: { value: PerformanceLevel; emoji: string; color: string }[] = [
  { value: "ممتاز", emoji: "⭐⭐⭐", color: "bg-emerald-500 text-white" },
  { value: "جيد جداً", emoji: "⭐⭐", color: "bg-teal-500 text-white" },
  { value: "جيد", emoji: "⭐", color: "bg-blue-500 text-white" },
  { value: "حسن", emoji: "👍", color: "bg-sky-400 text-white" },
  { value: "متوسط", emoji: "😐", color: "bg-amber-500 text-white" },
  { value: "لم يحفظ", emoji: "❌", color: "bg-red-400 text-white" },
];

const BEHAVIOR_OPTIONS: { value: BehaviorLevel; label: string; color: string }[] = [
  { value: "هادئ", label: "هادئ 😊", color: "text-emerald-600" },
  { value: "متوسط", label: "متوسط 😐", color: "text-amber-600" },
  { value: "غير منضبط", label: "غير منضبط 😠", color: "text-red-600" },
];

// ─── مساعد التاريخ ───────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatArabicDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ar-DZ", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatHijri(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      day: "numeric", month: "long", year: "numeric",
    }).format(new Date(dateStr));
  } catch { return ""; }
}

// ─── سطر الطالب ──────────────────────────────────────────

interface StudentRowProps {
  student: Student;
  record: DailyRecord;
  onChange: (patch: Partial<DailyRecord>) => void;
  sessionSurahId?: number;
}

function StudentRow({ student, record, onChange, sessionSurahId }: StudentRowProps) {
  const isAbsent = record.attendance === "غائب";
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border-b border-gray-100 last:border-0 transition-colors ${isAbsent ? "bg-red-50/50" : "hover:bg-gray-50/50"}`}>
      {/* السطر الرئيسي */}
      <div className="flex items-center gap-2 px-4 py-3">
        {/* اسم + رقم */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white text-xs font-black shrink-0">
          {student.fullName[0]}
        </div>
        <p className="font-bold text-sm text-gray-800 flex-1 min-w-0 truncate">
          {student.fullName}
        </p>

        {/* الحضور */}
        <div className="flex gap-1 shrink-0">
          {ATTENDANCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ attendance: opt.value })}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                record.attendance === opt.value
                  ? `${opt.color} text-white shadow-sm scale-105`
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* زر إشعار الغياب عبر واتساب */}
        {isAbsent && student.phone1 && (
          <a
            href={`https://wa.me/${student.phone1.replace(/\D/g, "")}?text=${encodeURIComponent(
              `السلام عليكم ورحمة الله،\n\nنُعلمكم بغياب ابنكم/ابنتكم *${student.fullName}* عن الحصة اليوم ${new Date().toLocaleDateString("ar-DZ", { weekday: "long", day: "numeric", month: "long" })}.\n\nنرجو التواصل معنا إن كان هناك عذر.\nجزاكم الله خيراً 🌿`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            title="📱 إرسال إشعار غياب للولي عبر واتساب"
            className="w-8 h-8 rounded-xl bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-700 transition-colors shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </a>
        )}

        {/* زر التوسع */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            expanded ? "bg-[var(--color-primary)] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          } ${isAbsent ? "opacity-40 pointer-events-none" : ""}`}
          disabled={isAbsent}
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* التفاصيل */}
      <AnimatePresence>
        {expanded && !isAbsent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 bg-gray-50/80 border-t border-gray-100">

              {/* التقييم */}
              <div className="pt-3">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">تقييم التحفيظ</p>
                <div className="flex flex-wrap gap-1.5">
                  {MEMORIZATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onChange({ memorization: opt.value })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        record.memorization === opt.value
                          ? `${opt.color} shadow-sm scale-105`
                          : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {opt.emoji} {opt.value}
                    </button>
                  ))}
                  {record.memorization && (
                    <button
                      onClick={() => onChange({ memorization: null })}
                      className="px-2 py-1.5 rounded-xl text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* السورة — إذا لم تكن موحّدة على مستوى الحصة */}
              {!sessionSurahId && (
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">السورة (فردي)</p>
                  <select
                    value={record.surahId ?? ""}
                    onChange={(e) => onChange({ surahId: e.target.value ? +e.target.value : undefined })}
                    className="input-field text-sm py-2"
                  >
                    <option value="">— لا سورة محددة —</option>
                    {surahs.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.verses} آية)</option>
                    ))}
                  </select>
                  {record.surahId && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="number" min={1}
                        value={record.fromVerse ?? ""}
                        onChange={(e) => onChange({ fromVerse: +e.target.value })}
                        placeholder="من آية"
                        className="input-field py-1.5 text-sm text-center"
                      />
                      <span className="text-gray-400 self-center">→</span>
                      <input
                        type="number" min={1}
                        value={record.toVerse ?? ""}
                        onChange={(e) => onChange({ toVerse: +e.target.value })}
                        placeholder="إلى آية"
                        className="input-field py-1.5 text-sm text-center"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* المراجعة + السلوك */}
              <div className="flex gap-4 flex-wrap">
                {/* مراجعة */}
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">المراجعة</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onChange({ review: true })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        record.review === true
                          ? "bg-emerald-500 text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      ✓ تمت
                    </button>
                    <button
                      onClick={() => onChange({ review: false })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        record.review === false
                          ? "bg-red-400 text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      ✗ لم تتم
                    </button>
                  </div>
                </div>

                {/* السلوك */}
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">السلوك</p>
                  <div className="flex gap-2">
                    {BEHAVIOR_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => onChange({ behavior: record.behavior === opt.value ? "" : opt.value })}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                          record.behavior === opt.value
                            ? "bg-gray-800 text-white shadow-sm"
                            : `bg-white border border-gray-200 ${opt.color} hover:border-gray-300`
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ملاحظات */}
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">ملاحظات</p>
                <input
                  value={record.notes ?? ""}
                  onChange={(e) => onChange({ notes: e.target.value })}
                  placeholder="ملاحظة خاصة بهذا الطالب..."
                  className="w-full border border-gray-200 rounded-xl text-sm py-2 px-3 focus:outline-none focus:border-[var(--color-primary)]/50 bg-white"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── لوحة إعداد الحصة ────────────────────────────────────

interface SessionSetupProps {
  sessionType: SessionType;
  onChangeType: (t: SessionType) => void;
  surahId?: number;
  fromVerse?: number;
  toVerse?: number;
  onChangeSurah: (id?: number, from?: number, to?: number) => void;
  teacherAbsenceReason?: string;
  onChangeAbsenceReason: (r: string) => void;
}

function SessionSetup({
  sessionType, onChangeType,
  surahId, fromVerse, toVerse, onChangeSurah,
  teacherAbsenceReason, onChangeAbsenceReason,
}: SessionSetupProps) {
  const selectedSurah = surahs.find((s) => s.id === surahId);
  const isAbsence = sessionType === "غياب المعلم";
  const isHoliday = sessionType === "يوم عطلة";
  const showSurah = ["حصة أساسية", "حصة تعويضية", "حصة إضافية"].includes(sessionType);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-4">
      {/* نوع الحصة */}
      <div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">نوع الحصة</p>
        <div className="flex flex-wrap gap-1.5">
          {SESSION_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => onChangeType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                sessionType === t
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-[var(--color-primary)]/30"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* سبب الغياب */}
      {isAbsence && (
        <div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">سبب غياب المعلم</p>
          <input
            value={teacherAbsenceReason ?? ""}
            onChange={(e) => onChangeAbsenceReason(e.target.value)}
            placeholder="اكتب سبب الغياب..."
            className="input-field text-sm py-2"
          />
        </div>
      )}

      {/* السورة الموحّدة */}
      {showSurah && (
        <div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
            الورد اليومي (موحّد للجميع)
          </p>
          <select
            value={surahId ?? ""}
            onChange={(e) => onChangeSurah(e.target.value ? +e.target.value : undefined, 1, 1)}
            className="input-field text-sm py-2 mb-2"
          >
            <option value="">— اختر سورة —</option>
            {surahs.map((s) => (
              <option key={s.id} value={s.id}>{s.id}. {s.name} ({s.verses} آية)</option>
            ))}
          </select>
          {surahId && (
            <div className="flex items-center gap-2">
              <input
                type="number" min={1} max={selectedSurah?.verses}
                value={fromVerse ?? ""}
                onChange={(e) => onChangeSurah(surahId, +e.target.value, toVerse)}
                placeholder="من آية"
                className="input-field py-1.5 text-sm text-center flex-1"
              />
              <span className="text-gray-400 text-sm">←</span>
              <input
                type="number" min={1} max={selectedSurah?.verses}
                value={toVerse ?? ""}
                onChange={(e) => onChangeSurah(surahId, fromVerse, +e.target.value)}
                placeholder="إلى آية"
                className="input-field py-1.5 text-sm text-center flex-1"
              />
              {selectedSurah && (
                <span className="text-xs text-gray-400 whitespace-nowrap">/ {selectedSurah.verses}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

export default function SessionsPage() {
  const { user, school, isPrincipal } = useAuth();
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [sessionNum, setSessionNum] = useState<1 | 2>(1);
  const [students, setStudents] = useState<Student[]>([]);
  const [session, setSession] = useState<DailySession | null>(null);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // إعداد الحصة
  const [sessionType, setSessionType] = useState<SessionType>("حصة أساسية");
  const [surahId, setSurahId] = useState<number | undefined>();
  const [fromVerse, setFromVerse] = useState<number | undefined>();
  const [toVerse, setToVerse] = useState<number | undefined>();
  const [absenceReason, setAbsenceReason] = useState("");

  // ─── تحميل الطلاب + الحصة عند تغيير التاريخ أو رقم الحصة ───

  // تحميل قائمة المعلمين إذا كان المستخدم مديراً
  useEffect(() => {
    const loadTeachers = async () => {
      if (!school?.id) return;
      if (isPrincipal || user?.role === "super_admin") {
        const db = getDB();
        const schoolTeachers = await db.users.where("schoolId").equals(school.id).filter((u) => u.role === "teacher").toArray();
        schoolTeachers.sort((a,b) => a.displayName.localeCompare(b.displayName, "ar"));
        setTeachers(schoolTeachers);
        if (schoolTeachers.length > 0 && !selectedTeacherId) {
          setSelectedTeacherId(schoolTeachers[0].id);
        }
      } else {
        setSelectedTeacherId(user?.id || "");
      }
    };
    loadTeachers();
  }, [school?.id, isPrincipal, user?.role, user?.id, selectedTeacherId]);

  // ─── تحميل الطلاب + الحصة عند تغيير التاريخ أو رقم الحصة أو المعلم ───

  useEffect(() => {
    const load = async () => {
      if (!user?.id || !school?.id || !selectedTeacherId) return;
      setLoading(true);
      setSaved(false);

      const db = getDB();

      // الطلاب النشطون للمعلم
      const studs = await db.students
        .where("teacherId").equals(selectedTeacherId)
        .and((s) => s.status === "نشط")
        .toArray();
      studs.sort((a: Student, b: Student) => a.fullName.localeCompare(b.fullName, "ar"));
      setStudents(studs);

      // البحث عن حصة موجودة
      const sessionId = `${selectedTeacherId}-${selectedDate}-${sessionNum}`;
      const existingSession = await db.sessions.get(sessionId);

      if (existingSession) {
        setSession(existingSession);
        setSessionType(existingSession.sessionType);
        setSurahId(existingSession.surahId);
        setFromVerse(existingSession.fromVerse);
        setToVerse(existingSession.toVerse);
        setAbsenceReason(existingSession.teacherAbsenceReason ?? "");

        // بناء السجلات: دمج الطلاب الجدد مع السجلات الموجودة
        const existingMap = new Map(existingSession.records.map((r) => [r.studentId, r]));
        setRecords(
          studs.map((s) => existingMap.get(s.id) ?? {
            studentId: s.id,
            attendance: "" as AttendanceStatus,
            memorization: null,
            review: null,
            behavior: null,
            notes: "",
          })
        );
      } else {
        setSession(null);
        setSessionType("حصة أساسية");
        setSurahId(undefined);
        setFromVerse(undefined);
        setToVerse(undefined);
        setAbsenceReason("");
        // سجلات فارغة
        setRecords(
          studs.map((s) => ({
            studentId: s.id,
            attendance: "" as AttendanceStatus,
            memorization: null,
            review: null,
            behavior: null,
            notes: "",
          }))
        );
      }

      setLoading(false);
    };

    load();
  }, [selectedDate, sessionNum, user?.id, school?.id, selectedTeacherId]);

  // ─── تحديث سجل طالب واحد ─────────────────────────────────

  const updateRecord = useCallback((studentId: string, patch: Partial<DailyRecord>) => {
    setRecords((prev) =>
      prev.map((r) => r.studentId === studentId ? { ...r, ...patch } : r)
    );
    setSaved(false);
  }, []);

  // ─── حفظ الحصة ───────────────────────────────────────────

  const handleSave = async () => {
    if (!user?.id || !school?.id || !selectedTeacherId) return;
    setSaving(true);

    const sessionId = `${selectedTeacherId}-${selectedDate}-${sessionNum}`;

    await createOrUpdateSession({
      id: sessionId,
      schoolId: school.id,
      teacherId: selectedTeacherId,
      date: selectedDate,
      sessionNumber: sessionNum,
      sessionType,
      surahId,
      fromVerse,
      toVerse,
      teacherAbsenceReason: absenceReason,
      records: records.filter((r) => r.attendance !== ""),
    });

    setSaved(true);
    setSaving(false);

    // تحديث الجلسة المحلية
    const db = getDB();
    const updated = await db.sessions.get(sessionId);
    setSession(updated ?? null);
  };

  // ─── تقرير WhatsApp ───────────────────────────────────────

  const handleWhatsApp = () => {
    const present = students.filter((s: Student) => {
      const r = records.find((r: DailyRecord) => r.studentId === s.id);
      return r?.attendance === "حاضر" || r?.attendance === "متأخر";
    });
    const absent = students.filter((s: Student) => {
      const r = records.find((r: DailyRecord) => r.studentId === s.id);
      return r?.attendance === "غائب";
    });

    const surahName = surahs.find((s) => s.id === surahId)?.name;
    const lines: string[] = [
      `السلام عليكم ورحمة الله وبركاته`,
      `📅 ${new Date(selectedDate).toLocaleDateString("ar-DZ", { weekday: "long", day: "numeric", month: "long" })}`,
      surahName ? `📖 الورد: سورة ${surahName} (${fromVerse}-${toVerse})` : "",
      ``,
      `✅ الحاضرون (${present.length}):`,
      ...present.map((s) => {
        const r = records.find((r) => r.studentId === s.id);
        return `• ${s.fullName}${r?.memorization ? ` — ${r.memorization}` : ""}`;
      }),
    ];

    if (absent.length) {
      lines.push(``, `❌ الغائبون (${absent.length}):`, ...absent.map((s) => `• ${s.fullName}`));
    }

    navigator.clipboard.writeText(lines.filter((l) => l !== "undefined").join("\n")).catch(() => {});
    alert("تم نسخ التقرير! يمكنك لصقه في WhatsApp.");
  };

  // ─── إحصائيات سريعة ──────────────────────────────────────

  const stats = useMemo(() => {
    const filled = records.filter((r) => r.attendance !== "");
    const present = records.filter((r) => ["حاضر", "متأخر", "تعويض"].includes(r.attendance)).length;
    const absent = records.filter((r) => r.attendance === "غائب").length;
    const rate = filled.length ? Math.round((present / filled.length) * 100) : 0;
    const excellent = records.filter((r) => r.memorization === "ممتاز").length;
    return { present, absent, rate, excellent, filled: filled.length, total: records.length };
  }, [records]);

  const isHolidayOrAbsence = sessionType === "يوم عطلة" || sessionType === "غياب المعلم";
  const canSave = sessionType === "يوم عطلة" || sessionType === "غياب المعلم" || stats.filled > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* ─── رأس + تنقل التاريخ ─── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>
            الحصص اليومية
          </h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">{formatHijri(selectedDate)}</p>
        </div>

        {/* تنقل التاريخ */}
        <div className="flex items-center gap-2 bg-white border border-[var(--color-border)] rounded-2xl p-1">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* اختيار التاريخ */}
          <div className="relative flex items-center gap-2 px-3">
            <Calendar className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
            <input
              type="date"
              value={selectedDate}
              max={todayStr()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-bold text-gray-800 bg-transparent border-0 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            disabled={selectedDate >= todayStr()}
            className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setSelectedDate(todayStr())}
            disabled={selectedDate === todayStr()}
            className="px-3 h-9 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-black hover:bg-[var(--color-primary)]/20 transition-colors disabled:opacity-30"
          >
            اليوم
          </button>
        </div>
      </div>

      {/* ─── فلتر المعلم (للمدراء فقط) ─── */}
      {(isPrincipal || user?.role === "super_admin") && teachers.length > 0 && (
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <p className="text-sm font-bold text-gray-700">تصفح حصص المُعلم:</p>
          </div>
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-indigo-50 text-indigo-700 border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.displayName} ({t.groupName || "بدون فوج"})</option>
            ))}
          </select>
        </div>
      )}

      {/* ─── تاريخ الميلادي + اختيار الحصة ─── */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-base font-black text-gray-800" style={{ fontFamily: "var(--font-headline)" }}>
            {formatArabicDate(selectedDate)}
          </p>
          {session && (
            <p className="text-xs text-[var(--color-primary)] font-bold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              حصة مسجّلة — {session.sessionType}
            </p>
          )}
          {!session && !loading && (
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              لم تُسجَّل حصة لهذا اليوم بعد
            </p>
          )}
        </div>

        {/* رقم الحصة */}
        <div className="flex gap-2">
          {([1, 2] as const).map((n) => (
            <button
              key={n}
              onClick={() => setSessionNum(n)}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-sm font-black transition-all ${
                sessionNum === n
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              حصة {n === 1 ? "أولى" : "ثانية"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)] mx-auto mb-2" />
            <p className="text-sm text-gray-400 font-medium">جارٍ التحميل...</p>
          </div>
        </div>
      ) : (
        <>
          {/* ─── إعداد الحصة ─── */}
          <SessionSetup
            sessionType={sessionType}
            onChangeType={(t) => { setSessionType(t); setSaved(false); }}
            surahId={surahId}
            fromVerse={fromVerse}
            toVerse={toVerse}
            onChangeSurah={(id, from, to) => { setSurahId(id); setFromVerse(from); setToVerse(to); setSaved(false); }}
            teacherAbsenceReason={absenceReason}
            onChangeAbsenceReason={(r) => { setAbsenceReason(r); setSaved(false); }}
          />

          {/* ─── قائمة الطلاب ─── */}
          {!isHolidayOrAbsence && (
            <>
              {students.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[var(--color-border)] p-10 text-center">
                  <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">لا يوجد طلاب نشطون في مجموعتك</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
                  {/* رأس القائمة */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-[var(--color-primary)]" />
                      <p className="text-sm font-black text-gray-700">
                        قائمة الطلاب ({students.length})
                      </p>
                    </div>

                    {/* إحصائيات مصغّرة */}
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <span className="text-emerald-600">{stats.present} حاضر</span>
                      <span className="text-red-500">{stats.absent} غائب</span>
                      {stats.filled > 0 && (
                        <span className="text-gray-400">{stats.rate}%</span>
                      )}
                    </div>
                  </div>

                  {/* الطلاب */}
                  {students.map((student) => {
                    const rec = records.find((r: DailyRecord) => r.studentId === student.id) ?? {
                      studentId: student.id,
                      attendance: "" as AttendanceStatus,
                      memorization: null,
                      review: null,
                      behavior: null,
                    };
                    return (
                      <StudentRow
                        key={student.id}
                        student={student}
                        record={rec}
                        onChange={(patch) => updateRecord(student.id, patch)}
                        sessionSurahId={surahId}
                      />
                    );
                  })}

                  {/* Bar الحضور */}
                  {stats.filled > 0 && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5 font-medium">
                        <span>نسبة الحضور</span>
                        <span>{stats.present}/{stats.total}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-l from-[var(--color-primary)] to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${stats.rate}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ─── أزرار الحفظ والإجراءات ─── */}
          <div className="flex gap-3 flex-wrap">
            {/* حفظ */}
            <button
              onClick={handleSave}
              disabled={saving || !canSave}
              className="btn-primary flex-1 sm:flex-none justify-center py-3 text-sm"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الحفظ...</>
              ) : saved ? (
                <><CheckCircle2 className="w-4 h-4" /> تم الحفظ</>
              ) : (
                <><Save className="w-4 h-4" /> حفظ الحصة</>
              )}
            </button>

            {/* WhatsApp */}
            {stats.filled > 0 && (
              <button
                onClick={handleWhatsApp}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">نسخ تقرير WhatsApp</span>
                <span className="sm:hidden">WhatsApp</span>
              </button>
            )}
          </div>

          {/* تنبيه الحفظ */}
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-black text-emerald-800">تم حفظ الحصة بنجاح!</p>
                  <p className="text-xs text-emerald-600">محفوظة محلياً وستُزامَن مع السحابة قريباً</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
