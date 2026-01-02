import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getUnitColor } from '../../utils/helpers';

export const LeafletMap = ({ data, onSelectCase, onError }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Debug State
  const [showDebug, setShowDebug] = useState(false);
  const [showErrorList, setShowErrorList] = useState(false);
  const [unitStats, setUnitStats] = useState({});
  const [errorRecords, setErrorRecords] = useState([]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      console.log('🏗️ [LeafletMap] Creating map instance...');
      const map = L.map(mapRef.current, {
        preferCanvas: true,
        zoomControl: true,
        attributionControl: true
      }).setView([13.7563, 100.5018], 6);

      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);

      setTimeout(() => map.invalidateSize(), 100);

    } catch (err) {
      console.error('❌ [LeafletMap] Init error:', err);
      if (onError) onError();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Update Overlay Stats & Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    // 2.1 Calculate Stats & Collect Errors
    const stats = {};
    const validPoints = [];
    const errors = [];

    data.forEach(d => {
      // Fix potential 'undefined' or object issues with unit names
      let unitName = d.unit_kk?.toString() || 'Unknown';
      if (unitName.startsWith('nn.')) unitName = unitName.replace('nn.', ''); // Legacy fix

      const u = `กก.${unitName}`;
      if (!stats[u]) stats[u] = { total: 0, valid: 0 };
      stats[u].total++;

      const lat = parseFloat(d.lat);
      const long = parseFloat(d.long);
      const isValid = isFinite(lat) && isFinite(long) && lat !== 0 && long !== 0;

      if (isValid) {
        stats[u].valid++;
        validPoints.push({ ...d, lat, long });
      } else {
        errors.push({
          id: d.id,
          unit: u,
          topic: d.topic,
          date: d.date_capture || 'No Date',
          reason: !d.lat ? 'Missing Lat/Long' : (lat === 0 && long === 0) ? 'Zero Coordinates' : 'Invalid Number'
        });
      }
    });

    setUnitStats(stats);
    setErrorRecords(errors);

    // 2.2 Render Markers (Limit to 5000)
    const MAX_MARKERS = 5000;
    const pointsToRender = validPoints.slice(0, MAX_MARKERS);
    const myRenderer = L.canvas({ padding: 0.5 });

    pointsToRender.forEach(item => {
      try {
        const color = getUnitColor(item.unit_kk);
        const marker = L.circleMarker([item.lat, item.long], {
          renderer: myRenderer,
          radius: 6,
          fillColor: color,
          color: color,
          weight: 1,
          opacity: 0.9,
          fillOpacity: 0.7
        });

        const popupContent = `
          <div style="color: #333; font-family: 'Sarabun', sans-serif; min-width: 150px;">
              <div style="font-weight: bold; margin-bottom: 4px; color: ${color};">${item.topic}</div>
              <div style="font-size: 12px; margin-bottom: 2px;">กก.${item.unit_kk} ส.ทล.${item.unit_s_tl}</div>
              <div style="font-size: 12px; color: #666;">${item.date_capture}</div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => onSelectCase(item));
        markersLayer.addLayer(marker);
      } catch (e) { console.warn('Marker error', e); }
    });

    // 2.3 Fit Bounds (Safe Mode)
    if (pointsToRender.length > 0) {
      try {
        let minLat = Infinity, maxLat = -Infinity, minLong = Infinity, maxLong = -Infinity;
        pointsToRender.forEach(p => {
          if (p.lat < minLat) minLat = p.lat;
          if (p.lat > maxLat) maxLat = p.lat;
          if (p.long < minLong) minLong = p.long;
          if (p.long > maxLong) maxLong = p.long;
        });

        if (minLat !== Infinity && maxLat - minLat < 20 && maxLong - minLong < 20) {
          mapInstanceRef.current.fitBounds([[minLat, minLong], [maxLat, maxLong]], { padding: [50, 50] });
        } else {
          console.warn('⚠️ [LeafletMap] Bounds too large or invalid, defaulting to Thailand view');
          mapInstanceRef.current.setView([13.7563, 100.5018], 6);
        }
      } catch (e) { console.warn('FitBounds error', e); }
    } else {
      mapInstanceRef.current.setView([13.7563, 100.5018], 6);
    }

  }, [data, onSelectCase]);

  // Download Error CSV
  const downloadErrorCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "ID,Unit,Topic,Date,Reason\n"
      + errorRecords.map(e => `${e.id},${e.unit},${e.topic},${e.date},${e.reason}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "map_errors.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} style={{ height: '100%', width: '100%', minHeight: '600px' }} className="bg-slate-800" />

      {/* Inspector Overlay */}
      {showDebug && (
        <div className="absolute top-2 right-2 bg-slate-900/95 text-white p-3 rounded shadow-xl z-[1000] text-xs w-[320px] max-h-[80vh] flex flex-col border border-slate-700 font-mono backdrop-blur-sm">

          <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-yellow-500">Data Inspector</span>
              <span className="bg-slate-800 px-1 rounded text-[10px] text-slate-400">{data.length} records</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowErrorList(!showErrorList)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${showErrorList ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                {showErrorList ? 'Show Stats' : `Errors (${errorRecords.length})`}
              </button>
              <button onClick={() => setShowDebug(false)} className="text-slate-400 hover:text-white px-1">✕</button>
            </div>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0">
            {!showErrorList ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 sticky top-0 bg-slate-900/95">
                    <th className="py-1">Unit</th>
                    <th className="text-right py-1">Total</th>
                    <th className="text-right py-1">Valid</th>
                    <th className="text-right py-1">%</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(unitStats).sort().map(([unit, s]) => (
                    <tr key={unit} className={`border-b border-slate-800 ${s.valid === 0 ? "text-red-400 font-bold" : s.valid < s.total ? "text-orange-300" : "text-green-400"}`}>
                      <td className="pr-3 py-1">{unit}</td>
                      <td className="text-right pr-3 py-1">{s.total}</td>
                      <td className="text-right pr-3 py-1">{s.valid}</td>
                      <td className="text-right py-1">{s.total > 0 ? ((s.valid / s.total) * 100).toFixed(0) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col gap-2">
                {errorRecords.length > 0 ? (
                  <>
                    <div className="space-y-1">
                      {errorRecords.slice(0, 100).map((err, i) => (
                        <div key={i} className="flex justify-between items-start border-b border-slate-800 pb-1 mb-1 last:border-0">
                          <div>
                            <div className="text-red-300 font-bold">{err.unit} <span className="text-slate-500 font-normal">#{err.id}</span></div>
                            <div className="text-slate-400 truncate w-[140px]">{err.topic}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-orange-400">{err.reason}</div>
                            <div className="text-slate-600">{err.date}</div>
                          </div>
                        </div>
                      ))}
                      {errorRecords.length > 100 && <div className="text-center text-slate-500 pt-2">...and {errorRecords.length - 100} more</div>}
                    </div>
                    <button
                      onClick={downloadErrorCSV}
                      className="mt-2 w-full bg-slate-700 hover:bg-slate-600 text-white py-1.5 rounded transition-colors flex justify-center items-center gap-2 sticky bottom-0"
                    >
                      <span>Download CSV</span>
                    </button>
                  </>
                ) : (
                  <div className="text-center text-green-400 py-4">No Errors Found 🎉</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};