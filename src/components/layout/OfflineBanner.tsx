"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, UploadCloud } from "lucide-react";
import { subscribeSyncStatus, syncNow, type SyncStatus } from "@/lib/storage/syncEngine";

export default function OfflineBanner() {
  const { isOnline, justReconnected } = useOnlineStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsub = subscribeSyncStatus((s) => setSyncStatus(s));
    return unsub;
  }, []);

  // Auto-sync when reconnecting
  useEffect(() => {
    if (justReconnected && syncStatus?.pendingCount && syncStatus.pendingCount > 0) {
      handleSync();
    }
  }, [justReconnected]);

  const handleSync = async () => {
    setIsSyncing(true);
    try { await syncNow(); } finally { setIsSyncing(false); }
  };

  // Determine what to show
  const pending = syncStatus?.pendingCount ?? 0;
  const showOffline = !isOnline;
  const showReconnected = isOnline && justReconnected;
  const showPending = isOnline && !justReconnected && pending > 0;

  return (
    <AnimatePresence mode="wait">
      {/* ── Offline Banner ── */}
      {showOffline && (
        <motion.div
          key="offline"
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -56, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-0 inset-x-0 z-[60] print:hidden"
          dir="rtl"
        >
          <div className="bg-gray-900 text-white px-4 py-2.5 flex items-center justify-center gap-3">
            <WifiOff className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm font-bold">
              أنتَ غير متصل بالإنترنت — يمكنك الاستمرار بتسجيل الحصص وستُرفع البيانات تلقائياً عند عودة الاتصال
            </p>
            {pending > 0 && (
              <span className="shrink-0 bg-amber-500/20 text-amber-300 text-xs font-black px-2 py-0.5 rounded-full">
                {pending} في الانتظار
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Reconnected Banner ── */}
      {showReconnected && (
        <motion.div
          key="reconnected"
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -56, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-0 inset-x-0 z-[60] print:hidden"
          dir="rtl"
        >
          <div className="bg-emerald-700 text-white px-4 py-2.5 flex items-center justify-center gap-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p className="text-sm font-bold">
              {isSyncing
                ? "جارٍ رفع البيانات المحفوظة..."
                : syncStatus?.state === "success"
                ? `✅ تمت المزامنة بنجاح — عاد الاتصال`
                : "عاد الاتصال — جارٍ المزامنة..."}
            </p>
            {isSyncing && <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />}
          </div>
        </motion.div>
      )}

      {/* ── Pending Items Indicator (floating badge) ── */}
      {showPending && (
        <motion.div
          key="pending"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-20 left-4 z-50 lg:bottom-4 print:hidden"
        >
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-white dark:bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl px-3 py-2 shadow-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:shadow-xl transition-shadow"
          >
            {isSyncing
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--color-primary)]" />
              : <UploadCloud className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            }
            {pending} عملية معلقة
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
