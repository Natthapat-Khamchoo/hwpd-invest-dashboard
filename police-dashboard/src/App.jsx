import React, { useState, useCallback, useEffect } from 'react';
import {
  LayoutDashboard, Search, Filter, Siren, Users,
  FileText, Calendar, ChevronRight, X, Menu, BarChart3,
  Building2, ChevronLeft, Truck, FileWarning, Activity, Radar, RefreshCw, Download, Check, ClipboardCopy,
  Award, Clock, TrendingUp, PieChart
} from 'lucide-react';

// Import Components
import { StatCard, SplitStatCard } from './components/dashboard/StatCard';
import { UnitBarChart, MonthlyBarChart, ComparativeCrimeChart } from './components/dashboard/Charts';
import { getCrimeColor } from './utils/helpers';
import { getMainCommander } from './utils/constants';
import FilterBar from './components/dashboard/FilterBar';
import { Header } from './components/dashboard/Header';
import LoadingScreen from './components/ui/LoadingScreen';

// Import New Views
import RankingView from './components/dashboard/RankingView';
import TimeAnalysisView from './components/dashboard/TimeAnalysisView';
import TrendView from './components/dashboard/TrendView';
import SummaryDashboardView from './components/dashboard/SummaryDashboardView';
import ResultDashboardView from './components/dashboard/ResultDashboardView';

// Import Hooks
import { usePoliceData } from './hooks/usePoliceData';
import { useDashboardLogic } from './hooks/useDashboardLogic';
import { useAnalytics } from './hooks/useAnalytics';
import { useStationData } from './hooks/useStationData';

// LOCAL DEBUG LOADING SCREEN
const DebugLoading = ({ onFinished }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'orange',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', color: 'black'
  }}>
    DEBUG OVERLAY <button onClick={onFinished} style={{ padding: '20px', marginLeft: '20px' }}>CLOSE</button>
  </div>
);

