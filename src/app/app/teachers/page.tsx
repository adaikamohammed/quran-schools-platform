"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import type { AppUser } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Plus, Search, Edit, Trash2, X, AlertTriangle, CheckCircle2,
  Shield, Key, UserCog, BookOpen
} from "lucide-react";
import { v4 as uuid } from "uuid";

// ─── Modal إضافة/تعديل معلم ────────────────────────────

function TeacherModal({
  teacher,
  onSave,
  onClose,
}: {
  teacher?: AppUser;
  onSave: (t: Partial<AppUser>) => Promise<void>;
  onClose: () => void;
}) {
  const { school } = useAuth();
  const [form, setForm] = useState({
    displayName: teacher?.displayName || "",
    email: teacher?.email || "",
    password: "", // لإعداد كلمة مرور جديدة
    groupName: teacher?.groupName || "",
    phone: teacher?.phone || "",
    gender: teacher?.gender || "ذكر",
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
      await onSave({
        displayName: form.displayName.trim(),
        email: form.email.trim().toLowerCase(),
        passwordHash: form.password ? form.password : undefined, // سيتم تشفيرها لاحقاً أو في AuthContext
        groupName: form.groupName.trim() || "فوج عام",
        phone: form.phone.trim(),
        gender: form.gender as "ذكر" | "أنثى",
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الحفظ");
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white">
            <div className="flex items-center gap-3">
              <UserCog className="w-5 h-5 text-white/80" />
              <div>
                <h3 className="font-black text-sm">{teacher ? "تعديل بيانات المعلم" : "إضافة معلم جديد"}</h3>
                <p className="text-white/70 text-xs">{school?.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="label-xs">الاسم الكامل <span className="text-red-500">*</span></label>
                <input type="text" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder="محمد أمين" className="input-field py-2.5 mt-1.5 text-sm" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="label-xs">اسم الفوج/الحلقة <span className="text-red-500">*</span></label>
                <input type="text" value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })}
                  placeholder="فوج الإمام مالك" className="input-field py-2.5 mt-1.5 text-sm" />
              </div>

              <div className="col-span-2">
                <label className="label-xs">البريد الإلكتروني (اسم المستخدم) <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="teacher@school.com" className="input-field py-2.5 mt-1.5 text-sm" dir="ltr" />
              </div>

              <div className="col-span-2">
                <label className="label-xs">كلمة المرور {teacher && "(اتركه فارغاً للحفاظ على القديمة)"} {!teacher && <span className="text-red-500">*</span>}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" className="input-field py-2.5 mt-1.5 text-sm" dir="ltr" />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="label-xs">رقم الهاتف</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0600000000" className="input-field py-2.5 mt-1.5 text-sm text-left" dir="ltr" />
              </div>
              
              <div className="col-span-2 sm:col-span-1">
                <label className="label-xs mb-1.5 block">الجنس</label>
                <div className="flex gap-2">
                   {(["ذكر", "أنثى"] as const).map((g) => (
                    <button key={g} onClick={() => setForm({ ...form, gender: g })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        form.gender === g
                          ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}>{g}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 px-5 pb-5 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1 py-3 justify-center text-sm">إلغاء</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-bold shadow-md transition-colors disabled:opacity-50">
              {saving ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> حفظ البيانات</>}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

export default function TeachersPage() {
  const { user, school } = useAuth();
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [studentsCount, setStudentsCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [editingTeacher, setEditingTeacher] = useState<AppUser | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    const db = getDB();
    
    // جلب المعلمين
    const users = await db.users
      .where("schoolId").equals(user.schoolId)
      .filter(u => u.role === "teacher" && u.isActive)
      .toArray();
      
    users.sort((a, b) => a.displayName.localeCompare(b.displayName, "ar"));
    setTeachers(users);

    // حساب عدد الطلاب لكل معلم
    const studentsByTeacher: Record<string, number> = {};
    for (const t of users) {
      const count = await db.students.where("teacherId").equals(t.id).count();
      studentsByTeacher[t.id] = count;
    }
    setStudentsCount(studentsByTeacher);
    
    setLoading(false);
  }, [user?.schoolId]);

  useEffect(() => { load(); }, [load]);

  const filtered = teachers.filter(t => 
    !search || 
    t.displayName.includes(search) || 
    t.groupName?.includes(search) ||
    t.email.includes(search)
  );

  const handleSave = async (data: Partial<AppUser>) => {
    if (!user?.schoolId) return;
    
    // التحقق من الإيميل إذا كان موجوداً
    const db = getDB();
    if (!editingTeacher) {
      const exists = await db.users.where("email").equals(data.email!).first();
      if (exists) throw new Error("البريد الإلكتروني مسجل مسبقاً");
      
      const newTeacher: AppUser = {
        id: uuid(),
        schoolId: user.schoolId,
        email: data.email!,
        passwordHash: data.passwordHash || "123456", // افتراضي
        displayName: data.displayName!,
        role: "teacher",
        groupName: data.groupName,
        phone: data.phone,
        gender: data.gender,
        isActive: true,
        joinDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await db.users.put(newTeacher);
    } else {
      const updateData = { ...data, updatedAt: new Date().toISOString() };
      // إذا كان الباسورد فارغ، لا نحدثه
      if (!updateData.passwordHash) delete updateData.passwordHash;
      
      await db.users.update(editingTeacher.id, updateData);
    }
    
    await load();
  };

  const handleDelete = async (id: string, name: string) => {
    if (studentsCount[id] > 0) {
      alert(`لا يمكن حذف المعلم لأن لديه ${studentsCount[id]} طلاب. يرجى نقل الطلاب لمعلم آخر أولاً.`);
      return;
    }
    
    if (confirm(`هل أنت متأكد من حذف حساب المعلم ${name} نهائياً؟`)) {
      await db.users.delete(id);
      setTeachers(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* الرأس */}
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

      {/* بحث وبطاقات */}
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
            <p className="text-gray-400 font-medium">لا توجد سجلات مطابقة المعايير</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => (
              <div key={t.id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow bg-white flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white flex items-center justify-center font-black shadow-inner shrink-0" style={{ fontFamily: "var(--font-headline)" }}>
                        {t.displayName[0]}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-gray-900 truncate" title={t.displayName}>
                          {t.displayName}
                        </h3>
                        <p className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-md inline-block mt-1">
                          {t.groupName || "بدون فوج"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1 mt-4 text-xs text-gray-500 font-medium">
                    <p className="flex justify-between"><span className="opacity-70">البريد:</span> <span className="text-gray-800 font-bold select-all truncate">{t.email}</span></p>
                    <p className="flex justify-between"><span className="opacity-70">كلمة المرور:</span> <span className="text-gray-400 italic text-[10px]">(مخفية - يمكن إعدادها من التعديل)</span></p>
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
                    <Edit className="w-3.5 h-3.5" /> تعديل وحساب
                  </button>
                  <button onClick={() => handleDelete(t.id, t.displayName)}
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
          onSave={handleSave} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}
