import https from 'https';
import Papa from 'papaparse';

// Mock SHEETS config
const SHEETS = {
    CRIME: { gid: '684351662', name: 'crime' },
    TRAFFIC: { gid: '1718714301', name: 'traffic' }
};
const SHEET_ID = '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk';

const fetchCSV = (gid) => {
    return new Promise((resolve) => {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
        const fetchUrl = (link) => {
            https.get(link, (resp) => {
                if (resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
                    fetchUrl(resp.headers.location);
                    return;
                }
                let data = '';
                resp.on('data', c => data += c);
                resp.on('end', () => resolve(data));
            });
        };
        fetchUrl(url);
    });
};

const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;
    return null;
};

// COPIED FILTER LOGIC
const filterRow = (row, filters) => {
    // 1. Filter by Unit (KK)
    if (filters.unit_kk) {
        const subDiv = row.subDiv || '';
        const station = row.station || '';
        const matchSubDiv = subDiv.includes(`กก.${filters.unit_kk}`);
        const matchStation = station.includes(`กก.${filters.unit_kk}`);
        if (!matchSubDiv && !matchStation) return false;
    }
    // 1.1 Filter by Station (S.TL)
    if (filters.unit_s_tl) {
        const station = row.station || '';
        const target = filters.unit_s_tl.toString();
        const matches = station.includes(`ส.ทล.${target}`);
        if (!matches) return false;
    }
    // 2. Filter by Date
    if (row.date) {
        const rowDate = parseDate(row.date);
        if (!rowDate) return false;

        // Month filter
        if (filters.selectedMonth !== undefined && filters.selectedMonth !== null) {
            if (rowDate.getMonth() !== parseInt(filters.selectedMonth)) return false;
            // YEAR CHECK - usually this is where it fails if years don't match
            const currentYear = new Date().getFullYear(); // 2026 in this env
            if (rowDate.getFullYear() !== currentYear) {
                // console.log(`Year mismatch: ${rowDate.getFullYear()} vs ${currentYear}`);
                return false;
            }
        }
    }
    return true;
};

// AGGREGATION LOGIC
const calculate = (rawData, filters) => {
    let stats = { criminalTotal: 0, flagrantTotal: 0 };
    if (rawData.crime) {
        rawData.crime.forEach(row => {
            if (filterRow(row, filters)) {
                stats.flagrantTotal += (Number(row.CRIM_FLAGRANTE) || 0);
            }
        });
    }
    stats.criminalTotal = stats.flagrantTotal; // Simplified for debug
    return stats;
};

const run = async () => {
    console.log("Fetching CSVs...");
    const crimeCsv = await fetchCSV(SHEETS.CRIME.gid);

    const rawData = {
        crime: Papa.parse(crimeCsv, { header: true, dynamicTyping: true, skipEmptyLines: true }).data
    };

    console.log(`Fetched ${rawData.crime.length} crime rows.`);

    // Test 1: No Filters (should roughly match total)
    // NOTE: filterRow requires selectedMonth to filter by date? No, only if it's set.
    // If we pass empty filters, it checks nothing?
    // Wait, row.date check is always there if row.date exists?
    // No, only if filters are set.
    // Let's test filter for THIS MONTH (Feb 2026? Jan 2026?)
    // Metadata says 2026-02-15. So Feb = Index 1.

    const filtersFeb = { selectedMonth: 1, unit_kk: null, unit_s_tl: null };
    const statsFeb = calculate(rawData, filtersFeb);
    console.log("\n--- Stats for FEB 2026 (Month Index 1) ---");
    console.log("Criminal Total:", statsFeb.criminalTotal);

    const filtersJan = { selectedMonth: 0, unit_kk: null, unit_s_tl: null };
    const statsJan = calculate(rawData, filtersJan);
    console.log("\n--- Stats for JAN 2026 (Month Index 0) ---");
    console.log("Criminal Total:", statsJan.criminalTotal);

    // Test Specific Filter mentioned: KK 1
    const filtersKK1 = { selectedMonth: 1, unit_kk: '1' };
    const statsKK1 = calculate(rawData, filtersKK1);
    console.log("\n--- Stats for KK 1, FEB 2026 ---");
    console.log("Criminal Total:", statsKK1.criminalTotal);
};

run();
