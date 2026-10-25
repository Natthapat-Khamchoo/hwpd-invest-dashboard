import { INDEX_DIMENSIONS } from '../../../lib/quality/scoringConfig.js';
import { scoredDataMonths } from '../../../lib/quality/scoringDates.js';

const MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export const formatThaiDate = (date) => `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear() + 543}`;

export const formatPeriodRange = ({ start, end }) => `${formatThaiDate(start)} – ${formatThaiDate(end)}`;

// 'YYYY-MM' to "ส.ค. 2569"
export const formatMonthThai = (monthKey) => {
    const [year, month] = monthKey.split('-').map(Number);
    return `${MONTHS_SHORT[month - 1]} ${year + 543}`;
};

// Workbook months that count, newest first, for the month picker
export const monthOptions = () => scoredDataMonths().reverse().map((value) => ({ value, label: formatMonthThai(value) }));

// The fiscal year (starts 1 October) that holds a 'YYYY-MM' month, by its Buddhist year: Oct 2025 starts FY 2569
export const fiscalYearLabel = (monthKey) => {
    const [year, month] = monthKey.split('-').map(Number);
    const startYear = month >= 10 ? year : year - 1;
    return `ปีงบ ${startYear + 1 + 543}`;
};

// Header line under the title: the index is experimental, where the workbooks end, and which dimensions it covers
export const sourceNotice = (newestMonth) => `ดัชนีทดลองคิดจากสถิติคดีอาญาจับเองของงานแผน (รายกลุ่มข้อหา) ข้อมูลถึง ${formatMonthThai(newestMonth)} รวมคดีสำคัญ รางวัล OP / ยุทธการ รถหนัก และถวายความปลอดภัย (ถปภ.)`;

// "ก.ย. 2569 ลำดับ 1", with the share count and an honourable mention when they apply
export const awardLabel = ({ month, rank, shared, honourable }) => (
    `${formatMonthThai(month)}${rank ? ` ลำดับ ${rank}` : ''}`
    + (shared > 1 ? ` (แบ่ง ${shared} หน่วย)` : '')
    + (honourable ? ' · ชมเชย' : '')
);

const formatNumber = (value, options) => Number(value).toLocaleString('th-TH', options);

// Raw values and counts: thousands separators, a fraction only when one exists
export const formatCount = (value) => formatNumber(value, { maximumFractionDigits: 1 });

// Index figures and scores always show one decimal
export const formatAverage = (value) => formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// A delta is always measured against the whole previous month
export const formatDelta = (delta) => {
    if (delta === null || delta === undefined) return null;
    const sign = delta > 0 ? '+' : '';
    return `${sign}${formatCount(delta)} จากเดือนก่อน`;
};

// Rows are { key, value }; a tie shares the better place
export const placingOf = (rows, key) => {
    const chosen = rows.find((row) => row.key === key);
    return 1 + rows.filter((row) => row.value > chosen.value).length;
};

export const themed = (isDarkMode, dark, light) => (isDarkMode ? dark : light);

// Main series is cyan and the compare series amber, on both themes
export const RADAR_COLORS = { main: '#06b6d4', compare: '#f59e0b' };

// Darker text versions of the strokes for light backgrounds, where the bright strokes are too faint for small text
const RADAR_TEXT_LIGHT = { '#06b6d4': '#0e7490', '#f59e0b': '#b45309' };

export const radarTextColor = (stroke, isDarkMode) => themed(isDarkMode, stroke, RADAR_TEXT_LIGHT[stroke] ?? stroke);

// Unit of each dimension's raw value, as the breakdown table shows it
export const INDEX_UNITS = {
    criminal: 'คดี',
    major: 'ครั้ง',
    award: 'คะแนนรางวัล',
    op: 'คะแนน OP',
    truck: 'คดี',
    royal: 'วัน',
};

// The index first, then the six dimensions in config order: the metric picker's choices
export const INDEX_METRICS = [
    { id: 'index', label: 'ดัชนีรวม' },
    ...INDEX_DIMENSIONS.map(({ id, label }) => ({ id, label })),
];

// A score as a percent of its weight, one decimal; 0 when the weight is 0
export const axisPercent = (score, weight) => (weight > 0 ? Math.round((score / weight) * 1000) / 10 : 0);

// The value a unit shows for a metric: its index, or one dimension score
export const metricValueOf = (unit, metric) => (metric === 'index' ? unit.index : unit.scores[metric]);

// Unit keys as numbers, so 'kk' sorts before 'kk-stl' and 1-6 before 1-10
const unitNumbers = (key) => String(key).split('-').map(Number);
export const compareUnitKeys = (a, b) => {
    const left = unitNumbers(a);
    const right = unitNumbers(b);
    for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
        const difference = (left[i] ?? -1) - (right[i] ?? -1);
        if (difference !== 0) return difference;
    }
    return 0;
};

// Units become bar items for the chosen metric, in unit order (กก. then ส.ทล.), whatever the value
export const indexBarItems = (units, metric, labelOf) => units
    .map((unit) => ({ key: unit.key ?? unit.kk, label: labelOf(unit), value: metricValueOf(unit, metric) }))
    .sort((a, b) => compareUnitKeys(a.key, b.key));

// One row per dimension. Each series is a percent of the dimension's weight; raw keeps its score for the tooltip
export const dimensionRadarRows = (series) => INDEX_DIMENSIONS.map(({ id, label, weight }) => {
    const row = { id, label, raw: {} };
    for (const { name, scores } of series) {
        row[name] = axisPercent(scores[id], weight);
        row.raw[name] = { score: scores[id], weight };
    }
    return row;
});

// Plain-text percents for one series, read out by screen readers
export const radarSummary = (rows, name) => rows.map((row) => `${row.label} ${formatCount(row[name])}%`).join(', ');

// One row per dimension: the raw value, the best station's raw value in the period, the score and the weight
export const breakdownRows = (raw, max, scores) => INDEX_DIMENSIONS.map(({ id, label, weight }) => ({
    id,
    label,
    unit: INDEX_UNITS[id],
    raw: raw[id],
    max: max[id],
    score: scores[id],
    weight,
}));

// Each dimension's raw value averaged over the given stations, so a division reads per station
export const averageRaw = (stations) => Object.fromEntries(INDEX_DIMENSIONS.map(({ id }) => [
    id,
    stations.length > 0 ? stations.reduce((total, station) => total + station.raw[id], 0) / stations.length : 0,
]));

// The station's items as groups in a fixed order; a group with no items keeps an empty rows list
const ITEM_GROUPS = [
    { kind: 'award', label: 'รางวัล' },
    { kind: 'major', label: 'คดีสำคัญ' },
    { kind: 'op', label: 'OP / ยุทธการ' },
];
export const itemGroupsOf = (items) => ITEM_GROUPS.map(({ kind, label }) => ({ kind, label, rows: items[kind] ?? [] }));
