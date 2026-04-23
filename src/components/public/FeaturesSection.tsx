"use client";

import { motion } from "framer-motion";
import {
  Users,
  BarChart3,
  Bell,
  FileText,
  BookOpen,
  Calendar,
  Trophy,
  Shield,
  Smartphone,
  Clock,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "متابعة دقيقة للحفظ والتسميع",
    description: "تتبع مسار كل طالب بدقة فائقة: السور، الأخطاء، والتقدم اليومي، مما يتيح للمعلم تقييم أداء الحلقات بضغطة زر.",
    color: "from-amber-400 to-amber-600",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  {
    icon: Users,
    title: "إدارة متكاملة للسجلات",
    description: "تخلص من الورق نهائياً؛ سجلات الطلاب، درجاتهم، ومعلومات أوليائهم كلها منظمة ومتاحة للبحث والوصول الفوري.",
    color: "from-emerald-400 to-emerald-600",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  {
    icon: Bell,
    title: "تواصل مباشر مع الأولياء",
    description: "ربط ولي الأمر بحلقة ابنه عبر النظام، ليصله تقدم مستوى الحفظ وأي ملاحظات من المعلم بوضوح وشفافية.",
    color: "from-purple-400 to-purple-600",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
  {
    icon: BarChart3,
    title: "إحصائيات تُظهر الأداء الفعلي",
    description: "لوحة تحكم ذكية تلخص لك أداء المدرسة، لمعرفة أنشط الحلقات ومستوى تطور الطلاب بشكل مرئي وسهل القراءة.",
    color: "from-blue-400 to-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-28 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 islamic-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-primary)]/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="badge-green mb-4 mx-auto">
            <Clock className="w-3.5 h-3.5" />
            كل ما تحتاجه في مكان واحد
          </span>
          <h2
            className="text-4xl lg:text-5xl font-black text-gray-900 mt-4 mb-5"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            نُركّز على ما يهمّ{" "}
            <span className="text-[var(--color-primary)]">المدرسة القرآنية</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            استغنينا عن التعقيد وركزنا على الأدوات الأساسية التي تصنع الفارق الحقيقي في التسيير اليومي لمتابعة الحلقات وحفظة كتاب الله.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="group bg-white rounded-3xl p-6 border border-gray-100 hover-lift shadow-sm hover:shadow-lg hover:border-[var(--color-primary)]/20 transition-all duration-300"
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}
                >
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3
                className={`text-lg font-bold text-gray-900 mb-2`}
                style={{ fontFamily: "var(--font-headline)" }}
              >
                {feature.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
