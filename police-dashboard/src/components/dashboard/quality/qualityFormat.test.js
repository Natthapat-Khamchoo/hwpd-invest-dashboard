import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatThaiDate, formatPeriodRange, formatDelta, placingOf, formatCount, formatAverage, radarSummary, radarTextColor, formatMonthThai, monthOptions, fiscalYearLabel, sourceNotice, awardLabel, axisPercent, INDEX_METRICS, metricValueOf, indexBarItems, compareUnitKeys, dimensionRadarRows, breakdownRows, averageRaw, itemGroupsOf, STAFFING_NOTE, GROUP_FILTERS, groupLabelOf, filterStationsByGroup, groupRankLabel, formatPerCapita, meanOf, meansOf, staffingPoints, quadrantCaption, perCapitaRows, sortStationRows, perCapitaItems } from './qualityFormat.js';
import { INDEX_DIMENSIONS } from '../../../lib/quality/scoringConfig.js';

const DIM_IDS = ['criminal', 'major', 'award', 'op', 'truck', 'royal'];
const zeroDims = (overrides = {}) => Object.fromEntries(DIM_IDS.map((id) => [id, overrides[id] ?? 0]));

test('formatThaiDate writes the day, the Thai month and the Buddhist year', () => {
    assert.equal(formatThaiDate(new Date(2026, 9, 1)), '1 ต.ค. 2569');
    assert.equal(formatThaiDate(new Date(2026, 0, 31)), '31 ม.ค. 2569');
});

test('formatPeriodRange joins the start and end dates with an en dash', () => {
    assert.equal(
        formatPeriodRange({ start: new Date(2026, 0, 1), end: new Date(2026, 8, 30) }),
        '1 ม.ค. 2569 – 30 ก.ย. 2569'
    );
});

test('formatDelta names the whole previous month and signs the change', () => {
    assert.equal(formatDelta(12), '+12 จากเดือนก่อน');
    assert.equal(formatDelta(-3), '-3 จากเดือนก่อน');
    assert.equal(formatDelta(0), '0 จากเดือนก่อน');
    assert.equal(formatDelta(1200), '+1,200 จากเดือนก่อน');
});

test('formatDelta returns null without a previous month to compare with', () => {
    assert.equal(formatDelta(null), null);
    assert.equal(formatDelta(undefined), null);
});

