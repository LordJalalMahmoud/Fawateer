export type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL';

export interface InvoiceItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate?: number; // e.g. 14%
  taxAmount: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
  notes?: string;
  // مندوب المبيعات والعمولة المربوطة بالفاتورة
  salesEmployeeId?: string;
  salesEmployeeName?: string;
  commissionRate?: number; // نسبة العمولة % (مثال: 2 يعني 2%)
  commissionAmount?: number; // قيمة العمولة المحسوبة بالجنيه
  createdAt: string;
  updatedAt: string;
}

export interface ProductCatalogItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  defaultPrice: number;
  barcode?: string;
}

export interface CustomerBalance {
  name: string;
  totalInvoiced: number;
  totalPaid: number;
  remainingDebt: number;
  invoiceCount: number;
  lastInvoiceDate: string;
  status: 'SETTLED' | 'IN_DEBT' | 'OVERPAID';
}

export interface ProductPricingTier {
  id: string;
  productName: string;
  category: string;
  factoryPrice: number; // سعر المصنع
  companyPrice: number; // سعر الشركة
  unit: string;
  aliases?: string[];
}

export interface VaultSettings {
  authorizedEmails: string[];
  securityPin?: string;
  updatedAt?: string;
}

export interface ItemProfitCalculation {
  itemId: string;
  productName: string;
  unit: string;
  quantity: number;
  merchantUnitPrice: number;
  companyUnitPrice: number;
  factoryUnitPrice: number;
  
  // Total invoiced amounts
  merchantRevenueTotal: number; // Q * merchantUnitPrice
  companyCostTotal: number;     // Q * companyUnitPrice
  factoryCostTotal: number;     // Q * factoryUnitPrice
  
  // Invoiced Profits
  companyProfitTotal: number;   // Q * (merchantUnitPrice - companyUnitPrice)
  factoryToCompanyProfitTotal: number; // Q * (companyUnitPrice - factoryUnitPrice)
  totalProfit: number;          // Q * (merchantUnitPrice - factoryUnitPrice)

  // Realized / Collected portions (based on invoice paid ratio)
  paidRatio: number;
  realizedMerchantRevenue: number;
  realizedCompanyCost: number;
  realizedFactoryCost: number;
  realizedCompanyProfit: number;
  realizedFactoryToCompanyProfit: number;
  realizedTotalProfit: number;

  // Pending / Unrealized portions
  pendingTotalProfit: number;
  pendingCompanyProfit: number;
  pendingFactoryProfit: number;
}

export interface InvoiceProfitBreakdown {
  invoiceId: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  items: ItemProfitCalculation[];
  
  // Invoiced amounts
  invoiceMerchantRevenue: number;
  invoiceCompanyCost: number;
  invoiceFactoryCost: number;
  invoiceCompanyProfit: number;
  invoiceFactoryToCompanyProfit: number;
  invoiceTotalProfit: number;

  // Payment status & Realized Cash
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paidRatio: number; // 0 to 1
  paymentStatus: PaymentStatus;

  // Realized Profits (from collected cash)
  realizedMerchantRevenue: number;
  realizedCompanyCost: number;
  realizedFactoryCost: number;
  realizedCompanyProfit: number;
  realizedFactoryToCompanyProfit: number;
  realizedTotalProfit: number;

  // Pending Profits (uncollected debt in market)
  pendingTotalProfit: number;
  pendingCompanyProfit: number;
  pendingFactoryProfit: number;
}

// ----------------------------------------------------
// 🚚 تحصيلات شركات الشحن والبيع القطاعي (Retail / Courier Settlements)
// ----------------------------------------------------
export interface RetailSoldItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string; // 'كرتونة' | 'قطعة'
  retailUnitPrice: number; // سعر البيع القطاعي للزبون
  totalAmount: number; // quantity * retailUnitPrice
  piecesPerCarton?: number; // لو البيع بالقطعة، عدد القطع في الكرتونة لحساب تكلفة المصنع والشركة بدقة
}

