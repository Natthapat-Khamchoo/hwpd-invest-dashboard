// Relay for the LINE report's AI screen (api/_lib/caseScreen.js).
// Cloudflare in front of gpt.cib.go.th blocks Vercel's servers, so the call goes through a VM with a
// Thai IP: Vercel -> this relay -> gpt.cib.go.th. Only the two API paths the screen uses are forwarded,
// and only for requests carrying RELAY_TOKEN, so the relay is not an open door to the CIB server.
// The caller's Authorization header (the CIB API key) is passed through unchanged.
//
// Run: RELAY_TOKEN=... node cib-relay.mjs   (Node 18+, no dependencies)
// Env: RELAY_TOKEN (required), PORT (default 8787), HOST (default 127.0.0.1),
//      UPSTREAM (default https://gpt.cib.go.th)
import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';

const TOKEN = process.env.RELAY_TOKEN || '';
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const UPSTREAM = (process.env.UPSTREAM || 'https://gpt.cib.go.th').replace(/\/$/, '');
const ALLOWED = new Set(['GET /api/models', 'POST /api/chat/completions']);
const MAX_BODY = 1_000_000;
const TIMEOUT_MS = 60_000;

if (TOKEN.length < 32) {
    console.error('Set RELAY_TOKEN (at least 32 characters)');
    process.exit(1);
}

const tokenOk = (given) => {
    const a = Buffer.from(String(given || ''));
    const b = Buffer.from(TOKEN);
    return a.length === b.length && timingSafeEqual(a, b);
};

const send = (res, status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
};

const readBody = (req) => new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', c => {
        size += c.length;
        if (size > MAX_BODY) { reject(new Error('Body too large')); req.destroy(); return; }
        chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
});

http.createServer(async (req, res) => {
    const path = new URL(req.url, 'http://relay').pathname;
    if (path === '/health') return send(res, 200, { status: 'ok' });
    if (!tokenOk(req.headers['x-relay-token'])) return send(res, 401, { error: 'Unauthorized' });
    if (!ALLOWED.has(`${req.method} ${path}`)) return send(res, 404, { error: 'Not found' });
    try {
        const body = req.method === 'POST' ? await readBody(req) : undefined;
        const upstream = await fetch(`${UPSTREAM}${path}`, {
            method: req.method,
            headers: { 'Content-Type': 'application/json', Authorization: req.headers.authorization || '' },
            body,
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        res.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') || 'application/json' });
        res.end(Buffer.from(await upstream.arrayBuffer()));
        console.log(new Date().toISOString(), req.method, path, upstream.status);
    } catch (err) {
        console.error(new Date().toISOString(), req.method, path, err.message);
        send(res, 502, { error: err.message });
    }
}).listen(PORT, HOST, () => console.log(`cib-relay on ${HOST}:${PORT} -> ${UPSTREAM}`));
