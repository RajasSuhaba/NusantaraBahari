import React from 'react';
import { 
  Waves, 
  MapPin, 
  CloudSun, 
  Sparkles, 
  AlertTriangle, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Bell, 
  Compass, 
  ShieldAlert, 
  Download,
  Info,
  Palette
} from 'lucide-react';
import { CoastalAlert } from '../types';
import { AppThemeId, APP_THEMES } from '../utils/themeConfig';

interface NavbarProps {
  activeTab: 'dashboard' | 'map' | 'weather' | 'coral' | 'alerts' | 'studio' | 'upload' | 'edu';
  setActiveTab: (tab: 'dashboard' | 'map' | 'weather' | 'coral' | 'alerts' | 'studio' | 'upload' | 'edu') => void;
  activeAlerts: CoastalAlert[];
  onOpenAlertModal: () => void;
  onOpenInfographicStudio: () => void;
  customDataCount: number;
  currentTheme: AppThemeId;
  onOpenThemeModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeAlerts,
  onOpenAlertModal,
  onOpenInfographicStudio,
  customDataCount,
  currentTheme,
  onOpenThemeModal
}) => {
  const criticalAlertCount = activeAlerts.filter(a => a.active).length;
  const activeThemeObj = APP_THEMES[currentTheme] || APP_THEMES.ocean_teal;

  return (
    <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800/50 shadow-2xl">
      {/* Top Banner Alert Ticker */}
      {criticalAlertCount > 0 && (
        <div 
          onClick={onOpenAlertModal}
          className="bg-rose-950/40 backdrop-blur-sm border-b border-rose-500/30 px-4 py-1.5 text-xs text-rose-200 flex items-center justify-between cursor-pointer hover:bg-rose-900/50 transition-all group"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="flex h-2 w-2 relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Peringatan Dini Pesisir Aktif ({criticalAlertCount}):
            </span>
            <span className="truncate text-slate-200 font-medium text-xs">
              {activeAlerts[0]?.title} • {activeAlerts[0]?.headline}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 text-cyan-400 font-semibold group-hover:text-cyan-300 text-[11px] pl-4">
            <span className="hidden sm:inline">Lihat Detail & SOP</span>
            <span className="bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 rounded-full text-[10px] text-rose-300 font-bold">
              Buka EWS
            </span>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-3 cursor-pointer select-none group"
            id="brand-logo-btn"
          >
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:scale-105 transition-all">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  NUSANTARA<span className="text-cyan-400">BAHARI</span>
                </span>
                <span className="text-[9px] bg-slate-800/80 text-cyan-400 border border-slate-700/80 px-2 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase">
                  GIS & EWS
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block font-medium">
                Maritime Insight & Coral Conservation Portal
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#020617]/60 p-1.5 rounded-full border border-slate-800/70 shadow-inner">
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-cyan-400 shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/40'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Dashboard
            </button>

            <button
              id="nav-tab-map"
              onClick={() => setActiveTab('map')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'map'
                  ? 'bg-slate-800 text-cyan-400 shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/40'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Peta GIS
            </button>

            <button
              id="nav-tab-weather"
              onClick={() => setActiveTab('weather')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'weather'
                  ? 'bg-slate-800 text-cyan-400 shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/40'
              }`}
            >
              <CloudSun className="w-3.5 h-3.5 text-amber-400" />
              Cuaca & Pasut
            </button>

            <button
              id="nav-tab-coral"
              onClick={() => setActiveTab('coral')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'coral'
                  ? 'bg-slate-800 text-cyan-400 shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Terumbu Karang
            </button>

            <button
              id="nav-tab-alerts"
              onClick={() => setActiveTab('alerts')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all relative ${
                activeTab === 'alerts'
                  ? 'bg-rose-950/40 text-rose-300 shadow-md border border-rose-500/40'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800/40'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Peringatan Dini
              {criticalAlertCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse inline-block"></span>
              )}
            </button>

            <button
              id="nav-tab-studio"
              onClick={() => setActiveTab('studio')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'studio'
                  ? 'bg-slate-800 text-cyan-400 shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/40'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
              Infografis
            </button>

            <button
              id="nav-tab-upload"
              onClick={() => setActiveTab('upload')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'upload'
                  ? 'bg-slate-800 text-emerald-400 shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800/40'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Impor Data
              {customDataCount > 0 && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full text-[9px] font-mono">
                  {customDataCount}
                </span>
              )}
            </button>
          </nav>

          {/* Quick Actions (Theme Switcher + EWS Notification Modal + Quick Create Infografis) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Switcher Button */}
            <button
              id="header-theme-switcher-btn"
              onClick={onOpenThemeModal}
              title={`Ganti Tema Background (Tema Aktif: ${activeThemeObj.name})`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-md cursor-pointer group"
            >
              <div 
                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm flex-shrink-0"
                style={{ backgroundColor: activeThemeObj.accentColor }}
              />
              <Palette className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-semibold hidden md:inline">Tema</span>
            </button>

            <button
              id="header-notification-btn"
              onClick={onOpenAlertModal}
              title="Notifikasi & Peringatan Dini Pesisir"
              className="relative p-2.5 rounded-full bg-slate-800/70 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-md cursor-pointer"
            >
              <Bell className="w-4 h-4 text-cyan-400" />
              {criticalAlertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm">
                  {criticalAlertCount}
                </span>
              )}
            </button>

            <button
              id="header-create-infographic-btn"
              onClick={onOpenInfographicStudio}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all border border-cyan-400/40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Buat Infografis</span>
              <span className="sm:hidden">Infografis</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Horizontal Scroll */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-2.5 pt-1 scrollbar-none">
          <button
            onClick={onOpenThemeModal}
            className="px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 bg-slate-800 text-cyan-300 border border-cyan-500/40 cursor-pointer"
          >
            <Palette className="w-3 h-3 text-cyan-400" /> Tema Tampilan
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'dashboard' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400 bg-slate-900/60'
            }`}
          >
            <Compass className="w-3 h-3 text-cyan-400" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'map' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400 bg-slate-900/60'
            }`}
          >
            <MapPin className="w-3 h-3 text-emerald-400" /> Peta GIS
          </button>
          <button
            onClick={() => setActiveTab('weather')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'weather' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400 bg-slate-900/60'
            }`}
          >
            <CloudSun className="w-3 h-3 text-amber-400" /> Cuaca & Pasut
          </button>
          <button
            onClick={() => setActiveTab('coral')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'coral' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400 bg-slate-900/60'
            }`}
          >
            <Sparkles className="w-3 h-3 text-teal-400" /> Karang
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'alerts' ? 'bg-rose-950/40 text-rose-300 border border-rose-500/40' : 'text-slate-400 bg-slate-900/60'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" /> Peringatan
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'studio' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400 bg-slate-900/60'
            }`}
          >
            <ImageIcon className="w-3 h-3 text-purple-400" /> Infografis
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'upload' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 bg-slate-900/60'
            }`}
          >
            <FileSpreadsheet className="w-3 h-3 text-emerald-400" /> Impor Data
          </button>
        </div>
      </div>
    </header>
  );
};
