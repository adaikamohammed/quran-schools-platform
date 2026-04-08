import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DELETE: الـ Principal يحذف حساب معلم من مدرسته
export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'معرّف المستخدم مطلوب' }, { status: 400 });

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { data: callerData } = await supabase.from('users').select('role, school_id').eq('id', user.id).single();

    // تحميل بيانات المعلم للتحقق من نفس المدرسة
    const { data: targetUser } = await supabase.from('users').select('school_id, role').eq('id', userId).single();

    const isAllowed =
      callerData?.role === 'super_admin' ||
      (callerData?.role === 'principal' &&
        callerData?.school_id === targetUser?.school_id &&
        targetUser?.role === 'teacher');

    if (!isAllowed) {
      return NextResponse.json({ error: 'غير مصرح - لا يمكنك حذف هذا الحساب' }, { status: 403 });
    }

    // تعطيل الحساب بدلاً من الحذف الكلي (soft delete)
    await supabase.from('users').update({ is_active: false }).eq('id', userId);
    // أو حذف فعلي من auth.users (يحتاج service_role key - نكتفي بـ is_active هنا)

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
