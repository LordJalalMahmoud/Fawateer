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
  
  // Total invoiced amounts
  merchantRevenueTotal: number; // Q * merchantUnitPrice
  companyCostTotal: number;     // Q * companyUnitPrice
  factoryCostTotal: number;     // Q * factoryUnitPrice
  
  // Invoiced Profits
  companyProfitTotal: number;   // Q * (merchantUnitPrice - companyUnitPrice)
  factoryToCompanyProfitTotal: number; // Q * (companyUnitPrice - factoryUnitPrice)
  totalProfit: number;          // Q * (merchantUnitPrice - factoryUnitPrice)

  // Realized / Collected portions (based on invoice paid ratio)
  paidRatio: number;
  realizedMerchantRevenue: number;
  realizedCompanyCost: number;
  realizedFactoryCost: number;
  realizedCompanyProfit: number;
  realizedFactoryToCompanyProfit: number;
  realizedTotalProfit: number;

  // Pending / Unrealized portions
  pendingTotalProfit: number;
  pendingCompanyProfit: number;
  pendingFactoryProfit: number;
}

export interface InvoiceProfitBreakdown {
  invoiceId: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  items: ItemProfitCalculation[];
  
  // Invoiced amounts
  invoiceMerchantRevenue: number;
  invoiceCompanyCost: number;
  invoiceFactoryCost: number;
  invoiceCompanyProfit: number;
  invoiceFactoryToCompanyProfit: number;
  invoiceTotalProfit: number;

  // Payment status & Realized Cash
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paidRatio: number; // 0 to 1
  paymentStatus: PaymentStatus;

  // Realized Profits (from collected cash)
  realizedMerchantRevenue: number;
  realizedCompanyCost: number;
  realizedFactoryCost: number;
  realizedCompanyProfit: number;
  realizedFactoryToCompanyProfit: number;
  realizedTotalProfit: number;

  // Pending Profits (uncollected debt in market)
  pendingTotalProfit: number;
  pendingCompanyProfit: number;
  pendingFactoryProfit: number;
}
