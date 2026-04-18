"use client";

import { motion } from "framer-motion";
import {
  Building2, Users, UserPlus, BookOpen,
  GraduationCap, ShieldCheck, Link2,
  FileCheck2, ArrowLeft, ArrowLeft as ArrowLeftIcon,
  Settings, ClipboardList, Star, GitBranch,
  ChevronLeft, Sparkles, Map,
  BarChart3, DollarSign, Award, FolderOpen
} from "lucide-react";
import Link from "next/link";

interface GuideStep {
  id: number;
  phase: string;
  title: string;
  desc: string;
  detail: string;
  icon: React.ElementType;
  colorFrom: string;
  colorTo: string;
  textColor: string;
  bgLight: string;
  actionLabel?: string;
  actionHref?: string;
  actionIcon?: React.ElementType;
  tags?: string[];
}

const GUIDE_STEPS: GuideStep[] = [
  // ─── المرحلة الأولى: التأسيس ───
  {
    id: 1,
    phase: "مرحلة التأسيس",
    title: "إعداد هوية المدرسة وتكاليف الاشتراك",
    desc: "أول خطوة: ضبط إعدادات المدرسة الأساسية.",
    detail: "من صفحة **إعدادات المدرسة**، قم بإدخال بيانات مدرستك (الاسم، الشعار، البلد). \nكذلك يجب عليك تحديد **الاشتراكات الفصلية** وأسعارها (مثل: فئة الأصاغر، فئة الأكابر) ليتمكن النظام المالي من حساب مستحقات الطلاب لاحقاً.",
    icon: Settings,
    colorFrom: "#6366f1",
    colorTo: "#8b5cf6",
    textColor: "text-indigo-700",
    bgLight: "bg-indigo-50/70",
    actionLabel: "إعدادات المدرسة",
    actionHref: "/app/settings",
    actionIcon: Settings,
    tags: ["ضبط المدرسة", "تسعير الاشتراكات"],
  },
  {
    id: 2,
    phase: "مرحلة التأسيس",
    title: "تكوين الأفواج وإضافة المعلمين",
    desc: "ثانياً: من هنا تقوم بإضافة المعلمين وتسمية الأفواج.",
    detail: "انتقل إلى صفحة **أفواج المدرسة**. هذه هي واجهتك لتوظيف الكادر!\nعند إضافة معلم جديد، ستقوم بإدخال بريده الإلكتروني وكلمة المرور، والأهم أنك ستقوم بإنشاء **اسم الفوج الخاص به** (مثال: فوج أبو بكر). \nعندما يدخل المعلم بحسابه، لن يرى سوى الطلاب المسجلين في هذا الفوج.",
    icon: Users,
    colorFrom: "#0ea5e9",
    colorTo: "#2563eb",
    textColor: "text-blue-700",
    bgLight: "bg-blue-50/70",
    actionLabel: "أفواج المدرسة (المعلمون)",
    actionHref: "/app/teachers",
    actionIcon: GraduationCap,
    tags: ["إضافة معلم", "إنشاء الأفواج", "الخصوصية"],
  },
  
  // ─── المرحلة الثانية: التسجيل والطلاب ───
  {
    id: 3,
    phase: "مرحلة التسجيل",
    title: "استقبال وإدارة التسجيلات الجديدة",
    desc: "استقبال طلبات الالتحاق الإلكترونية.",
    detail: "بإمكان أولياء الأمور التسجيل عن بعد! ستصلك الطلبات في صفحة **التسجيلات الجديدة**. تتيح لك هذه الصفحة مراجعة بيانات الطالب وولي أمره وتحديد نوع الاشتراك، ثم الموافقة ليتم اعتماده كطالب رسمي.",
    icon: UserPlus,
    colorFrom: "#10b981",
    colorTo: "#059669",
    textColor: "text-emerald-700",
    bgLight: "bg-emerald-50/70",
    actionLabel: "التسجيلات الجديدة",
    actionHref: "/app/registrations",
    actionIcon: FileCheck2,
    tags: ["فرز الطلبات", "القبول الإلكتروني"],
  },
  {
    id: 4,
    phase: "مرحلة التسجيل",
    title: "إدارة الطلاب وتسكينهم",
    desc: "التحكم الشامل بكل طالب مسجل وحالته.",
    detail: "من صفحة **إدارة الطلاب**، يمكنك إضافة الطلاب يدوياً متى شئت. الأهم أنك من هنا تقوم بإسناد كل طالب لـ**فوج محدد** لكي يظهر عند أستاذه.\nتحتوي هذه الصفحة أيضاً على البطاقة الشخصية للطالب، والتي تمكنك من استخراج **رابط ولي الأمر** الذي يُرسَل عبر الواتساب للأب ليتابع ابنه بدون حساب.",
    icon: Users,
    colorFrom: "#06b6d4",
    colorTo: "#0891b2",
    textColor: "text-cyan-700",
    bgLight: "bg-cyan-50/70",
    actionLabel: "إدارة الطلاب",
    actionHref: "/app/students",
    actionIcon: Users,
    tags: ["نقل بين الأفواج", "رابط الآباء", "معلومات الطالب"],
  },

  // ─── المرحلة الثالثة: الميدان التربوي ───
  {
    id: 5,
    phase: "الميدان اليومي",
    title: "الحصص اليومية والتسميع",
    desc: "عصب المنصة: كل يوم يبدأ وينتهي هنا.",
    detail: "هذه الشاشة مخصصة لك والمعلمين. في **الحصص اليومية**، يتم تسجيل حضور الطلبة، وتقييم تسميعهم (جيد، ممتاز...) مع تحديد الآيات والأخطاء والسلوك. النظام مصمم ليكون ذكياً، حيث يحفظ تلقائياً المقطع الذي توقف عنده الطالب لليوم الموالي.",
    icon: ClipboardList,
    colorFrom: "#f59e0b",
    colorTo: "#d97706",
    textColor: "text-amber-700",
    bgLight: "bg-amber-50/70",
    actionLabel: "الحصص اليومية",
    actionHref: "/app/sessions",
    actionIcon: ClipboardList,
    tags: ["سجل الحضور", "تقييم التسميع", "التتبع الذكي"],
  },
  {
    id: 6,
    phase: "الميدان اليومي",
    title: "متابعة الحفظ وخريطة القرآن",
    desc: "خريطة تفصيلية لـ 114 سورة لكل طالب.",
    detail: "بعد التسميع في الحصة، تتبلور الإنجازات في شاشة **متابعة الحفظ**. من خلالها يرى المدير أو المعلم شجرة تقدم تلون السور الخضراء (المحفوظة أجزاؤها) والصفراء (قيد الحفظ). شاشة بصرية تعطيك انطباعاً فورياً عن مستوى المدرسة.",
    icon: BookOpen,
    colorFrom: "#8b5cf6",
    colorTo: "#7c3aed",
    textColor: "text-violet-700",
    bgLight: "bg-violet-50/70",
    actionLabel: "شجرة الحفظ",
    actionHref: "/app/quran",
    actionIcon: BookOpen,
    tags: ["إنجاز مرئي", "خريطة الـ 114 سورة"],
  },
  {
    id: 7,
    phase: "التربية والسلوك",
    title: "العهود، العقوبات ونظام النقاط",
    desc: "الانضباط نصف التربية.",
    detail: "المنصة توفر أدوات لتقويم السلوك:\n- **العهود والعقوبات**: لتوثيق اتفاقات شخصية مع الطالب (مثلاً: المحافظة على صلاة الجماعة) وتنبيهه إن أخلّ بها.\n- **نظام النقاط**: التنافس الإيجابي بين الطلاب وتقديم جوائز تحفيزية على انضباطهم وحفظهم.",
    icon: ShieldCheck,
    colorFrom: "#ef4444",
    colorTo: "#dc2626",
    textColor: "text-red-700",
    bgLight: "bg-red-50/70",
    actionLabel: "العهود والانضباط",
    actionHref: "/app/covenants",
    actionIcon: ShieldCheck,
    tags: ["تربية", "عقوبات سلوكية", "نقاط تنافسية"],
  },

  // ─── المرحلة الرابعة: المراقبة والتحليل ───
  {
    id: 8,
    phase: "الرقابة والمتابعة",
    title: "التقارير اليومية والأداء العام",
    desc: "لا تدع شيئاً يغيب عن بصرك كمدير.",
    detail: "للإدارة عيون متعددة في المنصة:\n- **مراقبة المشايخ**: هل يسجلون الحصص؟ هل هم متأخرون في إحصاء الغياب؟ ستعرف فوراً.\n- **لوحة الأداء والتقارير اليومية**: رسوم بيانية توضح إحصائيات الحفظ والغياب والانضباط بأرقام دقيقة وحية.\n- **سجل الطالب**: رصد عميق لكل يوم في حياة أي طالب بضغطة زر.",
    icon: BarChart3,
    colorFrom: "#ec4899",
    colorTo: "#db2777",
    textColor: "text-pink-700",
    bgLight: "bg-pink-50/70",
    actionLabel: "لوحة الأداء",
    actionHref: "/app/performance",
    actionIcon: BarChart3,
    tags: ["مراقبة المشايخ", "إحصاءات دقيقة", "سجل الطالب"],
  },
  {
    id: 9,
    phase: "الإدارة المالية",
    title: "الاشتراكات الفصلية (المستحقات)",
    desc: "تنظيم مالي شفّاف لتسديد الرسوم.",
    detail: "العمل الإداري يكتمل في صفحة **الاشتراكات الفصلية**. يمكنك هنا تتبع الطلاب الذين سددوا اشتراكاتهم والذين لم يسددوا بناءً على الرسوم التي تم تعريفها في الإعدادات. مما يعزز قدرتك على ضبط مداخيل المدرسة بدقة.",
    icon: DollarSign,
    colorFrom: "#14b8a6",
    colorTo: "#0d9488",
    textColor: "text-teal-700",
    bgLight: "bg-teal-50/70",
    actionLabel: "الاشتراكات والمالية",
    actionHref: "/app/dues",
    actionIcon: DollarSign,
    tags: ["المستحقات", "تتبع الدفع"],
  },

  // ─── المرحلة الخامسة: التوثيق والتواصل ───
  {
    id: 10,
    phase: "توسيع الآفاق",
    title: "الشهادات والتقارير السنوية",
    desc: "قطف ثمار السنة الدراسية وتكريم المتميزين.",
    detail: "نهاية العام أو الفصل، يمكنك إصدار **نظام الشهادات** للطلبة بناءً على ما أنجزوه. بالإضافة لصدور **التقرير السنوي** الشامل لكل طالب، والذي يمكن طباعته بصيغة PDF وتوزيعه في الحفل الختامي للأولياء ليكون توثيقاً احترافياً.",
    icon: Award,
    colorFrom: "#eab308",
    colorTo: "#ca8a04",
    textColor: "text-yellow-700",
    bgLight: "bg-yellow-50/70",
    actionLabel: "نظام الشهادات",
    actionHref: "/app/certificates",
    actionIcon: Award,
    tags: ["إصدار الشهادات", "طباعة التقارير"],
  },
  {
    id: 11,
    phase: "توسيع الآفاق",
    title: "مركز الوثائق وإدارة المناسبات",
    desc: "أدوات إضافية لتكون المدرسة مؤسسة متكاملة.",
    detail: "لأننا نهتم بالتفاصيل:\n- **مركز الوثائق**: رفع وحفظ ملفات المدرسة الإدارية السحابية.\n- **الاجتماعات والمناسبات**: جدولة الاجتماعات للمعلمين وأولياء الأمور.\n- **مستلزمات المخيم**: تجهيز الرحلات والبرامج الترفيهية المغلقة.\n- **إرسال إشعارات**: منبهات وإشعارات لحظية تصل للكادر.",
    icon: FolderOpen,
    colorFrom: "#64748b",
    colorTo: "#475569",
    textColor: "text-slate-700",
    bgLight: "bg-slate-50/70",
    actionLabel: "مركز الوثائق",
    actionHref: "/app/documents",
    actionIcon: FolderOpen,
    tags: ["الرحلات", "الاجتماعات", "أرشيف المدرسة"],
  }
];

