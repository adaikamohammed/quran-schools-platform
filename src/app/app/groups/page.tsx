"use client";
import SchoolGuard from "@/components/layout/SchoolGuard";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { getStudentsBySchool, getStudentsByTeacher } from "@/lib/storage/db";
import { updateStudent } from "@/lib/storage/mutations";
import { surahs } from "@/lib/surahs";
import type { Student } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, CheckCircle2, ChevronDown, Check, BookOpen, Loader2, Save
} from "lucide-react";

function GroupsPage() {
  const { user, school, isPrincipal } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<string>("الكل");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [targetSurahId, setTargetSurahId] = useState<number | undefined>();

  const loadStudents = async () => {
    if (!school?.id || !user?.id) return;
    setLoading(true);
    let data = [];
    if (isPrincipal || user.role === "super_admin") {
      data = await getStudentsBySchool(school.id);
    } else {
      data = await getStudentsByTeacher(user.id);
    }
    // Only active students
    data = data.filter(s => s.status === "نشط");
    data.sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => { loadStudents(); }, [school?.id, user?.id, isPrincipal]);

  // مجموعات الأفواج المتاحة
  const groups = useMemo(() => {
    const all = [...new Set(students.map((s) => s.groupName))].filter(Boolean);
    return all.sort();
  }, [students]);

  // الطلاب للفرز الحالي
  const filteredStudents = useMemo(() => {
    if (selectedGroup === "الكل") return students;
    return students.filter(s => s.groupName === selectedGroup);
  }, [students, selectedGroup]);

  // إدارة التحديد
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
    
    // Update all selected
    for (const stId of Array.from(selectedStudents)) {
      await updateStudent(stId, { currentSurahId: targetSurahId || undefined });
    }
    
    setSaved(true);
    setSaving(false);
    
    // Reload UI state locally instead of full DB load for speed
    setStudents(prev => prev.map(s => selectedStudents.has(s.id) ? { ...s, currentSurahId: targetSurahId || undefined } : s));
    setSelectedStudents(new Set()); // clear selection
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>
            إدارة المجموعات القرآنية
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-0.5">
            تحديد السور الافتراضية بشكل جماعي للطلاب
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)] mx-auto mb-2" />
            <p className="text-sm text-gray-400 font-medium">جارٍ تحميل الطلاب...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1.5 w-full">
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider pl-1">
                الفوج / المجموعة
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="input-field text-sm font-bold bg-gray-50 border-gray-200"
              >
                <option value="الكل">الكل ({students.length} طالب)</option>
                {groups.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 space-y-1.5 w-full">
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider pl-1">
                تعيين السورة المحددة للطلاب
              </label>
              <select
                value={targetSurahId ?? ""}
                onChange={(e) => {
                  setTargetSurahId(e.target.value ? +e.target.value : undefined);
                  setSaved(false);
                }}
                className="input-field text-sm font-bold border-[var(--color-primary)]/30 focus:border-[var(--color-primary)] bg-indigo-50/50"
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
                <><Save className="w-4 h-4" /> حفظ للمحددين ({selectedStudents.size})</>
              )}
            </button>
          </div>
          
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-black text-emerald-800">تم التحديث بنجاح!</p>
                  <p className="text-xs text-emerald-600">سيتم استخدام هذه السور تلقائياً في صفحة تحضير الحصص.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User List */}
          <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--color-primary)]" />
                <p className="text-sm font-black text-gray-700">
                  قائمة الطلاب ({filteredStudents.length})
                </p>
              </div>
              <button
                onClick={selectAll}
                className="text-xs font-bold text-[var(--color-primary)] hover:underline"
              >
                {selectedStudents.size === filteredStudents.length ? 'إلغاء التحديد' : 'تحديد الجميع'}
              </button>
            </div>
            
            <div className="divide-y divide-gray-100">
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
                        isSelected ? "bg-indigo-50/40" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isSelected ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white" : "border-gray-300 bg-white"
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white text-xs font-black shrink-0">
                          {student.fullName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-800">{student.fullName}</p>
                          <p className="text-xs text-gray-400 font-medium">{student.groupName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {surahName ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-600">
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
