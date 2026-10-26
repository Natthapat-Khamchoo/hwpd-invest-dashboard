import { INDEX_DIMENSIONS, STATIONS_PER_DIVISION, stationsOfUnit } from './scoringConfig.js';
import { SELF_ARREST_FIELDS, SELF_ARRESTS } from './selfArrests.js';
import { OP_CASES, ROYAL_CONVOY_DAYS } from './qualityIndexData.js';
import { MONTHLY_AWARDS } from './monthlyAwards.js';
import { awardsByStation } from './awards.js';
import { isScoredMonth, latestScoredMonth, monthKeyOf, monthsIn, scoringStartDate } from './scoringDates.js';
import { STAFFING, STATION_GROUPS, stationGroupOf } from './staffing.js';

const DIM_IDS = INDEX_DIMENSIONS.map((dimension) => dimension.id);
const DIVISIONS = Object.keys(STATIONS_PER_DIVISION);
const STATIONS = Object.entries(STATIONS_PER_DIVISION).flatMap(([kk, count]) =>
    Array.from({ length: count }, (_, i) => ({ key: `${kk}-${i + 1}`, kk, stl: i + 1 }))
);
// Self-arrest columns that feed the criminal dimension; trucks have their own dimension
const CRIMINAL_FIELDS = SELF_ARREST_FIELDS.filter((field) => field !== 'truck');

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

