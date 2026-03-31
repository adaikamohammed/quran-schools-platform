import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const lastSyncAtStr = searchParams.get('lastSyncAt');
    const lastSyncAt = lastSyncAtStr ? new Date(lastSyncAtStr) : new Date(0);

    const changes = [];

    // Delta pull for multiple tables
    // 1. Students
    const students = await prisma.student.findMany({
      where: { schoolId: session.schoolId, updatedAt: { gt: lastSyncAt } },
    });
    students.forEach((s) => changes.push({ table: 'students', recordId: s.id, data: s, deletedAt: s.deletedAt }));

    // 2. Daily Sessions
    const sessions = await prisma.dailySession.findMany({
      where: { schoolId: session.schoolId, updatedAt: { gt: lastSyncAt } },
      include: { records: true }, // include nested records
    });
    sessions.forEach((s) => changes.push({ table: 'sessions', recordId: s.id, data: s, deletedAt: s.deletedAt }));

    // 3. Surah Progress
    const progress = await prisma.surahProgress.findMany({
      where: { schoolId: session.schoolId, updatedAt: { gt: lastSyncAt } },
    });
    progress.forEach((p) => changes.push({ table: 'surahProgress', recordId: p.id, data: p, deletedAt: p.deletedAt }));

    // 4. Payments
    const payments = await prisma.payment.findMany({
      where: { schoolId: session.schoolId, updatedAt: { gt: lastSyncAt } },
    });
    payments.forEach((p) => changes.push({ table: 'payments', recordId: p.id, data: p, deletedAt: p.deletedAt }));
    
    // 5. Users
    const users = await prisma.user.findMany({
      where: { schoolId: session.schoolId, updatedAt: { gt: lastSyncAt } },
    });
    users.forEach((u) => {
      // Don't send password hash down!
      const { passwordHash, ...safeUser } = u; 
      changes.push({ table: 'users', recordId: u.id, data: safeUser, deletedAt: u.deletedAt });
    });

    return NextResponse.json({ success: true, changes });
  } catch (error) {
    console.error("Pull sync error:", error);
    return NextResponse.json({ error: "Delta pull failed" }, { status: 500 });
  }
}
