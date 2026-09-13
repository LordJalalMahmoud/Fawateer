'use client';

import React from 'react';
import {
  ExpensesPayrollView,
  ExpensesPayrollViewProps,
  DEFAULT_OFFICES,
  CATEGORY_CONFIG,
  PAYMENT_METHOD_LABELS,
  formatArabicDate,
  formatArabicMonth,
  shiftDateStr,
  shiftMonthStr,
} from './ExpensesPayrollView';

export {
  DEFAULT_OFFICES,
  CATEGORY_CONFIG,
  PAYMENT_METHOD_LABELS,
  formatArabicDate,
  formatArabicMonth,
  shiftDateStr,
  shiftMonthStr,
};

export interface ExpensesPayrollModalProps extends ExpensesPayrollViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExpensesPayrollModal({ isOpen, onClose, ...props }: ExpensesPayrollModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 text-right no-print" dir="rtl">
      <ExpensesPayrollView
        {...props}
        isModal={true}
        onClose={onClose}
      />
    </div>
  );
}
