const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log("🚀 Starting Migration - Step 1: Creating Accounts (UUID Fixed)");

  const password = "admin00123456";

  // 1. Create Principal
  const principalEmail = "admin00@gmail.com";
  let principalId = "";

  const { data: pAuthData, error: pAuthErr } = await supabase.auth.admin.createUser({
    email: principalEmail,
    password: password,
    email_confirm: true,
  });

  if (pAuthErr) {
    if (pAuthErr.code === 'email_exists' || pAuthErr.message.includes("already registered")) {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const existing = usersData.users.find(u => u.email === principalEmail);
      if (existing) principalId = existing.id;
    } else {
      console.error("   ❌ Principal Auth Error:", pAuthErr);
      return;
    }
  } else {
    principalId = pAuthData.user.id;
  }

  // Find or Create school
  let schoolId = "";
  const { data: existingSchool } = await supabase.from('schools').select('id').eq('director_name', 'الإدارة العامة').single();

  if (existingSchool) {
    schoolId = existingSchool.id;
    console.log("   ✅ Found existing school:", schoolId);
  } else {
    schoolId = uuidv4(); // Correctly use UUID
    console.log("   ⏳ Creating School record:", schoolId);
    await supabase.from('schools').insert({
      id: schoolId,
      name: "المدرسة القرآنية للإمام الشافعي",
      city: "الوادي",
      country: "الجزائر",
      director_name: "الإدارة العامة",
      email: principalEmail,
      settings: {
        prices: { renewal: { 'فئة الأكابر': 1500, 'فئة الأصاغر': 1000 } },
        points: {
           attendance: { 'حاضر': 5, 'متأخر': 2, 'تعويض': 5, 'غائب': 0 },
           evaluation: { 'ممتاز': 10, 'جيد جداً': 8, 'جيد': 6, 'متوسط': 4, 'لم يحفظ': 0 },
           behavior: { 'هادئ': 5, 'متوسط': 2, 'غير منضبط': -2 },
           review: { completed: 5 },
           surah: { memorized: 50, mastered: 100 },
           covenantCompleted: 20
        },
        rewards: [],
        badges: []
      }
    });
  }

  if (principalId && schoolId) {
    await supabase.from('users').upsert({
      id: principalId,
      school_id: schoolId,
      email: principalEmail,
      display_name: "الإدارة العامة",
      role: "principal",
      is_active: true,
      join_date: new Date().toISOString().slice(0, 10)
    });

    console.log("⏳ Processing 18 Teachers...");
    for (let i = 1; i <= 18; i++) {
        const teacherEmail = `admin${i}@gmail.com`;
        const groupName = `الفوج ${i}`;
        let teacherId = "";
        const { data: tAuthData, error: tAuthErr } = await supabase.auth.admin.createUser({
            email: teacherEmail,
            password: password,
            email_confirm: true,
        });

        if (tAuthErr) {
            if (tAuthErr.code === 'email_exists' || tAuthErr.message.includes("already registered")) {
                const { data: tUsersData } = await supabase.auth.admin.listUsers();
                const tExisting = tUsersData.users.find(u => u.email === teacherEmail);
                if (tExisting) teacherId = tExisting.id;
            } else continue;
        } else {
            teacherId = tAuthData.user.id;
        }

        if (teacherId) {
            await supabase.from('users').upsert({
                id: teacherId,
                school_id: schoolId,
                email: teacherEmail,
                display_name: `أستاذ ${groupName}`,
                group_name: groupName,
                role: "teacher",
                is_active: true,
                join_date: new Date().toISOString().slice(0, 10)
            });
            console.log(`      ✅ Added ${teacherEmail}`);
        }
    }
  }

  console.log("🎉 Step 1 Complete!");
}

main().catch(console.error);
