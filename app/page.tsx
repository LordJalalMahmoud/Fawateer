'use client';

import React, { useState, useEffect } from 'react';
import { Invoice, ProductCatalogItem, PaymentStatus } from '@/lib/types';
import { 
  getStoredInvoices, 
  saveStoredInvoices, 
  getStoredProducts, 
  saveStoredProducts, 
  resetToSampleData,
  exportInvoicesToCSV 
} from '@/lib/storage';
import { 
  subscribeToInvoices, 
  subscribeToProducts, 
  saveInvoiceToFirestore, 
  deleteInvoiceFromFirestore, 
  saveProductsToFirestore 
} from '@/lib/firestore-service';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { AuthGate } from '@/components/AuthGate';
import { Navbar } from '@/components/Navbar';
import { StatsOverview } from '@/components/StatsOverview';
import { InvoiceList } from '@/components/InvoiceList';
import { InvoiceModal } from '@/components/InvoiceModal';
import { InvoiceViewModal } from '@/components/InvoiceViewModal';
import { SmartTextImportModal } from '@/components/SmartTextImportModal';
import { CustomerLedgerModal } from '@/components/CustomerLedgerModal';
import { ProductCatalogModal } from '@/components/ProductCatalogModal';
import { PaymentDrawer } from '@/components/PaymentDrawer';
import { Sparkles, FilePlus, Cloud, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

function InvoicesDashboard() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>(() => getStoredInvoices());
  const [products, setProducts] = useState<ProductCatalogItem[]>(() => getStoredProducts());
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'local'>('synced');

  // Real-time Firestore sync
  useEffect(() => {
    if (!user) return;

    const unsubInvoices = subscribeToInvoices(
      (remoteInvoices) => {
        if (remoteInvoices && remoteInvoices.length > 0) {
          setInvoices(remoteInvoices);
          saveStoredInvoices(remoteInvoices);
        }
        setSyncStatus('synced');
      },
      () => {
        setSyncStatus('local');
      }
    );

    const unsubProducts = subscribeToProducts(
      (remoteProducts) => {
        if (remoteProducts && remoteProducts.length > 0) {
          setProducts(remoteProducts);
          saveStoredProducts(remoteProducts);
        }
      },
      () => {
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

  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
  const [isCustomerLedgerOpen, setIsCustomerLedgerOpen] = useState(false);
  const [isProductCatalogOpen, setIsProductCatalogOpen] = useState(false);

  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

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
    } catch (e) {
      console.warn('Firestore product update error, saved locally:', e);
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
    } catch (e) {
      console.warn('Firestore duplicate save error:', e);
    }
    setViewingInvoice(duplicated);
    setIsViewModalOpen(true);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const updated = invoices.filter(i => i.id !== invoiceId);
    updateInvoices(updated);
    try {
      await deleteInvoiceFromFirestore(invoiceId);
    } catch (e) {
      console.warn('Firestore delete error:', e);
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
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
    
    try {
      await saveInvoiceToFirestore(savedInvoice);
    } catch (e) {
      console.warn('Firestore invoice save error, kept in local state:', e);
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
      } catch (e) {
        console.warn('Firestore payment update error:', e);
      }
    }
  };

  const handleImportInvoices = async (importedInvoices: Invoice[]) => {
    const updated = [...importedInvoices, ...invoices];
    updateInvoices(updated);
    for (const inv of importedInvoices) {
      try {
        await saveInvoiceToFirestore(inv);
      } catch (e) {
        console.warn('Firestore import item save error:', e);
      }
    }
  };

  const handleResetData = async () => {
    if (window.confirm('هل تريد إعادة تعيين فواتير النظام إلى بيانات النماذج الأصلية (الصالحين، الجراش، السعادة، محمود الصعيدي، الشاعر...)؟')) {
      const { invoices: resetInv, products: resetProd } = resetToSampleData();
      setInvoices(resetInv);
      setProducts(resetProd);
      for (const inv of resetInv) {
        await saveInvoiceToFirestore(inv).catch(() => {});
      }
      await saveProductsToFirestore(resetProd).catch(() => {});
    }
  };

  const handleExportCSV = () => {
    exportInvoicesToCSV(invoices);
  };

  return (
    <div className="min-h-screen bg-slate-50/80 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Top Navbar */}
      <Navbar
        onNewInvoice={handleNewInvoice}
        onOpenSmartImport={() => setIsSmartImportOpen(true)}
        onOpenCustomerLedger={() => setIsCustomerLedgerOpen(true)}
        onOpenCatalog={() => setIsProductCatalogOpen(true)}
        onExportCSV={handleExportCSV}
        onResetData={handleResetData}
        invoicesCount={invoices.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Quick Welcome & Assistant Banner */}
        <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 sm:p-7 text-white shadow-lg shadow-slate-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print relative overflow-hidden">
          
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مساعد إدارة الفواتير والمبيعات السحابي</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              فواتير المنظفات وحسابات العملاء والتحصيل
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              مرتبط سحابياً مع قاعدة بيانات Firebase • مزامنة لحظية بين أجهزتك • تحكم كامل في فواتير المبيعات وتسجيل الدفعات النقدية وطباعة الفواتير والإيصالات.
            </p>
          </div>

          {/* Quick CTA buttons */}
          <div className="flex flex-wrap items-center gap-2.5 z-10 w-full md:w-auto">
            <button
              onClick={() => setIsSmartImportOpen(true)}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-md shadow-purple-600/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>تحويل نص لفاتورة</span>
            </button>
            <button
              onClick={handleNewInvoice}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <FilePlus className="w-4 h-4 text-emerald-600" />
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
              {syncStatus === 'synced' ? 'متزامن لحظياً' : syncStatus === 'syncing' ? 'جارِ المزامنة...' : 'يعمل محلياً'}
            </span>
          </div>
          <div className="flex items-center gap-4">
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

      {/* 3. Smart Text to Invoice Parser Modal */}
      <SmartTextImportModal
        isOpen={isSmartImportOpen}
        onClose={() => setIsSmartImportOpen(false)}
        onImportInvoices={handleImportInvoices}
        existingInvoicesCount={invoices.length}
      />

      {/* 4. Customer Accounts & Balances Ledger Modal */}
      <CustomerLedgerModal
        isOpen={isCustomerLedgerOpen}
        onClose={() => setIsCustomerLedgerOpen(false)}
        invoices={invoices}
        onViewInvoice={handleViewInvoice}
      />

      {/* 5. Product & Price Catalog Modal */}
      <ProductCatalogModal
        isOpen={isProductCatalogOpen}
        onClose={() => setIsProductCatalogOpen(false)}
        products={products}
        onSaveProducts={updateProducts}
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
