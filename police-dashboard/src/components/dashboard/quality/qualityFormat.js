import { INDEX_DIMENSIONS } from '../../../lib/quality/scoringConfig.js';
import { scoredDataMonths } from '../../../lib/quality/scoringDates.js';
import { STATION_GROUPS } from '../../../lib/quality/staffing.js';

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

// Staffing is a context figure: it is shown beside the index and never weighted into it
export const STAFFING_NOTE = 'ข้อมูลกำลังพล ณ 1 ต.ค.69 (กก.8 ณ 8 มิ.ย.69 รวมตำแหน่งสอบสวน) · ตัวชี้วัดประกอบ ไม่นำไปคิดในดัชนี';

// The group filter: all stations, then each size group
export const GROUP_FILTERS = [{ id: 'all', label: 'ทั้งหมด' }, ...STATION_GROUPS];

export const groupLabelOf = (id) => STATION_GROUPS.find((group) => group.id === id)?.label ?? '';

// Keeps the given order, so the callers' sort rules still apply
export const filterStationsByGroup = (stations, groupId) => (
    groupId === 'all' ? stations : stations.filter((station) => station.group === groupId)
);

export const groupRankLabel = ({ groupRank, groupSize }) => `ที่ ${groupRank} จาก ${groupSize}`;

// Per head held: two decimals, since most values are below 10
export const formatPerCapita = (value) => formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const meanOf = (values) => (values.length > 0 ? values.reduce((total, value) => total + value, 0) / values.length : 0);

// The mean held and mean index of the given stations: the reference lines of the scatter
export const meansOf = (stations) => ({
    held: meanOf(stations.map((station) => station.held)),
    index: meanOf(stations.map((station) => station.index)),
});

// One scatter point per station: x is held, y is the index
export const staffingPoints = (stations) => stations.map((station) => ({
    key: station.key,
    label: station.name,
    group: station.group,
    groupLabel: groupLabelOf(station.group),
    held: station.held,
    index: station.index,
}));

// The quadrant of a point against the means. Above a mean counts as many (คนมาก) or high (ผลงานสูง); at the mean is low.
export const quadrantCaption = (held, index, means) => {
    const many = held > means.held;
    const high = index > means.index;
    if (many) return high ? 'คนมาก ผลงานสูง' : 'คนมาก ผลงานต่ำ';
    return high ? 'คนน้อย ผลงานสูง' : 'คนน้อย ผลงานต่ำ';
};

// The three per-head values and the index per 10 people, in the order the station page shows them
export const perCapitaItems = (perCapita) => [
    { id: 'criminal', label: 'คดีอาญาต่อคน', value: formatPerCapita(perCapita.criminal) },
    { id: 'truck', label: 'รถหนักต่อคน', value: formatPerCapita(perCapita.truck) },
    { id: 'royal', label: 'วัน ถปภ. ต่อคน', value: formatPerCapita(perCapita.royal) },
    { id: 'indexPer10', label: 'ดัชนีต่อ 10 คน', value: formatAverage(perCapita.indexPer10) },
];

// One table row per station: the group's label is text so the table can show it directly
export const perCapitaRows = (stations) => stations.map((station) => ({
    key: station.key,
    label: station.name,
    groupId: station.group,
    group: groupLabelOf(station.group),
    held: station.held,
    criminal: station.perCapita.criminal,
    truck: station.perCapita.truck,
    royal: station.perCapita.royal,
    indexPer10: station.perCapita.indexPer10,
}));

// Sorts by a column ('label', 'groupId' or a number) in 'asc' or 'desc'. Equal values keep unit order (กก. then ส.ทล.).
export const sortStationRows = (rows, column, direction) => {
    const sign = direction === 'asc' ? 1 : -1;
    const compareColumn = (a, b) => {
        if (column === 'label') return compareUnitKeys(a.key, b.key);
        if (column === 'groupId') return a.groupId.localeCompare(b.groupId);
        return a[column] - b[column];
    };
    return [...rows].sort((a, b) => sign * compareColumn(a, b) || compareUnitKeys(a.key, b.key));
};
