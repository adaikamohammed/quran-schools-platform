"use client";
import SchoolGuard from "@/components/layout/SchoolGuard";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDB } from "@/lib/storage/db";
import { motion } from "framer-motion";
import {
  Download, Upload, Shield, AlertTriangle, CheckCircle2,
  Loader2, Database, RefreshCw, Trash2,
} from "lucide-react";

// ─── الصفحة ───────────────────────────────────────────────

function BackupPage() {
  const { school, user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── تصدير كامل ──────────────────────────────────
  const handleExport = async () => {
    if (!school?.id) return;
    setExporting(true);
    setMessage(null);

    try {
      const db = getDB();

      const [students, sessions, surahProgress, payments, registrations, reports, meetings, covenants, campItems, issuedDocuments, activityLogs] =
        await Promise.all([
          db.students.where("schoolId").equals(school.id).toArray(),
          db.sessions.where("schoolId").equals(school.id).toArray(),
          db.surahProgress.where("schoolId").equals(school.id).toArray(),
          db.payments.where("schoolId").equals(school.id).toArray(),
          db.registrations.where("schoolId").equals(school.id).toArray(),
          db.reports.where("schoolId").equals(school.id).toArray(),
          db.meetings.where("schoolId").equals(school.id).toArray(),
          db.students.where("schoolId").equals(school.id).toArray().then(s => s.flatMap(st => st.covenants ?? [])),
          db.campItems.where("schoolId").equals(school.id).toArray(),
          db.issuedDocuments.where("schoolId").equals(school.id).toArray(),
          db.activityLogs.where("schoolId").equals(school.id).toArray(),
        ]);

      const backup = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        school: {
          id: school.id,
          name: school.name,
          city: school.city,
          country: school.country,
        },
        exportedBy: user?.displayName ?? "غير معروف",
        data: {
          students,
          sessions,
          surahProgress,
          payments,
          registrations,
          reports,
          meetings,
          campItems,
          issuedDocuments,
          activityLogs,
        },
        counts: {
          students: students.length,
          sessions: sessions.length,
          surahProgress: surahProgress.length,
          payments: payments.length,
          registrations: registrations.length,
          meetings: meetings.length,
        },
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `backup-${school.name.replace(/\s+/g, "_")}-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: `✅ تم تصدير النسخة الاحتياطية بنجاح: ${students.length} طالب، ${sessions.length} حصة، ${payments.length} دفعة.` });
    } catch (e: any) {
      setMessage({ type: "error", text: `❌ فشل التصدير: ${e.message}` });
    } finally {
      setExporting(false);
    }
  };

  // ── استيراد نسخة ─────────────────────────────────
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      setImporting(true);
      setMessage(null);
      try {
        const raw = JSON.parse(ev.target?.result as string);

        if (!raw.version || !raw.data) {
          throw new Error("ملف النسخة الاحتياطية غير صالح أو قديم.");
        }

        const confirmed = window.confirm(
          `⚠️ سيتم استيراد بيانات مدرسة "${raw.school?.name ?? "غير معروف"}" المصدّرة بتاريخ ${new Date(raw.exportedAt).toLocaleDateString("ar-DZ")}.\n\nهذا لن يحذف بياناتك الحالية، بل سيدمجها.\n\nهل تريد المتابعة؟`
        );
        if (!confirmed) { setImporting(false); return; }

        const db = getDB();
        const { data } = raw;

        // دمج البيانات (put يتجاوز التكرارات بنفس الـ id)
        if (data.students?.length) await db.students.bulkPut(data.students);
        if (data.sessions?.length) await db.sessions.bulkPut(data.sessions);
        if (data.surahProgress?.length) await db.surahProgress.bulkPut(data.surahProgress);
        if (data.payments?.length) await db.payments.bulkPut(data.payments);
        if (data.registrations?.length) await db.registrations.bulkPut(data.registrations);
        if (data.reports?.length) await db.reports.bulkPut(data.reports);
        if (data.meetings?.length) await db.meetings.bulkPut(data.meetings);
        if (data.campItems?.length) await db.campItems.bulkPut(data.campItems);
        if (data.issuedDocuments?.length) await db.issuedDocuments.bulkPut(data.issuedDocuments);

        setMessage({
          type: "success",
          text: `✅ تم استيراد النسخة الاحتياطية بنجاح! استُعيدت بيانات: ${data.students?.length ?? 0} طالب، ${data.sessions?.length ?? 0} حصة، ${data.payments?.length ?? 0} دفعة.`,
        });
      } catch (err: any) {
        setMessage({ type: "error", text: `❌ فشل الاستيراد: ${err.message}` });
      } finally {
        setImporting(false);
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* رأس */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
          <Database className="w-6 h-6 text-[var(--color-primary)]" />
          النسخ الاحتياطي والاستيراد
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          احتفظ بنسخة من بياناتك لحمايتها، أو استعد بيانات من أجهزة أخرى.
        </p>
      </div>

      {/* رسالة الحالة */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-3 p-4 rounded-2xl border text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.type === "success"
            ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            : <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          }
          <p>{message.text}</p>
        </motion.div>
      )}

      {/* بطاقة التصدير */}
      <div className="bg-white rounded-3xl border border-[var(--color-border)] p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
            <Download className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900">تصدير النسخة الاحتياطية</h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              يقوم بتصدير <strong>جميع بيانات مدرستك</strong> (الطلاب، الحصص، المدفوعات، السور، التقارير...)
              إلى ملف <code className="bg-gray-100 px-1.5 py-0.5 rounded text-blue-700 text-[11px]">.json</code> على جهازك.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5 text-center">
          {[
            { label: "الطلاب", icon: "👨‍🎓" },
            { label: "الحصص", icon: "📅" },
            { label: "المدفوعات", icon: "💳" },
          ].map(({ label, icon }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-2xl mb-1">{icon}</p>
              <p className="text-xs font-bold text-gray-600">{label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? "جاري التصدير..." : "تصدير كامل البيانات"}
        </button>
      </div>

      {/* بطاقة الاستيراد */}
      <div className="bg-white rounded-3xl border border-[var(--color-border)] p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
            <Upload className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900">استيراد نسخة احتياطية</h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              استعادة بيانات من ملف <code className="bg-gray-100 px-1.5 py-0.5 rounded text-amber-700 text-[11px]">.json</code> سبق تصديره.
              <br />
              <strong>ملاحظة:</strong> لن تُحذف البيانات الموجودة — سيتم دمج المسجّل الجديد فقط.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl mb-5 text-xs text-amber-800">
          <Shield className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <p>تأكد من أن الملف صادر من نفس المنصة وإصدار متوافق (v2.0+). الاستيراد من مصادر غير موثوقة قد يؤدي لبيانات خاطئة.</p>
        </div>

        <label className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed cursor-pointer transition-colors text-sm font-bold ${
          importing
            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
            : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-400"
        }`}>
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
            disabled={importing}
          />
          {importing
            ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الاستيراد...</>
            : <><Upload className="w-4 h-4" /> اختر ملف النسخة الاحتياطية</>
          }
        </label>
      </div>

      {/* تنبيه نصيحة */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-600">
        <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
        <p>
          <strong>نصيحة:</strong> يُنصح بعمل نسخة احتياطية شهرياً على الأقل، وحفظها في مكان آمن (Google Drive، USB...).
          في حال تغيير الجهاز، استورد النسخة الأخيرة لاستعادة كامل بياناتك.
        </p>
      </div>
    </div>
  );
}

export default function BackupPageWrapper() {
  return (
    <SchoolGuard>
      <BackupPage />
    </SchoolGuard>
  );
}
