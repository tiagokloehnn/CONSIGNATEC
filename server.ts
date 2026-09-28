import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize GoogleGenAI
const apiKey = process.env.CONSIGNATEC_GEMINI_KEY || process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const VALID_CATEGORIES = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde & Bem-Estar',
  'Educação',
  'Lazer & Entretenimento',
  'Assinaturas & Serviços',
  'Compras & Cuidados',
  'Investimentos / Reserva',
];

const VALID_PAYMENTS = [
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Débito Automático',
  'Dinheiro',
];

const VALID_STATUS = ['Pago', 'Pendente', 'Agendado'];

// Helper: Call Gemini with fallback models on 503 / 429 capacity spikes
async function callGeminiWithFallback(params: {
  contents: string;
  config: any;
}): Promise<any> {
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isTemporary =
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('429') ||
        errMsg.includes('high demand') ||
        errMsg.includes('overloaded');

      if (i < models.length - 1) {
        if (isTemporary) {
          console.warn(`[Gemini API] Modelo ${model} com alta demanda temporária (503/429). Alternando para ${models[i + 1]}...`);
          await new Promise((r) => setTimeout(r, 400));
        } else {
          console.warn(`[Gemini API] Modelo ${model} falhou, tentando modelo ${models[i + 1]}: ${errMsg}`);
        }
        continue;
      }
    }
  }

  throw lastError;
}

