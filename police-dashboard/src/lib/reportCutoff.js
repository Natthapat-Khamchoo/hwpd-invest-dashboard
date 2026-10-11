// Report cut-off rules with no browser or Vite dependencies, so the LINE job (api/line/daily-report.js)
// and the report page apply exactly the same rules.

// Report cut-off: the report for day D is a snapshot of the sheet at 07.00 on D+1. Only forms submitted
// before then count, for every day in the period, so the images and the LINE text come out the same no
// matter when they are made. Late entries still show on the dashboard, which reads rawData directly.
// Rows with no readable Timestamp are kept.
const CUTOFF_HOUR = 7; // the LINE bot sends at 07.00 (vercel.json cron 0 0 * * * UTC)

// Form Timestamp, e.g. "10/10/2026, 9:25:31" (D/M/YYYY, H:MM:SS)
export const parseTimestamp = (s) => {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(String(s ?? '').trim());
    return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]), Number(m[6] || 0)) : null;
};

// Sheet date column, e.g. "2026/10/09"
export const parseYmd = (s) => {
    const m = /^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})/.exec(String(s ?? '').trim());
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

export const reportCutoff = (day) => new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, CUTOFF_HOUR);

export const beforeCutoff = (row, cutoff) => {
    const sent = parseTimestamp(row.Timestamp);
    return !sent || sent < cutoff;
};

// Important_Cases rows for report day `day`, under the same 07.00 cut-off as the numbers.
// A case edited after submission can appear twice; keep the last row per CaseID.
export const candidateCases = (rows = [], day) => {
    const cutoff = reportCutoff(day);
    const byCase = new Map();
    rows.forEach((row, i) => {
        const d = parseYmd(row.date);
        if (!d || d.getTime() !== day.getTime() || !beforeCutoff(row, cutoff) || !String(row.summary ?? '').trim()) return;
        byCase.set(String(row.CaseID ?? '').trim() || `row-${i}`, row);
    });
    return [...byCase.values()].sort((a, b) => String(a.event_time ?? '').localeCompare(String(b.event_time ?? '')));
};

export const caseId = (row) => String(row.CaseID ?? '').trim();
