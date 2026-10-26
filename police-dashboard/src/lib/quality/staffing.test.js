import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STAFFING, STATION_GROUPS, staffingDateOf, stationGroupOf } from './staffing.js';
import { STATIONS_PER_DIVISION } from './scoringConfig.js';

const STATION_KEYS = Object.entries(STATIONS_PER_DIVISION).flatMap(([kk, count]) =>
    Array.from({ length: count }, (_, i) => `${kk}-${i + 1}`)
);

test('STAFFING has one entry for each of the 43 stations, with the three head counts', () => {
    assert.deepEqual(Object.keys(STAFFING).sort(), [...STATION_KEYS].sort());
    assert.deepEqual(STAFFING['3-2'], { rate: 83, commissionedPrevention: 6, held: 66 });
    assert.deepEqual(STAFFING['8-3'], { rate: 118, commissionedPrevention: 8, held: 28 });
});

test('stationGroupOf puts the 25 stations with a commissioned head into large and the other 18 into small', () => {
    const groups = STATION_KEYS.map(stationGroupOf);

    assert.equal(groups.filter((group) => group === 'large').length, 25);
    assert.equal(groups.filter((group) => group === 'small').length, 18);
});

test('stationGroupOf: 3-2, 6-4 and 7-1 are large; 5-2, 2-6 and 6-5 are small', () => {
    for (const key of ['3-2', '6-4', '7-1']) assert.equal(stationGroupOf(key), 'large', key);
    for (const key of ['5-2', '2-6', '6-5']) assert.equal(stationGroupOf(key), 'small', key);
});

test('STATION_GROUPS lists large then small with their Thai labels', () => {
    assert.deepEqual(STATION_GROUPS, [
        { id: 'large', label: 'ส.ทล. ขนาดใหญ่ (สวญ.)' },
        { id: 'small', label: 'ส.ทล. ขนาดเล็ก (สว.)' },
    ]);
});

test('staffingDateOf gives 8 June 2026 for กก.8, which counts investigators, and 1 October 2026 for the others', () => {
    assert.deepEqual(staffingDateOf('8'), new Date(2026, 5, 8));
    assert.deepEqual(staffingDateOf('3'), new Date(2026, 9, 1));
});
