"use client";

import React, { useMemo } from "react";
import { format, addDays, getDay, startOfWeek, isSameDay } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Student, DailySession, DailyRecord } from "@/lib/types";
import { ChevronLeft, ChevronRight, Activity, Download, CheckCircle2 } from "lucide-react";

interface WeeklyTableProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onDayClick: (dateStr: string, sessionNumber?: 1 | 2) => void;
  onBulkAttend?: (dateStr: string) => Promise<void>;
  sessionsList: DailySession[];
  students: Student[];
}

export function WeeklyTable({
  currentDate,
  onDateChange,
  onDayClick,
  onBulkAttend,
  sessionsList,
  students,
}: WeeklyTableProps) {
  // Start week from Sunday
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayOfWeek = getDay(date);
      
      const daySessions = sessionsList.filter(s => s.date === dateStr);
      const primarySession = daySessions.find(s => s.sessionNumber === 1) || daySessions[0] || null;

      const hasRealSession = primarySession && primarySession.sessionType !== "يوم عطلة" && primarySession.sessionType !== "غياب المعلم";
      const isHoliday = primarySession?.sessionType === "يوم عطلة";

      return {
        date,
        dateStr,
        dayNameShort: format(date, "EEE", { locale: ar }),
        dayNum: format(date, "d"),
        isToday: isSameDay(date, new Date()),
        isHoliday: isHoliday || primarySession?.sessionType === "يوم عطلة",
        isAbsence: primarySession?.sessionType === "غياب المعلم",
        session: primarySession,
      };
    });
  }, [weekStart, sessionsList]);

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
  }, [students]);

  const getStudentDayInfo = (studentId: string, daySession: DailySession | null): DailyRecord | null => {
    if (!daySession || !daySession.records) return null;
    return daySession.records.find((r) => r.studentId === studentId) || null;
  };

  const getStudentWeeklyStats = (studentId: string) => {
    let present = 0;
    let absent = 0;
    let excellent = 0;

    weekDays.forEach((day) => {
      if (day.isHoliday || day.isAbsence) return;
      const info = getStudentDayInfo(studentId, day.session);
      if (!info) return;

      if (["حاضر", "متأخر", "تعويض"].includes(info.attendance)) present++;
      if (info.attendance === "غائب") absent++;
      if (info.memorization === "ممتاز") excellent++;
    });

    return { present, absent, excellent };
  };

  const navigateWeek = (direction: -1 | 1) => {
    onDateChange(addDays(currentDate, direction * 7));
  };

  const getAttendanceEmoji = (status: string | null) => {
    switch (status) {
      case "حاضر": return "✅";
      case "متأخر": return "⏰";
      case "غائب": return "❌";
      case "تعويض": return "🔄";
      default: return null;
    }
  };

  const getMemorizationBadge = (level: string | null) => {
    if (!level) return null;
    switch (level) {
      case "ممتاز": return <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-black w-full text-center">ممتاز</span>;
      case "جيد جداً": return <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[9px] font-black w-full text-center">جيد جداً</span>;
      case "جيد": return <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-black w-full text-center">جيد</span>;
      case "حسن": return <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-black w-full text-center">حسن</span>;
      case "متوسط": return <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[9px] font-black w-full text-center">متوسط</span>;
      case "لم يحفظ": return <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[9px] font-black w-full text-center">لم يحفظ</span>;
      default: return null;
    }
  };

  const getBehaviorDot = (behavior: string | null) => {
    if (!behavior) return null;
    switch (behavior) {
      case "هادئ": return <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shadow-sm" title="هادئ"></span>;
      case "متوسط": return <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block shadow-sm" title="متوسط"></span>;
      case "غير منضبط": return <span className="w-2.5 h-2.5 rounded-full bg-red-500 block shadow-sm" title="مشاغب"></span>;
      default: return null;
    }
  };

  const exportToCSV = () => {
    const BOM = "\uFEFF";
    let csv = "الطالب,النتائج,";
    csv += weekDays.map(d => `${d.dayNameShort} ${d.dayNum}`).join(",") + "\n";

    sortedStudents.forEach(student => {
      const stats = getStudentWeeklyStats(student.id);
      let row = `"${student.fullName}","${stats.present} حاضر / ${stats.absent} غائب / ${stats.excellent} تميز",`;
      const dailyStatus = weekDays.map(day => {
        if (day.isHoliday || day.isAbsence) return "عطلة";
        const info = getStudentDayInfo(student.id, day.session);
        if (!info || !info.attendance) return "فارغ";
        if (info.attendance === "غائب") return `غائب${info.absenceReason ? ` (${info.absenceReason})` : ""}`;
        return `${info.attendance}${info.memorization ? ` - ${info.memorization}` : ""}`;
      });
      row += `"${dailyStatus.join('","')}"\n`;
      csv += row;
    });

    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير_الأسبوع_${format(weekStart, "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl border border-[var(--color-border)] overflow-hidden">
      {/* Header Navigation */}
      <div className="flex items-center justify-between p-3 sm:p-5 border-b border-gray-100 bg-gray-50/50">
        <button onClick={() => navigateWeek(-1)} className="flex items-center gap-1 h-9 px-3 hover:bg-gray-200 rounded-xl transition-colors text-xs font-black text-gray-700">
          <ChevronRight className="h-4 w-4" /> الأسبوع السابق
        </button>

        <div className="flex flex-col items-center">
          <span className="text-sm font-black text-gray-900">
            {format(weekStart, "d MMMM", { locale: ar })} — {format(addDays(weekStart, 6), "d MMMM", { locale: ar })}
          </span>
          {!isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 0 })) && (
            <button onClick={() => onDateChange(new Date())} className="text-[10px] text-[var(--color-primary)] font-bold hover:underline mt-0.5">
              الأسبوع الحالي
            </button>
          )}
          <button onClick={exportToCSV} title="تصدير كـ CSV (Excel)" className="text-[10px] text-gray-500 hover:text-emerald-600 font-bold hover:underline mt-1 flex items-center gap-1 transition-colors">
            <Download className="w-3 h-3" /> استخراج التقرير
          </button>
        </div>

        <button onClick={() => navigateWeek(1)} className="flex items-center gap-1 h-9 px-3 hover:bg-gray-200 rounded-xl transition-colors text-xs font-black text-gray-700">
          الأسبوع التالي <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="sticky right-0 z-20 bg-gray-50 border-b border-l border-gray-100 text-right p-3 w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                <span className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="h-3 w-3" /> الطالب
                </span>
              </th>
              
              <th className="border-b border-l border-gray-100 p-2 w-[70px] bg-emerald-50/30">
                <span className="text-[10px] font-black tracking-wider text-emerald-700 uppercase">النتائج</span>
              </th>

              {weekDays.map((day) => {
                let cellClass = "hover:bg-gray-100";
                if (day.isHoliday) cellClass = "bg-sky-50";
                if (day.isAbsence) cellClass = "bg-red-50";

                return (
                  <th
                    key={day.dateStr}
                    className={cn("border-b border-l border-gray-100 p-1 min-w-[85px] transition-colors group relative", cellClass)}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span 
                        onClick={() => onDayClick(day.dateStr)}
                        className={cn("text-xs font-black cursor-pointer hover:underline", day.isToday ? "text-[var(--color-primary)]" : "text-gray-600")}
                      >
                        {day.dayNameShort}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        {day.dayNum}
                      </span>
                      {(!day.isHoliday && !day.isAbsence && onBulkAttend) && (
                         <button 
                           onClick={() => onBulkAttend(day.dateStr)}
                           title="تحضير الجميع كـ حاضر"
                           className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 p-1 rounded border border-emerald-200 shadow-sm z-10"
                         >
                            <CheckCircle2 className="w-3 h-3" />
                         </button>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((student, idx) => {
              const stats = getStudentWeeklyStats(student.id);
              
              return (
                <tr key={student.id} className={cn("group transition-colors", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30 hover:bg-gray-50")}>
                  <td className={cn(
                    "sticky right-0 z-10 border-l border-gray-100 text-right p-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]",
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50 group-hover:bg-gray-100"
                  )}>
                    <span className="text-[13px] font-bold text-gray-800 line-clamp-1">{student.fullName}</span>
                  </td>

                  <td className="border-b border-l border-gray-100 p-1 align-middle bg-emerald-50/10">
                    <div className="flex flex-col gap-1.5 w-full items-center text-[10px]">
                      <div className="flex justify-between w-full px-2" title="أيام الحضور"><span>✅</span><span className="font-bold">{stats.present}</span></div>
                      {stats.absent > 0 && <div className="flex justify-between w-full px-2" title="غياب"><span>❌</span><span className="font-bold text-red-500">{stats.absent}</span></div>}
                      {stats.excellent > 0 && <div className="flex justify-between w-full px-2" title="التميز"><span>🌟</span><span className="font-bold text-emerald-600">{stats.excellent}</span></div>}
                    </div>
                  </td>

                  {weekDays.map((day) => {
                    const info = getStudentDayInfo(student.id, day.session);
                    const hasData = !!info?.attendance;
                    
                    let bgClass = "hover:bg-gray-100";
                    if (day.isHoliday) bgClass = "bg-sky-50";
                    if (day.isAbsence) bgClass = "bg-red-50";

                    return (
                      <td
                        key={day.dateStr}
                        className={cn("border-b border-l border-gray-100 p-1 text-center h-[75px]", bgClass)}
                      >
                        {(day.isHoliday || day.isAbsence) ? (
                            <div className="h-full flex items-center justify-center text-gray-300 opacity-50 select-none">-</div>
                        ) : (
                          <div
                            onClick={() => onDayClick(day.dateStr, day.session?.sessionNumber || 1)}
                            className={cn(
                              "h-full w-full rounded border flex flex-col items-center justify-between py-1 transition-all cursor-pointer hover:border-[var(--color-primary)]/50",
                              hasData ? "bg-white border-gray-200 shadow-sm" : "bg-gray-50 border-dashed border-gray-200"
                            )}
                          >
                            {!hasData ? (
                              <div className="flex items-center justify-center h-full">
                                <span className="text-[9px] text-gray-400 font-bold opacity-50">+ تعديل</span>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-center h-[20px] relative group/reason cursor-default">
                                  {getAttendanceEmoji(info.attendance)}
                                  {info.absenceReason && (
                                     <span className="text-[9px] text-gray-500 font-black truncate max-w-[40px] px-1" title={info.absenceReason}>({info.absenceReason})</span>
                                  )}
                                </div>
                                <div className="flex items-center justify-center w-full px-1">{getMemorizationBadge(info.memorization)}</div>
                                <div className="flex items-center justify-center gap-1.5 h-[15px]">
                                  {info.attendance !== "غائب" && info.attendance !== "تعويض" && (
                                    <>
                                      {getBehaviorDot(info.behavior)}
                                      {info.review && <span title="مراجعة تامة" className="text-[10px]">📖</span>}
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            
            {/* صف الإحصائيات (Weekly Stats Row) */}
            <tr className="bg-gray-50/80 border-t border-gray-200">
               <td className="sticky right-0 z-10 border-l border-gray-100 text-right p-3 bg-gray-50 font-black text-xs text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  الإحصائيات الكلية
               </td>
               <td className="border-l border-gray-100 p-2 bg-emerald-50/10"></td>
               {weekDays.map(day => {
                  let p = 0, a = 0;
                  sortedStudents.forEach(s => {
                    const info = getStudentDayInfo(s.id, day.session);
                    if (info?.attendance === "حاضر" || info?.attendance === "متأخر" || info?.attendance === "تعويض") p++;
                    if (info?.attendance === "غائب") a++;
                  });
                  return (
                    <td key={day.dateStr} className="border-l border-gray-100 p-2 text-center text-[10px] font-bold">
                       {day.isHoliday || day.isAbsence ? <span className="text-gray-300 opacity-50">-</span> : (
                          <div className="flex flex-col gap-1 w-full max-w-[50px] mx-auto py-1">
                             <span className="bg-emerald-50 text-emerald-700 rounded px-1">{p} حاضر</span>
                             <span className="bg-red-50 text-red-600 rounded px-1">{a} غائب</span>
                          </div>
                       )}
                    </td>
                  )
               })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
