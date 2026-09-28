export type MarketType = 'B3' | 'US';
export type RecommendationSignal = 'COMPRA FORTE' | 'COMPRA' | 'OPORTUNIDADE' | 'AGUARDAR';
export type ChartPeriod = '1D' | '5D' | '1M' | '6M' | '1A' | '5A';

export interface PricePoint {
  date: string;
  price: number;
  volume?: number;
}

export interface StockThesis {
  summary: string;
  highlights: string[];
  risks: string[];
  idealBuyPrice: number;
  targetPrice: number;
  timeHorizon: string;
}

export interface StockItem {
  ticker: string;
  name: string;
  market: MarketType;
  exchange: 'BVMF' | 'NASDAQ' | 'NYSE';
  sector: string;
  price: number;
  currency: 'BRL' | 'USD';
  change: number;
  changePercent: number;
  targetPrice: number;
  upsidePercent: number;
  peRatio: number; // P/L
  dividendYield: number; // DY (%)
  recommendation: RecommendationSignal;
  score: number; // 0 - 100
  isTop10: boolean;
  top10Rank?: number;
  marketCap: string;
  rsi: number;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  thesis: StockThesis;
  history: Record<ChartPeriod, PricePoint[]>;
  googleFinanceUrl: string;
  updatedAt: string;
  isCustom?: boolean;
}

export interface UserPortfolioItem {
  id: string;
  ticker: string;
  shares: number;
  averagePrice: number;
  purchaseDate: string;
}

export interface SimulationAllocation {
  stock: StockItem;
  shares: number;
  totalInvested: number;
  weightPercent: number;
  annualDividendProjected: number;
}

export interface SimulationResult {
  totalBudget: number;
  totalAllocated: number;
  cashRemaining: number;
  annualDividendsEstimated: number;
  averageYieldPercent: number;
  estimatedReturnPercent: number;
  allocations: SimulationAllocation[];
}

export type SimulatorStrategy = 'top10' | 'dividends' | 'growth' | 'defensive';
