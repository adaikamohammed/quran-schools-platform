import Dexie, { type Table } from 'dexie';
import type {
  School,
  AppUser,
  Student,
  DailySession,
  SurahProgress,
  Payment,
  PreRegistration,
  DailyReport,
  Meeting,
  SyncQueueItem,
  ActivityLog,
  CampItem,
  IssuedDocument,
  TimetableEntry,
  SystemNotification,
} from '../types';

// ============================================================
// قاعدة بيانات IndexedDB المحلية باستخدام Dexie.js
// ============================================================

export class QuranSchoolsDB extends Dexie {
  // الجداول
  schools!: Table<School>;
  users!: Table<AppUser>;
  students!: Table<Student>;
  sessions!: Table<DailySession>;
  surahProgress!: Table<SurahProgress>;
  payments!: Table<Payment>;
  registrations!: Table<PreRegistration>;
  reports!: Table<DailyReport>;
  meetings!: Table<Meeting>;
  syncQueue!: Table<SyncQueueItem>;
  activityLogs!: Table<ActivityLog>;
  campItems!: Table<CampItem>;
  issuedDocuments!: Table<IssuedDocument>;
  timetables!: Table<TimetableEntry>;
  systemNotifications!: Table<SystemNotification>;

  constructor() {
    super('QuranSchoolsDB');

    this.version(1).stores({
      // المفتاح الأساسي + الحقول المفهرسة
      schools: 'id, name, country, createdAt',
      users: 'id, schoolId, email, role, groupName, isActive',
      students: 'id, schoolId, teacherId, groupName, fullName, status, gender, subscriptionTier, updatedAt',
      sessions: 'id, schoolId, teacherId, date, sessionNumber, [teacherId+date]',
      surahProgress: 'id, studentId, schoolId, surahId, status, updatedAt',
      payments: 'id, schoolId, studentId, date, status',
      registrations: 'id, schoolId, status, requestedAt, phone1',
      reports: 'id, schoolId, teacherId, date, status, isPinned',
      meetings: 'id, schoolId, status, timestamp',
      syncQueue: 'id, table, status, createdAt, retries',
    });

    // الإصدار 2: إضافة جداول السجلات، المخيم، والوثائق
    this.version(2).stores({
      schools: 'id, name, country, createdAt',
      users: 'id, schoolId, email, role, groupName, isActive',
      students: 'id, schoolId, teacherId, groupName, fullName, status, gender, subscriptionTier, updatedAt',
      sessions: 'id, schoolId, teacherId, date, sessionNumber, [teacherId+date]',
      surahProgress: 'id, studentId, schoolId, surahId, status, updatedAt',
      payments: 'id, schoolId, studentId, date, status',
      registrations: 'id, schoolId, status, requestedAt, phone1',
      reports: 'id, schoolId, teacherId, date, status, isPinned',
      meetings: 'id, schoolId, status, timestamp',
      syncQueue: 'id, table, status, createdAt, retries',
      // جداول جديدة:
      activityLogs: 'id, schoolId, userId, action, entityType, createdAt',
      campItems: 'id, schoolId, campYear, category, status, createdAt',
      issuedDocuments: 'id, schoolId, issuedBy, documentType, recipientId, issuedAt',
    });

    // الإصدار 3: إضافة جدول الحصص الأسبوعي
    this.version(3).stores({
      schools: 'id, name, country, createdAt',
      users: 'id, schoolId, email, role, groupName, isActive',
      students: 'id, schoolId, teacherId, groupName, fullName, status, gender, subscriptionTier, updatedAt',
      sessions: 'id, schoolId, teacherId, date, sessionNumber, [teacherId+date]',
      surahProgress: 'id, studentId, schoolId, surahId, status, updatedAt',
      payments: 'id, schoolId, studentId, date, status',
      registrations: 'id, schoolId, status, requestedAt, phone1',
      reports: 'id, schoolId, teacherId, date, status, isPinned',
      meetings: 'id, schoolId, status, timestamp',
      syncQueue: 'id, table, status, createdAt, retries',
      activityLogs: 'id, schoolId, userId, action, entityType, createdAt',
      campItems: 'id, schoolId, campYear, category, status, createdAt',
      issuedDocuments: 'id, schoolId, issuedBy, documentType, recipientId, issuedAt',
      // جديد:
      timetables: 'id, schoolId, teacherId, groupName, dayOfWeek, createdAt',
    });

    // الإصدار 4: إضافة جدول إشعارات النظام المخصصة
    this.version(4).stores({
      schools: 'id, name, country, createdAt',
      users: 'id, schoolId, email, role, groupName, isActive',
      students: 'id, schoolId, teacherId, groupName, fullName, status, gender, subscriptionTier, updatedAt',
      sessions: 'id, schoolId, teacherId, date, sessionNumber, [teacherId+date]',
      surahProgress: 'id, studentId, schoolId, surahId, status, updatedAt',
      payments: 'id, schoolId, studentId, date, status',
      registrations: 'id, schoolId, status, requestedAt, phone1',
      reports: 'id, schoolId, teacherId, date, status, isPinned',
      meetings: 'id, schoolId, status, timestamp',
      syncQueue: 'id, table, status, createdAt, retries',
      activityLogs: 'id, schoolId, userId, action, entityType, createdAt',
      campItems: 'id, schoolId, campYear, category, status, createdAt',
      issuedDocuments: 'id, schoolId, issuedBy, documentType, recipientId, issuedAt',
      timetables: 'id, schoolId, teacherId, groupName, dayOfWeek, createdAt',
      systemNotifications: 'id, schoolId, targetType, createdAt',
    });
  }
}

