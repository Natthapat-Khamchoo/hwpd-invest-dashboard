import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import html2pdf from 'html2pdf.js';
import { 
  LayoutDashboard, Table as TableIcon, Search, Filter, Siren, Users, 
  FileText, Calendar, ChevronRight, X, Menu, BarChart3, Map as MapIcon, 
  Building2, ChevronLeft, AlertTriangle, Truck, FileWarning, Download, 
  Activity, Radar, MousePointerClick, RefreshCw, CalendarDays, Clock,
  Tags
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LabelList
} from 'recharts';

// --- Configuration ---
const UNIT_HIERARCHY = { "1": 6, "2": 6, "3": 5, "4": 5, "5": 6, "6": 6, "7": 5, "8": 4 };

// 🎨 PALETTE & COLORS
const FALLBACK_PALETTE = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#84cc16'];
const UNIT_COLORS_MAP = { "1": "#ef4444", "2": "#f97316", "3": "#eab308", "4": "#22c55e", "5": "#06b6d4", "6": "#3b82f6", "7": "#a855f7", "8": "#ec4899" };

// 🎨 Keyword สำหรับเลือกสี (ใช้จับคู่กับชื่อกลุ่มที่แปลงแล้ว)
const CRIME_KEYWORDS = [
  { keys: ["ยาเสพติด", "ยาบ้า", "ไอซ์"], color: "#ef4444" },
  { keys: ["อาวุธ", "ปืน", "ระเบิด"], color: "#f97316" },
  { keys: ["รถบรรทุก", "น้ำหนัก", "บรรทุก"], color: "#a855f7" },
  { keys: ["หมายจับ", "ตามหมาย"], color: "#3b82f6" },
  { keys: ["เมา", "แอลกอฮอล์"], color: "#eab308" },
  { keys: ["จราจร", "ป้าย", "ใบขับขี่", "ความเร็ว"], color: "#22c55e" },
  { keys: ["ทางหลวง", "สอบสวน"], color: "#06b6d4" },
  { keys: ["ต่างด้าว", "หลบหนีเข้าเมือง"], color: "#ec4899" },
  { keys: ["ลักทรัพย์", "โจรกรรม"], color: "#64748b" }
];

// 🗂️ CONFIG: การจัดกลุ่มชื่อคดี (Normalize Data)
// ระบบจะเช็ค keywords ถ้าเจอคำไหน จะแปลงชื่อคดีเป็น 'name' ทันที
const TOPIC_GROUPING = [
  { name: "ยาเสพติด", keywords: ["ยาเสพติด", "ยาบ้า", "ไอซ์", "เมท", "ครอบครอง"] },
  { name: "อาวุธปืน/วัตถุระเบิด", keywords: ["อาวุธ", "ปืน", "ระเบิด", "กระสุน"] },
  { name: "รถบรรทุก/น้ำหนัก", keywords: ["รถบรรทุก", "น้ำหนัก", "บรรทุก"] },
  { name: "บุคคลตามหมายจับ", keywords: ["หมายจับ", "ตามหมาย"] }, 
  { name: "เมาแล้วขับ", keywords: ["เมา", "แอลกอฮอล์", "สุรา"] },
  { name: "จราจร/ขนส่ง", keywords: ["จราจร", "ใบขับขี่", "ป้าย", "ความเร็ว", "ขนส่ง", "สวมทะเบียน"] },
  { name: "ต่างด้าว/ตม.", keywords: ["ต่างด้าว", "หลบหนีเข้าเมือง", "passport", "พาสปอร์ต"] },
  { name: "ช่วยเหลือประชาชน/ทางหลวง", keywords: ["ทางหลวง", "สอบสวน", "ช่วยเหลือ"] }
];

const LOGO_URL = "https://hwpd.cib.go.th/backend/uploads/logo500_0d7ce0273a.png";

const DATE_RANGES = [
  { label: 'วันนี้ (Today)', value: 'today' },
  { label: 'เมื่อวาน (Yesterday)', value: 'yesterday' },
  { label: '7 วันย้อนหลัง', value: '7days' },
  { label: '30 วันย้อนหลัง', value: '30days' },
  { label: 'เดือนนี้ (This Month)', value: 'this_month' },
  { label: 'ทั้งหมด (All Time)', value: 'all' },
  { label: 'กำหนดเอง (Custom)', value: 'custom' }
];

