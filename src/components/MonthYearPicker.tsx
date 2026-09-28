import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  Plus,
  Check,
} from 'lucide-react';
import {
  MONTH_NAMES_PT,
  MONTH_NAMES_SHORT_PT,
  AVAILABLE_YEARS,
  parseMonthYearString,
  getShiftedMonthLabel,
} from '../utils/formatters';

interface MonthYearPickerProps {
  currentMonth: string;
  onMonthChange: (newMonth: string) => void;
  activeMonths?: string[];
  onAddMonth?: (newMonth: string) => void;
}

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  currentMonth,
  onMonthChange,
  activeMonths = [],
  onAddMonth,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNewMonth, setIsAddingNewMonth] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse currently active month and year
  const parsed = parseMonthYearString(currentMonth);
  const isAllMonths = currentMonth === 'all';

  // Internal year state for the picker matrix
  const [pickerYear, setPickerYear] = useState<number>(() => {
    if (parsed) return parsed.year;
    return new Date().getFullYear();
  });

  // Keep picker year in sync when currentMonth changes from outside
  useEffect(() => {
    if (parsed) {
      setPickerYear(parsed.year);
    }
  }, [currentMonth]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAddingNewMonth(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Handle previous/next month direct button clicks
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAllMonths) {
      const now = new Date();
      onMonthChange(`${MONTH_NAMES_PT[now.getMonth()]} ${now.getFullYear()}`);
      return;
    }
    const prev = getShiftedMonthLabel(currentMonth, -1);
    onMonthChange(prev);
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAllMonths) {
      const now = new Date();
      onMonthChange(`${MONTH_NAMES_PT[now.getMonth()]} ${now.getFullYear()}`);
      return;
    }
    const next = getShiftedMonthLabel(currentMonth, 1);
    onMonthChange(next);
  };

  const handleSelectMonth = (monthIndex: number) => {
    const fullMonthName = MONTH_NAMES_PT[monthIndex];
    const newMonthLabel = `${fullMonthName} ${pickerYear}`;
    if (onAddMonth && !activeMonths.includes(newMonthLabel)) {
      onAddMonth(newMonthLabel);
    }
    onMonthChange(newMonthLabel);
    setIsOpen(false);
    setIsAddingNewMonth(false);
  };

  const handleSelectCurrentRealMonth = () => {
    const now = new Date();
    const currentM = MONTH_NAMES_PT[now.getMonth()];
    const currentY = now.getFullYear();
    setPickerYear(currentY);
    const newMonthLabel = `${currentM} ${currentY}`;
    if (onAddMonth && !activeMonths.includes(newMonthLabel)) {
      onAddMonth(newMonthLabel);
    }
    onMonthChange(newMonthLabel);
    setIsOpen(false);
    setIsAddingNewMonth(false);
  };

  const handleSelectAllMonths = () => {
    onMonthChange('all');
    setIsOpen(false);
    setIsAddingNewMonth(false);
  };

  return (
    <div className="relative inline-block w-full sm:w-auto" ref={containerRef}>
      {/* Navigator Bar with Left/Right chevrons & Central Compact Trigger */}
      <div className="flex items-center justify-between w-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-xl border border-slate-200/90 dark:border-slate-800 p-0.5 shadow-2xs transition-colors">
        {/* Previous Month */}
        <button
          type="button"
          onClick={handlePrevMonth}
          title="Mês anterior"
          aria-label="Mês anterior"
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0 touch-manipulation cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Center Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all min-w-0 cursor-pointer ${
            isOpen
              ? 'bg-white dark:bg-slate-800 text-teal-900 dark:text-teal-300 shadow-xs'
              : 'text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Clique para escolher ou adicionar mês de lançamento"
        >
          <Calendar className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
          <span className="truncate max-w-[140px] sm:max-w-none">
            {isAllMonths ? 'Todos os Meses' : currentMonth}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-teal-800 dark:text-teal-400' : ''
            }`}
          />
        </button>

        {/* Next Month */}
        <button
          type="button"
          onClick={handleNextMonth}
          title="Próximo mês"
          aria-label="Próximo mês"
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0 touch-manipulation cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Popover Picker */}
      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-0 sm:right-auto mt-2 w-[calc(100vw-1.5rem)] max-w-[340px] sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3.5 z-50 animate-fadeIn text-slate-800 dark:text-slate-100">
          {/* Header: Year Stepper / Selector */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setPickerYear((y) => y - 1)}
              className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Ano anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Year Selector Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Ano:
              </span>
              <select
                value={pickerYear}
                onChange={(e) => setPickerYear(parseInt(e.target.value, 10))}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-sm text-slate-900 dark:text-slate-100 py-1 px-2.5 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-700 cursor-pointer"
              >
                {AVAILABLE_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setPickerYear((y) => y + 1)}
              className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Próximo ano"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Active / Added Months Quick Selection */}
          {activeMonths && activeMonths.length > 0 && (
            <div className="py-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Meses em Lançamento:</span>
                <span className="text-teal-700 dark:text-teal-400 font-semibold">{activeMonths.length} ativos</span>
              </div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {activeMonths.map((m) => {
                  const isCurrent = m === currentMonth;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        onMonthChange(m);
                        setIsOpen(false);
                      }}
                      className={`text-[11px] px-2 py-0.5 rounded-lg font-medium transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-teal-800 dark:bg-teal-600 text-white font-bold shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-700 hover:text-teal-900 dark:hover:text-teal-300'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 12-Month Matrix Grid */}
          <div className="py-2.5">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 text-center">
              Selecione o Mês ({pickerYear})
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {MONTH_NAMES_SHORT_PT.map((shortName, index) => {
                const monthFullName = MONTH_NAMES_PT[index];
                const fullMonthLabel = `${monthFullName} ${pickerYear}`;
                const isSelected =
                  !isAllMonths &&
                  parsed?.month === index + 1 &&
                  parsed?.year === pickerYear;
                const isAlreadyActive = activeMonths.includes(fullMonthLabel);

                return (
                  <button
                    key={shortName}
                    type="button"
                    onClick={() => handleSelectMonth(index)}
                    title={`${monthFullName} de ${pickerYear}`}
                    className={`py-2 px-1 text-xs rounded-xl font-semibold transition-all text-center touch-manipulation cursor-pointer relative ${
                      isSelected
                        ? 'bg-teal-800 dark:bg-teal-600 text-white shadow-xs font-bold ring-2 ring-teal-700/50'
                        : isAlreadyActive
                        ? 'bg-teal-50/70 dark:bg-teal-950/60 text-teal-900 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-700 hover:text-teal-900 dark:hover:text-teal-300 border border-slate-200/50 dark:border-slate-700 active:bg-slate-100'
                    }`}
                  >
                    <span>{shortName}</span>
                    {isAlreadyActive && !isSelected && (
                      <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-teal-600 dark:bg-teal-400"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Shortcuts */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={handleSelectCurrentRealMonth}
              className="px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-transparent dark:border-teal-800 font-semibold transition-colors flex items-center gap-1 text-[11px] sm:text-xs cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              <span>Mês Atual</span>
            </button>

            <button
              type="button"
              onClick={handleSelectAllMonths}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 text-[11px] sm:text-xs cursor-pointer ${
                isAllMonths
                  ? 'bg-slate-800 dark:bg-teal-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>Todos os Meses</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
