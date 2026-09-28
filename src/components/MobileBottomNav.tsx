import React from 'react';
import { LayoutDashboard, Receipt, Plus, Target, Sparkles } from 'lucide-react';

export type MobileTab = 'dashboard' | 'despesas' | 'metas' | 'tudo';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
  onOpenNewExpense: () => void;
  onOpenDiagnosis: () => void;
  expensesCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenNewExpense,
  onOpenDiagnosis,
  expensesCount,
}) => {
  return (
    <nav
      aria-label="Navegação Rápida Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 px-2 py-1 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.4)] transition-colors"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Dashboard / Resumo */}
        <button
          type="button"
          onClick={() => onChangeTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 min-w-[56px] min-h-[44px] transition-colors rounded-lg ${
            activeTab === 'dashboard'
              ? 'text-teal-800 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LayoutDashboard className={`h-5 w-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Resumo</span>
        </button>

        {/* 2. Despesas / Lançamentos */}
        <button
          type="button"
          onClick={() => onChangeTab('despesas')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 min-w-[56px] min-h-[44px] transition-colors rounded-lg ${
            activeTab === 'despesas'
              ? 'text-teal-800 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Receipt className={`h-5 w-5 ${activeTab === 'despesas' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Gastos</span>
          {expensesCount > 0 && (
            <span className="absolute top-1 right-2 h-4 w-4 rounded-full bg-teal-800 dark:bg-teal-600 text-white text-[9px] font-bold flex items-center justify-center">
              {expensesCount > 99 ? '99+' : expensesCount}
            </span>
          )}
        </button>

        {/* 3. Floating Quick Add Button */}
        <div className="relative -top-3">
          <button
            type="button"
            onClick={onOpenNewExpense}
            className="h-12 w-12 rounded-full bg-gradient-to-tr from-teal-800 to-teal-600 dark:from-teal-700 dark:to-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-900/30 hover:scale-105 active:scale-95 transition-transform border-2 border-white dark:border-slate-800 focus:outline-none cursor-pointer"
            title="Novo Lançamento"
            aria-label="Cadastrar Nova Despesa"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Metas & Orçamento */}
        <button
          type="button"
          onClick={() => onChangeTab('metas')}
          className={`flex flex-col items-center justify-center py-1 px-2 min-w-[56px] min-h-[44px] transition-colors rounded-lg ${
            activeTab === 'metas'
              ? 'text-teal-800 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Target className={`h-5 w-5 ${activeTab === 'metas' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Metas</span>
        </button>

        {/* 5. IA Diagnóstico */}
        <button
          type="button"
          onClick={onOpenDiagnosis}
          className="flex flex-col items-center justify-center py-1 px-2 min-w-[56px] min-h-[44px] text-slate-500 dark:text-slate-400 hover:text-teal-800 dark:hover:text-teal-400 transition-colors rounded-lg cursor-pointer"
        >
          <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <span className="text-[10px] mt-0.5 text-slate-700 dark:text-slate-300">IA</span>
        </button>
      </div>
    </nav>
  );
};
