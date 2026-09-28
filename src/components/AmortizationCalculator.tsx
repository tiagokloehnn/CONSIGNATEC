import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Calculator,
  Download,
  RotateCcw,
  Sparkles,
  TrendingDown,
  Clock,
  DollarSign,
  ChevronRight,
  Plus,
  Trash2,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ShieldCheck,
  BookmarkPlus,
  Home,
  Car,
  Briefcase,
  Sliders,
  Maximize2,
} from 'lucide-react';
import {
  AmortizationSystem,
  AmortizationStrategy,
  OneTimeExtraPayment,
  AmortizationInput,
  simulateAmortization,
  exportAmortizationToCSV,
  convertAnnualToMonthlyRate,
} from '../utils/amortization';
import { formatBRL } from '../utils/formatters';
import { ThemeToggle } from './ThemeToggle';

interface AmortizationCalculatorProps {
  userName?: string;
  userId?: string;
  isGuest?: boolean;
  onBack: () => void;
}

type TabType = 'overview' | 'comparison' | 'schedule' | 'saved';

interface PresetOption {
  label: string;
  icon: React.ElementType;
  saldo: number;
  prazo: number;
  taxa: number;
  sistema: AmortizationSystem;
  descricao: string;
}

const PRESETS: PresetOption[] = [
  {
    label: 'Imobiliário (Caixa / Bancos)',
    icon: Home,
    saldo: 250000,
    prazo: 360,
    taxa: 9.9,
    sistema: 'SAC',
    descricao: 'Financiamento Habitacional padrão 30 anos (SAC)',
  },
  {
    label: 'Financiamento Veicular',
    icon: Car,
    saldo: 65000,
    prazo: 48,
    taxa: 18.5,
    sistema: 'PRICE',
    descricao: 'Crédito de Automóvel 4 anos em parcelas fixas (Price)',
  },
  {
    label: 'Empréstimo Consignado',
    icon: Briefcase,
    saldo: 35000,
    prazo: 84,
    taxa: 21.4,
    sistema: 'PRICE',
    descricao: 'Consignado público / INSS prazo longo (Price)',
  },
];

