// Morning report data: shared by the dashboard's "Export รายงานเช้า" button and the LINE bot page.
import { calculateDashboardStats, fromTables } from '../services/GoogleSheetService';
import { UNIT_HIERARCHY } from '../utils/helpers';
import { beforeCutoff, candidateCases, caseId, parseYmd, reportCutoff } from './reportCutoff';

export const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
export const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export const thaiDate = (d) => `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
export const reportFileName = (period) => `ผลการปฏิบัติ บก.ทล. ${period.prefix} ${period.text}`;

export { reportCutoff };
export const applyReportCutoff = (rawData, cutoff) => Object.fromEntries(Object.entries(rawData).map(([name, rows]) => [
    name,
    Array.isArray(rows) ? rows.filter(row => beforeCutoff(row, cutoff)) : rows
]));

// The data behind the morning report for `day`: the 07.00 snapshot, without rows dated after `day`.
// The dashboard's 5-image export uses it too, so both exports show the same numbers.
export const reportSnapshot = (rawData, day) => {
    const cut = applyReportCutoff(rawData, reportCutoff(day));
    return Object.fromEntries(Object.entries(cut).map(([name, rows]) => [
        name,
        Array.isArray(rows) ? rows.filter(row => { const d = parseYmd(row.date); return !d || d <= day; }) : rows
    ]));
};

// The cases listed under "เหตุการณ์ที่น่าสนใจ" for report day `day`. When the LINE job ran the AI screen
// it stored the picks in the snapshot as `cases_ai` (CaseID, line); those are listed in the AI's order
// with its one-line summary. Otherwise every candidate is listed with the unit's own summary.
export const importantCases = (rawData, day) => {
    const candidates = candidateCases(rawData.cases, day);
    if (!Array.isArray(rawData.cases_ai)) return candidates;
    const byId = new Map(candidates.map(c => [caseId(c), c]));
    return rawData.cases_ai.map(pick => {
        const c = byId.get(String(pick.CaseID ?? '').trim());
        return c && { ...c, summary: pick.line || c.summary };
    }).filter(Boolean);
};

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Data for the report of `day`: the snapshot the LINE bot stored when it sent that report, so later
// exports match what was sent even if units edit their forms afterwards. Falls back to `rawData`
// (still cut off at 07.00 by reportSnapshot) when the bot sent nothing for that day.
export const loadReportData = async (rawData, day) => {
    try {
        const res = await fetch(`/api/report-snapshot?date=${ymd(day)}`);
        if (res.ok) {
            const json = await res.json();
            if (json.format === 'table' && json.data) return { data: fromTables(json.data), fromSnapshot: true };
        }
    } catch (err) {
        console.warn('Report snapshot unavailable, using live data:', err);
    }
    return { data: rawData, fromSnapshot: false };
};

// Per-กก. criminal and overweight-truck counts for startDate..endDate (bottom bar chart of the report).
export const unitCounts = (rawData, baseFilters, startDate, endDate) =>
    Object.keys(UNIT_HIERARCHY).map(kk => {
        const c = calculateDashboardStats(rawData, {
            ...baseFilters, unit_kk: String(kk), unit_s_tl: '', dateRange: { startDate, endDate }
        }).counts;
        return { name: `กก.${kk}`, criminal: c.criminalTotal || 0, truck: c.truckTotal || 0 };
    });

// The two morning images for report day `day` (normally yesterday):
// 1) month-to-date: 1st of the month -> day   2) that day only.
// Both use the 07.00 snapshot above (forms submitted before 07.00 the morning after `day`).
// Each carries the month-to-date daily average so the report can compare against it.
export const buildMorningReports = (allRawData, baseFilters, day) => {
    const rawData = reportSnapshot(allRawData, day);
    const countsFor = (startDate, endDate) =>
        calculateDashboardStats(rawData, { ...baseFilters, dateRange: { startDate, endDate } }).counts;
    const monthStart = new Date(day.getFullYear(), day.getMonth(), 1);
    const monthYear = `${THAI_MONTHS[day.getMonth()]} ${day.getFullYear() + 543}`;
    const monthShort = THAI_MONTHS_SHORT[day.getMonth()];
    const yearBE = day.getFullYear() + 543;
    const days = day.getDate();
    const mtd = countsFor(monthStart, day);
    const average = { criminal: (mtd.criminalTotal || 0) / days, traffic: (mtd.trafficTotal || 0) / days };
    return [
        {
            key: 'mtd',
            counts: mtd,
            units: unitCounts(rawData, baseFilters, monthStart, day),
            period: { prefix: 'ประจำเดือน', text: days === 1 ? `1 ${monthYear}` : `1 - ${days} ${monthYear}` },
            title: `ผลการปฏิบัติงานประจำเดือน ${monthShort} ${yearBE} (${days === 1 ? '' : '1 - '}${days} ${monthShort})`,
            average,
            compare: 'average'
        },
        {
            key: 'daily',
            counts: countsFor(day, day),
            units: unitCounts(rawData, baseFilters, day, day),
            period: { prefix: 'ประจำวันที่', text: thaiDate(day) },
            title: `ผลการปฏิบัติงานประจำวันที่ ${days} ${monthShort} ${yearBE}`,
            average,
            // On the 1st the month average is that same day, so there is nothing to compare
            compare: days === 1 ? null : 'vsAverage'
        }
    ];
};
