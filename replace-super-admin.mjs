/**
 * replace-super-admin.mjs
 * ========================
 * يحذف مدير الموقع القديم (admin@quran.com) من auth.users وجدول users
 * ثم يُنشئ المدير الجديد (adaikamohamedali213213@gmail.com) بدور super_admin
 * ويتأكد أن حسابه لا يرتبط بأي مدرسة (school_id = NULL) لأنه مدير النظام فقط.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const OLD_EMAIL = 'admin@quran.com';
const NEW_EMAIL = 'adaikamohamedali213213@gmail.com';
const NEW_PASS  = 'adaikamohammed';
const NEW_NAME  = 'مدير النظام';

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  // ── 1. جلب قائمة المستخدمين ──────────────────────────────────────────────
  console.log('🔍  Fetching all auth users...');
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) { console.error('❌  listUsers failed:', listErr.message); process.exit(1); }

  // ── 2. حذف المدير القديم ─────────────────────────────────────────────────
  const oldUser = users.find(u => u.email === OLD_EMAIL);
  if (oldUser) {
    console.log(`🗑   Found old admin (${oldUser.id}), deleting from public.users ...`);
    await supabase.from('users').delete().eq('id', oldUser.id);

    console.log('🗑   Deleting from auth.users ...');
    const { error: delErr } = await supabase.auth.admin.deleteUser(oldUser.id);
    if (delErr) console.warn('⚠️   Could not delete old auth user:', delErr.message);
    else        console.log('✅  Old admin deleted from auth.users.');
  } else {
    console.log(`ℹ️   Old admin (${OLD_EMAIL}) not found — skipping deletion.`);
  }

  // ── 3. هل المدير الجديد موجود بالفعل؟ ────────────────────────────────────
  const existingNew = users.find(u => u.email === NEW_EMAIL);
  let newUserId;

  if (existingNew) {
    console.log(`ℹ️   New admin already exists (${existingNew.id}). Updating password & metadata...`);
    const { error: updErr } = await supabase.auth.admin.updateUserById(existingNew.id, {
      password: NEW_PASS,
      email_confirm: true,
      user_metadata: { display_name: NEW_NAME, role: 'super_admin' },
    });
    if (updErr) { console.error('❌  updateUserById failed:', updErr.message); process.exit(1); }
    newUserId = existingNew.id;
    console.log('✅  Password & metadata updated.');
  } else {
    console.log(`➕  Creating new super admin: ${NEW_EMAIL} ...`);
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: NEW_EMAIL,
      password: NEW_PASS,
      email_confirm: true,
      user_metadata: { display_name: NEW_NAME, role: 'super_admin' },
    });
    if (createErr || !created.user) {
      console.error('❌  createUser failed:', createErr?.message); process.exit(1);
    }
    newUserId = created.user.id;
    console.log(`✅  New auth user created: ${newUserId}`);
  }

  // ── 4. ضمان وجود سجل في public.users بدور super_admin بدون school_id ─────
  console.log('🔧  Upserting record in public.users ...');
  const { error: upsertErr } = await supabase.from('users').upsert(
    {
      id:           newUserId,
      email:        NEW_EMAIL,
      display_name: NEW_NAME,
      role:         'super_admin',
      school_id:    null,        // ⚠️ مدير النظام لا ينتمي لأي مدرسة
      group_name:   null,
      is_active:    true,
    },
    { onConflict: 'id' }
  );

  if (upsertErr) {
    console.error('❌  Upsert in public.users failed:', upsertErr.message);
    process.exit(1);
  }

  // ── 5. تأكيد ─────────────────────────────────────────────────────────────
  const { data: check } = await supabase.from('users').select('id, email, role, school_id, is_active').eq('id', newUserId).single();
  console.log('\n══════════════════════════════════════════════════');
  console.log('🎉  Super Admin replaced successfully!');
  console.log('──────────────────────────────────────────────────');
  console.log('  Email    :', check?.email);
  console.log('  Role     :', check?.role);
  console.log('  SchoolId :', check?.school_id ?? '(none — correct ✓)');
  console.log('  Active   :', check?.is_active);
  console.log('  Password :', NEW_PASS);
  console.log('══════════════════════════════════════════════════\n');
  console.log('✅  You can now login at /login with the new credentials.');
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
