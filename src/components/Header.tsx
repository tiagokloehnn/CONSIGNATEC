import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  RotateCcw,
  Wallet,
  Cloud,
  CheckCircle2,
  LogOut,
  User as UserIcon,
  MoreVertical,
  Calendar,
  LayoutGrid,
  ChevronLeft,
  Settings,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { MonthYearPicker } from './MonthYearPicker';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeToggle } from './ThemeToggle';
import { FIREBASE_PROJECT_ID, FIRESTORE_DATABASE_ID } from '../services/firebase';

interface HeaderProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  activeMonths?: string[];
  onAddMonth?: (month: string) => void;
  onOpenDiagnosis: () => void;
  onExportData: () => void;
  onResetData: () => void;
  isCloudSynced?: boolean;
  currentUser?: {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    photoURL?: string;
    authProvider?: 'google' | 'password' | 'guest';
    isGuest?: boolean;
  } | null;
  onLogout?: () => void;
  onBackToTools?: () => void;
  onOpenProfile?: () => void;
  isGeneratingDiagnosis?: boolean;
  selectedMonthExpensesCount?: number;
  totalExpensesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMonth,
  onMonthChange,
  activeMonths = [],
  onAddMonth,
  onOpenDiagnosis,
  onExportData,
  onResetData,
  isCloudSynced = true,
  currentUser,
  onLogout,
  onBackToTools,
  onOpenProfile,
  isGeneratingDiagnosis = false,
}) => {
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showSyncInfoModal, setShowSyncInfoModal] = useState(false);

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        {/* DESKTOP & TABLET LAYOUT (md:flex) */}
        <div className="hidden md:flex md:items-center md:justify-between gap-3 lg:gap-4">
          {/* Logo & Title & Back to Tools Hub */}
          <div className="flex items-center gap-2.5 lg:gap-3 min-w-0">
            {onBackToTools && (
              <button
                type="button"
                onClick={onBackToTools}
                title="Voltar para a página principal de todas as ferramentas"
                className="inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-2 text-xs font-bold text-teal-900 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200/90 dark:border-teal-800 rounded-xl transition-all shadow-xs hover:shadow cursor-pointer active:scale-95 shrink-0"
              >
                <ChevronLeft className="h-4 w-4 text-teal-800 dark:text-teal-300" />
                <LayoutGrid className="h-3.5 w-3.5 text-teal-800 dark:text-teal-300" />
                <span className="hidden lg:inline">Todas as Ferramentas</span>
                <span className="lg:hidden">Ferramentas</span>
              </button>
            )}

            <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-xl bg-teal-800 dark:bg-teal-700 text-white flex items-center justify-center shadow-sm shadow-teal-900/20 shrink-0">
              <Wallet className="h-4 w-4 lg:h-5 lg:w-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5 lg:gap-2">
                <h1 className="text-lg lg:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  Consignatec
                </h1>
                <span className="text-[10px] lg:text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shrink-0 hidden sm:inline-block">
                  Gestão &amp; Orçamento
                </span>
              </div>
              <p className="text-[11px] lg:text-xs text-slate-500 dark:text-slate-400 truncate">
                Central de Ferramentas &bull; consignatec.com.br
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 lg:gap-2.5 shrink-0">
            {/* Month & Year Selector */}
            <MonthYearPicker
              currentMonth={currentMonth}
              onMonthChange={onMonthChange}
              activeMonths={activeMonths}
              onAddMonth={onAddMonth}
            />

            {/* Global Theme Toggle */}
            <ThemeToggle showLabel={false} />

            {/* PWA Install Button */}
            <PWAInstallButton variant="header" />

            {/* Cloud Sync Status Button */}
            <button
              type="button"
              onClick={() => setShowSyncInfoModal(true)}
              title="Sincronização em tempo real ativa no banco de dados na nuvem (PC & Celular)"
              className="inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-2 text-xs font-semibold border rounded-lg transition-colors bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer"
            >
              <div className="relative">
                <Cloud className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <span className="hidden xl:inline">Banco na Nuvem</span>
              <span className="xl:hidden">Nuvem</span>
            </button>

            {/* Quick Actions: Exportar & Restaurar */}
            <button
              onClick={onExportData}
              title="Exportar planilha em formato CSV"
              className="inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Exportar</span>
            </button>

            <button
              onClick={onResetData}
              title="Restaurar e zerar lançamentos do usuário"
              className="inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 hover:border-rose-200 dark:hover:border-rose-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 hover:text-rose-600" />
              <span className="hidden xl:inline">Zerar Dados</span>
            </button>

            {/* Gemini Diagnosis Button */}
            <button
              onClick={onOpenDiagnosis}
              disabled={isGeneratingDiagnosis}
              title="Consultor IA Especialista para analisar saúde orçamentária"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-all shadow-xs hover:shadow disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`h-3.5 w-3.5 ${isGeneratingDiagnosis ? 'animate-spin' : ''}`} />
              <span>Diagnóstico IA</span>
            </button>

            {/* User Profile CTA */}
            {currentUser && (
              <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors max-w-[160px] truncate cursor-pointer"
                  title="Configurações da Conta"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.name || 'User'}
                      className="h-4 w-4 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <UserIcon className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  )}
                  <span className="truncate">
                    {currentUser.name || (currentUser.isGuest ? 'Visitante Demo' : currentUser.email.split('@')[0])}
                  </span>
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Encerrar sessão"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MOBILE LAYOUT (< md) */}
        <div className="flex flex-col gap-2 md:hidden">
          {/* Top Row: Back to Tools, Brand & Essential Actions */}
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            {/* Left brand area */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              {onBackToTools && (
                <button
                  type="button"
                  onClick={onBackToTools}
                  title="Voltar para todas as ferramentas"
                  className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-teal-900 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-lg shadow-2xs hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors shrink-0 touch-manipulation cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5 text-teal-800 dark:text-teal-300" />
                  <LayoutGrid className="h-3.5 w-3.5 text-teal-800 dark:text-teal-300" />
                </button>
              )}

              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-teal-800 dark:bg-teal-700 text-white flex items-center justify-center shadow-xs shrink-0">
                <Wallet className="h-3.5 w-3.5" />
              </div>

              <div className="min-w-0 truncate">
                <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                  Consignatec
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate">
                  Gestão Financeira
                </p>
              </div>
            </div>

            {/* Right actions cluster */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Theme Toggle Mobile */}
              <ThemeToggle showLabel={false} />

              {/* Cloud badge button */}
              <button
                type="button"
                onClick={() => setShowSyncInfoModal(true)}
                className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300 touch-manipulation cursor-pointer"
                title="Banco de dados na nuvem ativo"
              >
                <Cloud className="h-3.5 w-3.5" />
              </button>

              {currentUser && (
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[85px] sm:max-w-[110px] truncate cursor-pointer touch-manipulation"
                  title="Configurações da Conta"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.name || 'User'}
                      className="h-3.5 w-3.5 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <UserIcon className="h-3 w-3 text-teal-700 dark:text-teal-400 shrink-0" />
                  )}
                  <span className="truncate text-[10px] sm:text-[11px]">
                    {currentUser.name ? currentUser.name.split(' ')[0] : (currentUser.isGuest ? 'Demo' : currentUser.email.split('@')[0])}
                  </span>
                </button>
              )}

              {/* More Actions Dropdown Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMoreActions(!showMoreActions)}
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
                  aria-label="Mais opções"
                >
                  <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>

                {showMoreActions && (
                  <div
                    className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs animate-fadeIn"
                    onClick={() => setShowMoreActions(false)}
                  >
                    {onOpenProfile && (
                      <button
                        onClick={onOpenProfile}
                        className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer"
                      >
                        <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span>Minha Conta / Dados</span>
                      </button>
                    )}
                    {onBackToTools && (
                      <button
                        onClick={onBackToTools}
                        className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-teal-800 dark:text-teal-300 font-semibold hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer"
                      >
                        <LayoutGrid className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                        <span>Painel de Ferramentas</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowSyncInfoModal(true)}
                      className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                    >
                      <Cloud className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Sincronização Nuvem</span>
                    </button>
                    <button
                      onClick={onExportData}
                      className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Download className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <span>Exportar CSV</span>
                    </button>
                    <button
                      onClick={onResetData}
                      className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      <RotateCcw className="h-4 w-4 text-rose-500" />
                      <span>Zerar Dados</span>
                    </button>
                    {onLogout && (
                      <button
                        onClick={onLogout}
                        className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-t border-slate-100 dark:border-slate-800 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sair da Conta</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Month Selector & AI Diagnosis */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="flex-1 min-w-0">
              <MonthYearPicker
                currentMonth={currentMonth}
                onMonthChange={onMonthChange}
                activeMonths={activeMonths}
                onAddMonth={onAddMonth}
              />
            </div>
            <button
              onClick={onOpenDiagnosis}
              disabled={isGeneratingDiagnosis}
              className="inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-colors shadow-2xs shrink-0 touch-manipulation cursor-pointer"
              title="Diagnóstico Financeiro com Inteligência Artificial"
            >
              <Sparkles className={`h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 ${isGeneratingDiagnosis ? 'animate-spin' : ''}`} />
              <span className="whitespace-nowrap">Diagnóstico IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cloud Sync Information Modal */}
      {showSyncInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Cloud className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Banco de Dados na Nuvem Conectado
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  Sincronização em Tempo Real Ativa
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Todas as suas receitas, despesas e orçamentos estão sendo gravados diretamente no banco de dados na nuvem (Firestore). Você pode alternar livremente entre o computador e o celular:
            </p>

            <div className="space-y-2.5 mb-6 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <Monitor className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">No Computador:</span>
                  Lançamentos e orçamentos salvos instantaneamente no seu perfil na nuvem.
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <Smartphone className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">No Celular:</span>
                  Basta fazer login com o mesmo e-mail para encontrar todos os seus meses e gastos sincronizados.
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium border border-emerald-200 dark:border-emerald-800/40">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Zero dados falsos no cache: novos meses são iniciados sob demanda.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 text-[11px] border border-teal-200 dark:border-teal-800/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Projeto Firebase:</span>
                  <span className="font-mono bg-teal-100 dark:bg-teal-900/60 px-1.5 py-0.5 rounded text-[10px]">{FIREBASE_PROJECT_ID}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Instância Firestore:</span>
                  <span className="font-mono text-[9px] text-teal-700 dark:text-teal-400 truncate max-w-[200px]" title={FIRESTORE_DATABASE_ID}>{FIRESTORE_DATABASE_ID}</span>
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium pt-1 border-t border-teal-200/60 dark:border-teal-800/40">
                  Segregação total: Seus dados estão 100% isolados e não se misturam com nenhum outro projeto.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSyncInfoModal(false)}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
