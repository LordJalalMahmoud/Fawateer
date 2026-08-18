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
  Check
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
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>مسددة بالكامل</span>
        </span>
      );
    }
    if (status === 'PARTIAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          <span>مسدد جزئياً</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>غير مسددة (أجل)</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden no-print">
      
      {/* Controls Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col gap-4">
        
        {/* Top search & filters bar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث باسم العميل، الصنف، رقم الفاتورة، العنوان أو الملاحظات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                مسح
              </button>
            )}
          </div>

          {/* Customer Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="px-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 cursor-pointer"
            >
              <option value="ALL">جميع العملاء ({customerOptions.length})</option>
              {customerOptions.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 cursor-pointer"
            >
              <option value="date-desc">الأحدث تاريخاً</option>
              <option value="date-asc">الأقدم تاريخاً</option>
              <option value="amount-desc">الأعلى قيمة</option>
              <option value="amount-asc">الأقل قيمة</option>
            </select>
          </div>

        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs sm:text-sm font-medium">
          
          <button
            onClick={() => onStatusFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeStatusFilter === 'ALL'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            الكل ({invoices.length})
          </button>

          <button
            onClick={() => onStatusFilterChange('PAID')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeStatusFilter === 'PAID'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/70'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>مسددة بالكامل ({invoices.filter(i => i.status === 'PAID').length})</span>
          </button>

          <button
            onClick={() => onStatusFilterChange('UNPAID')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeStatusFilter === 'UNPAID'
                ? 'bg-rose-600 text-white font-semibold shadow-xs'
                : 'text-rose-700 bg-rose-50/70 hover:bg-rose-100/70'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>غير مسددة / أجل ({invoices.filter(i => i.status === 'UNPAID').length})</span>
          </button>

          <button
            onClick={() => onStatusFilterChange('PARTIAL')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeStatusFilter === 'PARTIAL'
                ? 'bg-amber-600 text-white font-semibold shadow-xs'
                : 'text-amber-700 bg-amber-50/70 hover:bg-amber-100/70'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>مسدد جزئياً ({invoices.filter(i => i.status === 'PARTIAL').length})</span>
          </button>

        </div>

      </div>

      {/* Invoices List / Table */}
      {filteredInvoices.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">لا توجد فواتير مطابقة</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            جرّب تغيير عبارة البحث أو الفلتر، أو أضف فاتورة جديدة
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50/75 text-slate-600 text-xs font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">الفاتورة والتاريخ</th>
                <th className="py-3.5 px-4">العميل والبيانات</th>
                <th className="py-3.5 px-4">الأصناف والكميات</th>
                <th className="py-3.5 px-4">الإجمالي</th>
                <th className="py-3.5 px-4">المسدد / المتبقي</th>
                <th className="py-3.5 px-4 text-center">حالة السداد</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const isPaid = inv.status === 'PAID';
                const hasBalance = (inv.remainingAmount || 0) > 0;

                return (
                  <tr 
                    key={inv.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    
                    {/* Invoice # & Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>{inv.invoiceNumber}</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{inv.date}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{inv.customerName}</div>
                      {inv.customerAddress && (
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-xs" title={inv.customerAddress}>
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{inv.customerAddress}</span>
                        </div>
                      )}
                      {inv.customerPhone && (
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{inv.customerPhone}</span>
                        </div>
                      )}
                    </td>

                    {/* Items Preview */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-xs text-slate-800 font-medium line-clamp-1">
                        {inv.items.map(it => `${it.quantity} ${it.name}`).join(' ، ')}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {inv.items.length} {inv.items.length === 1 ? 'صنف' : 'أصناف'} • {inv.items.reduce((s, it) => s + (it.quantity || 0), 0)} كرتونة/وحدة
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-base">
                        {formatEGP(inv.totalAmount)}
                      </div>
                      {inv.taxAmount > 0 && (
                        <div className="text-xs text-slate-500">
                          شامل ضريبة {formatEGP(inv.taxAmount)}
                        </div>
                      )}
                    </td>

                    {/* Paid & Remaining */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-xs font-semibold text-emerald-700">
                        مسدد: {formatEGP(inv.paidAmount)}
                      </div>
                      {hasBalance ? (
                        <div className="text-xs font-bold text-rose-700 mt-0.5">
                          متبقي: {formatEGP(inv.remainingAmount)}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 mt-0.5">
                          لا يوجد متبقي
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(inv.status, inv.remainingAmount)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        
                        {/* Quick Pay Button */}
                        {!isPaid && (
                          <button
                            onClick={() => onQuickPay(inv)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="تسجيل دفعة / تسديد"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}

                        {/* View & Print */}
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="معاينة وطباعة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEditInvoice(inv)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="تعديل الفاتورة"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => onDuplicateInvoice(inv)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="تكرار الفاتورة"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من حذف فاتورة ${inv.customerName} رقم ${inv.invoiceNumber}؟`)) {
                              onDeleteInvoice(inv.id);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
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
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
        <div>
          عرض <span className="font-bold text-slate-900">{filteredInvoices.length}</span> من أصل <span className="font-bold text-slate-900">{invoices.length}</span> فاتورة
        </div>
        <div className="flex items-center gap-4">
          <span>إجمالي المعروض: <strong className="text-slate-900">{formatEGP(filteredInvoices.reduce((s, i) => s + i.totalAmount, 0))}</strong></span>
          <span>المتبقي المعروض: <strong className="text-rose-700">{formatEGP(filteredInvoices.reduce((s, i) => s + i.remainingAmount, 0))}</strong></span>
        </div>
      </div>

    </div>
  );
}
