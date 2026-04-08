/**
 * هذا الملف يُصدّر Supabase Admin Client بدلاً من Prisma.
 * تم الانتقال من Prisma إلى Supabase مباشرة.
 * الكود المتبقي الذي يستورد من هنا سيعمل بشكل طبيعي.
 */
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// alias للتوافق مع الكود القديم الذي يستورد { prisma }
export const prisma = supabaseAdmin;
