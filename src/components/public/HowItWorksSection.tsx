"use client";

import { motion } from "framer-motion";
import { CheckCircle, ArrowLeft, Rocket, Sparkles } from "lucide-react";
import Link from "next/link";

const steps = [
  {
    step: "01",
    title: "سجّل مدرستك",
    description:
      "أنشئ حسابك مجاناً في أقل من دقيقتين. لا تحتاج بطاقة ائتمان.",
    color: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
  },
  {
    step: "02",
    title: "أضف طلابك ومعلميك",
    description:
      "استورد بيانات طلابك أو أضفهم يدوياً مع تحديد المجموعات والحلقات.",
    color: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  {
    step: "03",
    title: "ابدأ الإدارة بذكاء",
    description:
      "سجّل الجلسات، تابع الحفظ، واستخرج التقارير تلقائياً من لوحة التحكم.",
    color: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
  },
];

const benefits = [
  "إعداد سريع خلال دقائق",
  "دعم كامل باللغة العربية",
  "تحديثات مستمرة بدون تكلفة",
  "بيانات محمية وآمنة تماماً",
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-28 bg-white relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-primary)]/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* Left: Steps */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div>
              <span className="badge-green mb-4 inline-flex">
                <Rocket className="w-3.5 h-3.5" />
                ابدأ خلال دقائق
              </span>
              <h2
                className="text-4xl font-black text-gray-900 mt-4 mb-4"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                كيف تبدأ مع{" "}
                <span className="text-[var(--color-primary)]">منصتنا؟</span>
              </h2>
              <p className="text-gray-500 leading-relaxed">
                بدون تقنيات معقدة أو تدريب طويل. ثلاث خطوات بسيطة وأنت جاهز.
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-5">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className={`flex gap-5 p-5 rounded-2xl border ${step.color} transition-all duration-300 hover:shadow-md`}
                >
                  <div
                    className="text-3xl font-black opacity-20 text-gray-900 leading-none shrink-0 pt-1"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    {step.step}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-2 h-2 rounded-full ${step.dot}`} />
                      <h3
                        className="font-black text-gray-900 text-base"
                        style={{ fontFamily: "var(--font-headline)" }}
                      >
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <Link href="/register" className="btn-primary inline-flex">
                ابدأ مجاناً الآن
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: Benefits Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/8 to-[var(--color-secondary)]/8 rounded-4xl" />

            <div className="relative bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
              {/* Icon */}
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center mb-8 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              <h3
                className="text-2xl font-black text-gray-900 mb-3"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                لماذا تختار منصتنا؟
              </h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                صمّمنا كل تفصيلة في المنصة لتناسب الواقع اليومي للمدارس
                القرآنية العربية.
              </p>

              {/* Benefits */}
              <ul className="space-y-4 mb-10">
                {benefits.map((b, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3 text-gray-700 font-medium"
                  >
                    <CheckCircle className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
                    {b}
                  </motion.li>
                ))}
              </ul>

              {/* Big Stat */}
              <div className="bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5 rounded-2xl p-6 text-center border border-[var(--color-primary)]/10">
                <p
                  className="text-5xl font-black text-[var(--color-primary)] mb-2"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  100%
                </p>
                <p className="text-gray-600 font-bold">
                  مجاني للبدء ولا توجد رسوم خفية
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
