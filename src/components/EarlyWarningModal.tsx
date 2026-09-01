import React from 'react';
import { CoastalAlert } from '../types';
import { 
  AlertTriangle, 
  X, 
  Bell, 
  ShieldAlert, 
  Clock, 
  Download, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { getSeverityStyle } from '../utils/formatters';

interface EarlyWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: CoastalAlert[];
  onTriggerInfographic: (type: 'alert', data: CoastalAlert) => void;
}

export const EarlyWarningModal: React.FC<EarlyWarningModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onTriggerInfographic
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                Notifikasi Peringatan Dini Pesisir & Maritim
              </h3>
              <p className="text-xs text-slate-400">
                {alerts.length} Peringatan Keselamatan BMKG / KKP / BIG Aktif
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Alerts Scrollable List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {alerts.map((alert) => {
            const style = getSeverityStyle(alert.severity);
            return (
              <div
                key={alert.id}
                className={`${style.bg} border ${style.border} p-5 rounded-2xl space-y-3`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${style.badge}`}>
                        {alert.severity}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Hingga: {alert.validUntil}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white leading-snug">{alert.title}</h4>
                    <p className="text-xs text-slate-300 mt-1">{alert.headline}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#020617]/70 text-[11px] text-slate-300 space-y-1">
                  <div className="text-slate-400">
                    <strong className="text-slate-300">Zona Terdampak:</strong> {alert.seaZones.join(' • ')}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
                  <span className="text-[11px] text-slate-400">Sumber: {alert.source}</span>
                  <button
                    onClick={() => {
                      onTriggerInfographic('alert', alert);
                      onClose();
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-full flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                  >
                    <Download className="w-3 h-3" />
                    <span>Buat Infografis</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0f172a] flex items-center justify-between text-xs text-slate-400">
          <span>Hubungi SAR Bebas Pulsa: <strong className="text-white">115</strong></span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
