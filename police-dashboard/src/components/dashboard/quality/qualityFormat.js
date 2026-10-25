import { CATEGORIES, POINTS, QUANTITY, QUALITY, SUPPRESSION_OFFENSES, ROAD_OFFENSES } from '../../../lib/quality/scoringConfig.js';

const MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export const formatThaiDate = (date) => `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear() + 543}`;

export const formatPeriodRange = ({ start, end }) => `${formatThaiDate(start)} – ${formatThaiDate(end)}`;

const formatNumber = (value, options) => Number(value).toLocaleString('th-TH', options);

// Points and counts: thousands separators, a fraction only when one exists
export const formatCount = (value) => formatNumber(value, { maximumFractionDigits: 1 });

// Per-station averages always show one decimal
export const formatAverage = (value) => formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const formatDelta = (delta) => {
    if (delta === null || delta === undefined) return null;
    const sign = delta > 0 ? '+' : '';
    return `${sign}${formatCount(delta)} จากช่วงเดียวกันเดือนก่อน`;
};

// Rows are { key, value }; a tie shares the better place
export const placingOf = (rows, key) => {
    const chosen = rows.find((row) => row.key === key);
    return 1 + rows.filter((row) => row.value > chosen.value).length;
};

export const toPercent = (ratio) => Math.round(ratio * 100);

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

const OFFENSE_NAMES = {
    drugs: 'ยาเสพติด', gun: 'อาวุธปืน', immig: 'คนเข้าเมือง', customs: 'ศุลกากร', disease: 'โรคติดต่อ', transport: 'ขนส่ง',
    doc: 'เอกสารปลอม', property: 'ทรัพย์', sex: 'เพศ', life: 'ชีวิตและร่างกาย', com: 'คอมพิวเตอร์', other: 'อื่นๆ',
    weight: 'จับรถบรรทุกเกินพิกัด', drunk: 'จับเมาแล้วขับ',
};
const FLAGRANT_OFFENSES = [...SUPPRESSION_OFFENSES.filter((offense) => offense !== 'drugs'), ...ROAD_OFFENSES];
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((category) => [category.id, category.label]));

const item = (category, label, count, quantity, quality) => ({
    category,
    label,
    count,
    quantity,
    quality,
    total: quantity + quality,
});

// One row per non-zero item, using the same rules as points.js unitPoints
// Immigration counts are a head count, so the label says each person is one point
const flagrantLabel = (offense) => (offense === 'immig'
    ? `ซึ่งหน้า ${OFFENSE_NAMES.immig} (นับตามจำนวนคน)`
    : `ซึ่งหน้า ${OFFENSE_NAMES[offense]}`);

export const pointsBreakdown = (raw) => {
    const { flagrant } = raw;
    const rows = [
        item('warrant', 'หมายจับ', raw.warrants, raw.warrants * QUANTITY.warrant, 0),
        ...FLAGRANT_OFFENSES.map((offense) => item(
            'flagrant',
            flagrantLabel(offense),
            flagrant[offense],
            flagrant[offense] * QUANTITY.flagrant,
            flagrant[offense] * (QUALITY.flagrantExtra[offense] ?? 0)
        )),
        item('drugs', 'คดียาเสพติด', flagrant.drugs, raw.drugCaseBase, raw.drugCaseExtra),
    ];
    return rows.filter((row) => row.count > 0);
};

const rule = (kind, category, text, points, unit) => ({
    kind,
    category,
    categoryLabel: CATEGORY_LABEL[category],
    text,
    points,
    unit,
});

// Every quantity and quality rule, read from the config so the copy never drifts from the points
export const scoringRules = () => [
    rule('quantity', 'warrant', 'ทุกหมายจับ (ทั่วไป Bodyworn และ Big Data)', QUANTITY.warrant, 'ต่อหมาย'),
    rule('quantity', 'flagrant', 'ทุกการจับกุมซึ่งหน้า (ไม่รวมยาเสพติด)', QUANTITY.flagrant, 'ต่อคดี (คนเข้าเมืองนับต่อคน)'),
    rule('quantity', 'drugs', 'คดียาเสพติดที่มีของกลาง ฐาน', QUANTITY.drugCaseBase, 'ต่อคดี'),
    rule('quantity', 'drugs', 'คดียาเสพติดที่ไม่มีของกลาง', POINTS.drug.noEvidence, 'ต่อคดี'),
    rule('quality', 'flagrant', 'อาวุธปืน', QUALITY.flagrantExtra.gun, 'ต่อคดี'),
    rule('quality', 'flagrant', 'เอกสารปลอม', QUALITY.flagrantExtra.doc, 'ต่อคดี'),
    rule('quality', 'drugs', 'ส่วนเพิ่มตามขั้นของกลาง ขั้น 2', POINTS.drug.tierPoints[1] - QUANTITY.drugCaseBase, 'ต่อคดี'),
    rule('quality', 'drugs', 'ส่วนเพิ่มตามขั้นของกลาง ขั้น 3', POINTS.drug.tierPoints[2] - QUANTITY.drugCaseBase, 'ต่อคดี'),
    rule('quality', 'drugs', 'เคตามีน/โคเคน (ยาเสพติดอื่น) ส่วนเพิ่ม', POINTS.drug.otherDrug - QUANTITY.drugCaseBase, 'ต่อคดี'),
];

// Tier thresholds from POINTS.drug: a tier applies only above the threshold below it, so the upper bound of tier 2 is inclusive
export const drugTierNote = () => {
    const tiers = (name, unit, [first, second]) => `${name} ขั้น 1 ไม่เกิน ${formatCount(first)} ${unit}, ขั้น 2 ไม่เกิน ${formatCount(second)} ${unit}, ขั้น 3 เกิน ${formatCount(second)} ${unit}`;
    return `ขั้นของกลางต่อคดี: ${tiers('ยาบ้า', 'เม็ด', POINTS.drug.yaba)} · ${tiers('ไอซ์', 'กรัม', POINTS.drug.ice)}`;
};

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
