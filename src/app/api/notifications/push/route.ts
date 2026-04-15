import webpush from "web-push";
import { NextRequest, NextResponse } from "next/server";

// ─── إعداد مفاتيح VAPID ─────────────────────────────────
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
  urgent?: boolean;
}

/**
 * POST /api/push
 * إرسال إشعار push لاشتراك محدد أو مجموعة من الاشتراكات.
 * 
 * Body: { subscriptions: PushSubscriptionRecord[], payload: PushPayload }
 */
export async function POST(req: NextRequest) {
  try {
    const { subscriptions, payload } = await req.json() as {
      subscriptions: PushSubscriptionRecord[];
      payload: PushPayload;
    };

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: "لا توجد اشتراكات مسجلة" }, { status: 400 });
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon ?? "/icons/icon-192x192.png",
      url: payload.url ?? "/app",
      tag: payload.tag ?? "default",
      urgent: payload.urgent ?? false,
    });

    // إرسال لكل المشتركين المحددين
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(sub, notificationPayload)
      )
    );

    const succeeded = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    return NextResponse.json({
      message: `تم إرسال ${succeeded} إشعار بنجاح، فشل ${failed}`,
      succeeded,
      failed,
    });
  } catch (error) {
    console.error("Push notification error:", error);
    return NextResponse.json({ error: "فشل في إرسال الإشعار" }, { status: 500 });
  }
}

/**
 * GET /api/push/vapid-key
 * إرجاع المفتاح العام للعميل لإكمال الاشتراك
 */
export async function GET() {
  return NextResponse.json({
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });
}
