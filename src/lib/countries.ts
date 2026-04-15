export interface CountryInfo {
  name: string;
  dial: string;
  flag: string;
}

export const COUNTRIES_LIST: CountryInfo[] = [
  // الدول العربية
  { name: "الجزائر",       dial: "+213", flag: "🇩🇿" },
  { name: "مصر",           dial: "+20",  flag: "🇪🇬" },
  { name: "السعودية",      dial: "+966", flag: "🇸🇦" },
  { name: "المغرب",        dial: "+212", flag: "🇲🇦" },
  { name: "تونس",          dial: "+216", flag: "🇹🇳" },
  { name: "ليبيا",         dial: "+218", flag: "🇱🇾" },
  { name: "السودان",       dial: "+249", flag: "🇸🇩" },
  { name: "موريتانيا",     dial: "+222", flag: "🇲🇷" },
  { name: "فلسطين",        dial: "+970", flag: "🇵🇸" },
  { name: "الأردن",        dial: "+962", flag: "🇯🇴" },
  { name: "لبنان",         dial: "+961", flag: "🇱🇧" },
  { name: "سوريا",         dial: "+963", flag: "🇸🇾" },
  { name: "العراق",        dial: "+964", flag: "🇮🇶" },
  { name: "الكويت",        dial: "+965", flag: "🇰🇼" },
  { name: "قطر",           dial: "+974", flag: "🇶🇦" },
  { name: "البحرين",       dial: "+973", flag: "🇧🇭" },
  { name: "الإمارات",      dial: "+971", flag: "🇦🇪" },
  { name: "عمان",          dial: "+968", flag: "🇴🇲" },
  { name: "اليمن",         dial: "+967", flag: "🇾🇪" },
  { name: "جيبوتي",        dial: "+253", flag: "🇩🇯" },
  { name: "الصومال",       dial: "+252", flag: "🇸🇴" },
  { name: "جزر القمر",     dial: "+269", flag: "🇰🇲" },
  { name: "تشاد",          dial: "+235", flag: "🇹🇩" },
  { name: "النيجر",        dial: "+227", flag: "🇳🇪" },
  { name: "مالي",          dial: "+223", flag: "🇲🇱" },
  { name: "السنغال",       dial: "+221", flag: "🇸🇳" },
  // دول إسلامية غير عربية
  { name: "إندونيسيا",    dial: "+62",  flag: "🇮🇩" },
  { name: "ماليزيا",      dial: "+60",  flag: "🇲🇾" },
  { name: "نيجيريا",      dial: "+234", flag: "🇳🇬" },
  { name: "باكستان",      dial: "+92",  flag: "🇵🇰" },
  { name: "تركيا",        dial: "+90",  flag: "🇹🇷" },
  { name: "أفغانستان",    dial: "+93",  flag: "🇦🇫" },
  { name: "أخرى",         dial: "",     flag: "🌍" },
];

/** مفاتيح الاتصال (للتوافق مع الكود القديم) */
export const ARAB_COUNTRIES_DIAL_CODES: Record<string, string> = Object.fromEntries(
  COUNTRIES_LIST.filter(c => c.dial).map(c => [c.name, c.dial + " "])
);

/** إرجاع رمز الاتصال الدولي بناءً على اسم الدولة */
export function getDialCode(countryName?: string): string {
  if (!countryName) return "";
  const found = COUNTRIES_LIST.find(c => c.name === countryName.trim());
  return found?.dial ? found.dial + " " : "";
}

/** إرجاع معلومات الدولة كاملة */
export function getCountryInfo(countryName?: string): CountryInfo | undefined {
  if (!countryName) return undefined;
  return COUNTRIES_LIST.find(c => c.name === countryName.trim());
}
