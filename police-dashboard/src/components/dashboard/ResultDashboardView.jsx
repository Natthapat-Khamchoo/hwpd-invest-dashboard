import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Truck, Siren, Crown, Mail, ShieldAlert, Award, FileText, Zap, ChevronDown, ChevronUp, BarChart as ChartIcon, ExternalLink, Calendar, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { fetchDashboardData } from '../../services/GoogleSheetService';

const ResultDashboardView = ({ filteredData, filters }) => {
    // --- State ---
    const [sheetCounts, setSheetCounts] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [viewMode, setViewMode] = useState('default'); // 'default' | 'print_all'
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // Default to current month
    const [selectedUnit, setSelectedUnit] = useState(''); // Division (KK)
    const [selectedStation, setSelectedStation] = useState(''); // Station (S.TL)

    const [isPrintRequested, setIsPrintRequested] = useState(false); // Flag for print request

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
                                logging: false
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
                    <div className="bg-[#5e666e] w-full md:w-[42%] flex items-center px-4 md:px-12 py-4 md:py-0 gap-3 md:gap-6 relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
                        <img
                            src="https://cib.go.th/backend/uploads/medium_logo_cib_4_2x_9f2da10e9f_a7828c9ca0.png"
                            alt="Logo"
                            className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-md shrink-0"
                        />
                        <h2 className="text-xl md:text-3xl lg:text-4xl font-normal text-white tracking-wide whitespace-normal md:whitespace-nowrap leading-tight">กองบังคับการตำรวจทางหลวง</h2>
                        <div className="absolute top-0 right-[-40px] w-40 h-full bg-[#5e666e] transform skew-x-[-20deg] z-[-1] hidden md:block"></div>
                    </div>

                    {/* Right: Blue Section */}
                    <div className="bg-[#0047ba] flex-1 flex items-center justify-center md:justify-end md:pr-16 py-4 md:py-6 px-4 md:pl-20 relative z-10 text-center md:text-right border-t md:border-t-0 border-white/10">
                        <h1 className="text-2xl md:text-4xl font-bold text-white">
                            ผลการปฏิบัติภาพรวม <span className="text-[#fbbf24] ml-2 font-extrabold block md:inline">{headerDate}</span>
                        </h1>
                    </div>
                </div>

                {/* --- Filter Section (New) --- */}
                <div className="px-4 md:px-12 py-4 flex flex-wrap gap-4 items-center bg-slate-50 border-b border-slate-200">
                    {/* Division (KK) Filter */}
                    <select
                        className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                        value={selectedUnit}
                        onChange={(e) => {
                            setSelectedUnit(e.target.value);
                            setSelectedStation(''); // Reset station when unit changes
                        }}
                    >
                        <option value="">ทุกกองกำกับการ (All Divisions)</option>
                        {[...Array(8)].map((_, i) => (
                            <option key={i + 1} value={String(i + 1)}>{`กก.${i + 1}`}</option>
                        ))}
                    </select>

                    {/* Station (S.TL) Filter - Only enabled if Unit is selected? Or allow free type? 
                        For now, let's keep it simple: Station Number input or dropdown if we knew the list.
                        Since we don't have a dynamic list of stations per unit loaded, let's use a text input or simple number dropdown for now 
                        OR assuming standard pattern: if KK.1 selected, maybe S.TL 1, 2... ? 
                        Let's use a generic subset of numbers for now or just allow typing the number.
                        Actually, existing data has stations like "ส.ทล.1 กก.1". 
                        The user likely wants to pick "1" which implies "ส.ทล.1".
                    */}
                    <select
                        className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                        value={selectedStation}
                        onChange={(e) => setSelectedStation(e.target.value)}
                        disabled={!selectedUnit} // Optional: easy way to guide user
                    >
                        <option value="">ทุกสถานี (All Stations)</option>
                        {[...Array(6)].map((_, i) => ( // Arbitrary limit, maybe up to 6 stations per KK?
                            <option key={i + 1} value={String(i + 1)}>{`ส.ทล.${i + 1}`}</option>
                        ))}
                    </select>

                    <div className="text-sm text-slate-500 ml-auto">
                        * เลือก กก. ก่อนเพื่อเลือก ส.ทล.
                    </div>
                </div>

                {/* --- Navigation & Calendar Filters --- */}
                <div className="px-4 md:px-10 py-4 flex flex-col xl:flex-row items-center justify-between gap-4 md:gap-6 border-b border-slate-100 print:hidden">
                    {/* Tabs */}
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner gap-2 overflow-x-auto w-full xl:w-auto no-scrollbar">
                        <TabButton
                            active={activeTab === 'overview' && viewMode !== 'print_all'}
                            onClick={() => { setActiveTab('overview'); setViewMode('default'); }}
                            label="ภาพรวม"
                            icon={<Award size={18} />}
                        />
                        <TabButton
                            active={activeTab === 'comparison' && viewMode !== 'print_all'}
                            onClick={() => { setActiveTab('comparison'); setViewMode('default'); }}
                            label="เปรียบเทียบอาญา"
                            icon={<ChartIcon size={18} />}
                        />
                        <TabButton
                            active={activeTab === 'traffic-comparison' && viewMode !== 'print_all'}
                            onClick={() => { setActiveTab('traffic-comparison'); setViewMode('default'); }}
                            label="เปรียบเทียบจราจร"
                            icon={<ChartIcon size={18} />}
                        />
                        <TabButton
                            active={activeTab === 'press' && viewMode !== 'print_all'}
                            onClick={() => { setActiveTab('press'); setViewMode('default'); }}
                            label="สื่อ"
                            icon={<ExternalLink size={18} />}
                        />
                        <TabButton
                            active={activeTab === 'truck' && viewMode !== 'print_all'}
                            onClick={() => { setActiveTab('truck'); setViewMode('default'); }}
                            label="รถหนัก"
                            icon={<Truck size={18} />}
                        />

                        {/* Full Page Toggle */}
                        <div className="w-[1px] h-6 bg-slate-300 mx-1 self-center"></div>
                        <button
                            onClick={() => setViewMode(viewMode === 'print_all' ? 'default' : 'print_all')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all duration-300 shadow-sm whitespace-nowrap text-sm ${viewMode === 'print_all'
                                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                                : 'bg-white text-emerald-600 hover:bg-emerald-50'
                                }`}
                        >
                            <Download size={18} />
                        </button>

                        <button
                            onClick={() => {
                                setViewMode('print_all');
                                setIsPrintRequested(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold bg-white text-rose-600 hover:bg-rose-50 transition-all duration-300 shadow-sm whitespace-nowrap border border-white text-sm"
                        >
                            <FileText size={18} />
                        </button>
                    </div>

                    {/* Calendar Filter */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2 text-slate-500 border-none sm:border-r sm:border-slate-200 pr-0 sm:pr-4 w-full sm:w-auto justify-between sm:justify-start">
                            <span className="text-sm font-medium">เดือน:</span>
                            <select
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex-1 sm:flex-none"
                                value={selectedMonth}
                                onChange={(e) => {
                                    setSelectedMonth(parseInt(e.target.value));
                                    setDateRange({ start: '', end: '' }); // Clear manual range if month is picked
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
                                        setDateRange({ ...dateRange, start: e.target.value });
                                        setSelectedMonth(''); // Clear month selection if manual range is used
                                    }}
                                />
                                <span className="text-slate-400">-</span>
                                <input
                                    type="date"
                                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                                    value={dateRange.end}
                                    onChange={(e) => {
                                        setDateRange({ ...dateRange, end: e.target.value });
                                        setSelectedMonth(''); // Clear month selection if manual range is used
                                    }}
                                />
                            </div>
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
        </div>
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

// --- Overview Tab (Updated with Sheet Data) ---
const OverviewTab = ({ counts, isPrint = false, isLoading = false }) => {
    const [isTruckExpanded, setIsTruckExpanded] = useState(true);

    const defaultCounts = {
        criminalTotal: 0,
        warrantTotal: 0,
        warrantBodyworn: 0,
        warrantBigData: 0,
        warrantGeneral: 0,
        flagrantTotal: 0,
        flagrantAlien: 0,
        flagrantDrugs: 0,
        flagrantGuns: 0,
        flagrantTruck: 0,
        flagrantDocs: 0,
        flagrantOther: 0,
        trafficTotal: 0,
        trafficNotKeepLeft: 0,
        trafficNotCovered: 0,
        trafficModify: 0,
        trafficNoPart: 0,
        trafficSign: 0,
        trafficLight: 0,
        trafficSpeed: 0,
        trafficTax: 0,
        trafficNoPlate: 0,
        trafficGeneral: 0,
        truckTotal: 0,
        truckSelf: 0,
        truckJoint: 0,
        convoyTotal: 0,
        convoyRoyal: 0,
        convoyGeneral: 0,
        offenseDrugs: 0,
        offenseGuns: 0,
        offenseImmig: 0,
        offenseCustoms: 0,
        offenseDisease: 0,
        offenseTransport: 0,
        offenseDocs: 0,
        offenseProperty: 0,
        offenseSex: 0,
        offenseWeight: 0,
        offenseDrunk: 0,
        offenseLife: 0,
        offenseCom: 0,
        offenseOther: 0,
        seized: {
            drugs: { yaba: 0, ice: 0, ketamine: 0, other: 0 },
            guns: { registered: 0, unregistered: 0, bullets: 0, explosives: 0 },
            vehicles: { car: 0, bike: 0 },
            others: { money: 0, account: 0, phone: 0, items: 0 }
        }
    };

    const safeCounts = counts ? {
        ...defaultCounts,
        ...counts,
        seized: {
            drugs: { ...defaultCounts.seized.drugs, ...(counts.seized?.drugs || {}) },
            guns: { ...defaultCounts.seized.guns, ...(counts.seized?.guns || {}) },
            vehicles: { ...defaultCounts.seized.vehicles, ...(counts.seized?.vehicles || {}) },
            others: { ...defaultCounts.seized.others, ...(counts.seized?.others || {}) }
        }
    } : defaultCounts;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="text-slate-500 font-bold animate-pulse">กำลังดึงข้อมูลจากฐานข้อมูล...</span>
                </div>
            </div>
        );
    }

    // ★★★ NEW: Print Layout Logic ★★★
    if (isPrint) {
        return (
            <div className="w-full text-sm">
                <div className="grid grid-cols-2 gap-6 items-start">
                    {/* --- Left Column --- */}
                    <div className="flex flex-col gap-4">
                        {/* Criminal */}
                        <div className="border border-slate-300 rounded-xl p-3 bg-white">
                            <div className="mb-3">
                                <NodeCard color="bg-[#fbbf24]" label="จับกุมทั้งหมด (คดี)" value={safeCounts.criminalTotal} valueColor="bg-[#dc2626]" textColor="text-[#1c2e4a]" scale="" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                                    <div className="flex justify-between items-center mb-1 border-b border-slate-200 pb-1">
                                        <span className="font-bold text-slate-700">หมายจับ</span>
                                        <span className="bg-[#dc2626] text-white px-2 rounded-md text-sm font-bold">{safeCounts.warrantTotal}</span>
                                    </div>
                                    <SimpleItemCompact text="Bodyworn" value={safeCounts.warrantBodyworn} />
                                    <SimpleItemCompact text="Bigdata" value={safeCounts.warrantBigData} />
                                    <SimpleItemCompact text="ทั่วไป" value={safeCounts.warrantGeneral} />
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                                    <div className="flex justify-between items-center mb-1 border-b border-slate-200 pb-1">
                                        <span className="font-bold text-slate-700">ซึ่งหน้า</span>
                                        <span className="bg-[#dc2626] text-white px-2 rounded-md text-sm font-bold">{safeCounts.flagrantTotal}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 text-center py-2">รวมจับกุมซึ่งหน้า</div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                                    <div className="flex justify-between items-center mb-1 border-b border-slate-200 pb-1">
                                        <span className="font-bold text-slate-700">ฐานความผิด</span>
                                    </div>
                                    <SimpleItemCompact text="ยาเสพติด" value={safeCounts.offenseDrugs} />
                                    <SimpleItemCompact text="อาวุธปืน" value={safeCounts.offenseGuns} />
                                    <SimpleItemCompact text="ตม." value={safeCounts.offenseImmig} />
                                    <SimpleItemCompact text="ศุลกากร" value={safeCounts.offenseCustoms} />
                                    <SimpleItemCompact text="โรคติดต่อ" value={safeCounts.offenseDisease} />
                                    <SimpleItemCompact text="ขนส่ง" value={safeCounts.offenseTransport} />
                                    <SimpleItemCompact text="เอกสาร" value={safeCounts.offenseDocs} />
                                    <SimpleItemCompact text="ทรัพย์" value={safeCounts.offenseProperty} />
                                    <SimpleItemCompact text="เพศ" value={safeCounts.offenseSex} />
                                    <SimpleItemCompact text="รถหนัก" value={safeCounts.offenseWeight} />
                                    <SimpleItemCompact text="เมาสุรา" value={safeCounts.offenseDrunk} />
                                    <SimpleItemCompact text="ชีวิต/ร่างกาย" value={safeCounts.offenseLife} />
                                    <SimpleItemCompact text="คอมฯ" value={safeCounts.offenseCom} />
                                    <SimpleItemCompact text="อื่นๆ" value={safeCounts.offenseOther} />
                                </div>
                            </div>
                        </div>
                        {/* Traffic */}
                        <div className="border border-slate-300 rounded-xl p-3 bg-white">
                            <div className="mb-3">
                                <NodeCard color="bg-[#fbbf24]" label="จับกุมคดีจราจร" value={safeCounts.trafficTotal} valueColor="bg-[#dc2626]" textColor="text-[#1c2e4a]" scale="" />
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <SimpleItemCompact text="ไม่ชิดซ้าย" value={safeCounts.trafficNotKeepLeft} />
                                <SimpleItemCompact text="ไม่ปกคลุม" value={safeCounts.trafficNotCovered} />
                                <SimpleItemCompact text="ดัดแปลงสภาพ" value={safeCounts.trafficModify} />
                                <SimpleItemCompact text="อุปกรณ์ไม่ครบ" value={safeCounts.trafficNoPart} />
                                <SimpleItemCompact text="ฝ่าฝืนป้าย" value={safeCounts.trafficSign} />
                                <SimpleItemCompact text="ฝ่าฝืนไฟ" value={safeCounts.trafficLight} />
                                <SimpleItemCompact text="ความเร็ว" value={safeCounts.trafficSpeed} />
                                <SimpleItemCompact text="ภาษี/พรบ." value={safeCounts.trafficTax} />
                                <SimpleItemCompact text="ไม่ติดป้าย" value={safeCounts.trafficNoPlate} />
                                <SimpleItemCompact text="อื่นๆ" value={safeCounts.trafficGeneral} />
                            </div>
                        </div>
                    </div>

                    {/* --- Right Column --- */}
                    <div className="flex flex-col gap-4">
                        {/* Truck & Convoy */}
                        <div className="border border-slate-300 rounded-xl p-3 bg-white flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <NodeCard color="bg-[#fbbf24]" label="รถหนัก" value={safeCounts.truckTotal} valueColor="bg-[#dc2626]" textColor="text-[#1c2e4a]" scale="" />
                                </div>
                                <div className="w-1/3 flex flex-col gap-1 text-xs">
                                    <div className="bg-slate-100 rounded px-2 py-1 flex justify-between items-center border border-slate-200">
                                        <span>จับเอง</span>
                                        <span className="font-bold text-red-600 text-lg">{safeCounts.truckSelf}</span>
                                    </div>
                                    <div className="bg-slate-100 rounded px-2 py-1 flex justify-between items-center border border-slate-200">
                                        <span>ร่วมฯ</span>
                                        <span className="font-bold text-red-600 text-lg">{safeCounts.truckJoint}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 border-t border-slate-200 pt-3">
                                <div className="flex-1">
                                    <NodeCard color="bg-[#fbbf24]" label="ขบวน" value={safeCounts.convoyTotal} valueColor="bg-[#dc2626]" textColor="text-[#1c2e4a]" scale="" />
                                </div>
                                <div className="w-1/3 flex flex-col gap-1 text-xs">
                                    <div className="bg-slate-100 rounded px-2 py-1 flex justify-between items-center border border-slate-200">
                                        <span>เสด็จ</span>
                                        <span className="font-bold text-red-600 text-lg">{safeCounts.convoyRoyal}</span>
                                    </div>
                                    <div className="bg-slate-100 rounded px-2 py-1 flex justify-between items-center border border-slate-200">
                                        <span>ทั่วไป</span>
                                        <span className="font-bold text-red-600 text-lg">{safeCounts.convoyGeneral}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Seized Items */}
                        <div className="border border-blue-300 bg-blue-50/40 rounded-xl p-3">
                            <h3 className="text-lg font-bold text-blue-800 mb-2 flex items-center gap-2">
                                <span className="w-1 h-5 bg-blue-600 rounded"></span> ของกลาง (Seized Items)
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <SeizedBox title="ยาเสพติด" items={[
                                    { l: "ยาบ้า", v: safeCounts.seized.drugs.yaba.toLocaleString(), u: "เม็ด" },
                                    { l: "ไอซ์", v: safeCounts.seized.drugs.ice.toLocaleString(), u: "กรัม" },
                                    { l: "เคตามีน", v: safeCounts.seized.drugs.ketamine.toLocaleString(), u: "กรัม" }
                                ]} />
                                <SeizedBox title="อาวุธปืน" items={[
                                    { l: "มีทะเบียน", v: safeCounts.seized.guns.registered.toLocaleString(), u: "กระบอก" },
                                    { l: "ไม่มีทะเบียน", v: safeCounts.seized.guns.unregistered.toLocaleString(), u: "กระบอก" },
                                    { l: "กระสุน", v: safeCounts.seized.guns.bullets.toLocaleString(), u: "นัด" }
                                ]} />
                                <SeizedBox title="ยานพาหนะ" items={[
                                    { l: "รถยนต์", v: safeCounts.seized.vehicles.car.toLocaleString(), u: "คัน" },
                                    { l: "จยย.", v: safeCounts.seized.vehicles.bike.toLocaleString(), u: "คัน" }
                                ]} />
                                <SeizedBox title="อื่นๆ" items={[
                                    { l: "เงินสด", v: safeCounts.seized.others.money.toLocaleString(), u: "บาท" },
                                    { l: "บัญชี", v: safeCounts.seized.others.account.toLocaleString(), u: "บช." },
                                    { l: "มือถือ", v: safeCounts.seized.others.phone.toLocaleString(), u: "เครื่อง" }
                                ]} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Original Layout (For Screen) ---
    return (
        <div className="flex flex-col gap-10">
            {/* --- Main Grid Content --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 lg:gap-10 p-4 md:p-6 xl:p-10 items-start flex-1">
                {/* 1. Criminal */}
                <div className="flex flex-col items-center w-full">
                    <NodeCard color="bg-[#fbbf24]" label="จับกุมทั้งหมด (คดี)" value={safeCounts.criminalTotal} valueColor="bg-[#dc2626]" textColor="text-[#1c2e4a]" scale="hover:scale-105" />

                    <div className="w-full flex flex-col mt-0 gap-4 relative px-0">
                        {/* Top Row: Warrant & Flagrant */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
                            <div className="flex flex-col items-center w-full pt-8 relative">
                                {/* Connecting Line Top (Left) */}
                                <div className="absolute top-0 left-1/2 w-[calc(50%+1rem)] h-8 border-t-4 border-l-4 border-slate-300 rounded-tl-3xl hidden xl:block"></div>

                                <SubNodeHeader label="หมายจับ" value={safeCounts.warrantTotal} badgeColor="bg-[#dc2626]" />
                                <div className="flex flex-col gap-3 w-full mt-4 pl-6 border-l-[3px] border-slate-200 ml-8">
                                    <ListItem label="Bodyworn" value={safeCounts.warrantBodyworn || 0} highlight />
                                    <ListItem label="Bigdata" value={safeCounts.warrantBigData} highlight />
                                    <ListItem label="ทั่วไป" value={safeCounts.warrantGeneral} />
                                </div>
                            </div>
                            <div className="flex flex-col items-center w-full pt-8 relative">
                                {/* Connecting Line Top (Right) */}
                                <div className="absolute top-0 right-1/2 w-[calc(50%+1rem)] h-8 border-t-4 border-r-4 border-slate-300 rounded-tr-3xl hidden xl:block"></div>

                                <SubNodeHeader label="ความผิดซึ่งหน้า" value={safeCounts.flagrantTotal} badgeColor="bg-[#dc2626]" />
                                <div className="flex flex-col gap-3 w-full mt-4 pl-6 border-l-[3px] border-slate-200 ml-8">
                                    <span className="text-slate-400 text-sm italic">รวมสถิติการจับกุมซึ่งหน้าทั้งหมด</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row: Offense Base */}
                        <div className="flex flex-col items-center w-full mt-4 pt-4 border-t-2 border-dashed border-slate-100 relative">
                            <SubNodeHeader label="ฐานความผิด" value={null} badgeColor="bg-slate-500" />
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-3 w-full mt-4 pl-6 border-l-[3px] border-slate-200 ml-8">
                                <ListItem label="พ.ร.บ.ยาเสพติด" value={safeCounts.offenseDrugs} highlight />
                                <ListItem label="พ.ร.บ.อาวุธปืน" value={safeCounts.offenseGuns} highlight />
                                <ListItem label="พ.ร.บ.คนเข้าเมือง" value={safeCounts.offenseImmig} highlight />
                                <ListItem label="พ.ร.บ.ศุลกากร" value={safeCounts.offenseCustoms} highlight />
                                <ListItem label="พ.ร.บ.โรคติดต่อ" value={safeCounts.offenseDisease} highlight />
                                <ListItem label="พ.ร.บ.ขนส่ง" value={safeCounts.offenseTransport} highlight />
                                <ListItem label="ความผิดเกี่ยวกับเอกสาร" value={safeCounts.offenseDocs} highlight />
                                <ListItem label="ความผิดเกี่ยวกับทรัพย์" value={safeCounts.offenseProperty} highlight />
                                <ListItem label="ความผิดเกี่ยวกับเพศ" value={safeCounts.offenseSex} highlight />
                                <ListItem label="รถหนัก" value={safeCounts.offenseWeight} highlight />
                                <ListItem label="ขับรถขณะเมาสุรา" value={safeCounts.offenseDrunk} highlight />
                                <ListItem label="ความผิดเกี่ยวกับชีวิตและร่างกาย" value={safeCounts.offenseLife} highlight />
                                <ListItem label="ความผิดเกี่ยวกับคอมพิวเตอร์" value={safeCounts.offenseCom} highlight />
                                <ListItem label="อื่นๆ" value={safeCounts.offenseOther} highlight />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Traffic */}
                <div className="flex flex-col items-center w-full">
                    <NodeCard color="bg-[#fbbf24]" label="จับกุมคดีจราจร" value={safeCounts.trafficTotal} valueColor="bg-[#dc2626]" textColor="text-[#1c2e4a]" scale="hover:scale-105" />
                    <div className="hidden xl:flex flex-col items-center w-full relative">
                        <div className="h-8 w-1 bg-slate-300"></div>
                        <div className="absolute top-8 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-slate-300 -z-10"></div>
                    </div>
                    <div className="w-full flex flex-col items-center mt-0 px-0 relative z-10">
                        <div className="flex flex-col items-center flex-1 w-full pt-8">
                            <div className="flex flex-col gap-3 w-full pl-6 border-l-[3px] border-slate-200 ml-8">
                                <SimpleItem text="ไม่ชิดซ้าย" value={safeCounts.trafficNotKeepLeft} />
                                <SimpleItem text="ไม่ปกคลุม" value={safeCounts.trafficNotCovered} />
                                <SimpleItem text="ดัดแปลงสภาพรถ" value={safeCounts.trafficModify} />
                                <SimpleItem text="อุปกรณ์ส่วนควบไม่ครบ" value={safeCounts.trafficNoPart} />
                                <SimpleItem text="ฝ่าฝืนเครื่องหมายจราจร" value={safeCounts.trafficSign} />
                                <SimpleItem text="ฝ่าฝืนเครื่องสัญญาณไฟจราจร" value={safeCounts.trafficLight} />
                                <SimpleItem text="ขับรถเร็วเกินกำหนด" value={safeCounts.trafficSpeed} />
                                <SimpleItem text="ขาดต่อภาษี/พ.ร.บ.ฯ" value={safeCounts.trafficTax} />
                                <SimpleItem text="ไม่ติดแผ่นป้ายทะเบียน" value={safeCounts.trafficNoPlate} />
                                <SimpleItem text="อื่นๆ" value={safeCounts.trafficGeneral} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Convoy & Heavy Truck */}
                <div className="col-span-1 md:col-span-2 xl:col-span-2 bg-white/50 rounded-[2.5rem] border-2 border-slate-200 shadow-sm p-4 xl:p-8 flex flex-col xl:flex-row gap-8 xl:gap-16">
                    <div className="flex flex-col items-center flex-1 w-full">
                        <NodeCard color="bg-[#fbbf24]" label="ขบวน" value={safeCounts.convoyTotal} valueColor="bg-[#dc2626]" textColor="text-[#1c2e4a]" scale="hover:scale-105" />
                        <div className="hidden xl:flex flex-col items-center w-full">
                            <div className="h-6 w-1 bg-slate-300"></div>
                            <div className="w-[85%] h-1 bg-slate-300 relative">
                                <div className="absolute left-0 top-0 h-6 w-1 bg-slate-300"></div>
                                <div className="absolute right-0 top-0 h-6 w-1 bg-slate-300"></div>
                            </div>
                        </div>
                        <div className="w-full flex justify-between mt-0 gap-2 px-1 pt-6 text-center">
                            <div className="bg-slate-200 rounded-xl px-4 py-2 flex flex-col items-center flex-1 shadow-sm border border-white">
                                <span className="font-bold text-slate-700 text-lg xl:text-xl">ขบวนเสด็จ</span>
                                <span className="text-[#dc2626] font-bold text-xl xl:text-2xl">{safeCounts.convoyRoyal}</span>
                            </div>
                            <div className="bg-slate-200 rounded-xl px-4 py-2 flex flex-col items-center flex-1 shadow-sm border border-white">
                                <span className="font-bold text-slate-700 text-lg xl:text-xl">ขบวนทั่วไป</span>
                                <span className="text-[#dc2626] font-bold text-xl xl:text-2xl">{safeCounts.convoyGeneral}</span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden xl:block w-[2px] bg-slate-200 rounded-full h-auto"></div>
                    <div className="flex flex-col items-center flex-1 w-full transition-all duration-300">
                        <NodeCard color="bg-[#fbbf24]" label="รถหนัก" value={safeCounts.truckTotal} valueColor="bg-[#dc2626]" textColor="text-[#1c2e4a]" scale="hover:scale-105" isInteractive onClick={() => setIsTruckExpanded(!isTruckExpanded)} />
                        <div className={`w-full overflow-hidden transition-all duration-500 ease-in-out ${isTruckExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="hidden xl:flex flex-col items-center w-full">
                                <div className="h-6 w-1 bg-slate-300"></div>
                                <div className="w-[85%] h-1 bg-slate-300 relative">
                                    <div className="absolute left-0 top-0 h-6 w-1 bg-slate-300"></div>
                                    <div className="absolute right-0 top-0 h-6 w-1 bg-slate-300"></div>
                                </div>
                            </div>
                            <div className="w-full flex justify-between mt-0 gap-2 px-1 pt-6">
                                <div className="bg-slate-200 rounded-xl px-4 py-2 flex flex-col items-center flex-1 shadow-sm border border-white">
                                    <span className="font-bold text-slate-700 text-lg xl:text-xl">จับกุมเอง</span>
                                    <span className="text-[#dc2626] font-bold text-xl xl:text-2xl">{safeCounts.truckSelf}</span>
                                </div>
                                <div className="bg-slate-200 rounded-xl px-4 py-2 flex flex-col items-center flex-1 shadow-sm border border-white">
                                    <span className="font-bold text-slate-700 text-lg xl:text-xl">ร่วมจับกุม</span>
                                    <span className="text-[#dc2626] font-bold text-xl xl:text-2xl">{safeCounts.truckJoint}</span>
                                </div>
                            </div>
                        </div>
                        {!isTruckExpanded && <div className="mt-2 text-slate-400 text-sm xl:text-base animate-pulse">กดเพื่อดูรายละเอียด</div>}
                    </div>
                </div>
            </div>

            {/* --- Seized Items Section --- */}
            <div className="mx-4 md:mx-10 mb-6 md:mb-10 bg-blue-50/50 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 border border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-[80px] -z-10 opacity-60"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-100 rounded-full blur-[80px] -z-10 opacity-60"></div>
                <h3 className="text-3xl font-bold text-[#1c2e4a] mb-8 flex items-center gap-4">
                    <div className="w-2 h-10 bg-[#004aad] rounded-full"></div>
                    ของกลาง (Seized Items)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-blue-50/50 flex flex-col relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-[4rem] group-hover:scale-110 transition-transform"></div>
                        <h4 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2"><span className="bg-blue-100 p-2 rounded-xl text-blue-600"><Zap size={24} /></span>ยาเสพติด</h4>
                        <div className="space-y-4">
                            <SeizedItem label="ยาบ้า" value={safeCounts.seized.drugs.yaba.toLocaleString()} unit="เม็ด" />
                            <SeizedItem label="ยาไอซ์" value={safeCounts.seized.drugs.ice.toLocaleString()} unit="กรัม" />
                            <SeizedItem label="เคตามีน" value={safeCounts.seized.drugs.ketamine.toLocaleString()} unit="กรัม" />
                            <SeizedItem label="ยาอี/อื่นๆ" value={safeCounts.seized.drugs.other.toLocaleString()} unit="กรัม" />
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-blue-50/50 flex flex-col relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-100 to-transparent rounded-bl-[4rem] group-hover:scale-110 transition-transform"></div>
                        <h4 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2"><span className="bg-red-100 p-2 rounded-xl text-red-600"><ShieldAlert size={24} /></span>อาวุธปืน/เครื่องกระสุนปืน</h4>
                        <div className="space-y-4">
                            <SeizedItem label="อาวุธปืนมีทะเบียน" value={safeCounts.seized.guns.registered.toLocaleString()} unit="กระบอก" />
                            <SeizedItem label="อาวุธปืนไม่มีทะเบียน" value={safeCounts.seized.guns.unregistered.toLocaleString()} unit="กระบอก" />
                            <SeizedItem label="เครื่องกระสุนปืน" value={safeCounts.seized.guns.bullets.toLocaleString()} unit="นัด" />
                            <SeizedItem label="วัตถุระเบิด" value={safeCounts.seized.guns.explosives.toLocaleString()} unit="ลูก" />
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-blue-50/50 flex flex-col relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-yellow-100 to-transparent rounded-bl-[4rem] group-hover:scale-110 transition-transform"></div>
                        <h4 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2"><span className="bg-yellow-100 p-2 rounded-xl text-yellow-600"><Truck size={24} /></span>รถยนต์</h4>
                        <div className="space-y-4">
                            <SeizedItem label="รถยนต์" value={safeCounts.seized.vehicles.car.toLocaleString()} unit="คัน" />
                            <SeizedItem label="รถจักรยานยนต์" value={safeCounts.seized.vehicles.bike.toLocaleString()} unit="คัน" />
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-blue-50/50 flex flex-col relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-100 to-transparent rounded-bl-[4rem] group-hover:scale-110 transition-transform"></div>
                        <h4 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2"><span className="bg-gray-100 p-2 rounded-xl text-gray-600"><FileText size={24} /></span>ของกลางอื่นๆ</h4>
                        <div className="space-y-4">
                            <SeizedItem label="เงินสด" value={safeCounts.seized.others.money.toLocaleString()} unit="บาท" />
                            <SeizedItem label="บัญชีธนาคาร" value={safeCounts.seized.others.account.toLocaleString()} unit="บัญชี" />
                            <SeizedItem label="โทรศัพท์มือถือ" value={safeCounts.seized.others.phone.toLocaleString()} unit="เครื่อง" />
                            <SeizedItem label="รายการอื่นๆ" value={safeCounts.seized.others.items.toLocaleString()} unit="รายการ" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Comparison Tab (Graph) ---
// --- Custom Tick Component for X-Axis ---
const CustomXAxisTick = ({ x, y, payload, monthNames }) => {
    return (
        <g transform={`translate(${x},${y})`}>
            {/* Upper line: Month Names aligned with bars */}
            {/* month1 (left) */}
            <text x={-34} y={0} dy={12} textAnchor="middle" fill="#64748b" fontSize={12} fontWeight="500">
                {monthNames[0]}
            </text>
            {/* month2 (center) */}
            <text x={0} y={0} dy={12} textAnchor="middle" fill="#64748b" fontSize={12} fontWeight="500">
                {monthNames[1]}
            </text>
            {/* month3 (right) */}
            <text x={34} y={0} dy={12} textAnchor="middle" fill="#64748b" fontSize={12} fontWeight="500">
                {monthNames[2]}
            </text>

            {/* Lower line: Unit Name in larger text */}
            <text x={0} y={0} dy={32} textAnchor="middle" fill="#334155" fontSize={16} fontWeight="bold">
                {payload.value}
            </text>
        </g>
    );
};

// --- Comparison Tab (Graph) ---
const ComparisonTab = ({ data = [], monthNames = ["ม.ค.", "ก.พ.", "มี.ค."] }) => {
    return (
        <div className="p-4 lg:p-10 flex flex-col gap-8">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-bold text-[#1c2e4a] flex items-center gap-3">
                        <div className="w-2 h-10 bg-[#dc2626] rounded-full"></div>
                        เปรียบเทียบสถิติการจับกุม (3 เดือนย้อนหลัง)
                    </h3>
                </div>
                <div className="h-[300px] md:h-[400px] lg:h-[500px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={<CustomXAxisTick monthNames={monthNames} />} axisLine={false} tickLine={false} interval={0} height={50} />
                            <YAxis tick={{ fontSize: 16, fill: '#334155', fontWeight: '500' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', color: '#1e293b' }} cursor={{ fill: '#f1f5f9' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} formatter={(value) => <span className="text-slate-700 font-bold text-lg ml-2">{value}</span>} />
                            <Bar dataKey="month1" name={monthNames[0]} fill="#cbd5e1" radius={[8, 8, 0, 0]} barSize={30} label={{ position: 'top', fill: '#475569', fontSize: 14, fontWeight: 'bold' }} />
                            <Bar dataKey="month2" name={monthNames[1]} fill="#94a3b8" radius={[8, 8, 0, 0]} barSize={30} label={{ position: 'top', fill: '#475569', fontSize: 14, fontWeight: 'bold' }} />
                            <Bar dataKey="month3" name={monthNames[2]} fill="#004aad" radius={[8, 8, 0, 0]} barSize={30} label={{ position: 'top', fill: '#1e3a8a', fontSize: 14, fontWeight: 'bold' }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center text-slate-500 text-sm">
                    * ข้อมูลเรียงจากซ้ายไปขวา: {monthNames[0]} ➜ {monthNames[1]} ➜ {monthNames[2]}
                </div>
            </div>
        </div>
    );
};

// --- Traffic Comparison Tab ---
const TrafficComparisonTab = ({ data = [], monthNames = ["ม.ค.", "ก.พ.", "มี.ค."] }) => {
    return (
        <div className="p-4 lg:p-10 flex flex-col gap-8">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-bold text-[#1c2e4a] flex items-center gap-3">
                        <div className="w-2 h-10 bg-[#fbbf24] rounded-full"></div>
                        เปรียบเทียบสถิติ 'จราจร' (3 เดือนย้อนหลัง)
                    </h3>
                </div>
                <div className="h-[300px] md:h-[400px] lg:h-[500px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={<CustomXAxisTick monthNames={monthNames} />} axisLine={false} tickLine={false} interval={0} height={50} />
                            <YAxis tick={{ fontSize: 16, fill: '#334155', fontWeight: '500' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', color: '#1e293b' }} cursor={{ fill: '#f1f5f9' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} formatter={(value) => <span className="text-slate-700 font-bold text-lg ml-2">{value}</span>} />
                            <Bar dataKey="month1" name={monthNames[0]} fill="#cbd5e1" radius={[8, 8, 0, 0]} barSize={30} label={{ position: 'top', fill: '#475569', fontSize: 14, fontWeight: 'bold' }} />
                            <Bar dataKey="month2" name={monthNames[1]} fill="#94a3b8" radius={[8, 8, 0, 0]} barSize={30} label={{ position: 'top', fill: '#475569', fontSize: 14, fontWeight: 'bold' }} />
                            <Bar dataKey="month3" name={monthNames[2]} fill="#fbbf24" radius={[8, 8, 0, 0]} barSize={30} label={{ position: 'top', fill: '#b45309', fontSize: 14, fontWeight: 'bold' }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center text-slate-500 text-sm">
                    * ข้อมูลเรียงจากซ้ายไปขวา: {monthNames[0]} ➜ {monthNames[1]} ➜ {monthNames[2]}
                </div>
            </div>
        </div>
    );
};

// --- Press Release Tab ---
const PressReleaseTab = ({ qualityWork = [], media = [] }) => {
    const qualityWorkData = qualityWork.length > 0 ? qualityWork : Array(8).fill({ division: "กก.-", count: 0, details: [] });
    const mediaTableData = media.length > 0 ? media : Array(6).fill({ label: "ส.ทล.-", values: Array(8).fill(0) }); // Minimal placeholder

    // Calculate totals for table footer
    const totals = Array(8).fill(0);
    mediaTableData.forEach(row => {
        row.values.forEach((val, idx) => {
            if (val !== null) totals[idx] += (val || 0);
        });
    });

    return (
        <div className="p-4 flex flex-col xl:flex-row gap-8 min-h-[700px]">
            {/* Left Column: Quality Work */}
            <div className="w-full xl:w-2/5 flex flex-col">
                <div className="bg-[#fbbf24] text-[#1c2e4a] text-center font-bold text-2xl py-3 rounded-full mb-4 shadow-md mx-8 relative z-10">
                    งานคุณภาพเชิงลึกระดับ กก.
                </div>
                <div className="bg-blue-100 rounded-[3rem] p-8 pt-12 -mt-8 flex-1 border border-blue-200 shadow-inner">
                    <div className="space-y-4 pl-4">
                        {qualityWorkData.map((item, idx) => (
                            <div key={idx} className="flex flex-col items-start text-[#1c2e4a]">
                                <div className="font-bold text-xl mb-1">
                                    <span className="underline decoration-2 underline-offset-4">{item.division}</span> : {item.count > 0 ? `${item.count} เรื่อง` : '- เรื่อง'}
                                </div>
                                {item.details.length > 0 && (
                                    <ul className="list-disc pl-8 space-y-0.5">
                                        {item.details.map((detail, dIdx) => (
                                            <li key={dIdx} className="text-lg font-medium">{detail}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Media Table */}
            <div className="w-full xl:w-3/5 flex flex-col">
                <div className="bg-[#fbbf24] text-[#1c2e4a] text-center font-bold text-2xl py-3 rounded-full mb-4 shadow-md mx-24 relative z-10">
                    ระดับ ส.ทล. ออกสื่อประชาสัมพันธ์
                </div>
                <div className="overflow-hidden rounded-xl border-2 border-slate-900 shadow-xl mt-4">
                    <table className="w-full border-collapse bg-white text-center">
                        <thead>
                            <tr className="bg-[#00004d] text-white h-14 text-lg">
                                <th className="border border-slate-400"></th>
                                {[...Array(8)].map((_, i) => (
                                    <th key={i} className="border border-slate-400 font-bold px-2">กก.{i + 1}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {mediaTableData.map((row, rIdx) => (
                                <tr key={rIdx} className="h-12 text-lg font-bold text-slate-800">
                                    <td className="bg-[#00004d] text-white border border-slate-400">{row.label}</td>
                                    {row.values.map((val, cIdx) => (
                                        <td key={cIdx} className={`border border-slate-400 ${val === null ? 'bg-black' : 'bg-white'}`}>
                                            {val !== null ? val : ''}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="h-14 font-bold text-xl bg-slate-200 text-slate-800">
                                <td className="border border-slate-400 bg-slate-300">รวม</td>
                                {totals.map((total, tIdx) => (
                                    <td key={tIdx} className="border border-slate-400">{total}</td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </div>
                {/* Decoration/Info */}
                <div className="mt-8 text-center text-slate-400 text-sm">
                    * ข้อมูลจำลองเพื่อการแสดงผล (Mock Data)
                </div>
            </div>
        </div>
    );
};

// --- Truck Inspection Tab ---
const TruckInspectionTab = ({ data = [] }) => {
    // Use prop data or default to empty structure if null, ensuring safe access
    const truckData = data.length > 0 ? data : [
        { name: 'กก.1', inspected: 0, arrested: 0 },
        { name: 'กก.2', inspected: 0, arrested: 0 },
        { name: 'กก.3', inspected: 0, arrested: 0 },
        { name: 'กก.4', inspected: 0, arrested: 0 },
        { name: 'กก.5', inspected: 0, arrested: 0 },
        { name: 'กก.6', inspected: 0, arrested: 0 },
        { name: 'กก.7', inspected: 0, arrested: 0 },
        { name: 'กก.8', inspected: 0, arrested: 0 },
    ];

    // Calc totals for cards
    const totalInspected = truckData.reduce((acc, curr) => acc + (curr.inspected || 0), 0);
    const totalArrested = truckData.reduce((acc, curr) => acc + (curr.arrested || 0), 0);
    const percentArrest = totalInspected > 0 ? ((totalArrested / totalInspected) * 100).toFixed(2) : "0.00";

    return (
        <div className="p-4 lg:p-10 flex flex-col gap-8">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-bold text-[#1c2e4a] flex items-center gap-3">
                        <div className="w-2 h-10 bg-[#fbbf24] rounded-full"></div>
                        สถิติการตรวจสอบรถบรรทุกน้ำหนักเกิน (ประจำเดือน)
                    </h3>
                </div>

                <div className="h-[550px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={truckData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 16, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" orientation="left" stroke="#64748b" tick={{ fontSize: 16 }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="#dc2626" tick={{ fontSize: 16 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} cursor={{ fill: '#f1f5f9' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar yAxisId="left" dataKey="inspected" name="จำนวนที่ตรวจสอบ (คัน)" fill="#94a3b8" radius={[8, 8, 0, 0]} barSize={30} label={{ position: 'top' }} />
                            <Bar yAxisId="right" dataKey="arrested" name="จับกุมน้ำหนักเกิน (ราย)" fill="#dc2626" radius={[8, 8, 0, 0]} barSize={30} label={{ position: 'top' }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1c2e4a] rounded-3xl p-6 text-white shadow-lg flex items-center gap-6">
                    <div className="bg-white/10 p-4 rounded-2xl"><Truck size={40} className="text-[#fbbf24]" /></div>
                    <div>
                        <div className="text-gray-300 text-lg">ตรวจสอบทั้งหมด</div>
                        <div className="text-4xl font-bold">{totalInspected.toLocaleString()}</div>
                    </div>
                </div>
                <div className="bg-[#dc2626] rounded-3xl p-6 text-white shadow-lg flex items-center gap-6">
                    <div className="bg-white/10 p-4 rounded-2xl"><ShieldAlert size={40} className="text-white" /></div>
                    <div>
                        <div className="text-gray-100 text-lg">จับกุมน้ำหนักเกิน</div>
                        <div className="text-4xl font-bold">{totalArrested.toLocaleString()}</div>
                    </div>
                </div>
                <div className="bg-white rounded-3xl p-6 text-slate-800 shadow-lg border border-slate-200 flex items-center gap-6">
                    <div className="bg-blue-100 p-4 rounded-2xl"><Zap size={40} className="text-[#004aad]" /></div>
                    <div>
                        <div className="text-slate-500 text-lg">เปอร์เซ็นต์การจับกุม</div>
                        <div className="text-4xl font-bold text-[#004aad]">{percentArrest}%</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Helper Components ---
const safeNumber = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "0";
    return val.toLocaleString();
};

const NodeCard = ({ color, label, value, valueColor, textColor, scale, onClick, isInteractive }) => (
    <div onClick={onClick} className={`relative ${color} rounded-[2.5rem] p-6 w-full text-center shadow-[0_10px_30px_rgba(0,0,0,0.15)] border-[5px] border-white flex flex-col xl:flex-row items-center justify-between gap-4 px-8 ${scale} transition-transform ${isInteractive ? 'cursor-pointer hover:brightness-105 active:scale-95' : ''}`}>
        <h3 className={`text-4xl 2xl:text-5xl font-extrabold ${textColor} whitespace-nowrap tracking-tight`}>{label}</h3>
        <div className={`${valueColor} text-white font-black text-5xl 2xl:text-7xl px-8 py-3 rounded-3xl shadow-inner min-w-[140px]`}>{safeNumber(value)}</div>
        {isInteractive && (<div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 p-2 rounded-full transition-transform hover:scale-110"><ChevronDown className="w-6 h-6 text-slate-700" /></div>)}
    </div>
);

const SubNodeHeader = ({ label, value, badgeColor }) => (
    <div className="bg-slate-200 rounded-full pl-6 pr-2 py-2 flex items-center justify-between gap-3 w-full shadow-lg border-[3px] border-white hover:shadow-xl transition-shadow">
        <span className="font-bold text-slate-800 text-xl xl:text-2xl whitespace-nowrap">{label}</span>
        <span className={`${badgeColor} text-white rounded-full px-5 py-2 font-bold text-2xl xl:text-3xl min-w-[60px] text-center`}>
            {safeNumber(value)}
        </span>
    </div>
);

const ListItem = ({ label, value, highlight }) => (
    <div className="flex items-center gap-3 text-slate-600 py-1.5">
        <div className={`w-4 h-4 rounded-full ${highlight ? 'bg-[#dc2626]' : 'bg-slate-400'}`}></div>
        <span className={`text-xl xl:text-2xl ${highlight ? 'font-bold text-slate-900' : ''}`}>{label}</span>
        <span className={`ml-auto font-bold text-xl xl:text-2xl ${highlight ? 'text-[#dc2626]' : 'text-slate-500'}`}>{value}</span>
    </div>
);

const SimpleItem = ({ text, value }) => (
    <div className="flex justify-between items-center py-1.5">
        <span className="text-slate-700 font-medium text-xl xl:text-2xl">• {text}</span>
        <span className="text-[#dc2626] font-bold text-xl xl:text-2xl">{value}</span>
    </div>
);

const SeizedItem = ({ label, value, unit }) => (
    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
        <span className="text-slate-600 font-medium text-xl xl:text-2xl">{label}</span>
        <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-[#1c2e4a]">{value}</span>
            <span className="text-slate-400 text-lg">{unit}</span>
        </div>
    </div>
);

const SimpleItemCompact = ({ text, value }) => (
    <div className="flex justify-between items-center text-xs border-b border-dashed border-slate-200 py-1 last:border-0">
        <span className="text-slate-600 truncate mr-2">{text}</span>
        <span className="font-bold text-slate-900">{value}</span>
    </div>
);

const SeizedBox = ({ title, items }) => (
    <div className="bg-white rounded-lg p-2 border border-slate-200 shadow-sm">
        <div className="font-bold text-xs text-slate-500 mb-1 border-b border-slate-100 pb-1">{title}</div>
        {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-xs py-0.5">
                <span className="text-slate-600">{item.l}</span>
                <span>
                    <span className="font-bold text-slate-900">{item.v}</span>
                    {item.u && <span className="text-[10px] text-slate-400 ml-1">{item.u}</span>}
                </span>
            </div>
        ))}
    </div>
);

export default ResultDashboardView;