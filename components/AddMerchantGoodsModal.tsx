'use client';

import React, { useState } from 'react';
import { Invoice, InvoiceItem, PaymentStatus, ProductCatalogItem } from '@/lib/types';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Package, 
  CreditCard,
  Building2
} from 'lucide-react';

interface AddMerchantGoodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchantName: string;
  defaultPhone?: string;
  defaultAddress?: string;
  existingInvoices: Invoice[];
  productCatalog: ProductCatalogItem[];
  onSaveDelivery: (invoice: Invoice) => void;
}

let itemCounter = 0;
function createEmptyItem(): InvoiceItem {
  itemCounter += 1;
  return {
    id: `item-${itemCounter}`,
    name: 'GC المزيل الشامل',
    unit: 'كرتونة',
    quantity: 1,
    unitPrice: 0,
    total: 0,
  };
}

let delivCounter = 0;
function generateDeliveryId(nextNum: number): string {
  delivCounter += 1;
  return `deliv-${nextNum}-${delivCounter}`;
}

const PREDEFINED_PRODUCTS = [
  { category: 'منتجات GC', name: 'GC المزيل الشامل', defaultUnit: 'كرتونة' },
  { category: 'منتجات GC', name: 'GC منعم ومعطر الملابس – 1 لتر', defaultUnit: 'كرتونة' },
  { category: 'منتجات GC', name: 'GC منعم ومعطر الملابس – 3 لتر', defaultUnit: 'كرتونة' },
  { category: 'منتجات GC', name: 'GC معطر الجو والمفروشات', defaultUnit: 'كرتونة' },
  { category: 'منتجات GC', name: 'GC ديتوكسي', defaultUnit: 'كرتونة' },

  { category: 'منتجات AQ', name: 'AQ معطر جو', defaultUnit: 'كرتونة' },
  { category: 'منتجات AQ', name: 'AQ منعم ملابس – 2 لتر', defaultUnit: 'كرتونة' },

  { category: 'منتجات سيترس', name: 'سيترس مصر', defaultUnit: 'كرتونة' },
  { category: 'منتجات سيترس', name: 'سيترس أمريكي', defaultUnit: 'كرتونة' },
];

