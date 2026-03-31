"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import { saveSchool } from "@/lib/storage/db";
import type { School } from "@/lib/types";
import { motion } from "framer-motion";
import {
  Settings, Save, Loader2, Building2, MapPin,
  Mail, Phone, Calendar, Palette, CheckCircle2,
  AlertTriangle, Globe, BookOpen, DollarSign,
} from "lucide-react";

export default function SettingsPage() {
  const { school, user, role } = useAuth();
  const [form, setForm] = useState({
    name: "",
    city: "",
    country: "الجزائر",
    directorName: "",
    email: "",
    phone: "",
    seasonStartDate: "",
    priceAkabir: "1500",
    priceAsaghir: "1200",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (school) {
      setForm({
        name: school.name ?? "",
        city: school.city ?? "",
        country: school.country ?? "الجزائر",
        directorName: school.directorName ?? "",
        email: school.email ?? "",
        phone: school.phone ?? "",
        seasonStartDate: school.seasonStartDate ?? "",
        priceAkabir: school.settings?.prices?.renewal?.["فئة الأكابر"]?.toString() ?? "1500",
        priceAsaghir: school.settings?.prices?.renewal?.["فئة الأصاغر"]?.toString() ?? "1200",
      });
    }
  }, [school]);

  const up = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!school) return;
    setSaving(true);
    const updated: School = {
      ...school,
      name: form.name.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      directorName: form.directorName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      seasonStartDate: form.seasonStartDate || undefined,
      settings: {
        ...school.settings,
        prices: {
          renewal: {
            "فئة الأكابر": Number(form.priceAkabir) || 1500,
            "فئة الأصاغر": Number(form.priceAsaghir) || 1200,
          },
        },
      },
      updatedAt: new Date().toISOString(),
    };
    await saveSchool(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const isAdmin = role === "super_admin" || role === "principal";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* رأس */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>
            إعدادات المدرسة
          </h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            {school?.name ?? "لم يتم تحديد المدرسة"}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary py-2.5 text-sm shrink-0 disabled:opacity-40"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> حفظ...</>
            ) : saved ? (
              <><CheckCircle2 className="w-4 h-4" /> تم الحفظ!</>
            ) : (
              <><Save className="w-4 h-4" /> حفظ التغييرات</>
            )}
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          لديك صلاحية عرض فقط. تواصل مع مدير المدرسة لتعديل الإعدادات.
        </div>
      )}

      {/* معلومات أساسية */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-gray-50">
          <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
          <p className="text-sm font-black text-gray-700">معلومات المؤسسة</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label-xs">اسم المدرسة / الحلقة</label>
            <input
              value={form.name}
              onChange={(e) => up("name", e.target.value)}
              disabled={!isAdmin}
              placeholder="مثال: مدرسة النور القرآنية"
              className="input-field text-sm py-2.5 mt-1.5 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs">المدينة</label>
              <input
                value={form.city}
                onChange={(e) => up("city", e.target.value)}
                disabled={!isAdmin}
                placeholder="الوادي"
                className="input-field text-sm py-2.5 mt-1.5 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="label-xs">الدولة</label>
              <input
                value={form.country}
                onChange={(e) => up("country", e.target.value)}
                disabled={!isAdmin}
                placeholder="الجزائر"
                className="input-field text-sm py-2.5 mt-1.5 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="label-xs">اسم المدير</label>
            <input
              value={form.directorName}
              onChange={(e) => up("directorName", e.target.value)}
              disabled={!isAdmin}
              placeholder="الاسم الكامل للمدير"
              className="input-field text-sm py-2.5 mt-1.5 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* التواصل */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-gray-50">
          <Mail className="w-4 h-4 text-[var(--color-primary)]" />
          <p className="text-sm font-black text-gray-700">معلومات التواصل</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label-xs">البريد الإلكتروني</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => up("email", e.target.value)}
              disabled={!isAdmin}
              placeholder="school@example.com"
              className="input-field text-sm py-2.5 mt-1.5 disabled:bg-gray-50 disabled:cursor-not-allowed"
              dir="ltr"
            />
          </div>
          <div>
            <label className="label-xs">رقم الهاتف</label>
            <input
              value={form.phone}
              onChange={(e) => up("phone", e.target.value)}
              disabled={!isAdmin}
              placeholder="+213..."
              className="input-field text-sm py-2.5 mt-1.5 disabled:bg-gray-50 disabled:cursor-not-allowed"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* الموسم الدراسي */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-gray-50">
          <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
          <p className="text-sm font-black text-gray-700">الموسم الدراسي</p>
        </div>
        <div className="p-5">
          <div>
            <label className="label-xs">تاريخ بداية الموسم</label>
            <input
              type="date"
              value={form.seasonStartDate}
              onChange={(e) => up("seasonStartDate", e.target.value)}
              disabled={!isAdmin}
              className="input-field text-sm py-2.5 mt-1.5 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* الاشتراكات */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-gray-50">
          <DollarSign className="w-4 h-4 text-[var(--color-primary)]" />
          <p className="text-sm font-black text-gray-700">أسعار الاشتراكات (دج)</p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <div>
            <label className="label-xs">فئة الأكابر</label>
            <input
              type="number"
              value={form.priceAkabir}
              onChange={(e) => up("priceAkabir", e.target.value)}
              disabled={!isAdmin}
              min={0}
              className="input-field text-sm py-2.5 mt-1.5 text-center disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="label-xs">فئة الأصاغر</label>
            <input
              type="number"
              value={form.priceAsaghir}
              onChange={(e) => up("priceAsaghir", e.target.value)}
              disabled={!isAdmin}
              min={0}
              className="input-field text-sm py-2.5 mt-1.5 text-center disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* معلومات النظام */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-2 text-xs text-gray-500 font-medium">
        <p className="font-black text-gray-400 uppercase tracking-wider text-[10px] mb-2">معلومات النظام</p>
        <div className="flex justify-between"><span>معرّف المدرسة</span><span className="font-mono text-gray-400" dir="ltr">{school?.id?.slice(0, 8)}...</span></div>
        <div className="flex justify-between"><span>تاريخ الإنشاء</span><span>{school?.createdAt ? new Date(school.createdAt).toLocaleDateString("ar-DZ") : "—"}</span></div>
        <div className="flex justify-between"><span>آخر تحديث</span><span>{school?.updatedAt ? new Date(school.updatedAt).toLocaleDateString("ar-DZ") : "—"}</span></div>
        <div className="flex justify-between"><span>وضع التخزين</span><span className="text-emerald-600 font-bold">محلي (IndexedDB) ✓</span></div>
      </div>
    </div>
  );
}
