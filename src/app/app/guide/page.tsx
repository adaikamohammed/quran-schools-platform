"use client";

import { motion } from "framer-motion";
import {
  Building2, Users, UserPlus, BookOpen,
  GraduationCap, ShieldCheck, Link2,
  FileCheck2, ArrowLeft, ArrowLeft as ArrowLeftIcon,
  Settings, ClipboardList, Star, GitBranch,
  ChevronLeft, Sparkles, Map
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
  {
    id: 1,
    phase: "التأسيس",
    title: "هيكلة المدرسة وتقسيم الأفواج",
    desc: "أول خطوة هي تأسيس الهيكل الأساسي للمدرسة وتسمية أفواجها.",
    detail:
      "من صفحة **الإعدادات**، يقوم مدير المدرسة بإدخال اسمها وبلدها. بعدها يحدد أسعار الاشتراكات: **فئة الأصاغر** (سعر مخفض للأطفال الصغار) و**فئة الأكابر** (للكبار). يتم تسمية الأفواج داخل مدير الكادر.",
    icon: Building2,
    colorFrom: "#6366f1",
    colorTo: "#8b5cf6",
    textColor: "text-indigo-700",
    bgLight: "bg-indigo-50",
    actionLabel: "الإعدادات وتسمية الأفواج",
    actionHref: "/app/settings",
    actionIcon: Settings,
    tags: ["تسعير الاشتراكات", "بيانات المدرسة", "الإعداد الأولي"],
  },
  {
    id: 2,
    phase: "الكادر",
    title: "تعيين المشايخ والمعلمين",
    desc: "أنشئ حسابات المشايخ وأسند لكل منهم فوجه الخاص.",
    detail:
      "من صفحة **أفواج المدرسة**، تستطيع إضافة معلم جديد بإدخال اسمه وبريده الإلكتروني وكلمة مروره. كل معلم يملك حسابه الخاص ويرى فقط طلاب فوجه، مما يحفظ الخصوصية بين الأفواج.",
    icon: Users,
    colorFrom: "#0ea5e9",
    colorTo: "#2563eb",
    textColor: "text-blue-700",
    bgLight: "bg-blue-50",
    actionLabel: "إدارة المعلمين والأفواج",
    actionHref: "/app/teachers",
    actionIcon: GraduationCap,
    tags: ["حسابات منفصلة", "فصل الأفواج", "خصوصية البيانات"],
  },
  {
    id: 3,
    phase: "التسجيل",
    title: "استقطاب الطلبة وقبولهم",
    desc: "يمكن لأولياء الأمور طلب التسجيل أو يقوم المعلم بالإضافة المباشرة.",
    detail:
      "يتم استقبال طلبات التسجيل الخارجية من صفحة **التسجيلات الجديدة**. المدير هو من يقوم بمراجعة الطلب والموافقة عليه وتوجيه الطالب لفوج معين. بعد القبول، يُضاف الطالب مع كامل بياناته: العمر، المستوى الدراسي، ولي الأمر، ونوع الاشتراك.",
    icon: UserPlus,
    colorFrom: "#10b981",
    colorTo: "#059669",
    textColor: "text-emerald-700",
    bgLight: "bg-emerald-50",
    actionLabel: "التسجيلات الجديدة",
    actionHref: "/app/registrations",
    actionIcon: FileCheck2,
    tags: ["طلبات التسجيل", "توجيه للأفواج", "إدارة الاشتراكات"],
  },
  {
    id: 4,
    phase: "المتابعة اليومية",
    title: "الحصص اليومية والحضور",
    desc: "كل يوم يسجل المعلم الحصة، الحضور، والتقييم الفردي.",
    detail:
      "من صفحة **الحصص اليومية**، يختار المعلم تاريخ اليوم ويبدأ بتسجيل حضور كل طالب وتقييمه. يُدخَل عدد الأخطاء، مستوى التجويد، والكمية المحفوظة. هذه السجلات تشكل **تاريخ الطالب الكامل** الذي يمكن مراجعته في أي وقت.",
    icon: ClipboardList,
    colorFrom: "#f59e0b",
    colorTo: "#d97706",
    textColor: "text-amber-700",
    bgLight: "bg-amber-50",
    actionLabel: "الحصص اليومية",
    actionHref: "/app/sessions",
    actionIcon: ClipboardList,
    tags: ["سجل الحضور", "التقييم اليومي", "إحصاء الأخطاء"],
  },
  {
    id: 5,
    phase: "الحفظ",
    title: "متابعة 114 سورة بدقة",
    desc: "خريطة تفصيلية لكل سورة في القرآن الكريم مرتبطة بكل طالب.",
    detail:
      "صفحة **متابعة الحفظ** تعرض جميع السور الـ 114 بتدرج لوني: 🟢 محفوظة، 🟡 جارٍ حفظها، ⚪ لم تُحفظ بعد. يتيح ذلك للمعلم رؤية شاملة للمستوى الكلي لكل طالب دفعة واحدة وتحديثه بسهولة.",
    icon: BookOpen,
    colorFrom: "#8b5cf6",
    colorTo: "#7c3aed",
    textColor: "text-violet-700",
    bgLight: "bg-violet-50",
    actionLabel: "متابعة الحفظ",
    actionHref: "/app/quran",
    actionIcon: BookOpen,
    tags: ["114 سورة", "تدرج لوني", "تقدم محسوس"],
  },
  {
    id: 6,
    phase: "الانضباط",
    title: "العهود والعُقوبات التربوية",
    desc: "نظام سلوكي لمتابعة التزام الطالب وتوثيق الإنذارات.",
    detail:
      "من صفحة **العهود والعقوبات**، يستطيع المعلم توثيق العهد الذي قطعه الطالب على نفسه (مثل: حفظ سورة خلال أسبوع) وتسجيل ما تم بناءً على التزامه أو إخلاله. هذا يربي روح المسؤولية والالتزام.",
    icon: ShieldCheck,
    colorFrom: "#ef4444",
    colorTo: "#dc2626",
    textColor: "text-red-700",
    bgLight: "bg-red-50",
    actionLabel: "العهود والعقوبات",
    actionHref: "/app/covenants",
    actionIcon: ShieldCheck,
    tags: ["العهود الشخصية", "توثيق الانضباط", "تقويم السلوك"],
  },
  {
    id: 7,
    phase: "ولي الأمر",
    title: "مشاركة التقدم مع أولياء الأمور",
    desc: "رابط شخصي ومباشر يتمكن به الولي من متابعة ابنه بدون حساب.",
    detail:
      "من صفحة ملف الطالب، يقوم المعلم باستخراج **رابط متابعة مخصص** يحمل معرّف الطالب (ID). يرسله عبر واتساب للأب ليرى التقييمات، الحضور، ومستوى الحفظ — بدون أي حاجة لتسجيل دخول أو حساب.",
    icon: Link2,
    colorFrom: "#06b6d4",
    colorTo: "#0891b2",
    textColor: "text-cyan-700",
    bgLight: "bg-cyan-50",
    actionLabel: "إدارة الطلاب",
    actionHref: "/app/students",
    actionIcon: Users,
    tags: ["رابط واتساب", "بدون حساب", "خصوصية آمنة"],
  },
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
                <Sparkles className="w-3 h-3" /> 7 مراحل
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-3" style={{ fontFamily: "var(--font-headline)" }}>
              خريطة المنصة الشاملة
            </h1>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed font-medium max-w-2xl">
              ابدأ من المرحلة الأولى وسر معنا حتى المرحلة السابعة. كل مرحلة تحتوي على زر يأخذك مباشرة للصفحة المقصودة.
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
