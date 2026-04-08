import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load the .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || (!supabaseServiceKey && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  console.error("Missing SUPABASE URL or Keys in .env");
  process.exit(1);
}

// Ensure you have SUPABASE_SERVICE_ROLE_KEY in .env. If not, this might fail unless you're bypassing RLS.
// Assuming the user has SUPABASE_SERVICE_ROLE_KEY (or I can fetch it). Wait, the user shared some keys earlier.
// Wait! We can just run a Supabase command to update the user password directly if we have the service role key.
const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function resetPassword() {
  console.log("Fetching admin user...");
  // Let's use the Admin API to update the user
  // To do that, we need the user ID
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Failed to list users. Need Service Role Key. Error:", error);
    process.exit(1);
  }
  
  const admin = users.find(u => u.email === 'admin@quran.com');
  if (!admin) {
    console.log("Admin not found in auth.users!");
    process.exit(1);
  }
  
  console.log("Found admin:", admin.id);
  
  const { data, error: updateError } = await supabase.auth.admin.updateUserById(admin.id, {
    password: 'admin123'
  });
  
  if (updateError) {
    console.error("Failed to update password:", updateError);
  } else {
    console.log("Password updated successfully using Supabase Admin API. You can now login!");
  }
}

resetPassword();
