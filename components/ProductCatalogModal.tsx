'use client';

import React, { useState, useMemo } from 'react';
import { ProductCatalogItem, ProductPricingTier } from '@/lib/types';
import { 
  Package, 
  X, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Save, 
  Tag, 
  TrendingUp, 
  DollarSign, 
  Factory
} from 'lucide-react';

interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductCatalogItem[];
  onSaveProducts: (products: ProductCatalogItem[]) => void;
  pricingTiers?: ProductPricingTier[];
  onSavePricingTiers?: (tiers: ProductPricingTier[]) => Promise<void>;
}

export function ProductCatalogModal({
  isOpen,
  onClose,
  products,
  onSaveProducts,
  pricingTiers = [],
  onSavePricingTiers,
}: ProductCatalogModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New item state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('منظفات');
  const [newUnit, setNewUnit] = useState('كرتونة');
  const [newFactoryPrice, setNewFactoryPrice] = useState<number | ''>('');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Edit item state
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editFactoryPrice, setEditFactoryPrice] = useState<number | ''>('');
  const [editPrice, setEditPrice] = useState<number | ''>('');

  if (!isOpen) return null;

  // Categories list for quick filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set);
  }, [products]);

  // Filtered products by search query and category
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.unit && p.unit.toLowerCase().includes(q));
      
      const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Overall Statistics Calculation
  const stats = useMemo(() => {
    let totalItems = products.length;
    let pricedItems = 0;
    let totalProfitPerUnit = 0;
    let totalMarginSum = 0;

    products.forEach(p => {
      const cost = Number(p.factoryPrice) || 0;
      const sale = Number(p.defaultPrice) || 0;
      if (cost > 0 && sale > 0) {
        pricedItems++;
        const profit = sale - cost;
        totalProfitPerUnit += profit;
        totalMarginSum += (profit / cost) * 100;
      }
    });

    const avgMargin = pricedItems > 0 ? (totalMarginSum / pricedItems).toFixed(1) : '0';
    const avgProfit = pricedItems > 0 ? Math.round(totalProfitPerUnit / pricedItems) : 0;

    return { totalItems, pricedItems, avgMargin, avgProfit };
  }, [products]);

  // Start editing a product
  const handleStartEdit = (prod: ProductCatalogItem) => {
    setEditingId(prod.id);
    setEditName(prod.name);
    setEditCategory(prod.category || 'عام');
    setEditUnit(prod.unit || 'كرتونة');
    setEditFactoryPrice(prod.factoryPrice !== undefined ? prod.factoryPrice : '');
    setEditPrice(prod.defaultPrice !== undefined ? prod.defaultPrice : '');
  };

  // Helper to sync updated product to pricing tiers
  const syncToPricingTiers = (productName: string, category: string, unit: string, factoryPrice: number, companyPrice: number) => {
    if (!onSavePricingTiers || !pricingTiers) return;
    const norm = (s: string) => (s || '').trim().toLowerCase();
    
    const existingIndex = pricingTiers.findIndex(t => 
      norm(t.productName) === norm(productName) || 
      (t.aliases && t.aliases.some(a => norm(a) === norm(productName)))
    );

    let updatedTiers = [...pricingTiers];
    if (existingIndex >= 0) {
      updatedTiers[existingIndex] = {
        ...updatedTiers[existingIndex],
        factoryPrice,
        companyPrice,
        unit: unit || updatedTiers[existingIndex].unit,
      };
    } else {
      updatedTiers.push({
        id: `tier-${Date.now()}`,
        productName: productName.trim(),
        category: category.trim() || 'عام',
        factoryPrice,
        companyPrice,
        unit: unit || 'كرتونة',
      });
    }

    onSavePricingTiers(updatedTiers).catch(err => {
      console.warn('Auto-sync pricing tiers warning:', err);
    });
  };

  // Save inline edit
  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;

    const parsedFactoryPrice = editFactoryPrice === '' ? 0 : Number(editFactoryPrice) || 0;
    const parsedDefaultPrice = editPrice === '' ? 0 : Number(editPrice) || 0;

    const updated = products.map(p => {
      if (p.id === id) {
        return {
          ...p,
          name: editName.trim(),
          category: editCategory.trim() || 'عام',
          unit: editUnit.trim() || 'كرتونة',
          factoryPrice: parsedFactoryPrice,
          defaultPrice: parsedDefaultPrice,
        };
      }
      return p;
    });

    onSaveProducts(updated);

    // Sync with pricing tiers if factory price is provided
    if (parsedFactoryPrice > 0 || parsedDefaultPrice > 0) {
      syncToPricingTiers(
        editName.trim(), 
        editCategory.trim() || 'عام', 
        editUnit.trim() || 'كرتونة', 
        parsedFactoryPrice, 
        parsedDefaultPrice
      );
    }

    setEditingId(null);
  };

  // Add new product
  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const parsedFactoryPrice = newFactoryPrice === '' ? 0 : Number(newFactoryPrice) || 0;
    const parsedDefaultPrice = newPrice === '' ? 0 : Number(newPrice) || 0;

    const newItem: ProductCatalogItem = {
      id: `p-${Date.now()}`,
      name: newName.trim(),
      category: newCategory.trim() || 'عام',
      unit: newUnit.trim() || 'كرتونة',
      factoryPrice: parsedFactoryPrice,
      defaultPrice: parsedDefaultPrice,
    };

    onSaveProducts([...products, newItem]);

    // Sync with pricing tiers
    if (parsedFactoryPrice > 0 || parsedDefaultPrice > 0) {
      syncToPricingTiers(
        newItem.name,
        newItem.category,
        newItem.unit,
        parsedFactoryPrice,
        parsedDefaultPrice
      );
    }

    // Reset form
    setNewName('');
    setNewFactoryPrice('');
    setNewPrice('');
    setIsAddingNew(false);
  };

  // Delete product
  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الصنف من الدليل؟')) {
      onSaveProducts(products.filter(p => p.id !== id));
    }
  };

  // Live calculation for the new product form
  const newFactoryNum = typeof newFactoryPrice === 'number' ? newFactoryPrice : 0;
  const newSaleNum = typeof newPrice === 'number' ? newPrice : 0;
  const newProfit = newSaleNum - newFactoryNum;
  const newMarginPct = newFactoryNum > 0 ? ((newProfit / newFactoryNum) * 100).toFixed(1) : null;

  // Live calculation for the inline edit
  const editFactoryNum = typeof editFactoryPrice === 'number' ? editFactoryPrice : 0;
  const editSaleNum = typeof editPrice === 'number' ? editPrice : 0;
  const editProfit = editSaleNum - editFactoryNum;
  const editMarginPct = editFactoryNum > 0 ? ((editProfit / editFactoryNum) * 100).toFixed(1) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <Package className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  دليل الأصناف وتحديد أسعار المصنع والبيع
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  حساب الأرباح التلقائي
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                حدد سعر المصنع (التكلفة) وسعر البيع لكل صنف لمعرفة صافي ربح الكرتونة وهامش المكسب بدقة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Analytics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-slate-100/60 border-b border-slate-200 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 block mb-0.5">إجمالي الأصناف بالدليل</span>
            <span className="text-base font-extrabold text-slate-900">{stats.totalItems} صنف</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 block mb-0.5">أصناف محدد سعرها</span>
            <span className="text-base font-extrabold text-cyan-700">{stats.pricedItems} صنف</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 block mb-0.5">متوسط مكسب الكرتونة</span>
            <span className="text-base font-extrabold text-emerald-700">+{stats.avgProfit.toLocaleString()} ج.م</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 block mb-0.5">متوسط نسبة هامش الربح</span>
            <span className="text-base font-extrabold text-amber-600">+{stats.avgMargin}%</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Top Bar: Search, Category Filters, & Add Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="ابحث عن صنف أو فئة (مثال: سيترس، معطر، منعم)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
              />
            </div>

            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>{isAddingNew ? 'إلغاء الإضافة' : 'إضافة صنف جديد'}</span>
            </button>
          </div>

          {/* Quick Category Filter Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({products.length})
              </button>
              {categories.map(cat => {
                const count = products.filter(p => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Add New Product Form */}
          {isAddingNew && (
            <form onSubmit={handleAddNew} className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-600" />
                  <span>إضافة منتج جديد وتحديد أسعار المصنع والبيع</span>
                </div>
                <span className="text-[11px] text-slate-500">حقول مميزة لحساب الربح تلقائياً</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {/* Product Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الصنف / المنتج *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: سيترس مصري أو GC معطر"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">التصنيف</label>
                  <input
                    type="text"
                    placeholder="مثال: منظفات، سيترس"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الوحدة</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="كرتونة">كرتونة</option>
                    <option value="عبوة">عبوة</option>
                    <option value="لتر">لتر</option>
                    <option value="قطعة">قطعة</option>
                    <option value="دسته">دسته</option>
                  </select>
                </div>

                {/* Factory Price */}
                <div>
                  <label className="block text-xs font-semibold text-cyan-800 mb-1 flex items-center gap-1">
                    <Factory className="w-3.5 h-3.5 text-cyan-600" />
                    <span>سعر المصنع (التكلفة)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={newFactoryPrice}
                    onChange={(e) => setNewFactoryPrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-bold text-cyan-800 bg-cyan-50/50 border border-cyan-300 rounded-xl focus:ring-2 focus:ring-cyan-500 font-mono"
                  />
                </div>

                {/* Sale Price */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>سعر البيع الافتراضي للتاجر *</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-bold text-emerald-800 bg-emerald-50/50 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {/* Live Profit & Margin Indicator */}
                <div className="sm:col-span-3 flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-700">مكسب الكرتونة المتوقع:</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {newSaleNum > 0 || newFactoryNum > 0 ? (
                      <>
                        <span className={`text-sm font-extrabold font-mono ${
                          newProfit > 0 ? 'text-emerald-700' : newProfit < 0 ? 'text-rose-600' : 'text-slate-600'
                        }`}>
                          {newProfit > 0 ? `+${newProfit.toLocaleString()} ج.م` : `${newProfit.toLocaleString()} ج.م`}
                        </span>
                        {newMarginPct !== null && (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            Number(newMarginPct) > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            ({newMarginPct}%)
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">أدخل الأسعار لعرض المكسب</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-amber-200/60">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ الصنف والأسعار</span>
                </button>
              </div>
            </form>
          )}

          {/* Products List Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-100 text-slate-700 text-xs font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-8">#</th>
                    <th className="py-3 px-4">اسم المنتج</th>
                    <th className="py-3 px-3">التصنيف</th>
                    <th className="py-3 px-3">الوحدة</th>
                    <th className="py-3 px-3 text-cyan-800 bg-cyan-50/40">سعر المصنع (التكلفة)</th>
                    <th className="py-3 px-3 text-emerald-800 bg-emerald-50/40">سعر البيع للتاجر</th>
                    <th className="py-3 px-4 text-emerald-700 bg-emerald-50/60 font-extrabold">مكسب الكرتونة / الهامش</th>
                    <th className="py-3 px-3 text-center w-24">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        {searchQuery ? 'لا توجد أصناف مطابقة لكلمة البحث.' : 'لا توجد أصناف في الدليل حالياً.'}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod, idx) => {
                      const isEditing = editingId === prod.id;
                      const factoryPrice = prod.factoryPrice ?? 0;
                      const salePrice = prod.defaultPrice ?? 0;
                      const profit = salePrice - factoryPrice;
                      const marginPct = factoryPrice > 0 ? ((profit / factoryPrice) * 100).toFixed(1) : null;

                      return (
                        <tr key={prod.id} className={`transition-colors ${isEditing ? 'bg-amber-50/40' : 'hover:bg-slate-50/70'}`}>
                          <td className="py-3 px-3 text-xs text-slate-400 font-bold">{idx + 1}</td>

                          {/* Product Name */}
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-2.5 py-1 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                              />
                            ) : (
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{prod.name}</span>
                              </div>
                            )}
                          </td>

                          {/* Category */}
                          <td className="py-3 px-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="w-24 px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg"
                              />
                            ) : (
                              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium whitespace-nowrap">
                                {prod.category || 'عام'}
                              </span>
                            )}
                          </td>

                          {/* Unit */}
                          <td className="py-3 px-3">
                            {isEditing ? (
                              <select
                                value={editUnit}
                                onChange={(e) => setEditUnit(e.target.value)}
                                className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg"
                              >
                                <option value="كرتونة">كرتونة</option>
                                <option value="عبوة">عبوة</option>
                                <option value="لتر">لتر</option>
                                <option value="قطعة">قطعة</option>
                                <option value="دسته">دسته</option>
                              </select>
                            ) : (
                              <span className="text-xs text-slate-600 font-medium">
                                {prod.unit || 'كرتونة'}
                              </span>
                            )}
                          </td>

                          {/* Factory Price */}
                          <td className="py-3 px-3 bg-cyan-50/20">
                            {isEditing ? (
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={editFactoryPrice}
                                placeholder="0"
                                onChange={(e) => setEditFactoryPrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 text-xs sm:text-sm font-bold text-cyan-800 bg-cyan-50 border border-cyan-300 rounded-lg font-mono text-center"
                              />
                            ) : (
                              <div className="font-bold font-mono text-cyan-800 text-xs sm:text-sm">
                                {factoryPrice > 0 ? (
                                  <span>{factoryPrice.toLocaleString()} ج.م</span>
                                ) : (
                                  <span className="text-slate-400 font-sans text-xs">غير محدد</span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Sale Price */}
                          <td className="py-3 px-3 bg-emerald-50/20">
                            {isEditing ? (
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={editPrice}
                                placeholder="0"
                                onChange={(e) => setEditPrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg font-mono text-center"
                              />
                            ) : (
                              <div className="font-bold font-mono text-emerald-700 text-xs sm:text-sm">
                                {salePrice > 0 ? (
                                  <span>{salePrice.toLocaleString()} ج.م</span>
                                ) : (
                                  <span className="text-slate-400 font-sans text-xs">غير محدد</span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Profit & Margin */}
                          <td className="py-3 px-4 bg-emerald-50/40">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 font-mono text-xs">
                                <span className={`font-bold ${
                                  editProfit > 0 ? 'text-emerald-700' : editProfit < 0 ? 'text-rose-600' : 'text-slate-500'
                                }`}>
                                  {editProfit > 0 ? `+${editProfit.toLocaleString()}` : editProfit.toLocaleString()} ج.م
                                </span>
                                {editMarginPct !== null && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold ${
                                    Number(editMarginPct) > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {editMarginPct}%
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div>
                                {factoryPrice > 0 && salePrice > 0 ? (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`font-extrabold font-mono text-xs sm:text-sm ${
                                      profit > 0 ? 'text-emerald-700' : profit < 0 ? 'text-rose-600' : 'text-slate-500'
                                    }`}>
                                      {profit > 0 ? `+${profit.toLocaleString()} ج.م` : `${profit.toLocaleString()} ج.م`}
                                    </span>
                                    {marginPct !== null && (
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold font-mono ${
                                        Number(marginPct) > 0 
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                                      }`}>
                                        +{marginPct}%
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(prod)}
                                    className="text-[11px] text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 font-semibold cursor-pointer"
                                  >
                                    + حدد الأسعار لحساب الربح
                                  </button>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {isEditing ? (
                                <button
                                  onClick={() => handleSaveEdit(prod.id)}
                                  className="p-1.5 text-emerald-700 hover:bg-emerald-100 bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                  title="حفظ التعديل"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStartEdit(prod)}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="تعديل الأسعار"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(prod.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="حذف الصنف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <span>إجمالي الأصناف: <strong className="text-slate-900">{products.length} صنف</strong></span>
            <span>•</span>
            <span className="text-emerald-700">الأسعار تُحفظ سحابياً في Firebase وتُستخدم تلقائياً في حساب مكسب الفواتير</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
