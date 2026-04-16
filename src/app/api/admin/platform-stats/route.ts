import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // ── التحقق من هوية المستخدم (server cookies) ─────────────────────────────
    const serverSupabase = await createServerClient();
    const { data: { user }, error: sessionError } = await serverSupabase.auth.getUser();

    if (sessionError || !user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { data: userData } = await serverSupabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "super_admin") {
      return NextResponse.json({ error: "صلاحيات غير كافية" }, { status: 403 });
    }

    // ── استخدام service_role_key لتجاوز RLS ──────────────────────────────────
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 1. المدارس (باستثناء المقر الرئيسي إن وُجد) ───────────────────────────
    const { data: schools, error: schoolsErr } = await admin
      .from("schools")
      .select("id, name, city, country, created_at")
      .neq("name", "المقر الرئيسي (HQ)")
      .order("created_at", { ascending: false });

    if (schoolsErr) {
      console.error("schools query error:", schoolsErr.message);
      throw new Error(schoolsErr.message);
    }

    // ── 2. عدد المعلمين والمدراء (استثناء super_admin و parent) ───────────────
    const { count: teacherCount, error: teacherErr } = await admin
      .from("users")
      .select("*", { count: "exact", head: true })
      .neq("role", "super_admin")
      .neq("role", "parent");

    if (teacherErr) console.warn("teacherCount error:", teacherErr.message);

    // ── 3. عدد الطلاب ────────────────────────────────────────────────────────
    const { count: studentCount, error: studentErr } = await admin
      .from("students")
      .select("*", { count: "exact", head: true });

    if (studentErr) console.warn("studentCount error:", studentErr.message);

    // ── 3.5 عدد المجموعات / الأفواج ──────────────────────────────────────────
    const { count: groupCount, error: groupErr } = await admin
      .from("groups")
      .select("*", { count: "exact", head: true });
      
    if (groupErr) console.warn("groupCount error:", groupErr.message);

    // ── 4. إحصاء لكل مدرسة (أحدث 6) ─────────────────────────────────────────
    const recentSchoolIds = (schools ?? []).slice(0, 6).map((s) => s.id);

    let teacherMap: Record<string, number> = {};
    let studentMap: Record<string, number> = {};
    let principalMap: Record<string, string> = {};

    if (recentSchoolIds.length > 0) {
      // المعلمون
      const { data: teachersData } = await admin
        .from("users")
        .select("school_id")
        .in("school_id", recentSchoolIds)
        .neq("role", "parent")
        .neq("role", "super_admin");

      (teachersData ?? []).forEach((u) => {
        teacherMap[u.school_id] = (teacherMap[u.school_id] ?? 0) + 1;
      });

      // الطلاب
      const { data: studentsData } = await admin
        .from("students")
        .select("school_id")
        .in("school_id", recentSchoolIds);

      (studentsData ?? []).forEach((s) => {
        studentMap[s.school_id] = (studentMap[s.school_id] ?? 0) + 1;
      });

      // اسم المدير لكل مدرسة
      const { data: principalsData } = await admin
        .from("users")
        .select("school_id, display_name")
        .in("school_id", recentSchoolIds)
        .eq("role", "principal");

      (principalsData ?? []).forEach((p) => {
        if (p.school_id) principalMap[p.school_id] = p.display_name;
      });
    }

    const recentSchools = (schools ?? []).slice(0, 6).map((school) => ({
      id: school.id,
      name: school.name,
      city: school.city ?? null,
      country: school.country ?? null,
      principalName: principalMap[school.id] ?? null,
      teacherCount: teacherMap[school.id] ?? 0,
      studentCount: studentMap[school.id] ?? 0,
      createdAt: school.created_at,
    }));

    return NextResponse.json({
      totalSchools: schools?.length ?? 0,
      pendingRequests: 0,            // جدول school_requests غير موجود حالياً
      totalTeachers: teacherCount ?? 0,
      totalStudents: studentCount ?? 0,
      totalGroups: groupCount ?? 0,
      recentSchools,
    });
  } catch (err: any) {
    console.error("platform-stats API error:", err?.message ?? err);
    return NextResponse.json(
      { error: "فشل تحميل الإحصائيات", detail: err?.message },
      { status: 500 }
    );
  }
}
