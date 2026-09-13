'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronRight, ChevronLeft, ChevronDown, Check } from 'lucide-react';

export interface ArabicMonthInfo {
  index: number; // 1 to 12
  name: string;
  code: string; // '01' to '12'
}

export const ARABIC_MONTHS: ArabicMonthInfo[] = [
  { index: 1, name: 'يناير', code: '01' },
  { index: 2, name: 'فبراير', code: '02' },
  { index: 3, name: 'مارس', code: '03' },
  { index: 4, name: 'أبريل', code: '04' },
  { index: 5, name: 'مايو', code: '05' },
  { index: 6, name: 'يونيو', code: '06' },
  { index: 7, name: 'يوليو', code: '07' },
  { index: 8, name: 'أغسطس', code: '08' },
  { index: 9, name: 'سبتمبر', code: '09' },
  { index: 10, name: 'أكتوبر', code: '10' },
  { index: 11, name: 'نوفمبر', code: '11' },
  { index: 12, name: 'ديسمبر', code: '12' },
];

/**
 * Returns formatted Arabic month string, e.g. "2026-09" -> "سبتمبر 2026"
 */
export function formatArabicMonthDisplay(monthStr?: string): string {
  if (!monthStr || monthStr === 'ALL') return '';
  try {
    const parts = monthStr.split('-');
    if (parts.length < 2) return monthStr;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!y || !m || m < 1 || m > 12) return monthStr;
    const found = ARABIC_MONTHS.find(item => item.index === m);
    return found ? `${found.name} ${y}` : monthStr;
  } catch {
    return monthStr || '';
  }
}

export interface MonthPickerProps {
  value: string; // Format: "YYYY-MM" (e.g. "2026-09")
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'purple' | 'emerald';
  size?: 'sm' | 'md';
  align?: 'right' | 'left';
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  className = '',
  variant = 'default',
  size = 'md',
  align = 'right',
  placeholder = 'اختر الشهر والسنة',
  minYear = 2020,
  maxYear = 2035,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const { currentYear, currentMonthIndex } = useMemo(() => {
    const now = new Date();
    if (!value || typeof value !== 'string') {
      return { currentYear: now.getFullYear(), currentMonthIndex: now.getMonth() + 1 };
    }
    const [yStr, mStr] = value.split('-');
    const parsedY = parseInt(yStr, 10);
    const parsedM = parseInt(mStr, 10);
    return {
      currentYear: !isNaN(parsedY) && parsedY > 2000 ? parsedY : now.getFullYear(),
      currentMonthIndex: !isNaN(parsedM) && parsedM >= 1 && parsedM <= 12 ? parsedM : now.getMonth() + 1,
    };
  }, [value]);

  // Year being viewed in the picker
  const [viewYear, setViewYear] = useState<number>(currentYear);

