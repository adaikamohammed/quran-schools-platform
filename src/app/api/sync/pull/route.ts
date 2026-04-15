import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Service-role client for privileged DB reads
const supabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  try {
    // استخدام Supabase Auth (نفس الجلسة التي تُنشئها صفحة تسجيل الدخول)
    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // جلب school_id من جدول المستخدمين
    const { data: userData } = await supabase
      .from("users")
      .select("school_id")
      .eq("id", user.id)
      .single();

    const schoolId = userData?.school_id;
    if (!schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const lastSyncAtStr = searchParams.get("lastSyncAt");
    const lastSyncAt = lastSyncAtStr ?? new Date(0).toISOString();

    const changes: any[] = [];

    // 1. الطلاب
    const { data: students } = await supabase
      .from("students")
      .select("*")
      .eq("school_id", schoolId)
      .gt("updated_at", lastSyncAt);
    students?.forEach((s) =>
      changes.push({ table: "students", recordId: s.id, data: s, deletedAt: s.deleted_at })
    );

    // 2. الحصص اليومية
    const { data: sessions } = await supabase
      .from("daily_sessions")
      .select("*, session_records(*)")
      .eq("school_id", schoolId)
      .gt("updated_at", lastSyncAt);
    sessions?.forEach((s) =>
      changes.push({ table: "sessions", recordId: s.id, data: s, deletedAt: s.deleted_at })
    );

    // 3. تقدم السور
    const { data: progress } = await supabase
      .from("surah_progress")
      .select("*")
      .eq("school_id", schoolId)
      .gt("updated_at", lastSyncAt);
    progress?.forEach((p) =>
      changes.push({ table: "surahProgress", recordId: p.id, data: p, deletedAt: p.deleted_at })
    );

    // 4. المدفوعات
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("school_id", schoolId)
      .gt("updated_at", lastSyncAt);
    payments?.forEach((p) =>
      changes.push({ table: "payments", recordId: p.id, data: p, deletedAt: p.deleted_at })
    );

    // 5. المستخدمون (بدون password_hash)
    const { data: users } = await supabase
      .from("users")
      .select("id, email, display_name, role, school_id, created_at, updated_at, deleted_at")
      .eq("school_id", schoolId)
      .gt("updated_at", lastSyncAt);
    users?.forEach((u) =>
      changes.push({ table: "users", recordId: u.id, data: u, deletedAt: u.deleted_at })
    );

    return NextResponse.json({ success: true, changes });
  } catch (error) {
    console.error("Pull sync error:", error);
    return NextResponse.json({ error: "Delta pull failed" }, { status: 500 });
  }
}
