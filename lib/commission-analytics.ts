import { Invoice, Employee } from './types';

export interface EmployeeCommissionStats {
  employeeId: string;
  employeeName: string;
  month?: string;
  totalCommissions: number;
  totalSalesVolume: number;
  invoicesCount: number;
  collectedCommissions: number;
  pendingCommissions: number;
  invoices: Invoice[];
}

/**
 * Calculates commission amount based on invoice amount and commission rate %
 */
export function calculateCommissionAmount(invoiceTotal: number, ratePercent: number): number {
  if (!ratePercent || ratePercent <= 0 || !invoiceTotal || invoiceTotal <= 0) return 0;
  return Math.round(((invoiceTotal * ratePercent) / 100) * 100) / 100;
}

/**
 * Analyzes and aggregates all invoices linked to a specific employee for a given month or all-time
 */
export function getEmployeeCommissionStats(
  invoices: Invoice[],
  employeeId: string,
  targetMonth?: string // Format: 'YYYY-MM'
): EmployeeCommissionStats {
  const linkedInvoices = invoices.filter(inv => {
    // Match by ID or Name if ID not present
    if (inv.salesEmployeeId && inv.salesEmployeeId === employeeId) return true;
    return false;
  });

  const filteredByMonth = targetMonth
    ? linkedInvoices.filter(inv => inv.date && inv.date.startsWith(targetMonth))
    : linkedInvoices;

  let totalCommissions = 0;
  let totalSalesVolume = 0;
  let collectedCommissions = 0;
  let pendingCommissions = 0;

  filteredByMonth.forEach(inv => {
    const invTotal = Number(inv.totalAmount || 0);
    const commAmt = Number(inv.commissionAmount ?? calculateCommissionAmount(invTotal, Number(inv.commissionRate || 0)));
    
    totalCommissions += commAmt;
    totalSalesVolume += invTotal;

    // Realized / collected ratio
    const paidRatio = invTotal > 0 ? Math.min(1, Math.max(0, Number(inv.paidAmount || 0) / invTotal)) : 0;
    const collectedPart = Math.round((commAmt * paidRatio) * 100) / 100;
    collectedCommissions += collectedPart;
    pendingCommissions += (commAmt - collectedPart);
  });

  return {
    employeeId,
    employeeName: linkedInvoices[0]?.salesEmployeeName || '',
    month: targetMonth,
    totalCommissions: Math.round(totalCommissions * 100) / 100,
    totalSalesVolume: Math.round(totalSalesVolume * 100) / 100,
    invoicesCount: filteredByMonth.length,
    collectedCommissions: Math.round(collectedCommissions * 100) / 100,
    pendingCommissions: Math.round(pendingCommissions * 100) / 100,
    invoices: filteredByMonth.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  };
}

/**
 * Returns commission summary across all employees for a specific month
 */
export function getMonthlyCommissionsOverview(
  invoices: Invoice[],
  employees: Employee[],
  targetMonth: string // Format: 'YYYY-MM'
) {
  const employeeStatsMap = new Map<string, EmployeeCommissionStats>();

  employees.forEach(emp => {
    const stats = getEmployeeCommissionStats(invoices, emp.id, targetMonth);
    employeeStatsMap.set(emp.id, {
      ...stats,
      employeeName: emp.name,
    });
  });

  let grandTotalCommissions = 0;
  let grandTotalSales = 0;
  let totalCommissionInvoices = 0;

  employeeStatsMap.forEach(stat => {
    grandTotalCommissions += stat.totalCommissions;
    grandTotalSales += stat.totalSalesVolume;
    totalCommissionInvoices += stat.invoicesCount;
  });

  return {
    month: targetMonth,
    grandTotalCommissions: Math.round(grandTotalCommissions * 100) / 100,
    grandTotalSales: Math.round(grandTotalSales * 100) / 100,
    totalCommissionInvoices,
    employeeStats: Array.from(employeeStatsMap.values()),
    byEmployee: employeeStatsMap,
  };
}
