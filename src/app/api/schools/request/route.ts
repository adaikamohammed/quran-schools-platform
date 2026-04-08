import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ─── POST: أي شخص يقدم طلب تسجيل مدرسة ───────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { schoolName, city, country, directorName, email, phone, notes } = body;

    if (!schoolName || !directorName || !email) {
      return NextResponse.json({ error: 'اسم المدرسة، الإدارة، والبريد الإلكتروني مطلوبة' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('school_requests')
      .insert({
        school_name: schoolName,
        city,
        country: country || 'الجزائر',
        director_name: directorName,
        email,
        phone,
        notes,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error('School request error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// ─── GET: تحميل الطلبات للمدير العام فقط ──────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح - مخصص للمدير العام فقط' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('school_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ requests: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
