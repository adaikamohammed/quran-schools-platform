import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// POST: مدير المدرسة يغيّر كلمة مرور معلم
export async function POST(request: Request) {
  try {
    const { userId, password } = await request.json();

    if (!userId || !password) {
      return NextResponse.json({ error: 'البيانات مطلوبة' }, { status: 400 });
    }

    const supabaseAuth = await createClient();

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { data: callerData } = await supabaseAuth
      .from('users')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    const { data: targetData } = await supabaseAuth
      .from('users')
      .select('role, school_id')
      .eq('id', userId)
      .single();

    const isAllowed =
      callerData?.role === 'super_admin' ||
      (callerData?.role === 'principal' &&
        callerData?.school_id === targetData?.school_id &&
        targetData?.role === 'teacher');

    if (!isAllowed) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
    });

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update password error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ' }, { status: 500 });
  }
}