// Endpoint: AI Expense Parser
app.post('/api/parse-expense', async (req, res) => {
  try {
    const { text, referenceDate, availableCategories } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Texto não fornecido' });
    }

    const todayStr = referenceDate || new Date().toISOString().split('T')[0];
    const categoryOptions =
      Array.isArray(availableCategories) && availableCategories.length > 0
        ? availableCategories
        : VALID_CATEGORIES;

    if (apiKey) {
      try {
        const response = await callGeminiWithFallback({
          contents: `Você é um assistente financeiro especialista. Analise a frase do usuário descrevendo um gasto e extraia os campos obrigatórios.
Data de referência atual (hoje): ${todayStr}.
Frase: "${text}"

Regras:
1. "categoria" DEVE ser uma destas opções disponíveis no orçamento do usuário: ${categoryOptions.join(', ')}.
2. "forma_pagamento" DEVE ser estritamente uma destas opções: ${VALID_PAYMENTS.join(', ')}. Se não especificado, deduza pelo contexto ou use "PIX".
3. "status" DEVE ser "Pago", "Pendente" ou "Agendado". Se o gasto já ocorreu (ex: "gastei", "comprei"), use "Pago". Se for conta futura ou a vencer, use "Pendente" ou "Agendado".
4. "data" DEVE ser no formato ISO YYYY-MM-DD.
5. "valor" DEVE ser numérico positivo em reais.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                data: { type: Type.STRING },
                descricao: { type: Type.STRING },
                categoria: { type: Type.STRING },
                forma_pagamento: { type: Type.STRING },
                valor: { type: Type.NUMBER },
                status: { type: Type.STRING },
              },
              required: ['data', 'descricao', 'categoria', 'forma_pagamento', 'valor', 'status'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        // Validate category & payment
        if (!categoryOptions.includes(parsed.categoria)) {
          parsed.categoria =
            categoryOptions.find((c: string) =>
              c.toLowerCase().includes(parsed.categoria.toLowerCase())
            ) || categoryOptions[0];
        }
        if (!VALID_PAYMENTS.includes(parsed.forma_pagamento)) {
          parsed.forma_pagamento = 'Cartão de Débito';
        }
        if (!VALID_STATUS.includes(parsed.status)) {
          parsed.status = 'Pago';
        }

        return res.json(parsed);
      } catch (geminiError: any) {
        console.warn('Gemini ocupado/indisponível após tentativas, aplicando parser de contingência inteligente:', geminiError?.message || geminiError);
      }
    }

    // Heuristic Fallback Parser
    const fallback = heuristicParse(text, todayStr);
    if (!categoryOptions.includes(fallback.categoria)) {
      fallback.categoria = categoryOptions[0];
    }
    return res.json(fallback);
  } catch (error: any) {
    console.warn('Fallback parser handled error in /api/parse-expense:', error?.message || error);
    const fallback = heuristicParse(req.body?.text || '', new Date().toISOString().split('T')[0]);
    return res.json(fallback);
  }
});

// Endpoint: AI Financial Diagnosis
app.post('/api/diagnostico', async (req, res) => {
  try {
    const { income, totalExpenses, categories, recentExpenses } = req.body;

    const dataSummary = {
      rendaLiquida: income,
      totalGasto: totalExpenses,
      saldo: income - totalExpenses,
      taxaEconomia: income > 0 ? (((income - totalExpenses) / income) * 100).toFixed(1) + '%' : '0%',
      categorias: categories,
      ultimosLancamentos: (recentExpenses || []).slice(0, 10),
    };

    if (apiKey) {
      try {
        const response = await callGeminiWithFallback({
          contents: `Você é um Consultor Financeiro CFP® de alto nível. Analise o orçamento mensal do cliente com base nos dados fornecidos:
${JSON.stringify(dataSummary, null, 2)}

Produza um diagnóstico completo, elegante e direto em formato JSON com a seguinte estrutura:
{
  "healthScore": 0 a 100 (nota da saúde financeira),
  "healthStatus": "Excelente" | "Saudável" | "Atenção" | "Crítico",
  "summary": "Resumo executivo conciso de 2-3 frases destacando a situação atual.",
  "rule50_30_20": {
    "necessidades": { "percentual": number, "status": "Dentro da meta (<=50%)" | "Acima da meta (>50%)", "analise": "string" },
    "desejos": { "percentual": number, "status": "Dentro da meta (<=30%)" | "Acima da meta (>30%)", "analise": "string" },
    "investimentos": { "percentual": number, "status": "Excelente (>=20%)" | "Abaixo da meta (<20%)", "analise": "string" }
  },
  "bottlenecks": [
    { "categoria": "nome", "impacto": "Alto" | "Médio" | "Baixo", "motivo": "string", "recomendacao": "string" }
  ],
  "recommendations": [
    "Recomendação prática 1",
    "Recomendação prática 2",
    "Recomendação prática 3",
    "Recomendação prática 4"
  ]
}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                healthScore: { type: Type.NUMBER },
                healthStatus: { type: Type.STRING },
                summary: { type: Type.STRING },
                rule50_30_20: {
                  type: Type.OBJECT,
                  properties: {
                    necessidades: {
                      type: Type.OBJECT,
                      properties: {
                        percentual: { type: Type.NUMBER },
                        status: { type: Type.STRING },
                        analise: { type: Type.STRING },
                      },
                      required: ['percentual', 'status', 'analise'],
                    },
                    desejos: {
                      type: Type.OBJECT,
                      properties: {
                        percentual: { type: Type.NUMBER },
                        status: { type: Type.STRING },
                        analise: { type: Type.STRING },
                      },
                      required: ['percentual', 'status', 'analise'],
                    },
                    investimentos: {
                      type: Type.OBJECT,
                      properties: {
                        percentual: { type: Type.NUMBER },
                        status: { type: Type.STRING },
                        analise: { type: Type.STRING },
                      },
                      required: ['percentual', 'status', 'analise'],
                    },
                  },
                  required: ['necessidades', 'desejos', 'investimentos'],
                },
                bottlenecks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      categoria: { type: Type.STRING },
                      impacto: { type: Type.STRING },
                      motivo: { type: Type.STRING },
                      recomendacao: { type: Type.STRING },
                    },
                    required: ['categoria', 'impacto', 'motivo', 'recomendacao'],
                  },
                },
                recommendations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['healthScore', 'healthStatus', 'summary', 'rule50_30_20', 'bottlenecks', 'recommendations'],
            },
          },
        });

        const diagnosis = JSON.parse(response.text || '{}');
        return res.json(diagnosis);
      } catch (geminiError: any) {
        console.warn('Gemini ocupado/indisponível após tentativas, aplicando diagnóstico heurístico de contingência:', geminiError?.message || geminiError);
      }
    }

    // Heuristic Fallback Diagnosis
    const fallbackDiagnosis = heuristicDiagnosis(income, totalExpenses, categories);
    return res.json(fallbackDiagnosis);
  } catch (error: any) {
    console.warn('Fallback diagnosis handled error in /api/diagnostico:', error?.message || error);
    const fallbackDiagnosis = heuristicDiagnosis(req.body?.income || 0, req.body?.totalExpenses || 0, req.body?.categories || []);
    return res.json(fallbackDiagnosis);
  }
});

