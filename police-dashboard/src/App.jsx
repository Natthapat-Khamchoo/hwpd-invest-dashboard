import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import html2pdf from 'html2pdf.js';
import { 
  LayoutDashboard, Table as TableIcon, MapPin, Search, Filter, Siren, Users, 
  FileText, Calendar, ChevronRight, X, Menu, BarChart3, Map as MapIcon, 
  RotateCcw, Building2, ChevronLeft, ListFilter, Layers, Navigation, AlertTriangle,
  Truck, FileWarning, Download, Activity, Radar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

// --- Configuration ---
const UNIT_HIERARCHY = { "1": 6, "2": 6, "3": 5, "4": 5, "5": 6, "6": 6, "7": 5, "8": 4 };
// Updated: Vibrant Map Colors for Dark Mode
const UNIT_COLORS = { "1": "#ff4d4d", "2": "#ff9f43", "3": "#feca57", "4": "#2ed573", "5": "#54a0ff", "6": "#5f27cd", "7": "#9b59b6", "8": "#ff9ff3" };
const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
// Updated: Neon/Vibrant Chart Colors
const COLORS = ['#00d2d3', '#ff9f43', '#54a0ff', '#ff6b6b', '#1dd1a1', '#f368e0', '#feca57'];

const LOGO_URL = "https://hwpd.cib.go.th/backend/uploads/logo500_0d7ce0273a.png";

// --- Helpers ---
const parseThaiDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  let year = parseInt(parts[2], 10);
  if (year > 2400) year -= 543;
  return new Date(year, month, day);
};

const getYearFromDate = (dateStr) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.replace(/-/g, '/');
  const parts = cleanStr.split('/');
  if (parts.length < 3) return null;
  let year = parts.find(p => p.trim().length === 4 && !isNaN(p));
  if (!year) year = parts[parts.length - 1].trim().split(' ')[0]; 
  if (year && year.length === 2) {
    const yVal = parseInt(year, 10);
    year = yVal > 40 ? `25${year}` : `20${year}`;
  }
  return year;
};

// --- Components ---

