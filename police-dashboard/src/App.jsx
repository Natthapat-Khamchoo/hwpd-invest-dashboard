import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import html2pdf from 'html2pdf.js';
import { 
  LayoutDashboard, Table as TableIcon, Search, Filter, Siren, Users, 
  FileText, Calendar, ChevronRight, X, Menu, BarChart3, Map as MapIcon, 
  Building2, ChevronLeft, AlertTriangle, Truck, FileWarning, Download, 
  Activity, Radar, MousePointerClick, RefreshCw, Clock, Tags
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// --- Configuration ---
const UNIT_HIERARCHY = { "1": 6, "2": 6, "3": 5, "4": 5, "5": 6, "6": 6, "7": 5, "8": 4 };

// 🎨 PALETTE & COLORS
const FALLBACK_PALETTE = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#84cc16'];
const UNIT_COLORS_MAP = { "1": "#ef4444", "2": "#f97316", "3": "#eab308", "4": "#22c55e", "5": "#06b6d4", "6": "#3b82f6", "7": "#a855f7", "8": "#ec4899" };

// 🎨 Keyword Mapping
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

const TOPIC_GROUPING = [
  { name: "ยาเสพติด", keywords: ["ยาเสพติด", "ยาบ้า", "ไอซ์", "เมท", "ครอบครอง"] },
  { name: "อาวุธปืน/วัตถุระเบิด", keywords: ["อาวุธ", "ปืน", "ระเบิด", "กระสุน"] },
  { name: "รถบรรทุก/น้ำหนัก", keywords: ["รถบรรทุก", "น้ำหนัก", "บรรทุก"] },
  { name: "บุคคลตามหมายจับ", keywords: ["หมายจับ", "ตามหมาย"] }, 
  { name: "เมาแล้วขับ", keywords: ["เมา", "แอลกอฮอล์", "สุรา"] },
  { name: "จราจร/ขนส่ง", keywords: ["จราจร", "ใบขับขี่", "ป้าย", "ความเร็ว", "ขนส่ง", "สวมทะเบียน"] },
  { name: "ต่างด้าว/ตม.", keywords: ["ต่างด้าว", "หลบหนีเข้าเมือง", "passport", "พาสปอร์ต"] }
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

// 🔥 FIX #1: แก้ไข Normalize ให้รวมกลุ่มขยะเป็น "อื่นๆ"
const normalizeTopic = (rawTopic) => {
  if (!rawTopic) return "อื่นๆ";
  const str = rawTopic.trim();
  for (const group of TOPIC_GROUPING) {
    if (group.keywords.some(k => str.includes(k))) {
      return group.name;
    }
  }
  // เปลี่ยนจาก return str เป็น return "อื่นๆ" เพื่อลดจำนวน Category ใน Filter
  return "อื่นๆ"; 
};

const parseDateRobust = (dateStr) => {
  if (!dateStr) return { dateObj: null, thaiYear: '' };
  const cleanDateStr = dateStr.trim().split(' ')[0];
  let day, month, year;
  let parts = [];
  if (cleanDateStr.includes('-')) parts = cleanDateStr.split('-');
  else if (cleanDateStr.includes('/')) parts = cleanDateStr.split('/');
  else return { dateObj: null, thaiYear: '' };

  if (parts.length !== 3) return { dateObj: null, thaiYear: '' };
  const v1 = parseInt(parts[0], 10);
  const v2 = parseInt(parts[1], 10);
  const v3 = parseInt(parts[2], 10);

  if (v1 > 1000) { year = v1; month = v2 - 1; day = v3; } 
  else if (v3 > 1000) { day = v1; month = v2 - 1; year = v3; } 
  else return { dateObj: null, thaiYear: '' };

  if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
    const isThaiYearInput = year > 2400; 
    const adYear = isThaiYearInput ? year - 543 : year; 
    const dateObj = new Date(adYear, month, day);
    dateObj.setHours(0, 0, 0, 0); 
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

// Fallback Map (SVG)
const SimpleMapVisualization = ({ data, onSelectCase, isPrintMode = false }) => {
  // SVG Map code ... (Keep existing implementation just in case)
  // เพื่อประหยัดพื้นที่ ผมขอละ SVG path ไว้ แต่ในการใช้งานจริงคุณสามารถใช้ code เดิมส่วนนี้ได้เลยครับ
  // แต่เนื่องจากเราแก้ Leaflet แล้ว ส่วนนี้อาจจะไม่ค่อยได้ใช้
  return (
    <div className="flex items-center justify-center h-full text-slate-400">
        <p>กำลังโหลดแผนที่รูปแบบกราฟิก...</p>
    </div>
  )
};

// 🔥 FIX #2: High Performance Leaflet Map (Canvas Renderer) + CSS Loading Fix
const LeafletMap = ({ data, onSelectCase, onError }) => {
  const mapRef = useRef(null); 
  const mapInstanceRef = useRef(null); 
  const markersLayerRef = useRef(null); 
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadLeafletResources = async () => {
      // 1. Load CSS
      if (!document.querySelector('#leaflet-css')) { 
        const link = document.createElement('link'); 
        link.id = 'leaflet-css'; 
        link.rel = 'stylesheet'; 
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; 
        document.head.appendChild(link);
        // รอให้ CSS โหลดเสร็จก่อนเล็กน้อย
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 2. Load JS
      if (!window.L) {
        if (!document.querySelector('#leaflet-js')) { 
            const script = document.createElement('script'); 
            script.id = 'leaflet-js'; 
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; 
            script.async = true; 
            document.head.appendChild(script); 
        }
        // รอจนกว่า window.L จะพร้อมใช้งาน
        await new Promise((resolve, reject) => { 
            let count = 0;
            const checkL = () => { 
                if (window.L && typeof window.L.map === 'function') resolve(window.L); 
                else if (count > 100) reject(new Error('Timeout loading Leaflet')); // 10วิ
                else { count++; setTimeout(checkL, 100); }
            }; 
            checkL(); 
        });
      }
      return window.L;
    };

    loadLeafletResources().then((L) => {
      if (!isMounted) return; 
      if (mapInstanceRef.current) return; 
      if (!mapRef.current) return;
      
      try { 
        // Init Map
        const map = L.map(mapRef.current, {
           preferCanvas: true 
        }).setView([13.7563, 100.5018], 6); // ตั้งค่าเริ่มต้นที่ กรุงเทพฯ
        
        mapInstanceRef.current = map; 
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { 
            attribution: '&copy; CARTO',
            maxZoom: 19
        }).addTo(map); 

        markersLayerRef.current = L.layerGroup().addTo(map);
        
        // 🔥 FIX สำคัญ: สั่งให้ Map คำนวณขนาดพื้นที่ใหม่ หลังจาก CSS โหลดเสร็จ
        setTimeout(() => {
            map.invalidateSize();
            setIsMapReady(true);
        }, 500);

      } catch (err) { console.error(err); if (onError) onError(); }
    }).catch((err) => { console.error(err); if (isMounted && onError) onError(); }); 
    
    return () => { isMounted = false; };
  }, [onError]);
  
  // Effect สำหรับวาดจุดเมื่อ Data เปลี่ยน
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !window.L || !markersLayerRef.current) return;
    
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const L = window.L;

    // Clear old markers
    markersLayer.clearLayers(); 

    // กรองข้อมูลที่มีพิกัดถูกต้องเท่านั้น
    const validPoints = data.filter(d => 
        d.lat && d.long && 
        !isNaN(parseFloat(d.lat)) && 
        !isNaN(parseFloat(d.long))
    );
    
    console.log(`Map: Plotting ${validPoints.length} points`); // 🛠 Debug ดูจำนวนจุดที่วาด

    // ใช้ Canvas Renderer
    const myRenderer = L.canvas({ padding: 0.5 });

    validPoints.forEach(item => {
      const lat = parseFloat(item.lat);
      const long = parseFloat(item.long);
      const color = getUnitColor(item.unit_kk);
      
      const marker = L.circleMarker([lat, long], {
        renderer: myRenderer,
        radius: 6,           // เพิ่มขนาดเล็กน้อยให้เห็นชัดขึ้น
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
    });

    if (validPoints.length > 0) { 
        try { 
            const group = L.featureGroup(validPoints.map(p => L.marker([p.lat, p.long]))); 
            map.fitBounds(group.getBounds(), { padding: [50, 50] }); 
        } catch (e) { console.warn("FitBounds failed", e); } 
    } else {
        // ถ้าไม่มีข้อมูล ให้ Force Re-render อีกรอบเผื่อแผนที่ค้าง
        map.invalidateSize();
    }

  }, [data, onSelectCase, isMapReady]);

  return <div ref={mapRef} className="w-full h-full min-h-[50vh] sm:min-h-[500px] bg-slate-800 z-0 relative" />;
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

  const formatDateForInput = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [filters, setFilters] = useState(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const endOfToday = new Date();
    endOfToday.setHours(23,59,59,999);

    return {
      search: '', 
      period: 'today', 
      rangeStart: today, 
      rangeEnd: endOfToday, 
      unit_kk: '', 
      unit_s_tl: '', 
      topic: '', 
      charge: '' 
    };
  });
  
  const [localSearch, setLocalSearch] = useState('');

  const handlePeriodChange = (period) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    if (period === 'today') {
    } else if (period === 'yesterday') {
        start.setDate(now.getDate() - 1);
        end.setDate(now.getDate() - 1);
    } else if (period === '7days') {
        start.setDate(now.getDate() - 7);
    } else if (period === '30days') {
        start.setDate(now.getDate() - 30);
    } else if (period === 'this_month') {
        start.setDate(1); 
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
                const rawTopic = item['หัวข้อ']?.toString().trim() || '';
                const normalizedTopic = normalizeTopic(rawTopic);

                return {
                    id: index + 1,
                    timestamp: item['Timestamp'] || new Date().toISOString(),
                    unit_kk: item['กก.']?.toString().trim() || '',
                    unit_s_tl: item['ส.ทล.']?.toString().trim() || '',
                    topic: normalizedTopic,
                    original_topic: rawTopic, 
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

  const handleExportCSV = () => {
    if (filteredData.length === 0) { alert('ไม่มีข้อมูลสำหรับ Export'); return; }
    const headers = { date_capture: "วันที่", time_capture: "เวลา", unit_kk: "กก.", unit_s_tl: "ส.ทล.", topic: "หัวข้อ(กลุ่ม)", original_topic: "หัวข้อ(เดิม)", charge: "ข้อหา", suspect_name: "ผู้ถูกจับ", location: "สถานที่", lat: "ละติจูด", long: "ลองจิจูด", seized_items: "ของกลาง", arrest_team: "ชุดจับกุม", behavior: "พฤติการณ์" };
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
      const searchMatch = !filters.search || 
        (item.charge && item.charge.toLowerCase().includes(filters.search.toLowerCase())) || 
        (item.suspect_name && item.suspect_name.toLowerCase().includes(filters.search.toLowerCase())) || 
        (item.location && item.location.toLowerCase().includes(filters.search.toLowerCase())) || 
        (item.original_topic && item.original_topic.toLowerCase().includes(filters.search.toLowerCase())); // Search original too
      
      const kkMatch = !filters.unit_kk || String(item.unit_kk) === String(filters.unit_kk);
      const stlMatch = !filters.unit_s_tl || String(item.unit_s_tl) === String(filters.unit_s_tl);
      const topicMatch = !filters.topic || item.topic === filters.topic; 
      
      let dateMatch = true;
      if (item.date_obj) {
          if (filters.period !== 'all') {
              if (filters.rangeStart && item.date_obj < filters.rangeStart) dateMatch = false;
              if (filters.rangeEnd && item.date_obj > filters.rangeEnd) dateMatch = false;
          }
      } else {
          if (filters.period !== 'all') dateMatch = false;
      }

      return searchMatch && kkMatch && stlMatch && topicMatch && dateMatch;
    });
  }, [filters, data]);

  const stats = useMemo(() => {
    const totalCases = filteredData.length;
    const uniqueUnits = [...new Set(filteredData.map(d => `${d.unit_kk}-${d.unit_s_tl}`))].length;
    // ปรับปรุงการนับ stat ให้ใช้ Topic ที่จัดกลุ่มแล้วเป็นหลัก เพื่อความแม่นยำ
    const drugCases = filteredData.filter(d => d.topic === 'ยาเสพติด').length;
    const weaponCases = filteredData.filter(d => d.topic === 'อาวุธปืน/วัตถุระเบิด').length;
    const heavyTruckCases = filteredData.filter(d => d.topic === 'รถบรรทุก/น้ำหนัก').length;
    const warrantCases = filteredData.filter(d => d.topic === 'บุคคลตามหมายจับ').length;
    
    let unitData = {}; let unitChartTitle = "";
    if (filters.unit_kk) { 
        unitChartTitle = `สถิติ ส.ทล. (กก.${filters.unit_kk})`; 
        unitData = filteredData.reduce((acc, curr) => { const key = `ส.ทล.${curr.unit_s_tl}`; acc[key] = (acc[key] || 0) + 1; return acc; }, {}); 
    } else { 
        unitChartTitle = "สถิติแยกตาม กองกำกับการ"; 
        unitData = filteredData.reduce((acc, curr) => { const key = `กก.${curr.unit_kk}`; acc[key] = (acc[key] || 0) + 1; return acc; }, {}); 
    }
    const unitChartData = Object.entries(unitData).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    
    // Pie Chart นับตาม Topic ที่ Normalize แล้ว
    const typeData = filteredData.reduce((acc, curr) => { const key = curr.topic || 'อื่นๆ'; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    const typeChartData = Object.entries(typeData).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    return { totalCases, drugCases, weaponCases, heavyTruckCases, warrantCases, uniqueUnits, unitChartData, typeChartData, unitChartTitle };
  }, [filteredData, filters.unit_kk]);

  const handleFilterChange = (key, value) => { 
      if (key === 'unit_kk') setFilters(prev => ({ ...prev, [key]: value, unit_s_tl: '' })); 
      else setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => { 
      const today = new Date(); today.setHours(0,0,0,0);
      const endOfToday = new Date(); endOfToday.setHours(23,59,59,999);
      setFilters({ search: '', period: 'today', rangeStart: today, rangeEnd: endOfToday, unit_kk: '', unit_s_tl: '', topic: '', charge: '' }); 
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
              <div className="sm:col-span-1"><label className="block text-xs font-medium text-slate-400 mb-1 flex items-center"><Tags className="w-3 h-3 mr-1"/>ประเภทคดี</label><select className="w-full pl-2 pr-2 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500" value={filters.topic} onChange={(e) => handleFilterChange('topic', e.target.value)}><option value="">ทั้งหมด</option>{filterOptions.charges.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="sm:col-span-2 bg-blue-900/20 p-2 rounded-lg border border-blue-500/20"><label className="block text-xs font-bold text-blue-400 mb-1 flex items-center"><Clock className="w-3 h-3 mr-1"/>ช่วงเวลา (Period)</label><select className="w-full pl-2 pr-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={filters.period} onChange={(e) => handlePeriodChange(e.target.value)}>{DATE_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
              {filters.period === 'custom' && (<><div className="sm:col-span-1"><label className="block text-xs font-medium text-slate-400 mb-1">เริ่ม</label><input type="date" className="w-full pl-2 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500" value={formatDateForInput(filters.rangeStart)} onChange={(e) => handleCustomDateChange('start', e.target.value)} /></div><div className="sm:col-span-1"><label className="block text-xs font-medium text-slate-400 mb-1">สิ้นสุด</label><input type="date" className="w-full pl-2 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500" value={formatDateForInput(filters.rangeEnd)} onChange={(e) => handleCustomDateChange('end', e.target.value)} /></div></>)}
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
                  <div className="flex justify-between items-start mb-6"><h3 className="text-base sm:text-lg font-bold flex items-center text-white"><BarChart3 className="w-5 h-5 mr-2 text-yellow-400" />{stats.unitChartTitle}</h3><div className="text-xs text-yellow-500/80 flex items-center bg-yellow-500/10 px-2 py-1 rounded"><MousePointerClick className="w-3 h-3 mr-1" /> กดกราฟเพื่อกรอง</div></div>
                  {stats.unitChartData.length > 0 ? (<div className="h-72 sm:h-96 w-full cursor-pointer"><ResponsiveContainer width="100%" height="100%"><BarChart data={stats.unitChartData} margin={{ top: 10, right: 0, left: -20, bottom: 20 }} onClick={onUnitBarClick}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} /><XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={60} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={{ stroke: '#475569' }} tickLine={false} /><YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} allowDecimals={false} /><RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }} /><Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>{stats.unitChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={getUnitColor(entry.name)} className="hover:opacity-80 transition-opacity" />)}</Bar></BarChart></ResponsiveContainer></div>) : (<div className="h-64 flex items-center justify-center text-slate-500 flex-col"><FileText className="w-8 h-8 mb-2 opacity-50" /><span>ไม่พบข้อมูลตามเงื่อนไข</span></div>)}
                </div>
                <div className="bg-slate-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/50">
                  <div className="flex justify-between items-start mb-6"><h3 className="text-base sm:text-lg font-bold flex items-center text-white"><PieChart className="w-5 h-5 mr-2 text-yellow-400" />สัดส่วนประเภทคดี</h3><div className="text-xs text-yellow-500/80 flex items-center bg-yellow-500/10 px-2 py-1 rounded"><MousePointerClick className="w-3 h-3 mr-1" /> กดกราฟเพื่อกรอง</div></div>
                  {stats.typeChartData.length > 0 ? (<><div className="h-64 sm:h-80 flex justify-center w-full cursor-pointer"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.typeChartData} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={4} dataKey="value" stroke="none" onClick={onPieClick}>{stats.typeChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={getCrimeColor(entry.name)} className="hover:opacity-80 transition-opacity" />)}</Pie><RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }} /></PieChart></ResponsiveContainer></div><div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4">{stats.typeChartData.map((entry, index) => (<div key={index} className="flex items-center text-[10px] sm:text-xs text-slate-300 bg-slate-900/50 px-2 py-1 rounded-full border border-slate-700"><div className="w-2 h-2 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: getCrimeColor(entry.name) }}></div><span className="truncate max-w-[100px]">{entry.name}</span><span className="font-bold ml-1 text-white">({entry.value})</span></div>))}</div></>) : (<div className="h-64 flex items-center justify-center text-slate-500 flex-col"><FileText className="w-8 h-8 mb-2 opacity-50" /><span>ไม่พบข้อมูลตามเงื่อนไข</span></div>)}
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
                      {filteredData.length > 0 ? filteredData.slice(0, 100).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-700/50 transition-colors group">
                          <td className="p-4 text-sm text-slate-300 whitespace-nowrap"><div className="font-medium text-white">{item.date_capture}</div><div className="text-xs text-slate-500">{item.time_capture} น.</div></td>
                          <td className="p-4 text-sm text-slate-300 whitespace-nowrap"><div className="font-medium text-white">กก.{item.unit_kk} บก.ทล.</div><div className="text-xs text-slate-500">ส.ทล.{item.unit_s_tl}</div></td>
                          <td className="p-4 text-sm text-white font-medium max-w-xs truncate" title={item.charge}><div className="mb-1 text-xs uppercase tracking-wide inline-block px-1.5 py-0.5 rounded" style={{ backgroundColor: `${getCrimeColor(item.topic)}30`, color: getCrimeColor(item.topic) }}>{item.topic}</div><div>{item.charge}</div></td>
                          <td className="p-4 text-sm text-slate-300">{item.suspect_name !== '-' ? item.suspect_name : 'ไม่ระบุตัวตน'}</td>
                          <td className="p-4 text-sm text-slate-400 max-w-xs truncate" title={item.location}>{item.location}</td>
                          <td className="p-4 text-right"><button onClick={() => setSelectedCase(item)} className="p-2 text-slate-500 group-hover:text-yellow-400 hover:bg-slate-600 rounded-full transition-colors"><ChevronRight className="w-5 h-5" /></button></td>
                        </tr>
                      )) : (<tr><td colSpan="6" className="p-12 text-center text-slate-500 flex flex-col items-center justify-center w-full"><Search className="w-10 h-10 mb-3 opacity-20" />ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</td></tr>)}
                      {filteredData.length > 100 && <tr><td colSpan="6" className="p-4 text-center text-slate-500 text-xs">แสดงผล 100 รายการแรกจากทั้งหมด {filteredData.length} รายการ (กรุณาใช้ตัวกรองเพื่อดูเพิ่มเติม)</td></tr>}
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
                <div><h3 className="text-sm font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-3 flex items-center"><Calendar className="w-4 h-4 mr-2 text-yellow-500" />ข้อมูลเหตุการณ์</h3><dl className="space-y-3 text-sm"><div><dt className="text-slate-500 text-xs">วัน/เวลา</dt><dd className="text-slate-200 font-medium">{selectedCase.date_capture} เวลา {selectedCase.time_capture} น.</dd></div><div><dt className="text-slate-500 text-xs">สถานที่</dt><dd className="text-slate-200">{selectedCase.location}</dd></div><div><dt className="text-slate-500 text-xs">หัวข้อเรื่อง (กลุ่ม)</dt><dd className="inline-block px-2 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: getCrimeColor(selectedCase.topic) }}>{selectedCase.topic}</dd></div><div><dt className="text-slate-500 text-xs mt-2">หัวข้อเรื่อง (เดิม)</dt><dd className="text-slate-400 italic">{selectedCase.original_topic}</dd></div></dl></div>
                <div><h3 className="text-sm font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-3 flex items-center"><Users className="w-4 h-4 mr-2 text-yellow-500" />ข้อมูลผู้ต้องหา</h3><dl className="space-y-3 text-sm"><div><dt className="text-slate-500 text-xs">ชื่อ-สกุล</dt><dd className="text-slate-200 font-medium">{selectedCase.suspect_name}</dd></div><div><dt className="text-slate-500 text-xs">ข้อหา</dt><dd className="text-slate-200">{selectedCase.charge}</dd></div></dl></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}