import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import html2pdf from 'html2pdf.js';
import { 
  LayoutDashboard, Table as TableIcon, MapPin, Search, Filter, Siren, Users, 
  FileText, Calendar, ChevronRight, X, Menu, BarChart3, Map as MapIcon, 
  RotateCcw, Building2, ChevronLeft, ListFilter, Layers, Navigation, AlertTriangle,
  Truck, FileWarning, Download
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

// *** Logo Base64 (ใช้แก้ปัญหารูปไม่ขึ้นใน PDF) ***
// รูปโลโก้ตำรวจทางหลวง (Placeholder) - ถ้าต้องการรูปชัดกว่านี้ให้นำไฟล์รูปไปแปลงเป็น Base64
const LOGO_BASE64 = "https://hwpd.cib.go.th/backend/uploads/logo500_0d7ce0273a.png";

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
  if (!year) {
    year = parts[parts.length - 1].trim().split(' ')[0]; 
  }
  if (year && year.length === 2) {
    const yVal = parseInt(year, 10);
    year = yVal > 40 ? `25${year}` : `20${year}`;
  }
  return year;
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

// 🗺️ MAP: แผนที่ประเทศไทย SVG Path (แก้ไขรูปทรงแล้ว)
const SimpleMapVisualization = ({ data, onSelectCase, isPrintMode = false }) => {
  const MIN_LAT = 5.6;   
  const MAX_LAT = 20.5;  
  const MIN_LONG = 97.3; 
  const MAX_LONG = 105.7;

  const [hoveredItem, setHoveredItem] = useState(null);
  
  const getX = (long) => ((parseFloat(long) - MIN_LONG) / (MAX_LONG - MIN_LONG)) * 100;
  const getY = (lat) => 100 - ((parseFloat(lat) - MIN_LAT) / (MAX_LAT - MIN_LAT)) * 100;

  return (
    <div className={`relative w-full h-full ${isPrintMode ? '' : 'min-h-[50vh] sm:min-h-[600px]'} bg-slate-50 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center`}>
      {/* 🚫 REMOVED: ลบป้าย Graphic Mode ออกเมื่อ Export */}
      {!isPrintMode && (
        <div className="absolute top-4 left-4 z-10 bg-yellow-50 text-yellow-700 text-xs px-2 py-1 rounded border border-yellow-200 flex items-center shadow-sm">
          <AlertTriangle className="w-3 h-3 mr-1" /> Graphic Mode
        </div>
      )}
      
      <div className="relative w-full h-full max-w-[400px] mx-auto py-4 flex items-center justify-center">
        <svg viewBox="0 0 350 650" className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.8 }}>
           {/* Path รูปแผนที่ประเทศไทย (ขวานทอง) */}
           <path 
             d="M155.5,20.5 L162.6,11.9 L178.1,22.9 L195.2,25.8 L202.6,35.4 L191.6,46.8 L183.5,47.3 L174.9,59.2 L180.7,74.5 L192.6,72.6 L205.4,81.6 L214.5,79.7 L223.5,89.3 L221.2,102.1 L235.9,103.5 L249.7,114.5 L244.0,126.4 L233.0,127.4 L229.7,138.3 L246.8,145.5 L245.9,156.9 L233.5,168.3 L224.0,166.9 L214.9,174.5 L203.5,173.1 L192.1,183.6 L176.4,185.0 L167.3,192.6 L167.3,202.2 L177.8,210.7 L192.1,210.7 L202.1,218.4 L223.5,218.4 L233.5,225.5 L243.0,237.4 L250.7,238.4 L262.6,232.2 L277.3,232.2 L286.4,240.7 L299.2,240.7 L308.7,247.9 L318.3,246.5 L324.0,255.0 L332.1,253.6 L338.8,261.7 L350.7,263.1 L350.7,275.0 L343.6,281.2 L341.7,293.1 L350.7,300.3 L348.8,312.2 L341.2,321.2 L344.5,332.7 L336.9,344.6 L325.5,348.9 L316.4,347.0 L310.7,354.1 L300.7,354.1 L296.0,364.1 L285.5,365.1 L276.9,372.2 L268.8,379.8 L259.3,378.4 L250.7,372.7 L243.0,378.4 L232.6,378.4 L220.2,383.7 L210.2,383.7 L200.7,389.4 L193.1,398.4 L186.4,407.5 L177.8,409.4 L168.3,416.5 L158.3,424.6 L149.3,427.5 L142.6,432.2 L137.8,439.9 L136.9,451.3 L140.2,462.7 L144.5,474.2 L145.9,486.5 L149.3,497.9 L152.6,506.5 L157.4,516.5 L159.3,528.9 L159.3,540.8 L154.5,549.8 L146.4,555.1 L138.8,559.4 L131.6,565.6 L125.9,575.1 L122.1,586.5 L120.7,597.9 L118.3,608.9 L111.2,615.5 L101.2,614.6 L94.0,609.3 L88.3,602.7 L82.1,594.1 L76.4,587.9 L71.6,580.8 L68.3,572.2 L66.4,562.2 L65.5,550.8 L65.5,539.4 L68.8,528.9 L73.6,519.9 L78.3,510.8 L81.7,501.3 L84.1,489.9 L84.1,478.5 L80.8,468.9 L76.0,461.3 L69.8,454.2 L62.7,448.0 L55.5,442.7 L49.8,436.1 L45.0,427.5 L41.7,417.5 L40.2,407.5 L42.6,396.6 L46.4,386.6 L48.8,377.1 L47.4,366.6 L42.6,358.5 L35.5,353.8 L26.0,352.3 L17.9,347.6 L10.7,340.4 L6.0,331.9 L3.6,321.9 L3.6,311.4 L8.4,302.4 L15.5,295.2 L21.7,287.1 L24.6,277.1 L26.0,266.6 L24.1,256.2 L19.3,247.1 L12.2,241.4 L3.6,237.6 L0.0,239.0 L16.0,180.0 L155.5,20.5 Z"
             fill="#cbd5e1" 
             stroke="#94a3b8" 
             strokeWidth="2"
           />
        </svg>
        
        {/* Points */}
        {data.filter(d => d.lat && d.long).map((item) => {
          const lat = parseFloat(item.lat);
          const long = parseFloat(item.long);
          if(lat < MIN_LAT || lat > MAX_LAT || long < MIN_LONG || long > MAX_LONG) return null;
          
          return (
            <div key={item.id}
              className="absolute rounded-full cursor-pointer"
              style={{
                left: `${getX(long)}%`, 
                top: `${getY(lat)}%`, 
                width: isPrintMode ? '6px' : '10px', 
                height: isPrintMode ? '6px' : '10px',
                backgroundColor: UNIT_COLORS[item.unit_kk] || '#64748b', 
                opacity: 0.8, 
                transform: 'translate(-50%, -50%)',
                border: '1px solid white',
                zIndex: 10
              }}
              onMouseEnter={() => !isPrintMode && setHoveredItem(item)} 
              onMouseLeave={() => setHoveredItem(null)} 
              onClick={() => !isPrintMode && onSelectCase(item)}
            />
          );
        })}

        {hoveredItem && !isPrintMode && (
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
  const [isExporting, setIsExporting] = useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true); 
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [filters, setFilters] = useState({
    search: '', startDate: '', endDate: '', year: '', month: '',
    unit_kk: '', unit_s_tl: '', topic: '', charge: '' 
  });

  useEffect(() => {
    const fetchData = () => {
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

  // 🎯 FIX DEFINITIVE: ปรับปรุงฟังก์ชัน Export ให้มั่นใจว่าไม่ขาว
  const handleExportPDF = () => {
    // 1. Scroll ไปบนสุดเสมอ
    window.scrollTo(0, 0);
    
    // 2. เริ่ม Export (แสดง div print-view)
    setIsExporting(true);
    
    // 3. ใช้ setTimeout เพื่อรอให้ Browser Render เสร็จจริงๆ (1.5 วินาที)
    setTimeout(() => {
      const element = document.getElementById('print-view');
      
      // Config html2pdf
      const opt = {
        margin: 0,
        filename: `รายงานสรุป_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, // สำคัญ: โหลดรูปข้ามโดเมน
            letterRendering: true,
            scrollY: 0, 
            windowWidth: 1123, // A4 Landscape Width
            width: 1123,
            x: 0, y: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
           setIsExporting(false); // ซ่อนเมื่อเสร็จ
        })
        .catch(err => {
           console.error("PDF Failed:", err);
           setIsExporting(false);
        });
    }, 1500);
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) { alert('ไม่มีข้อมูลสำหรับ Export'); return; }
    const headers = {
      date_capture: "วันที่", time_capture: "เวลา", unit_kk: "กก.", unit_s_tl: "ส.ทล.",
      topic: "หัวข้อ", charge: "ข้อหา", suspect_name: "ผู้ถูกจับ", location: "สถานที่",
      lat: "ละติจูด", long: "ลองจิจูด", seized_items: "ของกลาง", arrest_team: "ชุดจับกุม", behavior: "พฤติการณ์"
    };
    const csvRows = [];
    csvRows.push(Object.values(headers).join(','));
    filteredData.forEach(row => {
      const values = Object.keys(headers).map(key => {
        const val = row[key] ? String(row[key]) : '';
        return `"${val.replace(/"/g, '""')}"`; 
      });
      csvRows.push(values.join(','));
    });
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `police_report_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const filterOptions = useMemo(() => {
    const charges = [...new Set(data.map(d => d.topic))].filter(Boolean).sort(); 
    const years = [...new Set(data.map(d => getYearFromDate(d.date_capture)))].filter(Boolean).sort().reverse();
    return { charges, years };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const searchMatch = !filters.search || 
        (item.charge && item.charge.toLowerCase().includes(filters.search.toLowerCase())) ||
        (item.suspect_name && item.suspect_name.toLowerCase().includes(filters.search.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(filters.search.toLowerCase())) ||
        (item.topic && item.topic.toLowerCase().includes(filters.search.toLowerCase()));

      const kkMatch = !filters.unit_kk || String(item.unit_kk) === String(filters.unit_kk);
      const stlMatch = !filters.unit_s_tl || String(item.unit_s_tl) === String(filters.unit_s_tl);
      const chargeMatch = !filters.charge || item.topic === filters.charge; 
      const itemDate = parseThaiDate(item.date_capture);
      let yearMatch = true; let monthMatch = true; let rangeMatch = true;

      if (filters.year) {
         const itemYear = getYearFromDate(item.date_capture);
         yearMatch = itemYear === filters.year;
      }
      if (itemDate) {
        if (filters.month) monthMatch = (itemDate.getMonth() + 1).toString() === filters.month;
        if (filters.startDate) rangeMatch = rangeMatch && itemDate >= new Date(filters.startDate);
        if (filters.endDate) rangeMatch = rangeMatch && itemDate <= new Date(filters.endDate);
      } else if (filters.month || filters.startDate || filters.endDate) {
        return false;
      }
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

    let unitData = {};
    let unitChartTitle = "";
    if (filters.unit_kk) {
      unitChartTitle = `สถิติ ส.ทล. (กก.${filters.unit_kk})`;
      unitData = filteredData.reduce((acc, curr) => { const key = `ส.ทล.${curr.unit_s_tl}`; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    } else {
      unitChartTitle = "สถิติแยกตาม กองกำกับการ";
      unitData = filteredData.reduce((acc, curr) => { const key = `กก.${curr.unit_kk}`; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    }

    const unitChartData = Object.entries(unitData).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const typeData = filteredData.reduce((acc, curr) => { const key = curr.topic || 'อื่นๆ'; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    const typeChartData = Object.entries(typeData).map(([name, value]) => ({ name, value }));
    
    return { totalCases, drugCases, weaponCases, heavyTruckCases, warrantCases, uniqueUnits, unitChartData, typeChartData, unitChartTitle };
  }, [filteredData, filters.unit_kk]);

  const handleFilterChange = (key, value) => {
    if (key === 'unit_kk') setFilters(prev => ({ ...prev, [key]: value, unit_s_tl: '' }));
    else setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => { setFilters({ search: '', startDate: '', endDate: '', year: '', month: '', unit_kk: '', unit_s_tl: '', topic: '', charge: '' }); };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div></div>;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
       {/* Load Sarabun Font for PDF */}
       <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
      `}</style>

      {/* Sidebar Mobile Overlay */}
      {mobileSidebarOpen && (<div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />)}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 bg-slate-900 text-white transition-all duration-300 ease-in-out shadow-xl ${mobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full'} lg:relative lg:translate-x-0 ${desktopSidebarOpen ? 'lg:w-64' : 'lg:w-0 lg:overflow-hidden'}`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center whitespace-nowrap">
          <div className="flex items-center space-x-3">
            <img src={LOGO_BASE64} alt="Logo" className="w-10 h-10 flex-shrink-0 object-contain" />
            <span className={`text-xl font-bold tracking-tight transition-opacity duration-200 ${!desktopSidebarOpen && 'lg:opacity-0'}`}>HIGHWAY POLICE</span>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        <nav className="p-4 space-y-2 whitespace-nowrap">
          {['dashboard', 'list', 'map'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setMobileSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              {tab === 'dashboard' ? <LayoutDashboard className="w-5 h-5 flex-shrink-0" /> : tab === 'list' ? <TableIcon className="w-5 h-5 flex-shrink-0" /> : <MapIcon className="w-5 h-5 flex-shrink-0" />}
              <span>{tab === 'dashboard' ? 'ภาพรวมคดี' : tab === 'list' ? 'รายการจับกุม' : 'แผนที่'}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"><Menu className="w-6 h-6" /></button>
            <button onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)} className="hidden lg:block p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">{desktopSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
            <h1 className="text-base sm:text-xl font-semibold text-slate-800 truncate">{activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'list' ? 'Database' : 'GIS Map'}</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden md:flex text-xs text-slate-400 items-center mr-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>Updated: {lastUpdated.toLocaleTimeString('th-TH')}</div>
            {activeTab === 'dashboard' && (<button onClick={handleExportPDF} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center"><FileText className="w-4 h-4 mr-1" /> PDF</button>)}
            <button onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center shadow-sm transition-all"><Download className="w-4 h-4 mr-1" /> CSV</button>
            <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={`flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${showFilterPanel ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-white text-slate-600 border border-slate-200'}`}><Filter className="w-4 h-4" /><span className="hidden sm:inline">ตัวกรอง</span></button>
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">A</div>
          </div>
        </header>

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="bg-white border-b border-slate-200 p-4 animate-in slide-in-from-top-2 duration-200 shadow-inner z-20 relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
              <div className="sm:col-span-2 md:col-span-3 xl:col-span-2"><label className="block text-xs font-medium text-slate-500 mb-1">ค้นหา</label><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" /><input type="text" className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" placeholder="ชื่อ/ข้อหา/สถานที่..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} /></div></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">กก.</label><select className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer" value={filters.unit_kk} onChange={(e) => handleFilterChange('unit_kk', e.target.value)}><option value="">ทั้งหมด</option>{Object.keys(UNIT_HIERARCHY).map(kk => <option key={kk} value={kk}>กก.{kk}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">ส.ทล.</label><select className={`w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer ${!filters.unit_kk ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`} value={filters.unit_s_tl} onChange={(e) => handleFilterChange('unit_s_tl', e.target.value)} disabled={!filters.unit_kk}><option value="">{filters.unit_kk ? 'ทั้งหมด' : 'เลือก กก. ก่อน'}</option>{filters.unit_kk && Array.from({ length: UNIT_HIERARCHY[filters.unit_kk] }, (_, i) => i + 1).map(num => <option key={num} value={num}>ส.ทล.{num}</option>)}</select></div>
              <div className="xl:col-span-1"><label className="block text-xs font-medium text-slate-500 mb-1">ข้อหา</label><div className="relative"><ListFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" /><select className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer" value={filters.charge} onChange={(e) => handleFilterChange('charge', e.target.value)}><option value="">ทั้งหมด</option>{filterOptions.charges.map(c => <option key={c} value={c}>{c}</option>)}</select></div></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">ปี</label><select className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer" value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)}><option value="">ทั้งหมด</option>{filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">เดือน</label><select className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer" value={filters.month} onChange={(e) => handleFilterChange('month', e.target.value)}><option value="">ทั้งหมด</option>{THAI_MONTHS.map((m, idx) => <option key={idx} value={(idx + 1).toString()}>{m}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">ตั้งแต่วันที่</label><input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} /></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">ถึงวันที่</label><input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} /></div>
              <div className="flex items-end xl:col-span-8 justify-end border-t border-slate-100 pt-3 mt-2"><button onClick={clearFilters} className="px-4 py-2 bg-white text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-800 text-sm font-medium transition-colors flex items-center shadow-sm"><RotateCcw className="w-4 h-4 mr-2" />ล้างค่าตัวกรอง</button></div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          {activeTab === 'dashboard' && (
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <StatCard title="ผลการจับกุมรวม" value={stats.totalCases} icon={FileText} colorClass="text-blue-600 bg-blue-600" />
                <StatCard title="คดียาเสพติด" value={stats.drugCases} icon={Siren} colorClass="text-red-600 bg-red-600" />
                <StatCard title="คดีอาวุธปืน" value={stats.weaponCases} icon={MapPin} colorClass="text-orange-600 bg-orange-600" />
                <StatCard title="รถบรรทุกหนัก" value={stats.heavyTruckCases} icon={Truck} colorClass="text-purple-600 bg-purple-600" />
                <StatCard title="บุคคลตามหมายจับ" value={stats.warrantCases} icon={FileWarning} colorClass="text-indigo-600 bg-indigo-600" />
                <StatCard title="หน่วยที่รายงาน" value={stats.uniqueUnits} icon={Users} colorClass="text-green-600 bg-green-600" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center"><BarChart3 className="w-5 h-5 mr-2 text-slate-500" />{stats.unitChartTitle}</h3>
                  {stats.unitChartData.length > 0 ? (
                    <div className="h-72 sm:h-96 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.unitChartData} margin={{ top: 10, right: 0, left: -20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={50} tick={{fontSize: 10, fill: '#64748b'}} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} allowDecimals={false} />
                          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#f1f5f9' }} />
                          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (<div className="h-64 flex items-center justify-center text-slate-400 flex-col"><FileText className="w-8 h-8 mb-2 opacity-50" /><span>ไม่พบข้อมูลตามเงื่อนไข</span></div>)}
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center"><PieChart className="w-5 h-5 mr-2 text-slate-500" />สัดส่วนประเภทคดี</h3>
                  {stats.typeChartData.length > 0 ? (
                    <>
                      <div className="h-64 sm:h-80 flex justify-center w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={stats.typeChartData} cx="50%" cy="50%" innerRadius="45%" outerRadius="70%" paddingAngle={2} dataKey="value" stroke="none">
                              {stats.typeChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-2">{stats.typeChartData.map((entry, index) => (<div key={index} className="flex items-center text-[10px] sm:text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full border border-slate-100"><div className="w-2 h-2 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div><span className="truncate max-w-[100px]">{entry.name}</span><span className="font-semibold ml-1">({entry.value})</span></div>))}</div>
                    </>
                  ) : (<div className="h-64 flex items-center justify-center text-slate-400 flex-col"><FileText className="w-8 h-8 mb-2 opacity-50" /><span>ไม่พบข้อมูลตามเงื่อนไข</span></div>)}
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
              <div className="flex items-center justify-between mb-4"><div><h3 className="text-lg font-bold text-slate-800 flex items-center"><MapIcon className="w-5 h-5 mr-2 text-blue-600" />แผนที่สถานการณ์ (GIS)</h3><p className="text-sm text-slate-500">แสดงพิกัดภูมิสารสนเทศบนแผนที่ฐาน (QGIS/OpenStreetMap Style)</p></div></div>
              <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
                <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm p-3 rounded shadow-lg border border-slate-300 z-[1000] max-w-[200px]"><h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center border-b border-slate-200 pb-1"><Layers className="w-3 h-3 mr-1" /> สัญลักษณ์หน่วย (กก.)</h4><div className="grid grid-cols-2 gap-x-3 gap-y-1.5">{Object.entries(UNIT_COLORS).map(([kk, color]) => (<div key={kk} className="flex items-center text-[11px] text-slate-600"><span className="w-3 h-3 rounded-full mr-2 inline-block shadow-sm border border-white" style={{ backgroundColor: color }}></span>กก.{kk}</div>))}</div></div>
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
      
      {/* ==================================================================================
          FIXED PRINT VIEW (Hidden by z-index, not display:none) - แก้ปัญหาหน้าขาว
          ================================================================================== */}
      <div id="print-view" 
            style={{ 
              position: 'fixed', // ใช้ fixed ให้มันลอยอยู่บนสุด
              top: 0,
              left: 0,
              
              // เทคนิค: ถ้า Export ให้ Z-Index -50 (อยู่ข้างหลังสุด) แต่ Opacity 1 (มองเห็นได้โดย html2canvas)
              // ถ้าไม่ได้ Export ให้ซ่อนไปเลย (-9999)
              // วิธีนี้ Browser จะ Render หน้านี้รอไว้ตลอดเวลา ทำให้จับภาพได้ทันที
              zIndex: isExporting ? -50 : -9999, 
              opacity: 1, 
              
              width: '1123px', // A4 Landscape pixel
              height: '794px', 
              
              backgroundColor: 'white',
              padding: '20px',
              fontFamily: "'Sarabun', sans-serif",
              color: '#000',
              overflow: 'hidden',
              visibility: 'visible'
            }}>
        
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '15px', height: '15mm' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src={LOGO_BASE64} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>รายงานสรุปสถานการณ์ประจำวัน</h1>
              <p style={{ fontSize: '14px', color: '#555', margin: 0 }}>กองบังคับการตำรวจทางหลวง (Highway Police)</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#777', margin: 0 }}>ข้อมูล ณ วันที่</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p style={{ fontSize: '12px', color: '#777', margin: 0 }}>เงื่อนไข: {filters.year || 'ทุกปี'} | กก.{filters.unit_kk || 'ทั้งหมด'}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '15px', height: '20mm' }}>
            {[
              { t: 'จับกุมรวม', v: stats.totalCases, c: '#eff6ff', ct: '#1d4ed8' },
              { t: 'ยาเสพติด', v: stats.drugCases, c: '#fef2f2', ct: '#b91c1c' },
              { t: 'อาวุธปืน', v: stats.weaponCases, c: '#fff7ed', ct: '#c2410c' },
              { t: 'รถบรรทุก', v: stats.heavyTruckCases, c: '#faf5ff', ct: '#7e22ce' },
              { t: 'หมายจับ', v: stats.warrantCases, c: '#eef2ff', ct: '#4338ca' },
              { t: 'หน่วยงาน', v: stats.uniqueUnits, c: '#f0fdf4', ct: '#15803d' }
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, backgroundColor: s.c, borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ fontSize: '12px', color: s.ct, fontWeight: 'bold', margin: 0 }}>{s.t}</p>
                <p style={{ fontSize: '24px', color: '#000', fontWeight: 'bold', margin: 0, lineHeight: 1 }}>{s.v}</p>
              </div>
            ))}
        </div>

        {/* Content Layout */}
        <div style={{ display: 'flex', gap: '15px', height: '135mm' }}>
            
            {/* Left: Map (35%) - Using New SVG Path & isPrintMode=true */}
            <div style={{ width: '35%', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden', position: 'relative', backgroundColor: '#f9fafb' }}>
              {/* 🚫 REMOVED: ลบป้ายชื่อแผนที่ออกตามคำขอ */}
              <SimpleMapVisualization data={filteredData} onSelectCase={() => {}} isPrintMode={true} />
            </div>

            {/* Middle: Charts (25%) */}
            <div style={{ width: '25%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 5px 0', width: '100%' }}>สัดส่วนคดี</p>
                  <div style={{ width: '100%', flex: 1, minHeight: '0' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={stats.typeChartData} cx="50%" cy="50%" outerRadius={40} dataKey="value">
                            {stats.typeChartData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ width: '100%', fontSize: '10px', marginTop: '5px' }}>
                    {stats.typeChartData.slice(0,3).map((e,i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', padding: '2px 0' }}>
                        <span style={{color: '#555'}}>{e.name}</span><span style={{fontWeight:'bold'}}>{e.value}</span>
                      </div>
                    ))}
                  </div>
              </div>
              <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 10px 0' }}>สถิติแยกหน่วย (Top 5)</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {stats.unitChartData.slice(0,4).map((u, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', fontSize: '10px' }}>
                        <span style={{ width: '30px', fontWeight: 'bold', color: '#555' }}>{u.name}</span>
                        <div style={{ flex: 1, height: '6px', backgroundColor: '#f3f4f6', borderRadius: '3px', margin: '0 8px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', backgroundColor: '#2563eb', width: `${(u.value / stats.totalCases) * 100}%` }}></div>
                        </div>
                        <span style={{ fontWeight: 'bold' }}>{u.value}</span>
                      </div>
                    ))}
                  </div>
              </div>
            </div>

            {/* Right: Table (40%) */}
            <div style={{ width: '40%', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ backgroundColor: '#f3f4f6', padding: '8px 12px', borderBottom: '1px solid #d1d5db', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>รายการจับกุมล่าสุด</span>
                <span style={{ fontSize: '10px', color: '#666' }}>*10 รายการแรก</span>
              </div>
              <div style={{ flex: 1, padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '6px 8px', fontSize: '10px', textAlign: 'left', color: '#374151' }}>วัน/เวลา</th>
                      <th style={{ padding: '6px 8px', fontSize: '10px', textAlign: 'left', color: '#374151' }}>หน่วย</th>
                      <th style={{ padding: '6px 8px', fontSize: '10px', textAlign: 'left', color: '#374151' }}>ข้อหา</th>
                      <th style={{ padding: '6px 8px', fontSize: '10px', textAlign: 'left', color: '#374151' }}>สถานที่</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice(0, 10).map((item, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '6px 8px', fontSize: '9px', verticalAlign: 'top' }}>{item.date_capture}<br/><span style={{color:'#9ca3af'}}>{item.time_capture}</span></td>
                        <td style={{ padding: '6px 8px', fontSize: '9px', verticalAlign: 'top' }}>กก.{item.unit_kk}<br/>ส.ทล.{item.unit_s_tl}</td>
                        <td style={{ padding: '6px 8px', fontSize: '9px', verticalAlign: 'top', fontWeight: '600', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.charge}</td>
                        <td style={{ padding: '6px 8px', fontSize: '9px', verticalAlign: 'top', maxWidth: '80px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
        
        {/* Footer */}
        <div style={{ position: 'absolute', bottom: '5mm', left: 0, width: '100%', textAlign: 'center', fontSize: '9px', color: '#9ca3af' }}>
            TRAFFIC OPERATIONS DATABASE SYSTEM | GENERATED BY HIGHWAY POLICE DASHBOARD
        </div>
      </div>

    </div>
  );
}