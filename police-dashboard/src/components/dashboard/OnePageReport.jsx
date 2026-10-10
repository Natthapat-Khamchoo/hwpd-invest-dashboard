import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, PieChart, Pie, Cell } from 'recharts';
import {
    Siren, Gavel, Hand, TrafficCone, Truck, Crown, Flag, Video, Database, Users,
    Pill, Crosshair, Plane, Package, Biohazard, Bus, FileWarning, Wallet, ShieldAlert, Wine, HeartPulse, Monitor, Ellipsis,
    ArrowLeftRight, Umbrella, Wrench, Cog, Signpost, Gauge, Receipt, RectangleHorizontal,
    Gem, FlaskConical, Snowflake, Target, Zap, Bomb, CarFront, Bike, Banknote, Landmark, Smartphone, Scale
} from 'lucide-react';

// Fixed 1920x1080 (16:9) single-page infographic used for JPG / PDF export.
// Rendered off-screen by ResultDashboardView only while exporting.
export const REPORT_WIDTH = 1920;
export const REPORT_HEIGHT = 1080;

const fmt = (v) => (typeof v === 'number' ? v.toLocaleString() : (v ?? 0));
const nonZero = (items) => items.filter(i => i.value > 0);
const fmtNonZero = (v) => (v ? v.toLocaleString() : '');
// 1,000 -> 1k, 1,156 -> 1.2k, 49,121 -> 49.1k; values under 1,000 stay as-is
const fmtK = (v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k` : v.toLocaleString());
const fmtKNonZero = (v) => (v ? fmtK(v) : '');

const Empty = () => <div className="h-full flex items-center justify-center text-[22px] text-slate-400">ไม่มีข้อมูล</div>;

// Theme: navy / white / gray / yellow.
const NAVY = '#0b2559';
const NAVY_2 = '#1a3d7c';
const NAVY_SOFT = '#e3e9f3';
const YELLOW = '#f2b705';
const YELLOW_SOFT = '#fdf3cf';
const YELLOW_INK = '#8a6400'; // yellow-family ink that stays readable on white / soft yellow
const GRAY = '#94a3b8';
const GRAY_LIGHT = '#aab4c3';
const SURFACE = '#eef1f5';

// Month-over-month charts: previous month = gray, current month = navy (all bars carry value labels).
const PREV = GRAY_LIGHT;
const CURR = NAVY;

// Donut slices: navy / yellow / gray, each slice also labelled with icon + value.
const CAT = [NAVY, YELLOW, GRAY];

const KpiTile = ({ icon: Icon, label, value, from, to }) => (
    <div className="flex-1 rounded-2xl flex items-center gap-4 px-4 text-white shadow-md relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
        <div className="absolute -right-6 -bottom-8 opacity-10"><Icon size={140} strokeWidth={1.5} /></div>
        <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: YELLOW, color: NAVY }}>
            <Icon size={46} strokeWidth={2.2} />
        </div>
        <div className="flex flex-col leading-none relative">
            <span className="text-[54px] font-extrabold tracking-tight">{fmt(value)}</span>
            <span className="text-[22px] font-semibold text-slate-200 mt-1.5 whitespace-nowrap">{label}</span>
        </div>
    </div>
);

const Panel = ({ icon: Icon, title, color, children, className = '', style }) => (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden ${className}`}
        style={{ borderTop: `5px solid ${color || NAVY}`, ...style }}>
        <div className="flex items-center gap-3 px-4 pt-2.5 pb-1.5 shrink-0">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: NAVY, color: YELLOW }}>
                <Icon size={24} strokeWidth={2.4} />
            </span>
            <span className="text-[23px] font-bold" style={{ color: NAVY }}>{title}</span>
        </div>
        <div className="flex-1 min-h-0 px-4 pb-3">{children}</div>
    </div>
);

const ROW_PITCH = 46; // max px per bar row (32px row + gap)
const PANEL_CHROME = 73; // Panel top border + header + bottom padding

