import zlib from 'node:zlib';
import Papa from 'papaparse';

const SHEETS = {
    crime: '684351662',
    volunteer: '1925338272',
    service: '1435884266',
    traffic: '1718714301',
    items: '716805288',
    accidents: '985244759',
    convoy: '1914089424',
    stations: '1282713566',
    cases: '168702281' // Important_Cases: one row per notable event, listed in the LINE report
};

// Form metadata the dashboard never reads; dropping it keeps the response under the CDN's 10 MB cache limit.
// The stations tab is kept whole because useStationData reads Rank/Position from it.
// Timestamp stays: the morning report cuts off rows submitted after 07.00 the next day.
const UNUSED_COLUMNS = new Set(['UniqueID', 'ReportID', 'rank', 'name_signer', 'position']);

// Warrant offense columns: the dashboard and the reports only read the flagrant ones (dir_f_*)
const WARRANT_OFFENSE_COLUMNS = ['dir_w_drugs', 'dir_w_immig', 'dir_w_gun', 'dir_w_customs', 'dir_w_disease', 'dir_w_transport', 'dir_w_life', 'dir_w_com', 'dir_w_doc', 'dir_w_property', 'dir_w_sex', 'dir_w_weight', 'dir_w_drunk', 'dir_w_other'];
// Columns no code reads, per tab (checked against src/ and api/)
const UNUSED_BY_TAB = {
    crime: WARRANT_OFFENSE_COLUMNS,
    volunteer: ['volunteer_type', 'volunteer_people'],
    traffic: ['traf_overhang', 'traf_overheight'],
    accidents: ['acc_count'],
    cases: ['CaseNo', 'photo_urls'],
};

// { cols, rows } stores each column name once instead of repeating it in every row object
const toTable = (name, data) => {
    const dropped = UNUSED_BY_TAB[name] || [];
    const cols = data.length ? Object.keys(data[0]).filter(c => name === 'stations' || (!UNUSED_COLUMNS.has(c) && !dropped.includes(c))) : [];
    return { cols, rows: data.map(row => cols.map(c => row[c] ?? null)) };
};

const fetchCSV = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        const csvText = await response.text();
        if (!csvText || csvText.trim().length === 0) {
            return [];
        }
        return new Promise((resolve) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: (results) => resolve(results.data),
                error: (err) => {
                    console.error("CSV Parse error:", err);
                    resolve([]);
                }
            });
        });
    } catch (error) {
        console.error(`Fetch failure for ${url}:`, error.message);
        return [];
    }
};

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk';

// All tabs, as row objects or (asTable) as { cols, rows }. The LINE report job reuses this to store
// the exact data each morning report was made from (api/line/daily-report.js).
export const fetchDashboardData = async ({ asTable, tab } = {}) => {
    const entries = Object.entries(SHEETS).filter(([name]) => !tab || name === tab);
    const results = await Promise.all(entries.map(async ([name, gid]) => {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
        return { name, data: await fetchCSV(url) };
    }));
    return results.reduce((acc, curr) => {
        acc[curr.name] = asTable ? toTable(curr.name, curr.data) : curr.data;
        return acc;
    }, {});
};

export default async function handler(request, response) {
    try {
        // Tabs still running the previous build call without ?format=table and expect row objects
        const asTable = request.query?.format === 'table';
        const tab = request.query?.tab;
        if (tab !== undefined && !Object.hasOwn(SHEETS, tab)) {
            return response.status(400).json({ status: 'error', message: `Unknown tab: ${tab}` });
        }
        const rawData = await fetchDashboardData({ asTable, tab });

        // Cache on the CDN for 15 minutes; serve the stale copy for 5 more while it refreshes.
        response.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=300');
        response.setHeader('Vary', 'Accept-Encoding');
        const body = JSON.stringify({
            status: 'success',
            format: asTable ? 'table' : 'rows',
            data: rawData
        });
        // Gzip the body when the client accepts it: the CDN then fetches far fewer bytes from origin
        if (/\bgzip\b/.test(request.headers['accept-encoding'] || '')) {
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            response.setHeader('Content-Encoding', 'gzip');
            return response.status(200).send(zlib.gzipSync(body));
        }
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        return response.status(200).send(body);
    } catch (error) {
        console.error("Backend proxy handler error:", error);
        return response.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}
