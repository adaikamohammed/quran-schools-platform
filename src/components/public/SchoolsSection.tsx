"use client";

import { motion } from "framer-motion";
import { MapPin, Users, BookOpen, ExternalLink } from "lucide-react";

// Placeholder schools — will come from Supabase later
const schools = [
  {
    id: 1,
    name: "مدرسة الإمام الشافعي",
    city: "الوادي",
    country: "الجزائر",
    students: 249,
    teachers: 18,
    groups: 18,
    flag: "🇩🇿",
    color: "from-green-400 to-emerald-600",
    initials: "ش",
  },
  {
    id: 2,
    name: "مدرسة النور القرآنية",
    city: "الرياض",
    country: "السعودية",
    students: 312,
    teachers: 22,
    groups: 20,
    flag: "🇸🇦",
    color: "from-teal-400 to-teal-600",
    initials: "ن",
  },
  {
    id: 3,
    name: "مدرسة الفرقان للتحفيظ",
    city: "الدار البيضاء",
    country: "المغرب",
    students: 180,
    teachers: 14,
    groups: 12,
    flag: "🇲🇦",
    color: "from-amber-400 to-orange-500",
    initials: "ف",
  },
  {
    id: 4,
    name: "مدرسة الخير القرآنية",
    city: "القاهرة",
    country: "مصر",
    students: 425,
    teachers: 28,
    groups: 30,
    flag: "🇪🇬",
    color: "from-blue-400 to-blue-600",
    initials: "خ",
  },
  {
    id: 5,
    name: "مدرسة الهدى للتحفيظ",
    city: "تونس",
    country: "تونس",
    students: 198,
    teachers: 16,
    groups: 15,
    flag: "🇹🇳",
    color: "from-purple-400 to-purple-600",
    initials: "هـ",
  },
  {
    id: 6,
    name: "مدرسة البيان للقرآن",
    city: "دبي",
    country: "الإمارات",
    students: 267,
    teachers: 20,
    groups: 18,
    flag: "🇦🇪",
    color: "from-pink-400 to-rose-500",
    initials: "ب",
  },
];

export default function SchoolsSection() {
  return (
    <section id="schools" className="py-28 bg-[var(--color-muted)] relative overflow-hidden">
      <div className="absolute inset-0 islamic-pattern opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="badge-gold mb-4 mx-auto inline-flex">
            <MapPin className="w-3.5 h-3.5" />
            مجتمع المدارس المنضمة
          </span>
          <h2
            className="text-4xl lg:text-5xl font-black text-gray-900 mt-4 mb-5"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            مدارس تثق{" "}
            <span className="text-[var(--color-primary)]">في منصتنا</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            انضمّت إلى المنصة مدارس قرآنية من مختلف الدول العربية، وهذه ليست
            سوى البداية.
          </p>
        </motion.div>

        {/* Schools Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((school, i) => (
            <motion.div
              key={school.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="bg-white rounded-3xl p-6 border border-gray-100 hover-lift shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              {/* School Avatar & Name */}
              <div className="flex items-start gap-4 mb-5">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${school.color} flex items-center justify-center text-white text-xl font-black shrink-0 group-hover:scale-110 transition-transform`}
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  {school.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-black text-gray-900 text-base leading-snug mb-1"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    {school.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {school.city}، {school.country}
                    </span>
                    <span className="mr-1">{school.flag}</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100 mb-4" />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { value: school.students, label: "طالب", icon: Users },
                  { value: school.teachers, label: "معلم", icon: BookOpen },
                  { value: school.groups, label: "حلقة", icon: BookOpen },
                ].map((stat, j) => (
                  <div key={j} className="bg-gray-50 rounded-xl p-2.5">
                    <p
                      className="text-lg font-black text-gray-800"
                      style={{ fontFamily: "var(--font-headline)" }}
                    >
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-gray-500 mb-4 font-medium">
            وغيرها من المدارس حول العالم العربي...
          </p>
          <a href="/register" className="btn-primary inline-flex">
            أضف مدرستك إلى القائمة
            <ExternalLink className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
