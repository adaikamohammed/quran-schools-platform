"use client";

import React from 'react';
import { format, getYear, getDay, startOfYear, addDays, getDaysInMonth, startOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';

// Helper function to dynamically add class names
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// ─── TOOLTIP COMPONENT ───
export const SimpleTooltip = ({ children, content }: { children: React.ReactNode, content: React.ReactNode }) => {
  return (
    <div className="relative group flex items-center justify-center">
      {children}
      <div className="absolute bottom-full mb-2 hidden group-hover:block z-50">
        <div className="bg-gray-900 text-white text-xs rounded-xl py-2 px-3 shadow-xl whitespace-nowrap">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900" />
        </div>
      </div>
    </div>
  );
};

// ─── LOGIC ───
export const getStudentDayColor = (dayData: any, viewType: 'attendance' | 'evaluation' | 'behavior' = 'attendance') => {
  if (!dayData) return 'bg-gray-100 border-transparent';
  if (dayData.isHoliday) return 'bg-blue-400 border-blue-500';
  if (dayData.isSheikhAbsentNoSub) return 'bg-rose-400 border-rose-500';
  if (dayData.isSheikhAbsentWithSub) return 'bg-purple-400 border-purple-500';

  const records = dayData.records || [];
  if (records.length === 0) return 'bg-gray-100 border-transparent';

  const hasMultiple = records.length > 1;

  if (viewType === 'attendance') {
    const statuses = records.map((r: any) => r.attendance);
    if (statuses.includes('حاضر')) return hasMultiple ? 'bg-emerald-700 border-emerald-800' : 'bg-emerald-500 border-emerald-600';
    if (statuses.includes('متأخر')) return hasMultiple ? 'bg-amber-500 border-amber-600' : 'bg-amber-400 border-amber-500';
    if (statuses.includes('غياب') || statuses.includes('غائب')) return hasMultiple ? 'bg-red-700 border-red-800' : 'bg-red-500 border-red-600';
    return 'bg-gray-100 border-transparent';
  } else if (viewType === 'evaluation') {
    const evals = records.map((r: any) => r.memorization).filter(Boolean);
    if (evals.length === 0) return 'bg-gray-100 border-transparent';

    if (evals.some((e: string) => e.includes('ممتاز'))) return hasMultiple ? 'bg-emerald-900 border-emerald-950' : 'bg-emerald-700 border-emerald-800';
    if (evals.some((e: string) => e.includes('جيد جدا'))) return hasMultiple ? 'bg-emerald-700 border-emerald-800' : 'bg-emerald-500 border-emerald-600';
    if (evals.some((e: string) => e.includes('جيد'))) return hasMultiple ? 'bg-amber-600 border-amber-700' : 'bg-amber-400 border-amber-500';
    if (evals.some((e: string) => e.includes('مقبول'))) return hasMultiple ? 'bg-orange-600 border-orange-700' : 'bg-orange-400 border-orange-500';
    if (evals.some((e: string) => e.includes('ضعيف'))) return hasMultiple ? 'bg-red-700 border-red-800' : 'bg-red-500 border-red-600';
    return 'bg-emerald-400 border-emerald-500';
  } else {
    // Behavior view
    const behaviors = records.map((r: any) => r.behavior).filter(Boolean);
    if (behaviors.length === 0) return 'bg-gray-100 border-transparent';

    if (behaviors.includes('مشاغب')) return hasMultiple ? 'bg-red-700 border-red-800' : 'bg-red-500 border-red-600';
    if (behaviors.includes('مقبول') || behaviors.includes('عادي')) return hasMultiple ? 'bg-blue-600 border-blue-700' : 'bg-blue-400 border-blue-500';
    if (behaviors.includes('هادئ')) return hasMultiple ? 'bg-emerald-700 border-emerald-800' : 'bg-emerald-500 border-emerald-600';
    return 'bg-gray-300 border-gray-400';
  }
};

export const StudentDayTooltip = ({ day, dayData }: { day: Date, dayData: any }) => {
  const formattedDate = format(day, 'd MMMM yyyy', { locale: ar });

  if (!dayData) {
    return <div className="text-center"><p className="font-bold">{formattedDate}</p><p className="text-gray-400 mt-1">لا توجد بيانات</p></div>;
  }

  return (
    <div className="space-y-2 text-right min-w-[180px] p-1" style={{ direction: 'rtl' }}>
      <p className="font-black border-b border-gray-700 pb-1.5 mb-2 text-center text-primary-light">{formattedDate}</p>
      {dayData.isHoliday && <p className="text-blue-400 font-black flex items-center gap-2 justify-end">يوم عطلة <span className="w-2 h-2 rounded-full bg-blue-500"></span></p>}
      
      {(dayData.records || []).map((record: any, idx: number) => (
        <div key={idx} className={cn("mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700", (dayData.records.length > 1) && "border-r-2 border-r-primary-light")}>
          {dayData.records.length > 1 && <p className="text-[10px] font-black text-primary-light mb-1 underline">حصة {idx + 1}</p>}
          <p className="text-xs flex justify-between gap-4"><span className="opacity-60 text-gray-400">الحضور:</span> <span className="font-black">{record.attendance || 'غير مسجل'}</span></p>
          {record.memorization && <p className="text-xs flex justify-between gap-4 mt-1"><span className="opacity-60 text-gray-400">التقييم:</span> <span className="font-black text-amber-400">{record.memorization}</span></p>}
          {record.behavior && <p className="text-xs flex justify-between gap-4 mt-1"><span className="opacity-60 text-gray-400">السلوك:</span> <span className="font-black">{record.behavior}</span></p>}
        </div>
      ))}
      {(!dayData.isHoliday && (!dayData.records || dayData.records.length === 0)) && (
        <p className="text-xs text-gray-500 italic text-center mt-2">عطلة يومية أو غياب</p>
      )}
    </div>
  );
};

export const StudentYearView = ({ year, data, onDayClick, viewType }: { year: number, data: any, onDayClick: (date: Date) => void, viewType: 'attendance' | 'evaluation' | 'behavior' }) => {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const daysInYear = getYear(yearStart) % 4 === 0 && (getYear(yearStart) % 100 !== 0 || getYear(yearStart) % 400 === 0) ? 366 : 365;
  const days = Array.from({ length: daysInYear }, (_, i) => addDays(yearStart, i));
  const firstDayOfWeek = getDay(yearStart);
  const startDayIndex = (firstDayOfWeek + 1) % 7;

  return (
    <div className="grid grid-cols-[repeat(53,minmax(0,1fr))] gap-1.5" style={{ direction: 'rtl' }}>
      {Array.from({ length: startDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}
      {days.map(day => {
        const dateString = format(day, 'yyyy-MM-dd');
        const dayData = data[dateString];
        const colorClass = getStudentDayColor(dayData, viewType);

        return (
          <SimpleTooltip key={dateString} content={<StudentDayTooltip day={day} dayData={dayData} />}>
            <div 
              className={cn("w-4 h-4 rounded cursor-pointer transition-transform hover:scale-125 border", colorClass)} 
              onClick={() => onDayClick(day)} 
            />
          </SimpleTooltip>
        );
      })}
    </div>
  );
};

export const StudentQuarterView = ({ year, quarter, data, onDayClick, viewType }: { year: number, quarter: number, data: any, onDayClick: (date: Date) => void, viewType: 'attendance' | 'evaluation' | 'behavior' }) => {
  const startMonthIndex = (quarter - 1) * 3;
  const months = [startMonthIndex, startMonthIndex + 1, startMonthIndex + 2];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {months.map(monthIndex => {
        const monthStart = startOfMonth(new Date(year, monthIndex));
        const daysInMonth = getDaysInMonth(monthStart);
        const firstDay = getDay(monthStart);
        const startDayIndex = (firstDay + 1) % 7;
        const days = Array.from({ length: daysInMonth }, (_, i) => addDays(monthStart, i));

        return (
          <div key={monthIndex} className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-md font-bold mb-3 text-center text-gray-700">
              {format(monthStart, 'MMMM yyyy', { locale: ar })}
            </h3>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startDayIndex }).map((_, i) => <div key={`empty-${monthIndex}-${i}`} />)}
              {days.map(day => {
                const dateString = format(day, 'yyyy-MM-dd');
                const dayData = data[dateString];
                const colorClass = getStudentDayColor(dayData, viewType);
                return (
                  <SimpleTooltip key={dateString} content={<StudentDayTooltip day={day} dayData={dayData} />}>
                    <div 
                      className={cn("aspect-square rounded-md cursor-pointer transition-all hover:ring-2 border", colorClass)} 
                      onClick={() => onDayClick(day)} 
                    />
                  </SimpleTooltip>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const StudentMonthView = ({ year, month, data, onDayClick, viewType }: { year: number, month: number, data: any, onDayClick: (date: Date) => void, viewType: 'attendance' | 'evaluation' | 'behavior' }) => {
  const monthStart = startOfMonth(new Date(year, month));
  const daysInMonth = getDaysInMonth(monthStart);
  const firstDay = getDay(monthStart);
  const startDayIndex = (firstDay + 1) % 7;
  const dayCells = [];

  const weekdays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  for (let i = 0; i < startDayIndex; i++) {
    dayCells.push(<div key={`empty-${i}`} className="aspect-square border rounded-xl bg-gray-50/50" />);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const day = new Date(year, month, i);
    const dateString = format(day, 'yyyy-MM-dd');
    const dayData = data[dateString];
    const colorClass = getStudentDayColor(dayData, viewType);
    dayCells.push(
      <SimpleTooltip key={dateString} content={<StudentDayTooltip day={day} dayData={dayData} />}>
        <div 
          className={cn("aspect-square rounded-xl p-2 border flex flex-col justify-between cursor-pointer transition-all hover:scale-105", colorClass)} 
          onClick={() => onDayClick(day)}
        >
          <span className="font-bold text-lg text-gray-900 mix-blend-multiply opacity-50">{i}</span>
        </div>
      </SimpleTooltip>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {weekdays.map(day => <div key={day} className="text-center font-bold text-gray-400 pb-2 text-xs">{day}</div>)}
      {dayCells}
    </div>
  );
};
