'use client';

import React, { useMemo } from 'react';
import { Invoice, PaymentStatus } from '@/lib/types';
import { calculateCustomerBalances } from '@/lib/storage';
import {
  TrendingUp,
  Receipt,
  Users,
  CreditCard,
  FilePlus,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Package,
  Building2,
  Eye,
  Plus
} from 'lucide-react';

interface DashboardOverviewProps {
  invoices: Invoice[];
  onNewInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onQuickPay: (invoice: Invoice) => void;
  onOpenCustomersView: () => void;
  onOpenInvoicesView: () => void;
  onOpenExpensesView: () => void;
  onOpenNewMerchant: () => void;
  onOpenAddPayment?: (merchantName: string, debt: number) => void;
  onOpenStatement?: (merchantName: string) => void;
  onOpenCustomerProductsSummary?: (customerName?: string) => void;
}

export function DashboardOverview({
  invoices,
  onNewInvoice,
  onViewInvoice,
  onQuickPay,
  onOpenCustomersView,
  onOpenInvoicesView,
  onOpenExpensesView,
  onOpenNewMerchant,
  onOpenAddPayment,
  onOpenStatement,
  onOpenCustomerProductsSummary,
}: DashboardOverviewProps) {
  // Aggregate Financial Metrics
  const totalSales = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  }, [invoices]);

  const totalPaid = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
  }, [invoices]);

  const totalRemainingDebt = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (Number(inv.remainingAmount) || 0), 0);
  }, [invoices]);

  const customerBalances = useMemo(() => {
    return calculateCustomerBalances(invoices);
  }, [invoices]);

  const customersWithDebt = useMemo(() => {
    return customerBalances.filter(c => c.remainingDebt > 0);
  }, [customerBalances]);

  // Recent 6 Invoices
  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [invoices]);

  // Recent Payments & Collections (Paid or Partial invoices)
  const recentCollections = useMemo(() => {
    return [...invoices]
      .filter(i => (i.paidAmount || 0) > 0)
      .sort((a, b) => new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime())
      .slice(0, 6);
  }, [invoices]);

  const collectionRate = totalSales > 0 ? Math.round((totalPaid / totalSales) * 100) : 0;

  const formatEGP = (val: number) => {
    return new Intl.NumberFormat('ar-EG', {
      maximumFractionDigits: 2,
    }).format(val) + ' ج.م';
  };

  const getStatusBadge = (status: PaymentStatus, remaining: number) => {
    if (status === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" />
          <span>مسددة</span>
        </span>
      );
    }
    if (status === 'PARTIAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3" />
          <span>سداد جزئي</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertCircle className="w-3 h-3" />
        <span>آجل / غير مسددة</span>
      </span>
    );
  };

  return (
    <div className="space-y-8">
      
      {/* 1. Page Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            لوحة التحكم
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            ملخص الوضع المالي الحالي، متابعة التدفقات النقدية، وآخر الفواتير والتحصيلات المسجلة.
          </p>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <button
            onClick={onOpenNewMerchant}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>+ فتح حساب تاجر</span>
          </button>

          <button
            onClick={onNewInvoice}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <FilePlus className="w-4 h-4" />
            <span>+ فاتورة جديدة</span>
          </button>
        </div>
      </div>

      {/* 2. Financial Summary Strip (Toolbar-style metrics bar, flat, no cards) */}
      <div className="py-2 border-b border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-200">
          
          {/* 1. إجمالي المبيعات */}
          <div className="py-3 sm:py-0 px-2 sm:px-5 flex flex-col justify-between first:pr-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>إجمالي المبيعات</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight my-1.5">
              {formatEGP(totalSales)}
            </div>
            <div className="text-[11px] text-slate-400">
              {invoices.length} فاتورة مسجلة
            </div>
          </div>

          {/* 2. المديونيات المعلقة */}
          <div className="py-3 sm:py-0 px-2 sm:px-5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>المديونيات المعلقة</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-rose-600 tracking-tight my-1.5">
              {formatEGP(totalRemainingDebt)}
            </div>
            <div className="text-[11px] text-slate-400">
              طرف {customersWithDebt.length} تجار متأخرين
            </div>
          </div>

          {/* 3. التحصيلات النقدية */}
          <div className="py-3 sm:py-0 px-2 sm:px-5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>التحصيلات النقدية</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 tracking-tight my-1.5">
              {formatEGP(totalPaid)}
            </div>
            <div className="text-[11px] text-slate-400">
              معدل التحصيل {collectionRate}%
            </div>
          </div>

          {/* 4. العملاء والتجار */}
          <div className="py-3 sm:py-0 px-2 sm:px-5 flex flex-col justify-between last:pl-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>العملاء والتجار</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight my-1.5">
              {customerBalances.length} <span className="text-xs font-normal text-slate-400 font-sans">عميل</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {customerBalances.length - customersWithDebt.length} خالص السداد بالكامل
            </div>
          </div>

        </div>
      </div>

      {/* 3. Section: Recent Invoices (Real Data Section directly on the Workspace, NO Card) */}
      <section className="space-y-3">
        
        {/* Section Header Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              آخر الفواتير المصدرة
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              ({invoices.length} فاتورة)
            </span>
          </div>

          <button
            onClick={onOpenInvoicesView}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>عرض كافة الفواتير</span>
            <span aria-hidden="true">←</span>
          </button>
        </div>

        {/* Real Data Table (Directly in Workspace, NO Card container) */}
        <div className="overflow-x-auto border-t border-b border-slate-200">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3 whitespace-nowrap font-semibold">رقم الفاتورة</th>
                <th className="py-2.5 px-3 whitespace-nowrap font-semibold">العميل</th>
                <th className="py-2.5 px-3 whitespace-nowrap font-semibold">التاريخ</th>
                <th className="py-2.5 px-3 whitespace-nowrap font-semibold">الإجمالي</th>
                <th className="py-2.5 px-3 whitespace-nowrap font-semibold">المتبقي</th>
                <th className="py-2.5 px-3 whitespace-nowrap font-semibold text-center">الحالة</th>
                <th className="py-2.5 px-3 whitespace-nowrap font-semibold text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    لا توجد فواتير مسجلة بعد
                  </td>
                </tr>
              ) : (
                recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap" title={inv.customerName}>
                      {inv.customerName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono whitespace-nowrap">
                      {inv.date}
                    </td>
                    <td className="py-2.5 px-3 font-bold font-mono text-slate-900 whitespace-nowrap">
                      {formatEGP(inv.totalAmount)}
                    </td>
                    <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                      {(inv.remainingAmount || 0) > 0 ? (
                        <span className="font-bold text-rose-600">{formatEGP(inv.remainingAmount)}</span>
                      ) : (
                        <span className="text-emerald-600">0 ج.م</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(inv.status, inv.remainingAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        title="معاينة الفاتورة"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>معاينة</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </section>

      {/* 4. Section: Recent Collections & Payments (Real Data Section directly on the Workspace, NO Card) */}
      <section className="space-y-3">
        
        {/* Section Header Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              آخر التحصيلات وسداد الدفعات
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              ({recentCollections.length} عمليات مؤخرة)
            </span>
          </div>

          <button
            onClick={onOpenCustomersView}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>كشف حساب العملاء</span>
            <span aria-hidden="true">←</span>
          </button>
        </div>

        {/* Real Data Table (Directly in Workspace, NO Card container) */}
        <div className="overflow-x-auto border-t border-b border-slate-200">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3 whitespace-nowrap font-semibold">العميل / المحل</th>
                <th className="py-2.5 px-3 whitespace-nowrap font-semibold">التاريخ</th>
                <th className="py-2.5 px-3 whitespace-nowrap font-semibold">المبلغ المحصل</th>
                <th className="py-2.5 px-3 whitespace-nowrap font-semibold text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {recentCollections.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    لا توجد تحصيلات نقدية مسجلة بعد
                  </td>
                </tr>
              ) : (
                recentCollections.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">
                        {inv.customerName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {inv.invoiceNumber}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono whitespace-nowrap">
                      {inv.date}
                    </td>
                    <td className="py-2.5 px-3 font-bold font-mono text-emerald-600 whitespace-nowrap">
                      {formatEGP(inv.paidAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {inv.remainingAmount <= 0 ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          سداد تام
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          دفعة جزئية
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </section>

      {/* 5. Quick Operational Shortcuts Bar (Compact Action Bar, flat, no card) */}
      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-600 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span>اختصارات العمليات السريعة:</span>
        </span>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenCustomerProductsSummary && (
            <button
              onClick={() => onOpenCustomerProductsSummary()}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5 text-teal-600" />
              <span>مسحوبات كل عميل</span>
            </button>
          )}

          <button
            onClick={onOpenExpensesView}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5 text-rose-600" />
            <span>المصروفات والرواتب</span>
          </button>

          <button
            onClick={onOpenCustomersView}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>كشف حساب التجار</span>
          </button>
        </div>
      </div>

    </div>
  );
}
