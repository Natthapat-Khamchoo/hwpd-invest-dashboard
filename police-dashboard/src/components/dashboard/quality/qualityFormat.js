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

const metricValue = (unit, metric) => {
    if (metric === 'average') return unit.average;
    if (metric === 'total') return unit.points.total;
    if (metric === 'quantity') return unit.points.quantity;
    if (metric === 'quality') return unit.points.quality;
    return unit.points.categories[metric].total;
};

// Units become bar items for metric 'total' | 'quantity' | 'quality' | a category id | 'average'.
// Highest first, ties by label. `total` rides along for the tooltip.
export const barItems = (units, metric, labelOf) => units
    .map((unit) => ({
        key: unit.key ?? unit.kk,
        label: labelOf(unit),
        value: metricValue(unit, metric),
        total: unit.points.total,
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

const OFFENSE_NAMES = {
    drugs: 'ยาเสพติด', gun: 'อาวุธปืน', immig: 'คนเข้าเมือง', customs: 'ศุลกากร', disease: 'โรคติดต่อ', transport: 'ขนส่ง',
    doc: 'เอกสารปลอม', property: 'ทรัพย์', sex: 'เพศ', life: 'ชีวิตและร่างกาย', com: 'คอมพิวเตอร์', other: 'อื่นๆ',
    weight: 'จับรถบรรทุกเกินพิกัด', drunk: 'จับเมาแล้วขับ',
};
const TICKET_NAMES = { transport: 'ใบสั่ง พ.ร.บ.ขนส่ง', vehicle: 'ใบสั่ง พ.ร.บ.รถยนต์', traffic: 'ใบสั่ง จราจร' };
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
export const pointsBreakdown = (raw) => {
    const { flagrant, drugSeized, seized, tickets } = raw;
    const rows = [
        item('warrant', 'หมายจับ', raw.warrants, raw.warrants * QUANTITY.warrant, raw.bigDataWarrants * QUALITY.bigDataWarrant),
        ...FLAGRANT_OFFENSES.map((offense) => item(
            'flagrant',
            `ซึ่งหน้า ${OFFENSE_NAMES[offense]}`,
            flagrant[offense],
            flagrant[offense] * QUANTITY.flagrant,
            flagrant[offense] * (QUALITY.flagrantExtra[offense] ?? 0)
        )),
        item('drugs', 'คดียาเสพติด', flagrant.drugs, raw.drugCaseBase, raw.drugCaseExtra),
        item('drugs', 'ยาบ้า (เม็ด)', drugSeized.yaba, 0, Math.floor(drugSeized.yaba / QUALITY.drugPer.yaba)),
        item('drugs', 'ไอซ์ (กรัม)', drugSeized.ice, 0, Math.floor(drugSeized.ice / QUALITY.drugPer.ice)),
        item('drugs', 'ยาเสพติดอื่น (หน่วย)', drugSeized.other, 0, Math.floor(drugSeized.other / QUALITY.drugPer.other)),
        item('tickets', TICKET_NAMES.transport, tickets.transport, tickets.transport * QUANTITY.ticket, 0),
        item('tickets', TICKET_NAMES.vehicle, tickets.vehicle, tickets.vehicle * QUANTITY.ticket, 0),
        item('tickets', TICKET_NAMES.traffic, tickets.traffic, tickets.traffic * QUANTITY.ticket, 0),
        item('service', 'นำขบวน', raw.convoy, raw.convoy * QUANTITY.convoy, 0),
        item('service', 'ช่วยเหลือประชาชนและอุบัติเหตุ', raw.serviceHelp, raw.serviceHelp * QUANTITY.help, 0),
        item('service', 'อำนวยความสะดวกจราจร', raw.serviceTraffic, raw.serviceTraffic * QUANTITY.trafficService, 0),
        item('service', 'จิตอาสา', raw.volunteer, raw.volunteer * QUANTITY.volunteer, 0),
        item('seized', 'ของกลาง อาวุธปืน', seized.gun, 0, seized.gun * QUALITY.seizedEach.gun),
        item('seized', 'ของกลาง กระสุน', seized.bullets, 0, Math.floor(seized.bullets / QUALITY.seizedPer.bullets)),
        item('seized', 'ของกลาง วัตถุระเบิด', seized.explosive, 0, seized.explosive * QUALITY.seizedEach.explosive),
        item('seized', 'ของกลาง รถยนต์', seized.car, 0, seized.car * QUALITY.seizedEach.car),
        item('seized', 'ของกลาง จักรยานยนต์', seized.motorcycle, 0, seized.motorcycle * QUALITY.seizedEach.motorcycle),
        item('seized', 'ของกลาง เงินสด (บาท)', seized.cash, 0, Math.floor(seized.cash / QUALITY.seizedPer.cash)),
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
    rule('quantity', 'warrant', 'ทุกหมายจับ', QUANTITY.warrant, 'ต่อหมาย'),
    rule('quantity', 'flagrant', 'ทุกการจับกุมซึ่งหน้า (ไม่รวมยาเสพติด)', QUANTITY.flagrant, 'ต่อคดี'),
    rule('quantity', 'drugs', 'คดียาเสพติดที่มีของกลาง ฐาน', QUANTITY.drugCaseBase, 'ต่อคดี'),
    rule('quantity', 'drugs', 'คดียาเสพติดที่ไม่มีของกลาง', POINTS.drug.noEvidence, 'ต่อคดี'),
    rule('quantity', 'tickets', 'ใบสั่งทุกใบ (ขนส่ง รถยนต์ จราจร)', QUANTITY.ticket, 'ต่อใบ'),
    rule('quantity', 'service', 'นำขบวน', QUANTITY.convoy, 'ต่อครั้ง'),
    rule('quantity', 'service', 'ช่วยเหลือประชาชนและอุบัติเหตุ', QUANTITY.help, 'ต่อครั้ง'),
    rule('quantity', 'service', 'อำนวยความสะดวกจราจร', QUANTITY.trafficService, 'ต่อครั้ง'),
    rule('quantity', 'service', 'จิตอาสา', QUANTITY.volunteer, 'ต่อครั้ง'),
    rule('quality', 'warrant', 'หมายจับ Big Data', QUALITY.bigDataWarrant, 'ต่อหมาย'),
    rule('quality', 'flagrant', 'อาวุธปืน', QUALITY.flagrantExtra.gun, 'ต่อคดี'),
    rule('quality', 'flagrant', 'เอกสารปลอม', QUALITY.flagrantExtra.doc, 'ต่อคดี'),
    rule('quality', 'drugs', 'ส่วนเพิ่มตามขั้นของกลาง ขั้น 2', POINTS.drug.tierPoints[1] - QUANTITY.drugCaseBase, 'ต่อคดี'),
    rule('quality', 'drugs', 'ส่วนเพิ่มตามขั้นของกลาง ขั้น 3', POINTS.drug.tierPoints[2] - QUANTITY.drugCaseBase, 'ต่อคดี'),
    rule('quality', 'drugs', 'เคตามีน/โคเคน (ยาเสพติดอื่น) ส่วนเพิ่ม', POINTS.drug.otherDrug - QUANTITY.drugCaseBase, 'ต่อคดี'),
    rule('quality', 'drugs', 'ยาบ้า', 1, `ต่อ ${formatCount(QUALITY.drugPer.yaba)} เม็ด`),
    rule('quality', 'drugs', 'ไอซ์', 1, `ต่อ ${formatCount(QUALITY.drugPer.ice)} กรัม`),
    rule('quality', 'drugs', 'ยาเสพติดอื่น', 1, `ต่อ ${formatCount(QUALITY.drugPer.other)} หน่วย`),
    rule('quality', 'seized', 'อาวุธปืน', QUALITY.seizedEach.gun, 'ต่อกระบอก'),
    rule('quality', 'seized', 'วัตถุระเบิด', QUALITY.seizedEach.explosive, 'ต่อรายการ'),
    rule('quality', 'seized', 'รถยนต์', QUALITY.seizedEach.car, 'ต่อคัน'),
    rule('quality', 'seized', 'จักรยานยนต์', QUALITY.seizedEach.motorcycle, 'ต่อคัน'),
    rule('quality', 'seized', 'กระสุน', 1, `ต่อ ${formatCount(QUALITY.seizedPer.bullets)} นัด`),
    rule('quality', 'seized', 'เงินสด', 1, `ต่อ ${formatCount(QUALITY.seizedPer.cash)} บาท`),
];

// Tier thresholds from POINTS.drug: a tier applies only above the threshold below it, so the upper bound of tier 2 is inclusive
export const drugTierNote = () => {
    const tiers = (name, unit, [first, second]) => `${name} ขั้น 1 ไม่เกิน ${formatCount(first)} ${unit}, ขั้น 2 ไม่เกิน ${formatCount(second)} ${unit}, ขั้น 3 เกิน ${formatCount(second)} ${unit}`;
    return `ขั้นของกลางต่อคดี: ${tiers('ยาบ้า', 'เม็ด', POINTS.drug.yaba)} · ${tiers('ไอซ์', 'กรัม', POINTS.drug.ice)}`;
};
