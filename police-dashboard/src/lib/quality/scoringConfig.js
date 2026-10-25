// Mirrors UNIT_HIERARCHY in src/utils/helpers.js. Copied so this folder stays importable from Node.
export const STATIONS_PER_DIVISION = { '1': 6, '2': 6, '3': 5, '4': 5, '5': 6, '6': 6, '7': 5, '8': 4 };

export const CATEGORIES = [
    { id: 'warrant', label: 'หมายจับ' },
    { id: 'flagrant', label: 'ซึ่งหน้า' },
    { id: 'truck', label: 'รถหนัก' },
    { id: 'royal', label: 'ถวายความปลอดภัย' },
    { id: 'award', label: 'ผลงานดีเด่น' },
];

// Scoring covers fiscal year 2569 from its first day, the first month of the planning team's self-arrest workbooks
// (user, 2026-10-25). Nothing before this date counts.
export const SCORING_START = { year: 2025, month: 9, day: 1 };

// Quality points for a monthly crime-prevention award by rank; ranks past the third score `other`
export const AWARD_POINTS = { byRank: [10, 8, 6], other: 5 };

// Quantity points per self-arrest case: each warrant, each flagrant case (immigration, theft, gun, drugs, other),
// and each heavy-truck case; plus each royal-security convoy (ถปภ.) in the station's area. Drug cases score
// drugCaseBase and count in the flagrant category (user, 2026-10-25: heavy trucks replaced drugs as a category).
export const QUANTITY = {
    warrant: 2,
    flagrant: 1,
    drugCaseBase: 1,
    truck: 1,
    royalConvoy: 2,
};

// Extra quality points on top of quantity, for big cases only
export const QUALITY = {
    flagrantExtra: { gun: 4 },
};
