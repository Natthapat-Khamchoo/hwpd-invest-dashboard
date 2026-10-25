import { AWARD_POINTS, CATEGORIES, QUANTITY, QUALITY } from '../../../lib/quality/scoringConfig.js';
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

// Header line under the title: where the self-arrest workbooks end, and that awards are added
export const sourceNotice = (newestMonth) => `คะแนนคิดจากสถิติคดีอาญาจับเองของงานแผน (รายกลุ่มข้อหา) ข้อมูลถึง ${formatMonthThai(newestMonth)} รวมภารกิจถวายความปลอดภัย (ถปภ.) และคะแนนรางวัลด้านปราบปราม (ประจำเดือนและครั้งคราว)`;

// "ก.ย. 2569 ลำดับ 1", with the share count and an honourable mention when they apply. Points sit in their own column.
export const awardLabel = ({ month, rank, shared, honourable }) => (
    `${formatMonthThai(month)} ลำดับ ${rank}`
    + (shared > 1 ? ` (แบ่ง ${shared} หน่วย)` : '')
    + (honourable ? ' · ชมเชย' : '')
);

const formatNumber = (value, options) => Number(value).toLocaleString('th-TH', options);

// Points and counts: thousands separators, a fraction only when one exists
export const formatCount = (value) => formatNumber(value, { maximumFractionDigits: 1 });

// Per-station averages always show one decimal
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

export const METRICS = [
    { id: 'total', label: 'คะแนนรวม' },
    { id: 'quantity', label: 'ปริมาณ' },
    { id: 'quality', label: 'คุณภาพ' },
    ...CATEGORIES.map(({ id, label }) => ({ id, label })),
];

export const metricSum = (points, id) => {
    if (id === 'total') return points.total;
    if (id === 'quantity') return points.quantity;
    if (id === 'quality') return points.quality;
    return points.categories[id].total;
};

const metricValue = (unit, metric) => {
    if (metric === 'average') return unit.average;
    if (metric === 'total') return unit.points.total;
    if (metric === 'quantity') return unit.points.quantity;
    if (metric === 'quality') return unit.points.quality;
    return unit.points.categories[metric].total;
};

