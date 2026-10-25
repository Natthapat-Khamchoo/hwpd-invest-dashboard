import { test } from 'node:test';
import assert from 'node:assert/strict';
import { awardPointsOf, awardsByStation } from './awards.js';

test('awardPointsOf gives 10, 8 and 6 to the first three ranks and 5 from the fourth on', () => {
    assert.equal(awardPointsOf(1), 10);
    assert.equal(awardPointsOf(2), 8);
    assert.equal(awardPointsOf(3), 6);
    assert.equal(awardPointsOf(7), 5);
});

test('awardsByStation splits a shared award equally between its stations', () => {
    const table = { '2026-01': [[3, ['2-4', '2-5'], false]] };
    const byStation = awardsByStation({ start: new Date(2026, 0, 1), end: new Date(2026, 0, 31) }, table);

    assert.deepEqual(byStation['2-4'], [{ month: '2026-01', rank: 3, points: 3, shared: 2, honourable: false, title: 'ป้องกันปราบปรามดีเด่นประจำเดือน' }]);
    assert.deepEqual(byStation['2-5'], [{ month: '2026-01', rank: 3, points: 3, shared: 2, honourable: false, title: 'ป้องกันปราบปรามดีเด่นประจำเดือน' }]);
});

test('awardsByStation splits a division award across its stations', () => {
    const table = { '2026-01': [[3, ['2'], false]] };
    const byStation = awardsByStation({ start: new Date(2026, 0, 1), end: new Date(2026, 0, 31) }, table);
    const keys = Object.keys(byStation).sort();

    // กก.2 has 6 stations, so rank 3 (6 points) gives 1 point to each. A lone division award is one unit: shared 1
    assert.deepEqual(keys, ['2-1', '2-2', '2-3', '2-4', '2-5', '2-6']);
    assert.ok(keys.every((key) => byStation[key][0].points === 1 && byStation[key][0].shared === 1));
});

test('awardsByStation gives a station and a division in one award their own shares, merged per station', () => {
    // Rank 3 is 6 points. Unit 2-4 takes 3; unit กก.2 takes 3 and splits it across 6 stations, so each gets 0.5.
    // 2-4 is in both units: 3 + 0.5 = 3.5. The other five stations of กก.2 get 0.5 each. The total is 6.
    const table = { '2026-01': [[3, ['2-4', '2'], false]] };
    const byStation = awardsByStation({ start: new Date(2026, 0, 1), end: new Date(2026, 0, 31) }, table);

    assert.deepEqual(byStation['2-4'], [{ month: '2026-01', rank: 3, points: 3.5, shared: 2, honourable: false, title: 'ป้องกันปราบปรามดีเด่นประจำเดือน' }]);
    for (const key of ['2-1', '2-2', '2-3', '2-5', '2-6']) {
        assert.deepEqual(byStation[key], [{ month: '2026-01', rank: 3, points: 0.5, shared: 2, honourable: false, title: 'ป้องกันปราบปรามดีเด่นประจำเดือน' }]);
    }
    const total = Object.values(byStation).flat().reduce((sum, award) => sum + award.points, 0);
    assert.equal(total, 6);
});

test('awardsByStation counts a 2026-09 award for the month', () => {
    const byStation = awardsByStation({ start: new Date(2026, 8, 1), end: new Date(2026, 8, 30) });

    assert.deepEqual(byStation['5-3'], [
        { month: '2026-09', rank: 1, points: 10, shared: 1, honourable: false, title: 'ป้องกันปราบปรามดีเด่นประจำเดือน' },
        { month: '2026-09', rank: 1, points: 10, shared: 1, honourable: false, title: 'วันตำรวจ 2569 ปราบปรามยาเสพติดดีเด่น (ด.ต.สายชล ศิลาไศล)' },
    ]);
});

test('awardsByStation gives nothing for a month the period covers only partly', () => {
    assert.deepEqual(awardsByStation({ start: new Date(2026, 8, 1), end: new Date(2026, 8, 15) }), {});
});

test('awardsByStation leaves out 2025 awards, even when the range covers those whole months', () => {
    assert.deepEqual(awardsByStation({ start: new Date(2025, 9, 1), end: new Date(2025, 11, 31) }), {});
});
