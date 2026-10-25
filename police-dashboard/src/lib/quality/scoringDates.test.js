import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthsIn, isScoredMonth, scoredDataMonths, latestScoredMonth } from './scoringDates.js';

test('monthsIn splits a range into calendar months and marks only whole months as full', () => {
    const segments = monthsIn({ start: new Date(2026, 7, 15), end: new Date(2026, 9, 3) });

    assert.deepEqual(segments.map((s) => [s.key, s.full]), [['2026-08', false], ['2026-09', true], ['2026-10', false]]);
    assert.deepEqual(segments[0].start, new Date(2026, 7, 15));
    assert.deepEqual(segments[0].end, new Date(2026, 7, 31));
    assert.deepEqual(segments[2].start, new Date(2026, 9, 1));
    assert.deepEqual(segments[2].end, new Date(2026, 9, 3));
});

test('monthsIn returns one full segment for exactly one calendar month', () => {
    const segments = monthsIn({ start: new Date(2026, 7, 1), end: new Date(2026, 7, 31) });

    assert.deepEqual(segments.map((s) => [s.key, s.full]), [['2026-08', true]]);
});

test('monthsIn returns no segment when the range ends before it starts', () => {
    assert.deepEqual(monthsIn({ start: new Date(2026, 0, 1), end: new Date(2025, 10, 30) }), []);
});

test('isScoredMonth is false for 2025 months and true from January 2026', () => {
    assert.equal(isScoredMonth('2025-12'), false);
    assert.equal(isScoredMonth('2026-01'), true);
});

test('scoredDataMonths lists the workbook months from January 2026 only, oldest first', () => {
    assert.deepEqual(scoredDataMonths(), [
        '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09',
    ]);
});

test('latestScoredMonth is the newest workbook month', () => {
    assert.equal(latestScoredMonth(), '2026-09');
});
