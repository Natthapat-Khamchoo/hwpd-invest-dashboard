import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQualityModel, countsOf, deltaOf, periodRange } from './buildQualityModel.js';
import { SELF_ARRESTS } from './selfArrests.js';
import { ALL_AWARDS } from './awards.js';
import { ROYAL_CONVOYS } from './royalConvoys.js';
import { STATIONS_PER_DIVISION } from './scoringConfig.js';

const TODAY = new Date(2026, 9, 25);

// Award points by rank, from the brief: 10, 8 and 6 for the first three, 5 after that
const rankPoints = (rank) => [10, 8, 6][rank - 1] ?? 5;

// A self-arrest row scored straight from the rules: 2 per warrant, 1 per drug case, 1 per flagrant case, 4 more per gun case
// Royal convoys of a station in a month, 2 points each
const royalPoints = (monthKey, stationKey) => (ROYAL_CONVOYS[monthKey]?.[stationKey] ?? 0) * 2;

const scoreRow = ([warrant, drugs, immig, theft, gun, other, truck]) => (
    warrant * 2 + drugs * 1 + (immig + theft + gun + other + truck) * 1 + gun * 4
);

// Award points a station gets in a month: its unit's share, and a division unit's share split across the division's stations
const awardPointsOf = (monthKey, stationKey) => (ALL_AWARDS[monthKey] ?? []).reduce((total, [rank, units]) => {
    const share = rankPoints(rank) / units.length;
    const kk = stationKey.split('-')[0];
    return total
        + (units.includes(stationKey) ? share : 0)
        + (units.includes(kk) ? share / STATIONS_PER_DIVISION[kk] : 0);
}, 0);

test('countsOf reads a station-month row in the field order of SELF_ARRESTS', () => {
    assert.deepEqual(countsOf('2026-08', '5-1'), { warrant: 15, drugs: 0, immig: 4, theft: 0, gun: 0, other: 0, truck: 0, royal: 0 });
});

test('countsOf gives zeros for a month or station with no row', () => {
    const zeros = { warrant: 0, drugs: 0, immig: 0, theft: 0, gun: 0, other: 0, truck: 0, royal: 0 };
    assert.deepEqual(countsOf('2026-10', '1-1'), zeros);
    assert.deepEqual(countsOf('2026-08', '9-9'), zeros);
});

test('periodRange fy is the fiscal year of the newest workbook month, clamped to January 2026', () => {
    const range = periodRange('fy', TODAY);

    assert.deepEqual(range.start, new Date(2026, 0, 1));
    assert.deepEqual(range.end, new Date(2026, 8, 30));
    assert.equal(range.days, 273);
});

test('periodRange pastMonth covers the whole named month', () => {
    const range = periodRange({ kind: 'pastMonth', month: '2026-08' }, TODAY);

    assert.deepEqual(range.start, new Date(2026, 7, 1));
    assert.deepEqual(range.end, new Date(2026, 7, 31));
    assert.equal(range.days, 31);
});

test('periodRange gives 0 days for a pastMonth that ends before the scoring start', () => {
    assert.equal(periodRange({ kind: 'pastMonth', month: '2025-12' }, TODAY).days, 0);
});

test('station 5-1 in 2026-08 scores its own row: 15 warrants and 4 flagrant cases, 34 points', () => {
    const model = buildQualityModel(null, { kind: 'pastMonth', month: '2026-08' }, TODAY);
    const station = model.stations.find((s) => s.key === '5-1');

    assert.deepEqual(station.raw, { warrant: 15, drugs: 0, immig: 4, theft: 0, gun: 0, other: 0, truck: 0, royal: 0 });
    assert.equal(station.total, 34);
    assert.equal(station.total, scoreRow(SELF_ARRESTS['2026-08']['5-1']) + royalPoints('2026-08', '5-1') + awardPointsOf('2026-08', '5-1'));
});

