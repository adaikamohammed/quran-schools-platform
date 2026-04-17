"use client";

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type ViewType = 'day' | 'week' | 'month';

interface SchoolData {
  createdAt: string;
  country?: string;
}

interface Props {
  data: SchoolData[];
}

export default function SchoolsRegistrationChart({ data }: Props) {
  const [viewType, setViewType] = useState<ViewType>('month');
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');

  // Generate years and countries for dropdown
  const years = useMemo(() => {
    const minYear = data.reduce((min, s) => {
      const y = new Date(s.createdAt).getFullYear();
      return y < min ? y : min;
    }, currentYear - 2);
    
    const res = [];
    for (let y = minYear; y <= currentYear; y++) {
      res.push(y);
    }
    return res.sort((a,b) => b - a);
  }, [data, currentYear]);

  const countries = useMemo(() => {
    const uniqueCountries = new Set<string>();
    data.forEach(s => { if (s.country) uniqueCountries.add(s.country); });
    return Array.from(uniqueCountries).sort();
  }, [data]);

  const chartData = useMemo(() => {
    // Filter data by selected year and country
    const filteredData = data.filter(s => {
      const matchYear = new Date(s.createdAt).getFullYear() === selectedYear;
      const matchCountry = selectedCountry === 'all' || s.country === selectedCountry;
      return matchYear && matchCountry;
    });

    if (viewType === 'month') {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const counts = new Array(12).fill(0);
      filteredData.forEach(s => {
        counts[new Date(s.createdAt).getMonth()] += 1;
      });
      return months.map((m, i) => ({ name: m, count: counts[i] }));
    } 
    
    if (viewType === 'week') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const displayDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const counts = new Array(7).fill(0);
      
      filteredData.forEach(s => {
        let d = new Date(s.createdAt).getDay(); 
        // JS getDay(): 0=Sun, 1=Mon... 
        // We want 0=Mon, 6=Sun
        d = d === 0 ? 6 : d - 1;
        counts[d] += 1;
      });
      return displayDays.map((d, i) => ({ name: d, count: counts[i] }));
    }

    if (viewType === 'day') {
      // Show for current month or just days 1-31 aggregated across the year
      const counts = new Array(31).fill(0);
      filteredData.forEach(s => {
        // getDate() is 1-31
        const day = new Date(s.createdAt).getDate();
        if (day >= 1 && day <= 31) {
          counts[day - 1] += 1;
        }
      });
      const days = [];
      for(let i=1; i<=31; i++) days.push({ name: i.toString(), count: counts[i-1] });
      return days;
    }

    return [];

  }, [data, viewType, selectedYear]);

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 my-6 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 h-8">تسجيل المستخـ... (المدارس)</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewType('day')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${viewType === 'day' ? 'bg-[#ff40b4] text-white' : 'text-[#ff40b4] hover:bg-[#ff40b4]/10'}`}
            >
              يوم
            </button>
            <button 
              onClick={() => setViewType('week')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${viewType === 'week' ? 'bg-[#ff40b4] text-white' : 'text-[#ff40b4] hover:bg-[#ff40b4]/10'}`}
            >
              أسبوع
            </button>
            <button 
              onClick={() => setViewType('month')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${viewType === 'month' ? 'bg-[#ff40b4] text-white' : 'text-[#ff40b4] hover:bg-[#ff40b4]/10'}`}
            >
              شهر
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {countries.length > 0 && (
            <select 
              value={selectedCountry} 
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="border-gray-200 border rounded-lg px-4 py-2 text-sm font-bold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff40b4]/50 flex-1 sm:flex-none"
              dir="rtl"
            >
              <option value="all">كل البلدان</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border-gray-200 border rounded-lg px-4 py-2 text-sm font-bold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff40b4]/50 flex-1 sm:flex-none"
            dir="ltr"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-[400px] w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              axisLine={{ stroke: '#E5E7EB' }} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }} 
              dx={-10}
              allowDecimals={false}
            />
            <Tooltip 
              cursor={{ fill: '#f3f4f6' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}
            />
            <Bar dataKey="count" fill="#ff40b4" radius={[2, 2, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
