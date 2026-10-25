import { AWARD_POINTS, stationsOfUnit } from './scoringConfig.js';
import { SPECIAL_AWARDS } from './specialAwards.js';
import { INDEX_EXTRA_AWARDS } from './qualityIndexData.js';
import { isScoredMonth, monthsIn } from './scoringDates.js';

// Index award table: month -> [rank, units, honourable, title, flatPoints?]. Press conferences (แถลงข่าว) and sweeps
// (ระดมกวาดล้าง) are left out because they score only as OP. The monthly awards score as major (MONTHLY_AWARDS), so they are not here either.
// A rank of null with explicit points is a flat award (no ranking).
const isOpOnly = (title) => title.startsWith('แถลงข่าว') || title.startsWith('ระดมกวาดล้าง');
const withoutOpOnly = (entries) => entries.filter(([, , title]) => !isOpOnly(title));
export const INDEX_AWARDS = Object.fromEntries(
    [...new Set([...Object.keys(SPECIAL_AWARDS), ...Object.keys(INDEX_EXTRA_AWARDS)])].sort().map((month) => [month, [
        ...withoutOpOnly(SPECIAL_AWARDS[month] ?? []).map(([rank, units, title, points]) => [rank, units, false, title, points]),
        ...(INDEX_EXTRA_AWARDS[month] ?? []).filter(([, , title]) => !isOpOnly(title)).map(([rank, units, title]) => [rank, units, false, title]),
    ]])
);

// Points for one award by its rank. Honourable mentions follow the same rank rule.
export const awardPointsOf = (rank) => (
    rank <= AWARD_POINTS.byRank.length ? AWARD_POINTS.byRank[rank - 1] : AWARD_POINTS.other
);

// Awards of the scored months the range covers fully, keyed by station. A shared award splits equally between its stations.
export const awardsByStation = (range, table = INDEX_AWARDS) => {
    const byStation = {};
    for (const segment of monthsIn(range)) {
        if (!segment.full || !isScoredMonth(segment.key)) continue;
        for (const [rank, units, honourable, title, flatPoints] of table[segment.key] ?? []) {
            // Each unit takes an equal share of the award points; a division unit then splits its share across its stations
            const unitShare = (flatPoints ?? awardPointsOf(rank)) / units.length;
            const pointsOfStation = new Map();
            for (const unit of units) {
                const stations = stationsOfUnit(unit);
                for (const key of stations) {
                    pointsOfStation.set(key, (pointsOfStation.get(key) ?? 0) + unitShare / stations.length);
                }
            }
            for (const [key, points] of pointsOfStation) {
                (byStation[key] ??= []).push({ month: segment.key, rank, points, shared: units.length, honourable, title });
            }
        }
    }
    return byStation;
};
