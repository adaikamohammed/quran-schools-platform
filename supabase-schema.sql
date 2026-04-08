-- تفعيل دالة إنشاء UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. المدارس (Schools) ─────────────────────────────────
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  director_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  logo_url TEXT,
  season_start_date TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ─── 2. المستخدمون والأدوار (Users) ──────────────────────
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'principal', 'teacher', 'parent')),
  photo_url TEXT,
  phone TEXT,
  gender TEXT,
  join_date TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  group_name TEXT,
  bio TEXT,
  certifications TEXT,
  student_ids TEXT[], 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ─── 3. الطلاب (Students) ─────────────────────────────────
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  group_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  educational_level TEXT,
  guardian_name TEXT NOT NULL,
  phone1 TEXT NOT NULL,
  phone2 TEXT,
  photo_url TEXT,
  registration_date TEXT NOT NULL,
  status TEXT NOT NULL,
  subscription_tier TEXT NOT NULL,
  memorized_surahs_count INTEGER DEFAULT 0,
  daily_memorization_amount TEXT NOT NULL,
  page_number TEXT,
  notes TEXT,
  action_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ─── 4. العهود والعقوبات (Covenants) ──────────────────────
CREATE TABLE public.covenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  status TEXT NOT NULL,
  card TEXT NOT NULL,
  date TEXT NOT NULL,
  absence_days INTEGER,
  written_penalty TEXT,
  due_date TEXT,
  compensation_sessions INTEGER,
  compensation_date TEXT,
  is_compensated BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ─── 5. سجل الفصل (ExpulsionRecords) ──────────────────────
CREATE TABLE public.expulsion_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ─── 6. سجل النقل (TransferRecords) ───────────────────────
CREATE TABLE public.transfer_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  from_teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  from_teacher_name TEXT,
  from_group_name TEXT NOT NULL,
  to_teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  to_teacher_name TEXT,
  to_group_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ─── 7. الحصص اليومية (DailySessions) ────────────────────
CREATE TABLE public.daily_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  session_number INTEGER NOT NULL,
  session_type TEXT NOT NULL,
  teacher_absence_reason TEXT,
  substitute_teacher TEXT,
  activity_type TEXT,
  activity_description TEXT,
  surah_id INTEGER,
  from_verse INTEGER,
  to_verse INTEGER,
  is_review BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(date, session_number, teacher_id, school_id)
);

-- ─── 8. السجلات اليومية (DailyRecords) ───────────────────
CREATE TABLE public.daily_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.daily_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  attendance TEXT NOT NULL,
  memorization TEXT,
  surah_id INTEGER,
  from_verse INTEGER,
  to_verse INTEGER,
  review BOOLEAN,
  behavior TEXT,
  notes TEXT,
  talqin_surah_id INTEGER,
  talqin_from_verse INTEGER,
  talqin_to_verse INTEGER,
  tasmie_surah_id INTEGER,
  tasmie_from_verse INTEGER,
  tasmie_to_verse INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(session_id, student_id)
);

-- ─── 9. تقدم السور (SurahProgresses) ─────────────────────
CREATE TABLE public.surah_progresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  surah_id INTEGER NOT NULL,
  surah_name TEXT NOT NULL,
  status TEXT NOT NULL,
  from_verse INTEGER,
  to_verse INTEGER,
  total_verses INTEGER,
  start_date TEXT,
  completion_date TEXT,
  retake_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ─── 10. المدفوعات (Payments) ─────────────────────────────
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  paid_at TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ─── 11. التسجيلات المسبقة (PreRegistrations) ─────────────
CREATE TABLE public.pre_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  requested_at TEXT NOT NULL,
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  educational_level TEXT,
  guardian_name TEXT,
  phone1 TEXT NOT NULL,
  phone2 TEXT,
  address TEXT,
  status TEXT NOT NULL,
  notes TEXT,
  photo_url TEXT,
  approved_by_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ─── 12. التقارير اليومية للإدارة (DailyReports) ────────
CREATE TABLE public.daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  note TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  author_name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  admin_notes TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  priority TEXT,
  has_new_reply BOOLEAN DEFAULT FALSE,
  is_management_message BOOLEAN DEFAULT FALSE,
  recipient_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_read_by_recipient BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ─── 13. الاجتماعات (Meetings) ────────────────────────────
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  attendance JSONB NOT NULL,
  food_provided BOOLEAN DEFAULT FALSE,
  food_details TEXT,
  topics JSONB NOT NULL,
  status TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ─── 14. Row Level Security Policies (أمان العزل) ─────────
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.covenants ENABLE ROW LEVEL SECURITY;

-- العزل الكامل باستخدام JWT لمنع Infinite Recursion
CREATE POLICY "Users access" ON public.users FOR ALL USING (
  auth.uid() = id
  OR (auth.jwt() ->> 'role') = 'super_admin'
  OR school_id::text = (auth.jwt() ->> 'schoolId')
);

CREATE POLICY "Schools access" ON public.schools FOR ALL USING (
  (auth.jwt() ->> 'role') = 'super_admin'
  OR id::text = (auth.jwt() ->> 'schoolId')
);

CREATE POLICY "Students isolation" ON public.students FOR ALL USING (
  (auth.jwt() ->> 'role') = 'super_admin'
  OR school_id::text = (auth.jwt() ->> 'schoolId')
);
