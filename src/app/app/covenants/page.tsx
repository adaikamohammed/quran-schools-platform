"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import { updateStudent } from "@/lib/storage/mutations";
import type { Student, Covenant, CovenantType, CovenantStatus, CovenantCard, AppUser } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gavel, Plus, Search, X, CheckCircle2, AlertTriangle,
  Clock, Shield, ShieldAlert, ShieldOff, User,
  ChevronDown, Calendar, FileText, Star, Edit, Trash2,
  Filter, MoreHorizontal, Users
} from "lucide-react";
import { v4 as uuid } from "uuid";
import { HintBulb } from "@/components/layout/HintBulb";

// ─── الثوابت ─────────────────────────────────────────────

const COVENANT_TYPES: CovenantType[] = [
  "تعهد غياب", "ميثاق حفظ", "التزام سلوكي", "إجراء تأديبي",
];

const STATUS_OPTS: { value: CovenantStatus; label: string; color: string; bg: string }[] = [
  { value: "نشط", label: "نشط", color: "text-amber-700", bg: "bg-amber-50" },
  { value: "تم الوفاء بها", label: "تم الوفاء بها", color: "text-emerald-700", bg: "bg-emerald-50" },
  { value: "نُقِض", label: "نُقِض", color: "text-red-600", bg: "bg-red-50" },
];

const CARD_OPTS: { value: CovenantCard; label: string; color: string }[] = [
  { value: "بدون", label: "بدون بطاقة", color: "text-gray-400" },
  { value: "بطاقة صفراء", label: "🟡 صفراء", color: "text-amber-600" },
  { value: "بطاقة حمراء", label: "🔴 حمراء", color: "text-red-600" },
];

function statusIcon(status: CovenantStatus) {
  if (status === "تم الوفاء بها") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === "نُقِض") return <ShieldOff className="w-4 h-4 text-red-500" />;
  return <Clock className="w-4 h-4 text-amber-500" />;
}

// ─── نموذج العهد ─────────────────────────────────────────

interface CovenantForm {
  type: CovenantType;
  text: string;
  status: CovenantStatus;
  card: CovenantCard;
  dueDate: string;
  absenceDays: string;
  writtenPenalty: string;
}

const EMPTY_FORM: CovenantForm = {
  type: "تعهد غياب",
  text: "",
  status: "نشط",
  card: "بدون",
  dueDate: "",
  absenceDays: "",
  writtenPenalty: "",
};

// ─── Modal العهد ──────────────────────────────────────────

