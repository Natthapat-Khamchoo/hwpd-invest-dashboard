// Mirrors UNIT_HIERARCHY in src/utils/helpers.js. Copied so this folder stays importable from Node.
export const STATIONS_PER_DIVISION = { '1': 6, '2': 6, '3': 5, '4': 5, '5': 6, '6': 6, '7': 5, '8': 4 };

export const CATEGORIES = [
    { id: 'warrant', label: 'หมายจับ' },
    { id: 'flagrant', label: 'ซึ่งหน้า' },
    { id: 'drugs', label: 'ยาเสพติด' },
    { id: 'royal', label: 'ถวายความปลอดภัย' },
    { id: 'award', label: 'ผลงานดีเด่น' },
];

// Nothing before this date counts, even though the workbooks also have Oct to Dec 2025 months
export const SCORING_START = { year: 2026, month: 0, day: 1 };

// Quality points for a monthly crime-prevention award by rank; ranks past the third score `other`
export const AWARD_POINTS = { byRank: [10, 8, 6], other: 5 };

// Quantity points per self-arrest case: each warrant, each flagrant case (immigration, theft, gun, other, heavy truck),
// and each drug case; plus each royal-security convoy (ถปภ.) in the station's area
export const QUANTITY = {
    warrant: 2,
    flagrant: 1,
    drugCaseBase: 1,
    royalConvoy: 2,
};

// Extra quality points on top of quantity, for big cases only
export const QUALITY = {
    flagrantExtra: { gun: 4 },
};
