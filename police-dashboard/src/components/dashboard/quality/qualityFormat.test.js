import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatThaiDate, formatPeriodRange, formatDelta, placingOf, barItems, pointsBreakdown, formatCount, formatAverage, scoringRules, perStationCategories, bestByCategory, radarRows, radarSummary, radarTextColor, formatMonthThai, monthOptions, fiscalYearLabel, sourceNotice, awardLabel } from './qualityFormat.js';
import { unitPoints } from '../../../lib/quality/points.js';
import { CATEGORIES, QUANTITY, QUALITY } from '../../../lib/quality/scoringConfig.js';

const pointsOf = (quantityByCategory = {}, qualityByCategory = {}) => {
    const categories = Object.fromEntries(CATEGORIES.map(({ id }) => {
        const quantity = quantityByCategory[id] ?? 0;
        const quality = qualityByCategory[id] ?? 0;
        return [id, { quantity, quality, total: quantity + quality }];
    }));
    const quantity = Object.values(categories).reduce((sum, c) => sum + c.quantity, 0);
    const quality = Object.values(categories).reduce((sum, c) => sum + c.quality, 0);
    return { categories, quantity, quality, total: quantity + quality };
};

// Self-arrest counts of one station-month, every field 0 unless given
const counts = (overrides = {}) => ({ warrant: 0, drugs: 0, immig: 0, theft: 0, gun: 0, other: 0, truck: 0, royal: 0, ...overrides });

test('formatThaiDate writes the day, the Thai month and the Buddhist year', () => {
    assert.equal(formatThaiDate(new Date(2026, 9, 1)), '1 ต.ค. 2569');
    assert.equal(formatThaiDate(new Date(2026, 0, 31)), '31 ม.ค. 2569');
});

test('formatPeriodRange joins the start and end dates with an en dash', () => {
    assert.equal(
        formatPeriodRange({ start: new Date(2026, 0, 1), end: new Date(2026, 8, 30) }),
        '1 ม.ค. 2569 – 30 ก.ย. 2569'
    );
});

test('formatDelta names the whole previous month and signs the change', () => {
    assert.equal(formatDelta(12), '+12 จากเดือนก่อน');
    assert.equal(formatDelta(-3), '-3 จากเดือนก่อน');
    assert.equal(formatDelta(0), '0 จากเดือนก่อน');
    assert.equal(formatDelta(1200), '+1,200 จากเดือนก่อน');
});

test('formatDelta returns null without a previous month to compare with', () => {
    assert.equal(formatDelta(null), null);
    assert.equal(formatDelta(undefined), null);
});

test('placingOf ranks a key by value, highest first, and ties share the better place', () => {
    const rows = [{ key: '1', value: 70 }, { key: '2', value: 80 }, { key: '3', value: 70 }];
    assert.equal(placingOf(rows, '2'), 1);
    assert.equal(placingOf(rows, '1'), 2);
    assert.equal(placingOf(rows, '3'), 2);
});

test('barItems keeps unit order, not score order, and carries the total for the tooltip', () => {
    const units = [
        { kk: '2', name: 'กก.2', points: pointsOf({ warrant: 60 }, { warrant: 20 }) },
        { kk: '1', name: 'กก.1', points: pointsOf({ warrant: 10 }, { warrant: 5 }) },
    ];
    const items = barItems(units, 'total', (unit) => unit.name);
    assert.deepEqual(items.map((item) => item.key), ['1', '2']);
    assert.deepEqual(items.map((item) => item.value), [15, 80]);
    assert.deepEqual(items.map((item) => item.total), [15, 80]);
});

test('barItems orders by the number in the label, so 10 follows 9', () => {
    const units = ['ส.ทล.10', 'ส.ทล.2', 'ส.ทล.1'].map((name) => ({ kk: name, name, points: pointsOf() }));
    const items = barItems(units, 'total', (unit) => unit.name);
    assert.deepEqual(items.map((item) => item.label), ['ส.ทล.1', 'ส.ทล.2', 'ส.ทล.10']);
});

test('barItems reads quality when the metric is quality', () => {
    const units = [
        { kk: '1', name: 'กก.1', points: pointsOf({ warrant: 100 }, { warrant: 1 }) },
        { kk: '2', name: 'กก.2', points: pointsOf({ warrant: 1 }, { warrant: 9 }) },
    ];
    const items = barItems(units, 'quality', (unit) => unit.name);
    assert.deepEqual(items.map((item) => item.key), ['1', '2']);
    assert.deepEqual(items.map((item) => item.value), [1, 9]);
});

test('barItems reads quantity when the metric is quantity', () => {
    const units = [
        { kk: '1', name: 'กก.1', points: pointsOf({ warrant: 100 }, { warrant: 1 }) },
        { kk: '2', name: 'กก.2', points: pointsOf({ warrant: 1 }, { warrant: 9 }) },
    ];
    const items = barItems(units, 'quantity', (unit) => unit.name);
    assert.deepEqual(items.map((item) => item.value), [100, 1]);
});

