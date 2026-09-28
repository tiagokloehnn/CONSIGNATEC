import { CategoryName, PaymentMethod, Expense, CategoryItem, CategoryStatusType } from '../types/finance';

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-moradia',
    name: 'Moradia',
    budget: 2400.0,
    color: '#0F766E', // Verde Petróleo
    icon: 'Home',
    classification: 'necessidades',
  },
  {
    id: 'cat-alimentacao',
    name: 'Alimentação',
    budget: 1500.0,
    color: '#0284C7', // Azul Céu
    icon: 'UtensilsCrossed',
    classification: 'necessidades',
  },
  {
    id: 'cat-transporte',
    name: 'Transporte',
    budget: 800.0,
    color: '#D97706', // Âmbar
    icon: 'Car',
    classification: 'necessidades',
  },
  {
    id: 'cat-saude',
    name: 'Saúde & Bem-Estar',
    budget: 500.0,
    color: '#E11D48', // Rosa/Carmesim
    icon: 'HeartPulse',
    classification: 'necessidades',
  },
  {
    id: 'cat-educacao',
    name: 'Educação',
    budget: 450.0,
    color: '#7C3AED', // Violeta
    icon: 'GraduationCap',
    classification: 'desejos',
  },
  {
    id: 'cat-lazer',
    name: 'Lazer & Entretenimento',
    budget: 600.0,
    color: '#EA580C', // Laranja
    icon: 'Sparkles',
    classification: 'desejos',
  },
  {
    id: 'cat-assinaturas',
    name: 'Assinaturas & Serviços',
    budget: 220.0,
    color: '#4F46E5', // Índigo
    icon: 'Tv',
    classification: 'desejos',
  },
  {
    id: 'cat-compras',
    name: 'Compras & Cuidados',
    budget: 400.0,
    color: '#DB2777', // Rosa
    icon: 'ShoppingBag',
    classification: 'desejos',
  },
  {
    id: 'cat-investimentos',
    name: 'Investimentos / Reserva',
    budget: 1630.0,
    color: '#059669', // Esmeralda
    icon: 'TrendingUp',
    classification: 'investimentos',
  },
];

export const AVAILABLE_CATEGORY_ICONS = [
  { id: 'Home', label: 'Moradia / Casa' },
  { id: 'UtensilsCrossed', label: 'Alimentação / Gastronomia' },
  { id: 'Car', label: 'Transporte / Veículo' },
  { id: 'HeartPulse', label: 'Saúde & Bem-Estar' },
  { id: 'GraduationCap', label: 'Educação / Cursos' },
  { id: 'Sparkles', label: 'Lazer / Diversão' },
  { id: 'Tv', label: 'Assinaturas & Streaming' },
  { id: 'ShoppingBag', label: 'Compras / Roupas' },
  { id: 'TrendingUp', label: 'Investimentos / Aportes' },
  { id: 'PawPrint', label: 'Pets / Veterinário' },
  { id: 'Plane', label: 'Viagens & Férias' },
  { id: 'Dumbbell', label: 'Fitness & Academia' },
  { id: 'Baby', label: 'Filhos & Família' },
  { id: 'Gift', label: 'Presentes & Doações' },
  { id: 'Briefcase', label: 'Trabalho & Projetos' },
  { id: 'Coffee', label: 'Café & Lanches' },
  { id: 'Wrench', label: 'Manutenção & Obras' },
  { id: 'ShieldCheck', label: 'Seguros & Proteção' },
  { id: 'Smartphone', label: 'Telefonia & Internet' },
  { id: 'Tag', label: 'Outros' },
];

export const AVAILABLE_CATEGORY_COLORS = [
  '#0F766E', // Verde Petróleo
  '#0284C7', // Azul Céu
  '#D97706', // Âmbar
  '#E11D48', // Carmesim
  '#7C3AED', // Violeta
  '#EA580C', // Laranja
  '#4F46E5', // Índigo
  '#DB2777', // Rosa
  '#059669', // Esmeralda
  '#0891B2', // Ciano
  '#84CC16', // Lima
  '#6366F1', // Azul Royal
  '#64748B', // Ardósia
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Débito Automático',
  'Dinheiro',
];

