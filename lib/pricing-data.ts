import { ProductPricingTier, Invoice, InvoiceItem, InvoiceProfitBreakdown, ItemProfitCalculation } from './types';

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
export function calculateItemProfit(item: InvoiceItem, tiers: ProductPricingTier[]): ItemProfitCalculation {
  const tier = findPricingTier(item.name, tiers);
  const qty = Number(item.quantity) || 0;
  const merchantUnitPrice = Number(item.unitPrice) || 0;
  
  // Default to merchant price if tier not found, or standard fallback
  const factoryUnitPrice = tier ? tier.factoryPrice : merchantUnitPrice * 0.7;
  const companyUnitPrice = tier ? tier.companyPrice : merchantUnitPrice * 0.85;

  const merchantRevenueTotal = Number((qty * merchantUnitPrice).toFixed(2));
  const companyCostTotal = Number((qty * companyUnitPrice).toFixed(2));
  const factoryCostTotal = Number((qty * factoryUnitPrice).toFixed(2));

  // Profits
  const companyProfitTotal = Number((merchantRevenueTotal - companyCostTotal).toFixed(2));
  const factoryToCompanyProfitTotal = Number((companyCostTotal - factoryCostTotal).toFixed(2));
  const totalProfit = Number((merchantRevenueTotal - factoryCostTotal).toFixed(2));

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
  };
}

/**
 * Calculate invoice profit breakdown
 */
export function calculateInvoiceProfit(invoice: Invoice, tiers: ProductPricingTier[]): InvoiceProfitBreakdown {
  const itemsProfit = (invoice.items || []).map(it => calculateItemProfit(it, tiers));

  const invoiceMerchantRevenue = itemsProfit.reduce((sum, it) => sum + it.merchantRevenueTotal, 0);
  const invoiceCompanyCost = itemsProfit.reduce((sum, it) => sum + it.companyCostTotal, 0);
  const invoiceFactoryCost = itemsProfit.reduce((sum, it) => sum + it.factoryCostTotal, 0);

  const invoiceCompanyProfit = Number((invoiceMerchantRevenue - invoiceCompanyCost).toFixed(2));
  const invoiceFactoryToCompanyProfit = Number((invoiceCompanyCost - invoiceFactoryCost).toFixed(2));
  const invoiceTotalProfit = Number((invoiceMerchantRevenue - invoiceFactoryCost).toFixed(2));

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
  };
}