// Units become bar items for metric 'total' | 'quantity' | 'quality' | a category id | 'average'.
// Fixed unit order by the number in the label (กก.1 to กก.8, ส.ทล.1 to ส.ทล.6), whatever the metric.
// `total` rides along for the tooltip.
export const barItems = (units, metric, labelOf) => units
    .map((unit) => ({
        key: unit.key ?? unit.kk,
        label: labelOf(unit),
        value: metricValue(unit, metric),
        total: unit.points.total,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'th', { numeric: true }));

// The seven self-arrest columns of a station's raw counts. Each case scores its quantity, and a gun case also its quality.
const SELF_ARREST_ROWS = [
    { field: 'warrant', label: 'หมายจับ', category: 'warrant', quantityEach: QUANTITY.warrant, qualityEach: 0 },
    { field: 'drugs', label: 'ยาเสพติด', category: 'drugs', quantityEach: QUANTITY.drugCaseBase, qualityEach: 0 },
    { field: 'immig', label: 'คนเข้าเมือง', category: 'flagrant', quantityEach: QUANTITY.flagrant, qualityEach: 0 },
    { field: 'theft', label: 'ลักทรัพย์', category: 'flagrant', quantityEach: QUANTITY.flagrant, qualityEach: 0 },
    { field: 'gun', label: 'อาวุธปืน', category: 'flagrant', quantityEach: QUANTITY.flagrant, qualityEach: QUALITY.flagrantExtra.gun },
    { field: 'other', label: 'คดีอาญาอื่น ๆ', category: 'flagrant', quantityEach: QUANTITY.flagrant, qualityEach: 0 },
    { field: 'truck', label: 'รถหนัก', category: 'flagrant', quantityEach: QUANTITY.flagrant, qualityEach: 0 },
    { field: 'royal', label: 'ถวายความปลอดภัย (ถปภ.)', category: 'royal', quantityEach: QUANTITY.royalConvoy, qualityEach: 0 },
];

// One row per self-arrest column (zeros included), then one row per award. The rows add up to the station's points.
export const pointsBreakdown = (counts, awards = []) => [
    ...SELF_ARREST_ROWS.map(({ field, label, category, quantityEach, qualityEach }) => {
        const count = counts[field] ?? 0;
        const quantity = count * quantityEach;
        const quality = count * qualityEach;
        return { category, label, count, quantity, quality, total: quantity + quality };
    }),
    ...awards.map((award) => ({
        category: 'award',
        label: `${award.title ?? 'ผลงานดีเด่น'} ${awardLabel(award)}`,
        count: 1,
        quantity: 0,
        quality: award.points,
        total: award.points,
    })),
];

const rule = (kind, category, text, points, unit) => ({
    kind,
    category,
    categoryLabel: CATEGORIES.find((item) => item.id === category).label,
    text,
    points,
    unit,
});

// Every quantity and quality rule, read from the config so the copy never drifts from the points
export const scoringRules = () => [
    rule('quantity', 'warrant', 'ทุกหมายจับ', QUANTITY.warrant, 'ต่อหมาย'),
    rule('quantity', 'flagrant', 'ทุกการจับกุมซึ่งหน้า (คนเข้าเมือง ลักทรัพย์ อาวุธปืน คดีอาญาอื่น ๆ รถหนัก)', QUANTITY.flagrant, 'ต่อคดี'),
    rule('quantity', 'drugs', 'ทุกคดียาเสพติด', QUANTITY.drugCaseBase, 'ต่อคดี'),
    rule('quantity', 'royal', 'ภารกิจถวายความปลอดภัย (ถปภ.) ในพื้นที่สถานี', QUANTITY.royalConvoy, 'ต่อครั้ง'),
    rule('quality', 'flagrant', 'อาวุธปืน (เพิ่มจากปริมาณ)', QUALITY.flagrantExtra.gun, 'ต่อคดี'),
    rule('quality', 'award', 'ลำดับ 1', AWARD_POINTS.byRank[0], 'ต่อรางวัล'),
    rule('quality', 'award', 'ลำดับ 2', AWARD_POINTS.byRank[1], 'ต่อรางวัล'),
    rule('quality', 'award', 'ลำดับ 3', AWARD_POINTS.byRank[2], 'ต่อรางวัล'),
    rule('quality', 'award', 'ลำดับ 4 ขึ้นไป', AWARD_POINTS.other, 'ต่อรางวัล'),
];

const safeDivide = (numerator, denominator) => (denominator > 0 ? numerator / denominator : 0);

// Per-station averages of one category map, so a division or the HQ can be set against a single station
export const perStationCategories = (categories, stationCount) => Object.fromEntries(
    CATEGORIES.map(({ id }) => {
        const { quantity, quality, total } = categories[id];
        return [id, {
            quantity: safeDivide(quantity, stationCount),
            quality: safeDivide(quality, stationCount),
            total: safeDivide(total, stationCount),
        }];
    })
);

// The highest category total across the given units, per category id; 0 when there are no units
export const bestByCategory = (categoryMaps) => Object.fromEntries(
    CATEGORIES.map(({ id }) => [id, Math.max(0, ...categoryMaps.map((categories) => categories[id].total))])
);

// Percent of the best unit, rounded to one decimal; 0 when nothing has been scored in that category
export const percentOfBest = (value, best) => (best > 0 ? Math.round((value / best) * 1000) / 10 : 0);

// One row per category. Each series is a percent of its category best, and raw keeps the points for the tooltip
export const radarRows = (series, best) => CATEGORIES.map(({ id, label }) => {
    const row = { id, label, raw: {} };
    for (const { name, categories } of series) {
        const { quantity, quality, total } = categories[id];
        row[name] = percentOfBest(total, best[id] ?? 0);
        row.raw[name] = { quantity, quality, total };
    }
    return row;
});

// Plain-text percents for one series, read out by screen readers
export const radarSummary = (rows, name) => rows.map((row) => `${row.label} ${formatCount(row[name])}%`).join(', ');
