"use client";

import { useState } from "react";
import { ChevronDown, X, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AcademicYearPickerProps {
  value: string;          // format: "2024-2025"
  onChange: (year: string) => void;
  disabled?: boolean;
}

function buildYearsList(): string[] {
  const years: string[] = [];
  const current = new Date().getFullYear();
  // من 5 سنوات ماضية إلى 2 سنوات قادمة
  for (let y = current + 2; y >= current - 5; y--) {
    years.push(`${y}-${y + 1}`);
  }
  return years;
}

const YEARS = buildYearsList();

export function AcademicYearPicker({ value, onChange, disabled = false }: AcademicYearPickerProps) {
  const [open, setOpen] = useState(false);
  const currentYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`
          w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all
          ${disabled
            ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-70"
            : "bg-white border-[var(--color-border)] hover:border-[var(--color-primary)] cursor-pointer"
          }
        `}
      >
        <GraduationCap className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
        <span className="flex-1 text-right text-gray-800" dir="ltr">
          {value || "اختر الموسم الدراسي..."}
        </span>
        {value && value !== currentYear && (
          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {value === currentYear ? "الحالي" : ""}
          </span>
        )}
        {value === currentYear && (
          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-black">
            الحالي
          </span>
        )}
        {!disabled && <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-1.5 right-0 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full"
            >
              <div className="p-2 max-h-64 overflow-y-auto space-y-0.5">
                {YEARS.map((year) => (
                  <button
                    key={year}
                    onClick={() => { onChange(year); setOpen(false); }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all text-right
                      ${value === year
                        ? "bg-[var(--color-primary)] text-white"
                        : year === currentYear
                        ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        : "text-gray-700 hover:bg-gray-50"
                      }
                    `}
                  >
                    <span className="flex-1" dir="ltr">{year}</span>
                    {year === currentYear && value !== year && (
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                        الحالي
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
