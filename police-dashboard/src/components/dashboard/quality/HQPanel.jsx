import React from 'react';
import { Gauge, BarChart3, Calculator } from 'lucide-react';
import { CATEGORIES } from '../../../lib/quality/scoringConfig.js';
import { DeltaTag, ScoreBarChart, CategoryTable, Panel, Stat } from './QualityParts';
import { barItems, drugTierNote, formatAverage, formatCount, scoringRules, themed } from './qualityFormat.js';

const RULES = scoringRules();
const KIND_HEADINGS = [
    { kind: 'quantity', label: 'ปริมาณ' },
    { kind: 'quality', label: 'คุณภาพ' },
];

const HQPanel = ({ model, isDarkMode = true, onSelectDivision }) => {
    const { hq, divisions } = model;
    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    const categoryRows = CATEGORIES.map(({ id, label }) => {
        const { quantity, quality, total } = hq.points.categories[id];
        return { label, quantity, quality, total };
    });
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
                    <CategoryTable rows={categoryRows} isDarkMode={isDarkMode} />
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
                                        <span className="whitespace-nowrap font-semibold tabular-nums">{rule.points} แต้ม {rule.unit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <p className={`mt-5 text-sm ${muted}`}>{drugTierNote()}</p>
            </Panel>
        </div>
    );
};

export default HQPanel;
