/**
 * soundEngine.ts — محرك الأصوات المركزي
 * ✅ صفر npm packages — Web Audio API فقط
 * ✅ Lazy initialization — لا يُنشأ AudioContext إلا عند أول صوت
 * ✅ Singleton — نسخة واحدة فقط طوال عمر التطبيق
 */

// ── الـ Context المُشترَك ─────────────────────────────────────
let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null; // SSR safe
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  // استئناف إذا كان معلقاً (سياسة Autoplay)
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

// ── الدالة الأساسية لتوليد نغمة ─────────────────────────────
function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.28
): void {
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  // تلاشي تدريجي لتجنّب الانقطاع المفاجئ (click sound)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration + 0.01);
}

// ── مكتبة الأصوات ─────────────────────────────────────────────

export const SoundLibrary = {

  /** نقرة خفيفة — عند تحضير طالب واحد */
  tick(): void {
    tone(900, 0.07, "sine", 0.18);
  },

  /** نجاح — عند حفظ الحصة / قبول طالب */
  success(): void {
    tone(523, 0.1, "sine", 0.25);            // C5
    setTimeout(() => tone(659, 0.18, "sine", 0.22), 110); // E5
  },

  /** اكتمال — عند تحضير الجميع دفعة واحدة */
  complete(): void {
    tone(523, 0.09, "sine", 0.22);
    setTimeout(() => tone(659, 0.09, "sine", 0.22), 100);
    setTimeout(() => tone(784, 0.22, "sine", 0.25), 200); // G5
  },

  /** إنجاز / احتفال — انضمام طالب رسمياً */
  achievement(): void {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => tone(f, 0.13, "sine", 0.22), i * 95)
    );
  },

  /** خطأ / تحذير — لأي رسالة فشل */
  error(): void {
    tone(380, 0.09, "sawtooth", 0.18);
    setTimeout(() => tone(310, 0.18, "sawtooth", 0.14), 110);
  },

  /** نسخ — عند نسخ رابط أو نص */
  copy(): void {
    tone(1100, 0.05, "sine", 0.18);
    setTimeout(() => tone(1400, 0.06, "sine", 0.14), 60);
  },

  /** pop — عند فتح نافذة منبثقة */
  pop(): void {
    tone(700, 0.07, "sine", 0.16);
  },
} as const;

export type SoundName = keyof typeof SoundLibrary;
