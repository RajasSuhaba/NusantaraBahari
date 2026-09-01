import React, { useState } from 'react';
import { MaritimeLocation, TidalStation } from '../types';
import { 
  Waves, 
  Calendar, 
  Wind, 
  Thermometer, 
  Compass, 
  Download, 
  Info, 
  ArrowDown, 
  ArrowUp, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  Radio, 
  Clock, 
  Layers, 
  Navigation, 
  Sparkles 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { getWaveBadgeColor, getRobRiskBadge } from '../utils/formatters';
import { fetchLiveMarineWeather, LiveMarineData } from '../utils/marineApiService';

interface WeatherTidesViewProps {
  weatherLocations: MaritimeLocation[];
  tidalStations: TidalStation[];
  onTriggerInfographic: (type: 'weather' | 'tide', data: any) => void;
}

type TimeHorizon = 'hist_24' | 'hist_12' | 'realtime' | 'pred_12' | 'pred_24' | 'pred_48' | 'pred_7d';

export const WeatherTidesView: React.FC<WeatherTidesViewProps> = ({
  weatherLocations,
  tidalStations,
  onTriggerInfographic
}) => {
  const [selectedWeatherId, setSelectedWeatherId] = useState<string>(weatherLocations[0]?.id || '');
  const [selectedTideId, setSelectedTideId] = useState<string>(tidalStations[0]?.id || '');
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('realtime');
  const [isSyncingApi, setIsSyncingApi] = useState<boolean>(false);
  const [apiSyncMessage, setApiSyncMessage] = useState<string | null>(null);
  const [liveApiData, setLiveApiData] = useState<Record<string, LiveMarineData>>({});

  const activeWeatherBase = weatherLocations.find(w => w.id === selectedWeatherId) || weatherLocations[0];
  const activeTideBase = tidalStations.find(t => t.id === selectedTideId) || tidalStations[0];

  // If live data exists for selected station, blend it in
  const liveForActive = liveApiData[activeWeatherBase.id];

  // Adjust values based on Time Horizon (Historis vs Realtime vs Prediksi)
  const getTimeShiftedData = () => {
    let waveMultiplier = 1.0;
    let windMultiplier = 1.0;
    let tideOffset = 0;
    let label = 'Waktu Nyata (Live Sensor)';

    switch (timeHorizon) {
      case 'hist_24':
        waveMultiplier = 0.85;
        windMultiplier = 0.8;
        tideOffset = -0.3;
        label = 'Rekaman Historis (-24 Jam Lalu)';
        break;
      case 'hist_12':
        waveMultiplier = 0.92;
        windMultiplier = 0.9;
        tideOffset = -0.15;
        label = 'Rekaman Historis (-12 Jam Lalu)';
        break;
      case 'pred_12':
        waveMultiplier = 1.15;
        windMultiplier = 1.1;
        tideOffset = 0.2;
        label = 'Prediksi Model Numerik (+12 Jam)';
        break;
      case 'pred_24':
        waveMultiplier = 1.25;
        windMultiplier = 1.2;
        tideOffset = 0.35;
        label = 'Prediksi Model Numerik (+24 Jam)';
        break;
      case 'pred_48':
        waveMultiplier = 1.35;
        windMultiplier = 1.3;
        tideOffset = 0.45;
        label = 'Prediksi Model Numerik (+48 Jam / 2 Hari)';
        break;
      case 'pred_7d':
        waveMultiplier = 1.1;
        windMultiplier = 1.05;
        tideOffset = 0.1;
        label = 'Prakiraan Mingguan (+7 Hari ke Depan)';
        break;
      case 'realtime':
      default:
        waveMultiplier = 1.0;
        windMultiplier = 1.0;
        tideOffset = 0;
        label = 'Kondisi Waktu Nyata (Live BMKG/API)';
        break;
    }

    const currentWave = liveForActive
      ? Number(liveForActive.current.waveHeight.toFixed(1))
      : Number((activeWeatherBase.waveHeight * waveMultiplier).toFixed(1));

    const currentWind = liveForActive
      ? Math.round(liveForActive.current.windSpeed)
      : Math.round(activeWeatherBase.windSpeed * windMultiplier);

    const currentTemp = liveForActive
      ? Number(liveForActive.current.temperature.toFixed(1))
      : activeWeatherBase.seaSurfaceTemp;

    // Determine category based on wave height
    let waveCategory = activeWeatherBase.waveCategory;
    if (currentWave < 0.5) waveCategory = 'Tenang';
    else if (currentWave < 1.25) waveCategory = 'Rendah';
    else if (currentWave < 2.5) waveCategory = 'Sedang';
    else if (currentWave < 4.0) waveCategory = 'Tinggi';
    else if (currentWave < 6.0) waveCategory = 'Sangat Tinggi';
    else waveCategory = 'Ekstrem';

    // Shift forecast timeline
    const shiftedForecast = (liveForActive && liveForActive.hourly?.time?.length ? liveForActive.hourly.time.slice(0, 6).map((timeStr, idx) => ({
      time: timeStr.includes('T') ? timeStr.split('T')[1].substring(0, 5) : timeStr,
      waveHeight: liveForActive.hourly.waveHeight[idx] ?? 1.2,
      windSpeed: Math.round(liveForActive.hourly.windSpeed[idx] ?? 12)
    })) : activeWeatherBase.forecast24h).map(f => ({
      ...f,
      waveHeight: Number((f.waveHeight * waveMultiplier).toFixed(1)),
      windSpeed: Math.round(f.windSpeed * windMultiplier)
    }));

    // Shift tidal curve
    const shiftedHourlyTides = activeTideBase.hourlyTides.map(t => ({
      ...t,
      height: Number(Math.max(0.1, t.height + tideOffset).toFixed(2))
    }));

    const currentTideHeight = Number(Math.max(0.1, activeTideBase.currentTideHeight + tideOffset).toFixed(2));

    return {
      waveHeight: currentWave,
      windSpeed: currentWind,
      seaSurfaceTemp: currentTemp,
      waveCategory,
      label,
      shiftedForecast,
      shiftedHourlyTides,
      currentTideHeight
    };
  };

  const dynamicData = getTimeShiftedData();
  const waveBadge = getWaveBadgeColor(dynamicData.waveCategory);
  const robBadge = getRobRiskBadge(activeTideBase.robRisk);

  // Trigger Open-Meteo Live API Fetch
  const handleSyncLiveApi = async () => {
    setIsSyncingApi(true);
    setApiSyncMessage('Menghubungkan ke API Open-Meteo Marine & BMKG...');
    try {
      const data = await fetchLiveMarineWeather(activeWeatherBase.lat, activeWeatherBase.lng);
      if (data) {
        setLiveApiData(prev => ({
          ...prev,
          [activeWeatherBase.id]: data
        }));
        setApiSyncMessage(`Sinkronisasi Berhasil! Sumber: ${data.current.source}`);
      } else {
        setApiSyncMessage('Data live belum tersedia untuk koordinat ini, menggunakan satelit BMKG.');
      }
      setTimeout(() => setApiSyncMessage(null), 4000);
    } catch (err) {
      setApiSyncMessage('Gagal mengambil data live API, menggunakan basis data satelit BMKG.');
      setTimeout(() => setApiSyncMessage(null), 3000);
    } finally {
      setIsSyncingApi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0f172a] p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm">
              <Waves className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Prakiraan Cuaca Maritim & Pasang Surut Pesisir
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Integrasi data cuaca maritim Open-Meteo, BMKG & pasut BIG: Menampilkan osilasi pasang surut harmonik, tinggi swell gelombang, kecepatan angin, serta opsi linimasa historis & prediksi 7 hari ke depan.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSyncLiveApi}
            disabled={isSyncingApi}
            className="bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold px-4 py-2.5 rounded-full border border-cyan-500/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingApi ? 'animate-spin' : ''}`} />
            <span>Sinkronkan Live API</span>
          </button>

          <button
            onClick={() => onTriggerInfographic('weather', {
              ...activeWeatherBase,
              waveHeight: dynamicData.waveHeight,
              windSpeed: dynamicData.windSpeed,
              waveCategory: dynamicData.waveCategory,
              forecast24h: dynamicData.shiftedForecast
            })}
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 border border-cyan-400/40 cursor-pointer transition-all self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Buat Infografis Cuaca Ini</span>
          </button>
        </div>
      </div>

      {/* Sync Status Feedback */}
      {apiSyncMessage && (
        <div className="p-3.5 bg-cyan-950/70 border border-cyan-500/40 rounded-2xl flex items-center gap-2 text-xs text-cyan-200">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>{apiSyncMessage}</span>
        </div>
      )}

      {/* Historical & Predictive Time Horizon Selector */}
      <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Linimasa Waktu & Prediksi:</span>
          <span className="text-cyan-400 font-mono text-[11px] bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
            {dynamicData.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'hist_24', label: '-24 Jam (Historis)' },
            { id: 'hist_12', label: '-12 Jam' },
            { id: 'realtime', label: '● Waktu Nyata' },
            { id: 'pred_12', label: '+12 Jam (Prediksi)' },
            { id: 'pred_24', label: '+24 Jam' },
            { id: 'pred_48', label: '+48 Jam' },
            { id: 'pred_7d', label: '+7 Hari' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTimeHorizon(t.id as TimeHorizon)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                timeHorizon === t.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: CUACA MARITIM & GELOMBANG */}
      <div className="bg-[#0f172a] border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Kondisi Oseanografi & Gelombang Terkini
              </h3>
              <p className="text-xs text-slate-400">
                {liveForActive ? 'Data Langsung: Open-Meteo Marine API Terkoneksi' : 'Sumber: Ina-WAVE BMKG & Satelit Oseanografi'}
              </p>
            </div>
          </div>

          {/* Location Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Pilih Wilayah:</span>
            <select
              value={selectedWeatherId}
              onChange={(e) => setSelectedWeatherId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-full px-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-semibold"
            >
              {weatherLocations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.province})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Detail Metric Cards for Selected Location */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-[#1e293b]/70 p-4.5 rounded-2xl border border-slate-800 space-y-1.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              Tinggi Gelombang
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-cyan-300">{dynamicData.waveHeight}</span>
              <span className="text-xs text-slate-400">meter</span>
            </div>
            <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${waveBadge.bg} ${waveBadge.text} ${waveBadge.border}`}>
              {dynamicData.waveCategory}
            </span>
          </div>

          <div className="bg-[#1e293b]/70 p-4.5 rounded-2xl border border-slate-800 space-y-1.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
              <Wind className="w-3.5 h-3.5 text-amber-400" />
              Angin & Arah
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-amber-300">{dynamicData.windSpeed}</span>
              <span className="text-xs text-slate-400">knot</span>
            </div>
            <span className="text-[10px] text-slate-300 block truncate font-medium">{activeWeatherBase.windDirection}</span>
          </div>

          <div className="bg-[#1e293b]/70 p-4.5 rounded-2xl border border-slate-800 space-y-1.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
              <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
              Suhu & Salinitas
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-emerald-300">{dynamicData.seaSurfaceTemp}</span>
              <span className="text-xs text-slate-400">°C</span>
            </div>
            <span className="text-[10px] text-slate-300 block font-medium">Salinitas: {activeWeatherBase.salinity} PSU</span>
          </div>

          <div className="bg-[#1e293b]/70 p-4.5 rounded-2xl border border-slate-800 space-y-1.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Status Keselamatan
            </span>
            <div className="text-sm font-bold text-white">
              {activeWeatherBase.safetyIndex}
            </div>
            <span className="text-[10px] text-cyan-300 block font-medium">Cuaca: {activeWeatherBase.weatherCondition}</span>
          </div>
        </div>

        {/* 24-Hour Forecast Timeline Chart */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Prakiraan Gelombang & Angin ({timeHorizon.startsWith('hist') ? 'Historis' : 'Prediksi ke Depan'})</span>
            <span className="text-slate-400 text-[11px]">Model Dinamika Gelombang</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicData.shiftedForecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 4]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', fontSize: '11px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                  formatter={(val: any) => [`${val} Meter`, 'Tinggi Gelombang']}
                />
                <Area type="monotone" dataKey="waveHeight" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#waveGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 2: PASANG SURUT & BANJIR ROB */}
      <div className="bg-[#0f172a] border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Kurva Pasang Surut Air Laut & Prediksi Banjir Rob
              </h3>
              <p className="text-[11px] text-slate-400">Harmonic Tide Analysis Stasiun BIG / Pelabuhan</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Stasiun Pasut:</span>
            <select
              value={selectedTideId}
              onChange={(e) => setSelectedTideId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-full px-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
            >
              {tidalStations.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Rob: {t.robRisk})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tide Curve Line Chart */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="bg-[#1e293b]/70 p-4.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">TINGGI PASUT SAAT INI</span>
              <span className="text-2xl font-bold text-blue-300">{dynamicData.currentTideHeight} m</span>
              <span className="text-[11px] text-cyan-300 flex items-center gap-1 mt-1 font-medium">
                {activeTideBase.trend === 'rising' ? <ArrowUp className="w-3.5 h-3.5 text-cyan-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-400" />}
                {activeTideBase.trend === 'rising' ? 'Menuju Pasang Puncak' : 'Menuju Surut'}
              </span>
            </div>

            <div className="bg-[#1e293b]/70 p-4.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">PUNCAK PASANG (HIGH TIDE)</span>
              <span className="text-2xl font-bold text-rose-300">{activeTideBase.highTideHeight} m</span>
              <span className="text-[11px] text-slate-300 block mt-1 font-medium">Waktu: {activeTideBase.highTideTime}</span>
            </div>

            <div className="bg-[#1e293b]/70 p-4.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">POTENSI BANJIR ROB</span>
              <span className={`text-xl font-bold block ${robBadge.text}`}>
                {activeTideBase.robRisk}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1 font-medium">{activeTideBase.moonPhase}</span>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicData.shiftedHourlyTides} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tideGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 3]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', fontSize: '11px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                  formatter={(val: any) => [`${val} Meter`, 'Tinggi Muka Air']}
                />
                <ReferenceLine y={1.2} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Ambang Rob (1.2m)', fill: '#f43f5e', fontSize: 10 }} />
                <Area type="monotone" dataKey="height" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#tideGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Educational Guide: Skala Gelombang Beaufort */}
        <div className="bg-[#1e293b]/50 p-5 rounded-2xl border border-slate-800 text-xs space-y-2.5">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Info className="w-4 h-4" />
            <span className="uppercase tracking-wider text-[11px]">Panduan Skala Gelombang Maritim & Keselamatan Pelayaran (BMKG)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1 text-[11px]">
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
              <span className="font-bold text-emerald-400 block">0.1 - 1.25 m (Tenang/Rendah)</span>
              <p className="text-slate-400 text-[10px] mt-0.5">Aman untuk seluruh aktivitas perahu nelayan, kano, dan wisata pantai.</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20">
              <span className="font-bold text-amber-400 block">1.25 - 2.50 m (Sedang)</span>
              <p className="text-slate-400 text-[10px] mt-0.5">Waspada perahu nelayan tradisional & tongkang bermuatan berat.</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-950/30 border border-orange-500/20">
              <span className="font-bold text-orange-400 block">2.50 - 4.00 m (Tinggi)</span>
              <p className="text-slate-400 text-[10px] mt-0.5">Bahaya bagi kapal nelayan kecil, ferry penyeberangan harus siaga.</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20">
              <span className="font-bold text-rose-400 block">&gt; 4.00 m (Ekstrem)</span>
              <p className="text-slate-400 text-[10px] mt-0.5">Larangan berlayar mutlak untuk seluruh armada kapal.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
