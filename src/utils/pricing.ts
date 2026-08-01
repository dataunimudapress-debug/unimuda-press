import { CustomerCategory, RoundingOption } from '../types';

/**
 * Pricing matrix per meter based on customer category and service type.
 * - Umum: Desain+Cetak Rp 50.000 | Cetak Saja Rp 48.000
 * - Persyarikatan: Desain+Cetak Rp 48.000 | Cetak Saja Rp 45.000
 * - Mitra: Cetak Saja Rp 40.000 (tanpa opsi desain)
 * - Kampus: Desain+Cetak Rp 40.000 | Cetak Saja Rp 38.000
 */
export function getPricePerMeter(
  category: CustomerCategory,
  serviceType: 'design_print' | 'print_only'
): number {
  switch (category) {
    case 'Umum':
      return serviceType === 'design_print' ? 50000 : 48000;
    case 'Persyarikatan':
      return serviceType === 'design_print' ? 48000 : 45000;
    case 'Mitra':
      return 40000; // Only print_only
    case 'Kampus':
      return serviceType === 'design_print' ? 40000 : 38000;
    default:
      return 50000;
  }
}

/**
 * Rounds an amount upward according to the selected rounding option.
 * Examples:
 * - 127350 -> option '10000' -> 130000
 * - 127350 -> option '1000'  -> 128000
 * - 127350 -> option '100'   -> 127400
 * - option 'off' -> exact value
 */
export function applyRounding(
  amount: number,
  option: RoundingOption,
  enabled: boolean = true
): number {
  if (!enabled || option === 'off' || amount <= 0) {
    return Math.round(amount);
  }

  const factor = parseInt(option, 10);
  if (isNaN(factor) || factor <= 0) {
    return Math.round(amount);
  }

  return Math.ceil(amount / factor) * factor;
}

export const CATEGORY_PRICING_TABLE = [
  { category: 'Umum', designPrint: 50000, printOnly: 48000, note: 'Tarif standar publik' },
  { category: 'Persyarikatan', designPrint: 48000, printOnly: 45000, note: 'Diskon khusus warga Persyarikatan' },
  { category: 'Mitra', designPrint: null, printOnly: 40000, note: 'Cetak saja (Tanpa opsi desain)' },
  { category: 'Kampus', designPrint: 40000, printOnly: 38000, note: 'Tarif khusus civitas akademika' },
];
