import React, { useState } from 'react';
import { Gauge, Table, Calculator } from 'lucide-react';
import { INDEX_DIMENSIONS } from '../../../lib/quality/scoringConfig.js';
import { BreakdownTable, CategoryRadar, DeltaTag, IndexFigure, MetricCard, Panel, ScoreBarChart, Stat } from './QualityParts';
import { averageRaw, breakdownRows, dimensionRadarRows, formatAverage, indexBarItems, INDEX_METRICS, metricValueOf, placingOf, RADAR_COLORS, themed } from './qualityFormat.js';

// The trend column is shown only when the period has a previous-month comparison
const StationsTable = ({ stations, isDarkMode, onSelectStation, showTrend }) => {
    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    const divider = themed(isDarkMode, 'border-white/10', 'border-slate-200');
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
                <thead>
                    <tr className={`border-b text-left text-xs ${muted} ${divider}`}>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">ส.ทล.</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">ดัชนี</th>
                        {INDEX_DIMENSIONS.map((dimension) => (
                            <th key={dimension.id} scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">{dimension.label}</th>
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
                            <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatAverage(station.index)}</td>
                            {INDEX_DIMENSIONS.map((dimension) => (
                                <td key={dimension.id} className="px-3 py-2 text-right tabular-nums">{formatAverage(station.scores[dimension.id])}</td>
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
    const [selectedMetric, setSelectedMetric] = useState('index');
    const division = model.divisions.find((item) => item.kk === kk);
    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    if (!division) {
        return <Panel title="ไม่พบข้อมูล" isDarkMode={isDarkMode}><p className={muted}>ไม่พบข้อมูล กก. ที่เลือก</p></Panel>;
    }

    const divisionRows = model.divisions.map((item) => ({ key: item.kk, value: item.index }));
    const stations = model.stations
        .filter((station) => station.kk === kk)
        .sort((a, b) => b.index - a.index);
    const metric = INDEX_METRICS.find((item) => item.id === selectedMetric);
    const stationBars = indexBarItems(stations, selectedMetric, (station) => `ส.ทล.${station.stl}`);
    const radar = dimensionRadarRows([
        { name: division.name, scores: division.scores },
        { name: 'บก.ทล.', scores: model.hq.scores },
    ]);
    const breakdown = breakdownRows(averageRaw(stations), model.max, division.scores);

    return (
        <div className="space-y-6">
            <Panel title={`ดัชนีคุณภาพ ${division.name}`} icon={Gauge} isDarkMode={isDarkMode}>
                <IndexFigure index={division.index} delta={division.delta} isDarkMode={isDarkMode} />
                <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Stat label="จำนวน ส.ทล." value={division.stationCount} isDarkMode={isDarkMode} />
                    <Stat label="อันดับตามดัชนี" value={`ที่ ${placingOf(divisionRows, kk)} จาก ${model.divisions.length}`} isDarkMode={isDarkMode} />
                </dl>
                <div className="mt-6">
                    <CategoryRadar
                        rows={radar}
                        series={[
                            { name: division.name, color: RADAR_COLORS.main },
                            { name: 'บก.ทล.', color: RADAR_COLORS.compare, dashed: true },
                        ]}
                        subtitle="คะแนนเฉลี่ยต่อ ส.ทล. ของแต่ละด้าน เทียบกับน้ำหนักเต็มของด้านนั้น (= 100%)"
                        isDarkMode={isDarkMode}
                    />
                </div>
            </Panel>

            <Panel title={`ส.ทล. ใน ${division.name}`} icon={Table} isDarkMode={isDarkMode}>
                <div role="group" aria-label="เลือกตัวชี้วัด" className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {INDEX_METRICS.map((item) => (
                        <MetricCard
                            key={item.id}
                            metric={item}
                            className={item.id === 'index' ? 'col-span-2 lg:col-span-1' : ''}
                            value={metricValueOf(division, item.id)}
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
                    decimals={1}
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

            <Panel title={`ที่มาของดัชนี ${division.name}`} icon={Calculator} isDarkMode={isDarkMode}>
                <BreakdownTable rows={breakdown} averaged isDarkMode={isDarkMode} />
                <p className={`mt-3 text-sm ${muted}`}>ค่าของแต่ละด้านเป็นค่าเฉลี่ยต่อ ส.ทล. ใน กก. นี้ เทียบกับค่าสูงสุดของ ส.ทล. ทั้ง 43</p>
            </Panel>
        </div>
    );
};

export default DivisionPanel;
