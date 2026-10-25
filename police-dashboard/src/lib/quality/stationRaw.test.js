import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSheetDate, stationKeyOf, pointsPerDrugCase, emptyStationRaw, aggregateStationRaw } from './stationRaw.js';
import { rawData } from './testFixture.js';

const RANGE = [new Date(2026, 9, 1), new Date(2026, 9, 24)];

test('parseSheetDate reads D/M/YYYY, ISO and Buddhist-era years as local midnight', () => {
    assert.deepEqual(parseSheetDate('05/10/2026'), new Date(2026, 9, 5));
    assert.deepEqual(parseSheetDate('2026-10-05'), new Date(2026, 9, 5));
    assert.deepEqual(parseSheetDate('05/10/2569'), new Date(2026, 9, 5));
});

test('parseSheetDate returns null for empty, null and impossible dates', () => {
    assert.equal(parseSheetDate(''), null);
    assert.equal(parseSheetDate(null), null);
    assert.equal(parseSheetDate('31/02/2026'), null);
});

test('stationKeyOf maps a station label to kk-stl only when that station exists', () => {
    assert.equal(stationKeyOf({ station: 'ส.ทล.3 กก.2 บก.ทล.' }), '2-3');
    assert.equal(stationKeyOf({ station: 'กก.2 บก.ทล.' }), null);
    assert.equal(stationKeyOf({ station: 'ส.ทล.9 กก.8' }), null);
});

test('pointsPerDrugCase picks the highest tier and falls back to other-drug or no-evidence points', () => {
    assert.equal(pointsPerDrugCase(15, 0, false), 5);
    assert.equal(pointsPerDrugCase(21, 0, false), 10);
    assert.equal(pointsPerDrugCase(101, 0, false), 15);
    assert.equal(pointsPerDrugCase(0, 6, false), 10);
    assert.equal(pointsPerDrugCase(10, 60, false), 15);
    assert.equal(pointsPerDrugCase(0, 0, true), 10);
    assert.equal(pointsPerDrugCase(0, 0, false), 3);
});

test('pointsPerDrugCase treats exact thresholds as the lower tier', () => {
    assert.equal(pointsPerDrugCase(20, 0, false), 5);
    assert.equal(pointsPerDrugCase(100, 0, false), 10);
    assert.equal(pointsPerDrugCase(0, 5, false), 5);
    assert.equal(pointsPerDrugCase(0, 50, false), 10);
});

test('aggregateStationRaw matches drug items by substring name', () => {
    const data = {
        crime: [
            { date: '03/10/2026', station: 'ส.ทล.1 กก.1', CRIM_FLAGRANTE: 1, dir_f_drugs: 1 },
            { date: '04/10/2026', station: 'ส.ทล.1 กก.1', CRIM_FLAGRANTE: 1, dir_f_drugs: 1 },
        ],
        items: [
            { date: '03/10/2026', station: 'ส.ทล.1 กก.1', item_name: 'ยาบ้า (เม็ด)', amount: 30 },
            { date: '04/10/2026', station: 'ส.ทล.1 กก.1', item_name: 'ยาไอซ์', amount: 3 },
        ],
    };
    const result = aggregateStationRaw(data, ...RANGE);

    // 03/10: 30 pills -> 10 pts (base 5, extra 5). 04/10: 3 g ice -> 5 pts (base 5, extra 0).
    assert.equal(result['1-1'].drugCaseBase, 10);
    assert.equal(result['1-1'].drugCaseExtra, 5);
    assert.equal(result['1-1'].majorCases, 1);
    assert.deepEqual(result['1-1'].drugSeized, { yaba: 30, ice: 3, other: 0 });
});

test('aggregateStationRaw splits a 2,500-pill drug case into base 5 and extra 10', () => {
    const data = {
        crime: [{ date: '03/10/2026', station: 'ส.ทล.1 กก.1', CRIM_FLAGRANTE: 1, dir_f_drugs: 1 }],
        items: [{ date: '03/10/2026', station: 'ส.ทล.1 กก.1', item_name: 'ยาบ้า', amount: 2500 }],
    };
    const stats = aggregateStationRaw(data, ...RANGE)['1-1'];

    assert.equal(stats.drugCaseBase, 5);
    assert.equal(stats.drugCaseExtra, 10);
    assert.deepEqual(stats.drugSeized, { yaba: 2500, ice: 0, other: 0 });
});

test('aggregateStationRaw counts every traf_ column, with unknown columns as traffic tickets', () => {
    const data = {
        traffic: [{ date: '03/10/2026', station: 'ส.ทล.1 กก.1', traf_overhang: 3, traf_overheight: 2 }],
    };
    const stats = aggregateStationRaw(data, ...RANGE)['1-1'];

    assert.deepEqual(stats.tickets, { transport: 0, vehicle: 0, traffic: 5 });
});

test('aggregateStationRaw classifies seized items by keyword in the documented order', () => {
    const row = (item_name, amount) => ({ date: '03/10/2026', station: 'ส.ทล.1 กก.1', item_name, amount });
    const data = {
        items: [
            row('อาวุธปืนไม่มีทะเบียน', 2),
            row('กระสุน', 120),
            row('รถยนต์กระบะ', 1),
            row('รถจักรยานยนต์', 2),
            row('เงินสด', 25000),
            row('ยาบ้า', 40),
            row('ของอื่น', 9),
        ],
    };
    const stats = aggregateStationRaw(data, ...RANGE)['1-1'];

    assert.deepEqual(stats.seized, { gun: 2, bullets: 120, explosive: 0, car: 1, motorcycle: 2, cash: 25000 });
    assert.deepEqual(stats.drugSeized, { yaba: 40, ice: 0, other: 0 });
});

test('aggregateStationRaw sums in-range station rows from the fixture', () => {
    const result = aggregateStationRaw(rawData, ...RANGE);

    assert.equal(Object.keys(result).length, 43);
    assert.deepEqual(result['1-1'], {
        warrants: 2,
        bigDataWarrants: 2,
        flagrant: { ...emptyStationRaw().flagrant, gun: 1, weight: 1, drugs: 1 },
        drugCaseBase: 5,
        drugCaseExtra: 5,
        drugSeized: { yaba: 50, ice: 0, other: 0 },
        seized: { gun: 0, bullets: 0, explosive: 0, car: 0, motorcycle: 0, cash: 0 },
        majorCases: 2,
        tickets: { transport: 1, vehicle: 2, traffic: 4 },
        convoy: 1,
        serviceHelp: 2,
        serviceTraffic: 0,
        volunteer: 1,
        reportDays: 2,
        activeDays: 2,
    });
    assert.deepEqual(result['8-4'], emptyStationRaw());
});

test('aggregateStationRaw returns zeroed stations when there is no data', () => {
    const result = aggregateStationRaw({}, ...RANGE);
    assert.deepEqual(result['1-1'], emptyStationRaw());
});
