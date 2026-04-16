"use client";
import SchoolGuard from "@/components/layout/SchoolGuard";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { surahs } from "@/lib/surahs";
import type { Student } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, CheckCircle2, Check, BookOpen, Loader2, Save, Users, Filter
} from "lucide-react";

const supabase = createClient();

function GroupsPage() {
  const { user, school, isPrincipal } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; display_name: string; group_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<string>("الكل");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("الكل");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [targetSurahId, setTargetSurahId] = useState<number | undefined>();

  const loadData = async () => {
    if (!school?.id || !user?.id) return;
    setLoading(true);

    // جلب الطلاب من Supabase مباشرة
    let query = supabase.from("students").select("*").eq("school_id", school.id).eq("status", "نشط");

    // المعلم يرى طلابه فقط
    if (!isPrincipal && user.role !== "super_admin") {
      query = query.eq("teacher_id", user.id);
    }

    const { data: studentsData } = await query.order("full_name", { ascending: true });

    // تحويل snake_case → camelCase ليتوافق مع نوع Student المحلي
    const mapped: Student[] = (studentsData || []).map((s: any) => ({
      id: s.id,
      schoolId: s.school_id,
      teacherId: s.teacher_id,
      groupName: s.group_name || "",
      fullName: s.full_name || "",
      gender: s.gender,
      birthDate: s.birth_date || "",
      guardianName: s.guardian_name || "",
      phone1: s.phone1 || "",
      status: s.status,
      subscriptionTier: s.subscription_tier,
      memorizedSurahsCount: s.memorized_surahs_count || 0,
      dailyMemorizationAmount: s.daily_memorization_amount || "صفحة",
      registrationDate: s.registration_date || "",
      createdAt: s.created_at || "",
      updatedAt: s.updated_at || "",
      currentSurahId: s.current_surah_id,
    }));

    setStudents(mapped);

    // جلب المعلمين للمدير فقط (للفلترة)
    if (isPrincipal || user.role === "super_admin") {
      const { data: teachersData } = await supabase
        .from("users")
        .select("id, display_name, group_name")
        .eq("school_id", school.id)
        .eq("role", "teacher")
        .eq("is_active", true)
        .order("display_name", { ascending: true });
      setTeachers(teachersData || []);
    }

    setLoading(false);
  };

  useEffect(() => { loadData(); }, [school?.id, user?.id, isPrincipal]);

  // مجموعات الأفواج المتاحة
  const groups = useMemo(() => {
    const all = [...new Set(students.map((s) => s.groupName))].filter(Boolean);
    return all.sort();
  }, [students]);

  // الطلاب بعد الفلترة
  const filteredStudents = useMemo(() => {
    let list = students;
    if (selectedTeacher !== "الكل") {
      list = list.filter(s => s.teacherId === selectedTeacher);
    }
    if (selectedGroup !== "الكل") {
      list = list.filter(s => s.groupName === selectedGroup);
    }
    return list;
  }, [students, selectedGroup, selectedTeacher]);

  // إعادة تعيين فلتر الفوج عند تغيير المعلم
  const handleTeacherChange = (tId: string) => {
    setSelectedTeacher(tId);
    setSelectedGroup("الكل");
  };

  // الأفواج الخاصة بالمعلم المحدد
  const groupsForTeacher = useMemo(() => {
    let src = students;
    if (selectedTeacher !== "الكل") src = src.filter(s => s.teacherId === selectedTeacher);
    return [...new Set(src.map(s => s.groupName))].filter(Boolean).sort();
  }, [students, selectedTeacher]);

  const toggleStudent = (id: string) => {
    const next = new Set(selectedStudents);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStudents(next);
    setSaved(false);
  };

  const selectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
    setSaved(false);
  };

  const handleSave = async () => {
    if (selectedStudents.size === 0 || !school?.id) return;
    setSaving(true);

    const ids = Array.from(selectedStudents);
    const { error } = await supabase
      .from("students")
      .update({ current_surah_id: targetSurahId ?? null })
      .in("id", ids);

    if (!error) {
      setSaved(true);
      setStudents(prev =>
        prev.map(s => selectedStudents.has(s.id) ? { ...s, currentSurahId: targetSurahId ?? undefined } : s)
      );
      setSelectedStudents(new Set());
    }
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
            <Layers className="w-6 h-6 text-[var(--color-primary)]" />
            إدارة الأفواج والمجموعات
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-0.5">
            {isPrincipal
              ? `عرض جميع أفواج مدرسة ${school?.name || ""} مع إمكانية الفلترة`
              : "تحديد السور الافتراضية بشكل جماعي للطلاب"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)] mx-auto mb-2" />
            <p className="text-sm text-gray-400 font-medium">جارٍ تحميل البيانات...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-end">

              {/* فلتر المعلم (للمدير فقط) */}
              {isPrincipal && teachers.length > 0 && (
                <div className="flex-1 space-y-1.5 w-full">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> المعلم / الفوج
                  </label>
                  <select
                    value={selectedTeacher}
                    onChange={(e) => handleTeacherChange(e.target.value)}
                    className="input-field text-sm font-bold bg-gray-50 dark:bg-transparent border-gray-200"
                  >
                    <option value="الكل">جميع المعلمين ({students.length} طالب)</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.display_name} — {t.group_name || "بدون فوج"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* فلتر الفوج */}
              <div className="flex-1 space-y-1.5 w-full">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> الفوج
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="input-field text-sm font-bold bg-gray-50 dark:bg-transparent border-gray-200"
                >
                  <option value="الكل">الكل ({filteredStudents.length} طالب)</option>
                  {groupsForTeacher.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* السورة */}
              <div className="flex-1 space-y-1.5 w-full">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> تعيين السورة للمحددين
                </label>
                <select
                  value={targetSurahId ?? ""}
                  onChange={(e) => {
                    setTargetSurahId(e.target.value ? +e.target.value : undefined);
                    setSaved(false);
                  }}
                  className="input-field text-sm font-bold border-[var(--color-primary)]/30 focus:border-[var(--color-primary)] bg-indigo-50/50 dark:bg-transparent"
                >
                  <option value="">— مسح السورة الافتراضية —</option>
                  {surahs.map((s) => (
                    <option key={s.id} value={s.id}>{s.id}. {s.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || selectedStudents.size === 0}
                className="btn-primary flex justify-center py-3 px-6 h-11 w-full sm:w-auto"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> حفظ...</>
                ) : (
                  <><Save className="w-4 h-4" /> حفظ ({selectedStudents.size})</>
                )}
              </button>
            </div>

            {/* إحصائيات سريعة */}
            {isPrincipal && (
              <div className="flex flex-wrap gap-2 pt-1">
                {groups.map(g => {
                  const count = students.filter(s => s.groupName === g).length;
                  return (
                    <button
                      key={g}
                      onClick={() => { setSelectedGroup(g); setSelectedTeacher("الكل"); }}
                      className={`text-xs px-3 py-1 rounded-full font-bold border transition-all ${
                        selectedGroup === g
                          ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                          : "bg-gray-50 dark:bg-[var(--color-card)] text-gray-600 border-gray-200 hover:border-[var(--color-primary)]/40"
                      }`}
                    >
                      {g} <span className="opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-black text-emerald-800 dark:text-emerald-200">تم التحديث بنجاح!</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">سيتم استخدام هذه السور تلقائياً في صفحة تحضير الحصص.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User List */}
          <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--color-primary)]" />
                <p className="text-sm font-black text-gray-700 dark:text-gray-200">
                  قائمة الطلاب ({filteredStudents.length})
                  {selectedGroup !== "الكل" && <span className="text-[var(--color-primary)] mr-1">— {selectedGroup}</span>}
                </p>
              </div>
              <button
                onClick={selectAll}
                className="text-xs font-bold text-[var(--color-primary)] hover:underline"
              >
                {selectedStudents.size === filteredStudents.length && filteredStudents.length > 0
                  ? "إلغاء التحديد"
                  : "تحديد الجميع"}
              </button>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-medium">
                  لا يوجد طلاب في هذا الفوج.
                </div>
              ) : (
                filteredStudents.map(student => {
                  const isSelected = selectedStudents.has(student.id);
                  const surahName = student.currentSurahId
                    ? surahs.find(s => s.id === student.currentSurahId)?.name
                    : null;

                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                        isSelected ? "bg-indigo-50/40 dark:bg-indigo-500/10" : "hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isSelected ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white" : "border-gray-300 bg-white dark:bg-transparent"
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white text-xs font-black shrink-0">
                          {student.fullName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-800 dark:text-white">{student.fullName}</p>
                          <p className="text-xs text-gray-400 font-medium">{student.groupName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {surahName ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-white/10 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300">
                            <BookOpen className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                            {surahName}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium px-2">—</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function GroupsPagePage() {
  return (
    <SchoolGuard>
      <GroupsPage />
    </SchoolGuard>
  );
}
