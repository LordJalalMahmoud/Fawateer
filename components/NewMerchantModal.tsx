'use client';

import React, { useState } from 'react';
import { Invoice } from '@/lib/types';
import { 
  X, 
  UserPlus, 
  Building2, 
  Phone, 
  MapPin, 
  DollarSign,
  Save
} from 'lucide-react';

interface NewMerchantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMerchant: (merchantData: {
    name: string;
    phone: string;
    address: string;
    openingDebt: number;
  }) => void;
}

export function NewMerchantModal({
  isOpen,
  onClose,
  onAddMerchant,
}: NewMerchantModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingDebt, setOpeningDebt] = useState<number | ''>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('الرجاء إدخال اسم التاجر أو المحل');
      return;
    }

    onAddMerchant({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      openingDebt: Number(openingDebt) || 0,
    });

    setName('');
    setPhone('');
    setAddress('');
    setOpeningDebt('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                فتح حساب تاجر / عميل جديد
              </h2>
              <p className="text-xs text-slate-300">
                تسجيل تاجر جديد في النظام لبدء تسجيل مسحوباته ودفعاته
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم التاجر / المحل / السوبرماركت *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: محلات الصالحين، سوبرماركت البركة..."
                className="w-full pl-3 pr-9 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
              <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              رقم هاتف التاجر (لإرسال كشوف الحساب عبر واتساب)
            </label>
            <div className="relative">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010XXXXXXXX"
                className="w-full pl-3 pr-9 py-2 text-sm bg-white border border-slate-300 rounded-xl"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              العنوان / مكان التسليم
            </label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: 6 أكتوبر، شارع جمال عبد الناصر..."
                className="w-full pl-3 pr-9 py-2 text-sm bg-white border border-slate-300 rounded-xl"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Opening balance / Old Debt */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              رصيد مديونية قديم / افتتاحي سابق (إن وُجد)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={openingDebt}
                onChange={(e) => setOpeningDebt(parseFloat(e.target.value) || '')}
                placeholder="0"
                className="w-full pl-3 pr-9 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold text-rose-700"
              />
              <DollarSign className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              إذا كان على التاجر حساب سابق قبل بدء النظام، ضعه هنا وسيُحتسب في مديونيته.
            </p>
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
              className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>إنشاء حساب التاجر</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
