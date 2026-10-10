import Papa from 'papaparse';

const SHEETS = {
    crime: '684351662',
    volunteer: '1925338272',
    service: '1435884266',
    traffic: '1718714301',
    items: '716805288',
    accidents: '985244759',
    convoy: '1914089424',
    stations: '1282713566'
};

// Form metadata the dashboard never reads; dropping it keeps the response under the CDN's 10 MB cache limit.
// The stations tab is kept whole because useStationData reads Rank/Position from it.
// Timestamp stays: the morning report cuts off rows submitted after 07.00 the next day.
const UNUSED_COLUMNS = new Set(['UniqueID', 'ReportID', 'rank', 'name_signer', 'position']);

// { cols, rows } stores each column name once instead of repeating it in every row object
const toTable = (name, data) => {
    const cols = data.length ? Object.keys(data[0]).filter(c => name === 'stations' || !UNUSED_COLUMNS.has(c)) : [];
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

export default async function handler(request, response) {
    const SHEET_ID = process.env.GOOGLE_SHEET_ID || '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk';
    if (!SHEET_ID) {
        return response.status(500).json({ 
            status: 'error', 
            message: 'Missing GOOGLE_SHEET_ID environment variable' 
        });
    }

    try {
        const promises = Object.entries(SHEETS).map(async ([name, gid]) => {
            const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
            const data = await fetchCSV(url);
            return { name, data };
        });

        // Tabs still running the previous build call without ?format=table and expect row objects
        const asTable = request.query?.format === 'table';
        const results = await Promise.all(promises);
        const rawData = results.reduce((acc, curr) => {
            acc[curr.name] = asTable ? toTable(curr.name, curr.data) : curr.data;
            return acc;
        }, {});

        // Set CDN cache for 5 minutes (300 seconds) to prevent rate limiting
        // and speed up client loading times.
        response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
        
        return response.status(200).json({ 
            status: 'success',
            format: asTable ? 'table' : 'rows',
            data: rawData
        });
    } catch (error) {
        console.error("Backend proxy handler error:", error);
        return response.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
}
