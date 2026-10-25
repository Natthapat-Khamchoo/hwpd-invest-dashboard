import { STATIONS_PER_DIVISION } from './scoringConfig.js';
import { SELF_ARRESTS, SELF_ARREST_FIELDS } from './selfArrests.js';
import { ROYAL_CONVOYS } from './royalConvoys.js';
import { unitPoints, addPoints, emptyPoints, pointsIn } from './points.js';
import { awardsByStation } from './awards.js';
import { isScoredMonth, latestScoredMonth, monthKeyOf, monthsIn, scoringStartDate } from './scoringDates.js';

const DIVISIONS = Object.keys(STATIONS_PER_DIVISION);
const STATIONS = Object.entries(STATIONS_PER_DIVISION).flatMap(([kk, count]) =>
    Array.from({ length: count }, (_, i) => ({ key: `${kk}-${i + 1}`, kk, stl: i + 1 }))
);

const sum = (values) => values.reduce((total, value) => total + value, 0);
const safeDiv = (numerator, denominator) => (denominator > 0 ? numerator / denominator : 0);
// `|| 0` turns a -0 (a tiny negative float rounded to zero) into 0, so a delta never prints as "-0"
const round1 = (value) => Math.round(value * 10) / 10 || 0;
export const deltaOf = (current, previous) => round1(current - previous);
// UTC arithmetic keeps the inclusive day count free of DST offsets
const dayCount = (start, end) => Math.round(
    (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000
) + 1;

const monthRangeOf = (monthKey) => {
    const [year, month] = monthKey.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return { start, end, days: dayCount(start, end) };
};

const shiftMonth = (monthKey, delta) => {
    const [year, month] = monthKey.split('-').map(Number);
    return monthKeyOf(new Date(year, month - 1 + delta, 1));
};

// Every count a station is scored on: the self-arrest columns, then royal convoys
const COUNT_FIELDS = [...SELF_ARREST_FIELDS, 'royal'];

// Counts of one station in one month, keyed by COUNT_FIELDS; a missing month or row counts as zero
export const countsOf = (monthKey, stationKey) => {
    const row = SELF_ARRESTS[monthKey]?.[stationKey] ?? SELF_ARREST_FIELDS.map(() => 0);
    return {
        ...Object.fromEntries(SELF_ARREST_FIELDS.map((field, index) => [field, row[index]])),
        royal: ROYAL_CONVOYS[monthKey]?.[stationKey] ?? 0,
    };
};

// Nothing before the scoring start counts: the start is clamped to it, and a period that ends before it has 0 days
const scoredRange = (start, end) => {
    const clamped = start < scoringStartDate() ? scoringStartDate() : start;
    return { start: clamped, end, days: end < clamped ? 0 : dayCount(clamped, end) };
};

// The fiscal year (starts 1 October) that holds a 'YYYY-MM' month, named by the year it starts in
const fiscalStartYearOf = (monthKey) => {
    const [year, month] = monthKey.split('-').map(Number);
    return month >= 10 ? year : year - 1;
};

// A period is 'fy' (the fiscal year of the newest workbook month) or { kind: 'pastMonth', month: 'YYYY-MM' }
export const periodRange = (period, today = new Date()) => {
    if (period.kind === 'pastMonth') {
        const { start, end } = monthRangeOf(period.month);
        return scoredRange(start, end);
    }
    const startYear = fiscalStartYearOf(latestScoredMonth() ?? monthKeyOf(today));
    return scoredRange(new Date(startYear, 9, 1), new Date(startYear + 1, 8, 30));
};

const divisionOf = (members, kk) => {
    const points = members.reduce((acc, station) => addPoints(acc, station.points), emptyPoints());
    return { kk, name: `กก.${kk}`, stationCount: members.length, points, total: points.total };
};

// Points per station are the sum of its counted months plus its awards. A month counts when the range covers it
// whole and it is on or after the scoring start.
const scoreRange = (range) => {
    const awardsOf = awardsByStation(range);
    const counted = monthsIn(range)
        .filter((segment) => segment.full && isScoredMonth(segment.key))
        .map((segment) => segment.key);

    const stations = STATIONS.map(({ key, kk, stl }) => {
        const raw = Object.fromEntries(COUNT_FIELDS.map((field) => [field, 0]));
        for (const monthKey of counted) {
            const counts = countsOf(monthKey, key);
            for (const field of COUNT_FIELDS) raw[field] += counts[field];
        }
        const awards = awardsOf[key] ?? [];
        // Awards come on top of the self-arrest points and are never scaled
        const points = addPoints(unitPoints(raw), pointsIn('award', 0, sum(awards.map((award) => award.points))));
        return { key, kk, stl, raw, points, total: points.total, awards };
    });

    const divisions = DIVISIONS.map((kk) => divisionOf(stations.filter((station) => station.kk === kk), kk));
    const hqPoints = divisions.reduce((acc, division) => addPoints(acc, division.points), emptyPoints());
    return { stations, divisions, hq: { points: hqPoints, total: hqPoints.total } };
};

// The first argument is kept for the call sites that pass rawData; the scores no longer read it
export const buildQualityModel = (_rawData, period, today = new Date()) => {
    const spec = typeof period === 'string' ? { kind: period } : period;
    const range = periodRange(spec, today);
    const current = scoreRange(range);

    // The delta compares with the whole previous month. No previous month before the scoring start, or with no
    // workbook, means no comparison, so the delta is null.
    const previousMonth = spec.kind === 'pastMonth' ? shiftMonth(spec.month, -1) : null;
    const hasPrevious = previousMonth !== null && isScoredMonth(previousMonth) && Boolean(SELF_ARRESTS[previousMonth]);
    const previous = hasPrevious ? scoreRange(monthRangeOf(previousMonth)) : null;
    const prevStationTotal = new Map((previous?.stations ?? []).map((station) => [station.key, station.total]));
    const prevDivisionTotal = new Map((previous?.divisions ?? []).map((division) => [division.kk, division.total]));

    const stations = current.stations.map((station) => ({
        key: station.key,
        kk: station.kk,
        stl: station.stl,
        name: `ส.ทล.${station.stl} กก.${station.kk}`,
        raw: station.raw,
        points: station.points,
        total: round1(station.total),
        awards: station.awards,
        delta: previous ? deltaOf(station.total, prevStationTotal.get(station.key)) : null,
    }));

    const divisions = current.divisions.map((division) => ({
        kk: division.kk,
        name: division.name,
        stationCount: division.stationCount,
        points: division.points,
        total: round1(division.total),
        average: round1(safeDiv(division.total, division.stationCount)),
        delta: previous ? deltaOf(division.total, prevDivisionTotal.get(division.kk)) : null,
    }));

    const hq = {
        points: current.hq.points,
        total: round1(current.hq.total),
        average: round1(safeDiv(current.hq.total, STATIONS.length)),
        delta: previous ? deltaOf(current.hq.total, previous.hq.total) : null,
    };

    const periodMeta = spec.kind === 'pastMonth' ? { kind: spec.kind, month: spec.month } : { kind: spec.kind };
    return { period: { ...periodMeta, ...range }, hq, divisions, stations };
};
