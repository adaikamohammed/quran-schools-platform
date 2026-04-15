"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import type { Student, DailySession, Payment, AppUser } from "@/lib/types";
import { motion } from "framer-motion";
import {
  FileText, Printer, Loader2, Users, BookCheck,
  TrendingUp, CreditCard, Calendar, Award, BarChart3,
  School, StarIcon, CheckCircle2
} from "lucide-react";
import SchoolGuard from "@/components/layout/SchoolGuard";

// ─── typeset helpers ──────────────────────────────────────
function fmt(n: number) { return new Intl.NumberFormat("ar-DZ").format(n); }
function pct(a: number, b: number) { return b > 0 ? Math.round((a / b) * 100) : 0; }

// ─── Data Hook ────────────────────────────────────────────
function useAnnualData(year: number) {
  const { user, school, isPrincipal } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    students: Student[];
    sessions: DailySession[];
    payments: Payment[];
    teachers: AppUser[];
  } | null>(null);

  useEffect(() => {
    if (!school?.id) return;
    const load = async () => {
      setLoading(true);
      const db = getDB();

      const [students, allSessions, payments, teachers] = await Promise.all([
        (isPrincipal || user?.role === "super_admin")
          ? db.students.where("schoolId").equals(school.id).toArray()
          : db.students.where("teacherId").equals(user!.id).toArray(),
        (isPrincipal || user?.role === "super_admin")
          ? db.sessions.where("schoolId").equals(school.id).filter(s => s.date.startsWith(String(year))).toArray()
          : db.sessions.where("teacherId").equals(user!.id).filter(s => s.date.startsWith(String(year))).toArray(),
        db.payments.where("schoolId").equals(school.id)
          .filter(p => p.date?.startsWith(String(year))).toArray(),
        db.users.where("schoolId").equals(school.id)
          .filter(u => u.role === "teacher" && u.isActive).toArray(),
      ]);

      setData({ students, sessions: allSessions, payments, teachers });
      setLoading(false);
    };
    load();
  }, [school?.id, year, isPrincipal, user?.id]);

  return { loading, data, school, user };
}

// ─── Computed Analytics ───────────────────────────────────
function useAnalytics(data: ReturnType<typeof useAnnualData>["data"], year: number) {
  return useMemo(() => {
    if (!data) return null;
    const { students, sessions, payments, teachers } = data;

    const activeStudents = students.filter(s => s.status === "نشط");
    const inactiveStudents = students.filter(s => s.status !== "نشط");

    // Attendance
    let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalRecords = 0;
    const monthlyAtt: Record<number, { present: number; total: number }> = {};
    for (let m = 0; m < 12; m++) monthlyAtt[m] = { present: 0, total: 0 };

    sessions.forEach(s => {
      if (["يوم عطلة", "غياب المعلم"].includes(s.sessionType)) return;
      const month = new Date(s.date).getMonth();
      s.records.forEach(r => {
        totalRecords++;
        monthlyAtt[month].total++;
        if (["حاضر", "تعويض", "متأخر"].includes(r.attendance)) {
          totalPresent++;
          monthlyAtt[month].present++;
        }
        if (r.attendance === "غائب") totalAbsent++;
        if (r.attendance === "متأخر") totalLate++;
      });
    });

    const attendanceRate = pct(totalPresent, totalRecords);
    const totalSessions = sessions.filter(s => !["يوم عطلة", "غياب المعلم"].includes(s.sessionType)).length;

    // Memorization
    let totalMemExcellent = 0, totalMemGood = 0, totalMemPoor = 0, totalMemCount = 0;
    sessions.forEach(s => s.records.forEach(r => {
      if (r.memorization) {
        totalMemCount++;
        if (r.memorization === "ممتاز") totalMemExcellent++;
        else if (["جيد جداً", "جيد", "حسن"].includes(r.memorization)) totalMemGood++;
        else if (r.memorization === "لم يحفظ") totalMemPoor++;
      }
    }));

    const totalSurahs = activeStudents.reduce((s, st) => s + (st.memorizedSurahsCount || 0), 0);
    const avgSurahsPerStudent = activeStudents.length > 0
      ? Math.round(totalSurahs / activeStudents.length * 10) / 10 : 0;

    // Financial
    const totalRevenue = payments.filter(p => p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
    const totalPending = payments.filter(p => p.status === "unpaid").reduce((s, p) => s + (p.amount || 0), 0);

    // Per-teacher stats
    const teacherStats = teachers.map(t => {
      const studs = students.filter(s => s.teacherId === t.id && s.status === "نشط");
      const sess = sessions.filter(s => s.teacherId === t.id && !["يوم عطلة", "غياب المعلم"].includes(s.sessionType));
      let p = 0, tot = 0;
      sess.forEach(s => s.records.forEach(r => {
        if (r.attendance) { tot++; if (["حاضر", "تعويض", "متأخر"].includes(r.attendance)) p++; }
      }));
      return { name: t.displayName, groupName: t.groupName || "—", studentCount: studs.length, sessions: sess.length, attendanceRate: pct(p, tot) };
    }).filter(t => t.studentCount > 0).sort((a, b) => b.attendanceRate - a.attendanceRate);

    // Monthly attendance chart data
    const MONTHS = ["جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان", "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const monthlyChart = MONTHS.map((label, m) => ({
      label,
      rate: pct(monthlyAtt[m].present, monthlyAtt[m].total),
      hasData: monthlyAtt[m].total > 0,
    }));

    return {
      activeStudents, inactiveStudents, attendanceRate,
      totalPresent, totalAbsent, totalLate, totalRecords, totalSessions,
      totalMemExcellent, totalMemGood, totalMemPoor, totalMemCount,
      totalSurahs, avgSurahsPerStudent,
      totalRevenue, totalPending,
      teacherStats, monthlyChart,
    };
  }, [data, year]);
}

