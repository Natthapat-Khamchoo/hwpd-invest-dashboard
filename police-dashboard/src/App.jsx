import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import { 
  LayoutDashboard, Table as TableIcon, Search, Filter, Siren, Users, 
  FileText, Calendar, ChevronRight, X, Menu, BarChart3, Map as MapIcon, 
  Building2, ChevronLeft, Truck, FileWarning, Activity, Radar, RefreshCw, Download
} from 'lucide-react';

// --- Imports Components ที่แยกไฟล์ไว้ ---
import { StatCard, SplitStatCard } from './components/StatCard';
import { UnitBarChart, CrimePieChart, MonthlyBarChart } from './components/Charts';
// ถ้ายังไม่ได้แยกไฟล์ Map ให้ใช้ <div...> แทน หรือสร้างไฟล์ LeafletMap.js ตามโค้ดเก่า
import { LeafletMap } from './components/LeafletMap'; 

// --- Imports Utils ---
import { 
  UNIT_HIERARCHY, DATE_RANGES, getCrimeColor, 
  normalizeTopic, parseDateRobust 
} from './utils/helpers';

// Fallback กรณีไม่มีไฟล์ Map
const SimpleMapPlaceholder = () => (
  <div className="flex items-center justify-center h-full text-slate-500 bg-slate-800">
    <p>Loading Map Component...</p>
  </div>
);

