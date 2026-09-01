import React from 'react';
import { Palette, Check, Sparkles, X, Sun, Moon, Waves, ShieldCheck } from 'lucide-react';
import { AppThemeId, APP_THEMES } from '../utils/themeConfig';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: AppThemeId;
  onSelectTheme: (themeId: AppThemeId) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Pilih Tema Tampilan Background
                </h3>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full font-bold">
                  6 Tema Estetik
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kustomisasi warna dasar aplikasi selain hitam pekat dengan palet oseanografi berkelas & nyaman di mata.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {Object.values(APP_THEMES).map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  onSelectTheme(theme.id);
                }}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group cursor-pointer ${
                  isSelected 
                    ? 'border-cyan-400 bg-slate-800/90 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-2 ring-cyan-400/50' 
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                {/* Visual Swatch Strip */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl ${theme.previewBg} border border-white/20 shadow-inner flex items-center justify-center flex-shrink-0`}>
                      {theme.isLight ? (
                        <Sun className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Waves className="w-4 h-4 text-cyan-300" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                        {theme.name}
                      </h4>
                      <span className="text-[10px] text-cyan-400 font-semibold">
                        {theme.tag}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Subtitle / Description */}
                <p className="text-[11px] text-slate-400 leading-snug">
                  {theme.subtitle}
                </p>

                {/* Color Spectrum Indicator */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block" 
                      style={{ backgroundColor: theme.accentColor }} 
                    />
                    Aksen: {theme.accentColor}
                  </span>
                  <span className="font-mono">
                    {theme.isLight ? 'Daylight Light' : 'Deep Marine Dark'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-[11px]">
              Tema otomatis tersimpan di peramban Anda untuk kunjungan berikutnya.
            </span>
          </div>
          <button
            onClick={onClose}
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-full transition-all cursor-pointer shadow-md"
          >
            Terapkan & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
