import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Search,
  ExternalLink,
  Sparkles,
  Star,
  Download,
  ArrowLeft,
  PieChart,
  BarChart3,
  Calendar,
  Layers,
  ShieldCheck,
  Zap,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle2,
  RefreshCw,
  Wallet,
  Globe2,
  Building2,
  ArrowUpRight,
  Calculator,
  X,
  Minimize2,
  Maximize2,
  PlusCircle,
  Clock,
  Trash2,
} from 'lucide-react';
import {
  StockItem,
  MarketType,
  ChartPeriod,
  PricePoint,
  SimulatorStrategy,
  SimulationResult,
  UserPortfolioItem,
} from '../types/stocks';
import { ThemeToggle } from './ThemeToggle';
import {
  INITIAL_STOCKS,
  getSavedStocks,
  getWatchlist,
  toggleWatchlistTicker,
  calculateInvestmentSimulation,
  fetchStockAIAnalysis,
  exportStocksToCSV,
  analyzeAnyStock,
  QUICK_SUGGESTION_TICKERS,
  getUserPortfolio,
  addUserPortfolioItem,
  removeUserPortfolioItem,
  wipeAllStockServiceData,
} from '../services/stockService';

interface StockRecommendationsProps {
  userName?: string;
  userId?: string;
  isGuest?: boolean;
  onBack: () => void;
}

