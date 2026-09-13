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
  Sparkles
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
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs no-print transition-all" 
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* ========================================================= */}
          {/* 1. BRANDING & WORKSPACE INFORMATION */}
          {/* ========================================================= */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20 shrink-0">
              <ReceiptText className="w-5 h-5" />
            </div>
            
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
                  إدارة الفواتير والتحصيلات
                </span>
                
                {/* Subtle Workspace Pill */}
                {projectId && (
                  <span 
                    className="hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium text-slate-500 bg-slate-100 border border-slate-200" 
                    title={`متصل بمشروع Firebase: ${projectId}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="truncate max-w-[110px]">{projectId}</span>
                  </span>
                )}
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
            
            {/* GROUP A: الحسابات والعملاء (Customers & Accounts Dropdown) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('CUSTOMERS')}
                className={`h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeDropdown === 'CUSTOMERS'
                    ? 'bg-slate-100 text-slate-900 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Users className="w-4 h-4 text-teal-600" />
                <span>العملاء والحسابات</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  activeDropdown === 'CUSTOMERS' ? 'rotate-180 text-teal-600' : ''
                }`} />
              </button>

              {activeDropdown === 'CUSTOMERS' && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 p-1.5 space-y-1 animate-in fade-in-50 zoom-in-95 duration-150 z-50">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    إدارة العملاء والمسحوبات
                  </div>

                  <button
                    onClick={() => {
                      closeMenus();
                      onOpenCustomerLedger();
                    }}
                    className="w-full p-2.5 text-right rounded-xl hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 shrink-0 group-hover:bg-teal-100 transition-colors">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-teal-900">
                        كشف حسابات العملاء
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal leading-relaxed">
                        متابعة الحساب الجاري، الدفعات، والمديونيات
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
                          مسحوبات الأصناف
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal leading-relaxed">
                          تقرير تفصيلي لما طلبه كل عميل من كل صنف
                        </div>
                      </div>
                    </button>
                  )}
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

            {/* GROUP C: المالية والرواتب (Finance & Vault Dropdown) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('FINANCE')}
                className={`h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeDropdown === 'FINANCE'
                    ? 'bg-slate-100 text-slate-900 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <DollarSign className="w-4 h-4 text-rose-600" />
                <span>المالية والرواتب</span>
                {expensesCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  activeDropdown === 'FINANCE' ? 'rotate-180 text-rose-600' : ''
                }`} />
              </button>

              {activeDropdown === 'FINANCE' && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 p-1.5 space-y-1 animate-in fade-in-50 zoom-in-95 duration-150 z-50">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    الإدارة المالية وحسابات الأرباح
                  </div>

                  <button
                    onClick={() => {
                      closeMenus();
                      onOpenExpensesPayroll();
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
                          <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            {expensesCount} حركة
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal leading-relaxed">
                        مسير الرواتب الشهرية والعمولات والمصروفات التشغيلية
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
            
            {/* Invoice Count Subtle Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200/80">
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>{invoicesCount}</span>
              <span className="text-slate-400 font-normal text-[11px]">فاتورة</span>
            </div>

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
                      {projectId && (
                        <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-200/60 flex items-center gap-1">
                          <Database className="w-2.5 h-2.5 text-slate-400" />
                          <span className="truncate">{projectId}</span>
                        </div>
                      )}
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
      {/* 4. RESPONSIVE MOBILE DRAWER (Clean accordion for < lg screens) */}
      {/* ========================================================= */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-3 animate-in slide-in-from-top-2 duration-150 max-h-[80vh] overflow-y-auto shadow-xl">
          
          {/* Mobile Workspace Info */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>مشروع Firebase:</span>
              <strong className="font-mono text-slate-900">{projectId}</strong>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {invoicesCount} فاتورة
            </span>
          </div>

          {/* Section: العملاء والحسابات */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              العملاء والحسابات
            </div>
            <button
              onClick={() => {
                closeMenus();
                onOpenCustomerLedger();
              }}
              className="w-full p-2.5 text-right rounded-xl hover:bg-slate-100/80 flex items-center gap-3 text-xs font-bold text-slate-800 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <span>كشف حسابات العملاء</span>
            </button>

            {onOpenCustomerProductsSummary && (
              <button
                onClick={() => {
                  closeMenus();
                  onOpenCustomerProductsSummary();
                }}
                className="w-full p-2.5 text-right rounded-xl hover:bg-slate-100/80 flex items-center gap-3 text-xs font-bold text-slate-800 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <span>مسحوبات كل عميل من الأصناف</span>
              </button>
            )}
          </div>

          {/* Section: الشحن والعمليات */}
          <div className="space-y-1 pt-1 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              الشحن والمبيعات
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
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
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
          </div>

          {/* Section: المالية والخزنة */}
          <div className="space-y-1 pt-1 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              المالية والأرباح
            </div>
            <button
              onClick={() => {
                closeMenus();
                onOpenExpensesPayroll();
              }}
              className="w-full p-2.5 text-right rounded-xl hover:bg-slate-100/80 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span>المصروفات والرواتب التشغيلية</span>
              </div>
              {expensesCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                  {expensesCount}
                </span>
              )}
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

          {/* Section: أدوات إضافية وتسجيل الخروج */}
          <div className="space-y-1 pt-1 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              الإعدادات والأدوات
            </div>
            
            <button
              onClick={() => {
                closeMenus();
                onOpenTeamManagement();
              }}
              className="w-full p-2.5 text-right rounded-xl hover:bg-slate-100/80 flex items-center gap-3 text-xs font-bold text-slate-800 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <span>فريق العمل والمدراء</span>
            </button>

            <button
              onClick={() => {
                closeMenus();
                onExportCSV();
              }}
              className="w-full p-2.5 text-right rounded-xl hover:bg-slate-100/80 flex items-center gap-3 text-xs font-bold text-slate-800 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <span>تصدير ملف Excel / CSV</span>
            </button>

            <button
              onClick={() => {
                closeMenus();
                onClearData();
              }}
              className="w-full p-2.5 text-right rounded-xl hover:bg-rose-50 flex items-center gap-3 text-xs font-bold text-rose-600 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <span>تفريغ ومسح الفواتير</span>
            </button>

            {user && (
              <button
                onClick={() => {
                  closeMenus();
                  logout();
                }}
                className="w-full p-2.5 text-right rounded-xl bg-slate-50 hover:bg-rose-50 flex items-center justify-between text-xs font-bold text-rose-600 mt-2 cursor-pointer border border-slate-200"
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
