"use client";
import SchoolGuard from "@/components/layout/SchoolGuard";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ClipboardList, Users, BookCheck, Gavel,
  Bell, FileText, BarChart3, Activity, Award,
  ShieldCheck, DollarSign, UserPlus, Calendar,
  FolderOpen, ScrollText, Settings, UserCog, Trophy,
  CheckCircle2, Loader2, Info, Sliders,
} from "lucide-react";

// ─── تعريف الميزات (نفس الأيقونات والترتيب في الشريط الجانبي) ─

interface FeatureDef {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  group: string;
  required?: boolean;
  dependsOn?: string[];
  badgeLabel?: string;
}

const ALL_FEATURES: FeatureDef[] = [
  // الميدان التربوي
  { key: "dashboard",       label: "لوحة التحكم",          icon: LayoutDashboard, group: "الميدان التربوي", required: true,  description: "الصفحة الرئيسية بالإحصائيات العامة" },
  { key: "guide",           label: "دليل المنصة",           icon: Trophy,          group: "الميدان التربوي", required: false, description: "خريطة تعريفية بصفحات المنصة وكيفية الاستخدام", badgeLabel: "خريطة" },
  { key: "sessions",        label: "الحصص اليومية",         icon: ClipboardList,   group: "الميدان التربوي", required: true,  description: "تسجيل الحضور والغياب ونتائج الحفظ اليومية" },
  { key: "students",        label: "إدارة الطلاب",          icon: Users,           group: "الميدان التربوي", required: true,  description: "قائمة الطلاب وملفاتهم وبيانات أولياء الأمور" },
  { key: "quran",           label: "متابعة الحفظ",          icon: BookCheck,       group: "الميدان التربوي", required: false, description: "تتبع السور المحفوظة لكل طالب تفصيلياً" },
  { key: "covenants",       label: "العهود والعقوبات",       icon: Gavel,           group: "الميدان التربوي", required: false, description: "توثيق التعهدات والمخالفات السلوكية" },
  // بوصلة المتابعة
  { key: "notifications",   label: "الإشعارات",             icon: Bell,            group: "بوصلة المتابعة", required: false, description: "تنبيهات الغياب المتكرر والمدفوعات والمناسبات", dependsOn: ["sessions"] },
  { key: "reports",         label: "التقارير اليومية",      icon: FileText,        group: "بوصلة المتابعة", required: false, description: "تقارير المعلمين اليومية والملاحظات" },
  { key: "student_history", label: "سجل الطالب",            icon: BarChart3,       group: "بوصلة المتابعة", required: false, description: "التاريخ الكامل لكل طالب من مدفوعات وغياب وحفظ", dependsOn: ["sessions"] },
  { key: "performance",     label: "لوحة الأداء",           icon: Activity,        group: "بوصلة المتابعة", required: false, description: "إحصاءات وتحليل أداء المدرسة أسبوعياً وسنوياً", dependsOn: ["sessions"] },
  // سباق التميز
  { key: "points",          label: "نظام النقاط",           icon: Award,           group: "سباق التميز",    required: false, description: "مكافآت وشارات وترتيب الطلاب حسب أدائهم" },
  // الإدارة
  { key: "teachers",        label: "أفواج المدرسة",         icon: Users,           group: "الإدارة",        required: false, description: "إدارة المعلمين والأفواج وإعداداتهم" },
  { key: "sheikh_monitoring", label: "مراقبة المشايخ",      icon: ShieldCheck,     group: "الإدارة",        required: false, description: "تقييم ومتابعة أداء المعلمين شهرياً", dependsOn: ["teachers"] },
  { key: "dues",            label: "الاشتراكات الفصلية",    icon: DollarSign,      group: "الإدارة",        required: false, description: "متابعة المدفوعات وإرسال وصولات واتساب", dependsOn: ["students"] },
  { key: "registrations",   label: "التسجيلات الجديدة",    icon: UserPlus,        group: "الإدارة",        required: false, description: "قائمة انتظار الطلاب الجدد والقبول والرفض" },
  { key: "meetings",        label: "الاجتماعات والمناسبات", icon: Calendar,        group: "الإدارة",        required: false, description: "محاضر الجلسات والاحتفالات والمناسبات الدينية" },
  { key: "camp",            label: "مستلزمات المخيم",       icon: FolderOpen,      group: "الإدارة",        required: false, description: "تتبع مستلزمات المخيم الصيفي", badgeLabel: "جديد" },
  { key: "documents",       label: "مركز الوثائق",          icon: FolderOpen,      group: "الإدارة",        required: false, description: "شهادات تقدير، وصولات، وكشوف رسمية", dependsOn: ["students"] },
  { key: "logs",            label: "سجل النشاطات",          icon: ScrollText,      group: "الإدارة",        required: false, description: "تاريخ كل العمليات والتغييرات في النظام" },
  // الإعدادات — دائماً ظاهرة
  { key: "profile",         label: "الملف الشخصي",         icon: UserCog,         group: "الإعدادات",      required: true,  description: "بياناتك الشخصية وكلمة المرور" },
  { key: "settings",        label: "إعدادات المدرسة",       icon: Settings,        group: "الإعدادات",      required: true,  description: "أسعار الاشتراكات، الفصول، وإعدادات النقاط" },
  { key: "features",        label: "تخصيص الواجهة",        icon: Sliders,         group: "الإعدادات",      required: true,  description: "هذه الصفحة — تحكم بما تظهر" },
  { key: "backup",          label: "النسخ الاحتياطي",       icon: FolderOpen,      group: "الإعدادات",      required: true,  description: "تصدير واستيراد كامل بيانات المدرسة" },
];

