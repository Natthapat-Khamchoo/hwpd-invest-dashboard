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

test('in 2025-10 OP gives each unit its full points: 2-2 leads for 2, 2-4 supports for 1, 1-3 and 3-2 lead for 2', () => {
    const model = modelOf('2025-10');

    assert.equal(stationOf(model, '2-2').raw.op, 2);
    assert.equal(stationOf(model, '2-4').raw.op, 1);
    assert.equal(stationOf(model, '3-2').raw.op, 2);
    assert.equal(stationOf(model, '1-3').raw.op, 2);
});

test('in 2025-11 every station of กก.5 gets 1 OP from the Car Scams support case, and 5-2 and 5-5 also get 1 from the sweep', () => {
    const model = modelOf('2025-11');

    for (const key of STATION_KEYS.filter((k) => k.startsWith('5-'))) {
        assert.equal(stationOf(model, key).raw.op, ['5-2', '5-5'].includes(key) ? 2 : 1, key);
    }
});

test('fiscal-year OP: the max is 10, 2-2 scores the full 15, and 2-1, 2-4 and 2-6 score 7.5 each', () => {
    const model = buildQualityModel(null, 'fy', TODAY);

    assert.equal(model.max.op, 10);
    close(stationOf(model, '2-2').scores.op, 15);
    for (const key of ['2-1', '2-4', '2-6']) close(stationOf(model, key).scores.op, 7.5, 0.05);
});

test('fiscal-year OP raw: 3-2 is 6.2 with its กก.3 sweep share and case-of-the-year bonus, 7-4 is 2, and the 2025-12 values match', () => {
    const fy = buildQualityModel(null, 'fy', TODAY);

    close(stationOf(fy, '3-2').raw.op, 6.2, 0.001);
    close(stationOf(modelOf('2026-02'), '3-2').raw.op, 2);
    close(stationOf(fy, '7-4').raw.op, 2);
    close(stationOf(modelOf('2025-12'), '4-1').raw.op, 0.2);
    close(stationOf(modelOf('2025-12'), '4-4').raw.op, 1.2);
});

test('no award item in the fiscal year is a sweep or a press conference', () => {
    const fy = buildQualityModel(null, 'fy', TODAY);
    const titles = fy.stations.flatMap((station) => station.items.award.map((item) => item.title));

    assert.ok(titles.length > 0);
    assert.ok(titles.every((title) => !title.startsWith('ระดมกวาดล้าง') && !title.startsWith('แถลงข่าว')));
});

test('in 2026-09 8-3 gets the training contest worth 10, and 7-1 gets the outstanding lodging award worth 10', () => {
    const model = modelOf('2026-09');
    const hasAward = (key, title) => stationOf(model, key).items.award.some((item) => item.title === title && item.value === 10);

    assert.ok(hasAward('8-3', 'ชนะเลิศประกวดการฝึก ประเภทหน่วยงาน (หน่วยหลัก)'));
    assert.ok(hasAward('7-1', 'อาคารที่พักดีเด่น ระดับ ตร.'));
});

test('in 2025-11 ส.ทล.2 กก.2 led the กก.2 case for 2 OP and every other กก.2 station supported it for 1', () => {
    const model = modelOf('2025-11');

    assert.equal(stationOf(model, '2-2').raw.op, 2);
    for (const key of ['2-1', '2-3', '2-4', '2-5', '2-6']) assert.equal(stationOf(model, key).raw.op, 1);
});

test('in 2026-03 the shared rank-2 monthly award gives 1-4 and 5-1 0.5 each, and 1-5 nothing from it', () => {
    const model = modelOf('2026-03');

    for (const key of ['1-4', '5-1']) {
        const station = stationOf(model, key);
        const item = station.items.major.find((entry) => entry.rank === 2);

        assert.equal(item.value, 0.5);
        assert.equal(item.shared, 2);
        assert.equal(station.raw.major, 0.5);
    }
    assert.ok(!stationOf(model, '1-5').items.major.some((entry) => entry.rank === 2));
});

test('in 2026-05 7-1 gets 1 major, because its honourable mention counts like any monthly award', () => {
    assert.equal(stationOf(modelOf('2026-05'), '7-1').raw.major, 1);
});

test('fiscal-year major scores match the planning infographic within 0.1', () => {
    const model = buildQualityModel(null, 'fy', TODAY);
    const expected = { '6-4': 25.0, '1-4': 24.3, '3-2': 22.9, '5-2': 22.1, '2-1': 14.7, '6-5': 11.8 };

    for (const [key, score] of Object.entries(expected)) close(stationOf(model, key).scores.major, score, 0.1);
});

