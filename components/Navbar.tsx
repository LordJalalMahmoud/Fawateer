'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  FilePlus, 
  Users, 
  Package, 
  Download, 
  RotateCcw,
  ReceiptText, 
  LogOut, 
  Database, 
  UserCheck, 
  Lock, 
  Truck, 
  DollarSign, 
  ChevronDown, 
  Menu, 
  X, 
  PackageCheck, 
  MoreHorizontal, 
  ShieldCheck, 
  Building2, 
  Receipt, 
  Layers, 
  Sparkles,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export interface NavbarProps {
  onNewInvoice: () => void;
  onOpenCustomerLedger: () => void;
  onOpenCustomerProductsSummary?: () => void;
  onOpenCatalog: () => void;
  onOpenTeamManagement: () => void;
  onOpenSecretVault: () => void;
  onOpenCourierSettlements: () => void;
  onOpenExpensesPayroll: () => void;
  onExportCSV: () => void;
  onClearData: () => void;
  invoicesCount: number;
  courierCount?: number;
  expensesCount?: number;
  currentView?: 'DASHBOARD' | 'CUSTOMERS' | 'INVOICES' | 'EXPENSES';
  onSelectView?: (view: 'DASHBOARD' | 'CUSTOMERS' | 'INVOICES' | 'EXPENSES') => void;
}

