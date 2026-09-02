import { Invoice } from './types';

export interface CustomerProductDemand {
  productName: string;
  totalQuantity: number;
  unit: string;
  totalAmount: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  lastPrice: number;
  ordersCount: number;
  lastOrderDate: string;
  percentageOfCustomerTotal?: number;
}

export interface CustomerDemandSummary {
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  invoicesCount: number;
  totalSpent: number;
  totalUnitsCount: number;
  distinctProductsCount: number;
  topProduct?: string;
  lastOrderDate: string;
  products: CustomerProductDemand[];
}

export interface ProductCustomerDemand {
  customerName: string;
  customerPhone?: string;
  quantity: number;
  unit: string;
  amount: number;
  averagePrice: number;
  ordersCount: number;
  lastOrderDate: string;
  percentageOfProductTotal: number;
}

export interface ProductDemandSummary {
  productName: string;
  totalQuantity: number;
  primaryUnit: string;
  totalRevenue: number;
  customersCount: number;
  topCustomer?: string;
  customers: ProductCustomerDemand[];
}

/**
 * Calculates aggregated product demand for each customer across all invoices
 */
export function calculateCustomerProductDemand(invoices: Invoice[]): CustomerDemandSummary[] {
  const customerMap = new Map<string, {
    invoices: Invoice[];
    phone?: string;
    address?: string;
  }>();

  // Group invoices by customer
  invoices.forEach(inv => {
    const rawName = (inv.customerName || '').trim();
    if (!rawName) return;

    if (!customerMap.has(rawName)) {
      customerMap.set(rawName, {
        invoices: [],
        phone: inv.customerPhone,
        address: inv.customerAddress,
      });
    }

    const entry = customerMap.get(rawName)!;
    entry.invoices.push(inv);
    if (!entry.phone && inv.customerPhone) entry.phone = inv.customerPhone;
    if (!entry.address && inv.customerAddress) entry.address = inv.customerAddress;
  });

  const summaries: CustomerDemandSummary[] = [];

  customerMap.forEach((data, customerName) => {
    const productMap = new Map<string, {
      totalQty: number;
      units: Record<string, number>;
      totalAmt: number;
      prices: number[];
      ordersCount: number;
      lastDate: string;
      lastPrice: number;
    }>();

    let totalSpent = 0;
    let totalUnits = 0;
    let latestCustomerDate = '';

    // Sort customer invoices chronologically
    const sortedInvoices = [...data.invoices].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedInvoices.forEach(inv => {
      if (!latestCustomerDate || new Date(inv.date) > new Date(latestCustomerDate)) {
        latestCustomerDate = inv.date;
      }

      (inv.items || []).forEach(item => {
        const pName = (item.name || '').trim();
        if (!pName) return;

        const qty = Number(item.quantity || 0);
        const price = Number(item.unitPrice || 0);
        const itemTotal = Number(item.total || (qty * price));
        const unit = (item.unit || 'قطعة').trim();

        totalSpent += itemTotal;
        totalUnits += qty;

        if (!productMap.has(pName)) {
          productMap.set(pName, {
            totalQty: 0,
            units: {},
            totalAmt: 0,
            prices: [],
            ordersCount: 0,
            lastDate: inv.date,
            lastPrice: price,
          });
        }

        const prod = productMap.get(pName)!;
        prod.totalQty += qty;
        prod.totalAmt += itemTotal;
        prod.prices.push(price);
        prod.ordersCount += 1;
        prod.units[unit] = (prod.units[unit] || 0) + qty;
        prod.lastDate = inv.date;
        prod.lastPrice = price;
      });
    });

    const products: CustomerProductDemand[] = [];

    productMap.forEach((prodData, productName) => {
      // Find most dominant unit
      let dominantUnit = 'قطعة';
      let maxUnitCount = -1;
      Object.entries(prodData.units).forEach(([u, count]) => {
        if (count > maxUnitCount) {
          maxUnitCount = count;
          dominantUnit = u;
        }
      });

      const avgPrice = prodData.totalQty > 0 
        ? Number((prodData.totalAmt / prodData.totalQty).toFixed(2)) 
        : 0;
      const minPrice = prodData.prices.length > 0 ? Math.min(...prodData.prices) : 0;
      const maxPrice = prodData.prices.length > 0 ? Math.max(...prodData.prices) : 0;
      const pct = totalSpent > 0 ? Number(((prodData.totalAmt / totalSpent) * 100).toFixed(1)) : 0;

      products.push({
        productName,
        totalQuantity: Number(prodData.totalQty.toFixed(2)),
        unit: dominantUnit,
        totalAmount: Number(prodData.totalAmt.toFixed(2)),
        averagePrice: avgPrice,
        minPrice,
        maxPrice,
        lastPrice: prodData.lastPrice,
        ordersCount: prodData.ordersCount,
        lastOrderDate: prodData.lastDate,
        percentageOfCustomerTotal: pct,
      });
    });

    // Sort products by highest total quantity / amount
    products.sort((a, b) => b.totalQuantity - a.totalQuantity);

    const topProduct = products.length > 0 ? products[0].productName : undefined;

    summaries.push({
      customerName,
      customerPhone: data.phone,
      customerAddress: data.address,
      invoicesCount: data.invoices.length,
      totalSpent: Number(totalSpent.toFixed(2)),
      totalUnitsCount: Number(totalUnits.toFixed(2)),
      distinctProductsCount: products.length,
      topProduct,
      lastOrderDate: latestCustomerDate,
      products,
    });
  });

  // Sort customers by total spent descending
  summaries.sort((a, b) => b.totalSpent - a.totalSpent);

  return summaries;
}

