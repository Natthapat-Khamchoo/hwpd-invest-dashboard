import https from 'https';

const SHEET_ID = '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk';
const GID = '1282713566'; // Correct Stations Sheet GID

const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

console.log(`Fetching from: ${url}`);

https.get(url, (res) => {
    // Handle redirects (Google Sheets often redirects)
    if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307) {
        console.log(`Redirecting to: ${res.headers.location}`);
        https.get(res.headers.location, (newRes) => {
            let data = '';
            newRes.on('data', chunk => data += chunk);
            newRes.on('end', () => {
                console.log('--- STATIONS DATA PREVIEW ---');
                const lines = data.split('\n').slice(0, 50); // increased to 50
                lines.forEach((line, i) => console.log(`${i}: ${line}`));
            });
        }).on('error', (e) => console.error(e));
        return;
    }

    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('--- STATIONS DATA PREVIEW ---');
        const lines = data.split('\n').slice(0, 50);
        lines.forEach((line, i) => console.log(`${i}: ${line}`));
    });
}).on('error', (e) => {
    console.error(e);
});