test('barItems reads one category total when the metric is a category id', () => {
    const units = [
        { kk: '1', name: 'กก.1', points: pointsOf({ truck: 5 }, { truck: 5 }) },
        { kk: '2', name: 'กก.2', points: pointsOf({ truck: 20 }, { truck: 1 }) },
    ];
    const items = barItems(units, 'truck', (unit) => unit.name);
    assert.deepEqual(items.map((item) => item.key), ['1', '2']);
    assert.deepEqual(items.map((item) => item.value), [10, 21]);
});

test('barItems reads the per-station average when the metric is average', () => {
    const units = [
        { kk: '1', name: 'กก.1', average: 12.5, points: pointsOf({ warrant: 500 }) },
        { kk: '2', name: 'กก.2', average: 30.2, points: pointsOf({ warrant: 10 }) },
    ];
    const items = barItems(units, 'average', (unit) => unit.name);
    assert.deepEqual(items.map((item) => item.key), ['1', '2']);
    assert.deepEqual(items.map((item) => item.value), [12.5, 30.2]);
});

test('barItems returns zero values without NaN when every unit scores zero', () => {
    const units = [
        { kk: '1', name: 'กก.1', average: 0, points: pointsOf() },
        { kk: '2', name: 'กก.2', average: 0, points: pointsOf() },
    ];
    const items = barItems(units, 'quality', (unit) => unit.name);
    assert.deepEqual(items.map((item) => item.value), [0, 0]);
    assert.ok(items.every((item) => Number.isFinite(item.value)));
});

test('barItems prefers an explicit key over kk', () => {
    const units = [
        { key: 'b', kk: '9', name: 'ข', points: pointsOf({ warrant: 70 }) },
        { key: 'a', kk: '9', name: 'ก', points: pointsOf({ warrant: 70 }) },
    ];
    const items = barItems(units, 'total', (unit) => unit.name);
    assert.deepEqual(items.map((item) => item.key), ['a', 'b']);
});

test('pointsBreakdown lists the seven self-arrest rows and the royal-convoy row, zeros included', () => {
    const rows = pointsBreakdown(counts());

    assert.deepEqual(rows.map((row) => row.label), ['หมายจับ', 'คนเข้าเมือง', 'ลักทรัพย์', 'อาวุธปืน', 'ยาเสพติด', 'คดีอาญาอื่น ๆ', 'รถหนัก', 'ถวายความปลอดภัย (ถปภ.)']);
    assert.ok(rows.every((row) => row.count === 0 && row.total === 0));
});

test('pointsBreakdown gives each self-arrest row its count, quantity, quality and total', () => {
    const rows = pointsBreakdown(counts({ warrant: 3, drugs: 2, immig: 1, theft: 2, gun: 1, other: 4, truck: 1, royal: 2 }), [
        { month: '2026-09', rank: 1, points: 10, shared: 1, honourable: false },
        { month: '2026-04', rank: 2, points: 8, shared: 1, honourable: false, title: 'จับเมาแล้วขับสูงสุด เทศกาลสงกรานต์ 2569' },
    ]);

    assert.deepEqual(rows, [
        { category: 'warrant', label: 'หมายจับ', count: 3, quantity: 6, quality: 0, total: 6 },
        { category: 'flagrant', label: 'คนเข้าเมือง', count: 1, quantity: 1, quality: 0, total: 1 },
        { category: 'flagrant', label: 'ลักทรัพย์', count: 2, quantity: 2, quality: 0, total: 2 },
        { category: 'flagrant', label: 'อาวุธปืน', count: 1, quantity: 1, quality: 4, total: 5 },
        { category: 'flagrant', label: 'ยาเสพติด', count: 2, quantity: 2, quality: 0, total: 2 },
        { category: 'flagrant', label: 'คดีอาญาอื่น ๆ', count: 4, quantity: 4, quality: 0, total: 4 },
        { category: 'truck', label: 'รถหนัก', count: 1, quantity: 1, quality: 0, total: 1 },
        { category: 'royal', label: 'ถวายความปลอดภัย (ถปภ.)', count: 2, quantity: 4, quality: 0, total: 4 },
        { category: 'award', label: 'ผลงานดีเด่น ก.ย. 2569 ลำดับ 1', count: 1, quantity: 0, quality: 10, total: 10 },
        { category: 'award', label: 'จับเมาแล้วขับสูงสุด เทศกาลสงกรานต์ 2569 เม.ย. 2569 ลำดับ 2', count: 1, quantity: 0, quality: 8, total: 8 },
    ]);
});

