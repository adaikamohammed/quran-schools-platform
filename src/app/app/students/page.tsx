"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB, getStudentsBySchool, getStudentsByTeacher } from "@/lib/storage/db";
import { createStudent, updateStudent, softDeleteStudent } from "@/lib/storage/mutations";
import type { Student, SubscriptionTier, MemorizationAmount, AppUser } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Search, Filter, X, ChevronDown,
  Phone, BookOpen, Calendar, UserCheck, UserX,
  MoreVertical, Edit, Trash2, Eye, Check,
  ArrowUpDown, Download,
} from "lucide-react";
import Link from "next/link";

// ─── نموذج إضافة طالب ────────────────────────────────────

const EDUCATION_LEVELS = ["روضة", "ابتدائي", "متوسط", "ثانوي", "جامعي", "خريج"];
const MEMORIZATION_AMOUNTS: MemorizationAmount[] = ["ثمن", "ربع", "نصف", "صفحة", "أكثر"];
const SUBSCRIPTION_TIERS: SubscriptionTier[] = ["فئة الأصاغر", "فئة الأكابر"];

interface StudentFormData {
  fullName: string;
  gender: "ذكر" | "أنثى";
  birthDate: string;
  educationalLevel: string;
  guardianName: string;
  phone1: string;
  phone2: string;
  groupName: string;
  subscriptionTier: SubscriptionTier;
  dailyMemorizationAmount: MemorizationAmount;
  memorizedSurahsCount: number;
  notes: string;
}

const EMPTY_FORM: StudentFormData = {
  fullName: "",
  gender: "ذكر",
  birthDate: "",
  educationalLevel: "ابتدائي",
  guardianName: "",
  phone1: "",
  phone2: "",
  groupName: "",
  subscriptionTier: "فئة الأصاغر",
  dailyMemorizationAmount: "ربع",
  memorizedSurahsCount: 0,
  notes: "",
};

// ─── Modal إضافة/تعديل طالب ──────────────────────────────