function CovenantModal({
  studentName,
  covenant,
  onSave,
  onClose,
}: {
  studentName: string;
  covenant?: Covenant;
  onSave: (c: Covenant) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CovenantForm>(
    covenant
      ? {
          type: covenant.type,
          text: covenant.text,
          status: covenant.status,
          card: covenant.card,
          dueDate: covenant.dueDate ?? "",
          absenceDays: covenant.absenceDays?.toString() ?? "",
          writtenPenalty: covenant.writtenPenalty ?? "",
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);

  const up = (k: keyof CovenantForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.text.trim()) return;
    setSaving(true);
    await onSave({
      id: covenant?.id ?? uuid(),
      type: form.type,
      text: form.text.trim(),
      status: form.status,
      card: form.card,
      date: covenant?.date ?? new Date().toISOString().slice(0, 10),
      dueDate: form.dueDate || undefined,
      absenceDays: form.absenceDays ? +form.absenceDays : undefined,
      writtenPenalty: form.writtenPenalty || undefined,
    });
    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-l from-red-500 to-red-700 text-white">
            <div className="flex items-center gap-2">
              <Gavel className="w-5 h-5" />
              <div>
                <h3 className="font-black text-sm">{covenant ? "تعديل عهد" : "عهد جديد"}</h3>
                <p className="text-white/70 text-xs">{studentName}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* نوع العهد */}
            <div>
              <label className="label-xs flex items-center gap-2">
                نوع العهد
                <HintBulb 
                  size="sm"
                  label="تفاصيل أنواع العهود"
                  steps={[
                    { title: "ميثاق حفظ", description: "يستخدم لإلزام الطالب بمراجعة ورد معين خلال فترة محددة لتدارك النسيان." },
                    { title: "تعهد غياب", description: "عند تجاوز الحد المسموح به من الغياب، يتم تسجيل هذا التعهد." },
                    { title: "إجراء تأديبي", description: "يُتخذ في حالات المخالفات السلوكية الجسيمة داخل الحلقة." }
                  ]}
                />
              </label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COVENANT_TYPES.map((t) => (
                  <button key={t} onClick={() => up("type", t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      form.type === t
                        ? "bg-red-600 text-white border-red-600 shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* البطاقة */}
            <div>
              <label className="label-xs flex items-center gap-2">
                البطاقة التدريجية
                <HintBulb 
                  size="sm"
                  label="تفاصيل عن البطاقات"
                  steps={[
                    { title: "نظام البطاقات", description: "البطاقة الصفراء بمثابة إنذار أولي للفت انتباه الطالب أو ولي أمره. أما البطاقة الحمراء فتعني مخالفة صريحة للعهد تستوجب حسم النقاط أو التواصل الرسمي." }
                  ]}
                />
              </label>
              <div className="flex gap-2 mt-2">
                {CARD_OPTS.map((c) => (
                  <button key={c.value} onClick={() => up("card", c.value)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black border-2 transition-all ${
                      form.card === c.value
                        ? "border-gray-800 bg-gray-50 " + c.color
                        : "border-gray-100 text-gray-400 hover:border-gray-200"
                    }`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* الحالة */}
            <div>
              <label className="label-xs">الحالة</label>
              <div className="flex gap-2 mt-2">
                {STATUS_OPTS.map((s) => (
                  <button key={s.value} onClick={() => up("status", s.value)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black border-2 transition-all ${
                      form.status === s.value
                        ? `${s.bg} ${s.color} border-current shadow-sm`
                        : "border-gray-100 text-gray-400 hover:border-gray-200"
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* تاريخ الاستحقاق + أيام الغياب */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-xs flex items-center gap-1.5">
                  تاريخ الاستحقاق
                  <HintBulb 
                    size="sm"
                    steps={[
                        { title: "تاريخ انتهاء العهد", description: "اختر التاريخ الذي يجب على الطالب إتمام التزامه فيه ليتحول العهد لـ (تم الوفاء به)." }
                    ]}
                  />
                </label>
                <input type="date" value={form.dueDate}
                  onChange={(e) => up("dueDate", e.target.value)}
                  className="input-field text-sm py-2 mt-1.5" />
              </div>
              {form.type === "تعهد غياب" && (
                <div>
                  <label className="label-xs">عدد أيام الغياب</label>
                  <input type="number" min={1} value={form.absenceDays}
                    onChange={(e) => up("absenceDays", e.target.value)}
                    placeholder="مثال: 3"
                    className="input-field text-sm py-2 mt-1.5 text-center" />
                </div>
              )}
            </div>

            {/* العقوبة الكتابية */}
            {form.type === "إجراء تأديبي" && (
              <div>
                <label className="label-xs flex items-center gap-2">
                  العقوبة الكتابية / الإجراء
                  <HintBulb 
                    size="sm"
                    steps={[{ title: "الإجراء المتبع", description: "مثبّت كمرجع إداري. مثال: (كتابة سورة النبأ 3 مرات)، أو (حفظ 10 أبيات من الجزرية)." }]}
                  />
                </label>
                <input value={form.writtenPenalty}
                  onChange={(e) => up("writtenPenalty", e.target.value)}
                  placeholder="مثال: كتابة سورة الملك 10 مرات"
                  className="input-field text-sm py-2 mt-1.5" />
              </div>
            )}

            {/* نص العهد */}
            <div>
              <label className="label-xs">نص العهد</label>
              <textarea value={form.text}
                onChange={(e) => up("text", e.target.value)}
                rows={4} placeholder="أكتب نص العهد أو الإجراء التأديبي بدقة..."
                className="w-full mt-1.5 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm leading-relaxed focus:outline-none focus:border-[var(--color-primary)]/50 transition-all" />
            </div>
          </div>

          <div className="flex gap-3 px-5 pb-5">
            <button onClick={onClose} className="btn-secondary flex-1 py-2.5 justify-center text-sm">إلغاء</button>
            <button onClick={handleSave} disabled={!form.text.trim() || saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-40">
              {saving ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> حفظ...</> : <><CheckCircle2 className="w-4 h-4" /> حفظ العهد</>}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

export default function CovenantsPage() {
  const { user, school, isPrincipal } = useAuth();
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<CovenantStatus | "الكل">("الكل");
  const [modalStudent, setModalStudent] = useState<Student | null>(null);
  const [editCovenant, setEditCovenant] = useState<Covenant | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id || !school?.id) return;
    setLoading(true);
    const db = getDB();

    let studs: Student[] = [];
    if (isPrincipal || user.role === "super_admin") {
      const schoolTeachers = await db.users.where("schoolId").equals(school.id).filter(u => u.role === "teacher").toArray();
      setTeachers(schoolTeachers.sort((a,b) => a.displayName.localeCompare(b.displayName, "ar")));

      studs = await db.students.where("schoolId").equals(school.id).toArray();
      if (selectedTeacherId !== "all") {
        studs = studs.filter(s => s.teacherId === selectedTeacherId);
      }
    } else {
      studs = await db.students.where("teacherId").equals(user.id).toArray();
    }

    studs.sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
    setStudents(studs);
    setLoading(false);
  }, [user?.id, school?.id, isPrincipal, selectedTeacherId]);

  useEffect(() => { load(); }, [load]);

  // كل العهود بسطح واحد مع اسم الطالب
  const allCovenants = useMemo(() => {
    const result: { student: Student; covenant: Covenant }[] = [];
    for (const s of students) {
      for (const c of (s.covenants ?? [])) {
        result.push({ student: s, covenant: c });
      }
    }
    return result.sort((a, b) => b.covenant.date.localeCompare(a.covenant.date));
  }, [students]);

  const filtered = useMemo(() => {
    return allCovenants.filter(({ student, covenant }) => {
      const matchSearch = !search ||
        student.fullName.includes(search) ||
        covenant.text.includes(search) ||
        covenant.type.includes(search);
      const matchStatus = filterStatus === "الكل" || covenant.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [allCovenants, search, filterStatus]);

  const stats = useMemo(() => ({
    total: allCovenants.length,
    active: allCovenants.filter((c) => c.covenant.status === "نشط").length,
    fulfilled: allCovenants.filter((c) => c.covenant.status === "تم الوفاء بها").length,
    broken: allCovenants.filter((c) => c.covenant.status === "نُقِض").length,
  }), [allCovenants]);

  const handleSaveCovenant = async (student: Student, covenant: Covenant) => {
    const existing = student.covenants ?? [];
    const idx = existing.findIndex((c) => c.id === covenant.id);
    const updated = idx >= 0
      ? existing.map((c) => c.id === covenant.id ? covenant : c)
      : [...existing, covenant];
    await updateStudent(student.id, { covenants: updated });
    setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, covenants: updated } : s));
  };

  const handleDelete = async (student: Student, covenantId: string) => {
    if (!confirm("هل تريد حذف هذا العهد نهائياً؟")) return;
    const updated = (student.covenants ?? []).filter((c) => c.id !== covenantId);
    await updateStudent(student.id, { covenants: updated });
    setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, covenants: updated } : s));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* رأس */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3" style={{ fontFamily: "var(--font-headline)" }}>
            العهود والعقوبات
            <HintBulb 
              label="فكرة العهود"
              steps={[
                { title: "نظام العهود القرآنية", description: "العهد هو وسيلة تواصل رسمية بين المسجد والبيت، يساعدك على ضبط سلوك الطالب وترميم حفظه عبر وضع أهداف أو إنذارات موثّقة." },
                { title: "المعايير المتقدمة للعهد", description: "يمكنك عند إضافة العهد تعيين (بطاقات إنذار)، أو (مدة زمنية للاستحقاق)، أو (عقوبات كتابية) لتفصيل الالتزام بشكل احترافي." }
              ]}
            />
          </h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            {stats.total} عهد · {stats.active} نشط
          </p>
        </div>
        <button onClick={() => { setEditCovenant(undefined); setModalStudent(students[0] ?? null); }}
          className="btn-primary py-2.5 text-sm shrink-0">
          <Plus className="w-4 h-4" /> عهد جديد
        </button>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "إجمالي", value: stats.total, color: "text-gray-700", bg: "bg-gray-50", icon: FileText },
          { label: "نشط", value: stats.active, color: "text-amber-700", bg: "bg-amber-50", icon: Clock },
          { label: "منجز", value: stats.fulfilled, color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle2 },
          { label: "مُنتهك", value: stats.broken, color: "text-red-600", bg: "bg-red-50", icon: ShieldOff },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 flex items-center gap-3`}>
            <Icon className={`w-5 h-5 ${color} shrink-0`} />
            <div>
              <p className={`text-xl font-black ${color}`} style={{ fontFamily: "var(--font-headline)" }}>{value}</p>
              <p className={`text-xs font-medium ${color} opacity-70`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── فلتر المعلم (للمدراء فقط) ─── */}
      {(isPrincipal || user?.role === "super_admin") && teachers.length > 0 && (
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <p className="text-sm font-bold text-gray-700">تصفح تعهدات مُعلم:</p>
          </div>
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-bold bg-indigo-50 text-indigo-700 border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
          >
            <option value="all">كل المعلمين والأفواج</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.displayName} ({t.groupName || "بدون فوج"})</option>
            ))}
          </select>
        </div>
      )}

      {/* فلاتر */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو النص..."
            className="w-full h-10 border border-gray-200 rounded-xl pr-10 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 bg-white" />
        </div>
        {(["الكل", "نشط", "تم الوفاء بها", "نُقِض"] as const).map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              filterStatus === s
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
            }`}>{s}</button>
        ))}
      </div>

      {/* قائمة العهود */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Gavel className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">
            {allCovenants.length === 0 ? "لا توجد عهود مسجّلة بعد" : "لا توجد نتائج"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ student, covenant }) => {
            const isExp = expandedId === covenant.id;
            const cfg = STATUS_OPTS.find((s) => s.value === covenant.status) ?? STATUS_OPTS[0];
            return (
              <motion.div key={covenant.id} layout
                className={`bg-white rounded-2xl border-2 overflow-hidden hover:shadow-md transition-shadow ${
                  covenant.status === "نُقِض" ? "border-red-200" :
                  covenant.status === "تم الوفاء بها" ? "border-emerald-200" :
                  "border-[var(--color-border)]"
                }`}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* اسم الطالب */}
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-black text-sm shrink-0">
                      {student.fullName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-black text-gray-800">{student.fullName}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{covenant.type}</span>
                        {covenant.card !== "بدون" && (
                          <span className="text-xs font-bold">{covenant.card === "بطاقة صفراء" ? "🟡" : "🔴"}</span>
                        )}
                      </div>
                      <p className={`text-xs font-bold ${cfg.color} flex items-center gap-1`}>
                        {statusIcon(covenant.status)} {cfg.label}
                      </p>
                    </div>

                    {/* أزرار */}
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setModalStudent(student); setEditCovenant(covenant); }}
                        className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(student, covenant.id)}
                        className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setExpandedId(isExp ? null : covenant.id)}
                        className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExp ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* نص مختصر */}
                  <p className={`mt-3 text-sm text-gray-700 leading-relaxed ${!isExp && "line-clamp-2"}`}>
                    {covenant.text}
                  </p>

                  <AnimatePresence>
                    {isExp && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <div><span className="font-bold text-gray-700">تاريخ العهد:</span> {new Date(covenant.date).toLocaleDateString("ar-DZ")}</div>
                          {covenant.dueDate && <div><span className="font-bold text-gray-700">الاستحقاق:</span> {new Date(covenant.dueDate).toLocaleDateString("ar-DZ")}</div>}
                          {covenant.absenceDays && <div><span className="font-bold text-gray-700">أيام الغياب:</span> {covenant.absenceDays} أيام</div>}
                          {covenant.writtenPenalty && <div className="col-span-2"><span className="font-bold text-gray-700">العقوبة:</span> {covenant.writtenPenalty}</div>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <p className="text-xs text-gray-400 mt-2">{new Date(covenant.date).toLocaleDateString("ar-DZ")}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalStudent && (
        <CovenantModal
          studentName={modalStudent.fullName}
          covenant={editCovenant}
          onSave={(c) => handleSaveCovenant(modalStudent, c)}
          onClose={() => { setModalStudent(null); setEditCovenant(undefined); }}
        />
      )}
    </div>
  );
}