test('pointsBreakdown reconciles with unitPoints and the award points, category by category', () => {
    const raw = counts({ warrant: 3, drugs: 2, immig: 1, theft: 2, gun: 1, other: 4, truck: 1, royal: 3 });
    const awards = [{ month: '2026-09', rank: 4, points: 5, shared: 1, honourable: true }];
    const expected = unitPoints(raw);
    const rows = pointsBreakdown(raw, awards);
    for (const { id } of CATEGORIES.filter((category) => category.id !== 'award')) {
        const inCategory = rows.filter((row) => row.category === id);
        assert.equal(inCategory.reduce((total, row) => total + row.quantity, 0), expected.categories[id].quantity, `${id} quantity`);
        assert.equal(inCategory.reduce((total, row) => total + row.quality, 0), expected.categories[id].quality, `${id} quality`);
    }
    assert.equal(rows.reduce((total, row) => total + row.total, 0), expected.total + 5);
});

test('formatCount groups thousands and keeps a fraction to one decimal', () => {
    assert.equal(formatCount(12345), '12,345');
    assert.equal(formatCount(0), '0');
    assert.equal(formatCount(12.25), '12.3');
});

test('formatAverage always shows one decimal with thousands separators', () => {
    assert.equal(formatAverage(2.26), '2.3');
    assert.equal(formatAverage(0), '0.0');
    assert.equal(formatAverage(1234.5), '1,234.5');
});

test('scoringRules lists the warrant, flagrant, drug and gun rules with the configured points', () => {
    const rules = scoringRules();
    const find = (kind, category, text) => rules.find((rule) => rule.kind === kind && rule.category === category && rule.text.includes(text));
    assert.equal(find('quantity', 'warrant', 'หมายจับ').points, QUANTITY.warrant);
    assert.equal(find('quantity', 'flagrant', 'ซึ่งหน้า').points, QUANTITY.flagrant);
    assert.equal(find('quantity', 'truck', 'รถหนัก').points, QUANTITY.truck);
    assert.equal(find('quality', 'flagrant', 'อาวุธปืน').points, QUALITY.flagrantExtra.gun);
    assert.equal(find('quantity', 'royal', 'ถปภ.').points, QUANTITY.royalConvoy);
    assert.ok(rules.every((rule) => ['warrant', 'flagrant', 'truck', 'royal', 'award'].includes(rule.category)), 'only known categories');
    assert.ok(rules.every((rule) => ['quantity', 'quality'].includes(rule.kind) && rule.points > 0 && rule.text.length > 0));
});

test('scoringRules has no document-forgery or drug-tier rule, since the workbooks have neither', () => {
    const texts = scoringRules().map((rule) => rule.text).join(' ');
    assert.ok(!texts.includes('เอกสาร'));
    assert.ok(!texts.includes('ขั้น'));
    // The workbooks count cases, not persons, so no rule is priced per person
    assert.ok(scoringRules().every((rule) => !rule.unit.includes('คน') && !rule.text.includes('นับต่อคน')), 'counts are cases, not persons');
});

test('scoringRules lists the award ranks as quality rows: 10, 8, 6, then 5', () => {
    const awardRules = scoringRules().filter((rule) => rule.category === 'award');

    assert.deepEqual(awardRules.map((rule) => [rule.kind, rule.points]), [['quality', 10], ['quality', 8], ['quality', 6], ['quality', 5]]);
});

test('perStationCategories divides each category by the station count and gives zeros with no stations', () => {
    const categories = pointsOf({ warrant: 60 }, { warrant: 15 }).categories;
    const averaged = perStationCategories(categories, 5);
    assert.deepEqual(averaged.warrant, { quantity: 12, quality: 3, total: 15 });
    assert.deepEqual(averaged.flagrant, { quantity: 0, quality: 0, total: 0 });
    const none = perStationCategories(categories, 0);
    assert.ok(CATEGORIES.every(({ id }) => none[id].total === 0));
});

test('bestByCategory takes the highest category total across the given units', () => {
    const best = bestByCategory([
        pointsOf({ warrant: 30 }).categories,
        pointsOf({ warrant: 20, truck: 50 }).categories,
    ]);
    assert.equal(best.warrant, 30);
    assert.equal(best.truck, 50);
    assert.equal(best.flagrant, 0);
});

test('bestByCategory returns zero for every category when there are no units', () => {
    const best = bestByCategory([]);
    assert.deepEqual(best, Object.fromEntries(CATEGORIES.map(({ id }) => [id, 0])));
});

