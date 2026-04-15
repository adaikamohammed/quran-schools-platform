"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  subscribeToPush, unsubscribeFromPush, getStoredSubscription, showLocalNotification,
} from "@/lib/push";
import { useAuth } from "@/context/AuthContext";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

/**
 * Exported hook for use in Settings/Profile pages to control push subscription.
 */
export function usePushSubscription() {
  const { user } = useAuth();
  const [permissionState, setPermissionState] = useState<PermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermissionState("unsupported");
      return;
    }
    setPermissionState(Notification.permission as PermissionState);
    const stored = getStoredSubscription();
    if (stored && stored.userId === user?.id) setIsSubscribed(true);
  }, [user?.id]);

  const subscribe = async () => {
    if (!user?.id) return;
    setLoading(true);
    const sub = await subscribeToPush(user.id);
    if (sub) {
      setIsSubscribed(true);
      setPermissionState("granted");
      showLocalNotification("تم تفعيل الإشعارات! 🎉", "ستصلك إشعارات الحصص والغياب تلقائياً.", "/app");
    } else {
      setPermissionState(Notification.permission as PermissionState);
    }
    setLoading(false);
  };

  const unsubscribe = async () => {
    setLoading(true);
    await unsubscribeFromPush();
    setIsSubscribed(false);
    setLoading(false);
  };

  return { permissionState, isSubscribed, loading, subscribe, unsubscribe };
}

/**
 * Only shows a one-time bottom-corner banner nudging users to enable push notifications.
 * Does NOT render any persistent UI — banner auto-dismisses and is suppressed after once.
 */
export default function PushNotificationManager() {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const perm = Notification.permission as PermissionState;
    setPermissionState(perm);
    const stored = getStoredSubscription();
    if (stored && stored.userId === user?.id) {
      setIsSubscribed(true);
      return;
    }
    // Only prompt once — track via localStorage
    const dismissed = localStorage.getItem("push-banner-dismissed");
    if (perm === "default" && !dismissed) {
      const t = setTimeout(() => setShowBanner(true), 5000);
      return () => clearTimeout(t);
    }
  }, [user?.id]);

  const dismiss = () => {
    setShowBanner(false);
    localStorage.setItem("push-banner-dismissed", "1");
  };

  const handleSubscribe = async () => {
    if (!user?.id) return;
    setLoading(true);
    const sub = await subscribeToPush(user.id);
    if (sub) {
      setIsSubscribed(true);
      setPermissionState("granted");
      showLocalNotification("تم تفعيل الإشعارات! 🎉", "ستصلك إشعارات الحصص والغياب تلقائياً.", "/app");
    } else {
      setPermissionState(Notification.permission as PermissionState);
    }
    setLoading(false);
    dismiss();
  };

  // Render nothing if already subscribed / unsupported / denied
  if (isSubscribed || permissionState === "unsupported" || permissionState === "denied") return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          key="push-banner"
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="fixed bottom-20 right-4 z-50 w-80 lg:bottom-6 lg:right-6 print:hidden"
          dir="rtl"
        >
          <div className="bg-white dark:bg-[#1a1d2a] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-gray-900 dark:text-white">فعّل إشعارات المنصة</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                  احصل على تنبيهات الحصص والغياب فورياً.
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleSubscribe} disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-50">
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                    تفعيل
                  </button>
                  <button onClick={dismiss}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/8 text-gray-600 dark:text-gray-400 text-xs font-bold hover:bg-gray-200 transition-colors">
                    لاحقاً
                  </button>
                </div>
              </div>
              <button onClick={dismiss} className="w-6 h-6 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 flex items-center justify-center transition-colors">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Inline toggle for Settings / Profile pages — import this where needed.
 */
export function PushNotificationToggle() {
  const { permissionState, isSubscribed, loading, subscribe, unsubscribe } = usePushSubscription();

  if (permissionState === "unsupported") return null;

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)]">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSubscribed ? "bg-green-100 dark:bg-green-500/10" : "bg-gray-100 dark:bg-white/8"}`}>
          {isSubscribed
            ? <BellRing className="w-5 h-5 text-green-600 dark:text-green-400" />
            : <BellOff className="w-5 h-5 text-gray-400" />}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-white">إشعارات Push</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {permissionState === "denied" ? "محجوبة من إعدادات المتصفح"
              : isSubscribed ? "مفعّلة — ستصلك الإشعارات حتى عند إغلاق المتصفح"
              : "غير مفعّلة — انقر لتفعيل"}
          </p>
        </div>
      </div>
      {permissionState === "denied"
        ? <span className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-lg">محجوبة</span>
        : isSubscribed
          ? <button onClick={unsubscribe} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <BellOff className="w-3 h-3" />}
              إلغاء
            </button>
          : <button onClick={subscribe} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
              تفعيل
            </button>}
    </div>
  );
}