export default function GuidePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16" dir="rtl">
      {/* ─── Header Banner ─── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8 sm:p-12"
      >
        {/* Decorative circles */}
        <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute top-8 right-8 opacity-10">
          <GitBranch className="w-40 h-40" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shadow-xl shrink-0">
            <Map className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/15 text-white/70 px-3 py-1 rounded-full">دليل تفاعلي</span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 11 قسم
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-3" style={{ fontFamily: "var(--font-headline)" }}>
              خريطة المنصة الشاملة
            </h1>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed font-medium max-w-2xl">
              ابدأ من المرحلة الأولى وسر معنا حتى المرحلة الحادية عشرة. كل مرحلة تحتوي على زر يأخذك مباشرة للصفحة المقصودة.
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative z-10 mt-8 flex items-center gap-2">
          {GUIDE_STEPS.map((s, i) => (
            <div key={s.id} className="flex-1 flex items-center gap-1">
              <div
                className="w-full h-1.5 rounded-full"
                style={{ background: `linear-gradient(to right, ${s.colorFrom}, ${s.colorTo})` }}
              />
              {i < GUIDE_STEPS.length - 1 && (
                <ChevronLeft className="w-3 h-3 text-gray-600 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ─── Steps ─── */}
      <div className="space-y-6">
        {GUIDE_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const ActionIcon = step.actionIcon;
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + idx * 0.08, duration: 0.45, ease: "easeOut" }}
            >
              <div className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300 overflow-hidden">
                {/* Color top bar */}
                <div
                  className="h-1.5 w-full"
                  style={{ background: `linear-gradient(to left, ${step.colorFrom}, ${step.colorTo})` }}
                />

                <div className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Left: Icon + Number */}
                    <div className="flex items-start gap-4 sm:flex-col sm:items-center shrink-0">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-300"
                        style={{ background: `linear-gradient(135deg, ${step.colorFrom}, ${step.colorTo})` }}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="sm:text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          المرحلة {step.id}
                        </p>
                        <p
                          className={`text-xs font-black mt-0.5 ${step.textColor}`}
                        >
                          {step.phase}
                        </p>
                      </div>
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 min-w-0">
                      <h2
                        className="text-xl font-black text-gray-900 mb-2"
                        style={{ fontFamily: "var(--font-headline)" }}
                      >
                        {step.title}
                      </h2>
                      <p className="text-gray-500 font-semibold text-sm mb-4 leading-relaxed">
                        {step.desc}
                      </p>

                      {/* Detail box */}
                      <div className={`rounded-2xl p-4 ${step.bgLight} mb-4`}>
                        <p className="text-sm leading-relaxed font-medium text-gray-700 whitespace-pre-line">
                          {step.detail.replace(/\*\*(.*?)\*\*/g, "$1")}
                        </p>
                      </div>

                      {/* Tags */}
                      {step.tags && (
                        <div className="flex flex-wrap gap-2 mb-5">
                          {step.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-black px-3 py-1 rounded-full border border-gray-200 text-gray-500 bg-gray-50"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* CTA Button */}
                      {step.actionHref && (
                        <Link
                          href={step.actionHref}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-black shadow-md hover:shadow-lg transition-all duration-200 hover:opacity-90 active:scale-95"
                          style={{
                            background: `linear-gradient(135deg, ${step.colorFrom}, ${step.colorTo})`,
                          }}
                        >
                          {ActionIcon && <ActionIcon className="w-4 h-4" />}
                          {step.actionLabel}
                          <ArrowLeftIcon className="w-4 h-4 opacity-70" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Footer CTA ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="text-center space-y-4"
      >
        <div className="inline-block bg-gradient-to-r from-[var(--color-primary)] to-emerald-600 text-white px-8 py-4 rounded-2xl shadow-lg shadow-emerald-500/20">
          <p className="font-black text-base flex items-center gap-3">
            <Star className="w-5 h-5 fill-white" />
            أحسنت! الآن تعرف كل مميزات المنصة — ابدأ الرحلة من المرحلة الأولى 🚀
          </p>
        </div>
        <p className="text-xs text-gray-400 font-medium">
          في حال أي تساؤل، يسعدنا مساعدتك من خلال المدير أو فريق الدعم.
        </p>
      </motion.div>
    </div>
  );
}
