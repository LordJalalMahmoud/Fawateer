'use client';

import React, { useState, useMemo } from 'react';
import { Invoice, PaymentStatus } from '@/lib/types';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Calendar,
  Layers,
  ArrowUpDown,
  CreditCard,
  Check,
  FilePlus,
  Download,
  Receipt,
  MoreVertical
} from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDuplicateInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onQuickPay: (invoice: Invoice) => void;
  activeStatusFilter: 'ALL' | 'PAID' | 'UNPAID' | 'PARTIAL';
  onStatusFilterChange: (status: 'ALL' | 'PAID' | 'UNPAID' | 'PARTIAL') => void;
  onNewInvoice?: () => void;
  onExportCSV?: () => void;
}

export function InvoiceList({
  invoices,
  onViewInvoice,
  onEditInvoice,
  onDuplicateInvoice,
  onDeleteInvoice,
  onQuickPay,
  activeStatusFilter,
  onStatusFilterChange,
  onNewInvoice,
  onExportCSV,
}: InvoiceListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Distinct customer names for filter dropdown
  const customerOptions = useMemo(() => {
    const names = Array.from(new Set(invoices.map(i => i.customerName.trim()).filter(Boolean)));
    return names.sort();
  }, [invoices]);

  // Filtered & Sorted Invoices
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        // Status filter
        if (activeStatusFilter !== 'ALL' && inv.status !== activeStatusFilter) {
          return false;
        }

        // Customer filter
        if (selectedCustomer !== 'ALL' && inv.customerName.trim() !== selectedCustomer) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchClient = inv.customerName.toLowerCase().includes(q);
          const matchNumber = (inv.invoiceNumber || '').toLowerCase().includes(q);
          const matchPhone = (inv.customerPhone || '').toLowerCase().includes(q);
          const matchAddress = (inv.customerAddress || '').toLowerCase().includes(q);
          const matchItems = inv.items.some(it => it.name.toLowerCase().includes(q));
          const matchNotes = (inv.notes || '').toLowerCase().includes(q);
          if (!matchClient && !matchNumber && !matchPhone && !matchAddress && !matchItems && !matchNotes) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === 'amount-desc') {
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        }
        if (sortBy === 'amount-asc') {
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        }
        return 0;
      });
  }, [invoices, activeStatusFilter, selectedCustomer, searchQuery, sortBy]);

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
          <span>مسدد جزئياً</span>
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
    <div className="space-y-4 no-print">
      
      {/* 1. Header (Req.txt #5): Title + Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              سجل الفواتير والمبيعات
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {invoices.length} فاتورة
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            إدارة فواتير المبيعات الصادرة، متابعة سداد الدفعات وتحديث الحالات والطباعة.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {onExportCSV && (
            <button
              type="button"
              onClick={onExportCSV}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>تصدير Excel</span>
            </button>
          )}

          {onNewInvoice && (
            <button
              type="button"
              onClick={onNewInvoice}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <FilePlus className="w-4 h-4" />
              <span>+ فاتورة جديدة</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Compact Toolbar (Req.txt #7): Search + Status Filters + Customer + Sort */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث برقم الفاتورة، العميل، الصنف، الهاتف، العنوان أو الملاحظات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Customer & Sort Dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">جميع العملاء ({customerOptions.length})</option>
              {customerOptions.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="date-desc">الأحدث تاريخاً</option>
              <option value="date-asc">الأقدم تاريخاً</option>
              <option value="amount-desc">الأعلى قيمة</option>
              <option value="amount-asc">الأقل قيمة</option>
            </select>
          </div>

        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs font-medium border-t border-slate-100 pt-2.5">
          <button
            type="button"
            onClick={() => onStatusFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeStatusFilter === 'ALL'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            الكل ({invoices.length})
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('PAID')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeStatusFilter === 'PAID'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>مسددة بالكامل ({invoices.filter(i => i.status === 'PAID').length})</span>
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('UNPAID')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeStatusFilter === 'UNPAID'
                ? 'bg-rose-600 text-white font-bold shadow-xs'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>غير مسددة / أجل ({invoices.filter(i => i.status === 'UNPAID').length})</span>
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('PARTIAL')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeStatusFilter === 'PARTIAL'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>مسدد جزئياً ({invoices.filter(i => i.status === 'PARTIAL').length})</span>
          </button>
        </div>

      </div>

      {/* 3. Professional Data Table (Req.txt #5) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">لا توجد فواتير مطابقة للبحث</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              جرّب تعديل الفلاتر أو عبارة البحث أو اضغط على &quot;فاتورة جديدة&quot;.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">رقم الفاتورة</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">العميل والبيانات</th>
                  <th className="py-3 px-4">الأصناف والكميات</th>
                  <th className="py-3 px-4">الإجمالي</th>
                  <th className="py-3 px-4">المسدد / المتبقي</th>
                  <th className="py-3 px-4 text-center">حالة السداد</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  const hasBalance = (inv.remainingAmount || 0) > 0;

                  return (
                    <tr 
                      key={inv.id}
                      onClick={() => onViewInvoice(inv)}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >
                      
                      {/* Invoice Number */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{inv.date}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {inv.customerName}
                        </div>
                        {inv.customerPhone && (
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5" dir="ltr">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            <span>{inv.customerPhone}</span>
                          </div>
                        )}
                        {inv.customerAddress && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[150px] mt-0.5" title={inv.customerAddress}>
                            {inv.customerAddress}
                          </div>
                        )}
                      </td>

                      {/* Items Preview */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-800 font-medium truncate max-w-[180px]" title={inv.items.map(it => `${it.quantity} ${it.name}`).join(' ، ')}>
                          {inv.items.map(it => `${it.quantity} ${it.name}`).join(' ، ')}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {inv.items.length} {inv.items.length === 1 ? 'صنف' : 'أصناف'} • {inv.items.reduce((s, it) => s + (it.quantity || 0), 0)} وحدة
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-900 text-xs sm:text-sm">
                        {formatEGP(inv.totalAmount)}
                      </td>

                      {/* Paid & Remaining */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        <div className="text-emerald-700 font-semibold">
                          مسدد: {formatEGP(inv.paidAmount)}
                        </div>
                        {hasBalance ? (
                          <div className="font-bold text-rose-700 mt-0.5">
                            متبقي: {formatEGP(inv.remainingAmount)}
                          </div>
                        ) : (
                          <div className="text-slate-400 mt-0.5 text-[11px]">
                            خالص
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {getStatusBadge(inv.status, inv.remainingAmount)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          
                          {/* Quick Pay Button */}
                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() => onQuickPay(inv)}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="تسجيل دفعة / تسديد"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View & Print */}
                          <button
                            type="button"
                            onClick={() => onViewInvoice(inv)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="معاينة وطباعة"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => onEditInvoice(inv)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="تعديل الفاتورة"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => onDuplicateInvoice(inv)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="تكرار الفاتورة"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`هل أنت متأكد من حذف فاتورة ${inv.customerName} رقم ${inv.invoiceNumber}؟`)) {
                                onDeleteInvoice(inv.id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف الفاتورة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Summary */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <div>
            عرض <strong className="text-slate-900">{filteredInvoices.length}</strong> من أصل <strong className="text-slate-900">{invoices.length}</strong> فاتورة
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span>إجمالي المعروض: <strong className="text-slate-900">{formatEGP(filteredInvoices.reduce((s, i) => s + i.totalAmount, 0))}</strong></span>
            <span>المتبقي المعروض: <strong className="text-rose-700">{formatEGP(filteredInvoices.reduce((s, i) => s + i.remainingAmount, 0))}</strong></span>
          </div>
        </div>

      </div>

    </div>
  );
}
