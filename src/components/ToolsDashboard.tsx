import React from 'react';
import {
  Wallet,
  Calculator,
  ArrowRight,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  BadgePercent,
  Landmark,
  LogOut,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  Scale,
  Settings,
  User as UserIcon,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeToggle } from './ThemeToggle';

export type ToolId =
  | 'finance_manager'
  | 'amortization_calc'
  | 'stock_advisor'
  | 'consignado_sim'
  | 'margem_calc'
  | 'quitar_dividas';

interface ToolsDashboardProps {
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userPhoto?: string;
  isGuest?: boolean;
  onSelectTool: (toolId: ToolId) => void;
  onOpenProfile?: () => void;
  onLogout: () => void;
}

interface ToolCard {
  id: ToolId;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  features: string[];
  isAvailable: boolean;
}

export const ToolsDashboard: React.FC<ToolsDashboardProps> = ({
  userName,
  userEmail,
  userPhone,
  userPhoto,
  isGuest,
  onSelectTool,
  onOpenProfile,
  onLogout,
}) => {
  const tools: ToolCard[] = [
    {
      id: 'finance_manager',
      title: 'Gestão Financeira & Orçamento',
      subtitle: 'Controle inteligente de gastos e metas 50-30-20',
      badge: 'Ativo & Disponível',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description:
        'Planeje seus meses, registre despesas, defina metas para necessidades/desejos/investimentos e receba diagnóstico executivo gerado por Inteligência Artificial.',
      icon: Wallet,
      iconBg: 'bg-teal-50 border-teal-200',
      iconColor: 'text-teal-800',
      features: [
        'Diagnóstico Financeiro com IA (Google Gemini)',
        'Classificação automática e metas de orçamento',
        'Controle mês a mês com persistência segura',
        'Exportação de relatórios em CSV',
      ],
      isAvailable: true,
    },
    {
      id: 'stock_advisor',
      title: 'Radar de Ações & Google Finance (B3 & EUA)',
      subtitle: 'Top 10 do dia, valuation, gráficos interativos e simulador de aporte',
      badge: 'Novo & Ativo',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      description:
        'Acompanhe as 10 melhores ações para comprar no dia (Brasil e Wall Street), explore gráficos e históricos interativos, simule compras inteligentes de cotas e analise fundamentos.',
      icon: TrendingUp,
      iconBg: 'bg-emerald-50 border-emerald-200',
      iconColor: 'text-emerald-700',
      features: [
        'Top 10 melhores ações para comprar hoje (B3 e Wall Street)',
        'Gráficos interativos com períodos (1D, 5D, 1M, 6M, 1A, 5A)',
        'Simulador inteligente de alocação de compras e dividendos',
        'Integração oficial com Google Finance e teses com IA',
      ],
      isAvailable: true,
    },
    {
      id: 'amortization_calc',
      title: 'Calculadora de Amortização Extraordinária',
      subtitle: 'Simule quitação antecipada, corte de anos e economia de juros',
      badge: 'Ativo & Disponível',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description:
        'Compare o impacto de amortizações extras no seu financiamento imobiliário ou empréstimo (SAC ou Price). Descubra quanto você economiza e se vale mais a pena reduzir prazo ou parcela.',
      icon: Calculator,
      iconBg: 'bg-emerald-50 border-emerald-200',
      iconColor: 'text-emerald-700',
      features: [
        'Sistemas SAC e Tabela Price (Caixa, Bancos e Imobiliário)',
        'Estratégias: Redução de Prazo vs. Redução de Parcela',
        'Aportes recorrentes e pontuais (FGTS, 13º salário, bônus)',
        'Cronograma detalhado mês a mês e exportação para Excel/CSV',
      ],
      isAvailable: true,
    },
    {
      id: 'margem_calc',
      title: 'Calculadora de Margem Consignável',
      subtitle: 'Simule sua capacidade de crédito consignado',
      badge: 'Em Breve',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      description:
        'Calcule exatamente quanto da sua renda líquida mensal (INSS, Servidor Público ou CLT) pode ser comprometida com margem livre para consignado ou cartão benefício.',
      icon: Calculator,
      iconBg: 'bg-indigo-50 border-indigo-200',
      iconColor: 'text-indigo-700',
      features: [
        'Cálculo de margem de 35% e cartão de 5%',
        'Compatível com INSS, SIAPE e Governos Estaduais',
        'Estimativa de valor liberado na conta',
      ],
      isAvailable: false,
    },
    {
      id: 'consignado_sim',
      title: 'Simulador de Portabilidade & Redução de Juros',
      subtitle: 'Compare taxas e descubra troco em dinheiro',
      badge: 'Em Breve',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      description:
        'Analise seus contratos de empréstimo atuais e descubra quanto você economiza reduzindo as parcelas ou recebendo troco à vista com a Consignatec.',
      icon: TrendingUp,
      iconBg: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-700',
      features: [
        'Comparador de taxas de juros nominais e CET',
        'Cálculo de troco disponível para resgate',
        'Redução imediata do valor das parcelas',
      ],
      isAvailable: false,
    },
    {
      id: 'quitar_dividas',
      title: 'Planejador de Quitação de Dívidas',
      subtitle: 'Método bola de neve e redução de juros caros',
      badge: 'Em Breve',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      description:
        'Estratégia prática para eliminar juros abusivos de rotativo do cartão e cheque especial, trocando por linhas saudáveis e planejando a liberdade financeira.',
      icon: Scale,
      iconBg: 'bg-rose-50 border-rose-200',
      iconColor: 'text-rose-700',
      features: [
        'Comparação entre Método Bola de Neve e Avalanche',
        'Priorização automática das dívidas mais caras',
        'Cronograma estimado de quitação total',
      ],
      isAvailable: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-teal-500 selection:text-white flex flex-col transition-colors duration-200">
      {/* Header Corporativo Consignatec */}
      <header className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-teal-800 dark:bg-teal-700 text-white flex items-center justify-center shadow-sm shadow-teal-900/20 shrink-0">
              <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  Consignatec
                </h1>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shrink-0 hidden sm:inline-block">
                  Hub de Ferramentas
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Central de Ferramentas &bull; consignatec.com.br
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* PWA Install Quick Action */}
            <PWAInstallButton variant="header" />

            {/* Global Theme Toggle */}
            <ThemeToggle showLabel={false} />

            {onOpenProfile && (
              <button
                type="button"
                onClick={onOpenProfile}
                title="Configurações da Conta (Nome, E-mail, Senha, Celular)"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 hover:text-teal-800 dark:hover:text-teal-300 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer touch-manipulation"
              >
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt={userName || 'Perfil'}
                    className="h-6 w-6 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-lg bg-teal-800 dark:bg-teal-700 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                    {userName ? userName.slice(0, 1).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold leading-tight text-slate-900 dark:text-white">
                    {userName ? userName.split(' ')[0] : 'Minha Conta'}
                  </span>
                  <span className="text-[10px] text-teal-700 dark:text-teal-400 font-medium">Configurações</span>
                </div>
                <Settings className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </button>
            )}

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 rounded-xl transition-colors cursor-pointer touch-manipulation"
              title="Sair da conta"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10 flex-1 w-full space-y-5 sm:space-y-8">
        {/* Welcome Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 shadow-xs relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl relative z-10 space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Plataforma Integrada Consignatec</span>
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Olá, {userName ? userName.split(' ')[0] : 'seja bem-vindo(a)'}! Escolha uma ferramenta:
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Tenha controle total sobre suas receitas, despesas, planejamento e simulações de crédito.
              Selecione abaixo o módulo que deseja utilizar no momento:
            </p>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 flex flex-col justify-between p-5 sm:p-7 relative ${
                  tool.isAvailable
                    ? 'border-slate-200/90 dark:border-slate-800 hover:border-teal-500/60 dark:hover:border-teal-500/60 hover:shadow-lg hover:shadow-teal-900/5 dark:hover:shadow-teal-950/40 cursor-pointer ring-1 ring-transparent hover:ring-teal-500/20 active:scale-[0.99]'
                    : 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 opacity-80'
                }`}
                onClick={() => {
                  if (tool.isAvailable) {
                    onSelectTool(tool.id);
                  }
                }}
              >
                <div className="space-y-3 sm:space-y-4">
                  {/* Top line: Icon & Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center border ${tool.iconBg} ${tool.iconColor} shrink-0 dark:bg-slate-800 dark:border-slate-700`}
                    >
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>

                    <span
                      className={`text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border ${tool.badgeColor} shrink-0 dark:bg-slate-800 dark:text-teal-300 dark:border-slate-700`}
                    >
                      {tool.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {tool.subtitle}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  {/* Bullet features */}
                  <ul className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {tool.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {tool.isAvailable ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTool(tool.id);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                    >
                      <span>Acessar Ferramenta</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-semibold text-xs cursor-not-allowed border border-slate-200 dark:border-slate-700">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Módulo em desenvolvimento</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Support Info */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-center text-center gap-2.5 sm:gap-3 text-xs text-slate-600 dark:text-slate-300 max-w-2xl mx-auto shadow-xs">
          <ShieldCheck className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0" />
          <div className="text-center sm:text-left">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Ambiente Seguro &amp; Protegido
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Seus dados financeiros são criptografados e isolados por conta de usuário.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <p>
          Consignatec &copy; {new Date().getFullYear()} &mdash; Hub Central de Ferramentas e Soluções Financeiras.
        </p>
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
          Todos os direitos reservados &bull; consignatec.com.br
        </p>
      </footer>
    </div>
  );
};
