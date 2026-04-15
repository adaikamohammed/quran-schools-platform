"use client";
import SchoolGuard from "@/components/layout/SchoolGuard";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import { createCampItem, updateCampItem, deleteCampItem } from "@/lib/storage/mutations";
import type { CampItem, CampItemCategory, CampItemStatus } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tent, Plus, X, Loader2, Trash2, Edit3, CheckCircle2,
  AlertTriangle, Package, Thermometer, BookOpen, Heart,
  Home, Printer, MoreVertical, Search, Filter,
  ChevronDown, TrendingUp, RefreshCw, Save, RotateCcw,
} from "lucide-react";

// ─── إعدادات الفئات ──────────────────────────────────────

const CATEGORIES: Array<{
  value: CampItemCategory;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  gradient: string;
}> = [
  { value: "مواد_غذائية",    label: "مواد غذائية",    icon: Package,     color: "text-orange-700", bg: "bg-orange-50 dark:bg-orange-500/10",  gradient: "from-orange-500 to-amber-500" },
  { value: "معدات_رياضية",   label: "معدات رياضية",    icon: TrendingUp,  color: "text-blue-700",   bg: "bg-blue-50 dark:bg-blue-500/10",    gradient: "from-blue-500 to-cyan-500"    },
  { value: "أدوات_تعليمية",  label: "أدوات تعليمية",  icon: BookOpen,    color: "text-purple-700", bg: "bg-purple-50 dark:bg-purple-500/10", gradient: "from-purple-500 to-violet-500" },
  { value: "مستلزمات_صحية",  label: "مستلزمات صحية",  icon: Heart,   color: "text-red-700",    bg: "bg-red-50 dark:bg-red-500/10",      gradient: "from-red-500 to-rose-500"     },
  { value: "مستلزمات_سكن",   label: "مستلزمات سكن",   icon: Home,        color: "text-teal-700",   bg: "bg-teal-50 dark:bg-teal-500/10",    gradient: "from-teal-500 to-emerald-500" },
  { value: "طباعة_ووثائق",   label: "طباعة ووثائق",   icon: BookOpen,    color: "text-gray-700",   bg: "bg-gray-100 dark:bg-white/8",       gradient: "from-gray-500 to-slate-500"   },
  { value: "أخرى",           label: "أخرى",            icon: Package,     color: "text-gray-600",   bg: "bg-gray-100 dark:bg-white/8",       gradient: "from-gray-500 to-gray-600"    },
];