export const StockRecommendations: React.FC<StockRecommendationsProps> = ({
  userName,
  userId,
  isGuest,
  onBack,
}) => {
  const [stocks, setStocks] = useState<StockItem[]>(() => getSavedStocks(userId, isGuest));
  const [watchlist, setWatchlist] = useState<string[]>(() => getWatchlist(userId, isGuest));
  const [userPortfolio, setUserPortfolio] = useState<UserPortfolioItem[]>(() => getUserPortfolio(userId, isGuest));
  const [selectedStockTicker, setSelectedStockTicker] = useState<string>('BBAS3');
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>('1M');
  const [activeTab, setActiveTab] = useState<'explore' | 'portfolio' | 'watchlist' | 'analyze' | 'all'>('explore');
  const [marketFilter, setMarketFilter] = useState<'ALL' | MarketType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'upside' | 'dy' | 'pe'>('score');
  const [hoveredPoint, setHoveredPoint] = useState<PricePoint | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Analysis visibility controls (prevents stock from being permanently stuck at top)
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isAnalysisMinimized, setIsAnalysisMinimized] = useState(false);

  // Universal custom ticker search state
  const [tickerSearchInput, setTickerSearchInput] = useState('');
  const [isSearchingTicker, setIsSearchingTicker] = useState(false);
  const [tickerSearchError, setTickerSearchError] = useState<string | null>(null);

  // Portfolio Modal State - Inicia com valores zerados
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [portTicker, setPortTicker] = useState('BBAS3');
  const [portShares, setPortShares] = useState<number>(0);
  const [portAvgPrice, setPortAvgPrice] = useState<number>(0);

  // Simulator State - Inicia com orçamento zerado
  const [simBudget, setSimBudget] = useState<number>(0);
  const [simCurrency, setSimCurrency] = useState<'BRL' | 'USD'>('BRL');
  const [simStrategy, setSimStrategy] = useState<SimulatorStrategy>('top10');

  const handleWipePortfolioAndWatchlist = () => {
    wipeAllStockServiceData(userId);
    setUserPortfolio([]);
    setWatchlist([]);
  };

  // Currently selected stock
  const selectedStock = useMemo(() => {
    return stocks.find((s) => s.ticker === selectedStockTicker) || stocks[0];
  }, [stocks, selectedStockTicker]);

  // Top 10 Stocks
  const top10Stocks = useMemo(() => {
    return [...stocks]
      .filter((s) => s.isTop10 || s.score >= 88)
      .sort((a, b) => (a.top10Rank || 99) - (b.top10Rank || 99))
      .slice(0, 10);
  }, [stocks]);

  // Filtered & Sorted Stocks for "all" tab
  const displayedStocks = useMemo(() => {
    return stocks
      .filter((s) => {
        if (marketFilter !== 'ALL' && s.market !== marketFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            s.ticker.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q) ||
            s.sector.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'upside') return b.upsidePercent - a.upsidePercent;
        if (sortBy === 'dy') return b.dividendYield - a.dividendYield;
        if (sortBy === 'pe') return a.peRatio - b.peRatio;
        return b.score - a.score;
      });
  }, [stocks, marketFilter, searchQuery, sortBy]);

  // Watchlist items
  const watchlistStocks = useMemo(() => {
    return stocks.filter((s) => watchlist.includes(s.ticker));
  }, [stocks, watchlist]);

  // Simulation result
  const simulationResult: SimulationResult = useMemo(() => {
    return calculateInvestmentSimulation(simBudget, simCurrency, simStrategy, stocks);
  }, [simBudget, simCurrency, simStrategy, stocks]);

  // Toggle watchlist
  const handleToggleWatchlist = (ticker: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = toggleWatchlistTicker(userId, ticker);
    setWatchlist(updated);
  };

  // Trigger Gemini AI stock analysis
  const handleGenerateAIThesis = async () => {
    if (!selectedStock) return;
    setIsAiLoading(true);
    try {
      const updatedThesis = await fetchStockAIAnalysis(selectedStock);
      setStocks((prev) =>
        prev.map((s) => (s.ticker === selectedStock.ticker ? { ...s, thesis: updatedThesis } : s))
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  // Open stock analysis panel smoothly without locking the screen
  const handleOpenStockAnalysis = (ticker: string) => {
    setSelectedStockTicker(ticker);
    setIsAnalysisOpen(true);
    setIsAnalysisMinimized(false);
  };

  // Universal ticker analyzer (works with ANY stock from B3 or US)
  const handleAnalyzeCustomTicker = async (tickerToAnalyze?: string) => {
    const raw = (tickerToAnalyze || tickerSearchInput).trim();
    if (!raw) return;
    setIsSearchingTicker(true);
    setTickerSearchError(null);
    try {
      const analyzed = await analyzeAnyStock(raw, userId, isGuest);
      setStocks((prev) => {
        const exists = prev.some((s) => s.ticker === analyzed.ticker);
        return exists
          ? prev.map((s) => (s.ticker === analyzed.ticker ? analyzed : s))
          : [analyzed, ...prev];
      });
      setSelectedStockTicker(analyzed.ticker);
      setIsAnalysisOpen(true);
      setIsAnalysisMinimized(false);
      setTickerSearchInput('');
      setActiveTab('analyze');
    } catch (err: any) {
      setTickerSearchError(err?.message || 'Não foi possível analisar este ativo.');
    } finally {
      setIsSearchingTicker(false);
    }
  };

  // Price history points for the selected period
  const historyPoints = useMemo(() => {
    return selectedStock?.history?.[selectedPeriod] || [];
  }, [selectedStock, selectedPeriod]);

  // Calculate SVG Chart coordinates
  const chartData = useMemo(() => {
    if (historyPoints.length === 0) return { path: '', area: '', min: 0, max: 0, points: [] };
    const prices = historyPoints.map((p) => p.price);
    const min = Math.min(...prices) * 0.99;
    const max = Math.max(...prices) * 1.01;
    const range = max - min || 1;

    const width = 800;
    const height = 260;
    const paddingBottom = 25;
    const paddingTop = 20;
    const chartHeight = height - paddingTop - paddingBottom;

    const coords = historyPoints.map((p, i) => {
      const x = (i / (historyPoints.length - 1)) * (width - 40) + 20;
      const y = paddingTop + (1 - (p.price - min) / range) * chartHeight;
      return { x, y, point: p };
    });

    const path = coords.reduce((acc, c, i) => {
      if (i === 0) return `M ${c.x} ${c.y}`;
      // Smooth cubic bezier
      const prev = coords[i - 1];
      const cpX = (prev.x + c.x) / 2;
      return `${acc} C ${cpX} ${prev.y}, ${cpX} ${c.y}, ${c.x} ${c.y}`;
    }, '');

    const area = `${path} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

    const isPositive =
      historyPoints[historyPoints.length - 1].price >= historyPoints[0].price;

    return { path, area, min, max, coords, isPositive };
  }, [historyPoints]);

  const renderStockAnalysisCard = (showCloseButton = false) => {
    if (!selectedStock) return null;

    if (isAnalysisMinimized) {
      return (
        <div className="mb-6 bg-white dark:bg-slate-900 border border-teal-500/30 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-900/60 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center font-bold text-teal-800 dark:text-white text-sm">
              {selectedStock.ticker.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-base">{selectedStock.ticker}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">&bull; {selectedStock.name}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                    selectedStock.market === 'B3'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30'
                  }`}
                >
                  {selectedStock.market === 'B3' ? '🇧🇷 B3' : '🇺🇸 EUA'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs mt-0.5">
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedStock.currency === 'BRL' ? 'R$ ' : '$ '}
                  {selectedStock.price.toFixed(2)}
                </span>
                <span
                  className={`font-semibold ${
                    selectedStock.changePercent >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                  }`}
                >
                  {selectedStock.changePercent >= 0 ? '+' : ''}
                  {selectedStock.changePercent.toFixed(2)}%
                </span>
                <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Score: <strong className="text-teal-600 dark:text-teal-300">{selectedStock.score}/100</strong>
                </span>
                <span className="text-slate-500 dark:text-slate-400 hidden md:inline">
                  Alvo:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {selectedStock.currency === 'BRL' ? 'R$ ' : '$ '}
                    {selectedStock.targetPrice.toFixed(2)} (+{selectedStock.upsidePercent.toFixed(1)}%)
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={selectedStock.googleFinanceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Globe2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span className="hidden sm:inline">Google Finance</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>
            <button
              type="button"
              onClick={() => setIsAnalysisMinimized(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold cursor-pointer transition-all"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Expandir Raio-X</span>
            </button>
            {showCloseButton && (
              <button
                type="button"
                onClick={() => setIsAnalysisOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-rose-700 dark:hover:text-rose-300 text-slate-500 dark:text-slate-400 text-xs transition-colors cursor-pointer"
                title="Fechar Análise"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="mb-8 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm transition-colors">
        {/* Stock Header & Live Price */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-50 to-slate-100 dark:from-teal-900/70 dark:to-slate-800 border border-teal-200 dark:border-teal-500/20 flex items-center justify-center font-bold text-teal-900 dark:text-white text-base shadow-sm">
              {selectedStock.ticker.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {selectedStock.ticker}
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  &bull; {selectedStock.name}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                    selectedStock.market === 'B3'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                  }`}
                >
                  {selectedStock.market === 'B3' ? '🇧🇷 B3 Brasil' : '🇺🇸 EUA / ' + selectedStock.exchange}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleToggleWatchlist(selectedStock.ticker, e)}
                  title="Salvar na Watchlist"
                  className="text-slate-500 hover:text-amber-400 transition-colors p-1"
                >
                  <Star
                    className={`h-4 w-4 ${
                      watchlist.includes(selectedStock.ticker)
                        ? 'text-amber-400 fill-amber-400'
                        : ''
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedStock.sector} &bull; Cap: {selectedStock.marketCap}
              </p>
            </div>
          </div>

          {/* Price & Signal Badges + Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {selectedStock.currency === 'BRL' ? 'R$ ' : '$ '}
                {selectedStock.price.toFixed(2)}
              </div>
              <div
                className={`text-xs font-bold inline-flex items-center gap-1 ${
                  selectedStock.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {selectedStock.changePercent >= 0 ? '+' : ''}
                {selectedStock.change.toFixed(2)} ({selectedStock.changePercent >= 0 ? '+' : ''}
                {selectedStock.changePercent.toFixed(2)}%)
                {selectedStock.changePercent >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
              </div>
            </div>

            <div className="border-l border-slate-200 dark:border-slate-800 pl-4 flex flex-col items-end gap-1.5">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase border shadow-sm ${
                  selectedStock.recommendation === 'COMPRA FORTE'
                    ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40'
                    : selectedStock.recommendation === 'COMPRA'
                    ? 'bg-teal-500/20 text-teal-800 dark:text-teal-300 border-teal-500/40'
                    : 'bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-500/40'
                }`}
              >
                {selectedStock.recommendation}
              </span>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Score:{' '}
                <span className="font-bold text-teal-700 dark:text-teal-300">{selectedStock.score}/100</span>
              </div>
            </div>

            {/* Window Controls: Minimize & Close */}
            <div className="border-l border-slate-200 dark:border-slate-800 pl-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsAnalysisMinimized(true)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Minimizar Raio-X"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              {showCloseButton && (
                <button
                  type="button"
                  onClick={() => setIsAnalysisOpen(false)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-white text-xs font-bold transition-all cursor-pointer"
                  title="Fechar Raio-X da Ação"
                >
                  <X className="h-4 w-4" />
                  <span>Fechar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Google Finance External Link + Period Bar */}
        <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <a
            href={selectedStock.googleFinanceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-600/30 text-teal-800 dark:text-teal-300 font-semibold transition-all hover:scale-102"
          >
            <Globe2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>Ver cotação oficial no Google Finance ({selectedStock.ticker})</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>

          {/* Chart Period Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {(['1D', '5D', '1M', '6M', '1A', '5A'] as ChartPeriod[]).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => {
                  setSelectedPeriod(period);
                  setHoveredPoint(null);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === period
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive SVG Chart */}
        <div className="p-4 sm:p-6 relative">
          {hoveredPoint && (
            <div className="absolute top-2 left-6 z-10 bg-slate-900/95 border border-teal-500/40 px-3 py-1.5 rounded-xl shadow-lg text-xs">
              <div className="text-[10px] text-slate-400">Data/Hora: {hoveredPoint.date}</div>
              <div className="text-white font-bold">
                {selectedStock.currency === 'BRL' ? 'R$ ' : '$ '}
                {hoveredPoint.price.toFixed(2)}
              </div>
            </div>
          )}

          <div className="w-full h-64 relative">
            <svg
              viewBox="0 0 800 260"
              preserveAspectRatio="none"
              className="w-full h-full cursor-crosshair overflow-visible"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={chartData.isPositive ? '#10b981' : '#f43f5e'}
                    stopOpacity="0.25"
                  />
                  <stop
                    offset="100%"
                    stopColor={chartData.isPositive ? '#10b981' : '#f43f5e'}
                    stopOpacity="0.0"
                  />
                </linearGradient>
              </defs>

              <line x1="20" y1="50" x2="780" y2="50" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="20" y1="120" x2="780" y2="120" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="20" y1="190" x2="780" y2="190" stroke="#1e293b" strokeDasharray="3 3" />

              {chartData.area && (
                <path d={chartData.area} fill="url(#chartGradient)" />
              )}

              {chartData.path && (
                <path
                  d={chartData.path}
                  fill="none"
                  stroke={chartData.isPositive ? '#10b981' : '#f43f5e'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              <line
                x1="20"
                y1={20}
                x2="780"
                y2={20}
                stroke="#14b8a6"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.6"
              />

              {chartData.coords?.map((c, i) => (
                <circle
                  key={i}
                  cx={c.x}
                  cy={c.y}
                  r={hoveredPoint?.date === c.point.date ? 6 : 3}
                  className="cursor-pointer transition-all"
                  fill={hoveredPoint?.date === c.point.date ? '#ffffff' : (chartData.isPositive ? '#10b981' : '#f43f5e')}
                  stroke="#0f172a"
                  strokeWidth="2"
                  onMouseEnter={() => setHoveredPoint(c.point)}
                />
              ))}
            </svg>

            <div className="absolute top-2 right-4 text-[11px] font-semibold text-teal-800 dark:text-teal-400 bg-teal-50/90 dark:bg-teal-950/80 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
              Preço Alvo / Teto: {selectedStock.currency === 'BRL' ? 'R$ ' : '$ '}
              {selectedStock.targetPrice.toFixed(2)} (+{selectedStock.upsidePercent.toFixed(1)}%)
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-3">
            <div>
              Mínima do período:{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedStock.currency === 'BRL' ? 'R$ ' : '$ '}
                {chartData.min.toFixed(2)}
              </span>
            </div>
            <div>
              Máxima do período:{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedStock.currency === 'BRL' ? 'R$ ' : '$ '}
                {chartData.max.toFixed(2)}
              </span>
            </div>
            <div>
              Potencial (Upside):{' '}
              <span className="font-bold text-teal-700 dark:text-teal-300">
                +{selectedStock.upsidePercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Fundamental Valuation Grid */}
        <div className="bg-slate-50/70 dark:bg-slate-950/50 p-5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Preço Teto / Alvo</span>
            <span className="text-base font-bold text-teal-700 dark:text-teal-300">
              {selectedStock.currency === 'BRL' ? 'R$ ' : '$ '}
              {selectedStock.targetPrice.toFixed(2)}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">
              +{selectedStock.upsidePercent.toFixed(1)}% upside
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">P/L (P/E Ratio)</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {selectedStock.peRatio.toFixed(1)}x
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
              {selectedStock.peRatio < 10 ? 'Muito Barato' : selectedStock.peRatio < 25 ? 'Justo' : 'Crescimento'}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Dividend Yield</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {selectedStock.dividendYield.toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
              Projeção anual
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">RSI (14 Dias)</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {selectedStock.rsi}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
              {selectedStock.rsi < 45 ? 'Zona de Compra' : 'Neutro'}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">52 Semanas (Mín / Máx)</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
              {selectedStock.fiftyTwoWeekLow.toFixed(1)} - {selectedStock.fiftyTwoWeekHigh.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
              Faixa de 1 ano
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Preço Ideal de Entrada</span>
            <span className="text-base font-bold text-amber-600 dark:text-amber-300">
              {selectedStock.currency === 'BRL' ? 'R$ ' : '$ '}
              {selectedStock.thesis.idealBuyPrice.toFixed(2)}
            </span>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 block font-medium">
              Margem de segurança
            </span>
          </div>
        </div>

        {/* AI Investment Thesis & Highlights */}
        <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tese de Investimento & Parecer com IA
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Racional estratégico e análise de risco para compra hoje
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateAIThesis}
              disabled={isAiLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
              {isAiLoading ? 'Analisando Mercado...' : 'Atualizar Análise com IA'}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
            {selectedStock.thesis.summary}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="h-4 w-4" />
                Pontos Fortes & Catalisadores
              </span>
              <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                {selectedStock.thesis.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">&bull;</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30">
              <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 mb-2">
                <Info className="h-4 w-4" />
                Principais Fatores de Risco
              </span>
              <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                {selectedStock.thesis.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-500 font-bold">&bull;</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-teal-500 selection:text-white pb-16 transition-colors duration-200">
      {/* Top Ticker Bar (Global Indices & Dólar) */}
      <div className="bg-white/95 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-xs py-2 px-4 sticky top-0 z-30 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-6 text-[11px] whitespace-nowrap">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              Mercado Aberto
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 dark:text-slate-300">IBOVESPA:</span>
              <span className="text-slate-900 dark:text-white font-medium">134.820 pts</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                +0.62% <TrendingUp className="h-3 w-3 inline ml-0.5" />
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 dark:text-slate-300">S&P 500:</span>
              <span className="text-slate-900 dark:text-white font-medium">5.782 pts</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                +0.45% <TrendingUp className="h-3 w-3 inline ml-0.5" />
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 dark:text-slate-300">NASDAQ:</span>
              <span className="text-slate-900 dark:text-white font-medium">18.275 pts</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                +0.81% <TrendingUp className="h-3 w-3 inline ml-0.5" />
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 dark:text-slate-300">DÓLAR (USD/BRL):</span>
              <span className="text-slate-900 dark:text-white font-medium">R$ 5,42</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                -0.38% <TrendingDown className="h-3 w-3 inline ml-0.5" />
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://www.google.com/finance"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Globe2 className="h-3 w-3 text-teal-600 dark:text-teal-400" />
              Google Finance
              <ExternalLink className="h-2.5 w-2.5 opacity-60" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer mr-2 py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar à Central
              </button>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-teal-50 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 uppercase tracking-wide">
                Google Finance &bull; B3 & EUA
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Radar de Ações & Auxiliar de Compra
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Top 10 do dia, valuation fundamentalista, gráficos interativos e simulador de aporte.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => exportStocksToCSV(stocks, simulationResult)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              Exportar CSV
            </button>
            <ThemeToggle showLabel={false} />
          </div>
        </div>

        {/* Tab Navigation (2 Simplified Tabs for Beginners) */}
        <div className="flex items-center gap-3 mt-5 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('explore')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'explore'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Search className="h-4 w-4 text-teal-300" />
            1. Explorar & Pesquisar Histórico de Ações
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('portfolio')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'portfolio'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Wallet className="h-4 w-4 text-teal-300" />
            2. Minha Carteira ({userPortfolio.length})
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB: WATCHLIST (FAVORITAS)                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'watchlist' && (
          <div className="mt-6">
            {isAnalysisOpen && renderStockAnalysisCard(true)}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  Minha Watchlist de Ações Favoritas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ações que você favoritou para acompanhar cotações, preço teto e oportunidades em tempo real.
                </p>
              </div>
            </div>

            {watchlistStocks.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Star className="h-12 w-12 text-slate-400 mx-auto mb-3 opacity-40" />
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Sua Watchlist está vazia</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Clique no ícone de estrela nas ações para salvá-las na sua watchlist.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {watchlistStocks.map((stock) => {
                  const isSelected = selectedStockTicker === stock.ticker && isAnalysisOpen;
                  const isBelowTarget = stock.price <= stock.thesis.idealBuyPrice;
                  return (
                    <div
                      key={stock.ticker}
                      onClick={() => handleOpenStockAnalysis(stock.ticker)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 border-teal-500 shadow-lg'
                          : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 dark:text-white text-base">
                            {stock.ticker}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                            {stock.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleToggleWatchlist(stock.ticker, e)}
                          className="text-amber-400 p-1"
                        >
                          <Star className="h-4 w-4 fill-amber-400" />
                        </button>
                      </div>

                      {isBelowTarget && (
                        <div className="mb-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5" />
                          🔥 Abaixo do Preço Teto Ideal (Oportunidade)
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <div>
                          <div className="text-[11px] text-slate-400">Cotação Atual</div>
                          <div className="text-base font-bold text-slate-900 dark:text-white">
                            {stock.currency === 'BRL' ? 'R$ ' : '$ '}
                            {stock.price.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] text-slate-400">Upside / Alvo</div>
                          <div className="text-sm font-bold text-teal-600 dark:text-teal-400">
                            +{stock.upsidePercent.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: MINHA CARTEIRA REAL                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'portfolio' && (
          <div className="mt-6">
            {isAnalysisOpen && renderStockAnalysisCard(true)}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-teal-500" />
                  Minha Carteira de Ações (Acompanhamento Real)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gerencie suas ações compradas, preço médio, rentabilidade e dividendos projetados.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {userPortfolio.length > 0 && (
                  <button
                    type="button"
                    onClick={handleWipePortfolioAndWatchlist}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-semibold cursor-pointer transition-all"
                    title="Apagar todas as ações da carteira e começar do zero"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Zerar Carteira</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsPortfolioModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md cursor-pointer transition-all"
                >
                  <PlusCircle className="h-4 w-4" />
                  Adicionar Posição na Carteira
                </button>
              </div>
            </div>

            {/* Portfolio Summary KPIs */}
            {(() => {
              const totalInv = userPortfolio.reduce((acc, item) => {
                return acc + item.shares * item.averagePrice;
              }, 0);

              const totalVal = userPortfolio.reduce((acc, item) => {
                const s = stocks.find((st) => st.ticker === item.ticker);
                const currentPrice = s ? s.price : item.averagePrice;
                return acc + item.shares * currentPrice;
              }, 0);

              const profitLoss = totalVal - totalInv;
              const profitLossPct = totalInv > 0 ? (profitLoss / totalInv) * 100 : 0;

              const totalAnnualDivs = userPortfolio.reduce((acc, item) => {
                const s = stocks.find((st) => st.ticker === item.ticker);
                const currentPrice = s ? s.price : item.averagePrice;
                const dy = s ? s.dividendYield : 5.0;
                return acc + ((item.shares * currentPrice * dy) / 100);
              }, 0);

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Total Investido</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      R$ {totalInv.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Preço de aquisição</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Valor Atual da Carteira</span>
                    <span className="text-xl font-black text-teal-600 dark:text-teal-400">
                      R$ {totalVal.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-teal-600/80 block mt-0.5">Cotações em tempo real</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Rentabilidade Total (P&L)</span>
                    <span className={`text-xl font-black ${profitLoss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {profitLoss >= 0 ? '+' : ''}R$ {profitLoss.toFixed(2)} ({profitLoss >= 0 ? '+' : ''}{profitLossPct.toFixed(2)}%)
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Ganho de capital</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Dividendos Anuais Estimados</span>
                    <span className="text-xl font-black text-amber-500 dark:text-amber-400">
                      R$ {totalAnnualDivs.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Proventos projetados a.a.</span>
                  </div>
                </div>
              );
            })()}

            {userPortfolio.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Wallet className="h-12 w-12 text-slate-400 mx-auto mb-3 opacity-40" />
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Sua carteira está vazia</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Adicione ações que você comprou para acompanhar a valorização e os dividendos.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Ativo</th>
                        <th className="py-3 px-3">Cotas</th>
                        <th className="py-3 px-3">Preço Médio</th>
                        <th className="py-3 px-3">Cotação Atual</th>
                        <th className="py-3 px-3">Total Investido</th>
                        <th className="py-3 px-3">Valor Atual</th>
                        <th className="py-3 px-3">Lucro / Prejuízo</th>
                        <th className="py-3 px-3">Div. Anual</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {userPortfolio.map((item) => {
                        const stock = stocks.find((s) => s.ticker === item.ticker);
                        const curPrice = stock ? stock.price : item.averagePrice;
                        const totalInv = item.shares * item.averagePrice;
                        const totalVal = item.shares * curPrice;
                        const profit = totalVal - totalInv;
                        const profitPct = totalInv > 0 ? (profit / totalInv) * 100 : 0;
                        const annualDiv = (totalVal * (stock ? stock.dividendYield : 5)) / 100;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {item.ticker}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                {stock?.name || 'Ação'}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {item.shares}
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                              R$ {item.averagePrice.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                              R$ {curPrice.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                              R$ {totalInv.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 font-bold text-teal-600 dark:text-teal-400">
                              R$ {totalVal.toFixed(2)}
                            </td>
                            <td className={`py-3 px-3 font-bold ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {profit >= 0 ? '+' : ''}R$ {profit.toFixed(2)} ({profit >= 0 ? '+' : ''}{profitPct.toFixed(1)}%)
                            </td>
                            <td className="py-3 px-3 font-bold text-amber-500">
                              R$ {annualDiv.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = removeUserPortfolioItem(userId, isGuest, item.id);
                                  setUserPortfolio(updated);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 font-semibold text-[11px] transition-colors cursor-pointer"
                              >
                                Remover
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Portfolio Modal */}
        {isPortfolioModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-teal-500" />
                  Adicionar Ação na Carteira
                </h3>
                <button
                  type="button"
                  onClick={() => setIsPortfolioModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!portTicker || portShares <= 0 || portAvgPrice <= 0) return;
                  const updated = addUserPortfolioItem(userId, isGuest, {
                    ticker: portTicker.toUpperCase(),
                    shares: Number(portShares),
                    averagePrice: Number(portAvgPrice),
                    purchaseDate: new Date().toISOString().split('T')[0],
                  });
                  setUserPortfolio(updated);
                  setIsPortfolioModalOpen(false);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ticker da Ação (ex: BBAS3, PETR4, NVDA)
                  </label>
                  <select
                    value={portTicker}
                    onChange={(e) => setPortTicker(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold"
                  >
                    {stocks.map((s) => (
                      <option key={s.ticker} value={s.ticker}>
                        {s.ticker} - {s.name} ({s.market})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantidade de Cotas / Ações
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={portShares}
                    onChange={(e) => setPortShares(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preço Médio de Aquisição (R$ / US$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={portAvgPrice}
                    onChange={(e) => setPortAvgPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPortfolioModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md cursor-pointer"
                  >
                    Salvar Posição
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: EXPLORAR & PESQUISAR HISTÓRICO DE AÇÕES                           */}
        {/* ========================================================================= */}
        {activeTab === 'explore' && (
          <div className="mt-6">
            {/* Raio-X card only if opened by user */}
            {isAnalysisOpen && renderStockAnalysisCard(true)}

            {/* Beginner Guide Banner */}
            <div className="mb-6 bg-gradient-to-r from-teal-900/40 to-slate-900 border border-teal-500/30 rounded-2xl p-5 sm:p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 shrink-0">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                    Guia de Ações para Iniciantes
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Pesquise o histórico de qualquer ação da Bolsa brasileira (<strong>B3</strong>) ou dos <strong>Estados Unidos</strong> (Wall Street). Clique em qualquer linha para ver o <strong>gráfico de preços</strong>, histórico e análise detalhada.
                  </p>
                </div>
              </div>
            </div>

            {/* Search & Global Ticker Facilitator */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl mb-5">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Pesquise por nome, ticker (ex: PETR4, BBAS3, NVDA, AAPL) ou setor..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 font-semibold"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setMarketFilter('ALL')}
                      className={`px-3 py-2 rounded-lg font-bold cursor-pointer transition-all ${
                        marketFilter === 'ALL' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Todas ({stocks.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMarketFilter('B3')}
                      className={`px-3 py-2 rounded-lg font-bold cursor-pointer transition-all ${
                        marketFilter === 'B3' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🇧🇷 Brasil (B3)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMarketFilter('US')}
                      className={`px-3 py-2 rounded-lg font-bold cursor-pointer transition-all ${
                        marketFilter === 'US' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🇺🇸 EUA (Wall St)
                    </button>
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500 font-semibold"
                  >
                    <option value="score">Maior Nota</option>
                    <option value="upside">Maior Potencial</option>
                    <option value="dy">Maior Dividend Yield</option>
                    <option value="pe">Mais Baratas (P/L)</option>
                  </select>
                </div>
              </div>

              {/* Quick Suggestion Chips */}
              <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-semibold mr-1">Sugestões rápidas:</span>
                {['BBAS3', 'PETR4', 'VALE3', 'ITUB4', 'WEGE3', 'BBDC4', 'BPAC11', 'NVDA', 'META', 'AAPL', 'GOOGL', 'TSLA', 'AMZN', 'NFLX', 'V'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSearchQuery(t)}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-teal-300 font-bold transition-colors cursor-pointer"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Table of stocks */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Ativo / Empresa</th>
                      <th className="py-3.5 px-3">Mercado</th>
                      <th className="py-3.5 px-3">Preço Atual</th>
                      <th className="py-3.5 px-3">Var. Hoje</th>
                      <th className="py-3.5 px-3">Preço Alvo</th>
                      <th className="py-3.5 px-3">Potencial</th>
                      <th className="py-3.5 px-3">P/L</th>
                      <th className="py-3.5 px-3">Dividend Yield</th>
                      <th className="py-3.5 px-3">Nota</th>
                      <th className="py-3.5 px-4 text-right">Ver Histórico & Raio-X</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {displayedStocks.map((stock) => {
                      const isSelected = selectedStockTicker === stock.ticker && isAnalysisOpen;
                      return (
                        <tr
                          key={stock.ticker}
                          onClick={() => handleOpenStockAnalysis(stock.ticker)}
                          className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-teal-950/40 ring-1 ring-inset ring-teal-500/40' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => handleToggleWatchlist(stock.ticker, e)}
                                className="text-slate-600 hover:text-amber-400"
                              >
                                <Star
                                  className={`h-3.5 w-3.5 ${
                                    watchlist.includes(stock.ticker)
                                      ? 'text-amber-400 fill-amber-400'
                                      : ''
                                  }`}
                                />
                              </button>
                              <div>
                                <span className="font-bold text-white text-sm block">
                                  {stock.ticker}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {stock.name}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                                stock.market === 'B3'
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                  : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                              }`}
                            >
                              {stock.market === 'B3' ? 'B3' : 'EUA'}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 font-bold text-white">
                            {stock.currency === 'BRL' ? 'R$ ' : '$ '}
                            {stock.price.toFixed(2)}
                          </td>

                          <td
                            className={`py-3.5 px-3 font-semibold ${
                              stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {stock.changePercent >= 0 ? '+' : ''}
                            {stock.changePercent.toFixed(2)}%
                          </td>

                          <td className="py-3.5 px-3 font-semibold text-teal-300">
                            {stock.currency === 'BRL' ? 'R$ ' : '$ '}
                            {stock.targetPrice.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-3 font-bold text-emerald-400">
                            +{stock.upsidePercent.toFixed(1)}%
                          </td>

                          <td className="py-3.5 px-3 text-slate-300">
                            {stock.peRatio.toFixed(1)}x
                          </td>

                          <td className="py-3.5 px-3 font-bold text-emerald-400">
                            {stock.dividendYield.toFixed(1)}%
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="font-black text-teal-300">{stock.score}</span>
                            <span className="text-[10px] text-slate-500">/100</span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenStockAnalysis(stock.ticker);
                              }}
                              className="text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
                            >
                              Ver Histórico &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ANALISAR QUALQUER AÇÃO (BUSCA LIVRE B3 OU EUA)                      */}
        {/* ========================================================================= */}
        {activeTab === 'analyze' && (
          <div className="mt-6">
            {/* Universal Search & Analysis Hero Input */}
            <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xl mb-6 backdrop-blur-sm transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Analisador Universal de Ações & Valuation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Digite qualquer código de ação da <strong>B3</strong> (ex: PETR4, VALE3, WEGE3, MGLU3, TAEE11) ou dos <strong>EUA</strong> (ex: NVDA, TSLA, AAPL, MSFT, PLTR).
                  </p>
                </div>
              </div>

              {/* Search Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAnalyzeCustomTicker();
                }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4"
              >
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={tickerSearchInput}
                    onChange={(e) => {
                      setTickerSearchInput(e.target.value.toUpperCase());
                      setTickerSearchError(null);
                    }}
                    placeholder="Ex: PETR4, VALE3, NVDA, TSLA, AAPL, WEGE3, MGLU3, PRIO3..."
                    className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm font-bold text-white placeholder-slate-500 uppercase tracking-wider focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  {tickerSearchInput && (
                    <button
                      type="button"
                      onClick={() => setTickerSearchInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSearchingTicker || !tickerSearchInput.trim()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-900/30 transition-all cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${isSearchingTicker ? 'animate-spin' : ''}`} />
                  {isSearchingTicker ? 'Analisando Mercado...' : 'Analisar Ativo com IA'}
                </button>
              </form>

              {tickerSearchError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>{tickerSearchError}</span>
                </div>
              )}

              {/* Quick suggestion chips */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                  Ações populares sugeridas para análise imediata:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {QUICK_SUGGESTION_TICKERS.map((chip) => {
                    const isSelected = selectedStockTicker === chip;
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleAnalyzeCustomTicker(chip)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Analysis Card */}
            {renderStockAnalysisCard(false)}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TODAS AS AÇÕES COM FILTROS E BUSCA                                 */}
        {/* ========================================================================= */}
        {activeTab === 'all' && (
          <div className="mt-6">
            {/* Raio-X card only if opened by user */}
            {isAnalysisOpen && renderStockAnalysisCard(true)}

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar ação por ticker, empresa ou setor..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Market Filter (B3 / EUA / ALL) */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setMarketFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      marketFilter === 'ALL'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todas ({stocks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarketFilter('B3')}
                    className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      marketFilter === 'B3'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇧🇷 B3 Brasil
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarketFilter('US')}
                    className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      marketFilter === 'US'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇺🇸 EUA / Wall St
                  </button>
                </div>

                {/* Sort selector */}
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                >
                  <option value="score">Maior Score</option>
                  <option value="upside">Maior Upside (%)</option>
                  <option value="dy">Maior Dividend Yield</option>
                  <option value="pe">Menor P/L (Mais Baratas)</option>
                </select>
              </div>
            </div>

            {/* Table of stocks */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Ativo / Empresa</th>
                      <th className="py-3.5 px-3">Mercado</th>
                      <th className="py-3.5 px-3">Preço Atual</th>
                      <th className="py-3.5 px-3">Var. Hoje</th>
                      <th className="py-3.5 px-3">Preço Teto</th>
                      <th className="py-3.5 px-3">Upside</th>
                      <th className="py-3.5 px-3">P/L</th>
                      <th className="py-3.5 px-3">DY (%)</th>
                      <th className="py-3.5 px-3">Score</th>
                      <th className="py-3.5 px-3">Recomendação</th>
                      <th className="py-3.5 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {displayedStocks.map((stock) => {
                      const isSelected = selectedStockTicker === stock.ticker && isAnalysisOpen;
                      return (
                        <tr
                          key={stock.ticker}
                          onClick={() => handleOpenStockAnalysis(stock.ticker)}
                          className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-teal-950/40 ring-1 ring-inset ring-teal-500/40' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => handleToggleWatchlist(stock.ticker, e)}
                                className="text-slate-600 hover:text-amber-400"
                              >
                                <Star
                                  className={`h-3.5 w-3.5 ${
                                    watchlist.includes(stock.ticker)
                                      ? 'text-amber-400 fill-amber-400'
                                      : ''
                                  }`}
                                />
                              </button>
                              <div>
                                <span className="font-bold text-white text-sm block">
                                  {stock.ticker}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {stock.name}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                                stock.market === 'B3'
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                  : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                              }`}
                            >
                              {stock.market === 'B3' ? 'B3' : 'EUA'}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 font-bold text-white">
                            {stock.currency === 'BRL' ? 'R$ ' : '$ '}
                            {stock.price.toFixed(2)}
                          </td>

                          <td
                            className={`py-3.5 px-3 font-semibold ${
                              stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {stock.changePercent >= 0 ? '+' : ''}
                            {stock.changePercent.toFixed(2)}%
                          </td>

                          <td className="py-3.5 px-3 font-semibold text-teal-300">
                            {stock.currency === 'BRL' ? 'R$ ' : '$ '}
                            {stock.targetPrice.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-3 font-bold text-emerald-400">
                            +{stock.upsidePercent.toFixed(1)}%
                          </td>

                          <td className="py-3.5 px-3 text-slate-300">
                            {stock.peRatio.toFixed(1)}x
                          </td>

                          <td className="py-3.5 px-3 font-bold text-emerald-400">
                            {stock.dividendYield.toFixed(1)}%
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="font-black text-teal-300">{stock.score}</span>
                            <span className="text-[10px] text-slate-500">/100</span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                stock.recommendation === 'COMPRA FORTE'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                              }`}
                            >
                              {stock.recommendation}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenStockAnalysis(stock.ticker);
                              }}
                              className="text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
                            >
                              Ver Raio-X &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
