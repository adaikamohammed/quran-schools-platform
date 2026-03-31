// ============================================================
// دوال الكتابة — تحفظ محلياً وتضيف للمزامنة
// ============================================================

import { v4 as uuid } from 'uuid';
import {
  saveStudent,
  saveSession,
  saveSurahProgress,
  savePayment,
  saveRegistration,
  saveReport,
  getDB,
  queueForSync,
} from './db';
import type {
  Student,
  DailySession,
  SurahProgress,
  Payment,
  PreRegistration,
  DailyReport,
} from '../types';

// ─── مساعد: حفظ + إضافة للمزامنة ────────────────────────

async function saveAndQueue<T extends { id: string }>(
  table: Parameters<typeof queueForSync>[0],
  action: 'create' | 'update',
  data: T,
  saveFn: (item: T) => Promise<void>
): Promise<T> {
  const now = new Date().toISOString();
  const record = {
    ...data,
    updatedAt: now,
    ...(action === 'create' ? { createdAt: now } : {}),
  } as T;

  await saveFn(record);
  await queueForSync(table, action, record.id, record);
  return record;
}

// ─── الطلاب ──────────────────────────────────────────────

export async function createStudent(
  data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Student> {
  const student: Student = {
    ...data,
    id: uuid(),
    memorizedSurahsCount: data.memorizedSurahsCount ?? 0,
    createdAt: '',
    updatedAt: '',
  };
  return saveAndQueue('students', 'create', student, saveStudent);
}

export async function updateStudent(
  id: string,
  patches: Partial<Student>
): Promise<void> {
  const existing = await getDB().students.get(id);
  if (!existing) throw new Error(`الطالب ${id} غير موجود`);
  const updated = { ...existing, ...patches };
  await saveAndQueue('students', 'update', updated, saveStudent);
}

export async function softDeleteStudent(id: string, reason: string): Promise<void> {
  await updateStudent(id, { status: 'محذوف', actionReason: reason });
}

// ─── الحصص ───────────────────────────────────────────────

export async function createOrUpdateSession(
  data: Omit<DailySession, 'createdAt' | 'updatedAt'>
): Promise<DailySession> {
  const existing = await getDB().sessions.get(data.id);
  const action = existing ? 'update' : 'create';
  const session: DailySession = {
    ...data,
    createdAt: existing?.createdAt ?? '',
    updatedAt: '',
  };
  return saveAndQueue('sessions', action, session, saveSession);
}

// ─── متابعة الحفظ ──────────────────────────────────────

export async function createOrUpdateSurahProgress(
  data: Omit<SurahProgress, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SurahProgress> {
  // المفتاح المركّب: studentId + surahId
  const existingId = `${data.studentId}_${data.surahId}`;
  const existing = await getDB().surahProgress.get(existingId);
  const action = existing ? 'update' : 'create';
  const progress: SurahProgress = {
    ...data,
    id: existingId,
    createdAt: existing?.createdAt ?? '',
    updatedAt: '',
  };
  return saveAndQueue('surahProgress', action, progress, saveSurahProgress);
}

// ─── الاشتراكات ───────────────────────────────────────

export async function createPayment(
  data: Omit<Payment, 'id' | 'createdAt'>
): Promise<Payment> {
  const payment: Payment = {
    ...data,
    id: uuid(),
    createdAt: '',
  };
  return saveAndQueue('payments', 'create', payment, savePayment);
}

export async function updatePaymentStatus(
  id: string,
  status: Payment['status']
): Promise<void> {
  const existing = await getDB().payments.get(id);
  if (!existing) throw new Error(`الاشتراك ${id} غير موجود`);
  const updated = { ...existing, status, paidAt: status === 'paid' ? new Date().toISOString() : undefined };
  await saveAndQueue('payments', 'update', updated, savePayment);
}

// ─── التسجيلات ────────────────────────────────────────

export async function createRegistration(
  data: Omit<PreRegistration, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PreRegistration> {
  const reg: PreRegistration = {
    ...data,
    id: uuid(),
    requestedAt: new Date().toISOString(),
    createdAt: '',
    updatedAt: '',
  };
  return saveAndQueue('registrations', 'create', reg, saveRegistration);
}

export async function updateRegistrationStatus(
  id: string,
  status: PreRegistration['status'],
  approvedById?: string
): Promise<void> {
  const existing = await getDB().registrations.get(id);
  if (!existing) throw new Error(`التسجيل ${id} غير موجود`);
  const updated = { ...existing, status, approvedById };
  await saveAndQueue('registrations', 'update', updated, saveRegistration);
}

// ─── التقارير ─────────────────────────────────────────

export async function createReport(
  data: Omit<DailyReport, 'id' | 'createdAt' | 'updatedAt' | 'timestamp'>
): Promise<DailyReport> {
  const report: DailyReport = {
    ...data,
    id: uuid(),
    timestamp: new Date().toISOString(),
    createdAt: '',
    updatedAt: '',
  };
  return saveAndQueue('reports', 'create', report, saveReport);
}