/**
 * Calculates aggregated demand per product, showing which customers requested it
 */
export function calculateProductCustomerDemand(invoices: Invoice[]): ProductDemandSummary[] {
  const productMap = new Map<string, {
    totalQuantity: number;
    totalRevenue: number;
    units: Record<string, number>;
    customers: Map<string, {
      phone?: string;
      quantity: number;
      units: Record<string, number>;
      amount: number;
      ordersCount: number;
      lastDate: string;
      prices: number[];
    }>;
  }>();

  invoices.forEach(inv => {
    const cName = (inv.customerName || '').trim();
    if (!cName) return;

    (inv.items || []).forEach(item => {
      const pName = (item.name || '').trim();
      if (!pName) return;

      const qty = Number(item.quantity || 0);
      const price = Number(item.unitPrice || 0);
      const total = Number(item.total || (qty * price));
      const unit = (item.unit || 'قطعة').trim();

      if (!productMap.has(pName)) {
        productMap.set(pName, {
          totalQuantity: 0,
          totalRevenue: 0,
          units: {},
          customers: new Map(),
        });
      }

      const pEntry = productMap.get(pName)!;
      pEntry.totalQuantity += qty;
      pEntry.totalRevenue += total;
      pEntry.units[unit] = (pEntry.units[unit] || 0) + qty;

      if (!pEntry.customers.has(cName)) {
        pEntry.customers.set(cName, {
          phone: inv.customerPhone,
          quantity: 0,
          units: {},
          amount: 0,
          ordersCount: 0,
          lastDate: inv.date,
          prices: [],
        });
      }

      const cEntry = pEntry.customers.get(cName)!;
      cEntry.quantity += qty;
      cEntry.amount += total;
      cEntry.ordersCount += 1;
      cEntry.units[unit] = (cEntry.units[unit] || 0) + qty;
      cEntry.prices.push(price);
      if (new Date(inv.date) >= new Date(cEntry.lastDate)) {
        cEntry.lastDate = inv.date;
      }
      if (!cEntry.phone && inv.customerPhone) {
        cEntry.phone = inv.customerPhone;
      }
    });
  });

  const summaries: ProductDemandSummary[] = [];

  productMap.forEach((pData, productName) => {
    let dominantUnit = 'قطعة';
    let maxUnitCount = -1;
    Object.entries(pData.units).forEach(([u, count]) => {
      if (count > maxUnitCount) {
        maxUnitCount = count;
        dominantUnit = u;
      }
    });

    const customersList: ProductCustomerDemand[] = [];

    pData.customers.forEach((cData, customerName) => {
      let cDominantUnit = dominantUnit;
      let cMaxCount = -1;
      Object.entries(cData.units).forEach(([u, count]) => {
        if (count > cMaxCount) {
          cMaxCount = count;
          cDominantUnit = u;
        }
      });

      const avgPrice = cData.quantity > 0 ? Number((cData.amount / cData.quantity).toFixed(2)) : 0;
      const pct = pData.totalQuantity > 0 ? Number(((cData.quantity / pData.totalQuantity) * 100).toFixed(1)) : 0;

      customersList.push({
        customerName,
        customerPhone: cData.phone,
        quantity: Number(cData.quantity.toFixed(2)),
        unit: cDominantUnit,
        amount: Number(cData.amount.toFixed(2)),
        averagePrice: avgPrice,
        ordersCount: cData.ordersCount,
        lastOrderDate: cData.lastDate,
        percentageOfProductTotal: pct,
      });
    });

    customersList.sort((a, b) => b.quantity - a.quantity);

    summaries.push({
      productName,
      totalQuantity: Number(pData.totalQuantity.toFixed(2)),
      primaryUnit: dominantUnit,
      totalRevenue: Number(pData.totalRevenue.toFixed(2)),
      customersCount: customersList.length,
      topCustomer: customersList.length > 0 ? customersList[0].customerName : undefined,
      customers: customersList,
    });
  });

  summaries.sort((a, b) => b.totalQuantity - a.totalQuantity);

  return summaries;
}

/**
 * Export Customer Product Demand report to CSV with Arabic support (UTF-8 BOM)
 */
export function exportCustomerProductsToCSV(summaries: CustomerDemandSummary[]) {
  const headers = [
    'اسم العميل / التاجر',
    'رقم الهاتف',
    'اسم المنتج / الصنف',
    'إجمالي الكمية المطلوبة',
    'الوحدة',
    'متوسط سعر الشراء (ج.م)',
    'سعر آخر شراء (ج.م)',
    'إجمالي المبلغ المستحق (ج.م)',
    'عدد الفواتير',
    'تاريخ آخر طلب'
  ];

  const rows: string[][] = [];

  summaries.forEach(customer => {
    customer.products.forEach(p => {
      rows.push([
        `"${customer.customerName.replace(/"/g, '""')}"`,
        `"${(customer.customerPhone || '').replace(/"/g, '""')}"`,
        `"${p.productName.replace(/"/g, '""')}"`,
        p.totalQuantity.toString(),
        `"${p.unit}"`,
        p.averagePrice.toString(),
        p.lastPrice.toString(),
        p.totalAmount.toString(),
        p.ordersCount.toString(),
        p.lastOrderDate
      ]);
    });
  });

  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `تقرير_مسحوبات_العملاء_من_المنتجات_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