// singleton instance
let dbInstance: QuranSchoolsDB | null = null;

export function getDB(): QuranSchoolsDB {
  if (!dbInstance) {
    dbInstance = new QuranSchoolsDB();
  }
  return dbInstance;
}

// ─── دوال مساعدة للمدرسة ─────────────────────────────────

export async function getSchool(schoolId: string): Promise<School | undefined> {
  return getDB().schools.get(schoolId);
}

export async function saveSchool(school: School): Promise<void> {
  await getDB().schools.put(school);
}

// ─── دوال مساعدة للطلاب ──────────────────────────────────

export async function getStudentsBySchool(schoolId: string): Promise<Student[]> {
  return getDB().students
    .where('schoolId')
    .equals(schoolId)
    .toArray();
}

export async function getStudentsByTeacher(teacherId: string): Promise<Student[]> {
  return getDB().students
    .where('teacherId')
    .equals(teacherId)
    .toArray();
}

export async function getStudent(id: string): Promise<Student | undefined> {
  return getDB().students.get(id);
}

export async function saveStudent(student: Student): Promise<void> {
  await getDB().students.put(student);
}

export async function deleteStudent(id: string): Promise<void> {
  await getDB().students.delete(id);
}

// ─── دوال مساعدة للحصص ───────────────────────────────────

export async function getSessionsByDate(
  teacherId: string,
  date: string
): Promise<DailySession[]> {
  return getDB().sessions
    .where('[teacherId+date]')
    .equals([teacherId, date])
    .toArray();
}

export async function getSessionsByDateRange(
  teacherId: string,
  startDate: string,
  endDate: string
): Promise<DailySession[]> {
  return getDB().sessions
    .where('teacherId')
    .equals(teacherId)
    .and((s) => s.date >= startDate && s.date <= endDate)
    .toArray();
}

export async function saveSession(session: DailySession): Promise<void> {
  await getDB().sessions.put(session);
}

// ─── دوال مساعدة لمتابعة الحفظ ───────────────────────────

export async function getSurahProgress(studentId: string): Promise<SurahProgress[]> {
  return getDB().surahProgress
    .where('studentId')
    .equals(studentId)
    .toArray();
}

export async function saveSurahProgress(progress: SurahProgress): Promise<void> {
  await getDB().surahProgress.put(progress);
}

// ─── دوال مساعدة للاشتراكات ──────────────────────────────

export async function getPaymentsByStudent(studentId: string): Promise<Payment[]> {
  return getDB().payments
    .where('studentId')
    .equals(studentId)
    .toArray();
}

export async function savePayment(payment: Payment): Promise<void> {
  await getDB().payments.put(payment);
}

// ─── دوال مساعدة للتسجيلات ───────────────────────────────

export async function getRegistrations(schoolId: string): Promise<PreRegistration[]> {
  return getDB().registrations
    .where('schoolId')
    .equals(schoolId)
    .toArray();
}

export async function saveRegistration(reg: PreRegistration): Promise<void> {
  await getDB().registrations.put(reg);
}

// ─── دوال مساعدة للتقارير ────────────────────────────────

export async function getReportsByDate(
  schoolId: string,
  date: string
): Promise<DailyReport[]> {
  return getDB().reports
    .where('schoolId')
    .equals(schoolId)
    .and((r) => r.date === date)
    .toArray();
}

export async function saveReport(report: DailyReport): Promise<void> {
  await getDB().reports.put(report);
}

// ─── دوال طابور المزامنة ─────────────────────────────────

export async function queueForSync(
  table: SyncQueueItem['table'],
  action: SyncQueueItem['action'],
  recordId: string,
  data: any
): Promise<void> {
  const item: SyncQueueItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    table,
    action,
    recordId,
    data,
    status: 'pending',
    retries: 0,
    createdAt: new Date().toISOString(),
  };
  await getDB().syncQueue.add(item);
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  return getDB().syncQueue
    .where('status')
    .anyOf(['pending', 'failed'])
    .and((item) => item.retries < 5)
    .toArray();
}

export async function updateSyncStatus(
  id: string,
  status: SyncQueueItem['status'],
  error?: string
): Promise<void> {
  await getDB().syncQueue.update(id, {
    status,
    error,
    syncedAt: status === 'synced' ? new Date().toISOString() : undefined,
  });
}
