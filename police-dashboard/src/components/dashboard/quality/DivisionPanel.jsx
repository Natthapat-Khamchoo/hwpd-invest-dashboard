import React, { useState } from 'react';
import { Gauge, Table } from 'lucide-react';
import { CATEGORIES } from '../../../lib/quality/scoringConfig.js';
import { DeltaTag, ScoreBarChart, CategoryRadar, Panel, Stat } from './QualityParts';
import { barItems, bestByCategory, formatAverage, formatCount, perStationCategories, placingOf, RADAR_COLORS, radarRows, toPercent, themed } from './qualityFormat.js';

const METRICS = [
    { id: 'total', label: 'คะแนนรวม' },
    { id: 'quantity', label: 'ปริมาณ' },
    { id: 'quality', label: 'คุณภาพ' },
    ...CATEGORIES.map(({ id, label }) => ({ id, label })),
];

const metricSum = (points, id) => {
    if (id === 'total') return points.total;
    if (id === 'quantity') return points.quantity;
    if (id === 'quality') return points.quality;
    return points.categories[id].total;
};

// The trend column is shown only when the period has a previous-period comparison
const StationsTable = ({ stations, periodDays, isDarkMode, onSelectStation, showTrend }) => {
    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    const divider = themed(isDarkMode, 'border-white/10', 'border-slate-200');
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">
                <thead>
                    <tr className={`border-b text-left text-xs ${muted} ${divider}`}>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">ส.ทล.</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">ปริมาณ</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">คุณภาพ</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">รวม</th>
                        {CATEGORIES.map((category) => (
                            <th key={category.id} scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">{category.label}</th>
                        ))}
                        <th scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">ส่งรายงาน</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">มีผลงาน</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">สัดส่วนคดีสำคัญ</th>
                        {showTrend && <th scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">แนวโน้ม</th>}
                    </tr>
                </thead>
                <tbody>
                    {stations.map((station) => (
                        <tr
                            key={station.key}
                            onClick={() => onSelectStation(station.key)}
                            className={`cursor-pointer border-b transition-colors duration-200 ${themed(isDarkMode, 'border-white/5 hover:bg-slate-800/60', 'border-slate-100 hover:bg-slate-100')}`}
                        >
                            <td className="px-3 py-2">
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onSelectStation(station.key);
                                    }}
                                    className="inline-flex min-h-[44px] cursor-pointer items-center rounded-md font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                                >
                                    ส.ทล.{station.stl}
                                </button>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">{formatCount(station.points.quantity)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{formatCount(station.points.quality)}</td>
                            <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatCount(station.total)}</td>
                            {CATEGORIES.map((category) => (
                                <td key={category.id} className="px-3 py-2 text-right tabular-nums">{formatCount(station.points.categories[category.id].total)}</td>
                            ))}
                            <td className={`whitespace-nowrap px-3 py-2 tabular-nums ${muted}`}>{station.info.reportDays}/{periodDays} วัน</td>
                            <td className={`whitespace-nowrap px-3 py-2 tabular-nums ${muted}`}>{toPercent(station.consistency)}% ของวัน</td>
                            <td className={`whitespace-nowrap px-3 py-2 tabular-nums ${muted}`}>{toPercent(station.info.majorShare)}%</td>
                            {showTrend && <td className="px-3 py-2"><DeltaTag delta={station.delta} isDarkMode={isDarkMode} /></td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const MetricCard = ({ metric, value, selected, onSelect, isDarkMode }) => {
    const stateClass = selected
        ? themed(isDarkMode, 'border-cyan-400 bg-cyan-500/15', 'border-cyan-600 bg-cyan-50')
        : themed(isDarkMode, 'border-white/10 bg-slate-900/40 hover:bg-slate-800/60', 'border-slate-200 bg-white hover:bg-slate-100');
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(metric.id)}
            className={`flex min-h-[44px] w-full min-w-0 cursor-pointer flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${stateClass}`}
        >
            <span className="break-words text-xs font-semibold">{metric.label}</span>
            <span className="max-w-full break-words text-lg font-bold tabular-nums sm:text-xl">{formatCount(value)}</span>
        </button>
    );
};

const DivisionPanel = ({ model, kk, isDarkMode = true, onSelectStation }) => {
    const [selectedMetric, setSelectedMetric] = useState('total');
    const division = model.divisions.find((item) => item.kk === kk);
    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    if (!division) {
        return <Panel title="ไม่พบข้อมูล" isDarkMode={isDarkMode}><p className={muted}>ไม่พบข้อมูล กก. ที่เลือก</p></Panel>;
    }

    const divisionRows = model.divisions.map((item) => ({ key: item.kk, value: item.average }));
    const stations = model.stations
        .filter((station) => station.kk === kk)
        .sort((a, b) => b.total - a.total);
    const metric = METRICS.find((item) => item.id === selectedMetric);
    const stationBars = barItems(stations, selectedMetric, (station) => `ส.ทล.${station.stl}`);

    // Per-station averages of this division and of the HQ, each as a percent of the best division's per-station average
    const hqAverages = perStationCategories(model.hq.points.categories, model.stations.length);
    const divisionAverages = model.divisions.map((item) => perStationCategories(item.points.categories, item.stationCount));
    const radar = radarRows([
        { name: division.name, categories: perStationCategories(division.points.categories, division.stationCount) },
        { name: 'เฉลี่ย บก.ทล.', categories: hqAverages },
    ], bestByCategory(divisionAverages));

    return (
        <div className="space-y-6">
            <Panel title={`คะแนนรวม ${division.name}`} icon={Gauge} isDarkMode={isDarkMode}>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Stat label="คะแนนรวม" value={formatCount(division.total)} emphasis isDarkMode={isDarkMode} />
                    <Stat label="เฉลี่ยต่อ ส.ทล." value={formatAverage(division.average)} isDarkMode={isDarkMode} />
                    <Stat label="อันดับตามค่าเฉลี่ย" value={`ที่ ${placingOf(divisionRows, kk)} จาก ${model.divisions.length}`} isDarkMode={isDarkMode} />
                </dl>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <DeltaTag delta={division.delta} isDarkMode={isDarkMode} />
                    <p className={`text-sm ${muted}`}>
                        สัดส่วนคดีสำคัญ <span className="font-semibold tabular-nums">{toPercent(division.info.majorShare)}%</span>, ส่งรายงานเฉลี่ย <span className="font-semibold tabular-nums">{toPercent(division.info.reportRatio)}%</span>
                    </p>
                </div>
                <div className="mt-6">
                    <CategoryRadar
                        rows={radar}
                        series={[
                            { name: division.name, color: RADAR_COLORS.main, decimals: 1 },
                            { name: 'เฉลี่ย บก.ทล.', color: RADAR_COLORS.compare, dashed: true, decimals: 1 },
                        ]}
                        subtitle="คะแนนเฉลี่ยต่อ ส.ทล. แต่ละแกนเทียบกับ กก. ที่ทำได้สูงสุดในเรื่องนั้น (= 100%)"
                        isDarkMode={isDarkMode}
                    />
                </div>
            </Panel>

            <Panel title={`ส.ทล. ใน ${division.name}`} icon={Table} isDarkMode={isDarkMode}>
                <div role="group" aria-label="เลือกตัวชี้วัด" className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    {METRICS.map((item) => (
                        <MetricCard
                            key={item.id}
                            metric={item}
                            value={metricSum(division.points, item.id)}
                            selected={item.id === selectedMetric}
                            onSelect={setSelectedMetric}
                            isDarkMode={isDarkMode}
                        />
                    ))}
                </div>
                <p className={`mb-3 text-sm ${muted}`}>เปรียบเทียบ{metric.label} ของ ส.ทล. ใน {division.name}</p>
                <ScoreBarChart
                    items={stationBars}
                    onSelect={onSelectStation}
                    isDarkMode={isDarkMode}
                    ariaLabel={`เปรียบเทียบ${metric.label} ของ ส.ทล. ใน ${division.name}`}
                    valueLabel={metric.label}
                />
                <div className="mt-6">
                    <StationsTable
                        stations={stations}
                        periodDays={model.period.days}
                        isDarkMode={isDarkMode}
                        onSelectStation={onSelectStation}
                        showTrend={model.period.kind !== 'fy'}
                    />
                </div>
            </Panel>
        </div>
    );
};

export default DivisionPanel;
