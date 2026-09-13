'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Users,
  HandCoins,
  Package,
  PackageCheck,
  TrendingDown,
  Banknote,
  Lock,
  Truck,
  FileText,
  Download,
  ShieldCheck,
  Trash2,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  RefreshCw,
  Database,
  Building2,
  Check,
  Plus,
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export type ActiveModule =
  | 'DASHBOARD'
  | 'INVOICES'
  | 'CUSTOMERS'
  | 'COLLECTIONS'
  | 'PRODUCTS'
  | 'PRODUCTS_DEMAND'
  | 'EXPENSES'
  | 'PAYROLL'
  | 'PROFIT_VAULT'
  | 'COURIERS'
  | 'REPORTS'
  | 'TEAM';

export interface AppShellProps {
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
  onNewInvoice: () => void;
  onOpenCustomerLedger: () => void;
  onOpenCustomerProductsSummary: () => void;
  onOpenCatalog: () => void;
  onOpenTeamManagement: () => void;
  onOpenSecretVault: () => void;
  onOpenCourierSettlements: () => void;
  onExportCSV: () => void;
  onClearData: () => void;
  onTestFirebase: () => void;
  testingFirebase: boolean;
  invoicesCount: number;
  courierCount?: number;
  expensesCount?: number;
  syncStatus?: 'synced' | 'syncing' | 'local';
  children: React.ReactNode;
}

const BREADCRUMB_CONFIG: Record<ActiveModule, { group: string; label: string }> = {
  DASHBOARD: { group: 'الرئيسية', label: 'لوحة التحكم والمؤشرات' },
  INVOICES: { group: 'المبيعات', label: 'سجل الفواتير والمبيعات' },
  CUSTOMERS: { group: 'المبيعات', label: 'العملاء والحسابات الجارية' },
  COLLECTIONS: { group: 'المبيعات', label: 'التحصيلات والمقبوضات النقدية' },
  PRODUCTS: { group: 'المنتجات والمخزون', label: 'دليل المنتجات وقائمة الأسعار' },
  PRODUCTS_DEMAND: { group: 'المنتجات والمخزون', label: 'مسحوبات الأصناف والطلب' },
  EXPENSES: { group: 'المالية والمحاسبة', label: 'المصروفات التشغيلية' },
  PAYROLL: { group: 'المالية والمحاسبة', label: 'مسير الرواتب والأجور' },
  PROFIT_VAULT: { group: 'المالية والمحاسبة', label: 'خزنة الأرباح والتسعير السري' },
  COURIERS: { group: 'العمليات واللوجستيات', label: 'تسويات مناديب الشحن' },
  REPORTS: { group: 'التقارير والأدوات', label: 'كشوف الحسابات' },
  TEAM: { group: 'الإعدادات والأمان', label: 'فريق العمل والمدراء المصرح لهم' },
};