test('radarRows plots each category as a percent of its best, rounded to one decimal', () => {
    const best = bestByCategory([pointsOf({ warrant: 45 }).categories]);
    const rows = radarRows([{ name: 'บก.ทล.', categories: pointsOf({ warrant: 20 }, { warrant: 10 }).categories }], best);
    assert.equal(rows.length, CATEGORIES.length);
    const warrant = rows.find((row) => row.id === 'warrant');
    assert.equal(warrant.label, 'หมายจับ');
    assert.equal(warrant['บก.ทล.'], 66.7);
    assert.deepEqual(warrant.raw['บก.ทล.'], { quantity: 20, quality: 10, total: 30 });
});

test('radarRows gives 0 for a category whose best is 0, never NaN', () => {
    const rows = radarRows(
        [{ name: 'กก.1', categories: pointsOf({ warrant: 5 }).categories }],
        bestByCategory([pointsOf().categories])
    );
    assert.ok(rows.every((row) => row['กก.1'] === 0));
    assert.ok(rows.every((row) => Number.isFinite(row['กก.1'])));
});

test('radarRows puts the main and compare series side by side on the same best', () => {
    const best = bestByCategory([pointsOf({ truck: 40 }).categories]);
    const rows = radarRows([
        { name: 'กก.1', categories: pointsOf({ truck: 10 }).categories },
        { name: 'เฉลี่ย บก.ทล.', categories: pointsOf({ truck: 25 }).categories },
    ], best);
    const truck = rows.find((row) => row.id === 'truck');
    assert.equal(truck['กก.1'], 25);
    assert.equal(truck['เฉลี่ย บก.ทล.'], 62.5);
});

test('radarSummary lists each category percent for one series', () => {
    const rows = [
        { id: 'warrant', label: 'หมายจับ', 'บก.ทล.': 100, raw: {} },
        { id: 'flagrant', label: 'ซึ่งหน้า', 'บก.ทล.': 45.5, raw: {} },
    ];
    assert.equal(radarSummary(rows, 'บก.ทล.'), 'หมายจับ 100%, ซึ่งหน้า 45.5%');
});

test('radar rows have five axes: the criminal-case categories, royal convoys and awards', () => {
    const categories = pointsOf().categories;
    const rows = radarRows([{ name: 'กก.1', categories }], bestByCategory([categories]));
    assert.deepEqual(rows.map((row) => row.label), ['หมายจับ', 'ซึ่งหน้า', 'รถหนัก', 'ถวายความปลอดภัย', 'ผลงานดีเด่น']);
});

test('awardLabel gives the Thai month and rank, with the share and honourable mention when they apply', () => {
    assert.equal(awardLabel({ month: '2026-09', rank: 1, points: 10, shared: 1, honourable: false }), 'ก.ย. 2569 ลำดับ 1');
    assert.equal(awardLabel({ month: '2026-08', rank: 3, points: 3, shared: 2, honourable: false }), 'ส.ค. 2569 ลำดับ 3 (แบ่ง 2 หน่วย)');
    assert.equal(awardLabel({ month: '2026-09', rank: 4, points: 5, shared: 1, honourable: true }), 'ก.ย. 2569 ลำดับ 4 · ชมเชย');
});

test('radarTextColor keeps the stroke colour on dark and darkens amber and cyan text for light', () => {
    assert.equal(radarTextColor('#f59e0b', true), '#f59e0b');
    assert.equal(radarTextColor('#f59e0b', false), '#b45309');
    assert.equal(radarTextColor('#06b6d4', true), '#06b6d4');
    assert.equal(radarTextColor('#06b6d4', false), '#0e7490');
});

test('formatMonthThai writes the short Thai month and the Buddhist year', () => {
    assert.equal(formatMonthThai('2026-08'), 'ส.ค. 2569');
    assert.equal(formatMonthThai('2025-11'), 'พ.ย. 2568');
});

test('monthOptions lists the workbook months from October 2025, newest first', () => {
    const options = monthOptions();

    assert.equal(options.length, 12);
    assert.deepEqual(options[0], { value: '2026-09', label: 'ก.ย. 2569' });
    assert.deepEqual(options[options.length - 1], { value: '2025-10', label: 'ต.ค. 2568' });
});

test('fiscalYearLabel names the fiscal year that starts in October, by its Buddhist year', () => {
    assert.equal(fiscalYearLabel('2026-09'), 'ปีงบ 2569');
    assert.equal(fiscalYearLabel('2025-10'), 'ปีงบ 2569');
    assert.equal(fiscalYearLabel('2026-10'), 'ปีงบ 2570');
});

test('sourceNotice names the newest workbook month and the award rule', () => {
    assert.equal(
        sourceNotice('2026-09'),
        'คะแนนคิดจากสถิติคดีอาญาจับเองของงานแผน (รายกลุ่มข้อหา) ข้อมูลถึง ก.ย. 2569 รวมภารกิจถวายความปลอดภัย (ถปภ.) และคะแนนรางวัลด้านปราบปราม (ประจำเดือนและครั้งคราว)'
    );
});
