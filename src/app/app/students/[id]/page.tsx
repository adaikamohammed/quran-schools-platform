"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDB } from "@/lib/storage/db";
import type { Student, DailySession, SurahProgress } from "@/lib/types";
import { motion } from "framer-motion";
import {
  ArrowRight,
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
  Link as LinkIcon,
  Save,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
const MemorizationChart = dynamic(() => import("@/components/analytics/MemorizationChart"), { 
  ssr: false, 
  loading: () => <div className="h-64 w-full bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400 text-sm font-bold">جاري تحميل الرسم البياني...</div> 
});

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
  const [editingNote, setEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [analyticsView, setAnalyticsView] = useState<"velocity" | "radar" | "heatmap">("velocity");

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
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/student/${student.id}`;
                    navigator.clipboard.writeText(link);
                    alert("تم نسخ رابط بوابة ولي الأمر بنجاح!");
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-xs font-bold text-white border border-white/20"
                  title="نسخ رابط بوابة ولي الأمر"
                >
                  <LinkIcon className="w-4 h-4" />
                  رابط الولي
                </button>
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
              <h3 className="font-black text-sm text-gray-500 uppercase tracking-widest mt-6 border-t border-gray-100 pt-5">ملاحظة موجهة لولي الأمر</h3>
              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                {!editingNote ? (
                  <div>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium mb-3">
                      {student.notes || "لا توجد ملاحظة مسجلة حالياً."}
                    </p>
                    <button
                      onClick={() => { setTempNote(student.notes || ""); setEditingNote(true); }}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      {student.notes ? "تعديل الملاحظة" : "إضافة ملاحظة لولي الأمر"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={tempNote}
                      onChange={(e) => setTempNote(e.target.value)}
                      placeholder="اكتب ملاحظة لولي أمر الطالب..."
                      className="w-full h-24 rounded-lg border border-blue-200 bg-white p-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          setSavingNote(true);
                          try {
                            const db = getDB();
                            await db.students.update(student.id, { notes: tempNote });
                            setStudent({ ...student, notes: tempNote });
                            setEditingNote(false);
                          } catch (e) {
                            console.error(e);
                          } finally {
                            setSavingNote(false);
                          }
                        }}
                        disabled={savingNote}
                        className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {savingNote ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"/> : <Save className="w-3.5 h-3.5" />}
                        تحديث الملاحظة
                      </button>
                      <button
                        onClick={() => setEditingNote(false)}
                        className="text-xs font-bold text-gray-500 hover:text-gray-700 px-3 py-2"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
            <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl mb-4 w-fit mx-auto sm:mx-0">
              <button
                onClick={() => setAnalyticsView("velocity")}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${analyticsView === "velocity" ? "bg-white text-[var(--color-primary)] shadow-sm" : "text-gray-500 hover:bg-white/50"}`}
              >
                سرعة الحفظ
              </button>
              <button
                onClick={() => setAnalyticsView("radar")}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${analyticsView === "radar" ? "bg-white text-[var(--color-primary)] shadow-sm" : "text-gray-500 hover:bg-white/50"}`}
              >
                تحليل التوجهات (رادار)
              </button>
              <button
                onClick={() => setAnalyticsView("heatmap")}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${analyticsView === "heatmap" ? "bg-white text-[var(--color-primary)] shadow-sm" : "text-gray-500 hover:bg-white/50"}`}
              >
                الخريطة الحرارية
              </button>
            </div>

            {analyticsView === "velocity" && (
              <MemorizationChart studentId={student.id} sessions={sessions} />
            )}
            
            {analyticsView === "radar" && (
              <div className="bg-white rounded-2xl border border-[var(--color-border)] p-8 text-center flex flex-col items-center">
                <TargetIcon className="w-12 h-12 text-gray-200 mb-3" />
                <h3 className="font-bold text-gray-600 mb-1">تحليل التوجهات (رادار)</h3>
                <p className="text-xs text-gray-400 mb-6">قريباً: تحليل تقييم الحفظ، الحضور، والسلوك في فترات زمنية محددة.</p>
                
                <div className="flex gap-2 flex-wrap justify-center pointer-events-none opacity-50">
                   <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium border border-gray-200">الربع الأول</span>
                   <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium border border-gray-200">الربع الثاني</span>
                   <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium border border-gray-200">هذا العام</span>
                </div>
              </div>
            )}
            
            {analyticsView === "heatmap" && (
              <div className="bg-white rounded-2xl border border-[var(--color-border)] p-8 text-center flex flex-col items-center">
                <Calendar className="w-12 h-12 text-gray-200 mb-3" />
                <h3 className="font-bold text-gray-600 mb-1">الخريطة الحرارية للنشاط</h3>
                <p className="text-xs text-gray-400 mb-6">يتم دمجها من المكونات البصرية القديمة قريباً.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