export const AppShell: React.FC<AppShellProps> = ({
  activeModule,
  onSelectModule,
  onNewInvoice,
  onOpenCustomerLedger,
  onOpenCustomerProductsSummary,
  onOpenCatalog,
  onOpenTeamManagement,
  onOpenSecretVault,
  onOpenCourierSettlements,
  onExportCSV,
  onClearData,
  onTestFirebase,
  testingFirebase,
  invoicesCount,
  courierCount = 0,
  expensesCount = 0,
  syncStatus = 'synced',
  children,
}) => {
  const { user, logout, projectId } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (module: ActiveModule) => {
    setIsMobileMenuOpen(false);

    if (module === 'PRODUCTS') {
      onOpenCatalog();
      return;
    }
    if (module === 'PRODUCTS_DEMAND') {
      onOpenCustomerProductsSummary();
      return;
    }
    if (module === 'PROFIT_VAULT') {
      onOpenSecretVault();
      return;
    }
    if (module === 'COURIERS') {
      onOpenCourierSettlements();
      return;
    }
    if (module === 'REPORTS') {
      onOpenCustomerLedger();
      return;
    }
    if (module === 'TEAM') {
      onOpenTeamManagement();
      return;
    }

    onSelectModule(module);
  };

  const breadcrumb = BREADCRUMB_CONFIG[activeModule] || { group: 'الرئيسية', label: 'لوحة التحكم' };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-900" dir="rtl">
      
      {/* 1. TOP BAR (Logo | النظام | Workspace | المستخدم | الإعدادات) */}
      <header className="h-14 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between select-none shadow-2xs no-print">
        
        {/* Right Section (in RTL): Hamburger + Logo + Workspace */}
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            className="lg:hidden p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
            aria-label="القائمة الجانبية"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo & Brand */}
          <div 
            onClick={() => onSelectModule('DASHBOARD')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 font-sans">
                فواتير <span className="text-emerald-600 font-mono text-xs">ERP</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-slate-100 text-[10px] font-mono font-bold text-slate-600 border border-slate-200">
                v2.0
              </span>
            </div>
          </div>
        </div>

        {/* Left Section (in RTL): Primary Action + Sync Status + User Menu */}
        <div className="flex items-center gap-2.5">
          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onNewInvoice}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>فاتورة جديدة</span>
          </button>

          {/* Connection / Sync Status Pill */}
          <button 
            type="button"
            onClick={onTestFirebase}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold border cursor-pointer transition-colors ${
              syncStatus === 'synced'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70'
            }`}
            title="فحص جودة واستقرار الاتصال"
          >
            <RefreshCw className={`w-3 h-3 text-emerald-600 ${testingFirebase ? 'animate-spin' : ''}`} />
            <span>{syncStatus === 'synced' ? 'متزامن' : 'جارِ المزامنة'}</span>
          </button>

          {/* User Profile & Session Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(prev => !prev)}
              className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="p-2 border-b border-slate-100 mb-1">
                  <div className="font-bold text-slate-900 truncate">{user?.email || 'المستخدم المصرح'}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">مدير النظام (Admin)</div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenTeamManagement();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 text-right cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>المدراء المصرح لهم</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenSecretVault();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 text-right cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>خزنة الأرباح والتسعير</span>
                </button>

                <div className="h-px bg-slate-100 my-1"></div>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onClearData();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-right cursor-pointer font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تفريغ ومسح البيانات</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-right cursor-pointer font-medium"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-400" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. BODY LAYOUT: SIDEBAR (RIGHT) + MAIN WORKSPACE (LEFT) */}
      <div className="flex-1 flex min-h-[calc(100vh-3.5rem)]">
        
        {/* Desktop SIDEBAR (Docked to the RIGHT in RTL) */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-slate-900 border-l border-slate-800 text-slate-300 py-4 px-3 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto no-print">
          <SidebarNavContent
            activeModule={activeModule}
            onNavClick={handleNavClick}
            onExportCSV={onExportCSV}
            onClearData={onClearData}
            invoicesCount={invoicesCount}
            expensesCount={expensesCount}
            courierCount={courierCount}
          />
        </aside>

        {/* Mobile Slide-Over SIDEBAR Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-slate-900/60 backdrop-blur-xs flex justify-end no-print" dir="rtl">
            <div className="w-72 bg-slate-900 h-full p-4 overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-white">
                <div className="flex items-center gap-2 font-bold">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>قائمة النظام الرئيسية</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <SidebarNavContent
                activeModule={activeModule}
                onNavClick={handleNavClick}
                onExportCSV={onExportCSV}
                onClearData={onClearData}
                invoicesCount={invoicesCount}
                expensesCount={expensesCount}
                courierCount={courierCount}
              />
            </div>
          </div>
        )}

        {/* MAIN WORKSPACE (Takes the LEFT side in RTL) */}
        <div className="flex-1 min-w-0 bg-white flex flex-col">
          
          {/* Breadcrumb Navigation Strip */}
          <div className="px-4 sm:px-6 lg:px-8 pt-5 pb-1 no-print">
            <nav aria-label="مسار التنقل" className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span
                onClick={() => onSelectModule('DASHBOARD')}
                className="hover:text-emerald-700 cursor-pointer transition-colors"
              >
                الرئيسية
              </span>
              {activeModule !== 'DASHBOARD' && (
                <>
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
                  <span>{breadcrumb.group}</span>
                </>
              )}
              <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-bold text-slate-800 font-sans">{breadcrumb.label}</span>
            </nav>
          </div>

          {/* Dynamic Workspace Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            {children}
          </main>

          {/* ERP Footer Bar */}
          <footer className="mt-auto border-t border-slate-200 bg-white py-3.5 px-6 text-xs text-slate-500 no-print flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">منظومة فواتير ERP لإدارة الحسابات</span>
              <span>•</span>
              <span className="text-[11px] text-slate-500">متصل سحابياً ومحدث</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
              <span>{new Date().toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>•</span>
              <span>Enterprise Edition</span>
            </div>
          </footer>
        </div>

      </div>
    </div>
  );
};

interface SidebarNavContentProps {
  activeModule: ActiveModule;
  onNavClick: (module: ActiveModule) => void;
  onExportCSV: () => void;
  onClearData: () => void;
  invoicesCount: number;
  expensesCount: number;
  courierCount: number;
}

const SidebarNavContent: React.FC<SidebarNavContentProps> = ({
  activeModule,
  onNavClick,
  onExportCSV,
  onClearData,
  invoicesCount,
  expensesCount,
  courierCount,
}) => {
  return (
    <div className="space-y-5 text-xs">
      
      {/* 1. لوحة التحكم (Dashboard) */}
      <div>
        <button
          type="button"
          onClick={() => onNavClick('DASHBOARD')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeModule === 'DASHBOARD'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className={`w-4 h-4 ${activeModule === 'DASHBOARD' ? 'text-white' : 'text-emerald-400'}`} />
            <span className="text-sm">لوحة التحكم</span>
          </div>
        </button>
      </div>

      {/* 2. المبيعات والعملاء (Sales & Customers) */}
      <div className="space-y-1">
        <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          المبيعات والعملاء
        </div>

        <div className="space-y-0.5 pt-0.5">
          {/* الفواتير */}
          <button
            type="button"
            onClick={() => onNavClick('INVOICES')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeModule === 'INVOICES'
                ? 'bg-slate-800 text-white font-bold border-r-2 border-emerald-500'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-400" />
              <span>الفواتير والمبيعات</span>
            </div>
            {invoicesCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono ${
                activeModule === 'INVOICES' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {invoicesCount}
              </span>
            )}
          </button>

          {/* العملاء */}
          <button
            type="button"
            onClick={() => onNavClick('CUSTOMERS')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeModule === 'CUSTOMERS'
                ? 'bg-slate-800 text-white font-bold border-r-2 border-emerald-500'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span>العملاء والحسابات</span>
            </div>
          </button>

          {/* التحصيلات */}
          <button
            type="button"
            onClick={() => onNavClick('COLLECTIONS')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeModule === 'COLLECTIONS'
                ? 'bg-slate-800 text-white font-bold border-r-2 border-emerald-500'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-slate-400" />
              <span>التحصيلات والدفعات</span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. المنتجات والمخزون (Products & Inventory) */}
      <div className="space-y-1">
        <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          المنتجات والمخزون
        </div>

        <div className="space-y-0.5 pt-0.5">
          <button
            type="button"
            onClick={() => onNavClick('PRODUCTS')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-400" />
              <span>المنتجات وقائمة الأسعار</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavClick('PRODUCTS_DEMAND')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-slate-400" />
              <span>مسحوبات الأصناف والطلب</span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. المالية والمحاسبة (Finance) */}
      <div className="space-y-1">
        <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          المالية والمحاسبة
        </div>

        <div className="space-y-0.5 pt-0.5">
          {/* المصروفات */}
          <button
            type="button"
            onClick={() => onNavClick('EXPENSES')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeModule === 'EXPENSES'
                ? 'bg-slate-800 text-white font-bold border-r-2 border-emerald-500'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-slate-400" />
              <span>المصروفات التشغيلية</span>
            </div>
            {expensesCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono ${
                activeModule === 'EXPENSES' ? 'bg-rose-500/30 text-rose-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {expensesCount}
              </span>
            )}
          </button>

          {/* الرواتب */}
          <button
            type="button"
            onClick={() => onNavClick('PAYROLL')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeModule === 'PAYROLL'
                ? 'bg-slate-800 text-white font-bold border-r-2 border-emerald-500'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-slate-400" />
              <span>مسير الرواتب والأجور</span>
            </div>
          </button>

          {/* خزنة الأرباح */}
          <button
            type="button"
            onClick={() => onNavClick('PROFIT_VAULT')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>خزنة الأرباح والتسعير</span>
            </div>
          </button>
        </div>
      </div>

      {/* 5. العمليات واللوجستيات (Operations) */}
      <div className="space-y-1">
        <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          العمليات والشحن
        </div>

        <div className="space-y-0.5 pt-0.5">
          <button
            type="button"
            onClick={() => onNavClick('COURIERS')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-400" />
              <span>تسويات الشحن والمناديب</span>
            </div>
            {courierCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold font-mono">
                {courierCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 6. التقارير والأدوات (Reports & Tools) */}
      <div className="space-y-1">
        <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          التقارير والأدوات
        </div>

        <div className="space-y-0.5 pt-0.5">
          <button
            type="button"
            onClick={() => onNavClick('REPORTS')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>كشوف الحسابات المجمعة</span>
            </div>
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-slate-400" />
              <span>تصدير البيانات (Excel/CSV)</span>
            </div>
          </button>
        </div>
      </div>

      {/* 7. الإعدادات والأمان (Settings) */}
      <div className="space-y-1 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={() => onNavClick('TEAM')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>فريق العمل والمدراء</span>
          </div>
        </button>
      </div>

    </div>
  );
};
