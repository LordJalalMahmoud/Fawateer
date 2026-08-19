'use client';

import React, { useState } from 'react';
import { Invoice } from '@/lib/types';
import { 
  X, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Building2, 
  CheckCircle2,
  FileCheck
} from 'lucide-react';

interface AddMerchantPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchantName: string;
  merchantRemainingDebt: number;
  invoices: Invoice[];
  onApplyPayment: (paymentData: {
    merchantName: string;
    amount: number;
    date: string;
    method: string;
    notes: string;
  }) => void;
}

export function AddMerchantPaymentModal({
  isOpen,
  onClose,
  merchantName,
  merchantRemainingDebt,
  onApplyPayment,
}: AddMerchantPaymentModalProps) {
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState('نقدي (كاش)');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const numAmount = Number(amount) || 0;
  const newDebt = Math.max(0, Number((merchantRemainingDebt - numAmount).toFixed(2)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      alert('الرجاء إدخال مبلغ دفع صحيح أكبر من صفر');
      return;
    }

    onApplyPayment({
      merchantName,
      amount: numAmount,
      date,
      method,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-teal-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-teal-300 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                تسجيل دفعة وسداد نقدي للتاجر
              </h2>
              <p className="text-xs text-teal-200">
                تسجيل تحصيل مالي وتخفيض مديونية: <strong className="text-white">{merchantName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-teal-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          
          {/* Balance Overview */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">المديونية الحالية على التاجر:</div>
              <div className="text-lg font-extrabold text-rose-700 mt-0.5">
                {merchantRemainingDebt.toLocaleString()} ج.م
              </div>
            </div>
            <div className="text-left">
              <div className="text-xs text-slate-500 font-semibold">الرصيد بعد السداد:</div>
              <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
                {newDebt.toLocaleString()} ج.م
              </div>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              المبلغ المدفوع / المحصل (ج.م) *
            </label>
            <input
              type="number"
              required
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
              placeholder="مثال: 5000"
              className="w-full px-3.5 py-2.5 text-base font-extrabold text-teal-700 bg-teal-50/50 border border-teal-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Date & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">تاريخ التحصيل</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">طريقة الدفع</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg"
              >
                <option value="نقدي (كاش)">نقدي (كاش)</option>
                <option value="تحويل بنكي / إنستاباي">تحويل بنكي / إنستاباي</option>
                <option value="فودافون كاش">فودافون كاش</option>
                <option value="شيك بنكي">شيك بنكي</option>
              </select>
            </div>
          </div>

          {/* Notes / Receipt number */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              رقم الإيصال / ملاحظات التحصيل (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: إيصال استلام نقدية رقم 104، تحويل إنستاباي..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأكيد تسجيل السداد</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
