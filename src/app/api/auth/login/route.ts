import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 });
    }

    const supabase = await createClient();

    // Sign in using Supabase native Auth (to get session cookies correctly set)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error("Auth error from Supabase:", authError);
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة أو الحساب غير نشط' }, { status: 401 });
    }

    console.log("Supabase Auth Success, User ID:", authData.user.id);

    // Fetch the enriched user profile from our public tables
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, display_name, role, school_id, group_name, is_active')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userData || !userData.is_active) {
      console.error("User fetch error or inactive:", userError, userData);
      // حظر الدخول لو الحساب مجمد في قاعدتنا
      await supabase.auth.signOut();
      return NextResponse.json({ error: 'الحساب غير نشط أو لا يملك صلاحيات' }, { status: 401 });
    }

    console.log("Login Success fully completed for:", userData.email);

    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        displayName: userData.display_name,
        role: userData.role,
        schoolId: userData.school_id,
        groupName: userData.group_name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
