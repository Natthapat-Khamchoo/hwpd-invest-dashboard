import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatThaiDate, formatPeriodRange, formatDelta, placingOf, toPercent, barItems, pointsBreakdown, formatCount, formatAverage, scoringRules, drugTierNote } from './qualityFormat.js';
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

test('barItems sorts by the unit total, highest first, and carries the total for the tooltip', () => {
    const units = [
        { kk: '1', name: 'กก.1', points: pointsOf({ warrant: 10 }, { warrant: 5 }) },
        { kk: '2', name: 'กก.2', points: pointsOf({ warrant: 60 }, { warrant: 20 }) },
    ];
    const items = barItems(units, 'total', (unit) => unit.name);
    assert.deepEqual(items.map((item) => item.key), ['2', '1']);
    assert.deepEqual(items.map((item) => item.value), [80, 15]);
    assert.deepEqual(items.map((item) => item.total), [80, 15]);
});

test('barItems ranks by quality when the metric is quality', () => {
    const units = [
        { kk: '1', name: 'กก.1', points: pointsOf({ warrant: 100 }, { warrant: 1 }) },
        { kk: '2', name: 'กก.2', points: pointsOf({ warrant: 1 }, { warrant: 9 }) },
    ];
    const items = barItems(units, 'quality', (unit) => unit.name);
    assert.deepEqual(items.map((item) => item.key), ['2', '1']);
    assert.deepEqual(items.map((item) => item.value), [9, 1]);
});

test('barItems ranks by quantity when the metric is quantity', () => {
    const units = [
        { kk: '1', name: 'กก.1', points: pointsOf({ warrant: 100 }, { warrant: 1 }) },
        { kk: '2', name: 'กก.2', points: pointsOf({ warrant: 1 }, { warrant: 9 }) },
    ];
    const items = barItems(units, 'quantity', (unit) => unit.name);
    assert.deepEqual(items.map((item) => item.value), [100, 1]);
});

test('barItems ranks by one category total when the metric is a category id', () => {
    const units = [
        { kk: '1', name: 'กก.1', points: pointsOf({ drugs: 5 }, { drugs: 5, seized: 40 }) },
        { kk: '2', name: 'กก.2', points: pointsOf({ drugs: 20 }, { drugs: 1, seized: 0 }) },
    ];
    const items = barItems(units, 'drugs', (unit) => unit.name);
    assert.deepEqual(items.map((item) => item.key), ['2', '1']);
    assert.deepEqual(items.map((item) => item.value), [21, 10]);
});