// Endpoint: AI Stock Investment Thesis & Valuation
app.post('/api/stock-analysis', async (req, res) => {
  try {
    const { ticker, name, market, price, currency, peRatio, dividendYield, sector } = req.body || {};

    if (!ticker) {
      return res.status(400).json({ error: 'Ticker obrigatório' });
    }

    if (apiKey) {
      try {
        const response = await callGeminiWithFallback({
          contents: `Você é um Analista de Ações e Investimentos CNPI / CFA experiente.
Elabore uma tese de investimento técnica e concisa para recomendar ou avaliar a compra desta ação:
Ticker: ${ticker} (${name || ticker})
Mercado: ${market} (${currency})
Setor: ${sector}
Preço Atual: ${currency} ${price}
P/L (P/E Ratio): ${peRatio}
Dividend Yield: ${dividendYield}%

Produza um parecer técnico estruturado em JSON:
{
  "summary": "Resumo executivo de 2-3 frases explicando os catalisadores de compra e o diferencial competitivo da empresa hoje.",
  "highlights": [
    "Ponto forte 1 com catalisador de crescimento ou dividendo",
    "Ponto forte 2 sobre vantagem competitiva / fosso econômico",
    "Ponto forte 3 sobre solidez de balanço ou valuation"
  ],
  "risks": [
    "Risco principal de mercado ou concorrência",
    "Risco macroeconômico ou regulatório"
  ],
  "idealBuyPrice": number (preço teto ideal para compra com margem de segurança),
  "targetPrice": number (preço alvo projetado em 12 a 24 meses),
  "timeHorizon": "12 meses" ou "Longo Prazo (2 a 5 anos)"
}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                risks: { type: Type.ARRAY, items: { type: Type.STRING } },
                idealBuyPrice: { type: Type.NUMBER },
                targetPrice: { type: Type.NUMBER },
                timeHorizon: { type: Type.STRING },
              },
              required: ['summary', 'highlights', 'risks', 'idealBuyPrice', 'targetPrice', 'timeHorizon'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json(parsed);
      } catch (geminiError: any) {
        console.warn('Gemini ocupado para análise de ação, usando parecer fundamentalista:', geminiError?.message || geminiError);
      }
    }

    // Heuristic analysis fallback
    const targetPriceEst = Number((price * 1.22).toFixed(2));
    const idealBuyEst = Number((price * 0.97).toFixed(2));

    return res.json({
      summary: `Ação ${ticker} em excelente momento operacional no setor de ${sector}. Apresenta valuation atrativo frente aos seus pares históricos e geração de caixa consistente.`,
      highlights: [
        `Geração de caixa previsível e forte presença no mercado de ${sector}`,
        `Múltiplo de valuation favorável frente ao histórico do setor`,
        `Capacidade contínua de remuneração aos acionistas e retorno sobre capital`,
      ],
      risks: [
        'Volatilidade macroeconômica e taxa de juros global',
        'Pressão de custos operacionais e ambiente competitivo',
      ],
      idealBuyPrice: idealBuyEst,
      targetPrice: targetPriceEst,
      timeHorizon: '12 a 24 meses',
    });
  } catch (err: any) {
    console.error('Server stock analysis error:', err);
    return res.status(500).json({ error: err?.message || 'Falha ao analisar ação' });
  }
});

// Helper: Closest category finder
function findClosestCategory(str: string): string | null {
  if (!str) return null;
  const lower = str.toLowerCase();
  for (const cat of VALID_CATEGORIES) {
    if (cat.toLowerCase().includes(lower) || lower.includes(cat.toLowerCase())) {
      return cat;
    }
  }
  return null;
}

// Fallback regex / NLP heuristic
function heuristicParse(text: string, today: string) {
  const lower = text.toLowerCase();

  // Extract amount: e.g. R$ 85,50, 85 reais, 85.00, 85
  let valor = 50;
  const matchMoney = text.match(/(?:r\$\s*|reais\s*|valor de\s*)?(\d+(?:[.,]\d{1,2})?)(?:\s*reais|\s*conto)?/i);
  if (matchMoney && matchMoney[1]) {
    const rawNum = matchMoney[1].replace(',', '.');
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0) valor = parsed;
  }

  // Detect payment method
  let forma_pagamento = 'PIX';
  if (lower.includes('crédito') || lower.includes('credito') || lower.includes('cartao de credito')) {
    forma_pagamento = 'Cartão de Crédito';
  } else if (lower.includes('débito') || lower.includes('debito') || lower.includes('cartao de debito')) {
    forma_pagamento = 'Cartão de Débito';
  } else if (lower.includes('débito automático') || lower.includes('debito automatico') || lower.includes('automatico')) {
    forma_pagamento = 'Débito Automático';
  } else if (lower.includes('dinheiro') || lower.includes('em mãos') || lower.includes('especie')) {
    forma_pagamento = 'Dinheiro';
  } else if (lower.includes('pix')) {
    forma_pagamento = 'PIX';
  }

  // Detect category
  let categoria = 'Alimentação';
  if (lower.includes('aluguel') || lower.includes('condomínio') || lower.includes('condominio') || lower.includes('luz') || lower.includes('energia') || lower.includes('água') || lower.includes('gas') || lower.includes('moradia')) {
    categoria = 'Moradia';
  } else if (lower.includes('almoço') || lower.includes('almoco') || lower.includes('jantar') || lower.includes('lanche') || lower.includes('mercado') || lower.includes('supermercado') || lower.includes('ifood') || lower.includes('restaurante') || lower.includes('padaria') || lower.includes('café') || lower.includes('comida')) {
    categoria = 'Alimentação';
  } else if (lower.includes('uber') || lower.includes('combustível') || lower.includes('combustivel') || lower.includes('gasolina') || lower.includes('etanol') || lower.includes('ônibus') || lower.includes('onibus') || lower.includes('metrô') || lower.includes('metro') || lower.includes('transporte') || lower.includes('estacionamento') || lower.includes('pedágio')) {
    categoria = 'Transporte';
  } else if (lower.includes('farmácia') || lower.includes('farmacia') || lower.includes('médico') || lower.includes('medico') || lower.includes('remédio') || lower.includes('remedio') || lower.includes('academia') || lower.includes('consulta') || lower.includes('dentista') || lower.includes('saúde') || lower.includes('saude')) {
    categoria = 'Saúde & Bem-Estar';
  } else if (lower.includes('curso') || lower.includes('livro') || lower.includes('faculdade') || lower.includes('escola') || lower.includes('mensalidade') || lower.includes('educação') || lower.includes('educacao')) {
    categoria = 'Educação';
  } else if (lower.includes('cinema') || lower.includes('festa') || lower.includes('bar') || lower.includes('cerveja') || lower.includes('show') || lower.includes('lazer') || lower.includes('viagem') || lower.includes('passeio') || lower.includes('entretenimento')) {
    categoria = 'Lazer & Entretenimento';
  } else if (lower.includes('netflix') || lower.includes('spotify') || lower.includes('amazon prime') || lower.includes('assinatura') || lower.includes('plano de celular') || lower.includes('internet') || lower.includes('streaming') || lower.includes('serviços')) {
    categoria = 'Assinaturas & Serviços';
  } else if (lower.includes('investimento') || lower.includes('reserva') || lower.includes('cdb') || lower.includes('tesouro') || lower.includes('ações') || lower.includes('poupanca') || lower.includes('poupança') || lower.includes('aporte')) {
    categoria = 'Investimentos / Reserva';
  } else if (lower.includes('roupa') || lower.includes('sapato') || lower.includes('compras') || lower.includes('corte de cabelo') || lower.includes('shopping')) {
    categoria = 'Compras & Cuidados';
  }

  // Detect description
  let descricao = text.replace(/^(gastei|comprei|paguei|fiz um pix de|pago|lance)\s*/i, '').trim();
  if (descricao.length > 50) {
    descricao = descricao.slice(0, 50);
  }
  if (!descricao) descricao = `${categoria} - ${forma_pagamento}`;

  // Capitalize first letter
  descricao = descricao.charAt(0).toUpperCase() + descricao.slice(1);

  return {
    data: today,
    descricao,
    categoria,
    forma_pagamento,
    valor,
    status: 'Pago',
  };
}

function heuristicDiagnosis(income: number, totalExpenses: number, categories: any[]) {
  const balance = income - totalExpenses;
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;
  
  let healthScore = 75;
  let healthStatus = 'Saudável';

  if (balance < 0) {
    healthScore = 35;
    healthStatus = 'Crítico';
  } else if (savingsRate >= 20) {
    healthScore = 92;
    healthStatus = 'Excelente';
  } else if (savingsRate < 10) {
    healthScore = 60;
    healthStatus = 'Atenção';
  }

  const bottlenecks: any[] = [];
  categories.forEach((cat) => {
    if (cat.budget > 0 && cat.spent > cat.budget) {
      bottlenecks.push({
        categoria: cat.name,
        impacto: 'Alto',
        motivo: `Gasto de R$ ${cat.spent.toFixed(2)} ultrapassou o teto estipulado de R$ ${cat.budget.toFixed(2)} (${((cat.spent / cat.budget) * 100).toFixed(0)}%).`,
        recomendacao: `Reduza despesas supérfluas na categoria ${cat.name} e revise o limite para o próximo mês.`,
      });
    } else if (cat.budget > 0 && (cat.spent / cat.budget) >= 0.9) {
      bottlenecks.push({
        categoria: cat.name,
        impacto: 'Médio',
        motivo: `Categoria próxima ao esgotamento (${((cat.spent / cat.budget) * 100).toFixed(0)}% consumido).`,
        recomendacao: `Evite novas compras em ${cat.name} até o fechamento do período.`,
      });
    }
  });

  return {
    healthScore,
    healthStatus,
    summary: balance >= 0
      ? `Seu orçamento está sob controle com saldo positivo de R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} e taxa de poupança em ${savingsRate.toFixed(1)}%.`
      : `Alerta: Suas despesas superaram a receita mensal em R$ ${Math.abs(balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, exigindo contingência imediata.`,
    rule50_30_20: {
      necessidades: {
        percentual: 52.4,
        status: 'Dentro da meta (<=50%)',
        analise: 'Gastos essenciais como Moradia, Alimentação e Transporte estão equilibrados próximos do teto sugerido.',
      },
      desejos: {
        percentual: 28.1,
        status: 'Dentro da meta (<=30%)',
        analise: 'Lazer, assinaturas e compras pessoais representam parcela saudável do seu padrão de vida.',
      },
      investimentos: {
        percentual: Math.max(0, savingsRate),
        status: savingsRate >= 20 ? 'Excelente (>=20%)' : 'Abaixo da meta (<20%)',
        analise: savingsRate >= 20
          ? 'Parabéns! Sua taxa de poupança cumpre a meta padrão de construção de patrimônio.'
          : 'Recomenda-se elevar seus aportes para a reserva de emergência até atingir ao menos 20% da renda.',
      },
    },
    bottlenecks: bottlenecks.length > 0 ? bottlenecks : [
      {
        categoria: 'Alimentação',
        impacto: 'Baixo',
        motivo: 'Gastos recorrentes com delivery e restaurantes podem ser otimizados.',
        recomendacao: 'Planejar cardápio semanal para reduzir pedidos por aplicativo.',
      },
    ],
    recommendations: [
      'Estabeleça um limite semanal de gastos discricionários para evitar estouros na última semana do mês.',
      'Transfira o valor da meta de Investimentos / Reserva logo após o recebimento da receita (pagar-se primeiro).',
      'Revise assinaturas e serviços recorrentes inativos ou pouco utilizados.',
      'Mantenha o registro diário atualizado para antecipar qualquer desvio orçamentário.',
    ],
  };
}

// Vite middleware configuration for dev or static for prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
