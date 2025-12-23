import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { 
  LayoutDashboard, Table as TableIcon, Search, Filter, Siren, Users, 
  FileText, Calendar, ChevronRight, X, Menu, BarChart3, Map as MapIcon, 
  Building2, ChevronLeft, AlertTriangle, Truck, FileWarning, Download, 
  Activity, Radar, RefreshCw, Clock, Tags
} from 'lucide-react';

// Import Components ที่เราแยกไว้
import { StatCard, SplitStatCard } from './components/StatCard';
import { UnitBarChart, CrimePieChart, MonthlyBarChart } from './components/Charts';
import { LeafletMap } from './components/LeafletMap'; // (ใช้ code เดิมของคุณ หรือให้ผมเขียนไฟล์นี้ให้ใหม่ก็ได้)
// Import Utils
import { 
  UNIT_HIERARCHY, DATE_RANGES, getUnitColor, getCrimeColor, 
  normalizeTopic, parseDateRobust 
} from './utils/helpers';

// Placeholder for SimpleMap if you don't have separate file yet
const SimpleMapVisualization = () => <div className="text-center text-slate-500 mt-10">Map Loading...</div>;

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCase, setSelectedCase] = useState(null);
  const [mapError, setMapError] = useState(false); 
  const handleMapError = useCallback(() => setMapError(true), []);
  
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true); 
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  const [comparisonYear, setComparisonYear] = useState(new Date().getFullYear().toString());

  const [filters, setFilters] = useState(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const endOfToday = new Date();
    endOfToday.setHours(23,59,59,999);
    return { search: '', period: 'today', rangeStart: today, rangeEnd: endOfToday, unit_kk: '', unit_s_tl: '', topic: '', charge: '' };
  });
  
  const [localSearch, setLocalSearch] = useState('');

  // ... (Keep handlePeriodChange and handleCustomDateChange from original code) ...
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
    if (type === 'start') { d.setHours(0,0,0,0); setFilters(prev => ({ ...prev, rangeStart: d, period: 'custom' })); } 
    else { d.setHours(23,59,59,999); setFilters(prev => ({ ...prev, rangeEnd: d, period: 'custom' })); }
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
                
                // ✅ อ่าน Column E (ประเภทการจับกุม) และ Column F (ประเภทหมายจับ)
                // หมายเหตุ: ต้องตรวจสอบว่าใน Google Sheet ชื่อ Header คืออะไรให้แน่ชัด
                // ในที่นี้สมมติว่า Header ชื่อตามนี้ ถ้าชื่ออื่นให้แก้ string ใน []
                const arrestTypeRaw = item['ประเภทการจับกุม'] || item['จับโดย'] || ''; 
                const warrantTypeRaw = item['ประเภทหมายจับ'] || item['หมายเหตุ'] || ''; // ปรับชื่อ Header Column F ตรงนี้

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
    fetchData(); const intervalId = setInterval(fetchData, 300000); return () => clearInterval(intervalId);
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const searchMatch = !filters.search || 
        (item.charge && item.charge.toLowerCase().includes(filters.search.toLowerCase())) || 
        (item.suspect_name && item.suspect_name.toLowerCase().includes(filters.search.toLowerCase())) || 
        (item.location && item.location.toLowerCase().includes(filters.search.toLowerCase()));
      
      const kkMatch = !filters.unit_kk || String(item.unit_kk) === String(filters.unit_kk);
      const stlMatch = !filters.unit_s_tl || String(item.unit_s_tl) === String(filters.unit_s_tl);
      const topicMatch = !filters.topic || item.topic === filters.topic; 
      
      let dateMatch = true;
      if (item.date_obj) {
          if (filters.period !== 'all') {
              if (filters.rangeStart && item.date_obj < filters.rangeStart) dateMatch = false;
              if (filters.rangeEnd && item.date_obj > filters.rangeEnd) dateMatch = false;
          }
      } else { if (filters.period !== 'all') dateMatch = false; }

      return searchMatch && kkMatch && stlMatch && topicMatch && dateMatch;
    });
  }, [filters, data]);

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
    yearlyData.forEach(d => { monthlyStats[d.date_obj.getMonth()] += 1; });
    const monthlyChartData = monthsTH.map((m, i) => ({ name: m, cases: monthlyStats[i] }));

    return { 
        totalCases, drugCases, weaponCases, 
        heavyTruckCases, heavyTruckSelf, heavyTruckJoint,
        warrantCases, warrantGeneral, warrantBigData, // เพิ่ม return 2 ตัวนี้
        otherCases, unitChartData, typeChartData, unitChartTitle, monthlyChartData 
    };
  }, [filteredData, filters.unit_kk, data, comparisonYear]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Loading...</div>;

  return (
    <div className="flex h-screen bg-[#0f172a] font-sans text-slate-100 overflow-hidden relative">
      {/* Sidebar & Header Code (เหมือนเดิม ย่อไว้เพื่อประหยัดที่) */}
      <aside className={`fixed inset-y-0 left-0 z-30 bg-slate-900 border-r border-slate-800 text-white transition-all duration-300 w-64 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
         <div className="p-6 font-bold text-xl">HWPD WARROOM</div>
         <nav className="p-4 space-y-2">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left px-4 py-3 rounded ${activeTab==='dashboard'?'bg-blue-600':''}`}>Dashboard</button>
            <button onClick={() => setActiveTab('list')} className={`w-full text-left px-4 py-3 rounded ${activeTab==='list'?'bg-blue-600':''}`}>List</button>
            <button onClick={() => setActiveTab('map')} className={`w-full text-left px-4 py-3 rounded ${activeTab==='map'?'bg-blue-600':''}`}>Map</button>
         </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0 z-10 lg:ml-64">
        {/* Header (ย่อ) */}
        <header className="bg-slate-900/80 p-4 border-b border-slate-700 flex justify-between">
            <h1 className="text-xl font-bold">Dashboard</h1>
            <div className="flex gap-2">
                <button onClick={() => setShowFilterPanel(!showFilterPanel)} className="bg-slate-700 px-3 py-1 rounded">Filter</button>
            </div>
        </header>
        
        {/* Filter Panel (ย่อ) */}
        {showFilterPanel && (
            <div className="bg-slate-800 p-4 border-b border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-4">
                <input placeholder="Search..." className="bg-slate-900 border border-slate-700 p-2 rounded text-white" value={localSearch} onChange={e => setLocalSearch(e.target.value)} />
                <select className="bg-slate-900 border border-slate-700 p-2 rounded text-white" value={filters.unit_kk} onChange={e => setFilters(p => ({...p, unit_kk: e.target.value, unit_s_tl: ''}))}>
                    <option value="">ทุก กก.</option>{Object.keys(UNIT_HIERARCHY).map(k => <option key={k} value={k}>กก.{k}</option>)}
                </select>
                <select className="bg-slate-900 border border-slate-700 p-2 rounded text-white" value={filters.period} onChange={e => handlePeriodChange(e.target.value)}>
                    {DATE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
            </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UnitBarChart data={stats.unitChartData} title={stats.unitChartTitle} onBarClick={(data) => { if(data?.activePayload?.[0]?.payload.name.includes('กก.')) setFilters(prev => ({...prev, unit_kk: data.activePayload[0].payload.name.replace('กก.','')})) }} />
                <CrimePieChart data={stats.typeChartData} onClick={(data) => { if(data?.name) setFilters(prev => ({...prev, topic: data.name})) }} />
              </div>

              <MonthlyBarChart data={stats.monthlyChartData} year={comparisonYear} onYearChange={setComparisonYear} />
            </div>
          )}

          {activeTab === 'list' && (
             <div className="text-center p-10 text-slate-400">ตารางข้อมูล (List View Code Here)</div>
          )}
           
          {activeTab === 'map' && (
             <div className="h-full rounded-xl overflow-hidden relative">
                 {!mapError ? <LeafletMap data={filteredData} onSelectCase={setSelectedCase} onError={handleMapError} /> : <SimpleMapVisualization />}
             </div>
          )}
        </div>
      </main>
      
      {{/* --- Modal แสดงรายละเอียด --- */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <div>
                <h2 className="text-xl font-bold text-white">รายละเอียดการจับกุม</h2>
                <p className="text-sm text-slate-400">Case ID: #{selectedCase.id}</p>
              </div>
              <button 
                onClick={() => setSelectedCase(null)} 
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              
              {/* ส่วนที่ 1: หน่วยงานรับผิดชอบ */}
              <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30">
                <h3 className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wider">หน่วยงานรับผิดชอบ</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">กองกำกับการ</p>
                    <p className="text-lg font-bold text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-500" />
                      กก.{selectedCase.unit_kk} บก.ทล.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">สถานีตำรวจทางหลวง</p>
                    <p className="text-lg font-bold text-white">
                      ส.ทล.{selectedCase.unit_s_tl}
                    </p>
                  </div>
                </div>
              </div>

              {/* ส่วนที่ 2: ข้อมูลเหตุการณ์ และ ผู้ต้องหา */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* ฝั่งซ้าย: ข้อมูลเหตุการณ์ */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-3 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-yellow-500" />
                    ข้อมูลเหตุการณ์
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-slate-500 text-xs">วัน/เวลา</dt>
                      <dd className="text-slate-200 font-medium">
                        {selectedCase.date_capture} เวลา {selectedCase.time_capture || '-'} น.
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs">สถานที่</dt>
                      <dd className="text-slate-200">{selectedCase.location || 'ไม่ระบุ'}</dd>
                    </div>
                    <div>
                        <dt className="text-slate-500 text-xs">พิกัด</dt>
                        <dd className="text-slate-200 font-mono text-xs">
                           {selectedCase.lat && selectedCase.long ? `${selectedCase.lat}, ${selectedCase.long}` : '-'}
                        </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs">หัวข้อเรื่อง (กลุ่ม)</dt>
                      <dd 
                        className="inline-block px-2 py-1 rounded text-xs font-bold text-white mt-1" 
                        style={{ backgroundColor: getCrimeColor(selectedCase.topic) }}
                      >
                        {selectedCase.topic}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs mt-2">หัวข้อเรื่อง (เดิม)</dt>
                      <dd className="text-slate-400 italic">{selectedCase.original_topic}</dd>
                    </div>
                    {/* เพิ่มประเภทจับกุม ถ้ามี */}
                    {selectedCase.arrest_type && (
                        <div>
                            <dt className="text-slate-500 text-xs mt-2">ประเภทการจับกุม</dt>
                            <dd className="text-emerald-400">{selectedCase.arrest_type}</dd>
                        </div>
                    )}
                  </dl>
                </div>

                {/* ฝั่งขวา: ข้อมูลผู้ต้องหา */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-yellow-500" />
                    ข้อมูลผู้ต้องหา
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-slate-500 text-xs">ชื่อ-สกุล</dt>
                      <dd className="text-slate-200 font-medium text-lg">
                        {selectedCase.suspect_name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs">ข้อหา</dt>
                      <dd className="text-slate-200 bg-slate-800 p-2 rounded border border-slate-700 mt-1">
                        {selectedCase.charge || '-'}
                      </dd>
                    </div>
                    {selectedCase.warrant_source && (
                        <div>
                            <dt className="text-slate-500 text-xs mt-2">ประเภทหมายจับ</dt>
                            <dd className="text-pink-400">{selectedCase.warrant_source}</dd>
                        </div>
                    )}
                  </dl>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
      }
    </div>
  );
}