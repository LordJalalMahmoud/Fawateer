'use client';

import React, { useState, useMemo, useRef } from 'react';
import { 
  Invoice, 
  ProductPricingTier, 
  VaultSettings, 
  InvoiceProfitBreakdown, 
  ItemProfitCalculation,
  CourierSettlement,
  CourierProfitBreakdown
} from '@/lib/types';
import { calculateInvoiceProfit, findPricingTier, calculateCourierSettlementProfit } from '@/lib/pricing-data';
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
  ReceiptText,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  ArrowUpRight,
  Truck,
  Package
} from 'lucide-react';

interface SecretProfitVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string | null;
  invoices: Invoice[];
  courierSettlements?: CourierSettlement[];
  pricingTiers: ProductPricingTier[];
  vaultSettings: VaultSettings;
  onSavePricingTiers: (tiers: ProductPricingTier[]) => Promise<void>;
  onSaveVaultSettings: (settings: VaultSettings) => Promise<void>;
  onOpenCourierModal?: () => void;
}

export function SecretProfitVaultModal({
  isOpen,
  onClose,
  currentUserEmail,
  invoices,
  courierSettlements = [],
  pricingTiers,
  vaultSettings,
  onSavePricingTiers,
  onSaveVaultSettings,
  onOpenCourierModal,
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

  // Active Tab: 'COLLECTED_PROFIT' | 'ALL_PROFIT' | 'COURIER_PROFIT' | 'COMPARISON' | 'PRICING_TIERS' | 'PERMISSIONS'
  const [activeTab, setActiveTab] = useState<'COLLECTED_PROFIT' | 'ALL_PROFIT' | 'COURIER_PROFIT' | 'COMPARISON' | 'PRICING_TIERS' | 'PERMISSIONS'>('COLLECTED_PROFIT');

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

  // Aggregate Totals - Invoiced (All Billed Invoices)
  const invoicedTotals = useMemo(() => {
    let merchantRevenue = 0;
    let companyCost = 0;
    let factoryCost = 0;
    let companyProfit = 0;
    let factoryToCompanyProfit = 0;
    let totalProfit = 0;
    let totalItemsCount = 0;
    let totalBilled = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    invoiceProfits.forEach(inv => {
      totalBilled += inv.totalAmount;
      totalPaid += inv.paidAmount;
      totalRemaining += inv.remainingAmount;

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
      totalBilled: Number(totalBilled.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      totalRemaining: Number(totalRemaining.toFixed(2)),
      companyProfitMargin: merchantRevenue > 0 ? Number(((companyProfit / merchantRevenue) * 100).toFixed(1)) : 0,
      totalProfitMargin: merchantRevenue > 0 ? Number(((totalProfit / merchantRevenue) * 100).toFixed(1)) : 0,
    };
  }, [invoiceProfits, productFilter]);

  // Aggregate Totals - Realized Cash Profits (Only Collected Money)
  const collectedTotals = useMemo(() => {
    let realizedMerchantRevenue = 0;
    let realizedCompanyCost = 0;
    let realizedFactoryCost = 0;
    let realizedCompanyProfit = 0;
    let realizedFactoryToCompanyProfit = 0;
    let realizedTotalProfit = 0;
    let pendingCompanyProfit = 0;
    let pendingFactoryProfit = 0;
    let pendingTotalProfit = 0;
    let collectedItemsCount = 0;

    let totalPaidCash = 0;
    let totalBilled = 0;
    let totalRemainingDebt = 0;
    let fullyPaidInvoicesCount = 0;
    let partialPaidInvoicesCount = 0;
    let unpaidInvoicesCount = 0;

    invoiceProfits.forEach(inv => {
      totalBilled += inv.totalAmount;
      totalPaidCash += inv.paidAmount;
      totalRemainingDebt += inv.remainingAmount;

      if (inv.remainingAmount <= 0.01 && inv.totalAmount > 0) {
        fullyPaidInvoicesCount++;
      } else if (inv.paidAmount > 0) {
        partialPaidInvoicesCount++;
      } else {
        unpaidInvoicesCount++;
      }

      inv.items.forEach(it => {
        if (productFilter !== 'ALL' && it.productName !== productFilter) {
          return;
        }
        realizedMerchantRevenue += it.realizedMerchantRevenue;
        realizedCompanyCost += it.realizedCompanyCost;
        realizedFactoryCost += it.realizedFactoryCost;
        realizedCompanyProfit += it.realizedCompanyProfit;
        realizedFactoryToCompanyProfit += it.realizedFactoryToCompanyProfit;
        realizedTotalProfit += it.realizedTotalProfit;

        pendingCompanyProfit += it.pendingCompanyProfit;
        pendingFactoryProfit += it.pendingFactoryProfit;
        pendingTotalProfit += it.pendingTotalProfit;
        collectedItemsCount += it.quantity * it.paidRatio;
      });
    });

    const collectionRate = totalBilled > 0 ? Number(((totalPaidCash / totalBilled) * 100).toFixed(1)) : 0;
    const companyProfitMargin = realizedMerchantRevenue > 0 ? Number(((realizedCompanyProfit / realizedMerchantRevenue) * 100).toFixed(1)) : 0;
    const totalProfitMargin = realizedMerchantRevenue > 0 ? Number(((realizedTotalProfit / realizedMerchantRevenue) * 100).toFixed(1)) : 0;

    return {
      realizedMerchantRevenue: Number(realizedMerchantRevenue.toFixed(2)),
      realizedCompanyCost: Number(realizedCompanyCost.toFixed(2)),
      realizedFactoryCost: Number(realizedFactoryCost.toFixed(2)),
      realizedCompanyProfit: Number(realizedCompanyProfit.toFixed(2)),
      realizedFactoryToCompanyProfit: Number(realizedFactoryToCompanyProfit.toFixed(2)),
      realizedTotalProfit: Number(realizedTotalProfit.toFixed(2)),
      pendingCompanyProfit: Number(pendingCompanyProfit.toFixed(2)),
      pendingFactoryProfit: Number(pendingFactoryProfit.toFixed(2)),
      pendingTotalProfit: Number(pendingTotalProfit.toFixed(2)),
      totalPaidCash: Number(totalPaidCash.toFixed(2)),
      totalBilled: Number(totalBilled.toFixed(2)),
      totalRemainingDebt: Number(totalRemainingDebt.toFixed(2)),
      collectedItemsCount: Number(collectedItemsCount.toFixed(1)),
      fullyPaidInvoicesCount,
      partialPaidInvoicesCount,
      unpaidInvoicesCount,
      collectionRate,
      companyProfitMargin,
      totalProfitMargin,
    };
  }, [invoiceProfits, productFilter]);

  // Group Invoiced Profit by Product (All Billed)
  const invoicedProductProfitSummary = useMemo(() => {
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

  // Group Realized Cash Profit by Product (Only Collected Money)
  const collectedProductProfitSummary = useMemo(() => {
    const map: Record<string, {
      productName: string;
      category: string;
      totalQuantity: number;
      collectedQuantity: number;
      factoryPrice: number;
      companyPrice: number;
      avgMerchantPrice: number;
      realizedMerchantRevenue: number;
      realizedCompanyProfit: number;
      realizedFactoryProfit: number;
      realizedTotalProfit: number;
      pendingTotalProfit: number;
    }> = {};

    invoiceProfits.forEach(inv => {
      inv.items.forEach(it => {
        const key = it.productName;
        if (!map[key]) {
          const tier = findPricingTier(it.productName, pricingTiers);
          map[key] = {
            productName: it.productName,
            category: tier?.category || 'عام',
            totalQuantity: 0,
            collectedQuantity: 0,
            factoryPrice: it.factoryUnitPrice,
            companyPrice: it.companyUnitPrice,
            avgMerchantPrice: 0,
            realizedMerchantRevenue: 0,
            realizedCompanyProfit: 0,
            realizedFactoryProfit: 0,
            realizedTotalProfit: 0,
            pendingTotalProfit: 0,
          };
        }
        map[key].totalQuantity += it.quantity;
        map[key].collectedQuantity += it.quantity * it.paidRatio;
        map[key].realizedMerchantRevenue += it.realizedMerchantRevenue;
        map[key].realizedCompanyProfit += it.realizedCompanyProfit;
        map[key].realizedFactoryProfit += it.realizedFactoryToCompanyProfit;
        map[key].realizedTotalProfit += it.realizedTotalProfit;
        map[key].pendingTotalProfit += it.pendingTotalProfit;
      });
    });

    return Object.values(map).map(p => ({
      ...p,
      collectedQuantity: Number(p.collectedQuantity.toFixed(1)),
      avgMerchantPrice: p.totalQuantity > 0 ? Number(((p.realizedMerchantRevenue + p.pendingTotalProfit) / p.totalQuantity).toFixed(2)) : 0,
      realizedMerchantRevenue: Number(p.realizedMerchantRevenue.toFixed(2)),
      realizedCompanyProfit: Number(p.realizedCompanyProfit.toFixed(2)),
      realizedFactoryProfit: Number(p.realizedFactoryProfit.toFixed(2)),
      realizedTotalProfit: Number(p.realizedTotalProfit.toFixed(2)),
      pendingTotalProfit: Number(p.pendingTotalProfit.toFixed(2)),
    })).sort((a, b) => b.realizedTotalProfit - a.realizedTotalProfit);
  }, [invoiceProfits, pricingTiers]);

  // Merchant Collection & Realized Profits Summary (Comparison Analysis)
  const merchantCollectionSummary = useMemo(() => {
    const map: Record<string, {
      customerName: string;
      invoiceCount: number;
      totalBilled: number;
      totalPaid: number;
      remainingDebt: number;
      realizedCompanyProfit: number;
      realizedFactoryProfit: number;
      realizedTotalProfit: number;
      pendingTotalProfit: number;
      paidRatio: number;
    }> = {};

    invoiceProfits.forEach(inv => {
      const key = inv.customerName || 'عميل غير محدد';
      if (!map[key]) {
        map[key] = {
          customerName: key,
          invoiceCount: 0,
          totalBilled: 0,
          totalPaid: 0,
          remainingDebt: 0,
          realizedCompanyProfit: 0,
          realizedFactoryProfit: 0,
          realizedTotalProfit: 0,
          pendingTotalProfit: 0,
          paidRatio: 0,
        };
      }
      map[key].invoiceCount += 1;
      map[key].totalBilled += inv.totalAmount;
      map[key].totalPaid += inv.paidAmount;
      map[key].remainingDebt += inv.remainingAmount;
      map[key].realizedCompanyProfit += inv.realizedCompanyProfit;
      map[key].realizedFactoryProfit += inv.realizedFactoryToCompanyProfit;
      map[key].realizedTotalProfit += inv.realizedTotalProfit;
      map[key].pendingTotalProfit += inv.pendingTotalProfit;
    });

    return Object.values(map).map(c => ({
      ...c,
      totalBilled: Number(c.totalBilled.toFixed(2)),
      totalPaid: Number(c.totalPaid.toFixed(2)),
      remainingDebt: Number(c.remainingDebt.toFixed(2)),
      realizedCompanyProfit: Number(c.realizedCompanyProfit.toFixed(2)),
      realizedFactoryProfit: Number(c.realizedFactoryProfit.toFixed(2)),
      realizedTotalProfit: Number(c.realizedTotalProfit.toFixed(2)),
      pendingTotalProfit: Number(c.pendingTotalProfit.toFixed(2)),
      paidRatio: c.totalBilled > 0 ? Number(((c.totalPaid / c.totalBilled) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.realizedTotalProfit - a.realizedTotalProfit);
  }, [invoiceProfits]);

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

  // Courier / Retail Profits Calculations in Secret Vault
  const courierProfitsList = useMemo<CourierProfitBreakdown[]>(() => {
    return (courierSettlements || []).map(s => calculateCourierSettlementProfit(s, pricingTiers));
  }, [courierSettlements, pricingTiers]);

  const courierTotalCollected = useMemo(() => courierProfitsList.reduce((sum, s) => sum + s.collectedCash, 0), [courierProfitsList]);
  const courierTotalRetailValue = useMemo(() => courierProfitsList.reduce((sum, s) => sum + s.totalRetailValue, 0), [courierProfitsList]);
  const courierTotalShippingFee = useMemo(() => courierProfitsList.reduce((sum, s) => sum + s.shippingFeeDeducted, 0), [courierProfitsList]);
  const courierTotalCompanyProfit = useMemo(() => courierProfitsList.reduce((sum, s) => sum + s.realizedCompanyProfit, 0), [courierProfitsList]);
  const courierTotalFactoryProfit = useMemo(() => courierProfitsList.reduce((sum, s) => sum + s.realizedFactoryProfit, 0), [courierProfitsList]);
  const courierTotalNetProfit = useMemo(() => courierProfitsList.reduce((sum, s) => sum + s.realizedTotalProfit, 0), [courierProfitsList]);

  // COMBINED BUSINESS METRICS (Wholesale Merchants + Retail Courier Collections)
  const combinedRealizedCompanyProfit = Number((collectedTotals.realizedCompanyProfit + courierTotalCompanyProfit).toFixed(2));
  const combinedRealizedFactoryProfit = Number((collectedTotals.realizedFactoryToCompanyProfit + courierTotalFactoryProfit).toFixed(2));
  const combinedRealizedTotalNetProfit = Number((collectedTotals.realizedTotalProfit + courierTotalNetProfit).toFixed(2));
  const combinedTotalCashCollected = Number((collectedTotals.realizedMerchantRevenue + courierTotalCollected).toFixed(2));

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
      id: `custom_${Date.now()}`,
      productName: 'صنف جديد',
      category: 'عام',
      factoryPrice: 100,
      companyPrice: 120,
      unit: 'كرتونة',
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

  // Export CSV for Realized Cash Profits (Only Collected)
  const handleExportCollectedCSV = () => {
    const headers = [
      'التاريخ',
      'رقم الفاتورة',
      'التاجر',
      'إجمالي الفاتورة',
      'المحصل كاش',
      'نسبة السداد %',
      'اسم المنتج',
      'الكمية المحصلة',
      'سعر المصنع',
      'سعر الشركة',
      'سعر التاجر',
      'ربح الشركة المحصل',
      'ربح المصنع المحصل',
      'إجمالي الربح المحصل كاش',
      'الأرباح المتبقية بالديون'
    ];

    const rows: any[] = [];
    invoiceProfits.forEach(inv => {
      inv.items.forEach(it => {
        if (productFilter !== 'ALL' && it.productName !== productFilter) return;
        rows.push([
          inv.date,
          inv.invoiceNumber,
          `"${inv.customerName.replace(/"/g, '""')}"`,
          inv.totalAmount,
          inv.paidAmount,
          `${(inv.paidRatio * 100).toFixed(0)}%`,
          `"${it.productName.replace(/"/g, '""')}"`,
          (it.quantity * it.paidRatio).toFixed(1),
          it.factoryUnitPrice,
          it.companyUnitPrice,
          it.merchantUnitPrice,
          it.realizedCompanyProfit,
          it.realizedFactoryToCompanyProfit,
          it.realizedTotalProfit,
          it.pendingTotalProfit,
        ]);
      });
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_الأرباح_المحصلة_كاش_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export CSV for Invoiced (All Billed)
  const handleExportInvoicedCSV = () => {
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
    link.setAttribute('download', `تقرير_إجمالي_الأرباح_الشامل_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl shadow-amber-500/10 text-slate-100 overflow-hidden animate-scale-in">
        
        {/* Top Secret Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-inner">
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
                تحليل هوامش وأرباح المصنع والشركة سواء على الفلوس المحصلة فعلياً أو الفواتير الصادرة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isVaultAccessible && (
              <div className="hidden md:flex items-center gap-1 bg-slate-800/80 px-3 py-1 rounded-full text-xs text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>مصرح لك: {currentUserEmail}</span>
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
            <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-6 bg-slate-950/50 no-print">
              <div className="flex items-center gap-1.5 overflow-x-auto py-2">
                
                {/* 1. Realized Cash Profits (NEW & PRIMARY) */}
                <button
                  onClick={() => setActiveTab('COLLECTED_PROFIT')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'COLLECTED_PROFIT'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>💵 أرباح الفلوس المحصلة (الكاش)</span>
                </button>

                {/* 2. All Invoiced Profits */}
                <button
                  onClick={() => setActiveTab('ALL_PROFIT')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'ALL_PROFIT'
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <ReceiptText className="w-4 h-4" />
                  <span>📑 أرباح إجمالي الفواتير الصادرة</span>
                </button>

                {/* 3. Comparison & Collection Health */}
                <button
                  onClick={() => setActiveTab('COMPARISON')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'COMPARISON'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>⚖️ مقارنة ونسب التحصيل والديون</span>
                </button>

                {/* 4. Courier & Retail Settlements Profit Tab */}
                <button
                  onClick={() => setActiveTab('COURIER_PROFIT')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'COURIER_PROFIT'
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20 font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Truck className="w-4 h-4 text-indigo-300" />
                  <span>🚚 أرباح تحصيلات الشحن والقطاعي ({courierProfitsList.length})</span>
                </button>

                {/* 5. Pricing Tiers */}
                <button
                  onClick={() => setActiveTab('PRICING_TIERS')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'PRICING_TIERS'
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Factory className="w-4 h-4" />
                  <span>جدول أسعار المصنع والشركة ({editableTiers.length})</span>
                </button>

                {/* 6. Permissions */}
                <button
                  onClick={() => setActiveTab('PERMISSIONS')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
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
                <div className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-lg animate-fade-in whitespace-nowrap">
                  {settingsFeedback}
                </div>
              )}
            </div>

            {/* TAB 1: REALIZED CASH PROFITS (ONLY COLLECTED MONEY) */}
            {activeTab === 'COLLECTED_PROFIT' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6" ref={printRef}>
                
                {/* Print Sheet Header */}
                <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4 text-slate-900">
                  <h1 className="text-xl font-black">تقرير الأرباح النقدية المحصلة فعلياً (الكاش الداخل)</h1>
                  <p className="text-xs text-slate-600 mt-1">
                    تاريخ الاستخراج: {new Date().toISOString().slice(0, 10)} | مستخرج بواسطة: {currentUserEmail}
                  </p>
                </div>

                {/* Realized Profit Explanation Header Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-600/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <span>الأرباح النقدية المحصلة فعلياً (الكاش في الجيب)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          REALIZED CASH PROFITS
                        </span>
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      هذا القسم يحسب الأرباح الفعلية فقط المقابلة للمبالغ التي قام التجار والعملاء بسدادها نقداً، مع استبعاد الديون المعلقة في السوق.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-800 text-xs shrink-0">
                    <div>
                      <span className="text-slate-400 block text-[10px]">إجمالي المقبوض كاش</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        {collectedTotals.totalPaidCash.toLocaleString()} ج.م
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-800"></div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">نسبة التحصيل</span>
                      <span className="text-sm font-bold text-teal-300 font-mono">
                        {collectedTotals.collectionRate}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* KPI Cards: The 4 Core Profit Calculations for Collected Money */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  
                  {/* 1. Company Realized Profit */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/40 shadow-lg shadow-emerald-950/40 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300">أرباح الشركة المحصلة كاش</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">
                      +{collectedTotals.realizedCompanyProfit.toLocaleString()} <span className="text-xs font-normal text-emerald-300">ج.م</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
                      <span>ربح الشركة من المبالغ المسددة</span>
                      <span className="font-semibold text-emerald-300">{collectedTotals.companyProfitMargin}% هامش</span>
                    </div>
                  </div>

                  {/* 2. Factory Realized Profit */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/80 to-slate-900 border border-cyan-500/40 shadow-lg shadow-cyan-950/40 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300">أرباح المصنع المحصلة كاش</span>
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Factory className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-cyan-400 mt-2 font-mono">
                      +{collectedTotals.realizedFactoryToCompanyProfit.toLocaleString()} <span className="text-xs font-normal text-cyan-300">ج.م</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5">
                      هامش المصنع من المبالغ المسددة
                    </div>
                  </div>

                  {/* 3. Combined Total Realized Profit */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/80 to-slate-900 border border-amber-500/50 shadow-lg shadow-amber-950/40 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">إجمالي الأرباح المحصلة في الجيب</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-amber-300 mt-2 font-mono">
                      +{collectedTotals.realizedTotalProfit.toLocaleString()} <span className="text-xs font-normal text-amber-200">ج.م</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
                      <span>صافي الربح الكلي المحصل نقداً</span>
                      <span className="font-semibold text-amber-300">{collectedTotals.totalProfitMargin}% هامش كلي</span>
                    </div>
                  </div>

                  {/* 4. Pending Profits & Market Debt */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300">الأرباح المعلقة بالديون</span>
                      <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-xl font-bold text-rose-400 mt-2 font-mono">
                      {collectedTotals.pendingTotalProfit.toLocaleString()} <span className="text-xs text-rose-300">ج.م معلقة</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                      <div>ديون التجار في السوق: <strong className="text-amber-300 font-mono">{collectedTotals.totalRemainingDebt.toLocaleString()} ج</strong></div>
                      <div>ربح شركة معلق: <strong className="text-slate-300 font-mono">{collectedTotals.pendingCompanyProfit.toLocaleString()} ج</strong></div>
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
                        dateFilter === 'ALL' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      كل الفترات
                    </button>
                    <button
                      onClick={() => setDateFilter('TODAY')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                        dateFilter === 'TODAY' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      اليوم
                    </button>
                    <button
                      onClick={() => setDateFilter('WEEK')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                        dateFilter === 'WEEK' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      آخر 7 أيام
                    </button>
                    <button
                      onClick={() => setDateFilter('MONTH')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                        dateFilter === 'MONTH' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      هذا الشهر
                    </button>
                    <button
                      onClick={() => setDateFilter('CUSTOM')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                        dateFilter === 'CUSTOM' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
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
                      onClick={handleExportCollectedCSV}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl cursor-pointer"
                      title="تصدير جدول الأرباح المحصلة كاش إلى Excel"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Excel (محصل)</span>
                    </button>

                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl cursor-pointer"
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

                {/* Breakdown by Product Table (Realized Cash Profits) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span>تحليل أرباح الأصناف من الفلوس المحصلة فعلياً</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      محسوب بناءً على نسبة سداد كل فاتورة
                    </span>
                  </div>

                  <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-xl bg-slate-950/40">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-3.5">اسم المنتج</th>
                          <th className="py-3 px-3 text-center">الكمية المسددة / الكلية</th>
                          <th className="py-3 px-3 text-left">سعر المصنع</th>
                          <th className="py-3 px-3 text-left">سعر الشركة</th>
                          <th className="py-3 px-3 text-left text-emerald-400">ربح الشركة المحصل كاش</th>
                          <th className="py-3 px-3 text-left text-cyan-400">ربح المصنع المحصل كاش</th>
                          <th className="py-3 px-3 text-left text-amber-300 font-black">صافي الربح المحصل فعلياً</th>
                          <th className="py-3 px-3 text-left text-rose-400">الربح المعلق بالديون</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {collectedProductProfitSummary.map((p) => {
                          const unitCompanyProfit = Number((p.avgMerchantPrice - p.companyPrice).toFixed(2));
                          const unitFactoryProfit = Number((p.companyPrice - p.factoryPrice).toFixed(2));

                          return (
                            <tr key={p.productName} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-2.5 px-3.5 font-bold text-white">
                                {p.productName}
                                <span className="block text-[10px] text-slate-400 font-normal">{p.category}</span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-200">
                                <span className="text-emerald-400">{p.collectedQuantity}</span>
                                <span className="text-slate-500"> / {p.totalQuantity} كرتونة</span>
                              </td>
                              <td className="py-2.5 px-3 text-left text-slate-300 font-mono">
                                {p.factoryPrice} ج
                              </td>
                              <td className="py-2.5 px-3 text-left text-slate-300 font-mono">
                                {p.companyPrice} ج
                              </td>
                              <td className="py-2.5 px-3 text-left font-bold text-emerald-400 font-mono">
                                +{p.realizedCompanyProfit.toLocaleString()} ج.م
                              </td>
                              <td className="py-2.5 px-3 text-left font-bold text-cyan-400 font-mono">
                                +{p.realizedFactoryProfit.toLocaleString()} ج.م
                              </td>
                              <td className="py-2.5 px-3 text-left font-black text-amber-300 text-sm font-mono">
                                +{p.realizedTotalProfit.toLocaleString()} ج.م
                              </td>
                              <td className="py-2.5 px-3 text-left font-semibold text-rose-400/80 font-mono">
                                {p.pendingTotalProfit > 0 ? `${p.pendingTotalProfit.toLocaleString()} ج.م` : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Detailed Invoices Ledger with Realized Profits */}
                <div className="space-y-2.5 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <ReceiptText className="w-4 h-4 text-emerald-400" />
                      <span>كشف الفواتير ومبالغ السداد وهوامش الأرباح المحصلة</span>
                    </h3>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {collectedTotals.fullyPaidInvoicesCount} مسددة بالكامل
                      </span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <Clock className="w-3.5 h-3.5" /> {collectedTotals.partialPaidInvoicesCount} سداد جزئي
                      </span>
                      <span className="flex items-center gap-1 text-rose-400">
                        <AlertCircle className="w-3.5 h-3.5" /> {collectedTotals.unpaidInvoicesCount} غير مسددة
                      </span>
                    </div>
                  </div>

                  <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-xl bg-slate-950/40">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-3 w-20">التاريخ</th>
                          <th className="py-3 px-3 w-24">رقم الفاتورة</th>
                          <th className="py-3 px-3">التاجر / العميل</th>
                          <th className="py-3 px-3 text-center">إجمالي الفاتورة</th>
                          <th className="py-3 px-3 text-center">المحصل كاش</th>
                          <th className="py-3 px-3 text-center">حالة السداد</th>
                          <th className="py-3 px-3 text-left text-emerald-400">ربح الشركة المحصل</th>
                          <th className="py-3 px-3 text-left text-cyan-400">ربح المصنع المحصل</th>
                          <th className="py-3 px-3 text-left text-amber-300 font-black">الربح المحصل كاش</th>
                          <th className="py-3 px-3 text-left text-rose-400">الربح المعلق</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {invoiceProfits.map((inv) => {
                          const isFullyPaid = inv.remainingAmount <= 0.01 && inv.totalAmount > 0;
                          const isUnpaid = inv.paidAmount <= 0.01;

                          return (
                            <tr key={inv.invoiceId} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">{inv.date}</td>
                              <td className="py-2.5 px-3 font-mono font-semibold text-slate-300 whitespace-nowrap">{inv.invoiceNumber}</td>
                              <td className="py-2.5 px-3 font-bold text-white">{inv.customerName}</td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-200">
                                {inv.totalAmount.toLocaleString()} ج.م
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-400">
                                {inv.paidAmount.toLocaleString()} ج.م
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {isFullyPaid ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    مسدد 100%
                                  </span>
                                ) : isUnpaid ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    غير مسدد 0%
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    سداد {Math.round(inv.paidRatio * 100)}%
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-left font-bold text-emerald-400 font-mono whitespace-nowrap">
                                +{inv.realizedCompanyProfit.toLocaleString()} ج.م
                              </td>
                              <td className="py-2.5 px-3 text-left font-bold text-cyan-400 font-mono whitespace-nowrap">
                                +{inv.realizedFactoryToCompanyProfit.toLocaleString()} ج.م
                              </td>
                              <td className="py-2.5 px-3 text-left font-black text-amber-300 font-mono whitespace-nowrap">
                                +{inv.realizedTotalProfit.toLocaleString()} ج.م
                              </td>
                              <td className="py-2.5 px-3 text-left font-semibold text-rose-400/80 font-mono whitespace-nowrap">
                                {inv.pendingTotalProfit > 0 ? `${inv.pendingTotalProfit.toLocaleString()} ج` : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: ALL INVOICED PROFITS (BILLED TOTALS) */}
            {activeTab === 'ALL_PROFIT' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6" ref={printRef}>
                
                {/* Print Sheet Header */}
                <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4 text-slate-900">
                  <h1 className="text-xl font-black">تقرير إجمالي الأرباح الشامل (لكافة الفواتير الصادرة)</h1>
                  <p className="text-xs text-slate-600 mt-1">
                    تاريخ الاستخراج: {new Date().toISOString().slice(0, 10)} | مستخرج بواسطة: {currentUserEmail}
                  </p>
                </div>

                {/* KPI Cards: The 4 Core Invoiced Profit Calculations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  
                  {/* 1. Company Profit from Merchants */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-700/40 shadow-lg shadow-emerald-950/30 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300">أرباح الشركة من التجار</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">
                      {invoicedTotals.companyProfit.toLocaleString()} <span className="text-xs font-normal text-emerald-300">ج.م</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
                      <span>الفرق (بيع التاجر - شراء الشركة)</span>
                      <span className="font-semibold text-emerald-300">{invoicedTotals.companyProfitMargin}% هامش</span>
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
                    <div className="text-2xl font-black text-cyan-400 mt-2 font-mono">
                      {invoicedTotals.factoryToCompanyProfit.toLocaleString()} <span className="text-xs font-normal text-cyan-300">ج.م</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5">
                      الفرق (سعر الشركة - سعر المصنع)
                    </div>
                  </div>

                  {/* 3. Combined Total Profit */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/70 to-slate-900 border border-amber-700/50 shadow-lg shadow-amber-950/40 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">إجمالي الأرباح الكلية (شامل)</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-amber-300 mt-2 font-mono">
                      {invoicedTotals.totalProfit.toLocaleString()} <span className="text-xs font-normal text-amber-200">ج.م</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
                      <span>الفرق (بيع التاجر - شراء المصنع)</span>
                      <span className="font-semibold text-amber-300">{invoicedTotals.totalProfitMargin}% هامش كلي</span>
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
                    <div className="text-xl font-bold text-white mt-2 font-mono">
                      {invoicedTotals.merchantRevenue.toLocaleString()} <span className="text-xs text-slate-400">ج.م مبيعات</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                      <div>تكلفة المصنع: <strong className="text-slate-300 font-mono">{invoicedTotals.factoryCost.toLocaleString()} ج</strong></div>
                      <div>تكلفة الشركة: <strong className="text-slate-300 font-mono">{invoicedTotals.companyCost.toLocaleString()} ج</strong></div>
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
                        dateFilter === 'ALL' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      كل الفترات
                    </button>
                    <button
                      onClick={() => setDateFilter('TODAY')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                        dateFilter === 'TODAY' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      اليوم
                    </button>
                    <button
                      onClick={() => setDateFilter('WEEK')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                        dateFilter === 'WEEK' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      آخر 7 أيام
                    </button>
                    <button
                      onClick={() => setDateFilter('MONTH')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                        dateFilter === 'MONTH' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      هذا الشهر
                    </button>
                    <button
                      onClick={() => setDateFilter('CUSTOM')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                        dateFilter === 'CUSTOM' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
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
                      onClick={handleExportInvoicedCSV}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl cursor-pointer"
                      title="تصدير جدول إجمالي الأرباح إلى Excel"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Excel (شامل)</span>
                    </button>

                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl cursor-pointer"
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

                {/* Breakdown by Product Table (All Invoiced) */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>تحليل هوامش وأرباح الأصناف والمنتجات المباعة (إجمالي الفواتير)</span>
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
                        {invoicedProductProfitSummary.map((p) => {
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
                              <td className="py-2.5 px-3 text-left font-bold text-emerald-400 font-mono">
                                +{p.companyProfit.toLocaleString()} ج.م
                                <span className="block text-[10px] text-emerald-400/70 font-normal">({unitCompanyProfit} ج/ك)</span>
                              </td>
                              <td className="py-2.5 px-3 text-left font-bold text-cyan-400 font-mono">
                                +{p.factoryProfit.toLocaleString()} ج.م
                                <span className="block text-[10px] text-cyan-400/70 font-normal">({unitFactoryProfit} ج/ك)</span>
                              </td>
                              <td className="py-2.5 px-3 text-left font-black text-amber-300 text-sm font-mono">
                                +{p.totalProfit.toLocaleString()} ج.م
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Detailed Invoices Ledger */}
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
                            <td className="py-2.5 px-3 text-left font-bold text-slate-200 font-mono whitespace-nowrap">
                              {inv.invoiceMerchantRevenue.toLocaleString()} ج.م
                            </td>
                            <td className="py-2.5 px-3 text-left font-bold text-emerald-400 font-mono whitespace-nowrap">
                              +{inv.invoiceCompanyProfit.toLocaleString()} ج.م
                            </td>
                            <td className="py-2.5 px-3 text-left font-bold text-cyan-400 font-mono whitespace-nowrap">
                              +{inv.invoiceFactoryToCompanyProfit.toLocaleString()} ج.م
                            </td>
                            <td className="py-2.5 px-3 text-left font-black text-amber-300 font-mono whitespace-nowrap">
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

            {/* TAB 3: COMPARISON & COLLECTION HEALTH */}
            {activeTab === 'COMPARISON' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                
                {/* Comparison Header */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900 border border-cyan-500/40 space-y-2">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    <span>مقارنة الأرباح الشاملة مقابل الأرباح النقدية المحصلة فعلياً</span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    يوضح هذا الجدول الفارق بين الأرباح المحسوبة على الورق (إجمالي الفواتير) وبين ما تم تحصيله كاش في الخزينة، وما تبقى في السوق كديون معلقة.
                  </p>
                </div>

                {/* Comparative Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Revenue Comparison */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-slate-300">مقارنة المبيعات والتحصيل</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">إجمالي الفواتير:</span>
                        <span className="font-bold text-white font-mono">{invoicedTotals.totalBilled.toLocaleString()} ج</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-400">المحصل فعلياً:</span>
                        <span className="font-bold text-emerald-400 font-mono">+{collectedTotals.totalPaidCash.toLocaleString()} ج</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-rose-400">الديون المتبقية:</span>
                        <span className="font-bold text-rose-400 font-mono">{collectedTotals.totalRemainingDebt.toLocaleString()} ج</span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="pt-1">
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                        <div 
                          className="h-full bg-emerald-400 transition-all duration-500"
                          style={{ width: `${Math.min(100, collectedTotals.collectionRate)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>نسبة التحصيل: {collectedTotals.collectionRate}%</span>
                        <span>متبقي: {(100 - collectedTotals.collectionRate).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Company Profit Comparison */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-emerald-300">أرباح الشركة (شامل vs محصل)</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">أرباح كل الفواتير:</span>
                        <span className="font-bold text-slate-200 font-mono">{invoicedTotals.companyProfit.toLocaleString()} ج</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-400">أرباح محصلة كاش:</span>
                        <span className="font-bold text-emerald-400 font-mono">+{collectedTotals.realizedCompanyProfit.toLocaleString()} ج</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-rose-400">أرباح معلقة بالديون:</span>
                        <span className="font-bold text-rose-400 font-mono">{collectedTotals.pendingCompanyProfit.toLocaleString()} ج</span>
                      </div>
                    </div>
                  </div>

                  {/* Total Net Profit Comparison */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-amber-300">إجمالي الأرباح الكلية (شامل vs محصل)</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">الربح الكلي للفواتير:</span>
                        <span className="font-bold text-slate-200 font-mono">{invoicedTotals.totalProfit.toLocaleString()} ج</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-amber-300">الربح المحصل في الجيب:</span>
                        <span className="font-bold text-amber-300 font-mono">+{collectedTotals.realizedTotalProfit.toLocaleString()} ج</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-rose-400">الربح المعلق في السوق:</span>
                        <span className="font-bold text-rose-400 font-mono">{collectedTotals.pendingTotalProfit.toLocaleString()} ج</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Merchant-by-Merchant Collection & Profit Breakdown */}
                <div className="space-y-2.5 pt-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>تحليل أرباح وسداد كل تاجر (المبالغ المحصلة مقابل الديون)</span>
                  </h3>

                  <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-xl bg-slate-950/40">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-3.5">اسم التاجر / العميل</th>
                          <th className="py-3 px-3 text-center">عدد الفواتير</th>
                          <th className="py-3 px-3 text-left">إجمالي المسحوبات</th>
                          <th className="py-3 px-3 text-left text-emerald-400">المسدد كاش</th>
                          <th className="py-3 px-3 text-left text-rose-400">المتبقي ديون</th>
                          <th className="py-3 px-3 text-center">نسبة السداد</th>
                          <th className="py-3 px-3 text-left text-emerald-400">ربح الشركة المحصل</th>
                          <th className="py-3 px-3 text-left text-amber-300 font-black">الربح الكلي المحصل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {merchantCollectionSummary.map((m) => (
                          <tr key={m.customerName} className="hover:bg-slate-900/60 transition-colors">
                            <td className="py-2.5 px-3.5 font-bold text-white">
                              {m.customerName}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-300 font-mono">
                              {m.invoiceCount}
                            </td>
                            <td className="py-2.5 px-3 text-left font-mono font-bold text-slate-200">
                              {m.totalBilled.toLocaleString()} ج
                            </td>
                            <td className="py-2.5 px-3 text-left font-mono font-bold text-emerald-400">
                              {m.totalPaid.toLocaleString()} ج
                            </td>
                            <td className="py-2.5 px-3 text-left font-mono font-bold text-rose-400">
                              {m.remainingDebt > 0 ? `${m.remainingDebt.toLocaleString()} ج` : '0 ج'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                m.paidRatio >= 99 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                m.paidRatio > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}>
                                {m.paidRatio}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-left font-mono font-bold text-emerald-400">
                              +{m.realizedCompanyProfit.toLocaleString()} ج.م
                            </td>
                            <td className="py-2.5 px-3 text-left font-mono font-black text-amber-300 text-sm">
                              +{m.realizedTotalProfit.toLocaleString()} ج.م
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB: COURIER & RETAIL SETTLEMENTS PROFIT */}
            {activeTab === 'COURIER_PROFIT' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-slate-900 border border-indigo-500/40">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Truck className="w-5 h-5 text-indigo-400" />
                      <span>أرباح تحصيلات شركات الشحن ومبيعات القطاعي</span>
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      حساب الأرباح الفعلية الناتجة عن مبيعات القطاعي عبر شركات الشحن (بوسطة، أوتو، شيب بلو...) بناءً على الكاش المستلم ومصاريف الشحن المخصومة.
                    </p>
                  </div>

                  {onOpenCourierModal && (
                    <button
                      onClick={onOpenCourierModal}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-indigo-400 hover:bg-indigo-300 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إدارة / إضافة تحصيل شحن</span>
                    </button>
                  )}
                </div>

                {/* KPI Cards for Courier Settlements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  
                  {/* Total Collected Cash from Couriers */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-500/40 shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300">إجمالي الكاش المحصل من الشحن</span>
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <Wallet className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-indigo-300 mt-2 font-mono">
                      {courierTotalCollected.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5">
                      قيمة المبيعات الإجمالية: {courierTotalRetailValue.toLocaleString()} ج.م
                    </div>
                  </div>

                  {/* Company Profit from Courier */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/40 shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300">صافي ربح الشركة (قطاعي)</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">
                      +{courierTotalCompanyProfit.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5">
                      بعد خصم الشحن {courierTotalShippingFee.toLocaleString()} ج.م
                    </div>
                  </div>

                  {/* Factory Profit from Courier */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/80 to-slate-900 border border-cyan-500/40 shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300">ربح المصنع من القطاعي</span>
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Factory className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-cyan-400 mt-2 font-mono">
                      +{courierTotalFactoryProfit.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5">
                      هامش المصنع من البضاعة المباعة
                    </div>
                  </div>

                  {/* Net Total Realized Profit in Pocket */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/80 to-slate-900 border border-amber-500/50 shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">إجمالي الأرباح في الجيب (شحن)</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-amber-300 mt-2 font-mono">
                      +{courierTotalNetProfit.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5">
                      الربح الكلي الصافي من مبيعات الشحن
                    </div>
                  </div>

                </div>

                {/* Grand Combined Business Overview */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-indigo-950/90 border border-emerald-500/50 space-y-3 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <h4 className="text-sm font-black text-white">🌟 إجمالي أرباح البيزنس الشامل (مبيعات الجملة + تحصيلات الشحن القطاعي)</h4>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                      محصل كاش في الخزينة
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block mb-1">إجمالي الكاش المحصل</span>
                      <span className="text-base font-black text-white font-mono">{combinedTotalCashCollected.toLocaleString()} ج.م</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block mb-1">أرباح الشركة المحصلة</span>
                      <span className="text-base font-black text-emerald-400 font-mono">+{combinedRealizedCompanyProfit.toLocaleString()} ج.م</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block mb-1">أرباح المصنع المحصلة</span>
                      <span className="text-base font-black text-cyan-400 font-mono">+{combinedRealizedFactoryProfit.toLocaleString()} ج.م</span>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/40">
                      <span className="text-[10px] text-amber-300 block mb-1 font-bold">صافي الأرباح الكلية (في الجيب)</span>
                      <span className="text-lg font-black text-amber-300 font-mono">+{combinedRealizedTotalNetProfit.toLocaleString()} ج.م</span>
                    </div>
                  </div>
                </div>

                {/* Settlements Breakdown Table */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-400" />
                    <span>سجل تسويات شركات الشحن المحسوبة</span>
                  </h4>

                  {courierProfitsList.length === 0 ? (
                    <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-950/40 space-y-3">
                      <Truck className="w-12 h-12 text-slate-600 mx-auto" />
                      <p className="text-sm text-slate-400 font-medium">لم يتم تسجيل أي تسويات لشركات الشحن حتى الآن</p>
                      {onOpenCourierModal && (
                        <button
                          onClick={onOpenCourierModal}
                          className="px-4 py-2 text-xs font-bold text-slate-900 bg-indigo-400 hover:bg-indigo-300 rounded-xl transition-colors cursor-pointer"
                        >
                          تسجيل أول تحصيل شحن
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-xl bg-slate-950/40">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-3 w-24">التاريخ</th>
                            <th className="py-3 px-3">شركة الشحن</th>
                            <th className="py-3 px-3">رقم التسويه</th>
                            <th className="py-3 px-3 text-left">قيمة البضاعة</th>
                            <th className="py-3 px-3 text-left text-indigo-300">المحصل كاش</th>
                            <th className="py-3 px-3 text-left text-rose-400">خصم الشحن</th>
                            <th className="py-3 px-3 text-left text-emerald-400">ربح الشركة</th>
                            <th className="py-3 px-3 text-left text-cyan-400">ربح المصنع</th>
                            <th className="py-3 px-3 text-left text-amber-300 font-black">صافي الربح الكلي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {courierProfitsList.map((s) => (
                            <tr key={s.settlementId} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">{s.date}</td>
                              <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">{s.courierName}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">{s.manifestNumber || '—'}</td>
                              <td className="py-2.5 px-3 text-left font-mono text-slate-300">{s.totalRetailValue.toLocaleString()} ج</td>
                              <td className="py-2.5 px-3 text-left font-mono font-bold text-indigo-300">{s.collectedCash.toLocaleString()} ج</td>
                              <td className="py-2.5 px-3 text-left font-mono text-rose-400">{s.shippingFeeDeducted > 0 ? `-${s.shippingFeeDeducted.toLocaleString()} ج` : '0 ج'}</td>
                              <td className="py-2.5 px-3 text-left font-mono font-bold text-emerald-400">+{s.realizedCompanyProfit.toLocaleString()} ج</td>
                              <td className="py-2.5 px-3 text-left font-mono font-bold text-cyan-400">+{s.realizedFactoryProfit.toLocaleString()} ج</td>
                              <td className="py-2.5 px-3 text-left font-mono font-black text-amber-300 text-sm">+{s.realizedTotalProfit.toLocaleString()} ج</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 5: PRICE TIERS CONFIGURATION */}
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
                                className="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-cyan-950/40 border border-cyan-700/50 rounded-lg text-cyan-300 font-bold text-center font-mono"
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
                                className="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-emerald-950/40 border border-emerald-700/50 rounded-lg text-emerald-300 font-bold text-center font-mono"
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
                            <td className="py-2 px-3 font-bold text-emerald-400 text-xs font-mono">
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

            {/* TAB 5: PERMISSIONS & VAULT SECURITY */}
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
