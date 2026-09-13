'use client';

import React, { useState, useMemo } from 'react';
import { Invoice, ProductCatalogItem, CustomerBalance } from '@/lib/types';
import { calculateCustomerBalances } from '@/lib/storage';
import {
  Users,
  Search,
  Plus,
  Package,
  DollarSign,
  FileText,
  MessageCircle,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Building2,
  Receipt,
  UserPlus,
  ArrowUpDown,
  X,
  ExternalLink,
  ChevronDown,
  Eye,
  CreditCard,
  Layers,
  MoreVertical,
  Check
} from 'lucide-react';

interface MerchantAccountsViewProps {
  invoices: Invoice[];
  productCatalog?: ProductCatalogItem[];
  onOpenNewMerchant: () => void;
  onOpenAddGoods: (merchantName: string, phone?: string, address?: string) => void;
  onOpenAddPayment: (merchantName: string, debt: number) => void;
  onOpenStatement: (merchantName: string) => void;
  onOpenProductsSummary?: (customerName?: string) => void;
  onViewInvoice?: (invoice: Invoice) => void;
}

export function MerchantAccountsView({
  invoices,
  productCatalog = [],
  onOpenNewMerchant,
  onOpenAddGoods,
  onOpenAddPayment,
  onOpenStatement,
  onOpenProductsSummary,
  onViewInvoice,
}: MerchantAccountsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDebtOnly, setFilterDebtOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'debt-desc' | 'activity-desc' | 'name-asc' | 'invoiced-desc'>('debt-desc');

  // Customer Detail Drawer State (Req.txt #4)
  const [selectedMerchantName, setSelectedMerchantName] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<'OVERVIEW' | 'INVOICES' | 'PAYMENTS' | 'PRODUCTS' | 'STATEMENT'>('OVERVIEW');

  // Group all merchants from invoices
  const balances: CustomerBalance[] = useMemo(() => {
    return calculateCustomerBalances(invoices);
  }, [invoices]);

  // Overall statistics
  const totalReceivables = useMemo(() => {
    return balances.reduce((sum, b) => sum + (b.remainingDebt > 0 ? b.remainingDebt : 0), 0);
  }, [balances]);

  const totalInvoiced = useMemo(() => {
    return balances.reduce((sum, b) => sum + b.totalInvoiced, 0);
  }, [balances]);

  const totalCollected = useMemo(() => {
    return balances.reduce((sum, b) => sum + b.totalPaid, 0);
  }, [balances]);

  // Filter & Sort
  const filteredBalances = useMemo(() => {
    return balances
      .filter(c => {
        if (filterDebtOnly && c.remainingDebt <= 0) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = c.name.toLowerCase().includes(q);
          const matchedInv = invoices.find(i => (i.customerName || '').trim() === c.name.trim());
          const matchPhone = (matchedInv?.customerPhone || '').includes(q);
          const matchAddress = (matchedInv?.customerAddress || '').toLowerCase().includes(q);
          return matchName || matchPhone || matchAddress;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'debt-desc') {
          return (b.remainingDebt || 0) - (a.remainingDebt || 0);
        }
        if (sortBy === 'invoiced-desc') {
          return (b.totalInvoiced || 0) - (a.totalInvoiced || 0);
        }
        if (sortBy === 'activity-desc') {
          return new Date(b.lastInvoiceDate).getTime() - new Date(a.lastInvoiceDate).getTime();
        }
        if (sortBy === 'name-asc') {
          return a.name.localeCompare(b.name, 'ar');
        }
        return 0;
      });
  }, [balances, invoices, filterDebtOnly, searchQuery, sortBy]);

  // Helper to find merchant contact info
  const getMerchantContact = (name: string) => {
    const matched = invoices
      .filter(i => (i.customerName || '').trim() === name.trim())
      .find(i => i.customerPhone || i.customerAddress);
    return {
      phone: matched?.customerPhone || '',
      address: matched?.customerAddress || '',
    };
  };

  const handleSendWhatsApp = (merchantName: string, debt: number) => {
    const text = encodeURIComponent(
      `السلام عليكم ورحمة الله وبركاته،\nالأخ الفاضل / ${merchantName} المحترم،\n\nنود إحاطتكم علماً بأن إجمالي الرصيد المتبقي والمستحق لحسابكم هو: *${debt.toLocaleString()} جنيه مصري*.\n\nشاكرين ومقدرين حسن تعاونكم الدائم معنا.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const formatEGP = (val: number) => {
    return new Intl.NumberFormat('ar-EG', {
      maximumFractionDigits: 2,
    }).format(val) + ' ج.م';
  };

  // Selected merchant data for the detail drawer
  const selectedMerchantData = useMemo(() => {
    if (!selectedMerchantName) return null;
    const balance = balances.find(b => b.name === selectedMerchantName) || {
      name: selectedMerchantName,
      totalInvoiced: 0,
      totalPaid: 0,
      remainingDebt: 0,
      invoiceCount: 0,
      lastInvoiceDate: '-',
      status: 'PAID',
    };

    const contact = getMerchantContact(selectedMerchantName);

    const clientInvoices = invoices
      .filter(i => (i.customerName || '').trim().toLowerCase() === selectedMerchantName.trim().toLowerCase())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Aggregate products bought by this customer
    const productDemandMap = new Map<string, {
      name: string;
      quantity: number;
      unit: string;
      total: number;
      lastPrice: number;
    }>();

    clientInvoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const pName = (item.name || '').trim();
        if (!pName) return;
        const qty = Number(item.quantity || 0);
        const price = Number(item.unitPrice || 0);
        const tot = Number(item.total || (qty * price));
        const unit = (item.unit || 'كرتونة').trim();

        if (!productDemandMap.has(pName)) {
          productDemandMap.set(pName, {
            name: pName,
            quantity: 0,
            unit,
            total: 0,
            lastPrice: price,
          });
        }
        const existing = productDemandMap.get(pName)!;
        existing.quantity += qty;
        existing.total += tot;
        existing.lastPrice = price;
      });
    });

    const productsDemand = Array.from(productDemandMap.values()).sort((a, b) => b.quantity - a.quantity);

    // Payments collected from this customer
    const clientPayments = clientInvoices
      .filter(i => (i.paidAmount || 0) > 0)
      .map(i => ({
        invoiceId: i.id,
        invoiceNumber: i.invoiceNumber,
        date: i.date,
        paidAmount: i.paidAmount,
        notes: i.notes,
      }));

    return {
      balance,
      contact,
      invoices: clientInvoices,
      productsDemand,
      payments: clientPayments,
    };
  }, [selectedMerchantName, balances, invoices]);

  return (
    <div className="space-y-5">
      
      {/* 1. Header: Section title + Brief description + Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              سجل العملاء والحسابات الجارية
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {balances.length} تاجر
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            جدول بيانات شامل لإدارة حسابات التجار، متابعة المديونيات الآجلة، وتسجيل المسحوبات والدفعات.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {onOpenProductsSummary && (
            <button
              onClick={() => onOpenProductsSummary()}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Package className="w-4 h-4 text-teal-700" />
              <span>مسحوبات كل عميل</span>
            </button>
          )}

          <button
            onClick={onOpenNewMerchant}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ إضافة تاجر جديد</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Metric Strip (Dense summary, no bulky cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">إجمالي التجار</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1">
            {balances.length} <span className="text-xs font-normal text-slate-500">محل وتاجر</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {balances.filter(b => b.remainingDebt > 0).length} عليهم مديونيات جارية
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-rose-200/80 bg-rose-50/10 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-rose-800">
            <span className="font-semibold">المديونيات المعلقة</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-rose-700 mt-1">
            {formatEGP(totalReceivables)}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-0.5">
            مستحقات آجلة طرف التجار
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">إجمالي المسحوبات</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1">
            {formatEGP(totalInvoiced)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            كافة البضاعة المسجلة
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/10 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-emerald-800">
            <span className="font-semibold">التحصيلات النقدية</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-700 mt-1">
            {formatEGP(totalCollected)}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">
            تم سدادها واستلامها
          </div>
        </div>

      </div>

      {/* 3. Compact Toolbar: Search + Quick Filter Chips + Sorting (Req.txt #7) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن تاجر، محل، رقم هاتف أو عنوان..."
            className="w-full pl-3 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
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

        {/* Filter Chips & Sort Dropdown */}
        <div className="flex items-center gap-2 flex-wrap">
          
          <button
            type="button"
            onClick={() => setFilterDebtOnly(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              !filterDebtOnly
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جميع التجار ({balances.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterDebtOnly(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterDebtOnly
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>المديونيات فقط ({balances.filter(b => b.remainingDebt > 0).length})</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="debt-desc">الأعلى مديونية</option>
            <option value="invoiced-desc">الأعلى مسحوبات</option>
            <option value="activity-desc">الأحدث حركة</option>
            <option value="name-asc">أبجدياً (أ - ي)</option>
          </select>

        </div>

      </div>

      {/* 4. Professional Data Table (Req.txt #1 & #3 - Table-First Architecture) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {filteredBalances.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">لا يوجد تجار يطابقون البحث الحالي</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              جرّب تغيير كلمة البحث أو تصفية المديونيات، أو اضغط على إضافة تاجر جديد.
            </p>
            <button
              onClick={onOpenNewMerchant}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ إضافة تاجر جديد</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">العميل / المحل التجاري</th>
                  <th className="py-3 px-4">الهاتف والعنوان</th>
                  <th className="py-3 px-4">آخر حركة</th>
                  <th className="py-3 px-4">إجمالي المسحوبات</th>
                  <th className="py-3 px-4">المسدد</th>
                  <th className="py-3 px-4">الرصيد المتبقي (المديونية)</th>
                  <th className="py-3 px-4 text-center">الإجراءات السريعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBalances.map((merchant, idx) => {
                  const hasDebt = merchant.remainingDebt > 0;
                  const contact = getMerchantContact(merchant.name);

                  return (
                    <tr
                      key={merchant.name}
                      onClick={() => setSelectedMerchantName(merchant.name)}
                      className="hover:bg-teal-50/30 transition-colors cursor-pointer group"
                    >
                      
                      {/* Index */}
                      <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Merchant Name + Initials Badge */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-teal-600 transition-colors">
                            {merchant.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors text-xs sm:text-sm">
                              {merchant.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {merchant.invoiceCount} فاتورة / حركة
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Address */}
                      <td className="py-3 px-4 text-slate-600">
                        {contact.phone ? (
                          <div className="flex items-center gap-1 font-mono text-[11px]" dir="ltr">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{contact.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                        {contact.address && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[140px]" title={contact.address}>
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{contact.address}</span>
                          </div>
                        )}
                      </td>

                      {/* Last Activity */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{merchant.lastInvoiceDate}</span>
                        </div>
                      </td>

                      {/* Total Invoiced */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-800 text-xs sm:text-sm">
                        {formatEGP(merchant.totalInvoiced)}
                      </td>

                      {/* Total Paid */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-emerald-700 text-xs sm:text-sm">
                        {formatEGP(merchant.totalPaid)}
                      </td>

                      {/* Remaining Debt Balance */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {hasDebt ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3" />
                            <span>{formatEGP(merchant.remainingDebt)}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3" />
                            <span>خالص السداد</span>
                          </span>
                        )}
                      </td>

                      {/* Quick Row Actions (Req.txt #8) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          
                          {/* + Add Goods */}
                          <button
                            type="button"
                            onClick={() => onOpenAddGoods(merchant.name, contact.phone, contact.address)}
                            className="px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="إضافة بضاعة ومسحوبات جديدة"
                          >
                            <Package className="w-3 h-3 text-emerald-600" />
                            <span>+ بضاعة</span>
                          </button>

                          {/* + Add Payment */}
                          <button
                            type="button"
                            onClick={() => onOpenAddPayment(merchant.name, merchant.remainingDebt)}
                            className="px-2 py-1 text-[11px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="تسجيل دفعة نقدية وسداد"
                          >
                            <DollarSign className="w-3 h-3 text-teal-600" />
                            <span>+ دفعة</span>
                          </button>

                          {/* Statement */}
                          <button
                            type="button"
                            onClick={() => onOpenStatement(merchant.name)}
                            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="كشف حساب التاجر المجمع"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp */}
                          {hasDebt && (
                            <button
                              type="button"
                              onClick={() => handleSendWhatsApp(merchant.name, merchant.remainingDebt)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="إرسال تذكير بالرصيد عبر واتساب"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Open Full Details Drawer */}
                          <button
                            type="button"
                            onClick={() => setSelectedMerchantName(merchant.name)}
                            className="p-1 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="عرض تفاصيل العميل والمسحوبات"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
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
            عرض <strong className="text-slate-900">{filteredBalances.length}</strong> من إجمالي <strong className="text-slate-900">{balances.length}</strong> تاجر
          </div>
          <div className="flex items-center gap-4">
            <span>إجمالي مسحوبات المعروض: <strong className="text-slate-900">{formatEGP(filteredBalances.reduce((s, b) => s + b.totalInvoiced, 0))}</strong></span>
            <span>إجمالي مديونيات المعروض: <strong className="text-rose-700">{formatEGP(filteredBalances.reduce((s, b) => s + (b.remainingDebt > 0 ? b.remainingDebt : 0), 0))}</strong></span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. CUSTOMER DETAIL DRAWER / VIEW (Req.txt #4: "تصميم العميل") */}
      {/* ========================================================================= */}
      {selectedMerchantName && selectedMerchantData && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setSelectedMerchantName(null)}
        >
          <div 
            className="w-full max-w-2xl bg-white h-full shadow-2xl border-r border-slate-200 flex flex-col animate-in slide-in-from-left duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-base shadow-xs">
                    {selectedMerchantData.balance.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      {selectedMerchantData.balance.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      {selectedMerchantData.contact.phone && (
                        <span className="flex items-center gap-1 font-mono" dir="ltr">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{selectedMerchantData.contact.phone}</span>
                        </span>
                      )}
                      {selectedMerchantData.contact.address && (
                        <span className="flex items-center gap-1 truncate max-w-[180px]">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{selectedMerchantData.contact.address}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMerchantName(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Balance Highlight Banner */}
              <div className="mt-3.5 p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">الرصيد المتبقي (المديونية الحالية):</div>
                  <div className={`text-base sm:text-lg font-black font-mono mt-0.5 ${
                    selectedMerchantData.balance.remainingDebt > 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    {formatEGP(selectedMerchantData.balance.remainingDebt)}
                  </div>
                </div>

                {/* Direct Action Buttons inside Header */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenAddGoods(
                      selectedMerchantData.balance.name, 
                      selectedMerchantData.contact.phone, 
                      selectedMerchantData.contact.address
                    )}
                    className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ بضاعة</span>
                  </button>

                  <button
                    onClick={() => onOpenAddPayment(
                      selectedMerchantData.balance.name, 
                      selectedMerchantData.balance.remainingDebt
                    )}
                    className="px-2.5 py-1.5 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-teal-600" />
                    <span>+ دفعة</span>
                  </button>

                  <button
                    onClick={() => onOpenStatement(selectedMerchantData.balance.name)}
                    className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    title="كشف الحساب للطباعة"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>كشف</span>
                  </button>

                  {selectedMerchantData.balance.remainingDebt > 0 && (
                    <button
                      onClick={() => handleSendWhatsApp(selectedMerchantData.balance.name, selectedMerchantData.balance.remainingDebt)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="إرسال عبر واتساب"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Drawer Tabs (Req.txt #4: نظرة عامة | الفواتير | الدفعات | المشتريات | كشف الحساب) */}
              <div className="flex items-center gap-1 mt-3 border-t border-slate-200/80 pt-2 overflow-x-auto text-xs font-bold">
                <button
                  onClick={() => setDrawerTab('OVERVIEW')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    drawerTab === 'OVERVIEW'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  نظرة عامة
                </button>

                <button
                  onClick={() => setDrawerTab('INVOICES')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    drawerTab === 'INVOICES'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  الفواتير ({selectedMerchantData.invoices.length})
                </button>

                <button
                  onClick={() => setDrawerTab('PAYMENTS')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    drawerTab === 'PAYMENTS'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  الدفعات والتحصيلات ({selectedMerchantData.payments.length})
                </button>

                <button
                  onClick={() => setDrawerTab('PRODUCTS')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    drawerTab === 'PRODUCTS'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  مسحوبات الأصناف ({selectedMerchantData.productsDemand.length})
                </button>
              </div>

            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              
              {/* TAB 1: OVERVIEW */}
              {drawerTab === 'OVERVIEW' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs text-slate-500 font-semibold">إجمالي البضاعة المسحوبة</span>
                      <div className="text-base font-bold font-mono text-slate-900 mt-1">
                        {formatEGP(selectedMerchantData.balance.totalInvoiced)}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs text-slate-500 font-semibold">إجمالي المبالغ المسددة</span>
                      <div className="text-base font-bold font-mono text-emerald-700 mt-1">
                        {formatEGP(selectedMerchantData.balance.totalPaid)}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="font-bold text-slate-800 text-sm">بيانات وسجل التاجر</div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">عدد الفواتير والطلبيات:</span>
                      <span className="font-bold text-slate-800">{selectedMerchantData.invoices.length} فاتورة</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">تاريخ آخر حركة:</span>
                      <span className="font-mono text-slate-800">{selectedMerchantData.balance.lastInvoiceDate}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">رقم الهاتف:</span>
                      <span className="font-mono text-slate-800" dir="ltr">{selectedMerchantData.contact.phone || 'غير مسجل'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">العنوان / المنطقة:</span>
                      <span className="text-slate-800">{selectedMerchantData.contact.address || 'غير مسجل'}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => onOpenStatement(selectedMerchantData.balance.name)}
                      className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>عرض وطباعة كشف الحساب والفاتورة المجمعة</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: INVOICES TABLE */}
              {drawerTab === 'INVOICES' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">رقم الفاتورة</th>
                        <th className="py-2.5 px-3">التاريخ</th>
                        <th className="py-2.5 px-3">الإجمالي</th>
                        <th className="py-2.5 px-3">المتبقي</th>
                        <th className="py-2.5 px-3 text-center">الحالة</th>
                        <th className="py-2.5 px-3 text-center">عرض</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedMerchantData.invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {inv.date}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {formatEGP(inv.totalAmount)}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {(inv.remainingAmount || 0) > 0 ? (
                              <span className="font-bold text-rose-700">{formatEGP(inv.remainingAmount)}</span>
                            ) : (
                              <span className="text-emerald-700">0 ج.م</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {inv.status === 'PAID' ? (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                مسددة
                              </span>
                            ) : inv.status === 'PARTIAL' ? (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                جزئي
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                آجل
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {onViewInvoice && (
                              <button
                                onClick={() => onViewInvoice(inv)}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                title="معاينة الفاتورة"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: PAYMENTS TABLE */}
              {drawerTab === 'PAYMENTS' && (
                <div className="space-y-3">
                  {selectedMerchantData.payments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      لا توجد دفعات محصلة مسجلة بعد لهذا التاجر
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">رقم الحركة</th>
                            <th className="py-2.5 px-3">التاريخ</th>
                            <th className="py-2.5 px-3">المبلغ المسدد</th>
                            <th className="py-2.5 px-3">البيان / الملاحظات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedMerchantData.payments.map((pay, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                                {pay.invoiceNumber}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-500">
                                {pay.date}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                                {formatEGP(pay.paidAmount)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {pay.notes || 'سداد دفعة نقدية'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PRODUCTS DEMAND TABLE */}
              {drawerTab === 'PRODUCTS' && (
                <div className="space-y-3">
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">اسم المنتج / الصنف</th>
                          <th className="py-2.5 px-3 text-center">إجمالي الكمية</th>
                          <th className="py-2.5 px-3">الوحدة</th>
                          <th className="py-2.5 px-3">آخر سعر</th>
                          <th className="py-2.5 px-3">إجمالي القيمة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedMerchantData.productsDemand.map((prod, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-slate-800">
                              {prod.name}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-teal-800">
                              {prod.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {prod.unit}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              {prod.lastPrice > 0 ? `${prod.lastPrice} ج` : '—'}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {formatEGP(prod.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
