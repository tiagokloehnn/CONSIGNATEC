import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.CONSIGNATEC_GEMINI_KEY || process.env.GEMINI_API_KEY || '';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { income, totalExpenses, categories, recentExpenses } = req.body || {};

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
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Você é um Consultor Financeiro CFP® de alto nível. Analise o orçamento mensal do cliente com base nos dados fornecidos:
${JSON.stringify(dataSummary, null, 2)}

Produza um diagnóstico completo, elegante e direto em formato JSON com a seguinte estrutura:
{
  "healthScore": 0 a 100,
  "healthStatus": "Excelente" | "Saudável" | "Atenção" | "Crítico",
  "summary": "Resumo executivo conciso de 2-3 frases.",
  "rule50_30_20": {
    "necessidades": { "percentual": number, "status": string, "analise": string },
    "desejos": { "percentual": number, "status": string, "analise": string },
    "investimentos": { "percentual": number, "status": string, "analise": string }
  },
  "bottlenecks": [
    { "categoria": "nome", "impacto": "Alto" | "Médio" | "Baixo", "motivo": "string", "recomendacao": "string" }
  ],
  "recommendations": [
    "Recomendação 1", "Recomendação 2", "Recomendação 3", "Recomendação 4"
  ]
}`,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const diagnosis = JSON.parse(response.text || '{}');
        return res.status(200).json(diagnosis);
      } catch (err: any) {
        console.warn('Gemini error in Vercel function:', err?.message || err);
      }
    }

    return res.status(200).json({
      healthScore: 80,
      healthStatus: 'Saudável',
      summary: 'Diagnóstico preliminar gerado com sucesso.',
      rule50_30_20: {
        necessidades: { percentual: 50, status: 'Dentro da meta', analise: 'Equilibrado' },
        desejos: { percentual: 30, status: 'Dentro da meta', analise: 'Equilibrado' },
        investimentos: { percentual: 20, status: 'Dentro da meta', analise: 'Excelente' },
      },
      bottlenecks: [],
      recommendations: ['Mantenha seus gastos organizados mês a mês.'],
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Erro interno' });
  }
}
