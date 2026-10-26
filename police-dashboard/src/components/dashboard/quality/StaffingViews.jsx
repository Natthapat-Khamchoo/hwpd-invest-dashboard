import React, { useState } from 'react';
import { ChartScatter, ArrowDown, ArrowUp, ArrowUpDown, Users } from 'lucide-react';
import { CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { Panel, SegmentedButtons } from './QualityParts';
import { STATION_GROUPS } from '../../../lib/quality/staffing.js';
import {
    filterStationsByGroup,
    formatAverage,
    formatCount,
    formatPerCapita,
    GROUP_FILTERS,
    meansOf,
    perCapitaRows,
    quadrantCaption,
    sortStationRows,
    staffingPoints,
    STAFFING_NOTE,
    themed,
} from './qualityFormat.js';

// Large stations cyan and small amber, the same pair as the compare series elsewhere
const GROUP_COLORS = { large: '#06b6d4', small: '#f59e0b' };
const GROUP_TEXT_LIGHT = { large: '#0e7490', small: '#b45309' };

// Legend text by its group label, darker on light backgrounds
const legendColorOf = (label, isDarkMode) => {
    const id = STATION_GROUPS.find((group) => group.label === label)?.id;
    return themed(isDarkMode, GROUP_COLORS[id], GROUP_TEXT_LIGHT[id]);
};

const QUADRANT_CORNERS = [
    { label: 'คนน้อย ผลงานสูง', className: 'left-14 top-2' },
    { label: 'คนมาก ผลงานสูง', className: 'right-3 top-2 text-right' },
    { label: 'คนน้อย ผลงานต่ำ', className: 'bottom-16 left-14' },
    { label: 'คนมาก ผลงานต่ำ', className: 'bottom-16 right-3 text-right' },
];

const ScatterTooltip = ({ active, payload, isDarkMode, means }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    return (
        <div className={`rounded-xl border px-3 py-2 text-sm shadow-lg ${themed(isDarkMode, 'border-white/10 bg-slate-800/95 text-white', 'border-slate-200 bg-white/95 text-slate-900')}`}>
            <p className="font-semibold">{item.label}</p>
            <p className="text-xs">{item.groupLabel}</p>
            <p className="mt-1 tabular-nums">คนครอง {formatCount(item.held)}</p>
            <p className="tabular-nums">ดัชนี {formatAverage(item.index)}</p>
            <p className={`mt-1 text-xs ${themed(isDarkMode, 'text-slate-400', 'text-slate-600')}`}>{quadrantCaption(item.held, item.index, means)}</p>
        </div>
    );
};

// Held head count against the index, one colour per size group. Dashed lines mark the mean of the 43 stations.
export const StaffingScatter = ({ stations, isDarkMode = true, onSelectStation }) => {
    const means = meansOf(stations);
    const points = staffingPoints(stations);
    const tickColor = themed(isDarkMode, '#cbd5e1', '#334155');
    const gridColor = themed(isDarkMode, 'rgba(255,255,255,0.12)', '#cbd5e1');
    const labelColor = themed(isDarkMode, '#f1f5f9', '#0f172a');
    const captionClass = themed(isDarkMode, 'text-slate-400', 'text-slate-600');

    return (
        <div className="relative">
            <ResponsiveContainer width="100%" height={380}>
                <ScatterChart margin={{ top: 28, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid stroke={gridColor} />
                    <XAxis type="number" dataKey="held" name="คนครอง" domain={[0, 120]} ticks={[0, 20, 40, 60, 80, 100, 120]} tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={{ stroke: gridColor }} label={{ value: 'คนครอง', position: 'insideBottomRight', offset: -2, fill: tickColor, fontSize: 11 }} />
                    <YAxis type="number" dataKey="index" name="ดัชนี" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} width={48} tickFormatter={formatCount} tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} />
                    <ReferenceLine x={means.held} stroke={tickColor} strokeDasharray="6 4" />
                    <ReferenceLine y={means.index} stroke={tickColor} strokeDasharray="6 4" />
                    <RechartsTooltip
                        cursor={{ strokeDasharray: '3 3', stroke: gridColor }}
                        content={(props) => <ScatterTooltip {...props} isDarkMode={isDarkMode} means={means} />}
                    />
                    <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ color: labelColor, fontSize: 12 }}
                        formatter={(value) => <span style={{ color: legendColorOf(value, isDarkMode) }}>{value}</span>}
                    />
                    {STATION_GROUPS.map((group) => (
                        <Scatter
                            key={group.id}
                            name={group.label}
                            data={points.filter((point) => point.group === group.id)}
                            fill={GROUP_COLORS[group.id]}
                            cursor="pointer"
                            onClick={(point) => { if (point?.payload?.key) onSelectStation(point.payload.key); }}
                        />
                    ))}
                </ScatterChart>
            </ResponsiveContainer>
            {QUADRANT_CORNERS.map((corner) => (
                <span key={corner.label} aria-hidden="true" className={`pointer-events-none absolute text-xs font-semibold ${captionClass} ${corner.className}`}>
                    {corner.label}
                </span>
            ))}
        </div>
    );
};

