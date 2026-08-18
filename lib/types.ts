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
