import https from 'https';
import Papa from 'papaparse';

const SHEET_ID = '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk';
const GID = '684351662'; // CRIME GID

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

const run = async () => {
    console.log("Fetching CRIME CSV...");
    const csvText = await fetchCSV(GID);
    const results = Papa.parse(csvText, { header: true, dynamicTyping: true, skipEmptyLines: true });

    const rows = results.data;
    console.log(`\n--- TOTAL ROWS FETCHED: ${rows.length} ---`);

    const byYear = {};
    let emptyDate = 0;
    let invalidDate = 0;

    rows.forEach((row, i) => {
        if (!row.date) {
            emptyDate++;
            return;
        }
        const d = new Date(row.date);
        if (isNaN(d.getTime())) {
            invalidDate++;
            return;
        }

        const y = d.getFullYear();
        const m = d.getMonth() + 1; // 1-12

        if (!byYear[y]) byYear[y] = {};
        if (!byYear[y][m]) byYear[y][m] = 0;
        byYear[y][m]++;
    });

    console.log(`Rows with NO Date: ${emptyDate}`);
    console.log(`Rows with INVALID Date: ${invalidDate}`);
    console.log("\n--- ROW COUNTS BY YEAR/MONTH ---");

    Object.keys(byYear).sort().forEach(year => {
        console.log(`YEAR ${year}:`);
        let yearTotal = 0;
        Object.keys(byYear[year]).sort((a, b) => a - b).forEach(month => {
            const count = byYear[year][month];
            yearTotal += count;
            console.log(`  Month ${month}: ${count} rows`);
        });
        console.log(`  -> TOTAL ${year}: ${yearTotal} rows`);
    });
};

run();
