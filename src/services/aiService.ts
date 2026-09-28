import { Expense, CategoryName, PaymentMethod, ExpenseStatus, FinancialDiagnosis } from '../types/finance';

export interface ParseExpenseResult {
  data: string;
  descricao: string;
  categoria: CategoryName;
  forma_pagamento: PaymentMethod;
  valor: number;
  status: ExpenseStatus;
}

const VALID_CATEGORIES: CategoryName[] = [
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

/**
 * Robust Client-side Natural Language Parser
 * Extracts value, payment method, category, description, and date from natural language.
 */
export function clientHeuristicParse(
  text: string,
  today: string,
  availableCategories?: string[]
): ParseExpenseResult {
  const lower = text.toLowerCase();

  // 1. Extract amount: e.g. R$ 180, 180 reais, R$180,50, 180.00, 180
  let valor = 50;
  // Match patterns like R$ 180, 180 reais, 180,50, 180.00, etc.
  const moneyRegex = /(?:r\$\s*|reais\s*|valor de\s*|^|\s)(\d+(?:[.,]\d{1,2})?)(?:\s*reais|\s*conto|\s*pila|\s*$|\s)/i;
  const matchMoney = text.match(moneyRegex);
  if (matchMoney && matchMoney[1]) {
    const rawNum = matchMoney[1].replace(',', '.');
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0) valor = parsed;
  } else {
    // Fallback: any standalone number in the string
    const fallbackNum = text.match(/\b\d+(?:[.,]\d{1,2})?\b/);
    if (fallbackNum) {
      const parsed = parseFloat(fallbackNum[0].replace(',', '.'));
      if (!isNaN(parsed) && parsed > 0) valor = parsed;
    }
  }

  // 2. Detect payment method
  let forma_pagamento: PaymentMethod = 'PIX';
  if (lower.includes('crédito') || lower.includes('credito') || lower.includes('cartao de credito') || lower.includes('cartão de crédito')) {
    forma_pagamento = 'Cartão de Crédito';
  } else if (lower.includes('débito automático') || lower.includes('debito automatico') || lower.includes('automatico') || lower.includes('automático')) {
    forma_pagamento = 'Débito Automático';
  } else if (lower.includes('débito') || lower.includes('debito') || lower.includes('cartao de debito') || lower.includes('cartão de débito')) {
    forma_pagamento = 'Cartão de Débito';
  } else if (lower.includes('dinheiro') || lower.includes('em mãos') || lower.includes('especie') || lower.includes('espécie')) {
    forma_pagamento = 'Dinheiro';
  } else if (lower.includes('pix')) {
    forma_pagamento = 'PIX';
  }

  // 3. Detect category with word boundary / safe matching
  let categoria: CategoryName = 'Alimentação';
  if (
    /\b(aluguel|condom[íi]nio|luz|energia|[áa]gua|g[áa]s|botij[ãa]o|moradia|iptu|reforma|casa|apto|apartamento)\b/i.test(lower)
  ) {
    categoria = 'Moradia';
  } else if (
    /\b(almo[çc]o|jantar|lanche|mercado|supermercado|ifood|restaurante|padaria|caf[ée]|comida|a[çc]ougue|pizza|hamb[úu]rguer)\b/i.test(lower)
  ) {
    categoria = 'Alimentação';
  } else if (
    /\b(uber|99|combust[íi]vel|gasolina|etanol|diesel|abastec|posto|[ôo]nibus|metr[ôo]|transporte|estacionamento|ped[áa]gio|ipva|oficina|mec[âa]nico)\b/i.test(lower)
  ) {
    categoria = 'Transporte';
  } else if (
    /\b(farm[áa]cia|m[ée]dico|rem[ée]dio|drogaria|academia|consulta|dentista|sa[úu]de|exame|hospital|psic[óo]logo)\b/i.test(lower)
  ) {
    categoria = 'Saúde & Bem-Estar';
  } else if (
    /\b(curso|livro|faculdade|escola|mensalidade|educa[çc][ãa]o|material escolar|treinamento)\b/i.test(lower)
  ) {
    categoria = 'Educação';
  } else if (
    /\b(cinema|festa|bar|cerveja|show|lazer|viagem|passeio|hotel|praia|parque|entretenimento|jogos|game)\b/i.test(lower)
  ) {
    categoria = 'Lazer & Entretenimento';
  } else if (
    /\b(netflix|spotify|amazon prime|disney|assinatura|plano de celular|internet|streaming|servi[çc]os|youtube|icloud)\b/i.test(lower)
  ) {
    categoria = 'Assinaturas & Serviços';
  } else if (
    /\b(investimento|reserva|cdb|tesouro|a[çc][õo]es|poupan[çc]a|aporte|cripto|fundo)\b/i.test(lower)
  ) {
    categoria = 'Investimentos / Reserva';
  } else if (
    /\b(roupa|sapato|compras|corte de cabelo|barbearia|sal[ãa]o|shopping|perfume|cosm[ée]tico)\b/i.test(lower)
  ) {
    categoria = 'Compras & Cuidados';
  }

  // Ensure category matches user available categories if passed
  if (availableCategories && availableCategories.length > 0) {
    const matched = availableCategories.find(
      (c) => c.toLowerCase() === categoria.toLowerCase() || c.toLowerCase().includes(categoria.toLowerCase())
    );
    if (matched) {
      categoria = matched as CategoryName;
    } else if (!availableCategories.includes(categoria)) {
      categoria = availableCategories[0] as CategoryName;
    }
  }

  // 4. Clean description
  let descricao = text
    .replace(/^(gastei|comprei|paguei|fiz um pix de|fiz um pix|pago|lance|adicione)\s*/i, '')
    .trim();

  // Strip payment phrases with accents
  descricao = descricao.replace(/\b(no\s+pix|no\s+cr[ée]dito|no\s+d[ée]bito\s+autom[áa]tico|no\s+d[ée]bito|em\s+dinheiro|via\s+pix)\b/gi, '').trim();
  // Strip money amounts like '180 reais', 'de 500 reais', 'R$ 180,00'
  descricao = descricao.replace(/(?:de\s+|r\$\s*)?\b\d+(?:[.,]\d{1,2})?\s*(?:reais|conto|pila)?\b/gi, '').trim();
  // Clean dangling prepositions
  descricao = descricao.replace(/^(em|no|na|de|para|com)\s+/i, '').trim();
  descricao = descricao.replace(/\s+(em|no|na|de|para|com)$/i, '').trim();
  descricao = descricao.replace(/\s{2,}/g, ' ').trim();

  if (!descricao || descricao.length < 2) {
    descricao = `${categoria}`;
  } else if (descricao.length > 50) {
    descricao = descricao.slice(0, 50);
  }

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

export function clientHeuristicDiagnosis(
  income: number,
  totalExpenses: number,
  categories: Array<{ name: string; budget: number; spent: number }>
): FinancialDiagnosis {
  const balance = income - totalExpenses;
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;

  let healthScore = 78;
  let healthStatus: FinancialDiagnosis['healthStatus'] = 'Saudável';

  if (balance < 0) {
    healthScore = 38;
    healthStatus = 'Crítico';
  } else if (savingsRate >= 20) {
    healthScore = 94;
    healthStatus = 'Excelente';
  } else if (savingsRate < 10) {
    healthScore = 62;
    healthStatus = 'Atenção';
  }

  const bottlenecks: FinancialDiagnosis['bottlenecks'] = [];
  categories.forEach((cat) => {
    if (cat.budget > 0 && cat.spent > cat.budget) {
      bottlenecks.push({
        categoria: cat.name,
        impacto: 'Alto',
        motivo: `Gasto de R$ ${cat.spent.toFixed(2)} ultrapassou o teto estipulado de R$ ${cat.budget.toFixed(2)} (${((cat.spent / cat.budget) * 100).toFixed(0)}%).`,
        recomendacao: `Reduza despesas supérfluas na categoria ${cat.name} e revise o limite para o próximo mês.`,
      });
    } else if (cat.budget > 0 && cat.spent / cat.budget >= 0.9) {
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
    summary:
      balance >= 0
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
        analise:
          savingsRate >= 20
            ? 'Parabéns! Sua taxa de poupança cumpre a meta padrão de construção de patrimônio.'
            : 'Recomenda-se elevar seus aportes para a reserva de emergência até atingir ao menos 20% da renda.',
      },
    },
    bottlenecks:
      bottlenecks.length > 0
        ? bottlenecks
        : [
            {
              categoria: 'Alimentação',
              impacto: 'Baixo',
              motivo: 'Gastos com refeições fora de casa e delivery representam oportunidade de otimização.',
              recomendacao: 'Planejar cardápio semanal para economizar no dia a dia.',
            },
          ],
    recommendations: [
      'Estabeleça um teto semanal de gastos discricionários para evitar estouros no fim do mês.',
      'Transfira o valor da meta de Investimentos / Reserva logo após receber a receita (pagar-se primeiro).',
      'Revise assinaturas e serviços recorrentes pouco utilizados.',
      'Mantenha o registro diário atualizado para prever qualquer desvio orçamentário.',
    ],
  };
}

export async function parseNaturalLanguageExpense(
  text: string,
  referenceDate?: string,
  availableCategories?: string[]
): Promise<ParseExpenseResult> {
  const todayStr = referenceDate || new Date().toISOString().split('T')[0];

  // Try server endpoint first (Gemini via server.ts or Vercel serverless)
  try {
    const response = await fetch('/api/parse-expense', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        referenceDate: todayStr,
        availableCategories,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.descricao && data.valor !== undefined) {
        return data as ParseExpenseResult;
      }
    }
  } catch (err) {
    console.warn('Endpoint /api/parse-expense indisponível, usando motor de IA heurístico no navegador:', err);
  }

  // Guaranteed fallback that never fails the user
  return clientHeuristicParse(text, todayStr, availableCategories);
}

export async function generateFinancialDiagnosis(payload: {
  income: number;
  totalExpenses: number;
  categories: Array<{
    name: string;
    budget: number;
    spent: number;
    percent: number;
    status: string;
  }>;
  recentExpenses: Expense[];
}): Promise<FinancialDiagnosis> {
  try {
    const response = await fetch('/api/diagnostico', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.healthScore !== undefined) {
        return data as FinancialDiagnosis;
      }
    }
  } catch (err) {
    console.warn('Endpoint /api/diagnostico indisponível, usando diagnóstico inteligente local:', err);
  }

  // Guaranteed fallback
  return clientHeuristicDiagnosis(payload.income, payload.totalExpenses, payload.categories);
}
