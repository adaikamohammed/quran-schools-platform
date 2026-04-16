-- ══════════════════════════════════════════════════════════
--  منصة المدارس القرآنية — SQL Schema الكامل
--  شغّله في: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. المدارس ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.schools (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  city        TEXT NOT NULL DEFAULT '',
  country     TEXT NOT NULL DEFAULT '',
  owner_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan        TEXT NOT NULL DEFAULT 'free',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  director_name TEXT,
  email       TEXT,
  phone       TEXT,
  logo_url    TEXT,
  season_start_date TEXT,
  settings    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at  TIMESTAMP WITH TIME ZONE
);

-- ─── 2. المستخدمون ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id    UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  email        TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('super_admin','principal','teacher','parent')),
  photo_url    TEXT,
  phone        TEXT,
  gender       TEXT,
  join_date    TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  group_name   TEXT,
  bio          TEXT,
  certifications TEXT,
  student_ids  TEXT[],
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at   TIMESTAMP WITH TIME ZONE
);

-- ─── 3. الطلاب ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.students (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id                 UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id                UUID REFERENCES public.users(id) ON DELETE SET NULL,
  group_name                TEXT NOT NULL DEFAULT '',
  full_name                 TEXT NOT NULL,
  gender                    TEXT NOT NULL DEFAULT '',
  birth_date                TEXT NOT NULL DEFAULT '',
  educational_level         TEXT,
  guardian_name             TEXT NOT NULL DEFAULT '',
  phone1                    TEXT NOT NULL DEFAULT '',
  phone2                    TEXT,
  photo_url                 TEXT,
  registration_date         TEXT NOT NULL DEFAULT '',
  status                    TEXT NOT NULL DEFAULT 'active',
  subscription_tier         TEXT NOT NULL DEFAULT 'basic',
  memorized_surahs_count    INTEGER DEFAULT 0,
  daily_memorization_amount TEXT NOT NULL DEFAULT '',
  page_number               TEXT,
  notes                     TEXT,
  action_reason             TEXT,
  created_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at                TIMESTAMP WITH TIME ZONE
);

-- ─── 4. العهود والعقوبات ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.covenants (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id            UUID REFERENCES public.students(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL,
  text                  TEXT NOT NULL,
  status                TEXT NOT NULL,
  card                  TEXT NOT NULL,
  date                  TEXT NOT NULL,
  absence_days          INTEGER,
  written_penalty       TEXT,
  due_date              TEXT,
  compensation_sessions INTEGER,
  compensation_date     TEXT,
  is_compensated        BOOLEAN,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at            TIMESTAMP WITH TIME ZONE
);

-- ─── 5. سجل الفصل ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expulsion_records (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,
  reason     TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ─── 6. سجل النقل ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transfer_records (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID REFERENCES public.students(id) ON DELETE CASCADE,
  date              TEXT NOT NULL,
  from_teacher_id   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  from_teacher_name TEXT,
  from_group_name   TEXT NOT NULL,
  to_teacher_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  to_teacher_name   TEXT,
  to_group_name     TEXT NOT NULL,
  reason            TEXT NOT NULL,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at        TIMESTAMP WITH TIME ZONE
);

-- ─── 7. الحصص اليومية ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_sessions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id               UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id              UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date                    TEXT NOT NULL,
  session_number          INTEGER NOT NULL,
  session_type            TEXT NOT NULL,
  teacher_absence_reason  TEXT,
  substitute_teacher      TEXT,
  activity_type           TEXT,
  activity_description    TEXT,
  surah_id                INTEGER,
  from_verse              INTEGER,
  to_verse                INTEGER,
  is_review               BOOLEAN,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at              TIMESTAMP WITH TIME ZONE,
  UNIQUE(date, session_number, teacher_id, school_id)
);

-- ─── 8. السجلات اليومية ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_records (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id        UUID REFERENCES public.daily_sessions(id) ON DELETE CASCADE,
  student_id        UUID REFERENCES public.students(id) ON DELETE CASCADE,
  attendance        TEXT NOT NULL,
  memorization      TEXT,
  surah_id          INTEGER,
  from_verse        INTEGER,
  to_verse          INTEGER,
  review            BOOLEAN,
  behavior          TEXT,
  notes             TEXT,
  talqin_surah_id   INTEGER,
  talqin_from_verse INTEGER,
  talqin_to_verse   INTEGER,
  tasmie_surah_id   INTEGER,
  tasmie_from_verse INTEGER,
  tasmie_to_verse   INTEGER,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at        TIMESTAMP WITH TIME ZONE,
  UNIQUE(session_id, student_id)
);

-- ─── 9. تقدم السور ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.surah_progresses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID REFERENCES public.students(id) ON DELETE CASCADE,
  school_id       UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  surah_id        INTEGER NOT NULL,
  surah_name      TEXT NOT NULL,
  status          TEXT NOT NULL,
  from_verse      INTEGER,
  to_verse        INTEGER,
  total_verses    INTEGER,
  start_date      TEXT,
  completion_date TEXT,
  retake_count    INTEGER DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at      TIMESTAMP WITH TIME ZONE
);

