"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import type { Student, DailySession, Covenant, AppUser } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Calendar, CheckCircle, TrendingUp, AlertCircle, ShieldAlert,
  Search, ChevronDown, User, Star, Clock, ShieldOff, Bookmark, Users
} from "lucide-react";

export default function StudentHistoryPage() {
  const { user, school, isPrincipal } = useAuth();
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<DailySession[]>([]);

  // ─── تحميل الطلاب ───────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user?.id || !school?.id) return;
    setLoading(true);
    const db = getDB();
    
    let studs: Student[] = [];
    let allSessions: DailySession[] = [];

    if (isPrincipal || user.role === "super_admin") {
      const schoolTeachers = await db.users.where("schoolId").equals(school.id).filter(u => u.role === "teacher").toArray();
      setTeachers(schoolTeachers.sort((a,b) => a.displayName.localeCompare(b.displayName, "ar")));

      studs = await db.students.where("schoolId").equals(school.id).toArray();
      allSessions = await db.sessions.where("schoolId").equals(school.id).toArray();

      if (selectedTeacherId !== "all") {
        studs = studs.filter(s => s.teacherId === selectedTeacherId);
        allSessions = allSessions.filter(s => s.teacherId === selectedTeacherId);
      }
    } else {
      studs = await db.students.where("teacherId").equals(user.id).toArray();
      allSessions = await db.sessions.where("teacherId").equals(user.id).toArray();
    }
    
    studs.sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
    setStudents(studs);
    
    // ترتيب تنازلي حسب التاريخ
    allSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setSessions(allSessions);
    
    setLoading(false);
  }, [user?.id, school?.id, isPrincipal, selectedTeacherId]);

  useEffect(() => { loadData(); }, [loadData]);
  
  // اختيار تلقائي لأول طالب إذا لم يكن هناك تحديد
  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId) || null, [selectedStudentId, students]);

  // ─── بيانات الطالب المحددة ────────────────────────────
  const studentHistory = useMemo(() => {
    if (!selectedStudentId) return [];
    
    return sessions.map(session => {
      const record = session.records.find(r => r.studentId === selectedStudentId);
      if (!record && session.sessionType !== "يوم عطلة") return null;
      
      return {
        date: session.date,
        isHoliday: session.sessionType === "يوم عطلة",
        record: record || null
      };
    }).filter(item => item !== null) as { date: string; isHoliday: boolean; record: any }[];
  }, [selectedStudentId, sessions]);

  // ─── الإحصائيات ───────────────────────────────────────
  const stats = useMemo(() => {
    const validRecords = studentHistory.filter(h => h.record && !h.isHoliday).map(h => h.record);
    const presentCount = validRecords.filter(r => r.attendance === "حاضر").length;
    const lateCount = validRecords.filter(r => r.attendance === "متأخر").length;
    const absentCount = validRecords.filter(r => r.attendance === "غياب").length;
    const totalWorking = presentCount + lateCount + absentCount;
    const rate = totalWorking > 0 ? ((presentCount + lateCount) / totalWorking) * 100 : 0;
    
    return {
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      rate: Math.round(rate),
      total: totalWorking
    };
  }, [studentHistory]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* رأس الصفحة + تحديد الطالب */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
            <BarChart3 className="w-6 h-6 text-[var(--color-primary)]" />
            سجل الطالب التفصيلي
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            متابعة شاملة للحضور، التقييم، والسلوك، والعهود المسجلة
          </p>
        </div>
        
        <div className="w-full md:w-64">
          <select 
            className="input-field py-2.5 text-sm font-bold w-full"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            disabled={loading || students.length === 0}
          >
            {loading ? <option>جاري التحميل...</option> : students.length === 0 ? <option>لا يوجد طلاب</option> : null}
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── فلتر المعلم (للمدراء فقط) ─── */}
      {(isPrincipal || user?.role === "super_admin") && teachers.length > 0 && (
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <p className="text-sm font-bold text-gray-700">تصفح سجلات طلاب مُعلم:</p>
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

      {!loading && selectedStudent && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          
          {/* الإحصائيات */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
             <div className="bg-white border rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900">{stats.rate}%</p>
                <p className="text-xs font-bold text-gray-500">نسبة الحضور</p>
              </div>
            </div>
            <div className="bg-white border rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900">{stats.present}</p>
                <p className="text-xs font-bold text-gray-500">حاضر</p>
              </div>
            </div>
            <div className="bg-white border rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900">{stats.late}</p>
                <p className="text-xs font-bold text-gray-500">متأخر</p>
              </div>
            </div>
            <div className="bg-white border rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900">{stats.absent}</p>
                <p className="text-xs font-bold text-gray-500">غياب</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* سجل الحلقات */}
            <div className="lg:col-span-2 space-y-4 border bg-white rounded-3xl p-5">
              <h2 className="text-lg font-black flex items-center gap-2 mb-4 text-gray-800">
                <Bookmark className="w-5 h-5 text-[var(--color-primary)]" />
                آخر الحصص اليومية
              </h2>
              
              {studentHistory.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl">
                  <p className="text-gray-400 font-bold">لا توجد سجلات حصص لهذا الطالب</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                  {studentHistory.slice(0, 30).map((h, i) => (
                    <div key={i} className="p-3 border rounded-xl flex items-center justify-between gap-3 bg-gray-50/50 hover:bg-white transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-gray-400 leading-none mb-0.5">{new Date(h.date).toLocaleDateString("ar-DZ", { month: "short" })}</span>
                          <span className="text-sm font-black text-[var(--color-primary)] leading-none">{new Date(h.date).getDate()}</span>
                        </div>
                        
                        {h.isHoliday ? (
                          <span className="text-sm font-bold text-blue-600">عطلة رسمية</span>
                        ) : (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                h.record?.attendance === "حاضر" ? "bg-emerald-100 text-emerald-700" :
                                h.record?.attendance === "متأخر" ? "bg-amber-100 text-amber-700" :
                                "bg-red-100 text-red-700"
                              }`}>
                                {h.record?.attendance || "غير مسجل"}
                              </span>
                              {h.record?.memorization && (
                                <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                                  <Star className="w-3 h-3 text-amber-500" /> {h.record.memorization}
                                </span>
                              )}
                            </div>
                            {h.record?.notes && (
                              <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px] sm:max-w-xs block">
                                "{h.record.notes}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {h.record?.behavior && (
                        <div className="shrink-0 flex items-center">
                          <span className={`text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg border ${
                            h.record.behavior.includes("هادئ") ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                            h.record.behavior.includes("مشاغب") ? "border-red-200 text-red-700 bg-red-50" :
                            "border-blue-200 text-blue-700 bg-blue-50"
                          }`}>
                            {h.record.behavior}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* سجل العهود */}
            <div className="space-y-4 border bg-red-50/20 border-red-100 rounded-3xl p-5">
              <h2 className="text-lg font-black flex items-center gap-2 mb-4 text-red-900">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                سجل التعهدات
              </h2>
              
              {!selectedStudent.covenants || selectedStudent.covenants.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-red-50">
                  <ShieldOff className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 font-bold">سجل الطالب نظيف</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedStudent.covenants.map(cov => (
                    <div key={cov.id} className="p-3 bg-white border border-red-100 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-red-700 bg-red-50 px-2 py-0.5 rounded-full">{cov.type}</span>
                        <span className="text-[10px] font-bold text-gray-400">{new Date(cov.date).toLocaleDateString("ar-DZ")}</span>
                      </div>
                      <p className="text-xs text-gray-700 font-medium mb-2 leading-relaxed line-clamp-2" title={cov.text}>
                        {cov.text}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          cov.status === "نشط" ? "bg-amber-100 text-amber-700" :
                          cov.status === "تم الوفاء بها" ? "bg-emerald-100 text-emerald-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {cov.status}
                        </span>
                        {cov.card !== "بدون" && (
                          <span className="text-xs font-black">{cov.card === "بطاقة صفراء" ? "🟡" : "🔴"}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </motion.div>
      )}
    </div>
  );
}
