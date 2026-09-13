'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  DollarSign,
  Users,
  Calendar,
  Filter,
  Download,
  Printer,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  TrendingDown,
  Building2,
  Zap,
  Truck,
  Megaphone,
  Package,
  Wrench,
  Coffee,
  Award,
  Scale,
  MoreHorizontal,
  Banknote,
  Smartphone,
  Send,
  Landmark,
  FileCheck,
  UserPlus,
  Phone,
  Briefcase,
  AlertCircle,
  Info,
  Clock,
  ArrowDownRight,
  ShieldCheck,
  ChevronDown,
  Percent,
  Crown,
  HandCoins,
  ChevronLeft,
  ChevronRight,
  PieChart,
  FileText,
  Sparkles,
  Check,
  CheckCheck,
  CalendarDays,
  UserX
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExpenseItem, Employee, SalaryPaymentRecord, ExpenseCategory, PaymentMethod, Invoice } from '@/lib/types';
import { getMonthlyCommissionsOverview, getEmployeeCommissionStats } from '@/lib/commission-analytics';

export const DEFAULT_OFFICES = [
  'المكتب الرئيسي',
  'مكتب المبيعات والتسويق',
  'مكتب الشحن والتوزيع',
  'مكتب الإدارة والمالية',
  'المخزن والمستودع',
];

interface ExpensesPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExpenseItem[];
  employees: Employee[];
  salaryPayments: SalaryPaymentRecord[];
  invoices?: Invoice[];
  onSaveExpense: (expense: ExpenseItem) => Promise<void>;
  onDeleteExpense: (expenseId: string) => Promise<void>;
  onSaveEmployee: (employee: Employee) => Promise<void>;
  onDeleteEmployee: (employeeId: string) => Promise<void>;
  onSaveSalaryPayment: (payment: SalaryPaymentRecord, autoCreateExpense?: boolean) => Promise<void>;
  onDeleteSalaryPayment: (paymentId: string) => Promise<void>;
  currentUserEmail?: string | null;
}

