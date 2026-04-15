"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import type { TimetableEntry, DayOfWeek, AppUser } from "@/lib/types";
import {
  Calendar, Plus, X, Loader2, Edit2, Trash2, Printer,
  Clock, Users, BookOpen, ChevronDown
} from "lucide-react";
import SchoolGuard from "@/components/layout/SchoolGuard";

// ─── أيام الأسبوع المعتمدة ──────────────────────────────
const DAYS: DayOfWeek[] = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

// ─── ألوان الأفواج ──────────────────────────────────────
const COLORS = [
  { label: "أزرق", value: "#3b82f6" },
  { label: "أخضر", value: "#10b981" },
  { label: "برتقالي", value: "#f97316" },
  { label: "بنفسجي", value: "#8b5cf6" },
  { label: "وردي", value: "#ec4899" },
  { label: "ذهبي", value: "#d4af37" },
  { label: "أحمر", value: "#ef4444" },
  { label: "سماوي", value: "#06b6d4" },
];

const SUBJECTS = ["تلقين", "مراجعة", "إتقان", "قرآن وتجويد", "حفظ جديد", "درس عام"];

// ─── دوال مساعدة ────────────────────────────────────────
function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function generateId() {
  return `tmt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

// ─── نافذة إضافة / تعديل حصة ───────────────────────────
function EntryModal({
  entry,
  onSave,
  onClose,
  groups,
}: {
  entry: Partial<TimetableEntry> | null;
  onSave: (e: TimetableEntry) => void;
  onClose: () => void;
  groups: string[];
}) {
  const { user, school } = useAuth();
  const [form, setForm] = useState<Partial<TimetableEntry>>({
    dayOfWeek: "الإثنين",
    startTime: "14:00",
    endTime: "16:00",
    subject: "تلقين",
    color: COLORS[0].value,
    groupName: groups[0] ?? "",
    ...entry,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.dayOfWeek || !form.startTime || !form.endTime || !form.groupName) return;
    setSaving(true);

    const now = new Date().toISOString();
    const newEntry: TimetableEntry = {
      id: form.id ?? generateId(),
      schoolId: school?.id ?? "",
      teacherId: form.teacherId ?? user?.id ?? "",
      teacherName: form.teacherName ?? user?.displayName ?? "",
      groupName: form.groupName,
      dayOfWeek: form.dayOfWeek,
      startTime: form.startTime,
      endTime: form.endTime,
      subject: form.subject,
      color: form.color,
      createdAt: form.createdAt ?? now,
      updatedAt: now,
    };

    await getDB().timetables.put(newEntry);
    onSave(newEntry);
    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div key="modal" initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1a1d2a] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 bg-gradient-to-l from-[#1e3a8a] to-[#1e40af] text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm">{form.id ? "تعديل حصة" : "إضافة حصة"}</h3>
                <p className="text-xs text-white/70">جدول الأسبوعي</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* الفوج */}
            <div>
              <label className="label-xs mb-1.5 block">الفوج</label>
              <select value={form.groupName} onChange={e => setForm(f => ({ ...f, groupName: e.target.value }))}
                className="input-field text-sm py-2.5 w-full">
                {groups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* اليوم */}
            <div>
              <label className="label-xs mb-1.5 block">اليوم</label>
              <div className="grid grid-cols-4 gap-1.5">
                {DAYS.map(d => (
                  <button key={d} onClick={() => setForm(f => ({ ...f, dayOfWeek: d }))}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${form.dayOfWeek === d
                      ? "bg-[#1e3a8a] text-white border-[#1e3a8a]"
                      : "bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-[#1e3a8a]/40"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* الوقت */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-xs mb-1.5 block">من</label>
                <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  className="input-field text-sm py-2.5 w-full" dir="ltr" />
              </div>
              <div>
                <label className="label-xs mb-1.5 block">إلى</label>
                <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  className="input-field text-sm py-2.5 w-full" dir="ltr" />
              </div>
            </div>

            {/* المادة والألوان */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-xs mb-1.5 block">نوع النشاط</label>
                <select value={form.subject ?? ""} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="input-field text-sm py-2.5 w-full">
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label-xs mb-1.5 block">اللون</label>
                <div className="flex gap-1.5 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c.value} onClick={() => setForm(f => ({ ...f, color: c.value }))}
                      title={c.label}
                      style={{ background: c.value }}
                      className={`w-7 h-7 rounded-lg transition-transform hover:scale-110 ${form.color === c.value ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 px-5 pb-5">
            <button onClick={onClose} className="btn-secondary flex-1 py-2.5 justify-center text-sm">إلغاء</button>
            <button onClick={handleSave} disabled={saving || !form.groupName}
              className="flex-1 py-2.5 justify-center text-sm flex items-center gap-2 rounded-xl font-bold text-white bg-gradient-to-l from-[#1e3a8a] to-[#1e40af] hover:opacity-90 disabled:opacity-40 transition-opacity">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Calendar className="w-4 h-4" /> حفظ الحصة</>}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── بطاقة حصة في الجدول ─────────────────────────────────
function TimetableCard({ entry, onEdit, onDelete }: {
  entry: TimetableEntry;
  onEdit: (e: TimetableEntry) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="relative group rounded-2xl p-3 mb-2 shadow-sm text-white overflow-hidden"
      style={{ background: entry.color || "#3b82f6" }}>
      {/* Overlay gradient for readability */}
      <div className="absolute inset-0 bg-black/20 rounded-2xl" />
      <div className="relative z-10">
        <p className="font-black text-sm leading-tight truncate">{entry.groupName}</p>
        {entry.subject && <p className="text-[11px] text-white/80 font-medium mt-0.5">{entry.subject}</p>}
        <div className="flex items-center gap-1 mt-2 text-white/90 text-[11px]">
          <Clock className="w-3 h-3" />
          <span dir="ltr">{entry.startTime} — {entry.endTime}</span>
        </div>
      </div>
      {/* Action buttons (show on hover) */}
      <div className="absolute top-1.5 left-1.5 gap-1 hidden group-hover:flex transition-all">
        <button onClick={() => onEdit(entry)}
          className="w-6 h-6 rounded-lg bg-white/30 hover:bg-white/50 flex items-center justify-center transition-colors">
          <Edit2 className="w-3 h-3 text-white" />
        </button>
        <button onClick={() => onDelete(entry.id)}
          className="w-6 h-6 rounded-lg bg-white/30 hover:bg-red-400/80 flex items-center justify-center transition-colors">
          <Trash2 className="w-3 h-3 text-white" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── الصفحة الرئيسية ────────────────────────────────────
function TimetablePage() {
  const { user, school, isPrincipal } = useAuth();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [modalEntry, setModalEntry] = useState<Partial<TimetableEntry> | null | undefined>(undefined);

  const load = useCallback(async () => {
    if (!user?.id || !school?.id) return;
    setLoading(true);
    const db = getDB();

    // جلب المعلمين (للمدير)
    if (isPrincipal || user.role === "super_admin") {
      const teacherList = await db.users.where("schoolId").equals(school.id)
        .filter(u => u.role === "teacher" && u.isActive).toArray();
      setTeachers(teacherList);
      if (teacherList.length > 0 && !selectedTeacherId) {
        setSelectedTeacherId(teacherList[0].id);
      }
    } else {
      setSelectedTeacherId(user.id);
    }

    // جلب جدول الحصص
    const allEntries = await db.timetables.where("schoolId").equals(school.id).toArray();
    setEntries(allEntries);
    setLoading(false);
  }, [user?.id, school?.id, isPrincipal, selectedTeacherId]);

  useEffect(() => { load(); }, [load]);

  // فلترة الحصص بالمعلم المختار
  const filteredEntries = useMemo(() => {
    if (!selectedTeacherId) return entries;
    return entries.filter(e => e.teacherId === selectedTeacherId);
  }, [entries, selectedTeacherId]);

  // الأفواج المتاحة للمعلم المختار
  const groups = useMemo(() => {
    const teacherGroups = entries.filter(e => e.teacherId === selectedTeacherId).map(e => e.groupName);
    // Add groups from users table too
    const t = teachers.find(t => t.id === selectedTeacherId);
    if (t?.groupName && !teacherGroups.includes(t.groupName)) {
      teacherGroups.unshift(t.groupName);
    }
    return Array.from(new Set(teacherGroups.filter(Boolean)));
  }, [entries, selectedTeacherId, teachers]);

  // تجميع حسب اليوم
  const entriesByDay = useMemo(() => {
    const map: Record<DayOfWeek, TimetableEntry[]> = {} as any;
    DAYS.forEach(d => { map[d] = []; });
    filteredEntries.forEach(e => {
      if (map[e.dayOfWeek]) {
        map[e.dayOfWeek].push(e);
        map[e.dayOfWeek].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      }
    });
    return map;
  }, [filteredEntries]);

  const handleSave = (entry: TimetableEntry) => {
    setEntries(prev => {
      const idx = prev.findIndex(e => e.id === entry.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = entry; return n; }
      return [...prev, entry];
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل تريد حذف هذه الحصة من الجدول؟")) return;
    await getDB().timetables.delete(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const currentTeacher = teachers.find(t => t.id === selectedTeacherId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 print:m-0" dir="rtl">
      {/* ─── Header ─── */}
      <div className="print:hidden flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3"
            style={{ fontFamily: "var(--font-headline)" }}>
            <Calendar className="w-7 h-7 text-blue-600" />
            جدول الحصص الأسبوعي
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            تنظيم ومتابعة مواعيد الحصص لكل معلم وفوج.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()}
            className="btn-secondary py-2.5 px-4 flex items-center gap-2 text-sm">
            <Printer className="w-4 h-4" /> طباعة
          </button>
          <button
            onClick={() => setModalEntry({ teacherId: selectedTeacherId, teacherName: currentTeacher?.displayName })}
            className="btn-primary py-2.5 px-5 flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> إضافة حصة
          </button>
        </div>
      </div>

      {/* ─── Teacher Filter (Principal only) ─── */}
      {(isPrincipal || user?.role === "super_admin") && teachers.length > 0 && (
        <div className="print:hidden flex gap-2 flex-wrap">
          {teachers.map(t => (
            <button key={t.id} onClick={() => setSelectedTeacherId(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${selectedTeacherId === t.id
                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                : "bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-blue-400"}`}>
              <Users className="w-3.5 h-3.5" />
              {t.displayName}
              {t.groupName && <span className="text-[10px] opacity-70">· {t.groupName}</span>}
            </button>
          ))}
        </div>
      )}

      {/* ─── Teacher name in print ─── */}
      <div className="hidden print:block text-center mb-6">
        <h2 className="text-2xl font-black">{school?.name} — جدول الحصص الأسبوعي</h2>
        {currentTeacher && <p className="text-gray-600 text-lg mt-1">المعلم: {currentTeacher.displayName}</p>}
      </div>

      {/* ─── Timetable Grid ─── */}
      <div className="bg-white dark:bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] overflow-hidden shadow-sm">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
          {DAYS.map(day => (
            <div key={day}
              className={`px-3 py-4 text-center border-l border-[var(--color-border)] last:border-l-0 ${entriesByDay[day]?.length > 0
                ? "bg-blue-50 dark:bg-blue-500/10"
                : ""}`}>
              <p className="text-sm font-black text-gray-700 dark:text-white">{day}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {entriesByDay[day]?.length || 0} حصة
              </p>
            </div>
          ))}
        </div>

        {/* Day columns with entries */}
        <div className="grid grid-cols-7 min-h-[400px]">
          {DAYS.map(day => (
            <div key={day} className="p-2 border-l border-[var(--color-border)] last:border-l-0 min-h-[300px]">
              <AnimatePresence>
                {entriesByDay[day]?.map(entry => (
                  <TimetableCard key={entry.id} entry={entry}
                    onEdit={() => setModalEntry(entry)}
                    onDelete={handleDelete} />
                ))}
              </AnimatePresence>

              {/* Add button inside day column */}
              <button
                onClick={() => setModalEntry({
                  dayOfWeek: day,
                  teacherId: selectedTeacherId,
                  teacherName: currentTeacher?.displayName
                })}
                className="print:hidden w-full mt-1 h-8 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-300 dark:text-gray-600 hover:border-blue-400 hover:text-blue-400 flex items-center justify-center transition-all text-xs">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      {filteredEntries.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <p className="font-bold text-gray-400 dark:text-gray-500">لا توجد حصص مسجلة بعد</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">اضغط "إضافة حصة" لبدء بناء الجدول</p>
        </div>
      )}

      {/* Modal */}
      {modalEntry !== undefined && (
        <EntryModal
          entry={modalEntry}
          groups={groups.length > 0 ? groups : [currentTeacher?.groupName ?? "الفوج الأساسي"]}
          onSave={handleSave}
          onClose={() => setModalEntry(undefined)}
        />
      )}
    </div>
  );
}

export default function TimetablePageWrapper() {
  return (
    <SchoolGuard>
      <TimetablePage />
    </SchoolGuard>
  );
}
