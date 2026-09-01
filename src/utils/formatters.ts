import { BleachingAlert, CoralHealthCategory, WaveCategory } from '../types';

export function getWaveBadgeColor(category: WaveCategory): { bg: string; text: string; border: string; desc: string } {
  switch (category) {
    case 'Tenang':
      return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', desc: '0.1 - 0.5 m (Sangat Tenang)' };
    case 'Rendah':
      return { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30', desc: '0.5 - 1.25 m (Kondisi Normal)' };
    case 'Sedang':
      return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', desc: '1.25 - 2.5 m (Waspada Perahu Nelayan)' };
    case 'Tinggi':
      return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40', desc: '2.5 - 4.0 m (Bahaya Pelayaran Kecil)' };
    case 'Sangat Tinggi':
      return { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40', desc: '4.0 - 6.0 m (Bahaya Seluruh Kapal)' };
    case 'Ekstrem':
      return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40', desc: '> 6.0 m (Badai & Gelombang Ekstrem)' };
    default:
      return { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30', desc: '-' };
  }
}

export function getCoralHealthBadge(category: CoralHealthCategory): { bg: string; text: string; label: string } {
  if (category.startsWith('Sangat Baik')) {
    return { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', text: 'text-emerald-400', label: 'Sangat Baik (75-100%)' };
  }
  if (category.startsWith('Baik')) {
    return { bg: 'bg-teal-500/20 text-teal-300 border-teal-500/30', text: 'text-teal-400', label: 'Baik (50-74.9%)' };
  }
  if (category.startsWith('Sedang')) {
    return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', text: 'text-amber-400', label: 'Sedang (25-49.9%)' };
  }
  return { bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30', text: 'text-rose-400', label: 'Rusak (0-24.9%)' };
}

export function getBleachingBadge(alert: BleachingAlert): { bg: string; text: string; border: string; desc: string } {
  switch (alert) {
    case 'No Stress':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', desc: 'Normal / Aman' };
    case 'Watch':
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30', desc: 'Waspada Termal Ringan' };
    case 'Warning':
      return { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30', desc: 'Peringatan Pemutihan (DHW 1-4)' };
    case 'Alert Level 1':
      return { bg: 'bg-orange-500/25', text: 'text-orange-300', border: 'border-orange-500/40', desc: 'Siaga 1 (Pemutihan Signifikan)' };
    case 'Alert Level 2':
      return { bg: 'bg-rose-600/30', text: 'text-rose-300', border: 'border-rose-500/50', desc: 'Siaga 2 (Kematian Karang Masif)' };
    default:
      return { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30', desc: '-' };
  }
}

export function getRobRiskBadge(risk: 'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis'): { bg: string; text: string } {
  switch (risk) {
    case 'Rendah':
      return { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', text: 'text-emerald-400' };
    case 'Sedang':
      return { bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', text: 'text-yellow-400' };
    case 'Tinggi':
      return { bg: 'bg-orange-500/20 text-orange-300 border-orange-500/30', text: 'text-orange-400' };
    case 'Kritis':
      return { bg: 'bg-rose-500/25 text-rose-300 border-rose-500/40 animate-pulse', text: 'text-rose-400' };
    default:
      return { bg: 'bg-slate-500/20 text-slate-300 border-slate-500/30', text: 'text-slate-300' };
  }
}

export function getSeverityStyle(severity: 'INFO' | 'WASPADA' | 'SIAGA' | 'AWAS'): { bg: string; badge: string; border: string; glow: string } {
  switch (severity) {
    case 'INFO':
      return { bg: 'bg-blue-950/40', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', border: 'border-blue-500/30', glow: 'shadow-blue-500/10' };
    case 'WASPADA':
      return { bg: 'bg-amber-950/40', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', border: 'border-amber-500/30', glow: 'shadow-amber-500/10' };
    case 'SIAGA':
      return { bg: 'bg-orange-950/40', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30', border: 'border-orange-500/40', glow: 'shadow-orange-500/20' };
    case 'AWAS':
      return { bg: 'bg-rose-950/50', badge: 'bg-rose-500/25 text-rose-200 border-rose-500/40 animate-pulse', border: 'border-rose-500/50', glow: 'shadow-rose-500/30' };
    default:
      return { bg: 'bg-slate-900/40', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30', border: 'border-slate-500/30', glow: 'shadow-none' };
  }
}
