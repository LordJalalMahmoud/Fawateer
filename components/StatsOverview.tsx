'use client';

import React from 'react';
import { Invoice } from '@/lib/types';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CircleDollarSign,
  Receipt
} from 'lucide-react';

interface StatsOverviewProps {
  invoices: Invoice[];
  onFilterStatus?: (status: 'ALL' | 'PAID' | 'UNPAID' | 'PARTIAL') => void;
  activeStatusFilter?: 'ALL' | 'PAID' | 'UNPAID' | 'PARTIAL';
}

export function StatsOverview({ invoices, onFilterStatus, activeStatusFilter = 'ALL' }: StatsOverviewProps) {
  const totalSales = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
  const totalRemaining = invoices.reduce((sum, inv) => sum + (Number(inv.remainingAmount) || 0), 0);

  const paidCount = invoices.filter(inv => inv.status === 'PAID').length;
  const unpaidCount = invoices.filter(inv => inv.status === 'UNPAID').length;
  const partialCount = invoices.filter(inv => inv.status === 'PARTIAL').length;

  const collectionRate = totalSales > 0 ? Math.round((totalPaid / totalSales) * 100) : 0;

  const formatEGP = (val: number) => {
    return new Intl.NumberFormat('ar-EG', {
      maximumFractionDigits: 2,
    }).format(val) + ' ج.م';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 no-print">
      
      {/* 1. Total Sales */}
      <div 
        onClick={() => onFilterStatus?.('ALL')}
        className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs ${
          activeStatusFilter === 'ALL' ? 'border-slate-800 ring-2 ring-slate-800/10' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-semibold text-slate-500">إجمالي المبيعات</span>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {formatEGP(totalSales)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <Receipt className="w-3.5 h-3.5 text-slate-400" />
            <span>{invoices.length} فاتورة مسجلة</span>
          </div>
        </div>
      </div>

      {/* 2. Total Collected / Paid */}
      <div 
        onClick={() => onFilterStatus?.('PAID')}
        className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs ${
          activeStatusFilter === 'PAID' ? 'border-emerald-600 ring-2 ring-emerald-600/10' : 'border-slate-200 hover:border-emerald-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-semibold text-emerald-700">المحصل نقدياً</span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 tracking-tight">
            {formatEGP(totalPaid)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600">
            <span>{paidCount} فاتورة مسددة بالكامل</span>
          </div>
        </div>
      </div>

      {/* 3. Total Uncollected / Outstanding */}
      <div 
        onClick={() => onFilterStatus?.('UNPAID')}
        className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs ${
          activeStatusFilter === 'UNPAID' ? 'border-rose-600 ring-2 ring-rose-600/10' : 'border-slate-200 hover:border-rose-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-semibold text-rose-700">الآجل والديون المستحقة</span>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold text-rose-700 tracking-tight">
            {formatEGP(totalRemaining)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-rose-600">
            <span>{unpaidCount} غير مسددة + {partialCount} سداد جزئي</span>
          </div>
        </div>
      </div>

      {/* 4. Collection Rate Progress */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-semibold text-slate-600">نسبة التحصيل المالي</span>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <CircleDollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{collectionRate}%</span>
            <span className="text-xs text-slate-500 font-medium">معدل السيولة</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                collectionRate > 75 ? 'bg-emerald-500' : collectionRate > 40 ? 'bg-teal-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(collectionRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
