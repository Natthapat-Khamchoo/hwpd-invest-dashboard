import { AWARD_POINTS, STATIONS_PER_DIVISION } from './scoringConfig.js';
import { MONTHLY_AWARDS } from './monthlyAwards.js';
import { isScoredMonth, monthsIn } from './scoringDates.js';

// Points for one award by its rank. Honourable mentions follow the same rank rule.
export const awardPointsOf = (rank) => (
    rank <= AWARD_POINTS.byRank.length ? AWARD_POINTS.byRank[rank - 1] : AWARD_POINTS.other
);

// A station unit names itself; a division unit 'kk' names each of its stations
const stationsOfUnit = (unit) => (unit.includes('-')
    ? [unit]
    : Array.from({ length: STATIONS_PER_DIVISION[unit] ?? 0 }, (_, i) => `${unit}-${i + 1}`));

// Awards of the scored months the range covers fully, keyed by station. A shared award splits equally between its stations.
export const awardsByStation = (range, table = MONTHLY_AWARDS) => {
    const byStation = {};
    for (const segment of monthsIn(range)) {
        if (!segment.full || !isScoredMonth(segment.key)) continue;
        for (const [rank, units, honourable] of table[segment.key] ?? []) {
            // Each unit takes an equal share of the rank points; a division unit then splits its share across its stations
            const unitShare = awardPointsOf(rank) / units.length;
            const pointsOfStation = new Map();
            for (const unit of units) {
                const stations = stationsOfUnit(unit);
                for (const key of stations) {
                    pointsOfStation.set(key, (pointsOfStation.get(key) ?? 0) + unitShare / stations.length);
                }
            }
            for (const [key, points] of pointsOfStation) {
                (byStation[key] ??= []).push({ month: segment.key, rank, points, shared: units.length, honourable });
            }
        }
    }
    return byStation;
};
