import React, { useState, useEffect } from 'react';
import { 
  INITIAL_MARITIME_LOCATIONS, 
  INITIAL_TIDAL_STATIONS, 
  INITIAL_CORAL_REEF_SITES, 
  INITIAL_COASTAL_ALERTS 
} from './data/mockMaritimeData';
import { 
  MaritimeLocation, 
  TidalStation, 
  CoralReefSite, 
  CoastalAlert, 
  CustomUploadedRow 
} from './types';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { InteractiveMap } from './components/InteractiveMap';
import { WeatherTidesView } from './components/WeatherTidesView';
import { CoralEcosystemView } from './components/CoralEcosystemView';
import { EarlyWarningView } from './components/EarlyWarningView';
import { InfographicStudio } from './components/InfographicStudio';
import { DataUploader } from './components/DataUploader';
import { EarlyWarningModal } from './components/EarlyWarningModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { AppThemeId, APP_THEMES } from './utils/themeConfig';
import { 
  Waves, 
  MapPin, 
  Sparkles, 
  Download, 
  FileSpreadsheet, 
  ShieldAlert, 
  Heart, 
  Radio,
  Compass,
  ArrowUp,
  Palette
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'weather' | 'coral' | 'alerts' | 'studio' | 'upload' | 'edu'>('dashboard');

  // Background Theme State with LocalStorage Persistence (Defaults to bright clean Oceanic Light)
  const [currentTheme, setCurrentTheme] = useState<AppThemeId>(() => {
    const saved = localStorage.getItem('nusantara_theme') as AppThemeId;
    return saved && APP_THEMES[saved] ? saved : 'ocean_light';
  });
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);

  const handleSelectTheme = (themeId: AppThemeId) => {
    setCurrentTheme(themeId);
    try {
      localStorage.setItem('nusantara_theme', themeId);
    } catch (e) {
      console.warn('LocalStorage not available', e);
    }
  };

  // Datasets state
  const [weatherLocations, setWeatherLocations] = useState<MaritimeLocation[]>(INITIAL_MARITIME_LOCATIONS);
  const [tidalStations, setTidalStations] = useState<TidalStation[]>(INITIAL_TIDAL_STATIONS);
  const [coralSites, setCoralSites] = useState<CoralReefSite[]>(INITIAL_CORAL_REEF_SITES);
  const [coastalAlerts, setCoastalAlerts] = useState<CoastalAlert[]>(INITIAL_COASTAL_ALERTS);
  const [customUploadedData, setCustomUploadedData] = useState<CustomUploadedRow[]>([]);

  // Modal & Infographic Prefill state
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [prefilledInfographic, setPrefilledInfographic] = useState<{
    type: 'weather' | 'coral' | 'tide' | 'alert' | 'custom';
    data: any;
  }>({
    type: 'weather',
    data: INITIAL_MARITIME_LOCATIONS[0]
  });

  // Handler to quickly trigger Infographic Studio from any card or map pin
  const handleTriggerInfographic = (type: 'weather' | 'coral' | 'tide' | 'alert' | 'custom', data: any) => {
    setPrefilledInfographic({ type, data });
    setActiveTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler when user uploads Excel or CSV
  const handleDataLoaded = (rows: CustomUploadedRow[]) => {
    setCustomUploadedData(rows);
    // Switch to studio or map to visualize immediately
    setActiveTab('upload');
  };

  const handleClearCustomData = () => {
    setCustomUploadedData([]);
  };

  const activeThemeConfig = APP_THEMES[currentTheme] || APP_THEMES.ocean_teal;

  return (
    <div 
      data-theme={currentTheme}
      className={`min-h-screen ${activeThemeConfig.rootBgClass} text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white font-sans antialiased transition-colors duration-300`}
    >
      {/* Top Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAlerts={coastalAlerts}
        onOpenAlertModal={() => setIsAlertModalOpen(true)}
        onOpenInfographicStudio={() => {
          setPrefilledInfographic({ type: 'weather', data: weatherLocations[0] });
          setActiveTab('studio');
        }}
        customDataCount={customUploadedData.length}
        currentTheme={currentTheme}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* TAB 1: DASBOR INFOGRAFIS OVERVIEW */}
        {activeTab === 'dashboard' && (
          <DashboardOverview
            weatherLocations={weatherLocations}
            tidalStations={tidalStations}
            coralSites={coralSites}
            coastalAlerts={coastalAlerts}
            customData={customUploadedData}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onTriggerInfographic={handleTriggerInfographic}
          />
        )}

        {/* TAB 2: PETA WEB GIS INTERAKTIF */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="bg-[#0f172a] p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Interactive Geospatial Portal
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 mt-1">
                  <MapPin className="w-6 h-6 text-emerald-400" />
                  Peta Web GIS Perairan & Konservasi Maritim
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Navigasi interaktif data oseanografi BMKG, stasiun pasang surut BIG, status tutupan karang NOAA CRW, dan zona bahaya pesisir. Klik pin untuk membuat infografis instan.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('studio')}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-2 transition-all self-start sm:self-auto border border-cyan-400/40"
              >
                <Download className="w-4 h-4" />
                <span>Buka Studio Infografis</span>
              </button>
            </div>

            <InteractiveMap
              weatherLocations={weatherLocations}
              tidalStations={tidalStations}
              coralSites={coralSites}
              coastalAlerts={coastalAlerts}
              customUploadedData={customUploadedData}
              onSelectWeatherLocation={(loc) => {}}
              onSelectTidalStation={(stn) => {}}
              onSelectCoralSite={(site) => {}}
              onSelectCustomRow={(row) => {}}
              onTriggerInfographic={handleTriggerInfographic}
            />
          </div>
        )}

        {/* TAB 3: CUACA & PASANG SURUT */}
        {activeTab === 'weather' && (
          <WeatherTidesView
            weatherLocations={weatherLocations}
            tidalStations={tidalStations}
            onTriggerInfographic={handleTriggerInfographic}
          />
        )}

        {/* TAB 4: EKOSISTEM TERUMBU KARANG */}
        {activeTab === 'coral' && (
          <CoralEcosystemView
            coralSites={coralSites}
            onTriggerInfographic={handleTriggerInfographic}
          />
        )}

        {/* TAB 5: PERINGATAN DINI BENCANA PESISIR */}
        {activeTab === 'alerts' && (
          <EarlyWarningView
            alerts={coastalAlerts}
            onTriggerInfographic={handleTriggerInfographic}
          />
        )}

        {/* TAB 6: STUDIO PEMBUAT & EKSPOR INFOGRAFIS */}
        {activeTab === 'studio' && (
          <InfographicStudio
            weatherLocations={weatherLocations}
            tidalStations={tidalStations}
            coralSites={coralSites}
            coastalAlerts={coastalAlerts}
            customUploadedData={customUploadedData}
            prefilledType={prefilledInfographic.type}
            prefilledData={prefilledInfographic.data}
          />
        )}

        {/* TAB 7: UPLOAD EXCEL / CSV DATA */}
        {activeTab === 'upload' && (
          <DataUploader
            customData={customUploadedData}
            onDataLoaded={handleDataLoaded}
            onClearData={handleClearCustomData}
            onSwitchToMap={() => setActiveTab('map')}
            onSwitchToStudio={() => {
              setPrefilledInfographic({ type: 'custom', data: customUploadedData[0] });
              setActiveTab('studio');
            }}
          />
        )}
      </main>

      {/* Early Warning Notification Modal */}
      <EarlyWarningModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        alerts={coastalAlerts}
        onTriggerInfographic={handleTriggerInfographic}
      />

      {/* Theme Customization Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* Sleek Footer */}
      <footer className="border-t border-slate-800/50 mt-16 py-10 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Waves className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">NUSANTARA<span className="text-cyan-400">BAHARI</span></span>
              <p className="text-[11px] text-slate-500 font-medium">Portal Infografis Cuaca Maritim, Pasang Surut & Ekosistem Karang Indonesia</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-slate-400 text-xs font-medium">
            <button onClick={() => setActiveTab('dashboard')} className="hover:text-cyan-400 transition-colors">Dashboard</button>
            <button onClick={() => setActiveTab('map')} className="hover:text-cyan-400 transition-colors">Peta GIS</button>
            <button onClick={() => setActiveTab('weather')} className="hover:text-cyan-400 transition-colors">Cuaca & Pasut</button>
            <button onClick={() => setActiveTab('coral')} className="hover:text-cyan-400 transition-colors">Terumbu Karang</button>
            <button onClick={() => setActiveTab('studio')} className="hover:text-cyan-400 transition-colors">Studio Infografis</button>
            <button onClick={() => setActiveTab('upload')} className="hover:text-emerald-400 transition-colors">Impor Data</button>
            <button onClick={() => setActiveTab('alerts')} className="hover:text-rose-400 transition-colors">Peringatan Dini</button>
            <button 
              onClick={() => setIsThemeModalOpen(true)} 
              className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/60"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Ganti Tema Background ({activeThemeConfig.name})</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 text-center md:text-right font-medium">
            <p>Data: BMKG Maritim • BIG • NOAA CRW • KKP RI</p>
            <p className="text-slate-600 mt-0.5">Sleek Interface GIS & EWS Edition</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
