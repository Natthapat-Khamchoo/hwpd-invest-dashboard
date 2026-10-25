import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatThaiDate, formatPeriodRange, formatDelta, placingOf, toPercent, barItems, pointsBreakdown, formatCount, formatAverage, scoringRules, drugTierNote, perStationCategories, bestByCategory, radarRows, radarSummary, radarTextColor } from './qualityFormat.js';
import { emptyStationRaw, aggregateStationRaw } from '../../../lib/quality/stationRaw.js';
import { unitPoints } from '../../../lib/quality/points.js';
import { rawData } from '../../../lib/quality/testFixture.js';
import { CATEGORIES, POINTS, QUANTITY, QUALITY } from '../../../lib/quality/scoringConfig.js';

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

test('formatThaiDate writes the day, the Thai month and the Buddhist year', () => {
    assert.equal(formatThaiDate(new Date(2026, 9, 1)), '1 ต.ค. 2569');
    assert.equal(formatThaiDate(new Date(2026, 0, 31)), '31 ม.ค. 2569');
});

test('formatPeriodRange joins the start and end dates with an en dash', () => {
    assert.equal(
        formatPeriodRange({ start: new Date(2026, 9, 1), end: new Date(2026, 9, 24) }),
        '1 ต.ค. 2569 – 24 ต.ค. 2569'
    );
});

test('formatDelta signs the change against the same days of the previous month, or returns null without one', () => {
    assert.equal(formatDelta(12), '+12 จากช่วงเดียวกันเดือนก่อน');
    assert.equal(formatDelta(-3), '-3 จากช่วงเดียวกันเดือนก่อน');
    assert.equal(formatDelta(0), '0 จากช่วงเดียวกันเดือนก่อน');
    assert.equal(formatDelta(1200), '+1,200 จากช่วงเดียวกันเดือนก่อน');
    assert.equal(formatDelta(null), null);
});

test('placingOf ranks a key by value, highest first, and ties share the better place', () => {
    const rows = [{ key: '1', value: 70 }, { key: '2', value: 80 }, { key: '3', value: 70 }];
    assert.equal(placingOf(rows, '2'), 1);
    assert.equal(placingOf(rows, '1'), 2);
    assert.equal(placingOf(rows, '3'), 2);
});

