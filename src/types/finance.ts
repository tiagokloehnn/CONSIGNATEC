export type CategoryName = string;

export interface CategoryItem {
  id: string;
  name: string;
  budget: number;
  color: string;
  icon: string;
  classification: 'necessidades' | 'desejos' | 'investimentos';
}

export type PaymentMethod =
  | 'PIX'
  | 'Cartão de Crédito'
  | 'Cartão de Débito'
  | 'Débito Automático'
  | 'Dinheiro';

export type ExpenseStatus = 'Pago' | 'Pendente' | 'Agendado';

export interface Expense {
  id: string;
  data: string; // ISO YYYY-MM-DD
  descricao: string;
  categoria: CategoryName;
  forma_pagamento: PaymentMethod;
  valor: number;
  status: ExpenseStatus;
}

export type CategoryStatusType =
  | 'Sem Orçamento'
  | 'Dentro da Meta'
  | 'Atenção'
  | 'Estourado';

export interface CategoryBudgetInfo {
  name: CategoryName;
  budget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: CategoryStatusType;
  color: string;
  bgLight: string;
  iconName: string;
}

export interface Rule503020Item {
  percentual: number;
  status: string;
  analise: string;
}

export interface FinancialBottleneck {
  categoria: string;
  impacto: 'Alto' | 'Médio' | 'Baixo';
  motivo: string;
  recomendacao: string;
}

export interface FinancialDiagnosis {
  healthScore: number;
  healthStatus: 'Excelente' | 'Saudável' | 'Atenção' | 'Crítico';
  summary: string;
  rule50_30_20: {
    necessidades: Rule503020Item;
    desejos: Rule503020Item;
    investimentos: Rule503020Item;
  };
  bottlenecks: FinancialBottleneck[];
  recommendations: string[];
}
