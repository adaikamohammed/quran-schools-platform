"use client";
import SchoolGuard from "@/components/layout/SchoolGuard";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import { createIssuedDocument, logActivity } from "@/lib/storage/mutations";
import type { Student, AppUser, Payment, IssuedDocument, DocumentType } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Award, ClipboardList, DollarSign, User,
  Download, Printer, Search, Plus, X, Loader2,
  CheckCircle2, Star, BookOpen, Calendar, Users,
  ChevronDown, ArrowLeft,
} from "lucide-react";

// ─── أنواع الوثائق ────────────────────────────────────────

const DOC_TYPES: Array<{
  type: DocumentType;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  gradient: string;
  desc: string;
}> = [
  {
    type: "شهادة_تقدير",
    label: "شهادة تقدير",
    icon: Award,
    color: "text-amber-700",
    bg: "bg-amber-50",
    gradient: "from-amber-500 to-orange-600",
    desc: "منح شهادة تقدير وتكريم للطلاب المتميزين",
  },
  {
    type: "وصل_دفع",
    label: "وصل دفع",
    icon: DollarSign,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    gradient: "from-emerald-500 to-green-600",
    desc: "توليد وصل دفع للاشتراكات المحصولة",
  },
  {
    type: "كشف_حضور",
    label: "كشف الحضور",
    icon: ClipboardList,
    color: "text-blue-700",
    bg: "bg-blue-50",
    gradient: "from-blue-500 to-indigo-600",
    desc: "طباعة قائمة الحضور الأسبوعية أو الشهرية",
  },
  {
    type: "تقرير_طالب",
    label: "تقرير طالب",
    icon: BookOpen,
    color: "text-purple-700",
    bg: "bg-purple-50",
    gradient: "from-purple-500 to-violet-600",
    desc: "تقرير شامل لأداء وتقدم الطالب",
  },
  {
    type: "قائمة_طلاب",
    label: "قائمة الطلاب",
    icon: Users,
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    gradient: "from-indigo-500 to-blue-600",
    desc: "كشف بأسماء طلاب الفوج أو المدرسة",
  },
  {
    type: "نموذج_تسجيل",
    label: "نموذج تسجيل",
    icon: FileText,
    color: "text-gray-700",
    bg: "bg-gray-100",
    gradient: "from-gray-500 to-gray-700",
    desc: "نموذج التسجيل الرسمي للطلاب الجدد",
  },
];

// ─── وظيفة الطباعة ────────────────────────────────────────

