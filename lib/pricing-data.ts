import { 
  ProductPricingTier, 
  Invoice, 
  InvoiceItem, 
  InvoiceProfitBreakdown, 
  ItemProfitCalculation,
  CourierSettlement,
  CourierProfitBreakdown,
  CourierItemProfitCalculation
} from './types';

export const DEFAULT_PRICING_TIERS: ProductPricingTier[] = [
  {
    id: 'tier-citrus-us',
    productName: 'سيترس أمريكي',
    category: 'منتجات سيترس',
    factoryPrice: 525,
    companyPrice: 675,
    unit: 'كرتونة',
    aliases: ['سيترس الأمريكي', 'سيترس امريكي', 'السيترس الامريكي', 'citrus us', 'citrus usa'],
  },
  {
    id: 'tier-citrus-eg',
    productName: 'سيترس مصري',
    category: 'منتجات سيترس',
    factoryPrice: 490,
    companyPrice: 650,
    unit: 'كرتونة',
    aliases: ['سيترس مصر', 'سيترس المصري', 'السيترس المصري', 'citrus egypt', 'citrus eg'],
  },
  {
    id: 'tier-gc-remover',
    productName: 'GC المزيل الشامل',
    category: 'منتجات GC',
    factoryPrice: 525,
    companyPrice: 725,
    unit: 'كرتونة',
    aliases: ['جي سي المزيل الشامل', 'مزيل شامل جي سي', 'GC مزيل شامل', 'المزيل الشامل gc', 'مزيل شامل'],
  },
  {
    id: 'tier-gc-air-freshener',
    productName: 'GC معطر الجو والمفروشات',
    category: 'منتجات GC',
    factoryPrice: 550,
    companyPrice: 710,
    unit: 'كرتونة',
    aliases: ['جي سي معطر', 'معطر جي سي', 'GC معطر', 'معطر الجو والمفروشات gc', 'جي سي معطر جو'],
  },
  {
    id: 'tier-gc-detoxy',
    productName: 'GC ديتوكسي',
    category: 'منتجات GC',
    factoryPrice: 480,
    companyPrice: 610,
    unit: 'كرتونة',
    aliases: ['ديتوكسي', 'جي سي ديتوكسي', 'ديتوكسي gc', 'detoxy'],
  },
  {
    id: 'tier-gc-softener-1l',
    productName: 'GC منعم ومعطر الملابس – 1 لتر',
    category: 'منتجات GC',
    factoryPrice: 375,
    companyPrice: 575,
    unit: 'كرتونة',
    aliases: ['منعم جي سي (1 لتر)', 'منعم جي سي 1 لتر', 'منعم gc 1 لتر', 'GC منعم 1 لتر', 'منعم 1 لتر'],
  },
  {
    id: 'tier-gc-softener-3l',
    productName: 'GC منعم ومعطر الملابس – 3 لتر',
    category: 'منتجات GC',
    factoryPrice: 375,
    companyPrice: 525,
    unit: 'كرتونة',
    aliases: ['منعم (3 لتر)', 'منعم 3 لتر', 'منعم جي سي (3 لتر)', 'منعم جي سي 3 لتر', 'GC منعم 3 لتر'],
  },
  {
    id: 'tier-aq-freshener',
    productName: 'AQ معطر جو',
    category: 'منتجات AQ',
    factoryPrice: 390,
    companyPrice: 450,
    unit: 'كرتونة',
    aliases: ['معطر AQ', 'معطر aq', 'معطر ايه كيو', 'AQ معطر', 'ايه كيو معطر جو'],
  },
  {
    id: 'tier-aq-softener',
    productName: 'AQ منعم ملابس – 2 لتر',
    category: 'منتجات AQ',
    factoryPrice: 370,
    companyPrice: 420,
    unit: 'كرتونة',
    aliases: ['منعم AQ', 'منعم aq', 'منعم ايه كيو', 'AQ منعم ملابس', 'منعم aq 2 لتر'],
  },
];

/**
 * Normalizes text for robust product matching
 */
