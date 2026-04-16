"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import { createClient } from "@/lib/supabase/client";
import {
  Megaphone,
  Image as ImageIcon,
  Send,
  Trash2,
  CheckCircle2,
  X,
  RefreshCw,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { SystemNotification } from "@/lib/types";

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

function SendNotificationPage() {
  const { user, school, role } = useAuth();
  const supabase = createClient();
  const db = getDB();

  const isSuperAdmin = role === "super_admin";

  // Form State
  const [targetType, setTargetType] = useState<"all" | "specific">("all");
  const [notifType, setNotifType] = useState<"default" | "info" | "warning" | "critical">("default");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string>("");

  // Targets loading & selection
  const [targets, setTargets] = useState<{ 
    id: string; 
    name: string; 
    email: string; 
    status: string; 
    role?: string; 
    joinDate?: string; 
    gender?: string;
    stats?: any;
    principalName?: string;
    location?: string;
  }[]>([]);
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // History
  const [history, setHistory] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState<"send" | "history">("send");

  // Modules for Quill Editor
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  useEffect(() => {
    if (!user) return;
    loadTargets();
    loadHistory();
  }, [user]);

  const loadTargets = async () => {
    try {
      if (isSuperAdmin) {
        // Super admin selects schools - fetch full analytics data for detailed cards
        const res = await fetch("/api/admin/schools-analytics");
        if (res.ok) {
           const analyticsInfo = await res.json();
           setTargets(
             analyticsInfo.map((a: any) => ({
                id: a.school_og_data.id,
                name: a.school_og_data.name,
                email: a.principalEmail || "—",
                status: a.school_og_data.status || "نشطة",
                principalName: a.principalName,
                location: [a.country, a.school_og_data.city].filter(Boolean).join(" - "),
                stats: {
                  students: a.studentCount,
                  teachers: a.teacherCount,
                  groups: a.groupCount,
                  engagementRate: a.engagementRate,
                  lastActivity: a.lastActivity,
                  createdAt: a.createdAt
                }
             }))
           );
        }
      } else if (school?.id) {
        // Principal selects teachers/users
        const users = await db.users
          .where("schoolId")
          .equals(school.id)
          .and((u) => u.role !== "student" && u.id !== user.id) // exclude self
          .toArray();
        setTargets(
          users.map((u) => ({
            id: u.id,
            name: u.displayName,
            email: u.email || "—",
            status: u.isActive ? "نشط" : "موقوف",
            role: u.role,
            joinDate: u.joinDate,
            gender: u.gender,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading targets:", error);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      if (isSuperAdmin) {
        const { data } = await supabase
          .from("system_notifications")
          .select("*")
          .eq("sender_id", user?.id)
          .order("created_at", { ascending: false });

        if (data) {
          // Convert from snake_case to camelCase
          const mapped = data.map((d: any) => ({
            ...d,
            schoolId: d.school_id,
            senderId: d.sender_id,
            senderName: d.sender_name,
            imageUrl: d.image_url,
            targetType: d.target_type,
            targetIds: d.target_ids,
            createdAt: d.created_at,
          }));
          setHistory(mapped);
        }
      } else {
        // For principals, fetch from Dexie synced data
        if (school?.id) {
          const localHistory = await db.systemNotifications
            .where("schoolId")
            .equals(school.id)
            .reverse()
            .sortBy("createdAt");
          
          setHistory(localHistory.filter(h => h.senderId === user?.id));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // مقبض اختيار الصور
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 500 * 1024) {
        alert("حجم الصورة يجب أن لا يتجاوز 500 كيلوبايت");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      alert("الرجاء إدخال العنوان والرسالة.");
      return;
    }
    if (targetType === "specific" && selectedTargetIds.length === 0) {
      alert("الرجاء تحديد المستقبلين.");
      return;
    }
    setSending(true);

    try {
      const newId = crypto.randomUUID();
      const payload = {
        id: newId,
        school_id: isSuperAdmin ? null : school?.id,
        sender_id: user?.id,
        sender_name: user?.displayName || "الإدارة",
        type: notifType,
        title: title.trim(),
        message: message,
        image_url: imageBase64 || null,
        target_type: targetType,
        target_ids: selectedTargetIds,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 1. إرسال إلى Supabase مباشرة
      const { error } = await supabase.from("system_notifications").insert(payload);
      if (error) throw error;

      // 2. تحديث Dexie إذا لم يكن أدمن خارق
      if (!isSuperAdmin) {
        await db.systemNotifications.put({
          id: payload.id,
          schoolId: payload.school_id,
          senderId: payload.sender_id,
          senderName: payload.sender_name,
          type: payload.type as any,
          title: payload.title,
          message: payload.message,
          imageUrl: payload.image_url,
          targetType: payload.target_type as any,
          targetIds: payload.target_ids,
          createdAt: payload.created_at,
          updatedAt: payload.updated_at,
        });
      }

      setSuccessMsg("تم إرسال الإشعار بنجاح!");
      setTitle("");
      setMessage("");
      setTargetType("all");
      setSelectedTargetIds([]);
      setImageFile(null);
      setImageBase64("");
      
      loadHistory();
      
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e: any) {
      console.error(e);
      alert("حدث خطأ أثناء الإرسال: " + e.message);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإشعار؟")) return;
    try {
      await supabase.from("system_notifications").delete().eq("id", id);
      if (!isSuperAdmin) {
        await db.systemNotifications.delete(id);
      }
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (e) {
      console.error("Delete error", e);
    }
  };

  const filteredTargets = targets.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleTarget = (id: string) => {
    setSelectedTargetIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAllTargets = () => {
    if (selectedTargetIds.length === filteredTargets.length) {
      setSelectedTargetIds([]);
    } else {
      setSelectedTargetIds(filteredTargets.map((t) => t.id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 fade-in px-4 lg:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
            <Megaphone className="w-6 h-6 text-[var(--color-primary)]" />
            إرسال إشعارات
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            أرسل تنبيهات إدارية ورسائل غنية {isSuperAdmin ? "تصل لمدراء المدارس" : "تصل للمعلمين وأفراد المدرسة"}
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("send")}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "send" ? "bg-white shadow text-gray-900" : "text-gray-500"
            }`}
          >
            تكوين الرسالة
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "history" ? "bg-white shadow text-[var(--color-primary)]" : "text-gray-500"
            }`}
          >
            سجل الإرسال
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold">
          <CheckCircle2 className="w-5 h-5" />
          {successMsg}
        </div>
      )}

      {activeTab === "send" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Side */}
          <div className="lg:col-span-7 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">اختر المستهدفين *</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="w-full h-11 px-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:border-[var(--color-primary)] outline-none"
              >
                <option value="all">الكل (إرسال للجميع)</option>
                <option value="specific">مستخدمين أو مدارس محددة</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">نوع الإشعار *</label>
              <select
                value={notifType}
                onChange={(e) => setNotifType(e.target.value as any)}
                className="w-full h-11 px-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:border-[var(--color-primary)] outline-none"
              >
                <option value="default">افتراضي 📌</option>
                <option value="info">معلومة 💡</option>
                <option value="warning">تحذير ⚠️</option>
                <option value="critical">عاجل 🔴</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">العنوان *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="اكتب عنوان الإشعار"
                className="w-full h-11 px-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:bg-white focus:border-[var(--color-primary)] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الرسالة *</label>
              <div className="bg-white" dir="rtl">
                <ReactQuill
                  theme="snow"
                  value={message}
                  onChange={setMessage}
                  modules={modules}
                  placeholder="اكتب رسالتك المنسقة هنا..."
                  className="rounded-xl overflow-hidden [&_.ql-editor]:min-h-[150px] [&_.ql-editor]:text-base [&_.ql-toolbar]:rounded-t-xl [&_.ql-container]:rounded-b-xl border-gray-200"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer w-max group">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <ImageIcon className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-sm font-bold text-gray-700">إرفاق صورة بحد أقصى (500KB)</span>
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imageBase64 && (
                <div className="relative inline-block mt-3 border rounded-xl overflow-hidden shadow-sm">
                  <img src={imageBase64} alt="Preview" className="h-24 w-auto object-cover" />
                  <button
                    onClick={() => { setImageBase64(""); setImageFile(null); }}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-lg text-white flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleSend}
                disabled={sending}
                className="h-11 px-8 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-black text-sm flex items-center gap-2 disabled:opacity-50 transition-all shadow-md shadow-[var(--color-primary)]/20"
              >
                {sending ? "جاري الإرسال..." : "إرسال الإشعار"}
                {!sending && <Send className="w-4 h-4 mr-1" />}
              </button>
            </div>
          </div>

          {/* Targets Table Side */}
          {targetType === "specific" && (
            <div className="lg:col-span-5 relative">
              <div className="sticky top-6 bg-white border border-[var(--color-primary)] rounded-3xl p-5 shadow-sm shadow-[var(--color-primary)]/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-[var(--color-primary)]">
                    حدد المستهدفين ({selectedTargetIds.length})
                  </h3>
                  <button
                    onClick={toggleAllTargets}
                    className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg hover:bg-gray-200"
                  >
                    تحديد الكل
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم أو البريد..."
                    className="w-full h-10 pr-9 pl-3 border border-gray-200 rounded-xl bg-gray-50 text-xs focus:bg-white focus:border-[var(--color-primary)] outline-none transition-all"
                  />
                </div>

                {isSuperAdmin ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-[500px] overflow-y-auto custom-scrollbar content-start pb-4">
                    {filteredTargets.map((t) => (
                      <label key={t.id} className={`relative flex flex-col justify-between border-2 rounded-2xl p-5 cursor-pointer transition-all bg-white hover:shadow-lg ${
                        selectedTargetIds.includes(t.id) ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20" : "border-gray-100 hover:border-indigo-200"
                      }`}>
                        <input
                          type="checkbox"
                          checked={selectedTargetIds.includes(t.id)}
                          onChange={() => toggleTarget(t.id)}
                          className="peer hidden"
                        />
                        
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black shadow-inner shrink-0 text-xl" style={{ fontFamily: "var(--font-headline)" }}>
                                {t.name.substring(0, 1).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-base font-black text-gray-900 truncate" title={t.name}>{t.name}</h3>
                                <span className="text-xs text-gray-400 font-bold">{t.location || "الجزائر"}</span>
                              </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                              selectedTargetIds.includes(t.id) ? "border-[var(--color-primary)] bg-[var(--color-primary)]" : "border-gray-300"
                            }`}>
                                <CheckCircle2 className={`w-4 h-4 ${selectedTargetIds.includes(t.id) ? "text-white opacity-100" : "opacity-0"}`} />
                            </div>
                          </div>
                          
                          <div className="space-y-2 mt-4 text-xs text-gray-600 font-medium">
                            <div className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                              <p className="flex justify-between items-center">
                                <span className="flex items-center gap-1.5 opacity-70">المدير:</span> 
                                <span className="text-gray-800 font-bold truncate">{t.principalName || "غير محدد"}</span>
                              </p>
                              <p className="flex justify-between items-center">
                                <span className="flex items-center gap-1.5 opacity-70">البريد:</span> 
                                <span className="text-gray-800 font-bold truncate">{t.email || "-"}</span>
                              </p>
                            </div>
                            
                            {t.stats && (
                              <div className="grid grid-cols-4 gap-2 mt-3">
                                <div className="p-2 border border-indigo-50 bg-indigo-50/30 rounded-lg text-center">
                                  <p className="text-[9px] text-gray-500 mb-0.5">الطلاب</p>
                                  <p className="text-xs font-black text-indigo-700">{t.stats.students}</p>
                                </div>
                                <div className="p-2 border border-blue-50 bg-blue-50/30 rounded-lg text-center">
                                  <p className="text-[9px] text-gray-500 mb-0.5">المعلمين</p>
                                  <p className="text-xs font-black text-blue-700">{t.stats.teachers}</p>
                                </div>
                                <div className="p-2 border border-purple-50 bg-purple-50/30 rounded-lg text-center">
                                  <p className="text-[9px] text-gray-500 mb-0.5">الأفواج</p>
                                  <p className="text-xs font-black text-purple-700">{t.stats.groups}</p>
                                </div>
                                <div className="p-2 border border-emerald-50 bg-emerald-50/30 rounded-lg text-center">
                                  <p className="text-[9px] text-gray-500 mb-0.5">الالتزام</p>
                                  <p className={`text-xs font-black ${t.stats.engagementRate > 50 ? 'text-emerald-700' : 'text-amber-600'}`}>{t.stats.engagementRate}%</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {t.stats && (
                            <div className="mt-3 text-[10px] text-gray-400 flex items-center justify-between px-1">
                              <span>التسجيل: {t.stats.createdAt ? new Date(t.stats.createdAt).toLocaleDateString('ar-DZ') : '-'}</span>
                              <span>النشاط: {t.stats.lastActivity ? new Date(t.stats.lastActivity).toLocaleDateString('ar-DZ') : 'لا يوجد'}</span>
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                    {filteredTargets.length === 0 && (
                      <div className="col-span-2 p-10 text-center text-sm text-gray-400">
                        لا يوجد نتائج مطابقة
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-[400px] overflow-auto custom-scrollbar border border-gray-100 rounded-xl bg-white">
                    <table className="w-full text-right text-xs whitespace-nowrap">
                      <thead className="bg-[#fff0f5] text-gray-600 font-bold sticky top-0 z-10 border-b border-gray-100">
                        <tr>
                          <th className="py-3 px-3 w-10 text-center">تحديد</th>
                          <th className="py-3 px-3">الاسم</th>
                          <th className="py-3 px-3">البريد الإلكتروني</th>
                          <th className="py-3 px-3">النوع</th>
                          <th className="py-3 px-3">الحالة</th>
                          <th className="py-3 px-3">تاريخ التسجيل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredTargets.map((t) => (
                          <tr 
                            key={t.id} 
                            onClick={() => toggleTarget(t.id)}
                            className={`cursor-pointer transition-colors ${selectedTargetIds.includes(t.id) ? "bg-pink-50/50" : "hover:bg-gray-50/50"}`}
                          >
                            <td className="py-2.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                              <div className="relative inline-flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={selectedTargetIds.includes(t.id)}
                                  onChange={() => toggleTarget(t.id)}
                                  className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-md checked:border-[var(--color-primary)] checked:bg-[var(--color-primary)] transition-all cursor-pointer"
                                />
                                <CheckCircle2 className="w-3.5 h-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  {t.name.substring(0, 1).toUpperCase()}
                                </div>
                                <span className="font-bold text-gray-900">{t.name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-gray-500">{t.email}</td>
                            <td className="py-2.5 px-3">
                              <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded font-bold text-[10px]">
                                {t.role === 'teacher' ? 'معلم' : t.role === 'parent' ? 'ولي أمر' : t.role}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${t.status === "نشط" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-gray-400">
                              {t.joinDate ? new Date(t.joinDate).toLocaleDateString("ar-DZ") : "—"}
                            </td>
                          </tr>
                        ))}
                        {filteredTargets.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-sm text-gray-400">
                              لا يوجد نتائج مطابقة
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* History Side */
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-gray-900">سجل الإشعارات المرسلة</h2>
            <button onClick={loadHistory} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200" title="تحديث">
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-100">
                <tr>
                  <th className="py-4 px-4 rounded-tr-xl">العنوان</th>
                  <th className="py-4 px-4 w-1/3">الرسالة (مقتطف)</th>
                  <th className="py-4 px-4">صورة</th>
                  <th className="py-4 px-4">النوع</th>
                  <th className="py-4 px-4">الوجهة</th>
                  <th className="py-4 px-4">تاريخ الإرسال</th>
                  <th className="py-4 px-4 rounded-tl-xl w-16">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400">جاري التحميل...</td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400">لم تقم بإرسال أي إشعارات بعد.</td>
                  </tr>
                ) : (
                  history.map((h) => {
                    const snippet = h.message.replace(/<[^>]*>?/gm, '').substring(0, 50) + "...";
                    return (
                      <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-4 font-bold max-w-[200px] truncate" title={h.title}>{h.title}</td>
                        <td className="py-4 px-4 text-xs text-gray-500" title={h.message}>{snippet}</td>
                        <td className="py-4 px-4">
                          {h.imageUrl ? (
                            <img src={h.imageUrl} alt="img" className="w-10 h-10 object-cover rounded-lg border border-gray-200" />
                          ) : (
                            <span className="text-xs text-gray-400">لا يوجد</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            h.type === "critical" ? "bg-red-100 text-red-700" :
                            h.type === "warning" ? "bg-amber-100 text-amber-700" :
                            h.type === "info" ? "bg-blue-100 text-blue-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {h.type}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                            {h.targetType === "all" ? "الكل" : `محدد (${h.targetIds?.length || 0})`}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-gray-400">
                          {new Date(h.createdAt).toLocaleString("ar-DZ", {
                            year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
                          })}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleDeleteHistory(h.id)}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                            title="حذف الإشعار من السجل"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default SendNotificationPage;