function printDocument(html: string, title: string) {
  const win = window.open("", "_blank", "width=800,height=600");
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Amiri', serif; direction: rtl; padding: 40px; color: #1a1a1a; }
        .header { text-align: center; border-bottom: 3px double #8B4513; padding-bottom: 20px; margin-bottom: 30px; }
        .school-name { font-size: 26px; font-weight: bold; color: #5D2E0C; }
        .doc-title { font-size: 22px; color: #333; margin: 10px 0; }
        .date-line { font-size: 13px; color: #666; }
        .content { line-height: 2; font-size: 16px; }
        .content table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .content td, .content th { border: 1px solid #ddd; padding: 8px 12px; text-align: right; }
        .content th { background: #f5f5f5; font-weight: bold; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 13px; }
        .seal { text-align: center; margin-top: 30px; }
        @media print {
          body { padding: 20px; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      ${html}
      <script>window.onload = () => window.print();<\/script>
    </body>
    </html>
  `);
  win.document.close();
}

// ─── منشئ محتوى الوثائق ──────────────────────────────────

function buildDocumentHTML(
  type: DocumentType,
  student: Student | null,
  students: Student[],
  school: any,
  user: any,
  options: Record<string, string>
): string {
  const date = new Date().toLocaleDateString("ar-DZ", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const hijri = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
    year: "numeric", month: "long", day: "numeric",
  }).format(new Date());

  const header = `
    <div class="header">
      <div class="school-name">🕌 ${school?.name ?? "المدرسة القرآنية"}</div>
      <div class="doc-title">${DOC_TYPES.find(d => d.type === type)?.label ?? type}</div>
      <div class="date-line">${date} | ${hijri}</div>
    </div>
  `;

  if (type === "شهادة_تقدير" && student) {
    return `${header}
      <div class="content" style="text-align:center; padding: 30px 0;">
        <p style="font-size:18px;">تشهد إدارة مدرسة <strong>${school?.name}</strong></p>
        <p style="font-size:24px; font-weight:bold; margin: 20px 0; color:#8B4513;">⭐ ${student.fullName} ⭐</p>
        <p style="font-size:16px;">بأنه/بأنها طالب(ة) متميز(ة) وجدير(ة) بهذه الشهادة تقديراً وتكريماً على</p>
        <p style="font-size:18px; margin: 10px 0; font-weight:bold;">${options.reason ?? "تميزه في حفظ القرآن الكريم وحسن سلوكه"}</p>
        <p style="margin-top: 30px;">ونسأل الله أن يبارك في علمه ويجعله من أهل القرآن</p>
        <div class="footer">
          <div>خاتم المدرسة:<br/><br/>_____________</div>
          <div class="seal">🌟</div>
          <div>توقيع المدير:<br/><br/>_____________</div>
        </div>
      </div>`;
  }

  if (type === "وصل_دفع" && student) {
    return `${header}
      <div class="content">
        <table>
          <tr><th>البيان</th><th>التفاصيل</th></tr>
          <tr><td>اسم الطالب</td><td><strong>${student.fullName}</strong></td></tr>
          <tr><td>الفوج</td><td>${student.groupName}</td></tr>
          <tr><td>الفئة</td><td>${student.subscriptionTier}</td></tr>
          <tr><td>الفصل الدراسي</td><td>${options.season ?? "—"}</td></tr>
          <tr><td>المبلغ المدفوع</td><td><strong>${options.amount ?? "—"} دج</strong></td></tr>
          <tr><td>تاريخ الدفع</td><td>${date}</td></tr>
        </table>
        <div class="footer">
          <div>توقيع المستلم: _____________</div>
          <div>وصل رقم: ${Math.floor(Math.random() * 9000) + 1000}</div>
        </div>
      </div>`;
  }

  if (type === "قائمة_طلاب" || type === "كشف_حضور") {
    const rows = students
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"))
      .map((s, i) => `<tr>
        <td>${i + 1}</td>
        <td>${s.fullName}</td>
        ${type === "كشف_حضور" ? "<td></td><td></td><td></td>" : `<td>${s.gender}</td><td>${s.groupName}</td>`}
      </tr>`)
      .join("");

    const headers = type === "كشف_حضور"
      ? "<tr><th>م</th><th>اسم الطالب</th><th>حاضر</th><th>غائب</th><th>متأخر</th></tr>"
      : "<tr><th>م</th><th>اسم الطالب</th><th>الجنس</th><th>الفوج</th></tr>";

    return `${header}
      <div class="content">
        ${options.groupName ? `<p><strong>الفوج:</strong> ${options.groupName}</p><br/>` : ""}
        <table>${headers}${rows}</table>
        <div class="footer">
          <p>إجمالي الطلاب: ${students.length}</p>
          <p>اسم المعلم: ${user?.displayName ?? "___"}</p>
        </div>
      </div>`;
  }

  return `${header}<div class="content"><p>تم إصدار هذا النموذج من منصة مدارس القرآن.</p></div>`;
}

// ─── نافذة توليد الوثيقة ─────────────────────────────────

function DocumentModal({
  docType,
  students,
  school,
  user,
  onIssue,
  onClose,
}: {
  docType: (typeof DOC_TYPES)[0];
  students: Student[];
  school: any;
  user: any;
  onIssue: (doc: IssuedDocument) => void;
  onClose: () => void;
}) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [season, setSeason] = useState("2026-S1");
  const [saving, setSaving] = useState(false);

  const needsStudent = ["شهادة_تقدير", "وصل_دفع", "تقرير_طالب"].includes(docType.type);
  const selectedStudent = students.find(s => s.id === selectedStudentId) ?? null;

  const SEASONS = [
    { value: "2025-S1", label: "الفصل الأول 2025" },
    { value: "2025-S2", label: "الفصل الثاني 2025" },
    { value: "2026-S1", label: "الفصل الأول 2026" },
    { value: "2026-S2", label: "الفصل الثاني 2026" },
  ];

  const handlePrint = async () => {
    setSaving(true);
    const options: Record<string, string> = { reason, season, amount: "1200" };
    const html = buildDocumentHTML(
      docType.type,
      needsStudent ? selectedStudent : null,
      students,
      school,
      user,
      options
    );
    const title = `${docType.label} — ${needsStudent ? selectedStudent?.fullName : school?.name}`;
    printDocument(html, title);

    // تسجيل الوثيقة
    const doc = await createIssuedDocument({
      schoolId: school?.id ?? "",
      issuedBy: user?.id ?? "",
      issuedByName: user?.displayName ?? "",
      documentType: docType.type,
      recipientId: needsStudent ? selectedStudentId : undefined,
      recipientName: needsStudent ? selectedStudent?.fullName : undefined,
      title,
    });

    // تسجيل النشاط
    await logActivity({
      schoolId: school?.id ?? "",
      userId: user?.id ?? "",
      userName: user?.displayName ?? "",
      userRole: user?.role,
      action: "export_document",
      entityType: "school",
      entityName: title,
      description: `تم إصدار وطباعة: ${title}`,
    });

    onIssue(doc);
    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        key="doc-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        key="doc-modal"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white dark:bg-[#1a1d2a] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className={`flex items-center justify-between p-5 bg-gradient-to-l ${docType.gradient} text-white`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <docType.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm">{docType.label}</h3>
                <p className="text-xs text-white/70">{docType.desc}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* اختيار الطالب */}
            {needsStudent && (
              <div>
                <label className="label-xs mb-1.5 block">الطالب المستهدف</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="input-field text-sm py-2.5 w-full"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName} — {s.groupName}</option>
                  ))}
                </select>
              </div>
            )}

            {/* سبب شهادة التقدير */}
            {docType.type === "شهادة_تقدير" && (
              <div>
                <label className="label-xs mb-1.5 block">سبب التكريم</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="مثال: تفوقه في حفظ جزء عم..."
                  className="input-field text-sm py-2.5 w-full"
                />
              </div>
            )}

            {/* الفصل لوصل الدفع */}
            {docType.type === "وصل_دفع" && (
              <div>
                <label className="label-xs mb-1.5 block">الفصل الدراسي</label>
                <select value={season} onChange={(e) => setSeason(e.target.value)} className="input-field text-sm py-2.5 w-full">
                  {SEASONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            )}

            {/* ملاحظة */}
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
              <Printer className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                سيتم فتح نافذة الطباعة تلقائياً. يمكنك حفظها كـ PDF من خيارات الطابعة.
              </p>
            </div>
          </div>

          <div className="flex gap-3 px-5 pb-5">
            <button onClick={onClose} className="btn-secondary flex-1 py-2.5 justify-center text-sm">
              إلغاء
            </button>
            <button
              onClick={handlePrint}
              disabled={saving || (needsStudent && !selectedStudentId)}
              className={`flex-1 py-2.5 justify-center text-sm flex items-center gap-2 rounded-xl font-bold text-white bg-gradient-to-l ${docType.gradient} hover:opacity-90 disabled:opacity-40 transition-opacity`}
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الإصدار...</>
                : <><Printer className="w-4 h-4" /> طباعة الوثيقة</>
              }
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────

function DocumentsPage() {
  const { user, school, isPrincipal } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [issuedDocs, setIssuedDocs] = useState<IssuedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDocType, setActiveDocType] = useState<(typeof DOC_TYPES)[0] | null>(null);

  const load = useCallback(async () => {
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

    const docs = await db.issuedDocuments.where("schoolId").equals(school.id).toArray();
    docs.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
    setIssuedDocs(docs);

    setLoading(false);
  }, [user?.id, school?.id, isPrincipal]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
      {/* رأس */}
      <div>
        <h1
          className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          <FileText className="w-6 h-6 text-[var(--color-primary)]" />
          مركز الوثائق
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          إصدار وطباعة الشهادات والوثائق الرسمية للمدرسة
        </p>
      </div>

      {/* بطاقات أنواع الوثائق */}
      <div>
        <h2 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          إصدار وثيقة جديدة
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {DOC_TYPES.map((dt, i) => (
            <motion.button
              key={dt.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setActiveDocType(dt)}
              className="relative group p-4 bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] hover:shadow-lg hover:border-[var(--color-primary)]/20 dark:hover:border-white/10 transition-all duration-300 text-right"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${dt.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                <dt.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-black text-gray-800 dark:text-white">{dt.label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">{dt.desc}</p>
              <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Printer className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* سجل الوثائق المُصدرة */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <h2 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          آخر الوثائق المُصدرة
        </h2>

        <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/8 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 dark:bg-white/8 rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-gray-100 dark:bg-white/8 rounded animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : issuedDocs.length === 0 ? (
            <div className="text-center py-14">
              <FileText className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-400 dark:text-gray-500">لم يتم إصدار أي وثائق بعد</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">اختر نوع الوثيقة أعلاه للبدء</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {issuedDocs.slice(0, 20).map((doc, i) => {
                const cfg = DOC_TYPES.find(d => d.type === doc.documentType);
                const Icon = cfg?.icon ?? FileText;
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50/50 dark:hover:bg-white/3 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-xl ${cfg?.bg ?? "bg-gray-100"} dark:bg-white/8 flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4.5 h-4.5 ${cfg?.color ?? "text-gray-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{doc.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {doc.issuedByName} · {new Date(doc.issuedAt).toLocaleDateString("ar-DZ")}
                      </p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full shrink-0 ${cfg?.bg ?? "bg-gray-100"} ${cfg?.color ?? "text-gray-600"}`}>
                      {cfg?.label ?? doc.documentType}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal */}
      {activeDocType && (
        <DocumentModal
          docType={activeDocType}
          students={students}
          school={school}
          user={user}
          onIssue={(doc) => setIssuedDocs((prev) => [doc, ...prev])}
          onClose={() => setActiveDocType(null)}
        />
      )}
    </div>
  );
}

// ── Guard wrapper ──
export default function DocumentsPageWrapper() {
  return (
    <SchoolGuard>
      <DocumentsPage />
    </SchoolGuard>
  );
}
