import React from 'react';
import { Gauge, BarChart3, Calculator } from 'lucide-react';
import { DeltaTag, ScoreBarChart, CategoryRadar, Panel, Stat } from './QualityParts';
import StationCompare from './StationCompare';
import { scoringStartDate } from '../../../lib/quality/scoringDates.js';
import { barItems, bestByCategory, formatAverage, formatCount, formatThaiDate, perStationCategories, RADAR_COLORS, radarRows, scoringRules, themed } from './qualityFormat.js';

const RULES = scoringRules();
const KIND_HEADINGS = [
    { kind: 'quantity', label: 'ปริมาณ' },
    { kind: 'quality', label: 'คุณภาพ' },
];

const HQPanel = ({ model, isDarkMode = true, onSelectDivision, onSelectStation }) => {
    const { hq, divisions } = model;
    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    // HQ per-station average in each category, as a percent of the best division's per-station average
    const hqAverages = perStationCategories(hq.points.categories, model.stations.length);
    const divisionAverages = divisions.map((division) => perStationCategories(division.points.categories, division.stationCount));
    const radar = radarRows([{ name: 'บก.ทล.', categories: hqAverages }], bestByCategory(divisionAverages));
    const divisionBars = barItems(divisions, 'average', (division) => division.name);

    return (
        <div className="space-y-6">
            <Panel title="คะแนนรวม บก.ทล." icon={Gauge} isDarkMode={isDarkMode}>
                <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Stat label="คะแนนรวม" value={formatCount(hq.total)} emphasis isDarkMode={isDarkMode} />
                    <Stat label="ปริมาณ" value={formatCount(hq.points.quantity)} isDarkMode={isDarkMode} />
                    <Stat label="คุณภาพ" value={formatCount(hq.points.quality)} isDarkMode={isDarkMode} />
                    <Stat label="เฉลี่ยต่อ ส.ทล." value={formatAverage(hq.average)} isDarkMode={isDarkMode} />
                </dl>
                <div className="mt-3"><DeltaTag delta={hq.delta} isDarkMode={isDarkMode} /></div>
                <div className="mt-6">
                    <CategoryRadar
                        rows={radar}
                        series={[{ name: 'บก.ทล.', color: RADAR_COLORS.main, decimals: 1 }]}
                        subtitle="คะแนนเฉลี่ยต่อ ส.ทล. ของ บก.ทล. แต่ละแกนเทียบกับ กก. ที่ทำได้สูงสุดในเรื่องนั้น (= 100%)"
                        isDarkMode={isDarkMode}
                    />
                </div>
            </Panel>

            <Panel title="เปรียบเทียบคะแนน 8 กก." icon={BarChart3} isDarkMode={isDarkMode}>
                <p className={`mb-3 text-sm ${muted}`}>คะแนนเฉลี่ยต่อ ส.ทล.</p>
                <ScoreBarChart
                    items={divisionBars}
                    onSelect={onSelectDivision}
                    isDarkMode={isDarkMode}
                    ariaLabel="เปรียบเทียบคะแนนเฉลี่ยต่อ ส.ทล. ของ 8 กก."
                    valueLabel="เฉลี่ยต่อ ส.ทล."
                    decimals={1}
                />
            </Panel>

            <StationCompare model={model} isDarkMode={isDarkMode} onSelectStation={onSelectStation} />

            <Panel title="วิธีคิดคะแนน" icon={Calculator} isDarkMode={isDarkMode}>
                <p className={`mb-4 text-sm ${muted}`}>คะแนนรวม = ปริมาณ + คุณภาพ</p>
                <div className="space-y-5">
                    {KIND_HEADINGS.map(({ kind, label }) => (
                        <div key={kind}>
                            <h4 className="mb-2 text-sm font-semibold">{label}</h4>
                            <ul className="space-y-2 text-sm">
                                {RULES.filter((rule) => rule.kind === kind).map((rule) => (
                                    <li key={`${rule.category}-${rule.text}`} className="flex flex-wrap justify-between gap-x-4">
                                        <span>{rule.categoryLabel} · {rule.text}</span>
                                        <span className="whitespace-nowrap font-semibold tabular-nums">{rule.points} คะแนน {rule.unit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <p className={`mt-5 text-sm ${muted}`}>รางวัลด้านปราบปราม ทั้งรางวัลประจำเดือนและรางวัลครั้งคราว (ระดมกวาดล้างอาชญากรรม จับเมาแล้วขับช่วงเทศกาล คดียอดเยี่ยมแห่งปี พัฒนางานสืบสวน) ลำดับ 1 ถึง 3 ได้ 10, 8 และ 6 คะแนน ลำดับถัดไปได้ 5 คะแนน นับในเดือนที่ประกาศรางวัล ผลงานที่ใช้ร่วมกันแบ่งเท่ากันระหว่างหน่วย และผลงานระดับ กก. แบ่งเท่ากันระหว่าง ส.ทล. ใน กก. นั้น</p>
                <p className={`mt-3 text-sm ${muted}`}>เริ่มคิดคะแนนตั้งแต่ {formatThaiDate(scoringStartDate())}</p>
            </Panel>
        </div>
    );
};

export default HQPanel;
