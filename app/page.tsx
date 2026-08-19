'use client';

import React, { useState, useEffect } from 'react';
import { Invoice, ProductCatalogItem, PaymentStatus } from '@/lib/types';
import { 
  getStoredInvoices, 
  saveStoredInvoices, 
  getStoredProducts, 
  saveStoredProducts, 
  resetToEmptyData,
  exportInvoicesToCSV 
} from '@/lib/storage';
import { 
  subscribeToInvoices, 
  subscribeToProducts, 
  saveInvoiceToFirestore, 
  deleteInvoiceFromFirestore, 
  saveProductsToFirestore,
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
import { FilePlus, Check, Package, Users, CheckCircle2, AlertCircle, RefreshCw, Database, UserCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

function InvoicesDashboard() {
  const { user, projectId } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>(() => getStoredInvoices());
  const [products, setProducts] = useState<ProductCatalogItem[]>(() => getStoredProducts());
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'local'>('synced');

  // Toast / Alert Notification State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Real-time Firestore sync
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

    return () => {
      unsubInvoices();
      unsubProducts();
    };
  }, [user]);

  // Filter State
  const [activeStatusFilter, setActiveStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID' | 'PARTIAL'>('ALL');

  // Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const [isCustomerLedgerOpen, setIsCustomerLedgerOpen] = useState(false);
  const [isProductCatalogOpen, setIsProductCatalogOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

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

  // Actions
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
      // Update
      const updated = invoices.map(i => i.id === savedInvoice.id ? savedInvoice : i);
      updateInvoices(updated);
    } else {
      // Create new
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
    if (window.confirm('هل أنت متأكد من تفريغ ومسح كافة الفواتير من النظام وقاعدة البيانات؟')) {
      for (const inv of invoices) {
        await deleteInvoiceFromFirestore(inv.id).catch(() => {});
      }
      resetToEmptyData();
      setInvoices([]);
      showToast('تم تفريغ كافة الفواتير بنجاح', 'info');
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
        onExportCSV={handleExportCSV}
        onClearData={handleClearAllData}
        invoicesCount={invoices.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Quick Header Banner */}
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
              لوحة إدارة الفواتير والمبيعات السحابية
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              متصلة سحابياً مع Firebase Firestore • مزامنة فورية ومستمرة بين أجهزتك • إصدار الفواتير وطباعة الإيصالات ومتابعة مديونيات العملاء بدقة.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 z-10 w-full md:w-auto">
            
            {/* Test Write to Firebase */}
            <button
              type="button"
              onClick={handleTestFirebaseConnection}
              disabled={testingFirebase}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/80 rounded-xl border border-emerald-800/70 shadow-xs transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              title="اختبار كتابة مستند تجريبي في Firestore للتحقق من الاتصال والصلاحيات"
            >
              <RefreshCw className={`w-4 h-4 ${testingFirebase ? 'animate-spin' : ''}`} />
              <span>{testingFirebase ? 'جارِ الاختبار...' : 'فحص الاتصال بـ Firebase'}</span>
            </button>

            {/* Team Management */}
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-teal-300 bg-teal-950/70 hover:bg-teal-900/80 rounded-xl border border-teal-800/70 shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <UserCheck className="w-4 h-4 text-teal-400" />
              <span>المدراء المصرح لهم</span>
            </button>

            <button
              onClick={() => setIsProductCatalogOpen(true)}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl border border-slate-700 shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Package className="w-4 h-4 text-emerald-400" />
              <span>دليل المنتجات</span>
            </button>

            <button
              onClick={() => setIsCustomerLedgerOpen(true)}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl border border-slate-700 shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Users className="w-4 h-4 text-teal-400" />
              <span>كشف الحسابات</span>
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

        {/* Stats KPIs Overview */}
        <StatsOverview
          invoices={invoices}
          onFilterStatus={setActiveStatusFilter}
          activeStatusFilter={activeStatusFilter}
        />

        {/* Invoices List Table & Filters */}
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

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>منظومة إدارة الفواتير والمبيعات وحسابات العملاء • متصل سحابياً</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Check className="w-3 h-3 text-emerald-600" />
              {syncStatus === 'synced' ? 'متزامن لحظياً مع Firestore' : syncStatus === 'syncing' ? 'جارِ المزامنة...' : 'يعمل محلياً'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="text-teal-700 hover:underline cursor-pointer"
            >
              المدراء المصرح لهم
            </button>
            <span>•</span>
            <button
              onClick={() => setIsCustomerLedgerOpen(true)}
              className="text-teal-700 hover:underline cursor-pointer"
            >
              كشف الحسابات
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
