'use client';

import React, { useState } from 'react';
import { Invoice } from '@/lib/types';
import { 
  X, 
  Printer, 
  Share2, 
  Copy, 
  Check, 
  MessageCircle, 
  MapPin, 
  Phone, 
  Calendar, 
  Building2, 
  Receipt,
  FileText,
  CreditCard,
  QrCode,
  Edit3
} from 'lucide-react';

interface InvoiceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onEditInvoice?: (invoice: Invoice) => void;
}

export function InvoiceViewModal({
  isOpen,
  onClose,
  invoice,
  onEditInvoice,
}: InvoiceViewModalProps) {
  const [printMode, setPrintMode] = useState<'A4' | 'THERMAL'>('A4');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !invoice) return null;

  const formatEGP = (val: number) => {
    return new Intl.NumberFormat('ar-EG', {
      maximumFractionDigits: 2,
    }).format(val) + ' ج.م';
  };

  const handlePrint = () => {
    window.print();
  };

  const generateWhatsAppText = () => {
    const lines = [
      `*فاتورة مبيعات - ${invoice.invoiceNumber}*`,
      `التاريخ: ${invoice.date}`,
      `العميل: ${invoice.customerName}`,
      invoice.customerAddress ? `العنوان: ${invoice.customerAddress}` : '',
      `---------------------------------`,
      ...invoice.items.map(it => `• ${it.name} (${it.quantity} ${it.unit}) × ${it.unitPrice} ج = ${it.total} ج`),
      `---------------------------------`,
      `المجموع الفرعي: ${invoice.subtotal.toLocaleString()} ج.م`,
      invoice.taxAmount > 0 ? `الضريبة: ${invoice.taxAmount.toLocaleString()} ج.م` : '',
      invoice.discount > 0 ? `الخصم: ${invoice.discount.toLocaleString()} ج.م` : '',
      `*الإجمالي النهائي: ${invoice.totalAmount.toLocaleString()} ج.م*`,
      `المسدد: ${invoice.paidAmount.toLocaleString()} ج.م`,
      invoice.remainingAmount > 0 ? `*المتبقي (الآجل): ${invoice.remainingAmount.toLocaleString()} ج.م*` : `حالة السداد: خالص الدفع بالكامل ✅`,
      invoice.notes ? `ملاحظات: ${invoice.notes}` : '',
      `\nشكراً لتعاملكم معنا!`
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateWhatsAppText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppText());
    const phone = invoice.customerPhone ? invoice.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const isPaid = invoice.status === 'PAID';
  const isUnpaid = invoice.status === 'UNPAID';
  const isPartial = invoice.status === 'PARTIAL';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      
      {/* Outer Container */}
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Top Control Bar (Hidden during print) */}
        <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50 no-print">
          
          {/* Print Mode Toggles */}
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setPrintMode('A4')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                printMode === 'A4' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>فاتورة A4 قياسية</span>
            </button>
            <button
              onClick={() => setPrintMode('THERMAL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                printMode === 'THERMAL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>بون كاشير حراري 80mm</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            
            {/* WhatsApp Share */}
            <button
              onClick={handleOpenWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
              title="مشاركة الفاتورة عبر الواتساب"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">إرسال واتساب</span>
            </button>

            {/* Copy Text */}
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              title="نسخ نص الفاتورة"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
            </button>

            {/* Edit Button */}
            {onEditInvoice && (
              <button
                onClick={() => {
                  onClose();
                  onEditInvoice(invoice);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل</span>
              </button>
            )}

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الفاتورة</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

          </div>
        </div>

        {/* Printable Area Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center printable-area">
          
          {/* Mode 1: A4 Standard Document */}
          {printMode === 'A4' ? (
            <div className="bg-white w-full max-w-3xl p-6 sm:p-10 rounded-xl shadow-md border border-slate-200 text-slate-900 relative">
              
              {/* Status Stamp Watermark */}
              <div className="absolute top-8 left-8 sm:top-12 sm:left-12 pointer-events-none transform -rotate-12 select-none">
                {isPaid && (
                  <div className="border-4 border-emerald-600/30 text-emerald-600 font-black text-xl sm:text-2xl px-4 py-1 rounded-xl uppercase tracking-widest bg-emerald-50/50">
                    خالص ومسدد بالكامل
                  </div>
                )}
                {isUnpaid && (
                  <div className="border-4 border-rose-600/30 text-rose-600 font-black text-xl sm:text-2xl px-4 py-1 rounded-xl uppercase tracking-widest bg-rose-50/50">
                    غير مسدد (أجل)
                  </div>
                )}
                {isPartial && (
                  <div className="border-4 border-amber-600/30 text-amber-600 font-black text-xl sm:text-2xl px-4 py-1 rounded-xl uppercase tracking-widest bg-amber-50/50">
                    سداد جزئي
                  </div>
                )}
              </div>

              {/* Invoice Header */}
              <div className="border-b-2 border-slate-900 pb-6 mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                      ج
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        مؤسسة الصالحين لتجارة وتوزيع المنظفات
                      </h1>
                      <p className="text-xs text-slate-600 font-medium">
                        بيع جملة وتجزئة • معطرات • منظفات • مطهرات ومنعمات ملابس
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                    <div>سجل تجاري: 104928 • بطاقة ضريبية: 492-381-002</div>
                    <div>خدمة العملاء والطلبات: 01012345678 - 01123456789</div>
                  </div>
                </div>

                {/* Meta details box */}
                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 text-left min-w-[200px] w-full sm:w-auto">
                  <div className="text-sm font-extrabold text-slate-900 text-right">
                    فاتورة مبيعات رقم: <span className="font-mono text-slate-700">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex items-center justify-between gap-4">
                    <span>تاريخ الإصدار:</span>
                    <span className="font-semibold text-slate-900 font-mono">{invoice.date}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex items-center justify-between gap-4">
                    <span>حالة الفاتورة:</span>
                    <span className={`font-bold ${isPaid ? 'text-emerald-700' : isPartial ? 'text-amber-700' : 'text-rose-700'}`}>
                      {isPaid ? 'مسددة' : isPartial ? 'سداد جزئي' : 'غير مسددة'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 mb-6">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2">بيانات العميل والمستلم:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs block">اسم العميل / المحل:</span>
                    <strong className="text-base text-slate-900">{invoice.customerName}</strong>
                  </div>
                  {invoice.customerPhone && (
                    <div>
                      <span className="text-slate-500 text-xs block">رقم الهاتف:</span>
                      <strong className="text-slate-800 font-mono">{invoice.customerPhone}</strong>
                    </div>
                  )}
                  {invoice.customerAddress && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 text-xs block">العنوان والتسليم:</span>
                      <span className="text-slate-800 font-medium">{invoice.customerAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <table className="w-full text-right border border-slate-200 text-sm">
                  <thead className="bg-slate-900 text-white text-xs font-bold">
                    <tr>
                      <th className="py-2.5 px-3 w-8 text-center">#</th>
                      <th className="py-2.5 px-4">بيان الصنف / المنتج</th>
                      <th className="py-2.5 px-3 text-center">الوحدة</th>
                      <th className="py-2.5 px-3 text-center">الكمية</th>
                      <th className="py-2.5 px-3 text-left">سعر الوحدة</th>
                      <th className="py-2.5 px-4 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="py-2.5 px-3 text-center text-xs text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">{item.name}</td>
                        <td className="py-2.5 px-3 text-center text-xs text-slate-600">{item.unit || 'كرتونة'}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 font-mono">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-left font-mono">{item.unitPrice.toLocaleString()} ج.م</td>
                        <td className="py-2.5 px-4 text-left font-bold text-slate-900 font-mono">{item.total.toLocaleString()} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Financial Breakdown & Signatures */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                
                {/* Notes & QR */}
                <div className="space-y-3">
                  {invoice.notes && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                      <span className="font-bold text-slate-900 block mb-0.5">ملاحظات:</span>
                      {invoice.notes}
                    </div>
                  )}

                  <div className="p-3 border border-dashed border-slate-300 rounded-lg flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center text-slate-700 border border-slate-200 shrink-0">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      رمز التحقق الإلكتروني للفاتورة الضريبية وفقاً للاشتراطات المعتمدة.
                    </div>
                  </div>
                </div>

                {/* Totals Table */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>المجموع الفرعي:</span>
                    <span className="font-semibold text-slate-900 font-mono">{formatEGP(invoice.subtotal)}</span>
                  </div>

                  {invoice.taxAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>ضريبة القيمة المضافة {invoice.taxRate ? `(${invoice.taxRate}%)` : ''}:</span>
                      <span className="font-semibold text-slate-900 font-mono">{formatEGP(invoice.taxAmount)}</span>
                    </div>
                  )}

                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>الخصم الممنوح:</span>
                      <span className="font-semibold font-mono">- {formatEGP(invoice.discount)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t-2 border-slate-900 flex justify-between text-base font-black text-slate-900">
                    <span>إجمالي الفاتورة:</span>
                    <span className="text-emerald-700 text-lg font-mono">{formatEGP(invoice.totalAmount)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between text-emerald-800 font-bold">
                    <span>المبلغ المسدد / المحصل:</span>
                    <span className="font-mono">{formatEGP(invoice.paidAmount)}</span>
                  </div>

                  <div className="flex justify-between font-bold">
                    <span className={invoice.remainingAmount > 0 ? 'text-rose-700' : 'text-slate-500'}>
                      المبلغ المتبقي (الآجل):
                    </span>
                    <span className={`font-mono text-base ${invoice.remainingAmount > 0 ? 'text-rose-700 font-extrabold' : 'text-slate-500'}`}>
                      {formatEGP(invoice.remainingAmount)}
                    </span>
                  </div>
                </div>

              </div>

              {/* Signatures */}
              <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-500">
                <div>
                  <p className="font-bold text-slate-800 mb-8">توقيع المستلم / العميل</p>
                  <p>....................................</p>
                </div>
                <div>
                  <p className="font-bold text-slate-800 mb-8">ختم وتوقيع المندوب / الإدارة</p>
                  <p>....................................</p>
                </div>
              </div>

            </div>
          ) : (
            /* Mode 2: 80mm Thermal Receipt */
            <div className="bg-white w-[320px] p-5 rounded-lg shadow-md border border-slate-300 text-slate-900 text-xs font-mono">
              
              {/* Receipt Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
                <h2 className="text-base font-black text-slate-900">مؤسسة توريدات المنظفات</h2>
                <p className="text-[11px] text-slate-600">هاتف: 01012345678</p>
                <div className="text-[11px] font-bold text-slate-800 mt-2">
                  فاتورة: {invoice.invoiceNumber}
                </div>
                <div className="text-[10px] text-slate-500">
                  {invoice.date}
                </div>
              </div>

              {/* Client */}
              <div className="py-2.5 border-b border-dashed border-slate-400 space-y-0.5">
                <div className="font-bold text-slate-900">العميل: {invoice.customerName}</div>
                {invoice.customerPhone && <div>هاتف: {invoice.customerPhone}</div>}
                {invoice.customerAddress && <div className="text-[10px] text-slate-600 leading-tight">{invoice.customerAddress}</div>}
              </div>

              {/* Items */}
              <div className="py-3 border-b border-dashed border-slate-400 space-y-2">
                {invoice.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>{item.quantity} {item.unit} × {item.unitPrice} ج</span>
                      <span className="font-bold text-slate-900">{item.total} ج</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>المجموع:</span>
                  <span>{invoice.subtotal} ج</span>
                </div>
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>الضريبة:</span>
                    <span>{invoice.taxAmount} ج</span>
                  </div>
                )}
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>الخصم:</span>
                    <span>-{invoice.discount} ج</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-300">
                  <span>الإجمالي:</span>
                  <span>{invoice.totalAmount} ج</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>المدفوع:</span>
                  <span>{invoice.paidAmount} ج</span>
                </div>
                <div className="flex justify-between font-bold text-rose-700">
                  <span>المتبقي:</span>
                  <span>{invoice.remainingAmount} ج</span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="pt-3 text-center space-y-2 text-[10px] text-slate-500">
                <div className="flex justify-center">
                  <QrCode className="w-14 h-14 text-slate-800" />
                </div>
                <p>شكراً لزيارتكم ونسعد بخدمتكم دائماً</p>
                <p>البضاعة المباعة ترد وتستبدل حسب الشروط</p>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