const GROUPS = ["الميدان التربوي", "بوصلة المتابعة", "سباق التميز", "الإدارة", "الإعدادات"];

const SIMPLE_KEYS = new Set(["dashboard","sessions","students","quran","registrations","profile","settings","features","backup"]);

// ─── الصفحة ───────────────────────────────────────────────

function FeaturesPage() {
  const { school, refreshSchool } = useAuth();
  const supabase = createClient();

  const [mode, setMode] = useState<'simple' | 'full'>('full');
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // تحميل الإعدادات الحالية من school (Supabase)
  useEffect(() => {
    if (!school) return;
    const s = school.settings ?? {};
    setMode(s.platformMode ?? 'full');
    setHidden(new Set(s.hiddenFeatures ?? []));
  }, [school]);

  const toggle = (key: string) => {
    const feature = ALL_FEATURES.find(f => f.key === key);
    if (feature?.required) return;
    setHidden(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        // أخفِ المعتمدات عليها تلقائياً
        ALL_FEATURES.forEach(f => {
          if (f.dependsOn?.includes(key)) next.add(f.key);
        });
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!school?.id) return;
    setSaving(true);
    try {
      const currentSettings = school.settings ?? {};
      const newSettings = {
        ...currentSettings,
        platformMode: mode,
        hiddenFeatures: [...hidden],
      };
      await supabase
        .from("schools")
        .update({ settings: newSettings, updated_at: new Date().toISOString() })
        .eq("id", school.id);

      // تحديث AuthContext فوراً (الشريط الجانبي يتجاوب على الفور)
      await refreshSchool();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const visibleCount = ALL_FEATURES.filter(f => {
    if (mode === 'simple') return SIMPLE_KEYS.has(f.key);
    return !hidden.has(f.key);
  }).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">

      {/* ── مقدمة توضيحية ── */}
      <div className="bg-gradient-to-l from-[var(--color-primary)]/5 to-transparent border border-[var(--color-primary)]/20 rounded-2xl p-5 flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-5 h-5 text-[var(--color-primary)]" />
        </div>
        <div>
          <p className="text-sm font-black text-gray-900 mb-1">ما هذه الصفحة؟</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            كل مدرسة لها احتياجاتها الخاصة. هنا يمكنك <strong>إخفاء الصفحات التي لا تستخدمها</strong> لتُبسِّط الشريط الجانبي وتُركّز على ما يهمك.
            <br />
            مثلاً: إذا لا يوجد مخيم صيفي → أخفِ "مستلزمات المخيم". تبقى البيانات محفوظة وتعود لتُفعِّلها متى شئت.
          </p>
        </div>
      </div>

      {/* ── وضع العرض ── */}
      <div className="bg-white rounded-3xl border border-[var(--color-border)] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-4 h-4 text-[var(--color-primary)]" />
          <p className="text-sm font-black text-gray-800">وضع العرض</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([
            {
              val: "simple" as const,
              emoji: "🟢",
              title: "بسيط",
              desc: "الصفحات الجوهرية فقط — مناسب للمدارس التي تريد الاستخدام السريع",
              keys: SIMPLE_KEYS.size,
            },
            {
              val: "full" as const,
              emoji: "🔵",
              title: "كامل + تخصيص",
              desc: "كل الصفحات مع صلاحية إخفاء ما لا تحتاجه يدوياً",
              keys: ALL_FEATURES.length,
            },
          ]).map(({ val, emoji, title, desc, keys }) => (
            <button
              key={val}
              onClick={() => setMode(val)}
              className={`text-right p-4 rounded-2xl border-2 transition-all ${
                mode === val
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] shadow-sm"
                  : "border-gray-200 bg-gray-50/70 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <p className={`text-sm font-black mt-2 ${mode === val ? "text-[var(--color-primary-dark)]" : "text-gray-800"}`}>
                {title}
              </p>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{desc}</p>
              <p className={`text-[11px] font-bold mt-2 ${mode === val ? "text-[var(--color-primary)]" : "text-gray-400"}`}>
                {keys} صفحة
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ── الوضع البسيط: عرض الصفحات المتاحة ── */}
      <AnimatePresence mode="wait">
        {mode === 'simple' ? (
          <motion.div
            key="simple"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm"
          >
            <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <p className="text-xs font-black text-emerald-800">الصفحات الظاهرة في الوضع البسيط</p>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {ALL_FEATURES.filter(f => SIMPLE_KEYS.has(f.key)).map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.key} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                    <Icon className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-800">{f.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* ── الوضع الكامل: تخصيص يدوي ── */
          <motion.div
            key="full"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-gray-700">
                الصفحات الظاهرة —{" "}
                <span className="text-[var(--color-primary)]">{visibleCount}</span>
                {" "}من {ALL_FEATURES.length}
              </p>
              <button
                onClick={() => setHidden(new Set())}
                className="text-xs font-bold text-[var(--color-primary)] hover:underline"
              >
                تفعيل الكل
              </button>
            </div>

            {GROUPS.map((groupName) => {
              const features = ALL_FEATURES.filter(f => f.group === groupName);
              const groupVisible = features.filter(f => !hidden.has(f.key)).length;
              return (
                <div key={groupName} className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm">
                  {/* رأس المجموعة */}
                  <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-black text-gray-600 uppercase tracking-wider">{groupName}</p>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {groupVisible}/{features.length}
                    </span>
                  </div>

                  {/* العناصر */}
                  <div className="divide-y divide-gray-50/70">
                    {features.map((feature) => {
                      const isVisible = !hidden.has(feature.key);
                      const Icon = feature.icon;
                      const dependencyMissing = feature.dependsOn?.some(dep => hidden.has(dep));
                      const isRequired = !!feature.required;

                      return (
                        <div
                          key={feature.key}
                          onClick={() => !isRequired && toggle(feature.key)}
                          className={`flex items-center gap-3.5 px-4 py-3.5 transition-all ${
                            isRequired ? "cursor-default" : "cursor-pointer hover:bg-gray-50"
                          } ${isVisible ? "" : "opacity-50"}`}
                        >
                          {/* أيقونة */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isVisible ? "bg-[var(--color-primary)]/10" : "bg-gray-100"
                          }`}>
                            <Icon className={`w-4 h-4 ${isVisible ? "text-[var(--color-primary)]" : "text-gray-400"}`} />
                          </div>

                          {/* نص */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-black ${isVisible ? "text-gray-900" : "text-gray-400"}`}>
                                {feature.label}
                              </span>
                              {feature.badgeLabel && isVisible && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[var(--color-primary)] text-white">
                                  {feature.badgeLabel}
                                </span>
                              )}
                              {isRequired && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                  إلزامي
                                </span>
                              )}
                              {dependencyMissing && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                                  ⚠ تعتمد على: {feature.dependsOn?.filter(dep => hidden.has(dep)).map(dep => ALL_FEATURES.find(f => f.key === dep)?.label).join("، ")}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{feature.description}</p>
                          </div>

                          {/* Toggle */}
                          <div className={`w-11 h-6 rounded-full transition-all shrink-0 flex items-center px-0.5 ${
                            isRequired
                              ? "bg-emerald-400 cursor-default"
                              : isVisible
                              ? "bg-[var(--color-primary)]"
                              : "bg-gray-200"
                          }`}>
                            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                              (isRequired || isVisible) ? "translate-x-0" : "-translate-x-5 rtl:translate-x-5"
                            }`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── زر الحفظ ── */}
      <div className="sticky bottom-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[var(--color-border)] shadow-lg p-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold text-sm transition-colors disabled:opacity-60"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
              : <><CheckCircle2 className="w-4 h-4" /> حفظ وتطبيق الآن</>
            }
          </button>
          <AnimatePresence>
            {saved && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-bold text-emerald-600 flex items-center gap-1 whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                تم التطبيق!
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function FeaturesPageWrapper() {
  return (
    <SchoolGuard>
      <FeaturesPage />
    </SchoolGuard>
  );
}
