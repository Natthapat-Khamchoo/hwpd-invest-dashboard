// Morning report data: shared by the dashboard's "Export รายงานเช้า" button and the LINE bot page.
import { calculateDashboardStats } from '../services/GoogleSheetService';
import { UNIT_HIERARCHY } from '../utils/helpers';

export const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
export const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export const thaiDate = (d) => `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
export const reportFileName = (period) => `ผลการปฏิบัติ บก.ทล. ${period.prefix} ${period.text}`;

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
// Each carries the month-to-date daily average so the report can compare against it.
export const buildMorningReports = (rawData, baseFilters, day) => {
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
