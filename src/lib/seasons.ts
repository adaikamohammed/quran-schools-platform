/**
 * ─── نظام الفصول الدراسية الأربعة ───────────────────────────
 *
 * الفصل الأول:  يناير   — مارس    (الأشهر 1–3)
 * الفصل الثاني: أبريل   — يونيو   (الأشهر 4–6)
 * الفصل الثالث: يوليو   — سبتمبر  (الأشهر 7–9)
 * الفصل الرابع: أكتوبر  — ديسمبر  (الأشهر 10–12)
 *
 * كل فصل يبدأ في اليوم الأول من شهره ويُختتم في آخر يوم من شهره الثالث.
 */

export type SeasonNumber = 1 | 2 | 3 | 4;

export interface Season {
  /** رقم الفصل (1–4) */
  number: SeasonNumber;
  /** الاسم العربي المختصر */
  name: string;
  /** الاسم العربي الكامل */
  fullName: string;
  /** الشهر الذي يبدأ فيه الفصل (1-based) */
  startMonth: number;
  /** الشهر الذي ينتهي فيه الفصل (1-based, inclusive) */
  endMonth: number;
  /** اللون المُعبّر عن الفصل */
  color: string;
  /** أيقونة الفصل */
  emoji: string;
}

export const SEASONS: Record<SeasonNumber, Season> = {
  1: { number: 1, name: "الفصل الأول",   fullName: "الفصل الأول — يناير حتى مارس",     startMonth: 1,  endMonth: 3,  color: "#3b82f6", emoji: "❄️" },
  2: { number: 2, name: "الفصل الثاني",  fullName: "الفصل الثاني — أبريل حتى يونيو",   startMonth: 4,  endMonth: 6,  color: "#10b981", emoji: "🌸" },
  3: { number: 3, name: "الفصل الثالث",  fullName: "الفصل الثالث — يوليو حتى سبتمبر",  startMonth: 7,  endMonth: 9,  color: "#f59e0b", emoji: "☀️" },
  4: { number: 4, name: "الفصل الرابع",  fullName: "الفصل الرابع — أكتوبر حتى ديسمبر", startMonth: 10, endMonth: 12, color: "#ef4444", emoji: "🍂" },
};

/** جميع الفصول بترتيب تصاعدي */
export const ALL_SEASONS = Object.values(SEASONS) as Season[];

// ─── دوال المساعدة ────────────────────────────────────────

/**
 * يُعيد رقم الفصل بناءً على رقم الشهر (1–12)
 */
export function getSeasonByMonth(month: number): Season {
  if (month >= 1 && month <= 3)  return SEASONS[1];
  if (month >= 4 && month <= 6)  return SEASONS[2];
  if (month >= 7 && month <= 9)  return SEASONS[3];
  return SEASONS[4];
}

/**
 * يُعيد الفصل الحالي بناءً على تاريخ اليوم
 */
export function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1; // getMonth() يبدأ من 0
  return getSeasonByMonth(month);
}

/**
 * يُعيد الفصل الذي يقع فيه تاريخ ISO معطى
 */
export function getSeasonForDate(isoDate: string): Season {
  const month = new Date(isoDate).getMonth() + 1;
  return getSeasonByMonth(month);
}

/**
 * يُعيد نطاق التواريخ (بداية ونهاية) لفصل في سنة معينة
 */
export function getSeasonDateRange(season: SeasonNumber, year: number): { from: string; to: string } {
  const s = SEASONS[season];
  const endDay = new Date(year, s.endMonth, 0).getDate(); // آخر يوم في الشهر الأخير
  return {
    from: `${year}-${String(s.startMonth).padStart(2, "0")}-01`,
    to:   `${year}-${String(s.endMonth).padStart(2, "0")}-${endDay}`,
  };
}

/**
 * يُعيد قائمة بجميع فصول السنة مع نطاقاتها
 */
export function getYearSeasons(year: number): Array<Season & { from: string; to: string }> {
  return ALL_SEASONS.map((s) => ({
    ...s,
    ...getSeasonDateRange(s.number, year),
  }));
}

/**
 * يُعيد "الفصل الأول 2025" كنص
 */
export function formatSeasonLabel(season: SeasonNumber, year: number): string {
  return `${SEASONS[season].name} ${year}`;
}

/**
 * يُصفّي مصفوفة من العناصر التي تحتوي على `date: string` ليُبقي فقط تلك التابعة لفصل معين
 */
export function filterBySeason<T extends { date: string }>(
  items: T[],
  season: SeasonNumber,
  year: number
): T[] {
  const { from, to } = getSeasonDateRange(season, year);
  return items.filter((i) => i.date >= from && i.date <= to);
}

/**
 * يُعيد اسم الأشهر العربية المُضمَّنة في فصل معيّن
 */
export function getSeasonMonthNames(season: SeasonNumber): string[] {
  const MONTHS_AR = [
    "", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];
  const s = SEASONS[season];
  return Array.from({ length: 3 }, (_, i) => MONTHS_AR[s.startMonth + i]);
}
