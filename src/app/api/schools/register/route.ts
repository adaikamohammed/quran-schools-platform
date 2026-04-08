import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNewSchoolNotification, sendWelcomeEmail } from '@/lib/email';

// Lazy getter — avoids top-level instantiation at build time
// when SUPABASE_SERVICE_ROLE_KEY is not present in the build environment.
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const body = await request.json();
    const {
      schoolName,
      city,
      country,
      adminName,
      email,
      password,
      phone,
    } = body;

    // ─── التحقق من البيانات المطلوبة ─────────────────────────
    if (!schoolName || !adminName || !email || !password) {
      return NextResponse.json(
        { error: 'جميع الحقول الأساسية مطلوبة' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // ─── إنشاء حساب Supabase Auth ─────────────────────────────
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // تأكيد تلقائي بدون الحاجة للضغط على رابط
    });

    if (authError) {
      console.error('[REGISTER] Auth error:', authError);
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        return NextResponse.json({ error: 'هذا الإيميل مسجّل مسبقاً' }, { status: 409 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user!.id;

    // ─── إنشاء سجل المدرسة ────────────────────────────────────
    const { data: schoolData, error: schoolError } = await supabaseAdmin
      .from('schools')
      .insert({
        name: schoolName,
        city: city ?? '',
        country: country ?? '',
        owner_id: userId,
        plan: 'free',
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (schoolError) {
      console.error('[REGISTER] School creation error:', schoolError);
      // حذف المستخدم لو فشل إنشاء المدرسة
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'فشل إنشاء المدرسة' }, { status: 500 });
    }

    // ─── إنشاء سجل المستخدم (مدير) ──────────────────────────
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email,
        display_name: adminName,
        role: 'principal',
        school_id: schoolData.id,
        phone: phone ?? '',
        created_at: new Date().toISOString(),
      });

    if (userError) {
      console.error('[REGISTER] User record error:', userError);
      // نكمل حتى لو فشل (سيُصلح لاحقاً)
    }

    // ─── إرسال الإيميلات (في الخلفية، لا نوقف التسجيل لو فشلت) ─
    Promise.all([
      sendNewSchoolNotification({
        name: schoolName,
        city: city ?? 'غير محدد',
        country: country ?? 'غير محدد',
        adminName,
        adminEmail: email,
        phone,
      }),
      sendWelcomeEmail(email, adminName, schoolName),
    ]).catch(err => console.error('[REGISTER] Email error (non-blocking):', err));

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل مدرستك بنجاح. يمكنك تسجيل الدخول الآن.',
      schoolId: schoolData.id,
    }, { status: 201 });

  } catch (err) {
    console.error('[REGISTER] Unexpected error:', err);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