const STATUS_CFG: Record<CampItemStatus, { label: string; color: string; bg: string }> = {
  pending:  { label: "لم يُحضَر",    color: "text-red-600",   bg: "bg-red-50 dark:bg-red-500/10"    },
  partial:  { label: "جزئياً",       color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10" },
  complete: { label: "مكتمل ✓",      color: "text-emerald-600",bg:"bg-emerald-50 dark:bg-emerald-500/10"},
  returned: { label: "تم الإرجاع ↩",  color: "text-blue-600",  bg: "bg-blue-50 dark:bg-blue-500/10"  },
};

function calcStatus(item: CampItem): CampItemStatus {
  if (item.quantityBrought === 0) return "pending";
  if (!item.isConsumable && item.quantityReturned >= item.quantityBrought) return "returned";
  if (item.quantityBrought >= item.quantity) return "complete";
  return "partial";
}

// ─── نموذج إضافة / تعديل ────────────────────────────────

function ItemModal({
  schoolId,
  campYear,
  editItem,
  onSave,
  onClose,
}: {
  schoolId: string;
  campYear: string;
  editItem?: CampItem;
  onSave: (item: CampItem) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(editItem?.name ?? "");
  const [category, setCategory] = useState<CampItemCategory>(editItem?.category ?? "أخرى");
  const [quantity, setQuantity] = useState(editItem?.quantity ?? 1);
  const [provider, setProvider] = useState(editItem?.provider ?? "");
  const [isConsumable, setIsConsumable] = useState(editItem?.isConsumable ?? false);
  const [estimatedCost, setEstimatedCost] = useState(editItem?.estimatedCost ?? 0);
  const [notes, setNotes] = useState(editItem?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    let result: CampItem;
    if (editItem) {
      await updateCampItem(editItem.id, { name, category, quantity, provider, isConsumable, estimatedCost, notes });
      result = { ...editItem, name, category, quantity, provider, isConsumable, estimatedCost, notes };
    } else {
      result = await createCampItem({
        schoolId, campYear, name, category, quantity,
        quantityBrought: 0, quantityReturned: 0,
        isConsumable, provider, estimatedCost, notes,
        status: "pending",
      });
    }
    onSave(result);
    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div key="modal" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1a1d2a] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 bg-gradient-to-l from-teal-600 to-emerald-700 text-white">
            <div className="flex items-center gap-3">
              <Tent className="w-5 h-5" />
              <h3 className="font-black text-sm">{editItem ? "تعديل المستلزم" : "إضافة مستلزم جديد"}</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* الاسم */}
            <div>
              <label className="label-xs mb-1.5 block">اسم المستلزم *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="مثال: عبوات مياه، كرات، أقلام..."
                className="input-field text-sm py-2.5 w-full" />
            </div>

            {/* الفئة */}
            <div>
              <label className="label-xs mb-1.5 block">الفئة</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat.value} onClick={() => setCategory(cat.value)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      category === cat.value
                        ? `bg-gradient-to-br ${cat.gradient} text-white border-transparent shadow-md`
                        : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                    }`}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* الكمية + التكلفة */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-xs mb-1.5 block">الكمية المطلوبة</label>
                <input type="number" min={1} value={quantity} onChange={e => setQuantity(+e.target.value)}
                  className="input-field text-sm py-2.5 w-full text-center" />
              </div>
              <div>
                <label className="label-xs mb-1.5 block">التكلفة التقديرية (دج)</label>
                <input type="number" min={0} value={estimatedCost} onChange={e => setEstimatedCost(+e.target.value)}
                  className="input-field text-sm py-2.5 w-full text-center" />
              </div>
            </div>

            {/* المسؤول */}
            <div>
              <label className="label-xs mb-1.5 block">الجهة / المسؤول عن التوفير</label>
              <input value={provider} onChange={e => setProvider(e.target.value)}
                placeholder="مثال: الإدارة، الشيخ فلان..."
                className="input-field text-sm py-2.5 w-full" />
            </div>

            {/* قابل للاستهلاك */}
            <div className="flex items-center gap-3 p-3.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
              <button onClick={() => setIsConsumable(v => !v)}
                className={`w-12 h-6 rounded-full transition-colors shrink-0 ${isConsumable ? "bg-amber-400" : "bg-gray-300"}`}>
                <div className={`w-4.5 h-4.5 bg-white rounded-full shadow m-0.5 transition-transform ${isConsumable ? "translate-x-6" : ""}`} />
              </button>
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-200">مستلزم قابل للاستهلاك</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">لن يُحسب كمدفوع بل يُستهلك (مواد غذائية، أقلام...)</p>
              </div>
            </div>

            {/* ملاحظات */}
            <div>
              <label className="label-xs mb-1.5 block">ملاحظات</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="أي ملاحظات إضافية..."
                rows={2}
                className="w-full border border-gray-200 dark:border-white/10 rounded-xl text-sm py-2.5 px-3 focus:outline-none focus:border-[var(--color-primary)]/50 bg-white dark:bg-white/5 dark:text-white resize-none" />
            </div>
          </div>

          <div className="flex gap-3 px-5 pb-5">
            <button onClick={onClose} className="btn-secondary flex-1 py-2.5 justify-center text-sm">إلغاء</button>
            <button onClick={handleSave} disabled={!name.trim() || saving}
              className="flex-1 py-2.5 justify-center text-sm flex items-center gap-2 rounded-xl font-bold text-white bg-gradient-to-l from-teal-600 to-emerald-700 hover:opacity-90 disabled:opacity-40 transition-opacity">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> حفظ...</> : <><Save className="w-4 h-4" /> حفظ</>}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── سطر مستلزم ──────────────────────────────────────────

function ItemRow({
  item,
  onUpdate,
  onEdit,
  onDelete,
}: {
  item: CampItem;
  onUpdate: (id: string, patches: Partial<CampItem>) => void;
  onEdit: (item: CampItem) => void;
  onDelete: (id: string) => void;
}) {
  const status = calcStatus(item);
  const cfg = STATUS_CFG[status];
  const cat = CATEGORIES.find(c => c.value === item.category);
  const pct = item.quantity > 0 ? Math.round((item.quantityBrought / item.quantity) * 100) : 0;

  const handleBrought = async (delta: number) => {
    const newVal = Math.max(0, Math.min(item.quantity, item.quantityBrought + delta));
    onUpdate(item.id, { quantityBrought: newVal });
    await updateCampItem(item.id, { quantityBrought: newVal });
  };

  const handleReturned = async (val: number) => {
    const newVal = Math.max(0, Math.min(item.quantityBrought, val));
    onUpdate(item.id, { quantityReturned: newVal });
    await updateCampItem(item.id, { quantityReturned: newVal });
  };

  return (
    <motion.div
      layout
      className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden hover:shadow-sm transition-shadow"
    >
      {/* شريط التقدم */}
      <div className="h-1 bg-gray-100 dark:bg-white/10">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
          className={`h-full ${status === "complete" || status === "returned" ? "bg-emerald-400" : status === "partial" ? "bg-amber-400" : "bg-gray-300"} rounding-full`}
        />
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* أيقونة الفئة */}
          <div className={`w-10 h-10 rounded-xl ${cat?.bg ?? "bg-gray-100"} flex items-center justify-center shrink-0`}>
            {cat && <cat.icon className={`w-4.5 h-4.5 ${cat.color}`} />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 justify-between">
              <div className="min-w-0">
                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] text-gray-400">{cat?.label ?? item.category}</span>
                  {item.provider && <span className="text-[10px] text-gray-400">· {item.provider}</span>}
                  {item.isConsumable && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full">استهلاكي</span>
                  )}
                </div>
              </div>

              {/* الحالة + الإجراءات */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-black px-2 py-1 rounded-xl ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
                <button onClick={() => onEdit(item)} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/8 flex items-center justify-center text-gray-400 hover:text-[var(--color-primary)] transition-colors">
                  <Edit3 className="w-3 h-3" />
                </button>
                <button onClick={() => { if (confirm("حذف هذا المستلزم؟")) onDelete(item.id); }}
                  className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* الكمية المُحضرة */}
            <div className="mt-3 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">أُحضر:</span>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/8 rounded-xl overflow-hidden">
                  <button onClick={() => handleBrought(-1)}
                    className="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors font-black">−</button>
                  <span className="text-sm font-black text-gray-800 dark:text-white w-8 text-center">{item.quantityBrought}</span>
                  <button onClick={() => handleBrought(1)}
                    className="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors font-black">+</button>
                </div>
                <span className="text-xs text-gray-400">/ {item.quantity}</span>
              </div>

              {/* الإرجاع — للمستلزمات الغير استهلاكية */}
              {!item.isConsumable && item.quantityBrought > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-600 dark:text-blue-400 shrink-0">↩ رُد:</span>
                  <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 rounded-xl overflow-hidden">
                    <button onClick={() => handleReturned(item.quantityReturned - 1)}
                      className="w-7 h-7 flex items-center justify-center text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors font-black">−</button>
                    <span className="text-sm font-black text-blue-700 dark:text-blue-300 w-8 text-center">{item.quantityReturned}</span>
                    <button onClick={() => handleReturned(item.quantityReturned + 1)}
                      className="w-7 h-7 flex items-center justify-center text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors font-black">+</button>
                  </div>
                </div>
              )}

              {/* نسبة التقدم */}
              <span className="text-xs font-bold text-gray-400 mr-auto">{pct}%</span>
            </div>

            {/* ملاحظات */}
            {item.notes && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">📝 {item.notes}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

function CampPage() {
  const { user, school } = useAuth();
  const [items, setItems] = useState<CampItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<CampItem | undefined>();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<CampItemCategory | "الكل">("الكل");
  const [filterStatus, setFilterStatus] = useState<CampItemStatus | "الكل">("الكل");
  const [campYear, setCampYear] = useState(String(new Date().getFullYear()));

  const load = useCallback(async () => {
    if (!school?.id) return;
    setLoading(true);
    const db = getDB();
    const all = await db.campItems.where("schoolId").equals(school.id).filter(i => i.campYear === campYear).toArray();
    setItems(all);
    setLoading(false);
  }, [school?.id, campYear]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = (id: string, patches: Partial<CampItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patches } : i));
  };

  const handleDelete = async (id: string) => {
    await deleteCampItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSave = (item: CampItem) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...item, status: calcStatus(item) };
        return updated;
      }
      return [...prev, item];
    });
  };

  // مع حساب الحالة الفعلية دائماً
  const itemsWithStatus = useMemo(() =>
    items.map(i => ({ ...i, status: calcStatus(i) })), [items]);

  const filtered = useMemo(() => {
    return itemsWithStatus.filter(item => {
      const matchSearch = !search || item.name.includes(search) || item.provider?.includes(search);
      const matchCat = filterCategory === "الكل" || item.category === filterCategory;
      const matchStatus = filterStatus === "الكل" || item.status === filterStatus;
      return matchSearch && matchCat && matchStatus;
    });
  }, [itemsWithStatus, search, filterCategory, filterStatus]);

  // الإحصائيات
  const stats = useMemo(() => {
    const total = itemsWithStatus.length;
    const complete = itemsWithStatus.filter(i => i.status === "complete" || i.status === "returned").length;
    const pending = itemsWithStatus.filter(i => i.status === "pending").length;
    const totalCost = itemsWithStatus.reduce((s, i) => s + (i.estimatedCost ?? 0), 0);
    const overallPct = total > 0 ? Math.round((complete / total) * 100) : 0;
    return { total, complete, pending, totalCost, overallPct };
  }, [itemsWithStatus]);

  // تجميع حسب الفئة
  const byCategory = useMemo(() => {
    const map: Record<string, { total: number; complete: number }> = {};
    itemsWithStatus.forEach(item => {
      if (!map[item.category]) map[item.category] = { total: 0, complete: 0 };
      map[item.category].total++;
      if (item.status === "complete" || item.status === "returned") map[item.category].complete++;
    });
    return map;
  }, [itemsWithStatus]);

  const years = [String(new Date().getFullYear()), String(new Date().getFullYear() + 1)];

  return (
    <div className="max-w-4xl mx-auto space-y-5" dir="rtl">
      {/* رأس */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
            <Tent className="w-6 h-6 text-teal-600" />
            مستلزمات المخيم الصيفي
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            تتبع كامل لتجهيز المخيم — {stats.total} مستلزم
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select value={campYear} onChange={e => setCampYear(e.target.value)}
            className="text-sm font-bold px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white dark:bg-white/5 dark:text-white focus:outline-none">
            {years.map(y => <option key={y} value={y}>مخيم {y}</option>)}
          </select>
          <button onClick={() => { setEditItem(undefined); setShowModal(true); }} className="btn-primary py-2.5 text-sm">
            <Plus className="w-4 h-4" /> إضافة
          </button>
        </div>
      </div>

      {/* بطاقة التقدم الإجمالي */}
      {!loading && stats.total > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-gradient-to-l from-teal-600 to-emerald-700 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <p className="text-white/70 text-xs font-bold">التقدم الإجمالي</p>
                <p className="text-4xl font-black mt-1">{stats.overallPct}%</p>
              </div>
              <div className="flex gap-4 text-center">
                <div><p className="text-2xl font-black">{stats.complete}</p><p className="text-xs text-white/70">مكتمل</p></div>
                <div><p className="text-2xl font-black">{stats.pending}</p><p className="text-xs text-white/70">معلق</p></div>
                <div><p className="text-xl font-black">{stats.totalCost.toLocaleString("ar")}</p><p className="text-xs text-white/70">دج تقديري</p></div>
              </div>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${stats.overallPct}%` }} transition={{ duration: 0.8 }}
                className="h-full bg-white rounded-full" />
            </div>
          </div>
        </motion.div>
      )}

      {/* تفصيل حسب الفئة */}
      {!loading && Object.keys(byCategory).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.filter(c => byCategory[c.value]).map(cat => {
            const d = byCategory[cat.value] ?? { total: 0, complete: 0 };
            const pct = d.total > 0 ? Math.round((d.complete / d.total) * 100) : 0;
            return (
              <button key={cat.value} onClick={() => setFilterCategory(cat.value === filterCategory ? "الكل" : cat.value)}
                className={`${cat.bg} rounded-xl p-3 text-right transition-all hover:shadow-sm border-2 ${filterCategory === cat.value ? "border-current" : "border-transparent"}`}>
                <cat.icon className={`w-4 h-4 ${cat.color} mb-1`} />
                <p className={`text-xs font-black ${cat.color}`}>{cat.label}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{d.complete}/{d.total} · {pct}%</p>
              </button>
            );
          })}
        </div>
      )}

      {/* أدوات البحث */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
            className="w-full h-10 border border-gray-200 dark:border-white/10 rounded-xl pr-10 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 bg-white dark:bg-white/5 dark:text-white" />
        </div>
        {(["الكل", "pending", "partial", "complete", "returned"] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              filterStatus === s
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400"
            }`}>
            {s === "الكل" ? "الكل" : STATUS_CFG[s].label}
          </button>
        ))}
      </div>

      {/* القائمة */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-14 text-center">
          <Tent className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="font-bold text-gray-400 dark:text-gray-500">
            {items.length === 0 ? "لم تُضف أي مستلزمات بعد" : "لا توجد نتائج مطابقة"}
          </p>
          {items.length === 0 && (
            <button onClick={() => { setEditItem(undefined); setShowModal(true); }}
              className="btn-primary py-2.5 text-sm mx-auto mt-4">
              <Plus className="w-4 h-4" /> أضف أول مستلزم
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                onUpdate={handleUpdate}
                onEdit={i => { setEditItem(i); setShowModal(true); }}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      {showModal && school && (
        <ItemModal
          schoolId={school.id}
          campYear={campYear}
          editItem={editItem}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditItem(undefined); }}
        />
      )}
    </div>
  );
}

export default function CampPageWrapper() {
  return (
    <SchoolGuard>
      <CampPage />
    </SchoolGuard>
  );
}