// ─── Print Report Component ───────────────────────────────
function PrintReport({ school, year, analytics, data }: {
  school: any;
  year: number;
  analytics: ReturnType<typeof useAnalytics>;
  data: ReturnType<typeof useAnnualData>["data"];
}) {
  if (!analytics || !data) return null;

  const today = new Date().toLocaleDateString("ar-DZ", { day: "numeric", month: "long", year: "numeric" });
  const maxMonthRate = Math.max(...analytics.monthlyChart.filter(m => m.hasData).map(m => m.rate), 1);

  return (
    <div id="annual-report-print" className="hidden print:block" dir="rtl" style={{ fontFamily: "Arial, sans-serif" }}>
      <style>{`
        @page { size: A4; margin: 15mm 12mm; }
        @media print {
          body > div:not(#annual-report-print) { display: none !important; }
          #annual-report-print { display: block !important; color-adjust: exact; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .page-break { page-break-before: always; }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── PAGE 1: Cover & KPIs ── */}
      <div style={{ minHeight: "270mm" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #166534, #15803d)", color: "white", borderRadius: 12, padding: "20px 24px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 11, opacity: 0.7, margin: "0 0 4px 0" }}>التقرير السنوي الرسمي</p>
              <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px 0" }}>{school?.name || "المدرسة القرآنية"}</h1>
              <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>السنة الدراسية {year} — {year + 1}</p>
            </div>
            <div style={{ textAlign: "center", background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 16px" }}>
              <p style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>📖</p>
              <p style={{ fontSize: 10, opacity: 0.8, margin: "4px 0 0 0" }}>منصة المدارس القرآنية</p>
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.2)", display: "flex", gap: 24, fontSize: 11, opacity: 0.75 }}>
            <span>📅 تاريخ الإصدار: {today}</span>
            {school?.country && <span>📍 {school.country}</span>}
            {school?.phone && <span>📞 {school.phone}</span>}
          </div>
        </div>

        {/* Section Title */}
        <h2 style={{ fontSize: 14, fontWeight: 900, color: "#166534", borderRight: "4px solid #16a34a", paddingRight: 10, margin: "0 0 14px 0" }}>
          المؤشرات الرئيسية للعام
        </h2>

        {/* KPI Grid 4x2 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
          {[
            { label: "إجمالي الطلاب", value: fmt(data.students.length), sub: `${analytics.activeStudents.length} نشط`, color: "#16a34a", icon: "👥" },
            { label: "معدل الحضور", value: `${analytics.attendanceRate}%`, sub: `${fmt(analytics.totalPresent)} حاضر`, color: "#2563eb", icon: "✅" },
            { label: "إجمالي الحصص", value: fmt(analytics.totalSessions), sub: `${fmt(analytics.totalRecords)} سجل`, color: "#7c3aed", icon: "📋" },
            { label: "إجمالي السور المحفوظة", value: fmt(analytics.totalSurahs), sub: `${analytics.avgSurahsPerStudent} متوسط/طالب`, color: "#d97706", icon: "📚" },
            { label: "تقييمات ممتاز", value: fmt(analytics.totalMemExcellent), sub: `من ${fmt(analytics.totalMemCount)} تقييم`, color: "#059669", icon: "⭐" },
            { label: "المعلمون النشطون", value: fmt(data.teachers.length), sub: `فريق التدريس`, color: "#0891b2", icon: "👨‍🏫" },
            { label: "الإيرادات المحصّلة", value: `${fmt(analytics.totalRevenue)} د.ج`, sub: `معلق: ${fmt(analytics.totalPending)} د.ج`, color: "#15803d", icon: "💰" },
            { label: "متوسط الحضور الشهري", value: `${Math.round(analytics.monthlyChart.filter(m => m.hasData).reduce((s, m) => s + m.rate, 0) / Math.max(analytics.monthlyChart.filter(m => m.hasData).length, 1))}%`, sub: "عبر الأشهر النشطة", color: "#dc2626", icon: "📊" },
          ].map((card, i) => (
            <div key={i} style={{ background: "#f8fafc", border: `1px solid ${card.color}30`, borderRadius: 8, padding: "10px 12px", borderRight: `3px solid ${card.color}` }}>
              <p style={{ fontSize: 16, margin: "0 0 4px 0" }}>{card.icon}</p>
              <p style={{ fontSize: 18, fontWeight: 900, color: card.color, margin: "0 0 2px 0" }}>{card.value}</p>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#374151", margin: "0 0 2px 0" }}>{card.label}</p>
              <p style={{ fontSize: 9, color: "#9ca3af", margin: 0 }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Monthly Attendance Chart (text-based bar) */}
        <h2 style={{ fontSize: 14, fontWeight: 900, color: "#166534", borderRight: "4px solid #16a34a", paddingRight: 10, margin: "0 0 12px 0" }}>
          منحنى الحضور الشهري
        </h2>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16, border: "1px solid #e5e7eb", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, justifyContent: "center" }}>
            {analytics.monthlyChart.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                {m.hasData ? (
                  <div style={{
                    width: "100%",
                    height: `${Math.round((m.rate / maxMonthRate) * 70)}px`,
                    background: m.rate >= 80 ? "#16a34a" : m.rate >= 60 ? "#d97706" : "#dc2626",
                    borderRadius: "3px 3px 0 0",
                    minHeight: 4,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    paddingTop: 2,
                  }}>
                    <span style={{ fontSize: 7, color: "white", fontWeight: 700 }}>{m.rate}%</span>
                  </div>
                ) : (
                  <div style={{ width: "100%", height: 4, background: "#e5e7eb", borderRadius: 2 }} />
                )}
                <p style={{ fontSize: 7, color: "#6b7280", marginTop: 3, textAlign: "center", fontWeight: 700 }}>
                  {m.label.slice(0, 3)}
                </p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8, fontSize: 8, color: "#6b7280" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ display: "inline-block", width: 8, height: 8, background: "#16a34a", borderRadius: 2 }} />≥80%</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ display: "inline-block", width: 8, height: 8, background: "#d97706", borderRadius: 2 }} />60–79%</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ display: "inline-block", width: 8, height: 8, background: "#dc2626", borderRadius: 2 }} />&lt;60%</span>
          </div>
        </div>

        {/* Attendance breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 11, fontWeight: 900, color: "#374151", marginBottom: 10 }}>توزيع الحضور السنوي</p>
            {[
              { label: "حاضر", value: analytics.totalPresent, color: "#16a34a" },
              { label: "متأخر", value: analytics.totalLate, color: "#d97706" },
              { label: "غائب", value: analytics.totalAbsent, color: "#dc2626" },
            ].map(item => {
              const p = pct(item.value, analytics.totalRecords);
              return (
                <div key={item.label} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, color: "#374151" }}>{item.label}</span>
                    <span style={{ fontWeight: 900, color: item.color }}>{fmt(item.value)} ({p}%)</span>
                  </div>
                  <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${p}%`, height: "100%", background: item.color, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 11, fontWeight: 900, color: "#374151", marginBottom: 10 }}>توزيع تقييم الحفظ</p>
            {[
              { label: "ممتاز", value: analytics.totalMemExcellent, color: "#16a34a" },
              { label: "جيد وأعلى", value: analytics.totalMemGood, color: "#2563eb" },
              { label: "لم يحفظ", value: analytics.totalMemPoor, color: "#dc2626" },
            ].map(item => {
              const p = pct(item.value, analytics.totalMemCount);
              return (
                <div key={item.label} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, color: "#374151" }}>{item.label}</span>
                    <span style={{ fontWeight: 900, color: item.color }}>{fmt(item.value)} ({p}%)</span>
                  </div>
                  <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${p}%`, height: "100%", background: item.color, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── PAGE 2: Teachers + Financial ── */}
      <div className="page-break">

        {/* Page 2 header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "2px solid #16a34a", marginBottom: 18 }}>
          <p style={{ fontSize: 13, fontWeight: 900, color: "#166534" }}>{school?.name} — التقرير السنوي {year}</p>
          <p style={{ fontSize: 10, color: "#9ca3af" }}>الصفحة 2 من 2</p>
        </div>

        <h2 style={{ fontSize: 14, fontWeight: 900, color: "#166534", borderRight: "4px solid #16a34a", paddingRight: 10, margin: "0 0 12px 0" }}>
          أداء الأفواج والمعلمين
        </h2>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, marginBottom: 20 }}>
          <thead>
            <tr style={{ background: "#16a34a", color: "white" }}>
              <th style={{ padding: "7px 10px", textAlign: "right", borderRadius: "0 4px 0 0" }}>#</th>
              <th style={{ padding: "7px 10px", textAlign: "right" }}>المعلم</th>
              <th style={{ padding: "7px 10px", textAlign: "right" }}>الفوج</th>
              <th style={{ padding: "7px 10px", textAlign: "center" }}>الطلاب</th>
              <th style={{ padding: "7px 10px", textAlign: "center" }}>الحصص</th>
              <th style={{ padding: "7px 10px", textAlign: "center", borderRadius: "0 0 0 4px" }}>الحضور %</th>
            </tr>
          </thead>
          <tbody>
            {analytics.teacherStats.map((t, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#f9fafb" : "white" }}>
                <td style={{ padding: "6px 10px", color: "#6b7280" }}>{i + 1}</td>
                <td style={{ padding: "6px 10px", fontWeight: 700 }}>{t.name}</td>
                <td style={{ padding: "6px 10px", color: "#374151" }}>{t.groupName}</td>
                <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: 700 }}>{t.studentCount}</td>
                <td style={{ padding: "6px 10px", textAlign: "center" }}>{t.sessions}</td>
                <td style={{ padding: "6px 10px", textAlign: "center" }}>
                  <span style={{
                    fontWeight: 900,
                    color: t.attendanceRate >= 80 ? "#16a34a" : t.attendanceRate >= 60 ? "#d97706" : "#dc2626"
                  }}>
                    {t.attendanceRate}%
                  </span>
                </td>
              </tr>
            ))}
            {analytics.teacherStats.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "12px", textAlign: "center", color: "#9ca3af" }}>لا توجد بيانات كافية</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Financial Summary */}
        <h2 style={{ fontSize: 14, fontWeight: 900, color: "#166534", borderRight: "4px solid #16a34a", paddingRight: 10, margin: "0 0 12px 0" }}>
          الملخص المالي
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "إجمالي الإيرادات المحصّلة", value: `${fmt(analytics.totalRevenue)} د.ج`, color: "#16a34a", desc: "المدفوعات المؤكدة" },
            { label: "المبالغ المعلقة", value: `${fmt(analytics.totalPending)} د.ج`, color: "#d97706", desc: "بانتظار الدفع" },
            { label: "إجمالي الفاتورات", value: `${fmt(data.payments.length)} وصل`, color: "#7c3aed", desc: `خلال عام ${year}` },
          ].map((card, i) => (
            <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 14px", border: `1px solid ${card.color}25`, borderRight: `3px solid ${card.color}` }}>
              <p style={{ fontSize: 9, color: "#9ca3af", margin: "0 0 4px 0" }}>{card.desc}</p>
              <p style={{ fontSize: 16, fontWeight: 900, color: card.color, margin: "0 0 2px 0" }}>{card.value}</p>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#374151", margin: 0 }}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* Summary & Recommendations */}
        <h2 style={{ fontSize: 14, fontWeight: 900, color: "#166534", borderRight: "4px solid #16a34a", paddingRight: 10, margin: "0 0 12px 0" }}>
          الخلاصة والتوصيات
        </h2>
        <div style={{ background: "#f0fdf4", borderRadius: 10, padding: 16, border: "1px solid #bbf7d0", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 10, color: "#374151" }}>
            {[
              analytics.attendanceRate >= 80 ? "✅ معدل الحضور ممتاز (أعلى من 80%)" : analytics.attendanceRate >= 60 ? "⚠️ معدل الحضور مقبول — يُنصح بتعزيزه" : "🔴 معدل الحضور منخفض — يتطلب تدخلاً عاجلاً",
              analytics.activeStudents.length > 0 ? `✅ ${analytics.activeStudents.length} طالب نشط — مجتمع تعليمي فعّال` : "⚠️ لم يتم تسجيل طلاب نشطين",
              analytics.avgSurahsPerStudent >= 5 ? `✅ متوسط ${analytics.avgSurahsPerStudent} سورة/طالب — نتيجة ممتازة` : `📝 متوسط ${analytics.avgSurahsPerStudent} سورة/طالب — هناك مجال للتحسين`,
              analytics.totalRevenue > 0 ? `✅ إيرادات محصّلة: ${fmt(analytics.totalRevenue)} د.ج` : "⚠️ لم تُسجّل إيرادات لهذا العام",
              analytics.teacherStats.length > 0 ? `✅ ${analytics.teacherStats.length} معلم نشط يغطون المدرسة` : "⚠️ لم يتم تسجيل معلمين نشطين",
              analytics.totalSessions > 0 ? `✅ ${fmt(analytics.totalSessions)} حصة مسجّلة بنجاح` : "⚠️ لم تُسجّل حصص لهذا العام",
            ].map((point, i) => (
              <p key={i} style={{ margin: "0 0 6px 0", lineHeight: 1.5 }}>{point}</p>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 9, color: "#9ca3af" }}>
          <p style={{ margin: 0 }}>تم إنشاء هذا التقرير بواسطة منصة المدارس القرآنية • {today}</p>
          <p style={{ margin: 0 }}>© {year} {school?.name} — جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
function AnnualReportPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { school } = useAuth();
  const { loading, data } = useAnnualData(selectedYear);
  const analytics = useAnalytics(data, selectedYear);

  const handlePrint = () => window.print();

  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="max-w-5xl mx-auto space-y-6 print:m-0" dir="rtl">

      {/* ── Print-only report ── */}
      {analytics && data && (
        <PrintReport school={school} year={selectedYear} analytics={analytics} data={data} />
      )}

      {/* ── Screen UI ── */}
      <div className="print:hidden space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3" style={{ fontFamily: "var(--font-headline)" }}>
              <FileText className="w-7 h-7 text-emerald-600" />
              التقرير السنوي
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              تقرير شامل جاهز للطباعة والتقديم للجهات المانحة والجمعيات
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl overflow-hidden border border-[var(--color-border)]">
              {years.map(y => (
                <button key={y} onClick={() => setSelectedYear(y)}
                  className={`px-4 py-2 text-sm font-bold transition-colors ${selectedYear === y ? "bg-emerald-600 text-white" : "bg-white dark:bg-white/5 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10"}`}>
                  {y}
                </button>
              ))}
            </div>
            <button onClick={handlePrint} disabled={loading || !analytics}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 transition-colors shadow-lg shadow-emerald-600/25">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              طباعة PDF
            </button>
          </div>
        </div>

        {/* Preview Banner */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-l from-emerald-700 to-emerald-900 rounded-3xl p-6 text-white">
          <div className="absolute inset-0 islamic-pattern opacity-10" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex-1">
              <p className="text-emerald-300 text-sm font-medium mb-1">التقرير السنوي الرسمي</p>
              <h2 className="text-xl font-black" style={{ fontFamily: "var(--font-headline)" }}>
                {school?.name || "مدرستك القرآنية"}
              </h2>
              <p className="text-emerald-200 text-sm mt-1">السنة الدراسية {selectedYear} – {selectedYear + 1}</p>
              <p className="text-emerald-300/70 text-xs mt-3 leading-relaxed max-w-lg">
                هذا التقرير مصمّم ليُقدَّم للجهات المانحة، اللجان التعليمية، والجمعيات الخيرية.
                يحتوي على المؤشرات الرئيسية، منحنى الحضور، أداء الأفواج، والملخص المالي كاملاً.
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">📊</div>
              <p className="text-xs text-emerald-300">صفحتان · A4</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Preview */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : analytics ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "إجمالي الطلاب", value: data!.students.length, sub: `${analytics.activeStudents.length} نشط`, icon: Users, color: "from-emerald-500 to-green-600" },
                { label: "معدل الحضور السنوي", value: `${analytics.attendanceRate}%`, sub: `${fmt(analytics.totalPresent)} حضور`, icon: TrendingUp, color: "from-blue-500 to-indigo-600" },
                { label: "السور المحفوظة", value: fmt(analytics.totalSurahs), sub: `متوسط ${analytics.avgSurahsPerStudent}/طالب`, icon: BookCheck, color: "from-amber-500 to-orange-500" },
                { label: "الإيرادات المحصّلة", value: `${fmt(analytics.totalRevenue)} د.ج`, sub: `معلق ${fmt(analytics.totalPending)}`, icon: CreditCard, color: "from-purple-500 to-violet-600" },
                { label: "الحصص السنوية", value: fmt(analytics.totalSessions), sub: `${fmt(analytics.totalRecords)} سجل حضور`, icon: Calendar, color: "from-cyan-500 to-blue-500" },
                { label: "تقييمات ممتاز", value: fmt(analytics.totalMemExcellent), sub: `${pct(analytics.totalMemExcellent, analytics.totalMemCount)}% من الكل`, icon: StarIcon, color: "from-yellow-500 to-amber-500" },
                { label: "المعلمون النشطون", value: data!.teachers.length, sub: "فريق التدريس", icon: Users, color: "from-rose-500 to-pink-600" },
                { label: "أفواج المقارنة", value: analytics.teacherStats.length, sub: "فوج في المدرسة", icon: BarChart3, color: "from-teal-500 to-emerald-500" },
              ].map((card, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4 hover:shadow-md transition-shadow">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                    <card.icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xl font-black text-gray-900 dark:text-white" style={{ fontFamily: "var(--font-headline)" }}>{card.value}</p>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mt-0.5">{card.label}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{card.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Teacher Preview Table */}
            {analytics.teacherStats.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-[var(--color-border)] bg-gray-50/50 dark:bg-white/3">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-black text-gray-800 dark:text-white">أداء الأفواج والمعلمين</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {analytics.teacherStats.slice(0, 6).map((t, i) => (
                    <div key={i} className="flex items-center gap-4 p-3.5">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                        i === 1 ? "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400" :
                        "bg-white dark:bg-white/5 text-gray-500 border border-[var(--color-border)]"
                      }`}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 dark:text-white">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.groupName} · {t.studentCount} طالب</p>
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-black ${t.attendanceRate >= 80 ? "text-emerald-600" : t.attendanceRate >= 60 ? "text-amber-600" : "text-red-500"}`}>{t.attendanceRate}%</p>
                        <p className="text-[10px] text-gray-400">{t.sessions} حصة</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Print CTA */}
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-black text-emerald-900 dark:text-emerald-200 text-sm">التقرير جاهز للطباعة!</p>
                  <p className="text-emerald-700 dark:text-emerald-300 text-xs mt-0.5">اضغط "طباعة PDF" للحصول على ملف A4 احترافي من صفحتين</p>
                </div>
              </div>
              <button onClick={handlePrint}
                className="mr-auto shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm">
                <Printer className="w-4 h-4" /> طباعة / حفظ كـ PDF
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-12 text-center">
            <FileText className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="font-bold text-gray-500">لا توجد بيانات لعام {selectedYear}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnnualReportWrapper() {
  return (
    <SchoolGuard>
      <AnnualReportPage />
    </SchoolGuard>
  );
}
