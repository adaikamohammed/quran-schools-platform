"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import type { School, AppUser } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Plus, Search, Edit, Trash2, X, AlertTriangle, CheckCircle2,
  Shield, Key, UserCog, Mail, Phone, MapPin
} from "lucide-react";
import { v4 as uuid } from "uuid";

// ─── Modal إضافة/تعديل مدرسة ────────────────────────────

function SchoolModal({
  school,
  principal,
  onSave,
  onClose,
}: {
  school?: School;
  principal?: AppUser;
  onSave: (s: Partial<School>, p: Partial<AppUser>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: school?.name || "",
    address: school?.address || "",
    city: school?.city || "",
    country: school?.country || "الجزائر",
    principalName: principal?.displayName || "",
    principalEmail: principal?.email || "",
    principalPassword: "",
    principalPhone: principal?.phone || "",
    plan: school?.plan || "basic",
    status: school?.status || "نشطة",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!form.name.trim() || !form.principalName.trim() || !form.principalEmail.trim() || (!principal && !form.principalPassword)) {
      setError("يرجى تعبئة الحقول الإجبارية (اسم المدرسة، اسم الإقليم، الإيميل، كلمة المرور)");
      return;
    }
    
    setSaving(true);
    setError("");
    try {
      await onSave({
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        plan: form.plan as "free" | "basic" | "premium",
        status: form.status as "نشطة" | "معلقة",
      }, {
        displayName: form.principalName.trim(),
        email: form.principalEmail.trim().toLowerCase(),
        passwordHash: form.principalPassword ? form.principalPassword : undefined,
        phone: form.principalPhone.trim(),
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
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-l from-indigo-600 to-indigo-800 text-white">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-white/80" />
              <div>
                <h3 className="font-black text-sm">{school ? "تعديل بيانات المدرسة" : "إضافة مدرسة جديدة"}</h3>
                <p className="text-white/70 text-xs">النظام المركزي للإدارة</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-bold text-gray-800 text-sm border-b pb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" />
                بيانات المدرسة
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label-xs">اسم المدرسة <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="مدرسة الفرقان" className="input-field py-2.5 mt-1.5 text-sm" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="label-xs">المدينة / الولاية</label>
                  <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="الجزائر العاصمة" className="input-field py-2.5 mt-1.5 text-sm" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="label-xs">حالة الاشتراك</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="input-field py-2.5 mt-1.5 text-sm font-bold">
                     <option value="نشطة">نشطة ✅</option>
                     <option value="معلقة">معلقة ⛔</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-gray-800 text-sm border-b pb-2 flex items-center gap-2">
                <UserCog className="w-4 h-4 text-indigo-500" />
                حساب مدير المدرسة
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="label-xs">اسم المدير الكامل <span className="text-red-500">*</span></label>
                  <input type="text" value={form.principalName} onChange={(e) => setForm({ ...form, principalName: e.target.value })}
                    placeholder="محمد الأمين" className="input-field py-2.5 mt-1.5 text-sm" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="label-xs">رقم هاتف المدير</label>
                  <input type="text" value={form.principalPhone} onChange={(e) => setForm({ ...form, principalPhone: e.target.value })}
                    placeholder="0600000000" className="input-field py-2.5 mt-1.5 text-sm text-left" dir="ltr" />
                </div>
                <div className="col-span-2">
                  <label className="label-xs">البريد الإلكتروني (لتسجيل الدخول) <span className="text-red-500">*</span></label>
                  <input type="email" value={form.principalEmail} onChange={(e) => setForm({ ...form, principalEmail: e.target.value })}
                    placeholder="principal@school.com" className="input-field py-2.5 mt-1.5 text-sm text-left" dir="ltr" />
                </div>
                <div className="col-span-2">
                  <label className="label-xs">كلمة المرور {principal && "(اتركها فارغة لتجنب التعديل)"} {!principal && <span className="text-red-500">*</span>}</label>
                  <input type="password" value={form.principalPassword} onChange={(e) => setForm({ ...form, principalPassword: e.target.value })}
                    placeholder="••••••••" className="input-field py-2.5 mt-1.5 text-sm text-left" dir="ltr" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 px-5 pb-5 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1 py-3 justify-center text-sm">إلغاء</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md transition-colors disabled:opacity-50">
              {saving ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> حفظ البيانات</>}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

export default function SchoolsAdminPage() {
  const { user, isSuperAdmin } = useAuth();
  const [schools, setSchools] = useState<{ school: School, principal: AppUser | undefined, stats: { students: number, teachers: number } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [editingItem, setEditingItem] = useState<{ school: School, principal?: AppUser } | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!isSuperAdmin) return;
    setLoading(true);
    const db = getDB();
    
    // جلب جميع المدارس الحقيقية
    const allSchools = await db.schools.toArray();
    
    const augmented = [];
    for (const s of allSchools) {
      if (s.name === "لوحة التحكم المركزية" && s.id === "system") continue;

      const principal = await db.users.where("schoolId").equals(s.id).filter(u => u.role === "principal").first();
      const studentsCount = await db.students.where("schoolId").equals(s.id).count();
      const teachersCount = await db.users.where("schoolId").equals(s.id).filter(u => u.role === "teacher").count();

      augmented.push({ school: s, principal, stats: { students: studentsCount, teachers: teachersCount } });
    }
      
    augmented.sort((a, b) => a.school.name.localeCompare(b.school.name, "ar"));
    setSchools(augmented);
    setLoading(false);
  }, [isSuperAdmin]);

  useEffect(() => { load(); }, [load]);

  const filtered = schools.filter(s => 
    !search || 
    s.school.name.includes(search) || 
    s.school.city?.includes(search) ||
    s.principal?.displayName.includes(search)
  );

  const handleSave = async (schoolData: Partial<School>, principalData: Partial<AppUser>) => {
    const db = getDB();
    
    if (!editingItem) {
      const exists = await db.users.where("email").equals(principalData.email!).first();
      if (exists) throw new Error("البريد الإلكتروني للإدارة مسجل مسبقاً في النظام");
      
      const newSchoolId = uuid();
      const newSchool: School = {
        id: newSchoolId,
        name: schoolData.name!,
        address: schoolData.address || "",
        city: schoolData.city || "",
        country: schoolData.country || "الجزائر",
        phone: "",
        email: "",
        plan: schoolData.plan as any || "basic",
        status: schoolData.status as any || "نشطة",
        subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
        settings: {
          currency: "DZD",
          timezone: "Africa/Algiers",
          academicYear: "2023-2024",
          terms: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const newPrincipal: AppUser = {
        id: uuid(),
        schoolId: newSchoolId,
        email: principalData.email!,
        passwordHash: principalData.passwordHash || "123456",
        displayName: principalData.displayName!,
        role: "principal",
        phone: principalData.phone,
        isActive: true,
        joinDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await db.schools.put(newSchool);
      await db.users.put(newPrincipal);
    } else {
      const updateSchool = { ...schoolData, updatedAt: new Date().toISOString() };
      await db.schools.update(editingItem.school.id, updateSchool);
      
      if (editingItem.principal) {
        const updatePrincipal = { ...principalData, updatedAt: new Date().toISOString() };
        if (!updatePrincipal.passwordHash) delete updatePrincipal.passwordHash;
        await db.users.update(editingItem.principal.id, updatePrincipal);
      } else {
        const newPrincipal: AppUser = {
          id: uuid(),
          schoolId: editingItem.school.id,
          email: principalData.email!,
          passwordHash: principalData.passwordHash || "123456",
          displayName: principalData.displayName!,
          role: "principal",
          phone: principalData.phone,
          isActive: true,
          joinDate: new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.users.put(newPrincipal);
      }
    }
    
    await load();
  };

  const handleDelete = async (s: { school: School, stats: { students: number, teachers: number }}) => {
    if (s.stats.students > 0 || s.stats.teachers > 0) {
      alert(`لا يمكن حذف المدرسة لأنها تحتوي على ${s.stats.students} طلاب و ${s.stats.teachers} معلمين.`);
      return;
    }
    
    if (confirm(`هل أنت متأكد من حذف المدرسة (${s.school.name}) نهائياً؟ سيحذف هذا جميع بياناتها.`)) {
      const db = getDB();
      const principals = await db.users.where("schoolId").equals(s.school.id).toArray();
      await db.users.bulkDelete(principals.map(p => p.id));
      await db.schools.delete(s.school.id);
      
      setSchools(prev => prev.filter(x => x.school.id !== s.school.id));
    }
  };

  if (!isSuperAdmin) {
    return <div className="text-center py-20 text-red-500 font-bold">عذراً، هذه الصفحة مخصصة للمشرف العام فقط.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* الرأس */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
            <Building2 className="w-6 h-6 text-indigo-600" />
            إدارة المدارس (Super Admin)
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            {schools.length} مدرسة مسجلة في منصة المدارس القرآنية
          </p>
        </div>
        
        <button onClick={() => { setEditingItem(undefined); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 py-2.5 px-5 rounded-xl font-bold text-sm transition-colors shadow-md">
          <Plus className="w-4 h-4" /> إضافة مدرسة جديدة
        </button>
      </div>

      {/* بحث وبطاقات */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-5">
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم المدرسة، المدينة أو اسم المدير..."
            className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-gray-50/50" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold text-lg">لا توجد مدارس حالياً</p>
            <p className="text-gray-400 text-sm mt-1">يمكنك إضافة مدارس النظام من هنا</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(item => (
              <div key={item.school.id} className="border border-gray-100 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-lg transition-all bg-white flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black shadow-inner shrink-0 text-xl" style={{ fontFamily: "var(--font-headline)" }}>
                        {item.school.name[0]}
                      </div>
                      <div>
                        <h3 className="text-base font-black text-gray-900 truncate" title={item.school.name}>
                          {item.school.name}
                        </h3>
                        <p className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mt-1 ${
                          item.school.status === "نشطة" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}>
                          {item.school.status}
                        </p>
                        <span className="mr-2 text-xs text-gray-400">{item.school.city}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4 text-xs text-gray-600 font-medium">
                    <div className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                      <p className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5 opacity-70"><UserCog className="w-3.5 h-3.5" /> المدير:</span> 
                        <span className="text-gray-800 font-bold truncate">{item.principal?.displayName || "غير محدد"}</span>
                      </p>
                      <p className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5 opacity-70"><Mail className="w-3.5 h-3.5" /> البريد:</span> 
                        <span className="text-gray-800 font-bold select-all truncate">{item.principal?.email || "-"}</span>
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="p-2 border border-indigo-50 bg-indigo-50/30 rounded-lg text-center">
                        <p className="text-[10px] text-gray-400 mb-0.5">الطلاب</p>
                        <p className="text-sm font-black text-indigo-700">{item.stats.students}</p>
                      </div>
                      <div className="p-2 border border-blue-50 bg-blue-50/30 rounded-lg text-center">
                        <p className="text-[10px] text-gray-400 mb-0.5">المعلمين</p>
                        <p className="text-sm font-black text-blue-700">{item.stats.teachers}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-5 pt-4 border-t border-gray-50">
                  <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                    className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
                    <Edit className="w-3.5 h-3.5" /> تعديل
                  </button>
                  <button onClick={() => handleDelete(item)}
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
        <SchoolModal 
          school={editingItem?.school}
          principal={editingItem?.principal}
          onSave={handleSave} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}
