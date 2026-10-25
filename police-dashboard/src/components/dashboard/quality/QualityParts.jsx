import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, Tooltip as RechartsTooltip } from 'recharts';
import { CATEGORIES } from '../../../lib/quality/scoringConfig.js';
import { formatAverage, formatCount, formatDelta, themed } from './qualityFormat.js';

const BAR_FILL = '#06b6d4';

const formatValue = (value, decimals) => (decimals > 0 ? formatAverage(value) : formatCount(value));

const ScoreBarTooltip = ({ active, payload, isDarkMode, valueLabel, decimals }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    return (
        <div className={`rounded-xl border px-3 py-2 text-sm shadow-lg ${themed(isDarkMode, 'border-white/10 bg-slate-800/95 text-white', 'border-slate-200 bg-white/95 text-slate-900')}`}>
            <p className="font-semibold">{item.label}</p>
            <p className="tabular-nums">{valueLabel} {formatValue(item.value, decimals)}</p>
            {item.total !== item.value && <p className="tabular-nums">คะแนนรวม {formatCount(item.total)}</p>}
        </div>
    );
};

// items come from barItems(); onSelect receives the item key. Every bar is one colour; the value axis starts at 0.
export const ScoreBarChart = ({ items, onSelect, isDarkMode = true, ariaLabel, valueLabel = 'คะแนน', decimals = 0 }) => {
    const tickColor = themed(isDarkMode, '#cbd5e1', '#334155');
    const gridColor = themed(isDarkMode, 'rgba(255,255,255,0.12)', '#cbd5e1');
    const labelColor = themed(isDarkMode, '#f1f5f9', '#0f172a');
    return (
        <div role="group" aria-label={ariaLabel}>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={items} margin={{ top: 24, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={gridColor} />
                    <XAxis dataKey="label" interval={0} tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={{ stroke: gridColor }} />
                    <YAxis domain={[0, 'auto']} width={56} allowDecimals={decimals > 0} tickFormatter={formatCount} tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} />
                    <RechartsTooltip
                        cursor={{ fill: themed(isDarkMode, 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0.05)') }}
                        content={(props) => <ScoreBarTooltip {...props} isDarkMode={isDarkMode} valueLabel={valueLabel} decimals={decimals} />}
                    />
                    <Bar dataKey="value" fill={BAR_FILL} maxBarSize={44} radius={[6, 6, 0, 0]} cursor="pointer" onClick={(data) => onSelect(data.payload.key)}>
                        <LabelList dataKey="value" position="top" formatter={(value) => formatValue(value, decimals)} fill={labelColor} fontSize={11} fontWeight={600} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            <ul className="mt-2">
                {items.map((item) => (
                    <li key={item.key}>
                        <button
                            type="button"
                            onClick={() => onSelect(item.key)}
                            className="sr-only focus:not-sr-only focus:inline-flex focus:min-h-[44px] focus:items-center focus:px-3 focus:py-2 cursor-pointer rounded-md text-left text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                        >
                            {item.label} {valueLabel} {formatValue(item.value, decimals)}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export const DeltaTag = ({ delta, isDarkMode = true }) => {
    if (delta === null || delta === undefined) return null;
    const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
    const color = delta > 0
        ? themed(isDarkMode, 'text-emerald-300', 'text-emerald-700')
        : delta < 0
            ? themed(isDarkMode, 'text-rose-300', 'text-rose-700')
            : themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    return (
        <span className={`inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium ${color}`}>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDelta(delta)}
        </span>
    );
};

export const Stat = ({ label, value, isDarkMode = true, emphasis = false }) => (
    <div className={`rounded-lg border p-3 ${themed(isDarkMode, 'border-white/10 bg-slate-900/40', 'border-slate-200 bg-slate-50')}`}>
        <dt className={`text-xs font-semibold ${themed(isDarkMode, 'text-slate-400', 'text-slate-600')}`}>{label}</dt>
        <dd className={`mt-1 font-bold tabular-nums ${emphasis ? 'text-3xl' : 'text-2xl'}`}>{value}</dd>
    </div>
);

// rows: [{ label, quantity, quality, total }]; compare (optional) is one number per row, aligned with rows.
// A total row sums the rows, including the compare column.
export const CategoryTable = ({ rows, compare, compareLabel, isDarkMode = true, decimals = 0 }) => {
    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    const divider = themed(isDarkMode, 'border-white/10', 'border-slate-200');
    const fmt = (value) => formatValue(value, decimals);
    const sumOf = (key) => rows.reduce((total, row) => total + row[key], 0);
    const compareSum = compare ? compare.reduce((total, value) => total + value, 0) : 0;
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-sm">
                <thead>
                    <tr className={`border-b text-left text-xs ${muted} ${divider}`}>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">เรื่อง</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">ปริมาณ</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">คุณภาพ</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">รวม</th>
                        {compare && <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">{compareLabel}</th>}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={row.label} className={`border-b ${divider}`}>
                            <td className="px-3 py-2">{row.label}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{fmt(row.quantity)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{fmt(row.quality)}</td>
                            <td className="px-3 py-2 text-right font-semibold tabular-nums">{fmt(row.total)}</td>
                            {compare && <td className={`px-3 py-2 text-right tabular-nums ${muted}`}>{fmt(compare[index])}</td>}
                        </tr>
                    ))}
                    <tr className="font-bold">
                        <th scope="row" className="px-3 py-2 text-left">รวม</th>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(sumOf('quantity'))}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(sumOf('quality'))}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(sumOf('total'))}</td>
                        {compare && <td className={`px-3 py-2 text-right tabular-nums ${muted}`}>{fmt(compareSum)}</td>}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

// rows come from pointsBreakdown(raw), grouped under their category heading
export const PointsBreakdownTable = ({ rows, isDarkMode = true }) => {
    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    const divider = themed(isDarkMode, 'border-white/10', 'border-slate-200');
    if (rows.length === 0) return <p className={`text-sm ${muted}`}>ยังไม่มีผลงานที่ให้คะแนนในช่วงนี้</p>;
    const groups = CATEGORIES
        .map((category) => ({ category, rows: rows.filter((row) => row.category === category.id) }))
        .filter((group) => group.rows.length > 0);
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
                <thead>
                    <tr className={`border-b text-left text-xs ${muted} ${divider}`}>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">รายการ</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">จำนวน</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">ปริมาณ</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">คุณภาพ</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">รวม</th>
                    </tr>
                </thead>
                <tbody>
                    {groups.map(({ category, rows: groupRows }) => (
                        <React.Fragment key={category.id}>
                            <tr>
                                <th scope="rowgroup" colSpan={5} className={`px-3 pb-1 pt-4 text-left text-xs font-bold ${themed(isDarkMode, 'text-cyan-300', 'text-cyan-700')}`}>
                                    {category.label}
                                </th>
                            </tr>
                            {groupRows.map((row) => (
                                <tr key={row.label} className={`border-b ${divider}`}>
                                    <td className="px-3 py-2">{row.label}</td>
                                    <td className="px-3 py-2 text-right tabular-nums">{formatCount(row.count)}</td>
                                    <td className="px-3 py-2 text-right tabular-nums">{formatCount(row.quantity)}</td>
                                    <td className="px-3 py-2 text-right tabular-nums">{formatCount(row.quality)}</td>
                                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatCount(row.total)}</td>
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export const Panel = ({ title, icon: Icon, action, children, isDarkMode = true }) => (
    <section className={`rounded-xl p-4 sm:p-6 ${themed(isDarkMode, 'glass-liquid text-white', 'border border-slate-200 bg-white text-slate-900 shadow-sm')}`}>
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-lg font-bold">
                {Icon && <Icon className={`h-5 w-5 ${themed(isDarkMode, 'text-cyan-400', 'text-cyan-600')}`} aria-hidden="true" />}
                {title}
            </h3>
            {action}
        </header>
        {children}
    </section>
);
