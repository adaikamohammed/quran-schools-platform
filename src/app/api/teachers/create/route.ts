import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// POST: الـ Principal يُنشئ حساب معلم جديد في مدرسته
export async function POST(request: Request) {
  try {
    const { schoolId, displayName, email, password, groupName, phone, gender, photoURL } = await request.json();

    if (!schoolId || !displayName || !email || !password) {
      return NextResponse.json({ error: 'البيانات الأساسية مطلوبة' }, { status: 400 });
    }

    const supabaseAuth = await createClient();

    // التحقق أن المُنفذ هو principal أو super_admin وأنه ينتمي لنفس المدرسة
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { data: callerData } = await supabaseAuth
      .from('users')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    const isAllowed =
      callerData?.role === 'super_admin' ||
      (callerData?.role === 'principal' && callerData?.school_id === schoolId);

    if (!isAllowed) {
      return NextResponse.json({ error: 'غير مصرح - يمكن للمدير فقط إضافة معلمين لمدرسته' }, { status: 403 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    // استخدام Admin Client لإنشاء الحساب متجاوزاً RLS
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Create auth user
    const { data: authUser, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: {
        role: 'teacher'
      }
    });

    if (authCreateError) throw authCreateError;

    // 2. Insert into public.users
    const { data: publicUser, error: publicInsertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        school_id: schoolId,
        display_name: displayName.trim(),
        email: email.trim().toLowerCase(),
        role: 'teacher',
        group_name: groupName || 'فوج عام',
        phone: phone || '',
        gender: gender || 'ذكر',
        photo_url: photoURL || null,
        is_active: true,
        plain_password: password, // مرئية لمدير المدرسة فقط
      })
      .select()
      .single();

    if (publicInsertError) {
      // Rollback auth user creation if public insert fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw publicInsertError;
    }

    return NextResponse.json({ success: true, result: publicUser });
  } catch (error: any) {
    console.error('Teacher create error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
