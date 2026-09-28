import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.CONSIGNATEC_GEMINI_KEY || process.env.GEMINI_API_KEY || '';

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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { text, referenceDate, availableCategories } = req.body || {};
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
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Você é um assistente financeiro especialista. Analise a frase do usuário descrevendo um gasto e extraia os campos obrigatórios.
Data de referência atual (hoje): ${todayStr}.
Frase: "${text}"

Regras:
1. "categoria" DEVE ser uma destas opções disponíveis no orçamento do usuário: ${categoryOptions.join(', ')}.
2. "forma_pagamento" DEVE ser estritamente uma destas opções: ${VALID_PAYMENTS.join(', ')}. Se não especificado, deduza pelo contexto ou use "PIX".
3. "status" DEVE ser "Pago", "Pendente" ou "Agendado".
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
        return res.status(200).json(parsed);
      } catch (err: any) {
        console.warn('Gemini error in Vercel function:', err?.message || err);
      }
    }

    return res.status(200).json({
      data: todayStr,
      descricao: text,
      categoria: 'Alimentação',
      forma_pagamento: 'PIX',
      valor: 50,
      status: 'Pago',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Erro interno' });
  }
}
