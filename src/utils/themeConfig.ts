export type AppThemeId = 'ocean_light' | 'pure_white' | 'ocean_teal' | 'royal_navy' | 'nordic_slate' | 'emerald_lagoon' | 'midnight_abyss';

export interface AppTheme {
  id: AppThemeId;
  name: string;
  subtitle: string;
  tag: string;
  isLight: boolean;
  previewBg: string;
  accentColor: string;
  rootBgClass: string;
  headerBgClass: string;
  cardBgClass: string;
  cardBorderClass: string;
  subCardBgClass: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
  textMutedClass: string;
  footerBgClass: string;
  badgeBgClass: string;
  accentBorderClass: string;
}

export const APP_THEMES: Record<AppThemeId, AppTheme> = {
  ocean_light: {
    id: 'ocean_light',
    name: 'Terang: Oceanic Light (Putih Sejuk)',
    subtitle: 'Latar Putih Sejuk Beraksen Biru Langit & Sian',
    tag: 'Mode Terang Utama',
    isLight: true,
    previewBg: 'bg-gradient-to-br from-[#ffffff] via-[#e0f2fe] to-[#bae6fd]',
    accentColor: '#0284c7',
    rootBgClass: 'bg-[#f0f6fc] text-slate-800',
    headerBgClass: 'bg-white/95 border-slate-200 shadow-sm backdrop-blur-md text-slate-800',
    cardBgClass: 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)]',
    cardBorderClass: 'border-slate-200',
    subCardBgClass: 'bg-[#f8fafc]',
    textPrimaryClass: 'text-slate-800',
    textSecondaryClass: 'text-slate-600',
    textMutedClass: 'text-slate-500',
    footerBgClass: 'bg-[#e2eaf2] border-slate-300 text-slate-700',
    badgeBgClass: 'bg-sky-100 text-sky-800 border-sky-300',
    accentBorderClass: 'border-sky-400'
  },
  pure_white: {
    id: 'pure_white',
    name: 'Terang: Crisp Pure White (Putih Bersih)',
    subtitle: 'Latar Putih Bersih Minimalis, Kontras Tajam & Cerah',
    tag: 'Putih Bersih 100%',
    isLight: true,
    previewBg: 'bg-gradient-to-br from-[#ffffff] to-[#f1f5f9]',
    accentColor: '#0891b2',
    rootBgClass: 'bg-[#ffffff] text-slate-900',
    headerBgClass: 'bg-white border-slate-200 shadow-sm backdrop-blur-md text-slate-900',
    cardBgClass: 'bg-white shadow-[0_2px_15px_rgba(0,0,0,0.06)]',
    cardBorderClass: 'border-slate-200',
    subCardBgClass: 'bg-[#f8fafc]',
    textPrimaryClass: 'text-slate-900',
    textSecondaryClass: 'text-slate-700',
    textMutedClass: 'text-slate-500',
    footerBgClass: 'bg-[#f1f5f9] border-slate-200 text-slate-700',
    badgeBgClass: 'bg-cyan-50 text-cyan-800 border-cyan-300',
    accentBorderClass: 'border-cyan-500'
  },
  ocean_teal: {
    id: 'ocean_teal',
    name: 'Gelap: Ocean Teal Marine',
    subtitle: 'Biru Laut Dalam Tropis & Elegan',
    tag: 'Rekomendasi Gelap',
    isLight: false,
    previewBg: 'bg-gradient-to-br from-[#041c2c] to-[#08384f]',
    accentColor: '#06b6d4',
    rootBgClass: 'bg-[#041622] bg-gradient-to-b from-[#041622] via-[#062233] to-[#03111b]',
    headerBgClass: 'bg-[#072436]/90 border-cyan-900/50 backdrop-blur-md',
    cardBgClass: 'bg-[#09293d]/90',
    cardBorderClass: 'border-[#134e6f]/50',
    subCardBgClass: 'bg-[#061e2e]/90',
    textPrimaryClass: 'text-slate-100',
    textSecondaryClass: 'text-cyan-200/80',
    textMutedClass: 'text-slate-400',
    footerBgClass: 'bg-[#03131e] border-cyan-950/60',
    badgeBgClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/50',
    accentBorderClass: 'border-cyan-500/40'
  },
  royal_navy: {
    id: 'royal_navy',
    name: 'Gelap: Royal Navy Cobalt',
    subtitle: 'Biru Navy Samudra Pasifik',
    tag: 'Institusi & Riset',
    isLight: false,
    previewBg: 'bg-gradient-to-br from-[#060e22] to-[#12234e]',
    accentColor: '#38bdf8',
    rootBgClass: 'bg-[#060e22] bg-gradient-to-b from-[#060e22] via-[#091738] to-[#050b1a]',
    headerBgClass: 'bg-[#0a1b40]/90 border-blue-900/50 backdrop-blur-md',
    cardBgClass: 'bg-[#0e214d]/90',
    cardBorderClass: 'border-[#1e3a8a]/50',
    subCardBgClass: 'bg-[#081533]/90',
    textPrimaryClass: 'text-slate-100',
    textSecondaryClass: 'text-blue-200/80',
    textMutedClass: 'text-slate-400',
    footerBgClass: 'bg-[#040a17] border-blue-950/60',
    badgeBgClass: 'bg-blue-950/80 text-blue-300 border-blue-700/50',
    accentBorderClass: 'border-blue-500/40'
  },
  nordic_slate: {
    id: 'nordic_slate',
    name: 'Gelap: Nordic Slate Gray',
    subtitle: 'Abu-Abu Slate Dingin & Modern',
    tag: 'Minimalis Modern',
    isLight: false,
    previewBg: 'bg-gradient-to-br from-[#0f172a] to-[#1e293b]',
    accentColor: '#38bdf8',
    rootBgClass: 'bg-[#0f172a] bg-gradient-to-b from-[#0f172a] via-[#182338] to-[#0b1120]',
    headerBgClass: 'bg-[#152238]/90 border-slate-700/50 backdrop-blur-md',
    cardBgClass: 'bg-[#1e293b]/90',
    cardBorderClass: 'border-slate-700/60',
    subCardBgClass: 'bg-[#111a2e]/90',
    textPrimaryClass: 'text-slate-100',
    textSecondaryClass: 'text-slate-300',
    textMutedClass: 'text-slate-400',
    footerBgClass: 'bg-[#0b1120] border-slate-800/80',
    badgeBgClass: 'bg-slate-800/80 text-slate-300 border-slate-700/50',
    accentBorderClass: 'border-cyan-500/40'
  },
  emerald_lagoon: {
    id: 'emerald_lagoon',
    name: 'Gelap: Emerald Lagoon',
    subtitle: 'Hijau Pesisir & Konservasi Karang',
    tag: 'Konservasi & Pesisir',
    isLight: false,
    previewBg: 'bg-gradient-to-br from-[#021815] to-[#064239]',
    accentColor: '#2dd4bf',
    rootBgClass: 'bg-[#021815] bg-gradient-to-b from-[#021815] via-[#042823] to-[#021210]',
    headerBgClass: 'bg-[#052b25]/90 border-teal-900/50 backdrop-blur-md',
    cardBgClass: 'bg-[#073630]/90',
    cardBorderClass: 'border-[#0f5c51]/50',
    subCardBgClass: 'bg-[#03211c]/90',
    textPrimaryClass: 'text-slate-100',
    textSecondaryClass: 'text-teal-200/80',
    textMutedClass: 'text-slate-400',
    footerBgClass: 'bg-[#02100e] border-teal-950/60',
    badgeBgClass: 'bg-teal-950/80 text-teal-300 border-teal-700/50',
    accentBorderClass: 'border-teal-500/40'
  },
  midnight_abyss: {
    id: 'midnight_abyss',
    name: 'Gelap: Midnight Black Abyss',
    subtitle: 'Hitam Pekat Minimalis Beraksen Neon',
    tag: 'Classic Dark',
    isLight: false,
    previewBg: 'bg-gradient-to-br from-[#020617] to-[#0f172a]',
    accentColor: '#06b6d4',
    rootBgClass: 'bg-[#020617]',
    headerBgClass: 'bg-[#0f172a]/90 border-slate-800/50 backdrop-blur-md',
    cardBgClass: 'bg-[#0f172a]/90',
    cardBorderClass: 'border-slate-800',
    subCardBgClass: 'bg-[#090e1a]',
    textPrimaryClass: 'text-slate-100',
    textSecondaryClass: 'text-slate-300',
    textMutedClass: 'text-slate-400',
    footerBgClass: 'bg-[#020617] border-slate-800/50',
    badgeBgClass: 'bg-slate-800/80 text-cyan-300 border-slate-700/50',
    accentBorderClass: 'border-cyan-500/40'
  }
};
