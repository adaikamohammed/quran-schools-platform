"use client";
import SchoolGuard from "@/components/layout/SchoolGuard";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Modal, { ModalSection } from "@/components/ui/Modal";
import { 
  Users, Plus, Search, Edit, Trash2, X, AlertTriangle, CheckCircle2,
  Shield, UserCog, BookOpen
} from "lucide-react";
import { getDialCode } from "@/lib/countries";
import { PhotoPicker } from "@/components/ui/PhotoPicker";

const supabase = createClient();

// ─── Modal إضافة/تعديل معلم ────────────────────────────
function TeacherModal({
  teacher,
  schoolName,
  schoolCountry,
  onSave,
  onClose,
}: {
  teacher?: any;
  schoolName?: string;
  schoolCountry?: string;
  onSave: (t: any) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    displayName: teacher?.display_name || "",
    email: teacher?.email || "",
    password: "",
    groupName: teacher?.group_name || "",
    phone: teacher?.phone || getDialCode(schoolCountry),
    gender: teacher?.gender || "ذكر",
    photoURL: teacher?.photo_url || undefined,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!form.displayName.trim() || !form.email.trim() || (!teacher && !form.password)) {
      setError("يرجى تعبئة جميع الحقول الإجبارية (الاسم، البريد، كلمة المرور)");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ ...form });
      onClose();
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الحفظ");
      setSaving(false);
    }
  };

  const iconEl = (
    <div className="relative">
      <PhotoPicker
        currentPhoto={form.photoURL}
        displayName={form.displayName || "م"}
        size="md"
        onPhotoChange={(url) => setForm({ ...form, photoURL: url ?? undefined })}
      />
    </div>
  );

  const footer = (
    <div className="flex gap-3 w-full">
      <button onClick={onClose} className="btn-secondary flex-1 py-3 justify-center text-sm">إلغاء</button>
      <button onClick={handleSave} disabled={saving}
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-bold shadow-md transition-colors disabled:opacity-50">
        {saving ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
        حفظ البيانات
      </button>
    </div>
  );

  return (
    <Modal
      open={true}
      onClose={onClose}
      size="md"
      title={teacher ? "تعديل بيانات المعلم" : "إضافة معلم جديد"}
      description={schoolName}
      icon={iconEl}
      footer={footer}
    >
      <div className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">الاسم الكامل <span className="text-red-500">*</span></label>
            <input type="text" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="محمد أمين" className="input-field py-2.5 text-sm w-full" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">اسم الفوج / الحلقة</label>
            <input type="text" value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })}
              placeholder="فوج الإمام مالك" className="input-field py-2.5 text-sm w-full" />
          </div>

          <div className="col-span-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">البريد الإلكتروني <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="teacher@school.com" className="input-field py-2.5 text-sm w-full" dir="ltr"
              disabled={!!teacher} />
          </div>

          <div className="col-span-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">كلمة المرور {teacher && "(اتركها فارغة للحفاظ على القديمة)"} {!teacher && <span className="text-red-500">*</span>}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••" className="input-field py-2.5 text-sm w-full" dir="ltr" />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">رقم الهاتف</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0600000000" className="input-field py-2.5 text-sm w-full text-left" dir="ltr" />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">الجنس</label>
            <div className="flex gap-2">
              {(["ذكر", "أنثى"] as const).map((g) => (
                <button key={g} onClick={() => setForm({ ...form, gender: g })}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    form.gender === g
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                      : "bg-white dark:bg-[var(--color-card)] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-[var(--color-primary)]/40"
                  }`}>{g}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────
function TeachersPage() {
  const { user, school, isPrincipal } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [studentsCount, setStudentsCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingTeacher, setEditingTeacher] = useState<any>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user?.schoolId) return;
    setLoading(true);

    const { data: usersData, error } = await supabase
      .from("users")
      .select("*")
      .eq("school_id", user.schoolId)
      .eq("role", "teacher")
      .eq("is_active", true)
      .order("display_name", { ascending: true });

    if (error) {
      console.error("Teachers load error:", error);
      setLoading(false);
      return;
    }

    setTeachers(usersData || []);

    // حساب عدد الطلاب لكل معلم
    const counts: Record<string, number> = {};
    for (const t of (usersData || [])) {
      const { count } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", t.id);
      counts[t.id] = count || 0;
    }
    setStudentsCount(counts);
    setLoading(false);
  }, [user?.schoolId]);

  useEffect(() => { load(); }, [load]);

  const filtered = teachers.filter(t =>
    !search ||
    t.display_name?.includes(search) ||
    t.group_name?.includes(search) ||
    t.email?.includes(search)
  );

  const handleSave = async (data: any) => {
    if (!user?.schoolId) return;

    if (!editingTeacher) {
      // إنشاء معلم جديد عبر API يتعامل مع auth.users و public.users معاً
      const res = await fetch("/api/teachers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: user.schoolId,
          displayName: data.displayName,
          email: data.email,
          password: data.password,
          groupName: data.groupName || "فوج عام",
          phone: data.phone,
          gender: data.gender,
          photoURL: data.photoURL,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "فشل إنشاء الحساب");
      }
    } else {
      // تحديث الملف التعريفي فقط (ليس البريد أو كلمة المرور بشكل آمن)
      const updatePayload: any = {
        display_name: data.displayName,
        group_name: data.groupName || editingTeacher.group_name,
        phone: data.phone,
        gender: data.gender,
        photo_url: data.photoURL,
      };

      await supabase.from("users").update(updatePayload).eq("id", editingTeacher.id);
    }

    await load();
  };

  const handleDelete = async (id: string, name: string, studentCount: number) => {
    if (studentCount > 0) {
      alert(`لا يمكن حذف المعلم لأن لديه ${studentCount} طلاب. يرجى نقل الطلاب لمعلم آخر أولاً.`);
      return;
    }

    if (confirm(`هل أنت متأكد من حذف حساب المعلم ${name} نهائياً؟`)) {
      const res = await fetch("/api/teachers/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert("خطأ: " + err.error);
        return;
      }

      setTeachers(prev => prev.filter(t => t.id !== id));
    }
  };

  if (!isPrincipal) {
    return <div className="text-center py-20 text-red-500 font-bold">عذراً، هذه الصفحة مخصصة للمدير والإدارة فقط.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
            <Users className="w-6 h-6 text-[var(--color-primary)]" />
            إدارة الأفواج والمعلمين
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            {teachers.length} معلم مسجل في {school?.name}
          </p>
        </div>

        <button onClick={() => { setEditingTeacher(undefined); setIsModalOpen(true); }}
          className="btn-primary py-2.5 px-5 text-sm">
          <Plus className="w-4 h-4" /> إضافة معلم / فوج
        </button>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-5">
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم المعلم، الفوج، أو البريد..."
            className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)] bg-gray-50/50" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">
              {teachers.length === 0 ? "لم يُسجَّل أي معلم بعد. أضف معلماً الآن!" : "لا توجد نتائج مطابقة"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => (
              <div key={t.id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow bg-white flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl shrink-0 overflow-hidden bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]">
                      {t.photo_url ? (
                        <img src={t.photo_url} alt="photo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-black text-xl" style={{ fontFamily: "var(--font-headline)" }}>
                          {t.display_name[0]}
                        </div>
                      )}
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-900 truncate" title={t.display_name}>
                          {t.display_name}
                        </h3>
                        <p className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-md inline-block mt-1">
                          {t.group_name || "بدون فوج"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 mt-4 text-xs text-gray-500 font-medium">
                    <p className="flex justify-between"><span className="opacity-70">البريد:</span> <span className="text-gray-800 font-bold select-all truncate">{t.email}</span></p>
                    <div className="h-px bg-gray-100 my-2" />
                    <p className="flex justify-between items-center"><span className="opacity-70">إجمالي الطلاب:</span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-lg font-black flex items-center gap-1.5">
                        <Users className="w-3 h-3" /> {studentsCount[t.id] || 0}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-5 pt-3 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingTeacher(t); setIsModalOpen(true); }}
                    className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
                    <Edit className="w-3.5 h-3.5" /> تعديل
                  </button>
                  <button onClick={() => handleDelete(t.id, t.display_name, studentsCount[t.id] || 0)}
                    className="w-9 shrink-0 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl flex items-center justify-center transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <TeacherModal
          teacher={editingTeacher}
          schoolName={school?.name}
          schoolCountry={school?.country}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

// ── Guard wrapper (auto-generated) ──
export default function TeachersPagePage() {
  return (
    <SchoolGuard>
      <TeachersPage />
    </SchoolGuard>
  );
}
