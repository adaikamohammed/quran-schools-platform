"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { saveSchool } from "@/lib/storage/db";
import type { School } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import {
  Settings, Save, Loader2, Building2,
  Mail, Phone, Calendar, CheckCircle2,
  AlertTriangle, Globe, DollarSign, X, Search, ChevronDown, BookOpen
} from "lucide-react";
import { COUNTRIES_LIST, getDialCode, type CountryInfo } from "@/lib/countries";
import { AcademicYearPicker } from "@/components/ui/AcademicYearPicker";

// ─── مكوّن اختيار الدولة المنبثقة ──────────────────────────────────
function CountryPickerModal({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (country: CountryInfo) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = COUNTRIES_LIST.filter((c) =>
    c.name.includes(search) || c.dial.includes(search)
  );

  return (
    <Modal
      open={true}
      onClose={onClose}
      size="sm"
      title="اختر دولتك"
      description="سيتم تعيين رمز الاتصال تلقائياً"
      icon={<div className="w-10 h-10 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]"><Globe className="w-5 h-5" /></div>}
    >
      <div className="flex flex-col h-[60vh] max-h-[500px]" dir="rtl">
        {/* Search */}
        <div className="p-4 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن دولتك..."
              className="w-full pr-9 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[var(--color-primary)] bg-gray-50"
            />
          </div>
        </div>

        {/* Countries List */}
        <div className="overflow-y-auto p-2 space-y-0.5 flex-1">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">لا توجد نتائج</p>
          ) : (
            filtered.map((country) => (
              <button
                key={country.name}
                onClick={() => { onChange(country); onClose(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:bg-[var(--color-primary)]/5 ${
                  value === country.name
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                    : "text-gray-700"
                }`}
              >
                <span className="text-xl">{country.flag}</span>
                <span className="flex-1 text-right">{country.name}</span>
                {country.dial && (
                  <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg" dir="ltr">
                    {country.dial}
                  </span>
                )}
                {value === country.name && (
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────────────
export default function SettingsPage() {
  const { school, role } = useAuth();
  const [form, setForm] = useState({
    name: "",
    city: "",
    country: "الجزائر",
    directorName: "",
    email: "",
    phone: "",
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    seasonStartDate: "",
    priceAkabir: "1500",
    priceAsaghir: "1200",
    enableTajweedTracking: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);

  useEffect(() => {
    if (school) {
      setForm({
        name: school.name ?? "",
        city: school.city ?? "",
        country: school.country ?? "الجزائر",
        directorName: school.directorName ?? "",
        email: school.email ?? "",
        phone: school.phone ?? "",
        academicYear: school.settings?.academicYear ?? `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        seasonStartDate: school.seasonStartDate ?? "",
        priceAkabir: school.settings?.prices?.renewal?.["فئة الأكابر"]?.toString() ?? "1500",
        priceAsaghir: school.settings?.prices?.renewal?.["فئة الأصاغر"]?.toString() ?? "1200",
        enableTajweedTracking: school.settings?.enableTajweedTracking ?? false,
      });
    }
  }, [school]);

  const up = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleCountrySelect = (country: CountryInfo) => {
    const dial = country.dial ? country.dial + " " : "";
    setForm((f) => ({
      ...f,
      country: country.name,
      // تحديث الهاتف برمز الدولة الجديدة إذا كان فارغاً أو يحتوي فقط على رمز قديم
      phone: !f.phone.trim() || f.phone.trim().startsWith("+")
        ? dial
        : f.phone,
    }));
  };

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
        academicYear: form.academicYear,
        enableTajweedTracking: form.enableTajweedTracking,
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

  // الدولة المختارة مع علمها
  const selectedCountry = COUNTRIES_LIST.find((c) => c.name === form.country);
  const dialCode = getDialCode(form.country);

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
              {/* زر اختيار الدولة المنبثق */}
              <button
                type="button"
                onClick={() => isAdmin && setCountryModalOpen(true)}
                disabled={!isAdmin}
                className={`
                  w-full mt-1.5 flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-bold text-right
                  transition-all duration-200
                  ${isAdmin
                    ? "bg-white border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 cursor-pointer"
                    : "bg-gray-50 border-gray-200 cursor-not-allowed opacity-70"
                  }
                `}
              >
                <span className="text-xl">{selectedCountry?.flag ?? "🌍"}</span>
                <span className="flex-1 text-right">{form.country || "اختر الدولة..."}</span>
                {dialCode && (
                  <span className="text-xs text-gray-400 font-black bg-gray-100 px-2 py-0.5 rounded-lg" dir="ltr">
                    {dialCode.trim()}
                  </span>
                )}
                {isAdmin && <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>
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
            <label className="label-xs flex items-center gap-2">
              رقم الهاتف
              {dialCode && (
                <span className="text-[10px] font-black text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full" dir="ltr">
                  {dialCode.trim()} — {form.country}
                </span>
              )}
            </label>
            <input
              value={form.phone}
              onChange={(e) => up("phone", e.target.value)}
              disabled={!isAdmin}
              placeholder={dialCode ? `${dialCode.trim()} XXXXXXXXX` : "+213..."}
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
        <div className="p-5 space-y-4">
          <div>
            <label className="label-xs">السنة الدراسية</label>
            <div className="mt-1.5">
              <AcademicYearPicker
                value={form.academicYear}
                onChange={(y) => up("academicYear", y)}
                disabled={!isAdmin}
              />
            </div>
          </div>
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
          <p className="text-sm font-black text-gray-700">أسعار الاشتراكات</p>
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
          <div className="col-span-2">
            <p className="text-[11px] text-gray-400 font-medium border-r-2 border-indigo-200 pr-2">
              فئة الأصاغر تكون بسعر مخفض مقارنةً بالأكابر. المبالغ بالعملة المحلية لدولتك.
            </p>
          </div>
        </div>
      </div>

      {/* الميزات المتقدمة */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-gray-50">
          <BookOpen className="w-4 h-4 text-[var(--color-primary)]" />
          <p className="text-sm font-black text-gray-700">الميزات المتقدمة (اختياري)</p>
        </div>
        <div className="p-5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
          <label className="flex items-start gap-4 cursor-pointer group">
            <div className="mt-0.5">
              <input
                type="checkbox"
                checked={form.enableTajweedTracking}
                onChange={(e) => setForm((f) => ({ ...f, enableTajweedTracking: e.target.checked }))}
                disabled={!isAdmin}
                className="w-4 h-4 text-[var(--color-primary)] bg-gray-100 border-gray-300 rounded focus:ring-[var(--color-primary)] focus:ring-2 disabled:opacity-50"
              />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">تفعيل نظام التجويد</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                في حال تفعيله، سيظهر حقل إضافي لتقييم تجويد الطالب أثناء تسجيل الحصص اليومية، بالإضافة إلى سجل تراكمي شامل يضم أحكام التجويد الأساسية داخل صفحة متابعة السور لكل طالب.
              </p>
            </div>
          </label>
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

      {/* نافذة اختيار الدولة */}
      <AnimatePresence>
        {countryModalOpen && (
          <CountryPickerModal
            value={form.country}
            onChange={handleCountrySelect}
            onClose={() => setCountryModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