export function getCategoryMeta(categoryName: string, customCategories?: CategoryItem[]) {
  if (customCategories) {
    const found = customCategories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
    if (found) {
      return {
        icon: found.icon || 'Tag',
        color: found.color || '#0F766E',
        bgBadge: 'bg-slate-50',
        textBadge: 'text-slate-800',
        borderBadge: 'border-slate-200',
        classification: found.classification || 'desejos',
      };
    }
  }

  const defaultFound = DEFAULT_CATEGORIES.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
  if (defaultFound) {
    return {
      icon: defaultFound.icon,
      color: defaultFound.color,
      bgBadge: 'bg-slate-50',
      textBadge: 'text-slate-800',
      borderBadge: 'border-slate-200',
      classification: defaultFound.classification,
    };
  }

  return {
    icon: 'Tag',
    color: '#0F766E',
    bgBadge: 'bg-slate-50',
    textBadge: 'text-slate-800',
    borderBadge: 'border-slate-200',
    classification: 'desejos' as const,
  };
}

/**
 * Padrão monetário brasileiro obrigatório: R$ #.##0,00
 */
export function formatBRL(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata data ISO (YYYY-MM-DD) para padrão nacional DD/MM/AAAA
 */
export function formatDateBR(isoDateString: string): string {
  if (!isoDateString) return '';
  const parts = isoDateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return isoDateString;
}

/**
 * Formata percentual com 1 casa decimal (ex: 25,4%)
 */
export function formatPercent(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0,0%';
  }
  return (
    value.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + '%'
  );
}

/**
 * Determina status orçamentário da categoria
 */
export function getCategoryStatus(budget: number, spent: number): CategoryStatusType {
  if (budget <= 0) {
    return 'Sem Orçamento';
  }
  const ratio = spent / budget;
  if (ratio > 1.0) {
    return 'Estourado';
  }
  if (ratio >= 0.9) {
    return 'Atenção';
  }
  return 'Dentro da Meta';
}

/**
 * Retorna classes CSS de status para tags e barras de progresso
 */
export function getStatusBadgeConfig(status: CategoryStatusType) {
  switch (status) {
    case 'Dentro da Meta':
      return {
        label: 'Dentro da Meta',
        icon: '🟢',
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        barColor: 'bg-emerald-500',
      };
    case 'Atenção':
      return {
        label: 'Atenção',
        icon: '🟡',
        bg: 'bg-amber-50 dark:bg-amber-950/60',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        barColor: 'bg-amber-500',
      };
    case 'Estourado':
      return {
        label: 'Estourado',
        icon: '🔴',
        bg: 'bg-rose-50 dark:bg-rose-950/60',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800',
        barColor: 'bg-rose-500',
      };
    case 'Sem Orçamento':
    default:
      return {
        label: 'Sem Orçamento',
        icon: '⚠️',
        bg: 'bg-slate-50 dark:bg-slate-800',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700',
        barColor: 'bg-slate-300 dark:bg-slate-700',
      };
  }
}

export const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const MONTH_NAMES_SHORT_PT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export const AVAILABLE_YEARS = [2024, 2025, 2026, 2027, 2028];

export function parseMonthYearString(label: string): { year: number; month: number } | null {
  if (!label || label === 'all') return null;
  const parts = label.trim().split(' ');
  if (parts.length === 2) {
    const monthIndex = MONTH_NAMES_PT.findIndex(
      (m) => m.toLowerCase() === parts[0].toLowerCase()
    );
    const year = parseInt(parts[1], 10);
    if (monthIndex >= 0 && !isNaN(year)) {
      return { year, month: monthIndex + 1 };
    }
  }
  return null;
}

export function monthYearToISOYearMonth(label: string): string {
  const parsed = parseMonthYearString(label);
  if (!parsed) return '';
  return `${parsed.year}-${String(parsed.month).padStart(2, '0')}`;
}

export function isoYearMonthToLabel(iso: string): string {
  if (!iso) return '';
  const [yearStr, monthStr] = iso.split('-');
  const monthNum = parseInt(monthStr, 10);
  if (monthNum >= 1 && monthNum <= 12) {
    return `${MONTH_NAMES_PT[monthNum - 1]} ${yearStr}`;
  }
  return iso;
}

export function getAvailableMonthsList(): string[] {
  const years = [2025, 2026, 2027];
  const list: string[] = [];
  years.forEach((yr) => {
    MONTH_NAMES_PT.forEach((m) => {
      list.push(`${m} ${yr}`);
    });
  });
  return list;
}

export function getShiftedMonthLabel(currentLabel: string, shift: number): string {
  const parsed = parseMonthYearString(currentLabel);
  if (!parsed) return currentLabel;
  let newMonth = parsed.month + shift;
  let newYear = parsed.year;
  while (newMonth > 12) {
    newMonth -= 12;
    newYear += 1;
  }
  while (newMonth < 1) {
    newMonth += 12;
    newYear -= 1;
  }
  return `${MONTH_NAMES_PT[newMonth - 1]} ${newYear}`;
}

