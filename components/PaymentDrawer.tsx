'use client';

import React, { useState } from 'react';
import { Invoice } from '@/lib/types';
import { 
  X, 
  Check, 
  Banknote
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onUpdatePayment: (invoiceId: string, newPaidAmount: number, notes?: string) => void;
}

function PaymentDrawerContent({
  onClose,
  invoice,
  onUpdatePayment,
}: {
  onClose: () => void;
  invoice: Invoice;
  onUpdatePayment: (invoiceId: string, newPaidAmount: number, notes?: string) => void;
}) {
  const [amountToAdd, setAmountToAdd] = useState<number>(invoice.remainingAmount || 0);
  const [paymentNote, setPaymentNote] = useState('');

  const currentPaid = Number(invoice.paidAmount) || 0;
  const grandTotal = Number(invoice.totalAmount) || 0;
  const currentRemaining = Number(invoice.remainingAmount) || 0;

  const newCalculatedTotalPaid = currentPaid + Number(amountToAdd || 0);
  const newRemaining = Math.max(0, Number((grandTotal - newCalculatedTotalPaid).toFixed(2)));

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountToAdd <= 0) {
      alert('الرجاء إدخال مبلغ صحيح للتحصيل');
      return;
    }

    const updatedPaid = currentPaid + Number(amountToAdd);
    const combinedNotes = paymentNote.trim()
      ? `${invoice.notes ? invoice.notes + ' | ' : ''}دفعة تحصيل ${amountToAdd} ج بتاريخ ${new Date().toISOString().slice(0, 10)}: ${paymentNote}`
      : `${invoice.notes ? invoice.notes + ' | ' : ''}دفعة تحصيل ${amountToAdd} ج بتاريخ ${new Date().toISOString().slice(0, 10)}`;

    onUpdatePayment(invoice.id, updatedPaid, combinedNotes);
    
    if (newRemaining <= 0.01) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    }
    onClose();
  };

  return (
    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-emerald-50/60">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              تسجيل دفعة نقدية / تحصيل
            </h2>
            <p className="text-xs text-slate-500">
              فاتورة {invoice.invoiceNumber} - {invoice.customerName}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <form onSubmit={handleSavePayment} className="p-4 sm:p-6 space-y-4">
        
        {/* Invoice Summary Box */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">إجمالي الفاتورة:</span>
            <strong className="text-slate-900">{grandTotal.toLocaleString()} ج.م</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">المسدد سابقاً:</span>
            <strong className="text-emerald-700">{currentPaid.toLocaleString()} ج.م</strong>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-rose-700">
            <span>المتبقي حالياً:</span>
            <span>{currentRemaining.toLocaleString()} ج.م</span>
          </div>
        </div>

        {/* Amount to add input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            المبلغ المراد تحصيله الآن (ج.م) *
          </label>
          <input
            type="number"
            min="1"
            max={currentRemaining}
            step="any"
            required
            value={amountToAdd || ''}
            onChange={(e) => setAmountToAdd(parseFloat(e.target.value) || 0)}
            className="w-full px-3.5 py-2.5 text-lg font-bold text-emerald-700 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          
          {/* Quick buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setAmountToAdd(currentRemaining)}
              className="flex-1 py-1 px-2 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer"
            >
              تسديد كامل المتبقي ({currentRemaining.toLocaleString()} ج)
            </button>
            {currentRemaining > 100 && (
              <button
                type="button"
                onClick={() => setAmountToAdd(Number((currentRemaining / 2).toFixed(2)))}
                className="py-1 px-2.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                النصف 50%
              </button>
            )}
          </div>
        </div>

        {/* Payment Notes */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-600">
            ملاحظة التحصيل (اختياري)
          </label>
          <input
            type="text"
            placeholder="مثال: نقداً مع المندوب / تحويل بنكي / شيك..."
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* New Balance Preview */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
          <span className="text-slate-600">الرصيد المتبقي بعد التحصيل:</span>
          <strong className={newRemaining > 0 ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
            {newRemaining <= 0 ? 'خالص بالكامل (0 ج)' : `${newRemaining.toLocaleString()} ج.م`}
          </strong>
        </div>

        {/* Actions */}
        <div className="pt-3 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="flex-1 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>تأكيد التحصيل</span>
          </button>
        </div>

      </form>

    </div>
  );
}

export function PaymentDrawer({
  isOpen,
  onClose,
  invoice,
  onUpdatePayment,
}: PaymentDrawerProps) {
  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
      <PaymentDrawerContent
        key={invoice.id}
        onClose={onClose}
        invoice={invoice}
        onUpdatePayment={onUpdatePayment}
      />
    </div>
  );
}