export function Navbar({
  onNewInvoice,
  onOpenCustomerLedger,
  onOpenCustomerProductsSummary,
  onOpenCatalog,
  onOpenTeamManagement,
  onOpenSecretVault,
  onOpenCourierSettlements,
  onOpenExpensesPayroll,
  onExportCSV,
  onClearData,
  invoicesCount,
  courierCount = 0,
  expensesCount = 0,
  currentView = 'DASHBOARD',
  onSelectView,
}: NavbarProps) {
  const { user, logout, projectId } = useAuth();
  
  // State for desktop dropdown menus
  const [activeDropdown, setActiveDropdown] = useState<'CUSTOMERS' | 'FINANCE' | 'TOOLS' | 'USER' | null>(null);
  
  // State for mobile drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Ref for click-outside detection
  const navRef = useRef<HTMLElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveDropdown(null);
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleDropdown = (name: 'CUSTOMERS' | 'FINANCE' | 'TOOLS' | 'USER') => {
    setActiveDropdown(prev => (prev === name ? null : name));
  };

  const closeMenus = () => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
  };

  return (
    <header 
      ref={navRef}
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs no-print transition-all" 
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* ========================================================= */}
          {/* 1. BRANDING & WORKSPACE INFORMATION */}
          {/* ========================================================= */}
          <div 
            onClick={() => onSelectView?.('DASHBOARD')}
            className="flex items-center gap-3 shrink-0 cursor-pointer group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20 shrink-0 group-hover:scale-105 transition-transform">
              <ReceiptText className="w-5 h-5" />
            </div>
            
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight whitespace-nowrap group-hover:text-emerald-800 transition-colors">
                  إدارة الفواتير والتحصيلات
                </span>
              </div>
              
              <span className="hidden sm:inline text-[11px] text-slate-500 font-medium truncate max-w-[240px]">
                نظام إدارة المبيعات، الحسابات الجارية والمصروفات
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. MAIN SAAS NAVIGATION (Desktop / Laptop) */}
          {/* ========================================================= */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            
            {/* MODULE 1: الرئيسية (Dashboard) */}
            <button
              type="button"
              onClick={() => {
                closeMenus();
                onSelectView?.('DASHBOARD');
              }}
              className={`h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'DASHBOARD'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${currentView === 'DASHBOARD' ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>الرئيسية</span>
            </button>

            {/* MODULE 2: العملاء والحسابات (Customers & Accounts) */}
            <div className="relative">
              <div className="inline-flex rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    closeMenus();
                    onSelectView?.('CUSTOMERS');
                  }}
                  className={`h-9 px-3 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentView === 'CUSTOMERS'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Users className={`w-4 h-4 ${currentView === 'CUSTOMERS' ? 'text-teal-400' : 'text-teal-600'}`} />
                  <span>العملاء والحسابات</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleDropdown('CUSTOMERS')}
                  className={`h-9 px-1.5 text-xs transition-all cursor-pointer ${
                    currentView === 'CUSTOMERS'
                      ? 'bg-slate-900 text-white border-r border-slate-700'
                      : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                  title="المزيد من خيارات العملاء"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'CUSTOMERS' ? 'rotate-180' : ''
                  }`} />
                </button>
              </div>

              {activeDropdown === 'CUSTOMERS' && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 p-1.5 space-y-1 animate-in fade-in-50 zoom-in-95 duration-150 z-50">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    إدارة العملاء والمسحوبات
                  </div>

                  <button
                    onClick={() => {
                      closeMenus();
                      onSelectView?.('CUSTOMERS');
                    }}
                    className="w-full p-2.5 text-right rounded-xl hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 shrink-0 group-hover:bg-teal-100 transition-colors">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-teal-900">
                        سجل الحسابات الجارية للتجار
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal leading-relaxed">
                        جدول كامل بالمديونيات، المسحوبات والدفعات
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      closeMenus();
                      onOpenCustomerLedger();
                    }}
                    className="w-full p-2.5 text-right rounded-xl hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 group-hover:bg-slate-200 transition-colors">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800">
                        كشف حسابات العملاء المجمع
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal leading-relaxed">
                        نافذة فحص تفاصيل الحسابات
                      </div>
                    </div>
                  </button>

                  {onOpenCustomerProductsSummary && (
                    <button
                      onClick={() => {
                        closeMenus();
                        onOpenCustomerProductsSummary();
                      }}
                      className="w-full p-2.5 text-right rounded-xl hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700 shrink-0 group-hover:bg-emerald-100 transition-colors">
                        <PackageCheck className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                          تقرير مسحوبات الأصناف
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal leading-relaxed">
                          ما طلبه كل عميل من كل صنف
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* MODULE 3: سجل الفواتير والمبيعات (Invoices) */}
            <button
              type="button"
              onClick={() => {
                closeMenus();
                onSelectView?.('INVOICES');
              }}
              className={`h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'INVOICES'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Receipt className={`w-4 h-4 ${currentView === 'INVOICES' ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <span>الفواتير</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                {invoicesCount}
              </span>
            </button>

            {/* MODULE 4: المالية والرواتب (Finance & Payroll) */}
            <div className="relative">
              <div className="inline-flex rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    closeMenus();
                    onSelectView?.('EXPENSES');
                  }}
                  className={`h-9 px-3 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentView === 'EXPENSES'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <DollarSign className={`w-4 h-4 ${currentView === 'EXPENSES' ? 'text-rose-400' : 'text-rose-600'}`} />
                  <span>المالية والرواتب</span>
                  {expensesCount > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleDropdown('FINANCE')}
                  className={`h-9 px-1.5 text-xs transition-all cursor-pointer ${
                    currentView === 'EXPENSES'
                      ? 'bg-slate-900 text-white border-r border-slate-700'
                      : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                  title="المزيد من خيارات المالية"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'FINANCE' ? 'rotate-180' : ''
                  }`} />
                </button>
              </div>

              {activeDropdown === 'FINANCE' && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 p-1.5 space-y-1 animate-in fade-in-50 zoom-in-95 duration-150 z-50">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    الإدارة المالية وحسابات الأرباح
                  </div>

                  <button
                    onClick={() => {
                      closeMenus();
                      onSelectView?.('EXPENSES');
                    }}
                    className="w-full p-2.5 text-right rounded-xl hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600 shrink-0 group-hover:bg-rose-100 transition-colors">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-rose-950">
                          المصروفات والرواتب
                        </span>
                        {expensesCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold font-mono">
                            {expensesCount} حركة
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal leading-relaxed">
                        مسير الرواتب الشهرية والمصروفات ومسحوبات الشركاء
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      closeMenus();
                      onOpenSecretVault();
                    }}
                    className="w-full p-2.5 text-right rounded-xl hover:bg-amber-50/50 flex items-start gap-2.5 transition-colors cursor-pointer group border border-transparent hover:border-amber-200/50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-300/80 flex items-center justify-center text-amber-700 shrink-0 group-hover:bg-amber-100 transition-colors shadow-2xs">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-amber-950">
                          خزنة الأرباح السرية
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded">
                          VIP
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal leading-relaxed">
                        تحليل هوامش أرباح المصنع والشركة وصافي الدخل
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* GROUP B: الشحن والقطاعي (Shipping Settlements Link) */}
            <button
              type="button"
              onClick={() => {
                closeMenus();
                onOpenCourierSettlements();
              }}
              className="h-9 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 inline-flex items-center gap-1.5 transition-all cursor-pointer"
              title="تحصيلات وتسويات شركات الشحن ومبيعات القطاعي"
            >
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>تحصيلات الشحن</span>
              {courierCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono font-bold">
                  {courierCount}
                </span>
              )}
            </button>

            {/* GROUP D: المنتجات والأسعار (Catalog Link) */}
            <button
              type="button"
              onClick={() => {
                closeMenus();
                onOpenCatalog();
              }}
              className="h-9 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 inline-flex items-center gap-1.5 transition-all cursor-pointer"
              title="دليل الأسعار وقوائم المنتجات"
            >
              <Package className="w-4 h-4 text-slate-600" />
              <span>المنتجات والأسعار</span>
            </button>

            {/* GROUP E: المزيد والأدوات (Tools & More Dropdown) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('TOOLS')}
                className={`h-9 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer ${
                  activeDropdown === 'TOOLS'
                    ? 'bg-slate-100 text-slate-900 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
                title="أدوات إضافية والإعدادات"
              >
                <MoreHorizontal className="w-4 h-4 text-slate-500" />
                <span className="hidden xl:inline">أدوات</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  activeDropdown === 'TOOLS' ? 'rotate-180' : ''
                }`} />
              </button>

              {activeDropdown === 'TOOLS' && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 p-1.5 space-y-1 animate-in fade-in-50 zoom-in-95 duration-150 z-50">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    إدارة النظام والأدوات
                  </div>

                  <button
                    onClick={() => {
                      closeMenus();
                      onOpenTeamManagement();
                    }}
                    className="w-full p-2 text-right rounded-xl hover:bg-slate-50 flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-teal-600" />
                    <span>فريق العمل والمدراء</span>
                  </button>

                  <button
                    onClick={() => {
                      closeMenus();
                      onExportCSV();
                    }}
                    className="w-full p-2 text-right rounded-xl hover:bg-slate-50 flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>تصدير ملف Excel / CSV</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={() => {
                      closeMenus();
                      onClearData();
                    }}
                    className="w-full p-2 text-right rounded-xl hover:bg-rose-50 flex items-center gap-2 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-500" />
                    <span>تفريغ ومسح الفواتير</span>
                  </button>
                </div>
              )}
            </div>

          </nav>

          {/* ========================================================= */}
          {/* 3. ACTIONS & USER SECTION (Primary CTA + Account + Mobile Toggle) */}
          {/* ========================================================= */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* PRIMARY CTA: فاتورة جديدة */}
            <button
              type="button"
              onClick={onNewInvoice}
              className="h-9 sm:h-9.5 px-3.5 sm:px-4 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl shadow-xs shadow-emerald-600/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <FilePlus className="w-4 h-4" />
              <span>فاتورة جديدة</span>
            </button>

            {/* USER & ACCOUNT DROPDOWN */}
            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('USER')}
                  className="h-9 px-2 sm:px-2.5 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-slate-100/80 flex items-center gap-2 text-right transition-all cursor-pointer"
                  title="بيانات الحساب والنظام"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    {(user.displayName || user.email || 'A')[0].toUpperCase()}
                  </div>
                  
                  <div className="hidden md:flex flex-col text-right leading-tight">
                    <span className="text-[11px] font-bold text-slate-800 max-w-[90px] truncate">
                      {user.displayName || user.email?.split('@')[0] || 'المدير'}
                    </span>
                    <span className="text-[9px] text-emerald-600 font-semibold">
                      مدير النظام
                    </span>
                  </div>

                  <ChevronDown className="w-3 h-3 text-slate-400 hidden md:inline" />
                </button>

                {activeDropdown === 'USER' && (
                  <div className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 p-2 space-y-1.5 animate-in fade-in-50 zoom-in-95 duration-150 z-50">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <div className="text-xs font-bold text-slate-900 truncate" title={user.email || ''}>
                        {user.email || 'المدير المسؤول'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>صلاحية كاملة (Admin)</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        closeMenus();
                        logout();
                      }}
                      className="w-full p-2 text-right rounded-xl hover:bg-rose-50 flex items-center justify-between text-xs font-semibold text-rose-600 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>تسجيل الخروج</span>
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* MOBILE / TABLET MENU TOGGLE BUTTON */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="h-9 w-9 flex lg:hidden items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shrink-0"
              aria-label="تبديل القائمة"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. RESPONSIVE MOBILE DRAWER */}
      {/* ========================================================= */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-3 animate-in slide-in-from-top-2 duration-150 max-h-[80vh] overflow-y-auto shadow-xl">
          
          {/* Main Views Switcher for Mobile */}
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
            <button
              onClick={() => {
                closeMenus();
                onSelectView?.('DASHBOARD');
              }}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                currentView === 'DASHBOARD' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>الرئيسية</span>
            </button>

            <button
              onClick={() => {
                closeMenus();
                onSelectView?.('CUSTOMERS');
              }}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                currentView === 'CUSTOMERS' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>العملاء</span>
            </button>

            <button
              onClick={() => {
                closeMenus();
                onSelectView?.('INVOICES');
              }}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                currentView === 'INVOICES' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>الفواتير</span>
            </button>

            <button
              onClick={() => {
                closeMenus();
                onSelectView?.('EXPENSES');
              }}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                currentView === 'EXPENSES' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>المصروفات</span>
            </button>
          </div>

          {/* Section: الشحن والعمليات */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              العمليات والدليل
            </div>
            
            <button
              onClick={() => {
                closeMenus();
                onOpenCourierSettlements();
              }}
              className="w-full p-2.5 text-right rounded-xl hover:bg-slate-100/80 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <span>تحصيلات الشحن والقطاعي</span>
              </div>
              {courierCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold font-mono">
                  {courierCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                closeMenus();
                onOpenCatalog();
              }}
              className="w-full p-2.5 text-right rounded-xl hover:bg-slate-100/80 flex items-center gap-3 text-xs font-bold text-slate-800 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <span>دليل المنتجات وقوائم الأسعار</span>
            </button>

            <button
              onClick={() => {
                closeMenus();
                onOpenSecretVault();
              }}
              className="w-full p-2.5 text-right rounded-xl hover:bg-amber-50/60 flex items-center justify-between text-xs font-bold text-slate-900 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 border border-amber-300/80">
                  <Lock className="w-4 h-4" />
                </div>
                <span>خزنة الأرباح السرية</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded">
                VIP
              </span>
            </button>
          </div>

          {/* Section: أدوات وتسجيل خروج */}
          <div className="space-y-1 pt-1 border-t border-slate-100">
            <button
              onClick={() => {
                closeMenus();
                onOpenTeamManagement();
              }}
              className="w-full p-2 text-right rounded-xl hover:bg-slate-100/80 flex items-center gap-3 text-xs font-bold text-slate-800 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <span>فريق العمل والمدراء</span>
            </button>

            <button
              onClick={() => {
                closeMenus();
                onExportCSV();
              }}
              className="w-full p-2 text-right rounded-xl hover:bg-slate-100/80 flex items-center gap-3 text-xs font-bold text-slate-800 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Download className="w-3.5 h-3.5" />
              </div>
              <span>تصدير ملف Excel / CSV</span>
            </button>

            {user && (
              <button
                onClick={() => {
                  closeMenus();
                  logout();
                }}
                className="w-full p-2 text-right rounded-xl bg-slate-50 hover:bg-rose-50 flex items-center justify-between text-xs font-bold text-rose-600 mt-2 cursor-pointer border border-slate-200"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج ({user.email?.split('@')[0]})</span>
                </div>
              </button>
            )}
          </div>

        </div>
      )}
    </header>
  );
}
