"use client";

import React, { useMemo, useState } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Student, DailySession, DailyRecord } from "@/lib/types";
import { ChevronLeft, ChevronRight, Activity, Download, CheckCircle2, Plus } from "lucide-react";

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
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });

  // ─── فلتر الحصة ──────────────────────────────────────────
  const [activeSession, setActiveSession] = useState<1 | 2>(1);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const daySessions = sessionsList.filter(s => s.date === dateStr);
      const session1 = daySessions.find(s => s.sessionNumber === 1) || null;
      const session2 = daySessions.find(s => s.sessionNumber === 2) || null;
      const isHoliday = session1?.sessionType === "يوم عطلة";
      const isAbsence = session1?.sessionType === "غياب المعلم";
      return {
        date, dateStr,
        dayNameShort: format(date, "EEE", { locale: ar }),
        dayNum: format(date, "d"),
        isToday: isSameDay(date, new Date()),
        isHoliday, isAbsence,
        session1, session2,
      };
    });
  }, [weekStart, sessionsList]);

  const sortedStudents = useMemo(() =>
    [...students].sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"))
  , [students]);

  const getRecord = (studentId: string, session: DailySession | null): DailyRecord | null => {
    if (!session?.records) return null;
    return session.records.find(r => r.studentId === studentId) || null;
  };

  const getStudentStats = (studentId: string) => {
    let present = 0, absent = 0, excellent = 0;
    weekDays.forEach(day => {
      if (day.isHoliday || day.isAbsence) return;
      const session = activeSession === 1 ? day.session1 : day.session2;
      const info = getRecord(studentId, session);
      if (!info) return;
      if (["حاضر", "متأخر", "تعويض"].includes(info.attendance)) present++;
      if (info.attendance === "غائب") absent++;
      if (info.memorization === "ممتاز") excellent++;
    });
    return { present, absent, excellent };
  };

  const navigateWeek = (dir: -1 | 1) => onDateChange(addDays(currentDate, dir * 7));

  const getAttendanceEmoji = (s: string | null) => {
    switch (s) {
      case "حاضر":  return "✅";
      case "متأخر": return "⏰";
      case "غائب":  return "❌";
      case "تعويض": return "🔄";
      default: return null;
    }
  };

  const getMemorizationBadge = (level: string | null) => {
    if (!level) return null;
    const map: Record<string, string> = {
      "ممتاز":    "bg-emerald-100 text-emerald-700",
      "جيد جداً": "bg-green-100 text-green-700",
      "جيد":      "bg-blue-100 text-blue-700",
      "حسن":      "bg-indigo-100 text-indigo-700",
      "متوسط":    "bg-orange-100 text-orange-700",
      "لم يحفظ":  "bg-red-100 text-red-700",
    };
    const cls = map[level] ?? "bg-gray-100 text-gray-600";
    return (
      <span className={`${cls} px-1.5 py-0.5 rounded text-[9px] font-black w-full text-center block leading-tight`}>
        {level}
      </span>
    );
  };

  const getBehaviorDot = (behavior: string | null) => {
    if (!behavior) return null;
    const map: Record<string, string> = {
      "هادئ": "bg-emerald-500",
      "متوسط": "bg-amber-400",
      "غير منضبط": "bg-red-500",
    };
    return <span className={`w-2 h-2 rounded-full block shadow-sm ${map[behavior] ?? "bg-gray-300"}`} title={behavior} />;
  };

  const exportToCSV = () => {
    const BOM = "\uFEFF";
    const label = activeSession === 1 ? "ح1" : "ح2";
    let csv = `الطالب,النتائج,${weekDays.map(d => `${d.dayNameShort} ${d.dayNum}`).join(",")}\n`;
    sortedStudents.forEach(student => {
      const stats = getStudentStats(student.id);
      let row = `"${student.fullName}","${stats.present} حاضر / ${stats.absent} غائب / ${stats.excellent} تميز",`;
      const daily = weekDays.map(day => {
        if (day.isHoliday || day.isAbsence) return "عطلة";
        const session = activeSession === 1 ? day.session1 : day.session2;
        const info = getRecord(student.id, session);
        if (!info?.attendance) return "فارغ";
        if (info.attendance === "غائب") return `غائب${info.absenceReason ? ` (${info.absenceReason})` : ""}`;
        return `${info.attendance}${info.memorization ? ` - ${info.memorization}` : ""}`;
      });
      row += `"${daily.join('","')}"\n`;
      csv += row;
    });
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير_${label}_${format(weekStart, "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ألوان الحصة النشطة
  const sessionColor = activeSession === 1
    ? { dot: "bg-[var(--color-primary)]", text: "text-[var(--color-primary)]", ring: "ring-[var(--color-primary)]", bg: "bg-[var(--color-primary)]" }
    : { dot: "bg-purple-500", text: "text-purple-600", ring: "ring-purple-400", bg: "bg-purple-500" };

  return (
    <div className="bg-white rounded-3xl border border-[var(--color-border)] overflow-hidden">

      {/* ─── رأس التنقل ─────────────────────────────────────── */}
      <div className="flex items-center justify-between p-3 sm:p-5 border-b border-gray-100 bg-gray-50/50">
        <button onClick={() => navigateWeek(-1)} className="flex items-center gap-1 h-9 px-3 hover:bg-gray-200 rounded-xl transition-colors text-xs font-black text-gray-700">
          <ChevronRight className="h-4 w-4" /> الأسبوع السابق
        </button>

        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-black text-gray-900">
            {format(weekStart, "d MMMM", { locale: ar })} — {format(addDays(weekStart, 6), "d MMMM", { locale: ar })}
          </span>
          {!isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 0 })) && (
            <button onClick={() => onDateChange(new Date())} className="text-[10px] text-[var(--color-primary)] font-bold hover:underline">
              الأسبوع الحالي
            </button>
          )}
          <button onClick={exportToCSV} className="text-[10px] text-gray-500 hover:text-emerald-600 font-bold hover:underline flex items-center gap-1 transition-colors">
            <Download className="w-3 h-3" /> استخراج التقرير
          </button>
        </div>

        <button onClick={() => navigateWeek(1)} className="flex items-center gap-1 h-9 px-3 hover:bg-gray-200 rounded-xl transition-colors text-xs font-black text-gray-700">
          الأسبوع التالي <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* ─── شريط فلتر الحصة ────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 px-5 py-2.5 border-b border-gray-100 bg-white">
        <span className="text-xs text-gray-400 font-bold ml-auto">عرض:</span>
        {([1, 2] as const).map(n => {
          const isActive = activeSession === n;
          const color = n === 1
            ? { active: "bg-[var(--color-primary)] text-white shadow-sm", dot: "bg-[var(--color-primary)]", text: "text-[var(--color-primary)]" }
            : { active: "bg-purple-500 text-white shadow-sm", dot: "bg-purple-500", text: "text-purple-600" };
          return (
            <button
              key={n}
              onClick={() => setActiveSession(n)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black transition-all border",
                isActive
                  ? color.active + " border-transparent"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", isActive ? "bg-white" : color.dot)} />
              حصة {n === 1 ? "أولى" : "ثانية"}
            </button>
          );
        })}
        <span className="text-[10px] text-gray-300 font-medium hidden sm:block">— اضغط للتعديل</span>
      </div>

      {/* ─── الجدول ─────────────────────────────────────────── */}
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-50/50">
              {/* عمود الاسم — واسع */}
              <th className="sticky right-0 z-20 bg-gray-50 border-b border-l border-gray-100 text-right p-2 sm:p-3 w-[120px] min-w-[120px] sm:w-[200px] sm:min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                <span className="text-[11px] sm:text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="h-3 w-3 shrink-0" /> <span className="truncate">الطالب</span>
                </span>
              </th>

              {/* عمود النتائج */}
              <th className="border-b border-l border-gray-100 p-2 w-[72px] min-w-[72px] bg-emerald-50/30">
                <span className="text-[10px] font-black tracking-wider text-emerald-700 uppercase">النتائج</span>
              </th>

              {/* أيام الأسبوع */}
              {weekDays.map(day => {
                let cellClass = "hover:bg-gray-50";
                if (day.isHoliday) cellClass = "bg-sky-50";
                if (day.isAbsence) cellClass = "bg-red-50";
                return (
                  <th key={day.dateStr} className={cn("border-b border-l border-gray-100 p-1 min-w-[90px] transition-colors group relative", cellClass)}>
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        onClick={() => onDayClick(day.dateStr, activeSession)}
                        className={cn("text-xs font-black cursor-pointer hover:underline", day.isToday ? sessionColor.text : "text-gray-600")}
                      >
                        {day.dayNameShort}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">{day.dayNum}</span>
                      {(!day.isHoliday && !day.isAbsence && onBulkAttend) && (
                        <button
                          onClick={() => onBulkAttend(day.dateStr)}
                          title="تحضير الجميع كـ حاضر"
                          className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-1 rounded border border-emerald-200 shadow-sm z-10"
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
              const stats = getStudentStats(student.id);
              const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50/30 hover:bg-gray-50";
              const stickyBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50 group-hover:bg-gray-100";

              return (
                <tr key={student.id} className={cn("group transition-colors", rowBg)}>
                  {/* اسم الطالب */}
                  <td className={cn("sticky right-0 z-10 border-l border-gray-100 text-right p-2 sm:px-3 sm:py-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] w-[120px] min-w-[120px] sm:w-[200px] sm:min-w-[200px]", stickyBg)}>
                    <span className="text-[11px] sm:text-[13px] font-bold text-gray-800 leading-snug"
                      style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {student.fullName}
                    </span>
                  </td>

                  {/* إحصائيات */}
                  <td className="border-b border-l border-gray-100 p-1 align-middle bg-emerald-50/10 w-[72px]">
                    <div className="flex flex-col gap-1 w-full items-center text-[10px]">
                      <div className="flex justify-between w-full px-2"><span>✅</span><span className="font-bold">{stats.present}</span></div>
                      {stats.absent > 0 && <div className="flex justify-between w-full px-2"><span>❌</span><span className="font-bold text-red-500">{stats.absent}</span></div>}
                      {stats.excellent > 0 && <div className="flex justify-between w-full px-2"><span>🌟</span><span className="font-bold text-emerald-600">{stats.excellent}</span></div>}
                    </div>
                  </td>

                  {/* خلايا الأيام */}
                  {weekDays.map(day => {
                    const session = activeSession === 1 ? day.session1 : day.session2;
                    const info = getRecord(student.id, session);
                    const hasData = !!info?.attendance;

                    let bgClass = "";
                    if (day.isHoliday) bgClass = "bg-sky-50";
                    if (day.isAbsence) bgClass = "bg-red-50";

                    // لون حدود الخلية حسب الحصة
                    const hoverBorder = activeSession === 1
                      ? "hover:border-[var(--color-primary)]/50"
                      : "hover:border-purple-400/50";
                    const emptyStyle = activeSession === 1
                      ? "bg-gray-50 border-dashed border-gray-200"
                      : "bg-purple-50/20 border-dashed border-purple-200/40";

                    return (
                      <td key={day.dateStr} className={cn("border-b border-l border-gray-100 p-1.5 align-middle h-[72px]", bgClass)}>
                        {day.isHoliday || day.isAbsence ? (
                          <div className="h-full flex items-center justify-center text-gray-300 text-sm select-none">—</div>
                        ) : (
                          <div
                            onClick={() => onDayClick(day.dateStr, activeSession)}
                            className={cn(
                              "h-full w-full rounded border flex flex-col items-center justify-between py-1 px-0.5 transition-all cursor-pointer",
                              hoverBorder,
                              hasData ? "bg-white border-gray-200 shadow-sm" : emptyStyle
                            )}
                          >
                            {!hasData ? (
                              <div className="flex items-center justify-center h-full w-full">
                                <Plus className={`w-3 h-3 ${activeSession === 1 ? "text-gray-300" : "text-purple-300"}`} />
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-center gap-0.5 text-base leading-none pt-0.5">
                                  {getAttendanceEmoji(info!.attendance)}
                                  {info!.absenceReason && (
                                    <span className="text-[8px] text-gray-400 leading-none" title={info!.absenceReason}>!</span>
                                  )}
                                </div>
                                <div className="w-full px-0.5">{getMemorizationBadge(info!.memorization)}</div>
                                <div className="flex items-center justify-center gap-1 h-[12px]">
                                  {info!.attendance !== "غائب" && info!.attendance !== "تعويض" && (
                                    <>
                                      {getBehaviorDot(info!.behavior)}
                                      {info!.review && <span className="text-[9px]">📖</span>}
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

            {/* ─── صف الإحصائيات الكلية ──────────────────────── */}
            <tr className="bg-gray-50/80 border-t-2 border-gray-200">
              <td className="sticky right-0 z-10 border-l border-gray-100 text-right p-2 sm:p-3 bg-gray-50 font-black text-[10px] sm:text-xs text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] w-[120px] min-w-[120px] sm:w-[200px] sm:min-w-[200px]">
                الإحصائيات الكلية
              </td>
              <td className="border-l border-gray-100 p-2 bg-emerald-50/10" />
              {weekDays.map(day => {
                if (day.isHoliday || day.isAbsence) {
                  return <td key={day.dateStr} className="border-l border-gray-100 p-2 text-center"><span className="text-gray-300 text-xs">-</span></td>;
                }
                const session = activeSession === 1 ? day.session1 : day.session2;
                let p = 0, a = 0;
                sortedStudents.forEach(s => {
                  const info = getRecord(s.id, session);
                  if (["حاضر", "متأخر", "تعويض"].includes(info?.attendance ?? "")) p++;
                  if (info?.attendance === "غائب") a++;
                });
                return (
                  <td key={day.dateStr} className="border-l border-gray-100 p-1.5 text-center text-[10px] font-bold">
                    <div className="flex flex-col gap-1 items-center py-1">
                      <span className="bg-emerald-50 text-emerald-700 rounded-lg px-2 py-0.5 w-full text-center">{p} حاضر</span>
                      {a > 0 && <span className="bg-red-50 text-red-600 rounded-lg px-2 py-0.5 w-full text-center">{a} غائب</span>}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
