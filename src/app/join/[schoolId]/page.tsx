import { createClient } from '@supabase/supabase-js';
import JoinForm from './JoinForm';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 60; // Cache for 60 seconds

export default async function JoinSchoolPage({ params }: { params: { schoolId: string } }) {
  const { schoolId } = params;

  // Fetch school details
  const { data: school, error } = await supabase
    .from('schools')
    .select('name, city, country')
    .eq('id', schoolId)
    .single();

  if (error || !school) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dir-rtl font-[Cairo]">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black">
            !
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">تعذر العثور على المدرسة</h1>
          <p className="text-gray-500 font-medium pb-2 border-b border-gray-100 mb-2">
            تأكد من الرابط أو تواصل مع إدارة المدرسة للحصول على رابط التسجيل الصحيح.
          </p>
          <div className="text-xs text-gray-400 mt-2 text-left" dir="ltr">
            {error ? `DB Error: ${error.message}` : "Error: School data is null"}
            <br />
            ID: {schoolId}
          </div>
        </div>
      </div>
    );
  }

  return <JoinForm schoolId={schoolId} schoolName={school.name} location={`${school.city}، ${school.country}`} />;
}