function StudentModal({
  open,
  onClose,
  onSave,
  initial,
  groups,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: StudentFormData) => Promise<void>;
  initial?: StudentFormData;
  groups: string[];
}) {
  const [form, setForm] = useState<StudentFormData>(initial ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({});

  useEffect(() => {
    setForm(initial ?? EMPTY_FORM);
    setErrors({});
  }, [open, initial]);

  const set = (field: keyof StudentFormData, value: any) =>
    setForm((p) => ({ ...p, [field]: value }));

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.fullName.trim()) e.fullName = "الاسم مطلوب";
    if (!form.guardianName.trim()) e.guardianName = "اسم ولي الأمر مطلوب";
    if (!form.phone1.trim()) e.phone1 = "رقم هاتف مطلوب";
    if (!form.groupName.trim()) e.groupName = "اسم الفوج مطلوب";
    if (!form.birthDate) e.birthDate = "تاريخ الميلاد مطلوب";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
                <div>
                  <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>
                    {initial ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">أدخل بيانات الطالب بالكامل</p>
                </div>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* القسم 1: معلومات الطالب */}
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">معلومات الطالب</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* الاسم */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">الاسم الكامل *</label>
                      <input
                        value={form.fullName}
                        onChange={(e) => set("fullName", e.target.value)}
                        placeholder="مثال: أحمد محمد بن يوسف"
                        className={`input-field ${errors.fullName ? "border-red-400" : ""}`}
                      />
                      {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
                    </div>

                    {/* الجنس */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">الجنس</label>
                      <div className="flex gap-3">
                        {(["ذكر", "أنثى"] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => set("gender", g)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                              form.gender === g
                                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                                : "bg-white text-gray-600 border-gray-200 hover:border-[var(--color-primary)]/40"
                            }`}
                          >
                            {g === "ذكر" ? "👦 ذكر" : "👧 أنثى"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* تاريخ الميلاد */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">تاريخ الميلاد *</label>
                      <input
                        type="date"
                        value={form.birthDate}
                        onChange={(e) => set("birthDate", e.target.value)}
                        max={new Date().toISOString().slice(0, 10)}
                        className={`input-field ${errors.birthDate ? "border-red-400" : ""}`}
                      />
                      {errors.birthDate && <p className="text-xs text-red-500">{errors.birthDate}</p>}
                    </div>

                    {/* المستوى الدراسي */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">المستوى الدراسي</label>
                      <select value={form.educationalLevel} onChange={(e) => set("educationalLevel", e.target.value)} className="input-field">
                        {EDUCATION_LEVELS.map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </div>

                    {/* رقم الصفحة */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">رقم في الصفحة</label>
                      <input
                        value={form.memorizedSurahsCount}
                        type="number"
                        min={0}
                        max={114}
                        onChange={(e) => set("memorizedSurahsCount", +e.target.value)}
                        className="input-field"
                        placeholder="عدد السور المحفوظة"
                      />
                    </div>
                  </div>
                </div>

                {/* القسم 2: ولي الأمر */}
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">ولي الأمر</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">اسم ولي الأمر *</label>
                      <input
                        value={form.guardianName}
                        onChange={(e) => set("guardianName", e.target.value)}
                        placeholder="الاسم الكامل"
                        className={`input-field ${errors.guardianName ? "border-red-400" : ""}`}
                      />
                      {errors.guardianName && <p className="text-xs text-red-500">{errors.guardianName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">هاتف 1 *</label>
                      <input
                        value={form.phone1}
                        onChange={(e) => set("phone1", e.target.value)}
                        placeholder="+213 6XX XXX XXX"
                        dir="ltr"
                        className={`input-field text-right ${errors.phone1 ? "border-red-400" : ""}`}
                      />
                      {errors.phone1 && <p className="text-xs text-red-500">{errors.phone1}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">هاتف 2 (اختياري)</label>
                      <input
                        value={form.phone2}
                        onChange={(e) => set("phone2", e.target.value)}
                        placeholder="+213 6XX XXX XXX"
                        dir="ltr"
                        className="input-field text-right"
                      />
                    </div>
                  </div>
                </div>

                {/* القسم 3: المجموعة والاشتراك */}
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">المجموعة والاشتراك</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">الفوج / المجموعة *</label>
                      <input
                        value={form.groupName}
                        onChange={(e) => set("groupName", e.target.value)}
                        placeholder="مثال: فوج النور"
                        list="groups-list"
                        className={`input-field ${errors.groupName ? "border-red-400" : ""}`}
                      />
                      <datalist id="groups-list">
                        {groups.map((g) => <option key={g} value={g} />)}
                      </datalist>
                      {errors.groupName && <p className="text-xs text-red-500">{errors.groupName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">فئة الاشتراك</label>
                      <select value={form.subscriptionTier} onChange={(e) => set("subscriptionTier", e.target.value as SubscriptionTier)} className="input-field">
                        {SUBSCRIPTION_TIERS.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">كمية التحفيظ اليومي</label>
                      <select value={form.dailyMemorizationAmount} onChange={(e) => set("dailyMemorizationAmount", e.target.value as MemorizationAmount)} className="input-field">
                        {MEMORIZATION_AMOUNTS.map((a) => <option key={a}>{a}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">السور المحفوظة (عدد)</label>
                      <input
                        type="number"
                        min={0}
                        max={114}
                        value={form.memorizedSurahsCount}
                        onChange={(e) => set("memorizedSurahsCount", +e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>

                {/* ملاحظات */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">ملاحظات (اختياري)</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    rows={3}
                    placeholder="أي معلومات إضافية عن الطالب..."
                    className="input-field resize-none"
                  />
                </div>

                {/* أزرار */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-3">
                    إلغاء
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-3">
                    {saving ? "جارٍ الحفظ..." : initial ? "حفظ التعديلات" : "إضافة الطالب"}
                    {!saving && <Check className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── بطاقة الطالب ──────────────────────────────────────

function StudentCard({
  student,
  onEdit,
  onDelete,
}: {
  student: Student;
  onEdit: (s: Student) => void;
  onDelete: (s: Student) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const statusColor =
    student.status === "نشط"
      ? "bg-emerald-50 text-emerald-700"
      : student.status === "موقوف"
      ? "bg-amber-50 text-amber-700"
      : "bg-red-50 text-red-700";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl border border-[var(--color-border)] p-5 hover:shadow-md hover:border-[var(--color-primary)]/20 transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0 shadow-sm ${
            student.gender === "أنثى"
              ? "bg-gradient-to-br from-pink-400 to-rose-500"
              : "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]"
          }`} style={{ fontFamily: "var(--font-headline)" }}>
            {student.fullName[0]}
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-sm leading-snug" style={{ fontFamily: "var(--font-headline)" }}>
              {student.fullName}
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              {student.groupName}
            </p>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                className="absolute left-0 top-10 z-20 bg-white rounded-2xl shadow-xl border border-gray-100 w-44 overflow-hidden"
                onBlur={() => setMenuOpen(false)}
              >
                <Link
                  href={`/app/students/${student.id}`}
                  className="flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <Eye className="w-4 h-4 text-blue-500" />
                  عرض الملف
                </Link>
                <button
                  onClick={() => { onEdit(student); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-4 h-4 text-amber-500" />
                  تعديل
                </button>
                <button
                  onClick={() => { onDelete(student); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mb-4" />

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-emerald-50 rounded-xl p-2">
          <p className="text-sm font-black text-emerald-700" style={{ fontFamily: "var(--font-headline)" }}>
            {student.memorizedSurahsCount}
          </p>
          <p className="text-[10px] text-emerald-600 font-bold">سورة</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-2">
          <p className="text-sm font-black text-blue-700" style={{ fontFamily: "var(--font-headline)" }}>
            {student.dailyMemorizationAmount}
          </p>
          <p className="text-[10px] text-blue-600 font-bold">يومياً</p>
        </div>
        <div className={`rounded-xl p-2 ${statusColor}`}>
          <p className="text-sm font-black" style={{ fontFamily: "var(--font-headline)" }}>
            {student.status}
          </p>
          <p className="text-[10px] font-bold opacity-70">الحالة</p>
        </div>
      </div>

      {/* Contact */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
          <Phone className="w-3 h-3" />
          <span dir="ltr" className="font-mono">{student.phone1}</span>
        </div>
        <Link
          href={`/app/students/${student.id}`}
          className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
        >
          الملف الكامل
        </Link>
      </div>
    </motion.div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

export default function StudentsPage() {
  const { user, school, isPrincipal } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"الكل" | "نشط" | "موقوف" | "مطرود">("الكل");
  const [filterGroup, setFilterGroup] = useState("الكل");
  const [filterGender, setFilterGender] = useState<"الكل" | "ذكر" | "أنثى">("الكل");
  const [sortBy, setSortBy] = useState<"name" | "surahs" | "date">("name");

  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");

  const loadStudents = useCallback(async () => {
    if (!school?.id || !user?.id) return;
    setLoading(true);
    const db = getDB();

    if (isPrincipal || user.role === "super_admin") {
      const schoolTeachers = await db.users.where("schoolId").equals(school.id).filter(u => u.role === "teacher").toArray();
      setTeachers(schoolTeachers.sort((a, b) => a.displayName.localeCompare(b.displayName, "ar")));

      let data = await getStudentsBySchool(school.id);
      if (selectedTeacherId !== "all") {
        data = data.filter((s) => s.teacherId === selectedTeacherId);
      }
      setStudents(data);
    } else {
      const data = await getStudentsByTeacher(user.id);
      setStudents(data);
    }
    setLoading(false);
  }, [school?.id, user?.id, user?.role, isPrincipal, selectedTeacherId]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  // الأفواج الفريدة
  const groups = useMemo(() => {
    const all = [...new Set(students.map((s) => s.groupName))].filter(Boolean);
    return all;
  }, [students]);

  // فلترة + بحث + ترتيب
  const filtered = useMemo(() => {
    let result = students.filter((s) => {
      const matchSearch =
        !search ||
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.guardianName.toLowerCase().includes(search.toLowerCase()) ||
        s.phone1.includes(search);
      const matchStatus = filterStatus === "الكل" || s.status === filterStatus;
      const matchGroup = filterGroup === "الكل" || s.groupName === filterGroup;
      const matchGender = filterGender === "الكل" || s.gender === filterGender;
      return matchSearch && matchStatus && matchGroup && matchGender;
    });

    result.sort((a, b) => {
      if (sortBy === "name") return a.fullName.localeCompare(b.fullName, "ar");
      if (sortBy === "surahs") return b.memorizedSurahsCount - a.memorizedSurahsCount;
      if (sortBy === "date") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

    return result;
  }, [students, search, filterStatus, filterGroup, filterGender, sortBy]);

  // حفظ طالب جديد أو تعديل
  const handleSave = async (form: StudentFormData) => {
    if (!school || !user) return;
    if (editTarget) {
      await updateStudent(editTarget.id, {
        ...form,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await createStudent({
        schoolId: school.id,
        teacherId: user.id,
        registrationDate: new Date().toISOString().slice(0, 10),
        status: "نشط",
        covenants: [],
        expulsionHistory: [],
        transferHistory: [],
        ...form,
      });
    }
    await loadStudents();
  };

  // حذف طالب
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await softDeleteStudent(deleteTarget.id, "حذف يدوي من لوحة التحكم");
    setDeleteTarget(null);
    await loadStudents();
  };

  // فتح modal التعديل
  const handleEdit = (s: Student) => {
    setEditTarget(s);
    setModalOpen(true);
  };

  const editFormData: StudentFormData | undefined = editTarget
    ? {
        fullName: editTarget.fullName,
        gender: editTarget.gender,
        birthDate: editTarget.birthDate,
        educationalLevel: editTarget.educationalLevel ?? "ابتدائي",
        guardianName: editTarget.guardianName,
        phone1: editTarget.phone1,
        phone2: editTarget.phone2 ?? "",
        groupName: editTarget.groupName,
        subscriptionTier: editTarget.subscriptionTier,
        dailyMemorizationAmount: editTarget.dailyMemorizationAmount,
        memorizedSurahsCount: editTarget.memorizedSurahsCount,
        notes: editTarget.notes ?? "",
      }
    : undefined;

  const activeCount = students.filter((s) => s.status === "نشط").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>
            إدارة الطلاب
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-0.5">
            {activeCount} طالب نشط من أصل {students.length}
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setModalOpen(true); }}
          className="btn-primary text-sm py-2.5 px-5"
        >
          <Plus className="w-4 h-4" />
          إضافة طالب
        </button>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4 space-y-4">
        {/* بحث */}
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، اسم الولي، أو رقم الهاتف..."
            className="w-full h-11 border-2 border-gray-100 rounded-xl pr-11 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* فلاتر */}
        <div className="flex flex-wrap gap-2">
          {/* الحالة */}
          {(["الكل", "نشط", "موقوف", "مطرود"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === s
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}

          {/* فلتر المعلم (للمدراء فقط) */}
          {(isPrincipal || user?.role === "super_admin") && teachers.length > 0 && (
            <>
              <div className="w-px bg-gray-200 mx-1" />
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="all">كل المعلمين والأفواج</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.displayName} ({t.groupName || "بدون فوج"})</option>
                ))}
              </select>
            </>
          )}

          <div className="w-px bg-gray-200 mx-1" />

          {/* الجنس */}
          {(["الكل", "ذكر", "أنثى"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setFilterGender(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterGender === g
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {g}
            </button>
          ))}

          {groups.length > 0 && (
            <>
              <div className="w-px bg-gray-200 mx-1" />
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 border-0 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
              >
                <option value="الكل">كل الأفواج</option>
                {groups.map((g) => <option key={g}>{g}</option>)}
              </select>
            </>
          )}

          {/* ترتيب */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 border-0 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 mr-auto"
          >
            <option value="name">ترتيب: الاسم</option>
            <option value="surahs">ترتيب: عدد السور</option>
            <option value="date">ترتيب: تاريخ الإضافة</option>
          </select>
        </div>
      </div>

      {/* نتائج البحث */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-[var(--color-border)]">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">
            {students.length === 0
              ? "لا يوجد طلاب بعد. ابدأ بإضافة أول طالب!"
              : "لا توجد نتائج مطابقة للبحث."}
          </p>
          {students.length === 0 && (
            <button
              onClick={() => setModalOpen(true)}
              className="btn-primary text-sm py-2 px-5 mt-4"
            >
              <Plus className="w-4 h-4" />
              إضافة طالب
            </button>
          )}
        </div>
      )}

      {/* شبكة الطلاب */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[var(--color-border)] p-5 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                </div>
              </div>
              <div className="h-px bg-gray-100 mb-4" />
              <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-12 bg-gray-100 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal إضافة/تعديل */}
      <StudentModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        initial={editFormData}
        groups={groups}
      />

      {/* Modal تأكيد الحذف */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              key="del-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteTarget(null)}
            />
            <motion.div
              key="del-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
                <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
                  <Trash2 className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: "var(--font-headline)" }}>
                  حذف الطالب؟
                </h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  سيتم تحويل حالة الطالب <strong className="text-gray-800">{deleteTarget.fullName}</strong> إلى "محذوف". يمكن استعادته لاحقاً.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 justify-center py-2.5">
                    إلغاء
                  </button>
                  <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    نعم، احذف
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
