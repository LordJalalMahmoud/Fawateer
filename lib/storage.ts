import { Invoice, ProductCatalogItem, CustomerBalance, ProductPricingTier, VaultSettings, CourierSettlement } from './types';
import { INITIAL_INVOICES, INITIAL_PRODUCTS } from './sample-data';
import { DEFAULT_PRICING_TIERS } from './pricing-data';

const INVOICES_STORAGE_KEY = 'detergent_invoices_v1';
const PRODUCTS_STORAGE_KEY = 'detergent_products_v1';
const PRICING_TIERS_STORAGE_KEY = 'detergent_pricing_tiers_v1';
const VAULT_SETTINGS_STORAGE_KEY = 'detergent_vault_settings_v1';
const COURIER_SETTLEMENTS_STORAGE_KEY = 'detergent_courier_settlements_v1';

export const INITIAL_COURIER_SETTLEMENTS: CourierSettlement[] = [];

export function getStoredCourierSettlements(): CourierSettlement[] {
  if (typeof window === 'undefined') return INITIAL_COURIER_SETTLEMENTS;
  try {
    const raw = localStorage.getItem(COURIER_SETTLEMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(COURIER_SETTLEMENTS_STORAGE_KEY, JSON.stringify(INITIAL_COURIER_SETTLEMENTS));
      return INITIAL_COURIER_SETTLEMENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading courier settlements from localStorage', e);
    return INITIAL_COURIER_SETTLEMENTS;
  }
}

export function saveStoredCourierSettlements(settlements: CourierSettlement[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COURIER_SETTLEMENTS_STORAGE_KEY, JSON.stringify(settlements));
  } catch (e) {
    console.error('Error saving courier settlements to localStorage', e);
  }
}

export function getStoredInvoices(): Invoice[] {
  if (typeof window === 'undefined') return INITIAL_INVOICES;
  try {
    const raw = localStorage.getItem(INVOICES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(INITIAL_INVOICES));
      return INITIAL_INVOICES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading invoices from localStorage', e);
    return INITIAL_INVOICES;
  }
}

export function saveStoredInvoices(invoices: Invoice[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
  } catch (e) {
    console.error('Error saving invoices to localStorage', e);
  }
}

export function getStoredProducts(): ProductCatalogItem[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading products from localStorage', e);
    return INITIAL_PRODUCTS;
  }
}

export function saveStoredProducts(products: ProductCatalogItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products to localStorage', e);
  }
}

export function getStoredPricingTiers(): ProductPricingTier[] {
  if (typeof window === 'undefined') return DEFAULT_PRICING_TIERS;
  try {
    const raw = localStorage.getItem(PRICING_TIERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PRICING_TIERS_STORAGE_KEY, JSON.stringify(DEFAULT_PRICING_TIERS));
      return DEFAULT_PRICING_TIERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading pricing tiers from localStorage', e);
    return DEFAULT_PRICING_TIERS;
  }
}

export function saveStoredPricingTiers(tiers: ProductPricingTier[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRICING_TIERS_STORAGE_KEY, JSON.stringify(tiers));
  } catch (e) {
    console.error('Error saving pricing tiers to localStorage', e);
  }
}

export function getStoredVaultSettings(): VaultSettings {
  const defaultSettings: VaultSettings = {
    authorizedEmails: ['jalalmahmoud8000@gmail.com'],
    securityPin: '',
  };
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = localStorage.getItem(VAULT_SETTINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(VAULT_SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading vault settings from localStorage', e);
    return defaultSettings;
  }
}

export function saveStoredVaultSettings(settings: VaultSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VAULT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving vault settings to localStorage', e);
  }
}

export function resetToEmptyData(): { invoices: Invoice[]; products: ProductCatalogItem[] } {
  if (typeof window !== 'undefined') {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify([]));
  }
  return { invoices: [], products: [] };
}

export function generateInvoiceNumber(existingInvoices: Invoice[]): string {
  const currentYear = new Date().getFullYear();
  const yearInvoices = existingInvoices.filter(inv => inv.invoiceNumber?.startsWith(`INV-${currentYear}`));
  const nextNum = yearInvoices.length + 1;
  return `INV-${currentYear}-${String(nextNum).padStart(3, '0')}`;
}

export function calculateCustomerBalances(invoices: Invoice[]): CustomerBalance[] {
  const map: Record<string, { totalInvoiced: number; totalPaid: number; invoiceCount: number; lastDate: string }> = {};

  invoices.forEach(inv => {
    const client = (inv.customerName || 'عميل غير محدد').trim();
    if (!map[client]) {
      map[client] = { totalInvoiced: 0, totalPaid: 0, invoiceCount: 0, lastDate: inv.date };
    }
    map[client].totalInvoiced += Number(inv.totalAmount || 0);
    map[client].totalPaid += Number(inv.paidAmount || 0);
    map[client].invoiceCount += 1;
    if (inv.date > map[client].lastDate) {
      map[client].lastDate = inv.date;
    }
  });

  return Object.entries(map).map(([name, data]) => {
    const remaining = Number((data.totalInvoiced - data.totalPaid).toFixed(2));
    let status: CustomerBalance['status'] = 'SETTLED';
    if (remaining > 0.01) {
      status = 'IN_DEBT';
    } else if (remaining < -0.01) {
      status = 'OVERPAID';
    }

    return {
      name,
      totalInvoiced: Number(data.totalInvoiced.toFixed(2)),
      totalPaid: Number(data.totalPaid.toFixed(2)),
      remainingDebt: remaining,
      invoiceCount: data.invoiceCount,
      lastInvoiceDate: data.lastDate,
      status,
    };
  }).sort((a, b) => b.remainingDebt - a.remainingDebt);
}

export function exportInvoicesToCSV(invoices: Invoice[]): void {
  const headers = ['رقم الفاتورة', 'التاريخ', 'اسم العميل', 'عدد البنود', 'المجموع الفرعي', 'الضريبة', 'الخصم', 'الإجمالي', 'المسدد', 'المتبقي', 'حالة السداد', 'ملاحظات'];
  
  const rows = invoices.map(inv => [
    inv.invoiceNumber,
    inv.date,
    `"${inv.customerName.replace(/"/g, '""')}"`,
    inv.items.length,
    inv.subtotal,
    inv.taxAmount,
    inv.discount,
    inv.totalAmount,
    inv.paidAmount,
    inv.remainingAmount,
    inv.status === 'PAID' ? 'مسددة' : inv.status === 'PARTIAL' ? 'مسدد جزئياً' : 'غير مسددة',
    `"${(inv.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `fawatiri_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
