"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, CheckCircle2, XCircle, Clock, Eye,
  Building2, Mail, Phone, MapPin, User, Key, AlertTriangle, X,
  MessageCircle, Loader2, Calendar, Shield
} from "lucide-react";

const supabase = createClient();

// ─── Modal قبول الطلب ────────────────────────────────────
function ApproveModal({
  req,
  onApprove,
  onClose,
}: {
  req: { school_name: string; director_name: string; email: string; extraData?: any };
  onApprove: (password: string) => Promise<void>;
  onClose: () => void;
}) {
  const storedPassword = req.extraData?.password || "";
  const [password, setPassword] = useState(storedPassword);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (!password || password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onApprove(password);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div key="req-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        key="req-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-l from-emerald-600 to-emerald-800 text-white p-5 flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm">✅ قبول طلب التسجيل</h3>
              <p className="text-emerald-200 text-xs mt-0.5">{req.school_name}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="bg-gray-50 rounded-2xl p-4 text-sm space-y-2">
              <p><span className="text-gray-500">المدير:</span> <strong>{req.director_name}</strong></p>
              <p><span className="text-gray-500">البريد:</span> <strong>{req.email}</strong></p>
            </div>
            {storedPassword ? (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm">
                <p className="text-blue-800 font-bold flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-blue-600" />
                  كلمة المرور جاهزة
                </p>
                <p className="text-blue-700/80 text-xs">
                  المدير قام بتعيين كلمة المرور أثناء طلب التسجيل. سيتم استخدامها لإنشاء الحساب وتفعيله.
                </p>
              </div>
            ) : (
              <div>
                <label className="label-xs flex items-center gap-1.5 mb-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  كلمة المرور الأولية للمدير <span className="text-red-500">*</span>
                </label>
                <input type="text" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. School@2024"
                  className="input-field py-2.5 text-sm font-mono" dir="ltr" />
                <p className="text-xs text-gray-400 mt-1">أخبر المدير بكلمة المرور هذه حتى يتمكن من تسجيل الدخول وتعديلها.</p>
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {error}
              </div>
            )}
          </div>
          <div className="flex gap-3 px-5 pb-5">
            <button onClick={onClose} className="btn-secondary flex-1 py-3 justify-center text-sm">إلغاء</button>
            <button onClick={handle} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-colors disabled:opacity-50">
              {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> قبول وإنشاء الحساب</>}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Modal رفض الطلب ────────────────────────────────────
function RejectModal({
  req,
  onReject,
  onClose,
}: {
  req: { id: string; school_name: string; director_name: string; };
  onReject: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    setLoading(true);
    setError("");
    try {
      await onReject(req.id);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div key="rej-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        key="rej-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center p-6 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8" />
          </div>
          <h3 className="font-black text-lg text-gray-900 mb-2">تأكيد الرفض</h3>
          <p className="text-sm text-gray-500 mb-6">هل أنت متأكد أنك تريد رفض طلب التسجيل من مدرسة <strong className="text-gray-800">{req.school_name}</strong>؟</p>
          
          {error && (
            <div className="p-3 mb-4 w-full bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="btn-secondary flex-1 py-3 justify-center text-sm">إلغاء</button>
            <button onClick={handle} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold shadow-md transition-colors disabled:opacity-50">
              {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "نعم، ارفض الطلب"}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول ✅",
  rejected: "مرفوض ❌",
};

export default function SchoolRequestsPage() {
  const { isSuperAdmin } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [filterCountry, setFilterCountry] = useState("الكل");
  const [filterDate, setFilterDate] = useState("الكل");
  const [approvingReq, setApprovingReq] = useState<any | null>(null);
  const [rejectingReq, setRejectingReq] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/schools/request");
    if (res.ok) {
      const { requests: data } = await res.json();
      setRequests(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = requests.filter(r => {
    const matchStatus = filter === "all" || r.status === filter;
    const matchCountry = filterCountry === "الكل" || r.country === filterCountry;
    
    let matchDate = true;
    if (filterDate === "هذا الشهر") {
      const thisMonth = new Date().getMonth();
      const thisYear = new Date().getFullYear();
      const d = new Date(r.created_at);
      matchDate = d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    } else if (filterDate === "الشهر الماضي") {
      const lastMonth = new Date().getMonth() - 1;
      const thisYear = new Date().getFullYear();
      const d = new Date(r.created_at);
      matchDate = d.getMonth() === (lastMonth < 0 ? 11 : lastMonth) && d.getFullYear() === (lastMonth < 0 ? thisYear - 1 : thisYear);
    }
    
    return matchStatus && matchCountry && matchDate;
  });

  const countries = Array.from(new Set(requests.map(r => r.country).filter(Boolean))).sort();

  const counts = {
    all: requests.filter(r => r.status).length,
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  const handleApprove = async (req: any, password: string) => {
    const res = await fetch("/api/schools/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: req.id, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    setApprovingReq(null);
    await load();
  };

  const handleReject = async (id: string) => {
    const res = await fetch("/api/schools/approve", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "فشل الرفض");
    }
    setRejectingReq(null);
    await load();
  };

  if (!isSuperAdmin) {
    return <div className="text-center py-20 text-red-500 font-bold">هذه الصفحة مخصصة للمشرف العام فقط.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
          <ClipboardList className="w-6 h-6 text-indigo-600" />
          طلبات التسجيل الواردة
        </h1>
        <p className="text-xs text-gray-500 mt-1">{counts.pending} طلب ينتظر المراجعة</p>
      </div>

      {/* Filters and Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-4 justify-between shadow-sm">
        <div className="flex gap-2 flex-wrap">
          {(["pending", "all", "approved", "rejected"] as const).map((key) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                filter === key
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}>
              {key === "all" ? "الكل" : key === "pending" ? "قيد المراجعة" : key === "approved" ? "المقبولة" : "المرفوضة"}
              <span className="mr-1.5 opacity-80 text-inherit px-1.5 py-0.5 rounded-md text-[10px]">
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 bg-gray-50 focus:outline-none focus:border-indigo-500">
            <option value="الكل">كل البلدان</option>
            {countries.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
          </select>
          <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 bg-gray-50 focus:outline-none focus:border-indigo-500">
            <option value="الكل">كل الأوقات</option>
            <option value="هذا الشهر">هذا الشهر</option>
            <option value="الشهر الماضي">الشهر الماضي</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-bold">لا توجد طلبات في هذه الفئة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            let extraData: any = {};
            let parsedNotes = req.notes;
            if (req.notes?.startsWith("{")) {
              try {
                extraData = JSON.parse(req.notes);
                parsedNotes = extraData.notes || "";
              } catch (e) {}
            }

            return (
              <motion.div key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black shrink-0">
                      {req.school_name[0]}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-sm">{req.school_name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block mt-0.5 ${STATUS_COLORS[req.status]}`}>
                        {STATUS_LABELS[req.status]}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 pr-1 mb-2">
                    <p className="flex items-center gap-1.5"><User className="w-3 h-3" /> {req.director_name}</p>
                    <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {req.email}</p>
                    {req.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {req.phone}</p>}
                    {req.city && <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {req.city} {req.country && `، ${req.country}`}</p>}
                  </div>
                  
                  {/* Extra Data Render */}
                  {(extraData.schoolType || extraData.expectedStudents || extraData.establishmentYear) && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {extraData.schoolType && <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-[10px] font-bold border border-indigo-100">{extraData.schoolType}</span>}
                      {extraData.expectedStudents && <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-md text-[10px] font-bold border border-teal-100">الطلاب: {extraData.expectedStudents}</span>}
                      {extraData.establishmentYear && <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-[10px] font-bold border border-amber-100">تأسيس: {extraData.establishmentYear}</span>}
                    </div>
                  )}

                  {parsedNotes && (
                    <p className="text-xs text-gray-500 bg-amber-50/50 border border-amber-100 rounded-xl px-3 py-2 leading-relaxed">
                      💬 <span className="font-medium text-gray-700">ملاحظة المُرسل:</span> {parsedNotes}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-2"><Calendar className="w-3 h-3 inline mr-1 opacity-70" /> {new Date(req.created_at).toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>

                <div className="flex flex-col gap-2 shrink-0 w-32">
                  {req.status === "pending" && (
                    <>
                      <button onClick={() => setApprovingReq({ ...req, extraData })}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" /> قبول
                      </button>
                      <button onClick={() => setRejectingReq(req)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors border border-red-100">
                        <XCircle className="w-3.5 h-3.5" /> رفض
                      </button>
                    </>
                  )}
                  
                  {req.status !== "pending" && (
                    <a 
                      href={`mailto:${req.email}?subject=${encodeURIComponent(req.status === 'approved' ? 'تفعيل حساب مدرستكم في منصة فرسان القرآن' : 'بخصوص طلب تسجيلكم في منصة فرسان القرآن')}&body=${encodeURIComponent(req.status === 'approved' ? `السلام عليكم ورحمة الله وبركاته،\nالأستاذ الفاضل ${req.director_name}،\n\nنبارك لكم انضمام مدرستكم (${req.school_name}) إلى منصة فرسان القرآن.\n\nبيانات الدخول الأولية الخاصة بكم:\nالبريد الإلكتروني: ${req.email}\nرابط المنصة: https://quran-schools.com\n\nيرجى التواصل معنا حال الحاجة لأي مساعدة.\nبالتوفيق.` : `السلام عليكم ورحمة الله وبركاته،\nالأستاذ الفاضل ${req.director_name}،\n\nنشكر لكم اهتمامكم بمنصة فرسان القرآن، ولكن نعتذر عن قبول طلب تسجيل مدرستكم (${req.school_name}) في الوقت الحالي.\n\nللاستفسار يرجى الرد على هذا البريد.`)}`}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 text-[10px] font-bold transition-colors"
                      target="_blank" rel="noopener noreferrer"
                    >
                      <Mail className="w-3.5 h-3.5" /> إرسال بريد
                    </a>
                  )}
                  {req.status !== "pending" && req.phone && (
                    <a 
                      href={`https://wa.me/${req.phone.replace(/\D/g, '')}?text=${encodeURIComponent(req.status === 'approved' ? `السلام عليكم، تم الموافقة على انضمام مدرسة (${req.school_name}) لمنصة فرسان القرآن ✅.` : `السلام عليكم، نعتذر عن قبول طلب انضمام مدرسة (${req.school_name}).`)}`}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 border border-green-100 text-[10px] font-bold transition-colors"
                      target="_blank" rel="noopener noreferrer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> واتساب
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      )}

      {approvingReq && (
        <ApproveModal
          req={approvingReq}
          onApprove={(pw) => handleApprove(approvingReq, pw)}
          onClose={() => setApprovingReq(null)}
        />
      )}
      {rejectingReq && (
        <RejectModal
          req={rejectingReq}
          onReject={handleReject}
          onClose={() => setRejectingReq(null)}
        />
      )}
    </div>
  );
}