  // Sync viewYear when value changes or when opened
  useEffect(() => {
    if (currentYear) {
      setViewYear(currentYear);
    }
  }, [currentYear, isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Today's real date for "اليوم / الشهر الحالي" helper
  const today = useMemo(() => {
    const d = new Date();
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      monthStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    };
  }, []);

  const handleSelectMonth = (monthIndex: number) => {
    const formatted = `${viewYear}-${String(monthIndex).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSelectCurrentMonth = () => {
    setViewYear(today.year);
    onChange(today.monthStr);
    setIsOpen(false);
  };

  // Variant themes
  const theme = useMemo(() => {
    switch (variant) {
      case 'purple':
        return {
          btnActive: 'border-purple-300 bg-purple-50/60 hover:bg-purple-100/60 text-purple-950 focus:ring-purple-400',
          iconColor: 'text-purple-600',
          selectedMonth: 'bg-purple-600 text-white font-bold shadow-xs hover:bg-purple-700',
          currentMonthBadge: 'border border-purple-400 text-purple-700 bg-purple-50/70',
          headerBg: 'bg-purple-50/50',
          yearBadge: 'text-purple-900 bg-purple-100/70',
        };
      case 'emerald':
        return {
          btnActive: 'border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-950 focus:ring-emerald-400',
          iconColor: 'text-emerald-600',
          selectedMonth: 'bg-emerald-600 text-white font-bold shadow-xs hover:bg-emerald-700',
          currentMonthBadge: 'border border-emerald-400 text-emerald-700 bg-emerald-50/70',
          headerBg: 'bg-emerald-50/50',
          yearBadge: 'text-emerald-900 bg-emerald-100/70',
        };
      default:
        return {
          btnActive: 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800 focus:ring-slate-400',
          iconColor: 'text-slate-600',
          selectedMonth: 'bg-slate-800 text-white font-bold shadow-xs hover:bg-slate-900',
          currentMonthBadge: 'border border-slate-400 text-slate-700 bg-slate-100',
          headerBg: 'bg-slate-50/70',
          yearBadge: 'text-slate-800 bg-slate-200/70',
        };
    }
  }, [variant]);

  const sizeClasses = size === 'sm' ? 'py-1 px-2.5 text-xs gap-1.5 h-8' : 'py-1.5 px-3 text-xs gap-2 h-9';

  const formattedLabel = formatArabicMonthDisplay(value);

  return (
    <div ref={containerRef} className={`relative inline-block text-right ${className}`} dir="rtl">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button: Strictly Non-Text Input */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between border rounded-xl font-medium transition-all shadow-2xs select-none focus:outline-hidden focus:ring-2 ${sizeClasses} ${
          disabled ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : `${theme.btnActive} cursor-pointer`
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <Calendar className={`w-4 h-4 shrink-0 ${theme.iconColor}`} />
          <span className="font-bold font-sans">
            {formattedLabel || placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Month-Year Popover Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="اختيار الشهر والسنة"
          className={`absolute top-full mt-1.5 ${
            align === 'right' ? 'right-0' : 'left-0'
          } z-50 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-3.5 animate-in fade-in zoom-in-95 duration-100`}
        >
          {/* Popover Header: Year Navigator */}
          <div className={`flex items-center justify-between p-2 rounded-xl border border-slate-100 mb-3 ${theme.headerBg}`}>
            {/* Next Year Button (in RTL, forward is to the left) */}
            <button
              type="button"
              onClick={() => setViewYear(y => Math.max(minYear, y - 1))}
              disabled={viewYear <= minYear}
              title="السنة السابقة"
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Year Center Display & Quick Switcher */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewYear(y => Math.max(minYear, y - 1))}
                className="text-[11px] font-mono text-slate-400 hover:text-slate-700 px-1 py-0.5 rounded cursor-pointer"
              >
                {viewYear - 1}
              </button>

              <span className={`px-3 py-0.5 rounded-lg font-bold font-mono text-sm shadow-2xs ${theme.yearBadge}`}>
                {viewYear}
              </span>

              <button
                type="button"
                onClick={() => setViewYear(y => Math.min(maxYear, y + 1))}
                className="text-[11px] font-mono text-slate-400 hover:text-slate-700 px-1 py-0.5 rounded cursor-pointer"
              >
                {viewYear + 1}
              </button>
            </div>

            {/* Previous Year Button (in RTL, next/forward is to the left) */}
            <button
              type="button"
              onClick={() => setViewYear(y => Math.min(maxYear, y + 1))}
              disabled={viewYear >= maxYear}
              title="السنة التالية"
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* 12 Months Grid: 3 columns x 4 rows */}
          <div className="grid grid-cols-3 gap-2">
            {ARABIC_MONTHS.map(month => {
              const isSelected = viewYear === currentYear && month.index === currentMonthIndex;
              const isToday = viewYear === today.year && month.index === today.month;

              return (
                <button
                  key={month.code}
                  type="button"
                  onClick={() => handleSelectMonth(month.index)}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all relative flex flex-col items-center justify-center cursor-pointer ${
                    isSelected
                      ? theme.selectedMonth
                      : isToday
                      ? `${theme.currentMonthBadge} hover:border-slate-300 font-bold`
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="leading-tight">{month.name}</span>
                  <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                    ({month.code})
                  </span>

                  {isSelected && (
                    <span className="absolute top-1 left-1">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer with Quick Action (Current Month Shortcut) */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectCurrentMonth}
              className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>الشهر الحالي</span>
              <span className="text-[10px] font-normal text-slate-500 font-mono">
                ({formatArabicMonthDisplay(today.monthStr)})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded-md hover:bg-slate-100 cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
