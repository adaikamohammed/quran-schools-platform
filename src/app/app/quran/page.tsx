"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import { createOrUpdateSurahProgress, updateStudent } from "@/lib/storage/mutations";
import { surahs } from "@/lib/surahs";
import type { Student, SurahProgress, AppUser } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, BookCheck, Search, ChevronDown,
  Star, TrendingUp, Award, CheckCircle2, Clock,
  Circle, RotateCcw, X, Users, Filter,
  ChevronRight, Info, Sparkles, Target,
} from "lucide-react";

// ─── حالة السورة ──────────────────────────────────────────

type SurahStatus = "محفوظة" | "قيد الحفظ" | "مُتقنة" | "غير محفوظة";

const STATUS_CONFIG: Record<SurahStatus, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ElementType;
}> = {
  "مُتقنة": {
    label: "مُتقنة",
    color: "text-amber-700",
    bg: "bg-amber-100",
    border: "border-amber-300",
    icon: Star,
  },
  "محفوظة": {
    label: "محفوظة",
    color: "text-emerald-700",
    bg: "bg-emerald-100",
    border: "border-emerald-300",
    icon: CheckCircle2,
  },
  "قيد الحفظ": {
    label: "قيد الحفظ",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-300",
    icon: Clock,
  },
  "غير محفوظة": {
    label: "لم تُحفظ",
    color: "text-gray-400",
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: Circle,
  },
};

// ─── مربع السورة ──────────────────────────────────────────

function SurahBox({
  surah,
  status,
  onClick,
  compact = false,
}: {
  surah: typeof surahs[number];
  status: SurahStatus;
  onClick: () => void;
  compact?: boolean;
}) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative rounded-xl border-2 transition-all duration-150 text-right group
        ${cfg.bg} ${cfg.border}
        ${compact ? "p-2" : "p-3"}
        hover:shadow-md hover:z-10
      `}
      title={`${surah.id}. ${surah.name} — ${surah.verses} آية`}
    >
      {compact ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className={`text-[10px] font-black ${cfg.color}`}>{surah.id}</span>
          <Icon className={`w-3 h-3 ${cfg.color}`} />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-1">
            <span className={`text-[10px] font-bold ${cfg.color} opacity-70`}>{surah.id}</span>
            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
          </div>
          <p className={`text-xs font-black leading-tight ${cfg.color}`} style={{ fontFamily: "var(--font-headline)" }}>
            {surah.name}
          </p>
          <p className={`text-[9px] font-medium mt-0.5 ${cfg.color} opacity-60`}>{surah.verses} آية</p>
        </>
      )}
    </motion.button>
  );
}

// ─── بطاقة الطالب المصغّرة ────────────────────────────────

function StudentCard({
  student,
  progressMap,
  isSelected,
  onClick,
}: {
  student: Student;
  progressMap: Map<number, SurahStatus>;
  isSelected: boolean;
  onClick: () => void;
}) {
  const memorized = [...progressMap.values()].filter((s) => s === "محفوظة" || s === "مُتقنة").length;
  const mastered = [...progressMap.values()].filter((s) => s === "مُتقنة").length;
  const inProgress = [...progressMap.values()].filter((s) => s === "قيد الحفظ").length;
  const percent = Math.round((memorized / 114) * 100);

  return (
    <button
      onClick={onClick}
      className={`w-full text-right p-4 rounded-2xl border-2 transition-all duration-200 group ${
        isSelected
          ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] shadow-md"
          : "border-[var(--color-border)] bg-white hover:border-[var(--color-primary)]/40 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 ${
          student.gender === "أنثى"
            ? "bg-gradient-to-br from-pink-400 to-rose-500"
            : "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]"
        }`} style={{ fontFamily: "var(--font-headline)" }}>
          {student.fullName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-black truncate ${isSelected ? "text-[var(--color-primary-dark)]" : "text-gray-800"}`} style={{ fontFamily: "var(--font-headline)" }}>
            {student.fullName}
          </p>
          <p className="text-xs text-gray-400 font-medium">{student.groupName}</p>
        </div>
        {isSelected && <ChevronRight className="w-4 h-4 text-[var(--color-primary)] shrink-0" />}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold">
          <span className={isSelected ? "text-[var(--color-primary)]" : "text-gray-500"}>
            {memorized} / 114 سورة
          </span>
          <span className={isSelected ? "text-[var(--color-primary-dark)]" : "text-gray-400"}>
            {percent}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isSelected
                ? "bg-gradient-to-l from-[var(--color-primary)] to-emerald-400"
                : "bg-gradient-to-l from-[var(--color-primary)] to-emerald-400"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex gap-2 text-[10px] font-bold">
          {mastered > 0 && <span className="text-amber-600">⭐ {mastered} مُتقنة</span>}
          {inProgress > 0 && <span className="text-blue-500">📖 {inProgress} قيد الحفظ</span>}
        </div>
      </div>
    </button>
  );
}

