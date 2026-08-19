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
  UserPlus
} from 'lucide-react';

interface MerchantAccountsViewProps {
  invoices: Invoice[];
  productCatalog: ProductCatalogItem[];
  onOpenNewMerchant: () => void;
  onOpenAddGoods: (merchantName: string, phone?: string, address?: string) => void;
  onOpenAddPayment: (merchantName: string, debt: number) => void;
  onOpenStatement: (merchantName: string) => void;
}

export function MerchantAccountsView({
  invoices,
  onOpenNewMerchant,
  onOpenAddGoods,
  onOpenAddPayment,
  onOpenStatement,
}: MerchantAccountsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDebtOnly, setFilterDebtOnly] = useState(false);

  // Group all merchants from invoices
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

  const handleSendWhatsApp = (merchantName: string, debt: number) => {
    const text = encodeURIComponent(
      `السلام عليكم ورحمة الله وبركاته،\nالأخ الفاضل / ${merchantName} المحترم،\n\nنود إحاطتكم علماً بأن إجمالي الرصيد المتبقي والمستحق لحسابكم هو: *${debt.toLocaleString()} جنيه مصري*.\n\nشاكرين ومقدرين حسن تعاونكم الدائم معنا.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Find merchant contact info
  const getMerchantContact = (name: string) => {
    const matched = invoices
      .filter(i => (i.customerName || '').trim() === name.trim())
      .find(i => i.customerPhone || i.customerAddress);
    return {
      phone: matched?.customerPhone || '',
      address: matched?.customerAddress || '',
    };
  };

  return (
    <div className="space-y-6">
      
      {/* Top Merchant KPIs Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Merchants */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي التجار والعملاء</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {balances.length} <span className="text-xs font-normal text-slate-500">تاجر ومحل</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {balances.filter(b => b.remainingDebt > 0).length} عليهم مديونيات جارية
          </div>
        </div>

        {/* Total Receivables (Debt) */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-2xs bg-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800">إجمالي المديونيات المعلقة</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">
            {totalReceivables.toLocaleString()} <span className="text-xs font-normal text-rose-600">ج.م</span>
          </div>
          <div className="text-xs text-rose-600/80 mt-1">
            مستحقات آجلة طرف التجار
          </div>
        </div>

        {/* Total Invoiced Goods */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي البضاعة المسحوبة</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {totalInvoiced.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            كافة المسحوبات المسجلة
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">إجمالي التحصيلات النقدية</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {totalCollected.toLocaleString()} <span className="text-xs font-normal text-emerald-600">ج.م</span>
          </div>
          <div className="text-xs text-emerald-600/80 mt-1">
            تم سدادها واستلامها
          </div>
        </div>

      </div>

      {/* Action Bar & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن تاجر أو محل تجاري بالاسم..."
            className="w-full pl-4 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        {/* Filter Toggle & Add Merchant */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterDebtOnly(!filterDebtOnly)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              filterDebtOnly
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>المديونيات فقط ({balances.filter(b => b.remainingDebt > 0).length})</span>
          </button>

          <button
            onClick={onOpenNewMerchant}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ إضافة تاجر جديد</span>
          </button>
        </div>

      </div>

      {/* Merchants Grid */}
      {filteredBalances.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">لا يوجد تجار مسجلين حالياً</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            اضغط على زر &quot;إضافة تاجر جديد&quot; أو قم بإصدار فاتورة بضاعة جديدة لإنشاء حساب جاري للتاجر تلقائياً.
          </p>
          <button
            onClick={onOpenNewMerchant}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md cursor-pointer mt-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>فتح أول حساب تاجر</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBalances.map((merchant) => {
            const hasDebt = merchant.remainingDebt > 0;
            const contact = getMerchantContact(merchant.name);

            return (
              <div
                key={merchant.name}
                className="bg-white rounded-2xl border border-slate-200 hover:border-teal-300 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                
                {/* Card Top: Name & Balance Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {merchant.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-900 truncate" title={merchant.name}>
                          {merchant.name}
                        </h3>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>آخر حركة: {merchant.lastInvoiceDate}</span>
                        </div>
                      </div>
                    </div>

                    {hasDebt && (
                      <button
                        onClick={() => handleSendWhatsApp(merchant.name, merchant.remainingDebt)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer shrink-0"
                        title="إرسال تذكير بالرصيد عبر الواتساب"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Contact info if available */}
                  {(contact.phone || contact.address) && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                      {contact.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span dir="ltr">{contact.phone}</span>
                        </div>
                      )}
                      {contact.address && (
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{contact.address}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Account Balance Box */}
                  <div className={`mt-3.5 p-3.5 rounded-xl border flex items-center justify-between ${
                    hasDebt 
                      ? 'bg-rose-50/60 border-rose-200 text-rose-900' 
                      : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  }`}>
                    <div>
                      <div className="text-[11px] font-semibold opacity-80">الرصيد المتبقي (المديونية):</div>
                      <div className={`text-lg font-black mt-0.5 ${hasDebt ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {merchant.remainingDebt.toLocaleString()} ج.م
                      </div>
                    </div>

                    <div className="text-left text-xs space-y-0.5">
                      <div className="text-slate-500">مسحوبات: <strong className="text-slate-800">{merchant.totalInvoiced.toLocaleString()}</strong></div>
                      <div className="text-emerald-700">مسدد: <strong>{merchant.totalPaid.toLocaleString()}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: 3 Direct Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  
                  <div className="grid grid-cols-2 gap-2">
                    {/* Add Goods / Delivery */}
                    <button
                      onClick={() => onOpenAddGoods(merchant.name, contact.phone, contact.address)}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                      title="تسجيل بضاعة ومسحوبات جديدة لهذا التاجر"
                    >
                      <Package className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+ إضافة بضاعة</span>
                    </button>

                    {/* Record Payment */}
                    <button
                      onClick={() => onOpenAddPayment(merchant.name, merchant.remainingDebt)}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors cursor-pointer"
                      title="تسجيل دفعة نقدية وتخفيض مديونية التاجر"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-teal-600" />
                      <span>+ تسجيل دفعة</span>
                    </button>
                  </div>

                  {/* Statement & Consolidated Invoice */}
                  <button
                    onClick={() => onOpenStatement(merchant.name)}
                    className="w-full py-2 px-3 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    title="عرض وطباعة كشف الحساب والفاتورة المجمعة"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>كشف الحساب والفاتورة المجمعة</span>
                  </button>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
