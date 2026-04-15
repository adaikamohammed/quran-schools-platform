import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Service-role client for privileged DB writes
const supabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// جدول Supabase مقابل اسم الجدول المرسل
const TABLE_MAP: Record<string, string> = {
  students: "students",
  sessions: "daily_sessions",
  surahProgress: "surah_progresses",
  payments: "payments",
  users: "users",
};

function camelToSnake(str: string) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function convertKeysToSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => convertKeysToSnake(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      acc[camelToSnake(key)] = convertKeysToSnake(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}

export async function POST(req: Request) {
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

    const session = { schoolId: userData?.school_id };
    if (!session.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { operations } = await req.json();
    if (!Array.isArray(operations)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    let successCount = 0;

    for (const op of operations) {
      const { table, action, recordId, data } = op;
      const supabaseTable = TABLE_MAP[table];
      if (!supabaseTable) continue;

      // Handle daily_records extraction map back to daily_sessions if table is sessions
      let safeData = { ...data };
      let dailyRecordsData: any[] = [];
      if (table === "sessions") {
        if (safeData.records) {
          dailyRecordsData = safeData.records;
        }
        delete safeData.records;
      }

      safeData = convertKeysToSnake(safeData);
      safeData.school_id = session.schoolId;

      try {
        if (action === "create" || action === "update") {
          // upsert يعمل لكلا الحالتين
          await supabase
            .from(supabaseTable)
            .upsert({ id: recordId, ...safeData }, { onConflict: "id" });

          // Handle related daily_records if this is a session
          if (table === "sessions" && dailyRecordsData.length > 0) {
            const mappedRecords = dailyRecordsData.map(r => ({
              ...convertKeysToSnake(r),
              session_id: recordId,
            }));
            await supabase.from("daily_records").upsert(mappedRecords, { onConflict: "id" });
            // Since onConflict defaults to id, wait! In supabase-schema.sql, daily_records has no unique constraint except session_id + student_id!
            // Wait, daily_records id is UUID PRIMARY KEY. If daily record has an ID it upserts easily. If not, it inserts.
          }

        } else if (action === "delete") {
          // حذف ناعم
          await supabase
            .from(supabaseTable)
            .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq("id", recordId)
            .eq("school_id", session.schoolId);
        }
        successCount++;
      } catch (e) {
        console.warn(`[SYNC PUSH] Failed op on ${table} (${action}):`, e);
      }
    }

    return NextResponse.json({ success: true, count: successCount });
  } catch (error) {
    console.error("Push sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
