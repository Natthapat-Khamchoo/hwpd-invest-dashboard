// Mirrors UNIT_HIERARCHY in src/utils/helpers.js. Copied so this folder stays importable from Node.
export const STATIONS_PER_DIVISION = { '1': 6, '2': 6, '3': 5, '4': 5, '5': 6, '6': 6, '7': 5, '8': 4 };

// Scoring covers fiscal year 2569 from its first day, the first month of the planning team's self-arrest workbooks
// (user, 2026-10-25). Nothing before this date counts.
export const SCORING_START = { year: 2025, month: 9, day: 1 };

// Points for a ranked award by rank; ranks past the third score `other`
export const AWARD_POINTS = { byRank: [10, 8, 6], other: 5 };

// The six dimensions of the quality index (ดัชนีคุณภาพ, experimental). Weights sum to 100.
export const INDEX_DIMENSIONS = [
    { id: 'criminal', label: 'คดีอาญาจับเอง', weight: 25 },
    { id: 'major', label: 'คดีสำคัญ', weight: 25 },
    { id: 'award', label: 'รางวัล', weight: 15 },
    { id: 'op', label: 'ปฏิบัติการ (OP)', weight: 15 },
    { id: 'truck', label: 'รถหนัก', weight: 10 },
    { id: 'royal', label: 'ถวายความปลอดภัย (ถปภ.)', weight: 10 },
];

// A unit is a station 'kk-stl' or a whole division 'kk'; a division unit covers each of its stations
export const stationsOfUnit = (unit) => (unit.includes('-')
    ? [unit]
    : Array.from({ length: STATIONS_PER_DIVISION[unit] ?? 0 }, (_, i) => `${unit}-${i + 1}`));