export interface CourierSettlement {
  id: string;
  courierName: string; // اسم شركة الشحن (بوسطة، أوتو، شيب بلو، ارامكس، مندوب، etc.)
  manifestNumber: string; // رقم الكشف أو البوليصة أو الشحنة
  date: string; // YYYY-MM-DD
  collectedCash: number; // المبلغ المحصل من شركة الشحن (الفلوس المقبوضة)
  shippingFeeDeducted: number; // مصاريف وعمولة شركة الشحن المخصومة
  totalOrderValue: number; // إجمالي قيمة البضاعة المباعة قطاعي
  netCashReceived: number; // صافي المبلغ المستلم فعلياً
  items: RetailSoldItem[];
  notes?: string;
  status: 'COMPLETED' | 'PARTIAL' | 'PENDING';
  createdAt: string;
  updatedAt: string;
}

export interface CourierItemProfitCalculation {
  itemId: string;
  productName: string;
  unit: string;
  quantity: number;
  retailUnitPrice: number;
  retailRevenueTotal: number;
  factoryCostTotal: number;
  companyCostTotal: number;
  companyProfitTotal: number;
  factoryProfitTotal: number;
  totalProfit: number;
  
  // Realized based on collected cash ratio
  paidRatio: number;
  realizedRetailRevenue: number;
  realizedCompanyCost: number;
  realizedFactoryCost: number;
  realizedCompanyProfit: number;
  realizedFactoryProfit: number;
  realizedTotalProfit: number;
}

export interface CourierProfitBreakdown {
  settlementId: string;
  courierName: string;
  manifestNumber: string;
  date: string;
  collectedCash: number;
  shippingFeeDeducted: number;
  netCashReceived: number;
  totalRetailValue: number;
  totalFactoryCost: number;
  totalCompanyCost: number;
  paidRatio: number;

  // Calculated Realized Profits
  realizedCompanyProfit: number;
  realizedFactoryProfit: number;
  realizedTotalProfit: number; // Net profit after factory cost & shipping fee
  
  items: CourierItemProfitCalculation[];
}

// ----------------------------------------------------
// 💰 إدارة المصروفات والرواتب (Expenses & Payroll Management)
// ----------------------------------------------------
export type ExpenseCategory =
  | 'SALARIES'           // رواتب وأجور موظفين وعمال
  | 'RENT'               // إيجارات مقرات ومخازن
  | 'UTILITIES'          // كهرباء، مياه، غاز، إنترنت وهاتف
  | 'TRANSPORT'          // نقل، شحن داخلي، بنزين ومحروقات
  | 'MARKETING'          // إعلانات وتسويق وحملات
  | 'PACKAGING_RAW'      // مواد خام وتعبئة وتغليف وكراتين
  | 'MAINTENANCE'        // صيانة معدات وسيارات ومخازن
  | 'HOSPITALITY'        // بوفيه، نظافة وضيافة
  | 'COMMISSIONS'        // عمولات ومكافآت بيع
  | 'TAX_LEGAL'          // ضرائب، تراخيص ومصاريف قانونية
  | 'PARTNER_WITHDRAWAL' // مسحوبات أرباح الشركاء من الأرباح السنوية (مهجة / الشريك)
  | 'EMPLOYEE_ADVANCE'   // سلف موظفين ومسحوبات شخصية
  | 'OTHER';             // مصروفات إدارية ونثرية أخرى

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'VODAFONE_CASH' | 'INSTAPAY' | 'CHECK';

