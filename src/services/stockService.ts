import {
  StockItem,
  MarketType,
  ChartPeriod,
  PricePoint,
  StockThesis,
  SimulationResult,
  SimulatorStrategy,
} from '../types/stocks';

// Helper to generate realistic historical curves for charts based on base price and volatility
function generateHistory(
  basePrice: number,
  volatility = 0.02,
  trend = 0.001
): Record<ChartPeriod, PricePoint[]> {
  const now = new Date();

  // 1D: Intraday (15 min intervals from 10:00 to 17:00)
  const p1D: PricePoint[] = [];
  let curPrice = basePrice * (1 - volatility * (Math.random() - 0.45));
  for (let h = 10; h <= 17; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 17 && m > 0) break;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      curPrice += curPrice * (Math.random() - 0.48) * (volatility * 0.35);
      p1D.push({
        date: timeStr,
        price: Number(curPrice.toFixed(2)),
        volume: Math.floor(Math.random() * 80000 + 20000),
      });
    }
  }

  // 5D: Daily for last 5 trading days
  const p5D: PricePoint[] = [];
  curPrice = basePrice * 0.985;
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    curPrice += curPrice * (Math.random() - 0.46) * volatility;
    p5D.push({
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      price: Number(curPrice.toFixed(2)),
      volume: Math.floor(Math.random() * 450000 + 150000),
    });
  }

  // 1M: 30 days
  const p1M: PricePoint[] = [];
  curPrice = basePrice * 0.96;
  for (let i = 30; i >= 0; i -= 2) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    curPrice += curPrice * (Math.random() - 0.47) * volatility * 1.5;
    p1M.push({
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      price: Number(curPrice.toFixed(2)),
      volume: Math.floor(Math.random() * 900000 + 300000),
    });
  }

  // 6M: 26 weeks
  const p6M: PricePoint[] = [];
  curPrice = basePrice * 0.91;
  for (let i = 26; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    curPrice += curPrice * (Math.random() - 0.46 + trend) * volatility * 2.2;
    p6M.push({
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      price: Number(curPrice.toFixed(2)),
      volume: Math.floor(Math.random() * 2500000 + 800000),
    });
  }

  // 1A: 12 months
  const p1A: PricePoint[] = [];
  curPrice = basePrice * 0.84;
  for (let i = 12; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    curPrice += curPrice * (Math.random() - 0.45 + trend) * 0.05;
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    p1A.push({
      date: `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`,
      price: Number(curPrice.toFixed(2)),
      volume: Math.floor(Math.random() * 12000000 + 4000000),
    });
  }

  // 5A: 5 years
  const p5A: PricePoint[] = [];
  curPrice = basePrice * 0.55;
  for (let i = 5; i >= 0; i--) {
    const year = now.getFullYear() - i;
    curPrice += curPrice * (0.12 + (Math.random() - 0.4) * 0.15);
    p5A.push({
      date: String(year),
      price: Number(curPrice.toFixed(2)),
      volume: Math.floor(Math.random() * 60000000 + 20000000),
    });
  }

  return {
    '1D': p1D,
    '5D': p5D,
    '1M': p1M,
    '6M': p6M,
    '1A': p1A,
    '5A': p5A,
  };
}

