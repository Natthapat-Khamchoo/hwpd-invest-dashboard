// Mirrors UNIT_HIERARCHY in src/utils/helpers.js. Copied so this folder stays importable from Node.
export const STATIONS_PER_DIVISION = { '1': 6, '2': 6, '3': 5, '4': 5, '5': 6, '6': 6, '7': 5, '8': 4 };

export const CATEGORIES = [
    { id: 'warrant', label: 'หมายจับ' },
    { id: 'flagrant', label: 'ซึ่งหน้า' },
    { id: 'drugs', label: 'ยาเสพติด' },
    { id: 'tickets', label: 'ใบสั่ง' },
    { id: 'service', label: 'บริการ' },
];

// Quantity points: warrants and flagrant arrests per unit, the base of each drug case, 1 point per convoy.
// ticketsPer and servicePer are the block sizes behind the floor rules for tickets and service.
export const QUANTITY = {
    warrant: 2,
    flagrant: 1,
    drugCaseBase: 1,
    ticketsPer: 100,
    convoy: 1,
    servicePer: 10,
};

// Extra points on top of quantity (quality), for big cases only
export const QUALITY = {
    flagrantExtra: { gun: 4, doc: 4 },
};

// Drug case tiers: a case's points come from the highest tier its pills or ice exceed
export const POINTS = {
    drug: { yaba: [20, 100], ice: [5, 50], tierPoints: [1, 5, 10], otherDrug: 5, noEvidence: 1 },
};

// Camera ticket columns; any other traf_* column counts as traffic
export const TICKET_COLUMNS = {
    transport: ['traf_cover', 'traf_part'],
    vehicle: ['traf_modify', 'traf_tax', 'traf_plate'],
};

// Flagrant offense keys; sheet column = `dir_f_<key>`
export const SUPPRESSION_OFFENSES = ['drugs', 'gun', 'immig', 'customs', 'disease', 'transport', 'doc', 'property', 'sex', 'life', 'com', 'other'];
export const ROAD_OFFENSES = ['weight', 'drunk'];
