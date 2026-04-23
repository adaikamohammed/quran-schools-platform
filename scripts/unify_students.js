
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function unifyStudents() {
  console.log('🔗 Starting Student Unification (Deduplication)...');

  // 1. Fetch all students
  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, group_name, teacher_id');

  if (!students) return;

  const groupsByName = {};
  students.forEach(s => {
    if (!groupsByName[s.full_name]) groupsByName[s.full_name] = [];
    groupsByName[s.full_name].push(s);
  });

  const duplicates = Object.entries(groupsByName).filter(([name, list]) => list.length > 1);
  console.log(`📊 Found ${duplicates.length} duplicate student names.`);

  let totalUpdated = 0;
  let totalDeleted = 0;

  for (const [name, list] of duplicates) {
    // Master is the first one (usually the one in the correct group if sorted or just first)
    const master = list[0];
    const slaves = list.slice(1);

    for (const slave of slaves) {
      // Re-link daily_records
      const { count: recCount } = await supabase.from('daily_records').update({ student_id: master.id }).eq('student_id', slave.id);
      
      // Re-link surah_progress
      const { count: progCount } = await supabase.from('surah_progresses').update({ student_id: master.id }).eq('student_id', slave.id);
      
      // Re-link payments
      const { count: payCount } = await supabase.from('payments').update({ student_id: master.id }).eq('student_id', slave.id);

      // Delete slave student
      await supabase.from('students').delete().eq('id', slave.id);
      totalDeleted++;
    }
    totalUpdated++;
  }

  console.log(`✨ Deduplication complete.`);
  console.log(`🗑️  Deleted ${totalDeleted} duplicate student records.`);
  console.log(`✅ Unified ${totalUpdated} unique students.`);
}

unifyStudents().catch(console.error);
