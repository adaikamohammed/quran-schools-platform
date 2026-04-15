/**
 * Seed Script v2 — يدرج بيانات تجريبية للمدرسة التجريبية
 * يُنشئ المعلمين عبر Supabase Auth Admin API أولاً
 *
 * RUN: node src/scripts/seedDummyData.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jfluvyrgdololesghvuc.supabase.co";
const SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmbHV2eXJnZG9sb2xlc2dodnVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU4NzM3NywiZXhwIjoyMDkxMTYzMzc3fQ.kS3HoaH4Z_vCyTHe5WN_PrXCvBN0TVHvDBWv7lavt9c";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function uuid() { return crypto.randomUUID(); }
const now = new Date().toISOString();

// ─── 1. جلب المدرسة ──────────────────────────────────────
async function getSchool() {
  const { data, error } = await supabase
    .from("users")
    .select("id, school_id")
    .eq("email", "dummy_school@quran.com")
    .single();

  if (error || !data) { console.error("❌ المستخدم غير موجود:", error?.message); process.exit(1); }

  const { data: school } = await supabase
    .from("schools").select("id, name").eq("id", data.school_id).single();

  console.log(`✅ المدرسة: ${school.name} (${school.id})`);
  return { schoolId: school.id };
}

// ─── 2. إنشاء معلم عبر Auth + users ─────────────────────
const TEACHERS = [
  { name: "أ. عبد الرحمن بوعلام", group: "فوج النور",   email: "teacher_nor@dummy.local" },
  { name: "أ. يوسف مسعود",        group: "فوج الرشيد",  email: "teacher_rsh@dummy.local" },
  { name: "أ. سعيد هاشمي",        group: "فوج الفرقان", email: "teacher_frq@dummy.local" },
];

async function ensureTeacher(t, schoolId) {
  // هل موجود في users؟
  const { data: existing } = await supabase
    .from("users").select("id").eq("email", t.email).single();
  if (existing) {
    console.log(`  ♻️  موجود: ${t.name}`);
    return existing.id;
  }

  // إنشاء في auth.users
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: t.email,
    password: "teacher123!",
    email_confirm: true,
    user_metadata: { displayName: t.name },
  });

  if (authErr) {
    // قد يكون موجود بالفعل في auth —  حاول جلبه
    const { data: users } = await supabase.auth.admin.listUsers();
    const found = users?.users?.find(u => u.email === t.email);
    if (!found) { console.error(`  ❌ فشل إنشاء auth لـ ${t.name}:`, authErr.message); return null; }
    authData = { user: found };
  }

  const authId = authData.user.id;

  // إدراج في جدول users
  const { error: dbErr } = await supabase.from("users").insert({
    id: authId,
    school_id: schoolId,
    email: t.email,
    display_name: t.name,
    role: "teacher",
    group_name: t.group,
    is_active: true,
    join_date: "2025-01-01",
    gender: "ذكر",
    created_at: now,
    updated_at: now,
  });

  if (dbErr) { console.error(`  ❌ DB insert for ${t.name}:`, dbErr.message); return null; }
  console.log(`  ✅ معلم جديد: ${t.name} → ${t.group}`);
  return authId;
}

// ─── 3. الطلاب ───────────────────────────────────────────
const STUDENTS_RAW = [
  // فوج النور
  { fullName: "أحمد بن عمر",      gender: "ذكر",  tier: "فئة الأكابر", age: 14, phone: "0551230001" },
  { fullName: "إسماعيل بوزيان",   gender: "ذكر",  tier: "فئة الأصاغر", age: 10, phone: "0551230002" },
  { fullName: "مريم بلحاج",       gender: "أنثى", tier: "فئة الأكابر", age: 15, phone: "0551230003" },
  { fullName: "عائشة بن سالم",    gender: "أنثى", tier: "فئة الأصاغر", age: 9,  phone: "0551230004" },
  { fullName: "يحيى بن طاهر",     gender: "ذكر",  tier: "فئة الأكابر", age: 13, phone: "0551230005" },
  // فوج الرشيد
  { fullName: "عبد الله فارس",    gender: "ذكر",  tier: "فئة الأكابر", age: 16, phone: "0551230006" },
  { fullName: "أسامة دراجي",      gender: "ذكر",  tier: "فئة الأصاغر", age: 11, phone: "0551230007" },
  { fullName: "فاطمة مزغاش",      gender: "أنثى", tier: "فئة الأكابر", age: 14, phone: "0551230008" },
  { fullName: "حنان بوبكر",       gender: "أنثى", tier: "فئة الأصاغر", age: 10, phone: "0551230009" },
  { fullName: "نبيل بن خالد",     gender: "ذكر",  tier: "فئة الأكابر", age: 17, phone: "0551230010" },
  // فوج الفرقان
  { fullName: "بلال رويشد",       gender: "ذكر",  tier: "فئة الأصاغر", age: 8,  phone: "0551230011" },
  { fullName: "سلمى حمودة",       gender: "أنثى", tier: "فئة الأكابر", age: 13, phone: "0551230012" },
  { fullName: "زكريا تيغزة",      gender: "ذكر",  tier: "فئة الأكابر", age: 15, phone: "0551230013" },
  { fullName: "أميرة بن حمزة",    gender: "أنثى", tier: "فئة الأصاغر", age: 9,  phone: "0551230014" },
  { fullName: "رامي المصطفى",     gender: "ذكر",  tier: "فئة الأكابر", age: 12, phone: "0551230015" },
];

async function seedStudents(schoolId, teacherIds) {
  const grouped = [[], [], []];
  for (let i = 0; i < STUDENTS_RAW.length; i++) {
    const s   = STUDENTS_RAW[i];
    const idx = Math.floor(i / 5);
    const tid = teacherIds[idx];
    if (!tid) { console.error(`  ❌ معلم غير موجود للفوج ${idx}`); continue; }

    const id = uuid();
    const { error } = await supabase.from("students").insert({
      id,
      school_id: schoolId,
      teacher_id: tid,
      full_name: s.fullName,
      gender: s.gender,
      status: "نشط",
      group_name: TEACHERS[idx].group,
      subscription_tier: s.tier,
      phone1: s.phone,
      birth_date: `${new Date().getFullYear() - s.age}-06-15`,
      registration_date: "2025-01-15",
      guardian_name: `ولي أمر ${s.fullName}`,
      memorized_surahs_count: Math.floor(Math.random() * 25) + 2,
      daily_memorization_amount: rnd(["صفحة", "ربع", "نصف", "ثمن"]),
      created_at: now,
      updated_at: now,
    });

    if (error) { console.error(`  ❌ ${s.fullName}:`, error.message); }
    else {
      console.log(`  ✅ ${s.fullName} → ${TEACHERS[idx].group}`);
      grouped[idx].push(id);
    }
  }
  return grouped; // [[ids for group0], [ids for group1], [ids for group2]]
}

// ─── 4. الحصص ────────────────────────────────────────────
function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function daysAgoStr(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const ATT    = ["حاضر","حاضر","حاضر","غائب","متأخر"];
const MEM    = ["ممتاز","جيد جداً","جيد","لم يحفظ"];
const STYPES = ["تسميع","مراجعة","تسميع","تسميع"];
const DAY_OFFSETS = [1,3,6,8,10,13,15,17,20,22,24,27]; // 12 حصة

async function seedSessions(schoolId, teacherIds, grouped) {
  let n = 0;
  for (let g = 0; g < TEACHERS.length; g++) {
    const tid    = teacherIds[g];
    const stuIds = grouped[g];
    if (!tid || !stuIds?.length) continue;

    for (let s = 0; s < DAY_OFFSETS.length; s++) {
      const date = daysAgoStr(DAY_OFFSETS[s]);
      const records = stuIds.map(studentId => ({
        studentId,
        attendance: rnd(ATT),
        memorization: rnd(MEM),
        newPages: Math.floor(Math.random() * 3),
        reviewPages: Math.floor(Math.random() * 5) + 1,
        notes: Math.random() > 0.8 ? "يحتاج متابعة" : "",
        tajweedLevel: rnd(["ممتاز","جيد","مقبول"]),
      }));

      const sessionId = `${date}-${tid.slice(0,8)}-${(s % 2) + 1}`;
      const { error } = await supabase.from("daily_sessions").insert({
        id: sessionId,
        school_id: schoolId,
        teacher_id: tid,
        date,
        session_number: (s % 2) + 1,
        session_type: rnd(STYPES),
        records: JSON.stringify(records),
        created_at: now,
        updated_at: now,
      });

      if (error) console.error(`  ❌ حصة ${date} / ${TEACHERS[g].group}:`, error.message);
      else n++;
    }
    console.log(`  ✅ ${TEACHERS[g].group}: ${DAY_OFFSETS.length} حصة مُسجَّلة`);
  }
  return n;
}

// ─── 5. الدفعات ──────────────────────────────────────────
async function seedPayments(schoolId, grouped) {
  let count = 0;
  const season = `${new Date().getFullYear()}-Q2`;
  for (let g = 0; g < grouped.length; g++) {
    for (const studentId of grouped[g]) {
      const status = rnd(["paid","paid","paid","unpaid","exempted"]);
      const { error } = await supabase.from("payments").insert({
        id: uuid(),
        school_id: schoolId,
        student_id: studentId,
        amount: rnd([1200, 1500]),
        date: season,
        status,
        paid_at: status === "paid" ? daysAgoStr(Math.floor(Math.random() * 10)) : null,
        created_at: now,
        updated_at: now,
      });
      if (!error) count++;
    }
  }
  console.log(`  ✅ ${count} دفعة مالية`);
}

// ─── MAIN ─────────────────────────────────────────────────
async function main() {
  console.log("\n🚀 بدء البذر...\n");

  const { schoolId } = await getSchool();

  console.log("\n👥 إنشاء المعلمين (عبر Auth Admin)...");
  const teacherIds = [];
  for (const t of TEACHERS) {
    const id = await ensureTeacher(t, schoolId);
    teacherIds.push(id);
  }

  const validTeachers = teacherIds.filter(Boolean);
  if (validTeachers.length === 0) {
    console.error("❌ لم يتم إنشاء أي معلم — إيقاف");
    process.exit(1);
  }

  console.log("\n📚 إضافة الطلاب...");
  const grouped = await seedStudents(schoolId, teacherIds);

  console.log("\n📋 تسجيل الحصص...");
  const totalSessions = await seedSessions(schoolId, teacherIds, grouped);

  console.log("\n💰 تسجيل الدفعات...");
  await seedPayments(schoolId, grouped);

  const total = grouped.flat().length;
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ اكتمل البذر!
   • أفواج:  3  (فوج النور / الرشيد / الفرقان)
   • طلاب:   ${total}
   • حصص:   ${totalSessions}
   • المدرسة: ${schoolId}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
يمكنك الآن فتح http://localhost:3000/app
  `);
}

main().catch(console.error);
