import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  MapPin, 
  Sparkles, 
  Table, 
  Search,
  Eye
} from 'lucide-react';
import { parseCSVString, parseExcelFile, exportRowsToCSV } from '../utils/dataParser';
import { SAMPLE_CSV_WEATHER_TEMPLATE, SAMPLE_CSV_CORAL_TEMPLATE } from '../data/mockMaritimeData';
import { CustomUploadedRow } from '../types';

interface DataUploaderProps {
  customData: CustomUploadedRow[];
  onDataLoaded: (rows: CustomUploadedRow[]) => void;
  onClearData: () => void;
  onSwitchToMap: () => void;
  onSwitchToStudio: () => void;
}

export const DataUploader: React.FC<DataUploaderProps> = ({
  customData,
  onDataLoaded,
  onClearData,
  onSwitchToMap,
  onSwitchToStudio
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'templates'>('upload');
  const [searchTerm, setSearchTerm] = useState('');

  // Handle File Input Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFile(files[0]);
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.csv')) {
        const text = await file.text();
        const parsed = parseCSVString(text);
        if (parsed.length === 0) {
          throw new Error('File CSV kosong atau format header tidak valid.');
        }
        onDataLoaded(parsed);
        setSuccessMsg(`Berhasil memuat ${parsed.length} baris data dari file CSV (${file.name})!`);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const parsed = parseExcelFile(buffer);
        if (parsed.length === 0) {
          throw new Error('File Excel tidak memiliki baris data pada Sheet pertama.');
        }
        onDataLoaded(parsed);
        setSuccessMsg(`Berhasil memuat ${parsed.length} baris data dari file Excel (${file.name})!`);
      } else {
        throw new Error('Format file tidak didukung. Harap gunakan file .csv, .xlsx, atau .xls.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Gagal memproses file. Periksa kembali struktur kolomnya.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Raw CSV Text Paste
  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      setErrorMsg('Harap masukkan teks CSV terlebih dahulu.');
      return;
    }
    try {
      const parsed = parseCSVString(pastedText);
      if (parsed.length === 0) {
        throw new Error('Format teks CSV tidak valid atau tidak memiliki baris data.');
      }
      onDataLoaded(parsed);
      setSuccessMsg(`Berhasil memuat ${parsed.length} baris data dari teks yang ditempel!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses teks CSV.');
    }
  };

  // Download Sample Templates
  const downloadTemplate = (type: 'weather' | 'coral') => {
    const content = type === 'weather' ? SAMPLE_CSV_WEATHER_TEMPLATE : SAMPLE_CSV_CORAL_TEMPLATE;
    const filename = type === 'weather' ? 'Template_Cuaca_Pasut_Maritim.csv' : 'Template_Monitoring_Terumbu_Karang.csv';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Table Data
  const filteredData = customData.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0f172a] p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Unggah & Olah Data Maritim (Excel / CSV)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Unggah data survei terumbu karang, pengamatan cuaca stasiun lokal, atau tinggi pasang surut untuk langsung diproyeksikan ke Peta Web GIS dan Studio Infografis.
          </p>
        </div>

        {/* Action Shortcuts if data exists */}
        {customData.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onSwitchToMap}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              <span>Lihat di Peta GIS</span>
            </button>
            <button
              onClick={onSwitchToStudio}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Buat Infografis</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'upload' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'bg-[#0f172a] text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload File (.xlsx / .csv)</span>
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'paste' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'bg-[#0f172a] text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Salin / Tempel Teks CSV</span>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'templates' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'bg-[#0f172a] text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Unduh Template Contoh</span>
        </button>
      </div>

      {/* Status Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white text-xs cursor-pointer">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white text-xs cursor-pointer">✕</button>
        </div>
      )}

      {/* TAB 1: FILE UPLOAD DRAG & DROP */}
      {activeTab === 'upload' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-10 sm:p-14 rounded-3xl border-2 border-dashed text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-cyan-400 bg-cyan-950/40 shadow-xl shadow-cyan-500/20 scale-[1.01]'
              : 'border-slate-800 hover:border-cyan-500/60 bg-[#0f172a] hover:bg-[#1e293b]/40 shadow-2xl'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 mb-4 shadow-lg">
            <UploadCloud className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1">
            Klik untuk memilih file atau seret & jatuhkan di sini
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-4 leading-relaxed">
            Mendukung format Microsoft Excel (<span className="text-cyan-300 font-mono font-semibold">.xlsx, .xls</span>) dan Comma-Separated Values (<span className="text-cyan-300 font-mono font-semibold">.csv</span>).
          </p>
          <div className="inline-flex items-center gap-2 bg-[#1e293b]/80 px-4 py-2 rounded-full border border-slate-700 text-xs text-slate-300">
            <span className="font-bold">Saran Kolom:</span>
            <span className="text-cyan-400 font-mono text-[11px]">lokasi, lat, lng, tinggi_gelombang, tutupan_karang, status</span>
          </div>
        </div>
      )}

      {/* TAB 2: RAW CSV TEXT PASTE */}
      {activeTab === 'paste' && (
        <div className="bg-[#0f172a] p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200">Tempelkan Teks CSV Berformat Header:</label>
            <button
              onClick={() => setPastedText(SAMPLE_CSV_WEATHER_TEMPLATE)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
            >
              Gunakan Contoh Data Cuaca
            </button>
          </div>
          <textarea
            rows={7}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="lokasi,lat,lng,tinggi_gelombang_m,suhu_air_c,status_cuaca&#10;Pantai Kuta,-8.718,115.168,2.2,28.5,Cerah"
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleProcessPastedText}
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
          >
            Proses & Tampilkan Data
          </button>
        </div>
      )}

      {/* TAB 3: DOWNLOAD READY-MADE TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0f172a] p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl space-y-3.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-white">Template Cuaca & Pasang Surut</h4>
                <p className="text-[11px] text-slate-400">Kolom gelombang, angin, suhu laut & indeks keselamatan</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Format terstruktur untuk pengamatan stasiun maritim pelabuhan, mercusuar, dan titik pendaratan kapal.
            </p>
            <button
              onClick={() => downloadTemplate('weather')}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 hover:text-white text-xs font-bold py-2.5 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Template CSV Cuaca</span>
            </button>
          </div>

          <div className="bg-[#0f172a] p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl space-y-3.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-white">Template Monitoring Terumbu Karang</h4>
                <p className="text-[11px] text-slate-400">Kolom tutupan karang %, bleaching alert, DHW & spesies</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Format standar Reef Check & COREMAP LIPI/BRIN untuk survei kesehatan terumbu karang dan kawasan konservasi.
            </p>
            <button
              onClick={() => downloadTemplate('coral')}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-teal-500/50 text-teal-300 hover:text-white text-xs font-bold py-2.5 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Template CSV Karang</span>
            </button>
          </div>
        </div>
      )}

      {/* DATA PREVIEW & MANAGEMENT TABLE */}
      {customData.length > 0 && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Tabel Data Pengguna Aktif ({customData.length} Baris)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Search filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari dalam data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-full pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-40 sm:w-56"
                />
              </div>

              {/* Export Back to CSV */}
              <button
                onClick={() => exportRowsToCSV(customData)}
                className="px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                title="Ekspor ke CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ekspor</span>
              </button>

              {/* Clear Data */}
              <button
                onClick={onClearData}
                className="px-3.5 py-1.5 rounded-full bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Hapus Seluruh Data Upload"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hapus Data</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto max-h-96 rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="p-3">No</th>
                  <th className="p-3">Lokasi / Titik</th>
                  <th className="p-3">Koordinat (Lat, Lng)</th>
                  {Object.keys(customData[0] || {})
                    .filter(k => !['id', 'lokasi', 'lat', 'lng'].includes(k))
                    .map(k => (
                      <th key={k} className="p-3 whitespace-nowrap capitalize">
                        {k.replace(/_/g, ' ')}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {filteredData.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-white whitespace-nowrap">{row.lokasi}</td>
                    <td className="p-3 font-mono text-cyan-300 whitespace-nowrap">
                      {row.lat.toFixed(4)}, {row.lng.toFixed(4)}
                    </td>
                    {Object.entries(row)
                      .filter(([k]) => !['id', 'lokasi', 'lat', 'lng'].includes(k))
                      .map(([k, v], vIdx) => (
                        <td key={vIdx} className="p-3 whitespace-nowrap">
                          {String(v)}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
