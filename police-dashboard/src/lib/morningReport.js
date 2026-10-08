// Morning report data: shared by the dashboard's "Export รายงานเช้า" button and the LINE bot page.
import { calculateDashboardStats } from '../services/GoogleSheetService';
import { UNIT_HIERARCHY } from '../utils/helpers';

export const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
export const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export const thaiDate = (d) => `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
export const shortThaiDate = (d) => `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear() + 543).slice(-2)}`;
export const reportFileName = (period) => `ผลการปฏิบัติ บก.ทล. ${period.prefix} ${period.text}`;

// Per-กก. chart data for one day, same measures as the monthly charts:
// crime = warrants + flagrant, traffic = all traffic offenses, truck = overweight.
export const dailyUnitCharts = (rawData, baseFilters, day) => {
    const rows = Object.keys(UNIT_HIERARCHY).map(kk => ({
        name: `กก.${kk}`,
        counts: calculateDashboardStats(rawData, {
            ...baseFilters, unit_kk: String(kk), unit_s_tl: '', dateRange: { startDate: day, endDate: day }
        }).counts
    }));
    const series = (key) => rows.map(r => ({ name: r.name, month2: r.counts[key] || 0 }));
    return {
        comparison: series('criminalTotal'),
        traffic: series('trafficTotal'),
        truck: series('truckTotal'),
        monthNames: [shortThaiDate(day)]
    };
};

// The two morning images for report day `day` (normally yesterday):
// 1) month-to-date: 1st of the month -> day   2) that day only, with per-กก. daily charts.
export const buildMorningReports = (rawData, baseFilters, day) => {
    const countsFor = (startDate, endDate) =>
        calculateDashboardStats(rawData, { ...baseFilters, dateRange: { startDate, endDate } }).counts;
    const monthStart = new Date(day.getFullYear(), day.getMonth(), 1);
    const monthYear = `${THAI_MONTHS[day.getMonth()]} ${day.getFullYear() + 543}`;
    const dayCounts = countsFor(day, day);
    return [
        {
            key: 'mtd',
            counts: countsFor(monthStart, day),
            period: { prefix: 'ประจำเดือน', text: day.getDate() === 1 ? `1 ${monthYear}` : `1 - ${day.getDate()} ${monthYear}` }
        },
        {
            key: 'daily',
            counts: { ...dayCounts, charts: { ...dayCounts.charts, ...dailyUnitCharts(rawData, baseFilters, day) } },
            period: { prefix: 'ประจำวันที่', text: thaiDate(day) },
            chartPeriod: 'รายวัน'
        }
    ];
};
