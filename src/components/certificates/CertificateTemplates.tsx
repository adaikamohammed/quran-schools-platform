"use client";

import React from "react";

// --- Types ---
export interface CertificateData {
  studentName: string;
  schoolName: string;
  directorName: string;
  date: string;
  hijriDate: string;
  // Specific data
  surahName?: string;
  monthName?: string;
  reason?: string;
}

// --- Base Styles for Print ---
// We use a specific wrapper to ensure A4 Landscape printing
export const CertificateWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="certificate-page relative bg-white overflow-hidden mx-auto my-4 bg-cover bg-center shrink-0 border border-gray-200"
      style={{
        width: "297mm",
        height: "210mm",
        pageBreakAfter: "always",
        direction: "rtl",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
};

// 1. شهادة إتمام سورة (Luxurious Green & Gold)
export const SurahCompletionCertificate = ({ data }: { data: CertificateData }) => {
  return (
    <CertificateWrapper>
      {/* Background & Border */}
      <div className="absolute inset-0 bg-[#064e3b] z-0" style={{WebkitPrintColorAdjust: 'exact'}} />
      <div className="absolute inset-[10mm] border-[4px] border-double border-[#d4af37] z-10" />
      <div className="absolute inset-[12mm] border border-[#d4af37]/50 z-10" />

      {/* Corner Ornaments */}
      <div className="absolute top-[10mm] right-[10mm] w-16 h-16 border-t-4 border-r-4 border-[#d4af37] z-20" />
      <div className="absolute top-[10mm] left-[10mm] w-16 h-16 border-t-4 border-l-4 border-[#d4af37] z-20" />
      <div className="absolute bottom-[10mm] right-[10mm] w-16 h-16 border-b-4 border-r-4 border-[#d4af37] z-20" />
      <div className="absolute bottom-[10mm] left-[10mm] w-16 h-16 border-b-4 border-l-4 border-[#d4af37] z-20" />

      <div className="relative z-30 h-full flex flex-col items-center justify-center text-center p-12">
        <h3 className="text-[#d4af37] font-black tracking-widest text-xl mb-4" style={{WebkitPrintColorAdjust: 'exact'}}>
          يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ
        </h3>
        
        <h1 className="text-6xl font-black text-white mt-4 mb-2 drop-shadow-md" style={{ fontFamily: "'Amiri', serif", WebkitPrintColorAdjust: 'exact' }}>
          شَهَادَةُ إِتْمَامِ سُورَة
        </h1>
        <div className="w-64 h-1 mb-10" style={{background: "linear-gradient(90deg, transparent, #d4af37, transparent)", WebkitPrintColorAdjust: 'exact'}} />

        <p className="text-xl text-emerald-100 font-bold mb-4" style={{WebkitPrintColorAdjust: 'exact'}}>
          تشهد إدارة مدرسة <span className="text-[#d4af37] px-2">{data.schoolName}</span> القرآنية
        </p>

        <p className="text-2xl text-emerald-50 mb-2" style={{WebkitPrintColorAdjust: 'exact'}}>بأن الطالب(ة) النجب</p>
        <h2 className="text-7xl font-black text-[#d4af37] my-6 drop-shadow-lg" style={{ fontFamily: "'Amiri', serif", WebkitPrintColorAdjust: 'exact' }}>
          {data.studentName}
        </h2>

        <p className="text-3xl text-white font-bold my-4 leading-relaxed" style={{WebkitPrintColorAdjust: 'exact'}}>
          قد أتم(ت) بفضل الله وتوفيقه حفظ <br />
          <span className="text-4xl text-[#d4af37] block mt-4 border-b-2 border-dashed border-[#d4af37] pb-2 inline-block px-10">
            سُورَة {data.surahName || "ـــــ"}
          </span>
        </p>

        <p className="text-lg text-emerald-100 mt-6" style={{WebkitPrintColorAdjust: 'exact'}}>
          نسأل الله أن يجعله من أهل القرآن الذين هم أهل الله وخاصته، وأن ينفعه بما حفظ.
        </p>

        <div className="absolute bottom-16 left-16 right-16 flex justify-between items-end text-[#d4af37]" style={{WebkitPrintColorAdjust: 'exact'}}>
          <div className="text-center">
            <p className="text-lg font-bold mb-2">التاريخ</p>
            <p className="text-md border-b border-[#d4af37]/30 pb-1 px-4">{data.hijriDate}</p>
            <p className="text-sm mt-1">{data.date}</p>
          </div>

          <div className="w-32 h-32 rounded-full border-2 border-dashed border-[#d4af37]/50 flex items-center justify-center opacity-80" style={{WebkitPrintColorAdjust: 'exact'}}>
            <span className="text-[#d4af37] font-bold rotate-[-15deg] text-xl">خاتم المدرسة</span>
          </div>

          <div className="text-center">
            <p className="text-lg font-bold mb-2">المدير العام</p>
            <p className="text-xl font-black signature border-b border-[#d4af37]/30 pb-1 px-6">{data.directorName}</p>
          </div>
        </div>
      </div>
    </CertificateWrapper>
  );
};

// 2. شهادة تميز شهري (Elegant White & Blue/Gold)
export const ExcellenceCertificate = ({ data }: { data: CertificateData }) => {
  return (
    <CertificateWrapper>
      {/* Background pattern idea via CSS */}
      <div className="absolute inset-0 bg-slate-50 z-0" style={{WebkitPrintColorAdjust: 'exact'}}>
        <div className="absolute inset-0 opacity-[0.05]" 
             style={{ backgroundImage: "repeating-linear-gradient(45deg, #1e3a8a 0, #1e3a8a 2px, transparent 2px, transparent 10px)", WebkitPrintColorAdjust: 'exact' }} />
      </div>
      
      {/* Heavy Blue/Gold Side borders */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] z-10 border-r-4 border-[#d4af37]" style={{WebkitPrintColorAdjust: 'exact'}} />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] z-10 border-l-4 border-[#d4af37]" style={{WebkitPrintColorAdjust: 'exact'}} />

      <div className="relative z-30 h-full flex flex-col justify-center px-24 py-12 text-center mt-4">
        <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-[#1e3a8a] flex items-center justify-center shadow-xl border-4 border-[#d4af37]" style={{WebkitPrintColorAdjust: 'exact'}}>
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>

        <h1 className="text-5xl font-black text-[#1e3a8a] mb-2 tracking-wide" style={{WebkitPrintColorAdjust: 'exact'}}>شهـــادة تميــــز</h1>
        <p className="text-xl text-gray-500 font-bold mb-8 tracking-widest uppercase" style={{WebkitPrintColorAdjust: 'exact'}}>لشهر {data.monthName || "ـــــ"}</p>

        <p className="text-2xl text-gray-700 font-medium" style={{WebkitPrintColorAdjust: 'exact'}}>
          يُسعد <span className="font-bold text-[#1e3a8a]">{data.schoolName}</span> أن تمنح هذه الشهادة للطالب(ة)
        </p>

        <h2 className="text-6xl font-black text-[#d4af37] my-8 drop-shadow-sm" style={{WebkitPrintColorAdjust: 'exact'}}>{data.studentName}</h2>

        <p className="text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto" style={{WebkitPrintColorAdjust: 'exact'}}>
          نظير تفوقه(ا) وتميزه(ا) الملحوظ خلال هذا الشهر الكريم في {data.reason || "حفظ القرآن الكريم وحسن السلوك والأخلاق والالتزام بالحضور."}
        </p>
        <p className="text-xl text-[#1e3a8a] font-bold mt-6" style={{WebkitPrintColorAdjust: 'exact'}}>
          مع تمنياتنا له(ا) بدوام التألق والنجاح.
        </p>

        <div className="flex justify-between items-end mt-auto px-12 pb-4">
          <div className="text-center" style={{WebkitPrintColorAdjust: 'exact'}}>
            <p className="text-gray-500 font-bold mb-2">التاريخ</p>
            <p className="text-gray-800 font-bold">{data.date}</p>
          </div>
          <div style={{WebkitPrintColorAdjust: 'exact'}}>
            <div className="w-40 h-1 bg-gray-300 rounded mb-2 mx-auto"></div>
            <p className="text-gray-500 font-bold">توقيع المعلم والمشرف</p>
          </div>
        </div>
      </div>
    </CertificateWrapper>
  );
};

// 3. شهادة حضور (Clean, Modern, encouraging)
export const AttendanceCertificate = ({ data }: { data: CertificateData }) => {
  return (
    <CertificateWrapper>
      <div className="absolute inset-0 bg-indigo-50 z-0" style={{WebkitPrintColorAdjust: 'exact'}} />
      <div className="absolute inset-4 border-2 border-indigo-200 rounded-3xl z-10" style={{WebkitPrintColorAdjust: 'exact'}} />
      
      {/* Decorative abstract shapes */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply opacity-50 z-0" style={{WebkitPrintColorAdjust: 'exact'}} />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply opacity-50 z-0" style={{WebkitPrintColorAdjust: 'exact'}} />

      <div className="relative z-30 h-full flex flex-col p-16">
        <div className="flex justify-between items-start mb-12">
          <div className="text-right" style={{WebkitPrintColorAdjust: 'exact'}}>
            <h2 className="text-2xl font-black text-indigo-900 mb-1">{data.schoolName}</h2>
            <p className="text-indigo-600 font-medium">قسم المتابعة والتوجيه</p>
          </div>
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg text-white font-black text-2xl" style={{WebkitPrintColorAdjust: 'exact'}}>
            ✓
          </div>
        </div>

        <div className="flex-1 text-center flex flex-col justify-center">
          <h1 className="text-5xl font-black text-slate-800 mb-4" style={{WebkitPrintColorAdjust: 'exact'}}>شَهَادَةُ مُشَارَكَةٍ وَحُضُور</h1>
          <div className="w-24 h-1 bg-indigo-500 mx-auto rounded-full mb-10" style={{WebkitPrintColorAdjust: 'exact'}} />

          <p className="text-2xl text-slate-600 font-medium mb-8" style={{WebkitPrintColorAdjust: 'exact'}}>يُمنح هذا التقدير للطالب(ة) المجتهد(ة)</p>

          <h2 className="text-6xl font-black text-indigo-700 mb-10" style={{WebkitPrintColorAdjust: 'exact'}}>{data.studentName}</h2>

          <p className="text-2xl text-slate-700 leading-relaxed max-w-4xl mx-auto font-medium" style={{WebkitPrintColorAdjust: 'exact'}}>
            تقديراً لالتزامه(ا) الدائم والمستمر، وحضوره(ا) المنتظم للدروس خلال الفترة الماضية. <br/>
            نسأل الله له(ا) التوفيق والسداد.
          </p>
        </div>

        <div className="flex justify-between items-center mt-12 pt-8 border-t border-indigo-200" style={{WebkitPrintColorAdjust: 'exact'}}>
           <div className="text-slate-600 font-bold">
            {data.date}
          </div>
          <div className="text-slate-800 font-black text-xl italic">
            {data.directorName}
          </div>
        </div>
      </div>
    </CertificateWrapper>
  );
};
