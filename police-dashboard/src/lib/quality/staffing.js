// สถิติแยกรายสถานี 1 ต.ค.69 (กก.1–7 as of 1 Oct 2026; กก.8 as of 8 Jun 2026, investigators included).
// Head counts only: rate = อัตรา, commissionedPrevention = ตำแหน่งสัญญาบัตรป้องกันปราบปราม, held = คนครอง.
const staff = (rate, commissionedPrevention, held) => ({ rate, commissionedPrevention, held });

export const STAFFING = {
    '1-1': staff(104, 9, 95), '1-2': staff(77, 7, 65), '1-3': staff(34, 4, 32), '1-4': staff(40, 5, 36), '1-5': staff(34, 4, 33), '1-6': staff(39, 4, 36),
    '2-1': staff(117, 9, 108), '2-2': staff(62, 7, 58), '2-3': staff(50, 6, 48), '2-4': staff(34, 4, 32), '2-5': staff(35, 5, 35), '2-6': staff(44, 4, 38),
    '3-1': staff(85, 9, 73), '3-2': staff(83, 6, 66), '3-3': staff(34, 4, 24), '3-4': staff(34, 4, 24), '3-5': staff(34, 4, 28),
    '4-1': staff(40, 5, 37), '4-2': staff(41, 6, 38), '4-3': staff(46, 6, 39), '4-4': staff(34, 4, 32), '4-5': staff(34, 4, 32),
    '5-1': staff(45, 5, 44), '5-2': staff(34, 4, 34), '5-3': staff(35, 5, 33), '5-4': staff(46, 6, 45), '5-5': staff(35, 5, 32), '5-6': staff(34, 4, 33),
    '6-1': staff(91, 6, 81), '6-2': staff(34, 4, 33), '6-3': staff(34, 4, 29), '6-4': staff(41, 6, 39), '6-5': staff(34, 4, 32), '6-6': staff(34, 4, 29),
    '7-1': staff(35, 5, 33), '7-2': staff(34, 4, 32), '7-3': staff(41, 6, 37), '7-4': staff(34, 4, 32), '7-5': staff(57, 7, 53),
    '8-1': staff(113, 6, 94), '8-2': staff(97, 6, 84), '8-3': staff(118, 8, 28), '8-4': staff(82, 7, 35),
};

// The date each staffing figure is as of; กก.8 is older because its figure was taken before the 1 Oct count
export const STAFFING_AS_OF = { default: new Date(2026, 9, 1), '8': new Date(2026, 5, 8) };
export const staffingDateOf = (kk) => STAFFING_AS_OF[kk] ?? STAFFING_AS_OF.default;

// A station whose head is สวญ. has at least 5 commissioned prevention posts; the rest are headed by สว.
const LARGE_MIN_COMMISSIONED = 5;
export const stationGroupOf = (key) => (STAFFING[key].commissionedPrevention >= LARGE_MIN_COMMISSIONED ? 'large' : 'small');

export const STATION_GROUPS = [
    { id: 'large', label: 'ส.ทล. ขนาดใหญ่ (สวญ.)' },
    { id: 'small', label: 'ส.ทล. ขนาดเล็ก (สว.)' },
];
