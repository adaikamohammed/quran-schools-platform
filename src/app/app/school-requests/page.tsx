"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, CheckCircle2, XCircle, Clock, Eye,
  Building2, Mail, Phone, MapPin, User, Key, AlertTriangle, X
} from "lucide-react";

const supabase = createClient();

// ─── Modal قبول الطلب ────────────────────────────────────
function ApproveModal({
  req,
  onApprove,
  onClose,
}: {
  req: any;
  onApprove: (password: string) => Promise<void>;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
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
  const [approvingReq, setApprovingReq] = useState<any | null>(null);

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

  const filtered = requests.filter(r => filter === "all" || r.status === filter);
  const counts = {
    all: requests.length,
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
    if (!confirm("هل أنت متأكد من رفض هذا الطلب؟")) return;
    await fetch("/api/schools/approve", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id }),
    });
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

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["pending", "all", "approved", "rejected"] as const).map((key) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              filter === key
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
            }`}>
            {key === "all" ? "الكل" : key === "pending" ? "قيد المراجعة" : key === "approved" ? "المقبولة" : "المرفوضة"}
            <span className="mr-1.5 bg-white/20 text-inherit px-1.5 py-0.5 rounded-md text-[10px]">
              {counts[key]}
            </span>
          </button>
        ))}
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
          {filtered.map((req) => (
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
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 pr-1">
                    <p className="flex items-center gap-1.5"><User className="w-3 h-3" /> {req.director_name}</p>
                    <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {req.email}</p>
                    {req.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {req.phone}</p>}
                    {req.city && <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {req.city}، {req.country}</p>}
                  </div>
                  {req.notes && (
                    <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">{req.notes}</p>
                  )}
                  <p className="text-[10px] text-gray-400">{new Date(req.created_at).toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>

                {req.status === "pending" && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => setApprovingReq(req)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" /> قبول
                    </button>
                    <button onClick={() => handleReject(req.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors border border-red-100">
                      <XCircle className="w-3.5 h-3.5" /> رفض
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {approvingReq && (
        <ApproveModal
          req={approvingReq}
          onApprove={(pw) => handleApprove(approvingReq, pw)}
          onClose={() => setApprovingReq(null)}
        />
      )}
    </div>
  );
}
