import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE URL or Keys in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createDummySchool() {
  const dummyEmail = 'dummy_school@quran.com';
  const dummyPassword = 'password123';

  console.log("1. Creating dummy user in Auth...");
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: dummyEmail,
    password: dummyPassword,
    email_confirm: true
  });

  let userId;
  if (authError) {
    if (authError.message.includes('already been registered')) {
        console.log("User already exists, fetching user ID...");
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const existingUser = usersData.users.find(u => u.email === dummyEmail);
        userId = existingUser.id;
        
        // Update password just in case
        await supabase.auth.admin.updateUserById(userId, { password: dummyPassword });
    } else {
        console.error("Failed to create auth user:", authError);
        process.exit(1);
    }
  } else {
    userId = authData.user.id;
  }
  console.log("User ID:", userId);

  console.log("2. Creating School Record...");
  
  // Check if school already exists
  const { data: existingSchool } = await supabase.from('schools').select('id').eq('email', dummyEmail).maybeSingle();
  let schoolId;

  if (existingSchool) {
      console.log("School already exists, School ID:", existingSchool.id);
      schoolId = existingSchool.id;
  } else {
      const { data: schoolData, error: schoolError } = await supabase.from('schools').insert([{
        name: 'المدرسة التجريبية',
        city: 'الجزائر',
        country: 'الجزائر',
        owner_id: userId,
        plan: 'premium',
        is_active: true,
        director_name: 'مدير تجريبي',
        email: dummyEmail,
        phone: '0000000000'
      }]).select().single();

      if (schoolError) {
        console.error("Failed to create school:", schoolError);
        process.exit(1);
      }
      schoolId = schoolData.id;
      console.log("School created successfully. ID:", schoolId);
  }

  console.log("3. Creating User Profile Record...");
  
  const { data: existingProfile } = await supabase.from('users').select('id').eq('id', userId).maybeSingle();
  
  if (!existingProfile) {
      const { error: profileError } = await supabase.from('users').insert([{
        id: userId,
        school_id: schoolId,
        email: dummyEmail,
        display_name: 'المدير التجريبي',
        role: 'principal',
        is_active: true
      }]);

      if (profileError) {
        console.error("Failed to create user profile:", profileError);
        process.exit(1);
      }
      console.log("User profile created successfully.");
  } else {
      console.log("User profile already exists.");
  }

  console.log("\n==================================");
  console.log("تم إنشاء مدرسة تجريبية بنجاح!");
  console.log(`البريد الإلكتروني: ${dummyEmail}`);
  console.log(`كلمة المرور: ${dummyPassword}`);
  console.log("==================================");
}

createDummySchool();
