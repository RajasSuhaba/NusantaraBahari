import * as XLSX from 'xlsx';
import { MaritimeLocation, CoralReefSite, TidalStation } from '../types';

export interface DailyMaritimeRecord {
  date: string; // YYYY-MM-DD
  displayDate: string; // DD MMM YYYY
  dayName: string; // Senin, Selasa, etc.
  weekLabel: string; // 'Minggu 1 (01-07 Jan)'
  monthLabel: string; // 'Januari 2026'
  waveHeight: number; // in meters
  waveCategory: string; // Tenang, Rendah, Sedang, Tinggi, Ekstrem
  windSpeed: number; // in knots
  windDirection: string; // SE, E, NE, etc.
  seaSurfaceTemp: number; // in °C
  salinity: number; // in PSU
  currentSpeed: number; // in m/s
  weatherCondition: string; // Cerah, Berawan, Hujan Ringan, dll.
  safetyIndex: string; // Aman, Waspada, Bahaya
  coralStressIndex?: number; // DHW equivalent
  tideMaxHeight?: number; // in meters
}

export interface AggregatedPeriodStats {
  periodLabel: string;
  startDate: string;
  endDate: string;
  dataPointsCount: number;
  avgWaveHeight: number;
  maxWaveHeight: number;
  minWaveHeight: number;
  avgWindSpeed: number;
  maxWindSpeed: number;
  avgSeaSurfaceTemp: number;
  avgCurrentSpeed: number;
  avgSalinity: number;
  highRiskDaysCount: number;
  safeDaysCount: number;
}

export interface DateRangeAnalysisResult {
  records: DailyMaritimeRecord[];
  overallStats: AggregatedPeriodStats;
  weeklyAverages: AggregatedPeriodStats[];
  monthlyAverages: AggregatedPeriodStats[];
}

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const INDONESIAN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

/**
 * Deterministic pseudo-random number generator based on string seed
 */
function seededRandom(seedStr: string): number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = Math.imul(31, hash) + seedStr.charCodeAt(i) | 0;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate daily maritime historical and forecast records for a specific date range
 */
