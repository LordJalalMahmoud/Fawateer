'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Invoice } from '@/lib/types';
import { 
  calculateCustomerProductDemand, 
  calculateProductCustomerDemand, 
  exportCustomerProductsToCSV,
  CustomerDemandSummary,
  ProductDemandSummary
} from '@/lib/customer-product-analytics';
import { 
  X, 
  Search, 
  Printer, 
  Download, 
  Package, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  MessageCircle, 
  CheckCircle2, 
  Layers, 
  Filter, 
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Phone,
  BarChart3
} from 'lucide-react';

interface CustomerProductsSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  initialSelectedCustomer?: string | null;
}

type ViewMode = 'BY_CUSTOMER' | 'BY_PRODUCT' | 'ALL_MATRIX';

export function CustomerProductsSummaryModal({
  isOpen,
  onClose,
  invoices,
  initialSelectedCustomer,
}: CustomerProductsSummaryModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('BY_CUSTOMER');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string>(initialSelectedCustomer || 'ALL');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('ALL');
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});

  // Sync initial customer if changed during render (React recommended pattern)
  const [prevInitialCustomer, setPrevInitialCustomer] = useState(initialSelectedCustomer);
  if (initialSelectedCustomer !== prevInitialCustomer) {
    setPrevInitialCustomer(initialSelectedCustomer);
    setSelectedCustomerFilter(initialSelectedCustomer || 'ALL');
    if (initialSelectedCustomer) {
      setExpandedCustomers(prev => ({ ...prev, [initialSelectedCustomer]: true }));
    }
  }

  // Aggregate Data
  const customerSummaries = useMemo(() => {
    return calculateCustomerProductDemand(invoices);
  }, [invoices]);

  const productSummaries = useMemo(() => {
    return calculateProductCustomerDemand(invoices);
  }, [invoices]);

  // High-level KPIs
  const totalUnitsAll = useMemo(() => {
    return customerSummaries.reduce((sum, c) => sum + c.totalUnitsCount, 0);
  }, [customerSummaries]);

  const totalSpentAll = useMemo(() => {
    return customerSummaries.reduce((sum, c) => sum + c.totalSpent, 0);
  }, [customerSummaries]);

  const distinctProductsCountAll = useMemo(() => {
    return productSummaries.length;
  }, [productSummaries]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customerSummaries.filter(c => {
      if (selectedCustomerFilter !== 'ALL' && c.customerName !== selectedCustomerFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCustomer = c.customerName.toLowerCase().includes(query);
        const matchesProduct = c.products.some(p => p.productName.toLowerCase().includes(query));
        return matchesCustomer || matchesProduct;
      }
      return true;
    });
  }, [customerSummaries, selectedCustomerFilter, searchQuery]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return productSummaries.filter(p => {
      if (selectedProductFilter !== 'ALL' && p.productName !== selectedProductFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesProd = p.productName.toLowerCase().includes(query);
        const matchesCust = p.customers.some(c => c.customerName.toLowerCase().includes(query));
        return matchesProd || matchesCust;
      }
      return true;
    });
  }, [productSummaries, selectedProductFilter, searchQuery]);

  if (!isOpen) return null;

  const toggleCustomerExpand = (name: string) => {
    setExpandedCustomers(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    exportCustomerProductsToCSV(filteredCustomers);
  };

  const handleSendWhatsAppCustomer = (customer: CustomerDemandSummary) => {
    let text = `السلام عليكم ورحمة الله وبركاته،\nالأخ الفاضل / ${customer.customerName} المحترم،\n\nإليك بيان بإجمالي مسحوباتك من المنتجات والأصناف حتى تاريخ اليوم:\n`;
    customer.products.forEach((p, idx) => {
      text += `${idx + 1}. *${p.productName}*: إجمالي ${p.totalQuantity} ${p.unit} (بقيمة: ${p.totalAmount.toLocaleString()} ج.م)\n`;
    });
    text += `\n• إجمالي عدد العبوات والوحدات: *${customer.totalUnitsCount.toLocaleString()}*\n`;
    text += `• إجمالي قيمة البضاعة المسحوبة: *${customer.totalSpent.toLocaleString()} جنيه مصري*\n\nشاكرين ومقدرين حسن تعاملكم معنا.`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Modal Top Header (Hidden on print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-teal-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  تقرير إجمالي مسحوبات العملاء من كل منتج
                </h2>
                <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full">
                  إجمالي تراكمي
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                معرفة إجمالي الكميات المطلوبة لكل عميل من كل صنف عبر جميع الفواتير والحركات
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
              title="تصدير كملف Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>تصدير Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="طباعة التقرير"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global KPI Stats Strip (Hidden on print) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 sm:p-4 bg-slate-50 border-b border-slate-200 no-print">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-semibold block">إجمالي العملاء المستهلكين</span>
            <div className="text-lg font-black text-slate-900 mt-0.5 flex items-baseline gap-1">
              {customerSummaries.length} <span className="text-xs font-normal text-slate-500">عميل وتاجر</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-semibold block">الأصناف المتداولة</span>
            <div className="text-lg font-black text-teal-700 mt-0.5 flex items-baseline gap-1">
              {distinctProductsCountAll} <span className="text-xs font-normal text-teal-600">منتج مختلف</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-semibold block">إجمالي الكميات المسحوبة</span>
            <div className="text-lg font-black text-indigo-700 mt-0.5 flex items-baseline gap-1">
              {totalUnitsAll.toLocaleString()} <span className="text-xs font-normal text-indigo-500">قطعة/عبوة</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/30">
            <span className="text-[11px] text-emerald-800 font-semibold block">إجمالي قيمة المسحوبات</span>
            <div className="text-lg font-black text-emerald-700 mt-0.5 font-mono">
              {totalSpentAll.toLocaleString()} <span className="text-xs font-normal text-emerald-600">ج.م</span>
            </div>
          </div>
        </div>

        {/* View Mode Switcher & Filters (Hidden on print) */}
        <div className="p-3 sm:p-4 bg-white border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 no-print">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('BY_CUSTOMER')}
              className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                viewMode === 'BY_CUSTOMER'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span>عرض حسب العميل (كل عميل وأصنافه)</span>
            </button>

            <button
              onClick={() => setViewMode('BY_PRODUCT')}
              className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                viewMode === 'BY_PRODUCT'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              <span>عرض حسب المنتج (كل صنف وعملاؤه)</span>
            </button>

            <button
              onClick={() => setViewMode('ALL_MATRIX')}
              className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                viewMode === 'ALL_MATRIX'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-700" />
              <span>الجدول المجمع الشامل</span>
            </button>
          </div>

          {/* Search & Filter Dropdowns */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم أو المنتج..."
                className="w-full pl-3 pr-9 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {viewMode === 'BY_CUSTOMER' && (
              <select
                value={selectedCustomerFilter}
                onChange={(e) => setSelectedCustomerFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer max-w-[180px]"
              >
                <option value="ALL">كل العملاء ({customerSummaries.length})</option>
                {customerSummaries.map(c => (
                  <option key={c.customerName} value={c.customerName}>
                    {c.customerName}
                  </option>
                ))}
              </select>
            )}

            {viewMode === 'BY_PRODUCT' && (
              <select
                value={selectedProductFilter}
                onChange={(e) => setSelectedProductFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer max-w-[180px]"
              >
                <option value="ALL">كل الأصناف ({productSummaries.length})</option>
                {productSummaries.map(p => (
                  <option key={p.productName} value={p.productName}>
                    {p.productName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Scrollable Content & Printable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50" ref={printRef}>
          <div className="max-w-5xl mx-auto space-y-6 printable-area">

            {/* Printable Report Header (Visible on print) */}
            <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-black">منظومة توريدات وتوزيع المنظفات</h1>
                  <p className="text-xs text-slate-600">تقرير إجمالي مسحوبات العملاء من كل منتج بالتفصيل</p>
                </div>
                <div className="text-left text-xs">
                  <div>تاريخ الاستخراج: <strong>{new Date().toISOString().slice(0, 10)}</strong></div>
                  <div>إجمالي الأصناف: <strong>{distinctProductsCountAll} صنف</strong></div>
                  <div>إجمالي القيمة: <strong>{totalSpentAll.toLocaleString()} ج.م</strong></div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* VIEW 1: BY CUSTOMER (كل عميل وما طلبه من كل صنف)         */}
            {/* ========================================================= */}
            {viewMode === 'BY_CUSTOMER' && (
              <div className="space-y-4">
                {filteredCustomers.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold">لا توجد بيانات مطابقة للبحث المحدد</p>
                  </div>
                ) : (
                  filteredCustomers.map((customer) => {
                    const isExpanded = expandedCustomers[customer.customerName] !== false; // Default expanded

                    return (
                      <div
                        key={customer.customerName}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:border-teal-300 transition-all"
                      >
                        {/* Customer Header Card */}
                        <div 
                          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 border-b border-slate-100 cursor-pointer select-none"
                          onClick={() => toggleCustomerExpand(customer.customerName)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                              {customer.customerName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900 truncate">
                                  {customer.customerName}
                                </h3>
                                <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                                  {customer.distinctProductsCount} أصناف مختلفة
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                <span>عدد الفواتير: <strong className="text-slate-700">{customer.invoicesCount}</strong></span>
                                {customer.lastOrderDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    <span>آخر طلب: {customer.lastOrderDate}</span>
                                  </span>
                                )}
                                {customer.customerPhone && (
                                  <span className="flex items-center gap-1" dir="ltr">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{customer.customerPhone}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Totals & Actions */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 block">إجمالي المسحوبات</span>
                              <span className="text-base font-black text-slate-900 font-mono">
                                {customer.totalSpent.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
                              </span>
                              <span className="text-[10px] text-teal-600 font-semibold block">
                                ({customer.totalUnitsCount.toLocaleString()} قطعة/عبوة)
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 no-print" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleSendWhatsAppCustomer(customer)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                                title="مشاركة كشف الأصناف عبر واتساب"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleCustomerExpand(customer.customerName)}
                                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Customer Product Demand Table */}
                        {isExpanded && (
                          <div className="p-3 sm:p-5 overflow-x-auto">
                            <table className="w-full text-right text-xs">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                                  <th className="py-2.5 px-3">#</th>
                                  <th className="py-2.5 px-3">اسم المنتج / الصنف</th>
                                  <th className="py-2.5 px-3 text-center">إجمالي الكمية المطلوبة</th>
                                  <th className="py-2.5 px-3 text-center">الوحدة</th>
                                  <th className="py-2.5 px-3 text-left">متوسط السعر</th>
                                  <th className="py-2.5 px-3 text-left">آخر سعر</th>
                                  <th className="py-2.5 px-3 text-left">إجمالي القيمة</th>
                                  <th className="py-2.5 px-3 text-center">نسبة السحب</th>
                                  <th className="py-2.5 px-3 text-center">عدد الطلبات</th>
                                  <th className="py-2.5 px-3 text-center">تاريخ آخر طلب</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {customer.products.map((prod, idx) => (
                                  <tr key={prod.productName} className="hover:bg-teal-50/30 transition-colors">
                                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                                    
                                    {/* Product Name */}
                                    <td className="py-3 px-3">
                                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                        {prod.productName}
                                      </div>
                                    </td>

                                    {/* Total Quantity */}
                                    <td className="py-3 px-3 text-center">
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-teal-50 text-teal-800 border border-teal-200">
                                        {prod.totalQuantity.toLocaleString()}
                                      </span>
                                    </td>

                                    {/* Unit */}
                                    <td className="py-3 px-3 text-center text-slate-600 font-semibold">
                                      {prod.unit}
                                    </td>

                                    {/* Average Price */}
                                    <td className="py-3 px-3 text-left font-mono text-slate-700">
                                      {prod.averagePrice.toLocaleString()} ج.م
                                    </td>

                                    {/* Last Price */}
                                    <td className="py-3 px-3 text-left font-mono text-slate-600">
                                      {prod.lastPrice.toLocaleString()} ج.م
                                    </td>

                                    {/* Total Amount */}
                                    <td className="py-3 px-3 text-left font-mono font-bold text-emerald-700">
                                      {prod.totalAmount.toLocaleString()} ج.م
                                    </td>

                                    {/* Consumption % Bar */}
                                    <td className="py-3 px-3 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                          <div 
                                            className="bg-teal-600 h-2 rounded-full" 
                                            style={{ width: `${Math.min(prod.percentageOfCustomerTotal || 0, 100)}%` }}
                                          />
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-500">
                                          {prod.percentageOfCustomerTotal}%
                                        </span>
                                      </div>
                                    </td>

                                    {/* Orders count */}
                                    <td className="py-3 px-3 text-center text-slate-600">
                                      <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                        {prod.ordersCount} {prod.ordersCount === 1 ? 'فاتورة' : 'فواتير'}
                                      </span>
                                    </td>

                                    {/* Last Date */}
                                    <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                      {prod.lastOrderDate}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW 2: BY PRODUCT (كل منتج والعملاء الذين طلبوه)        */}
            {/* ========================================================= */}
            {viewMode === 'BY_PRODUCT' && (
              <div className="space-y-4">
                {filteredProducts.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold">لا توجد منتجات مطابقة للبحث</p>
                  </div>
                ) : (
                  filteredProducts.map((prod) => (
                    <div
                      key={prod.productName}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:border-indigo-300 transition-all"
                    >
                      {/* Product Header Card */}
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-slate-900">
                                {prod.productName}
                              </h3>
                              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                {prod.customersCount} عميل طلبوا هذا الصنف
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              الوحدة المعتمدة: <strong>{prod.primaryUnit}</strong>
                              {prod.topCustomer && (
                                <span className="mr-2 text-slate-600">
                                  • أكبر عميل مستهلك: <strong className="text-indigo-700">{prod.topCustomer}</strong>
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Product Totals */}
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <span className="text-[10px] text-slate-500 block">إجمالي الكمية المطلوبة</span>
                            <span className="text-base font-black text-indigo-700 font-mono">
                              {prod.totalQuantity.toLocaleString()} <span className="text-xs font-normal text-slate-500">{prod.primaryUnit}</span>
                            </span>
                          </div>
                          <div className="border-r border-slate-200 pr-4">
                            <span className="text-[10px] text-slate-500 block">إجمالي الإيرادات</span>
                            <span className="text-base font-black text-emerald-700 font-mono">
                              {prod.totalRevenue.toLocaleString()} <span className="text-xs font-normal text-emerald-600">ج.م</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Customers Who Bought This Product */}
                      <div className="p-3 sm:p-5 overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                              <th className="py-2 px-3">#</th>
                              <th className="py-2 px-3">اسم العميل / المحل</th>
                              <th className="py-2 px-3 text-center">الكمية المسحوبة</th>
                              <th className="py-2 px-3 text-center">الوحدة</th>
                              <th className="py-2 px-3 text-left">متوسط السعر</th>
                              <th className="py-2 px-3 text-left">إجمالي القيمة</th>
                              <th className="py-2 px-3 text-center">نسبة مساهمة العميل</th>
                              <th className="py-2 px-3 text-center">عدد الطلبات</th>
                              <th className="py-2 px-3 text-center">تاريخ آخر طلب</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {prod.customers.map((c, cIdx) => (
                              <tr key={c.customerName} className="hover:bg-indigo-50/30 transition-colors">
                                <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{cIdx + 1}</td>
                                
                                <td className="py-2.5 px-3 font-bold text-slate-900">
                                  {c.customerName}
                                  {c.customerPhone && (
                                    <span className="block text-[10px] font-normal text-slate-400" dir="ltr">
                                      {c.customerPhone}
                                    </span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black bg-indigo-50 text-indigo-800 border border-indigo-200">
                                    {c.quantity.toLocaleString()}
                                  </span>
                                </td>

                                <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                                  {c.unit}
                                </td>

                                <td className="py-2.5 px-3 text-left font-mono text-slate-700">
                                  {c.averagePrice.toLocaleString()} ج.م
                                </td>

                                <td className="py-2.5 px-3 text-left font-mono font-bold text-emerald-700">
                                  {c.amount.toLocaleString()} ج.م
                                </td>

                                <td className="py-2.5 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                      <div 
                                        className="bg-indigo-600 h-2 rounded-full" 
                                        style={{ width: `${Math.min(c.percentageOfProductTotal, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500">
                                      {c.percentageOfProductTotal}%
                                    </span>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 text-center text-slate-600">
                                  {c.ordersCount}
                                </td>

                                <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                  {c.lastOrderDate}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW 3: ALL MATRIX TABLE (الجدول المجمع الشامل للطباعة)    */}
            {/* ========================================================= */}
            {viewMode === 'ALL_MATRIX' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      الجدول التفصيلي المجمع لمسحوبات جميع العملاء
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {filteredCustomers.reduce((sum, c) => sum + c.products.length, 0)} بند مسجل
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3 w-10">#</th>
                        <th className="py-2.5 px-3">اسم التاجر / العميل</th>
                        <th className="py-2.5 px-3">اسم المنتج / الصنف</th>
                        <th className="py-2.5 px-3 text-center">إجمالي الكمية</th>
                        <th className="py-2.5 px-3 text-center">الوحدة</th>
                        <th className="py-2.5 px-3 text-left">متوسط السعر</th>
                        <th className="py-2.5 px-3 text-left">آخر سعر</th>
                        <th className="py-2.5 px-3 text-left">إجمالي القيمة</th>
                        <th className="py-2.5 px-3 text-center">مرات الطلب</th>
                        <th className="py-2.5 px-3 text-center">تاريخ آخر طلب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        let counter = 0;
                        return filteredCustomers.flatMap((cust) => 
                          cust.products.map((prod) => {
                            counter++;
                            return (
                              <tr key={`${cust.customerName}-${prod.productName}`} className="hover:bg-slate-50/80">
                                <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{counter}</td>
                                <td className="py-2.5 px-3 font-bold text-slate-900">{cust.customerName}</td>
                                <td className="py-2.5 px-3 font-semibold text-teal-900">{prod.productName}</td>
                                <td className="py-2.5 px-3 text-center font-black text-slate-900 font-mono">
                                  {prod.totalQuantity.toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 text-center text-slate-600">{prod.unit}</td>
                                <td className="py-2.5 px-3 text-left font-mono text-slate-700">{prod.averagePrice.toLocaleString()} ج.م</td>
                                <td className="py-2.5 px-3 text-left font-mono text-slate-600">{prod.lastPrice.toLocaleString()} ج.م</td>
                                <td className="py-2.5 px-3 text-left font-mono font-bold text-emerald-700">{prod.totalAmount.toLocaleString()} ج.م</td>
                                <td className="py-2.5 px-3 text-center text-slate-600">{prod.ordersCount}</td>
                                <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">{prod.lastOrderDate}</td>
                              </tr>
                            );
                          })
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Modal Bottom Status Bar */}
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 text-slate-300 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>البيانات مجمعة ومحسوبة تلقائياً من جميع فواتير المبيعات الصادرة في النظام</span>
          </div>
          <div className="flex items-center gap-3 font-mono">
            <span>إجمالي الكميات: <strong className="text-white">{totalUnitsAll.toLocaleString()}</strong></span>
            <span>•</span>
            <span>المبلغ الإجمالي: <strong className="text-emerald-400">{totalSpentAll.toLocaleString()} ج.م</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
}
