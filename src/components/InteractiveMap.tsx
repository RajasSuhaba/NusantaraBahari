import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MaritimeLocation, 
  TidalStation, 
  CoralReefSite, 
  CoastalAlert, 
  CustomUploadedRow 
} from '../types';
import { 
  Layers, 
  Waves, 
  Sparkles, 
  AlertTriangle, 
  MapPin, 
  Maximize2, 
  Compass, 
  Wind, 
  Thermometer, 
  Download, 
  Eye, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { getWaveBadgeColor, getCoralHealthBadge, getBleachingBadge, getRobRiskBadge } from '../utils/formatters';

interface InteractiveMapProps {
  weatherLocations: MaritimeLocation[];
  tidalStations: TidalStation[];
  coralSites: CoralReefSite[];
  coastalAlerts: CoastalAlert[];
  customUploadedData: CustomUploadedRow[];
  selectedLocationId?: string;
  onSelectWeatherLocation: (loc: MaritimeLocation) => void;
  onSelectTidalStation: (station: TidalStation) => void;
  onSelectCoralSite: (site: CoralReefSite) => void;
  onSelectCustomRow: (row: CustomUploadedRow) => void;
  onTriggerInfographic: (type: 'weather' | 'coral' | 'tide' | 'custom', data: any) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  weatherLocations,
  tidalStations,
  coralSites,
  coastalAlerts,
  customUploadedData,
  onSelectWeatherLocation,
  onSelectTidalStation,
  onSelectCoralSite,
  onSelectCustomRow,
  onTriggerInfographic
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupsRef = useRef<{
    weather: L.LayerGroup;
    tides: L.LayerGroup;
    corals: L.LayerGroup;
    alerts: L.LayerGroup;
    custom: L.LayerGroup;
  }>({
    weather: L.layerGroup(),
    tides: L.layerGroup(),
    corals: L.layerGroup(),
    alerts: L.layerGroup(),
    custom: L.layerGroup()
  });

  // Layer Visibility Filters
  const [showWeather, setShowWeather] = useState(true);
  const [showTides, setShowTides] = useState(true);
  const [showCorals, setShowCorals] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [showCustom, setShowCustom] = useState(true);
  const [baseTileLayer, setBaseTileLayer] = useState<'ocean' | 'dark' | 'satellite'>('ocean');

  const [activeFeature, setActiveFeature] = useState<{
    type: 'weather' | 'tide' | 'coral' | 'custom' | 'alert';
    data: any;
  } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create map centered on Indonesian Archipelago
      const map = L.map(mapContainerRef.current, {
        center: [-2.5, 118.0],
        zoom: 5,
        minZoom: 4,
        maxZoom: 14,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Tile layers
      const tileUrl = 
        baseTileLayer === 'ocean'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}'
          : baseTileLayer === 'dark'
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

      const tileLayer = L.tileLayer(tileUrl, {
        attribution: '&copy; Esri &mdash; Ocean Basemap / OpenStreetMap',
        maxZoom: 18
      }).addTo(map);

      // Add reference layer for ocean basemap to display labels
      if (baseTileLayer === 'ocean') {
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 18
        }).addTo(map);
      }

      // Add layer groups to map
      layerGroupsRef.current.weather.addTo(map);
      layerGroupsRef.current.tides.addTo(map);
      layerGroupsRef.current.corals.addTo(map);
      layerGroupsRef.current.alerts.addTo(map);
      layerGroupsRef.current.custom.addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup will happen on unmount
    };
  }, []);

  // Update Base Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = '';
    let subLayerUrl = '';

    if (baseTileLayer === 'ocean') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}';
      subLayerUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}';
    } else if (baseTileLayer === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    } else {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }

    L.tileLayer(tileUrl, {
      attribution: '&copy; Basemap GIS Provider',
      maxZoom: 18
    }).addTo(map);

    if (subLayerUrl) {
      L.tileLayer(subLayerUrl, { maxZoom: 18 }).addTo(map);
    }
  }, [baseTileLayer]);

  // Update Map Markers and Overlays
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // 1. Weather Markers
    layerGroupsRef.current.weather.clearLayers();
    if (showWeather) {
      weatherLocations.forEach((loc) => {
        const badge = getWaveBadgeColor(loc.waveCategory);
        const markerColor = 
          loc.waveHeight > 3.0 ? '#f43f5e' : loc.waveHeight > 2.0 ? '#f59e0b' : '#06b6d4';

        const customIcon = L.divIcon({
          className: 'custom-weather-marker',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-lg border-2" 
                   style="background: ${markerColor}; border-color: #ffffff; box-shadow: 0 0 12px ${markerColor}99">
                ${loc.waveHeight.toFixed(1)}m
              </div>
              <div class="absolute -bottom-4 bg-slate-900/90 text-[9px] text-cyan-300 font-semibold px-1.5 py-0.5 rounded shadow whitespace-nowrap border border-slate-700 pointer-events-none">
                ${loc.name.split('(')[0]}
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([loc.lat, loc.lng], { icon: customIcon });
        marker.on('click', () => {
          setActiveFeature({ type: 'weather', data: loc });
          onSelectWeatherLocation(loc);
        });
        layerGroupsRef.current.weather.addLayer(marker);
      });
    }

    // 2. Tidal Stations Markers
    layerGroupsRef.current.tides.clearLayers();
    if (showTides) {
      tidalStations.forEach((stn) => {
        const isRob = stn.robRisk === 'Tinggi' || stn.robRisk === 'Kritis';
        const customIcon = L.divIcon({
          className: 'custom-tide-marker',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-extrabold shadow-lg border-2 ${
                isRob ? 'animate-bounce' : ''
              }" 
                   style="background: #3b82f6; border-color: #93c5fd; box-shadow: 0 0 10px #3b82f6aa">
                🌊
              </div>
              <div class="absolute -bottom-4 bg-slate-900/90 text-[9px] text-blue-300 font-medium px-1.5 py-0.5 rounded shadow whitespace-nowrap border border-slate-700 pointer-events-none">
                ${stn.currentTideHeight.toFixed(2)}m
              </div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([stn.lat, stn.lng], { icon: customIcon });
        marker.on('click', () => {
          setActiveFeature({ type: 'tide', data: stn });
          onSelectTidalStation(stn);
        });
        layerGroupsRef.current.tides.addLayer(marker);
      });
    }

    // 3. Coral Reef Sites Markers
    layerGroupsRef.current.corals.clearLayers();
    if (showCorals) {
      coralSites.forEach((site) => {
        const isBleaching = site.bleachingAlert !== 'No Stress';
        const color = site.liveCoralCoverPct >= 70 ? '#10b981' : site.liveCoralCoverPct >= 50 ? '#14b8a6' : '#f59e0b';

        const customIcon = L.divIcon({
          className: 'custom-coral-marker',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg border-2 ${
                isBleaching ? 'ring-2 ring-rose-500' : ''
              }" 
                   style="background: ${color}; border-color: #ffffff; box-shadow: 0 0 14px ${color}bb">
                🪸
              </div>
              <div class="absolute -bottom-4 bg-slate-900/90 text-[9px] text-emerald-300 font-medium px-1.5 py-0.5 rounded shadow whitespace-nowrap border border-slate-700 pointer-events-none">
                ${site.liveCoralCoverPct}%
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([site.lat, site.lng], { icon: customIcon });
        marker.on('click', () => {
          setActiveFeature({ type: 'coral', data: site });
          onSelectCoralSite(site);
        });
        layerGroupsRef.current.corals.addLayer(marker);
      });
    }

    // 4. Alerts Danger Zones / Overlays
    layerGroupsRef.current.alerts.clearLayers();
    if (showAlerts) {
      // Danger wave zones in southern Java / Sumatra
      const southJavaWave = L.circle([-8.8, 110.0], {
        radius: 350000,
        color: '#f43f5e',
        fillColor: '#f43f5e',
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: '5, 10'
      });
      southJavaWave.bindTooltip('Zona Peringatan Gelombang Tinggi 2.5 - 4.0m', { permanent: false });
      layerGroupsRef.current.alerts.addLayer(southJavaWave);

      // Jakarta & Semarang Rob Alert Area
      const robZone = L.circle([-6.5, 108.5], {
        radius: 180000,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.18,
        weight: 1.5
      });
      robZone.bindTooltip('Zona Siaga Pasang Maksimum & Potensi Banjir Rob', { permanent: false });
      layerGroupsRef.current.alerts.addLayer(robZone);
    }

    // 5. Custom Uploaded Points
    layerGroupsRef.current.custom.clearLayers();
    if (showCustom && customUploadedData.length > 0) {
      customUploadedData.forEach((row, idx) => {
        if (!row.lat || !row.lng) return;
        const customIcon = L.divIcon({
          className: 'custom-user-marker',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer animate-pulse">
              <div class="w-7 h-7 rounded-md bg-purple-600 text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-xl">
                ★
              </div>
              <div class="absolute -bottom-4 bg-purple-950 text-[9px] text-purple-200 px-1 rounded whitespace-nowrap">
                ${row.lokasi || `Titik ${idx+1}`}
              </div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([row.lat, row.lng], { icon: customIcon });
        marker.on('click', () => {
          setActiveFeature({ type: 'custom', data: row });
          onSelectCustomRow(row);
        });
        layerGroupsRef.current.custom.addLayer(marker);
      });
    }

  }, [
    weatherLocations, 
    tidalStations, 
    coralSites, 
    coastalAlerts, 
    customUploadedData, 
    showWeather, 
    showTides, 
    showCorals, 
    showAlerts, 
    showCustom
  ]);

  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([-2.5, 118.0], 5);
    }
  };

  return (
    <div className="relative w-full h-[650px] lg:h-[750px] rounded-3xl overflow-hidden border border-slate-800 bg-[#020617] shadow-2xl">
      {/* Leaflet Map Target */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Header Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 max-w-[calc(100%-2rem)]">
        <div className="bg-[#0f172a]/90 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <span className="text-xs font-bold text-slate-200">Peta Maritim Nusantara</span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          {/* Basemap Switcher */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-[10px]">
            <button
              onClick={() => setBaseTileLayer('ocean')}
              className={`px-2.5 py-1 rounded-lg transition-all ${baseTileLayer === 'ocean' ? 'bg-cyan-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Ocean
            </button>
            <button
              onClick={() => setBaseTileLayer('dark')}
              className={`px-2.5 py-1 rounded-lg transition-all ${baseTileLayer === 'dark' ? 'bg-cyan-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Gelap
            </button>
            <button
              onClick={() => setBaseTileLayer('satellite')}
              className={`px-2.5 py-1 rounded-lg transition-all ${baseTileLayer === 'satellite' ? 'bg-cyan-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Satelit
            </button>
          </div>
        </div>

        <button
          onClick={resetView}
          className="bg-[#0f172a]/90 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-2 rounded-2xl text-xs font-medium border border-slate-800 shadow-xl flex items-center gap-1.5 transition-colors backdrop-blur-md"
          title="Kembali ke Tampilan Penuh Nusantara"
        >
          <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Reset Zoom</span>
        </button>
      </div>

      {/* Floating Layer Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-10 bg-[#0f172a]/90 backdrop-blur-md border border-slate-800 p-3 rounded-2xl shadow-2xl max-w-xs text-xs">
        <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-800 font-bold text-slate-200">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Layer Data GIS</span>
        </div>
        <div className="space-y-1.5">
          <label className="flex items-center justify-between gap-3 cursor-pointer select-none text-slate-300 hover:text-white">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
              Cuaca & Gelombang
            </span>
            <input
              type="checkbox"
              checked={showWeather}
              onChange={(e) => setShowWeather(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
          </label>

          <label className="flex items-center justify-between gap-3 cursor-pointer select-none text-slate-300 hover:text-white">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-lg bg-blue-500 inline-block"></span>
              Stasiun Pasang Surut
            </span>
            <input
              type="checkbox"
              checked={showTides}
              onChange={(e) => setShowTides(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
          </label>

          <label className="flex items-center justify-between gap-3 cursor-pointer select-none text-slate-300 hover:text-white">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
              Terumbu Karang (Coral)
            </span>
            <input
              type="checkbox"
              checked={showCorals}
              onChange={(e) => setShowCorals(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
          </label>

          <label className="flex items-center justify-between gap-3 cursor-pointer select-none text-slate-300 hover:text-white">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse"></span>
              Zona Bahaya & Peringatan
            </span>
            <input
              type="checkbox"
              checked={showAlerts}
              onChange={(e) => setShowAlerts(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
          </label>

          {customUploadedData.length > 0 && (
            <label className="flex items-center justify-between gap-3 cursor-pointer select-none text-purple-300 hover:text-white pt-1.5 border-t border-slate-800">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-2.5 h-2.5 rounded bg-purple-500 inline-block"></span>
                Data Upload ({customUploadedData.length})
              </span>
              <input
                type="checkbox"
                checked={showCustom}
                onChange={(e) => setShowCustom(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-0"
              />
            </label>
          )}
        </div>
      </div>

      {/* Floating Detailed Inspection Card when a station is clicked */}
      {activeFeature && (
        <div className="absolute bottom-4 left-4 z-20 w-80 sm:w-96 bg-[#0f172a]/95 backdrop-blur-xl border border-slate-700 p-5 rounded-3xl shadow-2xl text-slate-200">
          <div className="flex items-start justify-between gap-2 pb-2.5 mb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
                {activeFeature.type === 'weather' && 'Stasiun Cuaca Maritim'}
                {activeFeature.type === 'tide' && 'Stasiun Pasang Surut'}
                {activeFeature.type === 'coral' && 'Situs Terumbu Karang'}
                {activeFeature.type === 'custom' && 'Data Upload Pengguna'}
              </span>
              <h4 className="text-sm font-bold text-white mt-1.5 leading-snug">
                {activeFeature.data.name || activeFeature.data.lokasi}
              </h4>
              <p className="text-[11px] text-slate-400">
                {activeFeature.data.province || activeFeature.data.seaArea || activeFeature.data.wilayah || 'Koordinat: ' + activeFeature.data.lat + ', ' + activeFeature.data.lng}
              </p>
            </div>
            <button
              onClick={() => setActiveFeature(null)}
              className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 text-xs"
            >
              ✕
            </button>
          </div>

          {/* Body details per type */}
          {activeFeature.type === 'weather' && (() => {
            const loc = activeFeature.data as MaritimeLocation;
            const badge = getWaveBadgeColor(loc.waveCategory);
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#1e293b]/70 p-2.5 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Tinggi Gelombang</span>
                    <span className="text-base font-extrabold text-cyan-300">{loc.waveHeight} m</span>
                    <span className={`block text-[10px] font-semibold mt-0.5 ${badge.text}`}>
                      {loc.waveCategory}
                    </span>
                  </div>
                  <div className="bg-[#1e293b]/70 p-2.5 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Kecepatan Angin</span>
                    <span className="text-base font-extrabold text-amber-300">{loc.windSpeed} knot</span>
                    <span className="block text-[10px] text-slate-300 mt-0.5 truncate">{loc.windDirection}</span>
                  </div>
                  <div className="bg-[#1e293b]/70 p-2.5 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Suhu Muka Laut</span>
                    <span className="text-base font-extrabold text-emerald-300">{loc.seaSurfaceTemp} °C</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Salinitas: {loc.salinity} PSU</span>
                  </div>
                  <div className="bg-[#1e293b]/70 p-2.5 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Keselamatan</span>
                    <span className={`text-xs font-bold ${loc.safetyIndex === 'Aman Melaut' ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {loc.safetyIndex}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Kondisi: {loc.weatherCondition}</span>
                  </div>
                </div>

                <button
                  onClick={() => onTriggerInfographic('weather', loc)}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2.5 rounded-full flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-cyan-400/40 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Buat Infografis Cuaca Lokasi Ini
                </button>
              </div>
            );
          })()}

          {activeFeature.type === 'tide' && (() => {
            const stn = activeFeature.data as TidalStation;
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#1e293b]/70 p-2.5 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Tinggi Pasut</span>
                    <span className="text-base font-extrabold text-blue-400">{stn.currentTideHeight} m</span>
                    <span className="text-[10px] text-cyan-300 block">Tren: {stn.trend === 'rising' ? '▲ Pasang Naik' : stn.trend === 'falling' ? '▼ Pasang Surut' : '— Slack'}</span>
                  </div>
                  <div className="bg-[#1e293b]/70 p-2.5 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Risiko Banjir Rob</span>
                    <span className={`text-xs font-bold ${stn.robRisk === 'Tinggi' || stn.robRisk === 'Kritis' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {stn.robRisk}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{stn.moonPhase}</span>
                  </div>
                </div>

                <div className="bg-[#1e293b]/60 p-2.5 rounded-2xl border border-slate-800 text-[11px]">
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Puncak Pasang Tertinggi:</span>
                    <span className="font-semibold text-white">{stn.highTideHeight}m ({stn.highTideTime})</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Surut Terendah:</span>
                    <span className="font-semibold text-white">{stn.lowTideHeight}m ({stn.lowTideTime})</span>
                  </div>
                </div>

                <button
                  onClick={() => onTriggerInfographic('tide', stn)}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2.5 rounded-full flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-cyan-400/40 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Buat Infografis Pasut & Banjir Rob
                </button>
              </div>
            );
          })()}

          {activeFeature.type === 'coral' && (() => {
            const site = activeFeature.data as CoralReefSite;
            const health = getCoralHealthBadge(site.healthCategory);
            const bleaching = getBleachingBadge(site.bleachingAlert);
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#1e293b]/70 p-2.5 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Tutupan Karang</span>
                    <span className="text-base font-extrabold text-emerald-300">{site.liveCoralCoverPct}%</span>
                    <span className={`block text-[10px] font-semibold mt-0.5 ${health.text}`}>
                      {health.label}
                    </span>
                  </div>
                  <div className="bg-[#1e293b]/70 p-2.5 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Status Pemutihan</span>
                    <span className={`text-xs font-bold ${bleaching.text}`}>
                      {site.bleachingAlert}
                    </span>
                    <span className="text-[10px] text-slate-400 block">DHW: {site.degreeHeatingWeeks} °C-weeks</span>
                  </div>
                </div>

                <div className="bg-[#1e293b]/60 p-2.5 rounded-2xl border border-slate-800 text-[11px] space-y-1">
                  <div className="text-slate-400">
                    <strong className="text-slate-300">Genus Dominan:</strong> {site.dominantGenera.slice(0, 3).join(', ')}
                  </div>
                  <div className="text-slate-400">
                    <strong className="text-slate-300">Konservasi:</strong> {site.conservationStatus}
                  </div>
                </div>

                <button
                  onClick={() => onTriggerInfographic('coral', site)}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2.5 rounded-full flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-cyan-400/40 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Buat Infografis Kesehatan Karang
                </button>
              </div>
            );
          })()}

          {activeFeature.type === 'custom' && (() => {
            const row = activeFeature.data as CustomUploadedRow;
            return (
              <div className="space-y-3 text-xs">
                <div className="bg-[#1e293b]/70 p-3 rounded-2xl border border-slate-800 space-y-1 max-h-40 overflow-y-auto">
                  {Object.entries(row).filter(([k]) => k !== 'id').map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-slate-800/60 py-1 text-[11px]">
                      <span className="text-slate-400 capitalize">{k.replace(/_/g, ' ')}:</span>
                      <span className="text-white font-medium">{String(v)}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => onTriggerInfographic('custom', row)}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2.5 rounded-full flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-cyan-400/40 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Buat Infografis dari Titik Ini
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Map Legend (Bottom Right) */}
      <div className="hidden md:flex absolute bottom-4 right-14 z-10 bg-[#0f172a]/90 backdrop-blur-md border border-slate-800 px-4 py-2.5 rounded-2xl shadow-2xl text-[11px] text-slate-300 items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          <span>Ombak Tenang/Sedang</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Gelombang Tinggi (&gt;2.5m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span>Karang Sehat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
          <span>Stres Karang / Pasut</span>
        </div>
      </div>
    </div>
  );
};
