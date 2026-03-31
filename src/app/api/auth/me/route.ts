import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || user.deletedAt || !user.isActive) {
      return NextResponse.json({ error: 'الحساب غير موجود أو غير نشط' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        schoolId: user.schoolId,
        groupName: user.groupName,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    console.error('Me route error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
