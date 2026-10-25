import React, { useState } from 'react';
import { Gauge, Table } from 'lucide-react';
import { CATEGORIES } from '../../../lib/quality/scoringConfig.js';
import { DeltaTag, ScoreBarChart, CategoryRadar, MetricCard, Panel, Stat } from './QualityParts';
import { barItems, METRICS, metricSum, bestByCategory, formatAverage, formatCount, perStationCategories, placingOf, RADAR_COLORS, radarRows, themed } from './qualityFormat.js';

// The trend column is shown only when the period has a previous-month comparison
const StationsTable = ({ stations, isDarkMode, onSelectStation, showTrend }) => {
    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    const divider = themed(isDarkMode, 'border-white/10', 'border-slate-200');
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
                <thead>
                    <tr className={`border-b text-left text-xs ${muted} ${divider}`}>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">ส.ทล.</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">ปริมาณ</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">คุณภาพ</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">รวม</th>
                        {CATEGORIES.map((category) => (
                            <th key={category.id} scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">{category.label}</th>
                        ))}
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
                            {showTrend && <td className="px-3 py-2"><DeltaTag delta={station.delta} isDarkMode={isDarkMode} /></td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
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
                <div className="mt-3"><DeltaTag delta={division.delta} isDarkMode={isDarkMode} /></div>
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
                <div role="group" aria-label="เลือกตัวชี้วัด" className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {METRICS.map((item) => (
                        <MetricCard
                            key={item.id}
                            metric={item}
                            className={item.id === 'total' ? 'col-span-2 lg:col-span-1' : ''}
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
                        isDarkMode={isDarkMode}
                        onSelectStation={onSelectStation}
                        showTrend={model.hq.delta !== null}
                    />
                </div>
            </Panel>
        </div>
    );
};

export default DivisionPanel;