// Counts of one station in one month, keyed by the self-arrest fields, plus royal convoy days; a missing row counts as zero
export const countsOf = (monthKey, stationKey) => {
    const row = SELF_ARRESTS[monthKey]?.[stationKey] ?? SELF_ARREST_FIELDS.map(() => 0);
    return {
        ...Object.fromEntries(SELF_ARREST_FIELDS.map((field, index) => [field, row[index]])),
        royal: ROYAL_CONVOY_DAYS[monthKey]?.[stationKey] ?? 0,
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

const zeroDims = () => Object.fromEntries(DIM_IDS.map((id) => [id, 0]));
const zeroCounts = () => Object.fromEntries(SELF_ARREST_FIELDS.map((field) => [field, 0]));
const emptyItems = () => ({ award: [], major: [], op: [] });

// Adds one monthly award to major: it counts 1, split equally between its units, and a division unit's share splits
// across its stations. Each share is listed on its own, so a station in two units lists both.
// The item label adds the rank and any honourable mention, so the title stays plain.
const creditMonthlyAward = (raw, items, { month, rank, units, honourable }) => {
    for (const unit of units) {
        const stations = stationsOfUnit(unit);
        for (const key of stations) {
            const value = 1 / (units.length * stations.length);
            raw[key].major += value;
            items[key].major.push({
                month,
                title: 'ป้องกันปราบปรามดีเด่นประจำเดือน',
                value,
                ...(units.length > 1 && { shared: units.length }),
                rank,
                honourable,
            });
        }
    }
};

// Adds one case to the raw value of each station it names. `amount` is what each unit takes; a division unit splits
// its amount across its stations. A station in two units gets both shares, listed once.
const creditCase = (raw, items, { dim, kind, month, title, units, amount }) => {
    const shares = new Map();
    for (const unit of units) {
        const stations = stationsOfUnit(unit);
        for (const key of stations) shares.set(key, (shares.get(key) ?? 0) + amount / stations.length);
    }
    for (const [key, value] of shares) {
        raw[key][dim] += value;
        items[key][kind].push({ month, title, value, ...(units.length > 1 && { shared: units.length }) });
    }
};

// Raw values of every station over the counted months, then each dimension scored against the best station
const scoreRange = (range) => {
    const awardsOf = awardsByStation(range);
    const counted = monthsIn(range)
        .filter((segment) => segment.full && isScoredMonth(segment.key))
        .map((segment) => segment.key);

    const raw = Object.fromEntries(STATIONS.map(({ key }) => [key, zeroDims()]));
    const items = Object.fromEntries(STATIONS.map(({ key }) => [key, emptyItems()]));
    const counts = Object.fromEntries(STATIONS.map(({ key }) => [key, zeroCounts()]));

    for (const month of counted) {
        for (const { key } of STATIONS) {
            const monthCounts = countsOf(month, key);
            for (const field of SELF_ARREST_FIELDS) counts[key][field] += monthCounts[field];
            raw[key].criminal += sum(CRIMINAL_FIELDS.map((field) => monthCounts[field]));
            raw[key].truck += monthCounts.truck;
            raw[key].royal += monthCounts.royal;
        }
        // Major: every monthly award, honourable mentions included (1 each, same split rules)
        for (const [rank, units, honourable] of MONTHLY_AWARDS[month] ?? []) {
            creditMonthlyAward(raw, items, { month, rank, units, honourable });
        }
        // OP: every unit takes the full points, not a share of them
        for (const [points, units, title] of OP_CASES[month] ?? []) {
            creditCase(raw, items, { dim: 'op', kind: 'op', month, title, units, amount: points });
        }
    }

    for (const { key } of STATIONS) {
        const awards = awardsOf[key] ?? [];
        raw[key].award = sum(awards.map((award) => award.points));
        items[key].award = awards.map((award) => ({
            month: award.month,
            title: award.title,
            value: award.points,
            ...(award.rank !== null && { rank: award.rank }),
            ...(award.shared > 1 && { shared: award.shared }),
        }));
    }

    // The best station in a dimension gets its full weight; a dimension nobody has scores 0 for everyone
    const max = Object.fromEntries(DIM_IDS.map((id) => [id, Math.max(0, ...STATIONS.map(({ key }) => raw[key][id]))]));
    const scoresOf = (dims) => Object.fromEntries(INDEX_DIMENSIONS.map(({ id, weight }) => [id, safeDiv(dims[id], max[id]) * weight]));
    const indexOf = (scores) => sum(DIM_IDS.map((id) => scores[id]));
    // Division and HQ scores are plain averages of their stations' scores, so their index is the mean station index
    const averageScores = (members) => Object.fromEntries(DIM_IDS.map((id) => [id, safeDiv(sum(members.map((member) => member.scores[id])), members.length)]));

    const stations = STATIONS.map(({ key, kk, stl }) => {
        const scores = scoresOf(raw[key]);
        return { key, kk, stl, counts: counts[key], raw: raw[key], scores, index: indexOf(scores), items: items[key] };
    });
    const divisions = DIVISIONS.map((kk) => {
        const members = stations.filter((station) => station.kk === kk);
        const scores = averageScores(members);
        return { kk, name: `กก.${kk}`, stationCount: members.length, scores, index: indexOf(scores) };
    });
    const hqScores = averageScores(stations);
    return { max, stations, divisions, hq: { scores: hqScores, index: indexOf(hqScores) } };
};

// The first argument is kept for the call sites that pass rawData; the scores no longer read it
export const buildQualityModel = (_rawData, period, today = new Date()) => {
    const spec = typeof period === 'string' ? { kind: period } : period;
    const range = periodRange(spec, today);
    const current = scoreRange(range);

    // The delta compares with the whole previous month, normalised on its own. No previous month before the scoring
    // start, or with no workbook, means no comparison, so the delta is null.
    const previousMonth = spec.kind === 'pastMonth' ? shiftMonth(spec.month, -1) : null;
    const hasPrevious = previousMonth !== null && isScoredMonth(previousMonth) && Boolean(SELF_ARRESTS[previousMonth]);
    const previous = hasPrevious ? scoreRange(monthRangeOf(previousMonth)) : null;
    const prevStationIndex = new Map((previous?.stations ?? []).map((station) => [station.key, station.index]));
    const prevDivisionIndex = new Map((previous?.divisions ?? []).map((division) => [division.kk, division.index]));

    // Per head held, from unrounded values; 0 when nobody is held, so a station without a figure never shows NaN
    const perCapitaOf = (station, held) => ({
        criminal: safeDiv(station.raw.criminal, held),
        truck: safeDiv(station.raw.truck, held),
        royal: safeDiv(station.raw.royal, held),
        indexPer10: safeDiv(station.index, held) * 10,
    });

    // Rank within the size group by the displayed index, so stations that show the same index share the better place
    const stations = current.stations.map((station) => {
        const group = stationGroupOf(station.key);
        const held = STAFFING[station.key].held;
        const index = round1(station.index);
        const peers = current.stations.filter((other) => stationGroupOf(other.key) === group);
        return {
            key: station.key,
            kk: station.kk,
            stl: station.stl,
            name: `ส.ทล.${station.stl} กก.${station.kk}`,
            group,
            held,
            groupRank: 1 + peers.filter((other) => round1(other.index) > index).length,
            groupSize: peers.length,
            counts: station.counts,
            raw: station.raw,
            scores: station.scores,
            index,
            perCapita: perCapitaOf(station, held),
            delta: previous ? deltaOf(station.index, prevStationIndex.get(station.key)) : null,
            items: station.items,
        };
    });

    const groups = STATION_GROUPS.map(({ id, label }) => {
        const members = current.stations.filter((station) => stationGroupOf(station.key) === id);
        return { id, label, stationCount: members.length, averageIndex: safeDiv(sum(members.map((station) => station.index)), members.length) };
    });

    const divisions = current.divisions.map((division) => ({
        kk: division.kk,
        name: division.name,
        stationCount: division.stationCount,
        scores: division.scores,
        index: round1(division.index),
        delta: previous ? deltaOf(division.index, prevDivisionIndex.get(division.kk)) : null,
    }));

    const hq = {
        scores: current.hq.scores,
        index: round1(current.hq.index),
        delta: previous ? deltaOf(current.hq.index, previous.hq.index) : null,
    };

    const periodMeta = spec.kind === 'pastMonth' ? { kind: spec.kind, month: spec.month } : { kind: spec.kind };
    return { period: { ...periodMeta, ...range }, max: current.max, hq, divisions, stations, groups };
};
