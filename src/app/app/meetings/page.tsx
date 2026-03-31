"use client";

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

// ─── Modal اجتماع جديد ───────────────────────────────────

function MeetingModal({ schoolId, userId, onSave, onClose }: {
  schoolId: string;
  userId: string;
  onSave: (m: Meeting) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [foodProvided, setFoodProvided] = useState(false);
  const [foodDetails, setFoodDetails] = useState("");
  const [topics, setTopics] = useState<MeetingTopic[]>([
    { topic: "", speaker: "", solutions: "", isFeatured: false }
  ]);
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
      title: title.trim(),
      date,
      timestamp: now,
      attendance: {},
      foodProvided,
      foodDetails: foodProvided ? foodDetails : undefined,
      topics: topics.filter((t) => t.topic.trim()),
      status: new Date(date) > new Date() ? "upcoming" : "completed",
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    const db = getDB();
    await db.meetings.put(meeting);
    onSave(meeting);
    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 bg-gradient-to-l from-indigo-600 to-purple-700 text-white">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <h3 className="font-black text-sm" style={{ fontFamily: "var(--font-headline)" }}>اجتماع جديد</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
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

            {/* المأكل */}
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

            {/* المواضيع */}
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

// ─── بطاقة الاجتماع ──────────────────────────────────────

function MeetingCard({ meeting, onDelete }: {
  meeting: Meeting;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isUpcoming = meeting.status === "upcoming";

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border-2 overflow-hidden hover:shadow-md transition-shadow ${
        isUpcoming ? "border-indigo-200" : "border-[var(--color-border)]"
      }`}>
      {/* شريط الحالة */}
      <div className={`h-1.5 ${isUpcoming ? "bg-gradient-to-l from-indigo-500 to-purple-500" : "bg-gray-200"}`} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* أيقونة */}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            isUpcoming ? "bg-indigo-100" : "bg-gray-100"
          }`}>
            <Calendar className={`w-5 h-5 ${isUpcoming ? "text-indigo-600" : "text-gray-500"}`} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black text-gray-900">{meeting.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-gray-500">
                📅 {new Date(meeting.date).toLocaleDateString("ar-DZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
              {meeting.foodProvided && <span className="text-xs text-amber-600 font-bold">🍽️ وليمة</span>}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
              isUpcoming ? "bg-indigo-50 text-indigo-700" : "bg-gray-100 text-gray-600"
            }`}>
              {isUpcoming ? "قادم" : "مكتمل"}
            </span>
            <button onClick={() => setExpanded(!expanded)}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
            <button onClick={() => { if (confirm("حذف الاجتماع؟")) onDelete(meeting.id); }}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ملخص المواضيع */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs font-bold text-gray-400">
            {meeting.topics.length} {meeting.topics.length === 1 ? "موضوع" : "مواضيع"}
          </span>
          {meeting.topics.filter((t) => t.isFeatured).length > 0 && (
            <span className="text-xs font-bold text-amber-600">⭐ {meeting.topics.filter((t) => t.isFeatured).length} محوري</span>
          )}
        </div>

        {/* تفاصيل موسّعة */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                {meeting.topics.map((t, i) => (
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

export default function MeetingsPage() {
  const { user, school } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"الكل" | "upcoming" | "completed">("الكل");

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
      return matchSearch && matchStatus;
    });
  }, [meetings, search, filterStatus]);

  const stats = {
    total: meetings.length,
    upcoming: meetings.filter((m) => m.status === "upcoming").length,
    completed: meetings.filter((m) => m.status === "completed").length,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>الاجتماعات</h1>
          <p className="text-xs text-gray-400 mt-0.5">{stats.total} اجتماع · {stats.upcoming} قادم</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary py-2.5 text-sm shrink-0">
          <Plus className="w-4 h-4" /> اجتماع جديد
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
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">{meetings.length === 0 ? "لا توجد اجتماعات بعد" : "لا توجد نتائج"}</p>
          {meetings.length === 0 && (
            <button onClick={() => setShowModal(true)} className="btn-primary py-2.5 text-sm mx-auto mt-4">
              <Plus className="w-4 h-4" /> إنشاء اجتماع
            </button>
          )}
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
          onSave={(m) => setMeetings((prev) => [m, ...prev])}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
