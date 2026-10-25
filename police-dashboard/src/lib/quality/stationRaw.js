import { STATIONS_PER_DIVISION, POINTS, QUANTITY, SUPPRESSION_OFFENSES, ROAD_OFFENSES } from './scoringConfig.js';

const OFFENSE_KEYS = [...SUPPRESSION_OFFENSES, ...ROAD_OFFENSES];
const STATION_KEYS = new Set(
    Object.entries(STATIONS_PER_DIVISION).flatMap(([kk, count]) =>
        Array.from({ length: count }, (_, i) => `${Number(kk)}-${i + 1}`)
    )
);
const KK_PATTERN = /(?:กก\.?|กองกำกับการ)\s*(\d+)/;
const STL_PATTERN = /(?:ส\.?ทล\.?|สถานีตำรวจทางหลวง)\s*(\d+)/;

const num = (value) => Number(value) || 0;

const dayKeyOf = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const buildDate = (year, month, day) => {
    const y = year > 2400 ? year - 543 : year;
    const date = new Date(y, month - 1, day);
    const valid = date.getFullYear() === y && date.getMonth() === month - 1 && date.getDate() === day;
    return valid ? date : null;
};

export const parseSheetDate = (value) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
    const text = String(value).trim();
    const dmy = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
    if (dmy) return buildDate(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]));
    const ymd = text.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})/);
    if (ymd) return buildDate(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]));
    return null;
};

export const stationKeyOf = (row) => {
    const text = String(row.station || row.subDiv || '');
    const kk = text.match(KK_PATTERN);
    const stl = text.match(STL_PATTERN);
    if (!kk || !stl) return null;
    const key = `${Number(kk[1])}-${Number(stl[1])}`;
    return STATION_KEYS.has(key) ? key : null;
};

const tierOf = (amount, thresholds) => {
    if (amount <= 0) return 0;
    // A tier applies only above its threshold, so exactly 20 pills is still the lowest tier
    const crossed = thresholds.filter((t) => amount > t).length;
    return POINTS.drug.tierPoints[crossed];
};

export const pointsPerDrugCase = (yabaPills, iceGrams, hasOtherDrug) => {
    const best = Math.max(tierOf(yabaPills, POINTS.drug.yaba), tierOf(iceGrams, POINTS.drug.ice));
    if (best > 0) return best;
    return hasOtherDrug ? POINTS.drug.otherDrug : POINTS.drug.noEvidence;
};

export const emptyStationRaw = () => ({
    warrants: 0,
    flagrant: Object.fromEntries(OFFENSE_KEYS.map((key) => [key, 0])),
    drugCaseBase: 0,
    drugCaseExtra: 0,
    majorCases: 0,
    reportDays: 0,
    activeDays: 0,
});

export const aggregateStationRaw = (rawData = {}, start, end) => {
    const result = Object.fromEntries([...STATION_KEYS].map((key) => [key, emptyStationRaw()]));
    const from = dayKeyOf(start);
    const to = dayKeyOf(end);

    // Per station-day scratch cells, used for drug averaging and distinct-day counts
    const cells = new Map();
    const cellOf = (key, day) => {
        const id = `${key}|${day}`;
        if (!cells.has(id)) cells.set(id, { key, reported: false, arrest: false, drugs: 0, yaba: 0, ice: 0, otherDrug: false });
        return cells.get(id);
    };

    // Yields each row whose station resolves and whose date falls in [start, end]
    const eachRow = (tab, handler) => {
        for (const row of rawData[tab] ?? []) {
            const date = parseSheetDate(row.date);
            const key = stationKeyOf(row);
            if (!date || !key) continue;
            const day = dayKeyOf(date);
            if (day < from || day > to) continue;
            handler(row, key, day);
        }
    };

    eachRow('crime', (row, key, day) => {
        const stats = result[key];
        const cell = cellOf(key, day);
        cell.reported = true;

        const bigData = num(row.CRIM_W_BIGDATA);
        const warrants = bigData + num(row.CRIM_W_BODYWARN) + num(row.CRIM_W_GENERAL);
        stats.warrants += warrants;

        const flagrant = num(row.CRIM_FLAGRANTE) > 0;
        if (flagrant) {
            for (const offense of OFFENSE_KEYS) stats.flagrant[offense] += num(row[`dir_f_${offense}`]);
            cell.drugs += num(row.dir_f_drugs);
        }
        if (warrants > 0 || flagrant) cell.arrest = true;
    });

    // Only drug amounts are kept: they set the tier of each drug case
    eachRow('items', (row, key, day) => {
        const amount = num(row.amount);
        if (amount <= 0) return;
        const cell = cellOf(key, day);
        const name = String(row.item_name ?? '').trim();
        if (name.includes('ยาบ้า') || name.includes('ยาอี')) cell.yaba += amount;
        else if (name.includes('ไอซ์')) cell.ice += amount;
        else if (name.includes('เคตามีน') || name.includes('โคเคน')) cell.otherDrug = true;
    });

    for (const cell of cells.values()) {
        const stats = result[cell.key];
        if (cell.reported) stats.reportDays += 1;
        if (cell.arrest) stats.activeDays += 1;
        if (cell.drugs > 0) {
            const perCase = pointsPerDrugCase(cell.yaba / cell.drugs, cell.ice / cell.drugs, cell.otherDrug);
            const base = Math.min(perCase, QUANTITY.drugCaseBase);
            stats.drugCaseBase += cell.drugs * base;
            stats.drugCaseExtra += cell.drugs * (perCase - base);
            // A big case scores above the base point: tier 2, tier 3 or other drugs
            if (perCase > QUANTITY.drugCaseBase) stats.majorCases += cell.drugs;
        }
    }

    for (const stats of Object.values(result)) {
        stats.majorCases += stats.flagrant.gun + stats.flagrant.doc;
    }

    return result;
};
