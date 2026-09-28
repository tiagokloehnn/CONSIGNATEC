import React, { useState } from 'react';
import { Sparkles, Send, Loader2, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { parseNaturalLanguageExpense } from '../services/aiService';
import { Expense } from '../types/finance';
import { formatBRL } from '../utils/formatters';

interface NaturalLanguageInputProps {
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  availableCategories?: string[];
}

const EXAMPLE_PHRASES = [
  'Gastei 85 reais no almoço de hoje no débito',
  'Combustível 180 reais no PIX',
  'Supermercado 420 reais no crédito',
  'Conta de luz 165 reais no débito automático',
  'Aporte de 500 reais em investimento no pix',
];

export const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({
  onAddExpense,
  availableCategories,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpandedOnMobile, setIsExpandedOnMobile] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const parsed = await parseNaturalLanguageExpense(
        trimmed,
        undefined,
        availableCategories
      );
      onAddExpense({
        data: parsed.data,
        descricao: parsed.descricao,
        categoria: parsed.categoria,
        forma_pagamento: parsed.forma_pagamento,
        valor: parsed.valor,
        status: parsed.status,
      });

      setSuccessMessage(
        `Lançamento adicionado: "${parsed.descricao}" (${formatBRL(parsed.valor)} em ${parsed.categoria})`
      );
      setInputText('');

      // Clear success feedback after 4s
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Não foi possível interpretar o lançamento. Tente novamente com mais detalhes.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExample = (phrase: string) => {
    setInputText(phrase);
  };

  return (
    <div className="bg-gradient-to-r from-teal-900 to-teal-800 rounded-xl p-3.5 sm:p-5 text-white shadow-sm shadow-teal-900/10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-teal-700/80 flex items-center justify-center text-emerald-300 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-base font-bold text-white flex items-center gap-1.5 truncate">
              Leitor Rápido de Gastos com IA
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-700 text-teal-200 shrink-0">
                Gemini IA
              </span>
            </h3>
            <p className="text-[11px] sm:text-xs text-teal-200/90 hidden sm:block">
              Digite uma frase em português natural e o assistente preencherá valor, categoria, pagamento e data.
            </p>
          </div>
        </div>

        {/* Mobile toggle button */}
        <button
          type="button"
          onClick={() => setIsExpandedOnMobile(!isExpandedOnMobile)}
          className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-teal-100 hover:text-white text-xs font-semibold shrink-0 touch-manipulation"
        >
          <span>{isExpandedOnMobile ? 'Recolher' : 'Digitar'}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpandedOnMobile ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Input Form & Examples (Expanded by default on desktop, toggleable on mobile) */}
      <div className={`${isExpandedOnMobile ? 'block' : 'hidden sm:block'} mt-3 animate-fadeIn`}>
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-1 sm:p-1.5 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              placeholder='Ex: "Gastei 85 reais no almoço de hoje no débito"'
              className="w-full bg-transparent px-2.5 sm:px-3 py-1.5 sm:py-2 text-base sm:text-sm text-white placeholder-teal-200/60 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-teal-950 font-semibold text-xs sm:text-sm rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0 min-h-[40px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Processando...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Adicionar</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Example Chips - scrollable horizontally on mobile */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-[11px] font-medium text-teal-300 shrink-0">Sugestões:</span>
          {EXAMPLE_PHRASES.map((phrase, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectExample(phrase)}
              className="text-[11px] bg-white/10 hover:bg-white/20 active:bg-white/30 text-teal-100 hover:text-white px-2.5 py-1 rounded-full border border-white/10 transition-colors shrink-0 whitespace-nowrap touch-manipulation"
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="mt-3 flex items-center gap-2 p-2.5 bg-emerald-500/20 border border-emerald-400/40 rounded-lg text-xs text-emerald-100 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="mt-3 flex items-center gap-2 p-2.5 bg-rose-500/20 border border-rose-400/40 rounded-lg text-xs text-rose-100 animate-fadeIn">
          <AlertCircle className="h-4 w-4 text-rose-300 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
