'use client';

import React, { useState, useMemo } from 'react';
import { 
  CourierSettlement, 
  ProductPricingTier, 
  ProductCatalogItem,
  RetailSoldItem,
  CourierProfitBreakdown
} from '@/lib/types';
import { calculateCourierSettlementProfit, findPricingTier } from '@/lib/pricing-data';
import { 
  Truck, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  DollarSign, 
  Receipt, 
  Search, 
  Printer, 
  Download, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Layers, 
  Building2, 
  Factory, 
  X, 
  Sparkles,
  Package,
  AlertCircle,
  HelpCircle,
  Percent,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';

interface CourierSettlementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  courierSettlements: CourierSettlement[];
  pricingTiers: ProductPricingTier[];
  products: ProductCatalogItem[];
  onSaveSettlement: (settlement: CourierSettlement) => Promise<void>;
  onDeleteSettlement: (settlementId: string) => Promise<void>;
}

const COMMON_COURIERS = [
  'بوسطة Bosta',
  'أوتو Oto',
  'شيب بلو ShipBlu',
  'أرامكس Aramex',
  'إنجز Engeez',
  'مندوب شحن خاص',
  'البريد المصري',
  'ميدل إيست Middle East',
];

export function CourierSettlementsModal({
  isOpen,
  onClose,
  courierSettlements,
  pricingTiers,
  products,
  onSaveSettlement,
  onDeleteSettlement,
}: CourierSettlementsModalProps) {
  // Navigation tabs inside modal: 'LIST' (كشف التحصيلات) | 'PRODUCTS_ANALYSIS' (أرباح الأصناف القطاعي)
  const [activeTab, setActiveTab] = useState<'LIST' | 'PRODUCTS_ANALYSIS'>('LIST');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [courierFilter, setCourierFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Expandable row details state
  const [expandedSettlementId, setExpandedSettlementId] = useState<string | null>(null);

  // Add / Edit Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState<CourierSettlement | null>(null);

  // Form Fields
  const [formCourierName, setFormCourierName] = useState('بوسطة Bosta');
  const [formCustomCourier, setFormCustomCourier] = useState('');
  const [formManifestNumber, setFormManifestNumber] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formCollectedCash, setFormCollectedCash] = useState<number | ''>('');
  const [formShippingFee, setFormShippingFee] = useState<number | ''>('');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<RetailSoldItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Pre-calculate breakdown for all settlements
  const calculatedSettlements = useMemo<CourierProfitBreakdown[]>(() => {
    return (courierSettlements || []).map(s => calculateCourierSettlementProfit(s, pricingTiers));
  }, [courierSettlements, pricingTiers]);

  // Unique Couriers list for filter
  const uniqueCouriers = useMemo(() => {
    const set = new Set<string>();
    courierSettlements.forEach(s => {
      if (s.courierName?.trim()) set.add(s.courierName.trim());
    });
    return Array.from(set);
  }, [courierSettlements]);

  // Filtered settlements
  const filteredCalculations = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return calculatedSettlements.filter(cb => {
      // Courier filter
      if (courierFilter !== 'ALL' && cb.courierName !== courierFilter) {
        return false;
      }
      // Date filter
      if (dateFilter === 'TODAY' && cb.date !== todayStr) return false;
      if (dateFilter === 'WEEK') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        if (cb.date < weekAgo) return false;
      }
      if (dateFilter === 'MONTH') {
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        if (cb.date < monthStart) return false;
      }
      if (dateFilter === 'CUSTOM') {
        if (customStartDate && cb.date < customStartDate) return false;
        if (customEndDate && cb.date > customEndDate) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchCourier = cb.courierName.toLowerCase().includes(query);
        const matchManifest = cb.manifestNumber.toLowerCase().includes(query);
        const matchItems = cb.items.some(it => it.productName.toLowerCase().includes(query));
        if (!matchCourier && !matchManifest && !matchItems) return false;
      }
      return true;
    });
  }, [calculatedSettlements, courierFilter, dateFilter, customStartDate, customEndDate, searchQuery]);

  // Aggregate KPI Metrics
  const summaryMetrics = useMemo(() => {
    const totalCollected = filteredCalculations.reduce((sum, s) => sum + s.collectedCash, 0);
    const totalRetail = filteredCalculations.reduce((sum, s) => sum + s.totalRetailValue, 0);
    const totalShippingFees = filteredCalculations.reduce((sum, s) => sum + s.shippingFeeDeducted, 0);
    const totalNetReceived = filteredCalculations.reduce((sum, s) => sum + s.netCashReceived, 0);
    const totalFactoryCost = filteredCalculations.reduce((sum, s) => sum + s.totalFactoryCost, 0);
    const totalCompanyCost = filteredCalculations.reduce((sum, s) => sum + s.totalCompanyCost, 0);

    const totalCompanyProfit = filteredCalculations.reduce((sum, s) => sum + s.realizedCompanyProfit, 0);
    const totalFactoryProfit = filteredCalculations.reduce((sum, s) => sum + s.realizedFactoryProfit, 0);
    const totalNetProfit = filteredCalculations.reduce((sum, s) => sum + s.realizedTotalProfit, 0);

    const count = filteredCalculations.length;
    const collectionRate = totalRetail > 0 ? (totalCollected / totalRetail) * 100 : 100;

    return {
      count,
      totalCollected,
      totalRetail,
      totalShippingFees,
      totalNetReceived,
      totalFactoryCost,
      totalCompanyCost,
      totalCompanyProfit,
      totalFactoryProfit,
      totalNetProfit,
      collectionRate,
    };
  }, [filteredCalculations]);

  // Aggregate Products Analysis in Retail
  const productsAnalysis = useMemo(() => {
    const map = new Map<string, {
      productName: string;
      unit: string;
      totalQuantity: number;
      totalRetailRevenue: number;
      totalRealizedRevenue: number;
      totalFactoryCost: number;
      totalCompanyCost: number;
      realizedCompanyProfit: number;
      realizedFactoryProfit: number;
      realizedNetProfit: number;
      settlementCount: number;
    }>();

    filteredCalculations.forEach(calc => {
      calc.items.forEach(it => {
        const key = `${it.productName}_${it.unit}`;
        const existing = map.get(key) || {
          productName: it.productName,
          unit: it.unit,
          totalQuantity: 0,
          totalRetailRevenue: 0,
          totalRealizedRevenue: 0,
          totalFactoryCost: 0,
          totalCompanyCost: 0,
          realizedCompanyProfit: 0,
          realizedFactoryProfit: 0,
          realizedNetProfit: 0,
          settlementCount: 0,
        };

        existing.totalQuantity += it.quantity;
        existing.totalRetailRevenue += it.retailRevenueTotal;
        existing.totalRealizedRevenue += it.realizedRetailRevenue;
        existing.totalFactoryCost += it.realizedFactoryCost;
        existing.totalCompanyCost += it.realizedCompanyCost;
        existing.realizedCompanyProfit += it.realizedCompanyProfit;
        existing.realizedFactoryProfit += it.realizedFactoryProfit;
        existing.realizedNetProfit += it.realizedTotalProfit;
        existing.settlementCount += 1;

        map.set(key, existing);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.realizedNetProfit - a.realizedNetProfit);
  }, [filteredCalculations]);

  // Handle Opening Form for New Settlement
  const handleOpenNewForm = () => {
    setEditingSettlement(null);
    setFormCourierName('بوسطة Bosta');
    setFormCustomCourier('');
    setFormManifestNumber(`SHP-${courierSettlements.length + 1}`);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormCollectedCash('');
    setFormShippingFee('');
    setFormNotes('');
    
    // Start with 1 empty item
    const firstProd = products[0]?.name || 'GC المزيل الشامل';
    setFormItems([
      {
        id: 'item-new-1',
        productName: firstProd,
        quantity: 1,
        unit: 'قطعة',
        retailUnitPrice: 100,
        totalAmount: 100,
        piecesPerCarton: 12,
      }
    ]);
    setFormError('');
    setIsFormOpen(true);
  };

  // Handle Opening Form for Edit
  const handleOpenEditForm = (settlement: CourierSettlement) => {
    setEditingSettlement(settlement);
    const isPredefined = COMMON_COURIERS.includes(settlement.courierName);
    if (isPredefined) {
      setFormCourierName(settlement.courierName);
      setFormCustomCourier('');
    } else {
      setFormCourierName('أخرى');
      setFormCustomCourier(settlement.courierName);
    }
    setFormManifestNumber(settlement.manifestNumber || '');
    setFormDate(settlement.date || new Date().toISOString().slice(0, 10));
    setFormCollectedCash(settlement.collectedCash);
    setFormShippingFee(settlement.shippingFeeDeducted || '');
    setFormNotes(settlement.notes || '');
    setFormItems(settlement.items && settlement.items.length > 0 ? settlement.items : [
      {
        id: `item-${settlement.id}-1`,
        productName: products[0]?.name || 'GC المزيل الشامل',
        quantity: 1,
        unit: 'قطعة',
        retailUnitPrice: 100,
        totalAmount: 100,
        piecesPerCarton: 12,
      }
    ]);
    setFormError('');
    setIsFormOpen(true);
  };

  // Add Item in Form
  const handleAddItemToForm = () => {
    const defaultName = products[0]?.name || 'GC المزيل الشامل';
    setFormItems(prev => [
      ...prev,
      {
        id: `item-${prev.length + 1}`,
        productName: defaultName,
        quantity: 1,
        unit: 'قطعة',
        retailUnitPrice: 100,
        totalAmount: 100,
        piecesPerCarton: 12,
      }
    ]);
  };

  // Remove Item in Form
  const handleRemoveItemFromForm = (index: number) => {
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update Item in Form
  const handleUpdateItemInForm = (index: number, field: keyof RetailSoldItem, value: any) => {
    setFormItems(prev => {
      const copy = [...prev];
      const target = { ...copy[index], [field]: value };
      
      if (field === 'quantity' || field === 'retailUnitPrice') {
        const q = Number(target.quantity) || 0;
        const p = Number(target.retailUnitPrice) || 0;
        target.totalAmount = Number((q * p).toFixed(2));
      }
      
      copy[index] = target;
      return copy;
    });
  };

  // Live total order value in form
  const formTotalOrderValue = useMemo(() => {
    return formItems.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.retailUnitPrice)), 0);
  }, [formItems]);

  // Live estimated profit in form
  const formLiveProfit = useMemo(() => {
    const dummySettlement: CourierSettlement = {
      id: 'preview',
      courierName: formCourierName === 'أخرى' ? formCustomCourier : formCourierName,
      manifestNumber: formManifestNumber,
      date: formDate,
      collectedCash: Number(formCollectedCash) || formTotalOrderValue,
      shippingFeeDeducted: Number(formShippingFee) || 0,
      totalOrderValue: formTotalOrderValue,
      netCashReceived: (Number(formCollectedCash) || formTotalOrderValue) - (Number(formShippingFee) || 0),
      items: formItems,
      createdAt: '',
      updatedAt: '',
      status: 'COMPLETED',
    };
    return calculateCourierSettlementProfit(dummySettlement, pricingTiers);
  }, [formCourierName, formCustomCourier, formManifestNumber, formDate, formCollectedCash, formShippingFee, formTotalOrderValue, formItems, pricingTiers]);

  // Save Settlement Form Submission
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const courierFinalName = (formCourierName === 'أخرى' ? formCustomCourier : formCourierName).trim();
    if (!courierFinalName) {
      setFormError('يرجى تحديد اسم شركة الشحن أو المندوب');
      return;
    }

    if (formItems.length === 0) {
      setFormError('يرجى إضافة صنف واحد على الأقل مباع في هذه الشحنة');
      return;
    }

    for (let i = 0; i < formItems.length; i++) {
      const it = formItems[i];
      if (!it.productName || Number(it.quantity) <= 0 || Number(it.retailUnitPrice) <= 0) {
        setFormError(`يرجى التأكد من اسم الصنف، الكمية، وسعر البيع في السطر رقم (${i + 1})`);
        return;
      }
    }

    const collectedNum = Number(formCollectedCash);
    if (isNaN(collectedNum) || collectedNum < 0) {
      setFormError('يرجى إدخال المبلغ المحصل الفعلي من شركة الشحن (الكاش المقبوض)');
      return;
    }

    const shippingFeeNum = Number(formShippingFee) || 0;
    const netReceived = Math.max(0, collectedNum - shippingFeeNum);

    setIsSubmitting(true);
    try {
      const settlementToSave: CourierSettlement = {
        id: editingSettlement ? editingSettlement.id : `courier-${Date.now()}`,
        courierName: courierFinalName,
        manifestNumber: formManifestNumber.trim() || `SHP-${Date.now().toString().slice(-4)}`,
        date: formDate || new Date().toISOString().slice(0, 10),
        collectedCash: collectedNum,
        shippingFeeDeducted: shippingFeeNum,
        totalOrderValue: formTotalOrderValue,
        netCashReceived: netReceived,
        items: formItems,
        notes: formNotes.trim(),
        status: collectedNum >= formTotalOrderValue ? 'COMPLETED' : collectedNum > 0 ? 'PARTIAL' : 'PENDING',
        createdAt: editingSettlement ? editingSettlement.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSaveSettlement(settlementToSave);
      setIsFormOpen(false);
    } catch (err: any) {
      console.error('Error saving courier settlement:', err);
      setFormError(err?.message || 'حدث خطأ أثناء حفظ التحصيل');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredCalculations.length === 0) return;

    const headers = [
      'التاريخ',
      'شركة الشحن',
      'رقم الكشف / البوليصة',
      'قيمة البضاعة المباعة (ج.م)',
      'المبلغ المحصل كاش (ج.م)',
      'مصاريف الشحن (ج.م)',
      'صافي الكاش المستلم (ج.م)',
      'ربح الشركة المحصل (ج.م)',
      'ربح المصنع المحصل (ج.م)',
      'صافي الربح الفعلي (ج.م)',
      'عدد الأصناف',
    ];

    const rows = filteredCalculations.map(s => [
      s.date,
      `"${s.courierName.replace(/"/g, '""')}"`,
      `"${s.manifestNumber.replace(/"/g, '""')}"`,
      s.totalRetailValue,
      s.collectedCash,
      s.shippingFeeDeducted,
      s.netCashReceived,
      s.realizedCompanyProfit,
      s.realizedFactoryProfit,
      s.realizedTotalProfit,
      s.items.length,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `كشف_تحصيلات_الشحن_والقطاعي_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 text-right" dir="rtl">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Modal Top Header */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  تحصيلات شركات الشحن والبيع القطاعي
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  RETAIL & COURIER
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تسجيل الفلوس المقبوضة من شركات الشحن، وحساب أرباح الشركة والمصنع من البيع القطاعي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenNewForm}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل تحصيل شحن جديد</span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="px-5 sm:px-8 pt-4 pb-2 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('LIST')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'LIST'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>كشف دفعات وتحصيلات الشحن ({filteredCalculations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('PRODUCTS_ANALYSIS')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'PRODUCTS_ANALYSIS'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>تحليل أرباح الأصناف المباعة قطاعي ({productsAnalysis.length})</span>
            </button>
          </div>

          {/* Quick Export and Print */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="تصدير إلى ملف Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير Excel</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          
          {/* Top Realized KPI Dashboard Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            
            {/* 1. Collected Cash from Courier */}
            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg shadow-emerald-950/20">
              <div className="flex items-center justify-between text-emerald-400 mb-1">
                <span className="text-[11px] font-bold">الفلوس المقبوضة كاش</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-emerald-400">
                  {summaryMetrics.totalCollected.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 mr-1">ج.م</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">من شركات الشحن</span>
            </div>

            {/* 2. Total Retail Goods Value */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold">قيمة البضاعة المباعة</span>
                <Package className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold text-slate-200">
                  {summaryMetrics.totalRetail.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 mr-1">ج.م</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">إجمالي القطاعي</span>
            </div>

            {/* 3. Shipping Fees Deducted */}
            <div className="bg-slate-950/80 border border-rose-500/20 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-rose-400 mb-1">
                <span className="text-[11px] font-bold">مصاريف الشحن والعمولة</span>
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold text-rose-400">
                  {summaryMetrics.totalShippingFees.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 mr-1">ج.م</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">مخصومة من شركات الشحن</span>
            </div>

            {/* 4. Company Realized Profit */}
            <div className="bg-slate-950/80 border border-teal-500/30 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-teal-400 mb-1">
                <span className="text-[11px] font-bold">أرباح الشركة (قطاعي)</span>
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-teal-400">
                  +{summaryMetrics.totalCompanyProfit.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 mr-1">ج.م</span>
              </div>
              <span className="text-[10px] text-teal-500/80 mt-1">المحصلة فعلياً كاش</span>
            </div>

            {/* 5. Factory Realized Profit */}
            <div className="bg-slate-950/80 border border-blue-500/30 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-400 mb-1">
                <span className="text-[11px] font-bold">أرباح المصنع (قطاعي)</span>
                <Factory className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-blue-400">
                  +{summaryMetrics.totalFactoryProfit.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 mr-1">ج.م</span>
              </div>
              <span className="text-[10px] text-blue-500/80 mt-1">المحصلة فعلياً كاش</span>
            </div>

            {/* 6. Net Profit in Pocket */}
            <div className="bg-gradient-to-br from-amber-950/40 to-slate-950 border-2 border-amber-500/50 rounded-2xl p-4 flex flex-col justify-between shadow-xl shadow-amber-950/30">
              <div className="flex items-center justify-between text-amber-400 mb-1">
                <span className="text-[11px] font-black">صافي الربح في الجيب</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-amber-300">
                  +{summaryMetrics.totalNetProfit.toLocaleString()}
                </span>
                <span className="text-xs text-amber-400/80 mr-1">ج.م</span>
              </div>
              <span className="text-[10px] text-amber-400/70 font-semibold mt-1">بعد خصم الشحن والمصنع</span>
            </div>

          </div>

          {/* Filters Bar */}
          <div className="bg-slate-950/60 p-3.5 sm:p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
              
              {/* Search */}
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث باسم شركة الشحن، الكشف، أو المنتج..."
                  className="w-full pl-3 pr-9 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Courier Filter */}
              <select
                value={courierFilter}
                onChange={(e) => setCourierFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">جميع شركات الشحن</option>
                {uniqueCouriers.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Date Filter */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700/80">
                {(['ALL', 'TODAY', 'WEEK', 'MONTH', 'CUSTOM'] as const).map(df => (
                  <button
                    key={df}
                    onClick={() => setDateFilter(df)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      dateFilter === df
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {df === 'ALL' && 'كل الفترات'}
                    {df === 'TODAY' && 'اليوم'}
                    {df === 'WEEK' && 'آخر 7 أيام'}
                    {df === 'MONTH' && 'هذا الشهر'}
                    {df === 'CUSTOM' && 'مخصص'}
                  </button>
                ))}
              </div>

              {dateFilter === 'CUSTOM' && (
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white"
                  />
                  <span className="text-slate-500">إلى</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white"
                  />
                </div>
              )}

            </div>

            <div className="text-xs text-slate-400">
              إجمالي النتائج: <strong className="text-white">{filteredCalculations.length}</strong> كشف
            </div>

          </div>

          {/* TAB 1: LIST OF SETTLEMENTS */}
          {activeTab === 'LIST' && (
            <div className="space-y-3">
              {filteredCalculations.length === 0 ? (
                <div className="text-center py-16 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                  <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-300">لا توجد تحصيلات مسجلة لشركات الشحن حتى الآن</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                    اضغط على زر «تسجيل تحصيل شحن جديد» بالأعلى لإضافة المبالغ المحصلة من شركات الشحن (بوسطة، أوتو، شيب بلو...) وحساب أرباح القطاعي فوراً.
                  </p>
                  <button
                    onClick={handleOpenNewForm}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة أول تحصيل كاش</span>
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs sm:text-sm">
                      <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">التاريخ</th>
                          <th className="py-3 px-4">شركة الشحن</th>
                          <th className="py-3 px-4">رقم الكشف / البوليصة</th>
                          <th className="py-3 px-4">قيمة البضاعة</th>
                          <th className="py-3 px-4 text-emerald-400">المبلغ المحصل كاش</th>
                          <th className="py-3 px-4 text-rose-400">مصاريف الشحن</th>
                          <th className="py-3 px-4 text-teal-400">ربح الشركة</th>
                          <th className="py-3 px-4 text-blue-400">ربح المصنع</th>
                          <th className="py-3 px-4 text-amber-400">صافي الربح الفعلي</th>
                          <th className="py-3 px-4 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {filteredCalculations.map((cb) => {
                          const isExpanded = expandedSettlementId === cb.settlementId;
                          const rawSettlement = courierSettlements.find(s => s.id === cb.settlementId);

                          return (
                            <React.Fragment key={cb.settlementId}>
                              <tr className="hover:bg-slate-900/50 transition-colors">
                                <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">
                                  {cb.date}
                                </td>
                                <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                  {cb.courierName}
                                </td>
                                <td className="py-3.5 px-4 font-mono text-slate-300">
                                  {cb.manifestNumber}
                                </td>
                                <td className="py-3.5 px-4 text-slate-300">
                                  {cb.totalRetailValue.toLocaleString()} ج.م
                                </td>
                                <td className="py-3.5 px-4 font-black text-emerald-400">
                                  {cb.collectedCash.toLocaleString()} ج.م
                                  {cb.paidRatio < 0.99 && (
                                    <span className="text-[10px] text-amber-400 block font-normal">
                                      (تحصيل {Math.round(cb.paidRatio * 100)}%)
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-rose-400 font-semibold">
                                  {cb.shippingFeeDeducted > 0 ? `-${cb.shippingFeeDeducted.toLocaleString()} ج.م` : '0 ج.م'}
                                </td>
                                <td className="py-3.5 px-4 text-teal-400 font-bold">
                                  +{cb.realizedCompanyProfit.toLocaleString()} ج.م
                                </td>
                                <td className="py-3.5 px-4 text-blue-400 font-bold">
                                  +{cb.realizedFactoryProfit.toLocaleString()} ج.م
                                </td>
                                <td className="py-3.5 px-4 font-black text-amber-300 bg-amber-950/10">
                                  +{cb.realizedTotalProfit.toLocaleString()} ج.م
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => setExpandedSettlementId(isExpanded ? null : cb.settlementId)}
                                      className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                      title="عرض تفاصيل الأصناف"
                                    >
                                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                    {rawSettlement && (
                                      <button
                                        onClick={() => handleOpenEditForm(rawSettlement)}
                                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                        title="تعديل الكشف"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        if (confirm(`هل أنت متأكد من حذف كشف التحصيل الخاص بشركة (${cb.courierName})؟`)) {
                                          onDeleteSettlement(cb.settlementId);
                                        }
                                      }}
                                      className="p-1.5 text-rose-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                      title="حذف الكشف"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expanded Row for Sold Items */}
                              {isExpanded && (
                                <tr className="bg-slate-950/90 border-y border-slate-800">
                                  <td colSpan={10} className="p-4 sm:p-5">
                                    <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800/80 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                                          <Package className="w-4 h-4 text-indigo-400" />
                                          الأصناف المباعة في هذا الكشف ({cb.items.length} صنف):
                                        </span>
                                        {rawSettlement?.notes && (
                                          <span className="text-xs text-slate-400">
                                            ملاحظات: <span className="text-slate-200">{rawSettlement.notes}</span>
                                          </span>
                                        )}
                                      </div>

                                      <div className="overflow-x-auto">
                                        <table className="w-full text-right text-xs">
                                          <thead className="text-slate-400 border-b border-slate-800 text-[10px]">
                                            <tr>
                                              <th className="py-2 px-3">اسم المنتج</th>
                                              <th className="py-2 px-3">الكمية</th>
                                              <th className="py-2 px-3">سعر بيع القطاعي</th>
                                              <th className="py-2 px-3">إجمالي البيع</th>
                                              <th className="py-2 px-3 text-teal-400">ربح الشركة</th>
                                              <th className="py-2 px-3 text-blue-400">ربح المصنع</th>
                                              <th className="py-2 px-3 text-amber-400">صافي ربح الصنف</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-800/40">
                                            {cb.items.map((it, idx) => (
                                              <tr key={idx} className="hover:bg-slate-800/30">
                                                <td className="py-2 px-3 font-semibold text-white">
                                                  {it.productName}
                                                </td>
                                                <td className="py-2 px-3 text-slate-300">
                                                  {it.quantity} {it.unit}
                                                </td>
                                                <td className="py-2 px-3 text-slate-300">
                                                  {it.retailUnitPrice} ج.م
                                                </td>
                                                <td className="py-2 px-3 text-slate-200 font-medium">
                                                  {it.retailRevenueTotal.toLocaleString()} ج.م
                                                </td>
                                                <td className="py-2 px-3 text-teal-400 font-semibold">
                                                  +{it.realizedCompanyProfit.toLocaleString()} ج.م
                                                </td>
                                                <td className="py-2 px-3 text-blue-400 font-semibold">
                                                  +{it.realizedFactoryProfit.toLocaleString()} ج.م
                                                </td>
                                                <td className="py-2 px-3 text-amber-300 font-bold">
                                                  +{it.realizedTotalProfit.toLocaleString()} ج.م
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}

                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCTS ANALYSIS IN RETAIL */}
          {activeTab === 'PRODUCTS_ANALYSIS' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-400" />
                    تقرير ربحية أصناف البيع القطاعي المحصلة فعلياً
                  </h4>
                  <span className="text-xs text-slate-400">
                    مرتبة حسب أعلى صافي ربح محقق
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs sm:text-sm">
                    <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="py-3 px-4">اسم المنتج</th>
                        <th className="py-3 px-4">إجمالي الكمية المباعة</th>
                        <th className="py-3 px-4">إجمالي مبيعات القطاعي</th>
                        <th className="py-3 px-4 text-emerald-400">الكاش المحصل فعلياً</th>
                        <th className="py-3 px-4 text-teal-400">أرباح الشركة المحصلة</th>
                        <th className="py-3 px-4 text-blue-400">أرباح المصنع المحصلة</th>
                        <th className="py-3 px-4 text-amber-300">صافي ربح الصنف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {productsAnalysis.map((prod, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white">
                            {prod.productName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            <strong className="text-white font-mono">{prod.totalQuantity}</strong> {prod.unit}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {prod.totalRetailRevenue.toLocaleString()} ج.م
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-400">
                            {prod.totalRealizedRevenue.toLocaleString()} ج.م
                          </td>
                          <td className="py-3.5 px-4 text-teal-400 font-bold">
                            +{prod.realizedCompanyProfit.toLocaleString()} ج.م
                          </td>
                          <td className="py-3.5 px-4 text-blue-400 font-bold">
                            +{prod.realizedFactoryProfit.toLocaleString()} ج.م
                          </td>
                          <td className="py-3.5 px-4 font-black text-amber-300 bg-amber-950/10">
                            +{prod.realizedNetProfit.toLocaleString()} ج.م
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT SETTLEMENT MODAL FORM */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Form Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {editingSettlement ? 'تعديل كشف تحصيل شركة الشحن' : 'تسجيل تحصيل شحن جديد (بيع قطاعي)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    أدخل المبلغ المستلم والمنتجات المباعة لحساب الأرباح النقدية بدقة
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {formError && (
                <div className="p-3.5 bg-rose-500/20 border border-rose-500/50 rounded-xl text-rose-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Courier & Manifest Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Courier Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    شركة الشحن / المندوب <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formCourierName}
                    onChange={(e) => setFormCourierName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {COMMON_COURIERS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="أخرى">أخرى (كتابة اسم مخصص)...</option>
                  </select>

                  {formCourierName === 'أخرى' && (
                    <input
                      type="text"
                      value={formCustomCourier}
                      onChange={(e) => setFormCustomCourier(e.target.value)}
                      placeholder="اكتب اسم شركة الشحن أو المندوب..."
                      className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>

                {/* Manifest / Waybill Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    رقم الكشف / البوليصة
                  </label>
                  <input
                    type="text"
                    value={formManifestNumber}
                    onChange={(e) => setFormManifestNumber(e.target.value)}
                    placeholder="مثال: SHP-1042 أو كشف رقم 5"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    تاريخ التحصيل والاستلام
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

              </div>

              {/* 2. Items Sold in Retail */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-400" />
                    المنتجات المباعة في هذه الشحنات
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemToForm}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة منتج آخر</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formItems.map((it, idx) => (
                    <div key={it.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 bg-slate-900 rounded-xl border border-slate-800 items-center">
                      
                      {/* Product Name */}
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-slate-400 mb-1">اسم الصنف</label>
                        <select
                          value={it.productName}
                          onChange={(e) => handleUpdateItemInForm(idx, 'productName', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                          {pricingTiers.map(t => (
                            <option key={t.id} value={t.productName}>{t.productName}</option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 mb-1">الكمية</label>
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={it.quantity}
                          onChange={(e) => handleUpdateItemInForm(idx, 'quantity', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-center focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>

                      {/* Unit */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 mb-1">الوحدة</label>
                        <select
                          value={it.unit}
                          onChange={(e) => handleUpdateItemInForm(idx, 'unit', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="قطعة">قطعة</option>
                          <option value="كرتونة">كرتونة</option>
                        </select>
                      </div>

                      {/* Retail Unit Price */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 mb-1">سعر بيع القطاعي (ج.م)</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={it.retailUnitPrice}
                          onChange={(e) => handleUpdateItemInForm(idx, 'retailUnitPrice', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-center focus:outline-none focus:border-indigo-500 font-mono font-bold text-indigo-300"
                        />
                      </div>

                      {/* Line Total & Remove */}
                      <div className="sm:col-span-2 flex items-center justify-between gap-1 pt-4 sm:pt-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">الإجمالي:</span>
                          <span className="text-xs font-bold text-white">{it.totalAmount.toLocaleString()} ج.م</span>
                        </div>
                        {formItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromForm(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-950/40 rounded-lg cursor-pointer"
                            title="حذف هذا الصنف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-semibold">
                  <span className="text-slate-400">إجمالي قيمة البضاعة المباعة قطاعي:</span>
                  <span className="text-base font-black text-white">{formTotalOrderValue.toLocaleString()} ج.م</span>
                </div>

              </div>

              {/* 3. Cash Collection & Shipping Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                
                {/* Collected Cash */}
                <div>
                  <label className="block text-xs font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    المبلغ المحصل من شركة الشحن (الفلوس المقبوضة فعلياً) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="مثال: 5400"
                    value={formCollectedCash}
                    onChange={(e) => setFormCollectedCash(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border-2 border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-base font-black text-emerald-300 focus:outline-none focus:border-emerald-400 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    المبلغ اللي استلمته في يدك أو في حسابك البنكي من مندوب/شركة الشحن
                  </span>
                </div>

                {/* Shipping Fee Deducted */}
                <div>
                  <label className="block text-xs font-bold text-rose-400 mb-1.5 flex items-center gap-1.5">
                    <Truck className="w-4 h-4" />
                    مصاريف وعمولة الشحن المخصومة (إن وجدت)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="مثال: 350"
                    value={formShippingFee}
                    onChange={(e) => setFormShippingFee(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-bold text-rose-300 focus:outline-none focus:border-rose-400 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    يتم خصمها من صافي الربح النهائي
                  </span>
                </div>

              </div>

              {/* 4. Live Profits Preview Card */}
              <div className="bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 p-4 rounded-2xl border border-indigo-500/30 space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>معاينة حية للأرباح المحققة من هذا التحصيل:</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-teal-500/20">
                    <span className="text-[10px] text-slate-400 block mb-0.5">ربح الشركة المحصل</span>
                    <strong className="text-sm font-black text-teal-400">
                      +{formLiveProfit.realizedCompanyProfit.toLocaleString()} ج.م
                    </strong>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-blue-500/20">
                    <span className="text-[10px] text-slate-400 block mb-0.5">ربح المصنع المحصل</span>
                    <strong className="text-sm font-black text-blue-400">
                      +{formLiveProfit.realizedFactoryProfit.toLocaleString()} ج.م
                    </strong>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-amber-500/40 shadow-inner">
                    <span className="text-[10px] text-amber-300 block mb-0.5 font-bold">صافي الربح في الجيب</span>
                    <strong className="text-sm font-black text-amber-300">
                      +{formLiveProfit.realizedTotalProfit.toLocaleString()} ج.م
                    </strong>
                  </div>
                </div>
              </div>

              {/* 5. Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  ملاحظات إضافية
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="أي تفاصيل عن مناطق التوزيع أو أرقام الحوالات..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>جارٍ الحفظ...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingSettlement ? 'حفظ التعديلات' : 'تسجيل التحصيل والأرباح'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