export default function App() {
  // --- State Management ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCase, setSelectedCase] = useState(null);
  const [mapError, setMapError] = useState(false); 
  const handleMapError = useCallback(() => setMapError(true), []);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true); 
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // State สำหรับเลือกปีของกราฟแท่งรายเดือน
  const [comparisonYear, setComparisonYear] = useState(new Date().getFullYear().toString());

  const [filters, setFilters] = useState(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const endOfToday = new Date();
    endOfToday.setHours(23,59,59,999);
    return { 
      search: '', period: 'today', rangeStart: today, rangeEnd: endOfToday, 
      unit_kk: '', unit_s_tl: '', topic: '', charge: '' 
    };
  });
  
  const [localSearch, setLocalSearch] = useState('');

  // --- Handlers ---
  const handlePeriodChange = (period) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    if (period === 'today') {
      // default
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
        start = null; end = null;
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

  const handleExportCSV = () => {
    if (filteredData.length === 0) { alert('ไม่มีข้อมูลสำหรับ Export'); return; }
    // Logic Export CSV แบบย่อ
    const headers = ["วันที่", "เวลา", "หน่วยงาน", "หัวข้อ", "ประเภทจับกุม", "ผู้ต้องหา", "สถานที่"];
    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + filteredData.map(e => `${e.date_capture},${e.time_capture},กก.${e.unit_kk},${e.topic},${e.arrest_type},"${e.suspect_name}",${e.location}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "police_report.csv");
    document.body.appendChild(link);
    link.click();
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Debounce Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: localSearch }));
    }, 500); 
    return () => clearTimeout(delayDebounceFn);
  }, [localSearch]);

  // --- Data Fetching ---
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
                
                // ✅ อ่าน Column E (ประเภทการจับกุม) และ Column F (ประเภทหมายจับ)
                const arrestTypeRaw = item['ประเภทการจับกุม'] || item['จับโดย'] || ''; 
                const warrantTypeRaw = item['ประเภทหมายจับ'] || item['หมายเหตุ'] || ''; 

                return {
                    id: index + 1,
                    unit_kk: item['กก.']?.toString().trim() || '',
                    unit_s_tl: item['ส.ทล.']?.toString().trim() || '',
                    topic: normalizeTopic(rawTopic),
                    original_topic: rawTopic, 
                    arrest_type: arrestTypeRaw,       // Column E
                    warrant_source: warrantTypeRaw,   // Column F
                    date_capture: rawDate, 
                    date_obj: dateObj,     
                    year: thaiYear,
                    time_capture: item['เวลา'] || '',
                    suspect_name: item['ชื่อ'] || '-',
                    charge: item['ข้อหา'] || '',
                    location: item['สถานที่จับกุม'] || '',
                    lat: item['ละติจูด'] && !isNaN(item['ละติจูด']) ? parseFloat(item['ละติจูด']).toFixed(4) : null,
                    long: item['ลองจิจูด'] && !isNaN(item['ลองจิจูด']) ? parseFloat(item['ลองจิจูด']).toFixed(4) : null,
                };
            });
          setData(formattedData); setLoading(false);
        },
        error: (err) => { console.error(err); setLoading(false); }
      });
    };
    fetchData(); 
    const intervalId = setInterval(fetchData, 300000); // Refresh every 5 mins
    return () => clearInterval(intervalId);
  }, []);

  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const searchMatch = !filters.search || 
        (item.charge && item.charge.toLowerCase().includes(filters.search.toLowerCase())) || 
        (item.suspect_name && item.suspect_name.toLowerCase().includes(filters.search.toLowerCase())) || 
        (item.location && item.location.toLowerCase().includes(filters.search.toLowerCase())) ||
        (item.original_topic && item.original_topic.toLowerCase().includes(filters.search.toLowerCase()));
      
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

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    const totalCases = filteredData.length;
    
    // 1. แยกตาม Topic
    const drugCases = filteredData.filter(d => d.topic === 'ยาเสพติด').length;
    const weaponCases = filteredData.filter(d => d.topic === 'อาวุธปืน/วัตถุระเบิด').length;
    const otherCases = filteredData.filter(d => d.topic === 'อื่นๆ').length;

    // 2. รถบรรทุก (ใช้ Column E: arrest_type)
    const heavyTruckAll = filteredData.filter(d => d.topic === 'รถบรรทุก/น้ำหนัก');
    const heavyTruckCases = heavyTruckAll.length;
    // Logic: ถ้ามีคำว่า "ร่วม" ใน Col E ให้เป็นจับร่วม, นอกนั้นจับเอง
    const heavyTruckJoint = heavyTruckAll.filter(d => d.arrest_type && d.arrest_type.includes('ร่วม')).length;
    const heavyTruckSelf = heavyTruckCases - heavyTruckJoint;

    // 3. หมายจับ (ใช้ Column F: warrant_source)
    const warrantAll = filteredData.filter(d => d.topic === 'บุคคลตามหมายจับ');
    const warrantCases = warrantAll.length;
    // Logic: ถ้ามีคำว่า "big data" (case insensitive) ให้เป็น Big Data
    const warrantBigData = warrantAll.filter(d => d.warrant_source && d.warrant_source.toLowerCase().includes('big data')).length;
    const warrantGeneral = warrantCases - warrantBigData;

    // 4. Bar Chart Logic (กก.1 - 8)
    let unitChartData = [];
    let unitChartTitle = "";
    if (filters.unit_kk) { 
        unitChartTitle = `สถิติ ส.ทล. (กก.${filters.unit_kk})`; 
        const unitData = filteredData.reduce((acc, curr) => { const key = `ส.ทล.${curr.unit_s_tl}`; acc[key] = (acc[key] || 0) + 1; return acc; }, {}); 
        unitChartData = Object.entries(unitData).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    } else { 
        unitChartTitle = "สถิติแยกตาม กองกำกับการ 1-8"; 
        const unitData = filteredData.reduce((acc, curr) => { const key = `กก.${curr.unit_kk}`; acc[key] = (acc[key] || 0) + 1; return acc; }, {}); 
        // Force create keys 1-8 to ensure sort order
        const allKK = ['1', '2', '3', '4', '5', '6', '7', '8'];
        unitChartData = allKK.map(num => ({ name: `กก.${num}`, value: unitData[`กก.${num}`] || 0 }));
    }
    
    // 5. Pie Chart Logic
    const typeData = filteredData.reduce((acc, curr) => { const key = curr.topic || 'อื่นๆ'; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    const typeChartData = Object.entries(typeData).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    // 6. Monthly Chart Logic
    const monthsTH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const yearlyData = data.filter(d => d.date_obj && d.date_obj.getFullYear() === parseInt(comparisonYear));
    const monthlyStats = Array(12).fill(0);
    yearlyData.forEach(d => { 
        if(d.date_obj) monthlyStats[d.date_obj.getMonth()] += 1; 
    });
    const monthlyChartData = monthsTH.map((m, i) => ({ name: m, cases: monthlyStats[i] }));

    return { 
        totalCases, drugCases, weaponCases, 
        heavyTruckCases, heavyTruckSelf, heavyTruckJoint,
        warrantCases, warrantGeneral, warrantBigData,
        otherCases, unitChartData, typeChartData, unitChartTitle, monthlyChartData 
    };
  }, [filteredData, filters.unit_kk, data, comparisonYear]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-400 mb-4"></div></div>;

  return (
    <div className="flex h-screen bg-[#0f172a] font-sans text-slate-100 overflow-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
        .digital-bg { background-color: #0f172a; background-image: radial-gradient(circle at 50% 50%, #1e293b 1px, transparent 1px); background-size: 30px 30px; }
        ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #1e293b; } ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
      `}</style>
      <div className="absolute inset-0 digital-bg z-0 pointer-events-none opacity-50"></div>

      {mobileSidebarOpen && (<div className="fixed inset-0 bg-black/80 z-20 lg:hidden backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />)}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 bg-slate-900 border-r border-slate-800 text-white transition-all duration-300 ease-in-out shadow-2xl ${mobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full'} lg:relative lg:translate-x-0 ${desktopSidebarOpen ? 'lg:w-64' : 'lg:w-0 lg:overflow-hidden'}`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center whitespace-nowrap bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center space-x-3">
            <span className={`text-xl font-bold tracking-tight text-white transition-opacity duration-200`}>HWPD <span className="text-yellow-400">WARROOM</span></span>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        <nav className="p-4 space-y-2 whitespace-nowrap">
          {['dashboard', 'list', 'map'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setMobileSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${activeTab === tab ? 'bg-blue-700/50 text-yellow-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              {tab === 'dashboard' ? <LayoutDashboard className="w-5 h-5" /> : tab === 'list' ? <TableIcon className="w-5 h-5" /> : <MapIcon className="w-5 h-5" />}
              <span className="font-medium capitalize">{tab}</span>
              {activeTab === tab && <ChevronRight className="w-4 h-4 ml-auto opacity-70" />}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0 z-10">
        {/* Top Bar */}
        <header className="bg-slate-900/80 backdrop-blur border-b border-slate-700 px-4 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 text-slate-400 hover:bg-slate-800 rounded-lg"><Menu className="w-6 h-6" /></button>
            <button onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)} className="hidden lg:block p-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">{desktopSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
            <h1 className="text-base sm:text-xl font-bold text-white tracking-wide uppercase">{activeTab}</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
             <button onClick={() => setFilters(prev => ({...prev, period: 'today', unit_kk: ''}))} className="bg-slate-700 hover:bg-red-500/80 hover:text-white text-slate-300 px-2 py-1.5 rounded-lg text-xs flex items-center"><RefreshCw className="w-4 h-4 mr-1" /> Reset</button>
             <button onClick={handleExportCSV} className="bg-emerald-600/90 hover:bg-emerald-500 text-white px-2 py-1.5 rounded-lg text-xs flex items-center"><Download className="w-4 h-4 mr-1" /> CSV</button>
             <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${showFilterPanel ? 'bg-yellow-500 text-slate-900' : 'bg-slate-800 text-slate-300 border border-slate-600'}`}><Filter className="w-4 h-4" /><span>Filters</span></button>
          </div>
        </header>

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="bg-slate-800 border-b border-slate-700 p-4 animate-in slide-in-from-top-2 duration-200 shadow-xl z-20 relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="sm:col-span-2"><input type="text" className="w-full pl-3 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white" placeholder="ค้นหา ชื่อ/ข้อหา..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} /></div>
              <div><select className="w-full pl-2 pr-2 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white" value={filters.unit_kk} onChange={(e) => setFilters(p => ({...p, unit_kk: e.target.value, unit_s_tl: ''}))}><option value="">ทุก กก.</option>{Object.keys(UNIT_HIERARCHY).map(kk => <option key={kk} value={kk}>กก.{kk}</option>)}</select></div>
              <div><select className="w-full pl-2 pr-2 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white" value={filters.period} onChange={(e) => handlePeriodChange(e.target.value)}>{DATE_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
              {filters.period === 'custom' && (<><input type="date" className="w-full bg-slate-900 border border-slate-700 rounded text-sm text-white p-2" value={formatDateForInput(filters.rangeStart)} onChange={(e) => handleCustomDateChange('start', e.target.value)} /><input type="date" className="w-full bg-slate-900 border border-slate-700 rounded text-sm text-white p-2" value={formatDateForInput(filters.rangeEnd)} onChange={(e) => handleCustomDateChange('end', e.target.value)} /></>)}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4">
          
          {/* ================= DASHBOARD TAB ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                <StatCard title="ผลการจับกุมรวม" value={stats.totalCases} icon={Activity} colorClass="text-blue-400 bg-blue-500" delay={0} />
                <StatCard title="คดียาเสพติด" value={stats.drugCases} icon={Siren} colorClass="text-red-400 bg-red-500" delay={100} />
                <StatCard title="คดีอาวุธปืน" value={stats.weaponCases} icon={Radar} colorClass="text-orange-400 bg-orange-500" delay={200} />
                
                {/* ✅ Card รถบรรทุก (3 ช่อง) */}
                <SplitStatCard 
                    title="รถบรรทุก/น้ำหนัก" 
                    icon={Truck} 
                    mainValue={stats.heavyTruckCases}
                    subValues={[
                        { label: "ทั้งหมด", value: stats.heavyTruckCases },
                        { label: "จับเอง", value: stats.heavyTruckSelf },
                        { label: "จับร่วม", value: stats.heavyTruckJoint }
                    ]}
                    colorClass="text-purple-400 bg-purple-500" 
                    delay={300} 
                />

                {/* ✅ Card หมายจับ (3 ช่อง) */}
                <SplitStatCard 
                    title="บุคคลตามหมายจับ" 
                    icon={FileWarning} 
                    mainValue={stats.warrantCases}
                    subValues={[
                        { label: "ทั้งหมด", value: stats.warrantCases },
                        { label: "หมายทั่วไป", value: stats.warrantGeneral },
                        { label: "Big Data", value: stats.warrantBigData }
                    ]}
                    colorClass="text-pink-400 bg-pink-500" 
                    delay={400} 
                />

                <StatCard title="คดีอื่นๆ" value={stats.otherCases} icon={FileText} colorClass="text-gray-400 bg-gray-500" delay={500} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <UnitBarChart 
                  data={stats.unitChartData} 
                  title={stats.unitChartTitle} 
                  onBarClick={(data) => { if(data?.activePayload?.[0]?.payload.name.includes('กก.')) setFilters(prev => ({...prev, unit_kk: data.activePayload[0].payload.name.replace('กก.','')})) }} 
                />
                <CrimePieChart 
                  data={stats.typeChartData} 
                  onClick={(data) => { if(data?.name) setFilters(prev => ({...prev, topic: data.name})) }} 
                />
              </div>

              <MonthlyBarChart 
                data={stats.monthlyChartData} 
                year={comparisonYear} 
                onYearChange={setComparisonYear} 
              />
            </div>
          )}
          
          {/* ================= LIST TAB ================= */}
          {activeTab === 'list' && (
            <div className="bg-slate-800/90 backdrop-blur rounded-xl shadow-lg border border-slate-700 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 sticky top-0 z-10"><tr><th className="p-4 text-xs font-semibold text-slate-400 uppercase border-b border-slate-700">วันที่/เวลา</th><th className="p-4 text-xs font-semibold text-slate-400 uppercase border-b border-slate-700">หน่วยงาน</th><th className="p-4 text-xs font-semibold text-slate-400 uppercase border-b border-slate-700">ข้อหา/ประเภท</th><th className="p-4 text-xs font-semibold text-slate-400 uppercase border-b border-slate-700">ผู้ถูกจับ</th><th className="p-4 text-xs font-semibold text-slate-400 uppercase border-b border-slate-700">สถานที่</th><th className="p-4 border-b border-slate-700"></th></tr></thead>
                    <tbody className="divide-y divide-slate-700">
                      {filteredData.slice(0, 100).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => setSelectedCase(item)}>
                          <td className="p-4 text-sm text-slate-300 whitespace-nowrap"><div className="font-medium text-white">{item.date_capture}</div><div className="text-xs text-slate-500">{item.time_capture} น.</div></td>
                          <td className="p-4 text-sm text-slate-300 whitespace-nowrap"><div className="font-medium text-white">กก.{item.unit_kk}</div><div className="text-xs text-slate-500">ส.ทล.{item.unit_s_tl}</div></td>
                          <td className="p-4 text-sm text-white max-w-xs truncate">
                            <div className="text-yellow-400 text-xs mb-1">{item.topic}</div>
                            {item.charge}
                          </td>
                          <td className="p-4 text-sm text-slate-300">{item.suspect_name}</td>
                          <td className="p-4 text-sm text-slate-400 max-w-xs truncate">{item.location}</td>
                          <td className="p-4"><ChevronRight className="w-5 h-5 text-slate-500" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredData.length === 0 && <div className="p-10 text-center text-slate-500">ไม่พบข้อมูล</div>}
                </div>
            </div>
          )}

          {/* ================= MAP TAB ================= */}
          {activeTab === 'map' && (
             <div className="h-full w-full flex flex-col bg-slate-800 rounded-xl overflow-hidden border border-slate-700 relative">
                 {!mapError ? <LeafletMap data={filteredData} onSelectCase={setSelectedCase} onError={handleMapError} /> : <SimpleMapPlaceholder />}
             </div>
          )}
        </div>
      </main>

      {/* ================= MODAL DETAIL ================= */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <div><h2 className="text-xl font-bold text-white">รายละเอียดการจับกุม</h2><p className="text-sm text-slate-400">Case ID: #{selectedCase.id}</p></div>
              <button onClick={() => setSelectedCase(null)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30">
                <h3 className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wider">หน่วยงานรับผิดชอบ</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-slate-400 mb-1">กองกำกับการ</p><p className="text-lg font-bold text-white flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-500" />กก.{selectedCase.unit_kk} บก.ทล.</p></div>
                  <div><p className="text-xs text-slate-400 mb-1">สถานีตำรวจทางหลวง</p><p className="text-lg font-bold text-white">ส.ทล.{selectedCase.unit_s_tl}</p></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-3 flex items-center"><Calendar className="w-4 h-4 mr-2 text-yellow-500" />ข้อมูลเหตุการณ์</h3>
                  <dl className="space-y-3 text-sm">
                    <div><dt className="text-slate-500 text-xs">วัน/เวลา</dt><dd className="text-slate-200 font-medium">{selectedCase.date_capture} เวลา {selectedCase.time_capture || '-'} น.</dd></div>
                    <div><dt className="text-slate-500 text-xs">สถานที่</dt><dd className="text-slate-200">{selectedCase.location || 'ไม่ระบุ'}</dd></div>
                    <div><dt className="text-slate-500 text-xs">พิกัด</dt><dd className="text-slate-200 font-mono text-xs">{selectedCase.lat && selectedCase.long ? `${selectedCase.lat}, ${selectedCase.long}` : '-'}</dd></div>
                    <div><dt className="text-slate-500 text-xs">หัวข้อเรื่อง</dt><dd className="inline-block px-2 py-1 rounded text-xs font-bold text-white mt-1" style={{ backgroundColor: getCrimeColor(selectedCase.topic) }}>{selectedCase.topic}</dd></div>
                    {selectedCase.arrest_type && (<div><dt className="text-slate-500 text-xs mt-2">ประเภทการจับกุม</dt><dd className="text-emerald-400">{selectedCase.arrest_type}</dd></div>)}
                  </dl>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-3 flex items-center"><Users className="w-4 h-4 mr-2 text-yellow-500" />ข้อมูลผู้ต้องหา</h3>
                  <dl className="space-y-3 text-sm">
                    <div><dt className="text-slate-500 text-xs">ชื่อ-สกุล</dt><dd className="text-slate-200 font-medium text-lg">{selectedCase.suspect_name}</dd></div>
                    <div><dt className="text-slate-500 text-xs">ข้อหา</dt><dd className="text-slate-200 bg-slate-800 p-2 rounded border border-slate-700 mt-1">{selectedCase.charge || '-'}</dd></div>
                    {selectedCase.warrant_source && (<div><dt className="text-slate-500 text-xs mt-2">ประเภทหมายจับ</dt><dd className="text-pink-400">{selectedCase.warrant_source}</dd></div>)}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}