// Horizontal bar list, sorted by value, one hue. Icons carry identity; labels stay short.
// bodyHeight = px available for rows; rows keep ROW_PITCH spacing and shrink only when a long list needs it.
const HBarList = ({ items, color, soft, iconColor, bodyHeight }) => {
    const sorted = nonZero(items).sort((a, b) => b.value - a.value);
    if (!sorted.length) return <Empty />;
    const max = Math.max(...sorted.map(i => i.value));
    const pitch = Math.min(ROW_PITCH, bodyHeight / sorted.length);
    const rowH = Math.min(32, pitch - 3);
    const scale = rowH / 32;
    return (
        <div className="flex flex-col">
            {sorted.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2.5" style={{ height: pitch }}>
                    <span className="rounded-lg flex items-center justify-center shrink-0"
                        style={{ width: rowH, height: rowH, backgroundColor: soft, color: iconColor || color }}>
                        <Icon size={Math.round(21 * scale)} strokeWidth={2.3} />
                    </span>
                    <span className="w-[178px] shrink-0 truncate text-slate-700" style={{ fontSize: Math.max(15, Math.round(19 * scale)) }}>{label}</span>
                    <div className="flex-1 relative" style={{ height: Math.round(22 * scale) }}>
                        <div className="h-full rounded-r-[4px]" style={{ width: `${Math.max(1.5, (value / max) * 100)}%`, backgroundColor: color }} />
                    </div>
                    <span className="w-[92px] text-right font-bold shrink-0 text-slate-900" style={{ fontSize: Math.max(16, Math.round(22 * scale)) }}>{fmt(value)}</span>
                </div>
            ))}
        </div>
    );
};

const Donut = ({ data: allData, total, size = 168 }) => {
    const data = nonZero(allData);
    return (
    <div className="flex items-center gap-3 h-full">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <PieChart width={size} height={size}>
                <Pie data={data} dataKey="value" innerRadius={size * 0.32} outerRadius={size / 2 - 2}
                    startAngle={90} endAngle={-270} paddingAngle={data.length > 1 ? 2 : 0}
                    stroke="#ffffff" strokeWidth={2} isAnimationActive={false}>
                    {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
            </PieChart>
            <div className="absolute inset-0 flex items-center justify-center text-[34px] font-extrabold text-slate-900">{fmt(total)}</div>
        </div>
        <div className="flex flex-col gap-3 flex-1 min-w-0">
            {data.map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex items-center gap-2">
                    <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: color, color: color === NAVY ? '#ffffff' : NAVY }}>
                        <Icon size={21} strokeWidth={2.4} />
                    </span>
                    <div className="flex flex-col leading-tight min-w-0">
                        <span className="text-[26px] font-bold text-slate-900">{fmt(value)}</span>
                        <span className="text-[16px] text-slate-600 whitespace-nowrap">{label}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
    );
};

const SeizedTile = ({ icon: Icon, label, value, unit, color, soft }) => (
    <div className="rounded-xl flex items-center gap-2.5 px-3 min-h-0" style={{ backgroundColor: soft }}>
        <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: color, color: YELLOW }}>
            <Icon size={23} strokeWidth={2.3} />
        </span>
        <div className="flex flex-col min-w-0 leading-tight">
            <span className="text-[15px] text-slate-700 truncate">{label}</span>
            <span className="text-[22px] font-extrabold whitespace-nowrap text-slate-900">
                {fmt(value)}<span className="text-[15px] font-medium text-slate-500 ml-1">{unit}</span>
            </span>
        </div>
    </div>
);

