"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Heart, BookOpen, Users, Globe, DollarSign,
  MessageCircle, Mail, Sparkles, Star, ArrowLeft, Server
} from "lucide-react";

const supportTiers = [
  {
    servers: "استضافة محدودة (تجريبي)",
    schools: "3-5 مدارس",
    students: "حتى 500 طالب",
    cost: "مجاني",
    isCurrent: true,
  },
  {
    servers: "استضافة متقدمة (مرحلة التوسع)",
    schools: "50+ مدرسة",
    students: "حتى 10,000 طالب",
    cost: "≈ 25$ / شهر",
    isCurrent: false,
  },
  {
    servers: "خوادم مخصصة (مرحلة الانتشار)",
    schools: "مئات المدارس",
    students: "عشرات الآلاف",
    cost: "≈ 100-200$ / شهر",
    isCurrent: false,
  },
];

export default function WaqfSection() {
  const whatsappMsg = encodeURIComponent(
    "السلام عليكم، أريد دعم منصة فرسان القرآن الخيرية 🌿"
  );

  return (
    <section id="waqf" className="relative py-24 overflow-hidden bg-gradient-to-b from-white via-emerald-50/30 to-white">
      {/* Decorative background */}
      <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-400/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-black mb-6 border border-emerald-200">
            <Heart className="w-4 h-4 fill-current" />
            مشروع وقفي مجاني — صدقة جارية
          </div>

          <h2
            className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-6"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            في ميزان حسنات{" "}
            <span className="text-[var(--color-primary)]">فارس عدايكة</span>
            {" "}رحمه الله
          </h2>

          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            إيماناً منا بما توفره التقنية من سبل لخدمة كتاب الله، قمنا بتطوير هذا النظام
            للمدرسة القرآنية للإمام الشافعي. وبعد تطبيقه ميدانياً لعدة أشهر مع أكثر من{" "}
            <strong className="text-gray-900">300 طالب و18 فوجاً قرآنياً</strong>،
            وثبوت نجاحه وكفاءته، قرّرنا تعميمه كـ "وقف خيري مجاني" متاح لكل مدرسة قرآنية في العالم.
          </p>
        </motion.div>

        {/* Story Cards Row */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: BookOpen,
              color: "bg-emerald-100 text-emerald-700",
              border: "border-emerald-200",
              title: "البداية الميدانية",
              desc: "بُني النظام لمدرسة الإمام الشافعي القرآنية بالجزائر، وجُرّب بنجاح لأشهر متواصلة مع أكثر من 300 طالب و18 فوجاً قرآنياً.",
            },
            {
              icon: Sparkles,
              color: "bg-amber-100 text-amber-700",
              border: "border-amber-200",
              title: `إهداء لروح فارس عدايكة رحمه الله`,
              desc: "سُمّيت المنصة \"فرسان القرآن\" تيمّناً باسمه. نسأل الله أن يجعل كل طالب يحفظ القرآن عبر هذه المنصة في ميزان حسناته.",
            },
            {
              icon: Globe,
              color: "bg-blue-100 text-blue-700",
              border: "border-blue-200",
              title: "الحلم العالمي",
              desc: "نسعى لأن تصل هذه المنصة لكل مدرسة وكل حلقة قرآنية في بقاع الأرض لتستفيد منها مجاناً. ونطمح مستقبلاً لإطلاق منافسات قرآنية وإحصائيات تربط بين المدارس والدول.",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className={`p-6 rounded-3xl border-2 ${card.border} bg-white shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className={`w-12 h-12 rounded-2xl ${card.color} flex items-center justify-center mb-4`}>
                <card.icon className="w-6 h-6" />
              </div>
              <h3 className="font-black text-gray-900 mb-2 text-lg" style={{ fontFamily: "var(--font-headline)" }}>
                {card.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>



        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-sm text-gray-400 mb-4">هل مدرستك جاهزة للانضمام اليوم؟</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-black transition-colors shadow-lg shadow-[var(--color-primary)]/20"
          >
            سجّل مدرستك مجاناً
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
