"use client";

import { useMemo } from 'react';
import { DailySession } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen, TrendingUp } from 'lucide-react';

interface Props {
  studentId: string;
  sessions: DailySession[];
}

export default function MemorizationChart({ studentId, sessions }: Props) {
  const data = useMemo(() => {
    // Sort sessions by date (oldest to newest)
    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
    
    const chartData: any[] = [];
    
    sorted.forEach(session => {
      const record = session.records.find(r => r.studentId === studentId);
      if (record && record.attendance === 'حاضر') {
        let versesCount = 0;
        
        if (record.tasmieFromVerse !== undefined && record.tasmieToVerse !== undefined) {
           versesCount = Math.abs(record.tasmieToVerse - record.tasmieFromVerse) + 1;
        } else if (record.fromVerse !== undefined && record.toVerse !== undefined) {
           versesCount = Math.abs(record.toVerse - record.fromVerse) + 1;
        }
        
        // We push the data point if there's any memorization performance or verses.
        // If versesCount is 0 but there is a performance mark, maybe just plot a 1 so it shows up?
        // Or better, let's keep it strictly numerical verses to represent velocity correctly.
        if (versesCount > 0) {
            chartData.push({
              date: new Date(session.date).toLocaleDateString('ar-DZ', { month: 'numeric', day: 'numeric' }),
              fullDate: session.date,
              verses: versesCount,
              performance: record.memorization || 'غير مسجل'
            });
        }
      }
    });
    
    return chartData;
  }, [sessions, studentId]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-8 text-center flex flex-col items-center">
        <TrendingUp className="w-12 h-12 text-gray-200 mb-3" />
        <h3 className="font-bold text-gray-600 mb-1">لا توجد بيانات حفظ كافية</h3>
        <p className="text-xs text-gray-400">يلزم إدخال آيات التسميع (من-إلى) في الحصص اليومية لرسم منحنى سرعة الحفظ.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
      <div className="mb-6 flex items-start gap-4">
         <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
           <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
         </div>
         <div>
            <h3 className="font-black text-gray-800 text-sm">سرعة الحفظ (Memorization Velocity)</h3>
            <p className="text-xs text-gray-400 mt-1">يعرض المنحنى عدد الآيات التي تم تسميعها وإتقانها في كل حصة بمرور الوقت.</p>
         </div>
      </div>
      
      <div className="h-64 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="date" tick={{fontSize: 10, fill: '#9CA3AF', fontFamily: 'var(--font-cairo)'}} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{fontSize: 10, fill: '#9CA3AF', fontFamily: 'var(--font-cairo)'}} axisLine={false} tickLine={false} dx={-10} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', direction: 'rtl', fontFamily: 'var(--font-cairo)' }}
              formatter={(value: any, name: string, props: any) => [`${value} آية (${props.payload.performance})`, 'مقدار التسميع']}
              labelFormatter={(label) => 'التاريخ: ' + label}
            />
            <Line 
              type="monotone" 
              dataKey="verses" 
              stroke="var(--color-primary)" 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
              activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-primary)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
