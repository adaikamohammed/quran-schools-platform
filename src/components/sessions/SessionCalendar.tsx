"use client";

import React from "react";
import { format, getYear, getMonth, getDaysInMonth, getDay, startOfMonth, isToday, isPast, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Dot } from "lucide-react";
import type { DailySession } from "@/lib/types";

interface SessionCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onDayClick: (dateStr: string, sessionNumber?: 1 | 2) => void;
  sessionsList: DailySession[];
}

export function SessionCalendar({
  currentDate,
  onDateChange,
  onDayClick,
  sessionsList,
}: SessionCalendarProps) {
  const year = getYear(currentDate);
  const month = getMonth(currentDate);
  const months = [
    "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
    "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl border border-[var(--color-border)] shadow-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onDateChange(subMonths(currentDate, 1))}
          className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="text-center min-w-[100px]">
          <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: "var(--font-headline)" }}>
            {months[month]}
          </h2>
          <p className="text-sm text-gray-500 font-bold">{year}</p>
        </div>
        <button
          onClick={() => onDateChange(addMonths(currentDate, 1))}
          className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
      <button
        onClick={() => onDateChange(new Date())}
        className="px-4 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-black hover:bg-[var(--color-primary)]/20 transition-colors"
      >
        الشهر الحالي
      </button>
    </div>
  );

  const renderDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getDay(startOfMonth(currentDate));
    const startDayIndex = firstDayOfMonth % 7;
    const days = [];

    // Empty cells for days before the 1st
    for (let i = 0; i < startDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="h-28 md:h-36 bg-gray-50/50 border border-gray-100 rounded-xl m-1 opacity-50" />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      // Set to NOON to avoid timezone shifts
      const dayDate = new Date(year, month, day, 12, 0, 0);
      const formattedDate = format(dayDate, "yyyy-MM-dd");
      const daySessions = sessionsList.filter((s) => s.date === formattedDate);
      const isTodayDate = isToday(dayDate);

      let statusClass = "bg-white hover:bg-gray-50 border-gray-200 border"; // Default

      if (daySessions.length > 0) {
        const hasHoliday = daySessions.some((s) => s.sessionType === "يوم عطلة");
        const hasActivity = daySessions.some((s) => s.sessionType === "حصة أنشطة");
        const hasAbsent = daySessions.some((s) => s.sessionType === "غياب المعلم");

        if (hasHoliday) {
          statusClass = "bg-sky-500 text-white border-sky-600 shadow-sm";
        } else if (hasActivity) {
          statusClass = "bg-purple-500 text-white border-purple-600 shadow-sm";
        } else if (hasAbsent) {
          statusClass = "bg-red-500 text-white border-red-600 shadow-sm";
        } else {
          statusClass = "bg-emerald-500 text-white border-emerald-600 shadow-sm";
        }
      } else if (isPast(dayDate) && !isTodayDate) {
        statusClass = "bg-gray-50 border-gray-200"; // Empty past working day
      }

      if (isTodayDate) statusClass += " ring-2 ring-[var(--color-primary)] ring-offset-2 !bg-[var(--color-primary)]/10 border-[var(--color-primary)] !text-gray-900";

      const textColorClass = isTodayDate ? "text-[var(--color-primary)]" : (daySessions.length > 0 ? "text-white" : "text-gray-700");

      days.push(
        <div
          key={day}
          onClick={() => onDayClick(formattedDate)}
          className={cn(
            "relative flex flex-col justify-between h-28 md:h-36 rounded-xl m-1 p-2 transition-all cursor-pointer group hover:scale-[1.02]",
            statusClass
          )}
        >
          <div className="flex justify-between items-start">
            <span className={cn("text-lg font-black select-none", textColorClass)}>{day}</span>
            <div className="flex">
              {daySessions.some((s) => s.sessionNumber === 1) && <Dot className={cn("h-4 w-4", isTodayDate ? "text-emerald-500" : "text-white/80")} />}
              {daySessions.some((s) => s.sessionNumber === 2) && <Dot className={cn("h-4 w-4", isTodayDate ? "text-emerald-600" : "text-white/80")} />}
            </div>
          </div>

          {/* Session Infos */}
          <div className="space-y-1 relative z-10 w-full">
            {daySessions.map((session, idx) => (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  onDayClick(formattedDate, session.sessionNumber);
                }}
                className={cn(
                  "flex items-center justify-center text-[10px] font-black rounded-lg px-2 py-1.5 truncate transition-all cursor-pointer",
                  isTodayDate 
                    ? "bg-white border hover:bg-gray-50 border-gray-200 text-gray-600 shadow-sm hover:border-[var(--color-primary)]/50" 
                    : "bg-white/20 hover:bg-white/30 text-white shadow-sm"
                )}
              >
                {session.sessionType === "حصة أساسية" ? `حصة ${session.sessionNumber}` : session.sessionType}
              </div>
            ))}
          </div>
          
          {daySessions.length === 0 && isPast(dayDate) && !isTodayDate && (
             <span className="text-[10px] font-bold text-gray-400 self-center mb-1 opacity-50">فارغ</span>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="bg-gray-50/50 rounded-3xl p-4 md:p-6 border border-[var(--color-border)]">
      {renderHeader()}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map((day) => (
          <div key={day} className="text-center font-black text-xs md:text-sm text-gray-400 p-2">
            {day}
          </div>
        ))}
        {renderDays()}
      </div>
    </div>
  );
}
