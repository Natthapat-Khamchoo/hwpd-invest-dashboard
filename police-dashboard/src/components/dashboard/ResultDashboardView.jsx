import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Truck, Siren, Award, FileText, Zap, ChevronDown, BarChart as ChartIcon, Calendar } from 'lucide-react';

import { fetchDashboardData } from '../../services/GoogleSheetService';
import { UNIT_HIERARCHY } from '../../utils/helpers';

// Import Tab Components
import OverviewTab from './tabs/OverviewTab';
import ComparisonTab from './tabs/ComparisonTab';
import TrafficComparisonTab from './tabs/TrafficComparisonTab';
import TruckInspectionTab from './tabs/TruckInspectionTab';
import PressReleaseTab from './tabs/PressReleaseTab';

const ResultDashboardView = ({ filteredData, filters, setFilters }) => {
    // --- State ---
    const [sheetCounts, setSheetCounts] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState('default'); // 'default' | 'print_all'
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    // Initialize from props if available, else default to now
    const [selectedMonth, setSelectedMonth] = useState(
        (filters && filters.selectedMonth !== undefined) ? filters.selectedMonth : new Date().getMonth()
    );

    // Get initial values from URL if present
    const getInitialParams = () => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        return {
            tab: (tabParam && tabParam !== 'result') ? tabParam : 'overview',
            kk: params.get('kk') || '',
            stl: params.get('stl') || ''
        };
    };

    const initialParams = getInitialParams();
    const [activeTab, setActiveTab] = useState(initialParams.tab);
    const [selectedUnit, setSelectedUnit] = useState(initialParams.kk); // Division (KK)
    const [selectedStation, setSelectedStation] = useState(initialParams.stl); // Station (S.TL)

    const [isPrintRequested, setIsPrintRequested] = useState(false); // Flag for print request

    // --- Effect: Sync State to URL ---
    const updateUrlParams = (tab, kk, stl) => {
        const params = new URLSearchParams(window.location.search);
        if (tab) params.set('tab', tab); else params.delete('tab');
        if (kk) params.set('kk', kk); else params.delete('kk');
        if (stl) params.set('stl', stl); else params.delete('stl');

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setViewMode('default');
        updateUrlParams(tab, selectedUnit, selectedStation);
    };

    const handleUnitSelect = (unitId) => {
        const newUnit = selectedUnit === unitId ? '' : unitId;
        setSelectedUnit(newUnit);
        setSelectedStation(''); // Reset station when unit changes

        // Sync with global App state if setFilters is provided
        if (setFilters) {
            setFilters(prev => ({ ...prev, unit_kk: newUnit ? [newUnit] : [], unit_s_tl: '' }));
        }

        updateUrlParams(activeTab, newUnit, '');
    };

    const handleStationSelect = (stationId) => {
        const newStation = selectedStation === stationId ? '' : stationId;
        setSelectedStation(newStation);

        // Sync with global App state
        if (setFilters) {
            setFilters(prev => ({ ...prev, unit_s_tl: newStation }));
        }

        updateUrlParams(activeTab, selectedUnit, newStation);
    };

    // --- Effect: Handle Popstate (Browser Back/Forward) ---
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab') || 'overview';
            const kk = params.get('kk') || '';
            const stl = params.get('stl') || '';

            setActiveTab(tab);
            setSelectedUnit(kk);
            setSelectedStation(stl);

            if (setFilters) {
                setFilters(prev => ({
                    ...prev,
                    unit_kk: kk ? [kk] : [],
                    unit_s_tl: stl
                }));
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [setFilters]);

    // --- Effect: Fetch Google Sheet Data ---
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Combine App filters with local filters
                const queryFilters = {
                    ...filters, // contains unit_kk, etc. (if passed from App)
                    dateRange,
                    selectedMonth,
                    unit_kk: selectedUnit || filters.unit_kk, // Local overrides App if present
                    unit_s_tl: selectedStation
                };
                const data = await fetchDashboardData(queryFilters);
                // Fix: GoogleSheetService now returns { counts, allCases }, but this view expects just counts
                if (data && data.counts) {
                    setSheetCounts(data.counts);
                } else {
                    setSheetCounts(data);
                }
            } catch (error) {
                console.error("Failed to fetch sheet data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce slightly to avoid rapid refetch
        const timer = setTimeout(() => {
            loadData();
        }, 300);

        return () => clearTimeout(timer);
    }, [filters, dateRange, selectedMonth, selectedUnit, selectedStation]);

    // --- Effect: Handle Export Request ---
    useEffect(() => {
        if (isPrintRequested && viewMode === 'print_all') {
            // Wait for render cycle to complete
            const performExport = async () => {
                // Short delay to ensure DOM is ready
                await new Promise(resolve => setTimeout(resolve, 1500));

                const sections = [
                    { id: 'print-overview', name: 'Overview' },
                    { id: 'print-comparison', name: 'Comparison_Stats' },
                    { id: 'print-traffic', name: 'Traffic_Stats' },
                    { id: 'print-truck', name: 'Truck_Stats' },
                    { id: 'print-press', name: 'Press_Release' }
                ];

                try {
                    for (const section of sections) {
                        const element = document.getElementById(section.id);
                        if (element) {
                            const canvas = await html2canvas(element, {
                                scale: 2, // High quality
                                useCORS: true,
                                backgroundColor: '#ffffff',
                                logging: false,
                                windowWidth: 1920 // Enforce desktop width
                            });

                            const link = document.createElement('a');
                            link.download = `Dashboard_${section.name}_${new Date().toISOString().split('T')[0]}.png`;
                            link.href = canvas.toDataURL('image/png');
                            link.click();

                            // Add delay to prevent browser blocking multiple downloads
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }
                } catch (error) {
                    console.error("Export failed:", error);
                    alert("Export failed. See console for details.");
                } finally {
                    setIsPrintRequested(false);
                }
            };

            performExport();
        }
    }, [isPrintRequested, viewMode]);

    // --- Tab Components ---
    const renderContent = () => {
        if (viewMode === 'print_all') {
            return (
                <div className="flex flex-col gap-10 pb-20 print:block print:gap-0 print:pb-0">
                    {/* --- CSS ปรับปรุงใหม่ (Fix Layout & Height) --- */}
                    <style>{`
                        @media print {
                            @page { 
                                margin: 0.5cm; 
                                size: A4 landscape; 
                            }
                            
                            /* 1. บังคับให้ Browser คิดว่าเป็นจอ Desktop เสมอ */
                            body { 
                                min-width: 1200px !important; 
                                -webkit-print-color-adjust: exact !important; 
                                print-color-adjust: exact !important;
                                /* Font Stability */
                                font-variant-numeric: tabular-nums;
                                letter-spacing: normal !important;
                                font-feature-settings: "kern" 0;
                                -webkit-font-smoothing: antialiased;
                            }

                            /* 2. จัดการ Page Break ให้แม่นยำ */
                            .print-section { 
                                page-break-after: always; 
                                break-inside: avoid; 
                                display: block;
                                width: 100%;
                                margin-bottom: 2rem; /* Added margin */
                                padding-top: 1rem; /* Added padding */
                            }

                            /* ซ่อน Scrollbar */
                            ::-webkit-scrollbar { display: none; }
                            button { display: none !important; }
                            
                            /* แก้ไข Grid ให้บังคับแสดงผลแนวนอน */
                            .print-grid-force {
                                display: grid !important;
                                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                                gap: 2rem !important;
                            }
                        }
                    `}</style>

                    {/* --- ส่วนที่ 1: Overview --- */}
                    <div className="print-section" id="print-overview">
                        <div className="bg-blue-100 p-2 rounded-xl mb-4 text-center font-bold text-xl text-blue-800 border border-blue-200">
                            ส่วนที่ 1: ภาพรวม (Overview)
                        </div>
                        {/* ส่ง Class พิเศษ print-grid-force เข้าไปช่วย */}
                        <div className="print-grid-force w-full">
                            <OverviewTab counts={sheetCounts} isPrint={true} isLoading={isLoading} />
                        </div>
                    </div>

                    {/* --- ส่วนที่ 2: Comparison --- */}
                    <div className="print-section" id="print-comparison">
                        <div className="bg-blue-100 p-2 rounded-xl mb-6 text-center font-bold text-xl text-blue-800 border border-blue-200">
                            ส่วนที่ 2: เปรียบเทียบสถิติการจับกุม (3 เดือน)
                        </div>
                        {/* Remove fixed height to allow auto-expansion */}
                        <div className="w-full border border-slate-100 rounded-xl p-4 min-h-[600px]">
                            <ComparisonTab data={sheetCounts?.charts?.comparison} monthNames={sheetCounts?.charts?.monthNames} />
                        </div>
                    </div>

                    {/* --- ส่วนที่ 3: Traffic --- */}
                    <div className="print-section" id="print-traffic">
                        <div className="bg-blue-100 p-2 rounded-xl mb-6 text-center font-bold text-xl text-blue-800 border border-blue-200">
                            ส่วนที่ 3: เปรียบเทียบสถิติจราจร (3 เดือน)
                        </div>
                        <div className="w-full border border-slate-100 rounded-xl p-4 min-h-[600px]">
                            <TrafficComparisonTab data={sheetCounts?.charts?.traffic} monthNames={sheetCounts?.charts?.monthNames} />
                        </div>
                    </div>

                    {/* --- ส่วนที่ 4: Truck (ปรับลดความสูงพิเศษ) --- */}
                    <div className="print-section" id="print-truck">
                        <div className="bg-blue-100 p-2 rounded-xl mb-6 text-center font-bold text-xl text-blue-800 border border-blue-200">
                            ส่วนที่ 4: สถิติรถบรรทุก
                        </div>
                        {/* ลดกราฟเหลือ 350px เพื่อให้เหลือที่ใส่การ์ดสรุปด้านล่างในหน้าเดียวกัน */}
                        <div className="w-full border border-slate-100 rounded-xl p-4 mb-4 min-h-[500px]">
                            <TruckInspectionTab data={sheetCounts?.charts?.truck} />
                        </div>
                    </div>

                    {/* --- ส่วนที่ 5: Press --- */}
                    <div className="print-section" id="print-press">
                        <div className="bg-blue-100 p-2 rounded-xl text-center font-bold text-xl text-blue-800 border border-blue-200">
                            ส่วนที่ 5: แถลงข่าวและสื่อประชาสัมพันธ์
                        </div>
                        <PressReleaseTab qualityWork={sheetCounts?.charts?.qualityWork} media={sheetCounts?.charts?.media} />
                    </div>
                </div>
            );
        }

        switch (activeTab) {
            case 'overview': return <OverviewTab counts={sheetCounts} isLoading={isLoading} />;
            case 'comparison': return <ComparisonTab data={sheetCounts?.charts?.comparison} monthNames={sheetCounts?.charts?.monthNames} />;
            case 'traffic-comparison': return <TrafficComparisonTab data={sheetCounts?.charts?.traffic} monthNames={sheetCounts?.charts?.monthNames} />;
            case 'press': return <PressReleaseTab qualityWork={sheetCounts?.charts?.qualityWork} media={sheetCounts?.charts?.media} />;
            case 'truck': return <TruckInspectionTab data={sheetCounts?.charts?.truck} />;
            default: return <OverviewTab counts={sheetCounts} isLoading={isLoading} />;
        }
    };

    // --- Helper for Header Date ---
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

    const formatThaiDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543} `;
    };

    let headerDate = "";
    if (dateRange.start && dateRange.end) {
        headerDate = `${formatThaiDate(dateRange.start)} - ${formatThaiDate(dateRange.end)} `;
    } else if (selectedMonth !== '') {
        headerDate = `${months[selectedMonth]} ${new Date().getFullYear() + 543} `;
    } else {
        const yearStr = (new Date().getFullYear() + 543).toString();
        const currentMonth = months[new Date().getMonth()];
        headerDate = `${currentMonth} ${yearStr} `;
    }

    return (
        <div className="h-full w-full overflow-y-auto bg-slate-100 font-sans p-4 sm:p-6 lg:p-10 print:p-0 print:bg-white">
            <div className={`max-w-[1800px] mx-auto min-h-[85vh] flex flex-col gap-6 bg-white shadow-2xl rounded-2xl md:rounded-[3rem] overflow-hidden border border-slate-200 ${viewMode === 'print_all' ? 'print-mode' : ''} print:max-w-none print:w-full print:min-h-0 print:overflow-visible`}>

                {/* --- Header Section --- */}
                <div className="flex flex-col md:flex-row h-auto md:h-32 shadow-md relative overflow-hidden bg-white z-20">
                    {/* Left: Gray Section */}
                    <div className="bg-[#5e666e] w-full md:w-[45%] lg:w-[42%] flex flex-col md:flex-row items-center justify-center md:justify-start px-4 md:px-6 lg:px-10 py-4 md:py-0 gap-3 md:gap-4 lg:gap-6 relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
                        <img
                            src="https://cib.go.th/backend/uploads/medium_logo_cib_4_2x_9f2da10e9f_a7828c9ca0.png"
                            alt="Logo"
                            className="w-16 h-16 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 object-contain drop-shadow-md shrink-0"
                        />
                        <h2 className="text-xl md:text-xl lg:text-2xl xl:text-4xl font-normal text-white tracking-wide whitespace-nowrap leading-tight text-center md:text-left">
                            กองบังคับการตำรวจทางหลวง
                        </h2>
                        <div className="absolute top-0 right-[-40px] w-40 h-full bg-[#5e666e] transform skew-x-[-20deg] z-[-1] hidden md:block"></div>
                    </div>

                    {/* Right: Blue Section */}
                    <div className="bg-[#0047ba] flex-1 flex flex-col md:flex-row items-center justify-center md:justify-end md:pr-8 lg:pr-16 py-4 md:py-6 px-4 md:pl-16 relative z-10 text-center md:text-right border-t md:border-t-0 border-white/10">
                        <div className="flex flex-col items-center md:items-end w-full">
                            <h1 className="text-xl md:text-xl lg:text-2xl xl:text-4xl font-bold text-white flex flex-col md:flex-row items-center md:justify-end gap-2">
                                <span>ผลการปฏิบัติภาพรวม</span>
                                <span className="text-[#fbbf24] font-extrabold bg-transparent text-xl md:text-xl lg:text-2xl xl:text-4xl shadow-none p-0 inline-block">{headerDate}</span>
                            </h1>
                        </div>
                    </div>
                </div>

                {/* --- Filter Section (New Tab Design) --- */}
                <div className="flex flex-col border-b border-slate-200 bg-slate-50">
                    {/* Level 1: Divisions (KK) */}
                    <div className="flex items-center gap-2 overflow-x-auto p-4 no-scrollbar">
                        <button
                            onClick={() => handleUnitSelect('')}
                            className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm ${selectedUnit === ''
                                ? 'bg-blue-600 text-white shadow-blue-500/30'
                                : 'bg-white text-slate-600 hover:bg-white hover:text-blue-600 border border-slate-200'
                                }`}
                        >
                            ทุกกองกำกับการ
                        </button>
                        {[...Array(8)].map((_, i) => {
                            const unitId = String(i + 1);
                            const isActive = selectedUnit === unitId;
                            return (
                                <button
                                    key={unitId}
                                    onClick={() => handleUnitSelect(unitId)}
                                    className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm whitespace-nowrap ${isActive
                                        ? 'bg-blue-600 text-white shadow-blue-500/30'
                                        : 'bg-white text-slate-600 hover:bg-white hover:text-blue-600 border border-slate-200'
                                        }`}
                                >
                                    กก.{unitId}
                                </button>
                            );
                        })}
                    </div>

                    {/* Level 2: Stations (S.TL) - Only show if unit selected */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-blue-50/50 ${selectedUnit ? 'max-h-20 opacity-100 border-t border-blue-100' : 'max-h-0 opacity-0'}`}>
                        <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
                            <div className="flex-shrink-0 text-sm font-bold text-blue-800 mr-2 flex items-center">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                                เลือกสถานี:
                            </div>
                            <button
                                onClick={() => handleStationSelect('')}
                                className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${selectedStation === ''
                                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                                    : 'bg-white text-slate-500 hover:bg-blue-50 border-slate-200'
                                    }`}
                            >
                                ทั้งหมดใน กก.{selectedUnit}
                            </button>
                            {selectedUnit && UNIT_HIERARCHY[selectedUnit] && [...Array(UNIT_HIERARCHY[selectedUnit])].map((_, i) => {
                                const stationId = String(i + 1);
                                const isActive = selectedStation === stationId;
                                return (
                                    <button
                                        key={stationId}
                                        onClick={() => handleStationSelect(stationId)}
                                        className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${isActive
                                            ? 'bg-blue-500 text-white border-blue-600 shadow-sm'
                                            : 'bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600 border-slate-200'
                                            }`}
                                    >
                                        ส.ทล.{stationId}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* --- Navigation & Calendar Filters --- */}
                <div className="px-4 md:px-10 py-4 flex flex-col xl:flex-row items-center justify-between gap-4 md:gap-6 border-b border-slate-100 print:hidden">
                    {/* Tabs - Mobile Dropdown */}
                    <div className="block xl:hidden w-full">
                        <div className="relative">
                            <select
                                value={activeTab}
                                onChange={(e) => handleTabChange(e.target.value)}
                                className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-3 px-4 pr-8 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold"
                            >
                                <option value="overview">ภาพรวม</option>
                                <option value="comparison">เปรียบเทียบอาญา</option>
                                <option value="traffic-comparison">เปรียบเทียบจราจร</option>
                                <option value="truck">สถิติรถบรรทุก</option>
                                <option value="press">ประชาสัมพันธ์</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                                <ChevronDown size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Tabs - Desktop Buttons */}
                    <div className="hidden xl:flex bg-slate-100 p-1.5 rounded-2xl shadow-inner gap-2 overflow-x-auto w-full xl:w-auto no-scrollbar">
                        <TabButton
                            active={activeTab === 'overview' && viewMode !== 'print_all'}
                            onClick={() => handleTabChange('overview')}
                            label="ภาพรวม"
                            icon={<Award size={18} />}
                        />
                        <TabButton
                            active={activeTab === 'comparison' && viewMode !== 'print_all'}
                            onClick={() => handleTabChange('comparison')}
                            label="เปรียบเทียบอาญา"
                            icon={<ChartIcon size={18} />}
                        />
                        <TabButton
                            active={activeTab === 'traffic-comparison' && viewMode !== 'print_all'}
                            onClick={() => handleTabChange('traffic-comparison')}
                            label="เปรียบเทียบจราจร"
                            icon={<Siren size={18} />}
                        />
                        <TabButton
                            active={activeTab === 'truck' && viewMode !== 'print_all'}
                            onClick={() => handleTabChange('truck')}
                            label="สถิติรถบรรทุก"
                            icon={<Truck size={18} />}
                        />
                        <TabButton
                            active={activeTab === 'press' && viewMode !== 'print_all'}
                            onClick={() => handleTabChange('press')}
                            label="ประชาสัมพันธ์"
                            icon={<Zap size={18} />}
                        />

                    </div>


                </div>

                {/* Calendar Filter */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 border-none sm:border-r sm:border-slate-200 pr-0 sm:pr-4 w-full sm:w-auto justify-between sm:justify-start">
                        <span className="text-sm font-medium">เดือน:</span>
                        <select
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex-1 sm:flex-none"
                            value={selectedMonth}
                            onChange={(e) => {
                                const newMonth = parseInt(e.target.value);
                                setSelectedMonth(newMonth);
                                setDateRange({ start: '', end: '' }); // Clear manual range if month is picked
                                if (setFilters) setFilters(prev => ({ ...prev, selectedMonth: newMonth, rangeStart: null, rangeEnd: null }));
                            }}
                        >
                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Calendar size={20} />
                            <span className="text-sm font-medium hidden sm:inline">ช่วงเวลา:</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 sm:flex-none">
                            <input
                                type="date"
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                                value={dateRange.start}
                                onChange={(e) => {
                                    const newStart = e.target.value;
                                    setDateRange({ ...dateRange, start: newStart });
                                    setSelectedMonth(''); // Clear month selection if manual range is used
                                    if (setFilters) setFilters(prev => ({ ...prev, selectedMonth: '', rangeStart: newStart ? new Date(newStart) : null, rangeEnd: dateRange.end ? new Date(dateRange.end) : null }));
                                }}
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                                value={dateRange.end}
                                onChange={(e) => {
                                    const newEnd = e.target.value;
                                    setDateRange({ ...dateRange, end: newEnd });
                                    setSelectedMonth(''); // Clear month selection if manual range is used
                                    if (setFilters) setFilters(prev => ({ ...prev, selectedMonth: '', rangeStart: dateRange.start ? new Date(dateRange.start) : null, rangeEnd: newEnd ? new Date(newEnd) : null }));
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* --- Content Area --- */}
                <div className="flex-1 bg-white min-h-[600px]">
                    {renderContent()}
                </div>

                {/* Footer Design Line (Global) */}
                <div className="h-4 w-full bg-[#004aad] mt-auto"></div>
            </div>
        </div >
    );
};

// --- Sub-Components ---
const TabButton = ({ active, onClick, label, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 md:px-6 py-2 md:py-3 rounded-xl font-bold text-sm md:text-lg transition-all duration-300 whitespace-nowrap ${active
            ? 'bg-white text-[#004aad] shadow-md scale-105 ring-1 md:ring-2 ring-[#004aad]/10'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
    >
        {icon}
        {label}
    </button>
);

export default ResultDashboardView;