// Open for the user: the infographic credits 7-1 with one fewer monthly award than the model (8.8 against 13.2), and
// one fewer to 2-6 and one more to 2-4. A unit-attribution question for the user, not a formula issue.
test('fiscal-year major score of 7-1 matches the planning infographic within 0.1', { todo: 'infographic credits 7-1 one fewer award, see comment above' }, () => {
    close(stationOf(buildQualityModel(null, 'fy', TODAY), '7-1').scores.major, 8.8, 0.1);
});

test('fiscal-year criminal: the max is 539 cases, 3-2 scores the full 25 and 1-1 about 22.8', () => {
    const model = buildQualityModel(null, 'fy', TODAY);

    assert.equal(model.max.criminal, 539);
    close(stationOf(model, '3-2').scores.criminal, 25);
    close(stationOf(model, '1-1').scores.criminal, 22.8, 0.05);
});

test('in 2026-08 criminal for 3-5 is exactly the sum of its six criminal self-arrest fields, with no warrant bonus', () => {
    const model = modelOf('2026-08');
    const row = SELF_ARRESTS['2026-08']['3-5'];

    assert.equal(stationOf(model, '3-5').raw.criminal, sum(row.slice(0, 6)));
    assert.equal(stationOf(model, '3-5').counts.truck, row[6]);
});

test('in 2026-01 criminal for each station of กก.2 is exactly its six self-arrest fields, with no division warrant share', () => {
    const model = modelOf('2026-01');

    for (const key of STATION_KEYS.filter((k) => k.startsWith('2-'))) {
        const row = SELF_ARRESTS['2026-01'][key] ?? ZERO_ROW;
        assert.equal(stationOf(model, key).raw.criminal, sum(row.slice(0, 6)));
    }
});

test('in 2025-11 royal for 3-2 is its 21 convoy days, the long convoy included', () => {
    assert.equal(stationOf(modelOf('2025-11'), '3-2').raw.royal, 21);
});

test('in 2026-04 the award dimension for 5-1 has no press conference, which counts only as OP', () => {
    const station = stationOf(modelOf('2026-04'), '5-1');

    assert.ok(!station.items.award.some((item) => item.title.startsWith('แถลงข่าว')));
});

test('an empty dimension in a month scores 0 for every station, with no NaN', () => {
    const model = modelOf('2026-06');

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

test('each station carries its size group and its held head count from the staffing table', () => {
    const model = buildQualityModel(null, 'fy', TODAY);

    assert.equal(stationOf(model, '3-2').group, 'large');
    assert.equal(stationOf(model, '3-2').held, 66);
    assert.equal(stationOf(model, '5-2').group, 'small');
    assert.equal(stationOf(model, '8-3').held, 28);
});

test('group rank is 1-based by index within the size group: 3-2 leads the large group and 5-2 leads the small one', () => {
    const model = buildQualityModel(null, 'fy', TODAY);

    assert.equal(stationOf(model, '3-2').groupRank, 1);
    assert.equal(stationOf(model, '5-2').groupRank, 1);
    assert.equal(stationOf(model, '5-2').index, 50.7);
    assert.equal(stationOf(model, '2-6').index, 50.0);
    assert.equal(stationOf(model, '2-6').groupRank, 2);
});

test('group size is the number of stations in the same group, 25 large and 18 small', () => {
    const model = buildQualityModel(null, 'fy', TODAY);

    const large = model.stations.filter((station) => station.group === 'large');
    const small = model.stations.filter((station) => station.group === 'small');

    assert.equal(large.length, 25);
    assert.equal(small.length, 18);
    assert.ok(large.every((station) => station.groupSize === 25));
    assert.ok(small.every((station) => station.groupSize === 18));
});

test('per-capita criminal of 3-2 in the fiscal year is its 539 cases over its 66 held', () => {
    const model = buildQualityModel(null, 'fy', TODAY);

    close(stationOf(model, '3-2').perCapita.criminal, 539 / 66, 1e-9);
});

test('per-capita index per 10 people is the unrounded index over held, times 10', () => {
    const model = buildQualityModel(null, 'fy', TODAY);
    const station = stationOf(model, '3-2');

    close(station.perCapita.indexPer10, station.index / 66 * 10, 0.01);
});

test('the two size groups report their station count and the mean index of their stations', () => {
    const model = buildQualityModel(null, 'fy', TODAY);

    assert.deepEqual(model.groups.map((group) => [group.id, group.label, group.stationCount]), [
        ['large', 'ส.ทล. ขนาดใหญ่ (สวญ.)', 25],
        ['small', 'ส.ทล. ขนาดเล็ก (สว.)', 18],
    ]);
    for (const group of model.groups) {
        const members = model.stations.filter((station) => station.group === group.id);
        close(group.averageIndex, mean(members.map((station) => station.index)), 0.05);
    }
});
