import React, { useState } from 'react';
import { 
  MaritimeLocation, 
  TidalStation, 
  CoralReefSite, 
  CoastalAlert, 
  CustomUploadedRow 
} from '../types';
import { 
  Waves, 
  Sparkles, 
  AlertTriangle, 
  Calendar, 
  Wind, 
  Thermometer, 
  Compass, 
  ArrowUpRight, 
  Download, 
  ShieldAlert, 
  Activity, 
  Anchor, 
  Eye, 
  Layers, 
  TrendingUp,
  MapPin
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  Cell 
} from 'recharts';
import { getWaveBadgeColor, getCoralHealthBadge, getBleachingBadge, getRobRiskBadge, getSeverityStyle } from '../utils/formatters';

interface DashboardOverviewProps {
  weatherLocations: MaritimeLocation[];
  tidalStations: TidalStation[];
  coralSites: CoralReefSite[];
  coastalAlerts: CoastalAlert[];
  customData: CustomUploadedRow[];
  onNavigateTab: (tab: 'map' | 'weather' | 'coral' | 'alerts' | 'studio' | 'upload') => void;
  onTriggerInfographic: (type: 'weather' | 'coral' | 'tide' | 'alert' | 'custom', data: any) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  weatherLocations,
  tidalStations,
  coralSites,
  coastalAlerts,
  customData,
  onNavigateTab,
  onTriggerInfographic
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('Semua');

  // Aggregated Statistics
  const filteredWeather = selectedRegion === 'Semua' 
    ? weatherLocations 
    : weatherLocations.filter(w => w.region === selectedRegion || w.province.includes(selectedRegion));

  const avgWaveHeight = (filteredWeather.reduce((acc, curr) => acc + curr.waveHeight, 0) / (filteredWeather.length || 1)).toFixed(2);
  const maxWaveLoc = [...filteredWeather].sort((a, b) => b.waveHeight - a.waveHeight)[0];
  const avgCoralCover = (coralSites.reduce((acc, curr) => acc + curr.liveCoralCoverPct, 0) / (coralSites.length || 1)).toFixed(1);
  const criticalAlertsCount = coastalAlerts.filter(a => a.active).length;

  // Chart Data: Wave Heights Comparison
  const waveChartData = filteredWeather.map(loc => ({
    name: loc.name.split('(')[0].trim(),
    gelombang: loc.waveHeight,
    angin: loc.windSpeed,
    suhu: loc.seaSurfaceTemp,
    raw: loc
  }));

  // Chart Data: Coral Cover vs Bleaching
  const coralChartData = coralSites.map(site => ({
    name: site.name.split('(')[0].replace('Taman Nasional ', 'TN ').trim(),
    tutupan: site.liveCoralCoverPct,
    dhw: site.degreeHeatingWeeks,
    raw: site
  }));

