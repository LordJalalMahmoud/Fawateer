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
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  DollarSign,
  Package,
  Lock,
  Truck,
  Building2,
  Calendar,
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
    <div className="space-y-6">
      
      {/* 1. Page Header (Clean open ERP header layout, not a boxed card) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            لوحة التحكم والمؤشرات المالية
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            ملخص الوضع المالي الحالي، متابعة التدفقات النقدية، وآخر الفواتير والتحصيلات المسجلة.
          </p>
        </div>

        {/* Primary & Secondary Actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <button
            onClick={onOpenNewMerchant}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>فتح حساب تاجر</span>
          </button>

          <button
            onClick={onNewInvoice}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <FilePlus className="w-4 h-4" />
            <span>فاتورة جديدة</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Metric Strip (Dense summary, no bulky cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Sales */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">إجمالي المبيعات</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1.5">
            {formatEGP(totalSales)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {invoices.length} فاتورة مسجلة
          </div>
        </div>

        {/* Total Debt */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-rose-200/80 bg-rose-50/10 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-rose-800">
            <span className="font-semibold">المديونيات المعلقة</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-rose-700 mt-1.5">
            {formatEGP(totalRemainingDebt)}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-1">
            طرف {customersWithDebt.length} تاجر ومحل
          </div>
        </div>

        {/* Total Collections */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/10 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-emerald-800">
            <span className="font-semibold">التحصيلات النقدية</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-700 mt-1.5">
            {formatEGP(totalPaid)}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-1">
            معدل السيولة {collectionRate}%
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">عدد العملاء والتجار</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1.5">
            {customerBalances.length} <span className="text-xs font-normal text-slate-500">عميل</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {customerBalances.length - customersWithDebt.length} خالص السداد بالكامل
          </div>
        </div>

      </div>

      {/* 3. Main Content: Real Data Tables (Recent Invoices & Recent Collections) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Table 1: Recent Invoices (7 cols on Desktop) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-800">آخر الفواتير الصادرة</h2>
            </div>
            <button
              onClick={onOpenInvoicesView}
              className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>عرض كافة الفواتير ({invoices.length})</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">رقم الفاتورة</th>
                  <th className="py-2.5 px-3">العميل</th>
                  <th className="py-2.5 px-3">التاريخ</th>
                  <th className="py-2.5 px-3">الإجمالي</th>
                  <th className="py-2.5 px-3">المتبقي</th>
                  <th className="py-2.5 px-3 text-center">الحالة</th>
                  <th className="py-2.5 px-3 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                      <td className="py-2.5 px-3 font-semibold text-slate-900 truncate max-w-[140px]" title={inv.customerName}>
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
                          <span className="font-bold text-rose-700">{formatEGP(inv.remainingAmount)}</span>
                        ) : (
                          <span className="text-emerald-700">0 ج.م</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(inv.status, inv.remainingAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="معاينة الفاتورة"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={onNewInvoice}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              + إنشاء فاتورة جديدة الآن
            </button>
          </div>

        </div>

        {/* Table 2: Recent Collections & Payments (5 cols on Desktop) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-800">آخر التحصيلات وسداد الدفعات</h2>
            </div>
            <button
              onClick={onOpenCustomersView}
              className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>كشف العملاء</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">العميل / المحل</th>
                  <th className="py-2.5 px-3">التاريخ</th>
                  <th className="py-2.5 px-3">المبلغ المحصل</th>
                  <th className="py-2.5 px-3 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                        <div className="font-bold text-slate-900 truncate max-w-[130px]" title={inv.customerName}>
                          {inv.customerName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {inv.invoiceNumber}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono whitespace-nowrap">
                        {inv.date}
                      </td>
                      <td className="py-2.5 px-3 font-bold font-mono text-emerald-700 whitespace-nowrap">
                        {formatEGP(inv.paidAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {inv.remainingAmount <= 0 ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            سداد تام
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
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

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={onOpenCustomersView}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
            >
              عرض أرصدة وحسابات التجار ←
            </button>
          </div>

        </div>

      </div>

      {/* 4. Quick Operational Shortcuts Bar */}
      <div className="bg-slate-100/70 border border-slate-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-600 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span>اختصارات العمليات السريعة:</span>
        </span>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenCustomerProductsSummary && (
            <button
              onClick={() => onOpenCustomerProductsSummary()}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <Package className="w-3 h-3 text-teal-600" />
              <span>مسحوبات كل عميل</span>
            </button>
          )}

          <button
            onClick={onOpenExpensesView}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <DollarSign className="w-3 h-3 text-rose-600" />
            <span>المصروفات والرواتب</span>
          </button>

          <button
            onClick={onOpenCustomersView}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <Users className="w-3 h-3 text-emerald-600" />
            <span>كشف حسابات التجار</span>
          </button>
        </div>
      </div>

    </div>
  );
}
