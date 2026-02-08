
import Papa from 'papaparse';

const sheetId = '1RKZHBH_s7k-AViuGRCB6k18DMKyVAcu8nT83MGuseYQ';
const gid = '684351662'; // Crime
const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

console.log(`Fetching from ${url}...`);

try {
    const response = await fetch(url);
    const text = await response.text();
    console.log('--- CSV HEAD ---');
    console.log(text.substring(0, 500));
    console.log('--- END CSV HEAD ---');
} catch (error) {
    console.error('Error fetching:', error);
}
