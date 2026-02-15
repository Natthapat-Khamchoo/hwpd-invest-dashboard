import https from 'https';
import Papa from 'papaparse';

const SHEET_ID = '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk';
const GID = '684351662'; // CRIME

const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

const fetchUrl = (link) => {
    https.get(link, (resp) => {
        if (resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
            fetchUrl(resp.headers.location);
            return;
        }

        let data = '';
        resp.on('data', (chunk) => data += chunk);
        resp.on('end', () => {
            Papa.parse(data, {
                header: true,
                complete: (results) => {
                    console.log(`Toal Rows: ${results.data.length}`);
                    console.log("--- FIRST 5 ROWS ---");
                    results.data.slice(0, 5).forEach((row, i) => {
                        console.log(`[Row ${i + 1}]`);
                        console.log(`  date: "${row.date}" (Type: ${typeof row.date})`);
                        console.log(`  station: "${row.station}"`);
                        console.log(`  subDiv: "${row.subDiv}"`);
                        // Test our Date parsing logic
                        const d = new Date(row.date);
                        console.log(`  Parsed Date (new Date()): ${d.toString()}`);
                    });
                }
            });
        });
    }).on("error", (err) => {
        console.log(`Error: ${err.message}`);
    });
};

fetchUrl(url);
