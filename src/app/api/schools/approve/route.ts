import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ─── POST: المدير العام يقبل طلب مدرسة – ينشئ المدرسة وحساب المدير تلقائياً
export async function POST(request: Request) {
  try {
    const { requestId, password } = await request.json();

    if (!requestId || !password) {
      return NextResponse.json({ error: 'معرّف الطلب وكلمة المرور مطلوبان' }, { status: 400 });
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

    // استدعاء الـ RPC لإنشاء المدرسة + الحساب بأمان كامل عبر SECURITY DEFINER
    const { data: result, error: rpcError } = await supabase.rpc('create_school_with_principal', {
      p_school_name: req.school_name,
      p_city: req.city || '',
      p_country: req.country || 'الجزائر',
      p_principal_name: req.director_name,
      p_email: req.email,
      p_password: password,
    });

    if (rpcError) throw rpcError;

    // تحديث حالة الطلب إلى "مقبول"
    await supabase
      .from('school_requests')
      .update({
        status: 'approved',
        reviewed_by: userData.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    return NextResponse.json({ success: true, result });
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

    await supabase
      .from('school_requests')
      .update({ status: 'rejected', reviewed_by: userData.id, reviewed_at: new Date().toISOString() })
      .eq('id', requestId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
