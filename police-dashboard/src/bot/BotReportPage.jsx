// /bot-report?date=YYYY-MM-DD
// Headless page for the LINE morning report (api/line/daily-report.js opens it in Chrome).
// Renders the two 1920x1080 report images and the copy-text, then publishes
// window.__BOT_REPORT__ = { status: 'ready' | 'error', ... } for the screenshotter to read.
import React, { useEffect, useState } from 'react';
import { fetchDashboardData, fetchStationInfo } from '../services/GoogleSheetService';
import { useStationData } from '../hooks/useStationData';
import OnePageReport, { REPORT_WIDTH, REPORT_HEIGHT } from '../components/dashboard/OnePageReport';
import { buildMorningReports, reportFileName, THAI_MONTHS_SHORT } from '../lib/morningReport';
import { buildReportText } from '../lib/reportText';

const BASE_FILTERS = { search: '', unit_kk: '', unit_s_tl: '', topic: [], charge: '', subFilter: null };

// Report day from ?date=YYYY-MM-DD, else yesterday in the browser's time zone
const reportDay = () => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(new URLSearchParams(window.location.search).get('date') || '');
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
};

// Same header format as the dashboard's copy-text button for a single day
const headerFor = (d) => `ประจำวันที่ ${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543} `;

const publish = (state) => { window.__BOT_REPORT__ = state; };

const BotReportPage = () => {
    const [day] = useState(reportDay);
    const [rawData, setRawData] = useState(null);
    const [stations, setStations] = useState([]);
    const [error, setError] = useState(null);
    const { getCommanderInfo } = useStationData(rawData || {});

    useEffect(() => {
        publish({ status: 'loading' });
        Promise.all([
            fetchDashboardData({}, { forceRefresh: true }),
            fetchStationInfo({ forceRefresh: true }).catch(() => [])
        ]).then(([result, stationRows]) => {
            const data = result?.rawData;
            if (!data || !Object.keys(data).length) throw new Error('Google Sheet returned no data');
            setStations(stationRows || []);
            setRawData(data);
        }).catch(err => {
            setError(err.message || String(err));
            publish({ status: 'error', message: err.message || String(err) });
        });
    }, []);

    const reports = rawData ? buildMorningReports(rawData, BASE_FILTERS, day) : null;
    const commanderInfo = stations.find(row => row.Unit_ID === 'TOTAL_HQ') || null;

    useEffect(() => {
        if (!reports) return;
        const { commander, unitName } = getCommanderInfo('0', '');
        const daily = reports.find(r => r.key === 'daily');
        const text = buildReportText({ s: daily.counts, commander, unitName, headerDateText: headerFor(day), isAllUnits: true });
        const c = daily.counts;
        const dayTotal = (c.criminalTotal || 0) + (c.trafficTotal || 0) + (c.convoyTotal || 0) + (c.accidentsTotal || 0);
        // Wait for web fonts, images (logo) and one paint so the screenshot never catches a half-loaded page
        const imagesLoaded = () => Promise.all([...document.images].map(img =>
            img.complete ? null : new Promise(resolve => { img.onload = img.onerror = resolve; })));
        Promise.all([document.fonts?.ready, imagesLoaded()]).then(() => requestAnimationFrame(() => requestAnimationFrame(() => publish({
            status: 'ready',
            date: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`,
            dayTotal,
            text,
            images: reports.map(r => ({ key: r.key, selector: `#bot-report-${r.key}`, fileName: `${reportFileName(r.period)}.jpg` }))
        }))));
        // reports is rebuilt every render; rawData/stations are what change it
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawData, stations]);

    if (error) return <pre id="bot-report-error" style={{ padding: 24, color: '#b91c1c' }}>{error}</pre>;
    if (!reports) return <div style={{ padding: 24, fontFamily: 'Sarabun, sans-serif' }}>กำลังโหลดข้อมูล...</div>;

    return (
        <div style={{ width: REPORT_WIDTH, background: '#ffffff' }}>
            {reports.map(r => (
                <div key={r.key} id={`bot-report-${r.key}`} style={{ width: REPORT_WIDTH, height: REPORT_HEIGHT, overflow: 'hidden' }}>
                    <OnePageReport counts={r.counts} periodPrefix={r.period.prefix} headerDate={r.period.text}
                        chartPeriod={r.chartPeriod} commanderInfo={commanderInfo} unitLabel="" />
                </div>
            ))}
        </div>
    );
};

export default BotReportPage;
