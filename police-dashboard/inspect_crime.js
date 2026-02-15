import https from 'https';

const SHEET_ID = '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk';
const GID = '684351662'; // Crime Data

const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

const fetchUrl = (link) => {
    https.get(link, (resp) => {
        // Handle Redirects
        if (resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
            console.log(`Redirecting to: ${resp.headers.location}`);
            fetchUrl(resp.headers.location);
            return;
        }

        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received.
        resp.on('end', () => {
            console.log("--- RAW CSV OUTPUT (First 500 chars) ---");
            console.log(data.substring(0, 500));

            console.log("\n--- JSON PARSE PREVIEW ---");
            const lines = data.split('\n');
            if (lines.length > 0) {
                const headers = lines[0].split(',');
                console.log("Headers:", headers);

                if (lines.length > 1) {
                    const firstRow = lines[1].split(',');
                    const rowData = {};
                    headers.forEach((h, i) => {
                        const key = h.replace(/"/g, '').trim();
                        const val = firstRow[i] ? firstRow[i].replace(/"/g, '').trim() : '';
                        rowData[key] = val;
                    });
                    console.log("First Row Data:", rowData);
                }
            }
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
};

fetchUrl(url);
