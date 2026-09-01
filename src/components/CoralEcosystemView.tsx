import React, { useState, useMemo } from 'react';
import { CoralReefSite } from '../types';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  MapPin, 
  Fish, 
  TrendingUp, 
  Thermometer, 
  Droplets, 
  HeartHandshake, 
  Search, 
  Filter, 
  Eye, 
  SlidersHorizontal, 
  CheckCircle2, 
  Layers 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { getCoralHealthBadge, getBleachingBadge } from '../utils/formatters';

interface CoralEcosystemViewProps {
  coralSites: CoralReefSite[];
  onTriggerInfographic: (type: 'coral', data: CoralReefSite) => void;
}

export const CoralEcosystemView: React.FC<CoralEcosystemViewProps> = ({
  coralSites,
  onTriggerInfographic
}) => {
  const [selectedSiteId, setSelectedSiteId] = useState<string>(coralSites[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [bleachingFilter, setBleachingFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  // Filtered coral reef list
  const filteredCoralSites = useMemo(() => {
    return coralSites.filter(site => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = site.name.toLowerCase().includes(q);
        const matchesProv = site.province.toLowerCase().includes(q);
        const matchesSpecies = site.keyFishSpecies.some(s => s.toLowerCase().includes(q));
        const matchesThreats = site.threats.some(t => t.toLowerCase().includes(q));
        const matchesGenera = site.dominantGenera.some(g => g.toLowerCase().includes(q));
        if (!matchesName && !matchesProv && !matchesSpecies && !matchesThreats && !matchesGenera) {
          return false;
        }
      }

      // Health Category Filter
      if (healthFilter !== 'all') {
        if (healthFilter === 'sangat_baik' && !site.healthCategory.startsWith('Sangat Baik')) return false;
        if (healthFilter === 'baik' && !site.healthCategory.startsWith('Baik')) return false;
        if (healthFilter === 'sedang' && !site.healthCategory.startsWith('Sedang')) return false;
        if (healthFilter === 'rusak' && !site.healthCategory.startsWith('Rusak')) return false;
      }

      // Bleaching Alert Filter
      if (bleachingFilter !== 'all') {
        if (site.bleachingAlert !== bleachingFilter) return false;
      }

      // Region Filter
      if (regionFilter !== 'all') {
        if (regionFilter === 'jawa_bali' && !['Jawa Tengah', 'Bali', 'DKI Jakarta', 'Banten', 'Jawa Timur'].includes(site.province)) return false;
        if (regionFilter === 'sulawesi_kalimantan' && !['Sulawesi Utara', 'Sulawesi Tenggara', 'Sulawesi Selatan', 'Kalimantan Timur'].includes(site.province)) return false;
        if (regionFilter === 'papua_maluku' && !['Papua Barat Daya', 'Maluku', 'Papua Barat'].includes(site.province)) return false;
        if (regionFilter === 'nusa_tenggara' && !['Nusa Tenggara Timur', 'Nusa Tenggara Barat'].includes(site.province)) return false;
      }

      return true;
    });
  }, [coralSites, searchQuery, healthFilter, bleachingFilter, regionFilter]);

  const activeSite = coralSites.find(s => s.id === selectedSiteId) || filteredCoralSites[0] || coralSites[0];
  const healthBadge = getCoralHealthBadge(activeSite.healthCategory);
  const bleachingBadge = getBleachingBadge(activeSite.bleachingAlert);

  // Comparison Bar Chart of Coral Cover across all sites
  const comparisonChartData = coralSites.map(s => ({
    name: s.name.split(' ')[0] + ' ' + (s.name.split(' ')[1] || ''),
    coverPct: s.liveCoralCoverPct,
    dhw: s.degreeHeatingWeeks,
    id: s.id
  }));

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-[#0f172a] p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Kesehatan & Konservasi Terumbu Karang Nusantara
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Segitiga Terumbu Karang Dunia (Coral Triangle): Pemantauan tutupan karang hidup, peringatan dini pemutihan (Bleaching Alert), status zonasi konservasi (MPA), spesies kunci, dan proyek restorasi aktif.
          </p>
        </div>

        <button
          onClick={() => onTriggerInfographic('coral', activeSite)}
          className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.3)] flex items-center justify-center gap-2 border border-teal-400/40 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Buat Infografis Karang Ini</span>
        </button>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-[#0f172a] border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari situs karang, spesies ikan (Manta, Penyu), ancaman, atau provinsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-full pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 placeholder:text-slate-500"
            />
          </div>

          {/* Quick Clear Filter */}
          {(searchQuery || healthFilter !== 'all' || bleachingFilter !== 'all' || regionFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setHealthFilter('all');
                setBleachingFilter('all');
                setRegionFilter('all');
              }}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 px-3 py-1.5 rounded-full bg-teal-950/50 border border-teal-500/30 cursor-pointer whitespace-nowrap"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1 font-bold uppercase tracking-wider">Status Kesehatan:</label>
            <select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="all">Semua Kategori Kesehatan</option>
              <option value="sangat_baik">Sangat Baik (75 - 100%)</option>
              <option value="baik">Baik (50 - 74.9%)</option>
              <option value="sedang">Sedang (25 - 49.9%)</option>
              <option value="rusak">Rusak (&lt; 25%)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1 font-bold uppercase tracking-wider">Bleaching Alert (NOAA):</label>
            <select
              value={bleachingFilter}
              onChange={(e) => setBleachingFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="all">Semua Tingkat Bleaching</option>
              <option value="No Stress">No Stress (Aman)</option>
              <option value="Watch">Watch (Waspada Termal)</option>
              <option value="Warning">Warning (Peringatan)</option>
              <option value="Alert Level 1">Alert Level 1 (Pemutihan Signifikan)</option>
              <option value="Alert Level 2">Alert Level 2 (Kematian Karang Masif)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1 font-bold uppercase tracking-wider">Wilayah Geografis:</label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="all">Seluruh Wilayah Indonesia</option>
              <option value="papua_maluku">Papua & Maluku</option>
              <option value="sulawesi_kalimantan">Sulawesi & Kalimantan</option>
              <option value="nusa_tenggara">Nusa Tenggara (Komodo / NTB)</option>
              <option value="jawa_bali">Jawa & Bali</option>
            </select>
          </div>
        </div>
      </div>

      {/* HORIZONTAL CAROUSEL OF FILTERED CORAL SITES */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Menampilkan {filteredCoralSites.length} Situs Terumbu Karang:</span>
          <span>Klik kartu untuk melihat analisis mendalam</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredCoralSites.map((site) => {
            const isSelected = site.id === activeSite.id;
            const badge = getCoralHealthBadge(site.healthCategory);
            const bBadge = getBleachingBadge(site.bleachingAlert);

            return (
              <div
                key={site.id}
                onClick={() => setSelectedSiteId(site.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-teal-950/60 border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.25)] ring-1 ring-teal-400'
                    : 'bg-[#0f172a] border-slate-800 hover:border-slate-700 hover:bg-[#1e293b]/60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{site.name}</h4>
                      <span className="text-[11px] text-slate-400 block">{site.province}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                      {site.liveCoralCoverPct}%
                    </span>
                  </div>

                  {/* Progress Bar of Live Coral Cover */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${site.liveCoralCoverPct}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5">
                    <span>Bleaching: <strong className={bBadge.text}>{site.bleachingAlert}</strong></span>
                    <span>Biodiv: <strong className="text-cyan-300">{site.biodiversityScore}/100</strong></span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 truncate max-w-[140px]">{site.conservationStatus}</span>
                  <span className="text-teal-400 font-bold flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>Detail</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Coral Details Card */}
      <div className="bg-[#0f172a] border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">{activeSite.name}</h3>
              <p className="text-xs text-slate-400">{activeSite.marineProtectedArea} • Provinsi {activeSite.province}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onTriggerInfographic('coral', activeSite)}
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2 rounded-full border border-teal-400/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Infografis</span>
            </button>
          </div>
        </div>

        {/* 4 Detail Metric Cards for Coral Health */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-[#1e293b]/70 p-4.5 rounded-2xl border border-slate-800 space-y-1.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Tutupan Karang Hidup
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-emerald-300">{activeSite.liveCoralCoverPct}</span>
              <span className="text-xs text-slate-400">%</span>
            </div>
            <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${healthBadge.bg}`}>
              {healthBadge.label}
            </span>
          </div>

          <div className="bg-[#1e293b]/70 p-4.5 rounded-2xl border border-slate-800 space-y-1.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              Status Bleaching Alert
            </span>
            <div className={`text-xl font-bold ${bleachingBadge.text}`}>
              {activeSite.bleachingAlert}
            </div>
            <span className="text-[10px] text-slate-300 block font-medium">DHW: {activeSite.degreeHeatingWeeks} °C-weeks</span>
          </div>

          <div className="bg-[#1e293b]/70 p-4.5 rounded-2xl border border-slate-800 space-y-1.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
              <Fish className="w-3.5 h-3.5 text-cyan-400" />
              Skor Biodiversitas Ikan
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-cyan-300">{activeSite.biodiversityScore}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-300 block font-medium">Kejernihan: {activeSite.waterClarityMeters} m</span>
          </div>

          <div className="bg-[#1e293b]/70 p-4.5 rounded-2xl border border-slate-800 space-y-1.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Status Zonasi Konservasi
            </span>
            <div className="text-xs font-bold text-white truncate">
              {activeSite.conservationStatus}
            </div>
            <span className="text-[10px] text-teal-300 block truncate font-medium">{activeSite.rehabilitationProjects.split('&')[0]}</span>
          </div>
        </div>

        {/* Genera, Threats, and Key Species Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#1e293b]/70 p-5 rounded-2xl border border-slate-800 space-y-2.5">
            <span className="font-bold text-teal-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <Droplets className="w-3.5 h-3.5" />
              Genera Karang Dominan
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeSite.dominantGenera.map((g, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full bg-teal-950/60 text-teal-200 border border-teal-500/30 text-xs font-mono">
                  {g}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[#1e293b]/70 p-5 rounded-2xl border border-slate-800 space-y-2.5">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <Fish className="w-3.5 h-3.5" />
              Biota & Ikan Kunci Dilindungi
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeSite.keyFishSpecies.map((f, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full bg-cyan-950/60 text-cyan-200 border border-cyan-500/30 text-xs">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[#1e293b]/70 p-5 rounded-2xl border border-slate-800 space-y-2.5">
            <span className="font-bold text-rose-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              Faktor Ancaman Ekosistem
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeSite.threats.map((t, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full bg-rose-950/60 text-rose-200 border border-rose-500/30 text-xs">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Historical Coral Recovery Trend Chart (2018 - 2024) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Tren Historis Pemulihan Tutupan Karang (2018 - 2024)
            </span>
            <span className="text-slate-400 text-[11px]">Survei Berkala LIPI / BRIN / Reef Check</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeSite.historicalTrend} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', fontSize: '11px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                  formatter={(val: any, name: string) => [
                    `${val} %`,
                    name === 'coverPct' ? 'Tutupan Karang Hidup' : 'Persentase Pemutihan'
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="coverPct" name="Tutupan Karang (%)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="bleachingPct" name="Karang Putih (%)" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comparison Bar Chart Across Sites */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-400" />
              Perbandingan Tutupan Karang Antar-Situs Indonesia
            </span>
            <span className="text-slate-400 text-[11px]">Persentase Tutupan Hidup (%)</span>
          </div>

          <div className="h-48 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', fontSize: '11px' }}
                  formatter={(val: any) => [`${val}%`, 'Tutupan Karang']}
                />
                <Bar dataKey="coverPct" radius={[6, 6, 0, 0]}>
                  {comparisonChartData.map((entry) => (
                    <Cell
                      key={`cell-${entry.id}`}
                      fill={entry.id === activeSite.id ? '#14b8a6' : '#334155'}
                      className="cursor-pointer"
                      onClick={() => setSelectedSiteId(entry.id)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Coral Restoration Tech Showcase */}
        <div className="p-5 rounded-2xl bg-[#1e293b]/50 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center gap-1.5 text-teal-300 font-bold">
            <HeartHandshake className="w-4 h-4 text-teal-400" />
            <span className="uppercase tracking-wider text-[11px]">Inisiatif Restorasi & Rehabilitasi: {activeSite.rehabilitationProjects}</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Metode rehabilitasi berbasis sains melibatkan struktur substrat buatan (Reef Stars / Biorock), keterlibatan aktif masyarakat nelayan tradisional (seperti kearifan lokal Sasi Laut di Maluku & Papua), serta zona suaka larang-tangkap (No-Take Marine Sanctuary).
          </p>
        </div>
      </div>
    </div>
  );
};
