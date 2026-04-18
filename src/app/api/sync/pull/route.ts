import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Service-role client for privileged DB reads
const supabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function snakeToCamel(str: string) {
  return str.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('_', ''));
}

function convertKeysToCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => convertKeysToCamel(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      acc[snakeToCamel(key)] = convertKeysToCamel(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}

export async function GET(req: Request) {
  try {
    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      
    students?.forEach((s) => {
      const camelS = convertKeysToCamel(s);
      changes.push({ table: "students", recordId: s.id, data: camelS, deletedAt: s.deleted_at })
    });

    // 2. الحصص اليومية
    const { data: sessions } = await supabase
      .from("daily_sessions")
      .select("*, daily_records(*)")
      .eq("school_id", schoolId)
      .gt("updated_at", lastSyncAt);
      
    sessions?.forEach((s) => {
      const camelS = convertKeysToCamel(s);
      // Map dailyRecords to records
      if (camelS.dailyRecords) {
        camelS.records = camelS.dailyRecords;
        delete camelS.dailyRecords;
      } else {
        camelS.records = [];
      }
      changes.push({ table: "sessions", recordId: s.id, data: camelS, deletedAt: s.deleted_at })
    });

    // 3. تقدم السور
    const { data: progress } = await supabase
      .from("surah_progresses")
      .select("*")
      .eq("school_id", schoolId)
      .gt("updated_at", lastSyncAt);
      
    progress?.forEach((p) => {
      const camelS = convertKeysToCamel(p);
      changes.push({ table: "surahProgress", recordId: p.id, data: camelS, deletedAt: p.deleted_at })
    });

    // 4. المدفوعات
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("school_id", schoolId)
      .gt("updated_at", lastSyncAt);
      
    payments?.forEach((p) => {
      const camelS = convertKeysToCamel(p);
      changes.push({ table: "payments", recordId: p.id, data: camelS, deletedAt: p.deleted_at })
    });

    // 5. المستخدمون (بدون password_hash)
    const { data: users } = await supabase
      .from("users")
      .select("id, email, display_name, role, school_id, group_name, gender, join_date, is_active, created_at, updated_at, deleted_at")
      .eq("school_id", schoolId)
      .gt("updated_at", lastSyncAt);
      
    users?.forEach((u) => {
      const camelS = convertKeysToCamel(u);
      changes.push({ table: "users", recordId: u.id, data: camelS, deletedAt: u.deleted_at })
    });

    // 6. إشعارات النظام
    const { data: systemNotifs } = await supabase
      .from("system_notifications")
      .select("*")
      .or(`school_id.eq.${schoolId},school_id.is.null`)
      .gt("updated_at", lastSyncAt);

    systemNotifs?.forEach((n) => {
      const camelN = convertKeysToCamel(n);
      changes.push({ table: "systemNotifications", recordId: n.id, data: camelN, deletedAt: n.deleted_at })
    });

    // 7. التسجيلات المبدئية (التسجيلات الجديدة)
    const { data: preRegistrations } = await supabase
      .from("pre_registrations")
      .select("*")
      .eq("school_id", schoolId)
      .gt("updated_at", lastSyncAt);

    preRegistrations?.forEach((r) => {
      const camelR = convertKeysToCamel(r);
      changes.push({ table: "registrations", recordId: r.id, data: camelR, deletedAt: r.deleted_at })
    });

    return NextResponse.json({ success: true, changes });
  } catch (error) {
    console.error("Pull sync error:", error);
    return NextResponse.json({ error: "Delta pull failed" }, { status: 500 });
  }
}