test('toPercent rounds a 0-1 ratio to a whole percent', () => {
    assert.equal(toPercent(0.456), 46);
    assert.equal(toPercent(1), 100);
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
        { kk: '1', name: 'กก.1', points: pointsOf({ drugs: 5 }, { drugs: 5 }) },
        { kk: '2', name: 'กก.2', points: pointsOf({ drugs: 20 }, { drugs: 1 }) },
    ];
    const items = barItems(units, 'drugs', (unit) => unit.name);
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

test('pointsBreakdown on the fixture station reconciles to 7 quantity, 8 quality and 15 total', () => {
    const raw = aggregateStationRaw(rawData, new Date(2026, 9, 1), new Date(2026, 9, 24))['1-1'];
    const rows = pointsBreakdown(raw);
    const sum = (key) => rows.reduce((total, row) => total + row[key], 0);
    assert.equal(sum('quantity'), 7);
    assert.equal(sum('quality'), 8);
    assert.equal(sum('total'), 15);
    assert.ok(rows.every((row) => row.quantity + row.quality === row.total));
});

test('pointsBreakdown rows add up to unitPoints for every category', () => {
    const raw = aggregateStationRaw(rawData, new Date(2026, 9, 1), new Date(2026, 9, 24))['1-1'];
    const expected = unitPoints(raw);
    const rows = pointsBreakdown(raw);
    for (const { id } of CATEGORIES) {
        const inCategory = rows.filter((row) => row.category === id);
        const quantity = inCategory.reduce((total, row) => total + row.quantity, 0);
        const quality = inCategory.reduce((total, row) => total + row.quality, 0);
        assert.equal(quantity, expected.categories[id].quantity, `${id} quantity`);
        assert.equal(quality, expected.categories[id].quality, `${id} quality`);
    }
});

test('pointsBreakdown lists each non-zero item with its count, quantity, quality and total', () => {
    const raw = {
        ...emptyStationRaw(),
        warrants: 2,
        flagrant: { ...emptyStationRaw().flagrant, gun: 1, weight: 1 },
    };
    assert.deepEqual(pointsBreakdown(raw), [
        { category: 'warrant', label: 'หมายจับ', count: 2, quantity: 4, quality: 0, total: 4 },
        { category: 'flagrant', label: 'ซึ่งหน้า อาวุธปืน', count: 1, quantity: 1, quality: 4, total: 5 },
        { category: 'flagrant', label: 'ซึ่งหน้า จับรถบรรทุกเกินพิกัด', count: 1, quantity: 1, quality: 0, total: 1 },
    ]);
});

test('pointsBreakdown marks immigration arrests as counted per person', () => {
    const raw = { ...emptyStationRaw(), flagrant: { ...emptyStationRaw().flagrant, immig: 3 } };
    assert.deepEqual(pointsBreakdown(raw), [
        { category: 'flagrant', label: 'ซึ่งหน้า คนเข้าเมือง (นับตามจำนวนคน)', count: 3, quantity: 3, quality: 0, total: 3 },
    ]);
});

test('pointsBreakdown shows drug cases with the base as quantity and the extra tier as quality', () => {
    const raw = {
        ...emptyStationRaw(),
        flagrant: { ...emptyStationRaw().flagrant, drugs: 2 },
        drugCaseBase: 2,
        drugCaseExtra: 13,
    };
    assert.deepEqual(pointsBreakdown(raw), [
        { category: 'drugs', label: 'คดียาเสพติด', count: 2, quantity: 2, quality: 13, total: 15 },
    ]);
});

test('pointsBreakdown returns no rows for an empty station', () => {
    assert.deepEqual(pointsBreakdown(emptyStationRaw()), []);
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

test('scoringRules lists every quantity and quality rule with the configured points', () => {
    const rules = scoringRules();
    const find = (kind, category, text) => rules.find((rule) => rule.kind === kind && rule.category === category && rule.text.includes(text));
    assert.equal(find('quantity', 'warrant', 'หมายจับ').points, QUANTITY.warrant);
    assert.equal(find('quantity', 'drugs', 'ฐาน').points, QUANTITY.drugCaseBase);
    assert.equal(find('quality', 'flagrant', 'อาวุธปืน').points, QUALITY.flagrantExtra.gun);
    assert.equal(find('quality', 'flagrant', 'เอกสารปลอม').points, QUALITY.flagrantExtra.doc);
    assert.ok(rules.every((rule) => ['warrant', 'flagrant', 'drugs'].includes(rule.category)), 'only criminal-case categories');
    assert.ok(rules.every((rule) => ['quantity', 'quality'].includes(rule.kind) && rule.points > 0 && rule.text.length > 0));
});

test('scoringRules states the no-evidence drug case at 1 quantity and the other-drug case as 4 extra quality', () => {
    const rules = scoringRules();
    const noEvidence = rules.find((rule) => rule.kind === 'quantity' && rule.category === 'drugs' && rule.text.includes('ไม่มีของกลาง'));
    assert.ok(noEvidence, 'no-evidence rule exists');
    assert.equal(noEvidence.points, 1);
    const otherDrug = rules.find((rule) => rule.kind === 'quality' && rule.category === 'drugs' && rule.text.includes('เคตามีน'));
    assert.ok(otherDrug, 'other-drug rule exists');
    assert.equal(otherDrug.points, 4);
});

test('drugTierNote spells out the yaba and ice tier thresholds from the config', () => {
    assert.equal(
        drugTierNote(),
        'ขั้นของกลางต่อคดี: ยาบ้า ขั้น 1 ไม่เกิน 20 เม็ด, ขั้น 2 ไม่เกิน 100 เม็ด, ขั้น 3 เกิน 100 เม็ด · ไอซ์ ขั้น 1 ไม่เกิน 5 กรัม, ขั้น 2 ไม่เกิน 50 กรัม, ขั้น 3 เกิน 50 กรัม'
    );
});

test('pointsBreakdown rows reconcile with unitPoints when every StationRaw field is non-zero', () => {
    const base = emptyStationRaw();
    const raw = {
        ...base,
        warrants: 4,
        flagrant: Object.fromEntries(Object.keys(base.flagrant).map((key, index) => [key, index + 1])),
        drugCaseBase: 15,
        drugCaseExtra: 7,
    };
    const expected = unitPoints(raw);
    const rows = pointsBreakdown(raw);
    // Every non-drug flagrant offense (weight and drunk included) must have its own row
    assert.equal(rows.filter((row) => row.category === 'flagrant').length, Object.keys(base.flagrant).length - 1);
    for (const { id } of CATEGORIES) {
        assert.ok(expected.categories[id].total > 0, `${id} is covered by the fixture`);
        const inCategory = rows.filter((row) => row.category === id);
        const quantity = inCategory.reduce((total, row) => total + row.quantity, 0);
        const quality = inCategory.reduce((total, row) => total + row.quality, 0);
        assert.equal(quantity, expected.categories[id].quantity, `${id} quantity`);
        assert.equal(quality, expected.categories[id].quality, `${id} quality`);
    }
    assert.equal(rows.reduce((total, row) => total + row.total, 0), expected.total);
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
        pointsOf({ warrant: 20, drugs: 50 }).categories,
    ]);
    assert.equal(best.warrant, 30);
    assert.equal(best.drugs, 50);
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
    const best = bestByCategory([pointsOf({ drugs: 40 }).categories]);
    const rows = radarRows([
        { name: 'กก.1', categories: pointsOf({ drugs: 10 }).categories },
        { name: 'เฉลี่ย บก.ทล.', categories: pointsOf({ drugs: 25 }).categories },
    ], best);
    const drugs = rows.find((row) => row.id === 'drugs');
    assert.equal(drugs['กก.1'], 25);
    assert.equal(drugs['เฉลี่ย บก.ทล.'], 62.5);
});

test('radarSummary lists each category percent for one series', () => {
    const rows = [
        { id: 'warrant', label: 'หมายจับ', 'บก.ทล.': 100, raw: {} },
        { id: 'flagrant', label: 'ซึ่งหน้า', 'บก.ทล.': 45.5, raw: {} },
    ];
    assert.equal(radarSummary(rows, 'บก.ทล.'), 'หมายจับ 100%, ซึ่งหน้า 45.5%');
});

test('radar rows have three axes, one per criminal-case category', () => {
    const categories = pointsOf().categories;
    const rows = radarRows([{ name: 'กก.1', categories }], bestByCategory([categories]));
    assert.deepEqual(rows.map((row) => row.label), ['หมายจับ', 'ซึ่งหน้า', 'ยาเสพติด']);
});

test('radarTextColor keeps the stroke colour on dark and darkens amber and cyan text for light', () => {
    assert.equal(radarTextColor('#f59e0b', true), '#f59e0b');
    assert.equal(radarTextColor('#f59e0b', false), '#b45309');
    assert.equal(radarTextColor('#06b6d4', true), '#06b6d4');
    assert.equal(radarTextColor('#06b6d4', false), '#0e7490');
});
