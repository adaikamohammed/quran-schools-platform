import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNewSchoolNotification, sendWelcomeEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    // ─── فحص متغيرات البيئة أولاً ──────────────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('[REGISTER] Missing env vars:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceKey,
      });
      return NextResponse.json(
        { error: 'خطأ في إعداد الخادم — متغيرات البيئة مفقودة' },
        { status: 500 }
      );
    }

    // ─── إنشاء Supabase client داخل try-catch ─────────────────
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await request.json();
    const { schoolName, city, country, adminName, email, password, phone } = body;

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
    console.log('[REGISTER] Creating auth user:', email);
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('[REGISTER] Auth error:', authError.message);
      if (
        authError.message.includes('already registered') ||
        authError.message.includes('already exists') ||
        authError.message.includes('User already registered')
      ) {
        return NextResponse.json({ error: 'هذا الإيميل مسجّل مسبقاً' }, { status: 409 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user!.id;
    console.log('[REGISTER] Auth user created:', userId);

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
      console.error('[REGISTER] School error:', schoolError.message, schoolError.code);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: `فشل إنشاء المدرسة: ${schoolError.message}` },
        { status: 500 }
      );
    }

    console.log('[REGISTER] School created:', schoolData.id);

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
      console.error('[REGISTER] User record error:', userError.message);
    }

    // ─── إرسال الإيميلات (غير ضروري، لا يوقف التسجيل) ────────
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

    console.log('[REGISTER] Success:', schoolData.id);
    return NextResponse.json({
      success: true,
      message: 'تم تسجيل مدرستك بنجاح. يمكنك تسجيل الدخول الآن.',
      schoolId: schoolData.id,
    }, { status: 201 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[REGISTER] Unexpected error:', msg);
    return NextResponse.json(
      { error: `خطأ غير متوقع: ${msg}` },
      { status: 500 }
    );
  }
}