function normalizeName(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // remove Arabic diacritics
    .replace(/[–—\-–]/g, ' ')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find matching pricing tier for a product name by exact or alias matching
 */
export function findPricingTier(productName: string, tiers: ProductPricingTier[]): ProductPricingTier | null {
  if (!productName) return null;
  const normalizedSearch = normalizeName(productName);

  // 1. Exact match on normalized product name
  for (const tier of tiers) {
    if (normalizeName(tier.productName) === normalizedSearch) {
      return tier;
    }
  }

  // 2. Alias match
  for (const tier of tiers) {
    if (tier.aliases) {
      for (const alias of tier.aliases) {
        if (normalizeName(alias) === normalizedSearch) {
          return tier;
        }
      }
    }
  }

  // 3. Substring / keyword fuzzy match
  for (const tier of tiers) {
    const tierNorm = normalizeName(tier.productName);
    if (normalizedSearch.includes(tierNorm) || tierNorm.includes(normalizedSearch)) {
      return tier;
    }
    if (tier.aliases) {
      for (const alias of tier.aliases) {
        const aliasNorm = normalizeName(alias);
        if (normalizedSearch.includes(aliasNorm) || aliasNorm.includes(normalizedSearch)) {
          return tier;
        }
      }
    }
  }

  return null;
}

/**
 * Calculate item profit breakdown based on pricing tiers
 */
export function calculateItemProfit(
  item: InvoiceItem, 
  tiers: ProductPricingTier[], 
  paidRatio: number = 1
): ItemProfitCalculation {
  const tier = findPricingTier(item.name, tiers);
  const qty = Number(item.quantity) || 0;
  const merchantUnitPrice = Number(item.unitPrice) || 0;
  
  // Default to merchant price if tier not found, or standard fallback
  const factoryUnitPrice = tier ? tier.factoryPrice : merchantUnitPrice * 0.7;
  const companyUnitPrice = tier ? tier.companyPrice : merchantUnitPrice * 0.85;

  const merchantRevenueTotal = Number((qty * merchantUnitPrice).toFixed(2));
  const companyCostTotal = Number((qty * companyUnitPrice).toFixed(2));
  const factoryCostTotal = Number((qty * factoryUnitPrice).toFixed(2));

  // Invoiced Profits
  const companyProfitTotal = Number((merchantRevenueTotal - companyCostTotal).toFixed(2));
  const factoryToCompanyProfitTotal = Number((companyCostTotal - factoryCostTotal).toFixed(2));
  const totalProfit = Number((merchantRevenueTotal - factoryCostTotal).toFixed(2));

  // Realized portions (proportional to collected payment ratio)
  const safeRatio = Math.max(0, Math.min(1, paidRatio));
  const realizedMerchantRevenue = Number((merchantRevenueTotal * safeRatio).toFixed(2));
  const realizedCompanyCost = Number((companyCostTotal * safeRatio).toFixed(2));
  const realizedFactoryCost = Number((factoryCostTotal * safeRatio).toFixed(2));
  const realizedCompanyProfit = Number((companyProfitTotal * safeRatio).toFixed(2));
  const realizedFactoryToCompanyProfit = Number((factoryToCompanyProfitTotal * safeRatio).toFixed(2));
  const realizedTotalProfit = Number((totalProfit * safeRatio).toFixed(2));

  // Pending / Unrealized portions
  const pendingTotalProfit = Number((totalProfit - realizedTotalProfit).toFixed(2));
  const pendingCompanyProfit = Number((companyProfitTotal - realizedCompanyProfit).toFixed(2));
  const pendingFactoryProfit = Number((factoryToCompanyProfitTotal - realizedFactoryToCompanyProfit).toFixed(2));

  return {
    itemId: item.id,
    productName: item.name,
    unit: item.unit || 'كرتونة',
    quantity: qty,
    merchantUnitPrice,
    companyUnitPrice,
    factoryUnitPrice,
    merchantRevenueTotal,
    companyCostTotal,
    factoryCostTotal,
    companyProfitTotal,
    factoryToCompanyProfitTotal,
    totalProfit,
    paidRatio: safeRatio,
    realizedMerchantRevenue,
    realizedCompanyCost,
    realizedFactoryCost,
    realizedCompanyProfit,
    realizedFactoryToCompanyProfit,
    realizedTotalProfit,
    pendingTotalProfit,
    pendingCompanyProfit,
    pendingFactoryProfit,
  };
}

/**
 * Calculate invoice profit breakdown
 */
export function calculateInvoiceProfit(invoice: Invoice, tiers: ProductPricingTier[]): InvoiceProfitBreakdown {
  const totalAmount = Number(invoice.totalAmount) || 0;
  const paidAmount = Number(invoice.paidAmount) || 0;
  const remainingAmount = Number(invoice.remainingAmount ?? Math.max(0, totalAmount - paidAmount)) || 0;
  
  let paidRatio = 0;
  if (totalAmount > 0) {
    paidRatio = Math.min(1, Math.max(0, paidAmount / totalAmount));
  } else if (paidAmount > 0) {
    paidRatio = 1;
  }

  const itemsProfit = (invoice.items || []).map(it => calculateItemProfit(it, tiers, paidRatio));

  const invoiceMerchantRevenue = Number(itemsProfit.reduce((sum, it) => sum + it.merchantRevenueTotal, 0).toFixed(2));
  const invoiceCompanyCost = Number(itemsProfit.reduce((sum, it) => sum + it.companyCostTotal, 0).toFixed(2));
  const invoiceFactoryCost = Number(itemsProfit.reduce((sum, it) => sum + it.factoryCostTotal, 0).toFixed(2));

  const invoiceCompanyProfit = Number((invoiceMerchantRevenue - invoiceCompanyCost).toFixed(2));
  const invoiceFactoryToCompanyProfit = Number((invoiceCompanyCost - invoiceFactoryCost).toFixed(2));
  const invoiceTotalProfit = Number((invoiceMerchantRevenue - invoiceFactoryCost).toFixed(2));

  // Realized totals from collected payments
  const realizedMerchantRevenue = Number(itemsProfit.reduce((sum, it) => sum + it.realizedMerchantRevenue, 0).toFixed(2));
  const realizedCompanyCost = Number(itemsProfit.reduce((sum, it) => sum + it.realizedCompanyCost, 0).toFixed(2));
  const realizedFactoryCost = Number(itemsProfit.reduce((sum, it) => sum + it.realizedFactoryCost, 0).toFixed(2));
  const realizedCompanyProfit = Number(itemsProfit.reduce((sum, it) => sum + it.realizedCompanyProfit, 0).toFixed(2));
  const realizedFactoryToCompanyProfit = Number(itemsProfit.reduce((sum, it) => sum + it.realizedFactoryToCompanyProfit, 0).toFixed(2));
  const realizedTotalProfit = Number(itemsProfit.reduce((sum, it) => sum + it.realizedTotalProfit, 0).toFixed(2));

  // Pending totals (remaining debt / pending profits)
  const pendingTotalProfit = Number((invoiceTotalProfit - realizedTotalProfit).toFixed(2));
  const pendingCompanyProfit = Number((invoiceCompanyProfit - realizedCompanyProfit).toFixed(2));
  const pendingFactoryProfit = Number((invoiceFactoryToCompanyProfit - realizedFactoryToCompanyProfit).toFixed(2));

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    date: invoice.date,
    customerName: invoice.customerName || 'عميل غير محدد',
    items: itemsProfit,
    invoiceMerchantRevenue,
    invoiceCompanyCost,
    invoiceFactoryCost,
    invoiceCompanyProfit,
    invoiceFactoryToCompanyProfit,
    invoiceTotalProfit,
    totalAmount,
    paidAmount,
    remainingAmount,
    paidRatio,
    paymentStatus: invoice.status || (remainingAmount <= 0.01 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID'),
    realizedMerchantRevenue,
    realizedCompanyCost,
    realizedFactoryCost,
    realizedCompanyProfit,
    realizedFactoryToCompanyProfit,
    realizedTotalProfit,
    pendingTotalProfit,
    pendingCompanyProfit,
    pendingFactoryProfit,
  };
}

/**
 * Calculate profit breakdown for a Courier / Retail settlement
 */
export function calculateCourierSettlementProfit(
  settlement: CourierSettlement, 
  tiers: ProductPricingTier[]
): CourierProfitBreakdown {
  const totalRetailValue = Number(settlement.totalOrderValue) || 
    (settlement.items || []).reduce((sum, it) => sum + (Number(it.quantity) * Number(it.retailUnitPrice)), 0);
  const collectedCash = Number(settlement.collectedCash) || 0;
  const shippingFeeDeducted = Number(settlement.shippingFeeDeducted) || 0;
  const netCashReceived = Number(settlement.netCashReceived ?? Math.max(0, collectedCash - shippingFeeDeducted));

  let paidRatio = 1;
  if (totalRetailValue > 0) {
    paidRatio = Math.min(1, Math.max(0, collectedCash / totalRetailValue));
  }

  const itemsCalculations: CourierItemProfitCalculation[] = (settlement.items || []).map(it => {
    const tier = findPricingTier(it.productName, tiers);
    const qty = Number(it.quantity) || 0;
    const retailUnitPrice = Number(it.retailUnitPrice) || 0;
    const retailRevenueTotal = Number((qty * retailUnitPrice).toFixed(2));
    
    // Check unit: piece vs carton
    let unitMultiplier = 1;
    if (it.unit === 'قطعة') {
      const pieces = it.piecesPerCarton && it.piecesPerCarton > 0 ? it.piecesPerCarton : 12;
      unitMultiplier = 1 / pieces;
    }

    const factoryCostPerUnit = tier ? tier.factoryPrice * unitMultiplier : retailUnitPrice * 0.5;
    const companyCostPerUnit = tier ? tier.companyPrice * unitMultiplier : retailUnitPrice * 0.7;

    const factoryCostTotal = Number((qty * factoryCostPerUnit).toFixed(2));
    const companyCostTotal = Number((qty * companyCostPerUnit).toFixed(2));

    const companyProfitTotal = Number((retailRevenueTotal - companyCostTotal).toFixed(2));
    const factoryProfitTotal = Number((companyCostTotal - factoryCostTotal).toFixed(2));
    const totalProfit = Number((retailRevenueTotal - factoryCostTotal).toFixed(2));

    // Realized portions
    const realizedRetailRevenue = Number((retailRevenueTotal * paidRatio).toFixed(2));
    const realizedCompanyCost = Number((companyCostTotal * paidRatio).toFixed(2));
    const realizedFactoryCost = Number((factoryCostTotal * paidRatio).toFixed(2));
    const realizedCompanyProfit = Number((companyProfitTotal * paidRatio).toFixed(2));
    const realizedFactoryProfit = Number((factoryProfitTotal * paidRatio).toFixed(2));
    const realizedTotalProfit = Number((totalProfit * paidRatio).toFixed(2));

    return {
      itemId: it.id,
      productName: it.productName,
      unit: it.unit || 'قطعة',
      quantity: qty,
      retailUnitPrice,
      retailRevenueTotal,
      factoryCostTotal,
      companyCostTotal,
      companyProfitTotal,
      factoryProfitTotal,
      totalProfit,
      paidRatio,
      realizedRetailRevenue,
      realizedCompanyCost,
      realizedFactoryCost,
      realizedCompanyProfit,
      realizedFactoryProfit,
      realizedTotalProfit,
    };
  });

  const totalFactoryCost = Number(itemsCalculations.reduce((sum, it) => sum + it.factoryCostTotal, 0).toFixed(2));
  const totalCompanyCost = Number(itemsCalculations.reduce((sum, it) => sum + it.companyCostTotal, 0).toFixed(2));
  
  const realizedCompanyProfit = Number(itemsCalculations.reduce((sum, it) => sum + it.realizedCompanyProfit, 0).toFixed(2));
  const realizedFactoryProfit = Number(itemsCalculations.reduce((sum, it) => sum + it.realizedFactoryProfit, 0).toFixed(2));
  
  // Net profit in pocket after deducting shipping company commission/fee
  const realizedTotalProfit = Number(Math.max(0, (itemsCalculations.reduce((sum, it) => sum + it.realizedTotalProfit, 0) - shippingFeeDeducted)).toFixed(2));

  return {
    settlementId: settlement.id,
    courierName: settlement.courierName || 'شركة الشحن',
    manifestNumber: settlement.manifestNumber || 'كشف بدون رقم',
    date: settlement.date,
    collectedCash,
    shippingFeeDeducted,
    netCashReceived,
    totalRetailValue,
    totalFactoryCost,
    totalCompanyCost,
    paidRatio,
    realizedCompanyProfit,
    realizedFactoryProfit,
    realizedTotalProfit,
    items: itemsCalculations,
  };
}

