// ============================================================
// أنواع البيانات الكاملة للمنصة العامة
// ============================================================

// ─── المستخدمون والأدوار ────────────────────────────────────

export type UserRole = 'super_admin' | 'principal' | 'teacher' | 'parent';

export interface AppUser {
  id: string;
  schoolId: string;
  email: string;
  passwordHash?: string; // محلياً فقط، لن يُرفع للسحابة
  displayName: string;
  role: UserRole;
  photoURL?: string;
  phone?: string;
  gender?: 'ذكر' | 'أنثى';
  joinDate: string; // YYYY-MM-DD
  isActive: boolean;
  // للمعلمين:
  groupName?: string; // اسم الفوج/المجموعة
  bio?: string;
  certifications?: string;
  // للآباء:
  studentIds?: string[]; // أبنائهم المرتبطون
  createdAt: string;
  updatedAt: string;
}

// ─── المدرسة ────────────────────────────────────────────────

export interface School {
  id: string;
  name: string;
  city: string;
  country: string;
  directorName: string;
  email: string;
  phone?: string;
  logoURL?: string;
  seasonStartDate?: string; // تاريخ بداية الموسم
  createdAt: string;
  updatedAt: string;
  // إعدادات
  settings: SchoolSettings;
}

export interface SchoolSettings {
  prices: {
    renewal: { 'فئة الأكابر': number; 'فئة الأصاغر': number };
  };
  points: PointsConfig;
  rewards: Reward[];
  badges: BadgeConfig[];
  // نظام الواجهة
  platformMode?: 'simple' | 'full'; // بسيط أو كامل (افتراضي: full)
  hiddenFeatures?: string[];         // قائمة featureKeys المخفية
  enableTajweedTracking?: boolean;   // تتبع التجويد
}

export type TajweedRule = 
  | 'أحكام النون الساكنة والتنوين'
  | 'أحكام الميم الساكنة'
  | 'المدود'
  | 'مخارج الحروف'
  | 'القلقلة'
  | 'التفخيم والترقيق';

export interface TajweedMastery {
  overallLevel?: PerformanceLevel | null;
  rules: Partial<Record<TajweedRule, 'متقن' | 'قيد التعلم' | 'غير مبدوء' | ''>>;
}

// ─── الطلاب ─────────────────────────────────────────────────

export type StudentStatus = 'نشط' | 'مطرود' | 'محذوف' | 'موقوف';
export type SubscriptionTier = 'فئة الأكابر' | 'فئة الأصاغر';
export type MemorizationAmount = 'ثمن' | 'ربع' | 'نصف' | 'صفحة' | 'أكثر';

export interface Student {
  id: string;
  schoolId: string;
  teacherId: string;    // المعلم المسؤول
  groupName: string;    // اسم الفوج
  fullName: string;
  gender: 'ذكر' | 'أنثى';
  birthDate: string;    // YYYY-MM-DD
  educationalLevel?: string;
  guardianName: string;
  phone1: string;
  phone2?: string;
  photoURL?: string;
  registrationDate: string; // YYYY-MM-DD
  status: StudentStatus;
  subscriptionTier: SubscriptionTier;
  memorizedSurahsCount: number;
  dailyMemorizationAmount: MemorizationAmount;
  pageNumber?: string;
  notes?: string;
  actionReason?: string;
  covenants?: Covenant[];
  expulsionHistory?: ExpulsionRecord[];
  transferHistory?: TransferRecord[];
  createdAt: string;
  updatedAt: string;
  tajweed?: TajweedMastery;
}

// ─── العهود والعقوبات ────────────────────────────────────────

export type CovenantType = 'تعهد غياب' | 'ميثاق حفظ' | 'التزام سلوكي' | 'إجراء تأديبي';
export type CovenantStatus = 'نشط' | 'تم الوفاء بها' | 'نُقِض';
export type CovenantCard = 'بدون' | 'بطاقة صفراء' | 'بطاقة حمراء';

export interface Covenant {
  id: string;
  type: CovenantType;
  text: string;
  status: CovenantStatus;
  card: CovenantCard;
  date: string;
  absenceDays?: number;
  writtenPenalty?: string;
  dueDate?: string;
  compensationSessions?: number;
  compensationDate?: string;
  isCompensated?: boolean;
}

export interface ExpulsionRecord {
  date: string;
  reason: string;
}

export interface TransferRecord {
  date: string;
  fromTeacherId: string;
  fromTeacherName?: string;
  fromGroupName: string;
  toTeacherId: string;
  toTeacherName?: string;
  toGroupName: string;
  reason: string;
}

// ─── الحصص اليومية ──────────────────────────────────────────

export type AttendanceStatus = 'حاضر' | 'غائب' | 'متأخر' | 'تعويض' | '';
export type PerformanceLevel = 'ممتاز' | 'جيد جداً' | 'جيد' | 'حسن' | 'متوسط' | 'لم يحفظ' | '';
export type BehaviorLevel = 'هادئ' | 'متوسط' | 'غير منضبط' | '';
export type SessionType =
  | 'حصة أساسية'
  | 'حصة أنشطة'
  | 'يوم عطلة'
  | 'حصة تعويضية'
  | 'غياب المعلم'
  | 'حصة إضافية';

