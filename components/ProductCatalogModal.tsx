'use client';

import React, { useState } from 'react';
import { ProductCatalogItem } from '@/lib/types';
import { 
  Package, 
  X, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Save, 
  Check, 
  Tag
} from 'lucide-react';

interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductCatalogItem[];
  onSaveProducts: (products: ProductCatalogItem[]) => void;
}

export function ProductCatalogModal({
  isOpen,
  onClose,
  products,
  onSaveProducts,
}: ProductCatalogModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New item state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('منظفات');
  const [newUnit, setNewUnit] = useState('كرتونة');
  const [newPrice, setNewPrice] = useState<number>(0);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Edit item state
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);

  if (!isOpen) return null;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleStartEdit = (prod: ProductCatalogItem) => {
    setEditingId(prod.id);
    setEditName(prod.name);
    setEditCategory(prod.category);
    setEditUnit(prod.unit);
    setEditPrice(prod.defaultPrice);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    const updated = products.map(p => {
      if (p.id === id) {
        return {
          ...p,
          name: editName.trim(),
          category: editCategory.trim() || 'عام',
          unit: editUnit.trim() || 'كرتونة',
          defaultPrice: Number(editPrice) || 0,
        };
      }
      return p;
    });
    onSaveProducts(updated);
    setEditingId(null);
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newItem: ProductCatalogItem = {
      id: `p-${Date.now()}`,
      name: newName.trim(),
      category: newCategory.trim() || 'عام',
      unit: newUnit.trim() || 'كرتونة',
      defaultPrice: Number(newPrice) || 0,
    };

    onSaveProducts([...products, newItem]);
    setNewName('');
    setNewPrice(0);
    setIsAddingNew(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الصنف من الدليل؟')) {
      onSaveProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                دليل الأصناف والأسعار الافتراضية
              </h2>
              <p className="text-xs text-slate-500">
                قائمة المنتجات وأسعار الكرتونة الافتراضية للتعبئة التلقائية السريعة في الفواتير
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Top Bar: Search & Add Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="ابحث عن صنف أو فئة (مثال: سيترس، معطر، منعم)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>

            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة صنف جديد</span>
            </button>
          </div>

          {/* Add New Form */}
          {isAddingNew && (
            <form onSubmit={handleAddNew} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-200">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>إضافة منتج جديد للدليل</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-600 mb-1">اسم الصنف / المنتج *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: كلوركس أبيض 1 لتر"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">الوحدة</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="كرتونة">كرتونة</option>
                    <option value="عبوة">عبوة</option>
                    <option value="لتر">لتر</option>
                    <option value="قطعة">قطعة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">سعر الوحدة (ج.م) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={newPrice || ''}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-sm font-bold text-emerald-700 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  حفظ الصنف
                </button>
              </div>
            </form>
          )}

          {/* Products List Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-100/80 text-slate-700 text-xs font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-8">#</th>
                  <th className="py-2.5 px-4">اسم المنتج</th>
                  <th className="py-2.5 px-3">الوحدة</th>
                  <th className="py-2.5 px-4">السعر الافتراضي</th>
                  <th className="py-2.5 px-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod, idx) => {
                  const isEditing = editingId === prod.id;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-xs text-slate-400 font-bold">{idx + 1}</td>

                      {/* Name */}
                      <td className="py-2.5 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded-md"
                          />
                        ) : (
                          <div className="font-bold text-slate-900">{prod.name}</div>
                        )}
                      </td>

                      {/* Unit */}
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <select
                            value={editUnit}
                            onChange={(e) => setEditUnit(e.target.value)}
                            className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-md"
                          >
                            <option value="كرتونة">كرتونة</option>
                            <option value="عبوة">عبوة</option>
                            <option value="لتر">لتر</option>
                            <option value="قطعة">قطعة</option>
                          </select>
                        ) : (
                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">
                            {prod.unit}
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="py-2.5 px-4">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={editPrice}
                            onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 text-sm font-bold text-emerald-700 bg-white border border-slate-300 rounded-md"
                          />
                        ) : (
                          <div className="font-bold text-emerald-700">{prod.defaultPrice.toLocaleString()} ج.م</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isEditing ? (
                            <button
                              onClick={() => handleSaveEdit(prod.id)}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                              title="حفظ التعديل"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(prod)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              title="تعديل السعر"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(prod.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="حذف الصنف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            إجمالي الأصناف بالدليل: <strong className="text-slate-900">{products.length} صنف</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