const TABLE_COLUMNS = [
    { id: 'label', label: 'สถานี', numeric: false },
    { id: 'groupId', label: 'กลุ่ม', numeric: false },
    { id: 'held', label: 'คนครอง', numeric: true, format: formatCount },
    { id: 'criminal', label: 'คดีอาญาต่อคน', numeric: true, format: formatPerCapita },
    { id: 'truck', label: 'รถหนักต่อคน', numeric: true, format: formatPerCapita },
    { id: 'royal', label: 'วัน ถปภ. ต่อคน', numeric: true, format: formatPerCapita },
    { id: 'indexPer10', label: 'ดัชนีต่อ 10 คน', numeric: true, format: formatAverage },
];

// Clicking the active column flips its direction. A new text column starts ascending, a new number column descending.
const nextSort = (current, column) => {
    if (current.column === column.id) return { column: column.id, direction: current.direction === 'asc' ? 'desc' : 'asc' };
    return { column: column.id, direction: column.numeric ? 'desc' : 'asc' };
};

// Per-head values for each station, sortable by any column. Scrolls inside its own box on a phone.
export const PerCapitaTable = ({ stations, isDarkMode = true, onSelectStation }) => {
    const [groupFilter, setGroupFilter] = useState('all');
    const [sort, setSort] = useState({ column: 'indexPer10', direction: 'desc' });
    const rows = sortStationRows(perCapitaRows(filterStationsByGroup(stations, groupFilter)), sort.column, sort.direction);
    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    const divider = themed(isDarkMode, 'border-white/10', 'border-slate-200');
    const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400';

    return (
        <div className="space-y-4">
            <SegmentedButtons label="กรองตามกลุ่มขนาด" options={GROUP_FILTERS} value={groupFilter} onChange={setGroupFilter} isDarkMode={isDarkMode} />
            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                    <thead>
                        <tr className={`border-b text-left text-xs ${muted} ${divider}`}>
                            {TABLE_COLUMNS.map((column) => {
                                const active = sort.column === column.id;
                                const sortState = active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';
                                const Icon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;
                                return (
                                    <th key={column.id} scope="col" aria-sort={sortState} className={`px-2 py-1 font-semibold ${column.numeric ? 'text-right' : 'text-left'}`}>
                                        <button
                                            type="button"
                                            onClick={() => setSort((current) => nextSort(current, column))}
                                            className={`inline-flex min-h-[44px] cursor-pointer items-center gap-1 whitespace-nowrap rounded-md px-2 ${focusRing} ${column.numeric ? 'justify-end' : ''}`}
                                        >
                                            {column.label}
                                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                        </button>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.key} className={`border-b ${divider}`}>
                                <td className="px-2 py-1">
                                    <button
                                        type="button"
                                        onClick={() => onSelectStation(row.key)}
                                        className={`inline-flex min-h-[44px] cursor-pointer items-center whitespace-nowrap rounded-md px-2 text-left font-medium underline-offset-4 hover:underline ${focusRing} ${themed(isDarkMode, 'text-cyan-300', 'text-cyan-700')}`}
                                    >
                                        {row.label}
                                    </button>
                                </td>
                                <td className="whitespace-nowrap px-2 py-1">{row.group}</td>
                                {TABLE_COLUMNS.slice(2).map((column) => (
                                    <td key={column.id} className="whitespace-nowrap px-2 py-1 text-right tabular-nums">
                                        {column.format(row[column.id])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// The two staffing views on the HQ page: the scatter of held against index, and the per-head table
export const StaffingPanels = ({ stations, isDarkMode = true, onSelectStation }) => {
    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    return (
        <>
            <Panel title="ดัชนี × กำลังพล" icon={ChartScatter} isDarkMode={isDarkMode}>
                <p className={`mb-3 text-sm ${muted}`}>คนครองกับดัชนีของแต่ละ ส.ทล. แยกตามกลุ่มขนาด · กดจุดเพื่อดูรายละเอียด</p>
                <StaffingScatter stations={stations} isDarkMode={isDarkMode} onSelectStation={onSelectStation} />
                <p className={`mt-4 text-xs ${muted}`}>{STAFFING_NOTE}</p>
            </Panel>
            <Panel title="ผลงานต่อกำลังพล" icon={Users} isDarkMode={isDarkMode}>
                <p className={`mb-3 text-sm ${muted}`}>ค่าเฉลี่ยต่อคนครอง 1 คน · กดชื่อ ส.ทล. เพื่อดูรายละเอียด หรือกดหัวคอลัมน์เพื่อเรียงลำดับ</p>
                <PerCapitaTable stations={stations} isDarkMode={isDarkMode} onSelectStation={onSelectStation} />
                <p className={`mt-4 text-xs ${muted}`}>{STAFFING_NOTE}</p>
            </Panel>
        </>
    );
};