export interface DailyRecord {
  studentId: string;
  attendance: AttendanceStatus;
  memorization: PerformanceLevel | null;
  surahId?: number;
  fromVerse?: number;
  toVerse?: number;
  review: boolean | null;
  behavior: BehaviorLevel | null;
  notes?: string;
  // تلقين
  talqinSurahId?: number;
  talqinFromVerse?: number;
  talqinToVerse?: number;
  // تسميع
  tasmieSurahId?: number;
  tasmieFromVerse?: number;
  tasmieToVerse?: number;
  tajweedEvaluation?: PerformanceLevel | null;
}

export interface DailySession {
  id: string;          // YYYY-MM-DD-1 أو YYYY-MM-DD-2
  schoolId: string;
  teacherId: string;
  date: string;        // YYYY-MM-DD
  sessionNumber: 1 | 2;
  sessionType: SessionType;
  records: DailyRecord[];
  teacherAbsenceReason?: string;
  substituteTeacher?: string;
  activityType?: string;
  activityDescription?: string;
  surahId?: number;
  fromVerse?: number;
  toVerse?: number;
  isReview?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── متابعة الحفظ ────────────────────────────────────────────

export type SurahStatus =
  | 'قيد الحفظ'
  | 'تم الحفظ'
  | 'تمت المراجعة'
  | 'تمت التلقين'
  | 'إعادة حفظ'
  | 'مراجعة جماعية'
  | 'مؤجلة مؤقتًا'
  // حالات خريطة الحفظ
  | 'محفوظة'
  | 'مُتقنة'
  | 'غير محفوظة';

export type SurahEvaluation = 'ممتاز' | 'جيد جداً' | 'جيد' | 'حسن' | 'متوسط' | 'لم يحفظ';

export interface SurahMasteryEntry {
  status: 0 | 1 | 2; // 0: لم يحفظ، 1: تم الحفظ، 2: إتقان تام
  completedAt?: string;
  evaluation?: SurahEvaluation;
}

export type SurahMastery = Record<number, SurahMasteryEntry>;

export interface SurahProgress {
  id: string;
  studentId: string;
  schoolId: string;
  surahId: number;
  surahName: string;
  status: SurahStatus;
  fromVerse?: number;
  toVerse?: number;
  totalVerses?: number;
  startDate?: string;
  completionDate?: string;
  retakeCount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── نظام النقاط ──────────────────────────────────────────

export interface PointsConfig {
  attendance: { 'حاضر': number; 'متأخر': number; 'تعويض': number; 'غائب': number };
  evaluation: { 'ممتاز': number; 'جيد جداً': number; 'جيد': number; 'متوسط': number; 'لم يحفظ': number };
  behavior: { 'هادئ': number; 'متوسط': number; 'غير منضبط': number };
  review: { completed: number };
  surah: { memorized: number; mastered: number };
  covenantCompleted: number;
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  icon: string;
  description: string;
  requiredRank?: number;
}

export interface BadgeConfig {
  id: string;
  name: string;
  icon: string;
  threshold: number;
  metric: 'totalPoints' | 'masteryScore';
}

// ─── الاشتراكات ───────────────────────────────────────────

export type PaymentStatus = 'paid' | 'unpaid' | 'exempted';

export interface Payment {
  id: string;
  schoolId: string;
  studentId: string;
  amount: number;
  date: string;        // تاريخ الفصل الدراسي
  status: PaymentStatus;
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

// ─── التسجيلات المسبقة ──────────────────────────────────────

export type PreRegistrationStatus =
  | 'مؤجل'
  | 'تم الإنضمام'
  | 'مرفوض'
  | 'إنضم لمدرسة أخرى'
  | 'مرشح'
  | 'تم الإتصال'
  | 'مكرر'
  | 'لم يرد';

export interface PreRegistration {
  id: string;
  schoolId: string;
  requestedAt: string;
  fullName: string;
  gender: 'ذكر' | 'أنثى';
  birthDate: string;
  educationalLevel?: string;
  guardianName?: string;
  phone1: string;
  phone2?: string;
  address?: string;
  status: PreRegistrationStatus;
  notes?: string;
  photoURL?: string;
  approvedById?: string; // المعلم الذي وافق
  createdAt: string;
  updatedAt: string;
}

// ─── التقارير اليومية ────────────────────────────────────────

export interface DailyReport {
  id: string;
  schoolId: string;
  teacherId: string;
  date: string;
  note: string;
  timestamp: string;
  authorName: string;
  category: string;
  status: 'pending' | 'reviewed' | 'in_progress';
  adminNotes: string | null;
  isPinned: boolean;
  priority?: 'normal' | 'urgent' | 'important';
  hasNewReply?: boolean;
  isManagementMessage?: boolean;
  recipientId?: string;
  isReadByRecipient?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── الاجتماعات ───────────────────────────────────────────

export interface MeetingTopic {
  topic: string;
  speaker: string;
  solutions: string;
  isFeatured?: boolean;
}

export interface Meeting {
  id: string;
  schoolId: string;
  type?: 'meeting' | 'event'; // اجتماع (افتراضي) أم مناسبة
  title: string;
  date: string;
  timestamp: string;
  
