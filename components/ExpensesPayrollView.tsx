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
  invoices?: Invoice[];
  onSaveExpense: (expense: ExpenseItem) => Promise<void>;
  onDeleteExpense: (expenseId: string) => Promise<void>;
  onSaveEmployee: (employee: Employee) => Promise<void>;
  onDeleteEmployee: (employeeId: string) => Promise<void>;
  onSaveSalaryPayment: (payment: SalaryPaymentRecord, autoCreateExpense?: boolean) => Promise<void>;
  onDeleteSalaryPayment: (paymentId: string) => Promise<void>;
  currentUserEmail?: string | null;
  isModal?: boolean;
  onClose?: () => void;
}

export function ExpensesPayrollView({
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
  currentUserEmail,
  isModal = false,
  onClose,
}: ExpensesPayrollViewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Main navigation tabs (Req.txt #6: المصروفات | الرواتب | حركات الرواتب / مسحوبات الشركاء)
  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'PAYROLL' | 'PARTNER_SHEET' | 'EMPLOYEES' | 'ANALYTICS'>('EXPENSES');

  // Filters for Expenses
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState<string>(currentMonthStr);
  const [isAllMonthsExpenseMode, setIsAllMonthsExpenseMode] = useState<boolean>(false);
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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

  const displayedPayrollData = useMemo(() => {
    if (showResignedInPayroll) return monthPayrollData;
    return monthPayrollData.filter(item => item.employee.status !== 'RESIGNED');
  }, [monthPayrollData, showResignedInPayroll]);

  const monthPayrollSummary = useMemo(() => {
    let totalObligation = 0;
    let totalPaid = 0;
    let totalCommissions = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    monthPayrollData.forEach(item => {
      if (item.employee.status !== 'RESIGNED') {
        totalObligation += item.baseSalary + item.allowances + item.commissions;
        totalCommissions += item.commissions;
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
    link.setAttribute('download', `المصروفات_${selectedExpenseMonth}.csv`);
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
            onClick={() => handleOpenNewExpense()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
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
            {filteredExpenses.length} حركة صرف مسجلة
          </div>
        </div>

        {/* Monthly Payroll Obligation */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">التزامات رواتب الموظفين</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-purple-700 mt-1">
            {formatEGP(totalMonthlyPayrollObligation)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            لكل {activeAndOnLeaveEmployees.length} موظف وعامل نشط
          </div>
        </div>

        {/* Top Office Consumption */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">أعلى مكتب استهلاكاً</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-sm sm:text-base font-bold text-amber-800 mt-1 truncate">
            {officeMonthlyBreakdown[0] ? officeMonthlyBreakdown[0].office : '—'}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
            {officeMonthlyBreakdown[0] ? `${formatEGP(officeMonthlyBreakdown[0].total)} (${officeMonthlyBreakdown[0].percentage}%)` : 'لا توجد حركات'}
          </div>
        </div>

        {/* Unpaid Salaries for Selected Month */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">رواتب متبقية لشهر ({selectedPayrollMonth})</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1">
            {formatEGP(monthPayrollSummary.remainingUnpaid)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {monthPayrollSummary.unpaidCount} موظف بانتظار الصرف
          </div>
        </div>

      </div>

      {/* 3. Navigation Tabs (Req.txt #6: المصروفات | الرواتب | حركات الرواتب / مسحوبات الشركاء) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          
          <button
            type="button"
            onClick={() => setActiveTab('EXPENSES')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'EXPENSES'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <span>سجل المصروفات العامة ({filteredExpenses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PAYROLL')}
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
            onClick={() => setActiveTab('PARTNER_SHEET')}
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
            onClick={() => setActiveTab('EMPLOYEES')}
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
              {/* Month Selector */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 gap-1 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="month"
                  value={selectedExpenseMonth}
                  onChange={(e) => {
                    setSelectedExpenseMonth(e.target.value);
                    setIsAllMonthsExpenseMode(false);
                  }}
                  className="bg-transparent text-xs font-bold font-mono outline-hidden cursor-pointer text-slate-700"
                />
              </div>

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
            ) : (
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
                عرض <strong>{filteredExpenses.length}</strong> حركة مصروف
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
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 gap-1 text-xs">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                <input
                  type="month"
                  value={selectedPayrollMonth}
                  onChange={(e) => setSelectedPayrollMonth(e.target.value)}
                  className="bg-transparent text-xs font-bold font-mono outline-hidden cursor-pointer text-slate-800"
                />
              </div>
              <span className="text-xs text-purple-700 font-bold hidden sm:inline">
                ({formatArabicMonth(selectedPayrollMonth)})
              </span>
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
                    <th className="py-3 px-4">الخصومات والسلف</th>
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

                        <td className="py-3 px-4 font-mono text-rose-700">
                          {(item.deductions + item.advances) > 0 ? (
                            <span>-{formatEGP(item.deductions + item.advances)}</span>
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
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2 font-mono">
              <div>
                إجمالي التزامات رواتب الشهر: <strong>{formatEGP(monthPayrollSummary.totalObligation)}</strong>
              </div>
              <div className="flex items-center gap-3">
                <span>تم صرف: <strong className="text-emerald-700">{formatEGP(monthPayrollSummary.totalPaid)}</strong></span>
                <span>المتبقي: <strong className="text-rose-700">{formatEGP(monthPayrollSummary.remainingUnpaid)}</strong></span>
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
                  value={expTitle}
                  onChange={e => setExpTitle(e.target.value)}
                  placeholder="مثال: فاتورة كهرباء المخزن"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                />
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
              <div className="grid grid-cols-2 gap-3 p-2.5 rounded-xl bg-purple-50/50 border border-purple-200/80">
                <div>
                  <label className="block font-bold text-purple-900 mb-1">
                    شهر الراتب (Salary Month) *
                  </label>
                  <input
                    type="month"
                    required
                    value={salMonth}
                    onChange={e => setSalMonth(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-purple-300 rounded-lg bg-white font-mono font-bold text-xs text-purple-900"
                  />
                  <span className="text-[10px] text-purple-700 mt-0.5 block">الشهر الذي يخصه الراتب</span>
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
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-xs text-slate-800"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">تاريخ خروج النقدية الفعلي</span>
                </div>
              </div>

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
                  <label className="block font-semibold text-slate-700 mb-1">العمولات والمكافآت</label>
                  <input
                    type="number"
                    value={salCommissions}
                    onChange={e => setSalCommissions(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-mono text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الخصومات والسلف</label>
                  <input
                    type="number"
                    value={salDeductions}
                    onChange={e => setSalDeductions(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-mono text-rose-700"
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

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSalaryDisburseModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSalary}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  {isSubmittingSalary ? 'جارِ الحفظ...' : 'توثيق صرف الراتب'}
                </button>
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

    </div>
  );
}
