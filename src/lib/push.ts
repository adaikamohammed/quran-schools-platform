"use client";

/**
 * مدير الإشعارات Push على الجانب العميل (Client-side)
 * ─────────────────────────────────────────────────────
 * يوفر هذا الملف:
 * 1. تسجيل / إلغاء اشتراك الإشعارات
 * 2. حفظ بيانات الاشتراك في IndexedDB / localStorage
 * 3. دوال مساعدة لإرسال إشعارات من الكود
 */

export interface StoredSubscription {
  userId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

const SUBSCRIPTION_KEY = "qsp-push-subscription";

/**
 * تحويل base64url إلى Uint8Array (مطلوب للـ VAPID)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

/**
 * جلب الاشتراك المحفوظ من localStorage
 */
export function getStoredSubscription(): StoredSubscription | null {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * حفظ الاشتراك في localStorage
 */
export function storeSubscription(sub: StoredSubscription): void {
  localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(sub));
}

/**
 * حذف الاشتراك من localStorage
 */
export function removeSubscription(): void {
  localStorage.removeItem(SUBSCRIPTION_KEY);
}

/**
 * طلب إذن الإشعارات وتسجيل الاشتراك
 */
export async function subscribeToPush(userId: string): Promise<StoredSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push notifications not supported");
    return null;
  }

  // طلب الإذن
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
    const applicationServerKey = urlBase64ToUint8Array(vapidKey);

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    const subJson = subscription.toJSON();
    const stored: StoredSubscription = {
      userId,
      endpoint: subJson.endpoint!,
      keys: {
        p256dh: subJson.keys!.p256dh!,
        auth: subJson.keys!.auth!,
      },
    };

    storeSubscription(stored);
    return stored;
  } catch (err) {
    console.error("Failed to subscribe to push:", err);
    return null;
  }
}

/**
 * إلغاء الاشتراك
 */
export async function unsubscribeFromPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    removeSubscription();
  } catch (err) {
    console.error("Failed to unsubscribe:", err);
  }
}

/**
 * إرسال إشعار push لقائمة من الاشتراكات عبر API السيرفر
 * تُستخدم عند تسجيل غياب الطالب مثلاً
 */
export async function sendPushNotification(
  subscriptions: StoredSubscription[],
  payload: {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    urgent?: boolean;
  }
): Promise<void> {
  if (subscriptions.length === 0) return;
  try {
    await fetch("/api/notifications/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptions, payload }),
    });
  } catch (err) {
    console.error("Failed to send push notification:", err);
  }
}

/**
 * إشعار فوري محلي (بدون سيرفر) — للتجربة فقط أو للتذكيرات الداخلية
 */
export function showLocalNotification(title: string, body: string, url?: string): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const n = new Notification(title, {
    body,
    icon: "/icons/icon-192x192.png",
    dir: "rtl",
    lang: "ar",
  });
  if (url) {
    n.onclick = () => {
      window.focus();
      window.location.href = url;
    };
  }
}