export const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; icon: any; color: string; bg: string; border: string }> = {
  SALARIES: { label: 'رواتب وأجور موظفين', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  RENT: { label: 'إيجارات مقرات ومخازن', icon: Building2, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  UTILITIES: { label: 'فواتير، كهرباء وإنترنت', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  TRANSPORT: { label: 'نقل، بنزين ومحروقات', icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  MARKETING: { label: 'تسويق وإعلانات', icon: Megaphone, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
  PACKAGING_RAW: { label: 'تعبئة وتغليف ومواد خام', icon: Package, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  MAINTENANCE: { label: 'صيانة معدات وسيارات', icon: Wrench, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  HOSPITALITY: { label: 'بوفيه، نظافة وضيافة', icon: Coffee, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30' },
  COMMISSIONS: { label: 'عمولات ومكافآت بيع', icon: Award, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  TAX_LEGAL: { label: 'ضرائب، تراخيص ومحاماة', icon: Scale, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' },
  PARTNER_WITHDRAWAL: { label: 'مسحوبات أرباح الشركاء (مهجة / حاتم)', icon: Crown, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  EMPLOYEE_ADVANCE: { label: 'سلف موظفين ومسحوبات', icon: HandCoins, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  OTHER: { label: 'نثريات ومصروفات أخرى', icon: MoreHorizontal, color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30' },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, { label: string; icon: any }> = {
  CASH: { label: 'نقداً (الخزينة)', icon: Banknote },
  VODAFONE_CASH: { label: 'فودافون كاش / محفظة', icon: Smartphone },
  INSTAPAY: { label: 'إنستاباي InstaPay', icon: Send },
  BANK_TRANSFER: { label: 'تحويل بنكي', icon: Landmark },
  CHECK: { label: 'شيك بنكي', icon: FileCheck },
};

// =========================================================================
// 📅 ARABIC DATE & MONTH HELPERS
// =========================================================================
export function formatArabicDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('ar-EG-u-nu-latn', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatArabicMonth(monthStr: string): string {
  if (!monthStr || monthStr === 'ALL') return '';
  try {
    const [y, m] = monthStr.split('-').map(Number);
    if (!y || !m) return monthStr;
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString('ar-EG-u-nu-latn', {
      year: 'numeric',
      month: 'long',
    });
  } catch {
    return monthStr;
  }
}

export function shiftDateStr(dateStr: string, deltaDays: number): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d + deltaDays);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, '0');
    const nd = String(date.getDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  } catch {
    return dateStr;
  }
}

export function shiftMonthStr(monthStr: string, deltaMonths: number): string {
  try {
    const [y, m] = monthStr.split('-').map(Number);
    const date = new Date(y, m - 1 + deltaMonths, 1);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, '0');
    return `${ny}-${nm}`;
  } catch {
    return monthStr;
  }
}

export function getPresetDate(
  preset: 'today' | 'yesterday' | 'month-25' | 'month-start' | 'month-end',
  targetMonth?: string
): string {
  const now = new Date();
  if (preset === 'today') {
    return now.toISOString().slice(0, 10);
  }
  if (preset === 'yesterday') {
    const yest = new Date(now.getTime() - 86400000);
    return yest.toISOString().slice(0, 10);
  }

  const mStr = targetMonth || now.toISOString().slice(0, 7);
  const [y, m] = mStr.split('-').map(Number);

  if (preset === 'month-start') {
    return `${y}-${String(m).padStart(2, '0')}-01`;
  }
  if (preset === 'month-25') {
    return `${y}-${String(m).padStart(2, '0')}-25`;
  }
  if (preset === 'month-end') {
    const lastDay = new Date(y, m, 0).getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  }
  return now.toISOString().slice(0, 10);
}

// =========================================================================
// 🎯 SMART DATE INPUT COMPONENT
// =========================================================================
interface SmartDateInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  targetMonth?: string;
  accentColor?: 'purple' | 'rose' | 'cyan' | 'amber';
  presets?: ('today' | 'yesterday' | 'month-25' | 'month-start' | 'month-end')[];
  hint?: string;
}

export function SmartDateInput({
  label,
  value,
  onChange,
  required = true,
  targetMonth,
  accentColor = 'purple',
  presets = ['today', 'yesterday', 'month-25', 'month-start', 'month-end'],
  hint,
}: SmartDateInputProps) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const formattedArabic = formatArabicDate(value);

  const accentBorder = {
    purple: 'focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30',
    rose: 'focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30',
    cyan: 'focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30',
    amber: 'focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30',
  }[accentColor];

  const activeChipBg = {
    purple: 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border-purple-500',
    rose: 'bg-rose-600 text-white shadow-md shadow-rose-600/30 border-rose-500',
    cyan: 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 border-cyan-500',
    amber: 'bg-amber-600 text-white shadow-md shadow-amber-600/30 border-amber-500',
  }[accentColor];

  const presetLabels: Record<string, { label: string; date: string }> = {
    today: { label: 'اليوم', date: getPresetDate('today') },
    yesterday: { label: 'أمس', date: getPresetDate('yesterday') },
    'month-25': { label: 'يوم 25 (الراتب)', date: getPresetDate('month-25', targetMonth) },
    'month-start': { label: 'أول الشهر (1)', date: getPresetDate('month-start', targetMonth) },
    'month-end': { label: 'آخر الشهر', date: getPresetDate('month-end', targetMonth) },
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-slate-300 font-semibold block">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
        {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(shiftDateStr(value || todayStr, -1))}
          className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-mono transition-colors cursor-pointer shrink-0"
          title="اليوم السابق (-1 يوم)"
        >
          -1 يوم
        </button>

        <div className="relative flex-1">
          <input
            type="date"
            required={required}
            value={value}
            onChange={e => onChange(e.target.value)}
            className={`w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs font-bold rounded-xl px-3 py-2 outline-none transition-all ${accentBorder}`}
          />
        </div>

        <button
          type="button"
          onClick={() => onChange(shiftDateStr(value || todayStr, 1))}
          className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-mono transition-colors cursor-pointer shrink-0"
          title="اليوم التالي (+1 يوم)"
        >
          +1 يوم
        </button>
      </div>

      {/* Quick Preset Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[10px] text-slate-500 font-medium ml-0.5">تحديد سريع:</span>
        {presets.map(pKey => {
          const item = presetLabels[pKey];
          if (!item) return null;
          const isSelected = value === item.date;
          return (
            <button
              key={pKey}
              type="button"
              onClick={() => onChange(item.date)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                isSelected
                  ? `${activeChipBg} font-bold`
                  : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-800'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Readable Arabic Day Display */}
      {formattedArabic && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950/70 border border-slate-800/80 px-2.5 py-1 rounded-lg">
          <CalendarDays className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="text-slate-200 font-medium">{formattedArabic}</span>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 🗓️ SMART MONTH INPUT COMPONENT
// =========================================================================
interface SmartMonthInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  accentColor?: 'purple' | 'rose' | 'cyan';
  hint?: string;
}

export function SmartMonthInput({
  label,
  value,
  onChange,
  required = true,
  accentColor = 'purple',
  hint,
}: SmartMonthInputProps) {
  const currentM = new Date().toISOString().slice(0, 7);
  const prevM = shiftMonthStr(currentM, -1);
  const formattedArabic = formatArabicMonth(value);

  const accentBorder = {
    purple: 'focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30',
    rose: 'focus:border-rose-500 focus:ring-rose-500/30',
    cyan: 'focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30',
  }[accentColor];

  const activeChipBg = {
    purple: 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border-purple-500',
    rose: 'bg-rose-600 text-white shadow-md shadow-rose-600/30 border-rose-500',
    cyan: 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 border-cyan-500',
  }[accentColor];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-slate-300 font-semibold block">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
        {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(shiftMonthStr(value || currentM, -1))}
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
          title="الشهر السابق"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <input
          type="month"
          required={required}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs font-bold rounded-xl px-3 py-2 outline-none transition-all ${accentBorder}`}
        />

        <button
          type="button"
          onClick={() => onChange(shiftMonthStr(value || currentM, 1))}
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
          title="الشهر التالي"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Month Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={() => onChange(currentM)}
          className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
            value === currentM
              ? `${activeChipBg} font-bold`
              : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-800'
          }`}
        >
          الشهر الحالي ({formatArabicMonth(currentM)})
        </button>
        <button
          type="button"
          onClick={() => onChange(prevM)}
          className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
            value === prevM
              ? `${activeChipBg} font-bold`
              : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-800'
          }`}
        >
          الشهر السابق ({formatArabicMonth(prevM)})
        </button>
      </div>

      {/* Readable Arabic Month Display */}
      {formattedArabic && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950/70 border border-slate-800/80 px-2.5 py-1 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="text-slate-200 font-medium">محدد لـ: {formattedArabic}</span>
        </div>
      )}
    </div>
  );
}

export function ExpensesPayrollModal({
  isOpen,
  onClose,
  expenses = [],
  employees = [],
  salaryPayments = [],
  invoices = [],
  onSaveExpense,
  onDeleteExpense,
  onSaveEmployee,
  onDeleteEmployee,
  onSaveSalaryPayment,
  onDeleteSalaryPayment,
}: ExpensesPayrollModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Main navigation tabs
  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'PARTNER_SHEET' | 'PAYROLL' | 'EMPLOYEES' | 'ANALYTICS'>('EXPENSES');

  // Filters for Expenses list
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState<string>(currentMonthStr);
  const [isAllMonthsExpenseMode, setIsAllMonthsExpenseMode] = useState<boolean>(false);
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'TODAY' | 'CUSTOM'>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 💎 Partner / Profit Drawings State (مهجة & حاتم / الشركاء)
  const [selectedPartnerTab, setSelectedPartnerTab] = useState<string>('مهجة');
  const [customPartners, setCustomPartners] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fawateer_custom_partners');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [newPartnerNameInput, setNewPartnerNameInput] = useState('');
  const [isAddingNewPartner, setIsAddingNewPartner] = useState(false);

  // Targets per partner stored in localStorage
  const [partnerTargets, setPartnerTargets] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const savedMohga = localStorage.getItem('fawateer_partner_annual_profit_مهجة') || localStorage.getItem('fawateer_partner_annual_profit');
      const savedHatem = localStorage.getItem('fawateer_partner_annual_profit_حاتم');
      return {
        'مهجة': savedMohga ? Number(savedMohga) : 0,
        'حاتم': savedHatem ? Number(savedHatem) : 0,
      };
    }
    return { 'مهجة': 0, 'حاتم': 0 };
  });

  const handleSavePartnerTarget = (partner: string, targetVal: number) => {
    setPartnerTargets(prev => ({ ...prev, [partner]: targetVal }));
    if (typeof window !== 'undefined') {
      localStorage.setItem(`fawateer_partner_annual_profit_${partner}`, String(targetVal));
    }
  };

  const [selectedPartnerMonth, setSelectedPartnerMonth] = useState<string>('ALL');
  const [selectedPartnerYear, setSelectedPartnerYear] = useState<string>(new Date().getFullYear().toString());
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');

  // Partner Withdrawal Form Modal
  const [isPartnerWithdrawalModalOpen, setIsPartnerWithdrawalModalOpen] = useState(false);
  const [editingPartnerWithdrawal, setEditingPartnerWithdrawal] = useState<ExpenseItem | null>(null);
  const [partPartnerName, setPartPartnerName] = useState<string>('مهجة');
  const [partAmount, setPartAmount] = useState<number | ''>('');
  const [partDate, setPartDate] = useState(new Date().toISOString().slice(0, 10));
  const [partTitle, setPartTitle] = useState('دفعة من الأرباح السنوية');
  const [partPaymentMethod, setPartPaymentMethod] = useState<PaymentMethod>('CASH');
  const [partReceiptNumber, setPartReceiptNumber] = useState('');
  const [partNotes, setPartNotes] = useState('');
  const [isSubmittingPartnerWithdrawal, setIsSubmittingPartnerWithdrawal] = useState(false);

  // 👥 Employee Views: Active Staff vs Resigned Archive
  const [employeeViewTab, setEmployeeViewTab] = useState<'ACTIVE' | 'RESIGNED'>('ACTIVE');
  const [showResignedInPayroll, setShowResignedInPayroll] = useState<boolean>(false);

  // Selected Month for Payroll view (YYYY-MM)
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState<string>(currentMonthStr);

  // Modal Dialogs State
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [isSalaryDisburseModalOpen, setIsSalaryDisburseModalOpen] = useState(false);
  const [disbursingEmployee, setDisbursingEmployee] = useState<Employee | null>(null);

  // ⚡ Batch Salary Disburse Modal
  const [isBatchDisburseModalOpen, setIsBatchDisburseModalOpen] = useState(false);
  const [batchDisburseDate, setBatchDisburseDate] = useState(new Date().toISOString().slice(0, 10));
  const [batchPaymentMethod, setBatchPaymentMethod] = useState<PaymentMethod>('CASH');
  const [batchSelectedEmpIds, setBatchSelectedEmpIds] = useState<string[]>([]);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  // Single Expense Receipt Print Modal
  const [receiptToPrint, setReceiptToPrint] = useState<ExpenseItem | null>(null);

  // Forms State: Expense
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState<number | ''>('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('OTHER');
  const [expPaymentMethod, setExpPaymentMethod] = useState<PaymentMethod>('CASH');
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [expRecipient, setExpRecipient] = useState('');
  const [expReceiptNumber, setExpReceiptNumber] = useState('');
  const [expOffice, setExpOffice] = useState('المكتب الرئيسي');
  const [expPartnerName, setExpPartnerName] = useState('مهجة');
  const [expNotes, setExpNotes] = useState('');
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Forms State: Employee
  const [empName, setEmpName] = useState('');
  const [empJobTitle, setEmpJobTitle] = useState('مندوب مبيعات');
  const [empPhone, setEmpPhone] = useState('');
  const [empBaseSalary, setEmpBaseSalary] = useState<number | ''>('');
  const [empFixedAllowances, setEmpFixedAllowances] = useState<number | ''>('');
  const [empDefaultCommissionRate, setEmpDefaultCommissionRate] = useState<number | ''>('');
  const [empStatus, setEmpStatus] = useState<'ACTIVE' | 'ON_LEAVE' | 'RESIGNED'>('ACTIVE');
  const [empJoinDate, setEmpJoinDate] = useState(new Date().toISOString().slice(0, 10));
  const [empNotes, setEmpNotes] = useState('');
  const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false);

  // Forms State: Salary Disbursement
  const [salMonth, setSalMonth] = useState(selectedPayrollMonth);
  const [salPaymentDate, setSalPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [salBaseSalary, setSalBaseSalary] = useState<number>(0);
  const [salAllowances, setSalAllowances] = useState<number>(0);
  const [salBonuses, setSalBonuses] = useState<number>(0);
  const [salCommissions, setSalCommissions] = useState<number>(0);
  const [salCommissionInvoicesCount, setSalCommissionInvoicesCount] = useState<number>(0);
  const [salDeductions, setSalDeductions] = useState<number>(0); // خصومات وجزاءات
  const [salAdvances, setSalAdvances] = useState<number>(0);     // سلف شخصية ومسحوبات
  const [salPaymentMethod, setSalPaymentMethod] = useState<PaymentMethod>('CASH');
  const [salNotes, setSalNotes] = useState('');
  const [isSubmittingSalary, setIsSubmittingSalary] = useState(false);
  const [editingSalaryPayment, setEditingSalaryPayment] = useState<SalaryPaymentRecord | null>(null);
  const [salarySlipToPrint, setSalarySlipToPrint] = useState<SalaryPaymentRecord | null>(null);
  const [expSalaryMonth, setExpSalaryMonth] = useState<string>('');

  // Available Offices extracted from expenses + default list
  const availableOffices = useMemo(() => {
    const set = new Set<string>(DEFAULT_OFFICES);
    expenses.forEach(e => {
      if (e.office && e.office.trim()) {
        set.add(e.office.trim());
      }
    });
    return Array.from(set);
  }, [expenses]);

  // Filtered Expenses for the Expenses Tab (with Month and Office isolation)
  const filteredExpenses = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const thisMonthPrefix = now.toISOString().slice(0, 7);
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthPrefix = prevMonthDate.toISOString().slice(0, 7);

    return (expenses || []).filter(item => {
      // Isolate by selected month ("ويكون كل شهر لوحده")
      if (!isAllMonthsExpenseMode) {
        if (!item.date.startsWith(selectedExpenseMonth)) return false;
      } else {
        // If in legacy quick date filter mode
        if (dateFilter === 'TODAY' && item.date !== today) return false;
        if (dateFilter === 'THIS_MONTH' && !item.date.startsWith(thisMonthPrefix)) return false;
        if (dateFilter === 'LAST_MONTH' && !item.date.startsWith(lastMonthPrefix)) return false;
        if (dateFilter === 'CUSTOM') {
          if (customStartDate && item.date < customStartDate) return false;
          if (customEndDate && item.date > customEndDate) return false;
        }
      }

      // Office filter ("كل مكتب حاجه")
      if (selectedOfficeFilter !== 'ALL') {
        const itemOffice = (item.office || 'المكتب الرئيسي').trim();
        if (itemOffice !== selectedOfficeFilter.trim()) return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;

      // Payment method filter
      if (paymentMethodFilter !== 'ALL' && item.paymentMethod !== paymentMethodFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchRecipient = (item.recipient || '').toLowerCase().includes(q);
        const matchReceipt = (item.receiptNumber || '').toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        const matchOffice = (item.office || '').toLowerCase().includes(q);
        if (!matchTitle && !matchRecipient && !matchReceipt && !matchNotes && !matchOffice) return false;
      }

      return true;
    });
  }, [expenses, isAllMonthsExpenseMode, selectedExpenseMonth, selectedOfficeFilter, dateFilter, customStartDate, customEndDate, categoryFilter, paymentMethodFilter, searchQuery]);

  // Totals for filtered expenses
  const filteredTotalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [filteredExpenses]);

  // Monthly Breakdown per Office: "كل مكتب حاجه يكون في مربع تحت بيحسب الاجمالي ويكون كل شهر لوحده"
  const officeMonthlyBreakdown = useMemo(() => {
    const monthItems = (expenses || []).filter(item => {
      if (!isAllMonthsExpenseMode) {
        return item.date.startsWith(selectedExpenseMonth);
      }
      return true;
    });

    const map: Record<string, { office: string; total: number; count: number }> = {};
    
    monthItems.forEach(item => {
      const off = (item.office || 'المكتب الرئيسي').trim();
      if (!map[off]) {
        map[off] = { office: off, total: 0, count: 0 };
      }
      map[off].total += Number(item.amount || 0);
      map[off].count += 1;
    });

    const grandTotal = Object.values(map).reduce((sum, o) => sum + o.total, 0);

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .map(o => ({
        ...o,
        percentage: grandTotal > 0 ? Math.round((o.total / grandTotal) * 100) : 0,
      }));
  }, [expenses, isAllMonthsExpenseMode, selectedExpenseMonth]);

  // Expenses Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { category: ExpenseCategory; total: number; count: number }> = {};
    filteredExpenses.forEach(item => {
      if (!map[item.category]) {
        map[item.category] = { category: item.category, total: 0, count: 0 };
      }
      map[item.category].total += Number(item.amount || 0);
      map[item.category].count += 1;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredExpenses]);

  // Helper to determine which partner a withdrawal belongs to (مهجة أو حاتم أو غيرهم)
  const getWithdrawalPartner = (item: ExpenseItem): string => {
    if (item.partnerName && item.partnerName.trim()) return item.partnerName.trim();
    const combined = `${item.title || ''} ${item.recipient || ''} ${item.notes || ''}`;
    if (combined.includes('حاتم')) return 'حاتم';
    return 'مهجة';
  };

  // 💎 Partner Withdrawals Filtered & Stats
  const partnerWithdrawals = useMemo(() => {
    return (expenses || []).filter(e => e.category === 'PARTNER_WITHDRAWAL' || e.isPartnerDrawing);
  }, [expenses]);

  const filteredPartnerWithdrawals = useMemo(() => {
    return partnerWithdrawals.filter(item => {
      const itemPartner = getWithdrawalPartner(item);
      if (selectedPartnerTab !== 'ALL' && itemPartner !== selectedPartnerTab) {
        return false;
      }
      if (selectedPartnerMonth !== 'ALL' && !item.date.startsWith(selectedPartnerMonth)) {
        return false;
      }
      if (selectedPartnerYear !== 'ALL' && !item.date.startsWith(selectedPartnerYear)) {
        return false;
      }
      if (partnerSearchQuery.trim()) {
        const q = partnerSearchQuery.trim().toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        const matchReceipt = (item.receiptNumber || '').toLowerCase().includes(q);
        const matchPartner = itemPartner.toLowerCase().includes(q);
        if (!matchTitle && !matchNotes && !matchReceipt && !matchPartner) return false;
      }
      return true;
    });
  }, [partnerWithdrawals, selectedPartnerTab, selectedPartnerMonth, selectedPartnerYear, partnerSearchQuery]);

  const partnerStats = useMemo(() => {
    const now = new Date();
    const currentMonthPrefix = now.toISOString().slice(0, 7);
    const currentYearPrefix = now.getFullYear().toString();

    let thisMonthTotal = 0;
    let thisYearTotal = 0;
    let allTimeTotal = 0;

    let mohgaTotal = 0;
    let hatemTotal = 0;

    partnerWithdrawals.forEach(item => {
      const amt = Number(item.amount || 0);
      const itemPartner = getWithdrawalPartner(item);

      if (itemPartner === 'مهجة') mohgaTotal += amt;
      else if (itemPartner === 'حاتم') hatemTotal += amt;

      const matchesPartner = selectedPartnerTab === 'ALL' || itemPartner === selectedPartnerTab;
      if (matchesPartner) {
        allTimeTotal += amt;
        if (item.date.startsWith(currentMonthPrefix)) {
          thisMonthTotal += amt;
        }
        if (item.date.startsWith(currentYearPrefix)) {
          thisYearTotal += amt;
        }
      }
    });

    const selectedPeriodTotal = filteredPartnerWithdrawals.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const currentTarget = selectedPartnerTab === 'ALL'
      ? (partnerTargets['مهجة'] || 0) + (partnerTargets['حاتم'] || 0)
      : (partnerTargets[selectedPartnerTab] || 0);

    return {
      thisMonthTotal,
      thisYearTotal,
      allTimeTotal,
      selectedPeriodTotal,
      count: filteredPartnerWithdrawals.length,
      mohgaTotal,
      hatemTotal,
      currentTarget,
    };
  }, [partnerWithdrawals, filteredPartnerWithdrawals, selectedPartnerTab, partnerTargets]);

  // Active vs Resigned Employees Separation
  const activeAndOnLeaveEmployees = useMemo(() => employees.filter(e => e.status !== 'RESIGNED'), [employees]);
  const resignedEmployees = useMemo(() => employees.filter(e => e.status === 'RESIGNED'), [employees]);
  const activeEmployees = activeAndOnLeaveEmployees;

  const totalMonthlyPayrollObligation = useMemo(() => {
    return activeAndOnLeaveEmployees.reduce((sum, e) => sum + Number(e.baseSalary || 0) + Number(e.fixedAllowances || 0), 0);
  }, [activeAndOnLeaveEmployees]);

  // Commissions calculated for each employee for selected month
  const monthlyCommissionsMap = useMemo(() => {
    return getMonthlyCommissionsOverview(invoices, employees, selectedPayrollMonth).byEmployee;
  }, [invoices, employees, selectedPayrollMonth]);

  // Payroll for selected month (with separate deductions & advances)
  const monthPayrollData = useMemo(() => {
    return employees.map(emp => {
      const existingPayment = salaryPayments.find(
        p => p.employeeId === emp.id && (p.salaryMonth || p.month) === selectedPayrollMonth && p.status === 'PAID'
      );
      const baseSalary = Number(emp.baseSalary || 0);
      const allowances = Number(emp.fixedAllowances || 0);
      const isPaid = Boolean(existingPayment);

      const commStats = monthlyCommissionsMap.get(emp.id);
      const calculatedCommissions = commStats?.totalCommissions || 0;
      const calculatedInvoicesCount = commStats?.invoicesCount || 0;

      const commissions = existingPayment?.commissions !== undefined 
        ? Number(existingPayment.commissions) 
        : calculatedCommissions;
      const commissionInvoicesCount = existingPayment?.commissionInvoicesCount !== undefined
        ? Number(existingPayment.commissionInvoicesCount)
        : calculatedInvoicesCount;

      const deductions = existingPayment ? (existingPayment.deductions || 0) : 0;
      const advances = existingPayment ? (existingPayment.advances || 0) : 0;

      const netCalculated = existingPayment
        ? existingPayment.netPaid
        : Math.max(0, baseSalary + allowances + commissions - deductions - advances);

      return {
        employee: emp,
        payment: existingPayment,
        isPaid,
        baseSalary,
        allowances,
        commissions,
        commissionInvoicesCount,
        deductions,
        advances,
        netPaid: netCalculated,
        status: isPaid ? 'PAID' : 'UNPAID',
      };
    });
  }, [employees, salaryPayments, selectedPayrollMonth, monthlyCommissionsMap]);

  // Displayed payroll data (filters out resigned employees unless showResignedInPayroll is enabled)
  const displayedPayrollData = useMemo(() => {
    if (showResignedInPayroll) return monthPayrollData;
    return monthPayrollData.filter(item => item.employee.status !== 'RESIGNED');
  }, [monthPayrollData, showResignedInPayroll]);

  const monthPayrollSummary = useMemo(() => {
    let totalObligation = 0;
    let totalPaid = 0;
    let totalCommissions = 0;
    let commissionInvoicesCount = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    monthPayrollData.forEach(item => {
      if (item.employee.status !== 'RESIGNED') {
        totalObligation += item.baseSalary + item.allowances + item.commissions;
        totalCommissions += item.commissions;
        commissionInvoicesCount += item.commissionInvoicesCount;
        if (!item.isPaid) {
          unpaidCount++;
        }
      }
      if (item.isPaid && item.payment) {
        totalPaid += item.payment.netPaid;
        paidCount++;
      }
    });

    return {
      totalObligation,
      totalPaid,
      totalCommissions,
      commissionInvoicesCount,
      remainingUnpaid: Math.max(0, totalObligation - totalPaid),
      paidCount,
      unpaidCount,
    };
  }, [monthPayrollData]);

  // Handlers: Open New Expense
  const handleOpenNewExpense = (presetCategory?: ExpenseCategory) => {
    setEditingExpense(null);
    setExpTitle('');
    setExpAmount('');
    setExpCategory(presetCategory || 'OTHER');
    setExpPaymentMethod('CASH');
    setExpDate(new Date().toISOString().slice(0, 10));
    setExpRecipient('');
    setExpReceiptNumber('');
    setExpOffice(selectedOfficeFilter !== 'ALL' ? selectedOfficeFilter : 'المكتب الرئيسي');
    setExpPartnerName(selectedPartnerTab === 'ALL' ? 'مهجة' : selectedPartnerTab);
    setExpNotes('');
    setIsExpenseFormOpen(true);
  };

  // Handlers: Open Edit Expense
  const handleOpenEditExpense = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setExpTitle(expense.title);
    setExpAmount(expense.amount);
    setExpCategory(expense.category);
    setExpPaymentMethod(expense.paymentMethod);
    setExpDate(expense.date);
    setExpRecipient(expense.recipient || '');
    setExpReceiptNumber(expense.receiptNumber || '');
    setExpOffice(expense.office || 'المكتب الرئيسي');
    setExpPartnerName(expense.partnerName || getWithdrawalPartner(expense));
    setExpNotes(expense.notes || '');
    setIsExpenseFormOpen(true);
  };

  // Handlers: Save Expense
  const handleSaveExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || Number(expAmount) <= 0) return;

    setIsSubmittingExpense(true);
    try {
      const nowIso = new Date().toISOString();
      const isPartnerDraw = expCategory === 'PARTNER_WITHDRAWAL';
      const finalPartner = isPartnerDraw ? (expPartnerName || 'مهجة') : undefined;
      const expenseToSave: ExpenseItem = {
        id: editingExpense?.id || `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        date: expDate,
        title: expTitle.trim(),
        amount: Number(expAmount),
        category: expCategory,
        paymentMethod: expPaymentMethod,
        recipient: expRecipient.trim() || (isPartnerDraw ? finalPartner : undefined),
        receiptNumber: expReceiptNumber.trim() || undefined,
        office: expOffice.trim() || undefined,
        partnerName: finalPartner,
        isPartnerDrawing: isPartnerDraw ? true : undefined,
        notes: expNotes.trim() || undefined,
        createdAt: editingExpense?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      await onSaveExpense(expenseToSave);
      setIsExpenseFormOpen(false);
      confetti({ particleCount: 30, spread: 50 });
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // Handlers: Open New Partner Withdrawal
  const handleOpenNewPartnerWithdrawal = (presetPartner?: string) => {
    const targetPartner = presetPartner || (selectedPartnerTab === 'ALL' ? 'مهجة' : selectedPartnerTab);
    setEditingPartnerWithdrawal(null);
    setPartPartnerName(targetPartner);
    setPartAmount('');
    setPartDate(new Date().toISOString().slice(0, 10));
    setPartTitle(`دفعة من الأرباح السنوية (${targetPartner})`);
    setPartPaymentMethod('CASH');
    setPartReceiptNumber('');
    setPartNotes('');
    setIsPartnerWithdrawalModalOpen(true);
  };

  // Handlers: Open Edit Partner Withdrawal
  const handleOpenEditPartnerWithdrawal = (item: ExpenseItem) => {
    setEditingPartnerWithdrawal(item);
    setPartPartnerName(getWithdrawalPartner(item));
    setPartAmount(item.amount);
    setPartDate(item.date);
    setPartTitle(item.title);
    setPartPaymentMethod(item.paymentMethod);
    setPartReceiptNumber(item.receiptNumber || '');
    setPartNotes(item.notes || '');
    setIsPartnerWithdrawalModalOpen(true);
  };

  // Handlers: Save Partner Withdrawal
  const handleSavePartnerWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(partAmount) <= 0) return;

    setIsSubmittingPartnerWithdrawal(true);
    try {
      const nowIso = new Date().toISOString();
      const partner = partPartnerName || 'مهجة';
      const withdrawalToSave: ExpenseItem = {
        id: editingPartnerWithdrawal?.id || `exp-part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        date: partDate,
        title: partTitle.trim() || `مسحوبات أرباح - ${partner}`,
        amount: Number(partAmount),
        category: 'PARTNER_WITHDRAWAL',
        paymentMethod: partPaymentMethod,
        recipient: partner,
        receiptNumber: partReceiptNumber.trim() || undefined,
        office: 'مسحوبات الشركاء',
        partnerName: partner,
        isPartnerDrawing: true,
        notes: partNotes.trim() || undefined,
        createdAt: editingPartnerWithdrawal?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      await onSaveExpense(withdrawalToSave);
      setIsPartnerWithdrawalModalOpen(false);
      confetti({ particleCount: 35, spread: 50 });
    } finally {
      setIsSubmittingPartnerWithdrawal(false);
    }
  };

  // Handlers: Open New Employee
  const handleOpenNewEmployee = () => {
    setEditingEmployee(null);
    setEmpName('');
    setEmpJobTitle('مندوب مبيعات');
    setEmpPhone('');
    setEmpBaseSalary('');
    setEmpFixedAllowances('');
    setEmpDefaultCommissionRate('');
    setEmpStatus('ACTIVE');
    setEmpJoinDate(new Date().toISOString().slice(0, 10));
    setEmpNotes('');
    setIsEmployeeFormOpen(true);
  };

  // Handlers: Open Edit Employee
  const handleOpenEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmpName(emp.name);
    setEmpJobTitle(emp.jobTitle);
    setEmpPhone(emp.phone || '');
    setEmpBaseSalary(emp.baseSalary);
    setEmpFixedAllowances(emp.fixedAllowances || '');
    setEmpDefaultCommissionRate(emp.defaultCommissionRate ?? '');
    setEmpStatus(emp.status);
    setEmpJoinDate(emp.joinDate || new Date().toISOString().slice(0, 10));
    setEmpNotes(emp.notes || '');
    setIsEmployeeFormOpen(true);
  };

  // Handlers: Save Employee
  const handleSaveEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || Number(empBaseSalary) < 0) return;

    setIsSubmittingEmployee(true);
    try {
      const nowIso = new Date().toISOString();
      const employeeToSave: Employee = {
        id: editingEmployee?.id || `emp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: empName.trim(),
        jobTitle: empJobTitle.trim(),
        phone: empPhone.trim() || undefined,
        baseSalary: Number(empBaseSalary),
        fixedAllowances: Number(empFixedAllowances) || 0,
        defaultCommissionRate: empDefaultCommissionRate === '' ? undefined : Number(empDefaultCommissionRate),
        status: empStatus,
        joinDate: empJoinDate,
        notes: empNotes.trim() || undefined,
        createdAt: editingEmployee?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      await onSaveEmployee(employeeToSave);
      setIsEmployeeFormOpen(false);
      confetti({ particleCount: 25, spread: 40 });
    } finally {
      setIsSubmittingEmployee(false);
    }
  };

  // Handlers: Open Salary Disbursement for single employee (supports deductions & advances)
  const handleOpenDisburseSalary = (emp: Employee, paymentToEdit?: SalaryPaymentRecord) => {
    const existing = paymentToEdit || salaryPayments.find(
      p => p.employeeId === emp.id && (p.salaryMonth || p.month) === selectedPayrollMonth
    );
    setEditingSalaryPayment(existing || null);
    setDisbursingEmployee(emp);

    const initialMonth = existing?.salaryMonth || existing?.month || selectedPayrollMonth;
    setSalMonth(initialMonth);

    // CRITICAL (Req 2, 4, 8): If editing existing payment, preserve real paymentDate!
    // Default to today only for a brand new payment.
    setSalPaymentDate(existing?.paymentDate || new Date().toISOString().slice(0, 10));

    setSalBaseSalary(existing ? existing.baseSalary : Number(emp.baseSalary || 0));
    setSalAllowances(existing ? existing.allowances : Number(emp.fixedAllowances || 0));
    setSalBonuses(existing ? existing.bonuses : 0);

    const stats = getEmployeeCommissionStats(invoices, emp.id, initialMonth);
    setSalCommissions(existing?.commissions !== undefined ? existing.commissions : stats.totalCommissions);
    setSalCommissionInvoicesCount(existing?.commissionInvoicesCount !== undefined ? existing.commissionInvoicesCount : stats.invoicesCount);
    setSalDeductions(existing ? (existing.deductions || 0) : 0);
    setSalAdvances(existing?.advances !== undefined ? (existing.advances || 0) : 0);
    setSalPaymentMethod(existing ? existing.paymentMethod : 'CASH');
    setSalNotes(existing?.notes || '');
    setIsSalaryDisburseModalOpen(true);
  };

  // Handlers: Save Salary Disbursement
  const handleSaveSalaryDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disbursingEmployee) return;

    setIsSubmittingSalary(true);
    try {
      const netToPay = Math.max(0, salBaseSalary + salAllowances + salBonuses + salCommissions - salDeductions - salAdvances);
      const nowIso = new Date().toISOString();

      // If editing existing payment, preserve record ID so it updates in-place without duplicating
      const recordId = editingSalaryPayment?.id || `sal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const paymentRecord: SalaryPaymentRecord = {
        id: recordId,
        employeeId: disbursingEmployee.id,
        employeeName: disbursingEmployee.name,
        month: salMonth, // Backward compatibility
        salaryMonth: salMonth, // Req 1 & 4: Explicit Salary Month (YYYY-MM)
        paymentDate: salPaymentDate, // Req 2 & 7: Actual Cash Payment Date (YYYY-MM-DD)
        baseSalary: salBaseSalary,
        allowances: salAllowances,
        bonuses: salBonuses,
        commissions: salCommissions,
        commissionInvoicesCount: salCommissionInvoicesCount,
        deductions: salDeductions,
        advances: salAdvances,
        netPaid: netToPay,
        paymentMethod: salPaymentMethod,
        notes: salNotes.trim() || undefined,
        status: 'PAID',
        createdAt: editingSalaryPayment?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      await onSaveSalaryPayment(paymentRecord, true);
      setIsSalaryDisburseModalOpen(false);
      setEditingSalaryPayment(null);
      confetti({ particleCount: 40, spread: 60 });
    } finally {
      setIsSubmittingSalary(false);
    }
  };

  // ⚡ Batch Unpaid List & Total Calculation
  const batchUnpaidList = useMemo(() => {
    return displayedPayrollData.filter(d => !d.isPaid);
  }, [displayedPayrollData]);

  const batchTotalAmount = useMemo(() => {
    return batchUnpaidList
      .filter(d => batchSelectedEmpIds.includes(d.employee.id))
      .reduce((sum, d) => sum + d.netPaid, 0);
  }, [batchUnpaidList, batchSelectedEmpIds]);

  // Handlers: Open Batch Salary Disbursement
  const handleOpenBatchSalaryDisburse = () => {
    const unpaidIds = displayedPayrollData.filter(d => !d.isPaid).map(d => d.employee.id);
    setBatchSelectedEmpIds(unpaidIds);
    setBatchDisburseDate(new Date().toISOString().slice(0, 10));
    setBatchPaymentMethod('CASH');
    setIsBatchDisburseModalOpen(true);
  };

  // Handlers: Save Batch Salary Disbursement Submit
  const handleSaveBatchSalaryDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchSelectedEmpIds.length === 0) return;

    setIsSubmittingBatch(true);
    try {
      const nowIso = new Date().toISOString();
      const targetItems = batchUnpaidList.filter(d => batchSelectedEmpIds.includes(d.employee.id));

      for (const item of targetItems) {
        const emp = item.employee;
        const recordId = `sal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const paymentRecord: SalaryPaymentRecord = {
          id: recordId,
          employeeId: emp.id,
          employeeName: emp.name,
          month: selectedPayrollMonth,
          salaryMonth: selectedPayrollMonth,
          paymentDate: batchDisburseDate,
          baseSalary: item.baseSalary,
          allowances: item.allowances,
          bonuses: item.payment?.bonuses || 0,
          commissions: item.commissions,
          commissionInvoicesCount: item.commissionInvoicesCount,
          deductions: item.deductions,
          advances: item.advances,
          netPaid: item.netPaid,
          paymentMethod: batchPaymentMethod,
          notes: `صرف جماعي - ${formatArabicMonth(selectedPayrollMonth)}`,
          status: 'PAID',
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        await onSaveSalaryPayment(paymentRecord, true);
      }

      setIsBatchDisburseModalOpen(false);
      confetti({ particleCount: 50, spread: 80 });
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  // Export Expenses to CSV
  const handleExportExpensesCSV = () => {
    const headers = ['التاريخ', 'بند المصروف', 'التصنيف', 'المكتب / الفرع', 'المبلغ (ج.م)', 'طريقة الدفع', 'المستلم / الجهة', 'رقم السند/الإيصال', 'ملاحظات'];
    const rows = filteredExpenses.map(e => [
      e.date,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${CATEGORY_CONFIG[e.category]?.label || e.category}"`,
      `"${(e.office || 'المكتب الرئيسي').replace(/"/g, '""')}"`,
      e.amount,
      `"${PAYMENT_METHOD_LABELS[e.paymentMethod]?.label || e.paymentMethod}"`,
      `"${(e.recipient || '—').replace(/"/g, '""')}"`,
      `"${(e.receiptNumber || '—').replace(/"/g, '""')}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses_report_${selectedExpenseMonth}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export Payroll to CSV
  const handleExportPayrollCSV = () => {
    const headers = [
      'اسم الموظف',
      'الوظيفة',
      'الهاتف',
      'شهر الراتب المستحق (Salary Month)',
      'تاريخ الصرف الفعلي (Payment Date)',
      'الراتب الأساسي',
      'البدلات',
      'المكافآت',
      'عمولات المبيعات',
      'الخصومات',
      'السلف الشخصية',
      'الصافي المستحق/المدفوع',
      'حالة الصرف',
      'طريقة الصرف',
      'ملاحظات الصرف',
    ];
    const rows = monthPayrollData.map(item => [
      `"${item.employee.name.replace(/"/g, '""')}"`,
      `"${item.employee.jobTitle.replace(/"/g, '""')}"`,
      item.employee.phone || '—',
      item.payment?.salaryMonth || item.payment?.month || selectedPayrollMonth,
      item.payment?.paymentDate || '—',
      item.baseSalary,
      item.allowances,
      item.payment?.bonuses || 0,
      item.commissions || 0,
      item.deductions || 0,
      item.advances || 0,
      item.netPaid,
      item.isPaid ? 'تم الصرف' : 'متبقي',
      item.payment ? (PAYMENT_METHOD_LABELS[item.payment.paymentMethod]?.label || item.payment.paymentMethod) : '—',
      `"${(item.payment?.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payroll_report_${selectedPayrollMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Print Window Helper
  const handlePrintPayrollSheet = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 text-right" dir="rtl">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  إدارة المصروفات التشغيلية والرواتب
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {expenses.length} حركة مصروف
                </span>
                <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {employees.length} موظف وعامل
                </span>
              </div>
              <p className="text-xs text-slate-400">
                تسجيل المصاريف اليومية، مسير رواتب الموظفين، وحساب صافي التدفقات النقدية بدقة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Sub-Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-900/90 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('EXPENSES')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'EXPENSES'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>سجل المصروفات العامة والمكاتب</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-950/40 text-slate-200 font-mono">
                {filteredExpenses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('PARTNER_SHEET')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'PARTNER_SHEET'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Crown className="w-4 h-4 text-cyan-300" />
              <span>شيت مسحوبات الشركاء (مهجة / حاتم)</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-950/40 text-cyan-200 font-mono">
                {partnerWithdrawals.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('PAYROLL')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'PAYROLL'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>مسير الرواتب الشهري</span>
              {monthPayrollSummary.unpaidCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('EMPLOYEES')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'EMPLOYEES'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>سجل الموظفين والعمال</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-950/40 text-emerald-300 font-mono font-bold">
                {activeAndOnLeaveEmployees.length}
              </span>
              {resignedEmployees.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-rose-950/60 text-rose-300 border border-rose-800/40 font-mono">
                  {resignedEmployees.length} مستقيل
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ANALYTICS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ANALYTICS'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>تحليلات وهيكل التكاليف</span>
            </button>
          </div>

          {/* Quick Action in Current Tab */}
          <div className="flex items-center gap-2">
            {activeTab === 'EXPENSES' && (
              <>
                <button
                  onClick={handleExportExpensesCSV}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-xl transition-all cursor-pointer"
                  title="تصدير المصروفات إلى ملف Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">تصدير Excel</span>
                </button>
                <button
                  onClick={() => handleOpenNewExpense()}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 rounded-xl shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل مصروف جديد</span>
                </button>
              </>
            )}

            {activeTab === 'PARTNER_SHEET' && (
              <button
                onClick={() => handleOpenNewPartnerWithdrawal(selectedPartnerTab === 'ALL' ? 'مهجة' : selectedPartnerTab)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {selectedPartnerTab === 'حاتم'
                    ? 'تسجيل سحب جديد (حاتم)'
                    : selectedPartnerTab === 'مهجة'
                    ? 'تسجيل سحب جديد (مهجة)'
                    : 'تسجيل سحب جديد لشريك'}
                </span>
              </button>
            )}

            {activeTab === 'EMPLOYEES' && (
              <button
                onClick={handleOpenNewEmployee}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>إضافة موظف / عامل جديد</span>
              </button>
            )}

            {activeTab === 'PAYROLL' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPayrollCSV}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">تصدير الكشف</span>
                </button>
                <button
                  onClick={handlePrintPayrollSheet}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة مسير الرواتب</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* ========================================================================= */}
          {/* TAB 1: EXPENSES LIST & FILTERS */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* TAB 1: EXPENSES LIST & FILTERS (مع فلترة المكاتب والشهور المستقلة ومربع الإجمالي) */}
          {/* ========================================================================= */}
          {activeTab === 'EXPENSES' && (
            <div className="space-y-5">
              
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">
                      إجمالي مصروفات ({isAllMonthsExpenseMode ? 'كل الشهور' : selectedExpenseMonth})
                    </span>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400 mt-1">
                      {filteredTotalAmount.toLocaleString()} <span className="text-xs text-slate-400 font-sans">ج.م</span>
                    </div>
                    {selectedOfficeFilter !== 'ALL' && (
                      <span className="text-[10px] text-purple-300 bg-purple-950/60 border border-purple-800/60 px-1.5 py-0.5 rounded mt-1 inline-block">
                        مكتب: {selectedOfficeFilter}
                      </span>
                    )}
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">عدد حركات الصرف</span>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                      {filteredExpenses.length} <span className="text-xs text-slate-400 font-sans">حركة</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {selectedOfficeFilter === 'ALL' ? 'لكل المكاتب' : selectedOfficeFilter}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-slate-700/50 border border-slate-600/50 flex items-center justify-center text-slate-300">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">أعلى مكتب استهلاكاً</span>
                    <div className="text-sm sm:text-base font-bold text-amber-300 mt-1 truncate max-w-[140px]">
                      {officeMonthlyBreakdown[0] ? officeMonthlyBreakdown[0].office : '—'}
                    </div>
                    {officeMonthlyBreakdown[0] && (
                      <span className="text-[11px] font-mono text-slate-400">
                        {officeMonthlyBreakdown[0].total.toLocaleString()} ج.م ({officeMonthlyBreakdown[0].percentage}%)
                      </span>
                    )}
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">التزامات رواتب الموظفين</span>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-purple-400 mt-1">
                      {totalMonthlyPayrollObligation.toLocaleString()} <span className="text-xs text-slate-400 font-sans">ج/شهر</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Filter Controls Bar (الشهر بشكل مستقل + المكتب) */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Month Navigation & Isolation ("ويكون كل شهر لوحده") */}
                  <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 text-xs gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAllMonthsExpenseMode(false);
                        const [y, m] = selectedExpenseMonth.split('-').map(Number);
                        const prev = new Date(y, m - 2, 1);
                        setSelectedExpenseMonth(prev.toISOString().slice(0, 7));
                      }}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="الشهر السابق"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-1.5 px-1">
                      <Calendar className="w-3.5 h-3.5 text-rose-400" />
                      {!isAllMonthsExpenseMode && (
                        <span className="text-xs font-bold text-rose-300 whitespace-nowrap">
                          {formatArabicMonth(selectedExpenseMonth)}
                        </span>
                      )}
                      <input
                        type="month"
                        value={selectedExpenseMonth}
                        onChange={e => {
                          setSelectedExpenseMonth(e.target.value);
                          setIsAllMonthsExpenseMode(false);
                        }}
                        className="bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs rounded-lg px-2 py-1 outline-none focus:border-rose-500 cursor-pointer"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAllMonthsExpenseMode(false);
                        const [y, m] = selectedExpenseMonth.split('-').map(Number);
                        const next = new Date(y, m, 1);
                        setSelectedExpenseMonth(next.toISOString().slice(0, 7));
                      }}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="الشهر التالي"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedExpenseMonth(currentMonthStr);
                        setIsAllMonthsExpenseMode(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        !isAllMonthsExpenseMode && selectedExpenseMonth === currentMonthStr
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      هذا الشهر
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAllMonthsExpenseMode(!isAllMonthsExpenseMode)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        isAllMonthsExpenseMode
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      كل الشهور
                    </button>
                  </div>

                  {/* Office Filter ("كل مكتب حاجه") */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs">
                    <Building2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="text-slate-400 font-semibold shrink-0">المكتب:</span>
                    <select
                      value={selectedOfficeFilter}
                      onChange={e => setSelectedOfficeFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 outline-none focus:border-rose-500 cursor-pointer font-medium"
                    >
                      <option value="ALL">جميع المكاتب والفروع ({availableOffices.length})</option>
                      {availableOffices.map(off => (
                        <option key={off} value={off}>
                          {off}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Dropdown */}
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="ALL">جميع التصنيفات</option>
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>

                  {/* Payment Method Dropdown */}
                  <select
                    value={paymentMethodFilter}
                    onChange={e => setPaymentMethodFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="ALL">جميع طرق الدفع</option>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="بحث في الوصف، المكتب، السند..."
                    className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl pr-9 pl-3 py-2 outline-none focus:border-rose-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expenses Data Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                {filteredExpenses.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                      <TrendingDown className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-slate-300">
                      لا توجد حركات مصروفات تطابق البحث أو الفلترة لشهر ({isAllMonthsExpenseMode ? 'كل الشهور' : selectedExpenseMonth})
                    </p>
                    <button
                      onClick={() => handleOpenNewExpense()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/30 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة أول مصروف الآن</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs text-slate-300">
                      <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold">
                        <tr>
                          <th className="py-3 px-4">التاريخ</th>
                          <th className="py-3 px-4">بند / وصف المصروف</th>
                          <th className="py-3 px-4">المكتب / الفرع</th>
                          <th className="py-3 px-4">التصنيف</th>
                          <th className="py-3 px-4">طريقة الدفع</th>
                          <th className="py-3 px-4">المستلم / الجهة</th>
                          <th className="py-3 px-4">رقم السند</th>
                          <th className="py-3 px-4 text-left font-mono">المبلغ</th>
                          <th className="py-3 px-4 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {filteredExpenses.map(expense => {
                          const catConfig = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.OTHER;
                          const CatIcon = catConfig.icon;
                          const payConfig = PAYMENT_METHOD_LABELS[expense.paymentMethod] || PAYMENT_METHOD_LABELS.CASH;

                          return (
                            <tr key={expense.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                                {expense.date}
                              </td>
                              <td className="py-3 px-4 font-bold text-white">
                                <div>{expense.title}</div>
                                {expense.notes && (
                                  <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs">{expense.notes}</div>
                                )}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-900 border border-slate-800 text-slate-200">
                                  <Building2 className="w-3 h-3 text-rose-400" />
                                  <span>{expense.office || 'المكتب الرئيسي'}</span>
                                </span>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}>
                                  <CatIcon className="w-3 h-3" />
                                  <span>{catConfig.label}</span>
                                </span>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                                <span className="inline-flex items-center gap-1 text-[11px] bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                                  {payConfig.label}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                                {expense.recipient || '—'}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                                {expense.receiptNumber || '—'}
                              </td>
                              <td className="py-3 px-4 text-left font-mono font-bold text-rose-400 text-sm whitespace-nowrap">
                                {expense.amount.toLocaleString()} <span className="text-[11px] font-sans text-slate-400">ج.م</span>
                              </td>
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => setReceiptToPrint(expense)}
                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                    title="طباعة إيصال / سند صرف"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditExpense(expense)}
                                    className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                    title="تعديل المصروف"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`هل أنت متأكد من حذف مصروف (${expense.title}) بقيمة ${expense.amount} ج.م؟`)) {
                                        onDeleteExpense(expense.id);
                                      }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                    title="حذف"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-900/95 font-bold text-white border-t-2 border-slate-700">
                        <tr>
                          <td colSpan={7} className="py-3 px-4 text-left">
                            إجمالي المصروفات في هذا الجدول ({isAllMonthsExpenseMode ? 'كل الشهور' : selectedExpenseMonth}):
                          </td>
                          <td className="py-3 px-4 text-left font-mono text-base text-rose-400">
                            {filteredTotalAmount.toLocaleString()} ج.م
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* BOTTOM TOTAL SUMMARY BOX - مربع الإجمالي الشهري والمكاتب */}
              {/* ("وفي بند المصروف عايزه كل مكتب حاجه يكون في مربع تحت بيحسب الاجمالي ويكون كل شهر لوحده") */}
              {/* ========================================================================= */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-5 shadow-2xl">
                {/* Main Box Header & Total */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">مربع ملخص الإجمالي:</span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-rose-950/60 border border-rose-800/60 text-rose-300 font-mono">
                          {isAllMonthsExpenseMode ? 'جميع الشهور' : `شهر ${selectedExpenseMonth}`}
                        </span>
                        {selectedOfficeFilter !== 'ALL' && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-purple-950/60 border border-purple-800/60 text-purple-300">
                            مكتب: {selectedOfficeFilter}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        {selectedOfficeFilter === 'ALL'
                          ? `إجمالي مصروفات كل المكاتب لشهر (${selectedExpenseMonth})`
                          : `إجمالي مصروفات (${selectedOfficeFilter}) لشهر (${selectedExpenseMonth})`}
                      </h3>
                    </div>
                  </div>

                  <div className="text-left bg-slate-900 border border-slate-700/80 px-5 py-3 rounded-2xl shadow-inner">
                    <span className="text-[11px] text-slate-400 block font-semibold">المبلغ الإجمالي المحسوب:</span>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-rose-400">
                      {filteredTotalAmount.toLocaleString()} <span className="text-xs font-sans text-slate-400 font-normal">ج.م</span>
                    </div>
                    <span className="block text-[11px] text-slate-400 font-medium mt-0.5">
                      من إجمالي {filteredExpenses.length} حركة صرف مسجلة
                    </span>
                  </div>
                </div>

                {/* Individual Office Breakdown Boxes ("كل مكتب حاجة يكون في مربع تحت بيحسب الإجمالي") */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-rose-400" />
                      <span>مربعات إجمالي كل مكتب على حدة لهذا الشهر ({isAllMonthsExpenseMode ? 'كل الشهور' : `شهر ${selectedExpenseMonth}`}):</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      اضغط على أي مكتب لتصفيته وعرض بنوده فقط
                    </span>
                  </div>

                  {officeMonthlyBreakdown.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500">
                      لا توجد مصروفات مسجلة للمكاتب في هذا الشهر
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {officeMonthlyBreakdown.map(item => {
                        const isSelected = selectedOfficeFilter === item.office;
                        return (
                          <button
                            key={item.office}
                            type="button"
                            onClick={() => setSelectedOfficeFilter(isSelected ? 'ALL' : item.office)}
                            className={`p-3.5 rounded-xl text-right transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-rose-950/50 border-rose-500 ring-2 ring-rose-500/50 shadow-lg shadow-rose-950/40'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/70'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-white truncate max-w-[130px]">{item.office}</span>
                              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/50">
                                {item.count} حركة
                              </span>
                            </div>

                            <div className="mt-2 text-lg font-bold font-mono text-rose-400">
                              {item.total.toLocaleString()} <span className="text-[10px] font-sans text-slate-400">ج.م</span>
                            </div>

                            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                              <span>نسبة من إجمالي الشهر:</span>
                              <span className="font-mono font-bold text-slate-200">{item.percentage}%</span>
                            </div>

                            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                              <div
                                className="bg-rose-500 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, item.percentage)}%` }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1.5: PARTNER SHEET - شيت مسحوبات الشركاء من الأرباح السنوية (مهجة / حاتم) */}
          {/* ========================================================================= */}
          {activeTab === 'PARTNER_SHEET' && (
            <div className="space-y-5">
              
              {/* Partner Switcher Pills: مهجة vs حاتم vs الكل */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-slate-950/90 border border-slate-800 rounded-2xl shadow-lg">
                <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPartnerTab('مهجة')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedPartnerTab === 'مهجة'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30 ring-2 ring-cyan-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-cyan-300" />
                    <span>شيت مسحوبات الشريكة (مهجة)</span>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-950/60 text-cyan-200 font-mono font-bold">
                      {partnerWithdrawals.filter(w => getWithdrawalPartner(w) === 'مهجة').length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPartnerTab('حاتم')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedPartnerTab === 'حاتم'
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-amber-300" />
                    <span>شيت مسحوبات الشريك (حاتم)</span>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-950/60 text-amber-200 font-mono font-bold">
                      {partnerWithdrawals.filter(w => getWithdrawalPartner(w) === 'حاتم').length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPartnerTab('ALL')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedPartnerTab === 'ALL'
                        ? 'bg-slate-800 text-white border border-slate-600 shadow-md ring-2 ring-slate-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Scale className="w-4 h-4 text-indigo-400" />
                    <span>ملخص إجمالي الشركاء (مهجة + حاتم)</span>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-950/60 text-indigo-200 font-mono font-bold">
                      {partnerWithdrawals.length}
                    </span>
                  </button>

                  {/* Custom added partners if any */}
                  {customPartners.map(pName => (
                    <button
                      key={pName}
                      type="button"
                      onClick={() => setSelectedPartnerTab(pName)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                        selectedPartnerTab === pName
                          ? 'bg-cyan-700 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <Crown className="w-4 h-4 text-cyan-300" />
                      <span>شيت ({pName})</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {isAddingNewPartner ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newPartnerNameInput}
                        onChange={e => setNewPartnerNameInput(e.target.value)}
                        placeholder="اسم الشريك الجديد..."
                        className="bg-slate-900 border border-cyan-500 text-white text-xs rounded-xl px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-cyan-400 w-36"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const name = newPartnerNameInput.trim();
                          if (name && !customPartners.includes(name) && name !== 'مهجة' && name !== 'حاتم') {
                            const updated = [...customPartners, name];
                            setCustomPartners(updated);
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('fawateer_custom_partners', JSON.stringify(updated));
                            }
                            setSelectedPartnerTab(name);
                          }
                          setNewPartnerNameInput('');
                          setIsAddingNewPartner(false);
                        }}
                        className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        إضافة
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPartnerNameInput('');
                          setIsAddingNewPartner(false);
                        }}
                        className="px-2 py-1.5 bg-slate-800 text-slate-400 hover:text-white text-xs rounded-lg cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewPartner(true)}
                      className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-cyan-300 hover:bg-slate-900 border border-slate-800 rounded-xl transition-colors cursor-pointer"
                      title="إضافة شريك آخر"
                    >
                      + شريك إضافي
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenNewPartnerWithdrawal(selectedPartnerTab === 'ALL' ? 'مهجة' : selectedPartnerTab)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-cyan-600/30 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {selectedPartnerTab === 'حاتم'
                        ? 'تسجيل سحب جديد (حاتم)'
                        : selectedPartnerTab === 'مهجة'
                        ? 'تسجيل سحب جديد (مهجة)'
                        : 'تسجيل سحب جديد'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Partner Banner */}
              <div className={`p-4 sm:p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 shadow-xl transition-all ${
                selectedPartnerTab === 'حاتم'
                  ? 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-orange-950/70 border-amber-500/40'
                  : selectedPartnerTab === 'مهجة'
                  ? 'bg-gradient-to-r from-cyan-950/70 via-slate-900 to-blue-950/70 border-cyan-500/40'
                  : 'bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-950 border-indigo-500/40'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner ${
                    selectedPartnerTab === 'حاتم'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : selectedPartnerTab === 'مهجة'
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  }`}>
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold flex items-center gap-1 ${
                        selectedPartnerTab === 'حاتم' ? 'text-amber-400' : selectedPartnerTab === 'مهجة' ? 'text-cyan-400' : 'text-indigo-400'
                      }`}>
                        <Sparkles className="w-3 h-3" />
                        <span>شيت مسحوبات الشركاء من الأرباح السنوية</span>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        selectedPartnerTab === 'حاتم'
                          ? 'bg-amber-900/60 border-amber-700/60 text-amber-200'
                          : selectedPartnerTab === 'مهجة'
                          ? 'bg-cyan-900/60 border-cyan-700/60 text-cyan-200'
                          : 'bg-indigo-900/60 border-indigo-700/60 text-indigo-200'
                      }`}>
                        حصة الأرباح السنوية
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 mt-1">
                      <h3 className="text-lg sm:text-xl font-black text-white">
                        {selectedPartnerTab === 'حاتم' ? (
                          <>حساب ومسحوبات الشريك: <span className="text-amber-300 font-extrabold underline decoration-amber-500/50 underline-offset-4">حاتم</span></>
                        ) : selectedPartnerTab === 'مهجة' ? (
                          <>حساب ومسحوبات الشريكة: <span className="text-cyan-300 font-extrabold underline decoration-cyan-500/50 underline-offset-4">مهجة</span></>
                        ) : (
                          <>شيت مسحوبات جميع الشركاء: <span className="text-indigo-300 font-extrabold">مهجة وحاتم</span></>
                        )}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">
                      {selectedPartnerTab === 'حاتم'
                        ? 'سجل مخصص لقيد أي مصاريف أو سحوبات خاصة بالشريك (حاتم) لتسويتها من صافي الأرباح السنوية دون تحميلها على مصاريف التشغيل اليومية.'
                        : selectedPartnerTab === 'مهجة'
                        ? 'سجل مخصص لقيد أي مصاريف أو سحوبات خاصة بالشريكة (مهجة) لتسويتها من صافي الأرباح السنوية دون تحميلها على مصاريف التشغيل اليومية.'
                        : 'سجل مجمع لمتابعة مسحوبات الشركاء (مهجة وحاتم) ومقارنتها بالحصة المقدرة من توزيعات الأرباح السنوية.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenNewPartnerWithdrawal(selectedPartnerTab === 'ALL' ? 'مهجة' : selectedPartnerTab)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {selectedPartnerTab === 'حاتم'
                        ? 'تسجيل سحب جديد (حاتم)'
                        : selectedPartnerTab === 'مهجة'
                        ? 'تسجيل سحب جديد (مهجة)'
                        : 'تسجيل سحب جديد'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Partner KPI Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">مسحوبات هذا الشهر ({new Date().toISOString().slice(0, 7)})</span>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400 mt-1">
                      {partnerStats.thisMonthTotal.toLocaleString()} <span className="text-xs text-slate-400 font-sans">ج.م</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {selectedPartnerTab === 'ALL' ? 'كل الشركاء' : `خاص بـ ${selectedPartnerTab}`}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">مسحوبات السنة ({new Date().getFullYear()})</span>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1">
                      {partnerStats.thisYearTotal.toLocaleString()} <span className="text-xs text-slate-400 font-sans">ج.م</span>
                    </div>
                    <span className="text-[10px] text-slate-400">إجمالي مسحوبات السنة الحالية</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Crown className="w-5 h-5" />
                  </div>
                </div>

                {selectedPartnerTab === 'ALL' ? (
                  <>
                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 font-medium">مسحوبات الشريكة (مهجة)</span>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-300 mt-1">
                          {partnerStats.mohgaTotal.toLocaleString()} <span className="text-xs text-slate-400 font-sans">ج.م</span>
                        </div>
                        <span className="text-[10px] text-slate-400">إجمالي سحوبات مهجة التاريخية</span>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300">
                        <Crown className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 font-medium">مسحوبات الشريك (حاتم)</span>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300 mt-1">
                          {partnerStats.hatemTotal.toLocaleString()} <span className="text-xs text-slate-400 font-sans">ج.م</span>
                        </div>
                        <span className="text-[10px] text-slate-400">إجمالي سحوبات حاتم التاريخية</span>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300">
                        <Crown className="w-5 h-5" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 font-medium">إجمالي كل المسحوبات المسجلة</span>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                          {partnerStats.allTimeTotal.toLocaleString()} <span className="text-xs text-slate-400 font-sans">ج.م</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {filteredPartnerWithdrawals.length} حركة سحب مسجلة
                        </span>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-slate-700/50 border border-slate-600/50 flex items-center justify-center text-slate-300">
                        <TrendingDown className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs text-slate-400 font-medium">حصة الأرباح السنوية ({selectedPartnerTab})</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="number"
                            min="0"
                            value={partnerTargets[selectedPartnerTab] || ''}
                            onChange={e => handleSavePartnerTarget(selectedPartnerTab, Number(e.target.value))}
                            placeholder="أدخل الحصة المقدرة..."
                            className="w-28 bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold text-xs rounded-lg px-2 py-1 outline-none focus:border-emerald-500"
                          />
                          <span className="text-xs text-slate-400">ج.م</span>
                        </div>
                        {(partnerTargets[selectedPartnerTab] || 0) > 0 && (
                          <span className="text-[10px] text-emerald-300 block mt-1">
                            المتبقي: {((partnerTargets[selectedPartnerTab] || 0) - partnerStats.thisYearTotal).toLocaleString()} ج.م
                          </span>
                        )}
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <DollarSign className="w-5 h-5" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Partner Sheet Filter Controls Bar (كل شهر لوحده) */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Monthly selector ("ويكون كل شهر لوحده") */}
                  <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 text-xs gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const base = selectedPartnerMonth === 'ALL' ? currentMonthStr : selectedPartnerMonth;
                        setSelectedPartnerMonth(shiftMonthStr(base, -1));
                      }}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="الشهر السابق"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1.5 px-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      {selectedPartnerMonth !== 'ALL' && (
                        <span className="text-xs font-bold text-cyan-300 whitespace-nowrap">
                          {formatArabicMonth(selectedPartnerMonth)}
                        </span>
                      )}
                      <input
                        type="month"
                        value={selectedPartnerMonth === 'ALL' ? '' : selectedPartnerMonth}
                        onChange={e => setSelectedPartnerMonth(e.target.value || 'ALL')}
                        className="bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs rounded-lg px-2 py-1 outline-none focus:border-cyan-500 cursor-pointer"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const base = selectedPartnerMonth === 'ALL' ? currentMonthStr : selectedPartnerMonth;
                        setSelectedPartnerMonth(shiftMonthStr(base, 1));
                      }}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="الشهر التالي"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPartnerMonth(currentMonthStr)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        selectedPartnerMonth === currentMonthStr
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      هذا الشهر
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPartnerMonth('ALL')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        selectedPartnerMonth === 'ALL'
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      كل شهور السنة
                    </button>
                  </div>

                  {/* Year selector */}
                  <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs gap-1.5">
                    <span className="text-slate-400 font-semibold">السنة:</span>
                    <select
                      value={selectedPartnerYear}
                      onChange={e => setSelectedPartnerYear(e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 outline-none focus:border-cyan-500 cursor-pointer font-mono font-bold"
                    >
                      <option value="ALL">جميع السنوات</option>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                    </select>
                  </div>
                </div>

                {/* Search query */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={partnerSearchQuery}
                    onChange={e => setPartnerSearchQuery(e.target.value)}
                    placeholder="بحث في البيان أو الشريك أو السند..."
                    className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl pr-9 pl-3 py-2 outline-none focus:border-cyan-500"
                  />
                  {partnerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setPartnerSearchQuery('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Partner Withdrawals Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                {filteredPartnerWithdrawals.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-center mx-auto text-cyan-400">
                      <Crown className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-slate-300">
                      لا توجد مسحوبات مسجلة لـ ({selectedPartnerTab === 'ALL' ? 'الشركاء' : selectedPartnerTab}) في الفترة المحددة
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenNewPartnerWithdrawal(selectedPartnerTab === 'ALL' ? 'مهجة' : selectedPartnerTab)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-cyan-600/30 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>تسجيل أول دفعة مسحوبات الآن</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs text-slate-300">
                      <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold">
                        <tr>
                          <th className="py-3 px-4">التاريخ</th>
                          <th className="py-3 px-4">بيان / وصف المسحوب</th>
                          <th className="py-3 px-4">طريقة التحويل / الصرف</th>
                          <th className="py-3 px-4">الشريك المستفيد</th>
                          <th className="py-3 px-4">رقم السند / الإيصال</th>
                          <th className="py-3 px-4 text-left font-mono">المبلغ المسحوب</th>
                          <th className="py-3 px-4 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {filteredPartnerWithdrawals.map(item => {
                          const payConfig = PAYMENT_METHOD_LABELS[item.paymentMethod] || PAYMENT_METHOD_LABELS.CASH;
                          const partner = getWithdrawalPartner(item);

                          return (
                            <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                                {item.date}
                              </td>
                              <td className="py-3 px-4 font-bold text-white">
                                <div>{item.title}</div>
                                {item.notes && (
                                  <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs">{item.notes}</div>
                                )}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                                <span className="inline-flex items-center gap-1 text-[11px] bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                                  {payConfig.label}
                                </span>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap font-semibold">
                                {partner === 'مهجة' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                                    <Crown className="w-3 h-3 text-cyan-400" />
                                    <span>مهجة</span>
                                  </span>
                                ) : partner === 'حاتم' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                    <Crown className="w-3 h-3 text-amber-400" />
                                    <span>حاتم</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                                    <Crown className="w-3 h-3 text-indigo-400" />
                                    <span>{partner}</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                                {item.receiptNumber || '—'}
                              </td>
                              <td className="py-3 px-4 text-left font-mono font-bold text-cyan-400 text-sm whitespace-nowrap">
                                {item.amount.toLocaleString()} <span className="text-[11px] font-sans text-slate-400">ج.م</span>
                              </td>
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setReceiptToPrint(item)}
                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                    title="طباعة سند صرف الشريك"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditPartnerWithdrawal(item)}
                                    className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                    title="تعديل"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`هل أنت متأكد من حذف حركة مسحوبات (${item.title}) بقيمة ${item.amount} ج.م؟`)) {
                                        onDeleteExpense(item.id);
                                      }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                    title="حذف"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-900/95 font-bold text-white border-t-2 border-slate-700">
                        <tr>
                          <td colSpan={5} className="py-3 px-4 text-left">
                            إجمالي المسحوبات المعروضة لـ ({selectedPartnerTab === 'ALL' ? 'جميع الشركاء' : selectedPartnerTab}):
                          </td>
                          <td className="py-3 px-4 text-left font-mono text-base text-cyan-400">
                            {partnerStats.selectedPeriodTotal.toLocaleString()} ج.م
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* BOTTOM TOTAL SUMMARY BOX - مربع إجمالي مسحوبات الشركاء */}
              {/* ========================================================================= */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-900/60 space-y-4 shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                      <Crown className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">مربع إجمالي مسحوبات الأرباح:</span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-mono">
                          {selectedPartnerMonth === 'ALL' ? `سنة ${selectedPartnerYear}` : `شهر ${selectedPartnerMonth}`}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        {selectedPartnerTab === 'حاتم' ? (
                          <>إجمالي ما سحبه الشريك (<strong className="text-amber-300">حاتم</strong>) من الأرباح السنوية</>
                        ) : selectedPartnerTab === 'مهجة' ? (
                          <>إجمالي ما سحبته الشريكة (<strong className="text-cyan-300">مهجة</strong>) من الأرباح السنوية</>
                        ) : (
                          <>إجمالي مسحوبات الشركاء (<strong className="text-cyan-300">مهجة</strong> و <strong className="text-amber-300">حاتم</strong>) من الأرباح السنوية</>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        يتم خصم هذا المبلغ بالكامل من توزيعات أرباح نهاية السنة ({new Date().getFullYear()}).
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    {selectedPartnerTab === 'ALL' && (
                      <div className="flex items-center gap-3 text-xs bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl">
                        <div>
                          <span className="text-slate-400 block text-[10px]">مسحوبات مهجة:</span>
                          <span className="font-mono font-bold text-cyan-300">{partnerStats.mohgaTotal.toLocaleString()} ج</span>
                        </div>
                        <div className="w-px h-7 bg-slate-800"></div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">مسحوبات حاتم:</span>
                          <span className="font-mono font-bold text-amber-300">{partnerStats.hatemTotal.toLocaleString()} ج</span>
                        </div>
                      </div>
                    )}

                    <div className="text-left bg-slate-900 border border-cyan-800/60 px-5 py-3 rounded-2xl shadow-inner">
                      <span className="text-[11px] text-slate-400 block font-semibold">المسحوبات المحسوبة للفترة:</span>
                      <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
                        {partnerStats.selectedPeriodTotal.toLocaleString()} <span className="text-xs font-sans text-slate-400 font-normal">ج.م</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        إجمالي مسحوبات السنة كلها: <strong className="font-mono text-amber-300">{partnerStats.thisYearTotal.toLocaleString()} ج.م</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: EMPLOYEES & STAFF DIRECTORY */}
          {/* ========================================================================= */}
          {activeTab === 'EMPLOYEES' && (
            <div className="space-y-5">
              
              {/* Summary Bar */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">دليل فريق العمل والموظفين</h3>
                    <p className="text-xs text-slate-400">
                      تسجيل وتحديث بيانات المندوبين، العمال، المحاسبين، ومتابعة الرواتب الأساسية والبدلات
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <span className="text-xs text-slate-400 block">إجمالي الرواتب الأساسية الثابتة</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      {totalMonthlyPayrollObligation.toLocaleString()} ج.م / شهر
                    </span>
                  </div>
                  <button
                    onClick={handleOpenNewEmployee}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>إضافة موظف جديد</span>
                  </button>
                </div>
              </div>

              {/* Sub-View Switcher: Active Staff vs Resigned Archive */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-950 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEmployeeViewTab('ACTIVE')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                      employeeViewTab === 'ACTIVE'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>الموظفون الحاليون (على رأس العمل)</span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] bg-slate-950/60 text-emerald-300 font-mono font-bold">
                      {activeAndOnLeaveEmployees.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmployeeViewTab('RESIGNED')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                      employeeViewTab === 'RESIGNED'
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <UserX className="w-4 h-4" />
                    <span>أرشيف الموظفين المستقيلين</span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] bg-slate-950/60 text-rose-300 font-mono font-bold">
                      {resignedEmployees.length}
                    </span>
                  </button>
                </div>

                {employeeViewTab === 'RESIGNED' ? (
                  <span className="text-xs text-rose-300 bg-rose-950/50 border border-rose-800/50 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>سجل منفصل للمستقيلين لحفظ بياناتهم ومسيراتهم دون التأثير على فريق العمل الحالي</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 px-3 py-1.5 hidden sm:inline">
                    فريق العمل النشط المؤهل لمسير الرواتب الشهرية والعمولات
                  </span>
                )}
              </div>

              {/* Employees Grid / Cards */}
              {employeeViewTab === 'ACTIVE' ? (
                activeAndOnLeaveEmployees.length === 0 ? (
                  <div className="py-16 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                      <Users className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-slate-300">لا يوجد موظفون نشطون حالياً</p>
                    <p className="text-xs text-slate-500">أضف الموظفين ليتمكن النظام من إعداد مسير الرواتب الشهري وحساب التكاليف تلقائياً</p>
                    <button
                      onClick={handleOpenNewEmployee}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>إضافة أول موظف الآن</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeAndOnLeaveEmployees.map(emp => {
                      const currentMonthPayment = salaryPayments.find(
                        p => p.employeeId === emp.id && (p.salaryMonth || p.month) === selectedPayrollMonth && p.status === 'PAID'
                      );
                      const isPaidThisMonth = Boolean(currentMonthPayment);

                      return (
                        <div
                          key={emp.id}
                          className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-sm"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                                  {emp.name.slice(0, 2)}
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-white">{emp.name}</h4>
                                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                    <Briefcase className="w-3 h-3 text-slate-500" />
                                    {emp.jobTitle}
                                  </span>
                                </div>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                  emp.status === 'ACTIVE'
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                }`}
                              >
                                {emp.status === 'ACTIVE' ? 'على رأس العمل' : 'في إجازة'}
                              </span>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-900 grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-slate-500 text-[11px] block">الراتب الأساسي</span>
                                <span className="font-mono font-bold text-white text-sm">
                                  {emp.baseSalary.toLocaleString()} ج.م
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[11px] block">البدلات الثابتة</span>
                                <span className="font-mono font-bold text-emerald-400 text-sm">
                                  {(emp.fixedAllowances || 0).toLocaleString()} ج.م
                                </span>
                              </div>
                            </div>

                            {/* Active deductions & advances badge if recorded this month */}
                            {currentMonthPayment && ((currentMonthPayment.deductions > 0) || ((currentMonthPayment.advances || 0) > 0)) && (
                              <div className="mt-2.5 pt-2 border-t border-slate-900 grid grid-cols-2 gap-2 text-[11px]">
                                {currentMonthPayment.deductions > 0 ? (
                                  <div className="bg-rose-950/40 border border-rose-800/40 px-2 py-1 rounded-lg">
                                    <span className="text-rose-400 block text-[10px]">خصومات وجزاءات</span>
                                    <span className="font-mono font-bold text-rose-300">-{currentMonthPayment.deductions.toLocaleString()} ج</span>
                                  </div>
                                ) : <div></div>}
                                {(currentMonthPayment.advances || 0) > 0 ? (
                                  <div className="bg-amber-950/40 border border-amber-800/40 px-2 py-1 rounded-lg">
                                    <span className="text-amber-400 block text-[10px]">سلف ومسحوبات</span>
                                    <span className="font-mono font-bold text-amber-300">-{currentMonthPayment.advances?.toLocaleString()} ج</span>
                                  </div>
                                ) : <div></div>}
                              </div>
                            )}

                            {emp.phone && (
                              <div className="mt-2.5 flex items-center gap-1 text-[11px] text-slate-400">
                                <Phone className="w-3 h-3 text-slate-500" />
                                <span className="font-mono">{emp.phone}</span>
                              </div>
                            )}

                            {emp.defaultCommissionRate !== undefined && emp.defaultCommissionRate > 0 && (
                              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-indigo-300 bg-indigo-950/40 border border-indigo-800/40 px-2.5 py-1 rounded-lg">
                                <Percent className="w-3 h-3 text-indigo-400" />
                                <span>نسبة عمولة افتراضية: <strong className="font-mono text-indigo-200">{emp.defaultCommissionRate}%</strong></span>
                              </div>
                            )}

                            {emp.notes && (
                              <p className="mt-2 text-[11px] text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800">
                                {emp.notes}
                              </p>
                            )}
                          </div>

                          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            <button
                              onClick={() => handleOpenDisburseSalary(emp)}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isPaidThisMonth
                                  ? 'bg-purple-950/60 text-purple-300 border border-purple-800/40 hover:bg-purple-900/60'
                                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30'
                              }`}
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>{isPaidThisMonth ? 'تعديل صرف الراتب' : 'صرف راتب الشهر'}</span>
                            </button>

                            <button
                              onClick={() => handleOpenEditEmployee(emp)}
                              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                              title="تعديل بيانات الموظف"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف الموظف (${emp.name})؟`)) {
                                  onDeleteEmployee(emp.id);
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* RESIGNED EMPLOYEES ARCHIVE VIEW */
                resignedEmployees.length === 0 ? (
                  <div className="py-16 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                      <UserX className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-slate-300">أرشيف المستقيلين فارغ</p>
                    <p className="text-xs text-slate-500">لا يوجد أي موظف بحالة مستقيل حالياً، جميع الموظفين المسجلين على رأس العمل.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resignedEmployees.map(emp => (
                      <div
                        key={emp.id}
                        className="p-4 rounded-2xl bg-slate-950/80 border border-rose-950/60 hover:border-rose-900/80 transition-all flex flex-col justify-between space-y-4 opacity-90"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 font-bold text-sm">
                                {emp.name.slice(0, 2)}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-300 line-through decoration-rose-500/70">{emp.name}</h4>
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                  <Briefcase className="w-3 h-3 text-slate-600" />
                                  {emp.jobTitle} (سابقاً)
                                </span>
                              </div>
                            </div>

                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-800/60">
                              مستقيل / متوقف
                            </span>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-900 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-slate-500 text-[11px] block">آخر راتب أساسي</span>
                              <span className="font-mono text-slate-400 text-sm">
                                {emp.baseSalary.toLocaleString()} ج.م
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-[11px] block">تاريخ الالتحاق</span>
                              <span className="font-mono text-slate-400 text-xs">
                                {emp.joinDate || '—'}
                              </span>
                            </div>
                          </div>

                          {emp.phone && (
                            <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
                              <Phone className="w-3 h-3 text-slate-600" />
                              <span className="font-mono">{emp.phone}</span>
                            </div>
                          )}

                          {emp.notes && (
                            <p className="mt-2 text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                              ملاحظات الاستقالة: {emp.notes}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-900 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`هل تريد إعادة تفعيل الموظف (${emp.name}) وإعادته إلى فريق العمل النشط على رأس العمل؟`)) {
                                await onSaveEmployee({ ...emp, status: 'ACTIVE' });
                                confetti({ particleCount: 35, spread: 60 });
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-950/50 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/60 transition-all cursor-pointer"
                            title="إعادة الموظف للعمل النشط"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>إعادة تعيين للعمل</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditEmployee(emp)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                            title="تعديل بيانات الموظف"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف الموظف المستقيل (${emp.name}) نهائياً؟`)) {
                                onDeleteEmployee(emp.id);
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                            title="حذف نهائي"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: MONTHLY PAYROLL DISBURSEMENT SHEET */}
          {/* ========================================================================= */}
          {activeTab === 'PAYROLL' && (
            <div className="space-y-5">
              
              {/* Month Selector and Payroll Overview */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">مسير رواتب شهر:</span>
                      <span className="text-xs font-bold text-white bg-purple-950/80 border border-purple-800/80 px-2.5 py-0.5 rounded-lg">
                        {formatArabicMonth(selectedPayrollMonth)}
                      </span>
                    </div>

                    <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 text-xs gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedPayrollMonth(shiftMonthStr(selectedPayrollMonth, -1))}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="الشهر السابق"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <input
                        type="month"
                        value={selectedPayrollMonth}
                        onChange={e => setSelectedPayrollMonth(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs rounded-lg px-2.5 py-1 outline-none focus:border-purple-500 cursor-pointer"
                      />

                      <button
                        type="button"
                        onClick={() => setSelectedPayrollMonth(shiftMonthStr(selectedPayrollMonth, 1))}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="الشهر التالي"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPayrollMonth(currentMonthStr)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                          selectedPayrollMonth === currentMonthStr
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        هذا الشهر
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                  <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
                    <span className="text-slate-400 block">إجمالي استحقاقات الشهر:</span>
                    <span className="text-white font-mono font-bold text-sm">
                      {monthPayrollSummary.totalObligation.toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-indigo-900/60 px-3.5 py-2 rounded-xl">
                    <span className="text-indigo-400 block flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-indigo-400" />
                      <span>عمولات الفواتير المحققة:</span>
                    </span>
                    <span className="text-indigo-300 font-mono font-bold text-sm">
                      {monthPayrollSummary.totalCommissions.toLocaleString()} ج.م
                      <span className="text-[10px] text-slate-400 font-sans font-normal mr-1.5">({monthPayrollSummary.commissionInvoicesCount} فاتورة)</span>
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
                    <span className="text-slate-400 block">الرواتب المصروفة فعلياً:</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm">
                      {monthPayrollSummary.totalPaid.toLocaleString()} ج.م ({monthPayrollSummary.paidCount} موظف)
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
                    <span className="text-slate-400 block">المتبقي لم يُصرف:</span>
                    <span className="text-amber-400 font-mono font-bold text-sm">
                      {monthPayrollSummary.remainingUnpaid.toLocaleString()} ج.م ({monthPayrollSummary.unpaidCount} موظف)
                    </span>
                  </div>

                  {monthPayrollSummary.unpaidCount > 0 && (
                    <button
                      type="button"
                      onClick={handleOpenBatchSalaryDisburse}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer"
                      title="صرف رواتب جميع الموظفين المستحقين دفعة واحدة بتاريخ موحد"
                    >
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>⚡ صرف جماعي للمتبقين ({monthPayrollSummary.unpaidCount})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Toggle to show/hide resigned employees in payroll */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showResignedInPayroll}
                    onChange={e => setShowResignedInPayroll(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                  />
                  <span>إظهار الموظفين المستقيلين في مسير الرواتب ({resignedEmployees.length} مستقيل)</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {showResignedInPayroll
                    ? 'يتم عرض الموظفين المستقيلين في الجدول لتسويات نهاية الخدمة والمستحقات السابقة'
                    : 'افتراضياً: يتم إخفاء المستقيلين وعرض الموظفين على رأس العمل فقط'}
                </span>
              </div>

              {/* Printable Payroll Sheet */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                {displayedPayrollData.length === 0 ? (
                  <div className="py-14 text-center text-slate-400">
                    {showResignedInPayroll
                      ? 'لا يوجد موظفون لعرضهم في مسير الرواتب.'
                      : 'لا يوجد موظفون على رأس العمل لعرضهم. في حال رغبتك بعرض المستقيلين فعّل الخيار بالأعلى.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs text-slate-300">
                      <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold">
                        <tr>
                          <th className="py-3 px-4">اسم الموظف</th>
                          <th className="py-3 px-4">المسمى الوظيفي</th>
                          <th className="py-3 px-4 text-left font-mono">الأساسي</th>
                          <th className="py-3 px-4 text-left font-mono">البدلات</th>
                          <th className="py-3 px-4 text-left font-mono">المكافآت</th>
                          <th className="py-3 px-4 text-left font-mono">عمولات المبيعات</th>
                          <th className="py-3 px-4 text-left font-mono">الخصومات</th>
                          <th className="py-3 px-4 text-left font-mono">السلف الشخصية</th>
                          <th className="py-3 px-4 text-left font-mono">صافي المستحق</th>
                          <th className="py-3 px-4 text-center">حالة الصرف</th>
                          <th className="py-3 px-4 text-center">إجراء الصرف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {displayedPayrollData.map(({ employee, payment, isPaid, baseSalary, allowances, commissions, commissionInvoicesCount, deductions, advances, netPaid }) => {
                          const isEmpResigned = employee.status === 'RESIGNED';
                          return (
                            <tr key={employee.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span>{employee.name}</span>
                                  {isEmpResigned && (
                                    <span className="text-[10px] text-rose-300 bg-rose-950/70 border border-rose-800/60 px-1.5 py-0.2 rounded font-normal">
                                      مستقيل
                                    </span>
                                  )}
                                </div>
                                {employee.phone && (
                                  <span className="text-[10px] text-slate-500 font-mono">{employee.phone}</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                                <div>{employee.jobTitle}</div>
                                {employee.defaultCommissionRate !== undefined && employee.defaultCommissionRate > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-indigo-400 font-mono">
                                    <Percent className="w-2.5 h-2.5" />
                                    <span>{employee.defaultCommissionRate}% عمولة</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-left font-mono text-slate-300">
                                {baseSalary.toLocaleString()} ج
                              </td>
                              <td className="py-3 px-4 text-left font-mono text-emerald-400">
                                {allowances > 0 ? `+${allowances.toLocaleString()} ج` : '0'}
                              </td>
                              <td className="py-3 px-4 text-left font-mono text-purple-400">
                                {payment && payment.bonuses > 0 ? `+${payment.bonuses.toLocaleString()} ج` : '—'}
                              </td>
                              <td className="py-3 px-4 text-left font-mono">
                                {commissions > 0 ? (
                                  <div>
                                    <span className="font-bold text-indigo-400">+{commissions.toLocaleString()} ج</span>
                                    <span className="block text-[10px] text-slate-400 font-sans">{commissionInvoicesCount} فاتورة</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-left font-mono text-rose-400">
                                {payment && payment.deductions > 0 ? `-${payment.deductions.toLocaleString()} ج` : '—'}
                              </td>
                              <td className="py-3 px-4 text-left font-mono text-amber-400">
                                {payment && (payment.advances || 0) > 0 ? `-${(payment.advances || 0).toLocaleString()} ج` : '—'}
                              </td>
                              <td className="py-3 px-4 text-left font-mono font-bold text-white text-sm">
                                {netPaid.toLocaleString()} ج.م
                              </td>
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                {isPaid ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                      <span>تم الصرف</span>
                                    </span>
                                    {payment && (
                                      <div className="flex flex-col items-center gap-0.5 text-[10px]">
                                        <span className="text-slate-300 font-mono flex items-center gap-1">
                                          <Calendar className="w-2.5 h-2.5 text-slate-400" />
                                          <span>صُرف: {payment.paymentDate}</span>
                                        </span>
                                        <span className="text-purple-300/80 font-medium">
                                          عن شهر: {formatArabicMonth(payment.salaryMonth || payment.month)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    <span>متبقي الصرف</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenDisburseSalary(employee, payment)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                      isPaid
                                        ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700'
                                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30'
                                    }`}
                                  >
                                    {isPaid ? 'تعديل الراتب' : 'صرف الآن'}
                                  </button>
                                  {isPaid && payment && (
                                    <button
                                      type="button"
                                      onClick={() => setSalarySlipToPrint(payment)}
                                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-purple-300 rounded-xl transition-all cursor-pointer border border-slate-700"
                                      title="طباعة إيصال / سند صرف الراتب"
                                    >
                                      <Printer className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-900/95 font-bold text-white border-t-2 border-slate-700">
                        <tr>
                          <td colSpan={8} className="py-3 px-4 text-left">
                            إجمالي ما تم صرفه لهذا الشهر ({selectedPayrollMonth}):
                          </td>
                          <td className="py-3 px-4 text-left font-mono text-base text-emerald-400">
                            {monthPayrollSummary.totalPaid.toLocaleString()} ج.م
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: EXPENSE ANALYTICS & STRUCTURE */}
          {/* ========================================================================= */}
          {activeTab === 'ANALYTICS' && (
            <div className="space-y-6">
              
              {/* Category Breakdown Progress Bars */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">توزيع المصروفات حسب التصنيف</h3>
                    <p className="text-xs text-slate-400">
                      نسبة مساهمة كل بند تشغيلي في إجمالي المصروفات الحالية ({filteredTotalAmount.toLocaleString()} ج.م)
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {categoryBreakdown.length} تصنيفات نشطة
                  </span>
                </div>

                {categoryBreakdown.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">لا توجد بيانات مصروفات كافية للتحليل</div>
                ) : (
                  <div className="space-y-3 pt-2">
                    {categoryBreakdown.map(item => {
                      const percentage = filteredTotalAmount > 0 ? (item.total / filteredTotalAmount) * 100 : 0;
                      const catConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.OTHER;
                      const CatIcon = catConfig.icon;

                      return (
                        <div key={item.category} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 font-medium text-slate-200">
                              <span className={`p-1 rounded-md ${catConfig.bg} ${catConfig.color}`}>
                                <CatIcon className="w-3.5 h-3.5" />
                              </span>
                              <span>{catConfig.label}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({item.count} حركة)</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-white">{item.total.toLocaleString()} ج.م</span>
                              <span className="font-mono text-[11px] text-slate-400 w-12 text-left">{percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                          
                          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Payment Methods Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-400" />
                    <span>توزيع طرق الدفع والسداد</span>
                  </h4>
                  <div className="divide-y divide-slate-900 text-xs">
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([key, config]) => {
                      const totalForMethod = filteredExpenses
                        .filter(e => e.paymentMethod === key)
                        .reduce((sum, e) => sum + e.amount, 0);
                      const MethodIcon = config.icon;

                      if (totalForMethod <= 0) return null;

                      return (
                        <div key={key} className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-300">
                            <MethodIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{config.label}</span>
                          </div>
                          <span className="font-mono font-bold text-white">
                            {totalForMethod.toLocaleString()} ج.م
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>نصائح التحكم في التكاليف</span>
                  </h4>
                  <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                    <li>تأكد من توثيق كل حركة نقدية برقم سند أو فاتورة لسهولة الجرد والتدقيق.</li>
                    <li>يتم إدراج الرواتب المصروفة تلقائياً في سجل المصروفات العام لتوثيق حركة النقدية.</li>
                    <li>قم بمراجعة بنود التعبئة والتغليف والشحن شهرياً لتقليل الهادر ورفع صافي الأرباح.</li>
                    <li>يتم خصم كافة المصروفات التشغيلية من إجمالي أرباح المبيعات داخل الخزنة السرية.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>مزامنة فورية وتخزين سحابي آمن في Firebase</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* DIALOG 1: ADD / EDIT EXPENSE MODAL */}
      {/* ========================================================================= */}
      {isExpenseFormOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 text-right">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingExpense ? 'تعديل بيانات المصروف' : 'تسجيل حركة مصروف جديدة'}
                </h3>
              </div>
              <button
                onClick={() => setIsExpenseFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpenseSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  بند / بيان المصروف <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={e => setExpTitle(e.target.value)}
                  placeholder="مثال: إيجار مخزن شهر 8، بنزين سيارات التوزيع، كراتين تغليف..."
                  className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    المبلغ (ج.م) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="any"
                    value={expAmount}
                    onChange={e => setExpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <SmartDateInput
                    label="تاريخ الصرف / السداد"
                    value={expDate}
                    onChange={setExpDate}
                    accentColor="rose"
                    presets={['today', 'yesterday', 'month-start', 'month-end']}
                    hint="تاريخ سداد المصروف"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">التصنيف</label>
                  <select
                    value={expCategory}
                    onChange={e => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-rose-500"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">طريقة الدفع</label>
                  <select
                    value={expPaymentMethod}
                    onChange={e => setExpPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-rose-500"
                  >
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Partner selector if category is PARTNER_WITHDRAWAL */}
              {expCategory === 'PARTNER_WITHDRAWAL' && (
                <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl space-y-2">
                  <label className="text-xs text-cyan-300 font-semibold flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-cyan-400" />
                    <span>الشريك المستفيد من سحب الأرباح <span className="text-cyan-400">*</span></span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpPartnerName('مهجة')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        expPartnerName === 'مهجة'
                          ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      👑 مهجة
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpPartnerName('حاتم')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        expPartnerName === 'حاتم'
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      👑 حاتم
                    </button>
                    <input
                      type="text"
                      value={expPartnerName !== 'مهجة' && expPartnerName !== 'حاتم' ? expPartnerName : ''}
                      onChange={e => setExpPartnerName(e.target.value)}
                      placeholder="أو اسم شريك آخر..."
                      className="bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 outline-none focus:border-cyan-500 flex-1 min-w-[120px]"
                    />
                  </div>
                </div>
              )}

              {/* Office / Branch input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>المكتب / الفرع التابع له المصروف</span>
                  </label>
                  <span className="text-[10px] text-slate-400">لحساب إجمالي كل مكتب على حدة</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    list="office-modal-datalist"
                    value={expOffice}
                    onChange={e => setExpOffice(e.target.value)}
                    placeholder="اختر أو اكتب اسم المكتب أو الفرع..."
                    className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                  />
                  <datalist id="office-modal-datalist">
                    {availableOffices.map(off => (
                      <option key={off} value={off} />
                    ))}
                  </datalist>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {DEFAULT_OFFICES.map(off => (
                    <button
                      key={off}
                      type="button"
                      onClick={() => setExpOffice(off)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        expOffice === off
                          ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50 font-bold'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {off}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">الجهة / المستلم (اختياري)</label>
                  <input
                    type="text"
                    value={expRecipient}
                    onChange={e => setExpRecipient(e.target.value)}
                    placeholder="اسم الشخص أو الشركة..."
                    className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">رقم الإيصال / السند</label>
                  <input
                    type="text"
                    value={expReceiptNumber}
                    onChange={e => setExpReceiptNumber(e.target.value)}
                    placeholder="REC-001..."
                    className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={expNotes}
                  onChange={e => setExpNotes(e.target.value)}
                  placeholder="أي تفاصيل أو ملاحظات تخص الصرف..."
                  className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 resize-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExpense}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmittingExpense ? 'جاري الحفظ...' : editingExpense ? 'تحديث المصروف' : 'حفظ المصروف'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 2: ADD / EDIT EMPLOYEE MODAL */}
      {/* ========================================================================= */}
      {isEmployeeFormOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 text-right">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف / عامل جديد'}
                </h3>
              </div>
              <button
                onClick={() => setIsEmployeeFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  اسم الموظف / العامل <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={e => setEmpName(e.target.value)}
                  placeholder="الاسم ثلاثي أو رباعي..."
                  className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">المسمى الوظيفي</label>
                  <input
                    type="text"
                    required
                    value={empJobTitle}
                    onChange={e => setEmpJobTitle(e.target.value)}
                    placeholder="مندوب مبيعات، سائق، أمين مخزن..."
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={empPhone}
                    onChange={e => setEmpPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    الراتب الأساسي الشهري (ج.م) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={empBaseSalary}
                    onChange={e => setEmpBaseSalary(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">بدلات وحوافز ثابتة (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={empFixedAllowances}
                    onChange={e => setEmpFixedAllowances(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-sm rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Default Commission Rate Input */}
              <div className="p-3 bg-slate-950/80 border border-indigo-900/40 rounded-xl">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="text-xs text-indigo-300 font-semibold flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-indigo-400" />
                    <span>نسبة العمولة الافتراضية على المبيعات (%)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">خاصة بمندوبي المبيعات</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={empDefaultCommissionRate}
                    onChange={e => setEmpDefaultCommissionRate(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="مثال: 2 أو 3.5"
                    className="w-full bg-slate-900 border border-slate-700 text-indigo-200 font-mono text-xs rounded-xl pr-3 pl-8 py-2 outline-none focus:border-indigo-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  تُقترح تلقائياً في خانة العمولة عند ربط هذا الموظف بفاتورة مبيعات جديدة أو بضاعة مرسلة
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">حالة العمل</label>
                  <select
                    value={empStatus}
                    onChange={e => setEmpStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  >
                    <option value="ACTIVE">على رأس العمل (نشط)</option>
                    <option value="ON_LEAVE">في إجازة</option>
                    <option value="RESIGNED">مستقيل / متوقف</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">تاريخ الالتحاق</label>
                  <input
                    type="date"
                    value={empJoinDate}
                    onChange={e => setEmpJoinDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">ملاحظات</label>
                <textarea
                  rows={2}
                  value={empNotes}
                  onChange={e => setEmpNotes(e.target.value)}
                  placeholder="ملاحظات حول الموظف أو شروط العقد..."
                  className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500 resize-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmployeeFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEmployee}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmittingEmployee ? 'جاري الحفظ...' : editingEmployee ? 'تحديث الموظف' : 'حفظ الموظف'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 3: SALARY DISBURSEMENT MODAL */}
      {/* ========================================================================= */}
      {isSalaryDisburseModalOpen && disbursingEmployee && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 text-right">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingSalaryPayment ? 'تعديل سجل صرف راتب' : 'صرف راتب الموظف'}: {disbursingEmployee.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="text-purple-300 font-mono">شهر الراتب: {salMonth}</span>
                    <span>•</span>
                    <span className="text-slate-300 font-mono">تاريخ الصرف: {salPaymentDate}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsSalaryDisburseModalOpen(false);
                  setEditingSalaryPayment(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editingSalaryPayment && (
              <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl text-xs text-purple-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white mb-0.5">تعديل صرف مسجل مسبقاً</div>
                  <div className="text-[11px] text-purple-300/80 leading-relaxed">
                    تعديل <strong>شهر الراتب (Salary Month)</strong> يربط الراتب محاسبياً بالشهر المختار دون تغيير <strong>تاريخ الصرف الفعلي</strong> ودون تكرار السجل في قاعدة البيانات.
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSalaryDisburseSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl">
                <SmartMonthInput
                  label="شهر الراتب (Salary Month)"
                  value={salMonth}
                  onChange={setSalMonth}
                  accentColor="purple"
                  hint="الشهر المستحق محاسبياً (مثلاً: 2026-06)"
                />

                <SmartDateInput
                  label="تاريخ الصرف الفعلي (Payment Date)"
                  value={salPaymentDate}
                  onChange={setSalPaymentDate}
                  targetMonth={salMonth}
                  accentColor="purple"
                  presets={['today', 'yesterday', 'month-25', 'month-start', 'month-end']}
                  hint="تاريخ خروج النقدية الفعلي (مثلاً: 2026-07-02)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">الراتب الأساسي (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={salBaseSalary}
                    onChange={e => setSalBaseSalary(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">البدلات الثابتة (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={salAllowances}
                    onChange={e => setSalAllowances(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-emerald-400 font-mono text-sm rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">+ حوافز ومكافآت (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={salBonuses}
                    onChange={e => setSalBonuses(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-700 text-purple-400 font-mono text-sm rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">- خصومات وجزاءات (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={salDeductions}
                    onChange={e => setSalDeductions(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-700 text-rose-400 font-mono text-sm rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">- سلف شخصية ومسحوبات (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={salAdvances}
                    onChange={e => setSalAdvances(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-700 text-amber-400 font-mono text-sm rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Commission Section */}
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-400" />
                    <span>+ عمولات مبيعات الفواتير لهذا الشهر</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold text-indigo-300 bg-indigo-900/60 border border-indigo-700/50 px-2 py-0.5 rounded-md">
                    {salCommissionInvoicesCount} فاتورة مبيعات
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1 font-medium">مبلغ العمولة المضافة للراتب (ج.م)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={salCommissions}
                      onChange={e => setSalCommissions(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-indigo-600 text-indigo-300 font-mono font-bold text-sm rounded-xl px-3 py-2 outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    تم احتسابها آلياً من نسبة العمولات على فواتير المبيعات المنسوبة للموظف خلال شهر <span className="text-indigo-300 font-mono font-bold">{salMonth}</span>. يمكنك تعديلها يدوياً إذا رغبت.
                  </div>
                </div>
              </div>

              {/* Calculated Net Salary Box */}
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-purple-300 block font-semibold">صافي المبلغ المدفوع للموظف:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-white">
                      {Math.max(0, salBaseSalary + salAllowances + salBonuses + salCommissions - salDeductions - salAdvances).toLocaleString()} ج.م
                    </span>
                    {salCommissions > 0 && (
                      <span className="text-[11px] text-indigo-300 font-medium">
                        (شامل {salCommissions.toLocaleString()} ج عمولات)
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    الأساسي ({salBaseSalary}) + البدلات ({salAllowances}) + الحوافز ({salBonuses}) + العمولات ({salCommissions}) - الخصومات ({salDeductions}) - السلف ({salAdvances})
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">طريقة الدفع</label>
                  <select
                    value={salPaymentMethod}
                    onChange={e => setSalPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  >
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">ملاحظات الصرف</label>
                  <input
                    type="text"
                    value={salNotes}
                    onChange={e => setSalNotes(e.target.value)}
                    placeholder="مثال: تسليم كاش باليد..."
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                💡 يتم توثيق حركة الصرف وفقاً لـ <strong>تاريخ الصرف الفعلي</strong> في سجل النقدية، بينما يتم إسناد الراتب محاسبياً لـ <strong>شهر الراتب</strong> في التقارير والمسيرات.
              </p>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                {editingSalaryPayment && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`هل أنت متأكد من رغبتك في إلغاء وحذف سجل صرف هذا الراتب للموظف (${disbursingEmployee.name})؟`)) {
                        await onDeleteSalaryPayment(editingSalaryPayment.id);
                        setIsSalaryDisburseModalOpen(false);
                        setEditingSalaryPayment(null);
                      }
                    }}
                    className="ml-auto px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-800/60 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>إلغاء وحذف الصرف</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsSalaryDisburseModalOpen(false);
                    setEditingSalaryPayment(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSalary}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmittingSalary ? 'جاري الحفظ...' : editingSalaryPayment ? 'حفظ تعديلات الراتب' : 'توثيق وصرف الراتب'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 4: RECORD PARTNER PROFIT WITHDRAWAL MODAL (مهجة / الشريك) */}
      {/* ========================================================================= */}
      {isPartnerWithdrawalModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 text-right">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingPartnerWithdrawal ? 'تعديل حركة سحب أرباح' : `تسجيل سحب أرباح: ${partPartnerName || 'الشريك'}`}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    يُسجل كمسحوبات شخصية من الأرباح السنوية للشريك ولا يُحسب ضمن تكاليف التشغيل
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPartnerWithdrawalModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePartnerWithdrawalSubmit} className="space-y-3.5">
              {/* اختيار الشريك المستفيد */}
              <div>
                <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 mb-1.5">
                  <Crown className="w-3.5 h-3.5 text-cyan-400" />
                  <span>الشريك المستفيد من سحب الأرباح <span className="text-cyan-400">*</span></span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPartPartnerName('مهجة');
                      if (!editingPartnerWithdrawal && (partTitle.includes('حاتم') || partTitle.startsWith('دفعة من الأرباح السنوية'))) {
                        setPartTitle('دفعة من الأرباح السنوية (مهجة)');
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      partPartnerName === 'مهجة'
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    👑 الشريكة: مهجة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPartPartnerName('حاتم');
                      if (!editingPartnerWithdrawal && (partTitle.includes('مهجة') || partTitle.startsWith('دفعة من الأرباح السنوية'))) {
                        setPartTitle('دفعة من الأرباح السنوية (حاتم)');
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      partPartnerName === 'حاتم'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    👑 الشريك: حاتم
                  </button>
                  <input
                    type="text"
                    value={partPartnerName !== 'مهجة' && partPartnerName !== 'حاتم' ? partPartnerName : ''}
                    onChange={e => setPartPartnerName(e.target.value)}
                    placeholder="أو اسم شريك آخر..."
                    className="bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 outline-none focus:border-cyan-500 flex-1 min-w-[120px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  بيان المسحوبات / الغرض <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={partTitle}
                  onChange={e => setPartTitle(e.target.value)}
                  placeholder="مثال: دفعة أرباح سنوية، مصاريف شخصية للشريك..."
                  className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    المبلغ المسحوب (ج.م) <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="any"
                    value={partAmount}
                    onChange={e => setPartAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 text-cyan-300 font-mono font-bold text-sm rounded-xl px-3 py-2 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <SmartDateInput
                    label="تاريخ السحب"
                    value={partDate}
                    onChange={setPartDate}
                    accentColor="cyan"
                    presets={['today', 'yesterday', 'month-start', 'month-end']}
                    hint="تاريخ تسليم الأرباح للشريك"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">طريقة الصرف / السداد</label>
                  <select
                    value={partPaymentMethod}
                    onChange={e => setPartPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500"
                  >
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">رقم الإيصال / السند</label>
                  <input
                    type="text"
                    value={partReceiptNumber}
                    onChange={e => setPartReceiptNumber(e.target.value)}
                    placeholder="REC-001..."
                    className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl px-3 py-2 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={partNotes}
                  onChange={e => setPartNotes(e.target.value)}
                  placeholder="أي ملاحظات تخص سحب الأرباح..."
                  className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl px-3 py-2 outline-none focus:border-cyan-500 resize-none"
                ></textarea>
              </div>

              <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-[11px] text-cyan-200">
                ⭐ مسجل باسم الشريك: <strong className="text-white font-bold">{partPartnerName || 'بدون اسم (شريك)'}</strong>. يتم تجميع هذه المبالغ في شيت الأرباح السنوية بشكل منفصل.
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPartnerWithdrawalModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPartnerWithdrawal}
                  className="px-5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-md shadow-cyan-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmittingPartnerWithdrawal ? 'جاري الحفظ...' : editingPartnerWithdrawal ? 'تحديث السحب' : 'توثيق سحب الأرباح'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 5: BATCH SALARY DISBURSEMENT MODAL (صرف جماعي للرواتب) */}
      {/* ========================================================================= */}
      {isBatchDisburseModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 text-right">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Zap className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    صرف جماعي لرواتب شهر ({formatArabicMonth(selectedPayrollMonth)})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    تحديد موعد صرف موحد وطريقة دفع لكافة الموظفين المستحقين دفعة واحدة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchDisburseModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBatchSalaryDisburseSubmit} className="space-y-4 flex-1 flex flex-col overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl">
                <SmartDateInput
                  label="تاريخ الصرف الفعلي الموحد"
                  value={batchDisburseDate}
                  onChange={setBatchDisburseDate}
                  targetMonth={selectedPayrollMonth}
                  accentColor="purple"
                  presets={['today', 'yesterday', 'month-25', 'month-start', 'month-end']}
                  hint="سيسجل كتاريخ صرف لكافة الموظفين المحددين"
                />

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-semibold block">
                    طريقة الصرف الموحدة <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={batchPaymentMethod}
                    onChange={e => setBatchPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-purple-500 font-medium"
                  >
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">
                    يتم تطبيق طريقة الدفع هذه على جميع السجلات المسجلة ضمن هذه الدفعة
                  </p>
                </div>
              </div>

              {/* Employee selection checklist */}
              <div className="flex-1 overflow-hidden flex flex-col space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold px-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="selectAllBatch"
                      checked={batchUnpaidList.length > 0 && batchSelectedEmpIds.length === batchUnpaidList.length}
                      onChange={e => {
                        if (e.target.checked) {
                          setBatchSelectedEmpIds(batchUnpaidList.map(item => item.employee.id));
                        } else {
                          setBatchSelectedEmpIds([]);
                        }
                      }}
                      className="rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="selectAllBatch" className="text-slate-300 cursor-pointer">
                      تحديد الكل ({batchUnpaidList.length} موظف مستحق)
                    </label>
                  </div>
                  <span className="text-slate-400">
                    تم تحديد: <strong className="text-purple-400">{batchSelectedEmpIds.length}</strong> من {batchUnpaidList.length}
                  </span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-y-auto max-h-52 divide-y divide-slate-850 bg-slate-950/70">
                  {batchUnpaidList.map(item => {
                    const isSelected = batchSelectedEmpIds.includes(item.employee.id);
                    return (
                      <div
                        key={item.employee.id}
                        onClick={() => {
                          setBatchSelectedEmpIds(prev =>
                            prev.includes(item.employee.id)
                              ? prev.filter(id => id !== item.employee.id)
                              : [...prev, item.employee.id]
                          );
                        }}
                        className={`p-3 flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected ? 'bg-purple-950/30' : 'hover:bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer pointer-events-none"
                          />
                          <div>
                            <span className="font-bold text-white text-xs block">{item.employee.name}</span>
                            <span className="text-[11px] text-slate-400">{item.employee.jobTitle}</span>
                          </div>
                        </div>

                        <div className="text-left">
                          <span className="text-sm font-bold font-mono text-emerald-400 block">
                            {item.netPaid.toLocaleString()} ج.م
                          </span>
                          <span className="text-[10px] text-slate-500 font-sans">صافي مستحق</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Summary Footer */}
              <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl flex items-center justify-between text-xs">
                <span className="text-purple-200">
                  إجمالي المبلغ المطلوب صرفه لهذه الدفعة:
                </span>
                <span className="text-base font-bold font-mono text-white">
                  {batchTotalAmount.toLocaleString()} ج.م
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBatchDisburseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBatch || batchSelectedEmpIds.length === 0}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>
                    {isSubmittingBatch
                      ? 'جاري الصرف...'
                      : `تأكيد صرف رواتب (${batchSelectedEmpIds.length}) موظف`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINT DIALOG: EXPENSE PAYMENT RECEIPT (سند صرف نقدية) */}
      {/* ========================================================================= */}
      {receiptToPrint && (
        <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 text-right">
          <div className="relative w-full max-w-lg bg-white text-slate-900 rounded-2xl shadow-2xl p-6 space-y-4">
            
            {/* Printable Voucher Content */}
            <div className="border-2 border-slate-800 rounded-xl p-5 space-y-4" dir="rtl">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">سند صرف نقدية</h2>
                  <span className="text-xs text-slate-600 font-mono">Payment Voucher</span>
                </div>
                <div className="text-left font-mono text-xs">
                  <div>التاريخ: {receiptToPrint.date}</div>
                  <div>رقم السند: {receiptToPrint.receiptNumber || `VCH-${receiptToPrint.id.slice(-5)}`}</div>
                </div>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600 font-semibold">يُصرف للسيد / الجهة:</span>
                  <span className="font-bold text-slate-900">{receiptToPrint.recipient || 'مذكور أدناه'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600 font-semibold">مبلغ وقدره:</span>
                  <span className="font-mono font-bold text-base text-rose-700">{receiptToPrint.amount.toLocaleString()} ج.م</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600 font-semibold">وذلك عن (البيان):</span>
                  <span className="font-bold text-slate-900">{receiptToPrint.title}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600 font-semibold">التصنيف:</span>
                  <span className="text-slate-800">{CATEGORY_CONFIG[receiptToPrint.category]?.label}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600 font-semibold">طريقة السداد:</span>
                  <span className="text-slate-800">{PAYMENT_METHOD_LABELS[receiptToPrint.paymentMethod]?.label}</span>
                </div>

                {receiptToPrint.notes && (
                  <div className="py-1 text-slate-600 text-xs">
                    <span className="font-semibold">ملاحظات: </span>
                    {receiptToPrint.notes}
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-4 text-center text-xs border-t-2 border-slate-800">
                <div>
                  <span className="font-bold block text-slate-800">المحاسب / المدير المسؤول</span>
                  <div className="mt-6 border-b border-slate-400 w-3/4 mx-auto"></div>
                </div>
                <div>
                  <span className="font-bold block text-slate-800">توقيع المستلم</span>
                  <div className="mt-6 border-b border-slate-400 w-3/4 mx-auto"></div>
                </div>
              </div>
            </div>

            {/* Print Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 no-print">
              <button
                onClick={() => setReceiptToPrint(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة السند</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINT DIALOG: SALARY PAYMENT SLIP (سند / إيصال صرف راتب) */}
      {/* ========================================================================= */}
      {salarySlipToPrint && (
        <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 text-right">
          <div className="relative w-full max-w-lg bg-white text-slate-900 rounded-2xl shadow-2xl p-6 space-y-4">
            
            {/* Printable Slip Content */}
            <div className="border-2 border-slate-800 rounded-xl p-5 space-y-4" dir="rtl">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">سند صرف راتب شهري</h2>
                  <span className="text-xs text-slate-600 font-mono">Salary Payment Voucher</span>
                </div>
                <div className="text-left font-mono text-xs">
                  <div>تاريخ الصرف: <strong className="text-slate-900">{salarySlipToPrint.paymentDate}</strong></div>
                  <div>رقم السند: SAL-{salarySlipToPrint.id.slice(-6)}</div>
                </div>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600 font-semibold">الموظف المستفيد:</span>
                  <span className="font-bold text-slate-900 text-sm">{salarySlipToPrint.employeeName}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 py-1.5 border-b border-slate-200 bg-purple-50/70 p-2.5 rounded-lg">
                  <div>
                    <span className="text-purple-900 font-semibold block text-xs">شهر الراتب المستحق:</span>
                    <span className="font-bold text-purple-950 text-sm font-mono">
                      {formatArabicMonth(salarySlipToPrint.salaryMonth || salarySlipToPrint.month)} ({salarySlipToPrint.salaryMonth || salarySlipToPrint.month})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold block text-xs">تاريخ الصرف الفعلي:</span>
                    <span className="font-bold text-slate-900 text-sm font-mono">
                      {salarySlipToPrint.paymentDate}
                    </span>
                  </div>
                </div>

                {/* Financial breakdown table */}
                <div className="border border-slate-300 rounded-lg overflow-hidden my-2">
                  <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-700 border-b border-slate-300 flex justify-between">
                    <span>بيان المستحقات والاستقطاعات</span>
                    <span>المبلغ (ج.م)</span>
                  </div>
                  <div className="divide-y divide-slate-200 text-xs">
                    <div className="px-3 py-1.5 flex justify-between">
                      <span className="text-slate-600">الراتب الأساسي</span>
                      <span className="font-mono font-semibold">{salarySlipToPrint.baseSalary.toLocaleString()} ج.م</span>
                    </div>
                    {salarySlipToPrint.allowances > 0 && (
                      <div className="px-3 py-1.5 flex justify-between text-emerald-800">
                        <span>+ البدلات الثابتة</span>
                        <span className="font-mono font-semibold">+{salarySlipToPrint.allowances.toLocaleString()} ج.م</span>
                      </div>
                    )}
                    {(salarySlipToPrint.bonuses || 0) > 0 && (
                      <div className="px-3 py-1.5 flex justify-between text-purple-800">
                        <span>+ مكافآت وحوافز</span>
                        <span className="font-mono font-semibold">+{(salarySlipToPrint.bonuses || 0).toLocaleString()} ج.م</span>
                      </div>
                    )}
                    {(salarySlipToPrint.commissions || 0) > 0 && (
                      <div className="px-3 py-1.5 flex justify-between text-indigo-800">
                        <span>+ عمولات مبيعات الفواتير {salarySlipToPrint.commissionInvoicesCount ? `(${salarySlipToPrint.commissionInvoicesCount} فاتورة)` : ''}</span>
                        <span className="font-mono font-semibold">+{(salarySlipToPrint.commissions || 0).toLocaleString()} ج.م</span>
                      </div>
                    )}
                    {(salarySlipToPrint.deductions || 0) > 0 && (
                      <div className="px-3 py-1.5 flex justify-between text-rose-800">
                        <span>- خصومات وجزاءات</span>
                        <span className="font-mono font-semibold">-{(salarySlipToPrint.deductions || 0).toLocaleString()} ج.م</span>
                      </div>
                    )}
                    {(salarySlipToPrint.advances || 0) > 0 && (
                      <div className="px-3 py-1.5 flex justify-between text-amber-800">
                        <span>- سلف شخصية ومسحوبات</span>
                        <span className="font-mono font-semibold">-{(salarySlipToPrint.advances || 0).toLocaleString()} ج.م</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-900 text-white px-3 py-2 font-bold text-sm flex justify-between items-center">
                    <span>صافي الراتب المصروف (المبلغ):</span>
                    <span className="font-mono text-base text-emerald-400">{salarySlipToPrint.netPaid.toLocaleString()} ج.م</span>
                  </div>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600 font-semibold">طريقة الصرف:</span>
                  <span className="text-slate-800">{PAYMENT_METHOD_LABELS[salarySlipToPrint.paymentMethod]?.label || salarySlipToPrint.paymentMethod}</span>
                </div>

                {salarySlipToPrint.notes && (
                  <div className="py-1 text-slate-600 text-xs">
                    <span className="font-semibold">ملاحظات: </span>
                    {salarySlipToPrint.notes}
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-4 text-center text-xs border-t-2 border-slate-800">
                <div>
                  <span className="font-bold block text-slate-800">المحاسب / إدارة الحسابات</span>
                  <div className="mt-6 border-b border-slate-400 w-3/4 mx-auto"></div>
                </div>
                <div>
                  <span className="font-bold block text-slate-800">توقيع الموظف المستلم</span>
                  <div className="mt-6 border-b border-slate-400 w-3/4 mx-auto"></div>
                </div>
              </div>
            </div>

            {/* Print Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 no-print">
              <button
                onClick={() => setSalarySlipToPrint(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-600 rounded-xl shadow-md cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة سند الراتب</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
