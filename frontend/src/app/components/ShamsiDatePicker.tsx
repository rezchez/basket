'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

export const SHAMSI_MONTHS = [
  { id: 1, name: 'فروردین' },
  { id: 2, name: 'اردیبهشت' },
  { id: 3, name: 'خرداد' },
  { id: 4, name: 'تیر' },
  { id: 5, name: 'مرداد' },
  { id: 6, name: 'شهریور' },
  { id: 7, name: 'مهر' },
  { id: 8, name: 'آبان' },
  { id: 9, name: 'آذر' },
  { id: 10, name: 'دی' },
  { id: 11, name: 'بهمن' },
  { id: 12, name: 'اسفند' },
] as const;

export function isShamsiLeapYear(year: number): boolean {
  const breaks = [1, 5, 9, 13, 17, 22, 26, 30];
  return breaks.includes(year % 33);
}

export function getDaysInShamsiMonth(year: number, month: number): number {
  if (month >= 1 && month <= 6) return 31;
  if (month >= 7 && month <= 11) return 30;
  if (month === 12) {
    return isShamsiLeapYear(year) ? 30 : 29;
  }
  return 30;
}

export function formatShamsiDateDisplay(dateStr?: string | null): string {
  if (!dateStr || !dateStr.includes('/')) return 'ثبت نشده';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const monthObj = SHAMSI_MONTHS.find((m) => m.id === month);
  if (!monthObj) return dateStr;

  return `${day} ${monthObj.name} ${year}`;
}

interface ShamsiDatePickerProps {
  value?: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function ShamsiDatePicker({
  value = '',
  onChange,
  placeholder = 'انتخاب تاریخ تولد (مثال: ۱۳۷۵/۰۴/۱۵)',
  disabled = false,
  className = '',
}: ShamsiDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial value or default to 1375/01/01
  const initialYear = value && value.includes('/') ? parseInt(value.split('/')[0], 10) : 1378;
  const initialMonth = value && value.includes('/') ? parseInt(value.split('/')[1], 10) : 1;
  const initialDay = value && value.includes('/') ? parseInt(value.split('/')[2], 10) : 1;

  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);

  // Sync internal state when value prop changes
  useEffect(() => {
    if (value && value.includes('/')) {
      const parts = value.split('/');
      if (parts.length === 3) {
        setSelectedYear(parseInt(parts[0], 10) || 1378);
        setSelectedMonth(parseInt(parts[1], 10) || 1);
        setSelectedDay(parseInt(parts[2], 10) || 1);
      }
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Generate Year list: 1403 down to 1320
  const years = Array.from({ length: 1404 - 1320 }, (_, i) => 1403 - i);

  // Days count in currently selected year and month
  const totalDays = getDaysInShamsiMonth(selectedYear, selectedMonth);

  // Adjust selectedDay if it exceeds current month's max days
  useEffect(() => {
    if (selectedDay > totalDays) {
      setSelectedDay(totalDays);
    }
  }, [selectedYear, selectedMonth, totalDays, selectedDay]);

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    const mStr = String(selectedMonth).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const formatted = `${selectedYear}/${mStr}/${dStr}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleApply = () => {
    const mStr = String(selectedMonth).padStart(2, '0');
    const dStr = String(selectedDay).padStart(2, '0');
    const formatted = `${selectedYear}/${mStr}/${dStr}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef} dir="rtl">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-white border border-slate-300 hover:border-indigo-500 rounded-xl text-sm text-right transition shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:opacity-50 cursor-pointer"
      >
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon className="w-4 h-4 text-indigo-600 shrink-0" />
          {value ? (
            <span className="font-bold text-slate-800">
              {formatShamsiDateDisplay(value)}{' '}
              <span className="text-xs text-slate-400 font-mono font-normal dir-ltr inline-block">
                ({value})
              </span>
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
              title="پاک کردن تاریخ"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
        </div>
      </button>

      {/* Responsive Dropdown Popup */}
      {isOpen && (
        <div className="absolute z-50 mt-2 right-0 left-0 sm:left-auto sm:w-80 p-4 bg-white rounded-2xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Controls: Year & Month Pickers */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
            {/* Year Selector */}
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">سال</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y} {isShamsiLeapYear(y) ? '(کبیسه)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">ماه</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {SHAMSI_MONTHS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Selection Title */}
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-2">
            <span>روز ماه ({SHAMSI_MONTHS[selectedMonth - 1]?.name}):</span>
            <span className="text-[11px] text-indigo-600 font-mono">
              {selectedYear}/{String(selectedMonth).padStart(2, '0')}/{String(selectedDay).padStart(2, '0')}
            </span>
          </div>

          {/* Days Interactive Grid */}
          <div className="grid grid-cols-7 gap-1.5 max-h-48 overflow-y-auto p-1">
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => {
              const isSelected = d === selectedDay;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSelectDay(d)}
                  className={`h-9 w-full rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
                      : 'bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
            >
              پاک کردن
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>تایید تاریخ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
