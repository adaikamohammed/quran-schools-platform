"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Mail, Lock, Eye, EyeOff, Loader2,
  User, Phone, MapPin, Globe, ArrowLeft, CheckCircle2,
  School, Shield, Zap, Globe2,
} from "lucide-react";
import { getDialCode } from "@/lib/countries";

interface FormData {
  schoolName: string;
  adminName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  city: string;
  country: string;
}

const EMPTY: FormData = {
  schoolName: "", adminName: "", email: "",
  password: "", confirmPassword: "", phone: "",
  city: "", country: "",
};

const COUNTRIES = [
  "الجزائر", "المغرب", "تونس", "مصر", "السعودية",
  "الإمارات", "قطر", "الكويت", "الأردن", "فلسطين",
  "ليبيا", "سوريا", "العراق", "اليمن", "السودان",
  "موريتانيا", "تشاد", "النيجر", "مالي", "السنغال",
  "إندونيسيا", "ماليزيا", "نيجيريا", "باكستان", "أخرى",
];

const FEATURES = [
  { icon: Zap, text: "تسجيل فوري — لا انتظار", color: "#f59e0b" },
  { icon: Globe2, text: "تعمل من أي دولة في العالم", color: "#10b981" },
  { icon: Shield, text: "بيانات مدرستك معزولة تماماً", color: "#6366f1" },
  { icon: School, text: "إدارة الطلاب والحصص والحضور", color: "#0ea5e9" },
];

