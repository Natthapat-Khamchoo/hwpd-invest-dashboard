import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import html2pdf from 'html2pdf.js';
import { 
  LayoutDashboard, Table as TableIcon, MapPin, Search, Filter, Siren, Users, 
  FileText, Calendar, ChevronRight, X, Menu, BarChart3, Map as MapIcon, 
  RotateCcw, Building2, ChevronLeft, ListFilter, Layers, Navigation, AlertTriangle,
  Truck, FileWarning // <--- 1. เพิ่มไอคอนใหม่ตรงนี้
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

// --- Configuration ---
const UNIT_HIERARCHY = { "1": 6, "2": 6, "3": 5, "4": 5, "5": 6, "6": 6, "7": 5, "8": 4 };
const UNIT_COLORS = { "1": "#e6194b", "2": "#f58231", "3": "#ffe119", "4": "#3cb44b", "5": "#42d4f4", "6": "#4363d8", "7": "#911eb4", "8": "#f032e6" };
const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

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

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-3 sm:space-x-4 hover:shadow-md transition-shadow">
    <div className={`p-2 sm:p-3 rounded-lg ${colorClass} bg-opacity-10 flex-shrink-0`}>
      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
    <div className="min-w-0">
      <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">{title}</p>
      <h3 className="text-lg sm:text-2xl font-bold text-slate-800">{value}</h3>
    </div>
  </div>
);