export interface ExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string; // وصف أو بند المصروف
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  recipient?: string; // الجهة أو الشخص المستلم
  receiptNumber?: string; // رقم الفاتورة أو إيصال السداد
  employeeId?: string; // لو المصروف مرتبط براتب أو سلفة موظف معين
  office?: string; // اسم المكتب أو الفرع (e.g. المكتب الرئيسي، مكتب 1، مكتب 2...)
  partnerName?: string; // اسم الشريك (مثل مهجة) في حالة مسحوبات الأرباح
  isPartnerDrawing?: boolean; // هل هذا المصروف مسحوب من الأرباح السنوية لشريك
  salaryMonth?: string; // شهر الراتب المستحق (YYYY-MM) عند تسجيل مصروف برواتب
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  name: string;
  jobTitle: string; // المسمى الوظيفي
  phone?: string;
  baseSalary: number; // الراتب الأساسي الشهري
  fixedAllowances?: number; // بدلات ثابتة (انتقال، وجبة، إلخ)
  defaultCommissionRate?: number; // نسبة العمولة الافتراضية (%) لمندوبي المبيعات
  status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED';
  joinDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryPaymentRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // YYYY-MM (للتوافق وقواعد البيانات القديمة)
  salaryMonth?: string; // شهر الراتب المستحق محاسبياً (YYYY-MM) مثل: 2026-06
  paymentDate: string; // تاريخ الصرف الفعلي (YYYY-MM-DD) مثل: 2026-07-02
  baseSalary: number;
  allowances: number; // بدلات
  commissions?: number; // عمولات المبيعات المحسوبة من الفواتير
  commissionInvoicesCount?: number; // عدد فواتير العمولات المشمولة
  bonuses: number; // حوافز ومكافآت
  deductions: number; // خصومات وجزاءات
  advances?: number; // سلف ومسحوبات شخصية
  netPaid: number; // صافي الراتب المصروف (الأساسي + البدلات + العمولات + الحوافز - الخصومات - السلف)
  paymentMethod: PaymentMethod;
  expenseId?: string; // رابط مع سجل المصروفات العام
  notes?: string;
  status: 'PAID' | 'PENDING';
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// 📝 حركات الموظفين: السلف والخصومات والمكافآت خلال الشهر
// (Employee Advances, Deductions & Bonuses logged at any time)
// ----------------------------------------------------
export type EmployeeTransactionType = 'ADVANCE' | 'DEDUCTION' | 'BONUS';

export interface EmployeeTransaction {
  id: string;
  employeeId: string;
  employeeName: string;
  type: EmployeeTransactionType; // 'ADVANCE': سلفة نقدية | 'DEDUCTION': خصم وجزاء | 'BONUS': مكافأة وحافز
  amount: number;
  date: string; // YYYY-MM-DD تاريخ وقوع الحركة الفعلي خلال الشهر (أي يوم)
  salaryMonth: string; // YYYY-MM شهر استحقاق الراتب المراد تطبيق الحركة عليه (مثال: 2026-03)
  paymentMethod?: PaymentMethod; // طريقة صرف النقدية (للسلف والمكافآت: كاش الخزينة، فودافون، إنستاباي، إلخ)
  title: string; // سبب أو بيان الحركة (مثال: سلفة نقدية عاجلة، جزاء تأخير، مكافأة تميز)
  notes?: string;
  expenseId?: string; // معرف المصروف المرتبط بالخزينة إذا تم تسجيل السلفة كمصروف خروج نقدية
  settled?: boolean; // هل تم تسوية وخصم الحركة في مسير الراتب
  salaryPaymentId?: string; // معرف إيصال صرف الراتب عند الاعتماد
  createdAt: string;
  updatedAt: string;
}

export const TRANSACTION_TYPE_CONFIG: Record<
  EmployeeTransactionType,
  { label: string; actionLabel: string; color: string; bg: string; border: string; sign: string; impact: 'DEDUCT' | 'ADD' }
> = {
  ADVANCE: {
    label: 'سلفة نقدية',
    actionLabel: 'تسجيل سلفة موظف',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    sign: '-',
    impact: 'DEDUCT',
  },
  DEDUCTION: {
    label: 'خصم / جزاء',
    actionLabel: 'تسجيل خصم أو جزاء',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    sign: '-',
    impact: 'DEDUCT',
  },
  BONUS: {
    label: 'مكافأة / حافز',
    actionLabel: 'إضافة مكافأة أو حافز',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    sign: '+',
    impact: 'ADD',
  },
};


