import { test } from 'node:test';
import assert from 'node:assert/strict';
import { awardPointsOf, awardsByStation, INDEX_AWARDS } from './awards.js';

const JANUARY = { start: new Date(2026, 0, 1), end: new Date(2026, 0, 31) };

test('awardPointsOf gives 10, 8 and 6 to the first three ranks and 5 from the fourth on', () => {
    assert.equal(awardPointsOf(1), 10);
    assert.equal(awardPointsOf(2), 8);
    assert.equal(awardPointsOf(3), 6);
    assert.equal(awardPointsOf(7), 5);
});

test('awardsByStation splits a shared award equally between its stations', () => {
    const table = { '2026-01': [[3, ['2-4', '2-5'], false, 'ทดสอบ']] };
    const byStation = awardsByStation(JANUARY, table);
    const expected = { month: '2026-01', rank: 3, points: 3, shared: 2, honourable: false, title: 'ทดสอบ' };

    assert.deepEqual(byStation['2-4'], [expected]);
    assert.deepEqual(byStation['2-5'], [expected]);
});

test('awardsByStation splits a division award across its stations', () => {
    const table = { '2026-01': [[3, ['2'], false, 'ทดสอบ']] };
    const byStation = awardsByStation(JANUARY, table);
    const keys = Object.keys(byStation).sort();

    // กก.2 has 6 stations, so rank 3 (6 points) gives 1 point to each. A lone division award is one unit: shared 1
    assert.deepEqual(keys, ['2-1', '2-2', '2-3', '2-4', '2-5', '2-6']);
    assert.ok(keys.every((key) => byStation[key][0].points === 1 && byStation[key][0].shared === 1));
});

test('awardsByStation gives a station and a division in one award their own shares, merged per station', () => {
    // Rank 3 is 6 points. Unit 2-4 takes 3; unit กก.2 takes 3 and splits it across 6 stations, so each gets 0.5.
    // 2-4 is in both units: 3 + 0.5 = 3.5. The other five stations of กก.2 get 0.5 each. The total is 6.
    const table = { '2026-01': [[3, ['2-4', '2'], false, 'ทดสอบ']] };
    const byStation = awardsByStation(JANUARY, table);

    assert.deepEqual(byStation['2-4'], [{ month: '2026-01', rank: 3, points: 3.5, shared: 2, honourable: false, title: 'ทดสอบ' }]);
    for (const key of ['2-1', '2-2', '2-3', '2-5', '2-6']) {
        assert.deepEqual(byStation[key], [{ month: '2026-01', rank: 3, points: 0.5, shared: 2, honourable: false, title: 'ทดสอบ' }]);
    }
    const total = Object.values(byStation).flat().reduce((sum, award) => sum + award.points, 0);
    assert.equal(total, 6);
});

test('awardsByStation uses the flat points of an award with no rank', () => {
    const table = { '2026-01': [[null, ['1-1'], false, 'ทดสอบ', 5]] };
    const byStation = awardsByStation(JANUARY, table);

    assert.deepEqual(byStation['1-1'], [{ month: '2026-01', rank: null, points: 5, shared: 1, honourable: false, title: 'ทดสอบ' }]);
});

test('INDEX_AWARDS leaves out press conferences, which count only as OP', () => {
    const titles = Object.values(INDEX_AWARDS).flat().map((entry) => entry[3]);

    assert.ok(titles.length > 0);
    assert.ok(titles.every((title) => !title.startsWith('แถลงข่าว')));
});

test('INDEX_AWARDS keeps the special awards of a month', () => {
    const byStation = awardsByStation({ start: new Date(2026, 8, 1), end: new Date(2026, 8, 30) });

    assert.deepEqual(byStation['5-3'].find((award) => award.title.startsWith('วันตำรวจ 2569')), {
        month: '2026-09', rank: 1, points: 10, shared: 1, honourable: false, title: 'วันตำรวจ 2569 ปราบปรามยาเสพติดดีเด่น (ด.ต.สายชล ศิลาไศล)',
    });
});

test('INDEX_AWARDS leaves out sweeps (ระดมกวาดล้าง), which count only as OP', () => {
    const titles = Object.values(INDEX_AWARDS).flat().map((entry) => entry[3]);

    assert.ok(titles.every((title) => !title.startsWith('ระดมกวาดล้าง')));
    assert.equal(awardsByStation({ start: new Date(2025, 10, 1), end: new Date(2025, 10, 30) })['1-4'], undefined);
});

test('INDEX_AWARDS adds the 2026-09 outstanding lodging and training contest awards at 10 points each', () => {
    const byStation = awardsByStation({ start: new Date(2026, 8, 1), end: new Date(2026, 8, 30) });

    for (const key of ['7-1', '2-3', '6-4', '7-3']) {
        assert.ok(byStation[key].some((award) => award.title === 'อาคารที่พักดีเด่น ระดับ ตร.' && award.points === 10), key);
    }
    assert.ok(byStation['8-3'].some((award) => award.title === 'ชนะเลิศประกวดการฝึก ประเภทหน่วยงาน (หน่วยหลัก)' && award.points === 10));
});

test('awardsByStation gives nothing for a month the period covers only partly', () => {
    assert.deepEqual(awardsByStation({ start: new Date(2026, 8, 1), end: new Date(2026, 8, 15) }), {});
});

test('awardsByStation leaves out awards before October 2025, even when the range covers the whole month', () => {
    const table = { '2025-09': [[1, ['1-1'], false, 'ทดสอบ']] };
    assert.deepEqual(awardsByStation({ start: new Date(2025, 8, 1), end: new Date(2025, 8, 30) }, table), {});
});