export const INITIAL_STOCKS: StockItem[] = [
  // --- B3 (BRASIL) ---
  {
    ticker: 'BBAS3',
    name: 'Banco do Brasil S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Financeiro / Bancos',
    price: 28.45,
    currency: 'BRL',
    change: 0.62,
    changePercent: 2.23,
    targetPrice: 35.8,
    upsidePercent: 25.83,
    peRatio: 4.3,
    dividendYield: 10.45,
    recommendation: 'COMPRA FORTE',
    score: 96,
    isTop10: true,
    top10Rank: 1,
    marketCap: 'R$ 81,4 Bi',
    rsi: 48,
    fiftyTwoWeekLow: 24.1,
    fiftyTwoWeekHigh: 31.9,
    googleFinanceUrl: 'https://www.google.com/finance/quote/BBAS3:BVMF',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary:
        'O Banco do Brasil segue sendo a maior oportunidade de valor e dividendos da B3. Múltiplo P/L histórico abaixo de 4.5x, carteira agro resiliente e ROE superior a 21%.',
      highlights: [
        'Dividend Yield projetado de dois dígitos (acima de 10% a.a.)',
        'Carteira do Agronegócio com inadimplência historicamente controlada',
        'Preço com desconto substancial em relação ao valor patrimonial (P/VP ~0.75)',
        'Eficiência operacional líder entre grandes bancos estatais',
      ],
      risks: [
        'Risco de ingerência política ou mudanças na política de dividendos',
        'Cenário macroeconômico com taxas de juros elevadas impactando crédito PF',
      ],
      idealBuyPrice: 28.0,
      targetPrice: 35.8,
      timeHorizon: '12 a 24 meses',
    },
    history: generateHistory(28.45, 0.015, 0.002),
  },
  {
    ticker: 'WEGE3',
    name: 'WEG S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Bens Industriais / Motores',
    price: 52.3,
    currency: 'BRL',
    change: 0.85,
    changePercent: 1.65,
    targetPrice: 62.0,
    upsidePercent: 18.55,
    peRatio: 31.2,
    dividendYield: 1.95,
    recommendation: 'COMPRA',
    score: 93,
    isTop10: true,
    top10Rank: 3,
    marketCap: 'R$ 219,5 Bi',
    rsi: 54,
    fiftyTwoWeekLow: 34.2,
    fiftyTwoWeekHigh: 56.4,
    googleFinanceUrl: 'https://www.google.com/finance/quote/WEGE3:BVMF',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary:
        'Líder global inquestionável em motores elétricos, automação industrial e transição energética. Crescimento acelerado internacionalmente e integração da Regal Rexnord impulsionando margens.',
      highlights: [
        'Retorno sobre Capital Investido (ROIC) consistente acima de 28%',
        'Mais de 50% da receita gerada em moeda forte no exterior (hedge cambial natural)',
        'Forte posicionamento em inteligência artificial, datacenters e energia renovável',
      ],
      risks: [
        'Múltiplo de valuation historicamente elevado (exige crescimento contínuo)',
        'Desaceleração industrial pontual em mercados europeus',
      ],
      idealBuyPrice: 50.5,
      targetPrice: 62.0,
      timeHorizon: 'Longo Prazo (3 a 5 anos)',
    },
    history: generateHistory(52.3, 0.018, 0.003),
  },
  {
    ticker: 'PRIO3',
    name: 'PRIO S.A. (PetroRio)',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Petróleo & Gás',
    price: 43.1,
    currency: 'BRL',
    change: 1.15,
    changePercent: 2.74,
    targetPrice: 64.0,
    upsidePercent: 48.49,
    peRatio: 6.8,
    dividendYield: 2.1,
    recommendation: 'COMPRA FORTE',
    score: 95,
    isTop10: true,
    top10Rank: 2,
    marketCap: 'R$ 38,2 Bi',
    rsi: 42,
    fiftyTwoWeekLow: 39.8,
    fiftyTwoWeekHigh: 54.1,
    googleFinanceUrl: 'https://www.google.com/finance/quote/PRIO3:BVMF',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary:
        'A petroleira independente mais eficiente da América Latina. Lifting cost em queda livre para menos de US$ 7/barril e entrada iminente do campo de Wahoo com potencial de disparar a produção.',
      highlights: [
        'Maior potencial de valorização (upside de quase 50% para o preço alvo)',
        'Lifting cost ultra competitivo garantindo alta geração de caixa livre',
        'Licenciamento de Wahoo como principal catalisador destravador de valor',
      ],
      risks: [
        'Volatilidade nos preços internacionais do petróleo Brent',
        'Eventuais atrasos no cronograma de licenciamento ambiental do Ibama',
      ],
      idealBuyPrice: 42.5,
      targetPrice: 64.0,
      timeHorizon: '12 a 18 meses',
    },
    history: generateHistory(43.1, 0.024, 0.0025),
  },
  {
    ticker: 'ITUB4',
    name: 'Itaú Unibanco Holding S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Financeiro / Bancos',
    price: 36.8,
    currency: 'BRL',
    change: 0.32,
    changePercent: 0.88,
    targetPrice: 43.5,
    upsidePercent: 18.21,
    peRatio: 8.4,
    dividendYield: 7.8,
    recommendation: 'COMPRA',
    score: 91,
    isTop10: true,
    top10Rank: 5,
    marketCap: 'R$ 360,1 Bi',
    rsi: 52,
    fiftyTwoWeekLow: 30.5,
    fiftyTwoWeekHigh: 38.4,
    googleFinanceUrl: 'https://www.google.com/finance/quote/ITUB4:BVMF',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary:
        'Melhor gestão bancária do país, apresentando ROE acima de 21% com inadimplência rigorosamente equilibrada e digitalização de ponta que expande a margem com clientes.',
      highlights: [
        'Retorno sobre o patrimônio (ROE) superior a 21%, superando todos os concorrentes privados',
        'Pagamento de dividendos extraordinários frequentes somados a proventos mensais',
        'Solidez patrimonial inabalável e menor custo de captação',
      ],
      risks: [
        'Concorrência acirrada no segmento de cartões e contas digitais',
        'Mudanças tributárias potenciais sobre juros sobre capital próprio (JCP)',
      ],
      idealBuyPrice: 35.8,
      targetPrice: 43.5,
      timeHorizon: 'Médio / Longo Prazo',
    },
    history: generateHistory(36.8, 0.014, 0.0018),
  },
  {
    ticker: 'EQTL3',
    name: 'Equatorial Energia S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Utilidade Pública / Energia',
    price: 33.2,
    currency: 'BRL',
    change: 0.45,
    changePercent: 1.37,
    targetPrice: 41.0,
    upsidePercent: 23.49,
    peRatio: 11.2,
    dividendYield: 4.8,
    recommendation: 'COMPRA',
    score: 89,
    isTop10: true,
    top10Rank: 8,
    marketCap: 'R$ 41,8 Bi',
    rsi: 49,
    fiftyTwoWeekLow: 29.8,
    fiftyTwoWeekHigh: 36.2,
    googleFinanceUrl: 'https://www.google.com/finance/quote/EQTL3:BVMF',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary:
        'Histórico impecável de turnaround e excelência em distribuição de energia e saneamento (Sabesp). Negócio previsível, indexado à inflação e altamente defensivo.',
      highlights: [
        'Receita dolarizada e indexada a IPCA/IGP-M',
        'Posição estratégica consolidada no saneamento básico (Sabesp e Amapá)',
        'Fluxo de caixa estável e defensivo para proteger o patrimônio em momentos voláteis',
      ],
      risks: [
        'Sensibilidade à curva longa de juros futuros no Brasil',
        'Necessidade de alto investimento (capex) nos novos ativos integrados',
      ],
      idealBuyPrice: 32.5,
      targetPrice: 41.0,
      timeHorizon: '2 a 4 anos',
    },
    history: generateHistory(33.2, 0.012, 0.0015),
  },
  {
    ticker: 'VALE3',
    name: 'Vale S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Materiais Básicos / Mineração',
    price: 58.7,
    currency: 'BRL',
    change: -0.4,
    changePercent: -0.68,
    targetPrice: 76.0,
    upsidePercent: 29.47,
    peRatio: 5.6,
    dividendYield: 9.8,
    recommendation: 'OPORTUNIDADE',
    score: 87,
    isTop10: false,
    marketCap: 'R$ 265,3 Bi',
    rsi: 38,
    fiftyTwoWeekLow: 54.2,
    fiftyTwoWeekHigh: 74.8,
    googleFinanceUrl: 'https://www.google.com/finance/quote/VALE3:BVMF',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary:
        'Cotada em patamares atrativos de valuation, negociando com desconto substancial frente aos pares globais. Forte pagadora de dividendos e recompra agressiva de ações.',
      highlights: [
        'Dividend Yield elevado com retorno de caixa aos acionistas',
        'Custo C1 de extração entre os menores do planeta',
        'RSI em sobrevenda abrindo ponto de entrada tático',
      ],
      risks: [
        'Dependência do mercado imobiliário e demanda de aço na China',
        'Acordo final e desembolsos relativos à tragédia de Mariana',
      ],
      idealBuyPrice: 57.0,
      targetPrice: 76.0,
      timeHorizon: '12 meses',
    },
    history: generateHistory(58.7, 0.022, -0.0005),
  },
  {
    ticker: 'PETR4',
    name: 'Petróleo Brasileiro S.A. - Petrobras',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Petróleo & Gás',
    price: 37.15,
    currency: 'BRL',
    change: 0.28,
    changePercent: 0.76,
    targetPrice: 45.0,
    upsidePercent: 21.13,
    peRatio: 4.8,
    dividendYield: 14.2,
    recommendation: 'COMPRA',
    score: 88,
    isTop10: true,
    top10Rank: 9,
    marketCap: 'R$ 484,2 Bi',
    rsi: 51,
    fiftyTwoWeekLow: 32.1,
    fiftyTwoWeekHigh: 42.8,
    googleFinanceUrl: 'https://www.google.com/finance/quote/PETR4:BVMF',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary:
        'A maior pagadora de dividendos da bolsa brasileira. Pré-sal de altíssima produtividade e breakeven baixo geram fluxos de caixa colossais.',
      highlights: [
        'Dividend Yield histórico de 14.2%, um dos maiores do mundo em large caps',
        'Custo de extração do Pré-Sal extremamente rentável mesmo com petróleo em queda',
        'Plano de investimentos focado em exploração e produção rentável',
      ],
      risks: [
        'Interferência política em combustíveis ou alocação excessiva em refinarias e renováveis',
        'Cenário geopolítico global e precificação internacional do barril de petróleo',
      ],
      idealBuyPrice: 36.5,
      targetPrice: 45.0,
      timeHorizon: '1 a 2 anos',
    },
    history: generateHistory(37.15, 0.02, 0.001),
  },
  {
    ticker: 'RENT3',
    name: 'Localiza Rent a Car S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Consumo Cíclico / Aluguel de Carros',
    price: 41.5,
    currency: 'BRL',
    change: 1.45,
    changePercent: 3.62,
    targetPrice: 58.0,
    upsidePercent: 39.76,
    peRatio: 12.8,
    dividendYield: 3.8,
    recommendation: 'COMPRA FORTE',
    score: 90,
    isTop10: true,
    top10Rank: 7,
    marketCap: 'R$ 44,1 Bi',
    rsi: 41,
    fiftyTwoWeekLow: 38.2,
    fiftyTwoWeekHigh: 63.4,
    googleFinanceUrl: 'https://www.google.com/finance/quote/RENT3:BVMF',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary:
        'Monopólio prático no mercado de aluguel de frotas e seminovos no Brasil. Ajuste recente na depreciação de carros limpa o balanço e pavimenta forte recuperação operacional.',
      highlights: [
        'Forte poder de compra com montadoras, obtendo descontos inalcançáveis para concorrentes',
        'Normalização dos preços de seminovos acelerando o ROIC da frota',
        'Upside de quase 40% nas projeções de consenso do mercado',
      ],
      risks: [
        'Custo da dívida elevado em períodos de Selic alta',
        'Risco residual de volatilidade na tabela FIPE de veículos usados',
      ],
      idealBuyPrice: 40.0,
      targetPrice: 58.0,
      timeHorizon: '12 a 24 meses',
    },
    history: generateHistory(41.5, 0.022, 0.0019),
  },

  // --- BOLSA DOS EUA (WALL STREET / NYSE / NASDAQ) ---
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    market: 'US',
    exchange: 'NASDAQ',
    sector: 'Tecnologia / Semicondutores & IA',
    price: 138.25,
    currency: 'USD',
    change: 3.42,
    changePercent: 2.54,
    targetPrice: 175.0,
    upsidePercent: 26.58,
    peRatio: 38.5,
    dividendYield: 0.08,
    recommendation: 'COMPRA FORTE',
    score: 97,
    isTop10: true,
    top10Rank: 4,
    marketCap: 'US$ 3.39 Tri',
    rsi: 58,
    fiftyTwoWeekLow: 75.6,
    fiftyTwoWeekHigh: 140.7,
    googleFinanceUrl: 'https://www.google.com/finance/quote/NVDA:NASDAQ',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary:
        'Monopólio na infraestrutura de hardware e ecossistema de software (CUDA) para Inteligência Artificial generativa. Arquitetura Blackwell já está com capacidade de produção esgotada por 12 meses.',
      highlights: [
        'Margem bruta recorde superior a 75%, um patamar sem precedentes na indústria de hardware',
        'Mais de 85% de participação de mercado em aceleradores de computação para IA',
        'Demanda agressiva de Big Techs (Microsoft, Meta, Google, Amazon, Tesla)',
      ],
      risks: [
        'Restrições de exportação de chips avançados para a China impostas pelo governo americano',
        'Dependência crítica da cadeia de suprimentos da TSMC em Taiwan',
      ],
      idealBuyPrice: 132.0,
      targetPrice: 175.0,
      timeHorizon: 'Longo Prazo (2 a 4 anos)',
    },
    history: generateHistory(138.25, 0.028, 0.004),
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc. (Google)',
    market: 'US',
    exchange: 'NASDAQ',
    sector: 'Tecnologia / Software & Cloud',
    price: 182.4,
    currency: 'USD',
    change: 2.15,
    changePercent: 1.19,
    targetPrice: 220.0,
    upsidePercent: 20.61,
    peRatio: 23.4,
    dividendYield: 0.44,
    recommendation: 'COMPRA FORTE',
    score: 95,
    isTop10: true,
    top10Rank: 6,
    marketCap: 'US$ 2.25 Tri',
    rsi: 53,
    fiftyTwoWeekLow: 130.2,
    fiftyTwoWeekHigh: 191.7,
    googleFinanceUrl: 'https://www.google.com/finance/quote/GOOGL:NASDAQ',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary:
        'A Big Tech com valuation mais atraente de Wall Street (P/L ~23x). Crescimento explosivo do Google Cloud com IA, liderança com Gemini e retomada forte da publicidade no Search e YouTube.',
      highlights: [
        'Google Cloud operando com lucratividade crescente e margens em expansão',
        'Forte geração de caixa livre (FCF) e programa bilionário de recompra de ações',
        'Vantagem competitiva única de dados proprietários no ecossistema Android, Search e YouTube',
      ],
      risks: [
        'Processos antitruste em andamento com o Departamento de Justiça dos EUA (DOJ)',
        'Evolução dos novos motores de busca baseados em chats conversacionais',
      ],
      idealBuyPrice: 178.0,
      targetPrice: 220.0,
      timeHorizon: '2 a 3 anos',
    },
    history: generateHistory(182.4, 0.019, 0.0028),
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    market: 'US',
    exchange: 'NASDAQ',
    sector: 'Tecnologia / Cloud & Corporativo',
    price: 428.6,
    currency: 'USD',
    change: 3.8,
    changePercent: 0.89,
    targetPrice: 505.0,
    upsidePercent: 17.83,
    peRatio: 33.1,
    dividendYield: 0.78,
    recommendation: 'COMPRA',
    score: 92,
    isTop10: true,
    top10Rank: 10,
    marketCap: 'US$ 3.18 Tri',
    rsi: 47,
    fiftyTwoWeekLow: 366.5,
    fiftyTwoWeekHigh: 468.3,
    googleFinanceUrl: 'https://www.google.com/finance/quote/MSFT:NASDAQ',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary:
        'A fortaleza corporativa do planeta. Azure Cloud cresce acima de 30% a.a. impulsionado por serviços de IA integrados, com contratos de longo prazo e retenção de clientes impecável.',
      highlights: [
        'Monetização rápida da suíte Copilot corporativa no Office 365',
        'Azure consolidado como plataforma preferida para cargas de trabalho de IA corporativa',
        'Receita recorrente e balanço com classificação de crédito AAA (superior ao governo dos EUA)',
      ],
      risks: [
        'Necessidade de capex maciço em infraestrutura de datacenters',
        'Pressão de margem temporária enquanto o capex de IA não atinge maturidade plena',
      ],
      idealBuyPrice: 415.0,
      targetPrice: 505.0,
      timeHorizon: 'Longo Prazo',
    },
    history: generateHistory(428.6, 0.016, 0.0022),
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    market: 'US',
    exchange: 'NASDAQ',
    sector: 'Consumo & Tecnologia / Nuvem',
    price: 191.5,
    currency: 'USD',
    change: 2.7,
    changePercent: 1.43,
    targetPrice: 235.0,
    upsidePercent: 22.72,
    peRatio: 41.2,
    dividendYield: 0.0,
    recommendation: 'COMPRA',
    score: 91,
    isTop10: false,
    marketCap: 'US$ 2.01 Tri',
    rsi: 55,
    fiftyTwoWeekLow: 118.3,
    fiftyTwoWeekHigh: 201.2,
    googleFinanceUrl: 'https://www.google.com/finance/quote/AMZN:NASDAQ',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary:
        'AWS acelera o crescimento com infraestrutura dedicada para nuvem corporativa e publicidade digital ganha market share com margens operacionais em alta.',
      highlights: [
        'AWS retomando crescimento com margem operacional recorde',
        'Otimização logística regional nos EUA reduzindo custo por entrega',
        'Receita de publicidade ultrapassando US$ 50 bilhões anuais com margens puras',
      ],
      risks: [
        'Concorrência da Temu e Shein no varejo eletrônico de baixo valor',
        'Crescimento de custos trabalhistas em operações de fulfillment',
      ],
      idealBuyPrice: 185.0,
      targetPrice: 235.0,
      timeHorizon: '1 a 3 anos',
    },
    history: generateHistory(191.5, 0.02, 0.0025),
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    market: 'US',
    exchange: 'NASDAQ',
    sector: 'Tecnologia / Consumo & Serviços',
    price: 227.8,
    currency: 'USD',
    change: 1.2,
    changePercent: 0.53,
    targetPrice: 255.0,
    upsidePercent: 11.94,
    peRatio: 34.2,
    dividendYield: 0.44,
    recommendation: 'OPORTUNIDADE',
    score: 86,
    isTop10: false,
    marketCap: 'US$ 3.47 Tri',
    rsi: 50,
    fiftyTwoWeekLow: 164.0,
    fiftyTwoWeekHigh: 237.2,
    googleFinanceUrl: 'https://www.google.com/finance/quote/AAPL:NASDAQ',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary:
        'A marca de maior fidelidade do mundo. Apple Intelligence inaugura um superciclo de renovação de aparelhos com mais de 2.2 bilhões de dispositivos ativos na base.',
      highlights: [
        'Receita de Serviços (App Store, iCloud, Apple Pay) gerando margens de 74%',
        'Ecossistema integrado com retenção de usuários superior a 95%',
        'Recompra contínua de ações gerando crescimento acelerado de LPA (lucro por ação)',
      ],
      risks: [
        'Pressão competitiva de marcas chinesas locais no mercado asiático',
        'Regulações da União Europeia contra monopólio da App Store',
      ],
      idealBuyPrice: 220.0,
      targetPrice: 255.0,
      timeHorizon: '3 a 5 anos',
    },
    history: generateHistory(227.8, 0.015, 0.0018),
  },
  {
    ticker: 'JPM',
    name: 'JPMorgan Chase & Co.',
    market: 'US',
    exchange: 'NYSE',
    sector: 'Financeiro / Bancos Globais',
    price: 218.4,
    currency: 'USD',
    change: 1.85,
    changePercent: 0.85,
    targetPrice: 245.0,
    upsidePercent: 12.18,
    peRatio: 12.2,
    dividendYield: 2.15,
    recommendation: 'COMPRA',
    score: 88,
    isTop10: false,
    marketCap: 'US$ 621,8 Bi',
    rsi: 56,
    fiftyTwoWeekLow: 145.2,
    fiftyTwoWeekHigh: 225.4,
    googleFinanceUrl: 'https://www.google.com/finance/quote/JPM:NYSE',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary:
        'O banco mais lucrativo e seguro do planeta. Jamie Dimon consolidou a liderança absorvendo o First Republic Bank e ampliando a fatia de depósitos corporativos e private banking.',
      highlights: [
        'Retorno sobre patrimônio tangível (ROTCE) acima de 20%',
        'Maior banco de investimentos do mundo em emissões e fusões',
        'Dividendos sólidos e recompras de ações sem depender de estímulos governamentais',
      ],
      risks: [
        'Queda eventual das taxas de juros americanas (Fed) comprimindo spread',
        'Exigências de capital regulatório mais rígidas (Basileia III Endgame)',
      ],
      idealBuyPrice: 212.0,
      targetPrice: 245.0,
      timeHorizon: 'Médio Prazo',
    },
    history: generateHistory(218.4, 0.014, 0.0015),
  },
  {
    ticker: 'BBDC4',
    name: 'Banco Bradesco S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Financeiro / Bancos',
    price: 13.45,
    currency: 'BRL',
    change: 0.15,
    changePercent: 1.13,
    targetPrice: 17.5,
    upsidePercent: 30.11,
    peRatio: 7.8,
    dividendYield: 8.5,
    recommendation: 'COMPRA',
    score: 86,
    isTop10: false,
    marketCap: 'R$ 142 Bi',
    rsi: 44,
    fiftyTwoWeekLow: 11.8,
    fiftyTwoWeekHigh: 15.9,
    googleFinanceUrl: 'https://www.google.com/finance/quote/BBDC4:BVMF',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary: 'Processo de reestruturação de crédito e limpeza de carteira em curso. Valuation descontado frente aos pares privados.',
      highlights: ['Dividend Yield atrativo', 'Desconto patrimonial histórico', 'Forte capilaridade'],
      risks: ['Inadimplência no varejo em ciclos de juros altos', 'Custo de transformação digital'],
      idealBuyPrice: 12.8,
      targetPrice: 17.5,
      timeHorizon: '18 a 24 meses',
    },
    history: generateHistory(13.45, 0.018, 0.001),
  },
  {
    ticker: 'SANB11',
    name: 'Banco Santander (Brasil) S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Financeiro / Bancos',
    price: 27.8,
    currency: 'BRL',
    change: 0.2,
    changePercent: 0.72,
    targetPrice: 34.0,
    upsidePercent: 22.3,
    peRatio: 8.9,
    dividendYield: 7.2,
    recommendation: 'COMPRA',
    score: 85,
    isTop10: false,
    marketCap: 'R$ 104 Bi',
    rsi: 48,
    fiftyTwoWeekLow: 24.5,
    fiftyTwoWeekHigh: 31.2,
    googleFinanceUrl: 'https://www.google.com/finance/quote/SANB11:BVMF',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary: 'Foco em eficiência e recuperação de margem líquida com carteira corporativa seleta.',
      highlights: ['Boa rentabilidade em segmentos de alta renda', 'Proventos trimestrais consistentes'],
      risks: ['Sensibilidade a provisões para devedores duvidosos'],
      idealBuyPrice: 26.5,
      targetPrice: 34.0,
      timeHorizon: '12 meses',
    },
    history: generateHistory(27.8, 0.016, 0.0012),
  },
  {
    ticker: 'BPAC11',
    name: 'BTG Pactual Unit',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Financeiro / Investment Banking',
    price: 34.2,
    currency: 'BRL',
    change: 0.45,
    changePercent: 1.33,
    targetPrice: 42.0,
    upsidePercent: 22.8,
    peRatio: 11.5,
    dividendYield: 3.5,
    recommendation: 'COMPRA FORTE',
    score: 94,
    isTop10: false,
    marketCap: 'R$ 168 Bi',
    rsi: 55,
    fiftyTwoWeekLow: 28.1,
    fiftyTwoWeekHigh: 36.8,
    googleFinanceUrl: 'https://www.google.com/finance/quote/BPAC11:BVMF',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary: 'O banco de investimentos mais ágil e rentável da América Latina, com expansão robusta em wealth management e asset management.',
      highlights: ['ROE consistentemente acima de 20%', 'Crescimento acelerado em captação de clientes de alta renda'],
      risks: ['Volatilidade nos mercados de capitais globais'],
      idealBuyPrice: 32.5,
      targetPrice: 42.0,
      timeHorizon: '2 a 3 anos',
    },
    history: generateHistory(34.2, 0.017, 0.0025),
  },
  {
    ticker: 'ABEV3',
    name: 'Ambev S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Consumo Não Cíclico / Bebidas',
    price: 12.6,
    currency: 'BRL',
    change: -0.05,
    changePercent: -0.39,
    targetPrice: 15.5,
    upsidePercent: 23.02,
    peRatio: 13.8,
    dividendYield: 6.5,
    recommendation: 'COMPRA',
    score: 87,
    isTop10: false,
    marketCap: 'R$ 198 Bi',
    rsi: 46,
    fiftyTwoWeekLow: 11.2,
    fiftyTwoWeekHigh: 13.9,
    googleFinanceUrl: 'https://www.google.com/finance/quote/ABEV3:BVMF',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary: 'Geração de caixa massiva, balanço sem dívidas e forte poder de marca no mercado de bebidas.',
      highlights: ['Caixa líquido robusto', 'Posição dominante de mercado'],
      risks: ['Pressão de custos de commodities (cevada e alumínio)', 'Concorrência em cervejas premium'],
      idealBuyPrice: 12.0,
      targetPrice: 15.5,
      timeHorizon: '12 a 18 meses',
    },
    history: generateHistory(12.6, 0.012, 0.0008),
  },
  {
    ticker: 'JBSS3',
    name: 'JBS S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Consumo / Alimentos & Proteína',
    price: 34.5,
    currency: 'BRL',
    change: 0.8,
    changePercent: 2.38,
    targetPrice: 45.0,
    upsidePercent: 30.43,
    peRatio: 7.2,
    dividendYield: 5.8,
    recommendation: 'COMPRA',
    score: 89,
    isTop10: false,
    marketCap: 'R$ 78 Bi',
    rsi: 54,
    fiftyTwoWeekLow: 21.5,
    fiftyTwoWeekHigh: 36.2,
    googleFinanceUrl: 'https://www.google.com/finance/quote/JBSS3:BVMF',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary: 'Maior empresa de proteína animal do mundo. Ciclo do gado favorável e diversificação geográfica global reduzindo riscos.',
      highlights: ['Diversificação em múltiplos continentes e moedas', 'Desalavancagem financeira avançada'],
      risks: ['Ciclos de oferta de gado e barreiras sanitárias'],
      idealBuyPrice: 32.0,
      targetPrice: 45.0,
      timeHorizon: '12 meses',
    },
    history: generateHistory(34.5, 0.024, 0.003),
  },
  {
    ticker: 'RADL3',
    name: 'Raia Drogasil S.A. (RD Saúde)',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Saúde / Farmácias & Varejo',
    price: 26.4,
    currency: 'BRL',
    change: 0.3,
    changePercent: 1.15,
    targetPrice: 32.0,
    upsidePercent: 21.21,
    peRatio: 32.5,
    dividendYield: 1.5,
    recommendation: 'COMPRA',
    score: 90,
    isTop10: false,
    marketCap: 'R$ 44 Bi',
    rsi: 51,
    fiftyTwoWeekLow: 21.8,
    fiftyTwoWeekHigh: 28.5,
    googleFinanceUrl: 'https://www.google.com/finance/quote/RADL3:BVMF',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary: 'Líder absoluta do varejo farmacêutico brasileiro, com padrão de expansão de lojas altamente rentável e logística impecável.',
      highlights: ['Ganho contínuo de market share', 'Cadeia logística e digital avançada'],
      risks: ['Múltiplo de P/L elevado exigindo crescimento contínuo'],
      idealBuyPrice: 25.0,
      targetPrice: 32.0,
      timeHorizon: 'Longo Prazo',
    },
    history: generateHistory(26.4, 0.015, 0.002),
  },
  {
    ticker: 'META',
    name: 'Meta Platforms, Inc.',
    market: 'US',
    exchange: 'NASDAQ',
    sector: 'Tecnologia / Mídia Social & IA',
    price: 582.4,
    currency: 'USD',
    change: 6.8,
    changePercent: 1.18,
    targetPrice: 680.0,
    upsidePercent: 16.76,
    peRatio: 27.5,
    dividendYield: 0.35,
    recommendation: 'COMPRA FORTE',
    score: 96,
    isTop10: false,
    marketCap: 'US$ 1.48 Tri',
    rsi: 61,
    fiftyTwoWeekLow: 285.0,
    fiftyTwoWeekHigh: 595.0,
    googleFinanceUrl: 'https://www.google.com/finance/quote/META:NASDAQ',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary: 'Ecossistema dominante (Facebook, Instagram, WhatsApp) monetizado com IA avançada em anúncios e eficiência operacional extrema.',
      highlights: ['Retorno sobre anúncios altíssimo para marcas', 'Investimento assertivo em inteligência artificial generativa (Llama)'],
      risks: ['Investimentos massivos em realidade virtual (Reality Labs)'],
      idealBuyPrice: 560.0,
      targetPrice: 680.0,
      timeHorizon: '2 a 3 anos',
    },
    history: generateHistory(582.4, 0.022, 0.0035),
  },
  {
    ticker: 'NFLX',
    name: 'Netflix, Inc.',
    market: 'US',
    exchange: 'NASDAQ',
    sector: 'Tecnologia / Streaming & Entretenimento',
    price: 718.5,
    currency: 'USD',
    change: 9.2,
    changePercent: 1.3,
    targetPrice: 840.0,
    upsidePercent: 16.9,
    peRatio: 41.8,
    dividendYield: 0.0,
    recommendation: 'COMPRA',
    score: 92,
    isTop10: false,
    marketCap: 'US$ 310 Bi',
    rsi: 59,
    fiftyTwoWeekLow: 380.0,
    fiftyTwoWeekHigh: 735.0,
    googleFinanceUrl: 'https://www.google.com/finance/quote/NFLX:NASDAQ',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary: 'Líder global inquestionável de streaming. Sucesso absoluto no combate ao compartilhamento de senhas e plano com anúncios.',
      highlights: ['Base de assinantes superior a 270 milhões', 'Fluxo de caixa livre em forte aceleração'],
      risks: ['Concorrência acirrada de estúdios tradicionais e Big Techs'],
      idealBuyPrice: 690.0,
      targetPrice: 840.0,
      timeHorizon: '1 a 3 anos',
    },
    history: generateHistory(718.5, 0.025, 0.003),
  },
  {
    ticker: 'AMD',
    name: 'Advanced Micro Devices, Inc.',
    market: 'US',
    exchange: 'NASDAQ',
    sector: 'Tecnologia / Semicondutores',
    price: 158.2,
    currency: 'USD',
    change: 2.4,
    changePercent: 1.54,
    targetPrice: 200.0,
    upsidePercent: 26.42,
    peRatio: 48.5,
    dividendYield: 0.0,
    recommendation: 'COMPRA',
    score: 90,
    isTop10: false,
    marketCap: 'US$ 256 Bi',
    rsi: 53,
    fiftyTwoWeekLow: 95.0,
    fiftyTwoWeekHigh: 227.0,
    googleFinanceUrl: 'https://www.google.com/finance/quote/AMD:NASDAQ',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary: 'Principal concorrente em GPUs para data centers de IA e processadores EPYC para servidores.',
      highlights: ['Linha de chips MI300 conquistando grandes clientes de nuvem', 'Crescimento em computação de alto desempenho'],
      risks: ['Dominância histórica da Nvidia no mercado de IA'],
      idealBuyPrice: 150.0,
      targetPrice: 200.0,
      timeHorizon: '2 a 4 anos',
    },
    history: generateHistory(158.2, 0.029, 0.003),
  },
  {
    ticker: 'PLTR',
    name: 'Palantir Technologies Inc.',
    market: 'US',
    exchange: 'NYSE',
    sector: 'Tecnologia / Big Data & IA Corporativa',
    price: 38.4,
    currency: 'USD',
    change: 1.1,
    changePercent: 2.95,
    targetPrice: 48.0,
    upsidePercent: 25.0,
    peRatio: 85.0,
    dividendYield: 0.0,
    recommendation: 'OPORTUNIDADE',
    score: 89,
    isTop10: false,
    marketCap: 'US$ 85 Bi',
    rsi: 62,
    fiftyTwoWeekLow: 14.5,
    fiftyTwoWeekHigh: 39.5,
    googleFinanceUrl: 'https://www.google.com/finance/quote/PLTR:NYSE',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary: 'Pioneira em plataformas de inteligência artificial operacional (AIP) para governos e grandes corporações globais.',
      highlights: ['Demanda explosiva pelo Artificial Intelligence Platform (AIP)', 'Lucratividade recorrente e inclusão no S&P 500'],
      risks: ['Valuation esticado com múltiplos elevados'],
      idealBuyPrice: 35.0,
      targetPrice: 48.0,
      timeHorizon: 'Longo Prazo',
    },
    history: generateHistory(38.4, 0.032, 0.004),
  },
  {
    ticker: 'V',
    name: 'Visa Inc.',
    market: 'US',
    exchange: 'NYSE',
    sector: 'Financeiro / Pagamentos Globais',
    price: 284.6,
    currency: 'USD',
    change: 1.8,
    changePercent: 0.64,
    targetPrice: 330.0,
    upsidePercent: 15.95,
    peRatio: 30.2,
    dividendYield: 0.74,
    recommendation: 'COMPRA',
    score: 93,
    isTop10: false,
    marketCap: 'US$ 575 Bi',
    rsi: 54,
    fiftyTwoWeekLow: 230.0,
    fiftyTwoWeekHigh: 290.0,
    googleFinanceUrl: 'https://www.google.com/finance/quote/V:NYSE',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary: 'Rede de pagamentos oligopolista global com margens operacionais superiores a 60% e fluxo de caixa previsível.',
      highlights: ['Beneficiária direta da transição global do dinheiro físico para digital', 'Margens líquidas excepcionais'],
      risks: ['Regulações governamentais sobre taxas de intercâmbio de cartões'],
      idealBuyPrice: 275.0,
      targetPrice: 330.0,
      timeHorizon: 'Longo Prazo',
    },
    history: generateHistory(284.6, 0.012, 0.002),
  },
  {
    ticker: 'MA',
    name: 'Mastercard Incorporated',
    market: 'US',
    exchange: 'NYSE',
    sector: 'Financeiro / Pagamentos Globais',
    price: 485.2,
    currency: 'USD',
    change: 3.5,
    changePercent: 0.73,
    targetPrice: 560.0,
    upsidePercent: 15.42,
    peRatio: 35.4,
    dividendYield: 0.62,
    recommendation: 'COMPRA',
    score: 92,
    isTop10: false,
    marketCap: 'US$ 458 Bi',
    rsi: 56,
    fiftyTwoWeekLow: 380.0,
    fiftyTwoWeekHigh: 495.0,
    googleFinanceUrl: 'https://www.google.com/finance/quote/MA:NYSE',
    updatedAt: new Date().toISOString(),
    thesis: {
      summary: 'Crescimento forte em serviços de valor agregado, cibersegurança e soluções B2B, além do core de pagamentos.',
      highlights: ['Expansão em serviços de cibersegurança e consultoria', 'Retorno sobre capital exemplar'],
      risks: ['Riscos macroeconômicos globais e gastos discricionários'],
      idealBuyPrice: 470.0,
      targetPrice: 560.0,
      timeHorizon: '2 a 3 anos',
    },
    history: generateHistory(485.2, 0.013, 0.0022),
  },
];


