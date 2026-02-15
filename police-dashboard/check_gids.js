import https from 'https';

const SHEET_ID = '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk';

const GIDS = {
    '684351662': 'Potential CRIME',
    '1718714301': 'Potential TRAFFIC',
    '716805288': 'Potential ITEMS',
    '985244759': 'Potential ACCIDENTS',
    '1914089424': 'Potential CONVOY',
    '1282713566': 'Potential STATIONS',
    '1925338272': 'Potential VOLUNTEER',
    '1435884266': 'Potential SERVICE'
};

const fetchUrl = (gid, label) => {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;

    https.get(url, (resp) => {
        if (resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
            https.get(resp.headers.location, (redirectResp) => {
                processResponse(redirectResp, gid, label);
            });
            return;
        }
        processResponse(resp, gid, label);
    }).on("error", (err) => {
        console.log(`[${label}] Error: ${err.message}`);
    });
};

const processResponse = (resp, gid, label) => {
    let data = '';
    resp.on('data', (chunk) => data += chunk);
    resp.on('end', () => {
        const lines = data.split('\n');
        const headers = lines[0] ? lines[0].trim() : 'NO_DATA';
        console.log(`[${label} (GID: ${gid})] HEADERS: ${headers.substring(0, 200)}...`);
    });
};

console.log("Checking GIDs...");
Object.entries(GIDS).forEach(([gid, label]) => {
    fetchUrl(gid, label);
});