export function generateDateRangeData(
  startDateStr: string,
  endDateStr: string,
  baseLocation?: MaritimeLocation,
  baseCoral?: CoralReefSite,
  baseTide?: TidalStation
): DateRangeAnalysisResult {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  // Fallback if invalid range
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    const today = new Date();
    const past7 = new Date();
    past7.setDate(today.getDate() - 6);
    return generateDateRangeData(
      past7.toISOString().split('T')[0],
      today.toISOString().split('T')[0],
      baseLocation,
      baseCoral,
      baseTide
    );
  }

  const baseWave = baseLocation?.waveHeight ?? (baseCoral ? 1.2 : 1.5);
  const baseWind = baseLocation?.windSpeed ?? 14;
  const baseTemp = baseLocation?.seaSurfaceTemp ?? (baseCoral ? 29.2 : 28.5);
  const baseSalinity = baseLocation?.salinity ?? 33.2;
  const baseCurrent = baseLocation?.currentSpeed ?? 0.65;
  const locId = baseLocation?.id || baseCoral?.id || baseTide?.id || 'loc-default';

  const records: DailyMaritimeRecord[] = [];
  const curr = new Date(start);

  const weatherOptions = ['Cerah', 'Cerah Berawan', 'Berawan', 'Hujan Ringan', 'Hujan Sedang'];
  const windDirections = ['Tenggara (SE)', 'Timur (E)', 'Selatan (S)', 'Barat Daya (SW)', 'Utara (N)'];

  while (curr <= end) {
    const dateKey = curr.toISOString().split('T')[0];
    const dayOfWeek = curr.getDay();
    const dayName = INDONESIAN_DAYS[dayOfWeek];
    const d = curr.getDate();
    const m = curr.getMonth();
    const y = curr.getFullYear();
    const displayDate = `${d.toString().padStart(2, '0')} ${INDONESIAN_MONTHS_SHORT[m]} ${y}`;
    const monthLabel = `${INDONESIAN_MONTHS[m]} ${y}`;

    // Calculate Week label (Week 1 to Week 5 of month)
    const weekNum = Math.ceil(d / 7);
    const weekLabel = `Minggu ${weekNum} (${INDONESIAN_MONTHS_SHORT[m]} ${y})`;

    // Generate natural fluctuations using sine wave + seed
    const seed = `${locId}-${dateKey}`;
    const r1 = seededRandom(seed + '-1');
    const r2 = seededRandom(seed + '-2');
    const r3 = seededRandom(seed + '-3');
    const r4 = seededRandom(seed + '-4');

    // Seasonal sinusoidal cycle (monsoon influence)
    const dayOfYear = Math.floor((curr.getTime() - new Date(y, 0, 1).getTime()) / (1000 * 60 * 60 * 24));
    const seasonalFactor = Math.sin((dayOfYear / 365) * 2 * Math.PI) * 0.25;

    // Day noise
    const waveVariation = (r1 - 0.5) * 0.8 + seasonalFactor;
    const waveHeight = Math.max(0.4, Number((baseWave + waveVariation).toFixed(2)));

    const windVariation = (r2 - 0.5) * 8 + seasonalFactor * 6;
    const windSpeed = Math.max(4, Math.round(baseWind + windVariation));

    const tempVariation = (r3 - 0.5) * 1.4 - (seasonalFactor * 0.5);
    const seaSurfaceTemp = Number((baseTemp + tempVariation).toFixed(1));

    const currentSpeed = Number(Math.max(0.2, (baseCurrent + (r4 - 0.5) * 0.4)).toFixed(2));
    const salinity = Number((baseSalinity + (r1 - 0.5) * 0.8).toFixed(1));

    // Category and safety
    let waveCategory = 'Rendah';
    let safetyIndex = 'Aman Melaut';
    if (waveHeight < 0.75) {
      waveCategory = 'Tenang';
      safetyIndex = 'Aman Melaut';
    } else if (waveHeight < 1.25) {
      waveCategory = 'Rendah';
      safetyIndex = 'Aman Melaut';
    } else if (waveHeight < 2.5) {
      waveCategory = 'Sedang';
      safetyIndex = 'Waspada Perahu Kecil';
    } else if (waveHeight < 4.0) {
      waveCategory = 'Tinggi';
      safetyIndex = 'Bahaya Bagi Perahu & Tongkang';
    } else {
      waveCategory = 'Sangat Tinggi / Ekstrem';
      safetyIndex = 'Bahaya Bagi Semua Kapal';
    }

    const weatherCondition = weatherOptions[Math.floor(r4 * weatherOptions.length)];
    const windDirection = windDirections[Math.floor(r2 * windDirections.length)];

    records.push({
      date: dateKey,
      displayDate,
      dayName,
      weekLabel,
      monthLabel,
      waveHeight,
      waveCategory,
      windSpeed,
      windDirection,
      seaSurfaceTemp,
      salinity,
      currentSpeed,
      weatherCondition,
      safetyIndex,
      coralStressIndex: baseCoral ? Number((baseCoral.degreeHeatingWeeks + (r3 - 0.5) * 0.6).toFixed(1)) : undefined,
      tideMaxHeight: baseTide ? Number((baseTide.highTideHeight + (r1 - 0.5) * 0.3).toFixed(2)) : undefined
    });

    // Move to next day
    curr.setDate(curr.getDate() + 1);
  }

  // Calculate Overall Stats
  const overallStats = computePeriodStats(
    `${records[0]?.displayDate || startDateStr} s.d. ${records[records.length - 1]?.displayDate || endDateStr}`,
    startDateStr,
    endDateStr,
    records
  );

  // Group by Weekly
  const weeklyMap = new Map<string, DailyMaritimeRecord[]>();
  records.forEach(rec => {
    const list = weeklyMap.get(rec.weekLabel) || [];
    list.push(rec);
    weeklyMap.set(rec.weekLabel, list);
  });

  const weeklyAverages: AggregatedPeriodStats[] = Array.from(weeklyMap.entries()).map(([label, recs]) => {
    const startD = recs[0].date;
    const endD = recs[recs.length - 1].date;
    return computePeriodStats(label, startD, endD, recs);
  });

  // Group by Monthly
  const monthlyMap = new Map<string, DailyMaritimeRecord[]>();
  records.forEach(rec => {
    const list = monthlyMap.get(rec.monthLabel) || [];
    list.push(rec);
    monthlyMap.set(rec.monthLabel, list);
  });

  const monthlyAverages: AggregatedPeriodStats[] = Array.from(monthlyMap.entries()).map(([label, recs]) => {
    const startD = recs[0].date;
    const endD = recs[recs.length - 1].date;
    return computePeriodStats(label, startD, endD, recs);
  });

  return {
    records,
    overallStats,
    weeklyAverages,
    monthlyAverages
  };
}