/**
 * Loads stock list including any custom stocks added by user
 */
export function getSavedStocks(userId?: string, isGuest?: boolean): StockItem[] {
  try {
    const key = userId ? `consignatec_stocks_custom_${userId}` : 'consignatec_stocks_custom';
    const raw = localStorage.getItem(key);
    if (!raw) return INITIAL_STOCKS;
    const custom: StockItem[] = JSON.parse(raw);
    const customTickers = new Set(custom.map((c) => c.ticker));
    const merged = [
      ...custom,
      ...INITIAL_STOCKS.filter((s) => !customTickers.has(s.ticker)),
    ];
    return merged;
  } catch {
    return INITIAL_STOCKS;
  }
}

/**
 * Watchlist management (User-scoped or Guest demo)
 */
export function getWatchlist(userId?: string, isGuest?: boolean): string[] {
  try {
    const key = userId ? `consignatec_watchlist_${userId}` : 'consignatec_watchlist';
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    return []; // Todas as contas novas e convidados começam com watchlist 100% zerada
  } catch {
    return [];
  }
}

export function toggleWatchlistTicker(userId?: string, ticker?: string): string[] {
  if (!ticker) return [];
  const key = userId ? `consignatec_watchlist_${userId}` : 'consignatec_watchlist';
  const current = getWatchlist(userId);
  let updated: string[];
  if (current.includes(ticker)) {
    updated = current.filter((t) => t !== ticker);
  } else {
    updated = [...current, ticker];
  }
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

/**
 * User Real Portfolio Management (User-scoped or Guest demo)
 */
export interface UserPortfolioItem {
  id: string;
  ticker: string;
  shares: number;
  averagePrice: number;
  purchaseDate: string;
}

export function getUserPortfolio(userId?: string, isGuest?: boolean): UserPortfolioItem[] {
  try {
    const key = userId ? `consignatec_user_portfolio_${userId}` : 'consignatec_user_portfolio';
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    return []; // Todas as contas novas e convidados começam com carteira 100% zerada (0 ações)
  } catch {
    return [];
  }
}

export function wipeAllStockServiceData(userId?: string): void {
  try {
    const keys = [
      'consignatec_user_portfolio',
      'consignatec_watchlist',
      'consignatec_stocks_custom',
    ];
    if (userId) {
      keys.push(
        `consignatec_user_portfolio_${userId}`,
        `consignatec_watchlist_${userId}`,
        `consignatec_stocks_custom_${userId}`
      );
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Erro ao limpar dados do stockService:', e);
  }
}

export function saveUserPortfolio(userId?: string, items?: UserPortfolioItem[]) {
  if (!items) return;
  try {
    const key = userId ? `consignatec_user_portfolio_${userId}` : 'consignatec_user_portfolio';
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving portfolio:', e);
  }
}

export function addUserPortfolioItem(userId?: string, isGuest?: boolean, item?: Omit<UserPortfolioItem, 'id'>): UserPortfolioItem[] {
  if (!item) return getUserPortfolio(userId, isGuest);
  const current = getUserPortfolio(userId, isGuest);
  const newItem: UserPortfolioItem = {
    ...item,
    id: 'port_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
  };
  const updated = [newItem, ...current];
  saveUserPortfolio(userId, updated);
  return updated;
}

export function removeUserPortfolioItem(userId?: string, isGuest?: boolean, id?: string): UserPortfolioItem[] {
  if (!id) return getUserPortfolio(userId, isGuest);
  const current = getUserPortfolio(userId, isGuest);
  const updated = current.filter((i) => i.id !== id);
  saveUserPortfolio(userId, updated);
  return updated;
}

/**
 * Investment Simulator Calculation
 */
export function calculateInvestmentSimulation(
  budget: number,
  currency: 'BRL' | 'USD',
  strategy: SimulatorStrategy,
  stocks: StockItem[]
): SimulationResult {
  // Filter stocks by currency/market relevance
  const eligibleStocks = stocks.filter((s) => {
    if (currency === 'BRL') {
      return s.currency === 'BRL';
    } else {
      return s.currency === 'USD';
    }
  });

  // Sort and select candidates according to strategy
  let candidates: StockItem[] = [];
  if (strategy === 'top10') {
    candidates = eligibleStocks
      .filter((s) => s.isTop10 || s.score >= 88)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  } else if (strategy === 'dividends') {
    candidates = [...eligibleStocks]
      .sort((a, b) => b.dividendYield - a.dividendYield)
      .slice(0, 4);
  } else if (strategy === 'growth') {
    candidates = [...eligibleStocks]
      .sort((a, b) => b.upsidePercent - a.upsidePercent)
      .slice(0, 4);
  } else {
    // defensive
    candidates = [...eligibleStocks]
      .filter((s) => s.peRatio <= 15 && s.dividendYield >= 4)
      .sort((a, b) => a.peRatio - b.peRatio)
      .slice(0, 4);
    if (candidates.length === 0) {
      candidates = [...eligibleStocks].sort((a, b) => b.score - a.score).slice(0, 4);
    }
  }

  if (candidates.length === 0) {
    candidates = eligibleStocks.slice(0, 3);
  }

  // Determine weight distribution based on stock scores
  const totalScore = candidates.reduce((acc, c) => acc + c.score, 0);
  let totalAllocated = 0;
  const allocations = candidates.map((stock) => {
    const rawTargetAmount = (stock.score / totalScore) * budget;
    const shares = Math.floor(rawTargetAmount / stock.price);
    const invested = Number((shares * stock.price).toFixed(2));
    totalAllocated += invested;
    return {
      stock,
      shares,
      totalInvested: invested,
      weightPercent: 0,
      annualDividendProjected: Number(((invested * stock.dividendYield) / 100).toFixed(2)),
    };
  });

  // Second pass: use leftover cash to buy 1 extra share of highest score if possible
  let remaining = budget - totalAllocated;
  for (const alloc of allocations) {
    if (remaining >= alloc.stock.price) {
      const extraShares = Math.floor(remaining / alloc.stock.price);
      if (extraShares > 0) {
        alloc.shares += extraShares;
        const extraInvested = extraShares * alloc.stock.price;
        alloc.totalInvested += extraInvested;
        totalAllocated += extraInvested;
        remaining -= extraInvested;
        alloc.annualDividendProjected = Number(
          ((alloc.totalInvested * alloc.stock.dividendYield) / 100).toFixed(2)
        );
      }
    }
  }

  // Update weights
  allocations.forEach((a) => {
    a.weightPercent = totalAllocated > 0 ? Number(((a.totalInvested / totalAllocated) * 100).toFixed(1)) : 0;
  });

  const totalDividends = allocations.reduce((acc, a) => acc + a.annualDividendProjected, 0);
  const avgYield = totalAllocated > 0 ? (totalDividends / totalAllocated) * 100 : 0;
  const weightedUpside = totalAllocated > 0
    ? allocations.reduce((acc, a) => acc + (a.stock.upsidePercent * a.totalInvested), 0) / totalAllocated
    : 0;

  return {
    totalBudget: budget,
    totalAllocated: Number(totalAllocated.toFixed(2)),
    cashRemaining: Number((budget - totalAllocated).toFixed(2)),
    annualDividendsEstimated: Number(totalDividends.toFixed(2)),
    averageYieldPercent: Number(avgYield.toFixed(2)),
    estimatedReturnPercent: Number(weightedUpside.toFixed(2)),
    allocations: allocations.filter((a) => a.shares > 0),
  };
}

/**
 * Request real-time Gemini AI Thesis & Google Finance Analysis for a stock
 */
export async function fetchStockAIAnalysis(stock: StockItem): Promise<StockThesis> {
  try {
    const res = await fetch('/api/stock-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker: stock.ticker,
        name: stock.name,
        market: stock.market,
        price: stock.price,
        currency: stock.currency,
        peRatio: stock.peRatio,
        dividendYield: stock.dividendYield,
        sector: stock.sector,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.summary) {
        return {
          summary: data.summary,
          highlights: data.highlights || stock.thesis.highlights,
          risks: data.risks || stock.thesis.risks,
          idealBuyPrice: data.idealBuyPrice || stock.thesis.idealBuyPrice,
          targetPrice: data.targetPrice || stock.targetPrice,
          timeHorizon: data.timeHorizon || stock.thesis.timeHorizon,
        };
      }
    }
  } catch (e) {
    console.warn('Could not fetch online AI stock analysis:', e);
  }

  // Fallback to stock's curated high-conviction thesis
  return stock.thesis;
}

/**
 * Export Top 10 & Portfolio Simulation to CSV
 */
export function exportStocksToCSV(stocks: StockItem[], simulation?: SimulationResult | null) {
  const headers = [
    'Ticker',
    'Nome',
    'Mercado',
    'Setor',
    'Preco',
    'Moeda',
    'Variacao (%)',
    'Preco Alvo',
    'Upside (%)',
    'P/L',
    'DY (%)',
    'Recomendacao',
    'Score',
    'Link Google Finance',
  ];

  const rows = stocks.map((s) => [
    s.ticker,
    `"${s.name.replace(/"/g, '""')}"`,
    s.market,
    `"${s.sector}"`,
    s.price.toFixed(2),
    s.currency,
    s.changePercent.toFixed(2) + '%',
    s.targetPrice.toFixed(2),
    s.upsidePercent.toFixed(2) + '%',
    s.peRatio.toFixed(1),
    s.dividendYield.toFixed(2) + '%',
    s.recommendation,
    s.score,
    s.googleFinanceUrl,
  ]);

  let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
  csvContent += headers.join(';') + '\r\n';
  rows.forEach((r) => {
    csvContent += r.join(';') + '\r\n';
  });

  if (simulation && simulation.allocations.length > 0) {
    csvContent += '\r\n\r\n';
    csvContent += '--- SIMULACAO DE COMPRA E APORTE ---\r\n';
    csvContent += `Orcamento Total;${simulation.totalBudget}\r\n`;
    csvContent += `Total Investido;${simulation.totalAllocated}\r\n`;
    csvContent += `Saldo Restante;${simulation.cashRemaining}\r\n`;
    csvContent += `Projecao Dividendos Anuais;${simulation.annualDividendsEstimated}\r\n`;
    csvContent += `Yield Medio Estimado;${simulation.averageYieldPercent}%\r\n`;
    csvContent += 'Ativo;Quantidade Cotas;Total Investido;Peso Carteira (%);Dividendos Projetados\r\n';
    simulation.allocations.forEach((a) => {
      csvContent += `${a.stock.ticker};${a.shares};${a.totalInvested.toFixed(2)};${a.weightPercent}%;${a.annualDividendProjected.toFixed(2)}\r\n`;
    });
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Consignatec_Radar_Acoes_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Registry of popular known stocks for instant comprehensive analysis
 */
export const POPULAR_TICKERS_REGISTRY: Record<string, Partial<StockItem>> = {
  // --- B3 (Brasil) ---
  PETR4: {
    ticker: 'PETR4',
    name: 'Petróleo Brasileiro S.A. (Petrobras PN)',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Petróleo & Gás / Energia',
    price: 37.45,
    currency: 'BRL',
    change: 0.52,
    changePercent: 1.41,
    targetPrice: 44.0,
    upsidePercent: 17.49,
    peRatio: 4.8,
    dividendYield: 14.8,
    recommendation: 'COMPRA FORTE',
    score: 94,
    marketCap: 'R$ 498 Bi',
    rsi: 49,
    fiftyTwoWeekLow: 31.2,
    fiftyTwoWeekHigh: 42.8,
  },
  VALE3: {
    ticker: 'VALE3',
    name: 'Vale S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Mineração & Siderurgia',
    price: 61.2,
    currency: 'BRL',
    change: -0.45,
    changePercent: -0.73,
    targetPrice: 78.5,
    upsidePercent: 28.27,
    peRatio: 5.9,
    dividendYield: 9.3,
    recommendation: 'COMPRA',
    score: 91,
    marketCap: 'R$ 274 Bi',
    rsi: 41,
    fiftyTwoWeekLow: 54.5,
    fiftyTwoWeekHigh: 76.9,
  },
  ITUB4: {
    ticker: 'ITUB4',
    name: 'Itaú Unibanco Holding S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Financeiro / Bancos',
    price: 36.8,
    currency: 'BRL',
    change: 0.32,
    changePercent: 0.88,
    targetPrice: 43.5,
    upsidePercent: 18.21,
    peRatio: 8.4,
    dividendYield: 7.8,
    recommendation: 'COMPRA',
    score: 91,
    marketCap: 'R$ 359 Bi',
    rsi: 52,
    fiftyTwoWeekLow: 30.5,
    fiftyTwoWeekHigh: 38.9,
  },
  BBDC4: {
    ticker: 'BBDC4',
    name: 'Banco Bradesco S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Financeiro / Bancos',
    price: 15.2,
    currency: 'BRL',
    change: 0.18,
    changePercent: 1.2,
    targetPrice: 18.8,
    upsidePercent: 23.68,
    peRatio: 7.9,
    dividendYield: 8.2,
    recommendation: 'COMPRA',
    score: 87,
    marketCap: 'R$ 162 Bi',
    rsi: 48,
    fiftyTwoWeekLow: 12.8,
    fiftyTwoWeekHigh: 17.5,
  },
  MGLU3: {
    ticker: 'MGLU3',
    name: 'Magazine Luiza S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Varejo & E-commerce',
    price: 9.85,
    currency: 'BRL',
    change: -0.22,
    changePercent: -2.18,
    targetPrice: 13.5,
    upsidePercent: 37.06,
    peRatio: 18.5,
    dividendYield: 0.5,
    recommendation: 'OPORTUNIDADE',
    score: 74,
    marketCap: 'R$ 7.2 Bi',
    rsi: 38,
    fiftyTwoWeekLow: 8.1,
    fiftyTwoWeekHigh: 16.4,
  },
  TAEE11: {
    ticker: 'TAEE11',
    name: 'Transmissora Aliança de Energia Elétrica (Taesa)',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Utilidade Pública / Energia Elétrica',
    price: 35.1,
    currency: 'BRL',
    change: 0.15,
    changePercent: 0.43,
    targetPrice: 39.5,
    upsidePercent: 12.54,
    peRatio: 9.8,
    dividendYield: 10.1,
    recommendation: 'COMPRA',
    score: 89,
    marketCap: 'R$ 36.2 Bi',
    rsi: 47,
    fiftyTwoWeekLow: 33.2,
    fiftyTwoWeekHigh: 38.6,
  },
  CPLE6: {
    ticker: 'CPLE6',
    name: 'Companhia Paranaense de Energia (Copel)',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Utilidade Pública / Energia Elétrica',
    price: 9.95,
    currency: 'BRL',
    change: 0.08,
    changePercent: 0.81,
    targetPrice: 12.8,
    upsidePercent: 28.64,
    peRatio: 8.1,
    dividendYield: 8.6,
    recommendation: 'COMPRA FORTE',
    score: 93,
    marketCap: 'R$ 29.8 Bi',
    rsi: 51,
    fiftyTwoWeekLow: 8.2,
    fiftyTwoWeekHigh: 10.9,
  },
  GGBR4: {
    ticker: 'GGBR4',
    name: 'Gerdau S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Siderurgia & Metalurgia',
    price: 19.3,
    currency: 'BRL',
    change: 0.25,
    changePercent: 1.31,
    targetPrice: 24.5,
    upsidePercent: 26.94,
    peRatio: 6.2,
    dividendYield: 7.9,
    recommendation: 'COMPRA',
    score: 88,
    marketCap: 'R$ 41.5 Bi',
    rsi: 45,
    fiftyTwoWeekLow: 17.5,
    fiftyTwoWeekHigh: 23.8,
  },
  KLBN11: {
    ticker: 'KLBN11',
    name: 'Klabin S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Papel & Celulose',
    price: 21.4,
    currency: 'BRL',
    change: 0.12,
    changePercent: 0.56,
    targetPrice: 26.5,
    upsidePercent: 23.83,
    peRatio: 8.9,
    dividendYield: 7.4,
    recommendation: 'COMPRA',
    score: 87,
    marketCap: 'R$ 26.3 Bi',
    rsi: 48,
    fiftyTwoWeekLow: 19.2,
    fiftyTwoWeekHigh: 25.1,
  },
  RENT3: {
    ticker: 'RENT3',
    name: 'Localiza Rent a Car S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Transporte & Locação de Frotas',
    price: 44.5,
    currency: 'BRL',
    change: -0.65,
    changePercent: -1.44,
    targetPrice: 58.0,
    upsidePercent: 30.34,
    peRatio: 14.2,
    dividendYield: 3.8,
    recommendation: 'COMPRA',
    score: 86,
    marketCap: 'R$ 47.1 Bi',
    rsi: 39,
    fiftyTwoWeekLow: 40.1,
    fiftyTwoWeekHigh: 63.4,
  },
  LREN3: {
    ticker: 'LREN3',
    name: 'Lojas Renner S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Consumo Cíclico / Moda',
    price: 17.8,
    currency: 'BRL',
    change: 0.35,
    changePercent: 2.01,
    targetPrice: 22.5,
    upsidePercent: 26.4,
    peRatio: 13.5,
    dividendYield: 5.2,
    recommendation: 'COMPRA',
    score: 85,
    marketCap: 'R$ 17.3 Bi',
    rsi: 54,
    fiftyTwoWeekLow: 14.2,
    fiftyTwoWeekHigh: 21.0,
  },
  EMBR3: {
    ticker: 'EMBR3',
    name: 'Embraer S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Aeroespacial & Defesa',
    price: 52.8,
    currency: 'BRL',
    change: 1.45,
    changePercent: 2.82,
    targetPrice: 62.0,
    upsidePercent: 17.42,
    peRatio: 24.5,
    dividendYield: 1.2,
    recommendation: 'COMPRA FORTE',
    score: 93,
    marketCap: 'R$ 38.6 Bi',
    rsi: 61,
    fiftyTwoWeekLow: 22.4,
    fiftyTwoWeekHigh: 54.9,
  },
  CSAN3: {
    ticker: 'CSAN3',
    name: 'Cosan S.A.',
    market: 'B3',
    exchange: 'BVMF',
    sector: 'Energia, Logística & Agronegócio',
    price: 11.9,
    currency: 'BRL',
    change: -0.15,
    changePercent: -1.24,
    targetPrice: 17.0,
    upsidePercent: 42.86,
    peRatio: 9.4,
    dividendYield: 4.8,
    recommendation: 'OPORTUNIDADE',
    score: 82,
    marketCap: 'R$ 22.3 Bi',
    rsi: 36,
    fiftyTwoWeekLow: 10.8,
    fiftyTwoWeekHigh: 18.9,
  },

  // --- US (Estados Unidos) ---
  TSLA: {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    market: 'US',
    exchange: 'NASDAQ',
    sector: 'Veículos Elétricos & Inteligência Artificial',
    price: 242.8,
    currency: 'USD',
    change: 4.35,
    changePercent: 1.82,
    targetPrice: 310.0,
    upsidePercent: 27.68,
    peRatio: 64.2,
    dividendYield: 0.0,
    recommendation: 'COMPRA',
    score: 89,
    marketCap: '$ 775 Bi',
    rsi: 58,
    fiftyTwoWeekLow: 138.8,
    fiftyTwoWeekHigh: 271.0,
  },
  AAPL: {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    market: 'US',
    exchange: 'NASDAQ',
    sector: 'Tecnologia / Hardware & Ecossistema',
    price: 228.5,
    currency: 'USD',
    change: 1.85,
    changePercent: 0.82,
    targetPrice: 260.0,
    upsidePercent: 13.79,
    peRatio: 33.5,
    dividendYield: 0.65,
    recommendation: 'COMPRA',
    score: 92,
    marketCap: '$ 3.48 Tri',
    rsi: 53,
    fiftyTwoWeekLow: 164.1,
    fiftyTwoWeekHigh: 237.2,
  },
  MSFT: {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    market: 'US',
    exchange: 'NASDAQ',
    sector: 'Computação em Nuvem & Software Corporativo',
    price: 432.4,
    currency: 'USD',
    change: 3.12,
    changePercent: 0.73,
    targetPrice: 500.0,
    upsidePercent: 15.63,
    peRatio: 35.8,
    dividendYield: 0.78,
    recommendation: 'COMPRA FORTE',
    score: 95,
    marketCap: '$ 3.21 Tri',
    rsi: 52,
    fiftyTwoWeekLow: 309.5,
    fiftyTwoWeekHigh: 468.4,
  },
  AMZN: {
    ticker: 'AMZN',
    name: 'Amazon.com, Inc.',
    market: 'US',
    exchange: 'NASDAQ',
    sector: 'Cloud (AWS) & Comércio Eletrônico Global',
    price: 191.2,
    currency: 'USD',
    change: 2.45,
    changePercent: 1.3,
    targetPrice: 230.0,
    upsidePercent: 20.29,
    peRatio: 41.5,
    dividendYield: 0.0,
    recommendation: 'COMPRA FORTE',
    score: 94,
    marketCap: '$ 1.99 Tri',
    rsi: 56,
    fiftyTwoWeekLow: 118.4,
    fiftyTwoWeekHigh: 201.2,
  },
  META: {
    ticker: 'META',
    name: 'Meta Platforms, Inc.',
    market: 'US',
    exchange: 'NASDAQ',
    sector: 'Mídia Social, Anúncios Digitais & IA',
    price: 568.2,
    currency: 'USD',
    change: 8.4,
    changePercent: 1.5,
    targetPrice: 650.0,
    upsidePercent: 14.39,
    peRatio: 28.4,
    dividendYield: 0.4,
    recommendation: 'COMPRA FORTE',
    score: 95,
    marketCap: '$ 1.44 Tri',
    rsi: 63,
    fiftyTwoWeekLow: 279.4,
    fiftyTwoWeekHigh: 575.2,
  },
  AMD: {
    ticker: 'AMD',
    name: 'Advanced Micro Devices, Inc.',
    market: 'US',
    exchange: 'NASDAQ',
    sector: 'Semicondutores & Aceleradores de IA',
    price: 156.4,
    currency: 'USD',
    change: 3.2,
    changePercent: 2.09,
    targetPrice: 195.0,
    upsidePercent: 24.68,
    peRatio: 46.2,
    dividendYield: 0.0,
    recommendation: 'COMPRA',
    score: 90,
    marketCap: '$ 253 Bi',
    rsi: 49,
    fiftyTwoWeekLow: 94.0,
    fiftyTwoWeekHigh: 227.3,
  },
  PLTR: {
    ticker: 'PLTR',
    name: 'Palantir Technologies Inc.',
    market: 'US',
    exchange: 'NYSE',
    sector: 'Inteligência Artificial & Big Data Corporativo',
    price: 37.8,
    currency: 'USD',
    change: 1.45,
    changePercent: 3.99,
    targetPrice: 46.0,
    upsidePercent: 21.69,
    peRatio: 82.5,
    dividendYield: 0.0,
    recommendation: 'COMPRA',
    score: 91,
    marketCap: '$ 84.5 Bi',
    rsi: 68,
    fiftyTwoWeekLow: 14.5,
    fiftyTwoWeekHigh: 38.6,
  },
  NFLX: {
    ticker: 'NFLX',
    name: 'Netflix, Inc.',
    market: 'US',
    exchange: 'NASDAQ',
    sector: 'Streaming & Entretenimento Global',
    price: 708.5,
    currency: 'USD',
    change: 5.6,
    changePercent: 0.8,
    targetPrice: 780.0,
    upsidePercent: 10.09,
    peRatio: 38.4,
    dividendYield: 0.0,
    recommendation: 'COMPRA',
    score: 89,
    marketCap: '$ 304 Bi',
    rsi: 59,
    fiftyTwoWeekLow: 365.2,
    fiftyTwoWeekHigh: 713.8,
  },
};

/**
 * Common quick chips displayed for fast selection
 */
export const QUICK_SUGGESTION_TICKERS = [
  'PETR4',
  'VALE3',
  'WEGE3',
  'BBAS3',
  'ITUB4',
  'TAEE11',
  'NVDA',
  'AAPL',
  'TSLA',
  'MSFT',
  'AMZN',
  'PLTR',
  'PRIO3',
  'MGLU3',
];

/**
 * Saves or updates a custom analyzed stock in localStorage
 */
export function saveCustomStock(userId?: string, stock?: StockItem): StockItem[] {
  if (!stock) return getSavedStocks(userId);
  try {
    const key = userId ? `consignatec_stocks_custom_${userId}` : 'consignatec_stocks_custom';
    const raw = localStorage.getItem(key);
    const existing: StockItem[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((s) => s.ticker !== stock.ticker);
    const updated = [stock, ...filtered];
    localStorage.setItem(key, JSON.stringify(updated));
    return getSavedStocks(userId);
  } catch (e) {
    console.warn('Erro ao salvar stock customizado:', e);
    return getSavedStocks(userId);
  }
}

/**
 * Universal Stock Analyzer: Takes ANY arbitrary ticker from B3 or US,
 * pulls known metrics or dynamically builds fundamentals, chart history,
 * Google Finance link, and requests Gemini AI analysis.
 */
export async function analyzeAnyStock(rawTicker: string, userId?: string, isGuest?: boolean): Promise<StockItem> {
  const cleanTicker = rawTicker
    .trim()
    .toUpperCase()
    .replace(/^BVMF:/, '')
    .replace(/^NASDAQ:/, '')
    .replace(/^NYSE:/, '')
    .replace(/\.SA$/, '');

  if (!cleanTicker) {
    throw new Error('Informe o código da ação (ticker)');
  }

  // Check if stock already exists in current loaded database
  const currentStocks = getSavedStocks(userId, isGuest);
  const existingStock = currentStocks.find((s) => s.ticker === cleanTicker);
  if (existingStock) {
    return existingStock;
  }

  // Check if known in registry
  const inRegistry = POPULAR_TICKERS_REGISTRY[cleanTicker];

  // Detect market & exchange
  // Brazilian B3 tickers usually have 4 letters + 1-2 numbers (e.g. PETR4, VALE3, TAEE11)
  const isB3Pattern = /[0-9]/.test(cleanTicker) || inRegistry?.market === 'B3';
  const market: MarketType = inRegistry?.market || (isB3Pattern ? 'B3' : 'US');
  const exchange = inRegistry?.exchange || (market === 'B3' ? 'BVMF' : 'NASDAQ');
  const currency = inRegistry?.currency || (market === 'B3' ? 'BRL' : 'USD');

  // Realistic fallback price generator based on string hash for reproducibility
  let hash = 0;
  for (let i = 0; i < cleanTicker.length; i++) {
    hash = (hash << 5) - hash + cleanTicker.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  const basePrice =
    inRegistry?.price ??
    (market === 'B3'
      ? Number((20 + (positiveHash % 60) + ((positiveHash % 100) / 100)).toFixed(2))
      : Number((80 + (positiveHash % 250) + ((positiveHash % 100) / 100)).toFixed(2)));

  const peRatio = inRegistry?.peRatio ?? Number((6 + (positiveHash % 28) + 0.3).toFixed(1));
  const dividendYield = inRegistry?.dividendYield ?? Number(((positiveHash % 12) + 0.5).toFixed(2));
  const upsidePercent = inRegistry?.upsidePercent ?? Number((14 + (positiveHash % 30)).toFixed(1));
  const targetPrice =
    inRegistry?.targetPrice ?? Number((basePrice * (1 + upsidePercent / 100)).toFixed(2));
  const changePercent = inRegistry?.changePercent ?? Number((((positiveHash % 40) - 15) / 10).toFixed(2));
  const change = inRegistry?.change ?? Number(((basePrice * changePercent) / 100).toFixed(2));
  const score = inRegistry?.score ?? Math.min(97, Math.max(72, 85 + (positiveHash % 12)));
  const rsi = inRegistry?.rsi ?? (42 + (positiveHash % 24));
  const sector = inRegistry?.sector ?? (market === 'B3' ? 'Mercado de Capitais / B3' : 'Tecnologia / Global');
  const name = inRegistry?.name ?? `${cleanTicker} Corporation`;
  const marketCap = inRegistry?.marketCap ?? (market === 'B3' ? 'R$ 28 Bi' : '$ 65 Bi');

  const fiftyTwoWeekLow =
    inRegistry?.fiftyTwoWeekLow ?? Number((basePrice * 0.78).toFixed(2));
  const fiftyTwoWeekHigh =
    inRegistry?.fiftyTwoWeekHigh ?? Number((basePrice * 1.25).toFixed(2));

  // Construct official Google Finance Quote URL
  const googleFinanceUrl = `https://www.google.com/finance/quote/${cleanTicker}:${exchange}`;

  const baseThesis: StockThesis = {
    summary: `Análise técnica de ${cleanTicker} no mercado ${market} (${exchange}). Ativo negociado a ${currency} ${basePrice.toFixed(2)}, com indicador P/L de ${peRatio}x e projeção de retorno com margem de segurança.`,
    highlights: [
      `Preço Teto projetado em ${currency} ${targetPrice.toFixed(2)} (+${upsidePercent}% de upside potencial)`,
      `Indicador de múltiplos atrativo frente à média histórica do setor de ${sector}`,
      `Geração de valor consistente com indicador de momento e dividendos estimados em ${dividendYield}% a.a.`,
    ],
    risks: [
      'Volatilidade macroeconômica, flutuação cambial e taxa de juros do banco central',
      'Pressões de margem e concorrência no segmento de atuação',
    ],
    idealBuyPrice: Number((basePrice * 0.96).toFixed(2)),
    targetPrice: targetPrice,
    timeHorizon: '12 a 24 meses',
  };

  const newStock: StockItem = {
    ticker: cleanTicker,
    name: name,
    market: market,
    exchange: exchange,
    sector: sector,
    price: basePrice,
    currency: currency,
    change: change,
    changePercent: changePercent,
    targetPrice: targetPrice,
    upsidePercent: upsidePercent,
    peRatio: peRatio,
    dividendYield: dividendYield,
    recommendation: score >= 90 ? 'COMPRA FORTE' : score >= 80 ? 'COMPRA' : 'OPORTUNIDADE',
    score: score,
    isTop10: false,
    marketCap: marketCap,
    rsi: rsi,
    fiftyTwoWeekLow: fiftyTwoWeekLow,
    fiftyTwoWeekHigh: fiftyTwoWeekHigh,
    googleFinanceUrl: googleFinanceUrl,
    updatedAt: new Date().toISOString(),
    isCustom: true,
    thesis: baseThesis,
    history: generateHistory(basePrice, 0.02, 0.002),
  };

  // Try to enrich with real Gemini AI thesis via API
  try {
    const aiThesis = await fetchStockAIAnalysis(newStock);
    newStock.thesis = aiThesis;
  } catch (err) {
    console.warn('Usando tese técnica padrão para ticker:', cleanTicker, err);
  }

  // Persist in localStorage
  saveCustomStock(userId, newStock);

  return newStock;
}
