import React from 'react';
import { Sun, Moon, Check } from 'lucide-react';
import { useTheme, Theme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-amber-300 hover:text-amber-200 shadow-xs'
          : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 hover:text-slate-900 shadow-xs'
      } ${className}`}
      title={isDark ? 'Alternar para Tema Claro' : 'Alternar para Tema Escuro'}
      aria-label={isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 shrink-0 animate-fadeIn" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 shrink-0 animate-fadeIn" />
      )}
      {showLabel && (
        <span>
          {isDark ? 'Modo Claro' : 'Modo Escuro'}
        </span>
      )}
    </button>
  );
};

interface ThemeSelectorGroupProps {
  className?: string;
}

/**
 * Visual two-card theme selector designed for Account Settings & Appearance panels
 */
export const ThemeSelectorGroup: React.FC<ThemeSelectorGroupProps> = ({ className = '' }) => {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3.5 ${className}`}>
      {/* Light Theme Card */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${
          !isDark
            ? 'bg-white border-teal-600 ring-2 ring-teal-600/20 shadow-md'
            : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-400'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Sun className="h-5 w-5" />
          </div>
          {!isDark && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              <Check className="h-3 w-3" />
              Ativo
            </span>
          )}
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Tema Claro (Light)
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Fundo limpo e cores suaves com excelente contraste para ambientes iluminados.
          </p>
        </div>
      </button>

      {/* Dark Theme Card */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${
          isDark
            ? 'bg-slate-900 border-teal-500 ring-2 ring-teal-500/20 shadow-md text-white'
            : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Moon className="h-5 w-5" />
          </div>
          {isDark && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded-full border border-teal-800">
              <Check className="h-3 w-3" />
              Ativo
            </span>
          )}
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Tema Escuro (Dark)
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Tons profundos que descansam a visão e economizam bateria no celular.
          </p>
        </div>
      </button>
    </div>
  );
};
