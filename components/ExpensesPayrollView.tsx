'use client';

import React, { useState, useMemo, useRef } from 'react';
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
  ChevronUp,
  Percent,
  Crown,
  HandCoins,
  ChevronLeft,
  ChevronRight,
  PieChart,
  FileText,
  Sparkles,
  Check,
  CalendarDays,
  UserX,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  ExpenseItem, 
  Employee, 
  SalaryPaymentRecord, 
  ExpenseCategory, 
  PaymentMethod, 
  Invoice,
  EmployeeTransaction,
  EmployeeTransactionType,
  TRANSACTION_TYPE_CONFIG
} from '@/lib/types';
import { getMonthlyCommissionsOverview, getEmployeeCommissionStats } from '@/lib/commission-analytics';
import { MonthPicker } from '@/components/MonthPicker';

export interface GroupedExpenseItem {
  key: string;
  title: string;
  category: ExpenseCategory;
  primaryOffice: string;
  offices: string[];
  totalAmount: number;
  count: number;
  latestDate: string;
  earliestDate: string;
  paymentMethods: PaymentMethod[];
  recipients: string[];
  receiptNumbers: string[];
  items: ExpenseItem[];
}

export const DEFAULT_OFFICES = [
  'المكتب الرئيسي',
  'مكتب المبيعات والتسويق',
  'مكتب الشحن والتوزيع',
  'مكتب الإدارة والمالية',
  'المخزن والمستودع',
];

