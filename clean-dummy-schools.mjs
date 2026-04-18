import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const emailsToWipe = ['admin@gmail.com', 'admin2@gmail.com'];

async function clean() {
  console.log("Starting cleanup...");

  for (const email of emailsToWipe) {
    console.log(`\n--- Cleaning ${email} ---`);
    
    // 1. Delete the user from auth.users via Admin API (Safest way)
    const { data: users, error: findErr } = await supabase.auth.admin.listUsers();
    if (findErr) {
      console.error("Failed to list users:", findErr.message);
      continue;
    }

    const user = users.users.find(u => u.email === email);
    if (user) {
      console.log(`Found user ${email} in Auth. Deleting...`);
      const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
      if (delErr) {
        console.error(`Failed to delete Auth User ${email}:`, delErr.message);
      } else {
        console.log(`✅ Auth user ${email} deleted successfully.`);
      }
    } else {
      console.log(`Auth user ${email} not found (already deleted).`);
    }

    // 2. Delete the schools associated with this email
    console.log(`Deleting schools associated with ${email}...`);
    const { data: schools, error: schoolErr } = await supabase
      .from('schools')
      .delete()
      .eq('email', email)
      .select();

    if (schoolErr) {
      console.error(`Failed to delete schools for ${email}:`, schoolErr.message);
    } else {
      console.log(`✅ Deleted ${schools?.length || 0} associated schools.`);
    }

    // 3. Reset the school request status back to pending so you can accept it again cleanly
    console.log(`Resetting school requests for ${email}...`);
    await supabase
      .from('school_requests')
      .update({ status: 'pending' })
      .eq('email', email);
      
    // 4. Force delete from public.users just in case
    await supabase.from('users').delete().eq('email', email);
  }

  console.log("\nCleanup Complete! You can now test accepting the requests cleanly.");
}

clean();
