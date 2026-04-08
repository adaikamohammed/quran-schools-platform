import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, display_name, role, school_id, group_name')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'الحساب التسجيلي غير متوفر' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        displayName: userData.display_name,
        role: userData.role,
        schoolId: userData.school_id,
        groupName: userData.group_name,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'خطأ فني في الإتصال' }, { status: 500 });
  }
}
