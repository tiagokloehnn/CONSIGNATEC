import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ArrowUpDown,
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
  CalendarClock,
} from 'lucide-react';
import { Expense, CategoryName, PaymentMethod, ExpenseStatus, CategoryItem } from '../types/finance';
import {
  PAYMENT_METHODS,
  formatBRL,
  formatDateBR,
  getCategoryMeta,
} from '../utils/formatters';

interface ExpenseTableProps {
  expenses: Expense[];
  categories: CategoryItem[];
  currentMonthLabel?: string;
  onOpenNewExpenseModal: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  categories,
  currentMonthLabel,
  onOpenNewExpenseModal,
  onEditExpense,
  onDeleteExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<'data' | 'valor'>('data');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isMobileFiltersExpanded, setIsMobileFiltersExpanded] = useState(false);

  // Active filter count for mobile badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedPayment !== 'all') count++;
    if (selectedStatus !== 'all') count++;
    return count;
  }, [selectedCategory, selectedPayment, selectedStatus]);

  // Filter and Sort
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        // Search
        if (
          searchTerm &&
          !exp.descricao.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }
        // Category
        if (selectedCategory !== 'all' && exp.categoria !== selectedCategory) {
          return false;
        }
        // Payment
        if (selectedPayment !== 'all' && exp.forma_pagamento !== selectedPayment) {
          return false;
        }
        // Status
        if (selectedStatus !== 'all' && exp.status !== selectedStatus) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortField === 'data') {
          const dateDiff = new Date(b.data).getTime() - new Date(a.data).getTime();
          return sortOrder === 'desc' ? dateDiff : -dateDiff;
        } else {
          return sortOrder === 'desc' ? b.valor - a.valor : a.valor - b.valor;
        }
      });
  }, [expenses, searchTerm, selectedCategory, selectedPayment, selectedStatus, sortField, sortOrder]);

  const totalFilteredValue = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + item.valor, 0);
  }, [filteredExpenses]);

  const toggleSort = (field: 'data' | 'valor') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getStatusBadge = (status: ExpenseStatus) => {
    switch (status) {
      case 'Pago':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="h-3 w-3" />
            Pago
          </span>
        );
      case 'Pendente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="h-3 w-3" />
            Pendente
          </span>
        );
      case 'Agendado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <CalendarClock className="h-3 w-3" />
            Agendado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
      {/* Table Header Section */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-teal-800 dark:text-teal-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Registro de Despesas Diárias
            </h2>
            {currentMonthLabel && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800">
                {currentMonthLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Lançamentos detalhados deste período. Seu histórico de todos os meses anteriores permanece 100% gravado e arquivado.
          </p>
        </div>

        <button
          onClick={onOpenNewExpenseModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm shadow-teal-900/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Filters Bar with Mobile Clean Collapsible */}
      <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-2.5 text-xs">
        {/* Top search line + Mobile filter toggle */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição..."
              className="w-full pl-9 pr-3 py-2 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white dark:focus:bg-slate-850 text-base sm:text-xs transition-colors"
            />
          </div>

          {/* Mobile Filter Toggle Button (hides crowded dropdowns by default) */}
          <button
            type="button"
            onClick={() => setIsMobileFiltersExpanded(!isMobileFiltersExpanded)}
            className={`sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors shrink-0 touch-manipulation min-h-[40px] font-semibold text-xs cursor-pointer ${
              isMobileFiltersExpanded || activeFiltersCount > 0
                ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Filter className="h-3.5 w-3.5 text-teal-800 dark:text-teal-400" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="h-4 w-4 rounded-full bg-teal-800 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Dropdowns Row (Always visible on Desktop, collapsible on Mobile) */}
        <div
          className={`${
            isMobileFiltersExpanded ? 'flex' : 'hidden sm:flex'
          } flex-wrap sm:flex-nowrap items-center gap-2 w-full animate-fadeIn`}
        >
          {/* Filter Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 sm:flex-none sm:w-auto py-2 sm:py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-teal-700 text-xs truncate min-w-[100px]"
          >
            <option value="all">Categorias (Todas)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Filter Forma Pagamento */}
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="flex-1 sm:flex-none sm:w-auto py-2 sm:py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-teal-700 text-xs truncate min-w-[100px]"
          >
            <option value="all">Pagamentos (Todos)</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm} value={pm}>
                {pm}
              </option>
            ))}
          </select>

          {/* Filter Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex-1 sm:flex-none sm:w-auto py-2 sm:py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-teal-700 text-xs truncate min-w-[85px]"
          >
            <option value="all">Status (Todos)</option>
            <option value="Pago">Pago</option>
            <option value="Pendente">Pendente</option>
            <option value="Agendado">Agendado</option>
          </select>

          {/* Reset Filters */}
          {(searchTerm || selectedCategory !== 'all' || selectedPayment !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedPayment('all');
                setSelectedStatus('all');
              }}
              className="text-teal-800 dark:text-teal-400 hover:underline font-semibold py-1 px-1 self-start sm:self-auto text-xs shrink-0 touch-manipulation cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* MOBILE CARDS VIEW (md:hidden) */}
      <div className="block md:hidden">
        {filteredExpenses.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-400">
            <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                {expenses.length === 0 ? (
                  <CreditCard className="h-6 w-6 text-teal-700 dark:text-teal-400" />
                ) : (
                  <Filter className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">
                {expenses.length === 0 ? 'Nenhum lançamento no mês' : 'Nenhum lançamento encontrado'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {expenses.length === 0
                  ? 'Cadastre seu primeiro gasto no botão abaixo para iniciar.'
                  : 'Tente alterar os termos da busca ou limpar os filtros.'}
              </p>
              <button
                onClick={onOpenNewExpenseModal}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-teal-800 text-white text-xs font-semibold hover:bg-teal-900 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Novo Lançamento</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredExpenses.map((exp) => {
              const meta = getCategoryMeta(exp.categoria, categories);

              return (
                <div
                  key={exp.id}
                  className="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex flex-col gap-2"
                >
                  {/* Top: Category Tag + Date */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span>{exp.categoria}</span>
                    </span>

                    <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-[11px]">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDateBR(exp.data)}</span>
                    </div>
                  </div>

                  {/* Middle: Description + Value */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold text-slate-900 dark:text-white text-sm leading-snug flex-1">
                      {exp.descricao}
                    </div>
                    <div className="text-base font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatBRL(exp.valor)}
                    </div>
                  </div>

                  {/* Bottom: Payment Method + Status + Quick Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {exp.forma_pagamento}
                      </span>
                      {getStatusBadge(exp.status)}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditExpense(exp)}
                        className="p-2 min-h-[36px] min-w-[36px] rounded-lg text-slate-500 dark:text-slate-400 hover:text-teal-800 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
                        title="Editar Lançamento"
                        aria-label="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteExpense(exp)}
                        className="p-2 min-h-[36px] min-w-[36px] rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center cursor-pointer"
                        title="Excluir Lançamento"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Mobile Footer Summary */}
            <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {filteredExpenses.length} lançamento(s)
              </span>
              <div className="text-right">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Total Filtrado:</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatBRL(totalFilteredValue)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW (hidden md:block) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[680px]">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
              <th
                onClick={() => toggleSort('data')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Data</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4">Descrição</th>
              <th className="py-3 px-4">Categoria</th>
              <th className="py-3 px-4">Forma de Pagamento</th>
              <th
                onClick={() => toggleSort('valor')}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 select-none"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Valor</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      {expenses.length === 0 ? (
                        <CreditCard className="h-6 w-6 text-teal-700 dark:text-teal-400" />
                      ) : (
                        <Filter className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">
                      {expenses.length === 0
                        ? 'Nenhum lançamento registrado'
                        : 'Nenhum lançamento encontrado'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {expenses.length === 0
                        ? 'A página está zerada. Cadastre despesas pelo botão abaixo ou digite seus gastos no leitor rápido com IA.'
                        : 'Nenhuma despesa encontrada para os filtros selecionados. Tente limpar os filtros ou o termo de busca.'}
                    </p>
                    <button
                      onClick={onOpenNewExpenseModal}
                      className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-800 text-white text-xs font-semibold hover:bg-teal-900 transition-colors shadow-xs cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Cadastrar Primeiro Lançamento</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => {
                const meta = getCategoryMeta(exp.categoria, categories);

                return (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors group"
                  >
                    {/* Data */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        {formatDateBR(exp.data)}
                      </div>
                    </td>

                    {/* Descrição */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {exp.descricao}
                    </td>

                    {/* Categoria */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: meta.color }}
                        />
                        {exp.categoria}
                      </span>
                    </td>

                    {/* Forma de Pagamento */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
                      {exp.forma_pagamento}
                    </td>

                    {/* Valor (R$) */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap text-xs sm:text-sm">
                      {formatBRL(exp.valor)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(exp.status)}
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditExpense(exp)}
                          className="p-1.5 rounded text-slate-400 hover:text-teal-800 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar Lançamento"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteExpense(exp)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Excluir Lançamento"
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

          {/* Table Summary Footer */}
          {filteredExpenses.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50/90 dark:bg-slate-800/90 font-semibold text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-800">
                <td colSpan={4} className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                  Exibindo {filteredExpenses.length} de {expenses.length} lançamentos
                </td>
                <td className="py-3.5 px-4 text-right text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {formatBRL(totalFilteredValue)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
