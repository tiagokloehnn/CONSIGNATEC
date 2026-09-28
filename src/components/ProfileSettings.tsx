import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
  Save,
  KeyRound,
  Sparkles,
  Smartphone,
  LogOut,
  Info,
  Sun,
  Database,
  Trash2,
  AlertTriangle,
  UserX,
} from 'lucide-react';
import {
  updateFirebaseUserProfile,
  FIREBASE_PROJECT_ID,
} from '../services/firebase';
import { ThemeToggle, ThemeSelectorGroup } from './ThemeToggle';

export interface UserProfileData {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  photoURL?: string;
  authProvider?: 'google' | 'password' | 'guest';
  isGuest?: boolean;
}

interface ProfileSettingsProps {
  currentUser: UserProfileData;
  onUpdateUser: (updatedUser: UserProfileData) => void;
  onBack: () => void;
  onLogout: () => void;
  onWipeDatabase?: () => Promise<void> | void;
  onDeleteAccount?: () => Promise<void> | void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  currentUser,
  onUpdateUser,
  onBack,
  onLogout,
  onWipeDatabase,
  onDeleteAccount,
}) => {
  // Form fields
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  
  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibility toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [wipingData, setWipingData] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleWipeDatabaseExecution = async () => {
    if (!onWipeDatabase) return;
    setWipingData(true);
    setErrorMessage(null);
    try {
      await onWipeDatabase();
      setSuccessMessage('Banco de dados zerado com sucesso! Todos os lançamentos na nuvem foram apagados e o sistema foi iniciado do zero.');
      setShowWipeConfirm(false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Falha ao zerar banco de dados.');
    } finally {
      setWipingData(false);
    }
  };

  const handleDeleteAccountExecution = async () => {
    if (!onDeleteAccount) return;
    setDeletingAccount(true);
    setErrorMessage(null);
    try {
      await onDeleteAccount();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Falha ao excluir a conta. Tente novamente.');
      setDeletingAccount(false);
    }
  };

  // Phone input formatting (Brazil (XX) 9XXXX-XXXX or (XX) XXXX-XXXX)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 11) raw = raw.slice(0, 11);
    
    let formatted = raw;
    if (raw.length > 2) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    }
    if (raw.length > 7) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
    } else if (raw.length > 6 && raw.length <= 10) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
    }
    setPhone(formatted);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Basic Validations
    if (!name.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    // Password validation if user filled new password
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('A confirmação da nova senha não confere.');
        return;
      }
    }

    setLoading(true);

    try {
      if (currentUser.isGuest) {
        // Guest mode simulated save
        const updated: UserProfileData = {
          ...currentUser,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        };
        onUpdateUser(updated);
        setSuccessMessage('Dados de perfil atualizados com sucesso (Modo Demonstração).');
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
      } else {
        // Cloud Firestore update
        const updated: UserProfileData = {
          ...currentUser,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        };

        const updatePayload: any = {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        };
        if (newPassword) {
          updatePayload.passwordHash = btoa(newPassword.trim());
        }

        await updateFirebaseUserProfile(currentUser.id, updatePayload);
        onUpdateUser(updated);

        setSuccessMessage('Seu perfil e dados foram atualizados e sincronizados no banco de dados na nuvem!');
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocorreu um erro ao salvar as alterações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-teal-500 selection:text-white flex flex-col transition-colors duration-200">
      {/* Top Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-teal-900 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Voltar</span>
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-teal-800 dark:text-teal-400" />
                Configurações da Conta
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Gerencie seus dados pessoais, credenciais de login e contato
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle showLabel={false} />
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair da Conta</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Banner de Identificação */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-4">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={name || 'Avatar'}
                className="h-14 w-14 rounded-2xl object-cover border-2 border-teal-500/40 shadow-sm"
              />
            ) : (
              <div className="h-14 w-14 rounded-2xl bg-teal-800 dark:bg-teal-700 text-white flex items-center justify-center text-xl font-bold shadow-sm shadow-teal-900/20">
                {name ? name.slice(0, 2).toUpperCase() : 'CT'}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{name || 'Usuário Consignatec'}</h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                <span>{email}</span>
                {currentUser.authProvider === 'google' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    Conta Google
                  </span>
                )}
                {currentUser.isGuest && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Modo Visitante
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Banco Isolado &bull; Projeto: <strong className="font-mono text-[11px]">{FIREBASE_PROJECT_ID}</strong></span>
            </span>
          </div>
        </div>

        {/* Feedback alerts */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Seção 0: Aparência e Tema do Sistema */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4 transition-colors">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-500" />
                Aparência &amp; Tema (Claro / Escuro)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Alterne instantaneamente entre o modo claro e o modo escuro. Sua preferência é salva e aplicada em todas as telas e ferramentas.
              </p>
            </div>

            <ThemeSelectorGroup />
          </div>

          {/* Seção 1: Dados Pessoais & Contato */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-5 transition-colors">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-teal-800 dark:text-teal-400" />
                Dados Pessoais & Contato
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mantenha suas informações sempre atualizadas para comunicações e notificações do sistema.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nome Completo */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Tiago Kloehn"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-colors"
                  />
                </div>
              </div>

              {/* Endereço de E-mail */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail de Acesso <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Usado para login em todas as ferramentas da Consignatec.
                </p>
              </div>

              {/* Número de Celular / WhatsApp */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Número de Celular / WhatsApp
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={15}
                    placeholder="(41) 99999-9999"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Para avisos de margem, simulações de crédito e suporte.
                </p>
              </div>
            </div>
          </div>

          {/* Seção 2: Alteração de Senha */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5 transition-colors">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Lock className="h-4 w-4 text-teal-800 dark:text-teal-400" />
                Segurança & Senha de Acesso
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Deixe os campos em branco se não desejar alterar sua senha atual.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nova Senha */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Nova Senha */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <Info className="h-4 w-4 text-teal-800 dark:text-teal-400 shrink-0 mt-0.5" />
              <span>
                Sua senha é protegida por hash criptográfico unidirecional. Nunca compartilhe sua senha com terceiros.
              </span>
            </div>
          </div>

          {/* Seção 3: Gerenciamento do Banco de Dados & Começar do Zero */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
            <div className="border-b border-rose-100 dark:border-rose-900/40 pb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
                  <Database className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  Zerar Banco de Dados & Começar do Zero
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Apaga permanentemente todos os lançamentos, despesas e receitas salvas no Firestore (<code className="font-mono text-rose-600 dark:text-rose-400 font-bold">{FIREBASE_PROJECT_ID}</code>) e redefine todos os orçamentos para R$ 0,00.
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50/70 dark:bg-rose-950/40 rounded-xl border border-rose-200/80 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong>Atenção:</strong> Esta operação limpa todo o seu histórico financeiro na nuvem. Sua conta continuará ativa para você começar seus registros reais do zero absoluto.
              </span>
            </div>

            {!showWipeConfirm ? (
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Status: <span className="font-semibold text-emerald-600 dark:text-emerald-400">Conectado e Seguro</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWipeConfirm(true)}
                  disabled={wipingData}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Zerar Banco de Dados Agora</span>
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 space-y-3 animate-fadeIn">
                <div className="text-xs font-semibold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>Deseja realmente zerar todo o banco de dados e começar do zero absoluto?</span>
                </div>
                <p className="text-[11px] text-rose-700 dark:text-rose-300/90 leading-relaxed">
                  Todos os lançamentos serão permanentemente deletados do Firestore e não poderão ser recuperados.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={wipingData}
                    onClick={handleWipeDatabaseExecution}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{wipingData ? 'Zerando Banco...' : 'Sim, Zerar Banco de Dados'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={wipingData}
                    onClick={() => setShowWipeConfirm(false)}
                    className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Seção 4: Exclusão Definitiva de Conta */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-300 dark:border-red-900/80 p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
            <div className="border-b border-red-100 dark:border-red-900/40 pb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
                  Excluir Minha Conta Permanentemente
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Elimina seu usuário do banco de dados na nuvem, encerra a autenticação e apaga todas as informações para que você possa criar uma conta do zero absoluto.
                </p>
              </div>
            </div>

            <div className="p-3 bg-red-50/80 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-900 dark:text-red-300">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong>Ação Irreversível:</strong> Seu perfil de usuário, credenciais e qualquer vínculo com <code className="font-mono text-red-700 dark:text-red-300">{currentUser.email}</code> serão completamente deletados. Você será direcionado para criar um novo cadastro.
              </span>
            </div>

            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Conta ativa: <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deletingAccount}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  <UserX className="h-4 w-4" />
                  <span>Excluir Minha Conta</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-red-100/70 dark:bg-red-950/70 border border-red-400 dark:border-red-800 space-y-3 animate-fadeIn">
                <div className="text-xs font-bold text-red-900 dark:text-red-100 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>CONFIRMAÇÃO: Deseja apagar seu cadastro e criar uma nova conta do zero?</span>
                </div>
                <p className="text-[11px] text-red-800 dark:text-red-200 leading-relaxed">
                  Ao confirmar, seu usuário será excluído do Firebase Firestore e você retornará à tela de cadastro limpa para iniciar do zero.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={deletingAccount}
                    onClick={handleDeleteAccountExecution}
                    className="px-4 py-2 bg-red-700 hover:bg-red-800 active:scale-95 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{deletingAccount ? 'Excluindo sua conta...' : 'Sim, Excluir Definitivamente'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={deletingAccount}
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer text-center"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm shadow-teal-900/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Salvando Alterações...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