  return (
    <div className="space-y-6">
      {/* Top Welcome Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[radial-gradient(ellipse_at_top,_#1e293b_0%,_#0f172a_100%)] p-6 sm:p-8 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e293b]/90 border border-slate-700 text-cyan-400 text-xs font-semibold shadow-md">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
              <span>Sistem Pemantauan Maritim & Konservasi Terumbu Karang Interaktif</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              Infografis Kelautan & Pesisir Nusantara
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Pantau dinamika oseanografi secara real-time: prakiraan tinggi gelombang BMKG, kalender pasang surut banjir rob, indeks kesehatan ekosistem terumbu karang (NOAA Coral Reef Watch), serta buat infografis kustom siap unduh.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('map')}
              className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-5 py-3 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-cyan-400/40 flex items-center justify-center gap-2 transition-all"
            >
              <Compass className="w-4 h-4" />
              <span>Jelajah Peta GIS</span>
            </button>

            <button
              onClick={() => onNavigateTab('studio')}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-5 py-3 rounded-full shadow-lg border border-slate-700 flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Buat Infografis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Region Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-[#0f172a] p-3.5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 text-xs text-slate-300 pl-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wilayah Oseanografi:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {['Semua', 'Jawa', 'Sumatra', 'Bali-Nusra', 'Sulawesi', 'Maluku-Papua', 'Kalimantan'].map((reg) => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                selectedRegion === reg
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gelombang Rata-rata */}
        <div 
          onClick={() => onNavigateTab('weather')}
          className="bg-[#0f172a] hover:bg-[#131d35] p-5 rounded-3xl border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group shadow-xl"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400 flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-cyan-400" />
              Rata-rata Gelombang
            </span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-cyan-300">{avgWaveHeight}</span>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Meter</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            Maks: <strong className="text-rose-400">{maxWaveLoc?.waveHeight}m</strong> di {maxWaveLoc?.name.split('(')[0]}
          </p>
        </div>

        {/* Card 2: Status Pasang Surut */}
        <div 
          onClick={() => onNavigateTab('weather')}
          className="bg-[#0f172a] hover:bg-[#131d35] p-5 rounded-3xl border border-slate-800 hover:border-blue-500/40 transition-all cursor-pointer group shadow-xl"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              Stasiun Pasut & Rob
            </span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-300">{tidalStations.length}</span>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Stasiun</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Fase: <strong className="text-blue-300">Bulan Purnama</strong> (Spring Tide)
          </p>
        </div>

        {/* Card 3: Tutupan Karang Nasional */}
        <div 
          onClick={() => onNavigateTab('coral')}
          className="bg-[#0f172a] hover:bg-[#131d35] p-5 rounded-3xl border border-slate-800 hover:border-teal-500/40 transition-all cursor-pointer group shadow-xl"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Tutupan Karang Hidup
            </span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-300">{avgCoralCover}%</span>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Kondisi Baik</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Tertinggi: <strong className="text-emerald-400">78.4%</strong> di Raja Ampat
          </p>
        </div>

        {/* Card 4: Peringatan Dini Pesisir */}
        <div 
          onClick={() => onNavigateTab('alerts')}
          className="bg-[#0f172a] hover:bg-[#131d35] p-5 rounded-3xl border border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer group shadow-xl"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Peringatan Dini EWS
            </span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-400">{criticalAlertsCount}</span>
            <span className="text-xs text-rose-300/80 font-medium uppercase tracking-wider">Peringatan Aktif</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            Status: <strong className="text-rose-400">Siaga Gelombang & Rob</strong>
          </p>
        </div>
      </div>

      {/* Active Coastal Alerts Banner Box */}
      {criticalAlertsCount > 0 && (
        <div className="bg-[#0f172a] border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Peringatan Dini Pesisir & Maritim Aktif Saat Ini
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs text-rose-300 hover:text-white font-semibold flex items-center gap-1 hover:underline"
            >
              <span>Lihat Semua ({coastalAlerts.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {coastalAlerts.map((alert) => {
              const style = getSeverityStyle(alert.severity);
              return (
                <div
                  key={alert.id}
                  className="bg-[#1e293b]/70 border border-slate-700/80 p-4 rounded-2xl space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${style.badge}`}>
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-slate-400">{alert.validUntil.split(',')[0]}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white leading-snug">{alert.title}</h4>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">{alert.headline}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 text-[10px] truncate max-w-[150px]">
                      {alert.seaZones[0]}
                    </span>
                    <button
                      onClick={() => onTriggerInfographic('alert', alert)}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 text-xs"
                    >
                      <Download className="w-3 h-3" />
                      <span>Infografis</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Charts Row: Wave Comparison & Coral Health Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart 1: Tinggi Gelombang Maritim (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0f172a] border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Perbandingan Tinggi Gelombang & Kecepatan Angin
                </h3>
                <p className="text-[11px] text-slate-400">Stasiun pengamatan maritim perairan Indonesia</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('weather')}
              className="text-xs text-cyan-400 hover:underline font-semibold"
            >
              Lihat Detail
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waveChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }} 
                  angle={-25} 
                  textAnchor="end" 
                  interval={0}
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', fontSize: '11px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                  formatter={(val: any, name: string) => [
                    `${val} ${name === 'gelombang' ? 'Meter' : name === 'angin' ? 'Knot' : '°C'}`,
                    name === 'gelombang' ? 'Tinggi Gelombang' : name === 'angin' ? 'Kecepatan Angin' : 'Suhu Laut'
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="gelombang" name="Tinggi Gelombang (m)" radius={[6, 6, 0, 0]}>
                  {waveChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.gelombang > 2.5 ? '#f43f5e' : entry.gelombang > 1.5 ? '#f59e0b' : '#06b6d4'} 
                    />
                  ))}
                </Bar>
                <Bar dataKey="angin" name="Kecepatan Angin (knot)" fill="#818cf8" radius={[6, 6, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Tutupan Terumbu Karang & Bleaching DHW (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0f172a] border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Kesehatan Karang & Indeks Stres Termal
                </h3>
                <p className="text-[11px] text-slate-400">Tutupan Karang (%) vs Degree Heating Weeks (DHW)</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('coral')}
              className="text-xs text-teal-400 hover:underline font-semibold"
            >
              Lihat Detail
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coralChartData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', fontSize: '11px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                  formatter={(val: any, name: string) => [
                    `${val} ${name === 'tutupan' ? '%' : '°C-weeks'}`,
                    name === 'tutupan' ? 'Tutupan Karang Hidup' : 'Stres Termal DHW'
                  ]}
                />
                <Bar dataKey="tutupan" name="Tutupan Karang (%)" fill="#10b981" radius={[0, 6, 6, 0]}>
                  {coralChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-coral-${index}`} 
                      fill={entry.tutupan >= 70 ? '#10b981' : entry.tutupan >= 50 ? '#14b8a6' : '#f59e0b'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Quick Interactive Location Cards Carousel / Grid */}
      <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              Titik Pengamatan Maritim Unggulan
            </h3>
            <p className="text-[11px] text-slate-400">Pilih titik untuk langsung membuat infografis siap unduh</p>
          </div>
          <button
            onClick={() => onNavigateTab('studio')}
            className="text-xs text-cyan-400 hover:underline font-semibold"
          >
            Buka Studio Lengkap →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredWeather.slice(0, 6).map((loc) => {
            const badge = getWaveBadgeColor(loc.waveCategory);
            return (
              <div
                key={loc.id}
                className="bg-[#1e293b]/60 hover:bg-[#1e293b] p-4.5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3 group shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {loc.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">{loc.province}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                      {loc.waveCategory}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center mt-3 pt-2 border-t border-slate-700/60">
                    <div className="bg-[#0f172a] p-2 rounded-xl border border-slate-800">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Gelombang</span>
                      <span className="text-xs font-bold text-cyan-300">{loc.waveHeight}m</span>
                    </div>
                    <div className="bg-[#0f172a] p-2 rounded-xl border border-slate-800">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Angin</span>
                      <span className="text-xs font-bold text-amber-300">{loc.windSpeed} kts</span>
                    </div>
                    <div className="bg-[#0f172a] p-2 rounded-xl border border-slate-800">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Suhu</span>
                      <span className="text-xs font-bold text-emerald-300">{loc.seaSurfaceTemp}°C</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-[11px]">
                  <span className={`text-[10px] font-semibold ${loc.safetyIndex === 'Aman Melaut' ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {loc.safetyIndex}
                  </span>
                  <button
                    onClick={() => onTriggerInfographic('weather', loc)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all shadow-sm"
                  >
                    <Download className="w-3 h-3" />
                    <span>Infografis</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