export default function RegisterPage() {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const router = useRouter();

  const set = (k: keyof FormData, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    if (form.password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/schools/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName: form.schoolName,
          adminName: form.adminName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          city: form.city,
          country: form.country,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "حدث خطأ أثناء التسجيل");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.replace("/login"), 3500);

    } catch (err) {
      console.error("Registration fetch error:", err);
      setError("تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.");
    } finally {
      setLoading(false);
    }
  };

  // ─── شاشة النجاح ──────────────────────────────────────────────────
  if (success) {
    return (
      <div style={styles.page} dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.successBox}
        >
          <div style={styles.successIcon}>
            <CheckCircle2 size={52} color="#ffffff" />
          </div>
          <h1 style={styles.successTitle}>تم التسجيل بنجاح! 🎉</h1>
          <p style={styles.successText}>
            تم إنشاء حساب مدرستك. يمكنك تسجيل الدخول الآن وبدء إدارة طلابك.
          </p>
          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 28 }}>
            سيتم توجيهك لصفحة الدخول تلقائياً...
          </p>
          <Link href="/login" style={styles.btnPrimary}>
            دخول لوحة التحكم الآن
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={styles.page} dir="rtl">
      {/* خلفية زخرفية */}
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />
      <div style={styles.bgCircle3} />

      <div style={styles.container}>

        {/* ─── الجانب الأيمن — معلومات ──────────── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          style={styles.leftPanel}
        >
          {/* اللوجو */}
          <Link href="/" style={styles.logo}>
            <div style={styles.logoIcon}>
              <BookOpen size={28} color="#ffffff" />
            </div>
            <div>
              <p style={styles.logoTitle}>منصة المدارس القرآنية</p>
              <p style={styles.logoSub}>لكل مدرسة في العالم الإسلامي</p>
            </div>
          </Link>

          <div style={styles.heroTextBox}>
            <p style={styles.heroTag}>✨ مجاناً تماماً</p>
            <h1 style={styles.heroTitle}>
              سجّل مدرستك القرآنية
              <br />
              <span style={{ color: "#16a34a" }}>وابدأ الإدارة الآن</span>
            </h1>
            <p style={styles.heroPara}>
              منصة متكاملة لإدارة الطلاب، الحصص اليومية، الحضور، الاشتراكات — كل ما تحتاجه في مكان واحد.
            </p>
          </div>

          <div style={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                style={styles.featureCard}
              >
                <div style={{ ...styles.featureIconBox, background: f.color + "20" }}>
                  <f.icon size={20} color={f.color} />
                </div>
                <p style={styles.featureText}>{f.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ─── نموذج التسجيل ────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          style={styles.formWrapper}
        >
          {/* شعار موبايل فقط */}
          <Link href="/" style={{ ...styles.logo, display: "none", marginBottom: 20 }} className="mobile-logo">
            <div style={styles.logoIcon}>
              <BookOpen size={22} color="#ffffff" />
            </div>
            <p style={{ ...styles.logoTitle, fontSize: 16 }}>منصة المدارس القرآنية</p>
          </Link>

          <div style={styles.card}>
            {/* رأس النموذج */}
            <div style={styles.cardHeader}>
              <div style={styles.cardHeaderIcon}>
                <School size={24} color="#ffffff" />
              </div>
              <div>
                <h2 style={styles.cardTitle}>تسجيل مدرسة جديدة</h2>
                <p style={styles.cardSubtitle}>أنشئ حسابك الآن — لا يحتاج موافقة مسبقة</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>

              {/* ─── قسم المدرسة ─── */}
              <div style={styles.section}>
                <div style={styles.sectionLabel}>
                  <div style={{ ...styles.sectionDot, background: "#16a34a" }} />
                  <span>معلومات المدرسة</span>
                </div>

                <InputField
                  icon={<BookOpen size={18} color="#6b7280" />}
                  value={form.schoolName}
                  onChange={v => set("schoolName", v)}
                  placeholder="اسم المدرسة / الحلقة القرآنية *"
                  required
                />

                <div style={styles.row}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <div style={styles.inputIcon}><Globe size={18} color="#6b7280" /></div>
                    <select
                      value={form.country}
                      onChange={e => {
                        const newCountry = e.target.value;
                        set("country", newCountry);
                        const dial = getDialCode(newCountry);
                        if (!form.phone || form.phone.trim().length <= 5) {
                          set("phone", dial);
                        }
                      }}
                      style={{
                        ...styles.input,
                        color: form.country ? "#111827" : "#9ca3af",
                        appearance: "none",
                      }}
                      title="الدولة"
                    >
                      <option value="" disabled>الدولة...</option>
                      {COUNTRIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1, position: "relative" }}>
                    <div style={styles.inputIcon}><MapPin size={18} color="#6b7280" /></div>
                    <input
                      value={form.city}
                      onChange={e => set("city", e.target.value)}
                      placeholder="المدينة / الولاية"
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>

              {/* ─── قسم المدير ─── */}
              <div style={styles.section}>
                <div style={styles.sectionLabel}>
                  <div style={{ ...styles.sectionDot, background: "#2563eb" }} />
                  <span>معلومات مدير المدرسة</span>
                </div>

                <InputField
                  icon={<User size={18} color="#6b7280" />}
                  value={form.adminName}
                  onChange={v => set("adminName", v)}
                  placeholder="الاسم الكامل للمدير *"
                  required
                />
                <InputField
                  icon={<Mail size={18} color="#6b7280" />}
                  value={form.email}
                  onChange={v => set("email", v)}
                  placeholder="البريد الإلكتروني (للدخول) *"
                  type="email"
                  required
                  dir="ltr"
                />
                <InputField
                  icon={<Phone size={18} color="#6b7280" />}
                  value={form.phone}
                  onChange={v => set("phone", v)}
                  placeholder="رقم الهاتف (واتساب)"
                  type="tel"
                  dir="ltr"
                />
              </div>

              {/* ─── قسم كلمة المرور ─── */}
              <div style={styles.section}>
                <div style={styles.sectionLabel}>
                  <div style={{ ...styles.sectionDot, background: "#7c3aed" }} />
                  <span>كلمة المرور</span>
                </div>

                <div style={{ position: "relative" }}>
                  <div style={styles.inputIcon}><Lock size={18} color="#6b7280" /></div>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={e => set("password", e.target.value)}
                    required
                    minLength={8}
                    placeholder="كلمة المرور (8 أحرف على الأقل) *"
                    style={{ ...styles.input, paddingLeft: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    style={styles.eyeBtn}
                    title="إظهار/إخفاء"
                  >
                    {showPwd ? <EyeOff size={18} color="#9ca3af" /> : <Eye size={18} color="#9ca3af" />}
                  </button>
                </div>

                <div style={{ position: "relative" }}>
                  <div style={styles.inputIcon}><Lock size={18} color="#6b7280" /></div>
                  <input
                    type={showConfirmPwd ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={e => set("confirmPassword", e.target.value)}
                    required
                    placeholder="تأكيد كلمة المرور *"
                    style={{ ...styles.input, paddingLeft: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    style={styles.eyeBtn}
                    title="إظهار/إخفاء"
                  >
                    {showConfirmPwd ? <EyeOff size={18} color="#9ca3af" /> : <Eye size={18} color="#9ca3af" />}
                  </button>
                </div>
              </div>

              {/* رسالة الخطأ */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={styles.errorBox}
                  >
                    <span style={styles.errorDot}>⚠️</span>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* زر التسجيل */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.submitBtn,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                    <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                    جارٍ إنشاء المدرسة...
                  </span>
                ) : (
                  "✨ تسجيل المدرسة مجاناً"
                )}
              </button>
            </form>

            {/* رابط الدخول */}
            <div style={styles.loginLink}>
              <span style={{ color: "#6b7280" }}>لديك حساب بالفعل؟ </span>
              <Link href="/login" style={styles.loginAnchor}>
                <ArrowLeft size={14} />
                تسجيل الدخول
              </Link>
            </div>
          </div>

          <p style={styles.privacyNote}>🔒 بياناتك محمية ومعزولة تماماً عن باقي المدارس</p>
        </motion.div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        * { font-family: 'Cairo', sans-serif; box-sizing: border-box; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #9ca3af; }
        input:focus, select:focus { outline: none; border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12); }
        select option { color: #111827; background: white; }
        @media (max-width: 900px) {
          .mobile-logo { display: flex !important; }
        }
        @media (max-width: 900px) {
          #register-container { flex-direction: column !important; gap: 0 !important; }
          #left-panel { display: none !important; }
          #form-wrapper { width: 100% !important; max-width: 100% !important; min-height: 100vh; padding: 24px 16px !important; }
        }
      `}</style>
    </div>
  );
}

// ─── مكوّن حقل الإدخال ──────────────────────────────────────────────
function InputField({
  icon, value, onChange, placeholder, type = "text", required, dir,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  dir?: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <div style={styles.inputIcon}>{icon}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        dir={dir}
        style={{
          ...styles.input,
          textAlign: dir === "ltr" ? "left" : "right",
        }}
      />
    </div>
  );
}

// ─── التنسيقات ──────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0fdf4 0%, #f8fafc 50%, #eff6ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    padding: "24px 16px",
  },
  bgCircle1: {
    position: "absolute", top: "-8%", right: "-5%",
    width: 500, height: 500,
    background: "radial-gradient(circle, rgba(22,163,74,0.12) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
  },
  bgCircle2: {
    position: "absolute", bottom: "-10%", left: "-8%",
    width: 450, height: 450,
    background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
  },
  bgCircle3: {
    position: "absolute", top: "40%", left: "30%",
    width: 300, height: 300,
    background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
  },
  container: {
    display: "flex",
    alignItems: "stretch",
    gap: 48,
    width: "100%",
    maxWidth: 1100,
    position: "relative",
    zIndex: 1,
  },
  // ─── Panel يسار
  leftPanel: {
    flex: "0 0 380px",
    display: "flex",
    flexDirection: "column",
    gap: 32,
    justifyContent: "center",
    padding: "48px 0",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    textDecoration: "none",
  },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 24px rgba(22,163,74,0.3)",
  },
  logoTitle: {
    color: "#111827",
    fontWeight: 800,
    fontSize: 17,
    margin: 0,
  },
  logoSub: {
    color: "#16a34a",
    fontWeight: 600,
    fontSize: 12,
    margin: 0,
    opacity: 0.8,
  },
  heroTextBox: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  heroTag: {
    display: "inline-block",
    background: "rgba(22,163,74,0.1)",
    color: "#16a34a",
    fontWeight: 700,
    fontSize: 13,
    padding: "4px 14px",
    borderRadius: 999,
    width: "fit-content",
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: 900,
    color: "#111827",
    lineHeight: 1.4,
    margin: 0,
  },
  heroPara: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 1.8,
    margin: 0,
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  featureCard: {
    background: "#ffffff",
    borderRadius: 14,
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureText: {
    fontSize: 13,
    fontWeight: 700,
    color: "#374151",
    margin: 0,
    lineHeight: 1.4,
  },
  // ─── Form wrapper
  formWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "#ffffff",
    borderRadius: 24,
    padding: "36px 40px",
    width: "100%",
    maxWidth: 560,
    boxShadow: "0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.06)",
    border: "1px solid #f3f4f6",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 28,
    paddingBottom: 24,
    borderBottom: "2px solid #f3f4f6",
  },
  cardHeaderIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 20px rgba(22,163,74,0.25)",
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 900,
    color: "#111827",
    margin: 0,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    margin: "4px 0 0 0",
    fontWeight: 600,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  sectionLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 800,
    color: "#374151",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  input: {
    width: "100%",
    height: 50,
    border: "1.5px solid #e5e7eb",
    borderRadius: 12,
    paddingRight: 44,
    paddingLeft: 16,
    fontSize: 15,
    fontWeight: 600,
    color: "#111827",
    background: "#f9fafb",
    transition: "all 0.2s",
    fontFamily: "'Cairo', sans-serif",
  },
  inputIcon: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    display: "flex",
  },
  eyeBtn: {
    position: "absolute",
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    display: "flex",
  },
  row: {
    display: "flex",
    gap: 10,
  },
  errorBox: {
    background: "#fef2f2",
    border: "1.5px solid #fca5a5",
    borderRadius: 12,
    padding: "14px 16px",
    color: "#dc2626",
    fontSize: 14,
    fontWeight: 700,
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    lineHeight: 1.6,
  },
  errorDot: {
    flexShrink: 0,
    fontSize: 16,
  },
  submitBtn: {
    width: "100%",
    height: 54,
    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
    color: "#ffffff",
    fontSize: 17,
    fontWeight: 900,
    borderRadius: 14,
    border: "none",
    boxShadow: "0 8px 24px rgba(22,163,74,0.35)",
    transition: "all 0.2s",
    letterSpacing: "0.02em",
    marginTop: 4,
  },
  loginLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
    paddingTop: 20,
    borderTop: "1.5px solid #f3f4f6",
    fontSize: 15,
    fontWeight: 600,
  },
  loginAnchor: {
    color: "#16a34a",
    fontWeight: 800,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  privacyNote: {
    textAlign: "center" as const,
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 16,
    fontWeight: 600,
  },
  // ─── Success screen
  successBox: {
    background: "#ffffff",
    borderRadius: 28,
    padding: "52px 48px",
    maxWidth: 480,
    width: "100%",
    textAlign: "center" as const,
    boxShadow: "0 24px 80px rgba(0,0,0,0.12)",
  },
  successIcon: {
    width: 90,
    height: 90,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
    boxShadow: "0 12px 32px rgba(22,163,74,0.35)",
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 900,
    color: "#111827",
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 1.7,
    marginBottom: 12,
    fontWeight: 600,
  },
  btnPrimary: {
    display: "inline-block",
    padding: "14px 36px",
    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
    color: "#ffffff",
    borderRadius: 14,
    fontWeight: 800,
    fontSize: 16,
    textDecoration: "none",
    boxShadow: "0 8px 24px rgba(22,163,74,0.3)",
  },
};
