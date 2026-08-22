export type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL';

export interface InvoiceItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate?: number; // e.g. 14%
  taxAmount: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCatalogItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  defaultPrice: number;
  barcode?: string;
}

export interface CustomerBalance {
  name: string;
  totalInvoiced: number;
  totalPaid: number;
  remainingDebt: number;
  invoiceCount: number;
  lastInvoiceDate: string;
  status: 'SETTLED' | 'IN_DEBT' | 'OVERPAID';
}

export interface ProductPricingTier {
  id: string;
  productName: string;
  category: string;
  factoryPrice: number; // سعر المصنع
  companyPrice: number; // سعر الشركة
  unit: string;
  aliases?: string[];
}

export interface VaultSettings {
  authorizedEmails: string[];
  securityPin?: string;
  updatedAt?: string;
}

export interface ItemProfitCalculation {
  itemId: string;
  productName: string;
  unit: string;
  quantity: number;
  merchantUnitPrice: number;
  companyUnitPrice: number;
  factoryUnitPrice: number;
  
  // Total amounts
  merchantRevenueTotal: number; // Q * merchantUnitPrice
  companyCostTotal: number;     // Q * companyUnitPrice
  factoryCostTotal: number;     // Q * factoryUnitPrice
  
  // Profits
  companyProfitTotal: number;   // Q * (merchantUnitPrice - companyUnitPrice)
  factoryToCompanyProfitTotal: number; // Q * (companyUnitPrice - factoryUnitPrice)
  totalProfit: number;          // Q * (merchantUnitPrice - factoryUnitPrice)
}

export interface InvoiceProfitBreakdown {
  invoiceId: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  items: ItemProfitCalculation[];
  invoiceMerchantRevenue: number;
  invoiceCompanyCost: number;
  invoiceFactoryCost: number;
  invoiceCompanyProfit: number;
  invoiceFactoryToCompanyProfit: number;
  invoiceTotalProfit: number;
}
