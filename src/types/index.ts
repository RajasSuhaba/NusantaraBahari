export interface ForecastHour {
  time: string;
  waveHeight: number;
  windSpeed: number;
  windDirection: string;
  weather: string;
  seaSurfaceTemp: number;
}

export type WaveCategory = 'Tenang' | 'Rendah' | 'Sedang' | 'Tinggi' | 'Sangat Tinggi' | 'Ekstrem';

export interface MaritimeLocation {
  id: string;
  name: string;
  province: string;
  region: 'Sumatra' | 'Jawa' | 'Bali-Nusra' | 'Kalimantan' | 'Sulawesi' | 'Maluku-Papua';
  seaArea: string;
  lat: number;
  lng: number;
  waveHeight: number; // in meters
  waveCategory: WaveCategory;
  windSpeed: number; // in knots
  windDirection: string;
  seaSurfaceTemp: number; // in Celsius
  salinity: number; // PSU
  currentSpeed: number; // m/s
  currentDirection: string;
  visibility: number; // km
  airPressure: number; // hPa
  weatherCondition: 'Cerah' | 'Cerah Berawan' | 'Berawan' | 'Hujan Ringan' | 'Hujan Lebat' | 'Badai Petir';
  safetyIndex: 'Aman Melaut' | 'Waspada Perahu Kecil' | 'Bahaya Bagi Semua Kapal';
  forecast24h: ForecastHour[];
}

export interface TidalPoint {
  hour: string;
  height: number; // in meters
  type?: 'high' | 'low' | 'normal';
}

export interface TidalStation {
  id: string;
  name: string;
  location: string;
  province: string;
  lat: number;
  lng: number;
  currentTideHeight: number; // in meters
  trend: 'rising' | 'falling' | 'slack';
  tidalType: 'Semidiurnal (Ganda)' | 'Diurnal (Tunggal)' | 'Campuran Dominan Ganda' | 'Campuran Dominan Tunggal';
  highTideTime: string;
  highTideHeight: number;
  lowTideTime: string;
  lowTideHeight: number;
  springTideRange: number;
  moonPhase: 'Bulan Baru (New Moon)' | 'Kuartir Pertama' | 'Bulan Purnama (Full Moon)' | 'Kuartir Ketiga';
  robRisk: 'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis';
  hourlyTides: TidalPoint[];
}

export type BleachingAlert = 'No Stress' | 'Watch' | 'Warning' | 'Alert Level 1' | 'Alert Level 2';
export type CoralHealthCategory = 'Sangat Baik (75-100%)' | 'Baik (50-74.9%)' | 'Sedang (25-49.9%)' | 'Rusak (0-24.9%)';

export interface CoralReefSite {
  id: string;
  name: string;
  marineProtectedArea: string;
  province: string;
  lat: number;
  lng: number;
  liveCoralCoverPct: number;
  healthCategory: CoralHealthCategory;
  bleachingAlert: BleachingAlert;
  degreeHeatingWeeks: number; // DHW in °C-weeks
  biodiversityScore: number; // 1-100
  dominantGenera: string[];
  keyFishSpecies: string[];
  threats: string[];
  conservationStatus: 'Zona Inti' | 'Zona Pemanfaatan Terbatas' | 'Zona Rehabilitasi' | 'Cagar Alam Perairan';
  rehabilitationProjects: string;
  photoUrl: string;
  historicalTrend: { year: number; coverPct: number; bleachingPct: number }[];
  waterClarityMeters: number;
}

export interface CoastalAlert {
  id: string;
  type: 'GELOMBANG_TINGGI' | 'BANJIR_ROB' | 'CUACA_EKSTREM' | 'BLEACHING_ALERT' | 'TSUNAMI_ADVISORY';
  severity: 'INFO' | 'WASPADA' | 'SIAGA' | 'AWAS';
  title: string;
  headline: string;
  affectedRegions: string[];
  seaZones: string[];
  validUntil: string;
  issuedAt: string;
  source: string;
  riskDetails: string;
  recommendations: string[];
  active: boolean;
}

export interface CustomUploadedRow {
  id: string;
  lokasi: string;
  kategori?: string;
  lat: number;
  lng: number;
  parameter1_nama?: string;
  parameter1_nilai?: number | string;
  parameter2_nama?: string;
  parameter2_nilai?: number | string;
  parameter3_nama?: string;
  parameter3_nilai?: number | string;
  status?: string;
  keterangan?: string;
  [key: string]: any;
}

export interface InfographicTemplateConfig {
  id: string;
  title: string;
  subtitle: string;
  category: 'weather_marine' | 'coral_reef' | 'tides_rob' | 'disaster_warning' | 'custom_data';
  layoutSize: 'story' | 'square' | 'poster' | 'landscape';
  themeColor: 'ocean' | 'coral' | 'navy' | 'warning' | 'emerald';
  selectedLocationId: string;
  customHeader: string;
  customDescription: string;
  footerOrg: string;
  contactEmergency: string;
  showMap: boolean;
  showCharts: boolean;
  showMetrics: boolean;
  showSafetyTips: boolean;
  showQrCode: boolean;
  customNotes: string;
}