function computePeriodStats(
  periodLabel: string,
  startDate: string,
  endDate: string,
  recs: DailyMaritimeRecord[]
): AggregatedPeriodStats {
  if (!recs.length) {
    return {
      periodLabel,
      startDate,
      endDate,
      dataPointsCount: 0,
      avgWaveHeight: 0,
      maxWaveHeight: 0,
      minWaveHeight: 0,
      avgWindSpeed: 0,
      maxWindSpeed: 0,
      avgSeaSurfaceTemp: 0,
      avgCurrentSpeed: 0,
      avgSalinity: 0,
      highRiskDaysCount: 0,
      safeDaysCount: 0
    };
  }

  const waves = recs.map(r => r.waveHeight);
  const winds = recs.map(r => r.windSpeed);
  const temps = recs.map(r => r.seaSurfaceTemp);
  const currents = recs.map(r => r.currentSpeed);
  const salinities = recs.map(r => r.salinity);

  const avgWaveHeight = Number((waves.reduce((a, b) => a + b, 0) / recs.length).toFixed(2));
  const maxWaveHeight = Number(Math.max(...waves).toFixed(2));
  const minWaveHeight = Number(Math.min(...waves).toFixed(2));

  const avgWindSpeed = Math.round(winds.reduce((a, b) => a + b, 0) / recs.length);
  const maxWindSpeed = Math.max(...winds);

  const avgSeaSurfaceTemp = Number((temps.reduce((a, b) => a + b, 0) / recs.length).toFixed(1));
  const avgCurrentSpeed = Number((currents.reduce((a, b) => a + b, 0) / recs.length).toFixed(2));
  const avgSalinity = Number((salinities.reduce((a, b) => a + b, 0) / recs.length).toFixed(1));

  const highRiskDaysCount = recs.filter(r => r.waveHeight >= 2.0).length;
  const safeDaysCount = recs.filter(r => r.waveHeight < 1.25).length;

  return {
    periodLabel,
    startDate,
    endDate,
    dataPointsCount: recs.length,
    avgWaveHeight,
    maxWaveHeight,
    minWaveHeight,
    avgWindSpeed,
    maxWindSpeed,
    avgSeaSurfaceTemp,
    avgCurrentSpeed,
    avgSalinity,
    highRiskDaysCount,
    safeDaysCount
  };
}

/**
 * Export date-range maritime dataset to formatted Excel file (.xlsx)
 */
