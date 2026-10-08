// Morning report to LINE: 2 report images (month-to-date + yesterday) and the copy-text.
// Triggered daily by Vercel Cron (vercel.json): 00:00 UTC = 07:00 Bangkok; Hobby fires within that hour, so it lands before 08:00. Manual run:
//   curl -H "Authorization: Bearer $CRON_SECRET" "https://<host>/api/line/daily-report?dry=1&date=2026-10-07"
//   dry=1   render + upload only, return the URLs and text without sending to LINE
//   date    report day (YYYY-MM-DD); default = yesterday in Asia/Bangkok
//   force=1 send even when the day has no recorded results
//
// Env: CRON_SECRET, LINE_CHANNEL_ACCESS_TOKEN, LINE_TARGET_ID (group/user ID; comma-separate for several),
//      BLOB_READ_WRITE_TOKEN (set by connecting a Vercel Blob store),
//      optional REPORT_BASE_URL (defaults to the production URL), CHROME_PATH (local runs only),
//      optional REPORT_RETENTION_DAYS (default 90).
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { put, list, del } from '@vercel/blob';
import { randomUUID } from 'node:crypto';

const TIME_ZONE = 'Asia/Bangkok';
const PAGE_TIMEOUT_MS = 90_000;
const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const LINE_PREVIEW_MAX_BYTES = 1_000_000;
const LINE_IMAGE_MAX_BYTES = 10_000_000;
const BLOB_PREFIX = 'line-reports/';

const bangkokDate = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date); // YYYY-MM-DD

const reportBaseUrl = () => {
    if (process.env.REPORT_BASE_URL) return process.env.REPORT_BASE_URL.replace(/\/$/, '');
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    throw new Error('Set REPORT_BASE_URL');
};

const launchBrowser = async () => puppeteer.launch({
    args: process.env.CHROME_PATH ? [] : chromium.args,
    executablePath: process.env.CHROME_PATH || await chromium.executablePath(),
    headless: process.env.CHROME_PATH ? true : 'shell',
});

// Open /bot-report and capture both images at 4K (3840x2160) and 1920x1080 for LINE previews
export const renderReport = async (date) => {
    const browser = await launchBrowser();
    try {
        const page = await browser.newPage();
        await page.emulateTimezone(TIME_ZONE);
        await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
        await page.goto(`${reportBaseUrl()}/bot-report?date=${date}`, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS });
        await page.waitForFunction(() => ['ready', 'error'].includes(window.__BOT_REPORT__?.status), { timeout: PAGE_TIMEOUT_MS });
        const state = await page.evaluate(() => window.__BOT_REPORT__);
        if (state.status !== 'ready') throw new Error(`Report page failed: ${state.message}`);

        const shoot = async (selector) => {
            const el = await page.$(selector);
            if (!el) throw new Error(`Missing ${selector}`);
            return Buffer.from(await el.screenshot({ type: 'jpeg', quality: 90 }));
        };
        const images = [];
        for (const img of state.images) images.push({ ...img, full: await shoot(img.selector) });
        await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
        for (const img of images) img.preview = await shoot(img.selector);
        return { ...state, images };
    } finally {
        await browser.close();
    }
};

const upload = async (date, key, kind, buffer) => {
    const blob = await put(`${BLOB_PREFIX}${date}/${key}-${kind}.jpg`, buffer, {
        access: 'public', contentType: 'image/jpeg', addRandomSuffix: true,
    });
    return blob.url;
};

// Old images stay viewable in the chat for REPORT_RETENTION_DAYS, then are removed from Blob
const pruneOldImages = async () => {
    const days = Number(process.env.REPORT_RETENTION_DAYS || 90);
    const cutoff = Date.now() - days * 86_400_000;
    let cursor;
    do {
        const page = await list({ prefix: BLOB_PREFIX, cursor });
        const stale = page.blobs.filter(b => new Date(b.uploadedAt).getTime() < cutoff).map(b => b.url);
        if (stale.length) await del(stale);
        cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
};

const pushToLine = async (to, messages) => {
    const res = await fetch(LINE_PUSH_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
            'X-Line-Retry-Key': randomUUID(), // lets LINE drop a duplicate if this request is retried
        },
        body: JSON.stringify({ to, messages }),
    });
    if (!res.ok) throw new Error(`LINE push to ${to.slice(0, 6)}… failed: ${res.status} ${await res.text()}`);
};

export default async function handler(request, response) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return response.status(500).json({ status: 'error', message: 'CRON_SECRET is not set' });
    if (request.headers.authorization !== `Bearer ${secret}`) return response.status(401).json({ status: 'error', message: 'Unauthorized' });

    const query = request.query || {};
    const dryRun = query.dry === '1';
    const force = query.force === '1';
    const date = /^\d{4}-\d{2}-\d{2}$/.test(query.date || '') ? query.date : bangkokDate(new Date(Date.now() - 86_400_000));

    const targets = (process.env.LINE_TARGET_ID || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!dryRun && (!targets.length || !process.env.LINE_CHANNEL_ACCESS_TOKEN)) {
        return response.status(500).json({ status: 'error', message: 'LINE_CHANNEL_ACCESS_TOKEN / LINE_TARGET_ID is not set' });
    }

    try {
        const report = await renderReport(date);
        // Units key in yesterday's results the next morning; an all-zero day means the sheet isn't filled yet
        if (!report.dayTotal && !force) {
            return response.status(409).json({ status: 'skipped', date, message: 'No results recorded for this day yet; nothing sent (use force=1 to send anyway)' });
        }
        for (const img of report.images) {
            if (img.full.length > LINE_IMAGE_MAX_BYTES || img.preview.length > LINE_PREVIEW_MAX_BYTES) {
                throw new Error(`${img.key} image exceeds LINE size limits (${img.full.length} / ${img.preview.length} bytes)`);
            }
        }
        const images = await Promise.all(report.images.map(async img => ({
            key: img.key,
            fileName: img.fileName,
            originalContentUrl: await upload(date, img.key, 'full', img.full),
            previewImageUrl: await upload(date, img.key, 'preview', img.preview),
        })));
        const text = report.text.slice(0, 5000); // LINE text message limit

        if (!dryRun) {
            const messages = [
                { type: 'text', text },
                ...images.map(({ originalContentUrl, previewImageUrl }) => ({ type: 'image', originalContentUrl, previewImageUrl })),
            ];
            for (const to of targets) await pushToLine(to, messages);
            await pruneOldImages().catch(err => console.error('Blob prune failed:', err));
        }

        return response.status(200).json({ status: dryRun ? 'dry-run' : 'sent', date, sentTo: dryRun ? 0 : targets.length, images, text });
    } catch (error) {
        console.error('daily-report failed:', error);
        return response.status(500).json({ status: 'error', date, message: error.message });
    }
}
