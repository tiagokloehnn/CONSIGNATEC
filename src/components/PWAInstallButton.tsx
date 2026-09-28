import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If running in standalone mode (already installed), hide the install prompt
  if (isInstalled) {
    return null;
  }

  // Neither installable via beforeinstallprompt nor iOS Safari -> hide
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleInstallClick = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleInstallClick}
          title="Instalar Consignatec no seu dispositivo (PWA)"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 rounded-xl transition shadow-xs hover:shadow active:scale-95 cursor-pointer shrink-0 ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
          <span className="hidden sm:inline">Instalar App</span>
          <span className="sm:hidden">Instalar</span>
        </button>
      )}

      {variant === 'card' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition shadow-xs cursor-pointer active:scale-95 ${className}`}
        >
          <Smartphone className="w-4 h-4 text-teal-700" />
          <span>Instalar no Celular / PC</span>
        </button>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Instalar no iPhone / iPad</h3>
                  <p className="text-[11px] text-slate-500">Acesso rápido direto na sua tela de início</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-teal-800 font-bold shrink-0 text-xs">
                  1
                </span>
                <p>
                  Toque no botão <strong className="text-teal-900 inline-flex items-center gap-1 font-semibold"><Share className="w-3.5 h-3.5 inline" /> Compartilhar</strong> na barra inferior do Safari.
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-teal-800 font-bold shrink-0 text-xs">
                  2
                </span>
                <p>
                  Role a lista e selecione a opção <strong className="text-teal-900 inline-flex items-center gap-1 font-semibold"><PlusSquare className="w-3.5 h-3.5 inline" /> Adicionar à Tela de Início</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-teal-800 font-bold shrink-0 text-xs">
                  3
                </span>
                <p>
                  Toque em <strong className="text-teal-900 font-semibold">Adicionar</strong> no canto superior direito para concluir.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-teal-800 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-900 transition"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