// --- Helpers ---
const getConsistentColor = (str) => {
  if (!str) return '#94a3b8';
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
};

const getUnitColor = (name) => {
  const match = name.match(/(\d+)/); 
  if (match) return UNIT_COLORS_MAP[match[0]] || getConsistentColor(name);
  return getConsistentColor(name);
};

const getCrimeColor = (topic) => {
  if (!topic) return '#94a3b8';
  const lowerTopic = topic.toLowerCase();
  for (const group of CRIME_KEYWORDS) {
    if (group.keys.some(k => lowerTopic.includes(k))) return group.color;
  }
  return getConsistentColor(topic);
};

// 🔥 ฟังก์ชัน Normalize หัวข้อเรื่อง (แก้ปัญหาพิมพ์มาไม่เหมือนกัน)
const normalizeTopic = (rawTopic) => {
  if (!rawTopic) return "อื่นๆ";
  const str = rawTopic.trim();
  // วนลูปเช็ค Keyword จาก Config
  for (const group of TOPIC_GROUPING) {
    if (group.keywords.some(k => str.includes(k))) {
      return group.name;
    }
  }
  return str; // ถ้าไม่เข้ากลุ่มไหนเลย ให้ใช้ชื่อเดิม
};

// 🔥 ฟังก์ชันแปลงวันที่ (Robust Version)
const parseDateRobust = (dateStr) => {
  if (!dateStr) return { dateObj: null, thaiYear: '' };

  // ตัดเวลาทิ้ง (เผื่อมาเป็น 2024-12-10 14:30)
  const cleanDateStr = dateStr.trim().split(' ')[0];
  
  let day, month, year;
  let parts = [];

  if (cleanDateStr.includes('-')) {
    parts = cleanDateStr.split('-'); // YYYY-MM-DD
  } else if (cleanDateStr.includes('/')) {
    parts = cleanDateStr.split('/'); // DD/MM/YYYY
  } else {
    return { dateObj: null, thaiYear: '' };
  }

  if (parts.length !== 3) return { dateObj: null, thaiYear: '' };

  const v1 = parseInt(parts[0], 10);
  const v2 = parseInt(parts[1], 10);
  const v3 = parseInt(parts[2], 10);

  // เดาว่าอันไหนคือปี (เลขมากกว่า 1000)
  if (v1 > 1000) { year = v1; month = v2 - 1; day = v3; } // YYYY-MM-DD
  else if (v3 > 1000) { day = v1; month = v2 - 1; year = v3; } // DD-MM-YYYY
  else return { dateObj: null, thaiYear: '' };

  if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
    const isThaiYearInput = year > 2400; 
    const adYear = isThaiYearInput ? year - 543 : year; 
    
    const dateObj = new Date(adYear, month, day);
    dateObj.setHours(0, 0, 0, 0); // Reset เวลาเป็นเที่ยงคืนเป๊ะ
    
    // เช็คว่าวันที่ถูกต้องจริงไหม
    if (isNaN(dateObj.getTime())) return { dateObj: null, thaiYear: '' };

    const thYear = isThaiYearInput ? year : year + 543; 
    return { dateObj, thaiYear: thYear.toString() };
  }
  return { dateObj: null, thaiYear: '' };
};

