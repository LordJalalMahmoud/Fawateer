import { Invoice, ProductCatalogItem } from './types';

// Predefined official product catalog
export const OFFICIAL_PRODUCTS: ProductCatalogItem[] = [
  // منتجات GC
  { id: 'prod-gc-1', name: 'GC المزيل الشامل', category: 'منتجات GC', unit: 'كرتونة', factoryPrice: 525, defaultPrice: 725 },
  { id: 'prod-gc-2', name: 'GC منعم ومعطر الملابس – 1 لتر', category: 'منتجات GC', unit: 'كرتونة', factoryPrice: 375, defaultPrice: 575 },
  { id: 'prod-gc-3', name: 'GC منعم ومعطر الملابس – 3 لتر', category: 'منتجات GC', unit: 'كرتونة', factoryPrice: 375, defaultPrice: 525 },
  { id: 'prod-gc-4', name: 'GC معطر الجو والمفروشات', category: 'منتجات GC', unit: 'كرتونة', factoryPrice: 550, defaultPrice: 710 },
  { id: 'prod-gc-5', name: 'GC ديتوكسي', category: 'منتجات GC', unit: 'كرتونة', factoryPrice: 480, defaultPrice: 610 },

  // منتجات AQ
  { id: 'prod-aq-1', name: 'AQ معطر جو', category: 'منتجات AQ', unit: 'كرتونة', factoryPrice: 390, defaultPrice: 450 },
  { id: 'prod-aq-2', name: 'AQ منعم ملابس – 2 لتر', category: 'منتجات AQ', unit: 'كرتونة', factoryPrice: 370, defaultPrice: 420 },

  // منتجات سيترس
  { id: 'prod-cit-1', name: 'سيترس مصر', category: 'منتجات سيترس', unit: 'كرتونة', factoryPrice: 490, defaultPrice: 650 },
  { id: 'prod-cit-2', name: 'سيترس أمريكي', category: 'منتجات سيترس', unit: 'كرتونة', factoryPrice: 525, defaultPrice: 675 },
];

export const INITIAL_PRODUCTS: ProductCatalogItem[] = OFFICIAL_PRODUCTS;

export const INITIAL_INVOICES: Invoice[] = [];
