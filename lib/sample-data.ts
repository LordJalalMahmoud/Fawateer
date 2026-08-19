import { Invoice, ProductCatalogItem } from './types';

// Predefined official product catalog
export const OFFICIAL_PRODUCTS: ProductCatalogItem[] = [
  // منتجات GC
  { id: 'prod-gc-1', name: 'GC المزيل الشامل', category: 'منتجات GC', unit: 'كرتونة', defaultPrice: 0 },
  { id: 'prod-gc-2', name: 'GC منعم ومعطر الملابس – 1 لتر', category: 'منتجات GC', unit: 'كرتونة', defaultPrice: 0 },
  { id: 'prod-gc-3', name: 'GC منعم ومعطر الملابس – 3 لتر', category: 'منتجات GC', unit: 'كرتونة', defaultPrice: 0 },
  { id: 'prod-gc-4', name: 'GC معطر الجو والمفروشات', category: 'منتجات GC', unit: 'كرتونة', defaultPrice: 0 },
  { id: 'prod-gc-5', name: 'GC ديتوكسي', category: 'منتجات GC', unit: 'كرتونة', defaultPrice: 0 },

  // منتجات AQ
  { id: 'prod-aq-1', name: 'AQ معطر جو', category: 'منتجات AQ', unit: 'كرتونة', defaultPrice: 0 },
  { id: 'prod-aq-2', name: 'AQ منعم ملابس – 2 لتر', category: 'منتجات AQ', unit: 'كرتونة', defaultPrice: 0 },

  // منتجات سيترس
  { id: 'prod-cit-1', name: 'سيترس مصر', category: 'منتجات سيترس', unit: 'كرتونة', defaultPrice: 0 },
  { id: 'prod-cit-2', name: 'سيترس أمريكي', category: 'منتجات سيترس', unit: 'كرتونة', defaultPrice: 0 },
];

export const INITIAL_PRODUCTS: ProductCatalogItem[] = OFFICIAL_PRODUCTS;

export const INITIAL_INVOICES: Invoice[] = [];
