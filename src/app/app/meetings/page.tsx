"use client";
import SchoolGuard from "@/components/layout/SchoolGuard";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import type { Meeting, MeetingTopic } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Plus, X, CheckCircle2, Clock, Users,
  ChevronDown, MessageSquare, Star, Loader2,
  Search, Edit, Trash2, ChevronRight, UtensilsCrossed,
} from "lucide-react";
import { v4 as uuid } from "uuid";
import LivePresence from "@/components/ui/LivePresence";

// ─── Modal اجتماع جديد ───────────────────────────────────

function MeetingModal({ schoolId, userId, onSave, onClose, initialType = 'meeting' }: {
  schoolId: string;
  userId: string;
  onSave: (m: Meeting) => void;
  onClose: () => void;
  initialType?: 'meeting' | 'event';
}) {
  const [type, setType] = useState<'meeting' | 'event'>(initialType);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  
  // خاص بالاجتماع
  const [foodProvided, setFoodProvided] = useState(false);
  const [foodDetails, setFoodDetails] = useState("");
  const [topics, setTopics] = useState<MeetingTopic[]>([
    { topic: "", speaker: "", solutions: "", isFeatured: false }
  ]);
  
  // خاص بالمناسبة
  const [eventType, setEventType] = useState<'دينية' | 'اجتماعية' | 'مسابقة' | 'أخرى'>('دينية');
  const [location, setLocation] = useState("");
  const [audience, setAudience] = useState("");
  const [budget, setBudget] = useState<number | "">("");

  const [saving, setSaving] = useState(false);

  const addTopic = () => setTopics((t) => [...t, { topic: "", speaker: "", solutions: "", isFeatured: false }]);
  const removeTopic = (i: number) => setTopics((t) => t.filter((_, j) => j !== i));
  const updateTopic = (i: number, k: keyof MeetingTopic, v: string | boolean) =>
    setTopics((t) => t.map((top, j) => j === i ? { ...top, [k]: v } : top));

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const now = new Date().toISOString();
    const meeting: Meeting = {
      id: uuid(),
      schoolId,
      type,
      title: title.trim(),
      date,
      timestamp: now,
      status: new Date(date) > new Date() ? "upcoming" : "completed",
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      // Meeting specifics
      ...(type === 'meeting' ? {
        attendance: {},
        foodProvided,
        foodDetails: foodProvided ? foodDetails : undefined,
        topics: topics.filter((t) => t.topic.trim()),
      } : {}),
      // Event specifics
      ...(type === 'event' ? {
        eventType,
        location: location.trim(),
        targetAudience: audience.trim(),
        budget: budget === "" ? undefined : Number(budget)
      } : {})
    };

    const db = getDB();
    await db.meetings.put(meeting);
    onSave(meeting);
    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div key="meeting-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div key="meeting-modal" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
          {/* Header */}
          <div className={`flex items-center justify-between p-5 text-white bg-gradient-to-l ${
            type === 'meeting' ? 'from-indigo-600 to-purple-700' : 'from-emerald-600 to-teal-700'
          }`}>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <h3 className="font-black text-sm" style={{ fontFamily: "var(--font-headline)" }}>
                {type === 'meeting' ? "اجتماع جديد" : "مناسبة جديدة"}
              </h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* التبديل بين النوعين */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-4">
              <button onClick={() => setType('meeting')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${type === 'meeting' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>اجتماع إداري</button>
              <button onClick={() => setType('event')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${type === 'event' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>مناسبة دينية / نشاط</button>
            </div>
            {/* العنوان + التاريخ */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="label-xs">عنوان الاجتماع</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: الاجتماع الشهري لشهر أبريل"
                  className="input-field text-sm py-2 mt-1.5" />
              </div>
              <div>
                <label className="label-xs">التاريخ</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="input-field text-sm py-2 mt-1.5" />
              </div>
            </div>

            {/* المأكل للاجتماعات */}
            {type === 'meeting' && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <button onClick={() => setFoodProvided(!foodProvided)}
                  className={`w-10 h-6 rounded-full transition-colors ${foodProvided ? "bg-amber-400" : "bg-gray-200"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform m-0.5 ${foodProvided ? "translate-x-4" : "translate-x-0"}`} />
                </button>
                <div>
                  <p className="text-sm font-bold text-amber-800">الوليمة / المأكل متوفر</p>
                  {foodProvided && (
                    <input value={foodDetails} onChange={(e) => setFoodDetails(e.target.value)}
                      placeholder="مثال: القهوة والمعجنات..."
                      className="text-xs border border-amber-200 rounded-lg px-2 py-1 mt-1 focus:outline-none w-full bg-white" />
                  )}
                </div>
              </div>
            )}

            {/* المواضيع للاجتماعات */}
            {type === 'meeting' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label-xs">مواضيع الاجتماع</label>
                  <button onClick={addTopic}
                    className="flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline">
                    <Plus className="w-3 h-3" /> إضافة موضوع
                  </button>
                </div>
                <div className="space-y-3">
                  {topics.map((topic, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-400 w-5 text-center">{i + 1}</span>
                        <input value={topic.topic} onChange={(e) => updateTopic(i, "topic", e.target.value)}
                          placeholder="الموضوع"
                          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[var(--color-primary)]/50 bg-white" />
                        <button onClick={() => updateTopic(i, "isFeatured", !topic.isFeatured)}
                          className={`text-xs font-bold ${topic.isFeatured ? "text-amber-500" : "text-gray-300"}`}>⭐</button>
                        {topics.length > 1 && (
                          <button onClick={() => removeTopic(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pr-5">
                        <input value={topic.speaker} onChange={(e) => updateTopic(i, "speaker", e.target.value)}
                          placeholder="المُتحدث"
                          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[var(--color-primary)]/50 bg-white" />
                        <input value={topic.solutions} onChange={(e) => updateTopic(i, "solutions", e.target.value)}
                          placeholder="القرارات / الحلول"
                          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[var(--color-primary)]/50 bg-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* تفاصيل المناسبات */}
            {type === 'event' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-xs">نوع النشاط</label>
                    <select value={eventType} onChange={(e) => setEventType(e.target.value as any)} className="input-field text-sm py-2 mt-1.5 w-full">
                      <option value="دينية">مناسبة دينية</option>
                      <option value="اجتماعية">نشاط اجتماعي</option>
                      <option value="مسابقة">مسابقة قرآنية</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-xs">المكان / القاعة</label>
                    <input value={location} onChange={(e) => setLocation(e.target.value)}
                      placeholder="مثال: المسجد الكبير"
                      className="input-field text-sm py-2 mt-1.5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-xs">الجمهور المستهدف</label>
                    <input value={audience} onChange={(e) => setAudience(e.target.value)}
                      placeholder="مثال: جميع الطلاب"
                      className="input-field text-sm py-2 mt-1.5" />
                  </div>
                  <div>
                    <label className="label-xs">الميزانية (د.ج)</label>
                    <input type="number" value={budget} onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : "")}
                      placeholder="تقدير الميزانية" dir="ltr"
                      className="input-field text-sm py-2 mt-1.5" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 px-5 pb-5">
            <button onClick={onClose} className="btn-secondary flex-1 py-2.5 justify-center text-sm">إلغاء</button>
            <button onClick={handleSave} disabled={!title.trim() || saving}
              className="btn-primary flex-1 py-2.5 justify-center text-sm disabled:opacity-40">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> حفظ...</> : <><CheckCircle2 className="w-4 h-4" /> حفظ الاجتماع</>}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function MeetingCard({ meeting, onDelete }: {
  meeting: Meeting;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isUpcoming = meeting.status === "upcoming";
  const isEvent = meeting.type === 'event';

  const handlePrint = () => {
    const printContent = `
      <html dir="rtl" lang="ar">
        <head>
          <title>${isEvent ? 'تقرير المناسبة' : 'محضر اجتماع'} - ${meeting.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 40px; color: #111827; }
            .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: 900; margin: 0; color: #4338ca; }
            .date { font-size: 14px; color: #6b7280; margin-top: 5px; }
            .section { font-weight: 700; font-size: 18px; margin-top: 30px; margin-bottom: 15px; color: #374151; border-bottom: 1px solid #f3f4f6; padding-bottom: 5px; }
            .item { background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 10px; }
            .item-title { font-weight: bold; font-size: 16px; margin: 0 0 5px 0; color: #1f2937; }
            .meta { font-size: 12px; color: #6b7280; display: block; margin-top: 5px; }
            .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
            .info-box { background: #f3f4f6; padding: 15px; border-radius: 8px; }
            .info-label { font-size: 12px; color: #6b7280; margin-bottom: 5px; }
            .info-value { font-weight: bold; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${isEvent ? 'تقرير وتفاصيل النشاط' : 'محضر اجتماع رسمي'}</h1>
            <p class="date">${new Date(meeting.date).toLocaleDateString("ar-DZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} | ${meeting.title}</p>
          </div>

          ${isEvent ? `
            <div class="grid-info">
              <div class="info-box"><div class="info-label">نوع النشاط</div><div class="info-value">${meeting.eventType || '-'}</div></div>
              <div class="info-box"><div class="info-label">المكان / القاعة</div><div class="info-value">${meeting.location || '-'}</div></div>
              <div class="info-box"><div class="info-label">الميزانية</div><div class="info-value">${meeting.budget ? meeting.budget + ' د.ج' : 'غير محدد'}</div></div>
              <div class="info-box"><div class="info-label">الجمهور المستهدف</div><div class="info-value">${meeting.targetAudience || '-'}</div></div>
            </div>
          ` : `
            ${meeting.topics && meeting.topics.length > 0 ? `
              <h2 class="section">محاور الاجتماع والقرارات</h2>
              ${meeting.topics.map((t, i) => `
                <div class="item">
                  <h3 class="item-title">${i + 1}. ${t.topic} ${t.isFeatured ? '⭐' : ''}</h3>
                  ${t.speaker ? `<span class="meta">المُتحدث: ${t.speaker}</span>` : ''}
                  ${t.solutions ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #047857; font-weight: bold;">القرار: ${t.solutions}</p>` : ''}
                </div>
              `).join('')}
            ` : '<p>لا توجد محاور مسجلة.</p>'}
            ${meeting.foodProvided ? `<p style="margin-top: 20px; font-weight: bold;">ملاحظة: ${meeting.foodDetails || 'تم توفير ضيافة'}</p>` : ''}
          `}
          
          <div style="margin-top: 50px; text-align: left; font-size: 12px; color: #9ca3af;">
            طُبع من منصة فرسان القرآن بتاريخ ${new Date().toLocaleDateString('ar-DZ')}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border-2 overflow-hidden hover:shadow-md transition-shadow ${
        isUpcoming 
          ? (isEvent ? "border-emerald-200" : "border-indigo-200") 
          : "border-[var(--color-border)]"
      }`}>
      {/* شريط الحالة */}
      <div className={`h-1.5 ${isUpcoming ? (isEvent ? "bg-gradient-to-l from-emerald-500 to-teal-500" : "bg-gradient-to-l from-indigo-500 to-purple-500") : "bg-gray-200"}`} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* أيقونة */}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            isUpcoming ? (isEvent ? "bg-emerald-100" : "bg-indigo-100") : "bg-gray-100"
          }`}>
            {isEvent ? (
              <Star className={`w-5 h-5 ${isUpcoming ? "text-emerald-600" : "text-gray-500"}`} />
            ) : (
              <Calendar className={`w-5 h-5 ${isUpcoming ? "text-indigo-600" : "text-gray-500"}`} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black text-gray-900">{meeting.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-gray-500">
                📅 {new Date(meeting.date).toLocaleDateString("ar-DZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
              {!isEvent && meeting.foodProvided && <span className="text-xs text-amber-600 font-bold">🍽️ وليمة</span>}
              {isEvent && meeting.location && <span className="text-xs text-emerald-600 font-bold">📍 {meeting.location}</span>}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
              isUpcoming 
                ? (isEvent ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700") 
                : "bg-gray-100 text-gray-600"
            }`}>
              {isUpcoming ? "قادم" : "مكتمل"}
            </span>
            <button onClick={handlePrint}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              title="طباعة">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            </button>
            <button onClick={() => setExpanded(!expanded)}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
            <button onClick={() => { if (confirm("حذف؟")) onDelete(meeting.id); }}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ملخص المواضيع للموعد أو ملخص للمناسبة */}
        {!isEvent ? (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs font-bold text-gray-400">
              {meeting.topics?.length || 0} {(meeting.topics?.length || 0) === 1 ? "موضوع" : "مواضيع"}
            </span>
            {meeting.topics && meeting.topics.filter((t) => t.isFeatured).length > 0 && (
              <span className="text-xs font-bold text-amber-600">⭐ {meeting.topics.filter((t) => t.isFeatured).length} محوري</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-3">
             <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
               {meeting.eventType}
             </span>
             {meeting.budget && (
               <span className="text-xs font-bold text-gray-500 border px-2 py-0.5 rounded-md">
                 الميزانية: {meeting.budget} د.ج
               </span>
             )}
          </div>
        )}

        {/* تفاصيل موسّعة */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                {isEvent ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-400 font-bold mb-1">الجمهور المستهدف</p>
                      <p className="text-sm font-black text-gray-700">{meeting.targetAudience || '-'}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {meeting.topics?.map((t, i) => (
                      <div key={i} className={`p-3 rounded-xl ${t.isFeatured ? "bg-amber-50 border border-amber-100" : "bg-gray-50"}`}>
                        <p className={`text-sm font-black ${t.isFeatured ? "text-amber-800" : "text-gray-800"}`}>
                          {t.isFeatured ? "⭐ " : ""}{t.topic}
                        </p>
                        {t.speaker && <p className="text-xs text-gray-500 mt-0.5">👤 {t.speaker}</p>}
                        {t.solutions && (
                          <div className="mt-2 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-emerald-700 font-medium">{t.solutions}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    {meeting.foodProvided && meeting.foodDetails && (
                      <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-xl">
                        <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                        <p className="text-xs text-amber-700 font-medium">{meeting.foodDetails}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

function MeetingsPage() {
  const { user, school } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"الكل" | "upcoming" | "completed">("الكل");
  const [activeTab, setActiveTab] = useState<'meeting' | 'event'>('meeting');

  const load = useCallback(async () => {
    if (!school?.id) return;
    setLoading(true);
    const db = getDB();
    const all = await db.meetings.where("schoolId").equals(school.id).toArray();
    all.sort((a, b) => b.date.localeCompare(a.date));
    setMeetings(all);
    setLoading(false);
  }, [school?.id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    const db = getDB();
    await db.meetings.delete(id);
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  };

  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      const matchSearch = !search || m.title.includes(search);
      const matchStatus = filterStatus === "الكل" || m.status === filterStatus;
      const matchType = (m.type || 'meeting') === activeTab;
      return matchSearch && matchStatus && matchType;
    });
  }, [meetings, search, filterStatus, activeTab]);

  const stats = {
    total: filtered.length,
    upcoming: filtered.filter((m) => m.status === "upcoming").length,
    completed: filtered.filter((m) => m.status === "completed").length,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>نظام الاجتماعات والمناسبات</h1>
          <p className="text-xs text-gray-400 mt-0.5">جدولة وتنظيم نشاطات وأحداث المدرسة وإصدار التقارير للمشايخ</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          {school && <LivePresence roomId={`meetings_${school.id}`} isTyping={showModal} />}
          <button onClick={() => setShowModal(true)} className="btn-primary py-2.5 text-sm shrink-0 whitespace-nowrap hidden sm:flex">
            <Plus className="w-4 h-4" /> {activeTab === 'meeting' ? 'اجتماع جديد' : 'مناسبة جديدة'}
          </button>
        </div>
      </div>
      
      {/* Mobile add button (since we hid it in header for mobile) */}
      <div className="sm:hidden w-full">
         <button onClick={() => setShowModal(true)} className="btn-primary w-full py-2.5 text-sm justify-center">
            <Plus className="w-4 h-4" /> {activeTab === 'meeting' ? 'اجتماع جديد' : 'مناسبة جديدة'}
         </button>
      </div>

      {/* Tabs Layout */}
      <div className="flex items-center gap-1 bg-white border border-[var(--color-border)] p-1 rounded-2xl w-full max-w-sm mb-4">
        <button
          onClick={() => setActiveTab('meeting')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'meeting' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" /> الاجتماعات
        </button>
        <button
          onClick={() => setActiveTab('event')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'event' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Star className="w-4 h-4" /> المناسبات والنشاطات
        </button>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "إجمالي", value: stats.total, color: "text-gray-700", bg: "bg-gray-50" },
          { label: "قادم", value: stats.upcoming, color: "text-indigo-700", bg: "bg-indigo-50" },
          { label: "مكتمل", value: stats.completed, color: "text-emerald-700", bg: "bg-emerald-50" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <p className={`text-2xl font-black ${color}`} style={{ fontFamily: "var(--font-headline)" }}>{value}</p>
            <p className={`text-xs font-medium ${color} opacity-70`}>{label}</p>
          </div>
        ))}
      </div>

      {/* فلاتر */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..."
            className="w-full h-10 border border-gray-200 rounded-xl pr-10 pl-4 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 bg-white" />
        </div>
        {(["الكل", "upcoming", "completed"] as const).map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              filterStatus === s
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
            }`}>
            {s === "الكل" ? "الكل" : s === "upcoming" ? "القادمة" : "المكتملة"}
          </button>
        ))}
      </div>

      {/* القائمة */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          {activeTab === 'event' ? <Star className="w-12 h-12 text-emerald-200 mx-auto mb-3" /> : <Calendar className="w-12 h-12 text-indigo-200 mx-auto mb-3" />}
          <p className="text-gray-400 font-medium">لا توجد {activeTab === 'event' ? 'مناسبات' : 'اجتماعات'} مسجلة لتطابق بحثك.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => <MeetingCard key={m.id} meeting={m} onDelete={handleDelete} />)}
        </div>
      )}

      {showModal && school && user && (
        <MeetingModal
          schoolId={school.id}
          userId={user.id}
          initialType={activeTab}
          onSave={(m) => setMeetings((prev) => [m, ...prev])}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ── Guard wrapper (auto-generated) ──
export default function MeetingsPagePage() {
  return (
    <SchoolGuard>
      <MeetingsPage />
    </SchoolGuard>
  );
}
