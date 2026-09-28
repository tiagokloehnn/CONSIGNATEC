import React, { useState } from 'react';
import {
  Edit2,
  Check,
  X,
  Target,
  Plus,
  Trash2,
  Settings2,
  RotateCcw,
} from 'lucide-react';
import { CategoryItem } from '../types/finance';
import {
  formatBRL,
  formatPercent,
  getCategoryStatus,
  getStatusBadgeConfig,
} from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface CategoryBudgetTableProps {
  categories: CategoryItem[];
  spendingByCategory: Record<string, number>;
  onUpdateBudget: (categoryName: string, newLimit: number) => void;
  onOpenNewCategoryModal: () => void;
  onEditCategory: (category: CategoryItem) => void;
  onDeleteCategory: (category: CategoryItem) => void;
  onRestoreDefaultCategories?: () => void;
}

export const CategoryBudgetTable: React.FC<CategoryBudgetTableProps> = ({
  categories,
  spendingByCategory,
  onUpdateBudget,
  onOpenNewCategoryModal,
  onEditCategory,
  onDeleteCategory,
  onRestoreDefaultCategories,
}) => {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [tempBudgetValue, setTempBudgetValue] = useState<string>('');

  const handleStartEdit = (cat: CategoryItem) => {
    setEditingCategoryId(cat.id);
    setTempBudgetValue(cat.budget.toString());
  };

  const handleSaveBudget = (cat: CategoryItem) => {
    const cleaned = tempBudgetValue.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateBudget(cat.name, parsed);
    }
    setEditingCategoryId(null);
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
  };

  // Calculations for Total Row
  let totalBudget = 0;
  let totalSpent = 0;
  categories.forEach((cat) => {
    totalBudget += cat.budget || 0;
    totalSpent += spendingByCategory[cat.name] || 0;
  });
  const totalRemaining = totalBudget - totalSpent;
  const totalPercentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const totalStatus = getCategoryStatus(totalBudget, totalSpent);
  const totalBadge = getStatusBadgeConfig(totalStatus);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
      {/* Table Header Section */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-teal-800 dark:text-teal-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Tabela de Metas & Orçamento por Categoria
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700">
              {categories.length} categorias
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe tetos de gastos, crie novas categorias ou exclua conforme sua necessidade orçamentária.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span> &lt;90%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span> 90-99%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span> &ge;100%
            </span>
          </div>

          {onRestoreDefaultCategories && (
            <button
              type="button"
              onClick={onRestoreDefaultCategories}
              title="Restaurar categorias e metas padrão recomendadas"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span>Restaurar Padrão</span>
            </button>
          )}

          <button
            onClick={onOpenNewCategoryModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs rounded-lg shadow-sm shadow-teal-900/10 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Categoria</span>
          </button>
        </div>
      </div>

      {/* MOBILE CARDS VIEW (md:hidden) */}
      <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {categories.length === 0 ? (
          <div className="py-10 px-4 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-800">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Nenhum orçamento ou meta cadastrada
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Crie suas categorias de gastos com seus limites mensais ou carregue a estrutura padrão.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2 max-w-xs mx-auto">
              <button
                type="button"
                onClick={onOpenNewCategoryModal}
                className="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 touch-manipulation cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Criar Primeira Categoria</span>
              </button>
              {onRestoreDefaultCategories && (
                <button
                  type="button"
                  onClick={onRestoreDefaultCategories}
                  className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs rounded-xl transition-colors touch-manipulation cursor-pointer"
                >
                  Restaurar Categorias Padrão
                </button>
              )}
            </div>
          </div>
        ) : (
          categories.map((cat) => {
            const budget = cat.budget || 0;
            const spent = spendingByCategory[cat.name] || 0;
            const remaining = budget - spent;
            const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
            const status = getCategoryStatus(budget, spent);
            const badge = getStatusBadgeConfig(status);
            const isEditing = editingCategoryId === cat.id;

            return (
              <div key={cat.id} className="p-4 bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                {/* Header: Icon, Name, Category Classification & Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        color: cat.color,
                      }}
                    >
                      <CategoryIcon iconName={cat.icon} className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-sm text-slate-900 dark:text-white block truncate">
                        {cat.name}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
                        {cat.classification === 'necessidades'
                          ? 'Necessidade'
                          : cat.classification === 'desejos'
                          ? 'Desejo'
                          : 'Investimento'}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Badge */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>

                    <button
                      onClick={() => onEditCategory(cat)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-teal-800 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-slate-800 cursor-pointer"
                      title="Editar Categoria"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCategory(cat)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="Excluir Categoria"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Uso da Meta:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatPercent(percentUsed)}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${badge.barColor}`}
                      style={{
                        width: `${Math.min(Math.max(percentUsed, 0), 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 3 Metrics: Limite, Gasto, Saldo */}
                <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium truncate">Meta (Limite)</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          value={tempBudgetValue}
                          onChange={(e) => setTempBudgetValue(e.target.value)}
                          className="w-full text-xs font-bold p-1 border border-teal-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-w-0"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveBudget(cat)}
                          className="p-1 rounded bg-teal-800 hover:bg-teal-900 text-white shrink-0 cursor-pointer"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mt-0.5 min-w-0">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] sm:text-xs truncate" title={formatBRL(budget)}>
                          {formatBRL(budget)}
                        </span>
                        <button
                          onClick={() => handleStartEdit(cat)}
                          className="text-slate-400 hover:text-teal-800 dark:hover:text-teal-300 p-0.5 shrink-0 touch-manipulation cursor-pointer"
                          title="Ajustar Meta"
                        >
                          <Edit2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium truncate">Gasto Real</span>
                    <span className="font-bold text-slate-900 dark:text-white text-[11px] sm:text-xs mt-0.5 block truncate" title={formatBRL(spent)}>
                      {formatBRL(spent)}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium truncate">Saldo Livre</span>
                    <span
                      className={`font-bold text-[11px] sm:text-xs mt-0.5 block truncate ${
                        remaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                      title={formatBRL(remaining)}
                    >
                      {formatBRL(remaining)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Mobile Total Row */}
        {categories.length > 0 && (
          <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-xs">
            <div className="min-w-0">
              <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[10px] sm:text-[11px] truncate">Total Orçado:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm truncate block">{formatBRL(totalBudget)}</span>
            </div>
            <div className="min-w-0">
              <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[10px] sm:text-[11px] truncate">Total Gasto:</span>
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate block">{formatBRL(totalSpent)}</span>
            </div>
            <div className="text-right min-w-0">
              <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[10px] sm:text-[11px] truncate">Saldo Geral:</span>
              <span className={`font-bold text-xs sm:text-sm truncate block ${totalRemaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {formatBRL(totalRemaining)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW (hidden md:block) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[760px]">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
              <th className="py-3 px-4">Categoria</th>
              <th className="py-3 px-4 text-right">Orçamento Limite</th>
              <th className="py-3 px-4 text-right">Gasto Real</th>
              <th className="py-3 px-4 text-right">Saldo Restante</th>
              <th className="py-3 px-4 text-center w-28">% Utilizado</th>
              <th className="py-3 px-4 min-w-[140px]">Progresso Visual</th>
              <th className="py-3 px-4 text-center">Status Automático</th>
              <th className="py-3 px-4 text-center w-20">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 px-4 text-center text-slate-500 dark:text-slate-400">
                  <div className="max-w-sm mx-auto space-y-3">
                    <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-800">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Nenhuma categoria ou meta configurada
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Defina limites por categoria para acompanhar sua regra orçamentária 50-30-20.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        onClick={onOpenNewCategoryModal}
                        className="px-3.5 py-1.5 rounded-lg bg-teal-800 text-white font-semibold text-xs hover:bg-teal-900 transition-colors cursor-pointer"
                      >
                        + Criar Categoria
                      </button>
                      {onRestoreDefaultCategories && (
                        <button
                          onClick={onRestoreDefaultCategories}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Carregar Categorias Padrão
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              categories.map((cat) => {
                const budget = cat.budget || 0;
                const spent = spendingByCategory[cat.name] || 0;
                const remaining = budget - spent;
                const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
                const status = getCategoryStatus(budget, spent);
                const badge = getStatusBadgeConfig(status);

                // Visual Progress calculation
                const clampedPercent = Math.min(Math.max(percentUsed, 0), 100);

                // Progress bar color rules:
                // Verde até 89%, Amarelo entre 90% e 99%, Vermelho a partir de 100%
                let barColorClass = 'bg-slate-300 dark:bg-slate-700';
                if (budget > 0) {
                  if (percentUsed >= 100) {
                    barColorClass = 'bg-rose-500';
                  } else if (percentUsed >= 90) {
                    barColorClass = 'bg-amber-500';
                  } else {
                    barColorClass = 'bg-emerald-500';
                  }
                }

                const isEditing = editingCategoryId === cat.id;

                return (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors group"
                  >
                    {/* Categoria */}
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${cat.color}15`,
                            color: cat.color,
                          }}
                        >
                          <CategoryIcon iconName={cat.icon} className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 block">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
                            {cat.classification === 'necessidades'
                              ? 'Necessidade'
                              : cat.classification === 'desejos'
                              ? 'Desejo'
                              : 'Investimento'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Orçamento Limite (R$) */}
                    <td className="py-3.5 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-slate-400">R$</span>
                          <input
                            type="number"
                            step="10"
                            min="0"
                            value={tempBudgetValue}
                            onChange={(e) => setTempBudgetValue(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveBudget(cat);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="w-24 text-right text-xs font-semibold py-1 px-1.5 border border-teal-600 rounded focus:outline-none focus:ring-1 focus:ring-teal-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                          <button
                            onClick={() => handleSaveBudget(cat)}
                            className="p-1 rounded text-teal-800 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-700 cursor-pointer"
                            title="Salvar Limite"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Cancelar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5 group/edit">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                            {formatBRL(budget)}
                          </span>
                          <button
                            onClick={() => handleStartEdit(cat)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-teal-800 dark:hover:text-teal-400 transition-opacity cursor-pointer"
                            title="Editar teto de gastos rapidamente"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Gasto Real (R$) */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-900 dark:text-white text-xs sm:text-sm">
                      {formatBRL(spent)}
                    </td>

                    {/* Saldo Restante (R$) */}
                    <td className="py-3.5 px-4 text-right text-xs sm:text-sm">
                      <span
                        className={`font-semibold ${
                          budget === 0
                            ? 'text-slate-400 dark:text-slate-500'
                            : remaining < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {formatBRL(remaining)}
                      </span>
                    </td>

                    {/* % Utilizado */}
                    <td className="py-3.5 px-4 text-center font-medium text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {budget === 0 ? '0,0%' : formatPercent(percentUsed)}
                    </td>

                    {/* Progresso Visual */}
                    <td className="py-3.5 px-4">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${barColorClass}`}
                          style={{ width: `${clampedPercent}%` }}
                        ></div>
                      </div>
                    </td>

                    {/* Status Automático */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>
                    </td>

                    {/* Ações (Configurar / Excluir Categoria) */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditCategory(cat)}
                          className="p-1.5 rounded text-slate-400 hover:text-teal-800 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Personalizar Categoria (Nome, Ícone, Cor, Classificação)"
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteCategory(cat)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Excluir Categoria"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Linha de Total Geral */}
          {categories.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100/80 dark:bg-slate-800/90 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Total Geral ({categories.length} Categorias)
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right text-xs sm:text-sm">
                  {formatBRL(totalBudget)}
                </td>
                <td className="py-4 px-4 text-right text-xs sm:text-sm text-slate-900 dark:text-white">
                  {formatBRL(totalSpent)}
                </td>
                <td className="py-4 px-4 text-right text-xs sm:text-sm">
                  <span
                    className={
                      totalRemaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                    }
                  >
                    {formatBRL(totalRemaining)}
                  </span>
                </td>
                <td className="py-4 px-4 text-center text-xs sm:text-sm">
                  {formatPercent(totalPercentUsed)}
                </td>
                <td className="py-4 px-4">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full ${totalBadge.barColor}`}
                      style={{
                        width: `${Math.min(Math.max(totalPercentUsed, 0), 100)}%`,
                      }}
                    ></div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${totalBadge.bg} ${totalBadge.text} ${totalBadge.border}`}
                  >
                    <span>{totalBadge.icon}</span>
                    <span>{totalBadge.label}</span>
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
