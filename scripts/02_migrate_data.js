const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');
const { v5: uuidv5 } = require('uuid');

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; 

function toUUID(str) {
  if (!str) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)) return str;
  return uuidv5(String(str), NAMESPACE);
}

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function convertKeysToSnake(obj) {
  if (Array.isArray(obj)) {
    return obj.map((v) => convertKeysToSnake(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      acc[camelToSnake(key)] = convertKeysToSnake(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

async function main() {
  console.log("🚀 Starting DEEP Data Migration (Consolidation Mode - Final Fix)...");

  const rawData = fs.readFileSync('old_data.json.json', 'utf8');
  const firebaseData = JSON.parse(rawData);
  console.log("✅ JSON loaded.");

  const { data: principal } = await supabase.from('users').select('school_id').eq('email', 'admin00@gmail.com').single();
  if (!principal) throw new Error("Could not find admin00@gmail.com!");
  const schoolId = principal.school_id;

  const { data: teachersData } = await supabase.from('users').select('id, group_name').eq('school_id', schoolId).eq('role', 'teacher');
  const teacherMapByGroup = {};
  for (const t of teachersData) {
    if (t.group_name) {
      let g = t.group_name.replace(/الفوج|فوج/g, '').trim();
      teacherMapByGroup[g] = t.id;
      teacherMapByGroup[t.group_name] = t.id;
    }
  }

  const { users } = firebaseData;
  const groupsData = {}; 

  console.log("⏳ Consolidating data...");
  for (const [oldUid, oldUser] of Object.entries(users)) {
    const profile = oldUser.profile || oldUser;
    if (!oldUser.students && !oldUser.dailySessions && !oldUser.payments) continue;
    let group = profile.group || profile.groupName || profile.displayName || "عام";
    let normalizedGroup = String(group).replace(/الفوج|فوج/g, '').trim();
    if (!groupsData[normalizedGroup]) groupsData[normalizedGroup] = { students: {}, sessions: {}, payments: {} };
    if (oldUser.students) Object.assign(groupsData[normalizedGroup].students, oldUser.students);
    if (oldUser.dailySessions) Object.assign(groupsData[normalizedGroup].sessions, oldUser.dailySessions);
    if (oldUser.payments) Object.assign(groupsData[normalizedGroup].payments, oldUser.payments);
  }

  for (const [normalizedGroup, data] of Object.entries(groupsData)) {
    const newTeacherId = teacherMapByGroup[normalizedGroup] || teacherMapByGroup[`الفوج ${normalizedGroup}`];
    if (!newTeacherId) continue;

    console.log(`\n🔹 Group ${normalizedGroup}`);

    const studentsToInsert = [];
    const progressToInsert = [];
    for (const [studentId, sData] of Object.entries(data.students)) {
      const studentUUID = toUUID(studentId);
      studentsToInsert.push({
        id: studentUUID,
        school_id: schoolId,
        teacher_id: newTeacherId,
        group_name: `الفوج ${normalizedGroup}`,
        full_name: sData.fullName || "غير مسجل",
        gender: sData.gender || 'ذكر',
        birth_date: sData.birthDate || '2000-01-01',
        educational_level: sData.educationalLevel || 'ابتدائي',
        guardian_name: sData.guardianName || '',
        phone1: sData.phone1 || '',
        phone2: sData.phone2 || '',
        registration_date: (sData.registrationDate || new Date().toISOString()).slice(0, 10),
        status: sData.status || 'نشط',
        subscription_tier: sData.subscriptionTier || 'فئة الأصاغر',
        memorized_surahs_count: sData.memorizedSurahsCount || 0,
        daily_memorization_amount: sData.dailyMemorizationAmount || 'ربع',
        notes: sData.notes || '',
        updated_at: sData.updatedAt || new Date().toISOString(),
        created_at: sData.createdAt || new Date().toISOString(),
      });
      if (sData.surahProgress) {
        for (const [pId, pData] of Object.entries(sData.surahProgress)) {
           if (!pData.surahId) continue;
           progressToInsert.push({
             id: toUUID(pId || `${studentId}_${pData.surahId}`),
             student_id: studentUUID,
             school_id: schoolId,
             surah_id: pData.surah_id || pData.surahId,
             surah_name: pData.surah_name || pData.surahName || '',
             status: pData.status || 'قيد الحفظ',
             from_verse: pData.fromVerse || null,
             to_verse: pData.toVerse || null,
             start_date: (pData.startDate || sData.registrationDate || new Date().toISOString()).slice(0,10),
             updated_at: pData.updatedAt || new Date().toISOString(),
             created_at: pData.createdAt || new Date().toISOString()
           });
        }
      }
    }

    if (studentsToInsert.length > 0) {
      console.log(`   ⏳ Students: ${studentsToInsert.length}`);
      const { error } = await supabase.from('students').upsert(studentsToInsert);
      if (error) console.error("   ❌ Students Upsert Error:", error);
    }
    if (progressToInsert.length > 0) {
      console.log(`   ⏳ Progress: ${progressToInsert.length}`);
      const { error } = await supabase.from('surah_progresses').upsert(progressToInsert);
      if (error) console.error("   ❌ Progress Upsert Error:", error);
    }

    const sessionsToInsert = [];
    const recordsToInsert = [];
    for (const [sessionId, rawSes] of Object.entries(data.sessions)) {
      const sDate = rawSes.date || (typeof sessionId === 'string' ? sessionId.substring(0, 10) : new Date().toISOString().slice(0,10));
      const sessionUUID = toUUID(rawSes.id || `${newTeacherId}_${sDate}_${rawSes.sessionNumber || 1}`);
      sessionsToInsert.push({
        id: sessionUUID,
        school_id: schoolId,
        teacher_id: newTeacherId,
        date: sDate,
        session_number: rawSes.sessionNumber || 1,
        session_type: rawSes.sessionType || 'حصة أساسية',
        surah_id: rawSes.surahId || null,
        from_verse: rawSes.fromVerse || null,
        to_verse: rawSes.toVerse || null,
        is_review: rawSes.isReview || false,
        created_at: rawSes.createdAt || new Date().toISOString(),
        updated_at: rawSes.updatedAt || new Date().toISOString()
      });
      let records = Array.isArray(rawSes.records) ? rawSes.records : (typeof rawSes.records === 'object' ? Object.values(rawSes.records) : []);
      records.forEach(r => {
        if (!r.studentId) return;
        recordsToInsert.push({
          id: toUUID(r.id || `${sessionUUID}_${r.studentId}`),
          session_id: sessionUUID,
          student_id: toUUID(r.studentId),
          ...convertKeysToSnake(r)
        });
      });
    }

    if (sessionsToInsert.length > 0) {
       console.log(`   ⏳ Sessions: ${sessionsToInsert.length}`);
       await supabase.from('daily_sessions').upsert(sessionsToInsert);
    }
    if (recordsToInsert.length > 0) {
       console.log(`   ⏳ Daily Records: ${recordsToInsert.length}`);
       const { error } = await supabase.from('daily_records').upsert(recordsToInsert);
       if (error) console.error("   ❌ Records Upsert Error:", error);
    }

    const paymentsToInsert = [];
    for (const [payId, pRaw] of Object.entries(data.payments)) {
       if (!pRaw.studentId) continue;
       paymentsToInsert.push({
          id: toUUID(payId),
          school_id: schoolId,
          student_id: toUUID(pRaw.studentId),
          amount: pRaw.amount || 0,
          date: pRaw.date || new Date().toISOString().slice(0, 10),
          status: pRaw.status || 'paid',
          paid_at: pRaw.paidAt || null,
          notes: pRaw.notes || '',
          created_at: pRaw.createdAt || new Date().toISOString()
       });
    }
    if (paymentsToInsert.length > 0) {
       console.log(`   ⏳ Payments: ${paymentsToInsert.length}`);
       await supabase.from('payments').upsert(paymentsToInsert);
    }
  }
  console.log("\n🎉 FINAL CONSOLIDATED Data Migration Complete!");
}

main().catch(console.error);
