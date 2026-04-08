import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// جدول Supabase مقابل اسم الجدول المرسل
const TABLE_MAP: Record<string, string> = {
  students: "students",
  sessions: "daily_sessions",
  surahProgress: "surah_progress",
  payments: "payments",
  users: "users",
};

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId) {
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

      // فرض school_id للعزل متعدد المستأجرين
      const safeData = { ...data, school_id: session.schoolId };

      try {
        if (action === "create" || action === "update") {
          // upsert يعمل لكلا الحالتين
          await supabase
            .from(supabaseTable)
            .upsert({ id: recordId, ...safeData }, { onConflict: "id" });
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
