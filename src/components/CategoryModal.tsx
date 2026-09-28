import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Palette } from 'lucide-react';
import { CategoryItem } from '../types/finance';
import {
  AVAILABLE_CATEGORY_ICONS,
  AVAILABLE_CATEGORY_COLORS,
  formatBRL,
} from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<CategoryItem, 'id'>, id?: string) => void;
  existingCategories: CategoryItem[];
  initialCategory?: CategoryItem | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingCategories,
  initialCategory,
}) => {
  const [name, setName] = useState('');
  const [budgetStr, setBudgetStr] = useState('');
  const [color, setColor] = useState(AVAILABLE_CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState('Tag');
  const [classification, setClassification] = useState<
    'necessidades' | 'desejos' | 'investimentos'
  >('desejos');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategory) {
      setName(initialCategory.name);
      setBudgetStr(initialCategory.budget.toString());
      setColor(initialCategory.color);
      setIcon(initialCategory.icon);
      setClassification(initialCategory.classification);
    } else {
      setName('');
      setBudgetStr('300');
      // Pick a random unused or next color from palette
      const usedColors = new Set(existingCategories.map((c) => c.color));
      const nextColor =
        AVAILABLE_CATEGORY_COLORS.find((c) => !usedColors.has(c)) ||
        AVAILABLE_CATEGORY_COLORS[existingCategories.length % AVAILABLE_CATEGORY_COLORS.length];
      setColor(nextColor);
      setIcon('Tag');
      setClassification('desejos');
    }
    setError(null);
  }, [initialCategory, isOpen, existingCategories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Por favor, informe o nome da categoria.');
      return;
    }

    // Check duplicate name (excluding if editing self)
    const isDuplicate = existingCategories.some(
      (c) =>
        c.name.toLowerCase() === trimmed.toLowerCase() &&
        (!initialCategory || c.id !== initialCategory.id)
    );
    if (isDuplicate) {
      setError('Já existe uma categoria cadastrada com esse nome.');
      return;
    }

    const cleanBudget = budgetStr.replace(/\./g, '').replace(',', '.');
    const parsedBudget = parseFloat(cleanBudget);
    if (isNaN(parsedBudget) || parsedBudget < 0) {
      setError('Por favor, informe um orçamento limite numérico válido.');
      return;
    }

    onSave(
      {
        name: trimmed,
        budget: parsedBudget,
        color,
        icon,
        classification,
      },
      initialCategory?.id
    );

    onClose();
  };

  const parsedBudgetPreview = parseFloat(budgetStr.replace(/\./g, '').replace(',', '.')) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {initialCategory ? 'Editar Categoria' : 'Nova Categoria de Orçamento'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalize o nome, ícone, cor e teto mensal de gastos.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Nome da Categoria */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Nome da Categoria *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pets, Viagens & Férias, Streaming, Reforma"
              className="w-full text-base sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
            />
          </div>

          {/* Grid: Orçamento Limite & Classificação 50-30-20 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Orçamento Limite (R$) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400 dark:text-slate-500">
                  R$
                </span>
                <input
                  type="number"
                  step="10"
                  min="0"
                  required
                  value={budgetStr}
                  onChange={(e) => setBudgetStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full text-base sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Regra 50 - 30 - 20 *
              </label>
              <select
                value={classification}
                onChange={(e) =>
                  setClassification(
                    e.target.value as 'necessidades' | 'desejos' | 'investimentos'
                  )
                }
                className="w-full text-base sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
              >
                <option value="necessidades" className="dark:bg-slate-800 dark:text-white">Necessidades (50%)</option>
                <option value="desejos" className="dark:bg-slate-800 dark:text-white">Desejos & Estilo de Vida (30%)</option>
                <option value="investimentos" className="dark:bg-slate-800 dark:text-white">Investimentos & Reserva (20%)</option>
              </select>
            </div>
          </div>

          {/* Escolha do Ícone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Ícone Representativo
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              {AVAILABLE_CATEGORY_ICONS.map((item) => {
                const isSelected = icon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcon(item.id)}
                    title={item.label}
                    className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-800 dark:bg-teal-600 text-white shadow-sm ring-2 ring-teal-700'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    <CategoryIcon iconName={item.id} className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Escolha de Cor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              Cor de Destaque
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {AVAILABLE_CATEGORY_COLORS.map((hex) => {
                const isSelected = color.toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setColor(hex)}
                    style={{ backgroundColor: hex }}
                    className={`h-7 w-7 rounded-full transition-transform cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-teal-800 dark:ring-offset-slate-900 scale-110'
                        : 'hover:scale-105 opacity-90'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Preview Card */}
          <div className="pt-2">
            <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Pré-visualização
            </span>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  <CategoryIcon iconName={icon} className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {name || 'Nome da Categoria'}
                  </span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                    {classification === 'necessidades'
                      ? 'Necessidade Básica'
                      : classification === 'desejos'
                      ? 'Desejo & Estilo de Vida'
                      : 'Investimento / Reserva'}
                  </span>
                </div>
              </div>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {formatBRL(parsedBudgetPreview)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-800 hover:bg-teal-700 rounded-lg shadow-sm shadow-teal-900/20 transition-all cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>{initialCategory ? 'Salvar Alterações' : 'Criar Categoria'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
