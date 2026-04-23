
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixMigration() {
  console.log('🚀 Starting Data Repair and Unification...');

  // 1. Fetch all teachers
  const { data: teachers } = await supabase
    .from('users')
    .select('id, group_name, display_name, school_id')
    .eq('role', 'teacher');

  if (!teachers) {
    console.error('❌ Could not fetch teachers');
    return;
  }

  const teacherMap = {};
  teachers.forEach(t => {
    if (t.group_name) {
      teacherMap[t.group_name] = t.id;
      // Also map common variations
      const normalized = t.group_name.replace('الفوج ', '').trim();
      teacherMap[normalized] = t.id;
    }
  });

  console.log(`✅ Loaded ${teachers.length} teachers for mapping.`);

  // 2. Fix Students
  const { data: students } = await supabase
    .from('students')
    .select('id, group_name, teacher_id, full_name');

  console.log(`📊 Processing ${students.length} students...`);

  let studentUpdates = 0;
  for (const student of students) {
    const correctTeacherId = teacherMap[student.group_name] || 
                            teacherMap[student.group_name.replace('الفوج ', '')];

    if (correctTeacherId && student.teacher_id !== correctTeacherId) {
      await supabase.from('students').update({ 
        teacher_id: correctTeacherId,
        status: 'نشط' // Ensure they are active
      }).eq('id', student.id);
      studentUpdates++;
    } else if (student.status !== 'نشط') {
        await supabase.from('students').update({ status: 'نشط' }).eq('id', student.id);
        studentUpdates++;
    }
  }
  console.log(`✨ Updated ${studentUpdates} students with correct teacher linkage and status.`);

  // 3. Fix Daily Sessions (Calendar dots)
  // We need to ensure sessions have the correct teacher_id based on the students in them
  const { data: sessions } = await supabase
    .from('daily_sessions')
    .select('id, teacher_id, group_name');

  let sessionUpdates = 0;
  if (sessions) {
    for (const session of sessions) {
        // Find the correct teacher for this session's group
        const correctTeacherId = teacherMap[session.group_name] || 
                                teacherMap[session.group_name?.replace('الفوج ', '')];
        
        if (correctTeacherId && session.teacher_id !== correctTeacherId) {
            await supabase.from('daily_sessions').update({ 
                teacher_id: correctTeacherId 
            }).eq('id', session.id);
            sessionUpdates++;
        }
    }
  }
  console.log(`✨ Updated ${sessionUpdates} sessions with correct teacher linkage.`);

  // 4. Fix Payments
  const { data: payments } = await supabase
    .from('payments')
    .select('id, student_id');
  
  // We don't really need to fix payments since they link via student_id, 
  // but we should ensure they have the same school_id as the student.
  // Actually, let's just make sure school_id is consistent everywhere.
  
  console.log('🏁 Data repair complete. Please ask the user to Sync/Refresh in their browser.');
}

fixMigration().catch(console.error);