// monthNames: [previous, current] draws two bars per กก.; [current] alone draws only the current period.
const CompareChart = ({ icon, title, data, monthNames, width, height, useK = false }) => {
    const light = PREV, strong = CURR;
    const single = monthNames.length === 1;
    const currentName = monthNames[monthNames.length - 1];
    const tickFmt = useK ? fmtK : (v) => v.toLocaleString();
    const labelFmt = useK ? fmtKNonZero : fmtNonZero;
    return (
        <Panel icon={icon} title={title} color={NAVY} style={{ height }}>
            <div className="relative">
                {/* Single-period charts need no legend: the report header already states the date */}
                {!single && (
                    <div className="absolute right-0 -top-11 flex gap-4 text-[18px] font-semibold text-slate-700">
                        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded" style={{ backgroundColor: light }}></span>{monthNames[0]}</span>
                        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded" style={{ backgroundColor: strong }}></span>{currentName}</span>
                    </div>
                )}
                <BarChart width={width} height={height - 70} data={data} margin={{ top: 22, right: 4, left: -4, bottom: 0 }} barGap={2} barCategoryGap={single ? '30%' : '18%'}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} tick={{ fontSize: 17, fill: '#334155', fontWeight: 700 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={46} tick={{ fontSize: 13, fill: '#64748b' }} tickFormatter={tickFmt} />
                    {!single && (
                        <Bar dataKey="month1" fill={light} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                            <LabelList dataKey="month1" position="top" style={{ fontSize: 14, fill: '#475569', fontWeight: 700 }} formatter={labelFmt} />
                        </Bar>
                    )}
                    <Bar dataKey="month2" fill={strong} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                        <LabelList dataKey="month2" position="top" style={{ fontSize: 15, fill: NAVY, fontWeight: 800 }} formatter={labelFmt} />
                    </Bar>
                </BarChart>
            </div>
        </Panel>
    );
};

const OnePageReport = ({ counts, periodPrefix = 'ประจำเดือน', headerDate, commanderInfo, unitLabel, chartPeriod = 'รายเดือน' }) => {
    const c = counts || {};
    const n = (k) => c[k] || 0;
    const seized = {
        drugs: { yaba: 0, ice: 0, ketamine: 0, other: 0, ...(c.seized?.drugs || {}) },
        guns: { registered: 0, unregistered: 0, bullets: 0, explosives: 0, ...(c.seized?.guns || {}) },
        vehicles: { car: 0, bike: 0, ...(c.seized?.vehicles || {}) },
        others: { money: 0, account: 0, phone: 0, dutyFree: 0, items: 0, ...(c.seized?.others || {}) }
    };
    const charts = c.charts || {};
    const monthNames = charts.monthNames || ['เดือนก่อน', 'เดือนนี้'];

    const offenses = [
        { icon: Pill, label: 'ยาเสพติด', value: n('offenseDrugs') },
        { icon: Crosshair, label: 'อาวุธปืน', value: n('offenseGuns') },
        { icon: Plane, label: 'คนเข้าเมือง', value: n('offenseImmig') },
        { icon: Package, label: 'ศุลกากร', value: n('offenseCustoms') },
        { icon: Biohazard, label: 'โรคติดต่อ', value: n('offenseDisease') },
        { icon: Bus, label: 'ขนส่ง', value: n('offenseTransport') },
        { icon: FileWarning, label: 'ปลอมเอกสาร', value: n('offenseDocs') },
        { icon: Wallet, label: 'ทรัพย์', value: n('offenseProperty') },
        { icon: ShieldAlert, label: 'เพศ', value: n('offenseSex') },
        { icon: Scale, label: 'รถหนัก', value: n('offenseWeight') },
        { icon: Wine, label: 'เมาแล้วขับ', value: n('offenseDrunk') },
        { icon: HeartPulse, label: 'ชีวิต/ร่างกาย', value: n('offenseLife') },
        { icon: Monitor, label: 'ฉ้อโกงออนไลน์', value: n('offenseCom') },
        { icon: Ellipsis, label: 'อื่นๆ', value: n('offenseOther') },
    ];

    const traffic = [
        { icon: ArrowLeftRight, label: 'ไม่ชิดซ้าย', value: n('trafficNotKeepLeft') },
        { icon: Umbrella, label: 'ไม่ปกคลุม', value: n('trafficNotCovered') },
        { icon: Wrench, label: 'ดัดแปลงรถ', value: n('trafficModify') },
        { icon: Cog, label: 'ส่วนควบไม่ครบ', value: n('trafficNoPart') },
        { icon: Signpost, label: 'ฝ่าฝืนป้าย', value: n('trafficSign') },
        { icon: Siren, label: 'ฝ่าสัญญาณไฟ', value: n('trafficLight') },
        { icon: Gauge, label: 'ขับเร็ว', value: n('trafficSpeed') },
        { icon: Receipt, label: 'ขาดภาษี/พ.ร.บ.', value: n('trafficTax') },
        { icon: RectangleHorizontal, label: 'ไม่ติดป้ายทะเบียน', value: n('trafficNoPlate') },
        { icon: Ellipsis, label: 'อื่นๆ', value: n('trafficGeneral') },
    ];

    const warrant = [
        { icon: Video, label: 'Bodyworn', value: n('warrantBodyworn'), color: CAT[0] },
        { icon: Database, label: 'Bigdata', value: n('warrantBigData'), color: CAT[1] },
        { icon: Users, label: 'ทั่วไป', value: n('warrantGeneral'), color: CAT[2] },
    ];
    const convoy = [
        { icon: Crown, label: 'ขบวน ถปภ.', value: n('convoyRoyal'), color: CAT[1] },
        { icon: Flag, label: 'ขบวนทั่วไป', value: n('convoyGeneral'), color: CAT[0] },
    ];

    const seizedGroups = [
        { color: NAVY, soft: '#f1f4f8', items: [
            { icon: Pill, label: 'ยาบ้า/ยาอี', value: seized.drugs.yaba, unit: 'เม็ด' },
            { icon: Gem, label: 'ไอซ์', value: seized.drugs.ice, unit: 'กรัม' },
            { icon: FlaskConical, label: 'เคตามีน', value: seized.drugs.ketamine, unit: 'กรัม' },
            { icon: Snowflake, label: 'โคเคน', value: seized.drugs.other, unit: 'กรัม' },
        ] },
        { color: NAVY, soft: '#f1f4f8', items: [
            { icon: Crosshair, label: 'ปืนมีทะเบียน', value: seized.guns.registered, unit: 'กระบอก' },
            { icon: Target, label: 'ปืนไม่มีทะเบียน', value: seized.guns.unregistered, unit: 'กระบอก' },
            { icon: Zap, label: 'กระสุน', value: seized.guns.bullets, unit: 'นัด' },
            { icon: Bomb, label: 'วัตถุระเบิด', value: seized.guns.explosives, unit: 'ลูก' },
        ] },
        { color: NAVY, soft: '#f1f4f8', items: [
            { icon: Banknote, label: 'เงินสด', value: seized.others.money, unit: 'บาท' },
            { icon: Landmark, label: 'บัญชีธนาคาร', value: seized.others.account, unit: 'บัญชี' },
            { icon: Smartphone, label: 'โทรศัพท์', value: seized.others.phone, unit: 'เครื่อง' },
            { icon: Package, label: 'สินค้าหนีภาษี', value: seized.others.dutyFree, unit: 'รายการ' },
            { icon: Package, label: 'อื่นๆ', value: seized.others.items, unit: 'รายการ' },
        ] },
        { color: NAVY, soft: '#f1f4f8', items: [
            { icon: CarFront, label: 'รถยนต์', value: seized.vehicles.car, unit: 'คัน' },
            { icon: Bike, label: 'จักรยานยนต์', value: seized.vehicles.bike, unit: 'คัน' },
        ] },
    ];

    const kpis = [
        { icon: Siren, label: 'จับกุมทั้งหมด (คดี)', value: n('criminalTotal'), from: NAVY, to: NAVY_2 },
        { icon: Gavel, label: 'หมายจับ', value: n('warrantTotal'), from: NAVY, to: NAVY_2 },
        { icon: Hand, label: 'ความผิดซึ่งหน้า', value: n('flagrantTotal'), from: NAVY, to: NAVY_2 },
        { icon: TrafficCone, label: 'คดีจราจร', value: n('trafficTotal'), from: NAVY, to: NAVY_2 },
        { icon: Truck, label: 'รถหนัก', value: n('truckTotal'), from: NAVY, to: NAVY_2 },
        { icon: Crown, label: 'ขบวน', value: n('convoyTotal'), from: NAVY, to: NAVY_2 },
    ];
    const seizedItems = seizedGroups.flatMap(g => nonZero(g.items).map(item => ({ ...item, color: g.color, soft: g.soft })));

    // Main row: 10 padding + 640 + 10 + 560 + 10 + 680 + 10 = 1920
    const colW = [640, 560, 680];
    const mainH = 834;
    const chartH = Math.floor((mainH - 20) / 3);

    // ฐานความผิด and คดีจราจร share one height: the smaller room left in either column
    // after its bottom box (donuts / seized). Any extra space goes to that bottom box.
    const GAP = 10;
    const DONUT_ROW_H = 256;
    const SEIZED_ROW_H = 46, SEIZED_ROW_GAP = 4;
    const hasDonuts = n('warrantTotal') > 0 || n('convoyTotal') > 0;
    const seizedRows = Math.ceil(seizedItems.length / 2);
    const seizedH = seizedRows ? PANEL_CHROME + seizedRows * SEIZED_ROW_H + (seizedRows - 1) * SEIZED_ROW_GAP : 0;
    const listPanelH = Math.min(
        mainH - (hasDonuts ? DONUT_ROW_H + GAP : 0),
        mainH - (seizedRows ? seizedH + GAP : 0)
    );
    const listBodyH = listPanelH - PANEL_CHROME;

    return (
        <div
            id="one-page-report"
            className="font-sans text-slate-900 flex flex-col"
            style={{ width: REPORT_WIDTH, height: REPORT_HEIGHT, background: SURFACE }}
        >
            {/* Header */}
            <div className="flex h-[88px] shrink-0 overflow-hidden relative">
                <div className="bg-[#5e666e] w-[42%] flex items-center gap-5 px-8 relative z-20">
                    {/* Bundled copy of the logo: the LINE bot's headless renderer on Vercel cannot reach cib.go.th */}
                    <img
                        src="/report-logo.png"
                        alt="ตราสัญลักษณ์"
                        className="w-[66px] h-[66px] object-contain shrink-0"
                    />
                    <div className="text-white text-[32px] whitespace-nowrap leading-tight">กองบังคับการตำรวจทางหลวง</div>
                    <div className="absolute top-0 right-[-40px] w-40 h-full bg-[#5e666e] skew-x-[-20deg] z-[-1]"></div>
                </div>
                <div className="flex-1 flex flex-col items-end justify-center pr-12 pl-16 text-right" style={{ backgroundColor: NAVY }}>
                    <div className="text-white text-[32px] font-bold leading-tight">
                        ผลการปฏิบัติ{periodPrefix} <span className="font-extrabold" style={{ color: YELLOW }}>{headerDate}</span>
                    </div>
                    {(unitLabel || commanderInfo) && (
                        <div className="text-white/85 text-[16px] mt-0.5">
                            {[unitLabel, commanderInfo && `${commanderInfo.Rank}${commanderInfo.Full_Name} ${commanderInfo.Position}`].filter(Boolean).join(' · ')}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col gap-[10px] p-[10px]">
                {/* KPI row */}
                <div className="flex gap-[10px] h-[120px] shrink-0">
                    {nonZero(kpis).map(k => <KpiTile key={k.label} {...k} />)}
                </div>

                {/* Main row */}
                <div className="flex gap-[10px]" style={{ height: mainH }}>
                    {/* Column 1: offense types + warrant / convoy donuts */}
                    <div className="flex flex-col gap-[10px]" style={{ width: colW[0] }}>
                        <Panel icon={Siren} title="ฐานความผิด" color={NAVY} className="shrink-0" style={{ height: listPanelH }}>
                            <HBarList items={offenses} color={NAVY} soft={NAVY_SOFT} bodyHeight={listBodyH} />
                        </Panel>
                        {hasDonuts && (
                            <div className="flex gap-[10px] flex-1 min-h-0">
                                {n('warrantTotal') > 0 && (
                                    <Panel icon={Gavel} title="หมายจับ" color={YELLOW} className="flex-1">
                                        <Donut data={warrant} total={n('warrantTotal')} size={140} />
                                    </Panel>
                                )}
                                {n('convoyTotal') > 0 && (
                                    <Panel icon={Crown} title="ขบวน" color={YELLOW} className="flex-1">
                                        <Donut data={convoy} total={n('convoyTotal')} size={140} />
                                    </Panel>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Column 2: traffic types + seized items */}
                    <div className="flex flex-col gap-[10px]" style={{ width: colW[1] }}>
                        <Panel icon={TrafficCone} title="คดีจราจร" color={YELLOW} className="shrink-0" style={{ height: listPanelH }}>
                            <HBarList items={traffic} color={YELLOW} soft={YELLOW_SOFT} iconColor={YELLOW_INK} bodyHeight={listBodyH} />
                        </Panel>
                        {seizedItems.length > 0 && (
                            <Panel icon={Package} title="ของกลาง" color={GRAY} className="flex-1 min-h-0">
                                <div className="h-full grid grid-cols-2 gap-x-2 gap-y-1 content-center" style={{ gridAutoRows: `${SEIZED_ROW_H}px` }}>
                                    {seizedItems.map(item => <SeizedTile key={item.label} {...item} />)}
                                </div>
                            </Panel>
                        )}
                    </div>

                    {/* Column 3: month-over-month by division */}
                    <div className="flex flex-col gap-[10px]" style={{ width: colW[2] }}>
                        <CompareChart icon={Siren} title={`อาญา แยก กก. (${chartPeriod})`} data={charts.comparison || []} monthNames={monthNames} width={colW[2] - 34} height={chartH} />
                        <CompareChart icon={TrafficCone} title={`จราจร แยก กก. (${chartPeriod})`} data={charts.traffic || []} monthNames={monthNames} width={colW[2] - 34} height={chartH} useK />
                        <CompareChart icon={Truck} title={`รถบรรทุกน้ำหนักเกิน แยก กก. (${chartPeriod})`} data={charts.truck || []} monthNames={monthNames} width={colW[2] - 34} height={chartH} />
                    </div>
                </div>
            </div>

            {/* Footer bar */}
            <div className="h-[8px] shrink-0" style={{ backgroundColor: YELLOW }}></div>
        </div>
    );
};

export default OnePageReport;
