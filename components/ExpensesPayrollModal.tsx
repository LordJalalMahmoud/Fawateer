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
  Clock,
  ArrowDownRight,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExpenseItem, Employee, SalaryPaymentRecord, ExpenseCategory, PaymentMethod } from '@/lib/types';

interface ExpensesPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExpenseItem[];
  employees: Employee[];
  salaryPayments: SalaryPaymentRecord[];
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
  OTHER: { label: 'نثريات ومصروفات أخرى', icon: MoreHorizontal, color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30' },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, { label: string; icon: any }> = {
  CASH: { label: 'نقداً (الخزينة)', icon: Banknote },
  VODAFONE_CASH: { label: 'فودافون كاش / محفظة', icon: Smartphone },
  INSTAPAY: { label: 'إنستاباي InstaPay', icon: Send },
  BANK_TRANSFER: { label: 'تحويل بنكي', icon: Landmark },
  CHECK: { label: 'شيك بنكي', icon: FileCheck },
};

export function ExpensesPayrollModal({
  isOpen,
  onClose,
  expenses = [],
  employees = [],
  salaryPayments = [],
  onSaveExpense,
  onDeleteExpense,
  onSaveEmployee,
  onDeleteEmployee,
  onSaveSalaryPayment,
  onDeleteSalaryPayment,
}: ExpensesPayrollModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Main navigation tabs
  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'EMPLOYEES' | 'PAYROLL' | 'ANALYTICS'>('EXPENSES');

  // Filters for Expenses list
  const [dateFilter, setDateFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'TODAY' | 'CUSTOM'>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Month for Payroll view (YYYY-MM)
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState<string>(currentMonthStr);

  // Modal Dialogs State
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [isSalaryDisburseModalOpen, setIsSalaryDisburseModalOpen] = useState(false);
  const [disbursingEmployee, setDisbursingEmployee] = useState<Employee | null>(null);

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
  const [expNotes, setExpNotes] = useState('');
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Forms State: Employee
  const [empName, setEmpName] = useState('');
  const [empJobTitle, setEmpJobTitle] = useState('مندوب مبيعات');
  const [empPhone, setEmpPhone] = useState('');
  const [empBaseSalary, setEmpBaseSalary] = useState<number | ''>('');
  const [empFixedAllowances, setEmpFixedAllowances] = useState<number | ''>('');
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
  const [salDeductions, setSalDeductions] = useState<number>(0);
  const [salPaymentMethod, setSalPaymentMethod] = useState<PaymentMethod>('CASH');
  const [salNotes, setSalNotes] = useState('');
  const [isSubmittingSalary, setIsSubmittingSalary] = useState(false);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const thisMonthPrefix = now.toISOString().slice(0, 7);
    
    // Previous month calculation
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthPrefix = prevMonthDate.toISOString().slice(0, 7);

    return (expenses || []).filter(item => {
      // Date filter
      if (dateFilter === 'TODAY' && item.date !== today) return false;
      if (dateFilter === 'THIS_MONTH' && !item.date.startsWith(thisMonthPrefix)) return false;
      if (dateFilter === 'LAST_MONTH' && !item.date.startsWith(lastMonthPrefix)) return false;
      if (dateFilter === 'CUSTOM') {
        if (customStartDate && item.date < customStartDate) return false;
        if (customEndDate && item.date > customEndDate) return false;
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
        if (!matchTitle && !matchRecipient && !matchReceipt && !matchNotes) return false;
      }

      return true;
    });
  }, [expenses, dateFilter, customStartDate, customEndDate, categoryFilter, paymentMethodFilter, searchQuery]);

  // Totals for filtered expenses
  const filteredTotalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [filteredExpenses]);

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

  // Active Employees Stats
  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'ACTIVE'), [employees]);
  const totalMonthlyPayrollObligation = useMemo(() => {
    return activeEmployees.reduce((sum, e) => sum + Number(e.baseSalary || 0) + Number(e.fixedAllowances || 0), 0);
  }, [activeEmployees]);

  // Payroll for selected month
  const monthPayrollData = useMemo(() => {
    return employees.map(emp => {
      const existingPayment = salaryPayments.find(
        p => p.employeeId === emp.id && p.month === selectedPayrollMonth && p.status === 'PAID'
      );
      const baseSalary = Number(emp.baseSalary || 0);
      const allowances = Number(emp.fixedAllowances || 0);
      const isPaid = Boolean(existingPayment);
      const netCalculated = existingPayment
        ? existingPayment.netPaid
        : Math.max(0, baseSalary + allowances);

      return {
        employee: emp,
        payment: existingPayment,
        isPaid,
        baseSalary,
        allowances,
        netPaid: netCalculated,
        status: isPaid ? 'PAID' : 'UNPAID',
      };
    });
  }, [employees, salaryPayments, selectedPayrollMonth]);

  const monthPayrollSummary = useMemo(() => {
    let totalObligation = 0;
    let totalPaid = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    monthPayrollData.forEach(item => {
      if (item.employee.status === 'ACTIVE') {
        totalObligation += item.baseSalary + item.allowances;
      }
      if (item.isPaid && item.payment) {
        totalPaid += item.payment.netPaid;
        paidCount++;
      } else if (item.employee.status === 'ACTIVE') {
        unpaidCount++;
      }
    });

    return {
      totalObligation,
      totalPaid,
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
      const expenseToSave: ExpenseItem = {
        id: editingExpense?.id || `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        date: expDate,
        title: expTitle.trim(),
        amount: Number(expAmount),
        category: expCategory,
        paymentMethod: expPaymentMethod,
        recipient: expRecipient.trim() || undefined,
        receiptNumber: expReceiptNumber.trim() || undefined,
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

  // Handlers: Open New Employee
  const handleOpenNewEmployee = () => {
    setEditingEmployee(null);
    setEmpName('');
    setEmpJobTitle('مندوب مبيعات');
    setEmpPhone('');
    setEmpBaseSalary('');
    setEmpFixedAllowances('');
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

  // Handlers: Open Salary Disbursement for single employee
  const handleOpenDisburseSalary = (emp: Employee) => {
    const existing = salaryPayments.find(p => p.employeeId === emp.id && p.month === selectedPayrollMonth);
    setDisbursingEmployee(emp);
    setSalMonth(selectedPayrollMonth);
    setSalPaymentDate(new Date().toISOString().slice(0, 10));
    setSalBaseSalary(existing ? existing.baseSalary : Number(emp.baseSalary || 0));
    setSalAllowances(existing ? existing.allowances : Number(emp.fixedAllowances || 0));
    setSalBonuses(existing ? existing.bonuses : 0);
    setSalDeductions(existing ? existing.deductions : 0);
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
      const netToPay = Math.max(0, salBaseSalary + salAllowances + salBonuses - salDeductions);
      const nowIso = new Date().toISOString();
      const existing = salaryPayments.find(p => p.employeeId === disbursingEmployee.id && p.month === salMonth);

      const recordId = existing?.id || `sal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const paymentRecord: SalaryPaymentRecord = {
        id: recordId,
        employeeId: disbursingEmployee.id,
        employeeName: disbursingEmployee.name,
        month: salMonth,
        paymentDate: salPaymentDate,
        baseSalary: salBaseSalary,
        allowances: salAllowances,
        bonuses: salBonuses,
        deductions: salDeductions,
        netPaid: netToPay,
        paymentMethod: salPaymentMethod,
        notes: salNotes.trim() || undefined,
        status: 'PAID',
        createdAt: existing?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      await onSaveSalaryPayment(paymentRecord, true);
      setIsSalaryDisburseModalOpen(false);
      confetti({ particleCount: 40, spread: 60 });
    } finally {
      setIsSubmittingSalary(false);
    }
  };

  // Export Expenses to CSV
  const handleExportExpensesCSV = () => {
    const headers = ['التاريخ', 'بند المصروف', 'التصنيف', 'المبلغ (ج.م)', 'طريقة الدفع', 'المستلم / الجهة', 'رقم السند/الإيصال', 'ملاحظات'];
    const rows = filteredExpenses.map(e => [
      e.date,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${CATEGORY_CONFIG[e.category]?.label || e.category}"`,
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
    link.download = `expenses_report_${dateFilter}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export Payroll to CSV
  const handleExportPayrollCSV = () => {
    const headers = ['اسم الموظف', 'الوظيفة', 'الهاتف', 'الشهر', 'الراتب الأساسي', 'البدلات', 'الصافي المستحق/المدفوع', 'حالة الصرف', 'تاريخ الصرف'];
    const rows = monthPayrollData.map(item => [
      `"${item.employee.name.replace(/"/g, '""')}"`,
      `"${item.employee.jobTitle.replace(/"/g, '""')}"`,
      item.employee.phone || '—',
      selectedPayrollMonth,
      item.baseSalary,
      item.allowances,
      item.netPaid,
      item.isPaid ? 'تم الصرف' : 'متبقي',
      item.payment?.paymentDate || '—',
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
              <span>سجل المصروفات العامة</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-950/40 text-slate-200 font-mono">
                {filteredExpenses.length}
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
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-950/40 text-slate-200 font-mono">
                {activeEmployees.length}
              </span>
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
          {activeTab === 'EXPENSES' && (
            <div className="space-y-5">
              
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">إجمالي المصروفات (المعروضة)</span>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400 mt-1">
                      {filteredTotalAmount.toLocaleString()} <span className="text-xs text-slate-400 font-sans">ج.م</span>
                    </div>
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
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-slate-700/50 border border-slate-600/50 flex items-center justify-center text-slate-300">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">أعلى بند استهلاكاً</span>
                    <div className="text-sm sm:text-base font-bold text-amber-300 mt-1 truncate max-w-[140px]">
                      {categoryBreakdown[0] ? CATEGORY_CONFIG[categoryBreakdown[0].category]?.label : '—'}
                    </div>
                    {categoryBreakdown[0] && (
                      <span className="text-[11px] font-mono text-slate-400">
                        {categoryBreakdown[0].total.toLocaleString()} ج.م
                      </span>
                    )}
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Award className="w-5 h-5" />
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

              {/* Filter Controls Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Period selector */}
                  <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 text-xs">
                    <button
                      onClick={() => setDateFilter('THIS_MONTH')}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        dateFilter === 'THIS_MONTH' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      هذا الشهر
                    </button>
                    <button
                      onClick={() => setDateFilter('TODAY')}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        dateFilter === 'TODAY' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      اليوم
                    </button>
                    <button
                      onClick={() => setDateFilter('LAST_MONTH')}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        dateFilter === 'LAST_MONTH' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      الشهر الماضي
                    </button>
                    <button
                      onClick={() => setDateFilter('ALL')}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        dateFilter === 'ALL' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      الكل
                    </button>
                    <button
                      onClick={() => setDateFilter('CUSTOM')}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        dateFilter === 'CUSTOM' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      مخصص
                    </button>
                  </div>

                  {dateFilter === 'CUSTOM' && (
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-slate-300">
                      <span>من:</span>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={e => setCustomStartDate(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 text-white"
                      />
                      <span>إلى:</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={e => setCustomEndDate(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 text-white"
                      />
                    </div>
                  )}

                  {/* Category Dropdown */}
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                  >
                    <option value="ALL">جميع التصنيفات ({expenses.length})</option>
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
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500"
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
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="بحث في الوصف، المستلم، السند..."
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
                    <p className="text-sm font-semibold text-slate-300">لا توجد حركات مصروفات تطابق البحث أو الفلترة الحالية</p>
                    <button
                      onClick={() => handleOpenNewExpense()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/30"
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
                          <td colSpan={6} className="py-3 px-4 text-left">
                            إجمالي المصروفات في هذه الفترة:
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

              {/* Employees Grid / Cards */}
              {employees.length === 0 ? (
                <div className="py-16 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                    <Users className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300">لم تقم بإضافة أي موظفين أو عمال بعد</p>
                  <p className="text-xs text-slate-500">أضف الموظفين ليتمكن النظام من إعداد مسير الرواتب الشهري وحساب التكاليف تلقائياً</p>
                  <button
                    onClick={handleOpenNewEmployee}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/30"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>إضافة أول موظف الآن</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees.map(emp => {
                    const isPaidThisMonth = salaryPayments.some(
                      p => p.employeeId === emp.id && p.month === selectedPayrollMonth && p.status === 'PAID'
                    );

                    return (
                      <div
                        key={emp.id}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
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
                                  : emp.status === 'ON_LEAVE'
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              }`}
                            >
                              {emp.status === 'ACTIVE' ? 'على رأس العمل' : emp.status === 'ON_LEAVE' ? 'في إجازة' : 'مستقيل'}
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

                          {emp.phone && (
                            <div className="mt-2.5 flex items-center gap-1 text-[11px] text-slate-400">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span className="font-mono">{emp.phone}</span>
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block font-medium">الشهر المحدد للمسير</label>
                    <input
                      type="month"
                      value={selectedPayrollMonth}
                      onChange={e => setSelectedPayrollMonth(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-white font-bold font-mono text-sm rounded-xl px-3 py-1 mt-0.5 outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                  <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
                    <span className="text-slate-400 block">إجمالي استحقاقات الشهر:</span>
                    <span className="text-white font-mono font-bold text-sm">
                      {monthPayrollSummary.totalObligation.toLocaleString()} ج.م
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
                </div>
              </div>

              {/* Printable Payroll Sheet */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                {monthPayrollData.length === 0 ? (
                  <div className="py-14 text-center text-slate-400">
                    لا يوجد موظفون مسجلون. يرجى إضافة الموظفين أولاً من تبويب &ldquo;سجل الموظفين والعمال&rdquo;.
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
                          <th className="py-3 px-4 text-left font-mono">الخصومات والسلف</th>
                          <th className="py-3 px-4 text-left font-mono">صافي المستحق</th>
                          <th className="py-3 px-4 text-center">حالة الصرف</th>
                          <th className="py-3 px-4 text-center">إجراء الصرف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {monthPayrollData.map(({ employee, payment, isPaid, baseSalary, allowances, netPaid }) => {
                          return (
                            <tr key={employee.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                                <div>{employee.name}</div>
                                {employee.phone && (
                                  <span className="text-[10px] text-slate-500 font-mono">{employee.phone}</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                                {employee.jobTitle}
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
                              <td className="py-3 px-4 text-left font-mono text-rose-400">
                                {payment && payment.deductions > 0 ? `-${payment.deductions.toLocaleString()} ج` : '—'}
                              </td>
                              <td className="py-3 px-4 text-left font-mono font-bold text-white text-sm">
                                {netPaid.toLocaleString()} ج.م
                              </td>
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                {isPaid ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    <span>تم الصرف</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    <span>متبقي الصرف</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <button
                                  onClick={() => handleOpenDisburseSalary(employee)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    isPaid
                                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30'
                                  }`}
                                >
                                  {isPaid ? 'تعديل الصرف' : 'صرف الآن'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-900/95 font-bold text-white border-t-2 border-slate-700">
                        <tr>
                          <td colSpan={6} className="py-3 px-4 text-left">
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
                  <label className="text-xs text-slate-300 font-semibold block mb-1">التاريخ</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={e => setExpDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500"
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
                    صرف راتب الموظف: {disbursingEmployee.name}
                  </h3>
                  <span className="text-xs text-purple-300 font-mono">
                    شهر: {salMonth}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsSalaryDisburseModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSalaryDisburseSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">شهر الاستحقاق</label>
                  <input
                    type="month"
                    required
                    value={salMonth}
                    onChange={e => setSalMonth(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">تاريخ الصرف الفعلي</label>
                  <input
                    type="date"
                    required
                    value={salPaymentDate}
                    onChange={e => setSalPaymentDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                  />
                </div>
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

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="text-xs text-slate-300 font-semibold block mb-1">- خصومات وسلف (ج.م)</label>
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
              </div>

              {/* Calculated Net Salary Box */}
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-purple-300 block font-semibold">صافي المبلغ المدفوع للموظف:</span>
                  <span className="text-xl font-bold font-mono text-white">
                    {Math.max(0, salBaseSalary + salAllowances + salBonuses - salDeductions).toLocaleString()} ج.م
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
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
                💡 سيتم إدراج هذا الراتب تلقائياً في سجل المصروفات العام تحت بند &ldquo;رواتب وأجور&rdquo; لتوثيق حركة الخزينة بدون ازدواجية.
              </p>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSalaryDisburseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSalary}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmittingSalary ? 'جاري توثيق الصرف...' : 'توثيق وصرف الراتب'}</span>
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

    </div>
  );
}
