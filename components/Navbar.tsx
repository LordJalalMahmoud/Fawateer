'use client';

import React from 'react';
import { 
  FilePlus, 
  Users, 
  Package, 
  Download, 
  RotateCcw,
  ReceiptText,
  ShieldCheck,
  LogOut,
  Database,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface NavbarProps {
  onNewInvoice: () => void;
  onOpenCustomerLedger: () => void;
  onOpenCatalog: () => void;
  onOpenTeamManagement: () => void;
  onExportCSV: () => void;
  onClearData: () => void;
  invoicesCount: number;
}

export function Navbar({
  onNewInvoice,
  onOpenCustomerLedger,
  onOpenCatalog,
  onOpenTeamManagement,
  onExportCSV,
  onClearData,
  invoicesCount,
}: NavbarProps) {
  const { user, logout, projectId } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <ReceiptText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  إدارة الفواتير والتحصيلات
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {invoicesCount} فاتورة
                </span>
                <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs" title={`متصل بمشروع Firebase: ${projectId}`}>
                  <Database className="w-3 h-3 text-emerald-600" />
                  <span className="font-mono">{projectId}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                متابعة مبيعات المنظفات، حسابات العملاء والديون المستحقة
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Team / Admins Management */}
            <button
              onClick={onOpenTeamManagement}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
              title="إدارة الحسابات والمدراء المصرح لهم بالتعديل"
            >
              <UserCheck className="w-4 h-4 text-teal-700" />
              <span className="hidden md:inline">المدراء المصرح لهم</span>
            </button>

            {/* Catalog */}
            <button
              onClick={onOpenCatalog}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="دليل الأسعار والمنتجات"
            >
              <Package className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">المنتجات والأسعار</span>
            </button>

            {/* Customers Ledger */}
            <button
              onClick={onOpenCustomerLedger}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="كشف حسابات العملاء"
            >
              <Users className="w-4 h-4 text-teal-600" />
              <span className="hidden md:inline">كشف حساب العملاء</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="تصدير ملف Excel / CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden xl:inline">تصدير Excel</span>
            </button>

            {/* Clear All Invoices button */}
            <button
              onClick={onClearData}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="تفريغ ومسح كافة الفواتير"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* New Invoice Button */}
            <button
              onClick={onNewInvoice}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <FilePlus className="w-4 h-4" />
              <span>فاتورة جديدة</span>
            </button>

            {/* Admin User badge & Logout */}
            {user && (
              <div className="flex items-center gap-1.5 pl-1 border-r border-slate-200 mr-1 pr-2">
                <div className="hidden lg:flex flex-col text-right leading-tight">
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[130px]" title={user.email || ''}>
                    {user.displayName || user.email?.split('@')[0] || 'المدير'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    صلاحية مدير
                  </span>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
