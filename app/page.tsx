'use client';

import React, { useState, useEffect } from 'react';
import { Invoice, ProductCatalogItem, PaymentStatus, ProductPricingTier, VaultSettings } from '@/lib/types';
import { 
  getStoredInvoices, 
  saveStoredInvoices, 
  getStoredProducts, 
  saveStoredProducts, 
  getStoredPricingTiers,
  saveStoredPricingTiers,
  getStoredVaultSettings,
  saveStoredVaultSettings,
  resetToEmptyData,
  exportInvoicesToCSV 
} from '@/lib/storage';
import { 
  subscribeToInvoices, 
  subscribeToProducts, 
  subscribeToPricingTiers,
  subscribeToVaultSettings,
  saveInvoiceToFirestore, 
  deleteInvoiceFromFirestore, 
  saveProductsToFirestore,
  savePricingTiersToFirestore,
  saveVaultSettingsToFirestore,
  testFirestoreDirectWrite
} from '@/lib/firestore-service';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { AuthGate } from '@/components/AuthGate';
import { Navbar } from '@/components/Navbar';
import { StatsOverview } from '@/components/StatsOverview';
import { InvoiceList } from '@/components/InvoiceList';
import { InvoiceModal } from '@/components/InvoiceModal';
import { InvoiceViewModal } from '@/components/InvoiceViewModal';
import { CustomerLedgerModal } from '@/components/CustomerLedgerModal';
import { ProductCatalogModal } from '@/components/ProductCatalogModal';
import { TeamManagementModal } from '@/components/TeamManagementModal';
import { PaymentDrawer } from '@/components/PaymentDrawer';
import { MerchantAccountsView } from '@/components/MerchantAccountsView';
import { MerchantStatementModal } from '@/components/MerchantStatementModal';
import { AddMerchantGoodsModal } from '@/components/AddMerchantGoodsModal';
import { AddMerchantPaymentModal } from '@/components/AddMerchantPaymentModal';
import { NewMerchantModal } from '@/components/NewMerchantModal';
import { SecretProfitVaultModal } from '@/components/SecretProfitVaultModal';
import { 
  FilePlus, 
  Check, 
  Package, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Database, 
  UserCheck,
  Building2,
  Receipt,
  UserPlus,
  Lock,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

function InvoicesDashboard() {
  const { user, projectId } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>(() => getStoredInvoices());
  const [products, setProducts] = useState<ProductCatalogItem[]>(() => getStoredProducts());
  const [pricingTiers, setPricingTiers] = useState<ProductPricingTier[]>(() => getStoredPricingTiers());
  const [vaultSettings, setVaultSettings] = useState<VaultSettings>(() => getStoredVaultSettings());
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'local'>('synced');

  // Main Dashboard View Mode: 'MERCHANTS' (حسابات التجار) vs 'INVOICES' (سجل الفواتير)
  const [mainView, setMainView] = useState<'MERCHANTS' | 'INVOICES'>('MERCHANTS');

  // Toast / Alert Notification State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Real-time Firestore sync for all collections
  useEffect(() => {
    if (!user) return;

    const unsubInvoices = subscribeToInvoices(
      (remoteInvoices) => {
        setInvoices(remoteInvoices || []);
        saveStoredInvoices(remoteInvoices || []);
        setSyncStatus('synced');
      },
      (err) => {
        console.warn('Invoices sync issue:', err);
        setSyncStatus('local');
      }
    );

    const unsubProducts = subscribeToProducts(
      (remoteProducts) => {
        setProducts(remoteProducts || []);
        saveStoredProducts(remoteProducts || []);
      },
      (err) => {
        console.warn('Products sync issue:', err);
        setSyncStatus('local');
      }
    );

    const unsubPricing = subscribeToPricingTiers(
      (remoteTiers) => {
        if (remoteTiers && remoteTiers.length > 0) {
          setPricingTiers(remoteTiers);
          saveStoredPricingTiers(remoteTiers);
        }
      },
      (err) => {
        console.warn('Pricing tiers sync issue:', err);
      }
    );

    const unsubVault = subscribeToVaultSettings(
      (remoteVault) => {
        if (remoteVault) {
          setVaultSettings(remoteVault);
          saveStoredVaultSettings(remoteVault);
        }
      },
      (err) => {
        console.warn('Vault settings sync issue:', err);
      }
    );

    return () => {
      unsubInvoices();
      unsubProducts();
      unsubPricing();
      unsubVault();
    };
  }, [user]);

  // Filter State for Invoices tab
  const [activeStatusFilter, setActiveStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID' | 'PARTIAL'>('ALL');

  // Standard Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const [isCustomerLedgerOpen, setIsCustomerLedgerOpen] = useState(false);
  const [isProductCatalogOpen, setIsProductCatalogOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  // Dedicated Merchant Accounts Modals
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementMerchant, setStatementMerchant] = useState<string>('');

  const [isAddGoodsModalOpen, setIsAddGoodsModalOpen] = useState(false);
  const [goodsMerchant, setGoodsMerchant] = useState<{ name: string; phone?: string; address?: string }>({ name: '' });

  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [paymentMerchantData, setPaymentMerchantData] = useState<{ name: string; debt: number }>({ name: '', debt: 0 });

  const [isNewMerchantModalOpen, setIsNewMerchantModalOpen] = useState(false);

  // VIP Secret Profit Vault Modal
  const [isSecretVaultOpen, setIsSecretVaultOpen] = useState(false);

  const [testingFirebase, setTestingFirebase] = useState(false);

  // Synchronous local + asynchronous Firestore update
  const updateInvoices = (newInvoices: Invoice[]) => {
    setInvoices(newInvoices);
    saveStoredInvoices(newInvoices);
  };

  const updateProducts = async (newProducts: ProductCatalogItem[]) => {
    setProducts(newProducts);
    saveStoredProducts(newProducts);
    try {
      await saveProductsToFirestore(newProducts);
      showToast('تم حفظ وتحديث قائمة المنتجات في Firebase بنجاح', 'success');
    } catch (e: any) {
      console.warn('Firestore product update error, saved locally:', e);
      showToast(`تنبيه: حُفظت المنتجات محلياً فقط (${e?.message || 'تعذر الاتصال بـ Firebase'})`, 'error');
    }
  };

  const handleSavePricingTiers = async (newTiers: ProductPricingTier[]) => {
    setPricingTiers(newTiers);
    saveStoredPricingTiers(newTiers);
    try {
      await savePricingTiersToFirestore(newTiers);
      showToast('تم حفظ وتحديث جدول أسعار المصنع والشركة سحابياً في Firebase', 'success');
    } catch (e: any) {
      console.warn('Firestore pricing tiers error:', e);
      showToast(`تنبيه: حُفظت الأسعار محلياً (${e?.message || 'خطأ اتصال'})`, 'error');
    }
  };

  const handleSaveVaultSettings = async (newSettings: VaultSettings) => {
    setVaultSettings(newSettings);
    saveStoredVaultSettings(newSettings);
    try {
      await saveVaultSettingsToFirestore(newSettings);
      showToast('تم تحديث إعدادات وصلاحيات الخزنة السرية في Firebase', 'success');
    } catch (e: any) {
      console.warn('Firestore vault settings error:', e);
      showToast(`تنبيه: حُفظت إعدادات الخزنة محلياً (${e?.message || 'خطأ اتصال'})`, 'error');
    }
  };

  // Actions: Invoice
  const handleNewInvoice = () => {
    setEditingInvoice(null);
    setIsInvoiceModalOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsInvoiceModalOpen(true);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handleDuplicateInvoice = async (invoice: Invoice) => {
    const currentYear = new Date().getFullYear();
    const nextNum = invoices.length + 1;
    const duplicated: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${currentYear}-${String(nextNum).padStart(3, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      paidAmount: 0,
      remainingAmount: invoice.totalAmount,
      status: 'UNPAID',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...invoices];
    updateInvoices(updated);
    try {
      await saveInvoiceToFirestore(duplicated);
      showToast(`تم تكرار الفاتورة وحفظها في Firebase (${duplicated.invoiceNumber})`, 'success');
    } catch (e: any) {
      console.warn('Firestore duplicate save error:', e);
      showToast(`حفظت الفاتورة محلياً (${e?.message || 'خطأ اتصال'})`, 'error');
    }
    setViewingInvoice(duplicated);
    setIsViewModalOpen(true);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const updated = invoices.filter(i => i.id !== invoiceId);
    updateInvoices(updated);
    try {
      await deleteInvoiceFromFirestore(invoiceId);
      showToast('تم حذف الفاتورة بنجاح من قاعدة البيانات', 'info');
    } catch (e: any) {
      console.warn('Firestore delete error:', e);
      showToast('حذفت الفاتورة محلياً', 'info');
    }
  };

  const handleSaveInvoice = async (savedInvoice: Invoice) => {
    if (editingInvoice) {
      const updated = invoices.map(i => i.id === savedInvoice.id ? savedInvoice : i);
      updateInvoices(updated);
    } else {
      const updated = [savedInvoice, ...invoices];
      updateInvoices(updated);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    }
    
    try {
      await saveInvoiceToFirestore(savedInvoice);
      showToast(`تم حفظ الفاتورة (${savedInvoice.invoiceNumber}) بنجاح في Firebase Firestore!`, 'success');
    } catch (e: any) {
      console.error('Firestore invoice save error:', e);
      showToast(`تنبيه: تم الحفظ في المتصفح فقط. تفاصيل خطأ Firebase: ${e?.message || e}`, 'error');
    }

    setIsInvoiceModalOpen(false);
    setEditingInvoice(null);
  };

  // Merchant Account Actions
  const handleOpenStatement = (merchantName: string) => {
    setStatementMerchant(merchantName);
    setIsStatementModalOpen(true);
  };

  const handleOpenAddGoods = (merchantName: string, phone?: string, address?: string) => {
    setGoodsMerchant({ name: merchantName, phone, address });
    setIsAddGoodsModalOpen(true);
  };

  const handleOpenAddPayment = (merchantName: string, debt: number) => {
    setPaymentMerchantData({ name: merchantName, debt });
    setIsAddPaymentModalOpen(true);
  };

  const handleSaveDeliveryBatch = async (newDeliveryInvoice: Invoice) => {
    const updated = [newDeliveryInvoice, ...invoices];
    updateInvoices(updated);
    confetti({ particleCount: 35, spread: 45, origin: { y: 0.7 } });

    try {
      await saveInvoiceToFirestore(newDeliveryInvoice);
      showToast(`تم إضافة المسحوبات لحساب التاجر (${newDeliveryInvoice.customerName}) في Firebase`, 'success');
    } catch (e: any) {
      showToast(`تمت الإضافة محلياً: ${e?.message || e}`, 'error');
    }
  };

  const handleApplyMerchantPayment = async ({
    merchantName,
    amount,
    date,
    method,
    notes,
  }: {
    merchantName: string;
    amount: number;
    date: string;
    method: string;
    notes: string;
  }) => {
    let remainingToPay = amount;
    const merchantInvoices = invoices
      .filter(i => (i.customerName || '').trim().toLowerCase() === merchantName.trim().toLowerCase())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Oldest first

    const modifiedInvoices: Invoice[] = [];

    // Distribute payment across unpaid invoices
    for (const inv of merchantInvoices) {
      if (remainingToPay <= 0) break;
      const debtOnInv = Number(inv.remainingAmount || (inv.totalAmount - (inv.paidAmount || 0)));
      if (debtOnInv > 0) {
        const payForThis = Math.min(debtOnInv, remainingToPay);
        const newPaid = Number(((inv.paidAmount || 0) + payForThis).toFixed(2));
        const newRemaining = Math.max(0, Number(((inv.totalAmount || 0) - newPaid).toFixed(2)));
        const newStatus: PaymentStatus = newRemaining <= 0.01 ? 'PAID' : 'PARTIAL';

        const updatedInv: Invoice = {
          ...inv,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newStatus,
          notes: inv.notes ? `${inv.notes} | دفعة (${method}) ${payForThis}ج` : `دفعة (${method}) ${payForThis}ج`,
          updatedAt: new Date().toISOString(),
        };

        modifiedInvoices.push(updatedInv);
        remainingToPay -= payForThis;
      }
    }

    // Update state
    if (modifiedInvoices.length > 0) {
      const updatedAll = invoices.map(inv => {
        const found = modifiedInvoices.find(m => m.id === inv.id);
        return found ? found : inv;
      });
      updateInvoices(updatedAll);

      // Push to Firestore
      for (const m of modifiedInvoices) {
        await saveInvoiceToFirestore(m).catch(() => {});
      }
      showToast(`تم تسجيل دفعة بقيمة ${amount.toLocaleString()} ج.م لحساب التاجر (${merchantName}) بنجاح!`, 'success');
      confetti({ particleCount: 30, spread: 40 });
    } else {
      // If merchant had no unpaid invoices, save as credit adjustment delivery
      const receiptInvoice: Invoice = {
        id: `pay-${Date.now()}`,
        invoiceNumber: `PAY-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
        date,
        customerName: merchantName,
        items: [{ id: 'it-pay', name: `تحصيل دفعة نقدية (${method})`, quantity: 1, unit: 'إيصال', unitPrice: 0, total: 0 }],
        subtotal: 0,
        taxRate: 0,
        taxAmount: 0,
        discount: 0,
        totalAmount: 0,
        paidAmount: amount,
        remainingAmount: 0,
        status: 'PAID',
        notes: notes ? `${notes} | طريقة الدفع: ${method}` : `سداد دفعة نقدية: ${method}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedAll = [receiptInvoice, ...invoices];
      updateInvoices(updatedAll);
      await saveInvoiceToFirestore(receiptInvoice).catch(() => {});
      showToast(`تم تسجيل إيصال التحصيل لحساب التاجر (${merchantName})`, 'success');
    }
  };

  const handleAddNewMerchant = async ({
    name,
    phone,
    address,
    openingDebt,
  }: {
    name: string;
    phone: string;
    address: string;
    openingDebt: number;
  }) => {
    const currentYear = new Date().getFullYear();
    const nextNum = invoices.length + 1;
    const nowIso = new Date().toISOString();

    const openingInvoice: Invoice = {
      id: `m-init-${Date.now()}`,
      invoiceNumber: `INV-${currentYear}-${String(nextNum).padStart(3, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      customerName: name,
      customerPhone: phone,
      customerAddress: address,
      items: [
        {
          id: 'init-1',
          name: openingDebt > 0 ? 'رصيد افتتاحي / مديونية سابقة' : 'فتح حساب تاجر جديد',
          quantity: 1,
          unit: 'حساب',
          unitPrice: openingDebt,
          total: openingDebt,
        },
      ],
      subtotal: openingDebt,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      totalAmount: openingDebt,
      paidAmount: 0,
      remainingAmount: openingDebt,
      status: openingDebt > 0 ? 'UNPAID' : 'PAID',
      notes: 'تم فتح حساب التاجر وتوثيقه بالمنظومة',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const updated = [openingInvoice, ...invoices];
    updateInvoices(updated);
    confetti({ particleCount: 40, spread: 50 });

    try {
      await saveInvoiceToFirestore(openingInvoice);
      showToast(`تم إنشاء وتوثيق حساب التاجر (${name}) في Firebase`, 'success');
    } catch (e: any) {
      showToast(`تم الحفظ محلياً: ${e?.message || e}`, 'error');
    }
  };

  const handleQuickPay = (invoice: Invoice) => {
    setPaymentInvoice(invoice);
    setIsPaymentDrawerOpen(true);
  };

  const handleUpdatePayment = async (invoiceId: string, newPaidAmount: number, notes?: string) => {
    let updatedInvoice: Invoice | null = null;
    const updated = invoices.map(inv => {
      if (inv.id === invoiceId) {
        const total = inv.totalAmount || 0;
        const paid = Math.min(newPaidAmount, total);
        const remaining = Math.max(0, Number((total - paid).toFixed(2)));
        let status: PaymentStatus = 'UNPAID';
        if (remaining <= 0.01) {
          status = 'PAID';
        } else if (paid > 0) {
          status = 'PARTIAL';
        }

        updatedInvoice = {
          ...inv,
          paidAmount: paid,
          remainingAmount: remaining,
          status,
          notes: notes || inv.notes,
          updatedAt: new Date().toISOString(),
        };
        return updatedInvoice;
      }
      return inv;
    });

    updateInvoices(updated);

    if (updatedInvoice) {
      try {
        await saveInvoiceToFirestore(updatedInvoice);
        showToast('تم تسجيل الدفعة وتحديث الفاتورة في Firebase سحابياً', 'success');
      } catch (e: any) {
        console.warn('Firestore payment update error:', e);
        showToast('تم تسجيل الدفعة محلياً', 'info');
      }
    }
  };

  const handleClearAllData = async () => {
    if (window.confirm('هل أنت متأكد من تفريغ ومسح كافة البيانات من النظام وقاعدة البيانات؟')) {
      for (const inv of invoices) {
        await deleteInvoiceFromFirestore(inv.id).catch(() => {});
      }
      resetToEmptyData();
      setInvoices([]);
      showToast('تم تفريغ كافة البيانات بنجاح', 'info');
    }
  };

  const handleExportCSV = () => {
    exportInvoicesToCSV(invoices);
  };

  const handleTestFirebaseConnection = async () => {
    setTestingFirebase(true);
    try {
      const res = await testFirestoreDirectWrite();
      if (res.success) {
        showToast(`✅ ${res.message} (مشروع: ${projectId})`, 'success');
      } else {
        showToast(`❌ ${res.message}: ${res.error}`, 'error');
      }
    } catch (e: any) {
      showToast(`❌ خطأ اختبار الاتصال: ${e?.message || e}`, 'error');
    } finally {
      setTestingFirebase(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-300 max-w-lg w-[90%] sm:w-auto">
          <div className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-semibold ${
            toast.type === 'success' 
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700 shadow-emerald-950/40' 
              : toast.type === 'error'
              ? 'bg-rose-900 text-rose-100 border-rose-700 shadow-rose-950/40'
              : 'bg-slate-900 text-slate-100 border-slate-700 shadow-slate-950/40'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Database className="w-5 h-5 text-teal-400 shrink-0" />}
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer px-1 py-0.5"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onNewInvoice={handleNewInvoice}
        onOpenCustomerLedger={() => setIsCustomerLedgerOpen(true)}
        onOpenCatalog={() => setIsProductCatalogOpen(true)}
        onOpenTeamManagement={() => setIsTeamModalOpen(true)}
        onOpenSecretVault={() => setIsSecretVaultOpen(true)}
        onExportCSV={handleExportCSV}
        onClearData={handleClearAllData}
        invoicesCount={invoices.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Quick Header Banner with View Tabs */}
        <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 sm:p-7 text-white shadow-lg shadow-slate-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print relative overflow-hidden">
          
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-800/80 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>مشروع Firebase النشط: <strong className="font-mono text-white">{projectId}</strong></span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              منظومة حسابات التجار والفواتير السحابية
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              إدارة الحسابات الجارية لكل تاجر، تسجيل مسحوبات البضاعة والدفعات، وإصدار كشوف الحساب والفواتير المجمعة بنقرة واحدة.
            </p>
          </div>

          {/* Quick Actions & Header Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 z-10 w-full md:w-auto">
            
            {/* Secret Vault Shortcut Button */}
            <button
              onClick={() => setIsSecretVaultOpen(true)}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-black text-slate-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-xl shadow-md shadow-amber-400/20 transition-all cursor-pointer whitespace-nowrap"
              title="خزنة وهوامش الأرباح السرية بين أسعار المصنع والشركة والتجار"
            >
              <Lock className="w-4 h-4" />
              <span>خزنة الأرباح السرية</span>
            </button>

            <button
              onClick={() => setIsNewMerchantModalOpen(true)}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-md shadow-teal-600/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ فتح حساب تاجر</span>
            </button>

            <button
              onClick={handleNewInvoice}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <FilePlus className="w-4 h-4" />
              <span>فاتورة جديدة</span>
            </button>
          </div>

        </div>

        {/* View Mode Switcher (حسابات التجار vs سجل الفواتير) */}
        <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs no-print">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setMainView('MERCHANTS')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                mainView === 'MERCHANTS'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>حسابات التجار والعملاء (كشف الحساب الجاري)</span>
            </button>

            <button
              onClick={() => setMainView('INVOICES')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                mainView === 'INVOICES'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-4 h-4 text-teal-400" />
              <span>سجل الفواتير العامة ({invoices.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 pl-3">
            <button
              onClick={handleTestFirebaseConnection}
              disabled={testingFirebase}
              className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingFirebase ? 'animate-spin' : ''}`} />
              <span>فحص الاتصال</span>
            </button>
          </div>
        </div>

        {/* Dynamic View Content */}
        {mainView === 'MERCHANTS' ? (
          /* VIEW 1: Merchant Accounts Hub */
          <MerchantAccountsView
            invoices={invoices}
            productCatalog={products}
            onOpenNewMerchant={() => setIsNewMerchantModalOpen(true)}
            onOpenAddGoods={handleOpenAddGoods}
            onOpenAddPayment={handleOpenAddPayment}
            onOpenStatement={handleOpenStatement}
          />
        ) : (
          /* VIEW 2: Invoices Timeline & KPIs */
          <div className="space-y-6">
            <StatsOverview
              invoices={invoices}
              onFilterStatus={setActiveStatusFilter}
              activeStatusFilter={activeStatusFilter}
            />

            <InvoiceList
              invoices={invoices}
              onViewInvoice={handleViewInvoice}
              onEditInvoice={handleEditInvoice}
              onDuplicateInvoice={handleDuplicateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onQuickPay={handleQuickPay}
              activeStatusFilter={activeStatusFilter}
              onStatusFilterChange={setActiveStatusFilter}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>منظومة إدارة حسابات التجار ومبيعات المنظفات • متصل سحابياً</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Check className="w-3 h-3 text-emerald-600" />
              {syncStatus === 'synced' ? 'متزامن لحظياً مع Firestore' : syncStatus === 'syncing' ? 'جارِ المزامنة...' : 'يعمل محلياً'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSecretVaultOpen(true)}
              className="text-amber-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              <span>خزنة الأرباح</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="text-teal-700 hover:underline cursor-pointer"
            >
              المدراء المصرح لهم
            </button>
            <span>•</span>
            <button
              onClick={() => setIsProductCatalogOpen(true)}
              className="text-slate-700 hover:underline cursor-pointer"
            >
              دليل الأسعار
            </button>
            <span>•</span>
            <button
              onClick={handleExportCSV}
              className="text-slate-700 hover:underline cursor-pointer"
            >
              تصدير البيانات
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Create/Edit Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setEditingInvoice(null);
        }}
        onSave={handleSaveInvoice}
        initialInvoice={editingInvoice}
        existingInvoices={invoices}
        productCatalog={products}
      />

      {/* 2. Official Printable Invoice View Modal */}
      <InvoiceViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingInvoice(null);
        }}
        invoice={viewingInvoice}
        onEditInvoice={handleEditInvoice}
      />

      {/* 3. Customer Accounts & Balances Ledger Modal */}
      <CustomerLedgerModal
        isOpen={isCustomerLedgerOpen}
        onClose={() => setIsCustomerLedgerOpen(false)}
        invoices={invoices}
        onViewInvoice={handleViewInvoice}
      />

      {/* 4. Product & Price Catalog Modal */}
      <ProductCatalogModal
        isOpen={isProductCatalogOpen}
        onClose={() => setIsProductCatalogOpen(false)}
        products={products}
        onSaveProducts={updateProducts}
      />

      {/* 5. Team / Admins Management Modal */}
      <TeamManagementModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />

      {/* 6. Quick Payment Collection Drawer */}
      <PaymentDrawer
        isOpen={isPaymentDrawerOpen}
        onClose={() => {
          setIsPaymentDrawerOpen(false);
          setPaymentInvoice(null);
        }}
        invoice={paymentInvoice}
        onUpdatePayment={handleUpdatePayment}
      />

      {/* 7. Dedicated Merchant Statement & Consolidated Invoice Modal */}
      <MerchantStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => {
          setIsStatementModalOpen(false);
          setStatementMerchant('');
        }}
        merchantName={statementMerchant}
        invoices={invoices}
      />

      {/* 8. Add Goods Delivery to Merchant Modal */}
      <AddMerchantGoodsModal
        isOpen={isAddGoodsModalOpen}
        onClose={() => {
          setIsAddGoodsModalOpen(false);
          setGoodsMerchant({ name: '' });
        }}
        merchantName={goodsMerchant.name}
        defaultPhone={goodsMerchant.phone}
        defaultAddress={goodsMerchant.address}
        existingInvoices={invoices}
        productCatalog={products}
        onSaveDelivery={handleSaveDeliveryBatch}
      />

      {/* 9. Record Payment from Merchant Modal */}
      <AddMerchantPaymentModal
        isOpen={isAddPaymentModalOpen}
        onClose={() => {
          setIsAddPaymentModalOpen(false);
          setPaymentMerchantData({ name: '', debt: 0 });
        }}
        merchantName={paymentMerchantData.name}
        merchantRemainingDebt={paymentMerchantData.debt}
        invoices={invoices}
        onApplyPayment={handleApplyMerchantPayment}
      />

      {/* 10. Open New Merchant Account Modal */}
      <NewMerchantModal
        isOpen={isNewMerchantModalOpen}
        onClose={() => setIsNewMerchantModalOpen(false)}
        onAddMerchant={handleAddNewMerchant}
      />

      {/* 11. Secret VIP Profit Vault Modal */}
      <SecretProfitVaultModal
        isOpen={isSecretVaultOpen}
        onClose={() => setIsSecretVaultOpen(false)}
        currentUserEmail={user?.email}
        invoices={invoices}
        pricingTiers={pricingTiers}
        vaultSettings={vaultSettings}
        onSavePricingTiers={handleSavePricingTiers}
        onSaveVaultSettings={handleSaveVaultSettings}
      />

    </div>
  );
}

export default function HomePage() {
  return (
    <AuthProvider>
      <AuthGate>
        <InvoicesDashboard />
      </AuthGate>
    </AuthProvider>
  );
}
