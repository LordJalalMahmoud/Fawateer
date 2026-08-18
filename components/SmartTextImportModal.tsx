'use client';

import React, { useState } from 'react';
import { Invoice, InvoiceItem } from '@/lib/types';
import { parseArabicInvoiceText } from '@/lib/text-parser';
import { 
  Sparkles, 
  X, 
  FileText, 
  ArrowLeft, 
  Check, 
  AlertCircle, 
  Loader2, 
  Plus, 
  Layers,
  Zap,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SmartTextImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportInvoices: (invoices: Invoice[]) => void;
  existingInvoicesCount: number;
}

const SAMPLE_TEXT_1 = `محلات الصالحين 
تاريح 30-7 
__
ستريس مصري 720 1 كرتونه 
AQ معطر 540 1 كرتونه 
جي سي المزيل الشامل 940 1كرتونه 
AQ منعم 480 1 كرتونه 
جي سي منعم 3 لتر 620 1 كرتونه 
جي سي معطر مفروشات وجو 840 1 كرتونه 
ديتوكسي مطهر 720 1 كرتونه 
جي سي منعم 1 لتر 690 1 كرتونه 
سيترس امريكي 840 1 كرتونه 
تم تسديد الفاتوره 6390`;

const SAMPLE_TEXT_2 = `سوبر ماركت الشاعر
تاريخ 30-07-2026
__
جي سي المزيل الشامل 940 — 1 كرتونة
ديتوكسى 710 — 1 كرتونة
جي سي منعم 3 لتر 630 — 1 كرتونة
جي سي منعم 1 لتر 690 — 1 كرتونة
جي سي معطر مفروشات وجو 840 — 1 كرتونة

إجمالي المبيعات: 3,810 جنيه
الضريبة: 532.40 جنيه
الخصم: 0 جنيه
إجمالي الفاتورة: 4,342.40 جنيه
تم تسديد الفاتورة: 4,342.40 جنيه

اسم العميل: حسن إبراهيم حسن إبراهيم – سوبر ماركت الشاعر
العنوان: وحدة رقم 2، سنتر المعز التجاري، القرية السياحية الأولى، خلف جاردينيا، 6 أكتوبر`;

const SAMPLE_TEXT_MULTI = `شركه الجراش بتاريخ 1 8 
3 ك سيترس امريكي 840
1 جي المزيل الشامل 940 
توتال الفاتوره 3460 
لم يتم السداد  
_________________
محمود الصعيدي 
تاريخ 15 - 8 
2 سيترس امريكي 800ج 
15 معطر AQ 540
3 ك ديتوكسي 720ج 
توتال 11860 
لم يتم التحصيل 
_________________
سعد للمنظافات 
17-8 
1 سيترس امريكي 840 
1 جي مزيل 940 
1 جي معطر 840 
1 AQ 540  
1 AQ منعم ملابس 480 
1 ديتوكسي مطهر 720 
1 منعم ملابس جي 1 ل 690 
1 منعم ملابس 3 لتر 620 
اجمال 5670 
لم يتم السداد`;

