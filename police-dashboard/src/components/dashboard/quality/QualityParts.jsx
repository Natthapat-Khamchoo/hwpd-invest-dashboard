import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, Tooltip as RechartsTooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { awardLabel, formatAverage, formatCount, formatDelta, radarSummary, radarTextColor, themed } from './qualityFormat.js';

const BAR_FILL = '#06b6d4';

const formatValue = (value, decimals) => (decimals > 0 ? formatAverage(value) : formatCount(value));
const formatPercent = (value) => `${formatCount(value)}%`;

// The index figure with its experimental badge and the change from the previous month
export const IndexFigure = ({ index, delta, isDarkMode = true }) => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-base font-semibold">ดัชนีคุณภาพ</span>
            <span className="text-4xl font-bold tabular-nums">{formatAverage(index)}</span>
            <span className={`text-base font-semibold ${themed(isDarkMode, 'text-slate-400', 'text-slate-600')}`}>/ 100</span>
        </p>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${themed(isDarkMode, 'border-amber-400/50 bg-amber-400/10 text-amber-200', 'border-amber-500 bg-amber-50 text-amber-800')}`}>
            ดัชนีทดลอง
        </span>
        <DeltaTag delta={delta} isDarkMode={isDarkMode} />
    </div>
);

export const ScoreBarTooltip = ({ active, payload, isDarkMode, valueLabel, decimals }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    return (
        <div className={`rounded-xl border px-3 py-2 text-sm shadow-lg ${themed(isDarkMode, 'border-white/10 bg-slate-800/95 text-white', 'border-slate-200 bg-white/95 text-slate-900')}`}>
            <p className="font-semibold">{item.label}</p>
            <p className="tabular-nums">{valueLabel} {formatValue(item.value, decimals)}</p>
        </div>
    );
};

// items come from indexBarItems(); onSelect receives the item key. Every bar is one colour; the value axis starts at 0.
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

const RadarTooltip = ({ active, payload, isDarkMode, series }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
        <div className={`rounded-xl border px-3 py-2 text-sm shadow-lg ${themed(isDarkMode, 'border-white/10 bg-slate-800/95 text-white', 'border-slate-200 bg-white/95 text-slate-900')}`}>
            <p className="font-semibold">{row.label}</p>
            {series.map((item) => {
                const raw = row.raw[item.name];
                return (
                    <div key={item.name} className="mt-1">
                        <p className="tabular-nums"><span style={{ color: radarTextColor(item.color, isDarkMode) }}>{item.name}</span> {formatPercent(row[item.name])}</p>
                        <p className="text-xs tabular-nums">คะแนน {formatAverage(raw.score)} / {raw.weight}</p>
                    </div>
                );
            })}
        </div>
    );
};

// rows come from dimensionRadarRows(). series: [{ name, color, dashed? }]; the first series is the one the aria-label summarises.
export const CategoryRadar = ({ rows, series, subtitle, isDarkMode = true }) => {
    const mainName = series[0].name;
    // Spokes are 360 / rows.length degrees apart, starting at the top (90). The radius axis sits midway between the first two spokes, so its ticks never meet a category label.
    const radiusAxisAngle = 90 - 180 / rows.length;
    const tickColor = themed(isDarkMode, '#cbd5e1', '#334155');
    const gridColor = themed(isDarkMode, 'rgba(255,255,255,0.14)', '#cbd5e1');
    const labelColor = themed(isDarkMode, '#f1f5f9', '#0f172a');
    return (
        <div>
            <p className={`mb-3 text-sm ${themed(isDarkMode, 'text-slate-400', 'text-slate-600')}`}>{subtitle}</p>
            <div role="img" aria-label={`กราฟเรดาร์ ${mainName}: ${radarSummary(rows, mainName)}`}>
                <ResponsiveContainer width="100%" height={360}>
                    <RadarChart data={rows} outerRadius="76%" margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                        <PolarGrid stroke={gridColor} />
                        <PolarAngleAxis dataKey="label" tick={{ fill: tickColor, fontSize: 12 }} />
                        <PolarRadiusAxis domain={[0, 100]} tickCount={5} angle={radiusAxisAngle} stroke={gridColor} tick={{ fill: tickColor, fontSize: 10 }} tickFormatter={formatPercent} />
                        {series.map((item) => (
                            <Radar
                                key={item.name}
                                name={item.name}
                                dataKey={(row) => row[item.name]}
                                stroke={item.color}
                                fill={item.color}
                                fillOpacity={item.dashed ? 0.1 : 0.3}
                                strokeWidth={2}
                                strokeDasharray={item.dashed ? '6 4' : undefined}
                            />
                        ))}
                        <RechartsTooltip content={(props) => <RadarTooltip {...props} isDarkMode={isDarkMode} series={series} />} />
                        <Legend
                            wrapperStyle={{ color: labelColor, fontSize: 12 }}
                            formatter={(value) => <span style={{ color: radarTextColor(series.find((item) => item.name === value)?.color ?? labelColor, isDarkMode) }}>{value}</span>}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            <ul className="sr-only">
                {rows.flatMap((row) => series.map((item) => {
                    const raw = row.raw[item.name];
                    const prefix = series.length > 1 ? `${item.name} · ` : '';
                    return (
                        <li key={`${row.id}-${item.name}`}>
                            {prefix}{row.label}: {formatPercent(row[item.name])}, คะแนน {formatAverage(raw.score)} จาก {raw.weight}
                        </li>
                    );
                }))}
            </ul>
        </div>
    );
};

// rows come from breakdownRows(). averaged = the raw values are per-station averages, not totals.
export const BreakdownTable = ({ rows, averaged = false, isDarkMode = true }) => {
    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    const divider = themed(isDarkMode, 'border-white/10', 'border-slate-200');
    const formatRaw = averaged ? formatAverage : formatCount;
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
                <thead>
                    <tr className={`border-b text-left text-xs ${muted} ${divider}`}>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">ด้าน</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">{averaged ? 'เฉลี่ยต่อ ส.ทล.' : 'ค่า'}</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">สูงสุดในช่วง</th>
                        <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">คะแนน / น้ำหนัก</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id} className={`border-b ${divider}`}>
                            <th scope="row" className="px-3 py-2 text-left font-medium">{row.label}</th>
                            <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatRaw(row.raw)} {row.unit}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatRaw(row.max)} {row.unit}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums">{formatAverage(row.score)} / {row.weight}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// groups come from itemGroupsOf(). Each row is one award, major case, OP case or important warrant that the unit took part in.
export const ItemGroupsList = ({ groups, isDarkMode = true }) => {
    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    const divider = themed(isDarkMode, 'border-white/10', 'border-slate-200');
    return (
        <div className="space-y-5">
            {groups.map((group) => (
                <section key={group.kind} aria-labelledby={`items-${group.kind}`}>
                    <h4 id={`items-${group.kind}`} className="mb-2 text-sm font-semibold">{group.label}</h4>
                    {group.rows.length === 0 ? (
                        <p className={`text-sm ${muted}`}>ไม่มีรายการ</p>
                    ) : (
                        <ul className="text-sm">
                            {group.rows.map((row, index) => (
                                <li key={`${row.month}-${index}`} className={`flex flex-wrap justify-between gap-x-4 gap-y-1 border-b py-2 ${divider}`}>
                                    <span className="min-w-0 break-words">
                                        <span className={`mr-2 whitespace-nowrap text-xs ${muted}`}>{awardLabel(row)}</span>
                                        {row.title}
                                    </span>
                                    <span className="whitespace-nowrap font-semibold tabular-nums">{group.kind === 'warrant' ? `+${formatCount(row.value)} คดี` : `${formatCount(row.value)} คะแนน`}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            ))}
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

export const MetricCard = ({ metric, value, selected, onSelect, isDarkMode, className = '' }) => {
    const stateClass = selected
        ? themed(isDarkMode, 'border-cyan-400 bg-cyan-500/15', 'border-cyan-600 bg-cyan-50')
        : themed(isDarkMode, 'border-white/10 bg-slate-900/40 hover:bg-slate-800/60', 'border-slate-200 bg-white hover:bg-slate-100');
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(metric.id)}
            className={`flex min-h-[44px] w-full min-w-0 cursor-pointer flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${stateClass} ${className}`}
        >
            <span className="break-words text-xs font-semibold">{metric.label}</span>
            <span className="max-w-full break-words text-lg font-bold tabular-nums sm:text-xl">{formatAverage(value)}</span>
        </button>
    );
};
