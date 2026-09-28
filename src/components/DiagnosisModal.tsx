import React, { useState } from 'react';
import {
  Sparkles,
  X,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Copy,
  Check,
  Compass,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { FinancialDiagnosis } from '../types/finance';

interface DiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnosis: FinancialDiagnosis | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const DiagnosisModal: React.FC<DiagnosisModalProps> = ({
  isOpen,
  onClose,
  diagnosis,
  isLoading,
  onRefresh,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyReport = () => {
    if (!diagnosis) return;
    const textReport = `=== DIAGNÓSTICO FINANCEIRO FINANZEN (IA GEMINI) ===
Nota de Saúde Financeira: ${diagnosis.healthScore}/100 (${diagnosis.healthStatus})

RESUMO EXECUTIVO:
${diagnosis.summary}

REGRA 50-30-20:
- Necessidades: ${diagnosis.rule50_30_20.necessidades.percentual.toFixed(1)}% (${diagnosis.rule50_30_20.necessidades.status})
  ${diagnosis.rule50_30_20.necessidades.analise}
- Desejos: ${diagnosis.rule50_30_20.desejos.percentual.toFixed(1)}% (${diagnosis.rule50_30_20.desejos.status})
  ${diagnosis.rule50_30_20.desejos.analise}
- Investimentos: ${diagnosis.rule50_30_20.investimentos.percentual.toFixed(1)}% (${diagnosis.rule50_30_20.investimentos.status})
  ${diagnosis.rule50_30_20.investimentos.analise}

PRINCIPAIS GARGALOS:
${diagnosis.bottlenecks.map((b) => `• [${b.impacto}] ${b.categoria}: ${b.motivo} -> Solução: ${b.recomendacao}`).join('\n')}

RECOMENDAÇÕES PRÁTICAS:
${diagnosis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
`;

    navigator.clipboard.writeText(textReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-teal-800 bg-teal-50 border-teal-200';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 my-auto sm:my-8 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  Diagnóstico Financeiro
                </h3>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                  Gemini IA
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-teal-200/80 truncate">
                Auditoria de gastos, comparativo 50-30-20 e orientações.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-10 w-10 text-teal-800 dark:text-teal-400 animate-spin" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                O modelo Gemini está avaliando seu orçamento...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm text-center">
                Calculando conformidade com a regra 50-30-20, detectando gargalos e gerando recomendações personalizadas.
              </p>
            </div>
          ) : !diagnosis ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <p>Nenhum diagnóstico gerado ainda.</p>
              <button
                onClick={onRefresh}
                className="mt-3 px-4 py-2 bg-teal-800 dark:bg-teal-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Gerar Agora
              </button>
            </div>
          ) : (
            <>
              {/* Score & Summary Card */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <div
                  className={`flex flex-col items-center justify-center h-28 w-28 rounded-2xl border-2 shrink-0 ${getScoreColor(
                    diagnosis.healthScore
                  )}`}
                >
                  <span className="text-3xl font-extrabold tracking-tight">
                    {diagnosis.healthScore}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                    {diagnosis.healthStatus}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">Score / 100</span>
                </div>

                <div className="space-y-1.5 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
                    <Compass className="h-4 w-4 text-teal-800 dark:text-teal-400" />
                    Parecer do Consultor IA
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {diagnosis.summary}
                  </p>
                </div>
              </div>

              {/* 50-30-20 Rule Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-teal-800 dark:text-teal-400" />
                    Comparativo Regra 50 - 30 - 20
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Metodologia de Planejamento Financeiro
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Necessidades (50%) */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Necessidades
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        Meta: até 50%
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {diagnosis.rule50_30_20.necessidades.percentual.toFixed(1)}%
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          diagnosis.rule50_30_20.necessidades.percentual <= 50
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {diagnosis.rule50_30_20.necessidades.status}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full ${
                          diagnosis.rule50_30_20.necessidades.percentual <= 50
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            diagnosis.rule50_30_20.necessidades.percentual,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {diagnosis.rule50_30_20.necessidades.analise}
                    </p>
                  </div>

                  {/* Desejos (30%) */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Desejos / Estilo de Vida
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        Meta: até 30%
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {diagnosis.rule50_30_20.desejos.percentual.toFixed(1)}%
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          diagnosis.rule50_30_20.desejos.percentual <= 30
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {diagnosis.rule50_30_20.desejos.status}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full ${
                          diagnosis.rule50_30_20.desejos.percentual <= 30
                            ? 'bg-emerald-500'
                            : 'bg-rose-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            diagnosis.rule50_30_20.desejos.percentual,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {diagnosis.rule50_30_20.desejos.analise}
                    </p>
                  </div>

                  {/* Investimentos / Reserva (20%) */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Investimentos / Reserva
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        Meta: min 20%
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {diagnosis.rule50_30_20.investimentos.percentual.toFixed(1)}%
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          diagnosis.rule50_30_20.investimentos.percentual >= 20
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {diagnosis.rule50_30_20.investimentos.status}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full ${
                          diagnosis.rule50_30_20.investimentos.percentual >= 20
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            diagnosis.rule50_30_20.investimentos.percentual,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {diagnosis.rule50_30_20.investimentos.analise}
                    </p>
                  </div>
                </div>
              </div>

              {/* Gargalos de Gastos */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  Principais Gargalos de Gastos
                </h4>
                <div className="space-y-2.5">
                  {diagnosis.bottlenecks.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {b.categoria}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              b.impacto === 'Alto'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                : b.impacto === 'Médio'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            Impacto {b.impacto}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{b.motivo}</p>
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-teal-900 dark:text-teal-200 font-medium bg-teal-50/60 dark:bg-teal-950/40 p-2 rounded-lg border border-teal-100 dark:border-teal-900">
                        <ArrowRight className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                        <span>{b.recomendacao}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recomendações Práticas */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Plano de Ação para Economia
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {diagnosis.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                    >
                      <span className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {i + 1}
                      </span>
                      <span className="leading-snug">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0">
          <button
            onClick={handleCopyReport}
            disabled={!diagnosis || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copiar Relatório</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              Reanalisar
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