export function SmartTextImportModal({
  isOpen,
  onClose,
  onImportInvoices,
  existingInvoicesCount,
}: SmartTextImportModalProps) {
  const [rawText, setRawText] = useState('');
  const [parsedList, setParsedList] = useState<Partial<Invoice>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseMethod, setParseMethod] = useState<'LOCAL' | 'AI'>('LOCAL');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleParseLocal = () => {
    setErrorMsg('');
    if (!rawText.trim()) {
      setErrorMsg('الرجاء إدخال نص الفاتورة أو اختيار أحد النماذج التجريبية أدناه');
      return;
    }

    try {
      const results = parseArabicInvoiceText(rawText);
      if (results.length === 0) {
        setErrorMsg('لم يتم التعرف على بنود فاتورة، تأكد من احتواء النص على أسماء الأصناف والأسعار');
        return;
      }
      setParsedList(results);
    } catch (e) {
      console.error(e);
      setErrorMsg('حدث خطأ أثناء معالجة النص');
    }
  };

  const handleParseAI = async () => {
    setErrorMsg('');
    if (!rawText.trim()) {
      setErrorMsg('الرجاء إدخال نص الفاتورة أو اختيار أحد النماذج التجريبية');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/parse-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        // Fallback to local parser if AI is unavailable
        console.warn('AI parser error, fallback to local parser:', data.error);
        const fallbackResults = parseArabicInvoiceText(rawText);
        if (fallbackResults.length > 0) {
          setParsedList(fallbackResults);
          setErrorMsg('تمت المعالجة بنجاح عبر المعالج المحلي الذكي');
        } else {
          setErrorMsg(data.error || 'تعذر معالجة النص بالذكاء الاصطناعي');
        }
      } else if (Array.isArray(data.invoices) && data.invoices.length > 0) {
        setParsedList(data.invoices);
      } else {
        // Fallback
        const fallbackResults = parseArabicInvoiceText(rawText);
        setParsedList(fallbackResults);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      // Fallback
      const fallbackResults = parseArabicInvoiceText(rawText);
      if (fallbackResults.length > 0) {
        setParsedList(fallbackResults);
      } else {
        setErrorMsg('فشل الاتصال بخدمة الذكاء الاصطناعي، يرجى استخدام المعالج المحلي');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveParsed = (index: number) => {
    setParsedList(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmImport = () => {
    if (parsedList.length === 0) return;

    const currentYear = new Date().getFullYear();
    const readyInvoices: Invoice[] = parsedList.map((item, idx) => {
      const nextNum = existingInvoicesCount + idx + 1;
      const subtotal = item.subtotal || item.items?.reduce((s, it) => s + (it.total || 0), 0) || 0;
      const totalAmount = item.totalAmount || subtotal;
      const paidAmount = item.paidAmount || (item.status === 'PAID' ? totalAmount : 0);
      const remainingAmount = Number((totalAmount - paidAmount).toFixed(2));

      return {
        id: `inv-${Date.now()}-${idx}`,
        invoiceNumber: item.invoiceNumber || `INV-${currentYear}-${String(nextNum).padStart(3, '0')}`,
        date: item.date || new Date().toISOString().slice(0, 10),
        customerName: item.customerName || 'عميل محول',
        customerPhone: item.customerPhone,
        customerAddress: item.customerAddress,
        items: (item.items || []).map((it, itIdx) => ({
          id: it.id || `item-${Date.now()}-${idx}-${itIdx}`,
          name: it.name || 'صنف',
          unit: it.unit || 'كرتونة',
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          total: Number(it.total) || Number(((it.quantity || 1) * (it.unitPrice || 0)).toFixed(2)),
        })),
        subtotal,
        taxAmount: item.taxAmount || 0,
        taxRate: item.taxRate,
        discount: item.discount || 0,
        totalAmount,
        paidAmount,
        remainingAmount,
        status: item.status || (paidAmount >= totalAmount ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID'),
        notes: item.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    onImportInvoices(readyInvoices);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                المحول الذكي: تحويل النصوص ورسائل الواتساب إلى فواتير
              </h2>
              <p className="text-xs text-slate-500">
                الصق أي نص فاتورة مكتوب باللغة العربية وسيتم استخراج الأصناف والأسعار والحسابات تلقائياً
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Text Input Section */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                الصق نص الفاتورة أو الرسالة هنا:
              </label>
              
              {/* Quick Sample Loaders */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 hidden sm:inline">نماذج تجريبية:</span>
                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_TEXT_1)}
                  className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-md font-medium transition-colors cursor-pointer"
                >
                  محلات الصالحين
                </button>
                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_TEXT_2)}
                  className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-medium transition-colors cursor-pointer"
                >
                  سوبر ماركت الشاعر
                </button>
                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_TEXT_MULTI)}
                  className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md font-medium transition-colors cursor-pointer"
                >
                  فواتير متعددة
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              placeholder={`مثال:\nمحلات الصالحين \nتاريخ 30-7\nستريس مصري 720 1 كرتونه\nAQ معطر 540 1 كرتونه\nجي سي المزيل الشامل 940 1 كرتونه\nتم تسديد الفاتوره 6390`}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-3.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400"
            />

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              
              {/* Local Fast Parser Button */}
              <button
                type="button"
                onClick={handleParseLocal}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-600" />
                <span>معالجة فورية سريعة (محلية)</span>
              </button>

              {/* AI Gemini Parser Button */}
              <button
                type="button"
                onClick={handleParseAI}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارِ التحليل الذكي بالـ AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>تحليل متقدم بالذكاء الاصطناعي (Gemini)</span>
                  </>
                )}
              </button>

              {rawText && (
                <button
                  type="button"
                  onClick={() => {
                    setRawText('');
                    setParsedList([]);
                    setErrorMsg('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 mr-auto"
                >
                  مسح النص
                </button>
              )}

            </div>
          </div>

          {/* Parsed Invoices Preview */}
          {parsedList.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>الفواتير المستخرجة الجاهزة للاستيراد ({parsedList.length} فاتورة)</span>
                </h3>
                <span className="text-xs text-slate-500">
                  يمكنك مراجعة البيانات قبل اعتمادها
                </span>
              </div>

              <div className="space-y-3">
                {parsedList.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/75 hover:bg-slate-50 transition-colors relative"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveParsed(idx)}
                      className="absolute top-3 left-3 text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors"
                      title="حذف هذه الفاتورة من قائمة الاستيراد"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-bold text-slate-900 text-sm">{item.customerName || 'عميل'}</span>
                      <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {item.date}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                        item.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : item.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.status === 'PAID' ? 'خالص ومسدد' : item.status === 'PARTIAL' ? 'سداد جزئي' : 'غير مسدد (أجل)'}
                      </span>
                    </div>

                    {item.customerAddress && (
                      <p className="text-xs text-slate-500 mb-2">العنوان: {item.customerAddress}</p>
                    )}

                    {/* Items chips */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {item.items?.map((it, itIdx) => (
                        <span key={itIdx} className="text-xs bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-700">
                          {it.name} ({it.quantity} {it.unit || 'كرتونة'}) × {it.unitPrice} ج = <strong className="text-slate-900">{it.total} ج</strong>
                        </span>
                      ))}
                    </div>

                    {/* Financial stats */}
                    <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-slate-200 text-slate-600 gap-2">
                      <div>
                        المجموع الفرعي: <strong>{item.subtotal} ج</strong>
                        {item.taxAmount ? ` • الضريبة: ${item.taxAmount} ج` : ''}
                        {item.discount ? ` • الخصم: ${item.discount} ج` : ''}
                      </div>
                      <div className="flex items-center gap-3">
                        <span>الإجمالي: <strong className="text-slate-900 text-sm">{item.totalAmount} ج.م</strong></span>
                        <span>المسدد: <strong className="text-emerald-700">{item.paidAmount || 0} ج</strong></span>
                        <span>المتبقي: <strong className="text-rose-700">{item.remainingAmount || 0} ج</strong></span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {parsedList.length > 0 ? `سيتم إنشاء ${parsedList.length} فاتورة جديدة في النظام` : 'قم بلصق النص واضغط معالجة للبدء'}
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
              type="button"
              disabled={parsedList.length === 0}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              <Check className="w-4 h-4" />
              <span>استيراد وحفظ في النظام ({parsedList.length})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
