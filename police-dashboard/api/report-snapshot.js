// Stored data behind a morning report (saved by api/line/daily-report.js when the bot sends it).
//   ?date=YYYY-MM-DD   the snapshot of that report day; 404 when the bot did not send one
//   ?url=<blob url>    one specific snapshot under report-snapshots/ in this project's Blob store
//                      (the bot page uses this while rendering)
// The response has the same shape as /api/dashboard?format=table.
import { list } from '@vercel/blob';

export const SNAPSHOT_PREFIX = 'report-snapshots/';

// Only fetch our own snapshot files, never an arbitrary URL
const isSnapshotUrl = (value) => {
    try {
        const u = new URL(value);
        return u.protocol === 'https:' && u.hostname.endsWith('.public.blob.vercel-storage.com')
            && u.pathname.startsWith(`/${SNAPSHOT_PREFIX}`);
    } catch {
        return false;
    }
};

const latestBlob = async (prefix) => {
    const { blobs } = await list({ prefix, limit: 100 });
    return blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0] || null;
};

export default async function handler(request, response) {
    const { date, url } = request.query || {};
    let blob = null;
    try {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date || '')) blob = await latestBlob(`${SNAPSHOT_PREFIX}${date}/`);
        else if (isSnapshotUrl(url)) blob = { url };
        else return response.status(400).json({ status: 'error', message: 'Pass date=YYYY-MM-DD or url=<snapshot blob url>' });

        if (!blob) return response.status(404).json({ status: 'not-found' });
        const res = await fetch(blob.url);
        if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
        // A day's snapshot only changes if the bot is re-run for that day
        response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
        response.setHeader('Content-Type', 'application/json');
        return response.status(200).send(await res.text());
    } catch (error) {
        console.error('report-snapshot failed:', error);
        return response.status(500).json({ status: 'error', message: error.message });
    }
}
