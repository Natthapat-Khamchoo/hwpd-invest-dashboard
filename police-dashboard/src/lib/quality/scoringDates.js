import { SELF_ARRESTS } from './selfArrests.js';
import { SCORING_START } from './scoringConfig.js';

const pad = (n) => String(n).padStart(2, '0');

// 'YYYY-MM' of a local date, the key format of SELF_ARRESTS
export const monthKeyOf = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

export const scoringStartDate = () => new Date(SCORING_START.year, SCORING_START.month, SCORING_START.day);

// Months before the scoring start never count, even when a workbook has rows for them
export const isScoredMonth = (monthKey) => monthKey >= monthKeyOf(scoringStartDate());

// Workbook months that count, oldest first
export const scoredDataMonths = () => Object.keys(SELF_ARRESTS).filter(isScoredMonth).sort();

export const latestScoredMonth = () => scoredDataMonths().at(-1) ?? null;

// The calendar months a range touches, clipped to the range. `full` means the range covers the whole month.
export const monthsIn = ({ start, end }) => {
    const segments = [];
    let year = start.getFullYear();
    let month = start.getMonth();
    while (year < end.getFullYear() || (year === end.getFullYear() && month <= end.getMonth())) {
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        const segmentStart = start > monthStart ? start : monthStart;
        const segmentEnd = end < monthEnd ? end : monthEnd;
        segments.push({
            key: `${year}-${pad(month + 1)}`,
            start: segmentStart,
            end: segmentEnd,
            full: segmentStart.getTime() === monthStart.getTime() && segmentEnd.getTime() === monthEnd.getTime(),
        });
        month += 1;
        if (month > 11) {
            month = 0;
            year += 1;
        }
    }
    return segments;
};