// ─── Modal تغيير حالة السورة ─────────────────────────────

function SurahDetailModal({
  surah,
  currentStatus,
  onSave,
  onClose,
}: {
  surah: typeof surahs[number] | null;
  currentStatus: SurahStatus;
  onSave: (status: SurahStatus, notes?: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<SurahStatus>(currentStatus);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setSelected(currentStatus);
    setNotes("");
  }, [surah, currentStatus]);

  if (!surah) return null;

  const options: SurahStatus[] = ["مُتقنة", "محفوظة", "قيد الحفظ", "غير محفوظة"];

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>
                {surah.name}
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                السورة {surah.id} · {surah.verses} آية
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Options */}
          <div className="p-5 space-y-2">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">حالة الحفظ</p>
            {options.map((opt) => {
              const cfg = STATUS_CONFIG[opt];
              const Icon = cfg.icon;
              return (
                <button
                  key={opt}
                  onClick={() => setSelected(opt)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                    selected === opt
                      ? `${cfg.bg} ${cfg.border} shadow-sm`
                      : "bg-gray-50 border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${selected === opt ? cfg.color : "text-gray-400"}`} />
                  <span className={`font-black text-sm ${selected === opt ? cfg.color : "text-gray-500"}`}>
                    {cfg.label}
                  </span>
                  {selected === opt && (
                    <CheckCircle2 className={`w-4 h-4 mr-auto ${cfg.color}`} />
                  )}
                </button>
              );
            })}

            {/* ملاحظة */}
            <div className="pt-2">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">ملاحظة (اختياري)</p>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: تحتاج مراجعة إضافية..."
                className="input-field text-sm py-2.5"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-5 pb-5">
            <button onClick={onClose} className="btn-secondary flex-1 py-2.5 justify-center text-sm">
              إلغاء
            </button>
            <button
              onClick={() => { onSave(selected, notes || undefined); onClose(); }}
              className="btn-primary flex-1 py-2.5 justify-center text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              حفظ
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

export default function QuranPage() {
  const { user, school, isPrincipal } = useAuth();
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Map<string, Map<number, SurahStatus>>>(new Map());
  const [selectedSurah, setSelectedSurah] = useState<typeof surahs[number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<SurahStatus | "الكل">("الكل");
  const [saving, setSaving] = useState(false);

  // ─── تحميل الطلاب + تقدّم الحفظ ────────────────────────

  const loadAll = async () => {
    if (!user?.id || !school?.id) return;
    setLoading(true);
    const db = getDB();

    let studs: Student[] = [];

    if (isPrincipal || user.role === "super_admin") {
      const schoolTeachers = await db.users.where("schoolId").equals(school.id).filter(u => u.role === "teacher").toArray();
      setTeachers(schoolTeachers.sort((a,b) => a.displayName.localeCompare(b.displayName, "ar")));

      studs = await db.students.where("schoolId").equals(school.id).and(s => s.status === "نشط").toArray();
      if (selectedTeacherId !== "all") {
        studs = studs.filter(s => s.teacherId === selectedTeacherId);
      }
    } else {
      studs = await db.students
        .where("teacherId").equals(user.id)
        .and((s) => s.status === "نشط")
        .toArray();
    }

    studs.sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
    setStudents(studs);

    if (studs.length === 0) {
      setProgressMap(new Map());
      setSelectedStudentId(null);
      setLoading(false);
      return;
    }

    // تحميل تقدم الحفظ لكل الطلاب
    const allProgress = await db.surahProgress
      .where("studentId")
      .anyOf(studs.map((s) => s.id))
      .toArray();

    const map = new Map<string, Map<number, SurahStatus>>();
    for (const student of studs) {
      const studentProgress = new Map<number, SurahStatus>();
      const rows = allProgress.filter((p) => p.studentId === student.id);
      for (const row of rows) {
        studentProgress.set(row.surahId, row.status as SurahStatus);
      }
      map.set(student.id, studentProgress);
    }
    setProgressMap(map);

    // اختر أول طالب تلقائياً إذا لم يكن هناك طالب مختار أو إذا كان الطالب المختار غير موجود في القائمة الحالية
    if (!selectedStudentId || !studs.find(s => s.id === selectedStudentId)) {
      setSelectedStudentId(studs[0].id);
    }

    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [user?.id, school?.id, selectedTeacherId]);

  // ─── بيانات الطالب المختار ───────────────────────────────

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const selectedProgress = selectedStudentId ? (progressMap.get(selectedStudentId) ?? new Map()) : new Map<number, SurahStatus>();

  // ─── إحصائيات الطالب المختار ─────────────────────────────

  const stats = useMemo(() => {
    const memorized = [...selectedProgress.values()].filter((s) => s === "محفوظة" || s === "مُتقنة").length;
    const mastered = [...selectedProgress.values()].filter((s) => s === "مُتقنة").length;
    const inProgress = [...selectedProgress.values()].filter((s) => s === "قيد الحفظ").length;
    const remaining = 114 - memorized;
    const percent = Math.round((memorized / 114) * 100);
    return { memorized, mastered, inProgress, remaining, percent };
  }, [selectedProgress]);

  // ─── فلترة السور ─────────────────────────────────────────

  const filteredSurahs = useMemo(() => {
    return surahs.filter((s) => {
      const status = selectedProgress.get(s.id) ?? "غير محفوظة";
      const matchFilter = filterStatus === "الكل" || status === filterStatus;
      return matchFilter;
    });
  }, [selectedProgress, filterStatus]);

  // ─── حفظ تغيير حالة السورة ───────────────────────────────

  const handleSaveSurahStatus = async (status: SurahStatus, notes?: string) => {
    if (!selectedSurah || !selectedStudentId || !school?.id) return;
    setSaving(true);

    await createOrUpdateSurahProgress({
      studentId: selectedStudentId,
      schoolId: school.id,
      surahId: selectedSurah.id,
      surahName: selectedSurah.name,
      status,
      notes,
      completionDate: (status === "محفوظة" || status === "مُتقنة")
        ? new Date().toISOString().slice(0, 10)
        : undefined,
    });

    // تحديث map محلياً
    const updatedMap = new Map(progressMap);
    const studentMap = new Map(updatedMap.get(selectedStudentId) ?? new Map());
    studentMap.set(selectedSurah.id, status);
    updatedMap.set(selectedStudentId, studentMap);
    setProgressMap(updatedMap);

    // تحديث عدد السور المحفوظة على الطالب
    const memorizedCount = [...studentMap.values()].filter(
      (s) => s === "محفوظة" || s === "مُتقنة"
    ).length;
    await updateStudent(selectedStudentId, { memorizedSurahsCount: memorizedCount });

    setSaving(false);
  };

  const currentSurahStatus = selectedSurah
    ? (selectedProgress.get(selectedSurah.id) ?? "غير محفوظة")
    : "غير محفوظة";

  // ─── فلترة الطلاب ────────────────────────────────────────

  const filteredStudents = students.filter((s) =>
    !search || s.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col lg:flex-row gap-5 h-full">

        {/* ─── عمود الطلاب ────────────────────────────── */}
        <div className="w-full lg:w-72 shrink-0 space-y-3">
          <div>
            <h1 className="text-xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>
              متابعة الحفظ
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              {students.length} طالب نشط
            </p>
          </div>

          {/* فلتر المعلم (للمدراء فقط) */}
          {(isPrincipal || user?.role === "super_admin") && teachers.length > 0 && (
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full h-10 border border-indigo-200 rounded-xl px-3 text-sm font-bold bg-indigo-50 text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
            >
              <option value="all">كل المعلمين والأفواج</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.displayName} ({t.groupName || "بدون فوج"})</option>
              ))}
            </select>
          )}

          {/* بحث */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث عن طالب..."
              className="w-full h-10 border border-gray-200 rounded-xl pr-10 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 transition-all bg-white"
            />
          </div>

          {/* قائمة الطلاب */}
          <div className="space-y-2 max-h-[calc(100vh-14rem)] overflow-y-auto pb-4">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
              ))
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                لا يوجد طلاب
              </div>
            ) : (
              filteredStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  progressMap={progressMap.get(student.id) ?? new Map()}
                  isSelected={selectedStudentId === student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* ─── خريطة الحفظ ──────────────────────────── */}
        {selectedStudent ? (
          <div className="flex-1 min-w-0 space-y-4">

            {/* رأس الطالب المختار */}
            <motion.div
              key={selectedStudentId}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-2xl p-5 text-white relative overflow-hidden"
            >
              <div className="absolute inset-0 islamic-pattern opacity-10" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-xs font-medium mb-0.5">خريطة حفظ</p>
                  <h2 className="text-xl font-black" style={{ fontFamily: "var(--font-headline)" }}>
                    {selectedStudent.fullName}
                  </h2>
                  <p className="text-white/70 text-sm mt-0.5">{selectedStudent.groupName}</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-black" style={{ fontFamily: "var(--font-headline)" }}>
                    {stats.percent}%
                  </p>
                  <p className="text-white/60 text-xs">مكتمل</p>
                </div>
              </div>

              {/* Mini Stats */}
              <div className="relative z-10 grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/20 text-center">
                <div>
                  <p className="text-lg font-black">{stats.memorized}</p>
                  <p className="text-white/60 text-[10px] font-medium">محفوظة</p>
                </div>
                <div>
                  <p className="text-lg font-black">⭐ {stats.mastered}</p>
                  <p className="text-white/60 text-[10px] font-medium">مُتقنة</p>
                </div>
                <div>
                  <p className="text-lg font-black">{stats.inProgress}</p>
                  <p className="text-white/60 text-[10px] font-medium">قيد الحفظ</p>
                </div>
                <div>
                  <p className="text-lg font-black">{stats.remaining}</p>
                  <p className="text-white/60 text-[10px] font-medium">متبقية</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative z-10 mt-3">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: `${stats.percent}%` }}
                  />
                </div>
              </div>
            </motion.div>

            {/* مفتاح الألوان + فلاتر */}
            <div className="flex flex-wrap items-center gap-3">
              {/* مفتاح الألوان */}
              <div className="flex flex-wrap gap-2 flex-1">
                {(Object.entries(STATUS_CONFIG) as [SurahStatus, typeof STATUS_CONFIG[SurahStatus]][]).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setFilterStatus(filterStatus === key ? "الكل" : key)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                        filterStatus === key
                          ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm`
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </button>
                  );
                })}
                {filterStatus !== "الكل" && (
                  <button
                    onClick={() => setFilterStatus("الكل")}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
                  >
                    <X className="w-3 h-3" />
                    الكل
                  </button>
                )}
              </div>

              {/* عرض */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === "grid" ? "bg-white shadow text-gray-800" : "text-gray-500"}`}
                >
                  شبكة
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === "list" ? "bg-white shadow text-gray-800" : "text-gray-500"}`}
                >
                  قائمة
                </button>
              </div>
            </div>

            {/* ─── خريطة السور ─────────────────────── */}
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-black text-gray-600">
                  {filterStatus === "الكل" ? "جميع السور (114)" : `${filteredSurahs.length} سورة — ${filterStatus}`}
                </p>
                <button
                  onClick={() => setFilterStatus("الكل")}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                >
                  إظهار الكل
                </button>
              </div>

              <motion.div
                layout
                className={`grid gap-2 ${
                  viewMode === "grid"
                    ? "grid-cols-4 sm:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8"
                    : "grid-cols-1 sm:grid-cols-2"
                }`}
              >
                <AnimatePresence mode="popLayout">
                  {filteredSurahs.map((surah) => {
                    const status = selectedProgress.get(surah.id) ?? "غير محفوظة";
                    return (
                      <motion.div
                        key={surah.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                      >
                        {viewMode === "grid" ? (
                          <SurahBox
                            surah={surah}
                            status={status}
                            onClick={() => setSelectedSurah(surah)}
                            compact={false}
                          />
                        ) : (
                          // List view
                          <button
                            onClick={() => setSelectedSurah(surah)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all hover:shadow-sm ${
                              STATUS_CONFIG[status].bg
                            } ${STATUS_CONFIG[status].border}`}
                          >
                            <span className={`text-xs font-black w-6 text-center ${STATUS_CONFIG[status].color}`}>
                              {surah.id}
                            </span>
                            <div className="flex-1 text-right">
                              <p className={`text-sm font-black ${STATUS_CONFIG[status].color}`} style={{ fontFamily: "var(--font-headline)" }}>
                                {surah.name}
                              </p>
                              <p className={`text-xs opacity-60 ${STATUS_CONFIG[status].color}`}>{surah.verses} آية</p>
                            </div>
                            {(() => {
                              const Icon = STATUS_CONFIG[status].icon;
                              return <Icon className={`w-4 h-4 ${STATUS_CONFIG[status].color}`} />;
                            })()}
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* نصيحة */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 font-medium">
                انقر على أي سورة لتغيير حالة حفظها — التغييرات تُحفظ فوراً محلياً وتُزامَن مع السحابة
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">اختر طالباً لعرض خريطة حفظه</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modal تغيير حالة السورة ─────────────────────── */}
      {selectedSurah && (
        <SurahDetailModal
          surah={selectedSurah}
          currentStatus={currentSurahStatus}
          onSave={handleSaveSurahStatus}
          onClose={() => setSelectedSurah(null)}
        />
      )}
    </div>
  );
}
