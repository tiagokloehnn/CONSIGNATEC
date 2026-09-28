import React, { useState, useEffect } from 'react';
import { X, Check, Plus } from 'lucide-react';
import { Expense, CategoryName, PaymentMethod, ExpenseStatus, CategoryItem } from '../types/finance';
import { PAYMENT_METHODS } from '../utils/formatters';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, 'id'>, id?: string) => void;
  initialExpense?: Expense | null;
  categories: CategoryItem[];
  defaultYearMonth?: string;
  onOpenNewCategory?: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialExpense,
  categories,
  defaultYearMonth,
  onOpenNewCategory,
}) => {
  const [data, setData] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<CategoryName>('Alimentação');
  const [formaPagamento, setFormaPagamento] = useState<PaymentMethod>('PIX');
  const [valorStr, setValorStr] = useState('');
  const [status, setStatus] = useState<ExpenseStatus>('Pago');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialExpense) {
      setData(initialExpense.data);
      setDescricao(initialExpense.descricao);
      setCategoria(initialExpense.categoria);
      setFormaPagamento(initialExpense.forma_pagamento);
      setValorStr(initialExpense.valor.toString());
      setStatus(initialExpense.status);
    } else {
      // Default to current selected month or today
      const today = new Date();
      const todayISO = today.toISOString().split('T')[0];
      if (defaultYearMonth && defaultYearMonth !== 'all') {
        const [targetYear, targetMonth] = defaultYearMonth.split('-');
        const currentYearStr = String(today.getFullYear());
        const currentMonthStr = String(today.getMonth() + 1).padStart(2, '0');
        if (targetYear === currentYearStr && targetMonth === currentMonthStr) {
          setData(todayISO);
        } else {
          setData(`${defaultYearMonth}-01`);
        }
      } else {
        setData(todayISO);
      }

      setDescricao('');
      setCategoria(categories[0]?.name || 'Alimentação');
      setFormaPagamento('PIX');
      setValorStr('');
      setStatus('Pago');
    }
    setError(null);
  }, [initialExpense, isOpen, categories, defaultYearMonth]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      setError('Por favor, informe uma descrição para o lançamento.');
      return;
    }

    const cleanVal = valorStr.replace(/\./g, '').replace(',', '.');
    const parsedVal = parseFloat(cleanVal);
    if (isNaN(parsedVal) || parsedVal <= 0) {
      setError('Por favor, informe um valor numérico válido maior que zero.');
      return;
    }

    onSave(
      {
        data: data || new Date().toISOString().split('T')[0],
        descricao: descricao.trim(),
        categoria,
        forma_pagamento: formaPagamento,
        valor: parsedVal,
        status,
      },
      initialExpense ? initialExpense.id : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all my-auto max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/80 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {initialExpense ? 'Editar Despesa' : 'Novo Lançamento de Despesa'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Preencha os detalhes da transação financeira.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Descrição do Gasto *
            </label>
            <input
              type="text"
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Supermercado Semanal, Abastecimento, Aluguel"
              className="w-full text-base sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
            />
          </div>

          {/* Grid: Valor & Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Valor (R$) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400 dark:text-slate-500">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={valorStr}
                  onChange={(e) => setValorStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full text-base sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Data do Lançamento *
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full text-base sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
              />
            </div>
          </div>

          {/* Grid: Categoria & Forma de Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Categoria *
                </label>
                {onOpenNewCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenNewCategory();
                    }}
                    className="text-[11px] font-semibold text-teal-800 dark:text-teal-400 hover:text-teal-950 dark:hover:text-teal-300 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Nova Categoria</span>
                  </button>
                )}
              </div>
              {categories.length === 0 ? (
                <div className="p-2 border border-dashed border-rose-300 dark:border-rose-800 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-700 dark:text-rose-300">
                  <span>Nenhuma categoria cadastrada. </span>
                  {onOpenNewCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenNewCategory();
                      }}
                      className="font-bold underline text-rose-900 dark:text-rose-200"
                    >
                      Criar agora
                    </button>
                  )}
                </div>
              ) : (
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full text-base sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name} className="dark:bg-slate-800 dark:text-white">
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Forma de Pagamento *
              </label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value as PaymentMethod)}
                className="w-full text-base sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm} className="dark:bg-slate-800 dark:text-white">
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Status da Transação *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Pago', 'Pendente', 'Agendado'] as ExpenseStatus[]).map((st) => {
                const isSelected = status === st;
                let activeStyle = '';
                if (st === 'Pago') {
                  activeStyle = isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-500 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700';
                } else if (st === 'Pendente') {
                  activeStyle = isSelected
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-500 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700';
                } else {
                  activeStyle = isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-500 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700';
                }

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 px-2 text-xs rounded-lg border text-center transition-all min-h-[40px] flex items-center justify-center cursor-pointer ${activeStyle}`}
                  >
                    {st === 'Pago' && '🟢 Pago'}
                    {st === 'Pendente' && '🟡 Pendente'}
                    {st === 'Agendado' && '🔵 Agendado'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 sm:border-transparent text-center cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-teal-800 hover:bg-teal-700 rounded-lg shadow-sm shadow-teal-900/20 transition-all min-h-[44px] cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>{initialExpense ? 'Salvar Alterações' : 'Adicionar Despesa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