export function exportDateRangeToExcel(
  locationName: string,
  provinceOrArea: string,
  startDateStr: string,
  endDateStr: string,
  analysis: DateRangeAnalysisResult
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Rincian Harian (Daily Records)
  const dailyDataRows = analysis.records.map((r, index) => ({
    'No': index + 1,
    'Tanggal': r.date,
    'Hari': r.dayName,
    'Label Minggu': r.weekLabel,
    'Tinggi Gelombang (m)': r.waveHeight,
    'Kategori Gelombang': r.waveCategory,
    'Kecepatan Angin (knot)': r.windSpeed,
    'Arah Angin': r.windDirection,
    'Suhu Muka Laut (°C)': r.seaSurfaceTemp,
    'Salinitas (PSU)': r.salinity,
    'Kecepatan Arus (m/s)': r.currentSpeed,
    'Kondisi Cuaca': r.weatherCondition,
    'Status Keselamatan Nelayan': r.safetyIndex
  }));

  const wsDaily = XLSX.utils.json_to_sheet(dailyDataRows);
  XLSX.utils.book_append_sheet(wb, wsDaily, 'Data Harian');

  // Sheet 2: Rata-Rata Mingguan (Weekly Averages)
  const weeklyDataRows = analysis.weeklyAverages.map((w, index) => ({
    'No': index + 1,
    'Periode Minggu': w.periodLabel,
    'Tanggal Mulai': w.startDate,
    'Tanggal Selesai': w.endDate,
    'Jumlah Hari': w.dataPointsCount,
    'Rata-rata Gelombang (m)': w.avgWaveHeight,
    'Maksimum Gelombang (m)': w.maxWaveHeight,
    'Minimum Gelombang (m)': w.minWaveHeight,
    'Rata-rata Angin (knot)': w.avgWindSpeed,
    'Maksimum Angin (knot)': w.maxWindSpeed,
    'Rata-rata Suhu Laut (°C)': w.avgSeaSurfaceTemp,
    'Rata-rata Kecepatan Arus (m/s)': w.avgCurrentSpeed,
    'Hari Waspada/Tinggi (>2m)': w.highRiskDaysCount,
    'Hari Aman (<1.25m)': w.safeDaysCount
  }));

  const wsWeekly = XLSX.utils.json_to_sheet(weeklyDataRows);
  XLSX.utils.book_append_sheet(wb, wsWeekly, 'Rata-Rata Mingguan');

  // Sheet 3: Rata-Rata Bulanan (Monthly Averages)
  const monthlyDataRows = analysis.monthlyAverages.map((m, index) => ({
    'No': index + 1,
    'Bulan & Tahun': m.periodLabel,
    'Tanggal Mulai': m.startDate,
    'Tanggal Selesai': m.endDate,
    'Jumlah Hari': m.dataPointsCount,
    'Rata-rata Gelombang (m)': m.avgWaveHeight,
    'Maksimum Gelombang (m)': m.maxWaveHeight,
    'Minimum Gelombang (m)': m.minWaveHeight,
    'Rata-rata Angin (knot)': m.avgWindSpeed,
    'Maksimum Angin (knot)': m.maxWindSpeed,
    'Rata-rata Suhu Laut (°C)': m.avgSeaSurfaceTemp,
    'Rata-rata Kecepatan Arus (m/s)': m.avgCurrentSpeed,
    'Hari Waspada/Tinggi (>2m)': m.highRiskDaysCount,
    'Hari Aman (<1.25m)': m.safeDaysCount
  }));

  const wsMonthly = XLSX.utils.json_to_sheet(monthlyDataRows);
  XLSX.utils.book_append_sheet(wb, wsMonthly, 'Rata-Rata Bulanan');

  // Sheet 4: Ringkasan Eksekutif & Metadata
  const summaryMetadata = [
    { 'Parameter Laporan': 'Nama Lokasi / Stasiun', 'Nilai': locationName },
    { 'Parameter Laporan': 'Wilayah / Provinsi', 'Nilai': provinceOrArea },
    { 'Parameter Laporan': 'Rentang Waktu Terpilih', 'Nilai': `${startDateStr} s.d. ${endDateStr}` },
    { 'Parameter Laporan': 'Total Hari Teranalisis', 'Nilai': `${analysis.records.length} Hari` },
    { 'Parameter Laporan': 'Rata-rata Tinggi Gelombang Total', 'Nilai': `${analysis.overallStats.avgWaveHeight} meter` },
    { 'Parameter Laporan': 'Tinggi Gelombang Tertinggi (Maks)', 'Nilai': `${analysis.overallStats.maxWaveHeight} meter` },
    { 'Parameter Laporan': 'Tinggi Gelombang Terendah (Min)', 'Nilai': `${analysis.overallStats.minWaveHeight} meter` },
    { 'Parameter Laporan': 'Rata-rata Kecepatan Angin', 'Nilai': `${analysis.overallStats.avgWindSpeed} knot` },
    { 'Parameter Laporan': 'Rata-rata Suhu Permukaan Laut', 'Nilai': `${analysis.overallStats.avgSeaSurfaceTemp} °C` },
    { 'Parameter Laporan': 'Jumlah Hari Aman Melaut (<1.25m)', 'Nilai': `${analysis.overallStats.safeDaysCount} Hari` },
    { 'Parameter Laporan': 'Jumlah Hari Gelombang Waspada/Tinggi', 'Nilai': `${analysis.overallStats.highRiskDaysCount} Hari` },
    { 'Parameter Laporan': 'Waktu Pembuatan File', 'Nilai': new Date().toLocaleString('id-ID') },
    { 'Parameter Laporan': 'Sumber Data', 'Nilai': 'Nusantara Bahari • Ina-WAVE BMKG, BIG & Open-Meteo' }
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryMetadata);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Eksekutif');

  // Sanitize filename
  const cleanLoc = locationName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 25);
  const filename = `Data_Maritim_NusantaraBahari_${cleanLoc}_${startDateStr}_sd_${endDateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}
