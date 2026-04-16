import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrencySymbol(country?: string): string {
  if (!country) return "دج";
  switch (country.trim()) {
    case 'المغرب': return 'درهم';
    case 'تونس': return 'د.ت';
    case 'مصر': return 'ج.م';
    case 'السعودية': return 'ر.س';
    case 'الإمارات': return 'د.إ';
    case 'الكويت': return 'د.ك';
    case 'قطر': return 'ر.ق';
    case 'سلطنة عمان': return 'ر.ع';
    case 'البحرين': return 'د.ب';
    case 'الأردن': return 'د.أ';
    case 'سوريا': return 'ل.س';
    case 'لبنان': return 'ل.ل';
    case 'العراق': return 'د.ع';
    case 'اليمن': return 'ر.ي';
    case 'ليبيا': return 'د.ل';
    case 'السودان': return 'ج.س';
    case 'موريتانيا': return 'أوقية';
    case 'فلسطين': return 'شيكل';
    case 'فرنسا':
    case 'بلجيكا':
    case 'إسبانيا': return '€';
    case 'بريطانيا': return '£';
    case 'الولايات المتحدة':
    case 'كندا': return '$';
    case 'تركيا': return '₺';
    case 'الجزائر':
    default:
      return 'دج';
  }
}