export const AmortizationCalculator: React.FC<AmortizationCalculatorProps> = ({
  userName,
  userId,
  isGuest,
  onBack,
}) => {
  // Inputs da Simulação: inicia com dados 100% zerados para novas contas
  const [saldoDevedor, setSaldoDevedor] = useState<number>(0);
  const [prazoMeses, setPrazoMeses] = useState<number>(0);
  const [taxaJurosAnual, setTaxaJurosAnual] = useState<number>(0);
  const [sistema, setSistema] = useState<AmortizationSystem>('SAC');
  const [estrategia, setEstrategia] = useState<AmortizationStrategy>('REDUCE_TERM');
  const [aporteMensal, setAporteMensal] = useState<number>(0);
  const [taxasMensais, setTaxasMensais] = useState<number>(0);

  // Aportes Pontuais
  const [aportesPontuais, setAportesPontuais] = useState<OneTimeExtraPayment[]>([]);

  // Novo aporte form
  const [novoAporteMes, setNovoAporteMes] = useState<number>(12);
  const [novoAporteValor, setNovoAporteValor] = useState<number>(0);
  const [novoAporteDesc, setNovoAporteDesc] = useState<string>('Bônus / FGTS');
  const [isAddingAporte, setIsAddingAporte] = useState<boolean>(false);

  // Navegação de Abas
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Paginação da Tabela
  const [page, setPage] = useState<number>(1);
  const pageSize = 24; // 2 anos por página

  // Salvar Simulações locais (User-scoped or Guest demo)
  const storageKey = userId ? `consignatec_saved_amort_${userId}` : 'consignatec_saved_amort';
  const [savedSimulations, setSavedSimulations] = useState<
    Array<{ id: string; name: string; date: string; input: AmortizationInput }>
  >(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
      return []; // Inicia completamente zerado
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(savedSimulations));
    } catch (e) {
      console.warn('Could not save simulations:', e);
    }
  }, [savedSimulations, storageKey]);

  // Executar simulação reativamente
  const inputData: AmortizationInput = useMemo(
    () => ({
      saldoDevedor: Math.max(0, saldoDevedor),
      prazoMeses: Math.max(0, prazoMeses),
      taxaJurosAnual: Math.max(0, taxaJurosAnual),
      sistema,
      estrategia,
      aporteMensalRecorrente: Math.max(0, aporteMensal),
      aportesPontuais,
      taxasMensaisFixas: Math.max(0, taxasMensais),
    }),
    [saldoDevedor, prazoMeses, taxaJurosAnual, sistema, estrategia, aporteMensal, aportesPontuais, taxasMensais]
  );

  // Simulação Cenário Atual
  const simulation = useMemo(() => simulateAmortization(inputData), [inputData]);

  // Simulação comparativa no modo inverso (se atual é REDUCE_TERM, simula REDUCE_INSTALLMENT para a aba comparador)
  const simulationOpposite = useMemo(() => {
    return simulateAmortization({
      ...inputData,
      estrategia: estrategia === 'REDUCE_TERM' ? 'REDUCE_INSTALLMENT' : 'REDUCE_TERM',
    });
  }, [inputData, estrategia]);

  // Taxa mensal calculada
  const taxaMensalPerc = useMemo(() => {
    return convertAnnualToMonthlyRate(taxaJurosAnual) * 100;
  }, [taxaJurosAnual]);

  // Funções de gerenciamento de aportes pontuais
  const handleAddAportePontual = () => {
    if (novoAporteValor <= 0 || novoAporteMes <= 0) return;
    const novo: OneTimeExtraPayment = {
      id: Date.now().toString(),
      month: novoAporteMes,
      amount: novoAporteValor,
      description: novoAporteDesc.trim() || 'Aporte Extra',
    };
    setAportesPontuais((prev) => [...prev, novo].sort((a, b) => a.month - b.month));
    setIsAddingAporte(false);
  };

  const handleRemoveAporte = (id: string) => {
    setAportesPontuais((prev) => prev.filter((a) => a.id !== id));
  };

  // Carregar Preset
  const handleApplyPreset = (preset: PresetOption) => {
    setSaldoDevedor(preset.saldo);
    setPrazoMeses(preset.prazo);
    setTaxaJurosAnual(preset.taxa);
    setSistema(preset.sistema);
    setPage(1);
  };

  // Download do relatório CSV
  const handleDownloadCSV = () => {
    const csvData = exportAmortizationToCSV(simulation, inputData);
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Consignatec_Amortizacao_${sistema}_${estrategia}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Salvar Simulação
  const handleSaveSimulation = () => {
    const name = prompt(
      'Dê um nome para esta simulação (Ex: "Apto Jardins", "Carro SUV", "Consignado"):',
      `Simulação ${sistema} - ${formatBRL(saldoDevedor)}`
    );
    if (!name) return;

    const newSim = {
      id: Date.now().toString(),
      name,
      date: new Date().toLocaleDateString('pt-BR'),
      input: inputData,
    };

    const updated = [newSim, ...savedSimulations.slice(0, 9)];
    setSavedSimulations(updated);
    try {
      localStorage.setItem('consignatec_saved_amort', JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar no storage:', e);
    }
    alert('Simulação salva com sucesso! Você pode consultá-la na aba "Simulações Salvas".');
  };

  const handleLoadSimulation = (sim: { input: AmortizationInput }) => {
    setSaldoDevedor(sim.input.saldoDevedor);
    setPrazoMeses(sim.input.prazoMeses);
    setTaxaJurosAnual(sim.input.taxaJurosAnual);
    setSistema(sim.input.sistema);
    setEstrategia(sim.input.estrategia);
    setAporteMensal(sim.input.aporteMensalRecorrente);
    setAportesPontuais(sim.input.aportesPontuais || []);
    setTaxasMensais(sim.input.taxasMensaisFixas || 0);
    setActiveTab('overview');
    setPage(1);
  };

  const handleDeleteSaved = (id: string) => {
    const updated = savedSimulations.filter((s) => s.id !== id);
    setSavedSimulations(updated);
    localStorage.setItem('consignatec_saved_amort', JSON.stringify(updated));
  };

  // Redefinir valores para zero absoluto
  const handleReset = () => {
    setSaldoDevedor(0);
    setPrazoMeses(0);
    setTaxaJurosAnual(0);
    setSistema('SAC');
    setEstrategia('REDUCE_TERM');
    setAporteMensal(0);
    setTaxasMensais(0);
    setAportesPontuais([]);
    setSavedSimulations([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setPage(1);
  };

  // Paginação dos registros mês a mês
  const totalPages = Math.ceil(simulation.cronogramaAmortizado.length / pageSize);
  const pagedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return simulation.cronogramaAmortizado.slice(start, start + pageSize);
  }, [simulation.cronogramaAmortizado, page]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-teal-500 selection:text-white flex flex-col transition-colors duration-200">
      {/* Top Header Corporativo */}
      <header className="bg-white/95 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Voltar para Central de Ferramentas"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-800 dark:bg-teal-700 text-white flex items-center justify-center shadow-xs">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                  Calculadora de Amortização
                  <span className="hidden md:inline-block text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-full">
                    SAC & Price
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Simulador de antecipação de parcelas e economia de juros da Consignatec
                </p>
              </div>
            </div>
          </div>

          {/* Ações Rápidas no Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveSimulation}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 rounded-lg transition-colors cursor-pointer"
              title="Salvar esta simulação"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salvar</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Baixar planilha CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Redefinir campos"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <ThemeToggle showLabel={false} />
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {/* Presets Rápidos */}
        <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              Modelos Prontos de Financiamento
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Clique para preencher automaticamente</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isSelected =
                saldoDevedor === preset.saldo &&
                prazoMeses === preset.prazo &&
                sistema === preset.sistema;
              return (
                <button
                  key={preset.label}
                  onClick={() => handleApplyPreset(preset)}
                  className={`text-left p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'border-teal-700 dark:border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-slate-50/40 dark:bg-slate-800/20'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-teal-800 dark:bg-teal-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{preset.label}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{preset.descricao}</p>
                    <p className="text-[10px] font-semibold text-teal-800 dark:text-teal-400 mt-0.5">
                      {formatBRL(preset.saldo)} · {preset.prazo}m ({preset.sistema})
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout Grid: Painel de Inputs (Esq) vs Painel de Resultados (Dir) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ======================================================== */}
          {/* COLUNA ESQUERDA: PARÂMETROS E APORTES (4 colunas desktop) */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 space-y-5">
            {/* Card de Configuração Básica */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>Dados do Contrato</span>
                <Sliders className="w-4 h-4 text-slate-400" />
              </h2>

              {/* Saldo Devedor */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Saldo Devedor Atual</label>
                  <span className="text-xs font-bold text-teal-900 dark:text-teal-300">{formatBRL(saldoDevedor)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1500000}
                  step={5000}
                  value={saldoDevedor}
                  onChange={(e) => setSaldoDevedor(Number(e.target.value))}
                  className="w-full accent-teal-800 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2"
                />
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">R$</span>
                  <input
                    type="number"
                    value={saldoDevedor || ''}
                    onChange={(e) => setSaldoDevedor(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white dark:focus:bg-slate-850"
                  />
                </div>
              </div>

              {/* Prazo Restante em Meses */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Prazo Restante</label>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {prazoMeses} meses ({(prazoMeses / 12).toFixed(1)} anos)
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={420}
                  step={6}
                  value={prazoMeses}
                  onChange={(e) => setPrazoMeses(Number(e.target.value))}
                  className="w-full accent-teal-800 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2"
                />
                <div className="grid grid-cols-4 gap-1.5">
                  {[60, 120, 240, 360].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPrazoMeses(m)}
                      className={`text-[11px] py-1 font-medium rounded border transition-colors cursor-pointer ${
                        prazoMeses === m
                          ? 'bg-teal-800 text-white border-teal-800'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      {m / 12} anos
                    </button>
                  ))}
                </div>
              </div>

              {/* Taxa de Juros Anual */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Taxa de Juros Anual</label>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {taxaJurosAnual.toFixed(2)}% a.a.{' '}
                    <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                      (~{taxaMensalPerc.toFixed(2)}% a.m.)
                    </span>
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={35}
                  step={0.1}
                  value={taxaJurosAnual}
                  onChange={(e) => setTaxaJurosAnual(Number(e.target.value))}
                  className="w-full accent-teal-800 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2"
                />
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={taxaJurosAnual || ''}
                    onChange={(e) => setTaxaJurosAnual(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white dark:focus:bg-slate-850"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">% a.a.</span>
                </div>
              </div>

              {/* Sistema de Amortização: SAC vs PRICE */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Sistema de Amortização
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSistema('SAC')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      sistema === 'SAC'
                        ? 'border-teal-700 dark:border-teal-500 bg-teal-50/60 dark:bg-teal-950/50 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-slate-50/40 dark:bg-slate-800/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">SAC</span>
                      {sistema === 'SAC' && <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Parcelas decrescentes (Constante)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSistema('PRICE')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      sistema === 'PRICE'
                        ? 'border-teal-700 dark:border-teal-500 bg-teal-50/60 dark:bg-teal-950/50 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-slate-50/40 dark:bg-slate-800/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Tabela Price</span>
                      {sistema === 'PRICE' && <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Parcelas fixas (Sistema Francês)</p>
                  </button>
                </div>
              </div>

              {/* Taxas mensais fixas / seguros MIP/DFI */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Taxas e Seguros Mensais (MIP/DFI)</label>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formatBRL(taxasMensais)}/mês</span>
                </div>
                <input
                  type="number"
                  value={taxasMensais || ''}
                  onChange={(e) => setTaxasMensais(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white dark:focus:bg-slate-850"
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Card de Configuração de Amortização Extraordinária */}
            <div className="bg-white dark:bg-slate-900 border border-teal-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-teal-100 dark:border-slate-800">
                <h2 className="text-sm font-bold text-teal-950 dark:text-white flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  Estratégia de Amortização
                </h2>
                <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  Economia
                </span>
              </div>

              {/* Estratégia: Redução de Prazo vs Redução de Parcela */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Como aplicar a amortização extra?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEstrategia('REDUCE_TERM')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      estrategia === 'REDUCE_TERM'
                        ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-slate-50/40 dark:bg-slate-800/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Reduzir Prazo</span>
                      {estrategia === 'REDUCE_TERM' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-medium mt-0.5">
                      ⭐ Maior economia em juros
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEstrategia('REDUCE_INSTALLMENT')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      estrategia === 'REDUCE_INSTALLMENT'
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-slate-50/40 dark:bg-slate-800/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Reduzir Parcela</span>
                      {estrategia === 'REDUCE_INSTALLMENT' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-indigo-800 dark:text-indigo-400 font-medium mt-0.5">
                      Alívio no fluxo de caixa
                    </p>
                  </button>
                </div>
              </div>

              {/* Aporte Mensal Recorrente */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Aporte Extra Todo Mês
                  </label>
                  <span className="text-xs font-bold text-teal-800 dark:text-teal-300">{formatBRL(aporteMensal)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10000}
                  step={100}
                  value={aporteMensal}
                  onChange={(e) => setAporteMensal(Number(e.target.value))}
                  className="w-full accent-teal-800 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2"
                />
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-medium">R$</span>
                  <input
                    type="number"
                    step="50"
                    value={aporteMensal || ''}
                    onChange={(e) => setAporteMensal(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white dark:focus:bg-slate-850"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Ex: sobra do salário mensal para antecipar prestações.
                </p>
              </div>

              {/* Aportes Pontuais (FGTS, 13º, Bônus) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    Aportes Pontuais
                    <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                      ({aportesPontuais.length})
                    </span>
                  </label>
                  {!isAddingAporte && (
                    <button
                      type="button"
                      onClick={() => setIsAddingAporte(true)}
                      className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-200 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Adicionar
                    </button>
                  )}
                </div>

                {/* Formulário de inclusão de aporte pontual */}
                {isAddingAporte && (
                  <div className="p-3 bg-teal-50/50 dark:bg-slate-800 border border-teal-200 dark:border-slate-700 rounded-lg mb-3 space-y-2.5">
                    <p className="text-[11px] font-bold text-teal-900 dark:text-teal-300">Novo Aporte Extraordinário</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-medium text-slate-600 dark:text-slate-400 block mb-0.5">
                          Mês do Aporte
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={prazoMeses}
                          value={novoAporteMes}
                          onChange={(e) => setNovoAporteMes(Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-850 text-slate-900 dark:text-white"
                          placeholder="Mês (ex: 12)"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-600 dark:text-slate-400 block mb-0.5">
                          Valor (R$)
                        </label>
                        <input
                          type="number"
                          step="500"
                          value={novoAporteValor}
                          onChange={(e) => setNovoAporteValor(Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-850 text-slate-900 dark:text-white"
                          placeholder="10000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-600 dark:text-slate-400 block mb-0.5">
                        Descrição / Origem
                      </label>
                      <input
                        type="text"
                        value={novoAporteDesc}
                        onChange={(e) => setNovoAporteDesc(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-850 text-slate-900 dark:text-white"
                        placeholder="Ex: FGTS, 13º Salário, Restituição IR"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingAporte(false)}
                        className="px-2.5 py-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddAportePontual}
                        className="px-3 py-1 text-[11px] font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded cursor-pointer"
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de Aportes já adicionados */}
                {aportesPontuais.length === 0 ? (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">Nenhum aporte pontual adicionado.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {aportesPontuais.map((ap) => (
                      <div
                        key={ap.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatBRL(ap.amount)}
                            <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 ml-1.5">
                              (Mês {ap.month})
                            </span>
                          </p>
                          <p className="text-[10px] text-teal-800 dark:text-teal-400 font-medium">{ap.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAporte(ap.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remover aporte"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* COLUNA DIREITA: RESULTADOS E ABAS (8 colunas desktop)     */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* HERO CARDS: Métricas de Alto Impacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Card 1: Economia de Juros */}
              <div className="bg-linear-to-br from-emerald-900 to-teal-950 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-emerald-800/40 relative overflow-hidden">
                <div className="absolute right-[-10px] bottom-[-10px] text-emerald-800/20 pointer-events-none">
                  <DollarSign className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                  <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block mb-1">
                    Economia Total em Juros
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                    {formatBRL(simulation.comparativo.economiaJuros)}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-200 font-medium">
                    <span className="bg-emerald-800/80 px-1.5 py-0.5 rounded text-[11px] font-bold">
                      -{simulation.comparativo.percentualEconomiaJuros.toFixed(1)}%
                    </span>
                    <span>a menos de juros pagos ao banco</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Tempo Antecipado */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs relative overflow-hidden">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Tempo Eliminado do Contrato
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {simulation.comparativo.mesesEconomizados}{' '}
                  <span className="text-base font-semibold text-slate-600 dark:text-slate-400">meses</span>
                </div>
                <div className="mt-2 text-xs font-semibold text-teal-800 dark:text-teal-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {simulation.comparativo.anosEconomizados > 0 ? (
                    <span>
                      {simulation.comparativo.anosEconomizados} anos e{' '}
                      {simulation.comparativo.mesesRestantes} meses a menos!
                    </span>
                  ) : (
                    <span>{simulation.comparativo.mesesEconomizados} meses adiantados!</span>
                  )}
                </div>
              </div>

              {/* Card 3: Multiplicador de Retorno (ROI) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs relative overflow-hidden sm:col-span-2 lg:col-span-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Eficiência de Cada R$ 1 Aportado
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  R$ {(1 + simulation.comparativo.multiplicadorRetorno).toFixed(2)}
                </div>
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Cada R$ 1,00 extra amortizado poupa{' '}
                  <strong className="text-emerald-700 dark:text-emerald-400">
                    R$ {simulation.comparativo.multiplicadorRetorno.toFixed(2)}
                  </strong>{' '}
                  em juros futuros.
                </div>
              </div>
            </div>

            {/* Barra de Abas */}
            <div className="border-b border-slate-200 dark:border-slate-800 flex gap-2 sm:gap-6 overflow-x-auto pb-px">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'overview'
                    ? 'border-teal-800 dark:border-teal-400 text-teal-900 dark:text-teal-300'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                Visão Geral & Gráficos
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('comparison')}
                className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'comparison'
                    ? 'border-teal-800 dark:border-teal-400 text-teal-900 dark:text-teal-300'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                Comparador: Prazo vs. Parcela
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'schedule'
                    ? 'border-teal-800 dark:border-teal-400 text-teal-900 dark:text-teal-300'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Tabela Mês a Mês
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('saved')}
                className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'saved'
                    ? 'border-teal-800 dark:border-teal-400 text-teal-900 dark:text-teal-300'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <BookmarkPlus className="w-4 h-4" />
                Simulações Salvas ({savedSimulations.length})
              </button>
            </div>

            {/* ======================================================== */}
            {/* ABA 1: VISÃO GERAL & GRÁFICOS */}
            {/* ======================================================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Comparação dos Valores Totais (Com vs Sem Amortização) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                    Comparativo Financeiro Direto
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Cenário Original */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Contrato Original</span>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                          Sem Amortização
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-slate-500 dark:text-slate-400">Prazo Previsto:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {simulation.cenarioOriginal.prazoMeses} meses (
                            {(simulation.cenarioOriginal.prazoMeses / 12).toFixed(1)} anos)
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-slate-500 dark:text-slate-400">Total em Juros:</span>
                          <span className="font-bold text-rose-700 dark:text-rose-400">
                            {formatBRL(simulation.cenarioOriginal.totalJuros)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-slate-500 dark:text-slate-400">1ª Parcela:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatBRL(simulation.cenarioOriginal.primeiraParcela)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-700 dark:text-slate-300 font-bold">Custo Total Final:</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {formatBRL(simulation.cenarioOriginal.totalPago)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cenário Com Amortização */}
                    <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Com Antecipação</span>
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                          {estrategia === 'REDUCE_TERM' ? 'Reduzindo Prazo' : 'Reduzindo Parcela'}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between py-1 border-b border-emerald-200/60 dark:border-emerald-800/60">
                          <span className="text-slate-600 dark:text-slate-400">Prazo Efetivo:</span>
                          <span className="font-bold text-emerald-900 dark:text-emerald-300">
                            {simulation.cenarioAmortizado.prazoMesesReal} meses (
                            {(simulation.cenarioAmortizado.prazoMesesReal / 12).toFixed(1)} anos)
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-emerald-200/60 dark:border-emerald-800/60">
                          <span className="text-slate-600 dark:text-slate-400">Total em Juros:</span>
                          <span className="font-bold text-emerald-800 dark:text-emerald-400">
                            {formatBRL(simulation.cenarioAmortizado.totalJuros)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-emerald-200/60 dark:border-emerald-800/60">
                          <span className="text-slate-600 dark:text-slate-400">Total Aportado Extra:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatBRL(simulation.cenarioAmortizado.totalAmortizacaoExtra)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-emerald-950 dark:text-emerald-200 font-bold">Custo Total Final:</span>
                          <span className="font-extrabold text-emerald-900 dark:text-emerald-300">
                            {formatBRL(simulation.cenarioAmortizado.totalPago)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gráfico Visual de Evolução do Saldo Devedor (SVG Puro Responsivo) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Curva de Queda do Saldo Devedor
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Veja visualmente a rapidez com que a dívida chega a zero com suas amortizações
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-1 bg-slate-300 dark:bg-slate-600 rounded" />
                        <span className="text-slate-600 dark:text-slate-400">Original</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-1.5 bg-emerald-600 dark:bg-emerald-400 rounded" />
                        <span className="font-semibold text-emerald-900 dark:text-emerald-300">Com Amortização</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Chart */}
                  <div className="w-full h-56 relative border-b border-l border-slate-200 dark:border-slate-800 mt-2">
                    <svg
                      className="w-full h-full overflow-visible"
                      viewBox={`0 0 ${Math.max(100, simulation.cenarioOriginal.prazoMeses)} 100`}
                      preserveAspectRatio="none"
                    >
                      {/* Curva Original */}
                      <path
                        d={`M 0 0 ${simulation.cronogramaOriginal
                          .filter((_, idx) => idx % Math.max(1, Math.floor(simulation.cronogramaOriginal.length / 50)) === 0 || idx === simulation.cronogramaOriginal.length - 1)
                          .map((rec) => {
                            const x = rec.mes;
                            const y = 100 - (rec.saldoFinal / saldoDevedor) * 100;
                            return `L ${x} ${Math.min(100, Math.max(0, y))}`;
                          })
                          .join(' ')}`}
                        fill="none"
                        stroke="#94A3B8"
                        strokeWidth="1.8"
                        strokeDasharray="2,2"
                      />

                      {/* Área Preenchida da Curva Amortizada */}
                      <path
                        d={`M 0 0 ${simulation.cronogramaAmortizado
                          .filter((_, idx) => idx % Math.max(1, Math.floor(simulation.cronogramaAmortizado.length / 50)) === 0 || idx === simulation.cronogramaAmortizado.length - 1)
                          .map((rec) => {
                            const x = rec.mes;
                            const y = 100 - (rec.saldoFinal / saldoDevedor) * 100;
                            return `L ${x} ${Math.min(100, Math.max(0, y))}`;
                          })
                          .join(' ')} L ${simulation.cenarioAmortizado.prazoMesesReal} 100 L 0 100 Z`}
                        fill="rgba(16, 185, 129, 0.12)"
                      />

                      {/* Linha Forte da Curva Amortizada */}
                      <path
                        d={`M 0 0 ${simulation.cronogramaAmortizado
                          .filter((_, idx) => idx % Math.max(1, Math.floor(simulation.cronogramaAmortizado.length / 50)) === 0 || idx === simulation.cronogramaAmortizado.length - 1)
                          .map((rec) => {
                            const x = rec.mes;
                            const y = 100 - (rec.saldoFinal / saldoDevedor) * 100;
                            return `L ${x} ${Math.min(100, Math.max(0, y))}`;
                          })
                          .join(' ')}`}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2.5"
                      />
                    </svg>

                    {/* Labels de Eixo */}
                    <div className="absolute left-0 bottom-[-22px] text-[10px] text-slate-400 dark:text-slate-500">Mês 0</div>
                    <div className="absolute right-0 bottom-[-22px] text-[10px] text-slate-400 dark:text-slate-500">
                      Mês {simulation.cenarioOriginal.prazoMeses}
                    </div>
                  </div>

                  {/* Legenda explicativa */}
                  <div className="mt-8 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
                    <p>
                      Dívida quitada no <strong className="text-slate-800 dark:text-slate-200">Mês {simulation.cenarioAmortizado.prazoMesesReal}</strong> em
                      vez do Mês {simulation.cenarioOriginal.prazoMeses}.
                    </p>
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded">
                      🎉 {simulation.comparativo.mesesEconomizados} meses adiantados
                    </span>
                  </div>
                </div>

                {/* Dicas Estratégicas de Financiamento */}
                <div className="bg-slate-900 dark:bg-slate-850 text-white rounded-xl p-5 shadow-xs border border-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-teal-400" />
                    <h4 className="text-sm font-bold text-white">
                      Guia Estratégico Consignatec de Amortização
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                    <div className="space-y-1.5">
                      <p className="font-semibold text-teal-200">
                        1. Por que a Redução de Prazo economiza tanto?
                      </p>
                      <p className="leading-relaxed text-slate-400">
                        Ao reduzir o prazo, o dinheiro do aporte abate diretamente o saldo principal da dívida,
                        eliminando integralmente todos os juros que incidiriam sobre aquele montante ao longo
                        de anos futuros.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="font-semibold text-teal-200">
                        2. Uso inteligente do FGTS
                      </p>
                      <p className="leading-relaxed text-slate-400">
                        Em financiamentos imobiliários pelo SFH, você pode usar seu FGTS a cada 2 anos para
                        amortizar o saldo devedor. Como o FGTS rende pouco, usá-lo para abater juros de 9% a 12%
                        a.a. é matematicamente muito vantajoso.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* ABA 2: COMPARADOR LADO A LADO (PRAZO vs PARCELA)        */}
            {/* ======================================================== */}
            {activeTab === 'comparison' && (
              <div className="space-y-5">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    Comparação de Decisão: Reduzir Prazo vs. Reduzir Parcela
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                    Entenda o que acontece aplicando exatamente os mesmos aportes em cada uma das opções
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Cenário Original */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                          Cenário 1
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Original (Sem Aportes)</h4>
                        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                          <div>
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500">Total Pago:</span>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {formatBRL(simulation.cenarioOriginal.totalPago)}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500">Total Juros:</span>
                            <span className="font-semibold text-rose-700 dark:text-rose-400">
                              {formatBRL(simulation.cenarioOriginal.totalJuros)}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500">Prazo:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {simulation.cenarioOriginal.prazoMeses} meses (
                              {(simulation.cenarioOriginal.prazoMeses / 12).toFixed(1)} anos)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                        Linha base do seu contrato atual.
                      </div>
                    </div>

                    {/* Cenário Redução de Prazo */}
                    <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                            Cenário 2
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 px-1.5 py-0.5 rounded">
                            Recomendado
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200 mb-2">Redução de Prazo</h4>
                        <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                          <div>
                            <span className="block text-[10px] text-emerald-800 dark:text-emerald-400">Total Pago:</span>
                            <span className="font-bold text-emerald-950 dark:text-white text-sm">
                              {formatBRL(
                                estrategia === 'REDUCE_TERM'
                                  ? simulation.cenarioAmortizado.totalPago
                                  : simulationOpposite.cenarioAmortizado.totalPago
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-emerald-800 dark:text-emerald-400">Economia em Juros:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-300">
                              {formatBRL(
                                estrategia === 'REDUCE_TERM'
                                  ? simulation.comparativo.economiaJuros
                                  : simulationOpposite.comparativo.economiaJuros
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-emerald-800 dark:text-emerald-400">Novo Prazo:</span>
                            <span className="font-bold text-emerald-900 dark:text-emerald-200">
                              {estrategia === 'REDUCE_TERM'
                                ? simulation.cenarioAmortizado.prazoMesesReal
                                : simulationOpposite.cenarioAmortizado.prazoMesesReal}{' '}
                              meses
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-800/80 text-[11px] text-emerald-900 dark:text-emerald-300 font-medium">
                        Ideal para quem quer se livrar logo da dívida e poupar a máxima quantia de juros.
                      </div>
                    </div>

                    {/* Cenário Redução de Parcela */}
                    <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider block mb-1">
                          Cenário 3
                        </span>
                        <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 mb-2">Redução de Parcela</h4>
                        <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                          <div>
                            <span className="block text-[10px] text-indigo-800 dark:text-indigo-400">Total Pago:</span>
                            <span className="font-bold text-indigo-950 dark:text-white text-sm">
                              {formatBRL(
                                estrategia === 'REDUCE_INSTALLMENT'
                                  ? simulation.cenarioAmortizado.totalPago
                                  : simulationOpposite.cenarioAmortizado.totalPago
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-indigo-800 dark:text-indigo-400">Economia em Juros:</span>
                            <span className="font-bold text-indigo-700 dark:text-indigo-300">
                              {formatBRL(
                                estrategia === 'REDUCE_INSTALLMENT'
                                  ? simulation.comparativo.economiaJuros
                                  : simulationOpposite.comparativo.economiaJuros
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-indigo-800 dark:text-indigo-400">Parcela Recalculada:</span>
                            <span className="font-bold text-indigo-900 dark:text-indigo-200">
                              {formatBRL(
                                (estrategia === 'REDUCE_INSTALLMENT'
                                  ? simulation.cronogramaAmortizado[1]?.parcelaOrdinaria
                                  : simulationOpposite.cronogramaAmortizado[1]?.parcelaOrdinaria) || 0
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-indigo-200 dark:border-indigo-800/80 text-[11px] text-indigo-900 dark:text-indigo-300 font-medium">
                        Ideal para quem está com o orçamento mensal apertado e precisa de fôlego no mês.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* ABA 3: CRONOGRAMA COMPLETO MÊS A MÊS                     */}
            {/* ======================================================== */}
            {activeTab === 'schedule' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cronograma Detalhado da Dívida</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Exibindo meses {(page - 1) * pageSize + 1} a{' '}
                      {Math.min(page * pageSize, simulation.cronogramaAmortizado.length)} de{' '}
                      {simulation.cronogramaAmortizado.length}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadCSV}
                      className="px-3 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-300 bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-slate-700 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar Planilha Completa
                    </button>
                  </div>
                </div>

                {/* Tabela Responsiva */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Mês</th>
                        <th className="py-2.5 px-3">Saldo Inicial</th>
                        <th className="py-2.5 px-3">Amortização</th>
                        <th className="py-2.5 px-3 text-emerald-800 dark:text-emerald-400">Aporte Extra</th>
                        <th className="py-2.5 px-3">Juros</th>
                        <th className="py-2.5 px-3">Parcela Paga</th>
                        <th className="py-2.5 px-3">Saldo Final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {pagedRecords.map((row) => {
                        const hasExtra = row.amortizacaoExtra > 0;
                        return (
                          <tr
                            key={row.mes}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                              hasExtra ? 'bg-emerald-50/30 dark:bg-emerald-950/20 font-medium' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                              {row.mes}º
                              {row.detalheAporte && (
                                <span className="block text-[9px] font-normal text-emerald-700 dark:text-emerald-400">
                                  {row.detalheAporte}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{formatBRL(row.saldoInicial)}</td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                              {formatBRL(row.amortizacaoOrdinaria)}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-emerald-700 dark:text-emerald-400">
                              {hasExtra ? formatBRL(row.amortizacaoExtra) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-rose-700 dark:text-rose-400">{formatBRL(row.juros)}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                              {formatBRL(row.parcelaTotalPaga)}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {formatBRL(row.saldoFinal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      Anterior
                    </button>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Página {page} de {totalPages}
                    </span>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* ABA 4: SIMULAÇÕES SALVAS                                 */}
            {/* ======================================================== */}
            {activeTab === 'saved' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Minhas Simulações Salvas</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Consulte ou compare diferentes contratos salvos neste dispositivo
                    </p>
                  </div>
                  <button
                    onClick={handleSaveSimulation}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Salvar Simulação Atual
                  </button>
                </div>

                {savedSimulations.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                    <BookmarkPlus className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium">Você ainda não salvou nenhuma simulação.</p>
                    <p className="text-[11px]">
                      Configure os valores acima e clique em &quot;Salvar&quot; no topo para manter seu histórico.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedSimulations.map((sim) => (
                      <div
                        key={sim.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 bg-slate-50/70 dark:bg-slate-800/40 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{sim.name}</h4>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{sim.date}</span>
                          </div>
                          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                            <p>
                              Saldo:{' '}
                              <strong className="text-slate-900 dark:text-white">
                                {formatBRL(sim.input.saldoDevedor)}
                              </strong>{' '}
                              · {sim.input.prazoMeses}m ({sim.input.sistema})
                            </p>
                            <p>
                              Aporte:{' '}
                              <strong className="text-emerald-700 dark:text-emerald-400">
                                {formatBRL(sim.input.aporteMensalRecorrente)}/mês
                              </strong>
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleLoadSimulation(sim)}
                            className="text-xs font-bold text-teal-800 dark:text-teal-400 hover:text-teal-950 dark:hover:text-teal-200 flex items-center gap-1 cursor-pointer"
                          >
                            Carregar Simulação
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSaved(sim.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Excluir simulação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
