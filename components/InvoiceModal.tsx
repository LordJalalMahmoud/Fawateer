'use client';

import React, { useState } from 'react';
import { Invoice, InvoiceItem, PaymentStatus, ProductCatalogItem } from '@/lib/types';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Calculator, 
  User, 
  Package, 
  CreditCard
} from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  initialInvoice?: Invoice | null;
  existingInvoices: Invoice[];
  productCatalog: ProductCatalogItem[];
}

let idCounter = 0;
function generateUniqueId(prefix = 'id'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function createEmptyItem(): InvoiceItem {
  return {
    id: generateUniqueId('item'),
    name: '',
    unit: 'كرتونة',
    quantity: 1,
    unitPrice: 0,
    total: 0,
  };
}

function InvoiceModalContent({
  onClose,
  onSave,
  initialInvoice,
  existingInvoices,
  productCatalog,
}: Omit<InvoiceModalProps, 'isOpen'>) {
  const currentYear = new Date().getFullYear();
  const nextNum = existingInvoices.length + 1;

  const [invoiceNumber, setInvoiceNumber] = useState(
    initialInvoice ? initialInvoice.invoiceNumber : `INV-${currentYear}-${String(nextNum).padStart(3, '0')}`
  );
  const [date, setDate] = useState(
    initialInvoice ? initialInvoice.date : new Date().toISOString().slice(0, 10)
  );
  const [customerName, setCustomerName] = useState(
    initialInvoice ? initialInvoice.customerName : ''
  );
  const [customerPhone, setCustomerPhone] = useState(
    initialInvoice?.customerPhone || ''
  );
  const [customerAddress, setCustomerAddress] = useState(
    initialInvoice?.customerAddress || ''
  );
  const [notes, setNotes] = useState(
    initialInvoice?.notes || ''
  );
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    if (initialInvoice && initialInvoice.items && initialInvoice.items.length > 0) {
      return initialInvoice.items;
    }
    return [
      { id: generateUniqueId('item'), name: 'سيترس أمريكي', unit: 'كرتونة', quantity: 1, unitPrice: 840, total: 840 }
    ];
  });
  
  const [taxRate, setTaxRate] = useState<number>(initialInvoice?.taxRate || 0);
  const [taxAmount, setTaxAmount] = useState<number>(initialInvoice?.taxAmount || 0);
  const [discount, setDiscount] = useState<number>(initialInvoice?.discount || 0);
  const [paidAmount, setPaidAmount] = useState<number>(initialInvoice?.paidAmount || 0);

  // Autocomplete customer names
  const customerSuggestions = Array.from(
    new Set(existingInvoices.map(i => i.customerName.trim()).filter(Boolean))
  );

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

      // If user selected a product from catalog, autofill unit and default price
      if (field === 'name') {
        const found = productCatalog.find(p => p.name.toLowerCase() === String(val).toLowerCase());
        if (found) {
          current.unit = found.unit;
          current.unitPrice = found.defaultPrice;
        }
      }

      // Recalculate line total
      const q = Number(current.quantity) || 0;
      const p = Number(current.unitPrice) || 0;
      current.total = Number((q * p).toFixed(2));

      next[index] = current;
      return next;
    });
  };

  // Calculations
  const subtotal = items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
  
  // Tax calculation
  const calculatedTax = taxRate > 0 ? Number(((subtotal * taxRate) / 100).toFixed(2)) : Number(taxAmount || 0);
  const totalAmount = Number((subtotal + calculatedTax - Number(discount || 0)).toFixed(2));
  const remainingAmount = Number((totalAmount - Number(paidAmount || 0)).toFixed(2));

  // Determine status
  let status: PaymentStatus = 'UNPAID';
  if (paidAmount >= totalAmount && totalAmount > 0) {
    status = 'PAID';
  } else if (paidAmount > 0 && paidAmount < totalAmount) {
    status = 'PARTIAL';
  } else {
    status = 'UNPAID';
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('الرجاء إدخال اسم العميل');
      return;
    }

    const validItems = items.filter(it => it.name.trim().length > 0);
    if (validItems.length === 0) {
      alert('الرجاء إضافة صنف واحد على الأقل في الفاتورة');
      return;
    }

    const timestamp = initialInvoice ? initialInvoice.createdAt : '2026-08-19T05:58:00.000Z';
    const nowIso = initialInvoice ? '2026-08-19T05:58:00.000Z' : timestamp;

    const savedInvoice: Invoice = {
      id: initialInvoice ? initialInvoice.id : generateUniqueId('inv'),
      invoiceNumber: invoiceNumber.trim() || `INV-${existingInvoices.length + 1}`,
      date: date || '2026-08-19',
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || '',
      customerAddress: customerAddress.trim() || '',
      items: validItems,
      subtotal,
      taxRate: taxRate > 0 ? taxRate : 0,
      taxAmount: calculatedTax,
      discount: Number(discount) || 0,
      totalAmount,
      paidAmount: Number(paidAmount) || 0,
      remainingAmount,
      status,
      notes: notes.trim() || '',
      createdAt: timestamp,
      updatedAt: nowIso,
    };

    onSave(savedInvoice);
  };

  return (
    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
      
      {/* Modal Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/75">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {initialInvoice ? `تعديل الفاتورة (${initialInvoice.invoiceNumber})` : 'إنشاء وتصميم فاتورة جديدة'}
            </h2>
            <p className="text-xs text-slate-500">
              إدخال بيانات العميل، الأصناف، الكميات، والتحصيلات المالية
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Modal Body / Form */}
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        
        {/* Section 1: Customer & Invoice Meta */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>بيانات العميل والفاتورة</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            
            {/* Invoice Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">رقم الفاتورة</label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">التاريخ</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Customer Name with suggestions */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">اسم العميل / المحل *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثال: محلات الصالحين، سوبر ماركت الشاعر..."
                  list="customer-names-list"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <datalist id="customer-names-list">
                  {customerSuggestions.map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">رقم الهاتف (اختياري)</label>
              <input
                type="text"
                placeholder="010XXXXXXXX"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">العنوان / مكان التسليم (اختياري)</label>
              <input
                type="text"
                placeholder="مثال: 6 أكتوبر، سنتر المعز التجاري، وحدة رقم 2..."
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

          </div>
        </div>

        {/* Section 2: Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-500" />
              <span>أصناف الفاتورة والكميات ({items.length})</span>
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة صنف</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-100/80 text-slate-700 text-xs font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-8">#</th>
                  <th className="py-2.5 px-3">اسم الصنف / المنتج</th>
                  <th className="py-2.5 px-3 w-28">الوحدة</th>
                  <th className="py-2.5 px-3 w-24">الكمية</th>
                  <th className="py-2.5 px-3 w-28">سعر الكرتونة/الوحدة</th>
                  <th className="py-2.5 px-3 w-28">الإجمالي</th>
                  <th className="py-2.5 px-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-xs text-slate-400 font-bold">{idx + 1}</td>
                    
                    {/* Product Name with catalog autocomplete */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        required
                        placeholder="مثال: سيترس أمريكي، معطر AQ..."
                        list="catalog-products-list"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>

                    {/* Unit */}
                    <td className="py-2 px-3">
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-hidden"
                      >
                        <option value="كرتونة">كرتونة</option>
                        <option value="عبوة">عبوة</option>
                        <option value="لتر">لتر</option>
                        <option value="قطعة">قطعة</option>
                        <option value="كيلو">كيلو</option>
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
                        className="w-full px-2.5 py-1.5 text-sm font-semibold bg-white border border-slate-200 rounded-md focus:outline-hidden text-center"
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
                        className="w-full px-2.5 py-1.5 text-sm font-semibold bg-white border border-slate-200 rounded-md focus:outline-hidden text-center"
                      />
                    </td>

                    {/* Line Total */}
                    <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {item.total.toLocaleString()} ج.م
                    </td>

                    {/* Remove */}
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <datalist id="catalog-products-list">
              {productCatalog.map(prod => (
                <option key={prod.id} value={prod.name}>
                  {prod.name} - {prod.defaultPrice} ج.م / {prod.unit}
                </option>
              ))}
            </datalist>
          </div>
        </div>

        {/* Section 3: Summary, Tax, Discount & Payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200">
          
          {/* Notes & Extra info */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">ملاحظات الفاتورة أو شروط الدفع</label>
            <textarea
              rows={4}
              placeholder="أدخل أي ملاحظات خاصة بالفاتورة، طريقة السداد، أو تفاصيل المندوب..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />

            {/* Payment Quick Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">أزرار سداد سريعة</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPaidAmount(totalAmount)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer"
                >
                  خالص بالكامل ({totalAmount.toLocaleString()} ج)
                </button>
                <button
                  type="button"
                  onClick={() => setPaidAmount(0)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-100 text-rose-800 hover:bg-rose-200 transition-colors cursor-pointer"
                >
                  غير مسدد (أجل 0 ج)
                </button>
                <button
                  type="button"
                  onClick={() => setPaidAmount(Number((totalAmount / 2).toFixed(2)))}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer"
                >
                  سداد النصف (50%)
                </button>
              </div>
            </div>
          </div>

          {/* Calculations Breakdown */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
            
            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">المجموع الفرعي للأصناف:</span>
              <span className="font-bold text-slate-900">{subtotal.toLocaleString()} ج.م</span>
            </div>

            {/* Tax */}
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">الضريبة (% أو قيمة):</span>
                <input
                  type="number"
                  min="0"
                  placeholder="نسبة %"
                  value={taxRate || ''}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value) || 0;
                    setTaxRate(rate);
                    if (rate > 0) {
                      setTaxAmount(Number(((subtotal * rate) / 100).toFixed(2)));
                    }
                  }}
                  className="w-16 px-1.5 py-0.5 text-xs text-center border border-slate-200 rounded-md"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
              <input
                type="number"
                min="0"
                step="any"
                value={taxAmount}
                onChange={(e) => {
                  setTaxAmount(parseFloat(e.target.value) || 0);
                  setTaxRate(0);
                }}
                className="w-24 px-2 py-1 text-xs font-semibold text-left border border-slate-200 rounded-md"
              />
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600">الخصم المالي:</span>
              <input
                type="number"
                min="0"
                step="any"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 text-xs font-semibold text-left border border-slate-200 rounded-md"
              />
            </div>

            {/* Grand Total */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base font-extrabold text-slate-900">
              <span>الإجمالي النهائي:</span>
              <span className="text-emerald-700 text-lg">{totalAmount.toLocaleString()} ج.م</span>
            </div>

            {/* Paid Amount */}
            <div className="flex items-center justify-between gap-3 text-sm pt-2 border-t border-slate-100">
              <span className="font-bold text-emerald-800 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" />
                <span>المبلغ المسدد / المحصل:</span>
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-28 px-2.5 py-1.5 text-sm font-bold text-emerald-700 text-left bg-emerald-50 border border-emerald-300 rounded-md focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Remaining */}
            <div className="flex items-center justify-between text-sm font-bold">
              <span className={remainingAmount > 0 ? 'text-rose-700' : 'text-slate-500'}>
                المبلغ المتبقي على العميل (الآجل):
              </span>
              <span className={remainingAmount > 0 ? 'text-rose-700 text-base' : 'text-slate-500'}>
                {remainingAmount.toLocaleString()} ج.م
              </span>
            </div>

          </div>

        </div>

      </form>

      {/* Modal Footer */}
      <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          حالة السداد المحسوبة: <strong className="text-slate-900">{status === 'PAID' ? 'خالص / مسدد بالكامل' : status === 'PARTIAL' ? 'مسدد جزئياً' : 'غير مسدد (أجل)'}</strong>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>حفظ الفاتورة</span>
          </button>
        </div>
      </div>

    </div>
  );
}

export function InvoiceModal(props: InvoiceModalProps) {
  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
      <InvoiceModalContent
        key={props.initialInvoice ? props.initialInvoice.id : 'new-invoice'}
        onClose={props.onClose}
        onSave={props.onSave}
        initialInvoice={props.initialInvoice}
        existingInvoices={props.existingInvoices}
        productCatalog={props.productCatalog}
      />
    </div>
  );
}
