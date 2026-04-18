"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Mail, Phone, MapPin, Share2, Globe, PlayCircle, Camera } from "lucide-react";

const quickLinks = [
  { label: "الصفحة الرئيسية", href: "/" },
  { label: "الميزات", href: "/#features" },
  { label: "المدارس المنضمة", href: "/#schools" },
  { label: "كيف يعمل النظام؟", href: "/#how-it-works" },
  { label: "عن المنصة", href: "/about" },
];

const accountLinks = [
  { label: "تسجيل الدخول", href: "/login" },
  { label: "تسجيل مدرسة جديدة", href: "/register" },
  { label: "لوحة التحكم", href: "/app" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)]/8 rounded-full blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--color-secondary)]/6 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 translate-y-1/2" />

      {/* CTA Banner */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="bg-gradient-to-l from-[var(--color-primary-dark)] to-[var(--color-primary)] rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute inset-0 islamic-pattern opacity-10 pointer-events-none" />
            <div className="relative z-10">
              <h3
                className="text-2xl md:text-3xl font-black text-white mb-2"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                هل مدرستك جاهزة للانضمام؟
              </h3>
              <p className="text-white/75 text-base">
                انضم إلى مئات المدارس القرآنية التي تُدير طلابها باحتراف.
              </p>
            </div>
            <Link
              href="/register"
              className="relative z-10 btn-gold text-base shrink-0"
            >
              ابدأ مجاناً الآن
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center shrink-0 shadow-md rounded-[12px] overflow-hidden">
                <img src="/icons/icon-192x192.png" alt="شعار فرسان القرآن" className="w-full h-full object-cover scale-[1.03]" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-black text-white" style={{ fontFamily: "var(--font-headline)" }}>
                  منصة فرسان القرآن
                </span>
                <span className="text-xs text-[var(--color-primary)] opacity-80 font-bold">
                  لإدارة المدارس القرآنية
                </span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              منصة فرسان القرآن — منصة رقمية متكاملة لإدارة المدارس القرآنية، تُمكّن المعلمين
              والمديرين من متابعة الطلاب وخدمة كتاب الله بفعالية.
            </p>
            <div className="flex gap-3">
              {[Share2, Globe, PlayCircle, Camera].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-[var(--color-primary)] flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-5">
            <h4 className="font-bold text-white" style={{ fontFamily: "var(--font-headline)" }}>
              روابط سريعة
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-[var(--color-primary)] transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]/40 group-hover:bg-[var(--color-primary)] transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div className="space-y-5">
            <h4 className="font-bold text-white" style={{ fontFamily: "var(--font-headline)" }}>
              الحساب
            </h4>
            <ul className="space-y-3">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-[var(--color-primary)] transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]/40 group-hover:bg-[var(--color-primary)] transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-5">
            <h4 className="font-bold text-white" style={{ fontFamily: "var(--font-headline)" }}>
              تواصل معنا
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-[var(--color-primary)]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">البريد الإلكتروني</p>
                  <a href="mailto:adaikamohamedali213213@gmail.com" className="text-gray-300 text-sm hover:text-[var(--color-primary)] transition-colors">
                    adaikamohamedali213213@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-4 h-4 text-[var(--color-primary)]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">الدعم الفني</p>
                  <p className="text-gray-300 text-sm" dir="ltr">+213 673 28 28 19</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">المقر</p>
                  <p className="text-gray-300 text-sm">الجزائر، الوادي</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} منصة فرسان القرآن - لإدارة المدارس القرآنية. جميع الحقوق محفوظة.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a>
            <a href="#" className="hover:text-white transition-colors">شروط الاستخدام</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
