"use client";
import SchoolGuard from "@/components/layout/SchoolGuard";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSound } from "@/context/SoundContext";
import { getDB, saveRegistration, queueForSync } from "@/lib/storage/db";
import { createRegistration, updateRegistrationStatus, createStudent } from "@/lib/storage/mutations";
import type { PreRegistration, PreRegistrationStatus, AppUser, SubscriptionTier, MemorizationAmount, Student } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import {
  UserPlus, Search, Plus, X, Loader2, Send,
  ChevronRight, ChevronLeft, Edit3, LayoutGrid, Table2,
  ArrowUpDown, Phone, MessageSquare, Printer, BarChart3,
  CheckSquare, Settings2, CheckCircle2, Save,
  TrendingUp, TrendingDown, Kanban, Activity,
  Users, Award, Calendar, ArrowRight,
} from "lucide-react";
import { PhotoPicker } from "@/components/ui/PhotoPicker";

// ─── أنواع ───────────────────────────────────────────────
type ViewMode = "cards" | "table" | "pipeline";

// ─── إعداد الحالات ───────────────────────────────────────
const STATUS_CFG: Record<
  PreRegistrationStatus,
  { label: string; color: string; bg: string; border: string; rowBg: string; emoji: string }
> = {
  "مرشح":              { label: "مرشح",       color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200",  rowBg: "hover:bg-purple-50/40",  emoji: "⭐" },
  "تم الإتصال":        { label: "تم الاتصال", color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    rowBg: "hover:bg-blue-50/40",    emoji: "📞" },
  "مؤجل":              { label: "مؤجل",        color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   rowBg: "hover:bg-amber-50/40",   emoji: "⏰" },
  "تم الإنضمام":       { label: "انضم ✓",      color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", rowBg: "bg-emerald-50/30",       emoji: "✅" },
  "مرفوض":             { label: "مرفوض",       color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",     rowBg: "bg-red-50/20",           emoji: "❌" },
  "إنضم لمدرسة أخرى": { label: "مدرسة أخرى", color: "text-gray-600",    bg: "bg-gray-100",   border: "border-gray-300",    rowBg: "hover:bg-gray-50/40",    emoji: "🏫" },
  "مكرر":              { label: "مكرر",        color: "text-yellow-600",  bg: "bg-yellow-50",  border: "border-yellow-200",  rowBg: "hover:bg-yellow-50/40",  emoji: "⚠️" },
  "لم يرد":            { label: "لم يرد",      color: "text-gray-500",    bg: "bg-gray-50",    border: "border-gray-200",    rowBg: "hover:bg-gray-50/20",    emoji: "📵" },
};
const ALL_STATUSES = Object.keys(STATUS_CFG) as PreRegistrationStatus[];

const LEVEL_GROUPS = [
  { label: "الطور الابتدائي", levels: ["1 ابتدائي", "2 ابتدائي", "3 ابتدائي", "4 ابتدائي", "5 ابتدائي", "6 ابتدائي"] },
  { label: "الطور المتوسط",   levels: ["1 متوسط", "2 متوسط", "3 متوسط", "4 متوسط"] },
  { label: "الطور الثانوي",   levels: ["1 ثانوي", "2 ثانوي", "3 ثانوي"] },
  { label: "أخرى",            levels: ["تمهيدي", "تحضيري", "جامعي", "غير محدد"] },
];

const ITEMS_PER_PAGE = 10;
const YEARS = [2024, 2025, 2026, 2027];

// ─── تعديل بيانات تسجيل ──────────────────────────────────
async function updateRegistrationData(
  id: string,
  patches: Partial<PreRegistration>
): Promise<PreRegistration> {
  const db = getDB();
  const existing = await db.registrations.get(id);
  if (!existing) throw new Error(`التسجيل ${id} غير موجود`);
  const now = new Date().toISOString();
  const updated: PreRegistration = { ...existing, ...patches, updatedAt: now };
  await saveRegistration(updated);
  await queueForSync("registrations", "update", id, updated);
  return updated;
}

// ──────────────────────────────────────────────────────────
// اختيار السنة
// ──────────────────────────────────────────────────────────
function YearPicker({ value, onChange }: { value: number; onChange: (y: number) => void }) {
  return (
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-2xl p-1">
      <button onClick={() => onChange(value - 1)}
        className="w-7 h-7 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
      {YEARS.map((y) => (
        <button key={y} onClick={() => onChange(y)}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
            value === y ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"
          }`}>{y}</button>
      ))}
      <button onClick={() => onChange(value + 1)}
        className="w-7 h-7 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// فلتر الحالة
// ──────────────────────────────────────────────────────────
function StatusFilterBar({ value, onChange, counts }: {
  value: PreRegistrationStatus | "الكل";
  onChange: (s: PreRegistrationStatus | "الكل") => void;
  counts: Record<string, number>;
}) {
  const filters: Array<{ key: PreRegistrationStatus | "الكل"; label: string; activeClass: string }> = [
    { key: "الكل",              label: "الكل",        activeClass: "bg-gray-800 text-white" },
    { key: "مرشح",              label: "مرشح",        activeClass: "bg-purple-600 text-white" },
    { key: "تم الإتصال",       label: "تم الاتصال", activeClass: "bg-blue-600 text-white" },
    { key: "مؤجل",              label: "مؤجل",        activeClass: "bg-amber-600 text-white" },
    { key: "تم الإنضمام",      label: "انضم",        activeClass: "bg-emerald-600 text-white" },
    { key: "مرفوض",             label: "مرفوض",       activeClass: "bg-red-500 text-white" },
    { key: "لم يرد",            label: "لم يرد",      activeClass: "bg-gray-500 text-white" },
    { key: "مكرر",              label: "مكرر",        activeClass: "bg-yellow-500 text-white" },
    { key: "إنضم لمدرسة أخرى", label: "مدرسة أخرى", activeClass: "bg-gray-600 text-white" },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {filters.map((f) => {
        const cnt = f.key === "الكل" ? (counts["الكل"] ?? 0) : (counts[f.key] ?? 0);
        const active = value === f.key;
        return (
          <button key={f.key} onClick={() => onChange(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
              active ? `${f.activeClass} border-transparent shadow-sm` : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
            }`}>
            {f.label}
            {cnt > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${active ? "bg-white/25" : "bg-gray-100 text-gray-600"}`}>
                {cnt}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// اختيار المستوى الدراسي
// ──────────────────────────────────────────────────────────
function LevelPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      {LEVEL_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{group.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {group.levels.map((lvl) => (
              <button key={lvl} type="button" onClick={() => onChange(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  value === lvl ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "bg-white border-gray-200 text-gray-600 hover:border-[var(--color-primary)]/40"
                }`}>{lvl}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// لوحة الإحصائيات البسيطة (قديمة — محفوظة للتوافق)
// ──────────────────────────────────────────────────────────
function StatsPanel({ items }: { items: PreRegistration[] }) {
  const total = items.length;
  if (total === 0) return null;
  const male = items.filter((r) => r.gender === "ذكر").length;
  const female = items.filter((r) => r.gender === "أنثى").length;
  const statusStats = ALL_STATUSES.map((s) => ({
    s, cfg: STATUS_CFG[s], cnt: items.filter((r) => r.status === s).length,
  })).filter((x) => x.cnt > 0).sort((a, b) => b.cnt - a.cnt);

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 space-y-4">
      <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-[var(--color-primary)]" />
        تحليل إحصائي — {total} سجل
      </h3>
      <div className="flex gap-3">
        {[{ label: "👦 ذكر", val: male, c: "bg-blue-50 text-blue-700" }, { label: "👧 أنثى", val: female, c: "bg-pink-50 text-pink-600" }].map((g) => (
          <div key={g.label} className={`flex-1 rounded-xl p-3 text-center ${g.c}`}>
            <p className="text-xl font-black">{g.val}</p>
            <p className="text-xs font-bold">{g.label}</p>
            <p className="text-xs opacity-60">{total > 0 ? Math.round((g.val / total) * 100) : 0}%</p>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {statusStats.map(({ s, cfg, cnt }) => (
          <div key={s} className="flex items-center gap-2">
            <span className="text-sm w-5 text-center">{cfg.emoji}</span>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${cfg.bg} rounded-full`} style={{ width: `${(cnt / total) * 100}%` }} />
            </div>
            <div className="flex items-center gap-1 min-w-[80px] justify-end">
              <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
              <span className="text-xs text-gray-400 font-bold">{cnt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// لوحة التحليل المتقدم (Analytics Dashboard)
// ──────────────────────────────────────────────────────────

function MiniSparkline({ values, color = "#10b981" }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const W = 80; const H = 28;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - (v / max) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={parseFloat(pts.split(" ").at(-1)!.split(",")[0])} cy={parseFloat(pts.split(" ").at(-1)!.split(",")[1])} r="3" fill={color} />
    </svg>
  );
}

function AnalyticsDashboard({ all, year }: { all: PreRegistration[]; year: number }) {
  const yearRegs = useMemo(() => all.filter(r => new Date(r.requestedAt).getFullYear() === year), [all, year]);

  const total = yearRegs.length;
  const joined = yearRegs.filter(r => r.status === "تم الإنضمام").length;
  const rejected = yearRegs.filter(r => r.status === "مرفوض").length;
  const pending = yearRegs.filter(r => ["مرشح", "تم الإتصال", "مؤجل"].includes(r.status)).length;
  const acceptanceRate = total > 0 ? Math.round((joined / total) * 100) : 0;
  const dropRate = total > 0 ? Math.round(((rejected) / total) * 100) : 0;

  // بيانات شهرية
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      label: ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"][i].slice(0,3),
      total: 0, joined: 0, rejected: 0,
    }));
    yearRegs.forEach(r => {
      const m = new Date(r.requestedAt).getMonth();
      months[m].total++;
      if (r.status === "تم الإنضمام") months[m].joined++;
      if (r.status === "مرفوض") months[m].rejected++;
    });
    return months;
  }, [yearRegs]);

  const maxMonth = Math.max(...monthlyData.map(m => m.total), 1);
  const activeMonths = monthlyData.filter(m => m.total > 0);
  const sparkValues = monthlyData.map(m => m.total);

  // توزيع المستويات
  const levelGroups = useMemo(() => {
    const map: Record<string, number> = {};
    yearRegs.forEach(r => {
      const key = r.educationalLevel || "غير محدد";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [yearRegs]);

  // توزيع الجنس
  const male = yearRegs.filter(r => r.gender === "ذكر").length;
  const female = yearRegs.filter(r => r.gender === "أنثى").length;

  const PIPELINE_STEPS: { key: PreRegistrationStatus; label: string; color: string }[] = [
    { key: "مرشح",        label: "مرشح",      color: "#7c3aed" },
    { key: "تم الإتصال",  label: "تم الاتصال",color: "#2563eb" },
    { key: "مؤجل",        label: "مؤجل",      color: "#d97706" },
    { key: "تم الإنضمام", label: "انضم",       color: "#059669" },
    { key: "مرفوض",       label: "مرفوض",     color: "#dc2626" },
  ];

  if (total === 0) return (
    <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-8 text-center">
      <Activity className="w-10 h-10 text-gray-200 mx-auto mb-2" />
      <p className="text-gray-400 font-medium">لا توجد بيانات لعام {year}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "إجمالي المرشحين",  value: total,          icon: Users,      color: "from-slate-500 to-slate-700",   sub: `${year}` },
          { label: "معدل القبول",       value: `${acceptanceRate}%`, icon: Award, color: "from-emerald-500 to-green-600", sub: `${joined} انضم` },
          { label: "قيد المتابعة",     value: pending,        icon: Calendar,   color: "from-amber-500 to-orange-500",  sub: "مرشح+اتصال+مؤجل" },
          { label: "نسبة الانسحاب",    value: `${dropRate}%`, icon: TrendingDown,color: "from-red-500 to-rose-600",     sub: `${rejected} مرفوض` },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br ${color} opacity-5 -translate-y-6 translate-x-6`} />
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2 shadow-sm`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-xl font-black text-gray-900 dark:text-white" style={{ fontFamily: "var(--font-headline)" }}>{value}</p>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* رسم بياني شهري + pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* رسم شهري */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[var(--color-primary)]" />
              <h3 className="text-sm font-black text-gray-800 dark:text-white">التسجيلات الشهرية</h3>
            </div>
            <div className="flex items-center gap-3">
              {activeMonths.length >= 2 && <MiniSparkline values={sparkValues} color="var(--color-primary)" />}
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--color-primary)] inline-block" />إجمالي</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />انضم</span>
              </div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-28">
            {monthlyData.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex flex-col justify-end gap-0.5" style={{ height: 80 }}>
                  {m.total > 0 && (
                    <div className="relative w-full">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.round((m.total / maxMonth) * 72)}px` }}
                        transition={{ delay: i * 0.04, duration: 0.4 }}
                        className="w-full bg-[var(--color-primary)] rounded-t-md opacity-80 relative"
                      >
                        {m.joined > 0 && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.round((m.joined / m.total) * 100)}%` }}
                            transition={{ delay: i * 0.04 + 0.3, duration: 0.3 }}
                            className="absolute bottom-0 left-0 right-0 bg-emerald-400 rounded-t-md"
                          />
                        )}
                      </motion.div>
                    </div>
                  )}
                  {m.total === 0 && <div className="w-full" style={{ height: 4, background: 'rgba(0,0,0,0.05)', borderRadius: 2 }} />}
                </div>
                <span className="text-[9px] font-bold text-gray-400">{m.label}</span>
                {m.total > 0 && <span className="text-[9px] font-black text-gray-600">{m.total}</span>}
              </div>
            ))}
          </div>
        </motion.div>

        {/* توزيع الجنس + القبول */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="text-sm font-black text-gray-800 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-pink-500" /> توزيع المرشحين
          </h3>
          {/* الجنس */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">الجنس</p>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
              <motion.div initial={{ width: 0 }} animate={{ width: `${total > 0 ? (male/total)*100 : 50}%` }}
                transition={{ duration: 0.6 }} className="bg-blue-400 rounded-r-full" />
              <motion.div initial={{ width: 0 }} animate={{ width: `${total > 0 ? (female/total)*100 : 50}%` }}
                transition={{ duration: 0.6 }} className="bg-pink-400 rounded-l-full" />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] font-bold text-blue-600">👦 {male} ذكر ({total>0?Math.round(male/total*100):0}%)</span>
              <span className="text-[10px] font-bold text-pink-500">👧 {female} أنثى ({total>0?Math.round(female/total*100):0}%)</span>
            </div>
          </div>
          {/* pipeline */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Pipeline القبول</p>
            <div className="space-y-1.5">
              {PIPELINE_STEPS.map(step => {
                const cnt = yearRegs.filter(r => r.status === step.key).length;
                const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
                return (
                  <div key={step.key} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 w-16 shrink-0 truncate">{step.label}</span>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full" style={{ background: step.color }} />
                    </div>
                    <span className="text-[10px] font-black w-6 text-left" style={{ color: step.color }}>{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* توزيع المستويات الدراسية */}
      {levelGroups.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5">
          <h3 className="text-sm font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" /> توزيع المستويات الدراسية
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {levelGroups.map(([level, cnt]) => {
              const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
              return (
                <div key={level} className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-3 text-center">
                  <p className="text-lg font-black text-indigo-700 dark:text-indigo-300">{cnt}</p>
                  <p className="text-[10px] font-bold text-indigo-500 truncate">{level}</p>
                  <p className="text-[10px] text-indigo-300">{pct}%</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Pipeline / Kanban View
// ──────────────────────────────────────────────────────────
const PIPELINE_COLUMNS: { key: PreRegistrationStatus; label: string; color: string; bg: string; border: string }[] = [
  { key: "مرشح",         label: "⭐ مرشح",       color: "text-purple-700", bg: "bg-purple-50 dark:bg-purple-500/10",   border: "border-purple-200 dark:border-purple-500/30" },
  { key: "تم الإتصال",   label: "📞 تم الاتصال", color: "text-blue-700",   bg: "bg-blue-50 dark:bg-blue-500/10",     border: "border-blue-200 dark:border-blue-500/30"   },
  { key: "مؤجل",         label: "⏰ مؤجل",        color: "text-amber-700",  bg: "bg-amber-50 dark:bg-amber-500/10",   border: "border-amber-200 dark:border-amber-500/30" },
  { key: "تم الإنضمام",  label: "✅ انضم",        color: "text-emerald-700",bg: "bg-emerald-50 dark:bg-emerald-500/10",border: "border-emerald-200 dark:border-emerald-500/30"},
  { key: "مرفوض",        label: "❌ مرفوض",       color: "text-red-600",    bg: "bg-red-50 dark:bg-red-500/10",       border: "border-red-200 dark:border-red-500/30"     },
];

function PipelineCard({ reg, onStatusModal, onEditModal, updating }: {
  reg: PreRegistration;
  onStatusModal: (r: PreRegistration) => void;
  onEditModal: (r: PreRegistration) => void;
  updating: string | null;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-black ${
          reg.gender === "أنثى" ? "bg-gradient-to-br from-pink-400 to-rose-500" : "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]"
        }`}>{reg.fullName[0]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-gray-800 dark:text-white truncate">{reg.fullName}</p>
          <p className="text-[10px] text-gray-400">{reg.gender} {reg.educationalLevel ? `· ${reg.educationalLevel}` : ""}</p>
        </div>
      </div>
      {reg.phone1 && (
        <p className="text-[10px] text-gray-400 mb-2 font-mono" dir="ltr">{reg.phone1}</p>
      )}
      {reg.notes && (
        <p className="text-[10px] text-gray-500 bg-gray-50 dark:bg-white/5 rounded-lg px-2 py-1.5 mb-2 line-clamp-2">💬 {reg.notes}</p>
      )}
      <p className="text-[10px] text-gray-300 dark:text-gray-600 mb-2">📅 {new Date(reg.requestedAt).toLocaleDateString("ar-DZ")}</p>
      <div className="flex gap-1">
        <button onClick={() => onStatusModal(reg)} disabled={updating === reg.id}
          className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors">
          {updating === reg.id ? "..." : "تغيير ←"}
        </button>
        <button onClick={() => onEditModal(reg)}
          className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 hover:bg-indigo-100 transition-colors">
          تعديل
        </button>
        <a href={`https://wa.me/${reg.phone1.replace(/\s/g, "").replace(/^0/, "213")}`} target="_blank" rel="noreferrer"
          className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-green-50 dark:bg-green-500/10 text-green-600 hover:bg-green-100 transition-colors text-center">
          واتساب
        </a>
      </div>
    </motion.div>
  );
}

function PipelineView({ items, onStatusModal, onEditModal, updating }: {
  items: PreRegistration[];
  onStatusModal: (r: PreRegistration) => void;
  onEditModal: (r: PreRegistration) => void;
  updating: string | null;
}) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {PIPELINE_COLUMNS.map(col => {
          const colItems = items.filter(r => r.status === col.key);
          return (
            <div key={col.key} className="w-56 shrink-0">
              {/* رأس العمود */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-2 border ${col.bg} ${col.border}`}>
                <p className={`text-xs font-black ${col.color}`}>{col.label}</p>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-white/60 ${col.color}`}>{colItems.length}</span>
              </div>
              {/* البطاقات */}
              <div className="space-y-2">
                <AnimatePresence>
                  {colItems.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-4 text-center">
                      <p className="text-[10px] text-gray-300 dark:text-gray-600">لا يوجد</p>
                    </div>
                  ) : (
                    colItems.map(reg => (
                      <PipelineCard key={reg.id} reg={reg} onStatusModal={onStatusModal} onEditModal={onEditModal} updating={updating} />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}

        {/* عمود "مدرسة أخرى" + "مكرر" + "لم يرد" */}
        {(["إنضم لمدرسة أخرى", "مكرر", "لم يرد"] as PreRegistrationStatus[]).map(key => {
          const colItems = items.filter(r => r.status === key);
          if (colItems.length === 0) return null;
          const cfg = STATUS_CFG[key];
          return (
            <div key={key} className="w-56 shrink-0">
              <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-2 border ${cfg.bg} ${cfg.border}`}>
                <p className={`text-xs font-black ${cfg.color}`}>{cfg.emoji} {cfg.label}</p>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-white/60 ${cfg.color}`}>{colItems.length}</span>
              </div>
              <div className="space-y-2">
                {colItems.map(reg => (
                  <PipelineCard key={reg.id} reg={reg} onStatusModal={onStatusModal} onEditModal={onEditModal} updating={updating} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// نموذج تسجيل/تعديل مشترك
// ──────────────────────────────────────────────────────────
interface RegFormData {
  fullName: string; gender: "ذكر" | "أنثى"; birthDate: string;
  educationalLevel: string; guardianName: string; phone1: string;
  phone2: string; notes: string; photoURL: string; status: PreRegistrationStatus;
}

function RegFormFields({ form, onChange, isEdit }: {
  form: RegFormData;
  onChange: (k: keyof RegFormData, v: string) => void;
  isEdit?: boolean;
}) {
  return (
    <div className="space-y-5">
      {/* اسم + جنس */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="label-xs">الاسم الكامل *</label>
          <input value={form.fullName} onChange={(e) => onChange("fullName", e.target.value)}
            className="input-field text-sm mt-1.5" placeholder="الاسم الكامل للطالب" />
        </div>
        <div>
          <label className="label-xs">الجنس</label>
          <div className="flex gap-2 mt-1.5">
            {(["ذكر", "أنثى"] as const).map((g) => (
              <button key={g} type="button" onClick={() => onChange("gender", g)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition-all ${
                  form.gender === g ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "border-gray-200 text-gray-500 bg-white hover:border-gray-300"
                }`}>{g === "ذكر" ? "👦 ذكر" : "👧 أنثى"}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ولي الأمر + هواتف */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label-xs">ولي الأمر</label>
          <input value={form.guardianName} onChange={(e) => onChange("guardianName", e.target.value)}
            className="input-field text-sm mt-1.5" placeholder="اسم الولي" />
        </div>
        <div>
          <label className="label-xs">هاتف 1 *</label>
          <input value={form.phone1} onChange={(e) => onChange("phone1", e.target.value)}
            className="input-field text-sm mt-1.5" placeholder="0555..." dir="ltr" />
        </div>
        <div>
          <label className="label-xs">هاتف 2</label>
          <input value={form.phone2} onChange={(e) => onChange("phone2", e.target.value)}
            className="input-field text-sm mt-1.5" placeholder="0555..." dir="ltr" />
        </div>
      </div>

      {/* تاريخ الميلاد */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label-xs">تاريخ الميلاد</label>
          <input type="date" value={form.birthDate} onChange={(e) => onChange("birthDate", e.target.value)}
            className="input-field text-sm mt-1.5 w-full" />
        </div>
        <div>
          <label className="label-xs">أو أدخل العمر (يُحسب التاريخ تلقائياً)</label>
          <input type="number" placeholder="مثال: 10" min="4" max="80"
            onChange={(e) => {
              const age = parseInt(e.target.value);
              if (age > 0) {
                const year = new Date().getFullYear() - age;
                onChange("birthDate", `${year}-01-01`);
              }
            }}
            className="input-field text-sm mt-1.5 w-full" />
        </div>
      </div>

      {/* المستوى الدراسي */}
      <div>
        <label className="label-xs mb-2 block">المستوى الدراسي</label>
        <LevelPicker value={form.educationalLevel} onChange={(v) => onChange("educationalLevel", v)} />
      </div>

      {/* الحالة */}
      <div>
        <label className="label-xs mb-2 block">الحالة</label>
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map((s) => {
            const cfg = STATUS_CFG[s];
            return (
              <button key={s} type="button" onClick={() => onChange("status", s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${
                  form.status === s ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-sm` : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}>{cfg.emoji} {cfg.label}</button>
            );
          })}
        </div>
      </div>

      {/* ملاحظات */}
      <div>
        <label className="label-xs">ملاحظات / سبب الترشيح</label>
        <textarea value={form.notes} onChange={(e) => onChange("notes", e.target.value)} rows={3}
          placeholder="اكتب هنا..."
          className="w-full mt-1.5 resize-none border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 transition-colors" />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Modal تسجيل جديد
// ──────────────────────────────────────────────────────────
function NewRegModal({ schoolId, onSave, onClose }: {
  schoolId: string; onSave: (r: PreRegistration) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<RegFormData>({
    fullName: "", gender: "ذكر", birthDate: "", educationalLevel: "1 ابتدائي",
    guardianName: "", phone1: "", phone2: "", notes: "", photoURL: "", status: "مرشح",
  });
  const [saving, setSaving] = useState(false);
  const up = (k: keyof RegFormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.phone1.trim()) return;
    setSaving(true);
    const reg = await createRegistration({
      schoolId, fullName: form.fullName.trim(), gender: form.gender,
      birthDate: form.birthDate, educationalLevel: form.educationalLevel || undefined,
      guardianName: form.guardianName || undefined, phone1: form.phone1.trim(),
      phone2: form.phone2 || undefined, notes: form.notes || undefined,
      photoURL: form.photoURL || undefined, status: form.status,
    });
    onSave(reg); setSaving(false); onClose();
  };

  const iconEl = (
    <div className="relative">
      <PhotoPicker currentPhoto={form.photoURL} displayName={form.fullName || "ط"} size="md"
        onPhotoChange={(url) => setForm({ ...form, photoURL: url ?? "" })} />
    </div>
  );

  const footer = (
    <div className="flex gap-3 w-full">
      <button onClick={onClose} className="btn-secondary flex-1 py-3 justify-center text-sm">إلغاء</button>
      <button onClick={handleSave} disabled={!form.fullName.trim() || !form.phone1.trim() || saving}
        className="btn-primary flex-1 py-3 justify-center text-sm disabled:opacity-40">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> حفظ...</> : <><Send className="w-4 h-4" /> تسجيل المرشح</>}
      </button>
    </div>
  );

  return (
    <Modal
      open={true}
      onClose={onClose}
      size="lg"
      title="تسجيل مرشح جديد"
      description="انقر الصورة لإضافتها"
      icon={iconEl}
      footer={footer}
    >
      <div className="py-2">
        <RegFormFields form={form} onChange={up} />
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────
// Modal تعديل بيانات المرشح
// ──────────────────────────────────────────────────────────
function EditRegModal({ reg, onSave, onClose }: {
  reg: PreRegistration; onSave: (updated: PreRegistration) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<RegFormData>({
    fullName: reg.fullName, gender: (reg.gender as "ذكر" | "أنثى") || "ذكر",
    birthDate: reg.birthDate ?? "", educationalLevel: reg.educationalLevel ?? "",
    guardianName: reg.guardianName ?? "", phone1: reg.phone1,
    phone2: reg.phone2 ?? "", notes: reg.notes ?? "",
    photoURL: reg.photoURL ?? "", status: reg.status,
  });
  const [saving, setSaving] = useState(false);
  const up = (k: keyof RegFormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.phone1.trim()) return;
    setSaving(true);
    try {
      const updated = await updateRegistrationData(reg.id, {
        fullName: form.fullName.trim(), gender: form.gender,
        birthDate: form.birthDate || undefined, educationalLevel: form.educationalLevel || undefined,
        guardianName: form.guardianName || undefined, phone1: form.phone1.trim(),
        phone2: form.phone2 || undefined, notes: form.notes || undefined,
        photoURL: form.photoURL || undefined, status: form.status,
      });
      onSave(updated);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  const iconEl = (
    <div className="relative">
      <PhotoPicker currentPhoto={form.photoURL} displayName={form.fullName || "ط"} size="md"
        onPhotoChange={(url) => setForm({ ...form, photoURL: url ?? "" })} />
    </div>
  );

  const footer = (
    <div className="flex gap-3 w-full">
      <button onClick={onClose} className="btn-secondary flex-1 py-3 justify-center text-sm">إلغاء</button>
      <button onClick={handleSave} disabled={!form.fullName.trim() || !form.phone1.trim() || saving}
        className="flex-1 py-3 justify-center text-sm font-black rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white flex items-center gap-2 transition-colors disabled:opacity-40">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> حفظ...</> : <><Save className="w-4 h-4" /> حفظ التعديلات</>}
      </button>
    </div>
  );

  return (
    <Modal
      open={true}
      onClose={onClose}
      size="lg"
      title="تعديل بيانات المرشح"
      description={reg.fullName}
      icon={iconEl}
      footer={footer}
    >
      <div className="py-2">
        <RegFormFields form={form} onChange={up} isEdit />
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────
// Modal تغيير الحالة (مع نموذج الإلحاق عند الانضمام)
// ──────────────────────────────────────────────────────────
const MEMORIZATION_AMOUNTS: MemorizationAmount[] = ["ثمن", "ربع", "نصف", "صفحة", "أكثر"];
const SUBSCRIPTION_TIERS: SubscriptionTier[] = ["فئة الأصاغر", "فئة الأكابر"];

function StatusModal({ reg, schoolId, onSave, onClose }: {
  reg: PreRegistration;
  schoolId: string;
  onSave: (id: string, status: PreRegistrationStatus, enrollData?: EnrollData) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<PreRegistrationStatus>(reg.status);
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [enroll, setEnroll] = useState({
    teacherId: "",
    teacherName: "",
    groupName: "",
    subscriptionTier: "فئة الأصاغر" as SubscriptionTier,
    dailyMemorizationAmount: "ربع" as MemorizationAmount,
  });
  const [saving, setSaving] = useState(false);
  const [existingGroups, setExistingGroups] = useState<string[]>([]);

  useEffect(() => {
    const db = getDB();
    db.users.where("schoolId").equals(schoolId).and(u => u.role === "teacher").toArray().then(setTeachers);
    db.students.where("schoolId").equals(schoolId).toArray().then(studs => {
      const groups = [...new Set(studs.map(s => s.groupName))].filter(Boolean);
      setExistingGroups(groups);
    });
  }, [schoolId]);

  const isJoining = selected === "تم الإنضمام";
  const enrollValid = !isJoining || (enroll.teacherId.trim() && enroll.groupName.trim());

  const handleSave = async () => {
    if (!enrollValid) return;
    setSaving(true);
    if (isJoining) {
      onSave(reg.id, selected, enroll);
    } else {
      onSave(reg.id, selected);
    }
    setSaving(false);
    onClose();
  };

  const footer = (
    <div className="flex gap-3 w-full">
      <button onClick={onClose} className="btn-secondary flex-1 py-2.5 justify-center text-sm">إلغاء</button>
      <button onClick={handleSave} disabled={!enrollValid || saving}
        className="btn-primary flex-1 py-2.5 justify-center text-sm disabled:opacity-40">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        {isJoining ? "إلحاق الطالب بالفوج" : "حفظ الحالة"}
      </button>
    </div>
  );

  return (
    <Modal open={true} onClose={onClose} size={isJoining ? "md" : "sm"}
      title="تغيير الحالة" description={reg.fullName} footer={footer}>
      <div className="grid grid-cols-2 gap-3 py-2">
        {ALL_STATUSES.map((s) => {
          const cfg = STATUS_CFG[s]; const active = selected === s;
          return (
            <button key={s} onClick={() => setSelected(s)}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-right ${
                active ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm` : "bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-200"
              }`}>
              <span className="text-xl">{cfg.emoji}</span>
              <p className="text-sm font-black">{cfg.label}</p>
              {active && <div className="mr-auto w-3 h-3 rounded-full bg-current opacity-60 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* نموذج الإلحاق الإجباري عند الانضمام */}
      {isJoining && (
        <div className="mt-4 border-t border-gray-100 pt-4 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-sm font-black text-gray-800">تحديد فوج الطالب <span className="text-red-500">*</span></p>
          </div>

          {/* الشيخ والفوج */}
          <div className="space-y-1">
            <label className="text-xs font-black text-gray-500 uppercase tracking-wider">المعلم والفوج القرآني *</label>
            <select
              value={enroll.teacherId}
              onChange={e => {
                const tid = e.target.value;
                const t = teachers.find(x => x.id === tid);
                setEnroll(p => ({ 
                  ...p, 
                  teacherId: tid, 
                  teacherName: t?.displayName || "",
                  groupName: t?.groupName || "بدون فوج" 
                }));
              }}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[var(--color-primary)]/60"
            >
              <option value="">اختر المعلم (الفوج)...</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.displayName} ({t.groupName || "بدون فوج"})
                </option>
              ))}
            </select>
            {(!enroll.teacherId || !enroll.groupName) && <p className="text-[10px] text-red-500 font-bold">المعلم والفوج إجباري لإلحاق الطالب</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* فئة الاشتراك */}
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-500">فئة الاشتراك</label>
              <div className="flex gap-1.5">
                {SUBSCRIPTION_TIERS.map(t => (
                  <button key={t} type="button" onClick={() => setEnroll(p => ({ ...p, subscriptionTier: t }))}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-black border transition-all ${
                      enroll.subscriptionTier === t ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-white border-gray-200 text-gray-600"
                    }`}>{t}
                  </button>
                ))}
              </div>
            </div>

            {/* المقدار اليومي */}
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-500">المقدار اليومي</label>
              <div className="flex flex-wrap gap-1">
                {MEMORIZATION_AMOUNTS.map(a => (
                  <button key={a} type="button" onClick={() => setEnroll(p => ({ ...p, dailyMemorizationAmount: a }))}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black border transition-all ${
                      enroll.dailyMemorizationAmount === a ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-white border-gray-200 text-gray-600"
                    }`}>{a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export interface EnrollData {
  teacherId: string;
  teacherName: string;
  groupName: string;
  subscriptionTier: SubscriptionTier;
  dailyMemorizationAmount: MemorizationAmount;
}

// ──────────────────────────────────────────────────────────
// Modal تعديل جماعي
// ──────────────────────────────────────────────────────────
function BulkStatusModal({ count, onSave, onClose }: {
  count: number; onSave: (s: PreRegistrationStatus) => void; onClose: () => void;
}) {
  const [selected, setSelected] = useState<PreRegistrationStatus>("مرشح");
  const footer = (
    <div className="flex gap-3 w-full">
      <button onClick={onClose} className="btn-secondary flex-1 py-2.5 justify-center text-sm">إلغاء</button>
      <button onClick={() => { onSave(selected); onClose(); }} className="btn-primary flex-1 py-2.5 justify-center text-sm">
        <Settings2 className="w-4 h-4" /> تطبيق
      </button>
    </div>
  );

  return (
    <Modal
      open={true}
      onClose={onClose}
      size="sm"
      title="تعديل جماعي"
      description={`تغيير حالة ${count} مرشح`}
      footer={footer}
    >
      <div className="grid grid-cols-2 gap-2 py-2">
        {ALL_STATUSES.map((s) => {
          const cfg = STATUS_CFG[s]; const active = selected === s;
          return (
            <button key={s} onClick={() => setSelected(s)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 text-right transition-all ${
                active ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:border-gray-200 dark:hover:border-gray-600"
              }`}>
              <span>{cfg.emoji}</span>
              <span className="text-xs font-black">{cfg.label}</span>
              {active && <div className="mr-auto w-2.5 h-2.5 rounded-full bg-current opacity-60" />}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────
// عرض البطاقات
// ──────────────────────────────────────────────────────────
function CardsView({ items, updating, onStatusModal, onEditModal, onViewModal, selectedIds, onSelectId }: {
  items: PreRegistration[]; updating: string | null;
  onStatusModal: (r: PreRegistration) => void;
  onEditModal: (r: PreRegistration) => void;
  onViewModal: (r: PreRegistration) => void;
  selectedIds: string[]; onSelectId: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((reg) => {
        const cfg = STATUS_CFG[reg.status];
        const isSel = selectedIds.includes(reg.id);
        return (
          <motion.div key={reg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-2xl border-2 transition-all ${isSel ? "border-[var(--color-primary)] shadow-md" : "border-[var(--color-border)] hover:shadow-md"}`}>
            <div className="p-5 flex items-start gap-4">
              {/* checkbox */}
              <button onClick={() => onSelectId(reg.id)}
                className={`mt-1 w-5 h-5 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all ${isSel ? "bg-[var(--color-primary)] border-[var(--color-primary)]" : "border-gray-300 hover:border-[var(--color-primary)]"}`}>
                {isSel && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </button>
              {/* أفاتار */}
              <div onClick={() => onViewModal(reg)} className={`w-12 h-12 rounded-2xl shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ${!reg.photoURL ? (reg.gender === "أنثى" ? "bg-gradient-to-br from-pink-400 to-rose-500" : "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]") : ""}`}>
                {reg.photoURL ? <img src={reg.photoURL} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white font-black text-lg">{reg.fullName[0]}</div>}
              </div>
              {/* بيانات */}
              <div className="flex-1 min-w-0">
                <div onClick={() => onViewModal(reg)} className="flex items-center gap-2 flex-wrap mb-1 cursor-pointer hover:text-[var(--color-primary)] transition-colors inline-flex">
                  <p className="text-base font-black text-gray-800">{reg.fullName}</p>
                  <span className="text-xs text-gray-400">{reg.gender}</span>
                  {reg.educationalLevel && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{reg.educationalLevel}</span>}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                  <a href={`tel:${reg.phone1}`} className="flex items-center gap-1 hover:text-[var(--color-primary)] font-bold" dir="ltr">📞 {reg.phone1}</a>
                  {reg.guardianName && <span>👤 {reg.guardianName}</span>}
                  <span className="text-gray-300">{new Date(reg.requestedAt).toLocaleDateString("ar-DZ")}</span>
                </div>
                {reg.notes && <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">{reg.notes}</p>}
              </div>
              {/* إجراءات */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-xs font-black px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${cfg.bg} ${cfg.color} ${cfg.border}`}>{cfg.emoji} {cfg.label}</span>
                {/* تعديل البيانات */}
                <button onClick={() => onEditModal(reg)}
                  className="text-xs border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-xl px-3 py-1.5 hover:bg-indigo-100 transition-all font-bold flex items-center gap-1.5">
                  <Edit3 className="w-3 h-3" /> تعديل البيانات
                </button>
                {/* تغيير الحالة */}
                <button onClick={() => onStatusModal(reg)} disabled={updating === reg.id}
                  className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-500 font-bold flex items-center gap-1.5 disabled:opacity-50">
                  {updating === reg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Settings2 className="w-3 h-3" />}
                  تغيير الحالة
                </button>
                <a href={`https://wa.me/${reg.phone1.replace(/\s/g, "").replace(/^0/, "213")}`}
                  target="_blank" rel="noreferrer"
                  className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-xl px-3 py-1.5 hover:bg-green-100 transition-all font-bold flex items-center gap-1.5">
                  واتساب 💬
                </a>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// عرض الجدول
// ──────────────────────────────────────────────────────────
type SortKey = "fullName" | "phone1" | "educationalLevel" | "status" | "requestedAt" | "guardianName";

function TableView({ items, updating, onStatusModal, onEditModal, onViewModal, selectedIds, onSelectId, onSelectAll }: {
  items: PreRegistration[]; updating: string | null;
  onStatusModal: (r: PreRegistration) => void;
  onEditModal: (r: PreRegistration) => void;
  onViewModal: (r: PreRegistration) => void;
  selectedIds: string[]; onSelectId: (id: string) => void; onSelectAll: () => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("requestedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const cmp = String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), "ar");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  };

  const allSel = items.length > 0 && items.every((r) => selectedIds.includes(r.id));

  const SortTh = ({ k, label }: { k: SortKey; label: string }) => (
    <th onClick={() => toggleSort(k)} className="px-4 py-3 text-right text-xs font-black text-gray-500 cursor-pointer hover:text-gray-800 transition-colors whitespace-nowrap select-none">
      <div className="flex items-center gap-1 justify-end">
        {label} <ArrowUpDown className={`w-3 h-3 ${sortKey === k ? "text-[var(--color-primary)]" : "opacity-30"}`} />
      </div>
    </th>
  );

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="px-4 py-3 w-10">
                <button onClick={onSelectAll}
                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${allSel ? "bg-[var(--color-primary)] border-[var(--color-primary)]" : "border-gray-300 hover:border-[var(--color-primary)]"}`}>
                  {allSel && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </button>
              </th>
              <th className="px-4 py-3 text-right text-xs font-black text-gray-500 w-8">#</th>
              <th className="px-4 py-3 text-right text-xs font-black text-gray-500">الصورة</th>
              <SortTh k="fullName" label="الاسم الكامل" />
              <SortTh k="phone1" label="الهاتف" />
              <SortTh k="guardianName" label="ولي الأمر" />
              <SortTh k="educationalLevel" label="المستوى" />
              <SortTh k="status" label="الحالة" />
              <SortTh k="requestedAt" label="تاريخ التسجيل" />
              <th className="px-4 py-3 text-center text-xs font-black text-gray-500">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((reg, idx) => {
              const cfg = STATUS_CFG[reg.status];
              const isSel = selectedIds.includes(reg.id);
              return (
                <tr key={reg.id}
                  className={`border-b border-gray-50 last:border-0 transition-colors ${cfg.rowBg} ${isSel ? "ring-1 ring-inset ring-[var(--color-primary)]/30" : ""}`}>
                  <td className="px-4 py-3">
                    <button onClick={() => onSelectId(reg.id)}
                      className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSel ? "bg-[var(--color-primary)] border-[var(--color-primary)]" : "border-gray-300 hover:border-[var(--color-primary)]"}`}>
                      {isSel && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-bold">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div onClick={() => onViewModal(reg)} className={`w-9 h-9 rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ${!reg.photoURL ? (reg.gender === "أنثى" ? "bg-gradient-to-br from-pink-400 to-rose-500" : "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]") : ""}`}>
                      {reg.photoURL ? <img src={reg.photoURL} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-white font-black text-sm">{reg.fullName[0]}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => onViewModal(reg)}>
                    <p className="text-sm font-black text-gray-800 hover:text-[var(--color-primary)] transition-colors">{reg.fullName}</p>
                    <p className="text-xs text-gray-400">{reg.gender}</p>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`tel:${reg.phone1}`} className="text-xs font-bold text-gray-700 hover:text-[var(--color-primary)] transition-colors" dir="ltr">{reg.phone1}</a>
                    {reg.phone2 && <p className="text-xs text-gray-400 mt-0.5" dir="ltr">{reg.phone2}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{reg.guardianName ?? "—"}</td>
                  <td className="px-4 py-3">
                    {reg.educationalLevel
                      ? <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{reg.educationalLevel}</span>
                      : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-xl border inline-flex items-center gap-1 ${cfg.bg} ${cfg.color} ${cfg.border}`}>{cfg.emoji} {cfg.label}</span>
                    {reg.notes && <p className="text-[10px] text-gray-400 mt-1 max-w-[120px] truncate" title={reg.notes}>{reg.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(reg.requestedAt).toLocaleDateString("ar-DZ")}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {/* اتصال */}
                      <a href={`tel:${reg.phone1}`} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors" title="اتصال">
                        <Phone className="w-3.5 h-3.5" /></a>
                      {/* واتساب */}
                      <a href={`https://wa.me/${reg.phone1.replace(/\s/g, "").replace(/^0/, "213")}`} target="_blank" rel="noreferrer"
                        className="w-8 h-8 rounded-xl bg-green-50 hover:bg-green-100 flex items-center justify-center text-green-600 transition-colors" title="واتساب">
                        <MessageSquare className="w-3.5 h-3.5" /></a>
                      {/* تعديل البيانات */}
                      <button onClick={() => onEditModal(reg)}
                        className="w-8 h-8 rounded-xl bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-indigo-600 transition-colors" title="تعديل البيانات">
                        <Edit3 className="w-3.5 h-3.5" /></button>
                      {/* تغيير الحالة */}
                      <button onClick={() => onStatusModal(reg)} disabled={updating === reg.id}
                        className="w-8 h-8 rounded-xl bg-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] transition-colors disabled:opacity-40" title="تغيير الحالة">
                        {updating === reg.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Settings2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* footer */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-gray-400 font-medium">{items.length} سجل</p>
        <div className="flex flex-wrap items-center gap-2">
          {ALL_STATUSES.map((s) => {
            const cnt = items.filter((r) => r.status === s).length;
            if (!cnt) return null;
            const cfg = STATUS_CFG[s];
            return <span key={s} className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${cfg.bg} ${cfg.color}`}>{cfg.emoji} {cnt}</span>;
          })}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Pagination
// ──────────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, total, onChange }: {
  currentPage: number; totalPages: number; total: number; onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const from = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const to = Math.min(currentPage * ITEMS_PER_PAGE, total);
  return (
    <div className="flex items-center justify-between bg-white rounded-2xl border border-[var(--color-border)] px-5 py-3">
      <p className="text-xs text-gray-500 font-medium">عرض {from}–{to} من أصل {total}</p>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onChange(1)} disabled={currentPage === 1}
          className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 text-xs font-bold">«</button>
        <button onClick={() => onChange(currentPage - 1)} disabled={currentPage === 1}
          className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30">
          <ChevronRight className="w-4 h-4" /></button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let page = i + 1;
          if (totalPages > 5) {
            if (currentPage <= 3) page = i + 1;
            else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
            else page = currentPage - 2 + i;
          }
          return (
            <button key={page} onClick={() => onChange(page)}
              className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                currentPage === page ? "bg-[var(--color-primary)] text-white shadow-sm" : "border border-gray-200 text-gray-500 hover:bg-gray-100"
              }`}>{page}</button>
          );
        })}
        <button onClick={() => onChange(currentPage + 1)} disabled={currentPage === totalPages}
          className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30">
          <ChevronLeft className="w-4 h-4" /></button>
        <button onClick={() => onChange(totalPages)} disabled={currentPage === totalPages}
          className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 text-xs font-bold">»</button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Print Window helper
// ──────────────────────────────────────────────────────────
function openPrintWindow(registrations: PreRegistration[], filterLabel: string, year: number) {
  const rows = registrations.map((r, i) => {
    const cfg = STATUS_CFG[r.status];
    return `
      <tr style="border-bottom: 1px solid #eee; background: ${i % 2 === 0 ? "#fff" : "#fafafa"}">
        <td style="padding: 8px; text-align: center; color: #888; font-size: 12px">${i + 1}</td>
        <td style="padding: 8px; font-weight: 700; font-size: 13px">${r.fullName}</td>
        <td style="padding: 8px; font-size: 12px; color: #666" dir="ltr">${r.phone1}</td>
        <td style="padding: 8px; font-size: 12px; color: #666">${r.guardianName ?? "—"}</td>
        <td style="padding: 8px; font-size: 12px; color: #555">${r.educationalLevel ?? "—"}</td>
        <td style="padding: 8px; font-size: 12px">${r.gender}</td>
        <td style="padding: 8px"><span style="padding: 3px 8px; border-radius: 8px; font-size: 11px; font-weight: 700">${cfg.emoji} ${cfg.label}</span></td>
        <td style="padding: 8px; font-size: 11px; color: #888">${new Date(r.requestedAt).toLocaleDateString("ar-DZ")}</td>
        <td style="padding: 8px; font-size: 11px; color: #666; max-width: 120px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis">${r.notes ?? "—"}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>قائمة التسجيلات</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; color: #333; direction: rtl; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb; }
    h1 { font-size: 18px; font-weight: 900; margin: 0; }
    .meta { font-size: 12px; color: #888; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f8f9fa; padding: 10px 8px; text-align: right; font-weight: 700; font-size: 12px; color: #555; border-bottom: 2px solid #e5e7eb; }
    @media print { @page { size: A4 landscape; margin: 10mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>قائمة التسجيلات — ${year}</h1>
      <div class="meta">${filterLabel} · ${registrations.length} سجل · ${new Date().toLocaleDateString("ar-DZ")}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>الاسم الكامل</th><th>الهاتف</th><th>ولي الأمر</th>
        <th>المستوى</th><th>الجنس</th><th>الحالة</th><th>تاريخ التسجيل</th><th>ملاحظات</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=1100,height=700");
  if (w) { w.document.write(html); w.document.close(); }
}

// ──────────────────────────────────────────────────────────
// الصفحة الرئيسية
// ──────────────────────────────────────────────────────────
function RegistrationsPage() {
  const { user, school } = useAuth();
  const { play } = useSound();
  const [registrations, setRegistrations] = useState<PreRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [statusModal, setStatusModal] = useState<PreRegistration | null>(null);
  const [editModal, setEditModal] = useState<PreRegistration | null>(null);
  const [viewModal, setViewModal] = useState<PreRegistration | null>(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<PreRegistrationStatus | "الكل">("الكل");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [updating, setUpdating] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(false);

  const load = useCallback(async () => {
    if (!school?.id) return;
    setLoading(true);
    const db = getDB();
    const regs = await db.registrations.where("schoolId").equals(school.id).toArray();
    regs.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    setRegistrations(regs); setLoading(false);
  }, [school?.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setCurrentPage(1); setSelectedIds([]); }, [filterStatus, filterYear, search]);

  const handleStatusChange = async (id: string, status: PreRegistrationStatus, enrollData?: EnrollData) => {
    setUpdating(id);
    const reg = registrations.find(r => r.id === id);

    // إذا انضم المرشح → أنشئ حساب طالب رسمي
    if (status === "تم الإنضمام" && enrollData && reg && school?.id) {
      await createStudent({
        schoolId: school.id,
        teacherId: enrollData.teacherId,
        groupName: enrollData.groupName,
        fullName: reg.fullName,
        gender: (reg.gender as "ذكر" | "أنثى") || "ذكر",
        birthDate: reg.birthDate ?? "",
        educationalLevel: reg.educationalLevel,
        guardianName: reg.guardianName ?? "",
        phone1: reg.phone1,
        phone2: reg.phone2,
        photoURL: reg.photoURL,
        registrationDate: new Date().toISOString().split("T")[0],
        status: "نشط",
        subscriptionTier: enrollData.subscriptionTier,
        memorizedSurahsCount: 0,
        dailyMemorizationAmount: enrollData.dailyMemorizationAmount,
        notes: reg.notes,
        transferHistory: [{
          date: new Date().toISOString().split("T")[0],
          fromTeacherId: "",
          fromGroupName: "تسجيل مبدئي",
          toTeacherId: enrollData.teacherId,
          toGroupName: enrollData.groupName,
          reason: "إلحاق جديد من قائمة التسجيلات",
        }],
      });

      // حفظ بيانات الفوج في الملاحظات ليقرأها المدير لاحقاً
      let newNotes = reg.notes || "";
      const syncMsg = `\n[تنبيه النظام: أُلحِق بفضيلة الشيخ ${enrollData.teacherName} (${enrollData.groupName})]`;
      if (!newNotes.includes(`أُلحِق بفضيلة الشيخ ${enrollData.teacherName}`)) {
        newNotes += syncMsg;
      }
      await updateRegistrationData(id, { status, notes: newNotes.trim() });
    } else {
      await updateRegistrationStatus(id, status, user?.id);
    }

    setRegistrations((prev) => prev.map((r) => r.id === id ? { 
      ...r, 
      status, 
      notes: (status === "تم الإنضمام" && enrollData) 
        ? ((r.notes || "") + `\n[تنبيه النظام: أُلحِق بفضيلة الشيخ ${enrollData.teacherName} (${enrollData.groupName})]`).trim() 
        : r.notes 
    } : r));
    setUpdating(null);

    // التشغيل الصوتي
    if (status === "تم الإنضمام") {
      play("achievement"); // 🎉 احتفال الماكينة
    } else {
      play("success"); // ✅ نجاح روتيني
    }
  };

  const handleRegistrationUpdate = (updated: PreRegistration) => {
    setRegistrations((prev) => prev.map((r) => r.id === updated.id ? updated : r));
  };

  const handleBulkStatusChange = async (status: PreRegistrationStatus) => {
    for (const id of selectedIds) {
      await updateRegistrationStatus(id, status, user?.id);
    }
    setRegistrations((prev) => prev.map((r) => selectedIds.includes(r.id) ? { ...r, status } : r));
    setSelectedIds([]);
  };

  const filtered = useMemo(() => {
    return registrations.filter((r) => {
      const regYear = new Date(r.requestedAt).getFullYear();
      const matchYear = regYear === filterYear;
      const matchSearch = !search || r.fullName.includes(search) || r.phone1.includes(search);
      const matchStatus = filterStatus === "الكل" || r.status === filterStatus;
      return matchYear && matchSearch && matchStatus;
    });
  }, [registrations, search, filterStatus, filterYear]);

  const counts = useMemo(() => {
    const yearRegs = registrations.filter((r) => new Date(r.requestedAt).getFullYear() === filterYear);
    const base: Record<string, number> = { الكل: yearRegs.length };
    ALL_STATUSES.forEach((s) => { base[s] = yearRegs.filter((r) => r.status === s).length; });
    return base;
  }, [registrations, filterYear]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelectId = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };
  const handleSelectAll = () => {
    const pageIds = paginated.map((r) => r.id);
    const allSel = pageIds.every((id) => selectedIds.includes(id));
    if (allSel) setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    else setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
  };

  const stats = {
    total: counts["الكل"] ?? 0, candidate: counts["مرشح"] ?? 0,
    joined: counts["تم الإنضمام"] ?? 0,
    pending: (counts["مرشح"] ?? 0) + (counts["تم الإتصال"] ?? 0) + (counts["مؤجل"] ?? 0),
  };

  const filterLabel = filterStatus === "الكل" ? "كل الحالات" : STATUS_CFG[filterStatus]?.label;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ── رأس الصفحة ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>التسجيلات الجديدة</h1>
          <p className="text-xs text-gray-400 mt-0.5">{stats.total} مرشح · {stats.joined} انضم · {stats.pending} قيد المتابعة</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <YearPicker value={filterYear} onChange={setFilterYear} />
          {/* تبديل العرض */}
          <div className="flex items-center bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-1 gap-1">
            <button onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${viewMode === "cards" ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}>
              <LayoutGrid className="w-3.5 h-3.5" /> بطاقات
            </button>
            <button onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${viewMode === "table" ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}>
              <Table2 className="w-3.5 h-3.5" /> جدول
            </button>
            <button onClick={() => setViewMode("pipeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${viewMode === "pipeline" ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}>
              <Kanban className="w-3.5 h-3.5" /> Pipeline
            </button>
          </div>
          {/* تحليل متقدم */}
          <button onClick={() => setShowStats((s) => !s)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all ${showStats ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300"}`}>
            <BarChart3 className="w-3.5 h-3.5" /> تحليل
          </button>
          {/* نسخ رابط التسجيل */}
          {school?.id && (
            <button 
              onClick={() => {
                const url = `${window.location.origin}/join/${school.id}`;
                navigator.clipboard.writeText(url);
                play("copy"); // 🔊 صوت النسخ السريع
                alert("تم نسخ رابط التسجيل المخصص لمدرستك! انشره الآن لأولياء الأمور.");
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-all"
              title="نسخ رابط التسجيل لمشاركته"
            >
              <span className="text-lg leading-none transform -rotate-45">🔗</span> رابط التسجيل
            </button>
          )}
          
          {/* طباعة */}
          <button onClick={() => openPrintWindow(filtered, filterLabel, filterYear)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300 transition-all">
            <Printer className="w-3.5 h-3.5" /> طباعة
          </button>
          <button onClick={() => setShowNewModal(true)} className="btn-primary py-2.5 text-sm shrink-0">
            <Plus className="w-4 h-4" /> مرشح جديد
          </button>
        </div>
      </div>

      {/* ── إحصائيات رئيسية ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "إجمالي",       value: stats.total,     color: "text-gray-700",    bg: "bg-gray-50"    },
          { label: "قيد المتابعة", value: stats.pending,   color: "text-amber-700",   bg: "bg-amber-50"   },
          { label: "انضم للمدرسة", value: stats.joined,    color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "مرشح جديد",    value: stats.candidate, color: "text-purple-700",  bg: "bg-purple-50"  },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <p className={`text-2xl font-black ${color}`} style={{ fontFamily: "var(--font-headline)" }}>{value}</p>
            <p className={`text-xs font-medium ${color} opacity-70 mt-0.5`}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── لوحة التحليل المتقدم ── */}
      <AnimatePresence>
        {showStats && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <AnalyticsDashboard all={registrations} year={filterYear} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── دليل الحالات ── */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-sm text-gray-700">
        <h3 className="font-black text-indigo-900 mb-3 flex items-center gap-2">
          <span className="text-xl">💡</span> دليل حالات التسجيل
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div><strong className="text-amber-700">⏰ مؤجل: </strong>الحالة الافتراضية للطلبات المبدئية والانتظار.</div>
          <div><strong className="text-purple-700">⭐ مرشح: </strong>أولياء حريصون حضروا وتابعوا التسجيل.</div>
          <div><strong className="text-emerald-700">✅ انضم: </strong>تم قبوله رسمياً وإلحاقه بفوج للدارسة.</div>
          <div><strong className="text-blue-700">📞 تم الاتصال: </strong>تم التواصل معه، قد ينضم وقد يعتذر.</div>
          <div><strong className="text-gray-600">🏫 مدرسة أخرى: </strong>اتصلنا به ووجدناه قد انضم لمكان آخر.</div>
          <div><strong className="text-yellow-600">⚠️ مكرر: </strong>الطلب مسجل أكثر من مرة في النظام.</div>
          <div><strong className="text-red-600">❌ مرفوض: </strong>تم رفض طلب التسجيل لسبب ما.</div>
          <div><strong className="text-gray-500">📵 لم يرد: </strong>حاولنا الاتصال بالولي ولم يتم الرد.</div>
        </div>
      </div>

      {/* ── فلاتر ── */}
      <div className="space-y-3">
        <StatusFilterBar value={filterStatus} onChange={setFilterStatus} counts={counts} />
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم أو رقم الهاتف..."
            className="w-full h-10 border border-gray-200 rounded-xl pr-10 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 bg-white" />
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>{filtered.length} نتيجة {search && `لـ "${search}"`}</span>
            {selectedIds.length > 0 && <span className="text-[var(--color-primary)] font-bold">{selectedIds.length} محدد</span>}
          </div>
        )}
      </div>

      {/* ── المحتوى ── */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[var(--color-border)]">
          <UserPlus className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">{registrations.length === 0 ? "لا يوجد مرشحون بعد" : "لا توجد نتائج لهذا الفلتر"}</p>
        </div>
      ) : viewMode === "pipeline" ? (
        <PipelineView items={filtered} onStatusModal={setStatusModal} onEditModal={setEditModal} updating={updating} />
      ) : viewMode === "cards" ? (
        <CardsView items={paginated} updating={updating} onStatusModal={setStatusModal}
          onEditModal={setEditModal} onViewModal={setViewModal} selectedIds={selectedIds} onSelectId={handleSelectId} />
      ) : (
        <TableView items={paginated} updating={updating} onStatusModal={setStatusModal}
          onEditModal={setEditModal} onViewModal={setViewModal} selectedIds={selectedIds} onSelectId={handleSelectId} onSelectAll={handleSelectAll} />
      )}

      {/* ── Pagination ── */}
      <Pagination currentPage={currentPage} totalPages={totalPages} total={filtered.length} onChange={setCurrentPage} />

      {/* ── شريط التحديد الجماعي ── */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 min-w-[340px]">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[var(--color-primary)]" />
                <p className="font-black text-sm">{selectedIds.length} محدد</p>
              </div>
              <div className="flex gap-2 mr-auto">
                <button onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 transition-colors">
                  إلغاء
                </button>
                <button onClick={() => setBulkModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5" /> تعديل جماعي
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      {showNewModal && school && (
        <NewRegModal schoolId={school.id} onSave={(r) => setRegistrations((prev) => [r, ...prev])} onClose={() => setShowNewModal(false)} />
      )}
      {editModal && (
        <EditRegModal reg={editModal} onSave={handleRegistrationUpdate} onClose={() => setEditModal(null)} />
      )}
      {statusModal && school && (
        <StatusModal reg={statusModal} schoolId={school.id} onSave={handleStatusChange} onClose={() => setStatusModal(null)} />
      )}
      {bulkModal && (
        <BulkStatusModal count={selectedIds.length} onSave={handleBulkStatusChange} onClose={() => setBulkModal(false)} />
      )}
      {viewModal && (
        <ViewRegModal reg={viewModal} onClose={() => setViewModal(null)} />
      )}
    </div>
  );
}

// ── Guard wrapper (auto-generated) ──
export default function RegistrationsPagePage() {
  return (
    <SchoolGuard>
      <RegistrationsPage />
    </SchoolGuard>
  );
}
// ──────────────────────────────────────────────────────────
// Modal عرض بيانات المرشح (بطاقة معلومات)
// ──────────────────────────────────────────────────────────
function ViewRegModal({ reg, onClose }: { reg: PreRegistration; onClose: () => void }) {
  const cfg = STATUS_CFG[reg.status];
  return (
    <Modal isOpen onClose={onClose} title="بطاقة المرشح">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl overflow-hidden shadow-sm ${!reg.photoURL ? (reg.gender === "أنثى" ? "bg-gradient-to-br from-pink-400 to-rose-500" : "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]") : ""}`}>
            {reg.photoURL ? <img src={reg.photoURL} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-white font-black text-2xl">{reg.fullName[0]}</div>}
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">{reg.fullName} <span className="text-sm font-medium text-gray-400">({reg.gender})</span></h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${cfg.bg} ${cfg.color} ${cfg.border}`}>{cfg.emoji} {cfg.label}</span>
              {reg.educationalLevel && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{reg.educationalLevel}</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 block mb-1">رقم الهاتف 1</span>
            <a href={`tel:${reg.phone1}`} className="text-sm font-black text-gray-800 hover:text-[var(--color-primary)]" dir="ltr">{reg.phone1}</a>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 block mb-1">رقم الهاتف 2</span>
            <p className="text-sm font-black text-gray-800" dir="ltr">{reg.phone2 || "—"}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 block mb-1">ولي الأمر</span>
            <p className="text-sm font-black text-gray-800">{reg.guardianName || "—"}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 block mb-1">تاريخ الميلاد</span>
            <p className="text-sm font-black text-gray-800" dir="ltr">{reg.birthDate || "—"}</p>
          </div>
        </div>

        {reg.notes && (
          <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100">
            <span className="text-[10px] font-bold text-amber-600 block mb-1">ملاحظات والتفاصيل الإضافية</span>
            <p className="text-sm font-medium text-amber-900 leading-relaxed whitespace-pre-wrap">{reg.notes}</p>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
            إغلاق البطاقة
          </button>
        </div>
      </div>
    </Modal>
  );
}
