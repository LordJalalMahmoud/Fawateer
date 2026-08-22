'use client';

import React, { useState, useMemo, useRef } from 'react';
import { 
  Invoice, 
  ProductPricingTier, 
  VaultSettings, 
  InvoiceProfitBreakdown, 
  ItemProfitCalculation 
} from '@/lib/types';
import { calculateInvoiceProfit, findPricingTier } from '@/lib/pricing-data';
import { 
  Lock, 
  Unlock, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  Factory, 
  Plus, 
  Trash2, 
  Save, 
  Printer, 
  Download, 
  Search, 
  Calendar, 
  Users, 
  KeyRound, 
  X, 
  Eye, 
  EyeOff, 
  Layers, 
  HelpCircle, 
  Sparkles,
  Percent,
  ReceiptText
} from 'lucide-react';

interface SecretProfitVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string | null;
  invoices: Invoice[];
  pricingTiers: ProductPricingTier[];
  vaultSettings: VaultSettings;
  onSavePricingTiers: (tiers: ProductPricingTier[]) => Promise<void>;
  onSaveVaultSettings: (settings: VaultSettings) => Promise<void>;
}

export function SecretProfitVaultModal({
  isOpen,
  onClose,
  currentUserEmail,
  invoices,
  pricingTiers,
  vaultSettings,
  onSavePricingTiers,
  onSaveVaultSettings,
}: SecretProfitVaultModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Authentication & Permission Check
  const normalizedUserEmail = (currentUserEmail || '').trim().toLowerCase();
  const SUPER_ADMIN = 'jalalmahmoud8000@gmail.com';
  
  const isSuperAdmin = normalizedUserEmail === SUPER_ADMIN;
  const isAuthorizedEmail = useMemo(() => {
    if (isSuperAdmin) return true;
    const list = (vaultSettings.authorizedEmails || []).map(e => (e || '').trim().toLowerCase());
    return list.includes(normalizedUserEmail);
  }, [isSuperAdmin, normalizedUserEmail, vaultSettings.authorizedEmails]);

  // PIN Verification State
  const [pinInput, setPinInput] = useState('');
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);
  const [pinError, setPinError] = useState('');

  // Active Tab: 'ANALYTICS' | 'PRICING_TIERS' | 'PERMISSIONS'
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'PRICING_TIERS' | 'PERMISSIONS'>('ANALYTICS');

  // Filters for Analytics
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [merchantFilter, setMerchantFilter] = useState<string>('ALL');
  const [productFilter, setProductFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Editable Pricing Tiers State
  const [editableTiers, setEditableTiers] = useState<ProductPricingTier[]>(pricingTiers);
  const [isSavingTiers, setIsSavingTiers] = useState(false);
  const [prevTiers, setPrevTiers] = useState<ProductPricingTier[]>(pricingTiers);

  if (pricingTiers !== prevTiers) {
    setPrevTiers(pricingTiers);
    setEditableTiers(pricingTiers);
  }

  // Editable Vault Settings State
  const [newEmailInput, setNewEmailInput] = useState('');
  const [newPinInput, setNewPinInput] = useState(vaultSettings.securityPin || '');
  const [prevPin, setPrevPin] = useState(vaultSettings.securityPin || '');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  if (vaultSettings.securityPin !== prevPin) {
    setPrevPin(vaultSettings.securityPin || '');
    setNewPinInput(vaultSettings.securityPin || '');
  }

  // If PIN is not configured or user is super admin, unlock automatically
  const hasPinConfigured = Boolean(vaultSettings.securityPin && vaultSettings.securityPin.trim().length > 0);
  const isVaultAccessible = isAuthorizedEmail && (!hasPinConfigured || isPinUnlocked || isSuperAdmin);

  // Verify PIN
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === vaultSettings.securityPin) {
      setIsPinUnlocked(true);
      setPinError('');
    } else {
      setPinError('رمز الحماية PIN غير صحيح، يرجى المحاولة مرة أخرى');
    }
  };

  // Filter Invoices
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return invoices.filter(inv => {
      // Date filter
      if (dateFilter === 'TODAY' && inv.date !== todayStr) return false;
      if (dateFilter === 'WEEK') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        if (inv.date < weekAgo) return false;
      }
      if (dateFilter === 'MONTH') {
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        if (inv.date < monthStart) return false;
      }
      if (dateFilter === 'CUSTOM') {
        if (customStartDate && inv.date < customStartDate) return false;
        if (customEndDate && inv.date > customEndDate) return false;
      }

      // Merchant Filter
      if (merchantFilter !== 'ALL' && (inv.customerName || '').trim() !== merchantFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesClient = (inv.customerName || '').toLowerCase().includes(q);
        const matchesNum = (inv.invoiceNumber || '').toLowerCase().includes(q);
        const matchesItem = (inv.items || []).some(it => it.name.toLowerCase().includes(q));
        if (!matchesClient && !matchesNum && !matchesItem) return false;
      }

      return true;
    });
  }, [invoices, dateFilter, customStartDate, customEndDate, merchantFilter, searchQuery]);

  // Calculate detailed profits across filtered invoices
  const invoiceProfits: InvoiceProfitBreakdown[] = useMemo(() => {
    return filteredInvoices.map(inv => calculateInvoiceProfit(inv, pricingTiers));
  }, [filteredInvoices, pricingTiers]);

  // Aggregate Totals
  const totals = useMemo(() => {
    let merchantRevenue = 0;
    let companyCost = 0;
    let factoryCost = 0;
    let companyProfit = 0;
    let factoryToCompanyProfit = 0;
    let totalProfit = 0;
    let totalItemsCount = 0;

    invoiceProfits.forEach(inv => {
      inv.items.forEach(it => {
        if (productFilter !== 'ALL' && it.productName !== productFilter) {
          return;
        }
        merchantRevenue += it.merchantRevenueTotal;
        companyCost += it.companyCostTotal;
        factoryCost += it.factoryCostTotal;
        companyProfit += it.companyProfitTotal;
        factoryToCompanyProfit += it.factoryToCompanyProfitTotal;
        totalProfit += it.totalProfit;
        totalItemsCount += it.quantity;
      });
    });

    return {
      merchantRevenue: Number(merchantRevenue.toFixed(2)),
      companyCost: Number(companyCost.toFixed(2)),
      factoryCost: Number(factoryCost.toFixed(2)),
      companyProfit: Number(companyProfit.toFixed(2)),
      factoryToCompanyProfit: Number(factoryToCompanyProfit.toFixed(2)),
      totalProfit: Number(totalProfit.toFixed(2)),
      totalItemsCount,
      companyProfitMargin: merchantRevenue > 0 ? Number(((companyProfit / merchantRevenue) * 100).toFixed(1)) : 0,
      totalProfitMargin: merchantRevenue > 0 ? Number(((totalProfit / merchantRevenue) * 100).toFixed(1)) : 0,
    };
  }, [invoiceProfits, productFilter]);

  // Group Profit by Product
  const productProfitSummary = useMemo(() => {
    const map: Record<string, {
      productName: string;
      category: string;
      quantity: number;
      factoryPrice: number;
      companyPrice: number;
      avgMerchantPrice: number;
      merchantRevenue: number;
      companyProfit: number;
      factoryProfit: number;
      totalProfit: number;
    }> = {};

    invoiceProfits.forEach(inv => {
      inv.items.forEach(it => {
        const key = it.productName;
        if (!map[key]) {
          const tier = findPricingTier(it.productName, pricingTiers);
          map[key] = {
            productName: it.productName,
            category: tier?.category || 'عام',
            quantity: 0,
            factoryPrice: it.factoryUnitPrice,
            companyPrice: it.companyUnitPrice,
            avgMerchantPrice: 0,
            merchantRevenue: 0,
            companyProfit: 0,
            factoryProfit: 0,
            totalProfit: 0,
          };
        }
        map[key].quantity += it.quantity;
        map[key].merchantRevenue += it.merchantRevenueTotal;
        map[key].companyProfit += it.companyProfitTotal;
        map[key].factoryProfit += it.factoryToCompanyProfitTotal;
        map[key].totalProfit += it.totalProfit;
      });
    });

    return Object.values(map).map(p => ({
      ...p,
      avgMerchantPrice: p.quantity > 0 ? Number((p.merchantRevenue / p.quantity).toFixed(2)) : 0,
      companyProfit: Number(p.companyProfit.toFixed(2)),
      factoryProfit: Number(p.factoryProfit.toFixed(2)),
      totalProfit: Number(p.totalProfit.toFixed(2)),
    })).sort((a, b) => b.totalProfit - a.totalProfit);
  }, [invoiceProfits, pricingTiers]);

  // Unique Merchants List
  const uniqueMerchants = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach(inv => {
      if (inv.customerName) set.add(inv.customerName.trim());
    });
    return Array.from(set).sort();
  }, [invoices]);

  // Unique Products List
  const uniqueProducts = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach(inv => {
      (inv.items || []).forEach(it => {
        if (it.name) set.add(it.name.trim());
      });
    });
    pricingTiers.forEach(t => set.add(t.productName));
    return Array.from(set).sort();
  }, [invoices, pricingTiers]);

  if (!isOpen) return null;

  // Actions for Price Tiers
  const handleUpdateTier = (index: number, field: keyof ProductPricingTier, value: any) => {
    setEditableTiers(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddTier = () => {
    const newTier: ProductPricingTier = {
      id: `tier-custom-${Date.now()}`,
      productName: 'منتج جديد',
      category: 'عام',
      factoryPrice: 0,
      companyPrice: 0,
      unit: 'كرتونة',
      aliases: [],
    };
    setEditableTiers(prev => [...prev, newTier]);
  };

  const handleRemoveTier = (index: number) => {
    setEditableTiers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveTiers = async () => {
    setIsSavingTiers(true);
    try {
      await onSavePricingTiers(editableTiers);
      setSettingsFeedback('تم حفظ وتحديث جدول أسعار المصنع والشركة بنجاح في قاعدة البيانات!');
      setTimeout(() => setSettingsFeedback(null), 4000);
    } catch (e: any) {
      setSettingsFeedback(`خطأ في الحفظ: ${e?.message || e}`);
    } finally {
      setIsSavingTiers(false);
    }
  };

  // Actions for Permissions
  const handleAddAuthorizedEmail = async () => {
    if (!newEmailInput.trim() || !newEmailInput.includes('@')) {
      alert('الرجاء إدخال بريد إلكتروني صحيح');
      return;
    }
    const emailToAdd = newEmailInput.trim().toLowerCase();
    const currentList = vaultSettings.authorizedEmails || [];
    if (currentList.map(e => e.toLowerCase()).includes(emailToAdd)) {
      alert('هذا الحساب مصرح له بالفعل');
      return;
    }

    const updatedList = [...currentList, emailToAdd];
    setIsSavingSettings(true);
    try {
      await onSaveVaultSettings({
        ...vaultSettings,
        authorizedEmails: updatedList,
      });
      setNewEmailInput('');
      setSettingsFeedback(`تمت إضافة التصريح للحساب (${emailToAdd}) بنجاح!`);
      setTimeout(() => setSettingsFeedback(null), 4000);
    } catch (e: any) {
      setSettingsFeedback(`خطأ: ${e?.message || e}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRemoveAuthorizedEmail = async (emailToRemove: string) => {
    if (emailToRemove.toLowerCase() === SUPER_ADMIN.toLowerCase()) {
      alert('لا يمكن إزالة الحساب الرئيسي للمدير العام');
      return;
    }
    const updatedList = (vaultSettings.authorizedEmails || []).filter(
      e => e.toLowerCase() !== emailToRemove.toLowerCase()
    );
    setIsSavingSettings(true);
    try {
      await onSaveVaultSettings({
        ...vaultSettings,
        authorizedEmails: updatedList,
      });
      setSettingsFeedback(`تم سحب التصريح من الحساب (${emailToRemove})`);
      setTimeout(() => setSettingsFeedback(null), 4000);
    } catch (e: any) {
      setSettingsFeedback(`خطأ: ${e?.message || e}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSavePin = async () => {
    setIsSavingSettings(true);
    try {
      await onSaveVaultSettings({
        ...vaultSettings,
        securityPin: newPinInput.trim(),
      });
      setSettingsFeedback('تم تحديث رمز الحماية السري PIN بنجاح!');
      setTimeout(() => setSettingsFeedback(null), 4000);
    } catch (e: any) {
      setSettingsFeedback(`خطأ: ${e?.message || e}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'التاريخ',
      'رقم الفاتورة',
      'التاجر',
      'اسم المنتج',
      'الكمية',
      'سعر المصنع',
      'سعر الشركة',
      'سعر البيع للتاجر',
      'إجمالي البيع',
      'ربح الشركة من التاجر',
      'ربح المصنع للشركة',
      'إجمالي الربح الكلي'
    ];

    const rows: any[] = [];
    invoiceProfits.forEach(inv => {
      inv.items.forEach(it => {
        if (productFilter !== 'ALL' && it.productName !== productFilter) return;
        rows.push([
          inv.date,
          inv.invoiceNumber,
          `"${inv.customerName.replace(/"/g, '""')}"`,
          `"${it.productName.replace(/"/g, '""')}"`,
          it.quantity,
          it.factoryUnitPrice,
          it.companyUnitPrice,
          it.merchantUnitPrice,
          it.merchantRevenueTotal,
          it.companyProfitTotal,
          it.factoryToCompanyProfitTotal,
          it.totalProfit,
        ]);
      });
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `secret_profits_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 text-slate-100 w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white flex items-center gap-2">
                  <span>خزنة الأرباح السرية</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    VIP SECRET VAULT
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                تحليل هوامش الأرباح بين أسعار المصنع، أسعار الشركة، وأسعار البيع للتجار
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isVaultAccessible && (
              <div className="hidden md:flex items-center gap-1 bg-slate-800/80 px-3 py-1 rounded-full text-xs text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>مصرح لك بالوصول: {currentUserEmail}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ACCESS DENIED SCREEN */}
        {!isAuthorizedEmail && (
          <div className="p-8 sm:p-12 text-center space-y-4 max-w-md mx-auto my-auto">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white">منطقة سرية ومحمية (وصول مقيد)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              حسابك الحالي (<strong className="text-slate-200">{currentUserEmail || 'مستخدم غير مسجل'}</strong>) ليس ضمن قائمة الأشخاص المصرح لهم بالدخول إلى خزنة الأرباح وهوامش التكلفة.
            </p>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 text-xs text-slate-300">
              يرجى التواصل مع المدير العام (<strong className="text-amber-300">{SUPER_ADMIN}</strong>) لإضافة بريدك الإلكتروني لقائمة التصاريح.
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* PIN UNLOCK SCREEN (If configured and not yet unlocked) */}
        {isAuthorizedEmail && hasPinConfigured && !isPinUnlocked && !isSuperAdmin && (
          <div className="p-8 sm:p-12 text-center space-y-4 max-w-sm mx-auto my-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <KeyRound className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">أدخل رمز الحماية السري (PIN)</h3>
            <p className="text-xs text-slate-400">
              تم تفعيل رمز أمان إضافي لهذه الخزنة. يرجى إدخال الرمز للمتابعة.
            </p>
            <form onSubmit={handleVerifyPin} className="space-y-3">
              <input
                type="password"
                required
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-full text-center tracking-widest text-lg font-bold px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
              {pinError && <p className="text-xs text-rose-400 font-semibold">{pinError}</p>}
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer shadow-md shadow-amber-400/20"
              >
                فتح الخزنة
              </button>
            </form>
          </div>
        )}

        {/* MAIN VAULT CONTENT (When Access Granted) */}
        {isVaultAccessible && (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Nav Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-6 bg-slate-950/40 no-print">
              <div className="flex items-center gap-2 overflow-x-auto py-2">
                <button
                  onClick={() => setActiveTab('ANALYTICS')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'ANALYTICS'
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>تحليل وهوامش الأرباح</span>
                </button>

                <button
                  onClick={() => setActiveTab('PRICING_TIERS')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'PRICING_TIERS'
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Factory className="w-4 h-4" />
                  <span>جدول أسعار المصنع والشركة ({editableTiers.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('PERMISSIONS')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'PERMISSIONS'
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>الأشخاص المصرح لهم والأمان</span>
                </button>
              </div>

              {/* Feedback toast message */}
              {settingsFeedback && (
                <div className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-lg animate-fade-in">
                  {settingsFeedback}
                </div>
              )}
            </div>

            {/* TAB 1: PROFIT ANALYTICS DASHBOARD */}
            {activeTab === 'ANALYTICS' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6" ref={printRef}>
                
                {/* Print Sheet Header (Only appears when printed) */}
                <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4 text-slate-900">
                  <h1 className="text-xl font-black">تقرير الأرباح وهوامش التكلفة السري - توريدات المنظفات</h1>
                  <p className="text-xs text-slate-600 mt-1">
                    تاريخ الاستخراج: {new Date().toISOString().slice(0, 10)} | مستخرج بواسطة: {currentUserEmail}
                  </p>
                </div>

                {/* KPI Cards: The 3 Core Profit Calculations Requested */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  
                  {/* 1. Company Profit from Merchants */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-700/40 shadow-lg shadow-emerald-950/30 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300">أرباح الشركة من التجار</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-emerald-400 mt-2">
                      {totals.companyProfit.toLocaleString()} <span className="text-xs font-normal text-emerald-300">ج.م</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
                      <span>الفرق (بيع التاجر - شراء الشركة)</span>
                      <span className="font-semibold text-emerald-300">{totals.companyProfitMargin}% هامش</span>
                    </div>
                  </div>

                  {/* 2. Factory to Company Profit */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/70 to-slate-900 border border-cyan-700/40 shadow-lg shadow-cyan-950/30 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300">أرباح المصنع إلى الشركة</span>
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Factory className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-cyan-400 mt-2">
                      {totals.factoryToCompanyProfit.toLocaleString()} <span className="text-xs font-normal text-cyan-300">ج.م</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5">
                      الفرق (سعر الشركة - سعر المصنع)
                    </div>
                  </div>

                  {/* 3. Combined Total Profit */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/70 to-slate-900 border border-amber-700/50 shadow-lg shadow-amber-950/40 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">إجمالي الأرباح الكلية</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-amber-300 mt-2">
                      {totals.totalProfit.toLocaleString()} <span className="text-xs font-normal text-amber-200">ج.م</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
                      <span>الفرق (بيع التاجر - شراء المصنع)</span>
                      <span className="font-semibold text-amber-300">{totals.totalProfitMargin}% هامش كلي</span>
                    </div>
                  </div>

                  {/* 4. Sales & Costs Overview */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">إجمالي المبيعات والتكلفة</span>
                      <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
                        <ReceiptText className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-xl font-bold text-white mt-2">
                      {totals.merchantRevenue.toLocaleString()} <span className="text-xs text-slate-400">ج.م مبيعات</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                      <div>تكلفة المصنع: <strong className="text-slate-300">{totals.factoryCost.toLocaleString()} ج</strong></div>
                      <div>تكلفة الشركة: <strong className="text-slate-300">{totals.companyCost.toLocaleString()} ج</strong></div>
                    </div>
                  </div>

                </div>

                {/* Filter Toolbar */}
                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
                  
                  {/* Date Range Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setDateFilter('ALL')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                        dateFilter === 'ALL' ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      كل الفترات
                    </button>
                    <button
                      onClick={() => setDateFilter('TODAY')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                        dateFilter === 'TODAY' ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      اليوم
                    </button>
                    <button
                      onClick={() => setDateFilter('WEEK')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                        dateFilter === 'WEEK' ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      آخر 7 أيام
                    </button>
                    <button
                      onClick={() => setDateFilter('MONTH')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                        dateFilter === 'MONTH' ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      هذا الشهر
                    </button>
                    <button
                      onClick={() => setDateFilter('CUSTOM')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                        dateFilter === 'CUSTOM' ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      تاريخ مخصص
                    </button>
                  </div>

                  {/* Dropdown Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    
                    {/* Merchant Dropdown */}
                    <select
                      value={merchantFilter}
                      onChange={(e) => setMerchantFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                    >
                      <option value="ALL">جميع التجار والعملاء</option>
                      {uniqueMerchants.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    {/* Product Dropdown */}
                    <select
                      value={productFilter}
                      onChange={(e) => setProductFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                    >
                      <option value="ALL">جميع المنتجات والأصناف</option>
                      {uniqueProducts.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>

                    {/* Export & Print */}
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl cursor-pointer"
                      title="تصدير جدول الأرباح إلى Excel"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Excel</span>
                    </button>

                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl cursor-pointer font-bold"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة</span>
                    </button>
                  </div>

                </div>

                {/* Custom Date Inputs if active */}
                {dateFilter === 'CUSTOM' && (
                  <div className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs no-print">
                    <span className="text-slate-400">من تاريخ:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                    />
                    <span className="text-slate-400">إلى تاريخ:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                    />
                  </div>
                )}

                {/* Breakdown by Product Table */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>تحليل هوامش وأرباح الأصناف والمنتجات المباعة</span>
                  </h3>

                  <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-xl bg-slate-950/40">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-3.5">اسم المنتج</th>
                          <th className="py-3 px-3 text-center">الكمية المباعة</th>
                          <th className="py-3 px-3 text-left">سعر المصنع</th>
                          <th className="py-3 px-3 text-left">سعر الشركة</th>
                          <th className="py-3 px-3 text-left">متوسط بيع التاجر</th>
                          <th className="py-3 px-3 text-left text-emerald-400">ربح الشركة (للكرتونة)</th>
                          <th className="py-3 px-3 text-left text-cyan-400">ربح المصنع (للكرتونة)</th>
                          <th className="py-3 px-3 text-left text-amber-300">صافي ربح الصنف الكلي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {productProfitSummary.map((p) => {
                          const unitCompanyProfit = Number((p.avgMerchantPrice - p.companyPrice).toFixed(2));
                          const unitFactoryProfit = Number((p.companyPrice - p.factoryPrice).toFixed(2));

                          return (
                            <tr key={p.productName} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-2.5 px-3.5 font-bold text-white">
                                {p.productName}
                                <span className="block text-[10px] text-slate-400 font-normal">{p.category}</span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-200">
                                {p.quantity} كرتونة
                              </td>
                              <td className="py-2.5 px-3 text-left text-slate-300 font-mono">
                                {p.factoryPrice} ج
                              </td>
                              <td className="py-2.5 px-3 text-left text-slate-300 font-mono">
                                {p.companyPrice} ج
                              </td>
                              <td className="py-2.5 px-3 text-left text-slate-200 font-mono font-bold">
                                {p.avgMerchantPrice} ج
                              </td>
                              <td className="py-2.5 px-3 text-left font-bold text-emerald-400">
                                +{p.companyProfit.toLocaleString()} ج.م
                                <span className="block text-[10px] text-emerald-400/70 font-normal">({unitCompanyProfit} ج/ك)</span>
                              </td>
                              <td className="py-2.5 px-3 text-left font-bold text-cyan-400">
                                +{p.factoryProfit.toLocaleString()} ج.م
                                <span className="block text-[10px] text-cyan-400/70 font-normal">({unitFactoryProfit} ج/ك)</span>
                              </td>
                              <td className="py-2.5 px-3 text-left font-black text-amber-300 text-sm">
                                +{p.totalProfit.toLocaleString()} ج.م
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Detailed Transactions List */}
                <div className="space-y-2.5 pt-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <ReceiptText className="w-4 h-4 text-emerald-400" />
                    <span>سجل حركات الفواتير وهوامش أرباح كل طلبية</span>
                  </h3>

                  <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-xl bg-slate-950/40">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-3 w-20">التاريخ</th>
                          <th className="py-3 px-3 w-24">رقم الفاتورة</th>
                          <th className="py-3 px-3">التاجر / العميل</th>
                          <th className="py-3 px-3">تفاصيل الأصناف والكميات</th>
                          <th className="py-3 px-3 text-left">قيمة البيع للتاجر</th>
                          <th className="py-3 px-3 text-left text-emerald-400">ربح الشركة</th>
                          <th className="py-3 px-3 text-left text-cyan-400">ربح المصنع</th>
                          <th className="py-3 px-3 text-left text-amber-300 font-black">إجمالي الربح</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {invoiceProfits.map((inv) => (
                          <tr key={inv.invoiceId} className="hover:bg-slate-900/60 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">{inv.date}</td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-300 whitespace-nowrap">{inv.invoiceNumber}</td>
                            <td className="py-2.5 px-3 font-bold text-white">{inv.customerName}</td>
                            <td className="py-2.5 px-3">
                              <div className="space-y-1">
                                {inv.items.map((it, idx) => (
                                  <div key={idx} className="text-[11px] text-slate-300">
                                    • <strong className="text-white">{it.productName}</strong> ({it.quantity} {it.unit}): بيع {it.merchantUnitPrice}ج | شركة {it.companyUnitPrice}ج | مصنع {it.factoryUnitPrice}ج
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-left font-bold text-slate-200 whitespace-nowrap">
                              {inv.invoiceMerchantRevenue.toLocaleString()} ج.م
                            </td>
                            <td className="py-2.5 px-3 text-left font-bold text-emerald-400 whitespace-nowrap">
                              +{inv.invoiceCompanyProfit.toLocaleString()} ج.م
                            </td>
                            <td className="py-2.5 px-3 text-left font-bold text-cyan-400 whitespace-nowrap">
                              +{inv.invoiceFactoryToCompanyProfit.toLocaleString()} ج.م
                            </td>
                            <td className="py-2.5 px-3 text-left font-black text-amber-300 whitespace-nowrap">
                              +{inv.invoiceTotalProfit.toLocaleString()} ج.م
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: PRICE TIERS CONFIGURATION */}
            {activeTab === 'PRICING_TIERS' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Factory className="w-4 h-4 text-amber-400" />
                      <span>جدول أسعار المصنع وأسعار شراء/بيع الشركة</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      الأسعار المدخلة هنا يتم الاعتماد عليها مباشرة في حساب هوامش الأرباح التلقائية لكافة الفواتير ومسحوبات التجار.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddTier}
                      className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-amber-400" />
                      <span>إضافة صنف لجدول الأسعار</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveTiers}
                      disabled={isSavingTiers}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingTiers ? 'جارِ الحفظ...' : 'حفظ الأسعار في قاعدة البيانات'}</span>
                    </button>
                  </div>
                </div>

                {/* Table of editable pricing tiers */}
                <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-xl bg-slate-950/40">
                  <table className="w-full text-right text-xs sm:text-sm">
                    <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3.5">اسم المنتج</th>
                        <th className="py-3 px-3">التصنيف</th>
                        <th className="py-3 px-3 w-28">سعر شراء المصنع (ج.م)</th>
                        <th className="py-3 px-3 w-28">سعر شراء/بيع الشركة (ج.م)</th>
                        <th className="py-3 px-3 w-24">الوحدة</th>
                        <th className="py-3 px-3 w-28 text-emerald-400">هامش ربح الشركة للكرتونة</th>
                        <th className="py-3 px-3 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {editableTiers.map((tier, idx) => {
                        const factoryToCompanyMargin = tier.companyPrice - tier.factoryPrice;

                        return (
                          <tr key={tier.id || idx} className="hover:bg-slate-900/60">
                            {/* Product Name */}
                            <td className="py-2 px-3.5">
                              <input
                                type="text"
                                value={tier.productName}
                                onChange={(e) => handleUpdateTier(idx, 'productName', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                              />
                            </td>

                            {/* Category */}
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={tier.category}
                                onChange={(e) => handleUpdateTier(idx, 'category', e.target.value)}
                                className="w-full px-2 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-300"
                              />
                            </td>

                            {/* Factory Price */}
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={tier.factoryPrice}
                                onChange={(e) => handleUpdateTier(idx, 'factoryPrice', parseFloat(e.target.value) || 0)}
                                className="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-cyan-950/40 border border-cyan-700/50 rounded-lg text-cyan-300 font-bold text-center"
                              />
                            </td>

                            {/* Company Price */}
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={tier.companyPrice}
                                onChange={(e) => handleUpdateTier(idx, 'companyPrice', parseFloat(e.target.value) || 0)}
                                className="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-emerald-950/40 border border-emerald-700/50 rounded-lg text-emerald-300 font-bold text-center"
                              />
                            </td>

                            {/* Unit */}
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={tier.unit}
                                onChange={(e) => handleUpdateTier(idx, 'unit', e.target.value)}
                                className="w-full px-2 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-center"
                              />
                            </td>

                            {/* Margin Calc */}
                            <td className="py-2 px-3 font-bold text-emerald-400 text-xs">
                              +{factoryToCompanyMargin.toLocaleString()} ج.م
                            </td>

                            {/* Delete */}
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveTier(idx)}
                                className="text-slate-500 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveTiers}
                    disabled={isSavingTiers}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg shadow-amber-400/20 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingTiers ? 'جارِ الحفظ...' : 'حفظ التعديلات في Firebase'}</span>
                  </button>
                </div>

              </div>
            )}

            {/* TAB 3: PERMISSIONS & VAULT SECURITY */}
            {activeTab === 'PERMISSIONS' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-3xl mx-auto w-full">
                
                {/* Add Authorized Email Card */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">إدارة الحسابات المصرح لها بدخول الخزنة السرية</h3>
                      <p className="text-xs text-slate-400">
                        عين من يستطيع رؤية حسابات وهوامش الأرباح من خلال بريدهم الإلكتروني.
                      </p>
                    </div>
                  </div>

                  {/* Add Input */}
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="partner@example.com"
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddAuthorizedEmail}
                      disabled={isSavingSettings}
                      className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      + منح التصريح
                    </button>
                  </div>

                  {/* List of authorized users */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="block text-xs font-bold text-slate-400">
                      قائمة الأشخاص المصرح لهم حالياً:
                    </label>
                    <div className="space-y-1.5">
                      {/* Super Admin */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-amber-500/30 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          <span className="font-mono font-bold text-white">{SUPER_ADMIN}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                            المدير العام والمالك (صلاحية دائمة)
                          </span>
                        </div>
                      </div>

                      {/* Other Authorized Emails */}
                      {(vaultSettings.authorizedEmails || [])
                        .filter(e => e.toLowerCase() !== SUPER_ADMIN.toLowerCase())
                        .map((email) => (
                          <div key={email} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              <span className="font-mono text-slate-200">{email}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                                مصرح له بالاطلاع
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAuthorizedEmail(email)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                              title="سحب التصريح"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Secret PIN Configuration Card */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">رمز الحماية الإضافي السري (PIN Code)</h3>
                      <p className="text-xs text-slate-400">
                        يمكنك تعيين رمز سري يُطلب عند فتح الخزنة لمزيد من الخصوصية عند مشاركة الشاشة.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="اتركه فارغاً لإلغاء الرمز، أو اكتب رمزاً مثل 7788"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSavePin}
                      disabled={isSavingSettings}
                      className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      حفظ الرمز السري
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
