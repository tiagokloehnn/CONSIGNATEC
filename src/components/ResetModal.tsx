import React, { useState } from 'react';
import {
  RotateCcw,
  Trash2,
  X,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Layers,
  Target,
} from 'lucide-react';
import { formatBRL } from '../utils/formatters';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetSelectedMonth: () => void;
  onResetAllMonths: () => void;
  onWipeDatabaseAndStartFromZero?: () => void;
  onResetBudgetsToZero?: () => void;
  onRestoreDemoData: () => void;
  onRestoreDefaultCategories?: () => void;
  currentMonth: string;
  selectedMonthExpenseCount: number;
  selectedMonthTotalSpent: number;
  totalExpenseCount: number;
}

export const ResetModal: React.FC<ResetModalProps> = ({
  isOpen,
  onClose,
  onResetSelectedMonth,
  onResetAllMonths,
  onWipeDatabaseAndStartFromZero,
  onResetBudgetsToZero,
  onRestoreDemoData,
  onRestoreDefaultCategories,
  currentMonth,
  selectedMonthExpenseCount,
  selectedMonthTotalSpent,
  totalExpenseCount,
}) => {
  const [confirmWipeAll, setConfirmWipeAll] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  if (!isOpen) return null;

  const isAllView = currentMonth === 'all';
  const otherMonthsCount = Math.max(0, totalExpenseCount - selectedMonthExpenseCount);

  const handleExecuteWipe = async () => {
    setIsWiping(true);
    try {
      if (onWipeDatabaseAndStartFromZero) {
        await onWipeDatabaseAndStartFromZero();
      } else {
        await onResetAllMonths();
      }
    } finally {
      setIsWiping(false);
      setConfirmWipeAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-start gap-3 sm:gap-3.5 bg-gradient-to-r from-rose-50/60 via-amber-50/30 to-white dark:from-rose-950/40 dark:via-amber-950/20 dark:to-slate-900 shrink-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="flex-1 pr-2 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
              {isAllView
                ? 'Zerar Lançamentos de Todos os Meses'
                : `Zerar Apenas o Mês de ${currentMonth}`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {isAllView
                ? 'Você está visualizando todos os meses consolidados. Deseja zerar as despesas e receitas?'
                : `Esta operação irá apagar somente os lançamentos e valores referentes a ${currentMonth}. Seus dados de outros meses não serão afetados.`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Breakdown Card */}
        <div className="p-4 sm:p-5 space-y-3 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Active Month Box */}
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-2xs">
              <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-xs">
                <Calendar className="h-3.5 w-3.5" />
                <span>Será Zerado ({isAllView ? 'Geral' : currentMonth})</span>
              </div>
              <div className="mt-1.5">
                <div className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
                  {selectedMonthExpenseCount} lançamento(s)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Total de {formatBRL(selectedMonthTotalSpent)} e receita redefinida para R$ 0,00.
                </p>
              </div>
            </div>

            {/* Other Months Protected Box */}
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-900/60 shadow-2xs">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Permanece 100% Salvo</span>
              </div>
              <div className="mt-1.5">
                <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                  {otherMonthsCount} lançamento(s)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {otherMonthsCount > 0
                    ? 'Despesas de meses anteriores e futuros continuam arquivadas no histórico.'
                    : 'Nenhum outro mês possui despesas cadastradas no momento.'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Garantia de histórico:</strong> Seus orçamentos por categoria e os lançamentos dos outros períodos permanecem intactos no seu navegador.
            </p>
          </div>
        </div>

        {/* OPÇÃO DESTAQUE: Zerar Banco de Dados e Começar do Zero */}
        <div className="p-4 sm:p-5 bg-rose-50/80 dark:bg-rose-950/40 border-b border-rose-200/80 dark:border-rose-900/60">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Zerar Banco de Dados e Começar do Zero
              </h4>
              <p className="text-xs text-rose-700/90 dark:text-rose-300/80 mt-0.5 leading-relaxed">
                Apaga todos os {totalExpenseCount} lançamento(s) na nuvem, zera todas as receitas e redefine os tetos orçamentários para R$ 0,00. Seu aplicativo volta ao estado inicial limpo.
              </p>

              {!confirmWipeAll ? (
                <button
                  type="button"
                  onClick={() => setConfirmWipeAll(true)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Quero zerar o banco de dados e começar do zero</span>
                </button>
              ) : (
                <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 shadow-sm space-y-2 animate-fadeIn">
                  <div className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                    ⚠️ Tem certeza absoluta? Todos os registros na nuvem serão excluídos permanentemente.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isWiping}
                      onClick={handleExecuteWipe}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isWiping ? 'Zerando banco de dados...' : 'Sim, Zerar Tudo e Começar do Zero'}
                    </button>
                    <button
                      type="button"
                      disabled={isWiping}
                      onClick={() => setConfirmWipeAll(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gerenciamento de Metas & Orçamentos */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold">
            <Target className="h-4 w-4 text-teal-800 dark:text-teal-400 shrink-0" />
            <span>Orçamentos & Metas por Categoria:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {onResetBudgetsToZero && (
              <button
                type="button"
                onClick={onResetBudgetsToZero}
                className="px-2.5 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 text-[11px] font-bold transition-colors cursor-pointer border border-transparent dark:border-amber-800"
                title="Define o limite de todas as categorias para R$ 0,00 para preencher novos valores"
              >
                Zerar Metas (R$ 0,00)
              </button>
            )}
            {onRestoreDefaultCategories && (
              <button
                type="button"
                onClick={onRestoreDefaultCategories}
                className="px-2.5 py-1 rounded-lg bg-teal-100/80 dark:bg-teal-950/60 hover:bg-teal-200 dark:hover:bg-teal-900/60 text-teal-950 dark:text-teal-300 text-[11px] font-bold transition-colors cursor-pointer border border-transparent dark:border-teal-800"
                title="Restaura a lista e tetos das categorias padrão"
              >
                Restaurar Categorias Padrão
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={onRestoreDemoData}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:underline flex items-center gap-1.5 py-1 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span>Restaurar dados de exemplo</span>
            </button>

            {onRestoreDefaultCategories && (
              <button
                type="button"
                onClick={onRestoreDefaultCategories}
                className="text-xs font-semibold text-teal-800 dark:text-teal-400 hover:text-teal-950 dark:hover:text-teal-200 hover:underline flex items-center gap-1.5 py-1 cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
                <span>Restaurar categorias padrão</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onResetSelectedMonth}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-lg shadow-sm shadow-rose-600/20 transition-all cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>
                {isAllView ? 'Zerar Todos os Meses' : `Zerar Apenas ${currentMonth}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
