"use client";
import SchoolGuard from "@/components/layout/SchoolGuard";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB, getStudentsBySchool, getStudentsByTeacher } from "@/lib/storage/db";
import { createClient } from "@/lib/supabase/client";
import { createStudent, updateStudent, softDeleteStudent } from "@/lib/storage/mutations";
import { syncNow } from "@/lib/storage/syncEngine";
import type { Student, SubscriptionTier, MemorizationAmount, AppUser } from "@/lib/types";
import { surahs } from "@/lib/surahs";
import { motion, AnimatePresence } from "framer-motion";
import Modal, { ModalSection } from "@/components/ui/Modal";
import {
  Users, Plus, Search, Filter, X, ChevronDown,
  Phone, BookOpen, Calendar, UserCheck, UserX,
  MoreVertical, Edit, Trash2, Eye, Check,
  ArrowUpDown, Download, Share2, MessageCircle,
  ArrowLeftRight, Clock, History, Loader2,
  LayoutGrid, LayoutList, AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { getDialCode } from "@/lib/countries";
import { PhotoPicker } from "@/components/ui/PhotoPicker";

// ─── نموذج إضافة طالب ────────────────────────────────────

const EDUCATION_GROUPS = [
  { label: "الطور الابتدائي", levels: ["1 ابتدائي", "2 ابتدائي", "3 ابتدائي", "4 ابتدائي", "5 ابتدائي"] },
  { label: "الطور المتوسط",   levels: ["1 متوسط", "2 متوسط", "3 متوسط", "4 متوسط"] },
  { label: "الطور الثانوي",  levels: ["1 ثانوي", "2 ثانوي", "3 ثانوي", "بكالوريا"] },
  { label: "أخرى",           levels: ["روضة", "تحضيري", "جامعي", "متوقف عن الدراسة"] },
];
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
  photoURL?: string;
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
  schoolCountry,
  defaultGroupName,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: StudentFormData) => Promise<void>;
  initial?: StudentFormData;
  groups: string[];
  schoolCountry?: string;
  defaultGroupName?: string;
}) {
  const [form, setForm] = useState<StudentFormData>(initial ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({});
  const [ageInput, setAgeInput] = useState("");

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm(initial);
        if (initial.birthDate) {
          const age = new Date().getFullYear() - new Date(initial.birthDate).getFullYear();
          setAgeInput(age.toString());
        } else {
          setAgeInput("");
        }
      } else {
        const dial = getDialCode(schoolCountry);
        setForm({ ...EMPTY_FORM, phone1: dial, groupName: defaultGroupName ?? "" });
        setAgeInput("");
      }
      setErrors({});
    }
  }, [open, initial, schoolCountry, defaultGroupName]);

  // Handle Age Input
  const handleAgeChange = (val: string) => {
    setAgeInput(val);
    const num = parseInt(val);
    if (!isNaN(num) && num > 0 && num < 100) {
      const year = new Date().getFullYear() - num;
      set("birthDate", `${year}-01-01`);
    } else {
      set("birthDate", "");
    }
  };

  const handleBirthDateChange = (val: string) => {
    set("birthDate", val);
    if (val) {
      const age = new Date().getFullYear() - new Date(val).getFullYear();
      setAgeInput(age.toString());
    } else {
      setAgeInput("");
    }
  };

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

  const iconEl = (
    <div className="relative">
      <PhotoPicker
        currentPhoto={form.photoURL}
        displayName={form.fullName || "ط"}
        size="md"
        onPhotoChange={(url) => set("photoURL", url ?? "")}
      />
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={initial ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
      description={initial ? "انقر الصورة لتغييرها" : "أدخل بيانات الطالب بالكامل"}
      icon={iconEl}
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-3">
            إلغاء
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit as any}
            className="btn-primary flex-1 justify-center py-3 text-sm"
          >
            {saving ? "جارٍ الحفظ..." : initial ? "حفظ التعديلات" : "إضافة الطالب"}
            {!saving && <Check className="w-4 h-4" />}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-8">

        {/* ─── القسم 1: معلومات الطالب */}
        <ModalSection title="معلومات الطالب">
          <div className="grid sm:grid-cols-2 gap-4">

            {/* الاسم */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">الاسم الكامل *</label>
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
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">الجنس</label>
              <div className="flex gap-2">
                {(["ذكر", "أنثى"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => set("gender", g)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      form.gender === g
                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                        : "bg-white dark:bg-[var(--color-card)] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-[var(--color-primary)]/40"
                    }`}
                  >
                    {g === "ذكر" ? "👦 ذكر" : "👧 أنثى"}
                  </button>
                ))}
              </div>
            </div>

            {/* تاريخ + العمر */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">تاريخ الميلاد *</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className={`input-field ${errors.birthDate ? "border-red-400" : ""}`}
                />
                <input
                  type="number"
                  value={ageInput}
                  onChange={(e) => handleAgeChange(e.target.value)}
                  className="input-field"
                  placeholder="العمر"
                />
              </div>
              {errors.birthDate && <p className="text-xs text-red-500">{errors.birthDate}</p>}
            </div>

          </div>

          {/* المستوى الدراسي — بطاقات */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">المستوى الدراسي</label>
            <div className="space-y-3">
              {EDUCATION_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1.5">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.levels.map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => set("educationalLevel", lvl)}
                        className={`px-3.5 py-1.5 rounded-xl text-sm font-bold border-2 transition-all ${
                          form.educationalLevel === lvl
                            ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                            : "bg-white dark:bg-[var(--color-card)] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-[var(--color-primary)]/40"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ModalSection>

        {/* ─── القسم 2: ولي الأمر */}
        <ModalSection title="ولي الأمر">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">اسم ولي الأمر *</label>
              <input
                value={form.guardianName}
                onChange={(e) => set("guardianName", e.target.value)}
                placeholder="الاسم الكامل"
                className={`input-field ${errors.guardianName ? "border-red-400" : ""}`}
              />
              {errors.guardianName && <p className="text-xs text-red-500">{errors.guardianName}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">هاتف 1 *</label>
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
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">هاتف 2 (اختياري)</label>
              <input
                value={form.phone2}
                onChange={(e) => set("phone2", e.target.value)}
                placeholder="+213 6XX XXX XXX"
                dir="ltr"
                className="input-field text-right"
              />
            </div>
          </div>
        </ModalSection>

        {/* ─── القسم 3: الفوج والاشتراك */}
        <ModalSection title="المجموعة والاشتراك">
          <div className="grid sm:grid-cols-2 gap-4">

            {/* الفوج */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">الفوج / المجموعة *</label>
              {defaultGroupName ? (
                <div className="input-field bg-gray-50 dark:bg-white/3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span>🏷️</span>
                  <span className="font-bold">{form.groupName}</span>
                  <span className="text-[10px] text-gray-400 mr-auto">مُعيَّن تلقائياً</span>
                </div>
              ) : (
                <>
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
                </>
              )}
              {errors.groupName && <p className="text-xs text-red-500">{errors.groupName}</p>}
            </div>

            {/* فئة الاشتراك */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">فئة الاشتراك</label>
              <div className="flex gap-2">
                {SUBSCRIPTION_TIERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("subscriptionTier", t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      form.subscriptionTier === t
                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                        : "bg-white dark:bg-[var(--color-card)] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-[var(--color-primary)]/40"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 pr-1 border-r-2 border-indigo-200">
                فئة الأصاغر تكون مخفضة السعر.
              </p>
            </div>

            {/* كمية التحفيظ */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">كمية التحفيظ اليومي</label>
              <div className="flex flex-wrap gap-2">
                {MEMORIZATION_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => set("dailyMemorizationAmount", a)}
                    className={`px-3.5 py-1.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      form.dailyMemorizationAmount === a
                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                        : "bg-white dark:bg-[var(--color-card)] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-[var(--color-primary)]/40"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* عدد السور */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">السور المحفوظة (عدد)</label>
              <input
                type="number" min={0} max={114}
                value={form.memorizedSurahsCount}
                onChange={(e) => set("memorizedSurahsCount", +e.target.value)}
                className="input-field"
              />
            </div>

          </div>
        </ModalSection>

        {/* ─── القسم 4: ملاحظات */}
        <ModalSection title="ملاحظات">
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            placeholder="أي معلومات إضافية عن الطالب..."
            className="input-field resize-none"
          />
        </ModalSection>

      </form>
    </Modal>
  );
}

// ─── Modal نقل الطالب إلى فوج آخر ───────────────────────

function TransferModal({
  student, schoolId, open, onClose, onTransfer,
}: {
  student: Student;
  schoolId: string;
  open: boolean;
  onClose: () => void;
  onTransfer: (student: Student, newTeacherId: string, newGroupName: string, reason: string) => Promise<void>;
}) {
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [existingGroups, setExistingGroups] = useState<string[]>([]);
  const [newTeacherId, setNewTeacherId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const TRANSFER_REASONS = [
    "ترقية بعد ختم جزء",
    "تغيير توقيت الحضور",
    "طلب ولي الأمر",
    "توازن أعداد الأفواج",
  ];

  useEffect(() => {
    if (!open) return;
    
    const loadData = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("users")
        .select("id, display_name, group_name")
        .eq("school_id", schoolId)
        .eq("role", "teacher")
        .eq("is_active", true);
        
      if (data) {
        setTeachers(data.map(u => ({
          id: u.id,
          displayName: u.display_name,
          groupName: u.group_name || "بدون اسم"
        })) as any[]);
      }
    };
    
    loadData();
    setNewTeacherId("");
    setNewGroupName("");
    setReason("");
  }, [open, schoolId]);

  const handleTransfer = async () => {
    if (!newTeacherId || !newGroupName || !reason.trim()) return;
    setSaving(true);
    await onTransfer(student, newTeacherId, newGroupName, reason.trim());
    setSaving(false);
    onClose();
  };

  const valid = newTeacherId && newGroupName && reason.trim();

  const footer = (
    <div className="flex gap-3 w-full">
      <button onClick={onClose} className="btn-secondary flex-1 py-2.5 justify-center text-sm">إلغاء</button>
      <button onClick={handleTransfer} disabled={!valid || saving}
        className="btn-primary flex-1 py-2.5 justify-center text-sm disabled:opacity-40">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
        تأكيد النقل
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} size="md"
      title="نقل الطالب إلى فوج آخر"
      description={student.fullName}
      footer={footer}>
      <div className="space-y-4 py-2">
        {/* الفوج الحالي */}
        <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-500">من (الفوج الحالي)</p>
            <p className="text-sm font-black text-gray-800">{student.groupName}</p>
          </div>
        </div>

        {/* الفوج والمعلم الجديد */}
        <div className="space-y-1">
          <label className="text-xs font-black text-gray-500 uppercase tracking-wider">إلى الفوج والمعلم *</label>
          <select 
            value={newTeacherId} 
            onChange={e => {
              const tid = e.target.value;
              setNewTeacherId(tid);
              const teacher = teachers.find(t => t.id === tid);
              if (teacher) setNewGroupName(teacher.groupName || "بدون اسم");
            }}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[var(--color-primary)]/60">
            <option value="">اختر الفوج الجديد...</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>
                {t.groupName ? `فوج ${t.groupName}` : "بدون فوج"} - أ. {t.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* سبب النقل */}
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-500 uppercase tracking-wider">سبب النقل *</label>
          <div className="flex flex-wrap gap-2">
            {TRANSFER_REASONS.map(r => (
              <button key={r} type="button" onClick={() => setReason(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                  reason === r ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}>{r}</button>
            ))}
          </div>
          <textarea value={reason} onChange={e => setReason(e.target.value)}
            placeholder="أو اكتب سبباً آخر..."
            rows={2}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[var(--color-primary)]/60 resize-none" />
        </div>
      </div>
    </Modal>
  );
}

// ─── تاريخ الطالب (Timeline) ───────────────────────
function StudentTimelineModal({ student, open, onClose }: { student: Student; open: boolean; onClose: () => void }) {
  const events: { date: string; title: string; detail: string; color: string; emoji: string }[] = [];

  events.push({ date: student.registrationDate, title: "التسجيل الأول", detail: `دخل الفوج: ${student.groupName}`, color: "bg-emerald-500", emoji: "📋" });

  student.transferHistory?.forEach(t => {
    if (t.fromGroupName !== "تسجيل مبدئي") {
      events.push({ date: t.date, title: "نقل بين الأفواج", detail: `${t.fromGroupName} ← ${t.toGroupName} | سبب: ${t.reason}`, color: "bg-blue-500", emoji: "📦" });
    }
  });

  student.covenants?.forEach(c => {
    events.push({ date: c.date, title: `تعهد: ${c.type}`, detail: c.text, color: "bg-amber-500", emoji: "📝" });
  });

  student.expulsionHistory?.forEach(e => {
    events.push({ date: e.date, title: "طرد / إيقاف", detail: e.reason, color: "bg-red-500", emoji: "❌" });
  });

  events.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Modal open={open} onClose={onClose} size="md" title="سيرة الطالب" description={student.fullName}>
      <div className="py-2">
        {events.length === 0 ? (
          <p className="text-center text-gray-400 py-8 font-bold">لا يوجد سجل تاريخي بعد</p>
        ) : (
          <div className="relative">
            <div className="absolute right-3.5 top-0 bottom-0 w-0.5 bg-gray-100" />
            <div className="space-y-5">
              {events.map((ev, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className={`w-7 h-7 rounded-full ${ev.color} flex items-center justify-center text-sm shrink-0 z-10 shadow-sm`}>
                    <span className="text-xs">{ev.emoji}</span>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-2xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-black text-gray-800">{ev.title}</p>
                      <span className="text-[10px] text-gray-400 font-bold">{new Date(ev.date).toLocaleDateString("ar-DZ")}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-bold">{ev.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function StudentCard({
  student,
  onEdit,
  onDelete,
  onTransfer,
  onHistory,
  absenceCount = 0,
  lastAttendanceDate,
}: {
  student: Student;
  onEdit: (s: Student) => void;
  onDelete: (s: Student) => void;
  onTransfer: (s: Student) => void;
  onHistory: (s: Student) => void;
  absenceCount?: number;
  lastAttendanceDate?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const statusColor =
    student.status === "نشط"
      ? "bg-emerald-50 text-emerald-700"
      : student.status === "موقوف"
      ? "bg-amber-50 text-amber-700"
      : "bg-red-50 text-red-700";
  const isAtRisk = absenceCount >= 3;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-all duration-200 group ${
        isAtRisk
          ? "border-red-200 hover:border-red-300 bg-red-50/10"
          : "border-[var(--color-border)] hover:border-[var(--color-primary)]/20"
      }`}
    >
      {/* مؤشر الخطر */}
      {isAtRisk && (
        <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
          <span className="text-[11px] font-black text-red-600">{absenceCount} غيابات — يحتاج متابعة</span>
        </div>
      )}
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
                  onClick={() => { onTransfer(student); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  نقل إلى فوج آخر
                </button>
                <button
                  onClick={() => { onHistory(student); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-purple-600 hover:bg-purple-50 transition-colors"
                >
                  <History className="w-4 h-4" />
                  سيرة الطالب
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

      {/* آخر حضور */}
      {lastAttendanceDate && (
        <div className="flex items-center gap-1.5 mb-3 text-[10px] text-gray-400 font-bold">
          <Clock className="w-3 h-3 shrink-0 text-gray-300" />
          <span>آخر حضور: {new Date(lastAttendanceDate).toLocaleDateString("ar-DZ", { weekday: "short", day: "numeric", month: "short" })}</span>
        </div>
      )}

      {/* Contact + رابط الولي */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
          <Phone className="w-3 h-3" />
          <span dir="ltr" className="font-mono truncate max-w-[90px]">{student.phone1}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* واتسآب مباشر */}
          {student.phone1 && (
            <button
              onClick={() => {
                const phone = student.phone1.replace(/\D/g, "");
                const normalized = phone.startsWith("0") ? "213" + phone.slice(1) : phone;
                window.open(`https://wa.me/${normalized}`, "_blank");
              }}
              title="فتح واتسآب لولي الأمر"
              className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
          )}
          {/* نسخ رابط متابعة الطالب */}
          <button
            onClick={() => {
              const url = `${window.location.origin}/student/${student.id}`;
              navigator.clipboard.writeText(url)
                .then(() => alert(`✅ تم نسخ رابط المتابعة!\n\nأرسله للولي عبر واتسآب:\n${url}`))
                .catch(() => alert(`رابط الولي:\n${window.location.origin}/student/${student.id}`));
            }}
            title="نسخ رابط متابعة الطالب لولي الأمر"
            className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <Link
            href={`/app/students/${student.id}`}
            className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
          >
            الملف
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

function StudentsPage() {
  const { user, school, isPrincipal } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [transferTarget, setTransferTarget] = useState<Student | null>(null);
  const [timelineTarget, setTimelineTarget] = useState<Student | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"الكل" | "نشط" | "موقوف" | "مطرود">("الكل");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [filterGender, setFilterGender] = useState<"الكل" | "ذكر" | "أنثى">("الكل");
  const [filterSurahId, setFilterSurahId] = useState<number | 0>(0);
  const [sortBy, setSortBy] = useState<"name" | "surahs" | "date">("name");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  // بيانات الغيابات + آخر حضور
  const [studentAttendance, setStudentAttendance] = useState<Map<string, { absences: number; lastAttendance: string }>>(new Map());

  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");

  const loadStudents = useCallback(async () => {
    if (!school?.id || !user?.id) return;
    setLoading(true);

    if (isPrincipal || user.role === "super_admin") {
      const supabase = createClient();
      
      // جلب المعلمين من Supabase
      const { data: usersData } = await supabase
        .from("users")
        .select("id, display_name, group_name")
        .eq("school_id", school.id)
        .eq("role", "teacher")
        .eq("is_active", true)
        .order("display_name", { ascending: true });

      setTeachers((usersData || []).map(u => ({
         id: u.id, displayName: u.display_name, groupName: u.group_name 
      })) as any[]);

      // جلب الطلاب مباشرة من Supabase لضمان التحديث الفوري المباشر للحساب الإداري
      let query = supabase.from("students").select("id, school_id, teacher_id, group_name, full_name, gender, birth_date, educational_level, guardian_name, phone1, phone2, status, subscription_tier, memorized_surahs_count, daily_memorization_amount, registration_date, current_surah_id, created_at, updated_at").eq("school_id", school.id);
      
      if (selectedTeacherId !== "all") {
        query = query.eq("teacher_id", selectedTeacherId);
      }
      
      const { data: studentsData } = await query.order("full_name", { ascending: true });
      
      const mapped: Student[] = (studentsData || []).map((s: any) => ({
        id: s.id,
        schoolId: s.school_id,
        teacherId: s.teacher_id,
        groupName: s.group_name || "",
        fullName: s.full_name || "",
        gender: s.gender,
        birthDate: s.birth_date || "",
        educationalLevel: s.educational_level || "ابتدائي",
        guardianName: s.guardian_name || "",
        phone1: s.phone1 || "",
        phone2: s.phone2 || "",
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
    } else {
      const db = getDB();
      const data = await getStudentsByTeacher(user.id);
      setStudents(data);
    }
    setLoading(false);
  }, [school?.id, user?.id, user?.role, isPrincipal, selectedTeacherId]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  // تحميل بيانات الغيابات وآخر حضور من الحصص المحلية
  useEffect(() => {
    if (students.length === 0) return;
    const load = async () => {
      const db = getDB();
      const allSessions = await db.sessions.toArray();
      const map = new Map<string, { absences: number; lastAttendance: string }>();
      students.forEach(s => map.set(s.id, { absences: 0, lastAttendance: "" }));
      allSessions.forEach(session => {
        session.records?.forEach(rec => {
          if (!map.has(rec.studentId)) return;
          const cur = map.get(rec.studentId)!;
          if (["حاضر", "متأخر", "تعويض"].includes(rec.attendance)) {
            if (!cur.lastAttendance || session.date > cur.lastAttendance) cur.lastAttendance = session.date;
          } else if (rec.attendance === "غائب") {
            cur.absences++;
          }
        });
      });
      setStudentAttendance(new Map(map));
    };
    load();
  }, [students]);

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
        s.guardianName?.toLowerCase().includes(search.toLowerCase()) ||
        s.phone1?.includes(search);
      const matchStatus = filterStatus === "الكل" || s.status === filterStatus;
      const matchGender = filterGender === "الكل" || s.gender === filterGender;
      const matchSurah = !filterSurahId || s.currentSurahId === filterSurahId;
      return matchSearch && matchStatus && matchGender && matchSurah;
    });

    result.sort((a, b) => {
      if (sortBy === "name") return a.fullName.localeCompare(b.fullName, "ar");
      if (sortBy === "surahs") return b.memorizedSurahsCount - a.memorizedSurahsCount;
      if (sortBy === "date") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

    return result;
  }, [students, search, filterStatus, filterGender, filterSurahId, sortBy]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [search, filterStatus, filterGender, sortBy]);

  // Paginated slice
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedStudents = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
    await syncNow();
    await loadStudents();
  };

  // نقل الطالب إلى فوج آخر
  const handleTransfer = async (student: Student, newTeacherId: string, newGroupName: string, reason: string) => {
    const db = getDB();
    const newTeacher = await db.users.get(newTeacherId);
    const transferRecord = {
      date: new Date().toISOString().split("T")[0],
      fromTeacherId: student.teacherId,
      fromTeacherName: teachers.find(t => t.id === student.teacherId)?.displayName ?? "",
      fromGroupName: student.groupName,
      toTeacherId: newTeacherId,
      toTeacherName: newTeacher?.displayName ?? "",
      toGroupName: newGroupName,
      reason,
    };
    await updateStudent(student.id, {
      teacherId: newTeacherId,
      groupName: newGroupName,
      transferHistory: [...(student.transferHistory ?? []), transferRecord],
    });
    await syncNow();
    await loadStudents();
  };

  // حذف طالب
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await softDeleteStudent(deleteTarget.id, "حذف يدوي من لوحة التحكم");
    setDeleteTarget(null);
    await syncNow();
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

  const activeCount   = students.filter(s => s.status === "نشط").length;
  const suspendCount  = students.filter(s => s.status === "موقوف").length;
  const expelledCount = students.filter(s => s.status === "مطرود").length;
  const atRiskCount   = [...studentAttendance.values()].filter(v => v.absences >= 3).length;

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

      {/* شريط الإحصائيات السريعة */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "نشط",         count: activeCount,   color: "bg-emerald-50 border-emerald-200 text-emerald-700", icon: "✅" },
          { label: "موقوف",       count: suspendCount,  color: "bg-amber-50 border-amber-200 text-amber-700",       icon: "⏸️" },
          { label: "مطرود",       count: expelledCount, color: "bg-red-50 border-red-200 text-red-700",             icon: "❌" },
          { label: "بحاجة متابعة", count: atRiskCount,   color: "bg-orange-50 border-orange-200 text-orange-700",   icon: "🔴" },
        ].map(({ label, count, color, icon }) => (
          <div key={label} className={`rounded-2xl border p-4 flex items-center gap-3 ${color}`}>
            <span className="text-xl leading-none">{icon}</span>
            <div>
              <p className="text-2xl font-black leading-none" style={{ fontFamily: "var(--font-headline)" }}>{count}</p>
              <p className="text-xs font-bold mt-0.5 opacity-70">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* شريط البحث والفلترة */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4 space-y-4">
        {/* بحث + فلتر السورة */}
        <div className="flex gap-2">
          <div className="relative flex-1">
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
          <select
            value={filterSurahId}
            onChange={e => setFilterSurahId(+e.target.value)}
            className="h-11 border-2 border-gray-100 rounded-xl px-3 text-sm font-bold text-gray-600 focus:outline-none focus:border-[var(--color-primary)]/50 bg-white min-w-[140px]"
          >
            <option value={0}>📖 أي سورة</option>
            {surahs.map(s => (
              <option key={s.id} value={s.id}>سورة {s.name}</option>
            ))}
          </select>
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

          {/* ترتيب */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 border-0 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          >
            <option value="name">ترتيب: الاسم</option>
            <option value="surahs">ترتيب: عدد السور</option>
            <option value="date">ترتيب: تاريخ الإضافة</option>
          </select>

          {/* أزرار العرض جدول/بطاقات */}
          <div className="flex bg-gray-100 p-1 rounded-full text-xs font-bold mr-auto">
             <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all ${
                  viewMode === "table" ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
             >
               جدول <LayoutList className="w-4 h-4" />
             </button>
             <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all ${
                  viewMode === "grid" ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
             >
               بطاقات <LayoutGrid className="w-4 h-4" />
             </button>
          </div>
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
            <div key={i} className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5 overflow-hidden relative">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/5 to-transparent" />
              <div className="flex gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-100 dark:bg-white/8 rounded-2xl" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-gray-100 dark:bg-white/8 rounded-lg w-3/4" />
                  <div className="h-3 bg-gray-100 dark:bg-white/8 rounded-lg w-1/2" />
                </div>
              </div>
              <div className="h-px bg-gray-100 dark:bg-white/5 mb-4" />
              <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-12 bg-gray-100 dark:bg-white/8 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {paginatedStudents.map((student) => {
                  const att = studentAttendance.get(student.id);
                  return (
                    <StudentCard
                      key={student.id}
                      student={student}
                      onEdit={handleEdit}
                      onDelete={setDeleteTarget}
                      onTransfer={setTransferTarget}
                      onHistory={setTimelineTarget}
                      absenceCount={att?.absences ?? 0}
                      lastAttendanceDate={att?.lastAttendance || undefined}
                    />
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ) : (
             <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm">
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-right">
                   <thead className="bg-gray-50/80 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 font-black">
                     <tr>
                       <th className="px-5 py-4 w-1/3">الاسم والفوج</th>
                       <th className="px-4 py-4 w-1/6">الحالة</th>
                       <th className="px-4 py-4 w-1/6">الحفظ</th>
                       <th className="px-4 py-4 w-1/6">رقم الولي</th>
                       <th className="px-4 py-4 text-center w-1/6">إجراءات</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                     {paginatedStudents.map((student) => (
                       <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                         <td className="px-5 py-3">
                           <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0 ${
                                student.gender === "أنثى"
                                  ? "bg-gradient-to-br from-pink-400 to-rose-500"
                                  : "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]"
                              }`}>
                                {student.fullName[0]}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white leading-snug truncate max-w-[150px] sm:max-w-xs">{student.fullName}</p>
                                <p className="text-[11px] text-gray-400 font-medium">{student.groupName || "بدون فوج"}</p>
                              </div>
                           </div>
                         </td>
                         <td className="px-4 py-3">
                           <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold leading-none ${
                             student.status === "نشط" ? "bg-emerald-50 text-emerald-700" :
                             student.status === "موقوف" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                           }`}>
                             {student.status}
                           </span>
                         </td>
                         <td className="px-4 py-3">
                           <div className="flex items-center gap-1.5 opacity-80">
                             <BookOpen className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                             <span className="font-bold text-gray-700 dark:text-gray-300">
                               {student.memorizedSurahsCount} <span className="font-medium text-[10px]">سورة</span>
                             </span>
                           </div>
                         </td>
                         <td className="px-4 py-3">
                           <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                             <Phone className="w-3 h-3" />
                             <span dir="ltr" className="font-mono text-xs">{student.phone1}</span>
                           </div>
                         </td>
                         <td className="px-4 py-3">
                           <div className="flex items-center justify-center gap-1.5">
                             <Link href={`/app/students/${student.id}`} className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-white hover:text-blue-600 hover:shadow-sm border border-transparent hover:border-gray-200 text-gray-400 flex items-center justify-center transition-all" title="عرض الملف">
                               <Eye className="w-4 h-4" />
                             </Link>
                             <button onClick={() => handleEdit(student)} className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-white hover:text-amber-500 hover:shadow-sm border border-transparent hover:border-gray-200 text-gray-400 flex items-center justify-center transition-all" title="تعديل">
                               <Edit className="w-4 h-4" />
                             </button>
                             <div className="w-px h-4 bg-gray-200 mx-0.5" />
                             <button onClick={() => setTransferTarget(student)} className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-white hover:text-blue-600 hover:shadow-sm border border-transparent hover:border-gray-200 text-gray-400 flex items-center justify-center transition-all" title="نقل إلى فوج آخر">
                               <ArrowLeftRight className="w-4 h-4" />
                             </button>
                             <button onClick={() => setTimelineTarget(student)} className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-white hover:text-purple-600 hover:shadow-sm border border-transparent hover:border-gray-200 text-gray-400 flex items-center justify-center transition-all" title="سيرة الطالب">
                               <History className="w-4 h-4" />
                             </button>
                             <button onClick={() => setDeleteTarget(student)} className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-white hover:text-red-500 hover:shadow-sm border border-transparent hover:border-gray-200 text-gray-400 flex items-center justify-center transition-all" title="حذف">
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 py-2">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                عرض {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} من {filtered.length} طالب
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-9 h-9 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[var(--color-card)] flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-sm"
                >
                  ›
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page = i + 1;
                  if (totalPages > 5) {
                    if (currentPage <= 3) page = i + 1;
                    else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                    else page = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
                        currentPage === page
                          ? "bg-[var(--color-primary)] text-white shadow-sm"
                          : "bg-white dark:bg-[var(--color-card)] border border-[var(--color-border)] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/8"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[var(--color-card)] flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-sm"
                >
                  ‹
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal إضافة/تعديل */}
      <StudentModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        initial={editFormData}
        groups={groups}
        schoolCountry={school?.country}
        defaultGroupName={!isPrincipal && user?.role === "teacher" ? (user?.groupName ?? undefined) : undefined}
      />

      {/* Modal تأكيد الحذف */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        size="sm"
      >
        {deleteTarget && (
          <div className="p-8 text-center">
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
        )}
      </Modal>

      {/* Modal نقل الطالب */}
      {transferTarget && school && (
        <TransferModal
          student={transferTarget}
          schoolId={school.id}
          open={!!transferTarget}
          onClose={() => setTransferTarget(null)}
          onTransfer={handleTransfer}
        />
      )}

      {/* Modal سيرة الطالب */}
      {timelineTarget && (
        <StudentTimelineModal
          student={timelineTarget}
          open={!!timelineTarget}
          onClose={() => setTimelineTarget(null)}
        />
      )}
    </div>
  );
}

// ── Guard wrapper (auto-generated) ──
export default function StudentsPagePage() {
  return (
    <SchoolGuard>
      <StudentsPage />
    </SchoolGuard>
  );
}
