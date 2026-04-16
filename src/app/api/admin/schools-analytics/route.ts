import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // ── 1. Authentication & Authorization ──
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

    // ── 2. Service Role Client to bypass RLS ──
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 3. Fetch Data ──
    // Schools
    const { data: schoolsData, error: schoolsErr } = await admin
      .from("schools")
      .select("id, name, city, country, created_at")
      .neq("name", "المقر الرئيسي (HQ)")
      .order("created_at", { ascending: false });

    if (schoolsErr) throw new Error(schoolsErr.message);

    // Get count of teachers per school
    const { data: teachersData } = await admin
      .from("users")
      .select("school_id")
      .eq("role", "teacher");

    const teacherMap = (teachersData || []).reduce((acc: any, u: any) => {
      acc[u.school_id] = (acc[u.school_id] || 0) + 1;
      return acc;
    }, {});

    // Students per school
    const { data: studentsData } = await admin
      .from("students")
      .select("school_id");
    
    const studentMap = (studentsData || []).reduce((acc: any, s: any) => {
      acc[s.school_id] = (acc[s.school_id] || 0) + 1;
      return acc;
    }, {});

    // Principals
    const { data: principalsData } = await admin
      .from("users")
      .select("school_id, display_name, email")
      .eq("role", "principal");

    const principalMap = (principalsData || []).reduce((acc: any, p: any) => {
      if (p.school_id) acc[p.school_id] = p;
      return acc;
    }, {});

    // Groups per school
    const { data: groupsData } = await admin.from("groups").select("school_id");
    const groupsMap = (groupsData || []).reduce((acc: any, g: any) => {
      acc[g.school_id] = (acc[g.school_id] || 0) + 1;
      return acc;
    }, {});

    // Last 30 days Daily Records to determine engagement
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

    const { data: dailyRecordsData } = await admin
      .from("daily_records")
      .select("school_id, created_at, teacher_id")
      .gte("created_at", thirtyDaysAgoIso);

    // Engagement calculation
    const recordsMap = (dailyRecordsData || []).reduce((acc: any, r: any) => {
      if (!acc[r.school_id]) {
        acc[r.school_id] = { count: 0, lastActivity: r.created_at, activeTeachers: new Set() };
      }
      acc[r.school_id].count++;
      acc[r.school_id].activeTeachers.add(r.teacher_id);
      if (new Date(r.created_at) > new Date(acc[r.school_id].lastActivity)) {
        acc[r.school_id].lastActivity = r.created_at;
      }
      return acc;
    }, {});

    // ── 4. Map Results ──
    const analytics = (schoolsData || []).map((school: any) => {
      const records = recordsMap[school.id] || { count: 0, lastActivity: null, activeTeachers: new Set() };
      const teacherCount = teacherMap[school.id] || 0;
      const studentCount = studentMap[school.id] || 0;
      const groupCount = groupsMap[school.id] || 0;
      const principal = principalMap[school.id] || { display_name: null, email: null };
      
      // Engagement Rate Calculation (Option A):
      // Ratio of recent records vs expected (let's say 4 records per group per week -> 16 per month per group)
      const expectedMonthlyRecords = groupCount > 0 ? groupCount * 12 : teacherCount * 12; // Assuming ~3 sessions per week per group
      let engagementRate = 0;
      
      if (expectedMonthlyRecords > 0) {
        engagementRate = Math.min(100, Math.round((records.count / expectedMonthlyRecords) * 100));
      } else if (records.count > 0) {
        engagementRate = 100; // Has records but no groups mapped? still 100%
      }

      return {
        id: school.id,
        name: school.name,
        country: school.country || "الجزائر",
        city: school.city || "غير محدد",
        createdAt: school.created_at,
        teacherCount,
        studentCount,
        groupCount,
        principalName: principal.display_name,
        principalEmail: principal.email,
        recentRecordsCount: records.count,
        lastActivity: records.lastActivity,
        engagementRate,
        school_og_data: school // for backwards compatibility with local edits
      };
    });

    // We can cache this response header
    return NextResponse.json(analytics, {
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400', // Cache for 1 hour
      },
    });

  } catch (err: any) {
    console.error("schools-analytics API error:", err?.message || err);
    return NextResponse.json({ error: "فشل استخراج التحليلات", detail: err?.message }, { status: 500 });
  }
}