  // خصائص مشتركة
  status: 'upcoming' | 'completed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // خصائص الاجتماعات
  attendance?: Record<string, { name: string; status: 'present' | 'absent' | 'excused' }>;
  foodProvided?: boolean;
  foodDetails?: string;
  topics?: MeetingTopic[];

  // خصائص المناسبات
  eventType?: 'دينية' | 'اجتماعية' | 'مسابقة' | 'أخرى';
  location?: string;
  targetAudience?: string; // الفئة المستهدفة
  budget?: number; // الميزانية
}

// ─── طابور المزامنة ──────────────────────────────────────────

export type SyncAction = 'create' | 'update' | 'delete';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';
export type SyncTable =
  | 'students'
  | 'sessions'
  | 'daily_records'
  | 'surah_progress'
  | 'payments'
  | 'registrations'
  | 'reports'
  | 'meetings'
  | 'users';

export interface SyncQueueItem {
  id: string;
  table: SyncTable;
  action: SyncAction;
  recordId: string;
  data: any;
  status: SyncStatus;
  retries: number;
  createdAt: string;
  syncedAt?: string;
  error?: string;
}

// ─── بيانات السور ─────────────────────────────────────────

export interface Surah {
  id: number;
  name: string;
  verses: number;
}

// ─── سجل النشاطات (Audit Log) ───────────────────────────

export type LogAction =
  | 'login'
  | 'logout'
  | 'create_student'
  | 'update_student'
  | 'delete_student'
  | 'create_session'
  | 'update_session'
  | 'create_payment'
  | 'update_payment'
  | 'create_covenant'
  | 'create_meeting'
  | 'create_registration'
  | 'update_registration'
  | 'create_report'
  | 'update_school_settings'
  | 'export_document'
  | 'other';

export type LogEntityType =
  | 'student'
  | 'session'
  | 'payment'
  | 'covenant'
  | 'meeting'
  | 'registration'
  | 'report'
  | 'school'
  | 'system';

export interface ActivityLog {
  id: string;
  schoolId: string;
  userId: string;      // من قام بالفعل
  userName: string;    // اسمه للعرض
  userRole: UserRole;
  action: LogAction;
  entityType: LogEntityType;
  entityId?: string;   // معرف العنصر المتأثر
  entityName?: string; // اسمه للعرض
  description: string; // نص الوصف بالعربية
  metadata?: Record<string, any>; // بيانات إضافية
  createdAt: string;
}

// ─── مستلزمات المخيم الصيفي ─────────────────────────────

export type CampItemCategory =
  | 'مواد_غذائية'
  | 'معدات_رياضية'
  | 'أدوات_تعليمية'
  | 'مستلزمات_صحية'
  | 'مستلزمات_سكن'
  | 'طباعة_ووثائق'
  | 'أخرى';

export type CampItemStatus = 'pending' | 'partial' | 'complete' | 'returned';

export interface CampItem {
  id: string;
  schoolId: string;
  campYear: string;       // مثال: "2025"
  name: string;
  category: CampItemCategory;
  quantity: number;       // الكمية المطلوبة
  quantityBrought: number; // الكمية التي أُحضرت
  quantityReturned: number; // الكمية التي رُدّت
  isConsumable: boolean;  // قابل للاستهلاك (لا يُرجع)
  provider?: string;      // من يتولى التوفير
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  status: CampItemStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── الوثائق والشهادات ───────────────────────────────────

export type DocumentType =
  | 'شهادة_تقدير'
  | 'شهادة_حضور'
  | 'شهادة_إتمام_سورة'
  | 'شهادة_تميز_شهري'
  | 'وصل_دفع'
  | 'كشف_حضور'
  | 'تقرير_طالب'
  | 'قائمة_طلاب'
  | 'نموذج_تسجيل';

export interface IssuedDocument {
  id: string;
  schoolId: string;
  issuedBy: string;     // userId
  issuedByName: string;
  documentType: DocumentType;
  recipientId?: string; // studentId أو teacherId
  recipientName?: string;
  title: string;
  notes?: string;
  issuedAt: string;
}

// ─── جدول الحصص الأسبوعي ────────────────────────────────

export type DayOfWeek =
  | 'الأحد'
  | 'الإثنين'
  | 'الثلاثاء'
  | 'الأربعاء'
  | 'الخميس'
  | 'الجمعة'
  | 'السبت';

export interface TimetableEntry {
  id: string;
  schoolId: string;
  teacherId: string;
  teacherName?: string;
  groupName: string;   // الفوج المستهدف
  dayOfWeek: DayOfWeek;
  startTime: string;   // مثال "14:00"
  endTime: string;     // مثال "16:30"
  subject?: string;    // اختياري: تلقين / مراجعة / إتقان
  color?: string;      // للتمييز البصري (hex أو tailwind name)
  createdAt: string;
  updatedAt: string;
}
