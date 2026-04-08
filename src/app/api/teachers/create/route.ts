import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: الـ Principal يُنشئ حساب معلم جديد في مدرسته
export async function POST(request: Request) {
  try {
    const { schoolId, displayName, email, password, groupName, phone, gender } = await request.json();

    if (!schoolId || !displayName || !email || !password) {
      return NextResponse.json({ error: 'البيانات الأساسية مطلوبة' }, { status: 400 });
    }

    const supabase = await createClient();

    // التحقق أن المُنفذ هو principal أو super_admin وأنه ينتمي لنفس المدرسة
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { data: callerData } = await supabase
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

    // إنشاء الحساب في auth.users عبر دالة SECURITY DEFINER SQL
    const { data: result, error: rpcError } = await supabase.rpc('create_teacher_account', {
      p_school_id: schoolId,
      p_display_name: displayName,
      p_email: email,
      p_password: password,
      p_group_name: groupName || 'فوج عام',
      p_phone: phone || '',
      p_gender: gender || 'ذكر',
    });

    if (rpcError) throw rpcError;

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Teacher create error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