// --- Sub-Components ---
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
        <svg viewBox="0 0 320 600" className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.6 }}>
             <path d="M152.9,8.6 L162.4,1.5 L175.0,13.0 L188.0,14.1 L194.1,21.8 L185.4,31.3 L178.2,30.7 L170.0,42.8 L175.5,54.3 L187.0,52.1 L199.0,60.3 L207.7,58.1 L216.4,66.3 L214.7,78.3 L228.4,79.5 L241.5,89.2 L236.6,100.2 L226.7,100.7 L223.4,111.1 L239.3,117.6 L238.7,128.0 L227.2,138.4 L218.5,137.3 L210.3,144.4 L199.4,143.4 L189.0,153.2 L174.2,154.8 L166.0,161.9 L166.0,170.6 L175.8,178.3 L189.0,178.3 L198.2,185.4 L218.4,185.4 L227.7,191.9 L236.4,202.9 L243.5,203.9 L254.4,198.4 L268.1,198.4 L276.3,206.1 L288.3,206.1 L297.0,212.6 L305.7,211.5 L311.2,219.2 L318.8,218.1 L324.8,225.7 L338.5,226.8 L345.0,236.6 L344.5,247.0 L336.3,253.0 L334.7,263.9 L342.8,270.4 L341.2,281.4 L334.1,289.6 L337.4,299.9 L330.3,310.9 L319.9,314.7 L311.7,313.0 L306.3,319.6 L297.0,319.6 L292.6,328.9 L282.8,330.0 L275.1,336.5 L267.5,343.6 L258.8,342.5 L251.1,337.1 L244.0,342.5 L234.2,342.5 L222.7,347.4 L213.4,347.4 L204.7,352.9 L197.6,361.1 L191.6,369.3 L183.4,370.9 L174.7,377.5 L165.4,385.1 L157.2,387.8 L151.2,392.2 L146.8,399.3 L145.8,409.7 L149.0,420.1 L152.9,430.4 L154.5,441.9 L157.8,452.3 L161.0,459.9 L165.4,469.2 L167.0,480.7 L167.0,491.6 L162.7,499.8 L155.0,504.7 L148.0,508.5 L141.4,514.0 L135.9,522.7 L132.7,533.1 L131.6,543.4 L129.4,553.3 L122.9,559.3 L113.6,558.7 L107.0,553.8 L101.6,547.8 L96.1,540.2 L90.7,534.7 L86.3,528.2 L83.0,520.5 L80.8,511.2 L79.8,500.9 L79.8,490.5 L83.0,480.7 L87.4,472.5 L91.8,464.3 L95.0,455.6 L97.2,445.2 L97.2,434.8 L94.0,426.1 L89.6,419.0 L84.1,412.5 L77.6,407.0 L71.0,402.1 L65.6,396.1 L61.2,388.4 L58.0,379.2 L56.9,369.9 L59.0,360.0 L62.3,350.8 L64.5,342.0 L63.4,332.7 L59.0,325.1 L52.5,320.7 L43.8,319.6 L36.1,315.2 L29.6,308.7 L25.2,301.1 L23.0,291.8 L23.0,282.0 L27.4,273.8 L33.9,267.2 L39.4,259.6 L42.6,250.8 L43.7,241.0 L41.6,231.2 L37.2,223.0 L30.6,217.5 L23.0,214.3 L15.3,214.3 L7.7,216.4 L0.0,219.7 L152.9,8.6 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
        </svg>
        {data.filter(d => d.lat && d.long).map((item) => {
          const lat = parseFloat(item.lat); const long = parseFloat(item.long);
          if(lat < MIN_LAT || lat > MAX_LAT || long < MIN_LONG || long > MAX_LONG) return null;
          const uColor = getUnitColor(item.unit_kk);
          return (
            <div key={item.id} className="absolute rounded-full cursor-pointer hover:scale-150 transition-transform"
              style={{ left: `${getX(long)}%`, top: `${getY(lat)}%`, width: '8px', height: '8px', backgroundColor: uColor, boxShadow: `0 0 8px ${uColor}`, transform: 'translate(-50%, -50%)', zIndex: 10 }}
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
      const color = getUnitColor(item.unit_kk);
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCase, setSelectedCase] = useState(null);
  const [mapError, setMapError] = useState(false); 
  const handleMapError = useCallback(() => setMapError(true), []);
  const [isExporting, setIsExporting] = useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true); 
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Helper for formatting date input (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // 🔥 Initial State: Set default to TODAY (00:00 - 23:59)
  const [filters, setFilters] = useState(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const endOfToday = new Date();
    endOfToday.setHours(23,59,59,999);

    return {
      search: '', 
      period: 'today', // Default Period
      rangeStart: today, // Filter Start Date (Object)
      rangeEnd: endOfToday, // Filter End Date (Object)
      unit_kk: '', 
      unit_s_tl: '', 
      topic: '', // Crime Type Filter
      charge: '' 
    };
  });
  
  const [localSearch, setLocalSearch] = useState('');

  // Update logic when Period changes
  const handlePeriodChange = (period) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    // Reset hours for accurate daily comparison
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    if (period === 'today') {
        // Default
    } else if (period === 'yesterday') {
        start.setDate(now.getDate() - 1);
        end.setDate(now.getDate() - 1);
    } else if (period === '7days') {
        start.setDate(now.getDate() - 7);
    } else if (period === '30days') {
        start.setDate(now.getDate() - 30);
    } else if (period === 'this_month') {
        start.setDate(1); // 1st of this month
    } else if (period === 'all') {
        start = null;
        end = null;
    } else if (period === 'custom') {
        start = filters.rangeStart || start;
        end = filters.rangeEnd || end;
    }

    setFilters(prev => ({ ...prev, period, rangeStart: start, rangeEnd: end }));
  };

  const handleCustomDateChange = (type, val) => {
    if (!val) return;
    const d = new Date(val);
    if (type === 'start') {
        d.setHours(0,0,0,0);
        setFilters(prev => ({ ...prev, rangeStart: d, period: 'custom' }));
    } else {
        d.setHours(23,59,59,999);
        setFilters(prev => ({ ...prev, rangeEnd: d, period: 'custom' }));
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: localSearch }));
    }, 500); 
    return () => clearTimeout(delayDebounceFn);
  }, [localSearch]);

  useEffect(() => {
    const fetchData = () => {
      const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT7T6Y-YtzckfCVfL1revX_qX4J90QMF3oVZhI54bKwGxCcDS4h-YjlSHrAjZu3_X5Ie_ENzuAXhMN5/pub?output=csv';
      Papa.parse(GOOGLE_SHEET_CSV_URL, {
        download: true, header: true,
        complete: (results) => {
          const formattedData = results.data
            .filter(item => item['หัวข้อ'] && item['กก.'])
            .map((item, index) => {
                const rawDate = item['วันที่'] ? item['วันที่'].trim() : '';
                const { dateObj, thaiYear } = parseDateRobust(rawDate);
                
                // ดึงหัวข้อดิบ และทำการ Normalize
                const rawTopic = item['หัวข้อ']?.toString().trim() || '';
                const normalizedTopic = normalizeTopic(rawTopic);

                return {
                    id: index + 1,
                    timestamp: item['Timestamp'] || new Date().toISOString(),
                    unit_kk: item['กก.']?.toString().trim() || '',
                    unit_s_tl: item['ส.ทล.']?.toString().trim() || '',
                    
                    // ✅ ใช้ค่าที่แปลงกลุ่มแล้ว
                    topic: normalizedTopic,
                    original_topic: rawTopic, // เก็บค่าเดิมไว้ถ้าอยากดู

                    captured_by: item['จับโดย'] || '',
                    arrest_type: item['ประเภทการจับกุม'] || '',
                    date_capture: rawDate, 
                    date_obj: dateObj,     
                    year: thaiYear,
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
                };
            });
          setData(formattedData); setLoading(false);
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
        margin: 0,
        filename: `รายงานสรุป_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 1123, windowHeight: 794 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      html2pdf().set(opt).from(element).save()
        .then(() => setIsExporting(false))
        .catch(err => { console.error("PDF Failed:", err); setIsExporting(false); });
    }, 1000); 
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
    return { charges };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const searchMatch = !filters.search || (item.charge && item.charge.toLowerCase().includes(filters.search.toLowerCase())) || (item.suspect_name && item.suspect_name.toLowerCase().includes(filters.search.toLowerCase())) || (item.location && item.location.toLowerCase().includes(filters.search.toLowerCase())) || (item.topic && item.topic.toLowerCase().includes(filters.search.toLowerCase()));
      const kkMatch = !filters.unit_kk || String(item.unit_kk) === String(filters.unit_kk);
      const stlMatch = !filters.unit_s_tl || String(item.unit_s_tl) === String(filters.unit_s_tl);
      
      // 🔥 Logic กรองประเภทคดี (topic)
      const topicMatch = !filters.topic || item.topic === filters.topic; 
      
      // 🔥 Date Range Filtering Logic
      let dateMatch = true;
      if (item.date_obj) {
          // If All Time, skip check
          if (filters.period !== 'all') {
              if (filters.rangeStart && item.date_obj < filters.rangeStart) dateMatch = false;
              if (filters.rangeEnd && item.date_obj > filters.rangeEnd) dateMatch = false;
          }
      } else {
          // If item has no valid date, exclude it unless "All Time"
          if (filters.period !== 'all') dateMatch = false;
      }

      return searchMatch && kkMatch && stlMatch && topicMatch && dateMatch;
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

  const clearFilters = () => { 
      // Reset to Today default
      const today = new Date(); today.setHours(0,0,0,0);
      const endOfToday = new Date(); endOfToday.setHours(23,59,59,999);
      
      setFilters({ 
          search: '', period: 'today', rangeStart: today, rangeEnd: endOfToday,
          unit_kk: '', unit_s_tl: '', topic: '', charge: '' 
      }); 
      setLocalSearch(''); 
  };

  const onUnitBarClick = (data) => {
      if (!data || !data.activePayload) return;
      const { name } = data.activePayload[0].payload; 
      if (name.includes("กก.")) handleFilterChange('unit_kk', name.replace("กก.", "").trim());
      else if (name.includes("ส.ทล.")) handleFilterChange('unit_s_tl', name.replace("ส.ทล.", "").trim());
  };

  const onPieClick = (data) => { if (data && data.name) handleFilterChange('topic', data.name); };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-400 mb-4"></div></div>;

  return (
    <div className="flex h-screen bg-[#0f172a] font-sans text-slate-100 overflow-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
        .digital-bg { background-color: #0f172a; background-image: radial-gradient(circle at 50% 50%, #1e293b 1px, transparent 1px); background-size: 30px 30px; }
        ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #1e293b; } ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
      `}</style>
      <div className="absolute inset-0 digital-bg z-0 pointer-events-none opacity-50"></div>

      {isExporting && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center backdrop-blur-md">
           <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-400 mb-4"></div>
           <p className="text-white text-lg font-semibold animate-pulse">กำลังจัดเตรียมเอกสาร PDF...</p>
           <p className="text-slate-400 text-sm mt-2">กรุณารอสักครู่ (Please wait)</p>
        </div>
      )}

      {mobileSidebarOpen && (<div className="fixed inset-0 bg-black/80 z-20 lg:hidden backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />)}
      
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
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0 z-10">
        <header className="bg-slate-900/80 backdrop-blur border-b border-slate-700 px-4 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 text-slate-400 hover:bg-slate-800 rounded-lg"><Menu className="w-6 h-6" /></button>
            <button onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)} className="hidden lg:block p-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">{desktopSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
            <h1 className="text-base sm:text-xl font-bold text-white tracking-wide uppercase">{activeTab === 'dashboard' ? 'Command Dashboard' : activeTab === 'list' ? 'Arrest Database' : 'GIS Tactical Map'}</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden md:flex text-xs text-slate-400 items-center mr-2 bg-slate-800 px-2 py-1 rounded border border-slate-700"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>Live</div>
            <button onClick={clearFilters} className="bg-slate-700 hover:bg-red-500/80 hover:text-white text-slate-300 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center shadow-sm border border-slate-600 transition-all"><RefreshCw className="w-4 h-4 mr-1" /> รีเซ็ต</button>
            
            {/* 🔴 COMMENT OUT PDF BUTTON
            {activeTab === 'dashboard' && (<button onClick={handleExportPDF} className="bg-red-600/90 hover:bg-red-500 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center shadow-lg hover:shadow-red-500/20 transition-all border border-red-400/30"><FileText className="w-4 h-4 mr-1" /> PDF</button>)}
            */}

            <button onClick={handleExportCSV} className="bg-emerald-600/90 hover:bg-emerald-500 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center shadow-lg hover:shadow-emerald-500/20 transition-all border border-emerald-400/30"><Download className="w-4 h-4 mr-1" /> CSV</button>
            <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={`flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${showFilterPanel ? 'bg-yellow-500 text-slate-900 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700'}`}><Filter className="w-4 h-4" /><span className="hidden sm:inline">ตัวกรอง</span></button>
          </div>
        </header>

        {showFilterPanel && (
          <div className="bg-slate-800 border-b border-slate-700 p-4 animate-in slide-in-from-top-2 duration-200 shadow-xl z-20 relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="sm:col-span-2 lg:col-span-2"><label className="block text-xs font-medium text-slate-400 mb-1">ค้นหา</label><input type="text" className="w-full pl-3 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500" placeholder="ชื่อ/ข้อหา/สถานที่..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} /></div>
              
              <div><label className="block text-xs font-medium text-slate-400 mb-1">กก.</label><select className="w-full pl-2 pr-2 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500" value={filters.unit_kk} onChange={(e) => handleFilterChange('unit_kk', e.target.value)}><option value="">ทั้งหมด</option>{Object.keys(UNIT_HIERARCHY).map(kk => <option key={kk} value={kk}>กก.{kk}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1">ส.ทล.</label><select className="w-full pl-2 pr-2 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500" value={filters.unit_s_tl} onChange={(e) => handleFilterChange('unit_s_tl', e.target.value)} disabled={!filters.unit_kk}><option value="">{filters.unit_kk ? 'ทั้งหมด' : 'เลือก กก.'}</option>{filters.unit_kk && Array.from({ length: UNIT_HIERARCHY[filters.unit_kk] }, (_, i) => i + 1).map(num => <option key={num} value={num}>ส.ทล.{num}</option>)}</select></div>
              
              {/* 🔥 NEW: CRIME TYPE DROPDOWN */}
              <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center"><Tags className="w-3 h-3 mr-1"/>ประเภทคดี</label>
                  <select className="w-full pl-2 pr-2 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500" value={filters.topic} onChange={(e) => handleFilterChange('topic', e.target.value)}>
                      <option value="">ทั้งหมด</option>
                      {filterOptions.charges.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
              </div>

              {/* 🔥 NEW: DATE PERIOD SELECTOR */}
              <div className="sm:col-span-2 bg-blue-900/20 p-2 rounded-lg border border-blue-500/20">
                  <label className="block text-xs font-bold text-blue-400 mb-1 flex items-center"><Clock className="w-3 h-3 mr-1"/>ช่วงเวลา (Period)</label>
                  <select className="w-full pl-2 pr-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={filters.period} onChange={(e) => handlePeriodChange(e.target.value)}>
                      {DATE_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
              </div>

              {/* 🔥 NEW: CUSTOM DATE PICKERS (SHOW IF CUSTOM) */}
              {filters.period === 'custom' && (
                <>
                    <div className="sm:col-span-1">
                        <label className="block text-xs font-medium text-slate-400 mb-1">เริ่ม</label>
                        <input type="date" className="w-full pl-2 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500" value={formatDateForInput(filters.rangeStart)} onChange={(e) => handleCustomDateChange('start', e.target.value)} />
                    </div>
                    <div className="sm:col-span-1">
                        <label className="block text-xs font-medium text-slate-400 mb-1">สิ้นสุด</label>
                        <input type="date" className="w-full pl-2 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500" value={formatDateForInput(filters.rangeEnd)} onChange={(e) => handleCustomDateChange('end', e.target.value)} />
                    </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
          {activeTab === 'dashboard' && (
            <div className="p-2 sm:p-4 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <StatCard title="ผลการจับกุมรวม" value={stats.totalCases} icon={Activity} colorClass="text-blue-400 bg-blue-500" delay={0} />
                <StatCard title="คดียาเสพติด" value={stats.drugCases} icon={Siren} colorClass="text-red-400 bg-red-500" delay={100} />
                <StatCard title="คดีอาวุธปืน" value={stats.weaponCases} icon={Radar} colorClass="text-orange-400 bg-orange-500" delay={200} />
                <StatCard title="รถบรรทุกหนัก" value={stats.heavyTruckCases} icon={Truck} colorClass="text-purple-400 bg-purple-500" delay={300} />
                <StatCard title="บุคคลตามหมายจับ" value={stats.warrantCases} icon={FileWarning} colorClass="text-pink-400 bg-pink-500" delay={400} />
                <StatCard title="หน่วยที่รายงาน" value={stats.uniqueUnits} icon={Building2} colorClass="text-green-400 bg-green-500" delay={500} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-slate-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/50">
                  <div className="flex justify-between items-start mb-6">
                      <h3 className="text-base sm:text-lg font-bold flex items-center text-white"><BarChart3 className="w-5 h-5 mr-2 text-yellow-400" />{stats.unitChartTitle}</h3>
                      <div className="text-xs text-yellow-500/80 flex items-center bg-yellow-500/10 px-2 py-1 rounded"><MousePointerClick className="w-3 h-3 mr-1" /> กดกราฟเพื่อกรอง</div>
                  </div>
                  {stats.unitChartData.length > 0 ? (
                    <div className="h-72 sm:h-96 w-full cursor-pointer">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.unitChartData} margin={{ top: 10, right: 0, left: -20, bottom: 20 }} onClick={onUnitBarClick}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                          <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={60} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={{ stroke: '#475569' }} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} allowDecimals={false} />
                          <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                             {stats.unitChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={getUnitColor(entry.name)} className="hover:opacity-80 transition-opacity" />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (<div className="h-64 flex items-center justify-center text-slate-500 flex-col"><FileText className="w-8 h-8 mb-2 opacity-50" /><span>ไม่พบข้อมูลตามเงื่อนไข</span></div>)}
                </div>

                <div className="bg-slate-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/50">
                  <div className="flex justify-between items-start mb-6">
                      <h3 className="text-base sm:text-lg font-bold flex items-center text-white"><PieChart className="w-5 h-5 mr-2 text-yellow-400" />สัดส่วนประเภทคดี</h3>
                      <div className="text-xs text-yellow-500/80 flex items-center bg-yellow-500/10 px-2 py-1 rounded"><MousePointerClick className="w-3 h-3 mr-1" /> กดกราฟเพื่อกรอง</div>
                  </div>
                  {stats.typeChartData.length > 0 ? (
                    <>
                      <div className="h-64 sm:h-80 flex justify-center w-full cursor-pointer">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={stats.typeChartData} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={4} dataKey="value" stroke="none" onClick={onPieClick}>
                              {stats.typeChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={getCrimeColor(entry.name)} className="hover:opacity-80 transition-opacity" />)}
                            </Pie>
                            <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4">
                          {stats.typeChartData.map((entry, index) => (
                              <div key={index} className="flex items-center text-[10px] sm:text-xs text-slate-300 bg-slate-900/50 px-2 py-1 rounded-full border border-slate-700">
                                  <div className="w-2 h-2 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: getCrimeColor(entry.name) }}></div>
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
                          <td className="p-4 text-sm text-white font-medium max-w-xs truncate" title={item.charge}><div className="mb-1 text-xs uppercase tracking-wide inline-block px-1.5 py-0.5 rounded" style={{ backgroundColor: `${getCrimeColor(item.topic)}30`, color: getCrimeColor(item.topic) }}>{item.topic}</div><div>{item.charge}</div></td>
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
               <div className="flex-1 bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden relative">
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
                <div><h3 className="text-sm font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-3 flex items-center"><Calendar className="w-4 h-4 mr-2 text-yellow-500" />ข้อมูลเหตุการณ์</h3><dl className="space-y-3 text-sm"><div><dt className="text-slate-500 text-xs">วัน/เวลา</dt><dd className="text-slate-200 font-medium">{selectedCase.date_capture} เวลา {selectedCase.time_capture} น.</dd></div><div><dt className="text-slate-500 text-xs">สถานที่</dt><dd className="text-slate-200">{selectedCase.location}</dd></div><div><dt className="text-slate-500 text-xs">หัวข้อเรื่อง</dt><dd className="inline-block px-2 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: getCrimeColor(selectedCase.topic) }}>{selectedCase.topic}</dd></div></dl></div>
                <div><h3 className="text-sm font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-3 flex items-center"><Users className="w-4 h-4 mr-2 text-yellow-500" />ข้อมูลผู้ต้องหา</h3><dl className="space-y-3 text-sm"><div><dt className="text-slate-500 text-xs">ชื่อ-สกุล</dt><dd className="text-slate-200 font-medium">{selectedCase.suspect_name}</dd></div><div><dt className="text-slate-500 text-xs">ข้อหา</dt><dd className="text-slate-200">{selectedCase.charge}</dd></div></dl></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 🔴 COMMENT OUT PRINT VIEW (FIXED) 
      <div id="print-view" 
           style={{ 
             position: 'fixed', top: 0, left: isExporting ? 0 : '-9999px', zIndex: isExporting ? 9999 : -1,
             width: '1123px', height: '794px', backgroundColor: 'white', padding: '30px',
             fontFamily: "'Sarabun', sans-serif", color: '#000', visibility: 'visible'
           }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1e293b', paddingBottom: '15px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <img src={LOGO_URL} alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#1e293b' }}>รายงานสรุปผลการปฏิบัติงาน</h1>
              <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>กองบังคับการตำรวจทางหลวง (Highway Police Division)</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Report Date</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>{new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '5px' }}>
               {filters.period === 'all' ? 'ข้อมูลทั้งหมด (All Time)' : 
                filters.period === 'today' ? `ข้อมูลประจำวันที่ ${new Date().toLocaleDateString('th-TH')}` :
                filters.rangeStart ? `ช่วงวันที่ ${filters.rangeStart.toLocaleDateString('th-TH')} - ${filters.rangeEnd.toLocaleDateString('th-TH')}` : 'กำหนดเอง'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '15px', marginBottom: '25px' }}>
             {[{ t: 'จับกุมรวม', v: stats.totalCases, c: '#eff6ff', ct: '#1d4ed8' }, { t: 'ยาเสพติด', v: stats.drugCases, c: '#fef2f2', ct: '#b91c1c' }, { t: 'อาวุธปืน', v: stats.weaponCases, c: '#fff7ed', ct: '#c2410c' }, { t: 'รถบรรทุก', v: stats.heavyTruckCases, c: '#faf5ff', ct: '#7e22ce' }, { t: 'หมายจับ', v: stats.warrantCases, c: '#eef2ff', ct: '#4338ca' }, { t: 'หน่วยงาน', v: stats.uniqueUnits, c: '#f0fdf4', ct: '#15803d' }].map((s, i) => (
               <div key={i} style={{ backgroundColor: s.c, padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                 <div style={{ fontSize: '12px', fontWeight: 'bold', color: s.ct, marginBottom: '5px' }}>{s.t}</div>
                 <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>{s.v}</div>
               </div>
             ))}
        </div>

        <div style={{ display: 'flex', gap: '25px', height: '350px', marginBottom: '20px' }}>
            <div style={{ flex: 1.5, border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
               <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold', color: '#334155' }}>สถิติการจับกุมแยกตามหน่วย</h3>
               <div style={{ width: '100%', height: '280px' }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.unitChartData.slice(0, 10)}>
                       <XAxis dataKey="name" interval={0} fontSize={10} angle={-30} textAnchor="end" />
                       <YAxis fontSize={10} />
                       <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false}>
                         <LabelList dataKey="value" position="top" fontSize={10} fill="#64748b" />
                         {stats.unitChartData.slice(0, 10).map((entry, index) => <Cell key={`cell-${index}`} fill={getUnitColor(entry.name)} />)}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>

            <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
               <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold', color: '#334155' }}>สัดส่วนคดี (Top 5)</h3>
               <div style={{ flex: 1, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.typeChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" isAnimationActive={false}>
                        {stats.typeChartData.map((entry, index) => <Cell key={index} fill={getCrimeColor(entry.name)} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
               </div>
               <div style={{ marginTop: '10px' }}>
                 {stats.typeChartData.slice(0, 5).map((e, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed #f1f5f9', padding: '4px 0' }}>
                       <span style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ width: '8px', height: '8px', backgroundColor: getCrimeColor(e.name), borderRadius: '50%', marginRight: '8px' }}></span>
                          {e.name}
                       </span>
                       <span style={{ fontWeight: 'bold' }}>{e.value}</span>
                    </div>
                 ))}
               </div>
            </div>
        </div>

        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
           <div style={{ backgroundColor: '#f8fafc', padding: '10px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
             <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#334155' }}>รายการจับกุมล่าสุด (Recent Activities)</span>
             <span style={{ fontSize: '12px', color: '#94a3b8' }}>*แสดง 15 รายการล่าสุด</span>
           </div>
           <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
             <thead>
               <tr style={{ backgroundColor: '#fff', color: '#64748b' }}>
                 <th style={{ textAlign: 'left', padding: '10px 20px', borderBottom: '1px solid #f1f5f9', width: '15%' }}>วัน/เวลา</th>
                 <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #f1f5f9', width: '15%' }}>หน่วยงาน</th>
                 <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #f1f5f9', width: '35%' }}>ข้อหา</th>
                 <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #f1f5f9', width: '35%' }}>สถานที่</th>
               </tr>
             </thead>
             <tbody>
               {filteredData.slice(0, 15).map((item, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                     <td style={{ padding: '8px 20px', borderBottom: '1px solid #f1f5f9' }}>{item.date_capture}<br/><span style={{fontSize:'10px', color:'#94a3b8'}}>{item.time_capture}</span></td>
                     <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>กก.{item.unit_kk} ส.ทล.{item.unit_s_tl}</td>
                     <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold', color: '#334155' }}>{item.charge}</td>
                     <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>{item.location}</td>
                  </tr>
               ))}
             </tbody>
           </table>
        </div>
        
        <div style={{ position: 'absolute', bottom: '15px', right: '30px', fontSize: '10px', color: '#cbd5e1' }}>
           Generated by HWPD Command Center System
        </div>
      </div>
      */}
    </div>
  );
}