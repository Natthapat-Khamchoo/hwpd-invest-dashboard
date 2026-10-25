import { STATIONS_PER_DIVISION } from './scoringConfig.js';
import { aggregateStationRaw } from './stationRaw.js';
import { unitPoints, unitInfo, addPoints, emptyPoints, arrestsOf } from './points.js';

const DIVISIONS = Object.keys(STATIONS_PER_DIVISION);
const STATIONS = Object.entries(STATIONS_PER_DIVISION).flatMap(([kk, count]) =>
    Array.from({ length: count }, (_, i) => ({ key: `${kk}-${i + 1}`, kk, stl: i + 1 }))
);

const sum = (values) => values.reduce((total, value) => total + value, 0);
const safeDiv = (numerator, denominator) => (denominator > 0 ? numerator / denominator : 0);
const round1 = (value) => Math.round(value * 10) / 10;
const dayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// UTC arithmetic keeps the inclusive day count free of DST offsets
const dayCount = (start, end) => Math.round(
    (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000
) + 1;

export const periodRange = (kind, today) => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const start = kind === 'fy'
        ? new Date(month >= 9 ? year : year - 1, 9, 1)
        : new Date(year, month, 1);
    const end = dayStart(today);
    return { start, end, days: dayCount(start, end) };
};

// The same days as today's period, from the 1st of the previous month, clamped to that month's last day
export const previousPeriodRange = (today) => {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    const end = new Date(start.getFullYear(), start.getMonth(), Math.min(today.getDate(), lastDay));
    return { start, end, days: dayCount(start, end) };
};

const divisionInfo = (members) => ({
    majorShare: safeDiv(sum(members.map((station) => station.raw.majorCases)), sum(members.map((station) => arrestsOf(station.raw)))),
    reportRatio: safeDiv(sum(members.map((station) => station.info.reportRatio)), members.length),
});

const scoreRange = (rawData, range) => {
    const rawByKey = aggregateStationRaw(rawData, range.start, range.end);
    const stations = STATIONS.map(({ key, kk, stl }) => {
        const raw = rawByKey[key];
        const points = unitPoints(raw);
        return { key, kk, stl, raw, points, total: points.total, info: unitInfo(raw, range.days) };
    });

    const divisions = DIVISIONS.map((kk) => {
        const members = stations.filter((station) => station.kk === kk);
        const points = members.reduce((acc, station) => addPoints(acc, station.points), emptyPoints());
        return {
            kk,
            name: `กก.${kk}`,
            stationCount: members.length,
            points,
            total: points.total,
            info: divisionInfo(members),
        };
    });

    const hqPoints = divisions.reduce((acc, division) => addPoints(acc, division.points), emptyPoints());
    return { stations, divisions, hq: { points: hqPoints, total: hqPoints.total } };
};

export const buildQualityModel = (rawData, kind, today = new Date()) => {
    const range = periodRange(kind, today);
    const current = scoreRange(rawData, range);
    const previous = kind === 'month' ? scoreRange(rawData, previousPeriodRange(today)) : null;
    const prevStationTotal = new Map((previous?.stations ?? []).map((station) => [station.key, station.total]));
    const prevDivisionTotal = new Map((previous?.divisions ?? []).map((division) => [division.kk, division.total]));

    const stations = current.stations.map((station) => ({
        key: station.key,
        kk: station.kk,
        stl: station.stl,
        name: `ส.ทล.${station.stl} กก.${station.kk}`,
        raw: station.raw,
        points: station.points,
        total: station.total,
        delta: previous ? station.total - prevStationTotal.get(station.key) : null,
        info: station.info,
        consistency: safeDiv(station.raw.activeDays, range.days),
    }));

    const divisions = current.divisions.map((division) => ({
        kk: division.kk,
        name: division.name,
        stationCount: division.stationCount,
        points: division.points,
        total: division.total,
        average: round1(safeDiv(division.total, division.stationCount)),
        delta: previous ? division.total - prevDivisionTotal.get(division.kk) : null,
        info: division.info,
    }));

    const hq = {
        points: current.hq.points,
        total: current.hq.total,
        average: round1(safeDiv(current.hq.total, STATIONS.length)),
        delta: previous ? current.hq.total - previous.hq.total : null,
    };

    return { period: { kind, ...range }, hq, divisions, stations };
};
