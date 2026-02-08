const https = require('https');

const SHEET_ID = '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk';
const GIDS = {
    CRIME: '684351662',
    TRAFFIC: '1718714301',
    CONTRABAND: '716805288',
    ACCIDENTS: '985244759',
    CONVOY: '1914089424'
};

const checkGid = (name, gid) => {
    return new Promise((resolve) => {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                // Check if it looks like a CSV (not a login page)
                // Google sheets redirects to login if private, or returns HTML if error sometimes
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (data.includes('<!DOCTYPE html>') || data.includes('<html')) {
                        console.log(`[${name}] GID ${gid}: Failed (Received HTML, likely invalid GID or private)`);
                    } else {
                        console.log(`[${name}] GID ${gid}: OK (CSV size: ${data.length})`);
                    }
                    resolve();
                });
            } else {
                console.log(`[${name}] GID ${gid}: HTTP ${res.statusCode}`);
                resolve();
            }
        }).on('error', (e) => {
            console.error(`[${name}] Error: ${e.message}`);
            resolve();
        });
    });
};

const run = async () => {
    console.log(`Checking Sheet ID: ${SHEET_ID}`);
    for (const [name, gid] of Object.entries(GIDS)) {
        await checkGid(name, gid);
    }
    // Also check GID 0 just in case
    await checkGid('DEFAULT_GID_0', '0');
};

run();