test('placingOf ranks a key by value, highest first, and ties share the better place', () => {
    const rows = [{ key: '1', value: 70 }, { key: '2', value: 80 }, { key: '3', value: 70 }];
    assert.equal(placingOf(rows, '2'), 1);
    assert.equal(placingOf(rows, '1'), 2);
    assert.equal(placingOf(rows, '3'), 2);
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

test('radarSummary lists each category percent for one series', () => {
    const rows = [
        { id: 'warrant', label: 'หมายจับ', 'บก.ทล.': 100, raw: {} },
        { id: 'flagrant', label: 'ซึ่งหน้า', 'บก.ทล.': 45.5, raw: {} },
    ];
    assert.equal(radarSummary(rows, 'บก.ทล.'), 'หมายจับ 100%, ซึ่งหน้า 45.5%');
});

test('radarTextColor keeps the stroke colour on dark and darkens amber and cyan text for light', () => {
    assert.equal(radarTextColor('#f59e0b', true), '#f59e0b');
    assert.equal(radarTextColor('#f59e0b', false), '#b45309');
    assert.equal(radarTextColor('#06b6d4', true), '#06b6d4');
    assert.equal(radarTextColor('#06b6d4', false), '#0e7490');
});

test('formatMonthThai writes the short Thai month and the Buddhist year', () => {
    assert.equal(formatMonthThai('2026-08'), 'ส.ค. 2569');
    assert.equal(formatMonthThai('2025-11'), 'พ.ย. 2568');
});

test('monthOptions lists the workbook months from October 2025, newest first', () => {
    const options = monthOptions();

    assert.equal(options.length, 12);
    assert.deepEqual(options[0], { value: '2026-09', label: 'ก.ย. 2569' });
    assert.deepEqual(options[options.length - 1], { value: '2025-10', label: 'ต.ค. 2568' });
});

test('fiscalYearLabel names the fiscal year that starts in October, by its Buddhist year', () => {
    assert.equal(fiscalYearLabel('2026-09'), 'ปีงบ 2569');
    assert.equal(fiscalYearLabel('2025-10'), 'ปีงบ 2569');
    assert.equal(fiscalYearLabel('2026-10'), 'ปีงบ 2570');
});

test('sourceNotice names the index as experimental, the newest month and the six dimensions', () => {
    assert.equal(
        sourceNotice('2026-09'),
        'ดัชนีทดลองคิดจากสถิติคดีอาญาจับเองของงานแผน (รายกลุ่มข้อหา) ข้อมูลถึง ก.ย. 2569 รวมคดีสำคัญ รางวัล OP / ยุทธการ รถหนัก และถวายความปลอดภัย (ถปภ.)'
    );
});

test('awardLabel gives the Thai month and rank, with the share and honourable mention when they apply', () => {
    assert.equal(awardLabel({ month: '2026-09', rank: 1, points: 10, shared: 1, honourable: false }), 'ก.ย. 2569 ลำดับ 1');
    assert.equal(awardLabel({ month: '2026-08', rank: 3, points: 3, shared: 2, honourable: false }), 'ส.ค. 2569 ลำดับ 3 (แบ่ง 2 หน่วย)');
    assert.equal(awardLabel({ month: '2026-09', rank: 4, points: 5, shared: 1, honourable: true }), 'ก.ย. 2569 ลำดับ 4 · ชมเชย');
});

test('axisPercent turns a score into a percent of its weight, one decimal, and 0 for a zero weight', () => {
    assert.equal(axisPercent(12.5, 25), 50);
    assert.equal(axisPercent(10, 15), 66.7);
    assert.equal(axisPercent(25, 25), 100);
    assert.equal(axisPercent(0, 0), 0);
    assert.equal(axisPercent(3, 0), 0);
});

test('INDEX_METRICS offers the index first, then the six dimensions in config order', () => {
    assert.deepEqual(INDEX_METRICS.map((metric) => metric.id), ['index', ...INDEX_DIMENSIONS.map((dimension) => dimension.id)]);
    assert.equal(INDEX_METRICS.find((metric) => metric.id === 'criminal').label, 'คดีอาญาจับเอง');
});

test('metricValueOf reads the index for index, and one dimension score otherwise', () => {
    const unit = { index: 40.5, scores: zeroDims({ op: 7.5 }) };
    assert.equal(metricValueOf(unit, 'index'), 40.5);
    assert.equal(metricValueOf(unit, 'op'), 7.5);
});

test('compareUnitKeys orders stations by กก. then ส.ทล. as numbers, so 1-6 comes before 1-10', () => {
    const keys = ['2-1', '1-10', '1-6', '1-2'];
    assert.deepEqual([...keys].sort(compareUnitKeys), ['1-2', '1-6', '1-10', '2-1']);
});

test('indexBarItems keeps unit order, not score order, and reads the chosen metric', () => {
    const units = [
        { key: '2-1', index: 80, scores: zeroDims({ op: 3 }) },
        { key: '1-1', index: 15, scores: zeroDims({ op: 9 }) },
    ];
    const byIndex = indexBarItems(units, 'index', (unit) => `s${unit.key}`);
    assert.deepEqual(byIndex.map((item) => item.key), ['1-1', '2-1']);
    assert.deepEqual(byIndex.map((item) => item.value), [15, 80]);
    assert.deepEqual(indexBarItems(units, 'op', (unit) => unit.key).map((item) => item.value), [9, 3]);
});

test('indexBarItems falls back to kk for divisions and returns finite values for all-zero units', () => {
    const divisions = [{ kk: '2', index: 0, scores: zeroDims() }, { kk: '1', index: 0, scores: zeroDims() }];
    const items = indexBarItems(divisions, 'index', (unit) => `กก.${unit.kk}`);
    assert.deepEqual(items.map((item) => item.key), ['1', '2']);
    assert.ok(items.every((item) => Number.isFinite(item.value)));
});

test('dimensionRadarRows has one axis per dimension, each series as a percent of that weight', () => {
    const rows = dimensionRadarRows([
        { name: 'กก.1', scores: zeroDims({ criminal: 12.5, royal: 10 }) },
        { name: 'บก.ทล.', scores: zeroDims({ criminal: 25 }) },
    ]);

    assert.deepEqual(rows.map((row) => row.label), INDEX_DIMENSIONS.map((dimension) => dimension.label));
    const criminal = rows.find((row) => row.id === 'criminal');
    assert.equal(criminal['กก.1'], 50);
    assert.equal(criminal['บก.ทล.'], 100);
    assert.equal(rows.find((row) => row.id === 'royal')['กก.1'], 100);
    assert.equal(criminal.raw['กก.1'].score, 12.5);
});

test('breakdownRows gives each dimension its raw value, the period max, the score and the weight, with its unit', () => {
    const rows = breakdownRows(
        zeroDims({ criminal: 12, major: 1.5, op: 2, royal: 11 }),
        zeroDims({ criminal: 24, major: 3, op: 4, royal: 11 }),
        zeroDims({ criminal: 12.5, major: 12.5, op: 7.5, royal: 10 }),
    );

    assert.deepEqual(rows[0], { id: 'criminal', label: 'คดีอาญาจับเอง', unit: 'คดี', raw: 12, max: 24, score: 12.5, weight: 25 });
    assert.deepEqual(rows.map((row) => row.unit), ['คดี', 'ครั้ง', 'คะแนนรางวัล', 'คะแนน OP', 'คดี', 'วัน']);
    assert.equal(rows.find((row) => row.id === 'royal').weight, 10);
});

test('averageRaw averages each dimension over the given stations and gives zeros for none', () => {
    const avg = averageRaw([{ raw: zeroDims({ criminal: 10, op: 2 }) }, { raw: zeroDims({ criminal: 20 }) }]);
    assert.equal(avg.criminal, 15);
    assert.equal(avg.op, 1);
    assert.deepEqual(averageRaw([]), zeroDims());
});

test('itemGroupsOf lists award, major and OP in that order, empty groups included', () => {
    const groups = itemGroupsOf({
        award: [{ month: '2026-09', title: 'ผลงาน', value: 10, rank: 1 }],
        major: [],
        op: [],
    });

    assert.deepEqual(groups.map((group) => group.kind), ['award', 'major', 'op']);
    assert.deepEqual(groups.map((group) => group.label), ['รางวัล', 'คดีสำคัญ', 'OP / ยุทธการ']);
    assert.equal(groups[0].rows[0].title, 'ผลงาน');
    assert.deepEqual(groups[1].rows, []);
});

// Stations as the model returns them, trimmed to the fields the helpers read
const station = (key, group, held, index, perCapita = { criminal: 0, truck: 0, royal: 0, indexPer10: 0 }) => ({
    key,
    name: `ส.ทล.${key.split('-')[1]} กก.${key.split('-')[0]}`,
    group,
    held,
    index,
    groupRank: 1,
    groupSize: 1,
    perCapita,
});

test('the staffing note names the as-of dates and says the figures are not part of the index', () => {
    assert.equal(STAFFING_NOTE, 'ข้อมูลกำลังพล ณ 1 ต.ค.69 (กก.8 ณ 8 มิ.ย.69 รวมตำแหน่งสอบสวน) · ตัวชี้วัดประกอบ ไม่นำไปคิดในดัชนี');
});

test('GROUP_FILTERS offers all stations first, then the two size groups with their labels', () => {
    assert.deepEqual(GROUP_FILTERS, [
        { id: 'all', label: 'ทั้งหมด' },
        { id: 'large', label: 'ส.ทล. ขนาดใหญ่ (สวญ.)' },
        { id: 'small', label: 'ส.ทล. ขนาดเล็ก (สว.)' },
    ]);
    assert.equal(groupLabelOf('small'), 'ส.ทล. ขนาดเล็ก (สว.)');
    assert.equal(groupLabelOf('unknown'), '');
});

test('filterStationsByGroup keeps the given order and returns every station for all', () => {
    const stations = [station('1-1', 'large', 10, 5), station('1-2', 'small', 8, 6), station('2-1', 'large', 9, 7)];
    assert.deepEqual(filterStationsByGroup(stations, 'all'), stations);
    assert.deepEqual(filterStationsByGroup(stations, 'large').map((item) => item.key), ['1-1', '2-1']);
    assert.deepEqual(filterStationsByGroup(stations, 'small').map((item) => item.key), ['1-2']);
});

test('groupRankLabel reads the rank among the size group, as ที่ N จาก M', () => {
    assert.equal(groupRankLabel({ groupRank: 1, groupSize: 25 }), 'ที่ 1 จาก 25');
});

test('formatPerCapita always shows two decimals with thousands separators', () => {
    assert.equal(formatPerCapita(539 / 66), '8.17');
    assert.equal(formatPerCapita(0), '0.00');
    assert.equal(formatPerCapita(1234.5), '1,234.50');
});

test('meanOf averages values and gives 0 for none', () => {
    assert.equal(meanOf([2, 4, 9]), 5);
    assert.equal(meanOf([]), 0);
});

test('meansOf averages held and index over the given stations', () => {
    const means = meansOf([station('1-1', 'large', 60, 40), station('1-2', 'small', 40, 20)]);
    assert.deepEqual(means, { held: 50, index: 30 });
});

test('staffingPoints gives each station its held count, index, group and label for the scatter', () => {
    const [point] = staffingPoints([station('3-2', 'large', 66, 50.5)]);
    assert.deepEqual(point, { key: '3-2', label: 'ส.ทล.2 กก.3', group: 'large', groupLabel: 'ส.ทล. ขนาดใหญ่ (สวญ.)', held: 66, index: 50.5 });
});

test('quadrantCaption places a point against the mean held and mean index, above the mean counting as many or high', () => {
    const means = { held: 50, index: 30 };
    assert.equal(quadrantCaption(40, 35, means), 'คนน้อย ผลงานสูง');
    assert.equal(quadrantCaption(60, 35, means), 'คนมาก ผลงานสูง');
    assert.equal(quadrantCaption(40, 20, means), 'คนน้อย ผลงานต่ำ');
    assert.equal(quadrantCaption(60, 20, means), 'คนมาก ผลงานต่ำ');
    assert.equal(quadrantCaption(50, 30, means), 'คนน้อย ผลงานต่ำ');
});

test('perCapitaItems gives the three per-head values to two decimals and the index per 10 to one', () => {
    assert.deepEqual(perCapitaItems({ criminal: 539 / 66, truck: 2, royal: 0.5, indexPer10: 12.345 }), [
        { id: 'criminal', label: 'คดีอาญาต่อคน', value: '8.17' },
        { id: 'truck', label: 'รถหนักต่อคน', value: '2.00' },
        { id: 'royal', label: 'วัน ถปภ. ต่อคน', value: '0.50' },
        { id: 'indexPer10', label: 'ดัชนีต่อ 10 คน', value: '12.3' },
    ]);
});

test('perCapitaRows flattens each station into a table row keyed by its unit key', () => {
    const rows = perCapitaRows([station('3-2', 'large', 66, 50, { criminal: 8.17, truck: 1, royal: 0.5, indexPer10: 7.6 })]);
    assert.deepEqual(rows, [{
        key: '3-2',
        label: 'ส.ทล.2 กก.3',
        groupId: 'large',
        group: 'ส.ทล. ขนาดใหญ่ (สวญ.)',
        held: 66,
        criminal: 8.17,
        truck: 1,
        royal: 0.5,
        indexPer10: 7.6,
    }]);
});

test('sortStationRows sorts by a column in either direction, with unit order as the tie-break', () => {
    const rows = [
        { key: '1-2', groupId: 'small', held: 10, criminal: 1, truck: 0, royal: 0, indexPer10: 5 },
        { key: '1-10', groupId: 'large', held: 10, criminal: 3, truck: 0, royal: 0, indexPer10: 5 },
        { key: '1-1', groupId: 'large', held: 20, criminal: 2, truck: 0, royal: 0, indexPer10: 9 },
    ];
    assert.deepEqual(sortStationRows(rows, 'indexPer10', 'desc').map((row) => row.key), ['1-1', '1-2', '1-10']);
    assert.deepEqual(sortStationRows(rows, 'criminal', 'asc').map((row) => row.key), ['1-2', '1-1', '1-10']);
    assert.deepEqual(sortStationRows(rows, 'label', 'desc').map((row) => row.key), ['1-10', '1-2', '1-1']);
    assert.deepEqual(sortStationRows(rows, 'groupId', 'asc').map((row) => row.key), ['1-1', '1-10', '1-2']);
    assert.equal(rows[0].key, '1-2', 'the input is not reordered');
});
