import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Next.js 15: params is a Promise
export async function POST(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;
    const body = await request.json();

    if (!body.fullName || !body.phone1) {
      return NextResponse.json(
        { error: 'الاسم الكامل ورقم الهاتف على الأقل مطلوبان' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // 💡 دمج البيانات الإضافية التي لا تحتوي على أعمدة في قاعدة البيانات داخل الـ Notes
    const extraDetails = [];
    if (body.address) extraDetails.push(`العنوان: ${body.address}`);
    if (body.memorizationLevel) extraDetails.push(`الحفظ الحالي: ${body.memorizationLevel}`);
    if (body.subscriptionTier) extraDetails.push(`فئة الاشتراك: ${body.subscriptionTier}`);

    let finalNotes = body.notes || '';
    if (extraDetails.length > 0) {
      finalNotes = finalNotes 
        ? `${finalNotes}\n---\n${extraDetails.join('\n')}` 
        : extraDetails.join('\n');
    }

    const { data, error } = await supabaseAdmin
      .from('pre_registrations')
      .insert({
        school_id: schoolId,
        full_name: body.fullName,
        gender: body.gender || 'ذكر',
        birth_date: body.birthDate || null,
        educational_level: body.educationalLevel || null,
        guardian_name: body.guardianName || null,
        phone1: body.phone1,
        phone2: body.phone2 || null,
        status: 'مرشح',
        notes: finalNotes || null,
        requested_at: now,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Join API error:', error);
    return NextResponse.json({ error: 'حدث خطأ داخلي' }, { status: 500 });
  }
}