export function AddMerchantGoodsModal({
  isOpen,
  onClose,
  merchantName,
  defaultPhone = '',
  defaultAddress = '',
  existingInvoices,
  productCatalog,
  onSaveDelivery,
}: AddMerchantGoodsModalProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<InvoiceItem[]>([createEmptyItem()]);
  const [paidNow, setPaidNow] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [customItemMode, setCustomItemMode] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems(prev => [...prev, createEmptyItem()]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [createEmptyItem()];
    });
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, val: any) => {
    setItems(prev => {
      const next = [...prev];
      const current = { ...next[index], [field]: val };

      if (field === 'name') {
        const found = productCatalog.find(p => p.name.toLowerCase() === String(val).toLowerCase());
        if (found) {
          if (found.unit) current.unit = found.unit;
          if (found.defaultPrice > 0) current.unitPrice = found.defaultPrice;
        }
      }

      const q = Number(current.quantity) || 0;
      const p = Number(current.unitPrice) || 0;
      current.total = Number((q * p).toFixed(2));

      next[index] = current;
      return next;
    });
  };

  const subtotal = items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
  const totalAmount = subtotal;
  const remainingAmount = Math.max(0, Number((totalAmount - Number(paidNow || 0)).toFixed(2)));

  let status: PaymentStatus = 'UNPAID';
  if (paidNow >= totalAmount && totalAmount > 0) {
    status = 'PAID';
  } else if (paidNow > 0) {
    status = 'PARTIAL';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = items.filter(it => it.name.trim().length > 0 && it.quantity > 0);
    if (validItems.length === 0) {
      alert('الرجاء اختيار صنف وكمية واحدة على الأقل');
      return;
    }

    const currentYear = new Date().getFullYear();
    const nextNum = existingInvoices.length + 1;
    const nowIso = new Date().toISOString();

    const newDeliveryInvoice: Invoice = {
      id: generateDeliveryId(nextNum),
      invoiceNumber: `INV-${currentYear}-${String(nextNum).padStart(3, '0')}`,
      date,
      customerName: merchantName.trim(),
      customerPhone: defaultPhone,
      customerAddress: defaultAddress,
      items: validItems,
      subtotal,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      totalAmount,
      paidAmount: Number(paidNow) || 0,
      remainingAmount,
      status,
      notes: notes.trim() || 'سحب بضاعة للتاجر',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    onSaveDelivery(newDeliveryInvoice);
    onClose();
  };

  const predefinedNames = new Set(PREDEFINED_PRODUCTS.map(p => p.name));
  const otherCatalogProducts = productCatalog.filter(p => !predefinedNames.has(p.name));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-emerald-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-300 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                إضافة بضاعة ومسحوبات لحساب التاجر
              </h2>
              <p className="text-xs text-emerald-200">
                تسجيل طلبية بضاعة جديدة للتاجر: <strong className="text-white">{merchantName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Delivery Date & Merchant Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">التاجر / المحل</label>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 pt-1">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>{merchantName}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">تاريخ استلام البضاعة</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-500" />
                <span>الأصناف المسحوبة والكميات ({items.length})</span>
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة صنف آخر</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">اسم المنتج</th>
                    <th className="py-2.5 px-3 w-24">الوحدة</th>
                    <th className="py-2.5 px-3 w-20">الكمية</th>
                    <th className="py-2.5 px-3 w-24">سعر الكرتونة</th>
                    <th className="py-2.5 px-3 w-24">الإجمالي</th>
                    <th className="py-2.5 px-3 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const isCustom = customItemMode[idx] || false;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        
                        {/* Product Dropdown */}
                        <td className="py-2 px-3">
                          {isCustom ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                required
                                placeholder="اسم الصنف..."
                                value={item.name}
                                onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                                className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-md"
                              />
                              <button
                                type="button"
                                onClick={() => setCustomItemMode(prev => ({ ...prev, [idx]: false }))}
                                className="text-[10px] text-slate-500 hover:text-emerald-700"
                              >
                                القائمة
                              </button>
                            </div>
                          ) : (
                            <select
                              required
                              value={item.name}
                              onChange={(e) => {
                                if (e.target.value === '__CUSTOM__') {
                                  setCustomItemMode(prev => ({ ...prev, [idx]: true }));
                                  handleItemChange(idx, 'name', '');
                                } else {
                                  handleItemChange(idx, 'name', e.target.value);
                                }
                              }}
                              className="w-full px-2 py-1 text-xs sm:text-sm bg-white border border-slate-300 rounded-md font-medium"
                            >
                              <optgroup label="🌟 منتجات GC">
                                <option value="GC المزيل الشامل">GC المزيل الشامل</option>
                                <option value="GC منعم ومعطر الملابس – 1 لتر">GC منعم ومعطر الملابس – 1 لتر</option>
                                <option value="GC منعم ومعطر الملابس – 3 لتر">GC منعم ومعطر الملابس – 3 لتر</option>
                                <option value="GC معطر الجو والمفروشات">GC معطر الجو والمفروشات</option>
                                <option value="GC ديتوكسي">GC ديتوكسي</option>
                              </optgroup>
                              <optgroup label="🌟 منتجات AQ">
                                <option value="AQ معطر جو">AQ معطر جو</option>
                                <option value="AQ منعم ملابس – 2 لتر">AQ منعم ملابس – 2 لتر</option>
                              </optgroup>
                              <optgroup label="🌟 منتجات سيترس">
                                <option value="سيترس مصر">سيترس مصر</option>
                                <option value="سيترس أمريكي">سيترس أمريكي</option>
                              </optgroup>
                              {otherCatalogProducts.length > 0 && (
                                <optgroup label="📦 أصناف من الدليل">
                                  {otherCatalogProducts.map(p => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                  ))}
                                </optgroup>
                              )}
                              <option value="__CUSTOM__">✏️ صنف مخصص آخر...</option>
                            </select>
                          )}
                        </td>

                        {/* Unit */}
                        <td className="py-2 px-3">
                          <select
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            className="w-full px-1.5 py-1 text-xs bg-white border border-slate-200 rounded-md"
                          >
                            <option value="كرتونة">كرتونة</option>
                            <option value="عبوة">عبوة</option>
                            <option value="لتر">لتر</option>
                            <option value="قطعة">قطعة</option>
                          </select>
                        </td>

                        {/* Quantity */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-xs sm:text-sm font-semibold text-center border border-slate-200 rounded-md"
                          />
                        </td>

                        {/* Unit Price */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-xs sm:text-sm font-semibold text-center border border-slate-200 rounded-md"
                          />
                        </td>

                        {/* Line Total */}
                        <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {item.total.toLocaleString()} ج
                        </td>

                        {/* Delete */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment & Totals */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">إجمالي قيمة هذه البضاعة:</span>
              <span className="font-black text-slate-900 text-base">{totalAmount.toLocaleString()} ج.م</span>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm pt-2 border-t border-slate-200">
              <label className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" />
                <span>المسدد فوراً كاش (إن وُجد):</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={paidNow || ''}
                onChange={(e) => setPaidNow(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-28 px-3 py-1.5 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg text-left"
              />
            </div>

            <div className="flex items-center justify-between text-sm font-bold">
              <span className="text-slate-700">المتبقي يُضاف لمديونية التاجر:</span>
              <span className="text-rose-700 text-base font-extrabold">{remainingAmount.toLocaleString()} ج.م</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ملاحظات الطلبية (اختياري)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: تسليم مخزن المحل، إذن استلام رقم..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>إضافة لحساب التاجر</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
