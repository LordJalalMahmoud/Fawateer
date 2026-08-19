'use client';

import React, { useRef, useMemo } from 'react';
import { Invoice } from '@/lib/types';
import { 
  X, 
  Printer, 
  MessageCircle, 
  Phone, 
  MapPin, 
  FileText
} from 'lucide-react';

interface MerchantStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchantName: string;
  invoices: Invoice[];
}

export function MerchantStatementModal({
  isOpen,
  onClose,
  merchantName,
  invoices,
}: MerchantStatementModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Filter and sort invoices for this merchant (oldest first for running balance ledger)
  const merchantInvoices = useMemo(() => {
    if (!merchantName) return [];
    return invoices
      .filter(i => (i.customerName || '').trim().toLowerCase() === merchantName.trim().toLowerCase())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [invoices, merchantName]);

  // Calculations
  const totalPurchases = useMemo(() => {
    return merchantInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  }, [merchantInvoices]);

  const totalPaid = useMemo(() => {
    return merchantInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
  }, [merchantInvoices]);

  const totalRemaining = useMemo(() => {
    return Number((totalPurchases - totalPaid).toFixed(2));
  }, [totalPurchases, totalPaid]);

  // Build running balance transactions safely inside useMemo
  const ledgerRows = useMemo(() => {
    return merchantInvoices.map((inv, index) => {
      // Calculate running sum up to this invoice
      let accumulatedBalance = 0;
      for (let i = 0; i <= index; i++) {
        const itemInv = merchantInvoices[i];
        accumulatedBalance += (Number(itemInv.totalAmount || 0) - Number(itemInv.paidAmount || 0));
      }

      return {
        id: inv.id,
        date: inv.date,
        invoiceNumber: inv.invoiceNumber,
        items: inv.items,
        totalAmount: Number(inv.totalAmount || 0),
        paidAmount: Number(inv.paidAmount || 0),
        balanceAfter: accumulatedBalance,
        notes: inv.notes,
        status: inv.status,
      };
    });
  }, [merchantInvoices]);

  if (!isOpen || !merchantName) return null;

  // Customer contact info from latest invoice
  const latestInvoice = merchantInvoices[merchantInvoices.length - 1];
  const phone = latestInvoice?.customerPhone || '';
  const address = latestInvoice?.customerAddress || '';

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(
      `السلام عليكم ورحمة الله وبركاته،\nالأخ الفاضل / ${merchantName} المحترم،\n\nمرفق كشف حسابك ومسحوباتك حتى تاريخ ${new Date().toISOString().slice(0, 10)}:\n` +
      `• إجمالي المسحوبات والبضاعة: *${totalPurchases.toLocaleString()} ج.م*\n` +
      `• إجمالي الدفعات المسددة: *${totalPaid.toLocaleString()} ج.م*\n` +
      `• صافي الرصيد المتبقي المستحق: *${totalRemaining.toLocaleString()} جنيه مصري*\n\nشاكرين حسن تعاملكم.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                كشف الحساب والفاتورة المجمعة للتاجر
              </h2>
              <p className="text-xs text-slate-500">
                بيان تفصيلي بجميع المسحوبات والدفعات والرصيد المتبقي للعميل: <strong className="text-slate-800">{merchantName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">واتساب</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كشف الحساب</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Statement Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white" ref={printRef}>
          <div className="max-w-3xl mx-auto space-y-6 text-slate-900 printable-area">
            
            {/* Header / Brand */}
            <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold">
                    GC
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    منظومة توريدات وتوزيع المنظفات
                  </h1>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  منتجات GC • منتجات AQ • منتجات سيترس | كشف حساب ومسحوبات تاجر
                </p>
              </div>

              <div className="text-left sm:text-left text-xs text-slate-600 space-y-1">
                <div className="font-bold text-sm text-slate-900">كشف حساب تاجر معتمد</div>
                <div>تاريخ الاستخراج: <strong>{new Date().toISOString().slice(0, 10)}</strong></div>
                <div>عدد الحركات: <strong>{merchantInvoices.length} حركة مسجلة</strong></div>
              </div>
            </div>

            {/* Merchant Info Card & Balance KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Merchant Details */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">بيانات التاجر / المحل</div>
                <div className="text-base font-bold text-slate-900">{merchantName}</div>
                {phone && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span dir="ltr">{phone}</span>
                  </div>
                )}
                {address && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{address}</span>
                  </div>
                )}
              </div>

              {/* Running Balances Summary */}
              <div className="p-4 rounded-xl bg-teal-900 text-white flex flex-col justify-between">
                <div className="text-xs text-teal-200 font-semibold uppercase text-[10px] tracking-wider">ملخص الرصيد المالي الحالي</div>
                <div className="grid grid-cols-3 gap-2 my-2 text-center">
                  <div className="bg-teal-950/50 p-2 rounded-lg">
                    <div className="text-[10px] text-teal-300">إجمالي المسحوبات</div>
                    <div className="font-bold text-xs sm:text-sm mt-0.5">{totalPurchases.toLocaleString()} ج</div>
                  </div>
                  <div className="bg-teal-950/50 p-2 rounded-lg">
                    <div className="text-[10px] text-teal-300">إجمالي المسدد</div>
                    <div className="font-bold text-xs sm:text-sm text-emerald-300 mt-0.5">{totalPaid.toLocaleString()} ج</div>
                  </div>
                  <div className="bg-teal-950/50 p-2 rounded-lg border border-teal-700">
                    <div className="text-[10px] text-teal-200">الرصيد المتبقي</div>
                    <div className={`font-extrabold text-xs sm:text-sm mt-0.5 ${totalRemaining > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {totalRemaining.toLocaleString()} ج
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-teal-200 text-center">
                  {totalRemaining > 0 
                    ? `* مطلوب سداد مبلغ ${totalRemaining.toLocaleString()} جنيه مصري` 
                    : '✓ الحساب خالص ومسدد بالكامل'}
                </div>
              </div>

            </div>

            {/* Detailed Ledger Transactions Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                بيان المسحوبات والدفعات التفصيلية (حركة الحساب الجاري):
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-20">التاريخ</th>
                      <th className="py-2.5 px-3 w-24">رقم الحركة</th>
                      <th className="py-2.5 px-3">بيان البضاعة والمسحوبات</th>
                      <th className="py-2.5 px-3 w-24 text-left">قيمة البضاعة</th>
                      <th className="py-2.5 px-3 w-24 text-left">المسدد</th>
                      <th className="py-2.5 px-3 w-24 text-left">الرصيد المتبقي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledgerRows.map((row, idx) => (
                      <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        {/* Date */}
                        <td className="py-2.5 px-3 text-slate-600 font-mono whitespace-nowrap">{row.date}</td>

                        {/* Number */}
                        <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">{row.invoiceNumber}</td>

                        {/* Items details */}
                        <td className="py-2.5 px-3">
                          <div className="space-y-1">
                            {row.items.map((it, itIdx) => (
                              <div key={itIdx} className="text-slate-700">
                                • <strong className="text-slate-900">{it.name}</strong>: {it.quantity} {it.unit} × {it.unitPrice} ج.م = <strong>{it.total} ج.م</strong>
                              </div>
                            ))}
                            {row.notes && (
                              <div className="text-[11px] text-slate-500 italic">
                                ملاحظة: {row.notes}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Total Debit */}
                        <td className="py-2.5 px-3 text-left font-bold text-slate-900 whitespace-nowrap">
                          {row.totalAmount.toLocaleString()} ج.م
                        </td>

                        {/* Paid Credit */}
                        <td className="py-2.5 px-3 text-left font-semibold text-emerald-700 whitespace-nowrap">
                          {row.paidAmount > 0 ? `${row.paidAmount.toLocaleString()} ج.م` : '-'}
                        </td>

                        {/* Running Balance */}
                        <td className="py-2.5 px-3 text-left font-bold text-slate-900 whitespace-nowrap">
                          <span className={row.balanceAfter > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                            {row.balanceAfter.toLocaleString()} ج.م
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Grand Totals Footer */}
                  <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-xs text-slate-900">
                    <tr>
                      <td colSpan={3} className="py-3 px-3 text-right">
                        الإجمالي الكلي النهائي لحساب التاجر:
                      </td>
                      <td className="py-3 px-3 text-left text-slate-900">
                        {totalPurchases.toLocaleString()} ج.م
                      </td>
                      <td className="py-3 px-3 text-left text-emerald-700">
                        {totalPaid.toLocaleString()} ج.م
                      </td>
                      <td className="py-3 px-3 text-left text-rose-700 text-sm">
                        {totalRemaining.toLocaleString()} ج.م
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Terms and Signatures */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-600 gap-8">
              <div>
                <div className="font-semibold text-slate-800 mb-10">توقيع واستلام التاجر / المستلم:</div>
                <div className="border-t border-dashed border-slate-300 pt-2 w-48 mx-auto text-slate-400">
                  الاسم والتوقيع
                </div>
              </div>
              <div>
                <div className="font-semibold text-slate-800 mb-10">إدارة الحسابات والتوريدات:</div>
                <div className="border-t border-dashed border-slate-300 pt-2 w-48 mx-auto text-slate-400">
                  الختم والاعتماد
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
