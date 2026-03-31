"use client";

import { useAuth } from "@/context/AuthContext";
import { syncNow } from "@/lib/storage/syncEngine";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  CloudOff,
  Loader2,
  AlertTriangle,
  Cloud,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

export default function SyncIndicator() {
  const { syncStatus } = useAuth();
  const [manualSyncing, setManualSyncing] = useState(false);

  const handleManualSync = async () => {
    setManualSyncing(true);
    await syncNow();
    setManualSyncing(false);
  };

  const config = {
    idle: {
      icon: Cloud,
      label: "في انتظار المزامنة",
      color: "text-gray-400",
      bg: "bg-gray-100",
    },
    syncing: {
      icon: Loader2,
      label: "جاري المزامنة...",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    success: {
      icon: CheckCircle2,
      label: syncStatus.lastSyncAt
        ? `تمت المزامنة ${formatRelativeTime(syncStatus.lastSyncAt)}`
        : "تمت المزامنة",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    error: {
      icon: AlertTriangle,
      label: "فشل الاتصال",
      color: "text-red-600",
      bg: "bg-red-50",
    },
    offline: {
      icon: CloudOff,
      label: "غير متصل بالإنترنت",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  };

  const current = config[syncStatus.state];
  const Icon = current.icon;
  const isSpinning = syncStatus.state === "syncing" || manualSyncing;

  return (
    <div className="flex items-center gap-2">
      {/* مؤشر العناصر المعلّقة */}
      <AnimatePresence>
        {syncStatus.pendingCount > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"
          >
            {syncStatus.pendingCount} في الانتظار
          </motion.span>
        )}
      </AnimatePresence>

      {/* زر/مؤشر الحالة */}
      <button
        onClick={handleManualSync}
        disabled={isSpinning}
        title={current.label}
        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${current.bg} ${current.color} hover:opacity-80 disabled:opacity-60`}
      >
        <Icon className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">{current.label}</span>
      </button>
    </div>
  );
}

// ─── مساعد التاريخ النسبي ─────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "الآن";
  if (mins === 1) return "منذ دقيقة";
  if (mins < 60) return `منذ ${mins} دقائق`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "منذ ساعة";
  return `منذ ${hours} ساعات`;
}
