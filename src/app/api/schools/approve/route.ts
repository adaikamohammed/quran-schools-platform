import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ─── POST: المدير العام يقبل طلب مدرسة – ينشئ المدرسة وحساب المدير تلقائياً
export async function POST(request: Request) {
  try {
    const { requestId, password } = await request.json();

    if (!requestId || !password || password.length < 6) {
      return NextResponse.json({ error: 'معرّف الطلب وكلمة المرور مطلوبة (6 أحرف على الأقل)' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // التحقق أن المُنفذ هو super_admin
    const { data: userData } = await supabase.from('users').select('role, id').eq('id', user.id).single();
    if (userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // تحميل الطلب
    const { data: req, error: reqError } = await supabase
      .from('school_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single();

    if (reqError || !req) {
      return NextResponse.json({ error: 'الطلب غير موجود أو تمت مراجعته مسبقاً' }, { status: 404 });
    }

    // ─── استخدام Supabase Admin API لإنشاء حساب المدير بأمان ومتوافق مع تسجيل الدخول ───
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. إنشاء المستخدم في auth.users
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: req.email,
      password: password,
      email_confirm: true,
      user_metadata: { role: 'principal' }
    });

    if (createAuthError) {
      console.error('Admin CreateUser Error:', createAuthError);
      return NextResponse.json({ error: 'تعذر إنشاء الحساب، مسجل مسبقاً أو كلمة سر ضعيفة' }, { status: 400 });
    }

    const newUserId = authData.user.id;

    // 2. إنشاء المدرسة
    const { data: schoolData, error: schoolError } = await supabaseAdmin
      .from('schools')
      .insert({
        name: req.school_name,
        city: req.city || '',
        country: req.country || 'الجزائر',
        owner_id: newUserId,
        plan: 'free',
        is_active: true,
        director_name: req.director_name,
        email: req.email
      })
      .select()
      .single();

    if (schoolError) {
      // التراجع في حال الفشل
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw schoolError;
    }

    // 3. إنشاء سجل المدير في public.users
    const { error: publicUserError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newUserId,
        school_id: schoolData.id,
        email: req.email,
        display_name: req.director_name,
        role: 'principal',
      });

    if (publicUserError) {
      console.error('Public User Error:', publicUserError);
    }

    // تحديث حالة الطلب إلى "مقبول"
    await supabase
      .from('school_requests')
      .update({
        status: 'approved',
        reviewed_by: userData.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    return NextResponse.json({ success: true, result: { school_id: schoolData.id, user_id: newUserId } });
  } catch (error: any) {
    console.error('School approve error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// ─── DELETE: رفض طلب مدرسة ───────────────────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const { requestId } = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { data: userData } = await supabase.from('users').select('role, id').eq('id', user.id).single();
    if (userData?.role !== 'super_admin') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    // استخدم Admin API لضمان تحديث السجل بغض النظر عن RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { error: updateError } = await supabaseAdmin
      .from('school_requests')
      .update({ status: 'rejected', reviewed_by: userData.id, reviewed_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateError) {
      console.error('Delete/Reject error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unexpected delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
