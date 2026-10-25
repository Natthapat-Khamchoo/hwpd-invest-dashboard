import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQualityModel, countsOf, deltaOf, periodRange } from './buildQualityModel.js';
import { SELF_ARRESTS } from './selfArrests.js';
import { ROYAL_CONVOY_DAYS } from './qualityIndexData.js';
import { INDEX_DIMENSIONS, STATIONS_PER_DIVISION } from './scoringConfig.js';

const TODAY = new Date(2026, 9, 25);
const DIM_IDS = INDEX_DIMENSIONS.map((dimension) => dimension.id);
const WEIGHT = Object.fromEntries(INDEX_DIMENSIONS.map((dimension) => [dimension.id, dimension.weight]));
const STATION_KEYS = Object.entries(STATIONS_PER_DIVISION).flatMap(([kk, count]) =>
    Array.from({ length: count }, (_, i) => `${kk}-${i + 1}`)
);
const ZERO_ROW = [0, 0, 0, 0, 0, 0, 0];

const sum = (values) => values.reduce((total, value) => total + value, 0);
const mean = (values) => sum(values) / values.length;
const close = (actual, expected, tolerance = 1e-9) => assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`
);

const modelOf = (month) => buildQualityModel(null, { kind: 'pastMonth', month }, TODAY);
const stationOf = (model, key) => model.stations.find((station) => station.key === key);

test('the six dimensions are in the agreed order and their weights sum to 100', () => {
    assert.deepEqual(DIM_IDS, ['criminal', 'major', 'award', 'op', 'truck', 'royal']);
    assert.deepEqual(DIM_IDS.map((id) => WEIGHT[id]), [25, 25, 15, 15, 10, 10]);
    assert.equal(sum(Object.values(WEIGHT)), 100);
});

test('countsOf reads a station-month row in the field order of SELF_ARRESTS', () => {
    assert.deepEqual(countsOf('2026-08', '5-1'), { warrant: 15, drugs: 0, immig: 4, theft: 0, gun: 0, other: 0, truck: 0, royal: 0 });
});

test('countsOf gives zeros for a month or station with no row', () => {
    const zeros = { warrant: 0, drugs: 0, immig: 0, theft: 0, gun: 0, other: 0, truck: 0, royal: 0 };
    assert.deepEqual(countsOf('2026-10', '1-1'), zeros);
    assert.deepEqual(countsOf('2026-08', '9-9'), zeros);
});

test('periodRange fy is the whole fiscal year of the newest workbook month, October 2025 to September 2026', () => {
    const range = periodRange('fy', TODAY);

    assert.deepEqual(range.start, new Date(2025, 9, 1));
    assert.deepEqual(range.end, new Date(2026, 8, 30));
    assert.equal(range.days, 365);
});

test('periodRange pastMonth covers the whole named month', () => {
    const range = periodRange({ kind: 'pastMonth', month: '2026-08' }, TODAY);

    assert.deepEqual(range.start, new Date(2026, 7, 1));
    assert.deepEqual(range.end, new Date(2026, 7, 31));
    assert.equal(range.days, 31);
});

test('periodRange gives 0 days for a pastMonth that ends before the scoring start', () => {
    assert.equal(periodRange({ kind: 'pastMonth', month: '2025-09' }, TODAY).days, 0);
});

test('in 2026-09 each dimension with a max gives its best station the full weight, and every index is 0 to 100', () => {
    const model = modelOf('2026-09');

    assert.ok(DIM_IDS.some((id) => model.max[id] > 0));
    for (const id of DIM_IDS) {
        if (model.max[id] > 0) close(Math.max(...model.stations.map((station) => station.scores[id])), WEIGHT[id]);
    }
    for (const station of model.stations) {
        assert.ok(station.index >= 0 && station.index <= 100);
        close(station.index, sum(DIM_IDS.map((id) => station.scores[id])), 0.05);
    }
});

test('in 2025-10 OP gives each unit its full points: 2-4 gets 2, 2-5 gets 1, 1-3 gets 2 and 3-2 gets 2', () => {
    const model = modelOf('2025-10');

    assert.equal(stationOf(model, '2-4').raw.op, 2);
    assert.equal(stationOf(model, '2-5').raw.op, 1);
    assert.equal(stationOf(model, '1-3').raw.op, 2);
    assert.equal(stationOf(model, '3-2').raw.op, 2);
});

test('in 2025-11 every station of กก.5 gets 2/6 OP, the division points split across six stations', () => {
    const model = modelOf('2025-11');

    for (const key of STATION_KEYS.filter((k) => k.startsWith('5-'))) {
        close(stationOf(model, key).raw.op, 2 / 6);
    }
});

test('in 2025-11 ส.ทล.2 กก.2 led the กก.2 case for 2 OP and every other กก.2 station supported it for 1', () => {
    const model = modelOf('2025-11');

    assert.equal(stationOf(model, '2-2').raw.op, 2);
    for (const key of ['2-1', '2-3', '2-4', '2-5', '2-6']) assert.equal(stationOf(model, key).raw.op, 1);
});

test('in 2026-03 the shared major case gives 1-4 and 5-1 each 1 point, half of difficulty 2', () => {
    const model = modelOf('2026-03');

    for (const key of ['1-4', '5-1']) {
        const station = stationOf(model, key);
        const item = station.items.major.find((entry) => entry.title.startsWith('ขนแรงงานจีน 2 เคส'));

        assert.equal(item.value, 1);
        assert.equal(station.raw.major, 1);
    }
});

test('in 2026-08 criminal for 3-5 is its six criminal self-arrest fields plus 2 for its important warrant', () => {
    const model = modelOf('2026-08');
    const row = SELF_ARRESTS['2026-08']['3-5'];

    assert.equal(stationOf(model, '3-5').raw.criminal, sum(row.slice(0, 6)) + 2);
    assert.equal(stationOf(model, '3-5').counts.truck, row[6]);
});

test('in 2026-01 criminal for each station of กก.2 is its six fields plus 2/6 of the division warrant', () => {
    const model = modelOf('2026-01');

    for (const key of STATION_KEYS.filter((k) => k.startsWith('2-'))) {
        const row = SELF_ARRESTS['2026-01'][key] ?? ZERO_ROW;
        close(stationOf(model, key).raw.criminal, sum(row.slice(0, 6)) + 2 / 6);
    }
});

test('in 2025-11 royal for 3-2 is its 11 convoy days', () => {
    assert.equal(stationOf(modelOf('2025-11'), '3-2').raw.royal, 11);
});

test('in 2026-04 the award dimension for 5-1 has no press conference, which counts only as OP', () => {
    const station = stationOf(modelOf('2026-04'), '5-1');

    assert.ok(!station.items.award.some((item) => item.title.startsWith('แถลงข่าว')));
});

test('in 2025-11 the award dimension for 1-4 includes the station-level sweep worth 10', () => {
    const item = stationOf(modelOf('2025-11'), '1-4').items.award.find((entry) => entry.title.endsWith('(ระดับสถานี)'));

    assert.equal(item.value, 10);
});

test('an empty dimension in a month scores 0 for every station, with no NaN', () => {
    const model = modelOf('2026-02');

    assert.equal(model.max.op, 0);
    for (const station of model.stations) assert.equal(station.scores.op, 0);
    const scores = [
        ...model.stations.flatMap((station) => Object.values(station.scores)),
        ...model.divisions.flatMap((division) => Object.values(division.scores)),
        ...Object.values(model.hq.scores),
    ];
    assert.ok(scores.every((score) => Number.isFinite(score)));
});

test('the fiscal year raw royal of 3-2 is the sum of its convoy days from 2025-10 to 2026-09', () => {
    const expected = Object.keys(ROYAL_CONVOY_DAYS)
        .filter((month) => month >= '2025-10' && month <= '2026-09')
        .reduce((total, month) => total + (ROYAL_CONVOY_DAYS[month]['3-2'] ?? 0), 0);

    assert.equal(stationOf(buildQualityModel(null, 'fy', TODAY), '3-2').raw.royal, expected);
});

test('each division index is the mean of its stations, and the HQ index is the mean of all 43', () => {
    const model = modelOf('2026-09');

    for (const division of model.divisions) {
        const members = model.stations.filter((station) => station.kk === division.kk);
        close(division.index, mean(members.map((station) => station.index)), 0.1);
    }
    close(model.hq.index, mean(model.stations.map((station) => station.index)), 0.1);
    assert.equal(model.stations.length, 43);
});

test('a month before the scoring start scores zero for every station', () => {
    const model = modelOf('2025-09');

    assert.equal(model.period.days, 0);
    assert.ok(model.stations.every((station) => station.index === 0));
    assert.equal(model.hq.index, 0);
});

test('a month with no data scores zeros, and its items are empty lists', () => {
    const model = modelOf('2026-12');

    assert.equal(model.period.days, 31);
    assert.ok(model.stations.every((station) => station.index === 0));
    assert.equal(model.hq.index, 0);
    assert.ok(model.stations.every((station) => Object.values(station.items).every((list) => list.length === 0)));
});

test('in 2026-09 max of each dimension is the largest raw value among the 43 stations', () => {
    const model = modelOf('2026-09');

    for (const id of DIM_IDS) {
        assert.equal(model.max[id], Math.max(...model.stations.map((station) => station.raw[id])), id);
    }
});

test('the first scored month has no delta, because its previous month is before the scoring start', () => {
    const model = modelOf('2025-10');

    assert.equal(model.hq.delta, null);
    assert.ok(model.stations.every((station) => station.delta === null));
});

test('a station delta for 2026-02 is its 2026-02 index minus its 2026-01 index, to one decimal', () => {
    const feb = modelOf('2026-02');
    const jan = modelOf('2026-01');
    const febStation = stationOf(feb, '5-1');
    const janStation = stationOf(jan, '5-1');

    // The delta is taken from unrounded indices while each displayed index is rounded, so the two can differ by up to 0.1
    close(febStation.delta, febStation.index - janStation.index, 0.11);
});

test('the fiscal year has no delta, because it is not compared with another period', () => {
    const model = buildQualityModel(null, 'fy', TODAY);

    assert.equal(model.hq.delta, null);
});

test('deltaOf reports 0 and never -0 when a float residue rounds to zero', () => {
    assert.ok(Object.is(deltaOf(2 * 22 * (15 / 22), 30), 0));
});
