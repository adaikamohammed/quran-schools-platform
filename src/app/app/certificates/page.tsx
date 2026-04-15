"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import type { Student } from "@/lib/types";
import { Award, Medal, CheckCircle2, Search, Printer, Users, User, Loader2 } from "lucide-react";
import SchoolGuard from "@/components/layout/SchoolGuard";
import {
  AttendanceCertificate,
  SurahCompletionCertificate,
  ExcellenceCertificate,
  CertificateData
} from "@/components/certificates/CertificateTemplates";

type CertType = "attendance" | "surah" | "excellence";
type PrintTarget = "single" | "group";

function CertificatesPage() {
  const { user, school, isPrincipal } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuration States
  const [certType, setCertType] = useState<CertType>("attendance");
  const [printTarget, setPrintTarget] = useState<PrintTarget>("single");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Custom Fields
  const [surahName, setSurahName] = useState("");
  const [monthName, setMonthName] = useState("");
  const [reason, setReason] = useState("");

  const loadStudents = useCallback(async () => {
    if (!user?.id || !school?.id) return;
    setLoading(true);
    const db = getDB();

    let studs: Student[];
    if (isPrincipal || user.role === "super_admin") {
      studs = await db.students.where("schoolId").equals(school.id).filter(s => s.status === "نشط").toArray();
    } else {
      studs = await db.students.where("teacherId").equals(user.id).filter(s => s.status === "نشط").toArray();
    }
    
    studs.sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
    setStudents(studs);
    if (studs.length > 0) setSelectedStudentId(studs[0].id);

    setLoading(false);
  }, [user?.id, school?.id, isPrincipal]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const groups = useMemo(() => {
    const g = Array.from(new Set(students.map(s => s.groupName).filter(Boolean)));
    if (g.length > 0 && !selectedGroup) setSelectedGroup(g[0]);
    return g;
  }, [students, selectedGroup]);

  // Derived selected students for printing
  const studentsToPrint = useMemo(() => {
    if (printTarget === "single") {
      return students.filter(s => s.id === selectedStudentId);
    } else {
      return students.filter(s => s.groupName === selectedGroup);
    }
  }, [printTarget, selectedStudentId, selectedGroup, students]);

  // Handle Print Action
  const handlePrint = () => {
    window.print();
  };

  // Build basic certificate data for a student
  const getCertDataForStudent = (s: Student): CertificateData => {
    return {
      studentName: s.fullName,
      schoolName: school?.name || "المدرسة القرآنية",
      directorName: school?.directorName || "المدير العام",
      date: new Date().toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" }),
      hijriDate: new Intl.DateTimeFormat("ar-SA-u-ca-islamic", { year: "numeric", month: "long", day: "numeric" }).format(new Date()),
      surahName: surahName || undefined,
      monthName: monthName || undefined,
      reason: reason || undefined,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 print:m-0 print:p-0" dir="rtl">
      {/* ─── Header (Hidden on Print) ─── */}
      <div className="print:hidden flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3" style={{ fontFamily: "var(--font-headline)" }}>
            <Award className="w-8 h-8 text-[#d4af37]" />
            نظام الشهادات الجماعية
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            تصميم وطباعة شهادات احترافية للطلاب بشكل فردي أو جماعي (لكامل الفوج).
          </p>
        </div>
        <button
          onClick={handlePrint}
          disabled={studentsToPrint.length === 0}
          className="btn-primary py-3 px-8 text-lg shadow-lg hover:shadow-[var(--color-primary)]/40 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Printer className="w-5 h-5" />
          طباعة ({studentsToPrint.length}) شهادة
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 print:hidden">
        {/* ─── Controls Pane ─── */}
        <div className="lg:col-span-1 space-y-6">
          {/* Certificate Type */}
          <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-sm">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Medal className="w-4 h-4 text-[var(--color-primary)]" />
              نوع الشهادة
            </h3>
            <div className="space-y-2">
              {[
                { id: "attendance", label: "شهادة حضور", icon: CheckCircle2 },
                { id: "surah", label: "إتمام سورة", icon: Award },
                { id: "excellence", label: "تميز شهري", icon: Medal },
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setCertType(type.id as CertType)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-sm font-bold
                    ${certType === type.id 
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]" 
                      : "border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"}`}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Selection */}
          <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-sm">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Printer className="w-4 h-4 text-[var(--color-primary)]" />
              الفئة المستهدفة للطبع
            </h3>
            <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1 mb-4">
              <button
                onClick={() => setPrintTarget("single")}
                className={`flex-1 py-2 text-sm font-bold text-center rounded-lg transition-colors flex items-center justify-center gap-2 ${printTarget === "single" ? "bg-white dark:bg-gray-800 shadow text-[var(--color-primary)]" : "text-gray-500"}`}
              >
                <User className="w-4 h-4" />
                طالب واحد
              </button>
              <button
                onClick={() => setPrintTarget("group")}
                className={`flex-1 py-2 text-sm font-bold text-center rounded-lg transition-colors flex items-center justify-center gap-2 ${printTarget === "group" ? "bg-white dark:bg-gray-800 shadow text-[var(--color-primary)]" : "text-gray-500"}`}
              >
                <Users className="w-4 h-4" />
                فوج كامل
              </button>
            </div>

            <AnimatePresence mode="popLayout">
              {printTarget === "single" ? (
                <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}}>
                  <label className="label-xs mb-1.5 block">اختر الطالب</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="input-field text-sm py-2.5 pl-3 pr-9 w-full"
                    >
                      {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                    </select>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}}>
                  <label className="label-xs mb-1.5 block">اختر الفوج</label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="input-field text-sm py-2.5 w-full"
                  >
                    {groups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Custom Fields depending on type */}
          <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-sm">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4">تفاصيل الشهادة</h3>
            
            <AnimatePresence mode="wait">
              {certType === "surah" && (
                <motion.div key="surah" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-4">
                   <div>
                    <label className="label-xs mb-1.5 block">اسم السورة المراد تكريمه عليها</label>
                    <input
                      value={surahName}
                      onChange={(e) => setSurahName(e.target.value)}
                      placeholder="مثال: البقرة، الكهف..."
                      className="input-field text-sm py-2.5 w-full"
                    />
                  </div>
                </motion.div>
              )}

              {certType === "excellence" && (
                <motion.div key="excellence" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-4">
                  <div>
                    <label className="label-xs mb-1.5 block">الشهر أو الفصل</label>
                    <input
                      value={monthName}
                      onChange={(e) => setMonthName(e.target.value)}
                      placeholder="مثال: أكتوبر، الفصل الأول..."
                      className="input-field text-sm py-2.5 w-full"
                    />
                  </div>
                  <div>
                    <label className="label-xs mb-1.5 block">سبب التميز والنص</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="سبب مخصص أو سيتم وضع الافتراضي"
                      className="input-area text-sm w-full h-20"
                    />
                  </div>
                </motion.div>
              )}

              {certType === "attendance" && (
                <motion.div key="att" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                  <p className="text-xs text-gray-500">لا توجد حقول إضافية مطلوبة لهذه الشهادة. جاهزة للطباعة!</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ─── Live Preview Pane ─── */}
        <div className="lg:col-span-3">
          <div className="bg-gray-100 dark:bg-[#111] rounded-3xl p-6 md:p-10 min-h-[600px] flex items-center justify-center overflow-x-auto border border-gray-200 dark:border-white/10 shadow-inner">
            <div 
              style={{
                transform: "scale(0.8)", // Scale down visually for preview
                transformOrigin: "top center",
                width: "297mm",
              }}
              className="pointer-events-none" // ensure they focus on the side controls
            >
              {studentsToPrint.length > 0 ? (
                <>
                  {certType === "surah" && <SurahCompletionCertificate data={getCertDataForStudent(studentsToPrint[0])} />}
                  {certType === "excellence" && <ExcellenceCertificate data={getCertDataForStudent(studentsToPrint[0])} />}
                  {certType === "attendance" && <AttendanceCertificate data={getCertDataForStudent(studentsToPrint[0])} />}
                </>
              ) : (
                <div className="h-full flex items-center justify-center bg-white rounded-3xl w-full" style={{height: '210mm'}}>
                  <p className="text-gray-400 font-bold text-xl">الرجاء اختيار طالب أو فوج صالح.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── HIDDEN PRINT WRAPPER ─── 
          This block is ONLY visible to the browser's print engine.
          It renders a sequence of certificates for all students selected.
      */}
      <div className="hidden print:block !m-0 !p-0">
         {studentsToPrint.map((student) => {
            const data = getCertDataForStudent(student);
            return (
              <div key={student.id}>
                {certType === "surah" && <SurahCompletionCertificate data={data} />}
                {certType === "excellence" && <ExcellenceCertificate data={data} />}
                {certType === "attendance" && <AttendanceCertificate data={data} />}
              </div>
            );
         })}
      </div>
      
    </div>
  );
}

export default function CertificatesPageWrapper() {
  return (
    <SchoolGuard>
      <CertificatesPage />
    </SchoolGuard>
  );
}
