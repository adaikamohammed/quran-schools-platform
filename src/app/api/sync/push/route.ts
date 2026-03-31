import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { operations } = await req.json();
    if (!Array.isArray(operations)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Process all operations in a single transaction
    await prisma.$transaction(async (tx) => {
      for (const op of operations) {
        const { table, action, recordId, data } = op;
        
        // Ensure table allows dynamic access
        const model = (tx as any)[table];
        if (!model) continue;

        // Force schoolId for multi-tenant isolation
        const safeData = { ...data, schoolId: session.schoolId };

        switch (action) {
          case 'create':
            try {
              // Upsert to handle conflicts (e.g., if client recreated something)
              await model.upsert({
                where: { id: recordId },
                update: safeData,
                create: safeData,
              });
            } catch (e) {
              console.warn(`Record ${recordId} in ${table} already exists or failed to create`);
            }
            break;

          case 'update':
            await model.updateMany({
              where: { id: recordId, schoolId: session.schoolId },
              data: safeData,
            });
            break;

          case 'delete':
            // Soft delete
            await model.updateMany({
              where: { id: recordId, schoolId: session.schoolId },
              data: { deletedAt: new Date(), updatedAt: new Date() },
            });
            break;
        }
      }
    });

    return NextResponse.json({ success: true, count: operations.length });
  } catch (error) {
    console.error("Push sync error:", error);
    return NextResponse.json({ error: "Sync transaction failed" }, { status: 500 });
  }
}