-- ─── 10. المدفوعات ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id  UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  amount     NUMERIC NOT NULL,
  date       TEXT NOT NULL,
  status     TEXT NOT NULL,
  paid_at    TEXT,
  notes      TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ─── 11. التسجيلات المسبقة ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pre_registrations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id         UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  requested_at      TEXT NOT NULL,
  full_name         TEXT NOT NULL,
  gender            TEXT NOT NULL,
  birth_date        TEXT NOT NULL DEFAULT '',
  educational_level TEXT,
  guardian_name     TEXT,
  phone1            TEXT NOT NULL,
  phone2            TEXT,
  address           TEXT,
  status            TEXT NOT NULL,
  notes             TEXT,
  photo_url         TEXT,
  approved_by_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at        TIMESTAMP WITH TIME ZONE
);

-- ─── 12. التقارير اليومية ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id               UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id              UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date                    TEXT NOT NULL,
  note                    TEXT NOT NULL,
  timestamp               TEXT NOT NULL,
  author_name             TEXT NOT NULL,
  category                TEXT NOT NULL,
  status                  TEXT NOT NULL,
  admin_notes             TEXT,
  is_pinned               BOOLEAN DEFAULT FALSE,
  priority                TEXT,
  has_new_reply           BOOLEAN DEFAULT FALSE,
  is_management_message   BOOLEAN DEFAULT FALSE,
  recipient_id            UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_read_by_recipient    BOOLEAN,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at              TIMESTAMP WITH TIME ZONE
);

-- ─── 13. الاجتماعات ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meetings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id     UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  date          TEXT NOT NULL,
  timestamp     TEXT NOT NULL,
  attendance    JSONB NOT NULL DEFAULT '[]'::jsonb,
  food_provided BOOLEAN DEFAULT FALSE,
  food_details  TEXT,
  topics        JSONB NOT NULL DEFAULT '[]'::jsonb,
  status        TEXT NOT NULL,
  created_by    TEXT NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at    TIMESTAMP WITH TIME ZONE
);

-- ─── 14. إشعارات النظام ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id     UUID REFERENCES public.schools(id) ON DELETE CASCADE, -- null if sent by super_admin
  sender_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  sender_name   TEXT NOT NULL,
  type          TEXT NOT NULL, -- 'default' | 'info' | 'warning' | 'critical'
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  image_url     TEXT,
  target_type   TEXT NOT NULL, -- 'all' | 'specific'
  target_ids    JSONB DEFAULT '[]'::jsonb, -- Array of specific user/school IDs
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════
--  Row Level Security
-- ══════════════════════════════════════════════════════════

ALTER TABLE public.schools          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.covenants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surah_progresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- السياسات — يسمح للـ service_role بكل شيء (للـ API Routes)
CREATE POLICY "Service role bypass" ON public.schools
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass" ON public.students
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass" ON public.covenants
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass" ON public.daily_sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass" ON public.daily_records
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass" ON public.surah_progresses
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass" ON public.payments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass" ON public.pre_registrations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass" ON public.daily_reports
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass" ON public.meetings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass" ON public.system_notifications
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow Insert for Authenticated" ON public.system_notifications
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow Select for Authenticated" ON public.system_notifications
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow Delete for Sender" ON public.system_notifications
  FOR DELETE TO authenticated USING (sender_id = auth.uid());