export const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; icon: any; color: string; bg: string; border: string }> = {
  SALARIES: { label: 'رواتب وأجور موظفين', icon: Users, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  RENT: { label: 'إيجارات مقرات ومخازن', icon: Building2, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  UTILITIES: { label: 'فواتير، كهرباء وإنترنت', icon: Zap, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  TRANSPORT: { label: 'نقل، بنزين ومحروقات', icon: Truck, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  MARKETING: { label: 'تسويق وإعلانات', icon: Megaphone, color: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200' },
  PACKAGING_RAW: { label: 'تعبئة وتغليف ومواد خام', icon: Package, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  MAINTENANCE: { label: 'صيانة معدات وسيارات', icon: Wrench, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  HOSPITALITY: { label: 'بوفيه، نظافة وضيافة', icon: Coffee, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  COMMISSIONS: { label: 'عمولات ومكافآت بيع', icon: Award, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  TAX_LEGAL: { label: 'ضرائب، تراخيص ومحاماة', icon: Scale, color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' },
  PARTNER_WITHDRAWAL: { label: 'مسحوبات أرباح الشركاء (مهجة / حاتم)', icon: Crown, color: 'text-cyan-800', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  EMPLOYEE_ADVANCE: { label: 'سلف موظفين ومسحوبات', icon: HandCoins, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  OTHER: { label: 'نثريات ومصروفات أخرى', icon: MoreHorizontal, color: 'text-zinc-700', bg: 'bg-zinc-100', border: 'border-zinc-300' },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, { label: string; icon: any }> = {
  CASH: { label: 'نقداً (الخزينة)', icon: Banknote },
  VODAFONE_CASH: { label: 'فودافون كاش / محفظة', icon: Smartphone },
  INSTAPAY: { label: 'إنستاباي InstaPay', icon: Send },
  BANK_TRANSFER: { label: 'تحويل بنكي', icon: Landmark },
  CHECK: { label: 'شيك بنكي', icon: FileCheck },
};

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

export interface ExpensesPayrollViewProps {
  expenses: ExpenseItem[];
  employees: Employee[];
  salaryPayments: SalaryPaymentRecord[];
  employeeTransactions?: EmployeeTransaction[];
  invoices?: Invoice[];
  onSaveExpense: (expense: ExpenseItem) => Promise<void>;
  onDeleteExpense: (expenseId: string) => Promise<void>;
  onSaveEmployee: (employee: Employee) => Promise<void>;
  onDeleteEmployee: (employeeId: string) => Promise<void>;
  onSaveSalaryPayment: (payment: SalaryPaymentRecord, autoCreateExpense?: boolean) => Promise<void>;
  onDeleteSalaryPayment: (paymentId: string) => Promise<void>;
  onSaveEmployeeTransaction?: (transaction: EmployeeTransaction, autoCreateExpense?: boolean) => Promise<void>;
  onDeleteEmployeeTransaction?: (transactionId: string) => Promise<void>;
  currentUserEmail?: string | null;
  initialTab?: 'EXPENSES' | 'PAYROLL' | 'MOVEMENTS' | 'PARTNER_SHEET' | 'EMPLOYEES' | 'ANALYTICS';
  isModal?: boolean;
  onClose?: () => void;
}

export function ExpensesPayrollView({
  expenses = [],
  employees = [],
  salaryPayments = [],
  employeeTransactions = [],
  invoices = [],
  onSaveExpense,
  onDeleteExpense,
  onSaveEmployee,
  onDeleteEmployee,
  onSaveSalaryPayment,
  onDeleteSalaryPayment,
  onSaveEmployeeTransaction,
  onDeleteEmployeeTransaction,
  currentUserEmail,
  initialTab = 'EXPENSES',
  isModal = false,
  onClose,
}: ExpensesPayrollViewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Main navigation tabs (Req.txt #6: المصروفات | الرواتب | حركات الرواتب / مسحوبات الشركاء)
  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'PAYROLL' | 'MOVEMENTS' | 'PARTNER_SHEET' | 'EMPLOYEES' | 'ANALYTICS'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Filters for Expenses
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState<string>(currentMonthStr);
  const [isAllMonthsExpenseMode, setIsAllMonthsExpenseMode] = useState<boolean>(false);
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // View mode for expenses (Grouped by item/month [Default] vs Detailed individual movements)
  const [expenseViewMode, setExpenseViewMode] = useState<'GROUPED' | 'DETAILED'>('GROUPED');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  // Partner / Profit Drawings State (مهجة & حاتم / الشركاء)
  const [selectedPartnerTab, setSelectedPartnerTab] = useState<string>('مهجة');
  const [selectedPartnerMonth, setSelectedPartnerMonth] = useState<string>('ALL');
  const [selectedPartnerYear, setSelectedPartnerYear] = useState<string>(new Date().getFullYear().toString());
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');

  // Partner Targets
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

  // Employee Views: Active Staff vs Resigned Archive
  const [employeeViewTab, setEmployeeViewTab] = useState<'ACTIVE' | 'RESIGNED'>('ACTIVE');
  const [showResignedInPayroll, setShowResignedInPayroll] = useState<boolean>(false);

  // Selected Month for Payroll view (YYYY-MM)
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState<string>(currentMonthStr);

  // Filters & State for Employee Transactions (السلف والخصومات والمكافآت خلال الشهر)
  const [selectedMovementMonth, setSelectedMovementMonth] = useState<string>(currentMonthStr);
  const [isAllMonthsMovementMode, setIsAllMonthsMovementMode] = useState<boolean>(false);
  const [movementTypeFilter, setMovementTypeFilter] = useState<'ALL' | EmployeeTransactionType>('ALL');
  const [movementEmployeeFilter, setMovementEmployeeFilter] = useState<string>('ALL');
  const [movementSearchQuery, setMovementSearchQuery] = useState('');

  // Master Month Synchronization across Expenses, Payroll, and Movements
  const handleGlobalMonthChange = (newMonth: string) => {
    setSelectedExpenseMonth(newMonth);
    setSelectedPayrollMonth(newMonth);
    setSelectedMovementMonth(newMonth);
    setIsAllMonthsExpenseMode(false);
    setIsAllMonthsMovementMode(false);
  };

  const handleTabChange = (tab: 'EXPENSES' | 'PAYROLL' | 'MOVEMENTS' | 'PARTNER_SHEET' | 'EMPLOYEES' | 'ANALYTICS') => {
    setActiveTab(tab);
    // Keep all monthly views synchronized to the currently inspected month
    const activeMonth = selectedPayrollMonth || selectedExpenseMonth || selectedMovementMonth || currentMonthStr;
    if (activeMonth) {
      setSelectedPayrollMonth(activeMonth);
      setSelectedExpenseMonth(activeMonth);
      setSelectedMovementMonth(activeMonth);
    }
  };

  // Transaction Form Modal State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<EmployeeTransaction | null>(null);
  const [txType, setTxType] = useState<EmployeeTransactionType>('ADVANCE');
  const [txEmployeeId, setTxEmployeeId] = useState<string>('');
  const [txAmount, setTxAmount] = useState<number | ''>('');
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [txSalaryMonth, setTxSalaryMonth] = useState(currentMonthStr);
  const [txPaymentMethod, setTxPaymentMethod] = useState<PaymentMethod>('CASH');
  const [txTitle, setTxTitle] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [txAutoCreateExpense, setTxAutoCreateExpense] = useState(true);
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  // Quick Transactions Management Modal from Payroll Table (Advances, Deductions, Bonuses)
  const [selectedEmpTxModal, setSelectedEmpTxModal] = useState<{
    emp: Employee;
    type: EmployeeTransactionType;
    transactions: EmployeeTransaction[];
  } | null>(null);

  // Dialogs State
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [isSalaryDisburseModalOpen, setIsSalaryDisburseModalOpen] = useState(false);
  const [disbursingEmployee, setDisbursingEmployee] = useState<Employee | null>(null);

  // Batch Salary Disburse Modal
  const [isBatchDisburseModalOpen, setIsBatchDisburseModalOpen] = useState(false);
  const [batchDisburseDate, setBatchDisburseDate] = useState(new Date().toISOString().slice(0, 10));
  const [batchPaymentMethod, setBatchPaymentMethod] = useState<PaymentMethod>('CASH');
  const [batchSelectedEmpIds, setBatchSelectedEmpIds] = useState<string[]>([]);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  // Partner Withdrawal Modal
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

  // Print Slips
  const [receiptToPrint, setReceiptToPrint] = useState<ExpenseItem | null>(null);
  const [salarySlipToPrint, setSalarySlipToPrint] = useState<SalaryPaymentRecord | null>(null);

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

  // Forms State: Salary Disbursement (CRITICAL Req.txt #6: Separation of Salary Month and Payment Date)
  const [salMonth, setSalMonth] = useState(selectedPayrollMonth);
  const [salPaymentDate, setSalPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [salBaseSalary, setSalBaseSalary] = useState<number>(0);
  const [salAllowances, setSalAllowances] = useState<number>(0);
  const [salBonuses, setSalBonuses] = useState<number>(0);
  const [salCommissions, setSalCommissions] = useState<number>(0);
  const [salCommissionInvoicesCount, setSalCommissionInvoicesCount] = useState<number>(0);
  const [salDeductions, setSalDeductions] = useState<number>(0);
  const [salAdvances, setSalAdvances] = useState<number>(0);
  const [salPaymentMethod, setSalPaymentMethod] = useState<PaymentMethod>('CASH');
  const [salNotes, setSalNotes] = useState('');
  const [isSubmittingSalary, setIsSubmittingSalary] = useState(false);
  const [editingSalaryPayment, setEditingSalaryPayment] = useState<SalaryPaymentRecord | null>(null);

  // Available Offices
  const availableOffices = useMemo(() => {
    const set = new Set<string>(DEFAULT_OFFICES);
    expenses.forEach(e => {
      if (e.office && e.office.trim()) {
        set.add(e.office.trim());
      }
    });
    return Array.from(set);
  }, [expenses]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return (expenses || []).filter(item => {
      if (!isAllMonthsExpenseMode) {
        if (!item.date.startsWith(selectedExpenseMonth)) return false;
      }
      if (selectedOfficeFilter !== 'ALL') {
        const itemOffice = (item.office || 'المكتب الرئيسي').trim();
        if (itemOffice !== selectedOfficeFilter.trim()) return false;
      }
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (paymentMethodFilter !== 'ALL' && item.paymentMethod !== paymentMethodFilter) return false;

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
  }, [expenses, isAllMonthsExpenseMode, selectedExpenseMonth, selectedOfficeFilter, categoryFilter, paymentMethodFilter, searchQuery]);

  const filteredTotalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [filteredExpenses]);

  // Distinct expense titles across all expenses for suggestions
  const distinctExpenseTitles = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach(e => {
      if (e.title && e.title.trim()) {
        set.add(e.title.trim());
      }
    });
    return Array.from(set);
  }, [expenses]);

  // Grouped Expenses by Item / Title for the current filter view (Month & Filters)
  const groupedExpenses = useMemo<GroupedExpenseItem[]>(() => {
    const map: Record<string, GroupedExpenseItem> = {};

    filteredExpenses.forEach(exp => {
      const rawTitle = (exp.title || '').trim();
      if (!rawTitle) return;
      const groupKey = rawTitle.replace(/\s+/g, ' ').toLowerCase();

      if (!map[groupKey]) {
        map[groupKey] = {
          key: groupKey,
          title: rawTitle,
          category: exp.category,
          primaryOffice: exp.office || 'المكتب الرئيسي',
          offices: [exp.office || 'المكتب الرئيسي'],
          totalAmount: 0,
          count: 0,
          latestDate: exp.date,
          earliestDate: exp.date,
          paymentMethods: [exp.paymentMethod],
          recipients: exp.recipient ? [exp.recipient] : [],
          receiptNumbers: exp.receiptNumber ? [exp.receiptNumber] : [],
          items: [],
        };
      }

      const grp = map[groupKey];
      grp.totalAmount += Number(exp.amount || 0);
      grp.count += 1;
      grp.items.push(exp);

      const off = exp.office || 'المكتب الرئيسي';
      if (!grp.offices.includes(off)) {
        grp.offices.push(off);
      }
      if (!grp.paymentMethods.includes(exp.paymentMethod)) {
        grp.paymentMethods.push(exp.paymentMethod);
      }
      if (exp.recipient && !grp.recipients.includes(exp.recipient)) {
        grp.recipients.push(exp.recipient);
      }
      if (exp.receiptNumber && !grp.receiptNumbers.includes(exp.receiptNumber)) {
        grp.receiptNumbers.push(exp.receiptNumber);
      }
      if (exp.date > grp.latestDate) {
        grp.latestDate = exp.date;
        grp.category = exp.category;
        grp.title = rawTitle;
      }
      if (exp.date < grp.earliestDate) {
        grp.earliestDate = exp.date;
      }
    });

    return Object.values(map).map(grp => {
      grp.items.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
      return grp;
    }).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredExpenses]);

  // Office Monthly Breakdown
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

  // Partner Withdrawals
  const getWithdrawalPartner = (item: ExpenseItem): string => {
    if (item.partnerName && item.partnerName.trim()) return item.partnerName.trim();
    const combined = `${item.title || ''} ${item.recipient || ''} ${item.notes || ''}`;
    if (combined.includes('حاتم')) return 'حاتم';
    return 'مهجة';
  };

  const partnerWithdrawals = useMemo(() => {
    return (expenses || []).filter(e => e.category === 'PARTNER_WITHDRAWAL' || e.isPartnerDrawing);
  }, [expenses]);

  const filteredPartnerWithdrawals = useMemo(() => {
    return partnerWithdrawals.filter(item => {
      const itemPartner = getWithdrawalPartner(item);
      if (selectedPartnerTab !== 'ALL' && itemPartner !== selectedPartnerTab) return false;
      if (selectedPartnerMonth !== 'ALL' && !item.date.startsWith(selectedPartnerMonth)) return false;
      if (selectedPartnerYear !== 'ALL' && !item.date.startsWith(selectedPartnerYear)) return false;
      if (partnerSearchQuery.trim()) {
        const q = partnerSearchQuery.trim().toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        const matchReceipt = (item.receiptNumber || '').toLowerCase().includes(q);
        if (!matchTitle && !matchNotes && !matchReceipt) return false;
      }
      return true;
    });
  }, [partnerWithdrawals, selectedPartnerTab, selectedPartnerMonth, selectedPartnerYear, partnerSearchQuery]);

  // Staff
  const activeAndOnLeaveEmployees = useMemo(() => employees.filter(e => e.status !== 'RESIGNED'), [employees]);
  const resignedEmployees = useMemo(() => employees.filter(e => e.status === 'RESIGNED'), [employees]);

  const totalMonthlyPayrollObligation = useMemo(() => {
    return activeAndOnLeaveEmployees.reduce((sum, e) => sum + Number(e.baseSalary || 0) + Number(e.fixedAllowances || 0), 0);
  }, [activeAndOnLeaveEmployees]);

  // Commissions
  const monthlyCommissionsMap = useMemo(() => {
    return getMonthlyCommissionsOverview(invoices, employees, selectedPayrollMonth).byEmployee;
  }, [invoices, employees, selectedPayrollMonth]);

  // Filtered Employee Transactions (Advances, Deductions, Bonuses)
  const filteredEmployeeTransactions = useMemo(() => {
    return (employeeTransactions || []).filter(item => {
      if (!isAllMonthsMovementMode) {
        if (item.salaryMonth !== selectedMovementMonth && !item.date.startsWith(selectedMovementMonth)) return false;
      }
      if (movementTypeFilter !== 'ALL' && item.type !== movementTypeFilter) return false;
      if (movementEmployeeFilter !== 'ALL' && item.employeeId !== movementEmployeeFilter) return false;

      if (movementSearchQuery.trim()) {
        const q = movementSearchQuery.trim().toLowerCase();
        const matchEmp = (item.employeeName || '').toLowerCase().includes(q);
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        if (!matchEmp && !matchTitle && !matchNotes) return false;
      }
      return true;
    });
  }, [employeeTransactions, isAllMonthsMovementMode, selectedMovementMonth, movementTypeFilter, movementEmployeeFilter, movementSearchQuery]);

  const movementSummary = useMemo(() => {
    let totalAdvances = 0;
    let totalDeductions = 0;
    let totalBonuses = 0;
    let advancesCount = 0;
    let deductionsCount = 0;
    let bonusesCount = 0;

    filteredEmployeeTransactions.forEach(t => {
      if (t.type === 'ADVANCE') {
        totalAdvances += Number(t.amount || 0);
        advancesCount++;
      } else if (t.type === 'DEDUCTION') {
        totalDeductions += Number(t.amount || 0);
        deductionsCount++;
      } else if (t.type === 'BONUS') {
        totalBonuses += Number(t.amount || 0);
        bonusesCount++;
      }
    });

    return {
      totalAdvances,
      totalDeductions,
      totalBonuses,
      advancesCount,
      deductionsCount,
      bonusesCount,
      totalCount: filteredEmployeeTransactions.length,
      netDeductions: (totalAdvances + totalDeductions) - totalBonuses,
    };
  }, [filteredEmployeeTransactions]);

  // Payroll data for selected month
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

      // Automatically calculate advances, deductions, and bonuses logged for this employee for this month
      const empTransactions = (employeeTransactions || []).filter(
        t => t.employeeId === emp.id && (t.salaryMonth === selectedPayrollMonth || t.date.startsWith(selectedPayrollMonth))
      );

      const autoAdvances = empTransactions
        .filter(t => t.type === 'ADVANCE')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const autoDeductions = empTransactions
        .filter(t => t.type === 'DEDUCTION')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const autoBonuses = empTransactions
        .filter(t => t.type === 'BONUS')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const bonuses = existingPayment?.bonuses !== undefined 
        ? Number(existingPayment.bonuses) 
        : autoBonuses;
      const deductions = existingPayment?.deductions !== undefined 
        ? Number(existingPayment.deductions) 
        : autoDeductions;
      const advances = existingPayment?.advances !== undefined 
        ? Number(existingPayment.advances) 
        : autoAdvances;

      const netCalculated = existingPayment
        ? existingPayment.netPaid
        : Math.max(0, baseSalary + allowances + commissions + bonuses - deductions - advances);

      return {
        employee: emp,
        payment: existingPayment,
        isPaid,
        baseSalary,
        allowances,
        commissions,
        commissionInvoicesCount,
        bonuses,
        deductions,
        advances,
        netPaid: netCalculated,
        status: isPaid ? 'PAID' : 'UNPAID',
        transactions: empTransactions,
        advancesCount: empTransactions.filter(t => t.type === 'ADVANCE').length,
        deductionsCount: empTransactions.filter(t => t.type === 'DEDUCTION').length,
        bonusesCount: empTransactions.filter(t => t.type === 'BONUS').length,
      };
    });
  }, [employees, salaryPayments, selectedPayrollMonth, monthlyCommissionsMap, employeeTransactions]);

  const displayedPayrollData = useMemo(() => {
    if (showResignedInPayroll) return monthPayrollData;
    return monthPayrollData.filter(item => item.employee.status !== 'RESIGNED');
  }, [monthPayrollData, showResignedInPayroll]);

  const monthPayrollSummary = useMemo(() => {
    let totalObligation = 0;
    let totalPaid = 0;
    let totalCommissions = 0;
    let totalAdvances = 0;
    let totalDeductions = 0;
    let totalBonuses = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    monthPayrollData.forEach(item => {
      if (item.employee.status !== 'RESIGNED') {
        const empObligation = item.baseSalary + item.allowances + item.commissions + item.bonuses - item.deductions - item.advances;
        totalObligation += Math.max(0, empObligation);
        totalCommissions += item.commissions;
        totalAdvances += item.advances;
        totalDeductions += item.deductions;
        totalBonuses += item.bonuses;
        if (!item.isPaid) unpaidCount++;
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
      totalAdvances,
      totalDeductions,
      totalBonuses,
      remainingUnpaid: Math.max(0, totalObligation - totalPaid),
      paidCount,
      unpaidCount,
    };
  }, [monthPayrollData]);

  // Handlers: Open New Expense
  const handleOpenNewExpense = (presetCategory?: ExpenseCategory, presetTitle?: string, presetOffice?: string) => {
    setEditingExpense(null);
    setExpTitle(presetTitle || '');
    setExpAmount('');
    setExpCategory(presetCategory || 'OTHER');
    setExpPaymentMethod('CASH');
    setExpDate(new Date().toISOString().slice(0, 10));
    setExpRecipient('');
    setExpReceiptNumber('');
    setExpOffice(presetOffice || (selectedOfficeFilter !== 'ALL' ? selectedOfficeFilter : 'المكتب الرئيسي'));
    setExpPartnerName(selectedPartnerTab === 'ALL' ? 'مهجة' : selectedPartnerTab);
    setExpNotes('');
    setIsExpenseFormOpen(true);
  };

  // Existing expenses in same month for the current title being typed in modal
  const existingSameMonthExpenses = useMemo(() => {
    if (!expTitle.trim()) return [];
    const targetMonth = expDate ? expDate.slice(0, 7) : selectedExpenseMonth;
    const targetTitle = expTitle.trim().toLowerCase();
    return expenses.filter(e => 
      e.date.startsWith(targetMonth) && 
      e.title.trim().toLowerCase() === targetTitle &&
      e.id !== editingExpense?.id
    );
  }, [expenses, expTitle, expDate, selectedExpenseMonth, editingExpense]);

  const existingMonthSum = useMemo(() => {
    return existingSameMonthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [existingSameMonthExpenses]);

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

  // Handlers: Open Salary Disbursement (Req.txt #6)
  const handleOpenDisburseSalary = (emp: Employee, paymentToEdit?: SalaryPaymentRecord) => {
    const existing = paymentToEdit || salaryPayments.find(
      p => p.employeeId === emp.id && (p.salaryMonth || p.month) === selectedPayrollMonth
    );
    setEditingSalaryPayment(existing || null);
    setDisbursingEmployee(emp);

    const initialMonth = existing?.salaryMonth || existing?.month || selectedPayrollMonth;
    setSalMonth(initialMonth);

    // CRITICAL Req.txt #6: Preserve actual paymentDate if editing!
    setSalPaymentDate(existing?.paymentDate || new Date().toISOString().slice(0, 10));

    setSalBaseSalary(existing ? existing.baseSalary : Number(emp.baseSalary || 0));
    setSalAllowances(existing ? existing.allowances : Number(emp.fixedAllowances || 0));

    const stats = getEmployeeCommissionStats(invoices, emp.id, initialMonth);
    setSalCommissions(existing?.commissions !== undefined ? existing.commissions : stats.totalCommissions);
    setSalCommissionInvoicesCount(existing?.commissionInvoicesCount !== undefined ? existing.commissionInvoicesCount : stats.invoicesCount);

    // Load advances, deductions, bonuses from logged transactions
    const empTx = (employeeTransactions || []).filter(
      t => t.employeeId === emp.id && (t.salaryMonth === initialMonth || t.date.startsWith(initialMonth))
    );
    const autoAdvances = empTx.filter(t => t.type === 'ADVANCE').reduce((s, t) => s + Number(t.amount || 0), 0);
    const autoDeductions = empTx.filter(t => t.type === 'DEDUCTION').reduce((s, t) => s + Number(t.amount || 0), 0);
    const autoBonuses = empTx.filter(t => t.type === 'BONUS').reduce((s, t) => s + Number(t.amount || 0), 0);

    setSalBonuses(existing?.bonuses !== undefined ? existing.bonuses : autoBonuses);
    setSalDeductions(existing?.deductions !== undefined ? existing.deductions : autoDeductions);
    setSalAdvances(existing?.advances !== undefined ? existing.advances : autoAdvances);
    setSalPaymentMethod(existing ? existing.paymentMethod : 'CASH');
    setSalNotes(existing?.notes || '');
    setIsSalaryDisburseModalOpen(true);
  };

  const handleSalaryMonthChange = (newMonth: string) => {
    setSalMonth(newMonth);
    // Auto refresh commissions, advances, deductions if disbursing a new payment for a different month
    if (!editingSalaryPayment && disbursingEmployee) {
      const stats = getEmployeeCommissionStats(invoices, disbursingEmployee.id, newMonth);
      setSalCommissions(stats.totalCommissions);
      setSalCommissionInvoicesCount(stats.invoicesCount);

      const empTx = (employeeTransactions || []).filter(
        t => t.employeeId === disbursingEmployee.id && (t.salaryMonth === newMonth || t.date.startsWith(newMonth))
      );
      setSalBonuses(empTx.filter(t => t.type === 'BONUS').reduce((s, t) => s + Number(t.amount || 0), 0));
      setSalDeductions(empTx.filter(t => t.type === 'DEDUCTION').reduce((s, t) => s + Number(t.amount || 0), 0));
      setSalAdvances(empTx.filter(t => t.type === 'ADVANCE').reduce((s, t) => s + Number(t.amount || 0), 0));
    }
  };

  // Handlers: Employee Transactions (Advances, Deductions, Bonuses)
  const handleOpenNewTransaction = (presetType?: EmployeeTransactionType, presetEmployeeId?: string) => {
    setEditingTx(null);
    const type = presetType || 'ADVANCE';
    setTxType(type);
    setTxEmployeeId(presetEmployeeId || (employees[0]?.id || ''));
    setTxAmount('');
    setTxDate(new Date().toISOString().slice(0, 10));
    setTxSalaryMonth(selectedPayrollMonth || currentMonthStr);
    setTxPaymentMethod('CASH');
    setTxTitle(type === 'ADVANCE' ? 'سلفة نقدية' : type === 'DEDUCTION' ? 'خصم / جزاء' : 'مكافأة وحافز');
    setTxNotes('');
    setTxAutoCreateExpense(type === 'ADVANCE');
    setIsTxModalOpen(true);
  };

  const handleOpenEditTransaction = (tx: EmployeeTransaction) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setTxEmployeeId(tx.employeeId);
    setTxAmount(tx.amount);
    setTxDate(tx.date);
    setTxSalaryMonth(tx.salaryMonth);
    setTxPaymentMethod(tx.paymentMethod || 'CASH');
    setTxTitle(tx.title);
    setTxNotes(tx.notes || '');
    setTxAutoCreateExpense(Boolean(tx.expenseId));
    setIsTxModalOpen(true);
  };

  const handleSaveTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txEmployeeId || Number(txAmount) <= 0 || !txTitle.trim()) return;

    const emp = employees.find(e => e.id === txEmployeeId);
    if (!emp) return;

    setIsSubmittingTx(true);
    try {
      const nowIso = new Date().toISOString();
      const txToSave: EmployeeTransaction = {
        id: editingTx?.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        employeeId: emp.id,
        employeeName: emp.name,
        type: txType,
        amount: Number(txAmount),
        date: txDate,
        salaryMonth: txSalaryMonth,
        paymentMethod: txType === 'ADVANCE' ? txPaymentMethod : undefined,
        title: txTitle.trim(),
        notes: txNotes.trim() || undefined,
        expenseId: editingTx?.expenseId,
        settled: editingTx?.settled || false,
        createdAt: editingTx?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      if (onSaveEmployeeTransaction) {
        await onSaveEmployeeTransaction(txToSave, txType === 'ADVANCE' && txAutoCreateExpense);
      }
      setIsTxModalOpen(false);
      setEditingTx(null);
      confetti({ particleCount: 30, spread: 50 });
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const handleSaveSalaryDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disbursingEmployee) return;

    setIsSubmittingSalary(true);
    try {
      const netToPay = Math.max(0, salBaseSalary + salAllowances + salBonuses + salCommissions - salDeductions - salAdvances);
      const nowIso = new Date().toISOString();

      let recordId = editingSalaryPayment?.id;
      if (!recordId) {
        const existingInCurrent = salaryPayments.find(
          p => p.employeeId === disbursingEmployee.id && (p.salaryMonth || p.month) === selectedPayrollMonth
        );
        if (existingInCurrent) recordId = existingInCurrent.id;
      }
      if (!recordId) {
        recordId = `sal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      }

      const paymentRecord: SalaryPaymentRecord = {
        id: recordId,
        employeeId: disbursingEmployee.id,
        employeeName: disbursingEmployee.name,
        month: salMonth,
        salaryMonth: salMonth, // Req.txt #6: Explicit Salary Month
        paymentDate: salPaymentDate, // Req.txt #6: Actual Payment Date
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
      confetti({ particleCount: 35, spread: 50 });
    } finally {
      setIsSubmittingSalary(false);
    }
  };

  // CSV Exports
  const handleExportExpensesCSV = () => {
    if (filteredExpenses.length === 0) return;

    if (expenseViewMode === 'GROUPED') {
      const headers = ['بند المصروف', 'التصنيف', 'المكتب / الفرع', 'عدد الحركات', 'أول تاريخ صرف', 'آخر تاريخ صرف', 'طرق الدفع', 'المستلمون', 'إجمالي المبلغ المنصرف'];
      const rows = groupedExpenses.map(g => [
        `"${(g.title || '').replace(/"/g, '""')}"`,
        `"${CATEGORY_CONFIG[g.category]?.label || g.category}"`,
        `"${g.offices.join(' - ').replace(/"/g, '""')}"`,
        g.count,
        g.earliestDate,
        g.latestDate,
        `"${g.paymentMethods.map(m => PAYMENT_METHOD_LABELS[m]?.label || m).join(' - ')}"`,
        `"${g.recipients.join(' - ').replace(/"/g, '""')}"`,
        g.totalAmount,
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `المصروفات_المجمعة_${selectedExpenseMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const headers = ['المعرف', 'التاريخ', 'البند / البيان', 'المبلغ', 'المكتب / الفرع', 'التصنيف', 'طريقة الدفع', 'المستلم', 'رقم الإيصال', 'ملاحظات'];
    const rows = filteredExpenses.map(e => [
      e.id,
      e.date,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      e.amount,
      `"${(e.office || 'المكتب الرئيسي').replace(/"/g, '""')}"`,
      `"${CATEGORY_CONFIG[e.category]?.label || e.category}"`,
      `"${PAYMENT_METHOD_LABELS[e.paymentMethod]?.label || e.paymentMethod}"`,
      `"${(e.recipient || '').replace(/"/g, '""')}"`,
      `"${(e.receiptNumber || '').replace(/"/g, '""')}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `المصروفات_التفصيلية_${selectedExpenseMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatEGP = (val: number) => {
    return new Intl.NumberFormat('ar-EG', {
      maximumFractionDigits: 2,
    }).format(val) + ' ج.م';
  };

  const containerClasses = isModal
    ? 'relative w-full max-w-6xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]'
    : 'w-full space-y-5';

  return (
    <div className={containerClasses} dir="rtl">
      
      {/* 1. Header (Req.txt #6): Title + Summary Badges + Primary Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              إدارة المصروفات التشغيلية والرواتب
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              {expenses.length} حركة مصروف
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              {employees.length} موظف وعامل
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            تسجيل المصروفات اليومية والمكاتب، مسير رواتب الموظفين مع الفصل بين شهر الراتب وتاريخ الصرف، ومسحوبات الشركاء.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleExportExpensesCSV}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير Excel</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenNewTransaction('ADVANCE')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            title="تسجيل سلفة نقدية لأي موظف في أي وقت من الشهر"
          >
            <HandCoins className="w-4 h-4 text-rose-600" />
            <span>+ سلفة موظف</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenNewTransaction('DEDUCTION')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            title="تسجيل خصم أو جزاء على موظف"
          >
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span>+ خصم / جزاء</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenNewExpense()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ تسجيل مصروف</span>
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Compact Metric Strip (Req.txt #6: "ثم Summary صغير" - No giant cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Month Expenses */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">إجمالي المصروفات ({isAllMonthsExpenseMode ? 'الكل' : selectedExpenseMonth})</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-rose-700 mt-1">
            {formatEGP(filteredTotalAmount)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {expenseViewMode === 'GROUPED'
              ? `${groupedExpenses.length} بند مجمع (${filteredExpenses.length} حركة صرف)`
              : `${filteredExpenses.length} حركة صرف مسجلة`}
          </div>
        </div>

        {/* Monthly Payroll Obligation */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">الرواتب التعاقدية الأساسية</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-purple-700 mt-1">
            {formatEGP(totalMonthlyPayrollObligation)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            الأساسي والبدلات الثابتة لـ {activeAndOnLeaveEmployees.length} موظف نشط
          </div>
        </div>

        {/* Active Movements (Advances & Deductions) */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">سلف وخصومات ({formatArabicMonth(selectedPayrollMonth)})</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <HandCoins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-amber-800 mt-1">
            {formatEGP(monthPayrollSummary.totalAdvances + monthPayrollSummary.totalDeductions)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            سلف: {formatEGP(monthPayrollSummary.totalAdvances)} • خصومات: {formatEGP(monthPayrollSummary.totalDeductions)}
          </div>
        </div>

        {/* Unpaid Salaries for Selected Month */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">رواتب متبقية لشهر ({formatArabicMonth(selectedPayrollMonth)})</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1">
            {formatEGP(monthPayrollSummary.remainingUnpaid)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {monthPayrollSummary.unpaidCount} موظف بانتظار الصرف
            {(monthPayrollSummary.totalAdvances + monthPayrollSummary.totalDeductions) > 0 && (
              <span className="text-amber-700 font-mono text-[10px] block sm:inline sm:mr-1">
                (صافي بعد خصم {formatEGP(monthPayrollSummary.totalAdvances + monthPayrollSummary.totalDeductions)} استقطاعات)
              </span>
            )}
          </div>
        </div>

      </div>

      {/* 3. Navigation Tabs (Req.txt #6: المصروفات | الرواتب | حركات الرواتب / مسحوبات الشركاء) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          
          <button
            type="button"
            onClick={() => handleTabChange('EXPENSES')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'EXPENSES'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <span>سجل المصروفات العامة ({expenseViewMode === 'GROUPED' ? groupedExpenses.length : filteredExpenses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('PAYROLL')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'PAYROLL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>مسير الرواتب الشهري</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('MOVEMENTS')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'MOVEMENTS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HandCoins className="w-4 h-4 text-rose-400" />
            <span>السلف والخصومات (حركات الموظفين)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'MOVEMENTS' ? 'bg-slate-700 text-slate-100' : 'bg-rose-100 text-rose-800'
            }`}>
              {filteredEmployeeTransactions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('PARTNER_SHEET')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'PARTNER_SHEET'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Crown className="w-4 h-4 text-cyan-500" />
            <span>شيت مسحوبات الشركاء (مهجة / حاتم)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('EMPLOYEES')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'EMPLOYEES'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-500" />
            <span>سجل الموظفين والعمال ({activeAndOnLeaveEmployees.length})</span>
          </button>

        </div>
      </div>

      {/* 4. Tab 1: EXPENSES DATA TABLE */}
      {activeTab === 'EXPENSES' && (
        <div className="space-y-4">
          
          {/* Compact Expenses Toolbar (Req.txt #7) */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="ابحث بالبند، المكتب، المستلم، رقم السند أو الملاحظات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* View Mode Toggle: Grouped (Default) vs Detailed */}
              <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setExpenseViewMode('GROUPED')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    expenseViewMode === 'GROUPED'
                      ? 'bg-white text-rose-700 shadow-xs border border-rose-100'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="تجميع المصروفات الشهرية لنفس البند (مثال: 500 + 700 = 1,200 ج.م)"
                >
                  <PieChart className="w-3.5 h-3.5" />
                  <span>عرض مجمع بالبند</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-50 text-rose-800 font-mono">
                    {groupedExpenses.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseViewMode('DETAILED')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    expenseViewMode === 'DETAILED'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="عرض تفصيلي لكل حركة صرف على حدة"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>عرض تفصيلي</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
                    {filteredExpenses.length}
                  </span>
                </button>
              </div>

              {/* Expand / Collapse All for Grouped Mode */}
              {expenseViewMode === 'GROUPED' && groupedExpenses.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const allOpen = Object.values(expandedGroups).filter(Boolean).length === groupedExpenses.length;
                    if (allOpen) {
                      setExpandedGroups({});
                    } else {
                      const next: Record<string, boolean> = {};
                      groupedExpenses.forEach(g => { next[g.key] = true; });
                      setExpandedGroups(next);
                    }
                  }}
                  className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                  title="توسيع أو طي تفاصيل جميع البنود"
                >
                  {Object.values(expandedGroups).filter(Boolean).length === groupedExpenses.length
                    ? 'طي تفاصيل الكل'
                    : 'توسيع تفاصيل الكل'}
                </button>
              )}

              {/* Month Selector */}
              <MonthPicker
                value={selectedExpenseMonth}
                onChange={handleGlobalMonthChange}
                variant="default"
                size="sm"
              />

              {/* Office Selector */}
              <select
                value={selectedOfficeFilter}
                onChange={(e) => setSelectedOfficeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer focus:outline-hidden"
              >
                <option value="ALL">جميع المكاتب ({availableOffices.length})</option>
                {availableOffices.map(off => (
                  <option key={off} value={off}>{off}</option>
                ))}
              </select>

              {/* Category Selector */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer focus:outline-hidden"
              >
                <option value="ALL">جميع التصنيفات</option>
                {Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => (
                  <option key={cat} value={cat}>{cfg.label}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Expenses Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {filteredExpenses.length === 0 ? (
              <div className="py-14 text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-1">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">لا توجد حركات مصروفات تطابق الفلترة</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  اختر شهراً آخر أو مكتباً مختلفاً، أو اضغط على &quot;تسجيل مصروف جديد&quot;.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenNewExpense()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل أول مصروف الآن</span>
                </button>
              </div>
            ) : expenseViewMode === 'GROUPED' ? (
              /* Grouped Mode Table (المصروفات المجمعة شهرياً حسب البند) */
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">بند المصروف (البيان)</th>
                      <th className="py-3 px-4">التصنيف</th>
                      <th className="py-3 px-4">المكتب / الفرع</th>
                      <th className="py-3 px-4">فترة / آخر حركة</th>
                      <th className="py-3 px-4">طرق الدفع</th>
                      <th className="py-3 px-4">إجمالي المنصرف</th>
                      <th className="py-3 px-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groupedExpenses.map((grp) => {
                      const catConfig = CATEGORY_CONFIG[grp.category] || CATEGORY_CONFIG.OTHER;
                      const isExpanded = Boolean(expandedGroups[grp.key]);

                      return (
                        <React.Fragment key={grp.key}>
                          <tr
                            onClick={() => toggleGroupExpand(grp.key)}
                            className={`cursor-pointer transition-colors ${
                              isExpanded ? 'bg-rose-50/30' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleGroupExpand(grp.key);
                                  }}
                                  className={`p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-transform ${
                                    isExpanded ? 'rotate-180 text-rose-600' : ''
                                  }`}
                                  title={isExpanded ? 'طي التفاصيل' : 'عرض التفاصيل'}
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                                <div>
                                  <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                                    <span>{grp.title}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                                      grp.count > 1 ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {grp.count > 1 ? `${grp.count} حركات صرف` : 'حركة واحدة'}
                                    </span>
                                  </div>
                                  {grp.recipients.length > 0 && (
                                    <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                                      الجهة: {grp.recipients.join('، ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}>
                                <span>{catConfig.label}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                <span>{grp.offices.length === 1 ? grp.offices[0] : `${grp.offices[0]} (+${grp.offices.length - 1})`}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                              {grp.count === 1 ? (
                                <span>{grp.latestDate}</span>
                              ) : (
                                <div>
                                  <span className="font-semibold text-slate-800">{grp.latestDate}</span>
                                  <span className="text-[10px] text-slate-400 block">من {grp.earliestDate}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                              <div className="flex items-center gap-1 flex-wrap max-w-xs">
                                {grp.paymentMethods.map(m => (
                                  <span key={m} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-700">
                                    {PAYMENT_METHOD_LABELS[m]?.label || m}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap font-mono font-black text-rose-700 text-sm sm:text-base">
                              {formatEGP(grp.totalAmount)}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleGroupExpand(grp.key)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                  title="عرض أو إخفاء حركات الصرف الفردية"
                                >
                                  <span>{isExpanded ? 'إخفاء' : `تفاصيل (${grp.count})`}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenNewExpense(grp.category, grp.title, grp.primaryOffice)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                                  title="إضافة حركة صرف جديدة لنفس هذا البند"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">صرف جديد</span>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Sub-movements Accordion */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 border-b border-slate-200">
                              <td colSpan={7} className="p-3 sm:p-4">
                                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                                  <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-2">
                                      <Layers className="w-4 h-4 text-rose-600" />
                                      <span className="font-bold text-slate-800">
                                        حركات الصرف التفصيلية لبند &quot;{grp.title}&quot; ({formatArabicMonth(selectedExpenseMonth)})
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 font-mono">
                                        {grp.count} حركات
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                      <span className="text-slate-500 font-mono">
                                        الإجمالي المجمع: <strong className="text-rose-700 font-bold">{formatEGP(grp.totalAmount)}</strong>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenNewExpense(grp.category, grp.title, grp.primaryOffice)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>إضافة حركة جديدة لهذا البند</span>
                                      </button>
                                    </div>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-right text-xs">
                                      <thead className="bg-slate-100/60 text-slate-600 font-semibold border-b border-slate-200">
                                        <tr>
                                          <th className="py-2.5 px-3">#</th>
                                          <th className="py-2.5 px-3">تاريخ الحركة</th>
                                          <th className="py-2.5 px-3">المبلغ</th>
                                          <th className="py-2.5 px-3">طريقة الدفع</th>
                                          <th className="py-2.5 px-3">المكتب / الفرع</th>
                                          <th className="py-2.5 px-3">المستلم / السند</th>
                                          <th className="py-2.5 px-3">ملاحظات</th>
                                          <th className="py-2.5 px-3 text-center">الإجراءات</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {grp.items.map((subExp, subIdx) => {
                                          const methodConfig = PAYMENT_METHOD_LABELS[subExp.paymentMethod] || PAYMENT_METHOD_LABELS.CASH;
                                          return (
                                            <tr key={subExp.id} className="hover:bg-slate-50/80 transition-colors">
                                              <td className="py-2 px-3 font-mono text-slate-400">
                                                {subIdx + 1}
                                              </td>
                                              <td className="py-2 px-3 font-mono text-slate-700 whitespace-nowrap">
                                                {subExp.date}
                                              </td>
                                              <td className="py-2 px-3 font-mono font-bold text-rose-700 whitespace-nowrap">
                                                {formatEGP(subExp.amount)}
                                              </td>
                                              <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                                                {methodConfig.label}
                                              </td>
                                              <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                                                {subExp.office || 'المكتب الرئيسي'}
                                              </td>
                                              <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                                                {subExp.recipient || subExp.partnerName || '—'}
                                                {subExp.receiptNumber && (
                                                  <span className="text-[10px] text-slate-400 font-mono block">
                                                    سند #{subExp.receiptNumber}
                                                  </span>
                                                )}
                                              </td>
                                              <td className="py-2 px-3 text-slate-500 max-w-xs truncate" title={subExp.notes}>
                                                {subExp.notes || '—'}
                                              </td>
                                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1">
                                                  <button
                                                    type="button"
                                                    onClick={() => handleOpenEditExpense(subExp)}
                                                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                                    title="تعديل هذه الحركة"
                                                  >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      if (window.confirm(`هل أنت متأكد من حذف حركة الصرف بقيمة ${subExp.amount} ج.م بتاريخ ${subExp.date}؟`)) {
                                                        onDeleteExpense(subExp.id);
                                                      }
                                                    }}
                                                    className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                                    title="حذف هذه الحركة"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Detailed Mode Table (كل حركة على حدة) */
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">التاريخ</th>
                      <th className="py-3 px-4">البيان / البند</th>
                      <th className="py-3 px-4">المكتب / الفرع</th>
                      <th className="py-3 px-4">التصنيف</th>
                      <th className="py-3 px-4">طريقة الدفع</th>
                      <th className="py-3 px-4">المستلم / السند</th>
                      <th className="py-3 px-4">المبلغ</th>
                      <th className="py-3 px-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.map((exp) => {
                      const catConfig = CATEGORY_CONFIG[exp.category] || CATEGORY_CONFIG.OTHER;
                      const methodConfig = PAYMENT_METHOD_LABELS[exp.paymentMethod] || PAYMENT_METHOD_LABELS.CASH;

                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-4 whitespace-nowrap font-mono text-slate-600">
                            {exp.date}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900 max-w-xs truncate" title={exp.title}>
                            {exp.title}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{exp.office || 'المكتب الرئيسي'}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}>
                              <span>{catConfig.label}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap text-slate-600">
                            {methodConfig.label}
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap text-slate-600">
                            {exp.recipient || exp.partnerName || '—'}
                            {exp.receiptNumber && (
                              <span className="text-[10px] text-slate-400 font-mono block">
                                سند #{exp.receiptNumber}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap font-mono font-bold text-rose-700 text-xs sm:text-sm">
                            {formatEGP(exp.amount)}
                          </td>
                          <td className="py-2.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditExpense(exp)}
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="تعديل المصروف"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`هل أنت متأكد من حذف مصروف "${exp.title}" بقيمة ${exp.amount} ج.م؟`)) {
                                    onDeleteExpense(exp.id);
                                  }
                                }}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
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
                </table>
              </div>
            )}

            {/* Table Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2 font-mono">
              <div>
                {expenseViewMode === 'GROUPED' ? (
                  <span>
                    عرض <strong>{groupedExpenses.length}</strong> بند مجمع (بإجمالي <strong>{filteredExpenses.length}</strong> حركة صرف فردية)
                  </span>
                ) : (
                  <span>
                    عرض <strong>{filteredExpenses.length}</strong> حركة مصروف
                  </span>
                )}
              </div>
              <div>
                إجمالي المصروفات المعروضة: <strong className="text-rose-700">{formatEGP(filteredTotalAmount)}</strong>
              </div>
            </div>

          </div>

          {/* Office Breakdown Summary Table at Bottom */}
          {officeMonthlyBreakdown.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>توزيع المصروفات حسب المكاتب والفروع لشهر ({selectedExpenseMonth}):</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
                {officeMonthlyBreakdown.map(o => (
                  <div key={o.office} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="font-semibold text-slate-700 truncate" title={o.office}>{o.office}</div>
                    <div className="font-bold font-mono text-slate-900 mt-1">{formatEGP(o.total)}</div>
                    <div className="text-[10px] text-slate-400">{o.count} حركة • {o.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* 5. Tab 2: PAYROLL DATA TABLE (Strictly preserving Req.txt #6) */}
      {activeTab === 'PAYROLL' && (
        <div className="space-y-4">
          
          {/* Payroll Toolbar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">شهر مسير الرواتب:</span>
              <MonthPicker
                value={selectedPayrollMonth}
                onChange={handleGlobalMonthChange}
                variant="purple"
                size="sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                المسدد: <strong className="text-emerald-700 font-mono">{formatEGP(monthPayrollSummary.totalPaid)}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">
                المتبقي: <strong className="text-rose-700 font-mono">{formatEGP(monthPayrollSummary.remainingUnpaid)}</strong>
              </span>
            </div>

          </div>

          {/* Payroll Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">الموظف / العامل</th>
                    <th className="py-3 px-4">الوظيفة</th>
                    <th className="py-3 px-4">الراتب الأساسي</th>
                    <th className="py-3 px-4">البدلات</th>
                    <th className="py-3 px-4">العمولات</th>
                    <th className="py-3 px-4">المكافآت (+)</th>
                    <th className="py-3 px-4">الخصومات (-)</th>
                    <th className="py-3 px-4">السلف (-)</th>
                    <th className="py-3 px-4">الصافي المستحق</th>
                    <th className="py-3 px-4 text-center">حالة الصرف</th>
                    <th className="py-3 px-4">تاريخ الصرف الفعلي</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedPayrollData.map((item) => {
                    const hasPaid = item.isPaid;

                    return (
                      <tr key={item.employee.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {item.employee.name}
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          {item.employee.jobTitle}
                        </td>

                        <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                          {formatEGP(item.baseSalary)}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-600">
                          {item.allowances > 0 ? formatEGP(item.allowances) : '—'}
                        </td>

                        <td className="py-3 px-4 font-mono text-indigo-700">
                          {item.commissions > 0 ? (
                            <span>{formatEGP(item.commissions)} ({item.commissionInvoicesCount} فواتير)</span>
                          ) : '—'}
                        </td>

                        <td className="py-3 px-4 font-mono text-emerald-700">
                          {item.bonuses > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                const empBonuses = (employeeTransactions || []).filter(
                                  t => t.employeeId === item.employee.id &&
                                       t.type === 'BONUS' &&
                                       (t.salaryMonth === selectedPayrollMonth || t.date.startsWith(selectedPayrollMonth))
                                );
                                setSelectedEmpTxModal({
                                  emp: item.employee,
                                  type: 'BONUS',
                                  transactions: empBonuses,
                                });
                              }}
                              className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                              title={`عرض وتعديل/حذف مكافآت (${item.employee.name}): ${item.bonusesCount || 1} حركة`}
                            >
                              <span>+{formatEGP(item.bonuses)}</span>
                              <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1 rounded-full font-sans font-bold">
                                {item.bonusesCount || 1}
                              </span>
                            </button>
                          ) : '—'}
                        </td>

                        <td className="py-3 px-4 font-mono text-red-700">
                          {item.deductions > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                const empDeductions = (employeeTransactions || []).filter(
                                  t => t.employeeId === item.employee.id &&
                                       t.type === 'DEDUCTION' &&
                                       (t.salaryMonth === selectedPayrollMonth || t.date.startsWith(selectedPayrollMonth))
                                );
                                setSelectedEmpTxModal({
                                  emp: item.employee,
                                  type: 'DEDUCTION',
                                  transactions: empDeductions,
                                });
                              }}
                              className="inline-flex items-center gap-1 font-semibold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-lg border border-red-200 transition-colors cursor-pointer"
                              title={`عرض وتعديل/حذف خصومات (${item.employee.name}): ${item.deductionsCount || 1} جزاء`}
                            >
                              <span>-{formatEGP(item.deductions)}</span>
                              <span className="text-[10px] bg-red-200 text-red-800 px-1 rounded-full font-sans font-bold">
                                {item.deductionsCount || 1}
                              </span>
                            </button>
                          ) : '—'}
                        </td>

                        <td className="py-3 px-4 font-mono text-rose-700">
                          {item.advances > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                const empAdvances = (employeeTransactions || []).filter(
                                  t => t.employeeId === item.employee.id &&
                                       t.type === 'ADVANCE' &&
                                       (t.salaryMonth === selectedPayrollMonth || t.date.startsWith(selectedPayrollMonth))
                                );
                                setSelectedEmpTxModal({
                                  emp: item.employee,
                                  type: 'ADVANCE',
                                  transactions: empAdvances,
                                });
                              }}
                              className="inline-flex items-center gap-1 font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                              title={`عرض وتعديل/حذف سلف (${item.employee.name}): ${item.advancesCount || 1} سلفة`}
                            >
                              <span>-{formatEGP(item.advances)}</span>
                              <span className="text-[10px] bg-rose-200 text-rose-800 px-1 rounded-full font-sans font-bold">
                                {item.advancesCount || 1}
                              </span>
                            </button>
                          ) : '—'}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-900 text-xs sm:text-sm">
                          {formatEGP(item.netPaid)}
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {hasPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>تم الصرف</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              <span>لم يصرف</span>
                            </span>
                          )}
                        </td>

                        {/* Req.txt #6: Actual Payment Date */}
                        <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {item.payment?.paymentDate || '—'}
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenDisburseSalary(item.employee, item.payment)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                hasPaid
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                              }`}
                            >
                              {hasPaid ? 'تعديل السجل' : 'صرف الراتب'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenNewTransaction('ADVANCE', item.employee.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="تسجيل سلفة نقدية لهذا الموظف"
                            >
                              <HandCoins className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2 font-mono">
              <div className="flex items-center gap-3 flex-wrap">
                <span>إجمالي الالتزامات: <strong>{formatEGP(monthPayrollSummary.totalObligation)}</strong></span>
                {monthPayrollSummary.totalAdvances > 0 && <span>• سلف: <strong className="text-rose-700">{formatEGP(monthPayrollSummary.totalAdvances)}</strong></span>}
                {monthPayrollSummary.totalDeductions > 0 && <span>• خصومات: <strong className="text-red-700">{formatEGP(monthPayrollSummary.totalDeductions)}</strong></span>}
                {monthPayrollSummary.totalBonuses > 0 && <span>• مكافآت: <strong className="text-emerald-700">{formatEGP(monthPayrollSummary.totalBonuses)}</strong></span>}
              </div>
              <div className="flex items-center gap-3">
                <span>تم صرف: <strong className="text-emerald-700">{formatEGP(monthPayrollSummary.totalPaid)}</strong></span>
                <span>المتبقي: <strong className="text-rose-700">{formatEGP(monthPayrollSummary.remainingUnpaid)}</strong></span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 5.5 Tab: MOVEMENTS DATA TABLE (سجل السلف والخصومات والمكافآت خلال الشهر) */}
      {activeTab === 'MOVEMENTS' && (
        <div className="space-y-4">
          
          {/* Movements Toolbar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="ابحث باسم الموظف، سبب السلفة أو الخصم، الملاحظات..."
                value={movementSearchQuery}
                onChange={(e) => setMovementSearchQuery(e.target.value)}
                className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Month Selector */}
              <MonthPicker
                value={selectedMovementMonth}
                onChange={handleGlobalMonthChange}
                variant="default"
                size="sm"
              />

              <button
                type="button"
                onClick={() => setIsAllMonthsMovementMode(!isAllMonthsMovementMode)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                  isAllMonthsMovementMode
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isAllMonthsMovementMode ? 'عرض شهر محدد' : 'عرض كافة الشهور'}
              </button>

              {/* Movement Type Filter */}
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer focus:outline-hidden"
              >
                <option value="ALL">كافة الحركات (سلف، خصومات، مكافآت)</option>
                <option value="ADVANCE">السلف النقدية فقط</option>
                <option value="DEDUCTION">الخصومات والجزاءات فقط</option>
                <option value="BONUS">المكافآت والحوافز فقط</option>
              </select>

              {/* Employee Filter */}
              <select
                value={movementEmployeeFilter}
                onChange={(e) => setMovementEmployeeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer focus:outline-hidden"
              >
                <option value="ALL">جميع الموظفين والعمال ({employees.length})</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>

              {/* Action Buttons */}
              <button
                type="button"
                onClick={() => handleOpenNewTransaction('ADVANCE')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <HandCoins className="w-3.5 h-3.5" />
                <span>+ سلفة جديدة</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenNewTransaction('DEDUCTION')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>+ تسجيل خصم</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenNewTransaction('BONUS')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <Award className="w-3.5 h-3.5 text-emerald-700" />
                <span>+ مكافأة</span>
              </button>
            </div>
          </div>

          {/* Movements Summary KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="text-[11px] text-slate-500 font-semibold flex items-center justify-between">
                <span>إجمالي السلف النقدية</span>
                <HandCoins className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-base font-bold font-mono text-rose-700 mt-1">
                {formatEGP(movementSummary.totalAdvances)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{movementSummary.advancesCount} سلفة مسجلة</div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="text-[11px] text-slate-500 font-semibold flex items-center justify-between">
                <span>الخصومات والجزاءات</span>
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              </div>
              <div className="text-base font-bold font-mono text-red-700 mt-1">
                {formatEGP(movementSummary.totalDeductions)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{movementSummary.deductionsCount} جزاء مسجل</div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="text-[11px] text-slate-500 font-semibold flex items-center justify-between">
                <span>المكافآت والحوافز</span>
                <Award className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-base font-bold font-mono text-emerald-700 mt-1">
                {formatEGP(movementSummary.totalBonuses)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{movementSummary.bonusesCount} مكافأة مسجلة</div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="text-[11px] text-slate-500 font-semibold flex items-center justify-between">
                <span>صافي الخصم من الرواتب</span>
                <Scale className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="text-base font-bold font-mono text-slate-900 mt-1">
                {formatEGP(movementSummary.netDeductions)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">سلف + خصومات - مكافآت</div>
            </div>
          </div>

          {/* Movements Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {filteredEmployeeTransactions.length === 0 ? (
              <div className="py-14 text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-1">
                  <HandCoins className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  لا توجد حركات مسجلة لشهر ({formatArabicMonth(selectedMovementMonth) || selectedMovementMonth})
                </h3>
                {(employeeTransactions || []).length > 0 && !isAllMonthsMovementMode ? (
                  <div className="py-2">
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 inline-block max-w-md mx-auto font-medium">
                      توجد <strong>{(employeeTransactions || []).length} حركة مسجلة</strong> في شهور أخرى. يمكنك استعراضها بالضغط على الزر أدناه:
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAllMonthsMovementMode(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors cursor-pointer"
                      >
                        <span>عرض كافة الشهور ({(employeeTransactions || []).length} حركة)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    يمكنك تسجيل سلفة نقدية أو خصم أو مكافأة لأي موظف في أي وقت من الشهر بضغطة واحدة.
                  </p>
                )}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenNewTransaction('ADVANCE')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
                  >
                    <HandCoins className="w-4 h-4" />
                    <span>+ تسجيل سلفة الآن</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenNewTransaction('DEDUCTION')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span>+ تسجيل خصم أو جزاء</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">تاريخ الحركة</th>
                      <th className="py-3 px-4">الموظف / العامل</th>
                      <th className="py-3 px-4">نوع الحركة</th>
                      <th className="py-3 px-4">السبب / البيان</th>
                      <th className="py-3 px-4">شهر الراتب المستحق</th>
                      <th className="py-3 px-4">طريقة الصرف</th>
                      <th className="py-3 px-4">المبلغ</th>
                      <th className="py-3 px-4 text-center">أثر الحركة على الراتب</th>
                      <th className="py-3 px-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployeeTransactions.map((tx) => {
                      const cfg = TRANSACTION_TYPE_CONFIG[tx.type] || TRANSACTION_TYPE_CONFIG.ADVANCE;
                      const emp = employees.find(e => e.id === tx.employeeId);
                      const isSettled = tx.settled || Boolean(
                        salaryPayments.find(p => p.employeeId === tx.employeeId && (p.salaryMonth || p.month) === tx.salaryMonth && p.status === 'PAID')
                      );

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-4 whitespace-nowrap font-mono text-slate-600">
                            {tx.date}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                            <div>{tx.employeeName}</div>
                            {emp && <span className="text-[10px] text-slate-400 font-normal">{emp.jobTitle}</span>}
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                              <span>{cfg.label}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-800 max-w-xs truncate" title={tx.title}>
                            <div>{tx.title}</div>
                            {tx.notes && <span className="text-[10px] text-slate-400 block truncate">{tx.notes}</span>}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-semibold">
                              {formatArabicMonth(tx.salaryMonth) || tx.salaryMonth}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap text-slate-600">
                            {tx.paymentMethod ? (
                              PAYMENT_METHOD_LABELS[tx.paymentMethod]?.label || tx.paymentMethod
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap font-mono font-bold text-xs sm:text-sm">
                            <span className={cfg.color}>
                              {cfg.sign}{formatEGP(tx.amount)}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center whitespace-nowrap">
                            {isSettled ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>تمت التسوية بالراتب</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3" />
                                <span>معلق (بانتظار مسير الشهر)</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditTransaction(tx)}
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="تعديل الحركة"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`هل أنت متأكد من حذف حركة (${cfg.label} - ${tx.employeeName}) بقيمة ${tx.amount} ج.م؟`)) {
                                    if (onDeleteEmployeeTransaction) {
                                      onDeleteEmployeeTransaction(tx.id);
                                    }
                                  }
                                }}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
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
                </table>
              </div>
            )}

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2 font-mono">
              <div>
                عدد الحركات: <strong>{filteredEmployeeTransactions.length}</strong> حركة
              </div>
              <div className="flex items-center gap-3">
                <span>إجمالي السلف: <strong className="text-rose-700">{formatEGP(movementSummary.totalAdvances)}</strong></span>
                <span>• الخصومات: <strong className="text-red-700">{formatEGP(movementSummary.totalDeductions)}</strong></span>
                <span>• المكافآت: <strong className="text-emerald-700">{formatEGP(movementSummary.totalBonuses)}</strong></span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 6. Tab 3: PARTNER WITHDRAWALS TABLE */}
      {activeTab === 'PARTNER_SHEET' && (
        <div className="space-y-4">
          
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedPartnerTab('مهجة')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedPartnerTab === 'مهجة'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                مسحوبات مهجة
              </button>

              <button
                type="button"
                onClick={() => setSelectedPartnerTab('حاتم')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedPartnerTab === 'حاتم'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                مسحوبات حاتم
              </button>

              <button
                type="button"
                onClick={() => setSelectedPartnerTab('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedPartnerTab === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                كافة الشركاء
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setPartPartnerName(selectedPartnerTab === 'ALL' ? 'مهجة' : selectedPartnerTab);
                setPartAmount('');
                setPartDate(new Date().toISOString().slice(0, 10));
                setPartTitle(`دفعة من الأرباح السنوية (${selectedPartnerTab === 'ALL' ? 'مهجة' : selectedPartnerTab})`);
                setIsPartnerWithdrawalModalOpen(true);
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تسجيل سحب جديد للشريك</span>
            </button>
          </div>

          {/* Partner Withdrawals Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">الشريك المستفيد</th>
                    <th className="py-3 px-4">البيان</th>
                    <th className="py-3 px-4">طريقة الصرف</th>
                    <th className="py-3 px-4">رقم السند</th>
                    <th className="py-3 px-4">المبلغ المسحوب</th>
                    <th className="py-3 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPartnerWithdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        لا توجد مسحوبات مسجلة لهذا الشريك
                      </td>
                    </tr>
                  ) : (
                    filteredPartnerWithdrawals.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-slate-600">{item.date}</td>
                        <td className="py-2.5 px-4 font-bold text-cyan-900">{getWithdrawalPartner(item)}</td>
                        <td className="py-2.5 px-4 text-slate-800">{item.title}</td>
                        <td className="py-2.5 px-4 text-slate-600">{PAYMENT_METHOD_LABELS[item.paymentMethod]?.label || item.paymentMethod}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">{item.receiptNumber || '—'}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-cyan-800">{formatEGP(item.amount)}</td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`هل أنت متأكد من حذف حركة سحب ${getWithdrawalPartner(item)} بقيمة ${item.amount} ج.م؟`)) {
                                onDeleteExpense(item.id);
                              }
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-mono">
              <div>عدد الحركات: <strong>{filteredPartnerWithdrawals.length}</strong></div>
              <div>إجمالي المسحوبات: <strong className="text-cyan-800">{formatEGP(filteredPartnerWithdrawals.reduce((s, i) => s + Number(i.amount || 0), 0))}</strong></div>
            </div>

          </div>

        </div>
      )}

      {/* 7. Tab 4: EMPLOYEES DIRECTORY */}
      {activeTab === 'EMPLOYEES' && (
        <div className="space-y-4">
          
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEmployeeViewTab('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  employeeViewTab === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                الموظفون على رأس العمل ({activeAndOnLeaveEmployees.length})
              </button>

              <button
                type="button"
                onClick={() => setEmployeeViewTab('RESIGNED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  employeeViewTab === 'RESIGNED'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                أرشيف المستقيلين ({resignedEmployees.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
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
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ إضافة موظف / عامل جديد</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">الاسم</th>
                    <th className="py-3 px-4">المسمى الوظيفي</th>
                    <th className="py-3 px-4">رقم الهاتف</th>
                    <th className="py-3 px-4">الراتب الأساسي</th>
                    <th className="py-3 px-4">البدلات الثابتة</th>
                    <th className="py-3 px-4">نسبة العمولة</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4">تاريخ التعيين</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(employeeViewTab === 'ACTIVE' ? activeAndOnLeaveEmployees : resignedEmployees).map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{emp.name}</td>
                      <td className="py-2.5 px-4 text-slate-600">{emp.jobTitle}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600" dir="ltr">{emp.phone || '—'}</td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">{formatEGP(emp.baseSalary)}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">{emp.fixedAllowances ? formatEGP(emp.fixedAllowances) : '0 ج.م'}</td>
                      <td className="py-2.5 px-4 font-mono text-purple-700">{emp.defaultCommissionRate ? `${emp.defaultCommissionRate}%` : '—'}</td>
                      <td className="py-2.5 px-4">
                        {emp.status === 'ACTIVE' ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">نشط</span>
                        ) : emp.status === 'ON_LEAVE' ? (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">إجازة</span>
                        ) : (
                          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">مستقيل</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">{emp.joinDate || '—'}</td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
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
                            }}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`هل أنت متأكد من حذف الموظف "${emp.name}"؟`)) {
                                onDeleteEmployee(emp.id);
                              }
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODALS (Forms for Expense, Employee, Salary Disburse, Partner Withdrawal) */}
      {/* ========================================================================= */}
      {/* Form 1: Add/Edit Expense Modal */}
      {isExpenseFormOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" dir="rtl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingExpense ? 'تعديل بند المصروف' : 'تسجيل مصروف جديد'}
              </h3>
              <button onClick={() => setIsExpenseFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveExpenseSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">بيان المصروف *</label>
                <input
                  type="text"
                  required
                  list="expense-titles-list"
                  value={expTitle}
                  onChange={e => {
                    const val = e.target.value;
                    setExpTitle(val);
                    if (!editingExpense && val.trim()) {
                      const matched = expenses.find(x => x.title.trim().toLowerCase() === val.trim().toLowerCase());
                      if (matched) {
                        if (matched.category) setExpCategory(matched.category);
                        if (matched.office) setExpOffice(matched.office);
                      }
                    }
                  }}
                  placeholder="مثال: سوبر ماركت، كهرباء، صيانة..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                />
                <datalist id="expense-titles-list">
                  {distinctExpenseTitles.map(t => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المبلغ (ج.م) *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    value={expAmount}
                    onChange={e => setExpAmount(parseFloat(e.target.value) || '')}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">التاريخ *</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={e => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المكتب / الفرع</label>
                  <select
                    value={expOffice}
                    onChange={e => setExpOffice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    {availableOffices.map(off => (
                      <option key={off} value={off}>{off}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">التصنيف</label>
                  <select
                    value={expCategory}
                    onChange={e => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => (
                      <option key={cat} value={cat}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">طريقة الدفع</label>
                  <select
                    value={expPaymentMethod}
                    onChange={e => setExpPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([m, cfg]) => (
                      <option key={m} value={m}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المستلم / الجهة</label>
                  <input
                    type="text"
                    value={expRecipient}
                    onChange={e => setExpRecipient(e.target.value)}
                    placeholder="مثال: شركة الكهرباء"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={expNotes}
                  onChange={e => setExpNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Aggregation helper banner in form */}
              {existingSameMonthExpenses.length > 0 && Number(expAmount) > 0 && !editingExpense && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>تجميع تلقائي خلال شهر ({expDate.slice(0, 7)}):</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-200 text-rose-900 font-mono">
                        {existingSameMonthExpenses.length} حركة سابقة
                      </span>
                    </div>
                    <div className="text-[11px] leading-relaxed text-rose-700">
                      يوجد سابقاً لبند &quot;{expTitle}&quot; مصروفات مسجلة بقيمة <strong>{formatEGP(existingMonthSum)}</strong>.
                      عند إضافة (<strong>{formatEGP(Number(expAmount))}</strong>)، سيتم تجميعها في الجدول والتقارير ليصبح الإجمالي: <strong className="text-rose-900 font-bold">{formatEGP(existingMonthSum + Number(expAmount))}</strong>.
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseFormOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExpense}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  {isSubmittingExpense ? 'جارِ الحفظ...' : 'حفظ المصروف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form 2: Salary Disbursement Modal (CRITICAL Req.txt #6: Separate Salary Month and Payment Date) */}
      {isSalaryDisburseModalOpen && disbursingEmployee && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" dir="rtl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  صرف راتب: {disbursingEmployee.name}
                </h3>
                <span className="text-[11px] text-slate-500">{disbursingEmployee.jobTitle}</span>
              </div>
              <button onClick={() => setIsSalaryDisburseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveSalaryDisburseSubmit} className="p-4 space-y-3 text-xs">
              {/* Separate Salary Month & Payment Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 rounded-xl bg-purple-50/50 border border-purple-200/80">
                <div>
                  <label className="block font-bold text-purple-900 mb-1">
                    شهر الراتب (Salary Month) *
                  </label>
                  <MonthPicker
                    value={salMonth}
                    onChange={handleSalaryMonthChange}
                    variant="purple"
                    size="md"
                    className="w-full"
                  />
                  <span className="text-[10px] text-purple-700 mt-1 block">الشهر الذي يخصه الراتب</span>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    تاريخ الصرف (Payment Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={salPaymentDate}
                    onChange={e => setSalPaymentDate(e.target.value)}
                    className="w-full h-9 px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white font-mono text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">تاريخ خروج النقدية الفعلي ({formatArabicDate(salPaymentDate)})</span>
                </div>
              </div>

              {/* Employee Logged Transactions Preview during this month */}
              {(() => {
                const empTx = (employeeTransactions || []).filter(
                  t => t.employeeId === disbursingEmployee.id && (t.salaryMonth === salMonth || t.date.startsWith(salMonth))
                );
                if (empTx.length === 0) {
                  return (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>لا توجد سلف أو خصومات مسجلة خلال شهر ({formatArabicMonth(salMonth) || salMonth}).</span>
                      <span className="text-[10px] text-slate-400">يمكن إدخال مبالغ يدوياً أدناه</span>
                    </div>
                  );
                }
                return (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <HandCoins className="w-3.5 h-3.5 text-purple-600" />
                        <span>الحركات المسجلة للموظف لشهر ({formatArabicMonth(salMonth) || salMonth}):</span>
                      </span>
                      <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                        محتسبة تلقائياً ({empTx.length} حركات)
                      </span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto divide-y divide-slate-100">
                      {empTx.map(tx => {
                        const cfg = TRANSACTION_TYPE_CONFIG[tx.type];
                        return (
                          <div key={tx.id} className="pt-1 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border shrink-0 ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                {cfg.label}
                              </span>
                              <span className="text-slate-700 font-medium truncate">{tx.title}</span>
                              <span className="text-slate-400 font-mono text-[10px] shrink-0">({tx.date})</span>
                            </div>
                            <span className={`font-mono font-bold shrink-0 mr-2 ${cfg.color}`}>
                              {cfg.sign}{formatEGP(tx.amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Salary Breakdown Numbers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الراتب الأساسي</label>
                  <input
                    type="number"
                    value={salBaseSalary}
                    onChange={e => setSalBaseSalary(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">البدلات الثابتة</label>
                  <input
                    type="number"
                    value={salAllowances}
                    onChange={e => setSalAllowances(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    عمولات المبيعات
                    {salCommissionInvoicesCount > 0 && (
                      <span className="text-[10px] text-indigo-600 font-normal mr-1">
                        ({salCommissionInvoicesCount} فواتير)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={salCommissions}
                    onChange={e => setSalCommissions(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-mono text-indigo-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-800 mb-1">المكافآت والحوافز (+)</label>
                  <input
                    type="number"
                    value={salBonuses}
                    onChange={e => setSalBonuses(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-emerald-200 rounded-lg bg-emerald-50/30 font-mono text-emerald-700 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-red-800 mb-1">الخصومات والجزاءات (-)</label>
                  <input
                    type="number"
                    value={salDeductions}
                    onChange={e => setSalDeductions(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-red-200 rounded-lg bg-red-50/30 font-mono text-red-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-rose-800 mb-1">السلف المسحوبة (-)</label>
                  <input
                    type="number"
                    value={salAdvances}
                    onChange={e => setSalAdvances(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-rose-200 rounded-lg bg-rose-50/30 font-mono text-rose-700 font-semibold"
                  />
                </div>
              </div>

              {/* Net Calculated Banner */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-emerald-800">الصافي المنصرف:</div>
                  <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                    {formatEGP(Math.max(0, salBaseSalary + salAllowances + salBonuses + salCommissions - salDeductions - salAdvances))}
                  </div>
                </div>
                <div className="text-left">
                  <label className="text-[11px] text-slate-600 block mb-0.5">طريقة السداد</label>
                  <select
                    value={salPaymentMethod}
                    onChange={e => setSalPaymentMethod(e.target.value as PaymentMethod)}
                    className="px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([m, cfg]) => (
                      <option key={m} value={m}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                {editingSalaryPayment && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm(`هل أنت متأكد من إلغاء صرف راتب (${disbursingEmployee.name}) لشهر (${editingSalaryPayment.salaryMonth || editingSalaryPayment.month})؟ سيتم إعادة الموظف لقائمة بانتظار الصرف واستعادة الراتب المتبقي فوراً.`)) {
                        await onDeleteSalaryPayment(editingSalaryPayment.id);
                        setIsSalaryDisburseModalOpen(false);
                        setEditingSalaryPayment(null);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>إلغاء الصرف</span>
                  </button>
                )}
                <div className="flex items-center gap-2 mr-auto">
                  <button
                    type="button"
                    onClick={() => setIsSalaryDisburseModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSalary}
                    className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                  >
                    {isSubmittingSalary ? 'جارِ الحفظ...' : 'توثيق صرف الراتب'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form 3: Partner Withdrawal Modal */}
      {isPartnerWithdrawalModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" dir="rtl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                تسجيل سحب أرباح شريك ({partPartnerName})
              </h3>
              <button onClick={() => setIsPartnerWithdrawalModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <form onSubmit={async (e) => {
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
                confetti({ particleCount: 30, spread: 50 });
              } finally {
                setIsSubmittingPartnerWithdrawal(false);
              }
            }} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">الشريك المستفيد</label>
                <select
                  value={partPartnerName}
                  onChange={e => setPartPartnerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                >
                  <option value="مهجة">مهجة</option>
                  <option value="حاتم">حاتم</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المبلغ المسحوب (ج.م) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={partAmount}
                    onChange={e => setPartAmount(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">التاريخ *</label>
                  <input
                    type="date"
                    required
                    value={partDate}
                    onChange={e => setPartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPartnerWithdrawalModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPartnerWithdrawal}
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
                >
                  {isSubmittingPartnerWithdrawal ? 'جارِ الحفظ...' : 'توثيق السحب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form 4: Add/Edit Employee Modal */}
      {isEmployeeFormOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" dir="rtl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingEmployee ? 'تعديل بيانات موظف' : 'إضافة موظف / عامل جديد'}
              </h3>
              <button onClick={() => setIsEmployeeFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <form onSubmit={async (e) => {
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
            }} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">اسم الموظف / العامل *</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={e => setEmpName(e.target.value)}
                  placeholder="الاسم ثلاثي"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الوظيفة *</label>
                  <input
                    type="text"
                    required
                    value={empJobTitle}
                    onChange={e => setEmpJobTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={empPhone}
                    onChange={e => setEmpPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-mono"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الراتب الأساسي (ج.م) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={empBaseSalary}
                    onChange={e => setEmpBaseSalary(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">البدلات الثابتة (ج.م)</label>
                  <input
                    type="number"
                    value={empFixedAllowances}
                    onChange={e => setEmpFixedAllowances(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نسبة العمولة الافتراضية (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={empDefaultCommissionRate}
                    onChange={e => setEmpDefaultCommissionRate(parseFloat(e.target.value) || '')}
                    placeholder="اختياري"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">حالة العمل</label>
                  <select
                    value={empStatus}
                    onChange={e => setEmpStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    <option value="ACTIVE">نشط وعلى رأس العمل</option>
                    <option value="ON_LEAVE">إجازة</option>
                    <option value="RESIGNED">مستقيل</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmployeeFormOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEmployee}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isSubmittingEmployee ? 'جارِ الحفظ...' : 'حفظ بيانات الموظف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form 5: Employee Transaction (Advance / Deduction / Bonus) Modal */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" dir="rtl">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                  txType === 'ADVANCE' ? 'bg-rose-100 text-rose-700' :
                  txType === 'DEDUCTION' ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {txType === 'ADVANCE' ? '💸' : txType === 'DEDUCTION' ? '⚠️' : '🎁'}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingTx ? 'تعديل حركة موظف' : (
                      txType === 'ADVANCE' ? 'تسجيل سلفة موظف جديدة' :
                      txType === 'DEDUCTION' ? 'تسجيل خصم أو جزاء على موظف' :
                      'تسجيل مكافأة أو حافز لموظف'
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    يمكن تسجيل الحركة في أي يوم من الشهر وتُخصم أو تُضاف تلقائياً في مسير الرواتب
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsTxModalOpen(false); setEditingTx(null); }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTransactionSubmit} className="p-4 space-y-3.5 text-xs">
              {/* Type Selector (Advance / Deduction / Bonus) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">نوع الحركة المالية *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('ADVANCE');
                      if (!editingTx) {
                        setTxTitle('سلفة نقدية');
                        setTxAutoCreateExpense(true);
                      }
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      txType === 'ADVANCE'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>💸</span>
                    <span>سلفة نقدية</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('DEDUCTION');
                      if (!editingTx) {
                        setTxTitle('خصم / جزاء');
                        setTxAutoCreateExpense(false);
                      }
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      txType === 'DEDUCTION'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>⚠️</span>
                    <span>خصم / جزاء</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('BONUS');
                      if (!editingTx) {
                        setTxTitle('مكافأة وحافز');
                        setTxAutoCreateExpense(false);
                      }
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      txType === 'BONUS'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>🎁</span>
                    <span>مكافأة / إضافي</span>
                  </button>
                </div>
              </div>

              {/* Employee Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">الموظف المعني *</label>
                <select
                  value={txEmployeeId}
                  onChange={e => setTxEmployeeId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs font-medium"
                >
                  <option value="" disabled>-- اختر الموظف --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.jobTitle}) - راتب أساسي: {emp.baseSalary.toLocaleString('en-US')} ج.م
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    المبلغ (ج.م) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={txAmount}
                    onChange={e => setTxAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-mono font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    تاريخ حدوث الحركة *
                  </label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={e => {
                      const newDate = e.target.value;
                      setTxDate(newDate);
                      if (newDate && (!txSalaryMonth || txSalaryMonth === txDate.slice(0, 7))) {
                        setTxSalaryMonth(newDate.slice(0, 7));
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Salary Month & Reason / Title */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    تُخصم / تُضاف لراتب شهر *
                  </label>
                  <input
                    type="month"
                    required
                    value={txSalaryMonth}
                    onChange={e => setTxSalaryMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    البيان / السبب *
                  </label>
                  <input
                    type="text"
                    required
                    value={txTitle}
                    onChange={e => setTxTitle(e.target.value)}
                    placeholder={
                      txType === 'ADVANCE' ? 'مثال: سلفة نقدية على الحساب' :
                      txType === 'DEDUCTION' ? 'مثال: غياب يوم بدون إذن' :
                      'مثال: حافز إنجاز ومجهود إضافي'
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* If Advance: Payment Method & Treasury Sync Checkbox */}
              {txType === 'ADVANCE' && (
                <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl space-y-2.5">
                  <div>
                    <label className="block font-semibold text-rose-950 mb-1">طريقة صرف السلفة (من أين صُرفت؟)</label>
                    <select
                      value={txPaymentMethod}
                      onChange={e => setTxPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-1.5 border border-rose-200 rounded-lg bg-white text-xs"
                    >
                      <option value="CASH">كاش (من الخزينة النقدية)</option>
                      <option value="VODAFONE_CASH">فودافون كاش / محفظة</option>
                      <option value="INSTAPAY">إنستاباي / تحويل بنكي</option>
                    </select>
                  </div>

                  {!editingTx && (
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={txAutoCreateExpense}
                        onChange={e => setTxAutoCreateExpense(e.target.checked)}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                      />
                      <span className="text-rose-900 font-medium text-[11px]">
                        تسجيل خروج المبلغ فوراً كمصروف في الخزينة العامة (بند: سلف موظفين)
                      </span>
                    </label>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ملاحظات إضافية (اختياري)</label>
                <textarea
                  value={txNotes}
                  onChange={e => setTxNotes(e.target.value)}
                  rows={2}
                  placeholder="أي تفاصيل أو ملاحظات أخرى خاصة بالحركة..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsTxModalOpen(false); setEditingTx(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTx}
                  className={`px-5 py-2 rounded-xl text-white font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                    txType === 'ADVANCE'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : txType === 'DEDUCTION'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isSubmittingTx ? 'جارِ الحفظ...' : editingTx ? 'حفظ التعديلات' : (
                    txType === 'ADVANCE' ? 'تسجيل السلفة' : txType === 'DEDUCTION' ? 'تسجيل الخصم' : 'تسجيل المكافأة'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Modal: View & Delete Employee Transactions (Advances, Deductions, Bonuses) from Payroll Table */}
      {selectedEmpTxModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" dir="rtl">
            <div className={`p-4 border-b border-slate-200 flex items-center justify-between ${
              selectedEmpTxModal.type === 'ADVANCE' ? 'bg-rose-50' :
              selectedEmpTxModal.type === 'DEDUCTION' ? 'bg-red-50' :
              'bg-emerald-50'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                  selectedEmpTxModal.type === 'ADVANCE' ? 'bg-rose-100 text-rose-700' :
                  selectedEmpTxModal.type === 'DEDUCTION' ? 'bg-red-100 text-red-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {selectedEmpTxModal.type === 'ADVANCE' ? <HandCoins className="w-4 h-4" /> :
                   selectedEmpTxModal.type === 'DEDUCTION' ? <TrendingDown className="w-4 h-4" /> :
                   <Award className="w-4 h-4" />}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {selectedEmpTxModal.type === 'ADVANCE' ? `سلف الموظف: ${selectedEmpTxModal.emp.name}` :
                     selectedEmpTxModal.type === 'DEDUCTION' ? `خصومات وجزاءات: ${selectedEmpTxModal.emp.name}` :
                     `مكافآت وحوافز: ${selectedEmpTxModal.emp.name}`}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    شهر استحقاق ({formatArabicMonth(selectedPayrollMonth)}) • {
                      selectedEmpTxModal.type === 'ADVANCE' ? 'حذف أي سلفة يستعيدها فوراً للرواتب المتبقية والخزينة' :
                      selectedEmpTxModal.type === 'DEDUCTION' ? 'حذف أي جزاء يستعيده فوراً لصافي الراتب المستحق' :
                      'المكافآت تضاف لصافي الراتب المستحق'
                    }
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmpTxModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3">
              {selectedEmpTxModal.transactions.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  لا توجد حركات مسجلة لهذا الموظف في هذا الشهر
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {selectedEmpTxModal.transactions.map(tx => (
                    <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <span>{tx.title || (tx.type === 'ADVANCE' ? 'سلفة نقدية' : tx.type === 'DEDUCTION' ? 'خصم / جزاء' : 'مكافأة')}</span>
                          <span className={`font-mono font-bold ${
                            tx.type === 'ADVANCE' ? 'text-rose-700' :
                            tx.type === 'DEDUCTION' ? 'text-red-700' :
                            'text-emerald-700'
                          }`}>
                            {tx.type === 'BONUS' ? '+' : '-'}{formatEGP(tx.amount)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                          <span>{tx.date}</span>
                          {tx.paymentMethod && (
                            <>
                              <span>•</span>
                              <span>{PAYMENT_METHOD_LABELS[tx.paymentMethod]?.label || tx.paymentMethod}</span>
                            </>
                          )}
                          {tx.notes && (
                            <>
                              <span>•</span>
                              <span className="truncate">{tx.notes}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          const typeLabel = tx.type === 'ADVANCE' ? 'السلفة' : tx.type === 'DEDUCTION' ? 'الخصم' : 'المكافأة';
                          if (window.confirm(`هل أنت متأكد من حذف ${typeLabel} (${tx.title || typeLabel}) بقيمة ${tx.amount} ج.م؟ سيتم تحديث الرواتب فوراً.`)) {
                            if (onDeleteEmployeeTransaction) {
                              await onDeleteEmployeeTransaction(tx.id);
                            }
                            const remaining = selectedEmpTxModal.transactions.filter(t => t.id !== tx.id);
                            if (remaining.length === 0) {
                              setSelectedEmpTxModal(null);
                            } else {
                              setSelectedEmpTxModal({
                                ...selectedEmpTxModal,
                                transactions: remaining,
                              });
                            }
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="حذف هذه الحركة واستعادة الراتب"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const empId = selectedEmpTxModal.emp.id;
                    const type = selectedEmpTxModal.type;
                    setSelectedEmpTxModal(null);
                    handleOpenNewTransaction(type, empId);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                    selectedEmpTxModal.type === 'ADVANCE' ? 'text-rose-700 bg-rose-50 hover:bg-rose-100' :
                    selectedEmpTxModal.type === 'DEDUCTION' ? 'text-red-700 bg-red-50 hover:bg-red-100' :
                    'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  <span>+ إضافة {selectedEmpTxModal.type === 'ADVANCE' ? 'سلفة أخرى' : selectedEmpTxModal.type === 'DEDUCTION' ? 'خصم آخر' : 'مكافأة أخرى'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedEmpTxModal(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
