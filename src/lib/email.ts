import { Resend } from 'resend';

// Lazy getter — avoids top-level instantiation at build time
// when RESEND_API_KEY may not be present in the build environment.
function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY ?? 'placeholder');
}

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? 'admin@quran.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://quran-schools.vercel.app';

/**
 * يُرسل إشعاراً للمنصة عند تسجيل مدرسة جديدة.
 * لا يتطلب موافقة — المدرسة تعمل فوراً، هذا للإحاطة فقط.
 */
export async function sendNewSchoolNotification(school: {
  name: string;
  city: string;
  country: string;
  adminName: string;
  adminEmail: string;
  phone?: string;
}): Promise<boolean> {
  try {
    const { error } = await getResend().emails.send({
      from: 'منصة المدارس القرآنية <onboarding@resend.dev>',
      to: ADMIN_EMAIL,
      subject: `🆕 مدرسة جديدة انضمت: ${school.name}`,
      html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f8fafc;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#065f46;padding:28px 24px;text-align:center;">
          <div style="font-size:48px;margin-bottom:10px;">📖</div>
          <h1 style="color:white;margin:0;font-size:22px;font-weight:800;">مدرسة قرآنية جديدة انضمت!</h1>
          <p style="color:#6ee7b7;margin:6px 0 0;font-size:13px;">منصة المدارس القرآنية</p>
        </div>
        <div style="padding:28px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">🏫 اسم المدرسة</td><td style="padding:8px 0;font-weight:bold;color:#0f172a;">${school.name}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">🌍 الدولة / المدينة</td><td style="padding:8px 0;font-weight:bold;color:#0f172a;">${school.country} — ${school.city}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">👤 المدير</td><td style="padding:8px 0;font-weight:bold;color:#0f172a;">${school.adminName}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">📧 الإيميل</td><td style="padding:8px 0;font-weight:bold;color:#0f172a;">${school.adminEmail}</td></tr>
            ${school.phone ? `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;">📱 الهاتف</td><td style="padding:8px 0;font-weight:bold;color:#0f172a;">${school.phone}</td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">📅 التاريخ</td><td style="padding:8px 0;font-weight:bold;color:#0f172a;">${new Date().toLocaleString('ar-DZ')}</td></tr>
          </table>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;margin-top:16px;">
            <p style="margin:0;color:#166534;font-size:14px;">✅ المدرسة مفعّلة تلقائياً ويمكن للمدير الدخول الآن.</p>
          </div>
          <div style="text-align:center;margin-top:20px;">
            <a href="${APP_URL}/super-admin" style="display:inline-block;background:#065f46;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;">
              🔧 لوحة السوبر أدمن
            </a>
          </div>
        </div>
        <div style="padding:16px;background:#f1f5f9;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} منصة المدارس القرآنية</p>
        </div>
      </div>`,
    });

    if (error) {
      console.error('[EMAIL] Resend error:', error);
      return false;
    }

    console.log('[EMAIL] School notification sent to admin:', ADMIN_EMAIL);
    return true;
  } catch (err) {
    console.error('[EMAIL] Failed to send school notification:', err);
    return false;
  }
}

/**
 * يُرسل إيميل ترحيب لمدير المدرسة الجديدة
 */
export async function sendWelcomeEmail(to: string, name: string, schoolName: string): Promise<boolean> {
  try {
    const { error } = await getResend().emails.send({
      from: 'منصة المدارس القرآنية <onboarding@resend.dev>',
      to,
      subject: `🎉 أهلاً بمدرستك في منصتنا — ${schoolName}`,
      html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f8fafc;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#065f46;padding:28px 24px;text-align:center;">
          <div style="font-size:48px;margin-bottom:10px;">🕌</div>
          <h1 style="color:white;margin:0;font-size:22px;font-weight:800;">أهلاً بك في منصة المدارس القرآنية</h1>
        </div>
        <div style="padding:28px;">
          <h2 style="margin:0 0 12px;color:#0f172a;font-size:18px;">مرحباً ${name} 👋</h2>
          <p style="color:#475569;font-size:15px;line-height:1.8;margin:0 0 16px;">
            تم تسجيل مدرسة <strong>${schoolName}</strong> بنجاح في المنصة.
            يمكنك الآن تسجيل الدخول وإضافة معلميك وطلابك وبدء تسجيل الحصص.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${APP_URL}/login" style="display:inline-block;background:#065f46;color:white;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;">
              🚀 دخول لوحة التحكم
            </a>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;">
            <p style="margin:0;color:#166534;font-size:13px;">💡 للبدء: سجّل دخولك بنفس الإيميل وكلمة المرور التي اخترتها.</p>
          </div>
        </div>
        <div style="padding:16px;background:#f1f5f9;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} منصة المدارس القرآنية</p>
        </div>
      </div>`,
    });

    if (error) {
      console.error('[EMAIL] Welcome email error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[EMAIL] Failed to send welcome email:', err);
    return false;
  }
}
