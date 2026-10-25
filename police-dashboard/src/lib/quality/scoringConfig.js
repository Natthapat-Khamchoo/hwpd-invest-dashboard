// Mirrors UNIT_HIERARCHY in src/utils/helpers.js. Copied so this folder stays importable from Node.
export const STATIONS_PER_DIVISION = { '1': 6, '2': 6, '3': 5, '4': 5, '5': 6, '6': 6, '7': 5, '8': 4 };

export const CATEGORIES = [
    { id: 'warrant', label: 'หมายจับ' },
    { id: 'flagrant', label: 'ซึ่งหน้า' },
    { id: 'drugs', label: 'ยาเสพติด' },
    { id: 'tickets', label: 'ใบสั่ง' },
    { id: 'service', label: 'บริการ' },
    { id: 'seized', label: 'ของกลาง' },
];

// Raw points per unit of activity
export const QUANTITY = {
    warrant: 10,
    flagrant: 10,
    drugCaseBase: 5,
    ticket: 1,
    convoy: 2,
    help: 1,
    trafficService: 1,
    volunteer: 2,
};

// Extra points on top of quantity (quality)
export const QUALITY = {
    bigDataWarrant: 5,
    flagrantExtra: { gun: 5, doc: 10 },
    drugPer: { yaba: 1000, ice: 100, other: 100 },
    seizedEach: { gun: 5, explosive: 5, car: 3, motorcycle: 1 },
    seizedPer: { bullets: 50, cash: 10000 },
};

// Drug case tiers: a case's points come from the highest tier its pills or ice exceed
export const POINTS = {
    drug: { yaba: [20, 100], ice: [5, 50], tierPoints: [5, 10, 15], otherDrug: 10, noEvidence: 3 },
};

// Camera ticket columns; any other traf_* column counts as traffic
export const TICKET_COLUMNS = {
    transport: ['traf_cover', 'traf_part'],
    vehicle: ['traf_modify', 'traf_tax', 'traf_plate'],
};

// Flagrant offense keys; sheet column = `dir_f_<key>`
export const SUPPRESSION_OFFENSES = ['drugs', 'gun', 'immig', 'customs', 'disease', 'transport', 'doc', 'property', 'sex', 'life', 'com', 'other'];
export const ROAD_OFFENSES = ['weight', 'drunk'];