export default function App() {
  // --- Data & Logic Hooks ---
  const { data, rawData, loading } = usePoliceData();
  const { getCommanderInfo } = useStationData(rawData);
  const {
    filters, setFilters,
    localSearch, setLocalSearch,
    comparisonYear, setComparisonYear,
    filterOptions,
    filteredData,
    stats,
    detailedStats,
    resetFilters
  } = useDashboardLogic(data, rawData);

  // --- Analytics Hook ---
  const {
    unitRankings,
    peakHoursData,
    dayOfWeekData,
    trendData,
    nextDayForecast
  } = useAnalytics(data, filters); // Use filtered or raw data depending on requirement. Passing 'data' and applying filters inside hook is better for consistency.

  // --- UI State ---
  const getInitialActiveTab = () => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    // 'dashboard', 'ranking', 'trend', 'time' are top-level tabs.
    // 'result' is the default container for 'overview', 'comparison', etc.
    // If tab is defined and is one of the top-level keys, use it.
    if (['dashboard', 'ranking', 'trend', 'time'].includes(tab)) return tab;
    // Otherwise, assume it belongs to 'result' (ResultDashboardView)
    return 'result';
  };

  const [activeTab, setActiveTab] = useState(getInitialActiveTab);
  const [selectedCase, setSelectedCase] = useState(null);
  const [mapError, setMapError] = useState(false);
  const handleMapError = useCallback(() => setMapError(true), []);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Sync activeTab changes to URL (helper)
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);

    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    // If switching to top-level tab that doesn't use kk/stl, we might want to keep them or clear them. 
    // Keeping them is safer for "returning" to result view.

    // However, ResultDashboardView will update the URL itself when it mounts if we let it,
    // but here we are setting the "Container" tab.

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  useEffect(() => {
    const handlePopState = () => {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (['dashboard', 'ranking', 'trend', 'time'].includes(tab)) {
        setActiveTab(tab);
      } else {
        setActiveTab('result');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // --- Report Preview State ---
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState("");

  // --- UI Handlers ---
  const handleExportCSV = () => {
    if (filteredData.length === 0) { alert('ไม่มีข้อมูลสำหรับ Export'); return; }
    const headers = ["วันที่", "เวลา", "หน่วยงาน", "หัวข้อ", "ประเภทจับกุม", "ผู้ต้องหา", "สถานที่"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + filteredData.map(e => `${e.date_capture},${e.time_capture}, กก.${e.unit_kk},${e.topic},${e.arrest_type}, "${e.suspect_name}", ${e.location} `).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "police_report.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleCopyReport = () => {
    const today = new Date();
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const thDate = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear() + 543} `;

    // --- คำนวณวันที่สำหรับแสดงใน Header ---
    let headerDateText = "";

    // ฟังก์ชันช่วยแปลงวันที่
    const formatThDate = (date) => {
      if (!date) return '-';
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543} `;
    };

    if (filters.period === 'today') {
      headerDateText = `ประจำวันที่ ${formatThDate(new Date())} `;
    } else if (filters.period === 'yesterday') {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      headerDateText = `ประจำวันที่ ${formatThDate(yest)} `;
    } else if (filters.rangeStart && filters.rangeEnd) {
      headerDateText = `ประจำห้วงวันที่ ${formatThDate(filters.rangeStart)} ถึง ${formatThDate(filters.rangeEnd)} `;
    } else if (filters.selectedMonth !== undefined && filters.selectedMonth !== null && filters.selectedMonth !== '') {
      const selMonth = parseInt(filters.selectedMonth);
      const yearBE = new Date().getFullYear() + 543;
      headerDateText = `ประจำเดือน ${months[selMonth]} ${yearBE} `;
    } else {
      headerDateText = `ข้อมูลทั้งหมด`;
    }

    // --- Use Detailed Stats if available ---
    const s = detailedStats || {
      trafficTotal: 0, trafficNotKeepLeft: 0, trafficNotCovered: 0, trafficModify: 0,
      trafficNoPart: 0, trafficSign: 0, trafficLight: 0, trafficSpeed: 0,
      trafficTax: 0, trafficNoPlate: 0, trafficGeneral: 0, criminalTotal: 0,
      warrantTotal: 0, warrantBigData: 0, warrantBodyworn: 0, warrantGeneral: 0,
      flagrantTotal: 0, offenseDrugs: 0, offenseGuns: 0, offenseImmig: 0,
      offenseCustoms: 0, offenseDisease: 0, offenseTransport: 0, offenseDocs: 0,
      offenseProperty: 0, offenseSex: 0, offenseWeight: 0, offenseDrunk: 0,
      offenseLife: 0, offenseCom: 0, offenseOther: 0,
      convoyTotal: 0, convoyRoyal: 0, convoyGeneral: 0,
      seized: { drugs: { yaba: 0, ice: 0, ketamine: 0, other: 0 }, guns: { registered: 0, unregistered: 0, bullets: 0, explosives: 0 }, vehicles: { car: 0, bike: 0 }, others: { money: 0, account: 0, phone: 0, electronics: 0, items: 0 } },
      accidentsTotal: 0, accidentsDeath: 0, accidentsInjured: 0,
      volunteerTotal: 0, serviceTotal: 0
    };

    // --- Dynamic Header (Unit/Commander) ---
    const unitId = (filters.unit_kk && filters.unit_kk.length > 0) ? filters.unit_kk[0] : '0';
    // Assuming single unit selection for now, or default to 0 if multiple or none
    // If multiple units selected (e.g. 1 and 2), we might want to stay at '0' (HQ) or pick first.
    // Let's assume filters.unit_kk is array of strings. 
    // If it is just a string in state, check usage. 
    // useDashboardLogic: filters.unit_kk is initialized as ''.
    // In UnitBarChart onBarClick: setFilters(prev => ({ ...prev, unit_kk: entry.name.replace('กก.', '') })) -> string.

    const currentUnitId = Array.isArray(filters.unit_kk) ? (filters.unit_kk[0] || '0') : (filters.unit_kk || '0');
    const currentStationId = filters.unit_s_tl || '';
    const { commander, unitName } = getCommanderInfo(currentUnitId, currentStationId);


    const reportText = `เรียน ผู้บังคับบัญชา

ภายใต้การอำนวยการของ ${commander}
ขอรายงานผลการปฏิบัติงานของ ${unitName} ${headerDateText.trim()}

1. ผลการจับกุมคดีอาญา รวม ${s.criminalTotal} ราย
- ความผิดซึ่งหน้า ${s.flagrantTotal} ราย
- หมายจับ ${s.warrantTotal} ราย
แบ่งเป็นประเภทฐานความผิด ดังนี้
- พ.ร.บ.ยาเสพติด  ${s.offenseDrugs}
- พ.ร.บ.อาวุธปืน   ${s.offenseGuns}
- พ.ร.บ.คนเข้าเมือง  ${s.offenseImmig}
- รถบรรทุกน้ำหนักเกินฯ ${s.offenseWeight}
- ขับรถขณะเมาสุรา ${s.offenseDrunk}
- อื่นๆ ${s.offenseOther}

2. ผลการจับกุมคดีจราจร รวม ${s.trafficTotal} ราย
- ไม่ชิดขอบทางด้านซ้าย ${s.trafficNotKeepLeft}
- ไม่ปกคลุม ${s.trafficNotCovered}
- ดัดแปลงสภาพรถ ${s.trafficModify}
- ฝ่าฝืนเครื่องหมายจราจร ${s.trafficSign}
- ฝ่าฝืนเครื่องสัญญาณไฟจราจร ${s.trafficLight}
- ขับรถเร็วเกินกำหนด ${s.trafficSpeed}
- ไม่ติดแผ่นป้ายทะเบียน ${s.trafficNoPlate}
- ขาดต่อภาษี/พ.ร.บ.ฯ ${s.trafficTax}
- อื่นๆ ${s.trafficGeneral}

3. นำขบวน รวม ${s.convoyTotal} ขบวน
- ขบวนเสด็จ ${s.convoyRoyal}
- ขบวนทั่วไป ${s.convoyGeneral}

4. รับแจ้งอุบัติเหตุ รวม ${s.accidentsTotal} ครั้ง
- เสียชีวิต ${s.accidentsDeath}
- บาดเจ็บ ${s.accidentsInjured}

5. ตรวจยึดของกลาง
  . ยาเสพติด (ยาบ้า ${s.seized.drugs.yaba.toLocaleString()} เม็ด, ไอซ์ ${s.seized.drugs.ice.toLocaleString()} กรัม)
  . อาวุธปืนและเครื่องกระสุน (ปืน ${s.seized.guns.registered + s.seized.guns.unregistered} กระบอก, กระสุน ${s.seized.guns.bullets} นัด)
  . รถยนต์ ${s.seized.vehicles.car} คัน
  . อุปกรณ์อิเล็กทรอนิกส์ ${s.seized.others.electronics || 0} รายการ
  . เงินสด ${s.seized.others.money.toLocaleString()} บาท
  . บัญชี ${s.seized.others.account} บัญชี

6. กิจกรรมจิตอาสา ${s.volunteerTotal} ครั้ง
7. ช่วยเหลือ/บริการประชาชน ${s.serviceTotal} ครั้ง

จึงเรียนมาเพื่อโปรดทราบ`;

    setReportText(reportText); // เก็บข้อความรายงาน
    setShowReportModal(true); // เปิด Modal
  };

  const handleCardClick = (topicName, subType = null) => {
    setFilters(prev => ({
      ...prev,
      topic: [topicName],
      subFilter: subType
    }));
  };


  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  // Handle Loading Screen Logic
  const handleLoadingFinished = useCallback(() => {
    setShowLoadingScreen(false);
  }, []);

  useEffect(() => {
    // If real data is still loading, keep showing loading screen
    if (loading) {
      setShowLoadingScreen(true);
      return;
    }

    // Force it to show at least once on mount with a timer
    const timer = setTimeout(() => {
      setShowLoadingScreen(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <div className="flex h-screen bg-[#0f172a] font-sans text-slate-100 overflow-hidden relative print:h-auto print:overflow-visible print:block print:bg-white">

      {/* Loading Screen Overlay (Fades out when finished) */}
      {(showLoadingScreen || loading) && (
        <LoadingScreen onFinished={handleLoadingFinished} />
      )}

      {/* Animated Background Layers */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Digital Grid overlay */}
        <div className="absolute inset-0 digital-bg opacity-30"></div>

        {/* Floating Neon Blobs */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-neon-blue/20 rounded-full blur-[100px] animate-float"></div>
        <div className="absolute top-1/2 -right-20 w-80 h-80 bg-neon-purple/20 rounded-full blur-[100px] animate-float-delayed"></div>
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-neon-amber/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      </div>

      {mobileSidebarOpen && (<div className="fixed inset-0 bg-black/80 z-20 xl:hidden backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />)}

      <aside className={`fixed inset-y-0 left-0 z-30 glass-liquid-bar border-y-0 border-l-0 border-r border-white/10 text-white transition-all duration-300 ease-in-out shadow-2xl ${mobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full'} xl:relative xl:translate-x-0 ${desktopSidebarOpen ? 'xl:w-64' : 'xl:w-0 xl:overflow-hidden'} print:hidden`}>
        <div className="p-6 border-b border-white/5 flex justify-between items-center whitespace-nowrap bg-gradient-to-r from-white/5 to-transparent">
          <div className="flex items-center space-x-3">
            <span className={`text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 transition-opacity duration-200`}>HWPD <span className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">WARROOM</span></span>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="xl:hidden text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        <nav className="p-4 space-y-2 whitespace-nowrap">
          {['result', 'dashboard'].map(tab => (
            <button key={tab} onClick={() => handleTabChange(tab)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${activeTab === tab ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-slate-400 hover:bg-white/5 hover:text-white hover:shadow-lg'}`}>

              {/* Active Tab Indicator Line */}
              {activeTab === tab && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]"></div>}

              {tab === 'dashboard' ? <LayoutDashboard className="w-5 h-5" /> :
                tab === 'result' ? <PieChart className="w-5 h-5" /> :
                  <FileText className="w-5 h-5" />}
              <span className="font-medium capitalize relative z-10">{tab}</span>
              {activeTab === tab && <ChevronRight className="w-4 h-4 ml-auto opacity-70" />}
            </button>
          ))}

          <div className="pt-4 pb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-4 mb-2">Advanced Analytics</div>
          </div>

          {[
            { id: 'ranking', label: 'Ranking', icon: Award, color: 'text-yellow-400', activeBg: 'bg-yellow-500/10', activeBorder: 'border-yellow-500/30' },
            { id: 'trend', label: 'Trend Prediction', icon: TrendingUp, color: 'text-green-400', activeBg: 'bg-green-500/10', activeBorder: 'border-green-500/30' }
          ].map(item => (
            <button key={item.id} onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden 
                ${activeTab === item.id ? `${item.activeBg} ${item.color} border ${item.activeBorder} shadow-[0_0_15px_rgba(0,0,0,0.2)]` : 'text-slate-400 hover:bg-white/5 hover:text-white'}
`}>

              {activeTab === item.id && <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.color.replace('text', 'bg')} shadow-[0_0_10px_rgba(255,255,255,0.5)]`}></div>}

              <item.icon className={`w-5 h-5 ${activeTab === item.id ? '' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="font-medium capitalize relative z-10">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0 z-10 print:overflow-visible print:h-auto print:block">

        <div className="print:hidden">
          <Header
            activeTab={activeTab}
            mobileSidebarOpen={mobileSidebarOpen}
            setMobileSidebarOpen={setMobileSidebarOpen}
            desktopSidebarOpen={desktopSidebarOpen}
            setDesktopSidebarOpen={setDesktopSidebarOpen}
            onCopyReport={handleCopyReport}
            onResetFilters={resetFilters}
            onExportCSV={handleExportCSV}
            showFilterPanel={showFilterPanel}
            setShowFilterPanel={setShowFilterPanel}
          />
        </div>

        <FilterBar
          show={showFilterPanel}
          localSearch={localSearch}
          setLocalSearch={setLocalSearch}
          filters={filters}
          setFilters={setFilters}
          filterOptions={filterOptions}
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 print:overflow-visible print:h-auto print:p-0">
          {activeTab === 'dashboard' && (
            <div className="relative space-y-4 sm:space-y-6">
              {/* Police Command Center Background Effects */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Animated Grid Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f620_1px,transparent_1px),linear-gradient(to_bottom,#3b82f620_1px,transparent_1px)] bg-[size:40px_40px] animate-pulse-slow"></div>
                </div>

                {/* Radar Scan Effect */}
                <div className="absolute top-10 right-10 w-64 h-64 opacity-5">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping"></div>
                  <div className="absolute inset-4 rounded-full border border-blue-300 animate-pulse-slow"></div>
                  <div className="absolute inset-8 rounded-full border border-blue-200"></div>
                </div>

                {/* CIB Logo Watermark */}
                <div className="absolute top-10 right-0 w-[500px] h-[500px] opacity-[0.04] pointer-events-none z-0">
                  <img
                    src="https://cib.go.th/backend/uploads/medium_logo_cib_4_2x_9f2da10e9f_a7828c9ca0.png"
                    alt="CIB Logo"
                    className="w-full h-full object-contain filter grayscale contrast-125 sepia-[100%] hue-rotate-[190deg] saturate-[500%] drop-shadow-[0_0_30px_rgba(59,130,246,0.6)]"
                  />
                </div>

                {/* Gradient Spotlights */}
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] mix-blend-screen animate-pulse-slow"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] mix-blend-screen"></div>

                {/* Floating Particles - Reduced for Performance */}
                {/* <div className="absolute top-20 left-[15%] w-2 h-2 bg-blue-400/30 rounded-full blur-[1px] animate-float"></div>
                <div className="absolute top-40 right-[20%] w-3 h-3 bg-cyan-400/20 rounded-full blur-[2px] animate-float-delayed"></div>
                <div className="absolute bottom-60 left-[30%] w-2 h-2 bg-white/10 rounded-full blur-[1px] animate-pulse"></div>
                <div className="absolute top-[60%] right-[40%] w-2 h-2 bg-blue-300/20 rounded-full blur-[1px] animate-float"></div>
                <div className="absolute bottom-40 right-[15%] w-3 h-3 bg-cyan-300/15 rounded-full blur-[2px] animate-float-delayed"></div> */}
              </div>

              {/* Content - relative z-index to appear above background */}
              <div className="relative z-10 space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <StatCard
                    title="ผลการจับกุมรวม"
                    value={detailedStats ? detailedStats.criminalTotal : stats.totalCases}
                    icon={Activity}
                    colorClass="text-blue-400 bg-blue-500"
                    delay={0}
                    onClick={() => setFilters(prev => ({ ...prev, topic: [], subFilter: null }))}
                    isActive={filters.topic.length === 0}
                  />
                  <StatCard
                    title="คดียาเสพติด"
                    value={detailedStats ? detailedStats.offenseDrugs : stats.drugCases}
                    icon={Siren}
                    colorClass="text-red-400 bg-red-500"
                    delay={100}
                    onClick={() => handleCardClick('ยาเสพติด')}
                    isActive={filters.topic.includes('ยาเสพติด')}
                  />
                  <StatCard
                    title="คดีอาวุธปืน"
                    value={detailedStats ? detailedStats.offenseGuns : stats.weaponCases}
                    icon={Radar}
                    colorClass="text-orange-400 bg-orange-500"
                    delay={200}
                    onClick={() => handleCardClick('อาวุธปืน/วัตถุระเบิด')}
                    isActive={filters.topic.includes('อาวุธปืน/วัตถุระเบิด')}
                  />
                  <SplitStatCard
                    title="รถบรรทุก/น้ำหนัก"
                    icon={Truck}
                    colorClass="text-purple-400 bg-purple-500"
                    delay={300}
                    subValues={[
                      {
                        label: "ทั้งหมด",
                        value: detailedStats ? detailedStats.offenseWeight : stats.heavyTruckCases,
                        onClick: () => handleCardClick('รถบรรทุก/น้ำหนัก', null),
                        isActive: filters.topic.includes('รถบรรทุก/น้ำหนัก') && filters.subFilter === null
                      },
                      {
                        label: "จับเอง",
                        value: detailedStats ? detailedStats.truckSelf : stats.heavyTruckSelf,
                        labelColor: "text-green-500",
                        valueColor: "text-green-400",
                        onClick: () => handleCardClick('รถบรรทุก/น้ำหนัก', 'self'),
                        isActive: filters.topic.includes('รถบรรทุก/น้ำหนัก') && filters.subFilter === 'self'
                      },
                      {
                        label: "จับร่วม",
                        value: detailedStats ? detailedStats.truckJoint : stats.heavyTruckJoint,
                        labelColor: "text-pink-500",
                        valueColor: "text-pink-400",
                        onClick: () => handleCardClick('รถบรรทุก/น้ำหนัก', 'joint'),
                        isActive: filters.topic.includes('รถบรรทุก/น้ำหนัก') && filters.subFilter === 'joint'
                      }
                    ]}
                  />
                  <SplitStatCard
                    title="บุคคลตามหมายจับ"
                    icon={FileWarning}
                    colorClass="text-pink-400 bg-pink-500"
                    delay={400}
                    subValues={[
                      {
                        label: "ทั้งหมด",
                        value: detailedStats ? detailedStats.warrantTotal : stats.warrantCases,
                        onClick: () => handleCardClick('บุคคลตามหมายจับ', null),
                        isActive: filters.topic.includes('บุคคลตามหมายจับ') && filters.subFilter === null
                      },
                      {
                        label: "หมายทั่วไป",
                        value: detailedStats ? (detailedStats.warrantGeneral + detailedStats.warrantBodyworn) : stats.warrantGeneral,
                        labelColor: "text-green-500",
                        valueColor: "text-green-400",
                        onClick: () => handleCardClick('บุคคลตามหมายจับ', 'general'),
                        isActive: filters.topic.includes('บุคคลตามหมายจับ') && filters.subFilter === 'general'
                      },
                      {
                        label: "Big Data",
                        value: detailedStats ? detailedStats.warrantBigData : stats.warrantBigData,
                        labelColor: "text-pink-500",
                        valueColor: "text-pink-400",
                        onClick: () => handleCardClick('บุคคลตามหมายจับ', 'bigdata'),
                        isActive: filters.topic.includes('บุคคลตามหมายจับ') && filters.subFilter === 'bigdata'
                      }
                    ]}
                  />
                  <StatCard
                    title="คดีอื่นๆ"
                    value={detailedStats ? (detailedStats.offenseImmig + detailedStats.offenseCustoms + detailedStats.offenseDisease + detailedStats.offenseTransport + detailedStats.offenseDocs + detailedStats.offenseProperty + detailedStats.offenseSex + detailedStats.offenseDrunk + detailedStats.offenseLife + detailedStats.offenseCom + detailedStats.offenseOther) : stats.otherCases}
                    icon={FileText}
                    colorClass="text-gray-400 bg-gray-500"
                    delay={500}
                    onClick={() => handleCardClick('อื่นๆ')}
                    isActive={filters.topic.includes('อื่นๆ')}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-2">
                  <UnitBarChart
                    data={(() => {
                      // Top level: use unitTotals from detailedStats
                      if (!filters.unit_kk && detailedStats && detailedStats.charts) {
                        return detailedStats.charts.unitTotals;
                      }
                      // Drill-down: use stationTotals from detailedStats
                      if (filters.unit_kk && detailedStats && detailedStats.charts && detailedStats.charts.stationTotals) {
                        return Object.entries(detailedStats.charts.stationTotals)
                          .map(([name, value]) => ({ name, value }))
                          .sort((a, b) => {
                            const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
                            const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
                            return numA - numB;
                          });
                      }
                      // Fallback
                      return stats.unitChartData;
                    })()}
                    title={stats.unitChartTitle}
                    onBarClick={(entry) => { if (entry && entry.name && entry.name.includes('กก.')) setFilters(prev => ({ ...prev, unit_kk: entry.name.replace('กก.', '') })) }}
                    onBack={filters.unit_kk ? () => setFilters(prev => ({ ...prev, unit_kk: '' })) : null}
                  />
                  <ComparativeCrimeChart
                    rawData={data}
                    globalFilters={filters}
                  />
                </div>

                <MonthlyBarChart
                  data={stats.monthlyChartData}
                  year={comparisonYear}
                  onYearChange={setComparisonYear}
                />
              </div>
            </div>
          )}



          {activeTab === 'summary' && (
            <SummaryDashboardView filteredData={filteredData} filters={filters} reportStats={detailedStats} getCommanderInfo={getCommanderInfo} />
          )}

          {activeTab === 'result' && (
            <ResultDashboardView filteredData={filteredData} filters={filters} setFilters={setFilters} />
          )}



          {
            activeTab === 'ranking' && (
              <RankingView unitRankings={unitRankings} />
            )
          }

          {activeTab === 'time' && (
            <div className="h-full w-full flex flex-col relative">
              {/* Chrono Theme Effects */}
              <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                {/* Random Laser Beams */}
                <div className="absolute w-[1px] h-[40%] left-[10%] bg-gradient-to-b from-transparent via-purple-400 to-transparent opacity-70 animate-scan-vertical" style={{ animationDuration: '4s', animationDelay: '0s' }}></div>
                <div className="absolute w-[1px] h-[60%] left-[25%] bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-50 animate-scan-vertical" style={{ animationDuration: '6s', animationDelay: '1s', animationDirection: 'reverse' }}></div>
                <div className="absolute w-[1px] h-[50%] left-[45%] bg-gradient-to-b from-transparent via-fuchsia-400 to-transparent opacity-60 animate-scan-vertical" style={{ animationDuration: '5s', animationDelay: '2.5s' }}></div>
                <div className="absolute w-[1px] h-[70%] left-[65%] bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-40 animate-scan-vertical" style={{ animationDuration: '7s', animationDelay: '0.5s', animationDirection: 'reverse' }}></div>
                <div className="absolute w-[1px] h-[45%] left-[80%] bg-gradient-to-b from-transparent via-purple-400 to-transparent opacity-60 animate-scan-vertical" style={{ animationDuration: '4.5s', animationDelay: '3s' }}></div>
                <div className="absolute w-[1px] h-[55%] left-[95%] bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-50 animate-scan-vertical" style={{ animationDuration: '5.5s', animationDelay: '1.5s', animationDirection: 'reverse' }}></div>

                {/* Rotating Clock Rings */}
                <div className="absolute -top-1/2 -left-1/4 w-[1000px] h-[1000px] border-[3px] border-purple-500/30 rounded-full animate-[spin_60s_linear_infinite]"></div>
                <div className="absolute -bottom-1/2 -right-1/4 w-[800px] h-[800px] border-[3px] border-fuchsia-500/30 rounded-full animate-[spin_40s_linear_infinite_reverse]">
                  <div className="absolute top-0 left-1/2 w-6 h-6 bg-fuchsia-400 shadow-[0_0_30px_rgba(232,121,249,0.8)] rounded-full blur-sm"></div>
                </div>

                {/* Pulsing Time Orbs */}
                <div className="absolute top-20 right-20 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 left-20 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl animate-pulse-slow"></div>

                {/* Central Gradient Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0%,transparent_70%)]"></div>
              </div>

              {/* Content */}
              <div className="relative z-10 h-full overflow-hidden">
                <TimeAnalysisView peakHoursData={peakHoursData} dayOfWeekData={dayOfWeekData} />
              </div>
            </div>
          )}

          {
            activeTab === 'trend' && (
              <TrendView trendData={trendData} nextDayForecast={nextDayForecast} />
            )
          }

        </div >
      </main >

      {/* Report Preview Modal */}
      {
        showReportModal && (
          <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-liquid w-full max-w-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <div><h2 className="text-xl font-bold text-white flex items-center gap-2"><ClipboardCopy className="w-5 h-5 text-blue-400" /> ตัวอย่างรายงาน</h2><p className="text-sm text-slate-400">ตรวจสอบความถูกต้องก่อนคัดลอก</p></div>
                <button onClick={() => setShowReportModal(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-6">
                <div className="bg-slate-900/50 rounded-xl border border-white/5 p-4 max-h-[60vh] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 leading-relaxed">{reportText}</pre>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-slate-900/30">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(reportText).then(() => {
                      alert("คัดลอกรายงานเรียบร้อยแล้ว");
                      setShowReportModal(false);
                    });
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                >
                  <ClipboardCopy className="w-4 h-4 mr-2" />
                  คัดลอกรายงาน
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        selectedCase && (
          <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-liquid w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 rounded-2xl">
              <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-slate-900/80 backdrop-blur z-10">
                <div><h2 className="text-xl font-bold text-white">รายละเอียดการจับกุม</h2><p className="text-sm text-slate-400">Case ID: #{selectedCase.id}</p></div>
                <button onClick={() => setSelectedCase(null)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-full"><X className="w-6 h-6" /></button>
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
                      <div><dt className="text-slate-500 text-xs">พิกัด</dt><dd className="text-slate-200 font-mono text-xs">{selectedCase.lat && selectedCase.long ? `${selectedCase.lat}, ${selectedCase.long} ` : '-'}</dd></div>
                      <div><dt className="text-slate-500 text-xs">หัวข้อเรื่อง</dt><dd className="inline-block px-2 py-1 rounded text-xs font-bold text-white mt-1" style={{ backgroundColor: getCrimeColor(selectedCase.topic) }}>{selectedCase.topic}</dd></div>
                      {/* แสดงรายละเอียดจับกุมเพิ่มเติม */}
                      {selectedCase.arrest_type && (<div><dt className="text-slate-500 text-xs mt-2">ประเภทการจับกุม</dt><dd className="text-emerald-400">{selectedCase.arrest_type}</dd></div>)}
                      {selectedCase.captured_by && (<div><dt className="text-slate-500 text-xs mt-2">จับโดย</dt><dd className="text-emerald-400">{selectedCase.captured_by}</dd></div>)}
                    </dl>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-3 flex items-center"><Users className="w-4 h-4 mr-2 text-yellow-500" />ข้อมูลผู้ต้องหา</h3>
                    <dl className="space-y-3 text-sm">
                      <div><dt className="text-slate-500 text-xs">ชื่อ-สกุล</dt><dd className="text-slate-200 font-medium text-lg">{selectedCase.suspect_name}</dd></div>
                      <div><dt className="text-slate-500 text-xs">ข้อหา</dt><dd className="text-slate-200 bg-slate-800 p-2 rounded border border-slate-700 mt-1">{selectedCase.charge || '-'}</dd></div>
                      {selectedCase.warrant_source && (<div><dt className="text-slate-500 text-xs mt-2">ประเภทหมายจับ/ที่มา</dt><dd className="text-pink-400">{selectedCase.warrant_source}</dd></div>)}
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}