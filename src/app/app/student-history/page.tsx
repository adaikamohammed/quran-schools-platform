"use client";
import SchoolGuard from "@/components/layout/SchoolGuard";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import type { Student, DailySession, AppUser, Payment, SurahProgress } from "@/lib/types";
import { motion } from "framer-motion";
import {
  BarChart3, CheckCircle, TrendingUp, AlertCircle, ShieldAlert,
  Users, Star, Clock, BookOpen, CreditCard, Award, Printer
} from "lucide-react";

type TimelineEvent = {
  id: string;
  dateStr: string;
  timestamp: number;
  type: 'session' | 'payment' | 'surah' | 'covenant';
  title: string;
  description: React.ReactNode;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
};

function StudentHistoryPage() {
  const { user, school, isPrincipal } = useAuth();
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Raw data for the selected student
  const [sessions, setSessions]             = useState<DailySession[]>([]);
  const [payments, setPayments]             = useState<Payment[]>([]);
  const [surahProgress, setSurahProgress]   = useState<SurahProgress[]>([]);

  // ─── تحميل بيانات الطلاب ───────────────────────────────────
  const loadData = useCallback(async () => {
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

    if (studs.length > 0 && !selectedStudentId) {
      setSelectedStudentId(studs[0].id);
    }
    setLoading(false);
  }, [user?.id, school?.id, isPrincipal, selectedTeacherId, selectedStudentId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── تحميل السجل التفصيلي للطالب المختار ────────────────────────
  useEffect(() => {
    if (!selectedStudentId || !school?.id) return;
    
    const fetchStudentDetails = async () => {
      const db = getDB();
      // Sessions
      let allSessions = await db.sessions.where("schoolId").equals(school.id).toArray();
      // Keep only sessions where the student is recorded, or holidays
      const studSessions = allSessions.filter(s => 
        s.sessionType === "يوم عطلة" || s.records.some(r => r.studentId === selectedStudentId)
      );
      setSessions(studSessions);

      // Payments
      const studPayments = await db.payments.where("studentId").equals(selectedStudentId).toArray();
      setPayments(studPayments);

      // Surah Progress
      const studProgress = await db.surahProgress.where("studentId").equals(selectedStudentId).toArray();
      setSurahProgress(studProgress);
    };

    fetchStudentDetails();
  }, [selectedStudentId, school?.id]);

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId) || null, [selectedStudentId, students]);

  // ─── بناء الخط الزمني الموحد (Timeline) ──────────────────────
  const timelineEvents = useMemo(() => {
    if (!selectedStudent) return [];
    const events: TimelineEvent[] = [];

    // 1. حصص التسميع والمتابعة اليومية
    sessions.forEach(session => {
      const record = session.records.find(r => r.studentId === selectedStudent.id);
      if (!record && session.sessionType !== "يوم عطلة") return;

      const theDate = new Date(session.date);
      let title = "تسجيل حصة غير متوفر";
      let desc: React.ReactNode = "";
      let icon = BookOpen;
      let iconBg = "bg-blue-100";
      let iconColor = "text-blue-600";

      if (session.sessionType === "يوم عطلة") {
        title = "عطلة رسمية";
        icon = CheckCircle;
        iconBg = "bg-gray-100";
        iconColor = "text-gray-500";
      } else if (record) {
        if (record.attendance === "غائب") {
          title = "غياب عن الحصة";
          icon = AlertCircle;
          iconBg = "bg-red-100";
          iconColor = "text-red-600";
          desc = record.notes || "لم يُقدم عذر للغياب.";
        } else if (record.attendance === "حاضر" || record.attendance === "تعويض" || record.attendance === "متأخر") {
          title = record.attendance === "حاضر" ? "حضور طبيعي" : record.attendance;
          if (record.attendance === "متأخر") {
             icon=Clock; iconBg="bg-amber-100"; iconColor="text-amber-600";
          } else {
             icon=CheckCircle; iconBg="bg-emerald-100"; iconColor="text-emerald-600";
          }
          
          desc = (
            <div className="flex flex-col gap-1 mt-1">
              {record.memorization && (
                <div className="flex items-center gap-1 text-sm font-bold text-gray-700">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  أداء التحفيظ: {record.memorization}
                </div>
              )}
              {record.notes && <p className="text-sm text-gray-500">"{record.notes}"</p>}
              {record.behavior && (
                <div className="inline-flex mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-600 font-bold">
                    السلوك: {record.behavior}
                  </span>
                </div>
              )}
            </div>
          );
        }
      }

      events.push({
        id: session.id,
        dateStr: session.date,
        timestamp: theDate.getTime(),
        type: 'session',
        title,
        description: desc,
        icon, iconBg, iconColor
      });
    });

    // 2. المدفوعات المالية
    payments.forEach(payment => {
      const pDate = new Date(payment.paidAt || payment.date);
      events.push({
        id: payment.id,
        dateStr: payment.paidAt || payment.date,
        timestamp: pDate.getTime(),
        type: 'payment',
        title: `دفعة مالية (${payment.amount} د.ج)`,
        description: `تم سداد قسط الفصل الدراسي: ${payment.date}`,
        icon: CreditCard,
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600"
      });
    });

    // 3. مسار السور المنجزة
    surahProgress.forEach(progress => {
      if (progress.completionDate && progress.status === "تم الحفظ") {
        events.push({
          id: progress.id,
          dateStr: progress.completionDate,
          timestamp: new Date(progress.completionDate).getTime(),
          type: 'surah',
          title: "ختم سورة كاملة",
          description: `أتم الطالب حفظ سورة ${progress.surahName} ✨`,
          icon: Award,
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600"
        });
      }
    });

    // 4. المخالفات والتعهدات
    if (selectedStudent.covenants) {
      selectedStudent.covenants.forEach(cov => {
        events.push({
          id: cov.id,
          dateStr: cov.date,
          timestamp: new Date(cov.date).getTime(),
          type: 'covenant',
          title: `تعهد: ${cov.type}`,
          description: (
             <div className="flex flex-col gap-1">
               <p className="text-sm text-gray-600">{cov.text}</p>
               <span className="text-xs font-black text-red-600 mt-1">بطاقة: {cov.card}</span>
             </div>
          ),
          icon: ShieldAlert,
          iconBg: "bg-rose-100",
          iconColor: "text-rose-600"
        });
      });
    }

    // فرز من الأحدث للأقدم
    return events.sort((a, b) => b.timestamp - a.timestamp);
  }, [selectedStudent, sessions, payments, surahProgress]);

  // ─── الإحصائيات (مبنية على الحصص) ──────────────────────
  const stats = useMemo(() => {
    let presentCount = 0, lateCount = 0, absentCount = 0;
    
    sessions.forEach(s => {
      if(s.sessionType === "يوم عطلة") return;
      const r = s.records.find(rx => rx.studentId === selectedStudentId);
      if (r) {
        if(r.attendance === "حاضر" || r.attendance === "تعويض") presentCount++;
        else if (r.attendance === "متأخر") lateCount++;
        else if (r.attendance === "غائب") absentCount++;
      }
    });
    
    const totalWorking = presentCount + lateCount + absentCount;
    const rate = totalWorking > 0 ? ((presentCount + lateCount) / totalWorking) * 100 : 0;
    
    return {
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      rate: Math.round(rate),
      total: totalWorking
    };
  }, [sessions, selectedStudentId]);

  // ─── دالة الطباعة ───────────────────────────────────────
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const windowPrint = window.open('', '', 'width=900,height=650');
    if (!windowPrint) return;

    windowPrint.document.write(`
      <html dir="rtl">
        <head>
          <title>سجل الطالب - ${selectedStudent?.fullName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            body { font-family: 'Cairo', sans-serif; color: #1f2937; margin: 0; padding: 40px; background: white; }
            h1, h2 { color: #111827; }
            .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
            .grid-stats { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .stat-box { border: 1px solid #e5e7eb; padding: 15px; border-radius: 10px; width: 22%; text-align: center; }
            .stat-num { font-size: 24px; font-weight: 900; margin-bottom: 5px; }
            .timeline { list-style: none; padding: 0; position: relative; }
            .event { padding-right: 30px; position: relative; margin-bottom: 25px; page-break-inside: avoid; }
            .event:before { content: ''; position: absolute; right: 0; top: 5px; width: 12px; height: 12px; border-radius: 50%; background: #3b82f6; }
            .event-surah:before { background: #eab308; }
            .event-payment:before { background: #a855f7; }
            .event-covenant:before { background: #ef4444; }
            .date { font-size: 12px; color: #6b7280; font-weight: bold; margin-bottom: 5px; }
            .title { font-size: 16px; font-weight: bold; margin: 0 0 5px; }
            .desc { font-size: 14px; color: #4b5563; margin: 0; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>سجل نشاط الطالب التاريخي</h1>
            <h2>${selectedStudent?.fullName}</h2>
            <p>مدرسة: ${school?.name} | الفوج: ${selectedStudent?.groupName}</p>
          </div>
          
          <div class="grid-stats">
            <div class="stat-box">
              <div class="stat-num">${stats.rate}%</div>
              <div>نسبة الحضور</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">${surahProgress.filter(s => s.status === "تم الحفظ").length}</div>
              <div>السور المختومة</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">${payments.reduce((sum, p) => sum + p.amount, 0)} د.ج</div>
              <div>إجمالي المدفوعات</div>
            </div>
            <div class="stat-box">
              <div class="stat-num" style="color: #ef4444;">${selectedStudent?.covenants?.length || 0}</div>
              <div>التعهدات</div>
            </div>
          </div>

          <h3>التسلسل الزمني للنشاطات:</h3>
          <ul class="timeline">
            ${timelineEvents.map(e => `
              <li class="event event-${e.type}">
                <div class="date">${e.dateStr}</div>
                <h4 class="title">${e.title}</h4>
                <div class="desc">${typeof e.description === 'string' ? e.description : 'نشاط مسجل (انظر التفاصيل في المنصة)'}</div>
              </li>
            `).join('')}
          </ul>
          
          <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #9ca3af;">
            طُبع من منصة فرسان القرآن بتاريخ ${new Date().toLocaleDateString('ar-DZ')}
          </div>
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* ── رأس الصفحة واختيار الطالب ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
            <BarChart3 className="w-6 h-6 text-[var(--color-primary)]" />
            السجل التاريخي الشامل للطالب
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            خط زمني موحد (حضور، مدفوعات، تقدم الحفظ، ومخالفات)
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          {selectedStudent && (
            <button 
              onClick={handlePrint}
              className="btn btn-secondary h-[42px] px-3 shrink-0 flex items-center gap-2"
              title="طباعة السجل"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">طباعة</span>
            </button>
          )}
          <select 
            className="input-field py-2.5 text-sm font-bold w-full md:w-64"
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

      {/* ── فلتر المعلم (للمدراء فقط) ── */}
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

      {/* ── محتوى السجل ── */}
      {!loading && selectedStudent && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8" ref={printRef}>
          
          {/* بطاقة تعريف الطالب */}
          <div className="bg-white rounded-3xl border border-[var(--color-border)] shadow-sm p-5 md:p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white flex items-center justify-center text-3xl font-black shrink-0 shadow-md">
              {selectedStudent.fullName[0]}
            </div>
            <div className="flex-1 text-center md:text-right">
              <h2 className="text-2xl font-black text-gray-900 mb-1">{selectedStudent.fullName}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-bold text-gray-500">
                <span className="flex items-center gap-1"><Users className="w-4 h-4"/> الفوج: {selectedStudent.groupName}</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4"/> الحالة: <span className="text-emerald-600">{selectedStudent.status}</span></span>
              </div>
            </div>
          </div>

          {/* الإحصائيات الأربعة المستمدة من أنشطة مختلفة */}
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
              <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900">{surahProgress.filter(sp => sp.status === "تم الحفظ").length}</p>
                <p className="text-xs font-bold text-gray-500">سور مختومة</p>
              </div>
            </div>
            <div className="bg-white border rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-black text-gray-900">{payments.reduce((sum, p) => sum + p.amount, 0)} د.ج</p>
                <p className="text-xs font-bold text-gray-500">إجمالي المدفوعات</p>
              </div>
            </div>
            <div className="bg-white border rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900">{selectedStudent.covenants?.length || 0}</p>
                <p className="text-xs font-bold text-gray-500">التعهدات</p>
              </div>
            </div>
          </div>

          {/* الخط الزمني الموحد (Unified Timeline) */}
          <div className="bg-white border border-[var(--color-border)] rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-2 border-b pb-4">
              <Clock className="w-5 h-5 text-[var(--color-primary)]" />
              الخط الزمني الشامل للأحداث
            </h3>

            {timelineEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-bold">لا توجد أي نشاطات مسجلة لهذا الطالب حتى الآن.</p>
              </div>
            ) : (
              <div className="relative border-r-2 border-gray-100 pr-6 space-y-8 mr-2">
                {timelineEvents.map((event, idx) => (
                  <motion.div 
                    key={`${event.id}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="relative"
                  >
                    {/* النقطة الملونة للأيقونة */}
                    <div className={`absolute -right-[35px] top-0 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white ${event.iconBg} ${event.iconColor} shadow-sm`}>
                      <event.icon className="w-4 h-4" />
                    </div>
                    
                    {/* محتوى الحدث */}
                    <div className="bg-gray-50/50 hover:bg-white border border-gray-100 transition-colors rounded-2xl p-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <h4 className={`text-base font-black ${event.iconColor.replace('text-', 'text-')}`}>{event.title}</h4>
                        <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-lg border">
                          {new Date(event.dateStr).toLocaleDateString("ar-DZ", { 
                            weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">
                        {event.description}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        </motion.div>
      )}
    </div>
  );
}

// ── Guard wrapper ──
export default function StudentHistoryPagePage() {
  return (
    <SchoolGuard>
      <StudentHistoryPage />
    </SchoolGuard>
  );
}
