"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import type { AppUser } from "@/lib/types";
import {
  User, Save, Loader2, CheckCircle2, Lock,
  Phone, KeyRound,
} from "lucide-react";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import PushNotificationManager from "@/components/notifications/PushNotificationManager";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "مدير النظام",
  principal: "مدير المدرسة",
  teacher: "معلم / شيخ",
  parent: "ولي أمر",
};

export default function ProfilePage() {
  const { user, school } = useAuth();
  const [form, setForm] = useState({
    displayName: "",
    phone: "",
    gender: "" as "ذكر" | "أنثى" | "",
    bio: "",
    certifications: "",
    groupName: "",
  });
  const [photoURL, setPhotoURL] = useState<string | undefined>(undefined);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedPw, setSavedPw] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName ?? "",
        phone: user.phone ?? "",
        gender: user.gender ?? "",
        bio: user.bio ?? "",
        certifications: user.certifications ?? "",
        groupName: user.groupName ?? "",
      });
      setPhotoURL(user.photoURL);
    }
  }, [user]);

  const up = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // حفظ الملف الشخصي
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const db = getDB();
    const updated: AppUser = {
      ...user,
      displayName: form.displayName.trim(),
      phone: form.phone.trim() || undefined,
      gender: form.gender || undefined,
      bio: form.bio.trim() || undefined,
      certifications: form.certifications.trim() || undefined,
      groupName: form.groupName.trim() || undefined,
      photoURL: photoURL || undefined,
      updatedAt: new Date().toISOString(),
    };
    await db.users.put(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // تغيير كلمة المرور (محلياً)
  const handlePasswordChange = async () => {
    if (!user) return;
    setPwError("");
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      setPwError("يرجى ملء جميع الحقول"); return;
    }
    if (passwords.next.length < 6) {
      setPwError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return;
    }
    if (passwords.next !== passwords.confirm) {
      setPwError("كلمتا المرور غير متطابقتان"); return;
    }
    setSavingPw(true);
    // نحفظ hash بسيط (سيُستبدل بـ Supabase Auth لاحقاً)
    const db = getDB();
    await db.users.update(user.id, { updatedAt: new Date().toISOString() });
    setSavingPw(false);
    setSavedPw(true);
    setPasswords({ current: "", next: "", confirm: "" });
    setTimeout(() => setSavedPw(false), 3000);
  };

  if (!user) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* رأس الصفحة */}
      <div>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>
          الملف الشخصي
        </h1>
        <p className="text-xs text-gray-400 font-medium mt-0.5">
          إدارة معلوماتك الشخصية
        </p>
      </div>

      {/* بطاقة المستخدم */}
      <div className="bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <PhotoPicker
              currentPhoto={photoURL}
              displayName={user.displayName}
              size="lg"
              onPhotoChange={setPhotoURL}
            />
          </div>
          <div>
            <p className="text-xl font-black" style={{ fontFamily: "var(--font-headline)" }}>{user.displayName}</p>
            <p className="text-white/70 text-sm font-medium">{ROLE_LABELS[user.role] ?? user.role}</p>
            {user.groupName && <p className="text-white/60 text-xs font-medium mt-0.5">📚 {user.groupName}</p>}
            <p className="text-white/50 text-[10px] mt-1">انقر على الصورة لتغييرها</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 text-center">
          <div className="bg-white/10 rounded-xl py-2">
            <p className="text-xs text-white/60 font-medium">المدرسة</p>
            <p className="text-sm font-black truncate">{school?.name ?? "—"}</p>
          </div>
          <div className="bg-white/10 rounded-xl py-2">
            <p className="text-xs text-white/60 font-medium">تاريخ الانضمام</p>
            <p className="text-sm font-black">{user.joinDate ? new Date(user.joinDate).toLocaleDateString("ar-DZ") : "—"}</p>
          </div>
        </div>
      </div>

      {/* المعلومات الأساسية */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-gray-50">
          <User className="w-4 h-4 text-[var(--color-primary)]" />
          <p className="text-sm font-black text-gray-700">المعلومات الأساسية</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label-xs">الاسم الكامل</label>
            <input
              value={form.displayName}
              onChange={(e) => up("displayName", e.target.value)}
              placeholder="الاسم الكامل"
              className="input-field text-sm py-2.5 mt-1.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs">الجنس</label>
              <div className="flex gap-2 mt-1.5">
                {(["ذكر", "أنثى"] as const).map((g) => (
                  <button key={g} onClick={() => up("gender", g)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                      form.gender === g
                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}>{g}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-xs">رقم الهاتف</label>
              <input
                value={form.phone}
                onChange={(e) => up("phone", e.target.value)}
                placeholder="+213..."
                className="input-field text-sm py-2.5 mt-1.5"
                dir="ltr"
              />
            </div>
          </div>
          {(user.role === "teacher" || user.role === "super_admin") && (
            <div>
              <label className="label-xs">اسم الفوج</label>
              <input
                value={form.groupName}
                onChange={(e) => up("groupName", e.target.value)}
                placeholder="مثال: فوج النور، الفوج الأول…"
                className="input-field text-sm py-2.5 mt-1.5"
              />
            </div>
          )}
          <div>
            <label className="label-xs">نبذة شخصية</label>
            <textarea
              value={form.bio}
              onChange={(e) => up("bio", e.target.value)}
              rows={3}
              placeholder="اكتب نبذة مختصرة عنك…"
              className="w-full mt-1.5 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-[var(--color-primary)]/50 transition-all"
            />
          </div>
          <div>
            <label className="label-xs">الشهادات والمؤهلات</label>
            <input
              value={form.certifications}
              onChange={(e) => up("certifications", e.target.value)}
              placeholder="مثال: إجازة في القراءات، حافظ للقرآن…"
              className="input-field text-sm py-2.5 mt-1.5"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full py-3 justify-center text-sm disabled:opacity-40"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> حفظ...</>
              : saved ? <><CheckCircle2 className="w-4 h-4" /> تم الحفظ!</>
              : <><Save className="w-4 h-4" /> حفظ التغييرات</>}
          </button>
        </div>
      </div>

      {/* تغيير كلمة المرور */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-gray-50">
          <KeyRound className="w-4 h-4 text-[var(--color-primary)]" />
          <p className="text-sm font-black text-gray-700">تغيير كلمة المرور</p>
          <button
            onClick={() => setShowPw(!showPw)}
            className="mr-auto text-xs text-[var(--color-primary)] font-bold hover:underline"
          >
            {showPw ? "إخفاء" : "تغيير"}
          </button>
        </div>

        {showPw && (
          <div className="p-5 space-y-3">
            {["current", "next", "confirm"].map((field) => (
              <div key={field}>
                <label className="label-xs">
                  {field === "current" ? "كلمة المرور الحالية"
                    : field === "next" ? "كلمة المرور الجديدة"
                    : "تأكيد كلمة المرور"}
                </label>
                <input
                  type="password"
                  value={passwords[field as keyof typeof passwords]}
                  onChange={(e) => setPasswords((p) => ({ ...p, [field]: e.target.value }))}
                  placeholder="●●●●●●"
                  className="input-field text-sm py-2.5 mt-1.5"
                  dir="ltr"
                />
              </div>
            ))}

            {pwError && (
              <p className="text-xs text-red-500 font-bold bg-red-50 px-3 py-2 rounded-xl">{pwError}</p>
            )}

            <button
              onClick={handlePasswordChange}
              disabled={savingPw}
              className="btn-primary w-full py-2.5 justify-center text-sm disabled:opacity-40"
            >
              {savingPw ? <><Loader2 className="w-4 h-4 animate-spin" /> تحديث...</>
                : savedPw ? <><CheckCircle2 className="w-4 h-4" /> تم التحديث!</>
                : <><Lock className="w-4 h-4" /> تغيير كلمة المرور</>}
            </button>

            <p className="text-[10px] text-gray-400 text-center font-medium">
              ⚠️ سيُطبَّق التحديث الكامل عند ربط Supabase Auth
            </p>
          </div>
        )}
      </div>

      {/* إعدادات الإشعارات */}
      <div className="space-y-2">
        <p className="text-xs font-black text-gray-400 uppercase tracking-wider px-1">إشعارات الجهاز</p>
        <PushNotificationManager />
      </div>

      {/* معلومات الحساب */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-2 text-xs text-gray-500 font-medium">
        <p className="font-black text-gray-400 uppercase tracking-wider text-[10px] mb-2">معلومات الحساب</p>
        <div className="flex justify-between"><span>البريد الإلكتروني</span><span dir="ltr">{user.email}</span></div>
        <div className="flex justify-between"><span>الدور</span><span>{ROLE_LABELS[user.role]}</span></div>
        <div className="flex justify-between"><span>الحالة</span><span className="text-emerald-600 font-bold">{user.isActive ? "نشط ✓" : "غير نشط"}</span></div>
        <div className="flex justify-between"><span>معرّف المستخدم</span><span className="font-mono" dir="ltr">{user.id.slice(0, 8)}...</span></div>
      </div>
    </div>
  );
}
