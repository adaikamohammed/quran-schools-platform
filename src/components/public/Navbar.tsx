"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, BookOpen, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "المدارس", href: "/#schools" },
  { label: "الميزات", href: "/#features" },
  { label: "كيف يعمل؟", href: "/#how-it-works" },
  { label: "عن المنصة", href: "/about" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-[var(--color-border)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 shrink-0 drop-shadow-md group-hover:scale-105 transition-transform duration-300 rounded-[12px] overflow-hidden">
                <Image src="/icons/icon-192x192.png" alt="فرسان القرآن" width={44} height={44} className="w-full h-full object-cover scale-[1.03]" />
              </div>
              <div className="flex flex-col leading-tight">
                <span
                  className="text-[1.05rem] font-black text-gray-900"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  منصة فرسان القرآن
                </span>
                <span className="text-xs font-bold text-[var(--color-primary)] opacity-80">
                  لإدارة المدارس القرآنية
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-bold text-gray-600 hover:text-[var(--color-primary)] transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-0.5 right-0 w-0 h-0.5 bg-[var(--color-primary)] group-hover:w-full transition-all duration-300 rounded-full" />
                </Link>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-bold text-gray-700 hover:text-[var(--color-primary)] transition-colors px-4 py-2"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                className="btn-primary text-sm py-2.5 px-5"
              >
                سجّل مدرستك مجاناً
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
              aria-label="القائمة"
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-0 right-0 z-40 bg-white border-b border-[var(--color-border)] shadow-xl md:hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className="text-lg font-bold text-gray-700 hover:text-[var(--color-primary)] transition-colors py-2 border-b border-gray-100"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-3 pt-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileOpen(false)}
                  className="btn-secondary text-center justify-center"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileOpen(false)}
                  className="btn-primary text-center justify-center"
                >
                  سجّل مدرستك مجاناً
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