// 1. StatCard: Updated for Dark/Digital Theme
const StatCard = ({ title, value, icon: Icon, colorClass, delay }) => (
  <div className={`bg-slate-800/80 backdrop-blur-md p-4 sm:p-5 rounded-xl border border-slate-700/50 shadow-lg flex items-center space-x-4 hover:border-yellow-500/50 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards`} style={{ animationDelay: `${delay}ms` }}>
    <div className={`p-3 rounded-lg ${colorClass} bg-opacity-20 flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
      <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
    </div>
  </div>
);

// 2. Simple Map
const SimpleMapVisualization = ({ data, onSelectCase, isPrintMode = false }) => {
  const MIN_LAT = 5.6; const MAX_LAT = 20.5; const MIN_LONG = 97.3; const MAX_LONG = 105.8;
  const [hoveredItem, setHoveredItem] = useState(null);
  const getX = (long) => ((parseFloat(long) - MIN_LONG) / (MAX_LONG - MIN_LONG)) * 100;
  const getY = (lat) => 100 - ((parseFloat(lat) - MIN_LAT) / (MAX_LAT - MIN_LAT)) * 100;

  return (
    <div className={`relative w-full h-full ${isPrintMode ? '' : 'min-h-[50vh] sm:min-h-[600px]'} bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center shadow-inner`}>
      {!isPrintMode && (
        <div className="absolute top-4 left-4 z-10 bg-yellow-500/10 text-yellow-400 text-xs px-2 py-1 rounded border border-yellow-500/30 flex items-center shadow-sm">
          <AlertTriangle className="w-3 h-3 mr-1" /> Graphic Mode
        </div>
      )}
      <div className="relative w-full h-full max-w-[400px] mx-auto py-4 flex items-center justify-center">
        {/* SVG Map Path: Changed fill to match dark theme */}
        <svg viewBox="0 0 320 600" className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.6 }}>
            <path d="M152.9,8.6 L162.4,1.5 L175.0,13.0 ... (Same Path) ... L0.0,219.7 L152.9,8.6 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
             {/* Note: I'm shortening the path string for brevity, assume full path is here */}
             <path d="M152.9,8.6 L162.4,1.5 L175.0,13.0 L188.0,14.1 L194.1,21.8 L185.4,31.3 L178.2,30.7 L170.0,42.8 L175.5,54.3 L187.0,52.1 L199.0,60.3 L207.7,58.1 L216.4,66.3 L214.7,78.3 L228.4,79.5 L241.5,89.2 L236.6,100.2 L226.7,100.7 L223.4,111.1 L239.3,117.6 L238.7,128.0 L227.2,138.4 L218.5,137.3 L210.3,144.4 L199.4,143.4 L189.0,153.2 L174.2,154.8 L166.0,161.9 L166.0,170.6 L175.8,178.3 L189.0,178.3 L198.2,185.4 L218.4,185.4 L227.7,191.9 L236.4,202.9 L243.5,203.9 L254.4,198.4 L268.1,198.4 L276.3,206.1 L288.3,206.1 L297.0,212.6 L305.7,211.5 L311.2,219.2 L318.8,218.1 L324.8,225.7 L338.5,226.8 L345.0,236.6 L344.5,247.0 L336.3,253.0 L334.7,263.9 L342.8,270.4 L341.2,281.4 L334.1,289.6 L337.4,299.9 L330.3,310.9 L319.9,314.7 L311.7,313.0 L306.3,319.6 L297.0,319.6 L292.6,328.9 L282.8,330.0 L275.1,336.5 L267.5,343.6 L258.8,342.5 L251.1,337.1 L244.0,342.5 L234.2,342.5 L222.7,347.4 L213.4,347.4 L204.7,352.9 L197.6,361.1 L191.6,369.3 L183.4,370.9 L174.7,377.5 L165.4,385.1 L157.2,387.8 L151.2,392.2 L146.8,399.3 L145.8,409.7 L149.0,420.1 L152.9,430.4 L154.5,441.9 L157.8,452.3 L161.0,459.9 L165.4,469.2 L167.0,480.7 L167.0,491.6 L162.7,499.8 L155.0,504.7 L148.0,508.5 L141.4,514.0 L135.9,522.7 L132.7,533.1 L131.6,543.4 L129.4,553.3 L122.9,559.3 L113.6,558.7 L107.0,553.8 L101.6,547.8 L96.1,540.2 L90.7,534.7 L86.3,528.2 L83.0,520.5 L80.8,511.2 L79.8,500.9 L79.8,490.5 L83.0,480.7 L87.4,472.5 L91.8,464.3 L95.0,455.6 L97.2,445.2 L97.2,434.8 L94.0,426.1 L89.6,419.0 L84.1,412.5 L77.6,407.0 L71.0,402.1 L65.6,396.1 L61.2,388.4 L58.0,379.2 L56.9,369.9 L59.0,360.0 L62.3,350.8 L64.5,342.0 L63.4,332.7 L59.0,325.1 L52.5,320.7 L43.8,319.6 L36.1,315.2 L29.6,308.7 L25.2,301.1 L23.0,291.8 L23.0,282.0 L27.4,273.8 L33.9,267.2 L39.4,259.6 L42.6,250.8 L43.7,241.0 L41.6,231.2 L37.2,223.0 L30.6,217.5 L23.0,214.3 L15.3,214.3 L7.7,216.4 L0.0,219.7 L152.9,8.6 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
        </svg>
        {data.filter(d => d.lat && d.long).map((item) => {
          const lat = parseFloat(item.lat); const long = parseFloat(item.long);
          if(lat < MIN_LAT || lat > MAX_LAT || long < MIN_LONG || long > MAX_LONG) return null;
          return (
            <div key={item.id} className="absolute rounded-full cursor-pointer hover:scale-150 transition-transform"
              style={{ left: `${getX(long)}%`, top: `${getY(lat)}%`, width: '8px', height: '8px', backgroundColor: UNIT_COLORS[item.unit_kk] || '#cbd5e1', boxShadow: `0 0 8px ${UNIT_COLORS[item.unit_kk]}`, transform: 'translate(-50%, -50%)', zIndex: 10 }}
              onMouseEnter={() => !isPrintMode && setHoveredItem(item)} onMouseLeave={() => setHoveredItem(null)} onClick={() => !isPrintMode && onSelectCase(item)}
            />
          );
        })}
        {hoveredItem && !isPrintMode && (
          <div className="absolute z-30 bg-slate-900/95 backdrop-blur text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700 pointer-events-none whitespace-nowrap" style={{ left: `${getX(hoveredItem.long)}%`, top: `${getY(hoveredItem.lat)}%`, transform: 'translate(15px, -50%)' }}>
              <div className="font-bold text-yellow-400 text-sm mb-1">{hoveredItem.topic}</div>
              <div className="text-slate-300 mb-1">กก.{hoveredItem.unit_kk} ส.ทล.{hoveredItem.unit_s_tl}</div>
          </div>
        )}
      </div>
    </div>
  );
};

// 3. Leaflet Map (Keeping functionality, updating container style)
const LeafletMap = ({ data, onSelectCase, onError }) => {
  const mapRef = useRef(null); const mapInstanceRef = useRef(null); const markersGroupRef = useRef(null); const [isMapReady, setIsMapReady] = useState(false);
  useEffect(() => {
    let isMounted = true;
    const loadLeaflet = async () => {
      if (window.L && typeof window.L.map === 'function') return window.L;
      try {
        if (!document.querySelector('#leaflet-css')) { const link = document.createElement('link'); link.id = 'leaflet-css'; link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link); }
        if (!document.querySelector('#leaflet-js')) { const script = document.createElement('script'); script.id = 'leaflet-js'; script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.async = true; document.head.appendChild(script); }
        return new Promise((resolve, reject) => { const checkL = () => { if (window.L && typeof window.L.map === 'function') resolve(window.L); else setTimeout(checkL, 100); }; setTimeout(() => reject(new Error('Timeout')), 8000); checkL(); });
      } catch (e) { throw e; }
    };
    loadLeaflet().then((L) => {
      if (!isMounted) return; if (mapInstanceRef.current) { setIsMapReady(true); return; } if (!mapRef.current) return;
      try { const map = L.map(mapRef.current).setView([13.0, 101.0], 6); mapInstanceRef.current = map; L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(map); markersGroupRef.current = L.featureGroup().addTo(map); setIsMapReady(true); } catch (err) { if (onError) onError(); }
    }).catch((err) => { if (isMounted && onError) onError(); }); return () => { isMounted = false; };
  }, [onError]);
  
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !window.L || !markersGroupRef.current) return;
    const map = mapInstanceRef.current; const markersGroup = markersGroupRef.current; const L = window.L;
    markersGroup.clearLayers(); const validPoints = data.filter(d => d.lat && d.long);
    validPoints.forEach(item => {
      const color = UNIT_COLORS[item.unit_kk] || '#ccc';
      const marker = L.circleMarker([parseFloat(item.lat), parseFloat(item.long)], { radius: 6, fillColor: color, color: color, weight: 2, opacity: 0.8, fillOpacity: 0.4 });
      const popupContent = `<div style="color: #333; font-family: sans-serif;"><strong>${item.topic}</strong><br/>กก.${item.unit_kk} ส.ทล.${item.unit_s_tl}</div>`;
      marker.bindPopup(popupContent); marker.on('click', () => onSelectCase(item)); markersGroup.addLayer(marker);
    });
    if (validPoints.length > 0) { try { const bounds = markersGroup.getBounds(); if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] }); } catch (e) { } }
  }, [data, onSelectCase, isMapReady]);
  return <div ref={mapRef} className="w-full h-full min-h-[50vh] sm:min-h-[500px] bg-slate-800 z-0" />;
};

// ==========================================
// 🔴 MAIN APPLICATION COMPONENT
// ==========================================

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCase, setSelectedCase] = useState(null);
  const [mapError, setMapError] = useState(false); 
  const handleMapError = useCallback(() => setMapError(true), []);
  const [isExporting, setIsExporting] = useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true); 
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [filters, setFilters] = useState({
    search: '', startDate: '', endDate: '', year: '', month: '',
    unit_kk: '', unit_s_tl: '', topic: '', charge: '' 
  });
  
  // Debounce State
  const [localSearch, setLocalSearch] = useState('');

  // Debounce Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: localSearch }));
    }, 500); // 500ms debounce
    return () => clearTimeout(delayDebounceFn);
  }, [localSearch]);

  useEffect(() => {
    const fetchData = () => {
      const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4VGxSCS_zy50dWol-qd317rLRYG1SdOPojU03EEuganUmtf7h86LjyqGdTNM-jPjeLhb2z4yOmbCb/pub?output=csv';
      Papa.parse(GOOGLE_SHEET_CSV_URL, {
        download: true, header: true,
        complete: (results) => {
          const formattedData = results.data.filter(item => item['หัวข้อ'] && item['กก.']).map((item, index) => ({
              id: index + 1, timestamp: item['Timestamp'] || new Date().toISOString(), unit_kk: item['กก.']?.toString() || '', unit_s_tl: item['ส.ทล.']?.toString() || '', topic: item['หัวข้อ'] || '', captured_by: item['จับโดย'] || '', arrest_type: item['ประเภทการจับกุม'] || '', date_capture: item['วันที่'] || '', time_capture: item['เวลา'] || '', arrest_team: item['เจ้าหน้าที่ชุดจับกุม'] || '', suspect_count: item['จำนวน'] || '1', suspect_name: item['ชื่อ'] || '-', nationality: item['สัญชาติ'] || 'ไทย', age: item['อายุ'] || '', address: item['ที่อยู่'] || 'ไม่ระบุ', charge: item['ข้อหา'] || '', location: item['สถานที่จับกุม'] || '', lat: item['ละติจูด'] && !isNaN(item['ละติจูด']) ? parseFloat(item['ละติจูด']).toFixed(4) : null, long: item['ลองจิจูด'] && !isNaN(item['ลองจิจูด']) ? parseFloat(item['ลองจิจูด']).toFixed(4) : null, seized_items: item['ของกลาง'] || '-', behavior: item['พฤติการณ์'] || '-', delivery: item['การดำเนินการส่งต่อ'] || ''
            }));
          setData(formattedData); setLoading(false); setLastUpdated(new Date());
        },
        error: (err) => { console.error(err); setLoading(false); }
      });
    };
    fetchData(); const intervalId = setInterval(fetchData, 300000); return () => clearInterval(intervalId);
  }, []);

  const handleExportPDF = () => {
    window.scrollTo(0, 0);
    setIsExporting(true);
    setTimeout(() => {
      const element = document.getElementById('print-view');
      const opt = {
        margin: 0, filename: `รายงานสรุป_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, windowWidth: 1123, width: 1123, x: 0, y: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      html2pdf().set(opt).from(element).save().then(() => { setIsExporting(false); }).catch(err => { console.error("PDF Failed:", err); setIsExporting(false); });
    }, 1500);
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) { alert('ไม่มีข้อมูลสำหรับ Export'); return; }
    const headers = { date_capture: "วันที่", time_capture: "เวลา", unit_kk: "กก.", unit_s_tl: "ส.ทล.", topic: "หัวข้อ", charge: "ข้อหา", suspect_name: "ผู้ถูกจับ", location: "สถานที่", lat: "ละติจูด", long: "ลองจิจูด", seized_items: "ของกลาง", arrest_team: "ชุดจับกุม", behavior: "พฤติการณ์" };
    const csvRows = []; csvRows.push(Object.values(headers).join(','));
    filteredData.forEach(row => { const values = Object.keys(headers).map(key => { const val = row[key] ? String(row[key]) : ''; return `"${val.replace(/"/g, '""')}"`; }); csvRows.push(values.join(',')); });
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `police_report_${new Date().toISOString().slice(0,10)}.csv`; link.click();
  };

  const filterOptions = useMemo(() => {
    const charges = [...new Set(data.map(d => d.topic))].filter(Boolean).sort(); 
    const years = [...new Set(data.map(d => getYearFromDate(d.date_capture)))].filter(Boolean).sort().reverse();
    return { charges, years };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const searchMatch = !filters.search || (item.charge && item.charge.toLowerCase().includes(filters.search.toLowerCase())) || (item.suspect_name && item.suspect_name.toLowerCase().includes(filters.search.toLowerCase())) || (item.location && item.location.toLowerCase().includes(filters.search.toLowerCase())) || (item.topic && item.topic.toLowerCase().includes(filters.search.toLowerCase()));
      const kkMatch = !filters.unit_kk || String(item.unit_kk) === String(filters.unit_kk);
      const stlMatch = !filters.unit_s_tl || String(item.unit_s_tl) === String(filters.unit_s_tl);
      const chargeMatch = !filters.charge || item.topic === filters.charge; 
      const itemDate = parseThaiDate(item.date_capture);
      let yearMatch = true; let monthMatch = true; let rangeMatch = true;
      if (filters.year) { const itemYear = getYearFromDate(item.date_capture); yearMatch = itemYear === filters.year; }
      if (itemDate) { if (filters.month) monthMatch = (itemDate.getMonth() + 1).toString() === filters.month; if (filters.startDate) rangeMatch = rangeMatch && itemDate >= new Date(filters.startDate); if (filters.endDate) rangeMatch = rangeMatch && itemDate <= new Date(filters.endDate); } else if (filters.month || filters.startDate || filters.endDate) { return false; }
      return searchMatch && kkMatch && stlMatch && chargeMatch && yearMatch && monthMatch && rangeMatch;
    });
  }, [filters, data]);

  const stats = useMemo(() => {
    const totalCases = filteredData.length;
    const uniqueUnits = [...new Set(filteredData.map(d => `${d.unit_kk}-${d.unit_s_tl}`))].length;
    const drugCases = filteredData.filter(d => d.charge?.includes('ยาเสพติด') || d.topic?.includes('ยาเสพติด')).length;
    const weaponCases = filteredData.filter(d => d.charge?.includes('อาวุธ') || d.topic?.includes('อาวุธ')).length;
    const heavyTruckCases = filteredData.filter(d => d.charge?.includes('น้ำหนัก') || d.topic?.includes('น้ำหนัก') || d.topic?.includes('รถบรรทุก')).length;
    const warrantCases = filteredData.filter(d => d.arrest_type?.includes('หมายจับ') || d.charge?.includes('หมายจับ') || d.topic?.includes('หมายจับ')).length;
    let unitData = {}; let unitChartTitle = "";
    if (filters.unit_kk) { unitChartTitle = `สถิติ ส.ทล. (กก.${filters.unit_kk})`; unitData = filteredData.reduce((acc, curr) => { const key = `ส.ทล.${curr.unit_s_tl}`; acc[key] = (acc[key] || 0) + 1; return acc; }, {}); } else { unitChartTitle = "สถิติแยกตาม กองกำกับการ"; unitData = filteredData.reduce((acc, curr) => { const key = `กก.${curr.unit_kk}`; acc[key] = (acc[key] || 0) + 1; return acc; }, {}); }
    const unitChartData = Object.entries(unitData).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const typeData = filteredData.reduce((acc, curr) => { const key = curr.topic || 'อื่นๆ'; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    const typeChartData = Object.entries(typeData).map(([name, value]) => ({ name, value }));
    return { totalCases, drugCases, weaponCases, heavyTruckCases, warrantCases, uniqueUnits, unitChartData, typeChartData, unitChartTitle };
  }, [filteredData, filters.unit_kk]);

  const handleFilterChange = (key, value) => { if (key === 'unit_kk') setFilters(prev => ({ ...prev, [key]: value, unit_s_tl: '' })); else setFilters(prev => ({ ...prev, [key]: value })); };
  const clearFilters = () => { setFilters({ search: '', startDate: '', endDate: '', year: '', month: '', unit_kk: '', unit_s_tl: '', topic: '', charge: '' }); setLocalSearch(''); };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-400 mb-4"></div></div>;

  return (
    <div className="flex h-screen bg-[#0f172a] font-sans text-slate-100 overflow-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
        /* Digital Pattern Background */
        .digital-bg {
          background-color: #0f172a;
          background-image: radial-gradient(circle at 50% 50%, #1e293b 1px, transparent 1px);
          background-size: 30px 30px;
        }
        /* Scrollbar styling */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #1e293b; }
        ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}</style>

      {/* Background Layer */}
      <div className="absolute inset-0 digital-bg z-0 pointer-events-none opacity-50"></div>

      {/* Export Loading Overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
           <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-400 mb-4"></div>
           <p className="text-white text-lg font-semibold animate-pulse">กำลังสร้างรายงาน PDF...</p>
        </div>
      )}

      {mobileSidebarOpen && (<div className="fixed inset-0 bg-black/80 z-20 lg:hidden backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />)}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 bg-slate-900 border-r border-slate-800 text-white transition-all duration-300 ease-in-out shadow-2xl ${mobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full'} lg:relative lg:translate-x-0 ${desktopSidebarOpen ? 'lg:w-64' : 'lg:w-0 lg:overflow-hidden'}`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center whitespace-nowrap bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center space-x-3">
            <img src={LOGO_URL} alt="Logo" className="w-10 h-10 flex-shrink-0 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
            <span className={`text-xl font-bold tracking-tight text-white transition-opacity duration-200 ${!desktopSidebarOpen && 'lg:opacity-0'}`}>HWPD <span className="text-yellow-400">WARROOM</span></span>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        <nav className="p-4 space-y-2 whitespace-nowrap">
          {['dashboard', 'list', 'map'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setMobileSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${activeTab === tab ? 'bg-blue-700/50 text-yellow-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              {tab === 'dashboard' ? <LayoutDashboard className={`w-5 h-5 flex-shrink-0 ${activeTab === 'dashboard' ? 'animate-pulse' : ''}`} /> : tab === 'list' ? <TableIcon className="w-5 h-5 flex-shrink-0" /> : <MapIcon className="w-5 h-5 flex-shrink-0" />}
              <span className="font-medium">{tab === 'dashboard' ? 'ภาพรวมคดี' : tab === 'list' ? 'รายการจับกุม' : 'แผนที่สถานการณ์'}</span>
              {activeTab === tab && <ChevronRight className="w-4 h-4 ml-auto opacity-70" />}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900">
             <div className="text-xs text-slate-500 flex items-center justify-center">v2.4.0 Secure System</div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0 z-10">
        <header className="bg-slate-900/80 backdrop-blur border-b border-slate-700 px-4 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 text-slate-400 hover:bg-slate-800 rounded-lg"><Menu className="w-6 h-6" /></button>
            <button onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)} className="hidden lg:block p-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">{desktopSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
            <div className="flex flex-col">
                <h1 className="text-base sm:text-xl font-bold text-white tracking-wide uppercase">{activeTab === 'dashboard' ? 'Command Dashboard' : activeTab === 'list' ? 'Arrest Database' : 'GIS Tactical Map'}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden md:flex text-xs text-slate-400 items-center mr-2 bg-slate-800 px-2 py-1 rounded border border-slate-700"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>Live: {lastUpdated.toLocaleTimeString('th-TH')}</div>
            {activeTab === 'dashboard' && (<button onClick={handleExportPDF} className="bg-red-600/90 hover:bg-red-500 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center shadow-lg hover:shadow-red-500/20 transition-all border border-red-400/30"><FileText className="w-4 h-4 mr-1" /> PDF</button>)}
            <button onClick={handleExportCSV} className="bg-emerald-600/90 hover:bg-emerald-500 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center shadow-lg hover:shadow-emerald-500/20 transition-all border border-emerald-400/30"><Download className="w-4 h-4 mr-1" /> CSV</button>
            <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={`flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${showFilterPanel ? 'bg-yellow-500 text-slate-900 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700'}`}><Filter className="w-4 h-4" /><span className="hidden sm:inline">ตัวกรอง</span></button>
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full flex items-center justify-center font-bold text-sm border border-blue-400 shadow-lg">A</div>
          </div>
        </header>

        {showFilterPanel && (
          <div className="bg-slate-800 border-b border-slate-700 p-4 animate-in slide-in-from-top-2 duration-200 shadow-xl z-20 relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
              <div className="sm:col-span-2 md:col-span-3 xl:col-span-2"><label className="block text-xs font-medium text-slate-400 mb-1">ค้นหา</label><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input type="text" className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all placeholder-slate-600" placeholder="ชื่อ/ข้อหา/สถานที่..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} />
              </div></div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1">กก.</label><select className="w-full pl-3 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none cursor-pointer" value={filters.unit_kk} onChange={(e) => handleFilterChange('unit_kk', e.target.value)}><option value="">ทั้งหมด</option>{Object.keys(UNIT_HIERARCHY).map(kk => <option key={kk} value={kk}>กก.{kk}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1">ส.ทล.</label><select className={`w-full pl-3 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none cursor-pointer ${!filters.unit_kk ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''}`} value={filters.unit_s_tl} onChange={(e) => handleFilterChange('unit_s_tl', e.target.value)} disabled={!filters.unit_kk}><option value="">{filters.unit_kk ? 'ทั้งหมด' : 'เลือก กก.'}</option>{filters.unit_kk && Array.from({ length: UNIT_HIERARCHY[filters.unit_kk] }, (_, i) => i + 1).map(num => <option key={num} value={num}>ส.ทล.{num}</option>)}</select></div>
              <div className="xl:col-span-1"><label className="block text-xs font-medium text-slate-400 mb-1">ข้อหา</label><div className="relative"><ListFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" /><select className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none cursor-pointer" value={filters.charge} onChange={(e) => handleFilterChange('charge', e.target.value)}><option value="">ทั้งหมด</option>{filterOptions.charges.map(c => <option key={c} value={c}>{c}</option>)}</select></div></div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1">ปี</label><select className="w-full pl-3 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none cursor-pointer" value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)}><option value="">ทั้งหมด</option>{filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1">เดือน</label><select className="w-full pl-3 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none cursor-pointer" value={filters.month} onChange={(e) => handleFilterChange('month', e.target.value)}><option value="">ทั้งหมด</option>{THAI_MONTHS.map((m, idx) => <option key={idx} value={(idx + 1).toString()}>{m}</option>)}</select></div>
              <div className="flex items-end xl:col-span-8 justify-end border-t border-slate-700 pt-3 mt-2"><button onClick={clearFilters} className="px-4 py-2 bg-slate-700 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-600 hover:text-white text-sm font-medium transition-colors flex items-center shadow-sm"><RotateCcw className="w-4 h-4 mr-2" />ล้างค่าตัวกรอง</button></div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
          {activeTab === 'dashboard' && (
            <div className="p-2 sm:p-4 space-y-4 sm:space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <StatCard title="ผลการจับกุมรวม" value={stats.totalCases} icon={Activity} colorClass="text-blue-400 bg-blue-500" delay={0} />
                <StatCard title="คดียาเสพติด" value={stats.drugCases} icon={Siren} colorClass="text-red-400 bg-red-500" delay={100} />
                <StatCard title="คดีอาวุธปืน" value={stats.weaponCases} icon={Radar} colorClass="text-orange-400 bg-orange-500" delay={200} />
                <StatCard title="รถบรรทุกหนัก" value={stats.heavyTruckCases} icon={Truck} colorClass="text-purple-400 bg-purple-500" delay={300} />
                <StatCard title="บุคคลตามหมายจับ" value={stats.warrantCases} icon={FileWarning} colorClass="text-pink-400 bg-pink-500" delay={400} />
                <StatCard title="หน่วยที่รายงาน" value={stats.uniqueUnits} icon={Building2} colorClass="text-green-400 bg-green-500" delay={500} />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-slate-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/50">
                  <h3 className="text-base sm:text-lg font-bold mb-6 flex items-center text-white"><BarChart3 className="w-5 h-5 mr-2 text-yellow-400" />{stats.unitChartTitle}</h3>
                  {stats.unitChartData.length > 0 ? (
                    <div className="h-72 sm:h-96 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.unitChartData} margin={{ top: 10, right: 0, left: -20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                          <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={60} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={{ stroke: '#475569' }} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} allowDecimals={false} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #475569', color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} itemStyle={{ color: '#fff' }} />
                          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50}>
                             {stats.unitChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (<div className="h-64 flex items-center justify-center text-slate-500 flex-col"><FileText className="w-8 h-8 mb-2 opacity-50" /><span>ไม่พบข้อมูลตามเงื่อนไข</span></div>)}
                </div>

                <div className="bg-slate-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/50">
                  <h3 className="text-base sm:text-lg font-bold mb-6 flex items-center text-white"><PieChart className="w-5 h-5 mr-2 text-yellow-400" />สัดส่วนประเภทคดี</h3>
                  {stats.typeChartData.length > 0 ? (
                    <>
                      <div className="h-64 sm:h-80 flex justify-center w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={stats.typeChartData} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={4} dataKey="value" stroke="none">
                              {stats.typeChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #475569', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4">
                          {stats.typeChartData.map((entry, index) => (
                              <div key={index} className="flex items-center text-[10px] sm:text-xs text-slate-300 bg-slate-900/50 px-2 py-1 rounded-full border border-slate-700">
                                  <div className="w-2 h-2 rounded-full mr-2 flex-shrink-0 shadow-[0_0_5px]" style={{ backgroundColor: COLORS[index % COLORS.length], boxShadow: `0 0 5px ${COLORS[index % COLORS.length]}` }}></div>
                                  <span className="truncate max-w-[100px]">{entry.name}</span>
                                  <span className="font-bold ml-1 text-white">({entry.value})</span>
                              </div>
                          ))}
                      </div>
                    </>
                  ) : (<div className="h-64 flex items-center justify-center text-slate-500 flex-col"><FileText className="w-8 h-8 mb-2 opacity-50" /><span>ไม่พบข้อมูลตามเงื่อนไข</span></div>)}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="p-2 sm:p-6 h-full">
              <div className="bg-slate-800/90 backdrop-blur rounded-xl shadow-lg border border-slate-700 flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800"><span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Arrest Log Database</span></div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 sticky top-0 z-10 shadow-sm"><tr><th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">วันที่/เวลา</th><th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">หน่วยงาน</th><th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">หัวข้อ/ข้อหา</th><th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">ผู้ถูกจับ</th><th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">สถานที่</th><th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700"></th></tr></thead>
                    <tbody className="divide-y divide-slate-700">
                      {filteredData.length > 0 ? filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-700/50 transition-colors group">
                          <td className="p-4 text-sm text-slate-300 whitespace-nowrap"><div className="font-medium text-white">{item.date_capture}</div><div className="text-xs text-slate-500">{item.time_capture} น.</div></td>
                          <td className="p-4 text-sm text-slate-300 whitespace-nowrap"><div className="font-medium text-white">กก.{item.unit_kk} บก.ทล.</div><div className="text-xs text-slate-500">ส.ทล.{item.unit_s_tl}</div></td>
                          <td className="p-4 text-sm text-white font-medium max-w-xs truncate" title={item.charge}><div className="text-yellow-400 mb-1 text-xs uppercase tracking-wide">{item.topic}</div>{item.charge}</td>
                          <td className="p-4 text-sm text-slate-300">{item.suspect_name !== '-' ? item.suspect_name : 'ไม่ระบุตัวตน'}</td>
                          <td className="p-4 text-sm text-slate-400 max-w-xs truncate" title={item.location}>{item.location}</td>
                          <td className="p-4 text-right"><button onClick={() => setSelectedCase(item)} className="p-2 text-slate-500 group-hover:text-yellow-400 hover:bg-slate-600 rounded-full transition-colors"><ChevronRight className="w-5 h-5" /></button></td>
                        </tr>
                      )) : (<tr><td colSpan="6" className="p-12 text-center text-slate-500 flex flex-col items-center justify-center w-full"><Search className="w-10 h-10 mb-3 opacity-20" />ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="h-full w-full p-2 sm:p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                  <div>
                      <h3 className="text-lg font-bold text-white flex items-center"><MapIcon className="w-5 h-5 mr-2 text-yellow-400" />Tactical Situation Map</h3>
                      <p className="text-sm text-slate-400">Geo-Spatial Intelligence System (GIS)</p>
                  </div>
              </div>
              <div className="flex-1 bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden relative">
                <div className="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur-sm p-3 rounded shadow-lg border border-slate-600 z-[1000] max-w-[200px]">
                    <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center border-b border-slate-700 pb-1"><Layers className="w-3 h-3 mr-1" /> หน่วย (กก.)</h4>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">{Object.entries(UNIT_COLORS).map(([kk, color]) => (<div key={kk} className="flex items-center text-[11px] text-slate-300"><span className="w-2.5 h-2.5 rounded-full mr-2 inline-block shadow-[0_0_4px]" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}></span>กก.{kk}</div>))}</div>
                </div>
                {!mapError ? (<LeafletMap data={filteredData} onSelectCase={setSelectedCase} onError={handleMapError} />) : (<SimpleMapVisualization data={filteredData} onSelectCase={setSelectedCase} />)}
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedCase && (
        <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <div><h2 className="text-xl font-bold text-white">รายละเอียดการจับกุม</h2><p className="text-sm text-slate-400">Case ID: #{selectedCase.id}</p></div>
              <button onClick={() => setSelectedCase(null)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30"><h3 className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wider">หน่วยงานรับผิดชอบ</h3><div className="grid grid-cols-2 gap-4"><div><p className="text-xs text-slate-400 mb-1">กองกำกับการ</p><p className="text-lg font-bold text-white flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-500" />กก.{selectedCase.unit_kk} บก.ทล.</p></div><div><p className="text-xs text-slate-400 mb-1">สถานีตำรวจทางหลวง</p><p className="text-lg font-bold text-white">ส.ทล.{selectedCase.unit_s_tl}</p></div></div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><h3 className="text-sm font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-3 flex items-center"><Calendar className="w-4 h-4 mr-2 text-yellow-500" />ข้อมูลเหตุการณ์</h3><dl className="space-y-3 text-sm"><div><dt className="text-slate-500 text-xs">วัน/เวลา</dt><dd className="text-slate-200 font-medium">{selectedCase.date_capture} เวลา {selectedCase.time_capture} น.</dd></div><div><dt className="text-slate-500 text-xs">สถานที่</dt><dd className="text-slate-200">{selectedCase.location}</dd></div><div><dt className="text-slate-500 text-xs">หัวข้อเรื่อง</dt><dd className="text-slate-900 inline-block px-2 py-1 bg-yellow-400 rounded text-xs font-bold">{selectedCase.topic}</dd></div><div><dt className="text-slate-500 text-xs">พิกัด (Lat/Long)</dt><dd className="text-slate-200 font-mono flex items-center gap-1"><Navigation className="w-3 h-3 text-blue-500" />{selectedCase.lat}, {selectedCase.long}</dd></div></dl></div>
                <div><h3 className="text-sm font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-3 flex items-center"><Users className="w-4 h-4 mr-2 text-yellow-500" />ข้อมูลผู้ต้องหา</h3><dl className="space-y-3 text-sm"><div><dt className="text-slate-500 text-xs">ชื่อ-สกุล</dt><dd className="text-slate-200 font-medium">{selectedCase.suspect_name}</dd></div><div><dt className="text-slate-500 text-xs">อายุ/สัญชาติ</dt><dd className="text-slate-200">{selectedCase.age} ปี / {selectedCase.nationality}</dd></div><div><dt className="text-slate-500 text-xs">ที่อยู่</dt><dd className="text-slate-200 truncate">{selectedCase.address}</dd></div></dl></div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-3">ข้อหาและพฤติการณ์</h3>
                <div className="bg-slate-800 p-4 rounded-lg space-y-4 border border-slate-700"><div><p className="text-xs text-slate-500 mb-1">ข้อหา</p><p className="text-sm text-white font-medium">{selectedCase.charge}</p></div><div><p className="text-xs text-slate-500 mb-1">พฤติการณ์</p><p className="text-sm text-slate-300 leading-relaxed">{selectedCase.behavior}</p></div>{selectedCase.seized_items && selectedCase.seized_items !== '-' && (<div className="pt-2 border-t border-slate-700"><p className="text-xs text-slate-500 mb-1">ของกลาง</p><p className="text-sm text-red-400 font-medium">{selectedCase.seized_items}</p></div>)}</div>
              </div>
              <div><h3 className="text-sm font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-3">เจ้าหน้าที่ชุดจับกุม</h3><div className="text-sm text-slate-300 bg-slate-800 border border-slate-700 p-3 rounded-lg flex items-start gap-2"><Users className="w-4 h-4 mt-0.5 text-slate-500 flex-shrink-0" />{selectedCase.arrest_team}</div></div>
            </div>
          </div>
        </div>
      )}
      
      {/* ==================================================================================
          FIXED PRINT VIEW (Layout: Charts Left, Table Right - NO MAP)
          Note: Keeping styles White/Black for clean printing, despite dark mode app
          ================================================================================== */}
      <div id="print-view" 
           style={{ 
             position: 'fixed', top: 0, left: 0,
             zIndex: isExporting ? 99999 : -1,
             opacity: isExporting ? 1 : 0,
             width: '1123px', height: '794px',
             backgroundColor: 'white', padding: '20px',
             fontFamily: "'Sarabun', sans-serif", color: '#000',
             overflow: 'hidden', visibility: 'visible', pointerEvents: 'none'
           }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '15px', height: '15mm' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src={LOGO_URL} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
            <div><h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>รายงานสรุปสถานการณ์ประจำวัน</h1><p style={{ fontSize: '14px', color: '#555', margin: 0 }}>กองบังคับการตำรวจทางหลวง (Highway Police)</p></div>
          </div>
          <div style={{ textAlign: 'right' }}><p style={{ fontSize: '12px', fontWeight: 'bold', color: '#777', margin: 0 }}>ข้อมูล ณ วันที่</p><p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p><p style={{ fontSize: '12px', color: '#777', margin: 0 }}>เงื่อนไข: {filters.year || 'ทุกปี'} | กก.{filters.unit_kk || 'ทั้งหมด'}</p></div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '15px', height: '20mm' }}>
            {[{ t: 'จับกุมรวม', v: stats.totalCases, c: '#eff6ff', ct: '#1d4ed8' }, { t: 'ยาเสพติด', v: stats.drugCases, c: '#fef2f2', ct: '#b91c1c' }, { t: 'อาวุธปืน', v: stats.weaponCases, c: '#fff7ed', ct: '#c2410c' }, { t: 'รถบรรทุก', v: stats.heavyTruckCases, c: '#faf5ff', ct: '#7e22ce' }, { t: 'หมายจับ', v: stats.warrantCases, c: '#eef2ff', ct: '#4338ca' }, { t: 'หน่วยงาน', v: stats.uniqueUnits, c: '#f0fdf4', ct: '#15803d' }].map((s, i) => (
              <div key={i} style={{ flex: 1, backgroundColor: s.c, borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}><p style={{ fontSize: '12px', color: s.ct, fontWeight: 'bold', margin: 0 }}>{s.t}</p><p style={{ fontSize: '24px', color: '#000', fontWeight: 'bold', margin: 0, lineHeight: 1 }}>{s.v}</p></div>
            ))}
        </div>

        {/* Content (No Map) */}
        <div style={{ display: 'flex', gap: '15px', height: '135mm' }}>
            {/* Left: Charts (40%) */}
            <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 10px 0', width: '100%' }}>สัดส่วนคดี</p>
                  <div style={{ width: '100%', flex: 1, minHeight: '0' }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.typeChartData} cx="50%" cy="50%" outerRadius={55} dataKey="value">{stats.typeChartData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer></div>
                  <div style={{ width: '100%', fontSize: '11px', marginTop: '10px' }}>{stats.typeChartData.slice(0,4).map((e,i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', padding: '4px 0' }}><span style={{color: '#555'}}>{e.name}</span><span style={{fontWeight:'bold'}}>{e.value}</span></div>))}</div>
              </div>
              <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '15px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 10px 0' }}>สถิติแยกหน่วย (Top 5)</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{stats.unitChartData.slice(0,5).map((u, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', fontSize: '11px' }}><span style={{ width: '40px', fontWeight: 'bold', color: '#555' }}>{u.name}</span><div style={{ flex: 1, height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', margin: '0 10px', overflow: 'hidden' }}><div style={{ height: '100%', backgroundColor: '#2563eb', width: `${(u.value / stats.totalCases) * 100}%` }}></div></div><span style={{ fontWeight: 'bold' }}>{u.value}</span></div>))}</div>
              </div>
            </div>

            {/* Right: Table (60%) - Expanded */}
            <div style={{ width: '60%', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ backgroundColor: '#f3f4f6', padding: '10px 15px', borderBottom: '1px solid #d1d5db', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>รายการจับกุมล่าสุด</span><span style={{ fontSize: '11px', color: '#666' }}>*20 รายการแรก</span>
              </div>
              <div style={{ flex: 1, padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '8px', fontSize: '11px', textAlign: 'left', color: '#374151', width: '20%' }}>วัน/เวลา</th>
                      <th style={{ padding: '8px', fontSize: '11px', textAlign: 'left', color: '#374151', width: '15%' }}>หน่วย</th>
                      <th style={{ padding: '8px', fontSize: '11px', textAlign: 'left', color: '#374151', width: '35%' }}>ข้อหา</th>
                      <th style={{ padding: '8px', fontSize: '11px', textAlign: 'left', color: '#374151', width: '30%' }}>สถานที่</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice(0, 18).map((item, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '6px 8px', fontSize: '10px', verticalAlign: 'top' }}>{item.date_capture}<br/><span style={{color:'#9ca3af'}}>{item.time_capture}</span></td>
                        <td style={{ padding: '6px 8px', fontSize: '10px', verticalAlign: 'top' }}>กก.{item.unit_kk}<br/>ส.ทล.{item.unit_s_tl}</td>
                        <td style={{ padding: '6px 8px', fontSize: '10px', verticalAlign: 'top', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{item.charge}</td>
                        <td style={{ padding: '6px 8px', fontSize: '10px', verticalAlign: 'top', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{item.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
        
        <div style={{ position: 'absolute', bottom: '5mm', left: 0, width: '100%', textAlign: 'center', fontSize: '9px', color: '#9ca3af' }}>TRAFFIC OPERATIONS DATABASE SYSTEM | GENERATED BY HIGHWAY POLICE DASHBOARD</div>
      </div>
    </div>
  );
}