export function getCurrentMonthLabel(): string {
  const now = new Date();
  return `${MONTH_NAMES_PT[now.getMonth()]} ${now.getFullYear()}`;
}

export const DEFAULT_ZERO_CATEGORIES: CategoryItem[] = DEFAULT_CATEGORIES.map((c) => ({
  ...c,
  budget: 0,
}));

export const DEFAULT_INCOME = 8500.0;

// Obter a data corrente em formato YYYY-MM-DD
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
const pad = (d: number) => String(d).padStart(2, '0');

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    data: `${currentYear}-${currentMonth}-${pad(Math.min(today.getDate(), 5))}`,
    descricao: 'Aluguel do Apartamento & Condomínio',
    categoria: 'Moradia',
    forma_pagamento: 'Débito Automático',
    valor: 2150.0,
    status: 'Pago',
  },
  {
    id: 'exp-2',
    data: `${currentYear}-${currentMonth}-${pad(Math.min(today.getDate(), 7))}`,
    descricao: 'Compras de Supermercado Mensal',
    categoria: 'Alimentação',
    forma_pagamento: 'Cartão de Crédito',
    valor: 820.4,
    status: 'Pago',
  },
  {
    id: 'exp-3',
    data: `${currentYear}-${currentMonth}-${pad(Math.min(today.getDate(), 10))}`,
    descricao: 'Abastecimento de Gasolina',
    categoria: 'Transporte',
    forma_pagamento: 'PIX',
    valor: 260.0,
    status: 'Pago',
  },
  {
    id: 'exp-4',
    data: `${currentYear}-${currentMonth}-${pad(Math.min(today.getDate(), 12))}`,
    descricao: 'Mensalidade da Academia',
    categoria: 'Saúde & Bem-Estar',
    forma_pagamento: 'Cartão de Crédito',
    valor: 149.9,
    status: 'Pago',
  },
  {
    id: 'exp-5',
    data: `${currentYear}-${currentMonth}-${pad(Math.min(today.getDate(), 14))}`,
    descricao: 'Plano de Saúde Coparticipação',
    categoria: 'Saúde & Bem-Estar',
    forma_pagamento: 'PIX',
    valor: 180.0,
    status: 'Pago',
  },
  {
    id: 'exp-6',
    data: `${currentYear}-${currentMonth}-${pad(Math.min(today.getDate(), 15))}`,
    descricao: 'Aporte Tesouro Direto Selic',
    categoria: 'Investimentos / Reserva',
    forma_pagamento: 'PIX',
    valor: 1200.0,
    status: 'Pago',
  },
  {
    id: 'exp-7',
    data: `${currentYear}-${currentMonth}-${pad(Math.min(today.getDate(), 16))}`,
    descricao: 'Assinaturas Netflix & Spotify',
    categoria: 'Assinaturas & Serviços',
    forma_pagamento: 'Cartão de Crédito',
    valor: 94.8,
    status: 'Pago',
  },
  {
    id: 'exp-8',
    data: `${currentYear}-${currentMonth}-${pad(Math.min(today.getDate(), 18))}`,
    descricao: 'Restaurante & Jantar com Família',
    categoria: 'Lazer & Entretenimento',
    forma_pagamento: 'Cartão de Crédito',
    valor: 245.5,
    status: 'Pago',
  },
  {
    id: 'exp-9',
    data: `${currentYear}-${currentMonth}-${pad(Math.min(today.getDate(), 20))}`,
    descricao: 'Feira Orgânica & Padaria',
    categoria: 'Alimentação',
    forma_pagamento: 'Cartão de Débito',
    valor: 185.0,
    status: 'Pago',
  },
  {
    id: 'exp-10',
    data: `${currentYear}-${currentMonth}-${pad(Math.min(today.getDate(), 22))}`,
    descricao: 'Curso Online de Especialização',
    categoria: 'Educação',
    forma_pagamento: 'Cartão de Crédito',
    valor: 199.0,
    status: 'Pago',
  },
  {
    id: 'exp-11',
    data: `${currentYear}-${currentMonth}-${pad(Math.min(today.getDate(), 25))}`,
    descricao: 'Conta de Energia Elétrica (Enel)',
    categoria: 'Moradia',
    forma_pagamento: 'PIX',
    valor: 210.3,
    status: 'Pendente',
  },
  {
    id: 'exp-12',
    data: `${currentYear}-${currentMonth}-${pad(Math.min(today.getDate(), 28))}`,
    descricao: 'Plano de Internet Fibra Óptica',
    categoria: 'Assinaturas & Serviços',
    forma_pagamento: 'Débito Automático',
    valor: 119.9,
    status: 'Agendado',
  },
];