test('the fiscal year total is every row and award from 2026-01 to 2026-09, and nothing from 2025', () => {
    const model = buildQualityModel(null, 'fy', TODAY);
    const months = Object.keys(SELF_ARRESTS).filter((month) => month >= '2026-01' && month <= '2026-09');
    const rowTotal = months.flatMap((month) => Object.values(SELF_ARRESTS[month])).reduce((total, row) => total + scoreRow(row), 0)
        + months.flatMap((month) => Object.values(ROYAL_CONVOYS[month] ?? {})).reduce((total, convoys) => total + convoys * 2, 0);
    const awardTotal = months.flatMap((month) => ALL_AWARDS[month] ?? []).reduce((total, [rank]) => total + rankPoints(rank), 0);

    assert.equal(model.hq.total, rowTotal + awardTotal);
    assert.ok(Math.abs(model.hq.points.categories.award.quality - awardTotal) < 1e-9);
});

test('occasional awards count in their meeting month: 3-2 gets the New Year drunk-driving rank 1 in 2026-01', () => {
    const model = buildQualityModel(null, { kind: 'pastMonth', month: '2026-01' }, TODAY);
    const station = model.stations.find((s) => s.key === '3-2');
    const titles = station.awards.map((award) => award.title);

    assert.ok(titles.includes('จับเมาแล้วขับสูงสุด เทศกาลปีใหม่ 2569'));
    assert.equal(station.total, scoreRow(SELF_ARRESTS['2026-01']['3-2']) + royalPoints('2026-01', '3-2') + awardPointsOf('2026-01', '3-2'));
});

test('a division-level occasional award splits across its stations: กก.5 investigation award gives 10 / 6 to 5-1 in 2026-02', () => {
    const model = buildQualityModel(null, { kind: 'pastMonth', month: '2026-02' }, TODAY);
    const award = model.stations.find((s) => s.key === '5-1').awards.find((a) => a.title.startsWith('พัฒนางานสืบสวน'));

    assert.ok(Math.abs(award.points - 10 / 6) < 1e-9);
});

test('2025-12 data is excluded: that month scores zero for every station', () => {
    const model = buildQualityModel(null, { kind: 'pastMonth', month: '2025-12' }, TODAY);

    assert.equal(model.period.days, 0);
    assert.ok(model.stations.every((station) => station.total === 0));
    assert.equal(model.hq.total, 0);
});

test('a month with no data scores zeros without errors', () => {
    const model = buildQualityModel(null, { kind: 'pastMonth', month: '2026-12' }, TODAY);

    assert.equal(model.period.days, 31);
    assert.ok(model.stations.every((station) => station.total === 0));
    assert.equal(model.hq.total, 0);
});

test('the first scored month has no delta, because its previous month is before the scoring start', () => {
    const model = buildQualityModel(null, { kind: 'pastMonth', month: '2026-01' }, TODAY);

    assert.equal(model.hq.delta, null);
    assert.ok(model.stations.every((station) => station.delta === null));
});

test('a station delta for 2026-02 equals its 2026-02 total minus its 2026-01 total', () => {
    const feb = buildQualityModel(null, { kind: 'pastMonth', month: '2026-02' }, TODAY);
    const jan = buildQualityModel(null, { kind: 'pastMonth', month: '2026-01' }, TODAY);
    const febStation = feb.stations.find((s) => s.key === '5-1');
    const janStation = jan.stations.find((s) => s.key === '5-1');

    assert.equal(janStation.total, scoreRow(SELF_ARRESTS['2026-01']['5-1']) + royalPoints('2026-01', '5-1') + awardPointsOf('2026-01', '5-1'));
    // Totals are stored to one decimal; the กก.5 investigation award adds a 10 / 6 share in February
    assert.equal(febStation.total, Math.round((scoreRow(SELF_ARRESTS['2026-02']['5-1']) + royalPoints('2026-02', '5-1') + awardPointsOf('2026-02', '5-1')) * 10) / 10);
    assert.equal(febStation.delta, deltaOf(febStation.total, janStation.total));
});

test('the fiscal year has no delta, because it is not compared with another period', () => {
    const model = buildQualityModel(null, 'fy', TODAY);

    assert.equal(model.hq.delta, null);
});

test('deltaOf reports 0 and never -0 when a float residue rounds to zero', () => {
    assert.ok(Object.is(deltaOf(2 * 22 * (15 / 22), 30), 0));
});
