'use client';

import React, { useState, useMemo } from 'react';
import { Invoice, CustomerBalance } from '@/lib/types';
import { calculateCustomerBalances } from '@/lib/storage';
import { 
  Users, 
  X, 
  Search, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  MessageCircle, 
  ArrowRight, 
  TrendingUp, 
  Calendar,
  Eye,
  FileSpreadsheet,
  Download,
  Package
} from 'lucide-react';

interface CustomerLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  onViewInvoice: (invoice: Invoice) => void;
  onOpenCustomerProductsSummary?: (customerName?: string) => void;
}

export function CustomerLedgerModal({
  isOpen,
  onClose,
  invoices,
  onViewInvoice,
  onOpenCustomerProductsSummary,
}: CustomerLedgerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const [clientSubTab, setClientSubTab] = useState<'INVOICES' | 'PRODUCTS'>('INVOICES');
  const [filterDebtOnly, setFilterDebtOnly] = useState(false);

  const balances: CustomerBalance[] = useMemo(() => {
    return calculateCustomerBalances(invoices);
  }, [invoices]);

  const filteredBalances = useMemo(() => {
    return balances.filter(c => {
      if (filterDebtOnly && c.remainingDebt <= 0) return false;
      if (searchQuery.trim()) {
        return c.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      }
      return true;
    });
  }, [balances, filterDebtOnly, searchQuery]);

  // Selected client's invoices
  const clientInvoices = useMemo(() => {
    if (!selectedClientName) return [];
    return invoices
      .filter(i => i.customerName.trim() === selectedClientName.trim())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, selectedClientName]);

  const selectedBalance = useMemo(() => {
    if (!selectedClientName) return null;
    return balances.find(b => b.name === selectedClientName) || null;
  }, [balances, selectedClientName]);

  // Aggregate product demand for selected client
  const clientAggregatedProducts = useMemo(() => {
    if (!selectedClientName) return [];
    const map = new Map<string, {
      name: string;
      totalQty: number;
      unit: string;
      totalAmount: number;
      count: number;
      lastPrice: number;
      lastDate: string;
    }>();

    clientInvoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const name = (item.name || '').trim();
        if (!name) return;
        const qty = Number(item.quantity || 0);
        const price = Number(item.unitPrice || 0);
        const total = Number(item.total || (qty * price));
        const unit = (item.unit || 'قطعة').trim();

        if (!map.has(name)) {
          map.set(name, {
            name,
            totalQty: 0,
            unit,
            totalAmount: 0,
            count: 0,
            lastPrice: price,
            lastDate: inv.date,
          });
        }
        const p = map.get(name)!;
        p.totalQty += qty;
        p.totalAmount += total;
        p.count += 1;
        p.lastPrice = price;
        p.lastDate = inv.date;
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
  }, [clientInvoices, selectedClientName]);

  const clientTotalUnits = useMemo(() => {
    return clientAggregatedProducts.reduce((sum, p) => sum + p.totalQty, 0);
  }, [clientAggregatedProducts]);

  if (!isOpen) return null;

  const formatEGP = (val: number) => {
    return new Intl.NumberFormat('ar-EG', {
      maximumFractionDigits: 2,
    }).format(val) + ' ج.م';
  };

  const handleSendReminderWhatsApp = (clientName: string, debt: number) => {
    const text = encodeURIComponent(
      `السلام عليكم ورحمة الله وبركاته،\nالأخ الفاضل / ${clientName} المحترم،\n\nنود إحاطتكم علماً بأن إجمالي الرصيد المتبقي والمستحق لحسابكم هو: *${debt.toLocaleString()} جنيه مصري*.\n\nشاكرين ومقدرين حسن تعاونكم الدائم معنا.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {selectedClientName ? `كشف حساب العميل: ${selectedClientName}` : 'كشف حسابات العملاء والمديونيات'}
              </h2>
              <p className="text-xs text-slate-500">
                {selectedClientName 
                  ? 'سجل الحركات المالية والفواتير التفصيلية للعميل' 
                  : 'متابعة إجمالي مبيعات كل عميل، المسدد منه، والمبالغ الآجلة المطلوبة'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCustomerProductsSummary && (
              <button
                onClick={() => onOpenCustomerProductsSummary(selectedClientName || undefined)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                title="عرض تقرير إجمالي مسحوبات الأصناف بالتفصيل"
              >
                <Package className="w-3.5 h-3.5 text-teal-700" />
                <span>تقرير مسحوبات الأصناف</span>
              </button>
            )}

            {selectedClientName && (
              <button
                onClick={() => {
                  setSelectedClientName(null);
                  setClientSubTab('INVOICES');
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة لكل العملاء</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* VIEW 1: All Clients Summary */}
          {!selectedClientName ? (
            <div className="space-y-4">
              
              {/* Top Stats Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold">إجمالي عدد العملاء</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{balances.length} عميل</div>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="text-xs text-rose-700 font-semibold">إجمالي المديونيات المعلقة</div>
                  <div className="text-xl font-bold text-rose-700 mt-1">
                    {formatEGP(balances.reduce((s, b) => s + (b.remainingDebt > 0 ? b.remainingDebt : 0), 0))}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs text-emerald-700 font-semibold">العملاء خالصين السداد</div>
                  <div className="text-xl font-bold text-emerald-700 mt-1">
                    {balances.filter(b => b.remainingDebt <= 0).length} عميل
                  </div>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="ابحث باسم العميل أو المحل..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <button
                  onClick={() => setFilterDebtOnly(!filterDebtOnly)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    filterDebtOnly
                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>العملاء المدينون فقط ({balances.filter(b => b.remainingDebt > 0).length})</span>
                </button>
              </div>

              {/* Clients Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-100/80 text-slate-700 text-xs font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">اسم العميل / المحل</th>
                      <th className="py-3 px-4 text-center">الفواتير</th>
                      <th className="py-3 px-4">إجمالي المسحوبات</th>
                      <th className="py-3 px-4">المسدد</th>
                      <th className="py-3 px-4">الرصيد المتبقي (المديونية)</th>
                      <th className="py-3 px-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBalances.map((client) => {
                      const hasDebt = client.remainingDebt > 0;

                      return (
                        <tr 
                          key={client.name}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          {/* Client Name */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{client.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>آخر حركة: {client.lastInvoiceDate}</span>
                            </div>
                          </td>

                          {/* Invoice Count */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                              {client.invoiceCount} فاتورة
                            </span>
                          </td>

                          {/* Invoiced */}
                          <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                            {formatEGP(client.totalInvoiced)}
                          </td>

                          {/* Paid */}
                          <td className="py-3 px-4 font-semibold text-emerald-700 whitespace-nowrap">
                            {formatEGP(client.totalPaid)}
                          </td>

                          {/* Debt */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {hasDebt ? (
                              <span className="font-extrabold text-rose-700">
                                {formatEGP(client.remainingDebt)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>خالص السداد</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {hasDebt && (
                                <button
                                  onClick={() => handleSendReminderWhatsApp(client.name, client.remainingDebt)}
                                  className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                  title="إرسال تذكير بالمستحقات عبر الواتساب"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                onClick={() => setSelectedClientName(client.name)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <span>كشف حساب</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
            /* VIEW 2: Detailed Client Statement */
            <div className="space-y-6">
              
              {/* Client Summary Box */}
              {selectedBalance && (
                <div className="p-5 rounded-2xl bg-teal-900 text-white shadow-md grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-teal-200">العميل</div>
                    <div className="text-lg font-bold mt-0.5">{selectedBalance.name}</div>
                    <div className="text-xs text-teal-300 mt-1">{selectedBalance.invoiceCount} فواتير مسجلة</div>
                  </div>
                  <div>
                    <div className="text-xs text-teal-200">إجمالي المشتريات</div>
                    <div className="text-lg font-bold mt-0.5">{formatEGP(selectedBalance.totalInvoiced)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-teal-200">إجمالي المسدد</div>
                    <div className="text-lg font-bold text-emerald-300 mt-0.5">{formatEGP(selectedBalance.totalPaid)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-teal-200">الرصيد المتبقي (المطلوب)</div>
                    <div className={`text-xl font-extrabold mt-0.5 ${selectedBalance.remainingDebt > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {formatEGP(selectedBalance.remainingDebt)}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions & WhatsApp Reminder */}
              {selectedBalance && selectedBalance.remainingDebt > 0 && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-rose-800">
                    <strong>تنبيه مديونية:</strong> هذا العميل عليه رصيد مستحق بقيمة <strong className="text-sm">{formatEGP(selectedBalance.remainingDebt)}</strong>.
                  </div>
                  <button
                    onClick={() => handleSendReminderWhatsApp(selectedBalance.name, selectedBalance.remainingDebt)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>إرسال مطالبة بالرصيد للواتساب</span>
                  </button>
                </div>
              )}

              {/* Subtabs for selected client */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setClientSubTab('INVOICES')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                      clientSubTab === 'INVOICES'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>سجل الفواتير التفصيلية ({clientInvoices.length})</span>
                  </button>

                  <button
                    onClick={() => setClientSubTab('PRODUCTS')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                      clientSubTab === 'PRODUCTS'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>إجمالي الأصناف المطلوبة ({clientAggregatedProducts.length})</span>
                  </button>
                </div>

                {clientSubTab === 'PRODUCTS' && onOpenCustomerProductsSummary && (
                  <button
                    onClick={() => onOpenCustomerProductsSummary(selectedClientName)}
                    className="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                  >
                    فتح التقرير الشامل والمقارنة ←
                  </button>
                )}
              </div>

              {/* Invoices Timeline */}
              {clientSubTab === 'INVOICES' && (
              <div className="space-y-3">
                <div className="space-y-3">
                  {clientInvoices.map((inv) => (
                    <div 
                      key={inv.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 transition-all shadow-2xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{inv.invoiceNumber}</span>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {inv.date}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : inv.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {inv.status === 'PAID' ? 'مسددة بالكامل' : inv.status === 'PARTIAL' ? 'سداد جزئي' : 'غير مسددة'}
                          </span>
                          <button
                            onClick={() => {
                              onClose();
                              onViewInvoice(inv);
                            }}
                            className="p-1 text-slate-400 hover:text-teal-600 rounded-md cursor-pointer"
                            title="معاينة وطباعة هذه الفاتورة"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Items list */}
                      <div className="flex flex-wrap gap-1.5 my-2">
                        {inv.items.map((it, itIdx) => (
                          <span key={itIdx} className="text-xs bg-slate-50 px-2 py-1 rounded-md border border-slate-200 text-slate-700">
                            {it.name} ({it.quantity} {it.unit}) × {it.unitPrice} ج = <strong>{it.total} ج</strong>
                          </span>
                        ))}
                      </div>

                      {/* Bottom breakdown */}
                      <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-600 gap-2">
                        <div>
                          {inv.notes && <span>ملاحظات: {inv.notes}</span>}
                        </div>
                        <div className="flex items-center gap-4">
                          <span>الإجمالي: <strong className="text-slate-900">{formatEGP(inv.totalAmount)}</strong></span>
                          <span>المسدد: <strong className="text-emerald-700">{formatEGP(inv.paidAmount)}</strong></span>
                          <span>المتبقي: <strong className={inv.remainingAmount > 0 ? 'text-rose-700' : 'text-slate-400'}>{formatEGP(inv.remainingAmount)}</strong></span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

              </div>
              )}

              {/* Aggregated Products Subtab */}
              {clientSubTab === 'PRODUCTS' && (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        كشف إجمالي مسحوبات العميل من كل صنف على حدة عبر جميع الفواتير
                      </span>
                      <span className="text-xs text-teal-700 font-bold">
                        إجمالي العبوات: {clientTotalUnits.toLocaleString()}
                      </span>
                    </div>

                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 w-8">#</th>
                          <th className="py-2.5 px-3">اسم المنتج / الصنف</th>
                          <th className="py-2.5 px-3 text-center">إجمالي الكمية</th>
                          <th className="py-2.5 px-3 text-center">الوحدة</th>
                          <th className="py-2.5 px-3 text-left">متوسط السعر</th>
                          <th className="py-2.5 px-3 text-left">آخر سعر</th>
                          <th className="py-2.5 px-3 text-left">إجمالي القيمة</th>
                          <th className="py-2.5 px-3 text-center">عدد مرات الطلب</th>
                          <th className="py-2.5 px-3 text-center">آخر تاريخ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {clientAggregatedProducts.map((p, idx) => (
                          <tr key={p.name} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{p.name}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md font-black text-teal-800 bg-teal-50 border border-teal-200">
                                {p.totalQty.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600 font-medium">{p.unit}</td>
                            <td className="py-2.5 px-3 text-left font-mono text-slate-700">
                              {(p.totalAmount / (p.totalQty || 1)).toFixed(2)} ج.م
                            </td>
                            <td className="py-2.5 px-3 text-left font-mono text-slate-600">
                              {p.lastPrice.toLocaleString()} ج.م
                            </td>
                            <td className="py-2.5 px-3 text-left font-mono font-bold text-emerald-700">
                              {p.totalAmount.toLocaleString()} ج.م
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600 font-mono">
                              {p.count}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-500 text-[11px]">
                              {p.lastDate}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            تحديث مباشر لجميع الحسابات والمديونيات
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
