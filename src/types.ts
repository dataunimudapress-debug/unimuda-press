export type NavigationTab = 'dashboard' | 'new-transaction' | 'history' | 'reports-settings' | 'apps-script';

export type PaymentStatus = 'Lunas' | 'Belum Lunas' | 'DP (50%)' | 'Produksi' | 'Selesai';

export type CustomerCategory = 'Umum' | 'Persyarikatan' | 'Mitra' | 'Kampus';

export interface Transaction {
  id: string;
  orderId: string;
  customerName: string;
  customerCategory: CustomerCategory;
  orderType: string;
  serviceType: 'design_print' | 'print_only';
  lengthMeters: number;
  widthMeters: number;
  qty: number;
  pricePerMeter: number;
  totalAmount: number;
  status: PaymentStatus;
  date: string;
  imageUrl: string;
  useFrame?: boolean;
  notes?: string;
}

export interface PricingRule {
  id: string;
  serviceType: string;
  baseRate: number;
  unit: string;
  description?: string;
}

export interface MonthlyTrendData {
  month: string;
  income: number;
  percentageHeight: number;
}

export type RoundingOption = 'off' | '100' | '1000' | '10000';

export interface SystemSettings {
  roundingOption: RoundingOption;
  roundingEnabled: boolean;
  standardMinAreaMeters: number;
}
