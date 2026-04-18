import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Link from "next/link";
import {
  BookOpen,
  Target,
  Globe,
  Users,
  Lightbulb,
  ArrowLeft,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "عن منصة فرسان القرآن",
  description:
    "تعرّف على قصة منصة فرسان القرآن، رسالتنا، وهدفنا في خدمة تعليم القرآن الكريم.",
};

const values = [
  {
    icon: BookOpen,
    title: "خدمة كتاب الله",
    description:
      "كل ميزة في المنصة صُممت لخدمة تعليم القرآن الكريم وتيسير إدارة حلقاته.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Target,
    title: "الدقة والاحتراف",
    description:
      "نوفر أدوات احترافية تُمكّن المعلمين والمديرين من متابعة دقيقة وموثوقة.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Globe,
    title: "الوصول للجميع",
    description:
      "نسعى لإتاحة المنصة لكل مدرسة قرآنية في العالم العربي بأسعار في متناول الجميع.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Users,
    title: "مجتمع قرآني",
    description:
      "نبني شبكة من المدارس القرآنية المتصلة التي تتبادل الخبرات وتتعاون.",
    color: "bg-purple-50 text-purple-600",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-20">
        {/* Hero */}
        <section className="py-24 hero-bg islamic-pattern text-center">
          <div className="max-w-3xl mx-auto px-4">
            <span className="badge-green mb-5 mx-auto inline-flex">
              <Lightbulb className="w-3.5 h-3.5" />
              قصتنا ورسالتنا
            </span>
            <h1
              className="text-5xl font-black text-gray-900 mb-6"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              عن {" "}
              <span className="text-[var(--color-primary)]">منصة فرسان القرآن</span>
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed">
              منصة رقمية وُلدت من رحم الحاجة الفعلية لمدارس تحفيظ القرآن
              الكريم في العالم العربي — لتُحوّل الفوضى الإدارية إلى نظام
              احترافي منظّم.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2
                className="text-3xl font-black text-gray-900"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                كيف بدأت الفكرة؟
              </h2>
              <p className="text-gray-600 leading-relaxed">
                بدأت القصة في إحدى مدارس التحفيظ الصغيرة بالجزائر، حيث كان
                المعلمون يُديرون سجلات طلابهم بدفاتر ورقية وجداول Excel يدوية.
                كانت البيانات مشتّتة، والتقارير تستغرق ساعات.
              </p>
              <p className="text-gray-600 leading-relaxed">
                من تلك التجربة الفعلية، وُلدت فكرة بناء منصة رقمية مخصصة
                تماماً للمدارس القرآنية — تُحوّل كل تلك العمليات المعقدة إلى
                بضع نقرات بسيطة.
              </p>
              <p className="text-gray-600 leading-relaxed">
                اليوم، تخدم المنصة عشرات المدارس في مختلف الدول العربية، وما
                زلنا نبني ونُطوّر بناءً على احتياجات المعلمين الحقيقية.
              </p>
            </div>
            <div className="bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5 rounded-3xl p-10 border border-[var(--color-primary)]/10">
              <div className="grid grid-cols-2 gap-6">
                {[
                  { value: "2024", label: "سنة التأسيس" },
                  { value: "50+", label: "مدرسة منضمة" },
                  { value: "12", label: "دولة عربية" },
                  { value: "5,000+", label: "طالب مستفيد" },
                ].map((s, i) => (
                  <div key={i} className="text-center p-4 bg-white rounded-2xl shadow-sm">
                    <p
                      className="text-3xl font-black text-[var(--color-primary)] mb-1"
                      style={{ fontFamily: "var(--font-headline)" }}
                    >
                      {s.value}
                    </p>
                    <p className="text-gray-500 text-sm font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-[var(--color-muted)]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-14">
              <h2
                className="text-3xl font-black text-gray-900"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                قيمنا وما نؤمن به
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((val, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-6 border border-gray-100 hover-lift shadow-sm"
                >
                  <div className={`w-12 h-12 rounded-2xl ${val.color} flex items-center justify-center mb-4`}>
                    <val.icon className="w-6 h-6" />
                  </div>
                  <h3
                    className="font-bold text-gray-900 mb-2"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    {val.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {val.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-white text-center">
          <div className="max-w-2xl mx-auto px-4">
            <h2
              className="text-3xl font-black text-gray-900 mb-4"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              هل أنت مدير مدرسة قرآنية؟
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              انضم إلى منصتنا مجاناً وابدأ رحلة إدارة احترافية لمدرستك.
            </p>
            <Link href="/register" className="btn-primary inline-flex text-base">
              سجّل مدرستك الآن
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