// --- Map Components ---
const SimpleMapVisualization = ({ data, onSelectCase }) => {
  const MIN_LAT = 5.6; const MAX_LAT = 20.5; const MIN_LONG = 97.3; const MAX_LONG = 105.8;
  const [hoveredItem, setHoveredItem] = useState(null);
  const getX = (long) => ((parseFloat(long) - MIN_LONG) / (MAX_LONG - MIN_LONG)) * 100;
  const getY = (lat) => 100 - ((parseFloat(lat) - MIN_LAT) / (MAX_LAT - MIN_LAT)) * 100;

  return (
    <div className="relative w-full h-full min-h-[50vh] sm:min-h-[600px] bg-slate-50 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
      <div className="absolute top-4 left-4 z-10 bg-yellow-50 text-yellow-700 text-xs px-2 py-1 rounded border border-yellow-200 flex items-center shadow-sm">
        <AlertTriangle className="w-3 h-3 mr-1" /> Graphic Mode
      </div>
      <div className="relative w-full h-full max-w-[450px] mx-auto py-4">
        <svg viewBox="0 0 330 550" className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
           <path d="M145.6,23.5c-2.4,2.7-6.5,3.9-8.2,7.2c-2.7,5.3-1.2,12.2-4.3,17.3c-1.8,2.9-6.3,2.9-8.4,5.5c-3.9,4.9-3.1,12.6-6.5,17.8c-2.4,3.7-8.4,4.5-10.8,8.2c-2.9,4.5-1.4,10.8-3.6,15.6c-2.2,4.9-8.6,7.3-10.8,12.2c-1.8,3.9,0.6,8.8-1.2,12.7c-2.4,5.3-10.4,6.9-13.4,12c-1.8,3.1,0.4,7.1-1.2,10.3c-3.3,6.5-13.7,8.2-16.1,15.1c-1.4,3.9,2.4,8.6,1.7,12.7c-0.8,4.5-7.3,7.3-8.4,11.8c-1.4,5.3,3.5,10.6,3.4,16.1c-0.2,13.3,7.8,23.7,7.4,37.2c-0.2,6.7-4.7,12.6-4.3,19.4c0.6,8.8,8.4,14.9,10.1,23.3c1.8,9.4-2.9,19.2-0.5,28.6c1.8,7.3,9.6,11.8,12.2,18.7c2.9,7.8,0.4,17.1,3.6,24.7c2.7,6.3,10.8,9.4,14.4,15.6c3.3,5.7,2.4,13.5,5.8,19.2c3.1,5.3,10.6,8,14.2,13.2c3.1,4.5,2.7,10.8,5.8,15.4c3.1,4.5,9.4,6.9,12.5,11.3c4.3,6.1,3.9,15.1,8.9,20.6c2.9,3.3,7.8,4.9,10.8,8.2c3.9,4.3,4.7,11.2,9.1,14.9c4.9,4.1,13.1,2.9,18.7,5.8c4.7,2.4,7.3,8.4,12.2,10.3c6.3,2.4,13.5-2.4,19.2-0.5c4.9,1.6,7.8,7.8,12.7,8.9c6.9,1.6,14.1-4.1,20.2-1.9c4.3,1.6,7.3,6.9,11.8,8.2c5.7,1.6,12-2.7,17.3-1.7c5.3,1,9.2,6.5,14.6,6.7c12.2,0.4,23.1-10.4,32.6-16.3c4.3-2.7,7.3-7.8,12.2-9.6c5.3-2,11.6,0.8,16.3-1.9c3.7-2.2,5.3-7.3,8.6-9.8c4.9-3.7,12.4-3.5,17-7.7c3.1-2.9,3.7-8,6.5-11c4.3-4.7,11.8-5.3,15.6-10.3c2.4-3.3,1.4-8.2,3.4-11.8c2.9-5.3,10.4-7.3,12.7-12.7c1.6-3.7-1.6-8.2-0.5-12c1.8-6.3,10.6-8.4,12-14.9c1-4.3-2.9-8.8-2.4-13.2c0.6-5.3,6.9-9,7-14.4c0.2-11.4-10.4-18.4-12.7-28.3c-1.2-5.3,2.4-10.8,0.7-16.1c-2.2-6.7-11.6-9-14.9-15.1c-2.7-4.9,0.2-11.6-2.6-16.3c-3.9-6.5-13.9-8.6-17.5-15.4c-2.2-4.1,0.4-9.6-1.9-13.7c-3.3-5.9-12.2-8.2-15.4-14.2c-2-3.9,0.2-8.8-1.9-12.7c-2.9-5.3-10.6-7.1-13.2-12.2c-1.8-3.7,0.4-8.4-1.4-12c-3.1-5.9-11.8-8.4-14.6-14.6c-1.8-3.9,0.6-9-1.2-12.7c-2.7-5.3-10.4-6.9-12.7-12.2c-1.4-3.1,0.4-6.9-1-10.1c-2.7-6.1-11.2-8-13.2-14.2c-1.2-3.7,1.2-8-0.2-11.8c-2.4-6.3-11.4-8.6-13.7-14.9c-1.4-3.9,1.2-8.6-0.2-12.5c-2.4-6.5-11.6-8.4-13.9-14.9c-1.2-3.3,0.8-7.1-0.5-10.6C223.7,45.7,219.2,43.1,216.8,37.4z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
        </svg>
        {data.filter(d => d.lat && d.long).map((item) => {
          const lat = parseFloat(item.lat);
          const long = parseFloat(item.long);
          if(lat < MIN_LAT || lat > MAX_LAT || long < MIN_LONG || long > MAX_LONG) return null;
          return (
            <div key={item.id}
              className="absolute rounded-full cursor-pointer transition-transform hover:scale-150 hover:z-20 z-10"
              style={{
                left: `${getX(long)}%`, top: `${getY(lat)}%`, width: '10px', height: '10px',
                backgroundColor: UNIT_COLORS[item.unit_kk] || '#64748b', opacity: 0.7, transform: 'translate(-50%, -50%)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)', border: '2px solid white'
              }}
              onMouseEnter={() => setHoveredItem(item)} onMouseLeave={() => setHoveredItem(null)} onClick={() => onSelectCase(item)}
            />
          );
        })}
        {hoveredItem && (
          <div className="absolute z-30 bg-white/95 backdrop-blur p-3 rounded-lg shadow-xl text-xs border border-slate-200 pointer-events-none whitespace-nowrap"
              style={{ left: `${getX(hoveredItem.long)}%`, top: `${getY(hoveredItem.lat)}%`, transform: 'translate(15px, -50%)' }}>
              <div className="font-bold text-slate-800 text-sm mb-1">{hoveredItem.topic}</div>
              <div className="text-slate-600 mb-1">กก.{hoveredItem.unit_kk} ส.ทล.{hoveredItem.unit_s_tl}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const LeafletMap = ({ data, onSelectCase, onError }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadLeaflet = async () => {
      if (window.L && typeof window.L.map === 'function') return window.L;
      try {
        if (!document.querySelector('#leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css'; link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }
        if (!document.querySelector('#leaflet-js')) {
          const script = document.createElement('script');
          script.id = 'leaflet-js'; script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.async = true;
          document.head.appendChild(script);
        }
        return new Promise((resolve, reject) => {
          const checkL = () => { if (window.L && typeof window.L.map === 'function') resolve(window.L); else setTimeout(checkL, 100); };
          setTimeout(() => reject(new Error('Timeout')), 8000); checkL();
        });
      } catch (e) { throw e; }
    };

    loadLeaflet().then((L) => {
      if (!isMounted) return;
      if (mapInstanceRef.current) { setIsMapReady(true); return; }
      if (!mapRef.current) return;
      try {
        const map = L.map(mapRef.current).setView([13.0, 101.0], 6);
        mapInstanceRef.current = map;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
        markersGroupRef.current = L.featureGroup().addTo(map);
        setIsMapReady(true);
      } catch (err) { if (onError) onError(); }
    }).catch((err) => { if (isMounted && onError) onError(); });
    return () => { isMounted = false; };
  }, [onError]);

  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !window.L || !markersGroupRef.current) return;
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    const L = window.L;

    markersGroup.clearLayers();
    const validPoints = data.filter(d => d.lat && d.long);

    validPoints.forEach(item => {
      const marker = L.circleMarker([parseFloat(item.lat), parseFloat(item.long)], {
        radius: 8, fillColor: UNIT_COLORS[item.unit_kk] || '#666', color: '#fff', weight: 1, opacity: 1, fillOpacity: 0.7
      });
      const popupContent = `<div style="font-family: sans-serif; font-size: 14px;"><strong>${item.topic}</strong><br/><span style="color: #666;">กก.${item.unit_kk} ส.ทล.${item.unit_s_tl}</span><br/><div style="margin-top:4px; font-size:12px; color:#888;">${item.date_capture} | ${item.time_capture} น.</div></div>`;
      marker.bindPopup(popupContent);
      marker.on('click', () => onSelectCase(item));
      markersGroup.addLayer(marker);
    });

    if (validPoints.length > 0) {
        try {
            const bounds = markersGroup.getBounds();
            if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
        } catch (e) { }
    }
  }, [data, onSelectCase, isMapReady]);

  return <div ref={mapRef} className="w-full h-full min-h-[50vh] sm:min-h-[500px] bg-slate-100 z-0" />;
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

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true); 
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [filters, setFilters] = useState({
    search: '', startDate: '', endDate: '', year: '', month: '',
    unit_kk: '', unit_s_tl: '', topic: '', charge: '' 
  });

  useEffect(() => {
    const fetchData = () => {
      // 🔴 EDIT HERE: ใส่ Link CSV ของคุณตรงนี้
      const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4VGxSCS_zy50dWol-qd317rLRYG1SdOPojU03EEuganUmtf7h86LjyqGdTNM-jPjeLhb2z4yOmbCb/pub?output=csv';

      Papa.parse(GOOGLE_SHEET_CSV_URL, {
        download: true,
        header: true,
        complete: (results) => {
          const formattedData = results.data
            .filter(item => item['หัวข้อ'] && item['กก.'])
            .map((item, index) => ({
              id: index + 1,
              timestamp: item['Timestamp'] || new Date().toISOString(),
              unit_kk: item['กก.']?.toString() || '',
              unit_s_tl: item['ส.ทล.']?.toString() || '',
              topic: item['หัวข้อ'] || '',
              captured_by: item['จับโดย'] || '',
              arrest_type: item['ประเภทการจับกุม'] || '',
              date_capture: item['วันที่'] || '',
              time_capture: item['เวลา'] || '',
              arrest_team: item['เจ้าหน้าที่ชุดจับกุม'] || '',
              suspect_count: item['จำนวน'] || '1',
              suspect_name: item['ชื่อ'] || '-',
              nationality: item['สัญชาติ'] || 'ไทย',
              age: item['อายุ'] || '',
              address: item['ที่อยู่'] || 'ไม่ระบุ',
              charge: item['ข้อหา'] || '',
              location: item['สถานที่จับกุม'] || '',
              lat: item['ละติจูด'] && !isNaN(item['ละติจูด']) ? parseFloat(item['ละติจูด']).toFixed(4) : null,
              long: item['ลองจิจูด'] && !isNaN(item['ลองจิจูด']) ? parseFloat(item['ลองจิจูด']).toFixed(4) : null,
              seized_items: item['ของกลาง'] || '-',
              behavior: item['พฤติการณ์'] || '-',
              delivery: item['การดำเนินการส่งต่อ'] || ''
            }));
          
          setData(formattedData);
          setLoading(false);
          setLastUpdated(new Date());
        },
        error: (err) => { console.error(err); setLoading(false); }
      });
    };

    fetchData();
    const intervalId = setInterval(fetchData, 300000); 
    return () => clearInterval(intervalId);
  }, []);

  const handleExportPDF = () => {
    const element = document.getElementById('dashboard-content');
    if(!element) return;
    const opt = {
      margin: 0.3,
      filename: `รายงานสรุป_${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const filterOptions = useMemo(() => {
    const topics = [...new Set(data.map(d => d.topic))].sort();
    const charges = [...new Set(data.map(d => d.charge))].sort(); 
    const years = [...new Set(data.map(d => d.date_capture?.split('/')[2]))].filter(Boolean).sort().reverse();
    return { topics, charges, years };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const searchMatch = !filters.search || 
        (item.charge && item.charge.toLowerCase().includes(filters.search.toLowerCase())) ||
        (item.suspect_name && item.suspect_name.toLowerCase().includes(filters.search.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(filters.search.toLowerCase()));

      const kkMatch = !filters.unit_kk || String(item.unit_kk) === String(filters.unit_kk);
      const stlMatch = !filters.unit_s_tl || String(item.unit_s_tl) === String(filters.unit_s_tl);
      const topicMatch = !filters.topic || item.topic === filters.topic;
      const chargeMatch = !filters.charge || item.charge === filters.charge; 

      const itemDate = parseThaiDate(item.date_capture);
      let yearMatch = true; let monthMatch = true; let rangeMatch = true;

      if (itemDate) {
        if (filters.year) {
           const itemYear = item.date_capture.split('/')[2] || itemDate.getFullYear().toString();
           yearMatch = itemYear === filters.year;
        }
        if (filters.month) monthMatch = (itemDate.getMonth() + 1).toString() === filters.month;
        if (filters.startDate) rangeMatch = rangeMatch && itemDate >= new Date(filters.startDate);
        if (filters.endDate) rangeMatch = rangeMatch && itemDate <= new Date(filters.endDate);
      }
      return searchMatch && kkMatch && stlMatch && topicMatch && chargeMatch && yearMatch && monthMatch && rangeMatch;
    });
  }, [filters, data]);

  const stats = useMemo(() => {
    const totalCases = filteredData.length;
    const uniqueUnits = [...new Set(filteredData.map(d => `${d.unit_kk}-${d.unit_s_tl}`))].length;
    
    // --- 2. เพิ่มสูตรคำนวณตรงนี้ ---
    const drugCases = filteredData.filter(d => d.charge?.includes('ยาเสพติด') || d.topic?.includes('ยาเสพติด')).length;
    const weaponCases = filteredData.filter(d => d.charge?.includes('อาวุธ') || d.topic?.includes('อาวุธ')).length;
    const heavyTruckCases = filteredData.filter(d => d.charge?.includes('น้ำหนัก') || d.topic?.includes('น้ำหนัก') || d.topic?.includes('รถบรรทุก')).length;
    const warrantCases = filteredData.filter(d => d.arrest_type?.includes('หมายจับ') || d.charge?.includes('หมายจับ') || d.topic?.includes('หมายจับ')).length;

    let unitData = {};
    let unitChartTitle = "";

    if (filters.unit_kk) {
      unitChartTitle = `สถิติ ส.ทล. (กก.${filters.unit_kk})`;
      unitData = filteredData.reduce((acc, curr) => {
        const key = `ส.ทล.${curr.unit_s_tl}`;
        acc[key] = (acc[key] || 0) + 1; return acc;
      }, {});
    } else {
      unitChartTitle = "สถิติแยกตาม กองกำกับการ";
      unitData = filteredData.reduce((acc, curr) => {
        const key = `กก.${curr.unit_kk}`;
        acc[key] = (acc[key] || 0) + 1; return acc;
      }, {});
    }

    const unitChartData = Object.entries(unitData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const typeData = filteredData.reduce((acc, curr) => {
      const key = curr.topic || 'อื่นๆ';
      acc[key] = (acc[key] || 0) + 1; return acc;
    }, {});
    const typeChartData = Object.entries(typeData).map(([name, value]) => ({ name, value }));
    
    // Return ค่าใหม่ที่เพิ่ม
    return { totalCases, drugCases, weaponCases, heavyTruckCases, warrantCases, uniqueUnits, unitChartData, typeChartData, unitChartTitle };
  }, [filteredData, filters.unit_kk]);

  const handleFilterChange = (key, value) => {
    if (key === 'unit_kk') setFilters(prev => ({ ...prev, [key]: value, unit_s_tl: '' }));
    else setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', startDate: '', endDate: '', year: '', month: '', unit_kk: '', unit_s_tl: '', topic: '', charge: '' });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Sidebar Mobile Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 bg-slate-900 text-white transition-all duration-300 ease-in-out shadow-xl
        ${mobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full'} 
        lg:relative lg:translate-x-0 ${desktopSidebarOpen ? 'lg:w-64' : 'lg:w-0 lg:overflow-hidden'}
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center whitespace-nowrap">
          <div className="flex items-center space-x-3">
            <img src="https://hwpd.cib.go.th/backend/uploads/logo500_0d7ce0273a.png" alt="Logo" className="w-10 h-10 flex-shrink-0 object-contain" />
            <span className={`text-xl font-bold tracking-tight transition-opacity duration-200 ${!desktopSidebarOpen && 'lg:opacity-0'}`}>HIGHWAY POLICE</span>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="p-4 space-y-2 whitespace-nowrap">
          {['dashboard', 'list', 'map'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              {tab === 'dashboard' ? <LayoutDashboard className="w-5 h-5 flex-shrink-0" /> : tab === 'list' ? <TableIcon className="w-5 h-5 flex-shrink-0" /> : <MapIcon className="w-5 h-5 flex-shrink-0" />}
              <span>{tab === 'dashboard' ? 'ภาพรวมคดี' : tab === 'list' ? 'รายการจับกุม' : 'แผนที่'}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header: ปรับ padding สำหรับ mobile */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"><Menu className="w-6 h-6" /></button>
            <button onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)} className="hidden lg:block p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              {desktopSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <h1 className="text-base sm:text-xl font-semibold text-slate-800 truncate">
              {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'list' ? 'Database' : 'GIS Map'}
            </h1>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden md:flex text-xs text-slate-400 items-center mr-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>Updated: {lastUpdated.toLocaleTimeString('th-TH')}</div>
            {activeTab === 'dashboard' && (
              <button onClick={handleExportPDF} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center"><FileText className="w-4 h-4 mr-1" /> PDF</button>
            )}
            <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={`flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${showFilterPanel ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-white text-slate-600 border border-slate-200'}`}>
              <Filter className="w-4 h-4" /><span className="hidden sm:inline">ตัวกรอง</span>
            </button>
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">A</div>
          </div>
        </header>

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="bg-white border-b border-slate-200 p-4 animate-in slide-in-from-top-2 duration-200 shadow-inner z-20 relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
              {/* ... Filters ... */}
              <div className="sm:col-span-2 md:col-span-3 xl:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">ค้นหา</label>
                <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" /><input type="text" className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" placeholder="ชื่อ/ข้อหา/สถานที่..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} /></div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">กก.</label>
                <select className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer" value={filters.unit_kk} onChange={(e) => handleFilterChange('unit_kk', e.target.value)}><option value="">ทั้งหมด</option>{Object.keys(UNIT_HIERARCHY).map(kk => <option key={kk} value={kk}>กก.{kk}</option>)}</select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">ส.ทล.</label>
                <select className={`w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer ${!filters.unit_kk ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`} value={filters.unit_s_tl} onChange={(e) => handleFilterChange('unit_s_tl', e.target.value)} disabled={!filters.unit_kk}><option value="">{filters.unit_kk ? 'ทั้งหมด' : 'เลือก กก. ก่อน'}</option>{filters.unit_kk && Array.from({ length: UNIT_HIERARCHY[filters.unit_kk] }, (_, i) => i + 1).map(num => <option key={num} value={num}>ส.ทล.{num}</option>)}</select>
              </div>
              <div className="xl:col-span-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">ข้อหา</label>
                <div className="relative"><ListFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" /><select className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer" value={filters.charge} onChange={(e) => handleFilterChange('charge', e.target.value)}><option value="">ทั้งหมด</option>{filterOptions.charges.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">ปี</label><select className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer" value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)}><option value="">ทั้งหมด</option>{filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">เดือน</label><select className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer" value={filters.month} onChange={(e) => handleFilterChange('month', e.target.value)}><option value="">ทั้งหมด</option>{THAI_MONTHS.map((m, idx) => <option key={idx} value={(idx + 1).toString()}>{m}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">ตั้งแต่วันที่</label><input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} /></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">ถึงวันที่</label><input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} /></div>
              <div className="flex items-end xl:col-span-8 justify-end border-t border-slate-100 pt-3 mt-2"><button onClick={clearFilters} className="px-4 py-2 bg-white text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-800 text-sm font-medium transition-colors flex items-center shadow-sm"><RotateCcw className="w-4 h-4 mr-2" />ล้างค่าตัวกรอง</button></div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          
          {/* --- TAB: DASHBOARD --- */}
          {activeTab === 'dashboard' && (
            // ใช้ id นี้สำหรับ PDF
            <div id="dashboard-content" className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-300">
              
              {/* --- 3. ปรับ Grid เป็น 3 คอลัมน์ในจอใหญ่ เพื่อให้แสดง 6 การ์ดได้พอดี (2 แถว x 3 ช่อง) --- */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <StatCard title="ผลการจับกุมรวม" value={stats.totalCases} icon={FileText} colorClass="text-blue-600 bg-blue-600" />
                <StatCard title="คดียาเสพติด" value={stats.drugCases} icon={Siren} colorClass="text-red-600 bg-red-600" />
                <StatCard title="คดีอาวุธปืน" value={stats.weaponCases} icon={MapPin} colorClass="text-orange-600 bg-orange-600" />
                <StatCard title="รถบรรทุกหนัก" value={stats.heavyTruckCases} icon={Truck} colorClass="text-purple-600 bg-purple-600" />
                <StatCard title="บุคคลตามหมายจับ" value={stats.warrantCases} icon={FileWarning} colorClass="text-indigo-600 bg-indigo-600" />
                <StatCard title="หน่วยที่รายงาน" value={stats.uniqueUnits} icon={Users} colorClass="text-green-600 bg-green-600" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* 2. กราฟแท่ง: ปรับความสูงและ Margin ให้เหมาะกับมือถือ */}
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-slate-500" />
                    {stats.unitChartTitle}
                  </h3>
                  {stats.unitChartData.length > 0 ? (
                    // ปรับความสูง mobile เป็น h-72 (สูงขึ้นเพื่อให้มีที่ให้ตัวหนังสือ) / desktop h-96
                    <div className="h-72 sm:h-96 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={stats.unitChartData} 
                          // ปรับ Margin ล่างให้เยอะขึ้น (80) เพื่อกันตัวหนังสือตกขอบ
                          margin={{ top: 10, right: 0, left: -20, bottom: 20 }} 
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="name" 
                            interval={0} 
                            angle={-45} 
                            textAnchor="end" 
                            height={50} 
                            tick={{fontSize: 10, fill: '#64748b'}} // ลดขนาดฟอนต์ลงนิดนึง
                            axisLine={{ stroke: '#e2e8f0' }} 
                            tickLine={false} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 12, fill: '#64748b'}} 
                            allowDecimals={false} 
                          />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                            cursor={{ fill: '#f1f5f9' }} 
                          />
                          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400 flex-col">
                      <FileText className="w-8 h-8 mb-2 opacity-50" />
                      <span>ไม่พบข้อมูลตามเงื่อนไข</span>
                    </div>
                  )}
                </div>

                {/* 3. กราฟวงกลม: ใช้ % แทน Pixel เพื่อความยืดหยุ่น */}
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center">
                    <PieChart className="w-5 h-5 mr-2 text-slate-500" />
                    สัดส่วนประเภทคดี
                  </h3>
                  {stats.typeChartData.length > 0 ? (
                    <>
                      <div className="h-64 sm:h-80 flex justify-center w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie 
                              data={stats.typeChartData} 
                              cx="50%" 
                              cy="50%" 
                              // ⭐ ไฮไลท์: ใช้ % แทนค่าคงที่ กราฟจะยืดหดตามจอมือถือ
                              innerRadius="45%" 
                              outerRadius="70%" 
                              paddingAngle={2} 
                              dataKey="value" 
                              stroke="none"
                            >
                              {stats.typeChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Legend ด้านล่าง */}
                      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-2">
                        {stats.typeChartData.map((entry, index) => (
                          <div key={index} className="flex items-center text-[10px] sm:text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                            <div className="w-2 h-2 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="truncate max-w-[100px]">{entry.name}</span> 
                            <span className="font-semibold ml-1">({entry.value})</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400 flex-col">
                      <FileText className="w-8 h-8 mb-2 opacity-50" />
                      <span>ไม่พบข้อมูลตามเงื่อนไข</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="p-2 sm:p-6 h-full">
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full animate-in fade-in duration-300 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"><span className="text-sm font-medium text-slate-600">ข้อมูลรายการจับกุม</span></div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm"><tr><th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">วันที่/เวลา</th><th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">หน่วยงาน</th><th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">หัวข้อ/ข้อหา</th><th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">ผู้ถูกจับ</th><th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">สถานที่</th><th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200"></th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredData.length > 0 ? filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-sm text-slate-600 whitespace-nowrap"><div className="font-medium text-slate-800">{item.date_capture}</div><div className="text-xs text-slate-400">{item.time_capture} น.</div></td>
                          <td className="p-4 text-sm text-slate-600 whitespace-nowrap"><div className="font-medium text-slate-800">กก.{item.unit_kk} บก.ทล.</div><div className="text-xs text-slate-500">ส.ทล.{item.unit_s_tl}</div></td>
                          <td className="p-4 text-sm text-slate-800 font-medium max-w-xs truncate" title={item.charge}><div className="text-blue-600 mb-1 text-xs uppercase tracking-wide">{item.topic}</div>{item.charge}</td>
                          <td className="p-4 text-sm text-slate-600">{item.suspect_name !== '-' ? item.suspect_name : 'ไม่ระบุตัวตน'}</td>
                          <td className="p-4 text-sm text-slate-600 max-w-xs truncate" title={item.location}>{item.location}</td>
                          <td className="p-4 text-right"><button onClick={() => setSelectedCase(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><ChevronRight className="w-5 h-5" /></button></td>
                        </tr>
                      )) : (<tr><td colSpan="6" className="p-12 text-center text-slate-400 flex flex-col items-center justify-center w-full"><Search className="w-10 h-10 mb-3 opacity-20" />ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="h-full w-full p-2 sm:p-6 animate-in fade-in duration-300 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div><h3 className="text-lg font-bold text-slate-800 flex items-center"><MapIcon className="w-5 h-5 mr-2 text-blue-600" />แผนที่สถานการณ์ (GIS)</h3><p className="text-sm text-slate-500">แสดงพิกัดภูมิสารสนเทศบนแผนที่ฐาน (QGIS/OpenStreetMap Style)</p></div>
              </div>
              <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
                <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm p-3 rounded shadow-lg border border-slate-300 z-[1000] max-w-[200px]">
                  <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center border-b border-slate-200 pb-1"><Layers className="w-3 h-3 mr-1" /> สัญลักษณ์หน่วย (กก.)</h4>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">{Object.entries(UNIT_COLORS).map(([kk, color]) => (<div key={kk} className="flex items-center text-[11px] text-slate-600"><span className="w-3 h-3 rounded-full mr-2 inline-block shadow-sm border border-white" style={{ backgroundColor: color }}></span>กก.{kk}</div>))}</div>
                </div>
                {!mapError ? (<LeafletMap data={filteredData} onSelectCase={setSelectedCase} onError={handleMapError} />) : (<SimpleMapVisualization data={filteredData} onSelectCase={setSelectedCase} />)}
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedCase && (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div><h2 className="text-xl font-bold text-slate-800">รายละเอียดการจับกุม</h2><p className="text-sm text-slate-500">รหัสเหตุการณ์: #{selectedCase.id}</p></div>
              <button onClick={() => setSelectedCase(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100"><h3 className="text-sm font-semibold text-blue-800 mb-2 uppercase tracking-wider">หน่วยงานรับผิดชอบ</h3><div className="grid grid-cols-2 gap-4"><div><p className="text-xs text-blue-600 mb-1">กองกำกับการ</p><p className="text-lg font-bold text-slate-800 flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-500" />กก.{selectedCase.unit_kk} บก.ทล.</p></div><div><p className="text-xs text-blue-600 mb-1">สถานีตำรวจทางหลวง</p><p className="text-lg font-bold text-slate-800">ส.ทล.{selectedCase.unit_s_tl}</p></div></div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><h3 className="text-sm font-semibold text-slate-900 border-b pb-2 mb-3 flex items-center"><Calendar className="w-4 h-4 mr-2 text-slate-500" />ข้อมูลเหตุการณ์</h3><dl className="space-y-3 text-sm"><div><dt className="text-slate-500 text-xs">วัน/เวลา</dt><dd className="text-slate-800 font-medium">{selectedCase.date_capture} เวลา {selectedCase.time_capture} น.</dd></div><div><dt className="text-slate-500 text-xs">สถานที่</dt><dd className="text-slate-800">{selectedCase.location}</dd></div><div><dt className="text-slate-500 text-xs">หัวข้อเรื่อง</dt><dd className="text-slate-800 inline-block px-2 py-1 bg-slate-100 rounded text-xs font-medium">{selectedCase.topic}</dd></div><div><dt className="text-slate-500 text-xs">พิกัด (Lat/Long)</dt><dd className="text-slate-800 font-mono flex items-center gap-1"><Navigation className="w-3 h-3 text-blue-500" />{selectedCase.lat}, {selectedCase.long}</dd></div></dl></div>
                <div><h3 className="text-sm font-semibold text-slate-900 border-b pb-2 mb-3 flex items-center"><Users className="w-4 h-4 mr-2 text-slate-500" />ข้อมูลผู้ต้องหา</h3><dl className="space-y-3 text-sm"><div><dt className="text-slate-500 text-xs">ชื่อ-สกุล</dt><dd className="text-slate-800 font-medium">{selectedCase.suspect_name}</dd></div><div><dt className="text-slate-500 text-xs">อายุ/สัญชาติ</dt><dd className="text-slate-800">{selectedCase.age} ปี / {selectedCase.nationality}</dd></div><div><dt className="text-slate-500 text-xs">ที่อยู่</dt><dd className="text-slate-800 truncate">{selectedCase.address}</dd></div></dl></div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 mb-3">ข้อหาและพฤติการณ์</h3>
                <div className="bg-slate-50 p-4 rounded-lg space-y-4"><div><p className="text-xs text-slate-500 mb-1">ข้อหา</p><p className="text-sm text-slate-800 font-medium">{selectedCase.charge}</p></div><div><p className="text-xs text-slate-500 mb-1">พฤติการณ์</p><p className="text-sm text-slate-600 leading-relaxed">{selectedCase.behavior}</p></div>{selectedCase.seized_items && selectedCase.seized_items !== '-' && (<div className="pt-2 border-t border-slate-200"><p className="text-xs text-slate-500 mb-1">ของกลาง</p><p className="text-sm text-red-600 font-medium">{selectedCase.seized_items}</p></div>)}</div>
              </div>
              <div><h3 className="text-sm font-semibold text-slate-900 border-b pb-2 mb-3">เจ้าหน้าที่ชุดจับกุม</h3><div className="text-sm text-slate-600 bg-white border border-slate-200 p-3 rounded-lg flex items-start gap-2"><Users className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />{selectedCase.arrest_team}</div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}