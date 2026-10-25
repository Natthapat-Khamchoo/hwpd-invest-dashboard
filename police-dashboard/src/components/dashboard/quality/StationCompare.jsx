import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, LabelList, Tooltip as RechartsTooltip } from 'recharts';
import { MetricCard, Panel, ScoreBarTooltip } from './QualityParts';
import { barItems, METRICS, metricSum, formatCount, themed } from './qualityFormat.js';

const ROW_HEIGHT = 26;
const SORTS = [
    { id: 'order', label: 'ตามลำดับหน่วย' },
    { id: 'score', label: 'ตามคะแนน' },
];
// Neighbouring กก. alternate shades so the 43 rows read as groups
const BAR_FILLS = ['#06b6d4', '#6366f1'];

// Compares every ส.ทล. in one chart. Rows are horizontal bars because 43 vertical bars do not fit a phone.
const StationCompare = ({ model, isDarkMode = true, onSelectStation }) => {
    const [selectedMetric, setSelectedMetric] = useState('total');
    const [sort, setSort] = useState('order');
    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    const tickColor = themed(isDarkMode, '#cbd5e1', '#334155');
    const gridColor = themed(isDarkMode, 'rgba(255,255,255,0.12)', '#cbd5e1');
    const labelColor = themed(isDarkMode, '#f1f5f9', '#0f172a');
    const metric = METRICS.find((item) => item.id === selectedMetric);

    // Labels read ส.ทล. first, but unit order stays กก. then ส.ทล., so sort by the 'kk-stl' key rather than the label
    const unitOrder = (key) => key.split('-').map(Number);
    const items = barItems(model.stations, selectedMetric, (station) => `ส.ทล.${station.stl} กก.${station.kk}`)
        .sort((a, b) => { const [ak, as] = unitOrder(a.key); const [bk, bs] = unitOrder(b.key); return ak - bk || as - bs; })
        .map((item, index) => ({ ...item, fill: BAR_FILLS[unitOrder(item.key)[0] % 2], index }));
    if (sort === 'score') items.sort((a, b) => b.value - a.value || a.index - b.index);

    return (
        <Panel title="เปรียบเทียบทั้ง 43 ส.ทล." icon={Building2} isDarkMode={isDarkMode}>
            <div role="group" aria-label="เลือกตัวชี้วัด" className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
                {METRICS.map((item) => (
                    <MetricCard
                        key={item.id}
                        metric={item}
                        className={item.id === 'total' ? 'col-span-2 lg:col-span-1' : ''}
                        value={metricSum(model.hq.points, item.id)}
                        selected={item.id === selectedMetric}
                        onSelect={setSelectedMetric}
                        isDarkMode={isDarkMode}
                    />
                ))}
            </div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className={`text-sm ${muted}`}>เปรียบเทียบ{metric.label} ของทุก ส.ทล. · กดแท่งเพื่อดูรายละเอียด</p>
                <div role="group" aria-label="เรียงลำดับ" className="flex gap-2">
                    {SORTS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            aria-pressed={sort === item.id}
                            onClick={() => setSort(item.id)}
                            className={`min-h-[44px] cursor-pointer rounded-lg border px-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${sort === item.id
                                ? themed(isDarkMode, 'border-cyan-400 bg-cyan-500/15', 'border-cyan-600 bg-cyan-50')
                                : themed(isDarkMode, 'border-white/10 bg-slate-900/40 hover:bg-slate-800/60', 'border-slate-200 bg-white hover:bg-slate-100')}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
            <div role="group" aria-label={`เปรียบเทียบ${metric.label} ของทั้ง 43 ส.ทล.`}>
                <ResponsiveContainer width="100%" height={items.length * ROW_HEIGHT + 40}>
                    <BarChart data={items} layout="vertical" margin={{ top: 4, right: 44, left: 0, bottom: 0 }}>
                        <CartesianGrid horizontal={false} stroke={gridColor} />
                        <XAxis type="number" domain={[0, 'auto']} tickFormatter={formatCount} tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={{ stroke: gridColor }} />
                        <YAxis type="category" dataKey="label" width={92} interval={0} tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} />
                        <RechartsTooltip
                            cursor={{ fill: themed(isDarkMode, 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0.05)') }}
                            content={(props) => <ScoreBarTooltip {...props} isDarkMode={isDarkMode} valueLabel={metric.label} decimals={0} />}
                        />
                        <Bar dataKey="value" barSize={16} radius={[0, 6, 6, 0]} cursor="pointer" onClick={(data) => onSelectStation(data.payload.key)}>
                            {items.map((item) => <Cell key={item.key} fill={item.fill} />)}
                            <LabelList dataKey="value" position="right" formatter={formatCount} fill={labelColor} fontSize={11} fontWeight={600} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                <ul className="mt-2">
                    {items.map((item) => (
                        <li key={item.key}>
                            <button
                                type="button"
                                onClick={() => onSelectStation(item.key)}
                                className="sr-only focus:not-sr-only focus:inline-flex focus:min-h-[44px] focus:items-center focus:px-3 focus:py-2 cursor-pointer rounded-md text-left text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                            >
                                {item.label} {metric.label} {formatCount(item.value)}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </Panel>
    );
};

export default StationCompare;
