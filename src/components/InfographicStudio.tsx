import React, { useState, useRef, useEffect, useMemo, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { toPng, toJpeg, toSvg } from 'html-to-image';
import { 
  MaritimeLocation, 
  TidalStation, 
  CoralReefSite, 
  CoastalAlert, 
  CustomUploadedRow 
} from '../types';
import { 
  Download, 
  Printer, 
  Palette, 
  Layers, 
  Type, 
  Sparkles, 
  Waves, 
  ShieldAlert, 
  Compass, 
  FileSpreadsheet, 
  RefreshCw, 
  QrCode, 
  Calendar, 
  CalendarRange,
  MapPin, 
  Thermometer, 
  Wind, 
  Fish, 
  Anchor, 
  Navigation, 
  Sun, 
  Droplets, 
  Heart, 
  BarChart3, 
  PieChart as PieIcon, 
  Grid, 
  TrendingUp, 
  TrendingDown,
  Calculator,
  Check, 
  Upload, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle,
  Radio,
  Clock,
  LayoutGrid,
  Maximize2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie, 
  AreaChart, 
  Area,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';
import { getWaveBadgeColor, getCoralHealthBadge, getBleachingBadge, getRobRiskBadge } from '../utils/formatters';
import { fetchLiveMarineWeather, LiveMarineData } from '../utils/marineApiService';
import { 
  generateDateRangeData, 
  exportDateRangeToExcel, 
  DateRangeAnalysisResult 
} from '../utils/timeRangeService';

interface InfographicStudioProps {
  weatherLocations: MaritimeLocation[];
  tidalStations: TidalStation[];
  coralSites: CoralReefSite[];
  coastalAlerts: CoastalAlert[];
  customUploadedData: CustomUploadedRow[];
  prefilledType?: 'weather' | 'coral' | 'tide' | 'alert' | 'custom';
  prefilledData?: any;
}

type ChartType = 'bar_chart' | 'pie_chart' | 'heatmap_matrix' | 'line_chart' | 'metric_gauge';
type FontStyle = 'sans' | 'display' | 'serif' | 'mono';
type ThemeColor = 'ocean' | 'coral' | 'navy' | 'warning' | 'emerald' | 'crimson' | 'obsidian' | 'sunset';
type MultiLayoutType = 'grid_2x2' | 'grid_2_col' | 'stacked';

export const InfographicStudio: React.FC<InfographicStudioProps> = ({
  weatherLocations: initialWeather,
  tidalStations: initialTides,
  coralSites,
  coastalAlerts,
  customUploadedData: initialCustomData,
  prefilledType = 'weather',
  prefilledData
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Template State
  const [templateCategory, setTemplateCategory] = useState<'weather_marine' | 'coral_reef' | 'tides_rob' | 'disaster_warning' | 'custom_data'>(
    prefilledType === 'coral' ? 'coral_reef' :
    prefilledType === 'tide' ? 'tides_rob' :
    prefilledType === 'alert' ? 'disaster_warning' :
    prefilledType === 'custom' ? 'custom_data' : 'weather_marine'
  );

  // Real-time Live Synchronization State
  const [weatherLocations, setWeatherLocations] = useState<MaritimeLocation[]>(initialWeather);
  const [tidalStations, setTidalStations] = useState<TidalStation[]>(initialTides);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0); // 0 = off, 30 = 30s, 60 = 60s, 300 = 5m
  const [liveDataSource, setLiveDataSource] = useState<string>('Open-Meteo & Ina-WAVE BMKG');

  // Custom Uploaded Data stored locally in studio
  const [uploadedRows, setUploadedRows] = useState<CustomUploadedRow[]>(initialCustomData);
  const [isUploading, setIsUploading] = useState(false);

  // Layout & Chart Mode State (Single vs Multi-Chart)
  const [chartMode, setChartMode] = useState<'single' | 'multi'>('multi');
  const [layoutSize, setLayoutSize] = useState<'square' | 'story' | 'poster' | 'landscape'>('poster');
  const [multiLayout, setMultiLayout] = useState<MultiLayoutType>('grid_2x2');
  
  // Single Chart selected
  const [singleChartType, setSingleChartType] = useState<ChartType>('bar_chart');

  // Multi-Chart Selected Components (Checklist)
  const [selectedMultiCharts, setSelectedMultiCharts] = useState<{
    barForecast: boolean;
    lineTrend: boolean;
    pieDonut: boolean;
    heatmap: boolean;
    metricCards: boolean;
    crossComparison: boolean;
  }>({
    barForecast: true,
    lineTrend: true,
    pieDonut: true,
    heatmap: true,
    metricCards: true,
    crossComparison: false
  });

  const [themeColor, setThemeColor] = useState<ThemeColor>('ocean');
  const [fontFamily, setFontFamily] = useState<FontStyle>('sans');
  const [selectedIcon, setSelectedIcon] = useState<string>('waves');

  // Selected Records
  const [selectedWeatherId, setSelectedWeatherId] = useState<string>(
    prefilledType === 'weather' && prefilledData?.id ? prefilledData.id : initialWeather[0]?.id || ''
  );
  const [selectedCoralId, setSelectedCoralId] = useState<string>(
    prefilledType === 'coral' && prefilledData?.id ? prefilledData.id : coralSites[0]?.id || ''
  );
  const [selectedTideId, setSelectedTideId] = useState<string>(
    prefilledType === 'tide' && prefilledData?.id ? prefilledData.id : initialTides[0]?.id || ''
  );
  const [selectedAlertId, setSelectedAlertId] = useState<string>(
    prefilledType === 'alert' && prefilledData?.id ? prefilledData.id : coastalAlerts[0]?.id || ''
  );
  const [selectedCustomIndex, setSelectedCustomIndex] = useState<number>(0);

  // Text Customizations
  const [customTitle, setCustomTitle] = useState('INFOGRAFIS MARITIM & KELAUTAN INDONESIA');
  const [customSubtitle, setCustomSubtitle] = useState('Laporan Komprehensif: Prakiraan Gelombang, Fluktuasi Pasut, Suhu & Konservasi');
  const [customNotes, setCustomNotes] = useState('Data dihimpun dari Stasiun Pengamatan Maritim Nasional, Satelit Oseanografi & Jaringan Konservasi Terumbu Karang.');
  const [footerOrg, setFooterOrg] = useState('Pusat Informasi Kelautan & Pesisir Nusantara');
  const [contactEmergency, setContactEmergency] = useState('Call Center Maritim: 115 / SAR: 115 / BMKG: 196');

  // Toggles
  const [showCharts, setShowCharts] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showSafetyTips, setShowSafetyTips] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);

  // Active data record
  const activeWeather = weatherLocations.find(l => l.id === selectedWeatherId) || weatherLocations[0];
  const activeCoral = coralSites.find(c => c.id === selectedCoralId) || coralSites[0];
  const activeTide = tidalStations.find(t => t.id === selectedTideId) || tidalStations[0];
  const activeAlert = coastalAlerts.find(a => a.id === selectedAlertId) || coastalAlerts[0];
  const activeCustom = uploadedRows[selectedCustomIndex] || uploadedRows[0];

  // Date Range and Aggregation State
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [datePreset, setDatePreset] = useState<'7d' | '14d' | '30d' | '3m' | '6m' | '1y' | 'custom'>('7d');
  const [aggregationMode, setAggregationMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  // Apply quick date presets helper
  const applyDatePreset = (preset: '7d' | '14d' | '30d' | '3m' | '6m' | '1y') => {
    setDatePreset(preset);
    const end = new Date();
    const start = new Date();
    if (preset === '7d') {
      start.setDate(end.getDate() - 6);
      setAggregationMode('daily');
    } else if (preset === '14d') {
      start.setDate(end.getDate() - 13);
      setAggregationMode('weekly');
    } else if (preset === '30d') {
      start.setDate(end.getDate() - 29);
      setAggregationMode('weekly');
    } else if (preset === '3m') {
      start.setMonth(end.getMonth() - 3);
      setAggregationMode('monthly');
    } else if (preset === '6m') {
      start.setMonth(end.getMonth() - 6);
      setAggregationMode('monthly');
    } else if (preset === '1y') {
      start.setFullYear(end.getFullYear() - 1);
      setAggregationMode('monthly');
    }
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Derived Date Range Analysis Dataset
  const dateRangeAnalysis: DateRangeAnalysisResult = useMemo(() => {
    return generateDateRangeData(startDate, endDate, activeWeather, activeCoral, activeTide);
  }, [startDate, endDate, activeWeather, activeCoral, activeTide]);

  // Handle Export to Excel
  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      const locName = templateCategory === 'weather_marine' ? activeWeather.name :
        templateCategory === 'coral_reef' ? activeCoral.name :
        templateCategory === 'tides_rob' ? activeTide.name :
        templateCategory === 'disaster_warning' ? activeAlert.title :
        activeCustom?.lokasi || 'Stasiun Maritim';

      const provArea = templateCategory === 'weather_marine' ? `${activeWeather.province} - ${activeWeather.seaArea}` :
        templateCategory === 'coral_reef' ? `${activeCoral.province} - ${activeCoral.marineProtectedArea}` :
        templateCategory === 'tides_rob' ? `${activeTide.province} - ${activeTide.location}` :
        'Wilayah Kelautan Indonesia';

      exportDateRangeToExcel(locName, provArea, startDate, endDate, dateRangeAnalysis);
      setExportSuccessMsg(`Data Excel periode (${startDate} s.d. ${endDate}) berhasil diunduh dengan ringkasan rata-rata!`);
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to export Excel', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Function to perform live API data fetch and sync
  const performLiveSync = async (showToast = true) => {
    setIsLiveSyncing(true);
    try {
      if (templateCategory === 'weather_marine' && activeWeather) {
        const liveData = await fetchLiveMarineWeather(activeWeather.lat, activeWeather.lng);
        if (liveData) {
          setWeatherLocations(prev => prev.map(loc => {
            if (loc.id === activeWeather.id) {
              const updatedForecast = liveData.hourly?.time?.slice(0, 6).map((tStr, idx) => ({
                time: tStr.includes('T') ? tStr.split('T')[1].substring(0, 5) : tStr,
                waveHeight: Number(liveData.hourly.waveHeight[idx]?.toFixed(1) ?? loc.waveHeight),
                windSpeed: Math.round(liveData.hourly.windSpeed[idx] ?? loc.windSpeed),
                windDirection: loc.forecast24h[idx]?.windDirection || loc.windDirection,
                weather: loc.forecast24h[idx]?.weather || loc.weatherCondition,
                seaSurfaceTemp: Number(liveData.hourly.temperature[idx]?.toFixed(1) ?? loc.seaSurfaceTemp)
              })) || loc.forecast24h;

              return {
                ...loc,
                waveHeight: Number(liveData.current.waveHeight.toFixed(1)),
                windSpeed: Math.round(liveData.current.windSpeed),
                seaSurfaceTemp: Number(liveData.current.temperature.toFixed(1)),
                forecast24h: updatedForecast
              };
            }
            return loc;
          }));
          setLiveDataSource(liveData.current.source || 'Open-Meteo Live API');
        }
      }

      const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
      setLastSyncTime(timestamp);
      if (showToast) {
        setExportSuccessMsg(`Data sumber berhasil disinkronkan pada ${timestamp}!`);
        setTimeout(() => setExportSuccessMsg(null), 3500);
      }
    } catch (err) {
      console.warn('Live sync fallback used', err);
    } finally {
      setIsLiveSyncing(false);
    }
  };

  // Auto-refresh interval effect
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      performLiveSync(false);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, templateCategory, selectedWeatherId]);

  // Handle direct file upload in Studio
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson = XLSX.utils.sheet_to_json<any>(ws);

        const parsedRows: CustomUploadedRow[] = rawJson.map((row, idx) => ({
          id: `custom-stud-${idx + 1}`,
          lokasi: row.lokasi || row.Lokasi || row.station || row.Stasiun || row.name || `Titik ${idx + 1}`,
          kategori: row.kategori || row.Kategori || row.category || 'Observasi Mandiri',
          lat: Number(row.lat || row.Lat || row.latitude || -2.5 + (Math.random() - 0.5) * 4),
          lng: Number(row.lng || row.Lng || row.longitude || 118.0 + (Math.random() - 0.5) * 8),
          parameter1_nama: row.parameter1_nama || 'Gelombang (m)',
          parameter1_nilai: row.parameter1_nilai ?? row.waveHeight ?? row.gelombang ?? (1.0 + Math.random() * 2.5).toFixed(1),
          parameter2_nama: row.parameter2_nama || 'Angin (kts)',
          parameter2_nilai: row.parameter2_nilai ?? row.windSpeed ?? row.angin ?? Math.round(8 + Math.random() * 18),
          parameter3_nama: row.parameter3_nama || 'Tutupan Karang (%)',
          parameter3_nilai: row.parameter3_nilai ?? row.coralCover ?? (40 + Math.random() * 50).toFixed(0),
          status: row.status || row.Status || 'Normal Operasional',
          keterangan: row.keterangan || row.Keterangan || 'Data hasil olah berkas spreadsheet mandiri.'
        }));

        if (parsedRows.length > 0) {
          setUploadedRows(parsedRows);
          setTemplateCategory('custom_data');
          setSelectedCustomIndex(0);
          setCustomTitle('LAPORAN DATA MARITIM DARI BERKAS');
          setCustomSubtitle(`Visualisasi Olah Data dari ${file.name}`);
        }
      } catch (err) {
        console.error('Error parsing file in studio', err);
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Color Theme Presets
  const getThemeClasses = () => {
    switch (themeColor) {
      case 'ocean':
        return {
          bg: 'bg-gradient-to-b from-[#020617] via-[#082f49] to-[#0f172a]',
          accent: 'from-cyan-400 to-teal-300',
          accentColor: '#06b6d4',
          card: 'bg-[#0f172a]/90 border-cyan-500/30',
          highlight: 'text-cyan-300',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
          chartColors: ['#06b6d4', '#14b8a6', '#38bdf8', '#0284c7', '#22d3ee', '#34d399']
        };
      case 'coral':
        return {
          bg: 'bg-gradient-to-b from-[#020617] via-[#134e4a] to-[#0f172a]',
          accent: 'from-teal-300 to-amber-300',
          accentColor: '#14b8a6',
          card: 'bg-[#0f172a]/90 border-teal-500/30',
          highlight: 'text-teal-300',
          badge: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
          chartColors: ['#14b8a6', '#2dd4bf', '#f59e0b', '#10b981', '#06b6d4', '#ec4899']
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-b from-[#020617] via-[#451a03] to-[#0f172a]',
          accent: 'from-amber-400 to-orange-400',
          accentColor: '#f59e0b',
          card: 'bg-[#0f172a]/90 border-amber-500/30',
          highlight: 'text-amber-300',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
          chartColors: ['#f59e0b', '#f97316', '#fbbf24', '#ea580c', '#eab308', '#ef4444']
        };
      case 'crimson':
        return {
          bg: 'bg-gradient-to-b from-[#020617] via-[#4c0519] to-[#0f172a]',
          accent: 'from-rose-400 to-pink-400',
          accentColor: '#f43f5e',
          card: 'bg-[#0f172a]/90 border-rose-500/30',
          highlight: 'text-rose-300',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
          chartColors: ['#f43f5e', '#fb7185', '#e11d48', '#fda4af', '#be123c', '#f59e0b']
        };
      case 'emerald':
        return {
          bg: 'bg-gradient-to-b from-[#020617] via-[#064e3b] to-[#0f172a]',
          accent: 'from-emerald-300 to-cyan-300',
          accentColor: '#10b981',
          card: 'bg-[#0f172a]/90 border-emerald-500/30',
          highlight: 'text-emerald-300',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          chartColors: ['#10b981', '#34d399', '#059669', '#6ee7b7', '#047857', '#06b6d4']
        };
      case 'sunset':
        return {
          bg: 'bg-gradient-to-b from-[#020617] via-[#581c87] to-[#1e1b4b]',
          accent: 'from-fuchsia-400 to-amber-300',
          accentColor: '#c084fc',
          card: 'bg-[#0f172a]/90 border-fuchsia-500/30',
          highlight: 'text-fuchsia-300',
          badge: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/40',
          chartColors: ['#c084fc', '#e879f9', '#f59e0b', '#fb923c', '#818cf8', '#38bdf8']
        };
      case 'obsidian':
        return {
          bg: 'bg-gradient-to-b from-[#000000] via-[#0f172a] to-[#020617]',
          accent: 'from-slate-200 to-cyan-400',
          accentColor: '#94a3b8',
          card: 'bg-[#0f172a]/95 border-slate-700',
          highlight: 'text-slate-200',
          badge: 'bg-slate-800 text-slate-200 border-slate-600',
          chartColors: ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f43f5e', '#a855f7']
        };
      case 'navy':
      default:
        return {
          bg: 'bg-gradient-to-b from-[#020617] via-[#172554] to-[#0f172a]',
          accent: 'from-blue-400 to-cyan-300',
          accentColor: '#3b82f6',
          card: 'bg-[#0f172a]/90 border-blue-500/30',
          highlight: 'text-blue-300',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
          chartColors: ['#3b82f6', '#60a5fa', '#06b6d4', '#93c5fd', '#2563eb', '#14b8a6']
        };
    }
  };

  const theme = getThemeClasses();

  // Font family helper
  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case 'display':
        return 'font-extrabold tracking-tight';
      case 'serif':
        return 'font-serif';
      case 'mono':
        return 'font-mono text-[13px]';
      case 'sans':
      default:
        return 'font-sans';
    }
  };

  // Render chosen top banner icon
  const renderBannerIcon = () => {
    switch (selectedIcon) {
      case 'fish': return <Fish className="w-5 h-5" />;
      case 'coral': return <Sparkles className="w-5 h-5" />;
      case 'wind': return <Wind className="w-5 h-5" />;
      case 'thermometer': return <Thermometer className="w-5 h-5" />;
      case 'shield': return <ShieldAlert className="w-5 h-5" />;
      case 'compass': return <Compass className="w-5 h-5" />;
      case 'anchor': return <Anchor className="w-5 h-5" />;
      case 'navigation': return <Navigation className="w-5 h-5" />;
      case 'sun': return <Sun className="w-5 h-5" />;
      case 'droplets': return <Droplets className="w-5 h-5" />;
      case 'heart': return <Heart className="w-5 h-5" />;
      case 'chart': return <BarChart3 className="w-5 h-5" />;
      case 'waves':
      default:
        return <Waves className="w-5 h-5" />;
    }
  };

  // Canvas Dimension scaling
  const getCanvasDimensions = () => {
    switch (layoutSize) {
      case 'story':
        return 'w-full max-w-[460px] min-h-[820px]';
      case 'poster':
        return 'w-full max-w-[680px] min-h-[880px]';
      case 'landscape':
        return 'w-full max-w-[900px] min-h-[580px]';
      case 'square':
      default:
        return 'w-full max-w-[640px] min-h-[640px]';
    }
  };

  // Download Handlers
  const handleDownloadPng = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(canvasRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true
      });
      const link = document.createElement('a');
      link.download = `Infografis_NusantaraBahari_${templateCategory}_${chartMode}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      setExportSuccessMsg('Infografis PNG HD (Multi-Visualisasi) berhasil diunduh!');
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to export PNG', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadJpg = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toJpeg(canvasRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true
      });
      const link = document.createElement('a');
      link.download = `Infografis_NusantaraBahari_${templateCategory}_${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
      setExportSuccessMsg('Infografis JPG berkualitas tinggi berhasil diunduh!');
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to export JPG', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(canvasRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true
      });
      const isLandscape = layoutSize === 'landscape';
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'px',
        format: isLandscape ? [900, 580] : layoutSize === 'story' ? [460, 820] : layoutSize === 'poster' ? [680, 880] : [640, 640]
      });

      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      pdf.save(`Dokumen_Infografis_NusantaraBahari_${templateCategory}_${Date.now()}.pdf`);
      setExportSuccessMsg('Dokumen PDF Infografis berhasil diunduh!');
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to export PDF', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSvg = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toSvg(canvasRef.current);
      const link = document.createElement('a');
      link.download = `Infografis_NusantaraBahari_${templateCategory}_${Date.now()}.svg`;
      link.href = dataUrl;
      link.click();
      setExportSuccessMsg('Vektor SVG Infografis berhasil diunduh!');
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to export SVG', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Helper datasets for the charts dynamically adapting to Date Range & Aggregation Mode
  const barChartData = useMemo(() => {
    if (aggregationMode === 'weekly') {
      return dateRangeAnalysis.weeklyAverages.map((w, idx) => ({
        name: w.periodLabel.length > 14 ? `Mgu ${idx + 1}` : w.periodLabel,
        val1: w.avgWaveHeight,
        val2: w.avgWindSpeed,
        label: 'Rata-rata Gelombang (m)'
      }));
    } else if (aggregationMode === 'monthly') {
      return dateRangeAnalysis.monthlyAverages.map(m => ({
        name: m.periodLabel.length > 12 ? m.periodLabel.substring(0, 8) + '..' : m.periodLabel,
        val1: m.avgWaveHeight,
        val2: m.avgWindSpeed,
        label: 'Rata-rata Bulanan (m)'
      }));
    } else {
      // Daily mode
      if (templateCategory === 'weather_marine') {
        const recs = dateRangeAnalysis.records.length > 12 ? dateRangeAnalysis.records.slice(-10) : dateRangeAnalysis.records;
        return recs.map(r => ({
          name: r.displayDate.substring(0, 6),
          val1: r.waveHeight,
          val2: r.windSpeed,
          label: 'Gelombang (m)'
        }));
      } else if (templateCategory === 'coral_reef') {
        return activeCoral.historicalTrend.map(t => ({ name: `${t.year}`, val1: t.coverPct, val2: t.bleachingPct, label: 'Karang Hidup' }));
      } else if (templateCategory === 'tides_rob') {
        return activeTide.hourlyTides.map(t => ({ name: t.hour, val1: t.height, val2: activeTide.highTideHeight, label: 'Tinggi Pasut' }));
      } else {
        return uploadedRows.slice(0, 6).map((r, i) => ({
          name: r.lokasi.length > 8 ? r.lokasi.substring(0, 8) + '..' : r.lokasi,
          val1: Number(r.parameter1_nilai) || (i + 1) * 2,
          val2: Number(r.parameter2_nilai) || (i + 1) * 4,
          label: r.parameter1_nama || 'Nilai 1'
        }));
      }
    }
  }, [aggregationMode, dateRangeAnalysis, templateCategory, activeCoral, activeTide, uploadedRows]);

  const lineTrendData = useMemo(() => {
    if (aggregationMode === 'weekly') {
      return dateRangeAnalysis.weeklyAverages.map((w, idx) => ({
        name: w.periodLabel.length > 14 ? `Mgu ${idx + 1}` : w.periodLabel,
        wave: w.avgWaveHeight,
        wind: w.avgWindSpeed,
        temp: w.avgSeaSurfaceTemp,
        cover: 70 - idx * 1.5,
        pasut: w.avgWaveHeight
      }));
    } else if (aggregationMode === 'monthly') {
      return dateRangeAnalysis.monthlyAverages.map(m => ({
        name: m.periodLabel.length > 12 ? m.periodLabel.substring(0, 8) + '..' : m.periodLabel,
        wave: m.avgWaveHeight,
        wind: m.avgWindSpeed,
        temp: m.avgSeaSurfaceTemp,
        cover: 68,
        pasut: m.avgWaveHeight
      }));
    } else {
      // Daily mode
      if (templateCategory === 'weather_marine') {
        const recs = dateRangeAnalysis.records.length > 14 ? dateRangeAnalysis.records.slice(-14) : dateRangeAnalysis.records;
        return recs.map(r => ({
          name: r.displayDate.substring(0, 6),
          wave: r.waveHeight,
          wind: r.windSpeed,
          temp: r.seaSurfaceTemp
        }));
      } else if (templateCategory === 'coral_reef') {
        return activeCoral.historicalTrend.map(t => ({ name: `${t.year}`, cover: t.coverPct, bleach: t.bleachingPct }));
      } else if (templateCategory === 'tides_rob') {
        return activeTide.hourlyTides.map(t => ({ name: t.hour, pasut: t.height }));
      } else {
        return uploadedRows.slice(0, 6).map((r, i) => ({
          name: r.lokasi.length > 8 ? r.lokasi.substring(0, 8) + '..' : r.lokasi,
          p1: Number(r.parameter1_nilai) || (i + 1) * 2,
          p2: Number(r.parameter2_nilai) || (i + 1) * 3
        }));
      }
    }
  }, [aggregationMode, dateRangeAnalysis, templateCategory, activeCoral, activeTide, uploadedRows]);

  const pieCompositionData = useMemo(() => {
    if (templateCategory === 'weather_marine') {
      return [
        { name: 'Gelombang Swell', value: Number((dateRangeAnalysis.overallStats.avgWaveHeight * 0.6).toFixed(1)) },
        { name: 'Wind Waves', value: Number((dateRangeAnalysis.overallStats.avgWaveHeight * 0.4).toFixed(1)) },
        { name: 'Arus Permukaan', value: Number(dateRangeAnalysis.overallStats.avgCurrentSpeed.toFixed(1)) },
        { name: 'Suhu Rata-rata', value: Number((dateRangeAnalysis.overallStats.avgSeaSurfaceTemp / 10).toFixed(1)) }
      ];
    } else if (templateCategory === 'coral_reef') {
      return [
        { name: 'Karang Hidup (Live)', value: activeCoral.liveCoralCoverPct },
        { name: 'Karang Mati (Dead)', value: Math.max(0, 100 - activeCoral.liveCoralCoverPct - activeCoral.degreeHeatingWeeks * 3) },
        { name: 'Algae & Substrat', value: Math.min(30, Math.round(activeCoral.degreeHeatingWeeks * 3)) },
        { name: 'Biota Lain', value: 10 }
      ];
    } else if (templateCategory === 'tides_rob') {
      return [
        { name: 'Tinggi Pasut Terkini', value: activeTide.currentTideHeight },
        { name: 'Puncak Pasang (High)', value: activeTide.highTideHeight },
        { name: 'Surut Rendah (Low)', value: activeTide.lowTideHeight },
        { name: 'Rentang Spring Tide', value: activeTide.springTideRange }
      ];
    } else {
      return [
        { name: 'Parameter 1', value: Number(activeCustom?.parameter1_nilai) || 45 },
        { name: 'Parameter 2', value: Number(activeCustom?.parameter2_nilai) || 30 },
        { name: 'Parameter 3', value: Number(activeCustom?.parameter3_nilai) || 25 }
      ];
    }
  }, [templateCategory, dateRangeAnalysis, activeCoral, activeTide, activeCustom]);

  const heatmapMatrixData = useMemo(() => {
    if (aggregationMode === 'weekly') {
      return dateRangeAnalysis.weeklyAverages.slice(0, 6).map((w, idx) => ({
        label: `Mgu ${idx + 1}`,
        val: w.avgWaveHeight,
        unit: 'm',
        status: w.highRiskDaysCount > 0 ? 'Waspada' : 'Aman'
      }));
    } else if (aggregationMode === 'monthly') {
      return dateRangeAnalysis.monthlyAverages.slice(0, 6).map(m => ({
        label: m.periodLabel.substring(0, 8),
        val: m.avgWaveHeight,
        unit: 'm',
        status: m.avgWaveHeight >= 2.0 ? 'Tinggi' : 'Aman'
      }));
    } else {
      if (templateCategory === 'weather_marine') {
        return dateRangeAnalysis.records.slice(-6).map(r => ({
          label: r.displayDate.substring(0, 6),
          val: r.waveHeight,
          unit: 'm',
          status: r.waveHeight >= 2.5 ? 'Bahaya' : r.waveHeight >= 1.5 ? 'Waspada' : 'Aman'
        }));
      } else if (templateCategory === 'coral_reef') {
        return coralSites.slice(0, 6).map(c => ({ label: c.name.split(' ')[0], val: c.liveCoralCoverPct, unit: '%', status: c.healthCategory.split(' ')[0] }));
      } else if (templateCategory === 'tides_rob') {
        return activeTide.hourlyTides.slice(0, 6).map(t => ({ label: t.hour, val: t.height, unit: 'm', status: t.height > 1.8 ? 'Rob Kritis' : 'Normal' }));
      } else {
        return uploadedRows.slice(0, 6).map(r => ({ label: r.lokasi.substring(0, 8), val: Number(r.parameter1_nilai) || 10, unit: '', status: r.status }));
      }
    }
  }, [aggregationMode, dateRangeAnalysis, templateCategory, coralSites, activeTide, uploadedRows]);

  const comparisonAcrossSites = weatherLocations.slice(0, 6).map(w => ({
    name: w.name.split(' ')[0] + ' ' + (w.name.split(' ')[1] || ''),
    wave: w.waveHeight,
    wind: w.windSpeed
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Studio Builder Infografis Maritim & Visualisasi
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Pilih rentang tanggal kustom, hitung rata-rata mingguan atau bulanan secara otomatis, dan unduh data ke Excel (.xlsx) atau ekspor infografis dalam format gambar HD (PNG, JPG, SVG, PDF).
          </p>
        </div>

        {/* Quick Action Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="download-excel-dataset-btn"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-400/40 transition-all cursor-pointer"
            title="Unduh seluruh dataset dalam rentang tanggal terpilih ke berkas Excel (.xlsx)"
          >
            {isExportingExcel ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            <span>Unduh Data Excel (.xlsx)</span>
          </button>

          <button
            id="download-infographic-png-btn"
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-cyan-400/40 transition-all cursor-pointer"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Unduh PNG HD</span>
          </button>

          <button
            id="download-infographic-jpg-btn"
            onClick={handleDownloadJpg}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold px-3.5 py-2.5 rounded-full border border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>JPG</span>
          </button>

          <button
            id="download-infographic-pdf-btn"
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.3)] border border-purple-400/40 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            <span>PDF</span>
          </button>

          <button
            id="download-infographic-svg-btn"
            onClick={handleDownloadSvg}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold px-3.5 py-2.5 rounded-full border border-slate-700 transition-all cursor-pointer"
          >
            <span>SVG</span>
          </button>
        </div>
      </div>

      {/* REAL-TIME DATA STREAM STATUS & SYNC BAR */}
      <div className="bg-[#0f172a] border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 relative"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Live Data Stream Terhubung:</span>
              <span className="text-xs text-cyan-300 font-mono font-bold">{liveDataSource}</span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Sinkronisasi Terakhir: <strong>{lastSyncTime}</strong></span>
              <span className="hidden sm:inline">• Jika data di sumber BMKG/Open-Meteo berubah, angka & grafik otomatis menyesuaikan</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Auto Refresh Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-full px-3 py-1.5 text-xs text-slate-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-slate-400">Pembaruan:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-cyan-300 font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value={0} className="bg-slate-900 text-slate-200">Manual</option>
              <option value={30} className="bg-slate-900 text-slate-200">Setiap 30 Detik</option>
              <option value={60} className="bg-slate-900 text-slate-200">Setiap 1 Menit</option>
              <option value={300} className="bg-slate-900 text-slate-200">Setiap 5 Menit</option>
            </select>
          </div>

          {/* Manual Sync Trigger */}
          <button
            onClick={() => performLiveSync(true)}
            disabled={isLiveSyncing}
            className="flex items-center gap-1.5 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 text-xs font-bold px-3.5 py-1.5 rounded-full cursor-pointer transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLiveSyncing ? 'animate-spin' : ''}`} />
            <span>{isLiveSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {exportSuccessMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl flex items-center justify-between text-xs text-emerald-200 animate-fadeIn">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{exportSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* Main Studio Workspace: Controls Sidebar + Canvas Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customization Controls (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Template Presets & Data Upload */}
          <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                1. Sumber Data & Template Infografis
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-500/30 cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>Upload Excel/CSV</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  setTemplateCategory('weather_marine');
                  setCustomTitle('LAPORAN CUACA & KELAUTAN PESISIR');
                  setCustomSubtitle('Informasi Tinggi Gelombang, Angin & Keselamatan Melaut');
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  templateCategory === 'weather_marine'
                    ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400 shadow-sm'
                    : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Waves className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cuaca & Gelombang</span>
                </div>
                <span className="text-[10px] text-slate-400">BMKG Model & Swell</span>
              </button>

              <button
                onClick={() => {
                  setTemplateCategory('coral_reef');
                  setCustomTitle('STATUS KESEHATAN TERUMBU KARANG');
                  setCustomSubtitle('Pemantauan Tutupan Karang & Peringatan Pemutihan (DHW)');
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  templateCategory === 'coral_reef'
                    ? 'bg-teal-950/60 border-teal-400 text-teal-200 ring-1 ring-teal-400 shadow-sm'
                    : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Terumbu Karang</span>
                </div>
                <span className="text-[10px] text-slate-400">NOAA CRW & Tutupan</span>
              </button>

              <button
                onClick={() => {
                  setTemplateCategory('tides_rob');
                  setCustomTitle('KALENDER PASANG SURUT & BANJIR ROB');
                  setCustomSubtitle('Jadwal Puncak Pasang & Mitigasi Genangan Pesisir');
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  templateCategory === 'tides_rob'
                    ? 'bg-blue-950/60 border-blue-400 text-blue-200 ring-1 ring-blue-400 shadow-sm'
                    : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Compass className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pasang Surut & Rob</span>
                </div>
                <span className="text-[10px] text-slate-400">BIG & Fase Bulan</span>
              </button>

              <button
                onClick={() => {
                  setTemplateCategory('disaster_warning');
                  setCustomTitle('PERINGATAN DINI BENCANA PESISIR');
                  setCustomSubtitle('Peringatan Siaga Gelombang Tinggi & Mitigasi Darurat');
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  templateCategory === 'disaster_warning'
                    ? 'bg-rose-950/60 border-rose-400 text-rose-200 ring-1 ring-rose-400 shadow-sm'
                    : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Peringatan Dini</span>
                </div>
                <span className="text-[10px] text-slate-400">EWS Siaga & Rekomendasi</span>
              </button>

              {uploadedRows.length > 0 && (
                <button
                  onClick={() => {
                    setTemplateCategory('custom_data');
                    setCustomTitle('RINGKASAN DATA MARITIM PENGGUNA');
                    setCustomSubtitle('Hasil Olah Data Unggahan CSV / Excel Mandiri');
                  }}
                  className={`col-span-2 p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    templateCategory === 'custom_data'
                      ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400 shadow-sm'
                      : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Data Spreadsheet ({uploadedRows.length} Baris Dimuat)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Gunakan kolom Excel kustom untuk grafik</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. RENTANG WAKTU, AGREGASI PERIODE & EKSPOR EXCEL (FITUR BARU) */}
          <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <CalendarRange className="w-4 h-4 text-cyan-400" />
                2. Rentang Waktu & Agregasi Data
              </h3>
              <button
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/40 cursor-pointer transition-all"
                title="Ekspor data rentang waktu ke Excel"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>Unduh Excel</span>
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">Pilihan Cepat Rentang Waktu:</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs">
                {[
                  { id: '7d', label: '7 Hari' },
                  { id: '14d', label: '14 Hari' },
                  { id: '30d', label: '30 Hari' },
                  { id: '3m', label: '3 Bulan' },
                  { id: '6m', label: '6 Bulan' },
                  { id: '1y', label: '1 Tahun' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyDatePreset(p.id as any)}
                    className={`py-1.5 px-2 rounded-xl border text-center font-semibold text-[10px] transition-all cursor-pointer ${
                      datePreset === p.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400'
                        : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-medium">Dari Tanggal (Mulai):</label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    max={endDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-medium">Sampai Tanggal (Selesai):</label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Aggregation Mode Selector: Harian, Mingguan, Bulanan */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] text-slate-300 font-bold flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                  Mode Agregasi & Rata-rata Visualisasi:
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {dateRangeAnalysis.records.length} Hari Terfilter
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  onClick={() => setAggregationMode('daily')}
                  className={`p-2 rounded-2xl border text-center font-bold flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                    aggregationMode === 'daily'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400 shadow-sm'
                      : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[11px]">Harian</span>
                  <span className="text-[9px] text-slate-400 font-normal">Data Titik Harian</span>
                </button>

                <button
                  onClick={() => setAggregationMode('weekly')}
                  className={`p-2 rounded-2xl border text-center font-bold flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                    aggregationMode === 'weekly'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400 shadow-sm'
                      : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[11px]">Rata-rata Mingguan</span>
                  <span className="text-[9px] text-slate-400 font-normal">Per 7 Hari ({dateRangeAnalysis.weeklyAverages.length} Mgu)</span>
                </button>

                <button
                  onClick={() => setAggregationMode('monthly')}
                  className={`p-2 rounded-2xl border text-center font-bold flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                    aggregationMode === 'monthly'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400 shadow-sm'
                      : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[11px]">Rata-rata Bulanan</span>
                  <span className="text-[9px] text-slate-400 font-normal">Per Bulan ({dateRangeAnalysis.monthlyAverages.length} Bln)</span>
                </button>
              </div>
            </div>

            {/* Aggregation Stat Summary Chips */}
            <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 grid grid-cols-3 gap-2 text-center text-[10px]">
              <div>
                <span className="text-slate-400 block">Rata2 Gelombang</span>
                <span className="font-bold text-cyan-300 text-xs">{dateRangeAnalysis.overallStats.avgWaveHeight} m</span>
              </div>
              <div>
                <span className="text-slate-400 block">Rata2 Angin</span>
                <span className="font-bold text-teal-300 text-xs">{dateRangeAnalysis.overallStats.avgWindSpeed} knot</span>
              </div>
              <div>
                <span className="text-slate-400 block">Rata2 Suhu Laut</span>
                <span className="font-bold text-amber-300 text-xs">{dateRangeAnalysis.overallStats.avgSeaSurfaceTemp} °C</span>
              </div>
            </div>
          </div>

          {/* 3. MODE BAGAN & KOMPOSISI MULTI-CHART */}
          <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                3. Mode Visualisasi (Multi-Chart / Bagan Tunggal)
              </h3>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-full border border-slate-700 text-[10px]">
                <button
                  onClick={() => setChartMode('multi')}
                  className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                    chartMode === 'multi' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Multi-Chart (Dashboard)
                </button>
                <button
                  onClick={() => setChartMode('single')}
                  className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                    chartMode === 'single' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bagan Tunggal
                </button>
              </div>
            </div>

            {/* If MULTI-CHART Mode is Active */}
            {chartMode === 'multi' ? (
              <div className="space-y-3.5">
                {/* Multi-Layout Options */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">Susunan Tata Letak Multi-Panel:</label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      onClick={() => setMultiLayout('grid_2x2')}
                      className={`p-2 rounded-2xl border text-center font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        multiLayout === 'grid_2x2' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400' : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span className="text-[10px]">Grid 2x2 (4 Panel)</span>
                    </button>
                    <button
                      onClick={() => setMultiLayout('grid_2_col')}
                      className={`p-2 rounded-2xl border text-center font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        multiLayout === 'grid_2_col' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400' : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                      <span className="text-[10px]">2 Kolom Berdampingan</span>
                    </button>
                    <button
                      onClick={() => setMultiLayout('stacked')}
                      className={`p-2 rounded-2xl border text-center font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        multiLayout === 'stacked' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400' : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span className="text-[10px]">Susunan Vertikal</span>
                    </button>
                  </div>
                </div>

                {/* Checklist of Multi-Charts to Include */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">Pilih Informasi & Bagan yang Dimasukkan:</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={selectedMultiCharts.barForecast}
                        onChange={(e) => setSelectedMultiCharts(prev => ({ ...prev, barForecast: e.target.checked }))}
                        className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                      />
                      <span className="text-[11px] font-semibold">1. Bagan Batang Prakiraan</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={selectedMultiCharts.lineTrend}
                        onChange={(e) => setSelectedMultiCharts(prev => ({ ...prev, lineTrend: e.target.checked }))}
                        className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                      />
                      <span className="text-[11px] font-semibold">2. Kurva Tren Fluktuasi</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={selectedMultiCharts.pieDonut}
                        onChange={(e) => setSelectedMultiCharts(prev => ({ ...prev, pieDonut: e.target.checked }))}
                        className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                      />
                      <span className="text-[11px] font-semibold">3. Diagram Donat Komposisi</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={selectedMultiCharts.heatmap}
                        onChange={(e) => setSelectedMultiCharts(prev => ({ ...prev, heatmap: e.target.checked }))}
                        className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                      />
                      <span className="text-[11px] font-semibold">4. Matriks Peta Panas</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={selectedMultiCharts.metricCards}
                        onChange={(e) => setSelectedMultiCharts(prev => ({ ...prev, metricCards: e.target.checked }))}
                        className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                      />
                      <span className="text-[11px] font-semibold">5. Kartu Gauge Multivariat</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={selectedMultiCharts.crossComparison}
                        onChange={(e) => setSelectedMultiCharts(prev => ({ ...prev, crossComparison: e.target.checked }))}
                        className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                      />
                      <span className="text-[11px] font-semibold">6. Perbandingan Antar-Lokasi</span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              /* SINGLE CHART MODE */
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
                <button
                  onClick={() => setSingleChartType('bar_chart')}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                    singleChartType === 'bar_chart' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm' : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Bagan Batang</span>
                </button>

                <button
                  onClick={() => setSingleChartType('pie_chart')}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                    singleChartType === 'pie_chart' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm' : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <PieIcon className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Diagram Lingkar</span>
                </button>

                <button
                  onClick={() => setSingleChartType('heatmap_matrix')}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                    singleChartType === 'heatmap_matrix' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm' : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Peta Panas</span>
                </button>

                <button
                  onClick={() => setSingleChartType('line_chart')}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                    singleChartType === 'line_chart' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm' : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Tren Garis</span>
                </button>

                <button
                  onClick={() => setSingleChartType('metric_gauge')}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                    singleChartType === 'metric_gauge' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm' : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Kartu Metrik</span>
                </button>
              </div>
            )}
          </div>

          {/* 4. Design Styling: Colors, Fonts, Icons, Ratios */}
          <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-cyan-400" />
              4. Kustomisasi Desain & Tema Infografis
            </h3>

            {/* Layout Aspect Ratios */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">Format Tata Letak / Dimensi Poster:</label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <button
                  onClick={() => setLayoutSize('poster')}
                  className={`py-2 px-1 rounded-2xl border font-semibold text-center transition-all cursor-pointer ${
                    layoutSize === 'poster' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm' : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="block text-[11px] font-bold">3:4 Poster</span>
                  <span className="text-[9px] text-slate-400">Laporan A4</span>
                </button>
                <button
                  onClick={() => setLayoutSize('square')}
                  className={`py-2 px-1 rounded-2xl border font-semibold text-center transition-all cursor-pointer ${
                    layoutSize === 'square' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm' : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="block text-[11px] font-bold">1:1 Square</span>
                  <span className="text-[9px] text-slate-400">Instagram Feed</span>
                </button>
                <button
                  onClick={() => setLayoutSize('story')}
                  className={`py-2 px-1 rounded-2xl border font-semibold text-center transition-all cursor-pointer ${
                    layoutSize === 'story' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm' : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="block text-[11px] font-bold">9:16 Story</span>
                  <span className="text-[9px] text-slate-400">Status / Reels</span>
                </button>
                <button
                  onClick={() => setLayoutSize('landscape')}
                  className={`py-2 px-1 rounded-2xl border font-semibold text-center transition-all cursor-pointer ${
                    layoutSize === 'landscape' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm' : 'bg-[#1e293b]/70 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="block text-[11px] font-bold">16:9 Banner</span>
                  <span className="text-[9px] text-slate-400">Presentasi Web</span>
                </button>
              </div>
            </div>

            {/* Color Palette Selector */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">Palet Warna Bahari:</label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'ocean', name: 'Ocean Cyan', bg: 'bg-cyan-600' },
                  { id: 'coral', name: 'Coral Teal', bg: 'bg-teal-600' },
                  { id: 'navy', name: 'Navy Blue', bg: 'bg-blue-600' },
                  { id: 'warning', name: 'Amber Gold', bg: 'bg-amber-600' },
                  { id: 'crimson', name: 'Rose Red', bg: 'bg-rose-600' },
                  { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-600' },
                  { id: 'sunset', name: 'Sunset Glow', bg: 'bg-purple-600' },
                  { id: 'obsidian', name: 'Obsidian', bg: 'bg-slate-700' }
                ].map(th => (
                  <button
                    key={th.id}
                    onClick={() => setThemeColor(th.id as ThemeColor)}
                    className={`p-2 rounded-2xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                      themeColor === th.id ? 'bg-slate-800 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${th.bg}`}></span>
                    <span className="text-[10px] font-bold truncate">{th.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Typography Font Selection */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">Gaya Tipografi Font:</label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'sans', name: 'Modern Sans', style: 'font-sans' },
                  { id: 'display', name: 'Bold Display', style: 'font-extrabold' },
                  { id: 'serif', name: 'Editorial Serif', style: 'font-serif' },
                  { id: 'mono', name: 'Tech Mono', style: 'font-mono' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFontFamily(f.id as FontStyle)}
                    className={`py-1.5 px-2 rounded-2xl border text-center transition-all cursor-pointer ${f.style} ${
                      fontFamily === f.id ? 'bg-slate-800 border-cyan-400 text-cyan-300 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-[11px]">{f.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Selector */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">Ikon Utama Infografis:</label>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { id: 'waves', label: 'Gelombang', icon: <Waves className="w-3.5 h-3.5" /> },
                  { id: 'fish', label: 'Ikan', icon: <Fish className="w-3.5 h-3.5" /> },
                  { id: 'coral', label: 'Karang', icon: <Sparkles className="w-3.5 h-3.5" /> },
                  { id: 'wind', label: 'Angin', icon: <Wind className="w-3.5 h-3.5" /> },
                  { id: 'thermometer', label: 'Suhu', icon: <Thermometer className="w-3.5 h-3.5" /> },
                  { id: 'shield', label: 'Siaga', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
                  { id: 'compass', label: 'Kompas', icon: <Compass className="w-3.5 h-3.5" /> },
                  { id: 'anchor', label: 'Jangkar', icon: <Anchor className="w-3.5 h-3.5" /> },
                  { id: 'sun', label: 'Cerah', icon: <Sun className="w-3.5 h-3.5" /> },
                  { id: 'chart', label: 'Bagan', icon: <BarChart3 className="w-3.5 h-3.5" /> }
                ].map(ic => (
                  <button
                    key={ic.id}
                    onClick={() => setSelectedIcon(ic.id)}
                    className={`p-2 rounded-full border transition-all cursor-pointer flex items-center gap-1 text-xs ${
                      selectedIcon === ic.id ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title={ic.label}
                  >
                    {ic.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Data Record & Text Editor */}
          <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-cyan-400" />
              5. Sumber Lokasi & Teks Infografis
            </h3>

            {/* Location Selector */}
            {templateCategory === 'weather_marine' && (
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">Pilih Wilayah Perairan / Stasiun:</label>
                <select
                  value={selectedWeatherId}
                  onChange={(e) => setSelectedWeatherId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
                >
                  {weatherLocations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} - Gelombang: {l.waveHeight}m ({l.waveCategory})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {templateCategory === 'coral_reef' && (
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">Pilih Situs Terumbu Karang:</label>
                <select
                  value={selectedCoralId}
                  onChange={(e) => setSelectedCoralId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
                >
                  {coralSites.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - Tutupan Karang: {c.liveCoralCoverPct}%
                    </option>
                  ))}
                </select>
              </div>
            )}

            {templateCategory === 'tides_rob' && (
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">Pilih Stasiun Pasang Surut:</label>
                <select
                  value={selectedTideId}
                  onChange={(e) => setSelectedTideId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                >
                  {tidalStations.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} - Pasut: {t.currentTideHeight}m (Rob: {t.robRisk})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {templateCategory === 'disaster_warning' && (
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">Pilih Peringatan Dini Aktif:</label>
                <select
                  value={selectedAlertId}
                  onChange={(e) => setSelectedAlertId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-medium"
                >
                  {coastalAlerts.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.severity}] {a.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {templateCategory === 'custom_data' && (
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">Pilih Baris Data Spreadsheet:</label>
                <select
                  value={selectedCustomIndex}
                  onChange={(e) => setSelectedCustomIndex(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  {uploadedRows.map((d, i) => (
                    <option key={d.id || i} value={i}>
                      {d.lokasi} - {d.parameter1_nama || 'Nilai'}: {d.parameter1_nilai}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Text Inputs */}
            <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-bold uppercase">Judul Infografis:</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-bold uppercase">Sub-Judul / Keterangan:</label>
                <input
                  type="text"
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-bold uppercase">Catatan Tambahan & Analisis:</label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-bold uppercase">Organisasi / Penerbit:</label>
                <input
                  type="text"
                  value={footerOrg}
                  onChange={(e) => setFooterOrg(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>
            </div>

            {/* Elements Toggles */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showMetrics}
                  onChange={(e) => setShowMetrics(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                />
                <span>Kartu Metrik Kunci</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showCharts}
                  onChange={(e) => setShowCharts(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                />
                <span>Visualisasi Bagan / Grafik</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showSafetyTips}
                  onChange={(e) => setShowSafetyTips(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                />
                <span>Tips / Mitigasi SOP</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showQrCode}
                  onChange={(e) => setShowQrCode(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                />
                <span>QR Cap & Tanda Resmi</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Live Infographic Canvas Preview (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-start space-y-3">
          <div className="w-full flex items-center justify-between pb-1 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Pratinjau Live Infografis Canvas ({chartMode === 'multi' ? 'Multi-Bagan Dashboard' : 'Bagan Tunggal'})
            </span>
            <span className="text-[11px] text-cyan-300">Format: {layoutSize.toUpperCase()}</span>
          </div>

          {/* Actual Rendered Infographic Poster Target for Export */}
          <div className="w-full flex justify-center overflow-x-auto p-3 sm:p-5 bg-[#020617] rounded-3xl border border-slate-800 shadow-2xl">
            <div
              ref={canvasRef}
              className={`${getCanvasDimensions()} ${theme.bg} text-slate-100 p-5 sm:p-7 rounded-3xl border-2 border-cyan-500/40 shadow-2xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 select-none ${getFontFamilyClass()}`}
            >
              {/* Background Ambient Radial Accents */}
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>

              {/* 1. Header Section */}
              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-cyan-500/30">
                      {renderBannerIcon()}
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-cyan-300 block">
                        PORTAL INFOGRAFIS KELAUTAN
                      </span>
                      <h4 className="text-xs font-bold text-white">Nusantara Bahari Studio</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-300 block">Update Real-time:</span>
                    <span className="text-[10px] font-bold text-cyan-300">
                      {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {lastSyncTime}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight uppercase">
                    {customTitle}
                  </h1>
                  <p className="text-[11px] sm:text-xs text-cyan-200/90 font-medium mt-0.5">
                    {customSubtitle}
                  </p>
                </div>
              </div>

              {/* 2. Middle Body: Location Header & Key Metrics */}
              <div className="relative z-10 my-3 space-y-3 flex-1 flex flex-col justify-start">
                {/* Location / Entity Hero Header */}
                <div className={`${theme.card} p-3 rounded-2xl border backdrop-blur-md flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-black text-white">
                        {templateCategory === 'weather_marine' ? activeWeather.name :
                         templateCategory === 'coral_reef' ? activeCoral.name :
                         templateCategory === 'tides_rob' ? activeTide.name :
                         templateCategory === 'disaster_warning' ? activeAlert.title :
                         activeCustom?.lokasi || 'Stasiun Pengamatan'}
                      </h3>
                      <p className="text-[10px] text-slate-300">
                        {templateCategory === 'weather_marine' ? `${activeWeather.seaArea} (${activeWeather.province})` :
                         templateCategory === 'coral_reef' ? `${activeCoral.marineProtectedArea} (${activeCoral.province})` :
                         templateCategory === 'tides_rob' ? `${activeTide.location} (${activeTide.province})` :
                         templateCategory === 'disaster_warning' ? activeAlert.headline :
                         activeCustom?.keterangan || 'Data Unggahan Spreadsheet'}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-xl text-[10px] font-black uppercase border ${
                    templateCategory === 'weather_marine' ? `${getWaveBadgeColor(activeWeather.waveCategory).bg} ${getWaveBadgeColor(activeWeather.waveCategory).text}` :
                    templateCategory === 'coral_reef' ? getCoralHealthBadge(activeCoral.healthCategory).bg :
                    templateCategory === 'tides_rob' ? getRobRiskBadge(activeTide.robRisk).bg :
                    'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}>
                    {templateCategory === 'weather_marine' ? activeWeather.waveCategory :
                     templateCategory === 'coral_reef' ? activeCoral.healthCategory.split(' ')[0] :
                     templateCategory === 'tides_rob' ? `Rob: ${activeTide.robRisk}` :
                     activeAlert?.severity || 'Aktif'}
                  </span>
                </div>

                {/* Time Range & Aggregation Indicator Banner */}
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-[10px]">
                  <div className="flex items-center gap-1.5 text-cyan-300">
                    <CalendarRange className="w-3.5 h-3.5" />
                    <span>Periode: <strong>{startDate}</strong> s.d. <strong>{endDate}</strong></span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-200 font-semibold text-[9px]">
                    {aggregationMode === 'daily' ? `Harian (${dateRangeAnalysis.records.length} Hari)` :
                     aggregationMode === 'weekly' ? `Rata-rata Mingguan (${dateRangeAnalysis.weeklyAverages.length} Mgu)` :
                     `Rata-rata Bulanan (${dateRangeAnalysis.monthlyAverages.length} Bln)`}
                  </span>
                </div>

                {/* Key Stats Metric Grid */}
                {showMetrics && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {templateCategory === 'weather_marine' && (
                      <>
                        <div className={`${theme.card} p-2.5 rounded-xl border`}>
                          <span className="text-[9px] text-slate-400 block">Tinggi Gelombang</span>
                          <span className="text-xl font-black text-cyan-300">{activeWeather.waveHeight} <span className="text-[10px]">m</span></span>
                          <span className="text-[9px] font-semibold text-slate-300 block">{activeWeather.waveCategory}</span>
                        </div>
                        <div className={`${theme.card} p-2.5 rounded-xl border`}>
                          <span className="text-[9px] text-slate-400 block">Kecepatan Angin</span>
                          <span className="text-xl font-black text-amber-300">{activeWeather.windSpeed} <span className="text-[10px]">kts</span></span>
                          <span className="text-[9px] font-semibold text-slate-300 block">{activeWeather.windDirection.split(' ')[0]}</span>
                        </div>
                        <div className={`${theme.card} p-2.5 rounded-xl border`}>
                          <span className="text-[9px] text-slate-400 block">Suhu Muka Laut</span>
                          <span className="text-xl font-black text-emerald-300">{activeWeather.seaSurfaceTemp} <span className="text-[10px]">°C</span></span>
                          <span className="text-[9px] font-semibold text-slate-300 block">Salinitas {activeWeather.salinity} PSU</span>
                        </div>
                      </>
                    )}

                    {templateCategory === 'coral_reef' && (
                      <>
                        <div className={`${theme.card} p-2.5 rounded-xl border`}>
                          <span className="text-[9px] text-slate-400 block">Tutupan Karang</span>
                          <span className="text-xl font-black text-emerald-300">{activeCoral.liveCoralCoverPct}%</span>
                          <span className="text-[9px] font-semibold text-slate-300 block">{activeCoral.healthCategory.split(' ')[0]}</span>
                        </div>
                        <div className={`${theme.card} p-2.5 rounded-xl border`}>
                          <span className="text-[9px] text-slate-400 block">Bleaching Alert</span>
                          <span className="text-sm font-black text-amber-300">{activeCoral.bleachingAlert}</span>
                          <span className="text-[9px] font-semibold text-slate-300 block">DHW {activeCoral.degreeHeatingWeeks}</span>
                        </div>
                        <div className={`${theme.card} p-2.5 rounded-xl border`}>
                          <span className="text-[9px] text-slate-400 block">Biodiversitas Ikan</span>
                          <span className="text-xl font-black text-cyan-300">{activeCoral.biodiversityScore} <span className="text-[10px]">/100</span></span>
                          <span className="text-[9px] font-semibold text-slate-300 block">Jernih {activeCoral.waterClarityMeters}m</span>
                        </div>
                      </>
                    )}

                    {templateCategory === 'tides_rob' && (
                      <>
                        <div className={`${theme.card} p-2.5 rounded-xl border`}>
                          <span className="text-[9px] text-slate-400 block">Pasut Terkini</span>
                          <span className="text-xl font-black text-blue-300">{activeTide.currentTideHeight} <span className="text-[10px]">m</span></span>
                          <span className="text-[9px] font-semibold text-slate-300 block">{activeTide.trend}</span>
                        </div>
                        <div className={`${theme.card} p-2.5 rounded-xl border`}>
                          <span className="text-[9px] text-slate-400 block">Puncak Pasang</span>
                          <span className="text-lg font-black text-cyan-300">{activeTide.highTideHeight} <span className="text-[10px]">m</span></span>
                          <span className="text-[9px] font-semibold text-slate-300 block">{activeTide.highTideTime}</span>
                        </div>
                        <div className={`${theme.card} p-2.5 rounded-xl border`}>
                          <span className="text-[9px] text-slate-400 block">Surut Terendah</span>
                          <span className="text-xl font-black text-emerald-300">{activeTide.lowTideHeight} <span className="text-[10px]">m</span></span>
                          <span className="text-[9px] font-semibold text-slate-300 block">{activeTide.lowTideTime}</span>
                        </div>
                      </>
                    )}

                    {(templateCategory === 'disaster_warning' || templateCategory === 'custom_data') && (
                      <>
                        <div className={`${theme.card} p-2.5 rounded-xl border`}>
                          <span className="text-[9px] text-slate-400 block">Parameter 1</span>
                          <span className="text-xl font-black text-cyan-300">{activeCustom?.parameter1_nilai || '8.5'}</span>
                          <span className="text-[9px] font-semibold text-slate-300 block">{activeCustom?.parameter1_nama || 'Observasi'}</span>
                        </div>
                        <div className={`${theme.card} p-2.5 rounded-xl border`}>
                          <span className="text-[9px] text-slate-400 block">Parameter 2</span>
                          <span className="text-xl font-black text-amber-300">{activeCustom?.parameter2_nilai || '18'}</span>
                          <span className="text-[9px] font-semibold text-slate-300 block">{activeCustom?.parameter2_nama || 'Indeks'}</span>
                        </div>
                        <div className={`${theme.card} p-2.5 rounded-xl border`}>
                          <span className="text-[9px] text-slate-400 block">Parameter 3</span>
                          <span className="text-xl font-black text-emerald-300">{activeCustom?.parameter3_nilai || '75%'}</span>
                          <span className="text-[9px] font-semibold text-slate-300 block">{activeCustom?.parameter3_nama || 'Status'}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 3. DYNAMIC CHARTS AREA (MULTI-CHART OR SINGLE-CHART) */}
                {showCharts && (
                  <div className="space-y-2.5">
                    {chartMode === 'multi' ? (
                      /* MULTI-CHART CONTAINER */
                      <div className={`gap-2.5 ${
                        multiLayout === 'grid_2x2' ? 'grid grid-cols-1 sm:grid-cols-2' :
                        multiLayout === 'grid_2_col' ? 'grid grid-cols-1 sm:grid-cols-2' :
                        'flex flex-col space-y-2'
                      }`}>
                        {/* 1. Bar Chart Module */}
                        {selectedMultiCharts.barForecast && (
                          <div className={`${theme.card} p-2.5 rounded-xl border space-y-1`}>
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-300">
                              <span className="flex items-center gap-1">
                                <BarChart3 className="w-3 h-3 text-cyan-400" />
                                Prakiraan Gelombang per Jam
                              </span>
                              <span className="text-[9px] text-cyan-300 font-mono">Meter</span>
                            </div>
                            <div className="h-28 w-full pt-1">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barChartData} margin={{ top: 2, right: 2, left: -25, bottom: 0 }}>
                                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 8 }} />
                                  <YAxis tick={{ fill: '#94a3b8', fontSize: 8 }} />
                                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '9px' }} />
                                  <Bar dataKey="val1" name="Gelombang (m)" radius={[3, 3, 0, 0]}>
                                    {barChartData.map((_, idx) => (
                                      <Cell key={`bar-m-${idx}`} fill={theme.chartColors[idx % theme.chartColors.length]} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}

                        {/* 2. Line / Area Trend Module */}
                        {selectedMultiCharts.lineTrend && (
                          <div className={`${theme.card} p-2.5 rounded-xl border space-y-1`}>
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-300">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-emerald-400" />
                                Tren Dinamika Fluktuasi
                              </span>
                              <span className="text-[9px] text-emerald-300 font-mono">Real-time</span>
                            </div>
                            <div className="h-28 w-full pt-1">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={lineTrendData} margin={{ top: 2, right: 2, left: -25, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="multiLineGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor={theme.accentColor} stopOpacity={0.7}/>
                                      <stop offset="95%" stopColor={theme.accentColor} stopOpacity={0.0}/>
                                    </linearGradient>
                                  </defs>
                                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 8 }} />
                                  <YAxis tick={{ fill: '#94a3b8', fontSize: 8 }} />
                                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '9px' }} />
                                  <Area
                                    type="monotone"
                                    dataKey={templateCategory === 'weather_marine' ? 'wave' : templateCategory === 'coral_reef' ? 'cover' : 'pasut'}
                                    stroke={theme.accentColor}
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#multiLineGrad)"
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}

                        {/* 3. Pie / Donut Composition Module */}
                        {selectedMultiCharts.pieDonut && (
                          <div className={`${theme.card} p-2.5 rounded-xl border space-y-1`}>
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-300">
                              <span className="flex items-center gap-1">
                                <PieIcon className="w-3 h-3 text-amber-400" />
                                Komposisi Parameter
                              </span>
                              <span className="text-[9px] text-amber-300 font-mono">Distribusi</span>
                            </div>
                            <div className="h-28 w-full flex items-center justify-center">
                              <ResponsiveContainer width="55%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={pieCompositionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={22}
                                    outerRadius={38}
                                    paddingAngle={3}
                                    dataKey="value"
                                  >
                                    {pieCompositionData.map((_, idx) => (
                                      <Cell key={`pie-m-${idx}`} fill={theme.chartColors[idx % theme.chartColors.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '9px' }} />
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="w-[45%] flex flex-col justify-center space-y-1 text-[8px] text-slate-300">
                                {pieCompositionData.slice(0, 3).map((d, i) => (
                                  <div key={i} className="flex items-center gap-1 truncate">
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: theme.chartColors[i % theme.chartColors.length] }}></span>
                                    <span className="truncate">{d.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 4. Heatmap Matrix Module */}
                        {selectedMultiCharts.heatmap && (
                          <div className={`${theme.card} p-2.5 rounded-xl border space-y-1`}>
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-300">
                              <span className="flex items-center gap-1">
                                <Grid className="w-3 h-3 text-cyan-400" />
                                Matriks Keselamatan Waktu
                              </span>
                              <span className="text-[9px] text-cyan-300 font-mono">Indeks</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 pt-1">
                              {heatmapMatrixData.slice(0, 6).map((d, i) => (
                                <div
                                  key={i}
                                  className="p-1 rounded-lg border flex flex-col items-center justify-center text-center bg-slate-900/90 border-slate-800"
                                >
                                  <span className="text-[7px] text-slate-400 truncate w-full">{d.label}</span>
                                  <span className="text-[10px] font-black text-cyan-300">{d.val}{d.unit}</span>
                                  <span className={`text-[7px] font-bold px-1 rounded ${
                                    d.status === 'Bahaya' || d.status === 'Rob Kritis' ? 'text-rose-300 bg-rose-950/60' :
                                    d.status === 'Waspada' ? 'text-amber-300 bg-amber-950/60' : 'text-emerald-300 bg-emerald-950/60'
                                  }`}>
                                    {d.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 5. Metric Cards & Gauges */}
                        {selectedMultiCharts.metricCards && (
                          <div className={`${theme.card} p-2.5 rounded-xl border space-y-1.5 col-span-full`}>
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-300">
                              <span className="flex items-center gap-1">
                                <Sliders className="w-3 h-3 text-teal-400" />
                                Indikator Multivariat & Kesiapsiagaan
                              </span>
                              <span className="text-[9px] text-teal-300">Ambang Batas</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-[9px]">
                              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block">Indeks Keselamatan</span>
                                <span className="text-xs font-black text-cyan-300">{activeWeather.safetyIndex.split(' ')[0]}</span>
                                <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                                  <div className="h-full bg-cyan-400" style={{ width: '80%' }}></div>
                                </div>
                              </div>
                              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block">Daya Pandang</span>
                                <span className="text-xs font-black text-emerald-300">{activeWeather.visibility} km</span>
                                <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                                  <div className="h-full bg-emerald-400" style={{ width: '90%' }}></div>
                                </div>
                              </div>
                              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block">Tekanan Udara</span>
                                <span className="text-xs font-black text-amber-300">{activeWeather.airPressure} hPa</span>
                                <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                                  <div className="h-full bg-amber-400" style={{ width: '75%' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 6. Cross Comparison Module */}
                        {selectedMultiCharts.crossComparison && (
                          <div className={`${theme.card} p-2.5 rounded-xl border space-y-1 col-span-full`}>
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-300">
                              <span className="flex items-center gap-1">
                                <Layers className="w-3 h-3 text-purple-400" />
                                Perbandingan Lintas Stasiun Maritim
                              </span>
                              <span className="text-[9px] text-purple-300">Tinggi Gelombang (m)</span>
                            </div>
                            <div className="h-24 w-full pt-1">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonAcrossSites} margin={{ top: 2, right: 2, left: -25, bottom: 0 }}>
                                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 8 }} />
                                  <YAxis tick={{ fill: '#94a3b8', fontSize: 8 }} />
                                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '9px' }} />
                                  <Bar dataKey="wave" fill="#a855f7" radius={[3, 3, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* SINGLE CHART CONTAINER */
                      <div className={`${theme.card} p-3.5 rounded-2xl border space-y-2`}>
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                            Visualisasi: {singleChartType === 'bar_chart' ? 'Bagan Batang' : singleChartType === 'pie_chart' ? 'Diagram Lingkaran' : singleChartType === 'heatmap_matrix' ? 'Peta Panas Matriks' : singleChartType === 'line_chart' ? 'Grafik Tren' : 'Pengukur Status'}
                          </span>
                          <span className="text-[10px] text-cyan-300 font-mono">Real-time Model</span>
                        </div>

                        {/* Chart Option 1: Bar Chart */}
                        {singleChartType === 'bar_chart' && (
                          <div className="h-36 w-full pt-1">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={barChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={{ stroke: '#334155' }} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={{ stroke: '#334155' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '10px' }} />
                                <Bar dataKey="val1" radius={[4, 4, 0, 0]}>
                                  {barChartData.map((_, index) => (
                                    <Cell key={`single-cell-${index}`} fill={theme.chartColors[index % theme.chartColors.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {/* Chart Option 2: Pie / Donut Chart */}
                        {singleChartType === 'pie_chart' && (
                          <div className="h-36 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieCompositionData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={28}
                                  outerRadius={48}
                                  paddingAngle={4}
                                  dataKey="value"
                                >
                                  {pieCompositionData.map((_, index) => (
                                    <Cell key={`pie-single-${index}`} fill={theme.chartColors[index % theme.chartColors.length]} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '10px' }} />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-300 pr-2">
                              {pieCompositionData.slice(0, 4).map((d, i) => (
                                <div key={i} className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.chartColors[i % theme.chartColors.length] }}></span>
                                  <span className="truncate">{d.name}: {d.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Chart Option 3: Heatmap Matrix */}
                        {singleChartType === 'heatmap_matrix' && (
                          <div className="grid grid-cols-6 gap-1.5 pt-1">
                            {heatmapMatrixData.map((d, i) => {
                              const intensity = Math.min(100, Math.max(20, (Number(d.val) / 4.0) * 100));
                              return (
                                <div
                                  key={i}
                                  className="p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all"
                                  style={{
                                    backgroundColor: `${theme.accentColor}${Math.round(intensity * 0.9).toString(16).padStart(2, '0')}`,
                                    borderColor: `${theme.accentColor}55`
                                  }}
                                >
                                  <span className="text-[8px] text-slate-300 font-medium truncate w-full">{d.label}</span>
                                  <span className="text-xs font-black text-white mt-0.5">{d.val}{d.unit}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Chart Option 4: Line Chart */}
                        {singleChartType === 'line_chart' && (
                          <div className="h-36 w-full pt-1">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={lineTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="areaGradientSingle" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={theme.accentColor} stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor={theme.accentColor} stopOpacity={0.0}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={{ stroke: '#334155' }} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={{ stroke: '#334155' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '10px' }} />
                                <Area
                                  type="monotone"
                                  dataKey={templateCategory === 'weather_marine' ? 'wave' : templateCategory === 'coral_reef' ? 'cover' : 'pasut'}
                                  stroke={theme.accentColor}
                                  strokeWidth={2.5}
                                  fillOpacity={1}
                                  fill="url(#areaGradientSingle)"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {/* Chart Option 5: Metric Gauge */}
                        {singleChartType === 'metric_gauge' && (
                          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                            {heatmapMatrixData.slice(0, 3).map((d, i) => (
                              <div key={i} className="bg-slate-900/80 p-2 rounded-xl border border-slate-700">
                                <span className="text-[9px] text-slate-400 block">{d.label}</span>
                                <span className="text-lg font-black text-cyan-300">{d.val}{d.unit}</span>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-cyan-400 to-teal-400" style={{ width: `${Math.min(100, (Number(d.val) / 10) * 100)}%` }}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Safety & Mitigation SOP */}
                {showSafetyTips && (
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 text-[9px] block font-semibold">REKOMENDASI & MITIGASI:</span>
                      <span className="font-extrabold text-white text-[11px]">
                        {templateCategory === 'weather_marine' ? activeWeather.safetyIndex :
                         templateCategory === 'coral_reef' ? `Restorasi: ${activeCoral.rehabilitationProjects}` :
                         templateCategory === 'tides_rob' ? `Status Siaga Rob: ${activeTide.robRisk}` :
                         activeAlert?.recommendations?.[0] || 'Tingkatkan kewaspadaan dan patuhi arahan keselamatan.'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[9px] block">Status Otoritas:</span>
                      <span className="font-bold text-cyan-300 text-[10px]">Terverifikasi BMKG / BIG</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Footer Section with QR code and Org info */}
              <div className="relative z-10 pt-2.5 border-t border-white/10 flex items-center justify-between text-[9px] text-slate-300">
                <div>
                  <span className="font-bold text-white block">{footerOrg}</span>
                  <span className="text-slate-400 text-[8px]">{contactEmergency}</span>
                </div>

                {showQrCode && (
                  <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-lg border border-white/20">
                    <QrCode className="w-3.5 h-3.5 text-cyan-300" />
                    <span className="text-[8px] font-mono text-cyan-200">VERIFIKASI RESMI</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