test('barItems ranks by the per-station average when the metric is average', () => {
    const units = [
        { kk: '1', name: 'กก.1', average: 12.5, points: pointsOf({ warrant: 500 }) },
        { kk: '2', name: 'กก.2', average: 30.2, points: pointsOf({ warrant: 10 }) },
    ];
    const items = barItems(units, 'average', (unit) => unit.name);
    assert.deepEqual(items.map((item) => item.key), ['2', '1']);
    assert.deepEqual(items.map((item) => item.value), [30.2, 12.5]);
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

test('barItems prefers an explicit key over kk and breaks value ties by label', () => {
    const units = [
        { key: 'b', kk: '9', name: 'ข', points: pointsOf({ warrant: 70 }) },
        { key: 'a', kk: '9', name: 'ก', points: pointsOf({ warrant: 70 }) },
    ];
    const items = barItems(units, 'total', (unit) => unit.name);
    assert.deepEqual(items.map((item) => item.key), ['a', 'b']);
});

test('pointsBreakdown on the fixture station reconciles to 58 quantity, 20 quality and 78 total', () => {
    const raw = aggregateStationRaw(rawData, new Date(2026, 9, 1), new Date(2026, 9, 24))['1-1'];
    const rows = pointsBreakdown(raw);
    const sum = (key) => rows.reduce((total, row) => total + row[key], 0);
    assert.equal(sum('quantity'), 58);
    assert.equal(sum('quality'), 20);
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
        tickets: { transport: 0, vehicle: 0, traffic: 4 },
        convoy: 1,
    };
    assert.deepEqual(pointsBreakdown(raw), [
        { category: 'warrant', label: 'หมายจับ', count: 2, quantity: 20, quality: 0, total: 20 },
        { category: 'flagrant', label: 'ซึ่งหน้า อาวุธปืน', count: 1, quantity: 10, quality: 5, total: 15 },
        { category: 'flagrant', label: 'ซึ่งหน้า จับรถบรรทุกเกินพิกัด', count: 1, quantity: 10, quality: 0, total: 10 },
        { category: 'tickets', label: 'ใบสั่ง จราจร', count: 4, quantity: 4, quality: 0, total: 4 },
        { category: 'service', label: 'นำขบวน', count: 1, quantity: 2, quality: 0, total: 2 },
    ]);
});

test('pointsBreakdown shows drug cases with the base as quantity and the extra tier as quality', () => {
    const raw = {
        ...emptyStationRaw(),
        flagrant: { ...emptyStationRaw().flagrant, drugs: 2 },
        drugCaseBase: 10,
        drugCaseExtra: 5,
    };
    assert.deepEqual(pointsBreakdown(raw), [
        { category: 'drugs', label: 'คดียาเสพติด', count: 2, quantity: 10, quality: 5, total: 15 },
    ]);
});

test('pointsBreakdown lists drug seizure amounts with their units and quality per unit block', () => {
    const raw = { ...emptyStationRaw(), drugSeized: { yaba: 2500, ice: 250, other: 99 } };
    assert.deepEqual(pointsBreakdown(raw), [
        { category: 'drugs', label: 'ยาบ้า (เม็ด)', count: 2500, quantity: 0, quality: 2, total: 2 },
        { category: 'drugs', label: 'ไอซ์ (กรัม)', count: 250, quantity: 0, quality: 2, total: 2 },
        { category: 'drugs', label: 'ยาเสพติดอื่น (หน่วย)', count: 99, quantity: 0, quality: 0, total: 0 },
    ]);
});

test('pointsBreakdown lists seized items with quality only, bullets and cash per block', () => {
    const raw = { ...emptyStationRaw(), seized: { gun: 1, bullets: 120, explosive: 0, car: 2, motorcycle: 0, cash: 25000 } };
    assert.deepEqual(pointsBreakdown(raw), [
        { category: 'seized', label: 'ของกลาง อาวุธปืน', count: 1, quantity: 0, quality: 5, total: 5 },
        { category: 'seized', label: 'ของกลาง กระสุน', count: 120, quantity: 0, quality: 2, total: 2 },
        { category: 'seized', label: 'ของกลาง รถยนต์', count: 2, quantity: 0, quality: 6, total: 6 },
        { category: 'seized', label: 'ของกลาง เงินสด (บาท)', count: 25000, quantity: 0, quality: 2, total: 2 },
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
    assert.equal(find('quantity', 'service', 'นำขบวน').points, QUANTITY.convoy);
    assert.equal(find('quality', 'warrant', 'Big Data').points, QUALITY.bigDataWarrant);
    assert.equal(find('quality', 'flagrant', 'เอกสารปลอม').points, QUALITY.flagrantExtra.doc);
    assert.equal(find('quality', 'seized', 'อาวุธปืน').points, QUALITY.seizedEach.gun);
    assert.ok(rules.every((rule) => ['quantity', 'quality'].includes(rule.kind) && rule.points > 0 && rule.text.length > 0));
});

test('scoringRules states the no-evidence drug case at 3 quantity and the other-drug case as 5 extra quality', () => {
    const rules = scoringRules();
    const noEvidence = rules.find((rule) => rule.kind === 'quantity' && rule.category === 'drugs' && rule.text.includes('ไม่มีของกลาง'));
    assert.ok(noEvidence, 'no-evidence rule exists');
    assert.equal(noEvidence.points, POINTS.drug.noEvidence);
    const otherDrug = rules.find((rule) => rule.kind === 'quality' && rule.category === 'drugs' && rule.text.includes('เคตามีน'));
    assert.ok(otherDrug, 'other-drug rule exists');
    assert.equal(otherDrug.points, POINTS.drug.otherDrug - QUANTITY.drugCaseBase);
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
        bigDataWarrants: 2,
        flagrant: Object.fromEntries(Object.keys(base.flagrant).map((key, index) => [key, index + 1])),
        drugCaseBase: 15,
        drugCaseExtra: 7,
        drugSeized: { yaba: 2500, ice: 250, other: 300 },
        seized: { gun: 2, bullets: 120, explosive: 1, car: 3, motorcycle: 2, cash: 25000 },
        tickets: { transport: 2, vehicle: 3, traffic: 4 },
        convoy: 2,
        serviceHelp: 3,
        serviceTraffic: 4,
        volunteer: 5,
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
