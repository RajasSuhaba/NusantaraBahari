import React, { useState } from 'react';
import { CoastalAlert } from '../types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Bell, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Radio, 
  PhoneCall, 
  Download, 
  Clock, 
  MapPin, 
  ShieldCheck,
  Send,
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { getSeverityStyle } from '../utils/formatters';

interface EarlyWarningViewProps {
  alerts: CoastalAlert[];
  onTriggerInfographic: (type: 'alert', data: CoastalAlert) => void;
}

export const EarlyWarningView: React.FC<EarlyWarningViewProps> = ({
  alerts,
  onTriggerInfographic
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isPlayingSiren, setIsPlayingSiren] = useState(false);
  const [simulatedSubscribed, setSimulatedSubscribed] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [subSuccess, setSubSuccess] = useState(false);

  // Filtered Alerts
  const filteredAlerts = alerts.filter(a => {
    if (selectedType === 'ALL') return true;
    return a.type === selectedType;
  });

  // Audio Siren Simulator using Web Audio API
  const toggleSirenSound = () => {
    if (isPlayingSiren) {
      setIsPlayingSiren(false);
      return;
    }

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.4);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.8);

      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      setIsPlayingSiren(true);

      setTimeout(() => {
        try {
          osc.stop();
          audioCtx.close();
        } catch (e) {}
        setIsPlayingSiren(false);
      }, 3000);
    } catch (e) {
      console.warn('Web Audio API not allowed without user gesture', e);
      setIsPlayingSiren(false);
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setSubSuccess(true);
    setSimulatedSubscribed(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-[#0f172a] p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Pusat Peringatan Dini Bencana Pesisir (Coastal EWS)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Sistem peringatan cepat gelombang tinggi, banjir rob, anomali suhu pemutihan karang, dan badai laut untuk keselamatan masyarakat pesisir & maritim.
          </p>
        </div>

        {/* Siren Sound Tester */}
        <button
          onClick={toggleSirenSound}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all border self-start sm:self-auto cursor-pointer ${
            isPlayingSiren
              ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]'
              : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
          }`}
        >
          {isPlayingSiren ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          <span>{isPlayingSiren ? 'Membunyikan Sirine Alarm...' : 'Uji Bunyi Sirine EWS'}</span>
        </button>
      </div>

      {/* Filter Tabs by Disaster Type */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL', label: 'Semua Peringatan Aktif' },
          { id: 'GELOMBANG_TINGGI', label: '🌊 Gelombang Tinggi' },
          { id: 'BANJIR_ROB', label: '🌊 Banjir Rob' },
          { id: 'BLEACHING_ALERT', label: '🪸 Pemutihan Karang' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedType(tab.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedType === tab.id
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'bg-[#0f172a] text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Alerts Feed Grid */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const style = getSeverityStyle(alert.severity);
          return (
            <div
              key={alert.id}
              className={`${style.bg} border ${style.border} p-6 sm:p-7 rounded-3xl shadow-xl space-y-4 relative overflow-hidden`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-white/10 pb-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${style.badge}`}>
                      STATUS: {alert.severity}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Dikeluarkan: {alert.issuedAt}
                    </span>
                    <span className="text-xs text-rose-300 font-semibold">
                      • Berlaku Hingga: {alert.validUntil}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                    {alert.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Sumber Resmi: <strong className="text-white">{alert.source}</strong>
                  </p>
                </div>

                <button
                  onClick={() => onTriggerInfographic('alert', alert)}
                  className="self-start bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.3)] border border-rose-400/40 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Poster Peringatan</span>
                </button>
              </div>

              {/* Risk Details Narrative */}
              <div className="p-4 rounded-2xl bg-[#020617]/70 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                <strong className="text-white block mb-1 text-xs uppercase tracking-wider font-bold">Deskripsi & Dinamika Ancaman:</strong>
                {alert.riskDetails}
              </div>

              {/* Affected Zones Pills */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  Wilayah Perairan & Pesisir Terdampak:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {alert.seaZones.map((z, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-rose-950/60 text-rose-200 border border-rose-500/30 text-xs font-medium">
                      {z}
                    </span>
                  ))}
                </div>
              </div>

              {/* Safety SOP Recommendations */}
              <div className="bg-[#020617]/80 p-5 rounded-2xl border border-amber-500/30 space-y-2.5">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Prosedur Operasi Standar (SOP) Mitigasi Keselamatan
                </span>
                <div className="space-y-1.5 pt-1">
                  {alert.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Emergency Hotlines & Subscription Simulator Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Emergency Hotlines */}
        <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-3.5">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <PhoneCall className="w-4 h-4 text-cyan-400" />
            <span>Kontak Darurat Bencana Pesisir & SAR Nasional</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-[#1e293b]/70 border border-slate-800">
              <span className="text-slate-400 text-[10px] block uppercase font-bold">BASARNAS / SAR Laut</span>
              <span className="text-lg font-bold text-white">115</span>
              <span className="text-[10px] text-cyan-300 block mt-0.5 font-medium">Siaga 24 Jam Evakuasi</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#1e293b]/70 border border-slate-800">
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Call Center BMKG</span>
              <span className="text-lg font-bold text-white">196</span>
              <span className="text-[10px] text-cyan-300 block mt-0.5 font-medium">Info Cuaca & Gempa</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#1e293b]/70 border border-slate-800">
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Polairud / Syahbandar</span>
              <span className="text-sm font-bold text-white">Radio VHF Ch. 16</span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Frekuensi Maritim Int.</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#1e293b]/70 border border-slate-800">
              <span className="text-slate-400 text-[10px] block uppercase font-bold">BNPB Tanggap Darurat</span>
              <span className="text-lg font-bold text-white">117</span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Logistik & Pengungsian</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Notification Simulator */}
        <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-3.5">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Langganan Notifikasi Siaga WhatsApp / SMS</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Dapatkan pesan otomatis sebelum gelombang pasang rob atau peringatan gelombang tinggi menerjang wilayah pesisir Anda.
          </p>

          {subSuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Nomor <strong>{phoneNumber}</strong> telah aktif terdaftar dalam sistem EWS Nusantara Bahari.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="tel"
                placeholder="Contoh: 081234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Aktifkan</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
