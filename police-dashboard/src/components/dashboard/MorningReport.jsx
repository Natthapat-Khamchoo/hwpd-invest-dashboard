import React from 'react';
import { REPORT_WIDTH, REPORT_HEIGHT } from './OnePageReport';

// 1920x1080 morning report image ("Export รายงานเช้า" and the LINE bot).
// Layout and values follow the design mockup "สรุปรายวัน 8 ต.ค. 69 (16 9)".

const INK = '#111322';
const MUTED = '#4F5268';
const NAVY = '#24208C';
const VIOLET = '#6E6AE6';
const YELLOW = '#FFC81E';
const SILVER = '#B8BCCB';
const RULE = '#C9CBD6';
const CARD = {
    background: '#F8F8FA', border: '3px solid #2F35A8', borderRadius: 28,
    boxShadow: '0 10px 28px rgba(20, 20, 80, 0.12)', padding: 24, boxSizing: 'border-box'
};
const FONT = "'Prompt', sans-serif";

const fmt = (v) => Math.round(v || 0).toLocaleString();

// Rough Prompt text width, good enough to decide what fits on a line
const COMBINING = /[ัิ-ฺ็-๎]/;
const textWidth = (str, size) => [...String(str)].reduce((w, ch) =>
    w + (COMBINING.test(ch) ? 0 : ch === ' ' ? 0.26 : /[\d,.]/.test(ch) ? 0.54 : 0.55), 0) * size;

const FLAGRANT_LABELS = {
    drugs: 'ยาเสพติด', gun: 'อาวุธปืน', immig: 'คนเข้าเมือง', customs: 'ศุลกากร', disease: 'โรคติดต่อ',
    transport: 'ขนส่ง', doc: 'ปลอมเอกสาร', property: 'ทรัพย์', sex: 'เพศ', weight: 'รถหนัก',
    drunk: 'เมาแล้วขับ', life: 'ชีวิต/ร่างกาย', com: 'ฉ้อโกงออนไลน์', other: 'อื่นๆ'
};

const TRAFFIC_LABELS = [
    ['trafficSpeed', 'ขับเร็ว'], ['trafficLight', 'ฝ่าไฟแดง'], ['trafficSign', 'ฝ่าป้าย'],
    ['trafficNotKeepLeft', 'ไม่ชิดซ้าย'], ['trafficNotCovered', 'ไม่ปกคลุม'], ['trafficModify', 'ดัดแปลงรถ'],
    ['trafficNoPart', 'ส่วนควบไม่ครบ'], ['trafficTax', 'ขาดภาษี/พ.ร.บ.'], ['trafficNoPlate', 'ไม่ติดป้ายทะเบียน'],
    // traf_other is the form's own "อื่นๆ" choice; the sheet has no finer detail for it
    ['trafficGeneral', 'อื่นๆ']
];
// One color per traffic category, largest first
const TRAFFIC_COLORS = [NAVY, VIOLET, YELLOW, '#3A33D6', '#A9A6F2', '#E0A800', '#0E0D35', '#FFE48A', '#8A8DA3', SILVER];

// "ต่ำกว่าเฉลี่ยเดือนนี้ (23 ราย/วัน)" on the daily image, "เฉลี่ย 23 ราย/วัน" on the month-to-date one
const compareText = (mode, value, avg) => {
    if (mode === 'average') return `เฉลี่ย ${fmt(avg)} ราย/วัน`;
    if (mode !== 'vsAverage') return null;
    const diff = value - avg;
    const word = Math.abs(diff) < 0.5 ? 'เท่ากับ' : diff > 0 ? 'สูงกว่า' : 'ต่ำกว่า';
    return `${word}เฉลี่ยเดือนนี้ (${fmt(avg)} ราย/วัน)`;
};

const CardHeader = ({ title, note }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, height: 56, flexShrink: 0 }}>
        <span style={{ fontSize: 40, fontWeight: 700, whiteSpace: 'nowrap' }}>{title}</span>
        {note && <span style={{ fontSize: 26, color: MUTED, whiteSpace: 'nowrap' }}>{note}</span>}
    </div>
);

// Ring of stroke-dasharray arcs, clockwise from 12 o'clock, total in the middle
const Donut = ({ slices, total, size = 270 }) => {
    const c = size / 2, r = 107, w = 36, circ = 2 * Math.PI * r;
    const sum = slices.reduce((s, x) => s + x.value, 0);
    let start = 0;
    const totalText = fmt(total);
    const totalSize = totalText.length > 5 ? 46 : totalText.length > 4 ? 56 : 76;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
            <circle cx={c} cy={c} r={r} fill="none" stroke="#E3E4EC" strokeWidth={w} />
            {sum > 0 && slices.filter(s => s.value > 0).map(s => {
                const len = (s.value / sum) * circ;
                const el = (
                    <circle key={s.label} cx={c} cy={c} r={r} fill="none" stroke={s.color} strokeWidth={w}
                        strokeDasharray={`${len} ${circ}`} transform={`rotate(${-90 + (start / circ) * 360} ${c} ${c})`} />
                );
                start += len;
                return el;
            })}
            <text x={c} y={c + totalSize * 0.22} textAnchor="middle" fontFamily={FONT} fontSize={totalSize} fontWeight="700" fill={INK}>{totalText}</text>
            <text x={c} y={c + totalSize * 0.22 + 40} textAnchor="middle" fontFamily={FONT} fontSize="30" fontWeight="500" fill={MUTED}>ราย</text>
        </svg>
    );
};

const Swatch = ({ color, size = 30 }) => (
    <span style={{ width: size, height: size, borderRadius: 8, background: color, flexShrink: 0 }} />
);

const LegendRow = ({ color, label, value, labelSize = 32, valueSize = 46 }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Swatch color={color} size={Math.min(30, labelSize)} />
        <span style={{ fontSize: labelSize, fontWeight: 500, flexGrow: 1, whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontSize: valueSize, fontWeight: 700, lineHeight: 1.2 }}>{fmt(value)}</span>
    </div>
);

// Flagrant arrests split by offense; any gap between CRIM_FLAGRANTE and the dir_f_* columns shows as "ไม่ระบุ"
const flagrantItems = (c) => {
    const by = c.flagrantByOffense || {};
    const items = Object.keys(FLAGRANT_LABELS)
        .map(k => ({ label: FLAGRANT_LABELS[k], value: by[k] || 0 }))
        .filter(i => i.value > 0)
        .sort((a, b) => b.value - a.value);
    const gap = (c.flagrantTotal || 0) - items.reduce((s, i) => s + i.value, 0);
    if (gap > 0) items.push({ label: 'ไม่ระบุ', value: gap });
    return items;
};

const FlagrantBreakdown = ({ items, height }) => {
    const cols = items.length > 8 ? 3 : 2;
    const rows = Math.max(1, Math.ceil(items.length / cols));
    const rowGap = 8;
    const rowH = Math.min(52, (height - rowGap * (rows - 1)) / rows);
    const labelSize = Math.round(Math.min(26, rowH * 0.56));
    const valueSize = Math.round(Math.min(34, rowH * 0.72));
    if (!items.length) {
        return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: MUTED }}>ไม่มีการจับกุมความผิดซึ่งหน้า</div>;
    }
    return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: rowH, gap: `${rowGap}px 12px`, alignContent: 'start' }}>
            {items.map(i => (
                <div key={i.label} style={{ background: '#FFFFFF', borderRadius: 12, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: labelSize, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.label}</span>
                    <span style={{ fontSize: valueSize, fontWeight: 700 }}>{fmt(i.value)}</span>
                </div>
            ))}
        </div>
    );
};

// Grouped bars per กก. on one shared scale; the busiest กก. (by criminal count) gets a highlight band
const UnitBars = ({ units, width }) => {
    const height = 219, base = 175, maxBar = 130;
    const groupW = width / units.length;
    const max = Math.max(1, ...units.flatMap(u => [u.criminal, u.truck]));
    const top = Math.max(...units.map(u => u.criminal));
    const topIdx = top > 0 ? units.findIndex(u => u.criminal === top) : -1;
    const bar = (x, value, color) => {
        const label = fmt(value);
        const size = label.length > 3 ? 28 : 34;
        if (!value) {
            return (
                <g key={`${x}-${color}`}>
                    <rect x={x} y={base - 4} width="44" height="4" fill={RULE} />
                    <text x={x + 22} y={base - 14} fontSize="28" fill="#6B6E82">0</text>
                </g>
            );
        }
        const h = Math.max(8, (value / max) * maxBar);
        return (
            <g key={`${x}-${color}`}>
                <rect x={x} y={base - h} width="44" height={h} rx="6" fill={color} />
                <text x={x + 22} y={base - h - 10} fontSize={size} fill={INK}>{label}</text>
            </g>
        );
    };
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {topIdx >= 0 && <rect x={groupW * topIdx + groupW / 2 - 68} y="0" width="136" height={height} rx="16" fill="#E6E5FA" />}
            <line x1="0" y1={base} x2={width} y2={base} stroke={RULE} strokeWidth="2" />
            <g fontFamily={FONT} fontWeight="700" textAnchor="middle">
                {units.map((u, i) => {
                    const cx = groupW * i + groupW / 2;
                    return [bar(cx - 47, u.criminal, NAVY), bar(cx + 3, u.truck, YELLOW)];
                })}
            </g>
            <g fontFamily={FONT} fontSize="30" fontWeight="600" fill={INK} textAnchor="middle">
                {units.map((u, i) => <text key={u.name} x={groupW * i + groupW / 2} y="212">{u.name}</text>)}
            </g>
        </svg>
    );
};

// Bottom-right column: 337 high minus two 16px gaps -> 88 + 88 + 129
const StatCard = ({ children, height = 88 }) => (
    <div style={{ ...CARD, height, flexShrink: 0, borderRadius: 24, padding: '10px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        {children}
    </div>
);
const Unit = ({ children }) => <span style={{ fontSize: 28, color: MUTED }}>{children}</span>;
const Big = ({ children }) => <span style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.15 }}>{children}</span>;

const seizedItems = (c) => {
    const s = c.seized || {};
    const g = (group, key) => s[group]?.[key] || 0;
    return [
        ['ยาบ้า/ยาอี', g('drugs', 'yaba'), 'เม็ด'], ['ไอซ์', g('drugs', 'ice'), 'กรัม'],
        ['เคตามีน', g('drugs', 'ketamine'), 'กรัม'], ['โคเคน', g('drugs', 'other'), 'กรัม'],
        ['ปืนมีทะเบียน', g('guns', 'registered'), 'กระบอก'], ['ปืนไม่มีทะเบียน', g('guns', 'unregistered'), 'กระบอก'],
        ['กระสุน', g('guns', 'bullets'), 'นัด'], ['วัตถุระเบิด', g('guns', 'explosives'), 'ลูก'],
        ['รถยนต์', g('vehicles', 'car'), 'คัน'], ['จักรยานยนต์', g('vehicles', 'bike'), 'คัน'],
        ['เงินสด', g('others', 'money'), 'บาท'], ['บัญชี', g('others', 'account'), 'บัญชี'],
        ['โทรศัพท์', g('others', 'phone'), 'เครื่อง'], ['อุปกรณ์อิเล็กทรอนิกส์', g('others', 'electronics'), 'เครื่อง'],
        ['สินค้าหนีภาษี', g('others', 'dutyFree'), 'รายการ'],
        // "รายการอื่นๆ" is a choice in the items form; the sheet has no finer detail for it
        ['รายการอื่นๆ', g('others', 'items'), 'รายการ']
    ].filter(([, v]) => v > 0).map(([label, value, unit]) => ({ label, value, unit }));
};

// One item reads like the mockup ("รถยนต์ 1 คัน"); several wrap onto two smaller lines, overflow becomes "+N รายการ"
const SeizedCard = ({ items, width }) => {
    if (items.length <= 1) {
        const i = items[0];
        return (
            <StatCard height={129}>
                <span style={{ fontSize: 32, fontWeight: 700 }}>ของกลาง</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    {i ? <><Unit>{i.label}</Unit><Big>{fmt(i.value)}</Big><Unit>{i.unit}</Unit></> : <Unit>ไม่มี</Unit>}
                </div>
            </StatCard>
        );
    }
    const lineW = width - 62, gap = 20, moreW = 150;
    const itemW = (i) => textWidth(i.label, 22) + textWidth(fmt(i.value), 30) + textWidth(i.unit, 22) + 16;
    const shown = [];
    let line = 0, x = 0;
    for (const [idx, i] of items.entries()) {
        const w = itemW(i);
        const reserve = idx < items.length - 1 && line === 1 ? moreW : 0;
        if (x && x + w + reserve > lineW) { line += 1; x = 0; }
        if (line > 1 || (line === 1 && x + w + reserve > lineW)) break;
        shown.push(i);
        x += w + gap;
    }
    const more = items.length - shown.length;
    return (
        <div style={{ ...CARD, height: 129, flexShrink: 0, overflow: 'hidden', borderRadius: 24, padding: '10px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
            <span style={{ fontSize: 32, fontWeight: 700 }}>ของกลาง</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: gap, alignItems: 'baseline' }}>
                {shown.map(i => (
                    <span key={i.label} style={{ display: 'flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 22, color: MUTED }}>{i.label}</span>
                        <span style={{ fontSize: 30, fontWeight: 700 }}>{fmt(i.value)}</span>
                        <span style={{ fontSize: 22, color: MUTED }}>{i.unit}</span>
                    </span>
                ))}
                {more > 0 && <span style={{ fontSize: 22, color: MUTED }}>+{more} รายการ</span>}
            </div>
        </div>
    );
};

const MorningReport = ({ report, unitLabel }) => {
    const c = report.counts || {};
    const avg = report.average || {};

    // Every traffic category on its own row, largest first
    const trafficSlices = TRAFFIC_LABELS.map(([k, label]) => ({ label, value: c[k] || 0 }))
        .filter(t => t.value > 0).sort((a, b) => b.value - a.value)
        .map((t, i) => ({ ...t, color: TRAFFIC_COLORS[i] }));
    const trafficRowH = Math.min(72, 333 / Math.max(1, trafficSlices.length));
    const trafficLabelSize = Math.round(Math.min(32, trafficRowH * 0.62));
    const trafficValueSize = Math.round(Math.min(46, trafficRowH * 0.78));

    const flagrant = flagrantItems(c);

    // Vertical budget (px): header 126 · main padding 26+36 · title 64 · gaps 22+22 · bottom row 337 → top row 447
    const CRIM_W = 1000, RIGHT_COL_W = 600;
    const TOP_CONTENT_H = 447 - 6 - 48 - 56 - 4;
    const BREAKDOWN_H = TOP_CONTENT_H - 60 - 12 - 4 - 24 - 34 - 8;
    const chartW = REPORT_WIDTH - 88 - 28 - RIGHT_COL_W - 6 - 48;

    return (
        <div id="one-page-report" style={{
            position: 'relative', width: REPORT_WIDTH, height: REPORT_HEIGHT, boxSizing: 'border-box', background: '#ECEDF1',
            display: 'flex', flexDirection: 'column', fontFamily: FONT, color: INK, overflow: 'hidden'
        }}>
            <header style={{
                position: 'relative', height: 126, flexShrink: 0, background: 'linear-gradient(90deg, #3A33D6 0%, #1F1B86 45%, #0E0D35 100%)',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 44px', color: '#FFFFFF'
            }}>
                <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.25 }}>กองบังคับการตำรวจทางหลวง</div>
                <div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.25 }}>Highway Police Division</div>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 460, height: 64, background: '#FFD12B', clipPath: 'polygon(8% 0, 100% 0, 100% 100%, 0 100%)' }} />
                {/* Bundled copy of the logo: the LINE bot's headless renderer on Vercel cannot reach cib.go.th */}
                <img src="/report-logo.png" alt="ตราตำรวจทางหลวง" style={{ position: 'absolute', top: 8, right: 40, width: 150, height: 150, objectFit: 'contain' }} />
            </header>

            <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 22, padding: '26px 44px 36px', minHeight: 0 }}>
                <div style={{ height: 64, display: 'flex', alignItems: 'center', gap: 32, flexShrink: 0 }}>
                    <span style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{report.title}</span>
                    {unitLabel && <span style={{ fontSize: 30, color: MUTED, whiteSpace: 'nowrap' }}>{unitLabel}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: `${CRIM_W}px minmax(0, 1fr)`, gap: 28, height: 447, flexShrink: 0 }}>
                    <section style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <CardHeader title="จับกุมคดีอาญา" note={compareText(report.compare, c.criminalTotal || 0, avg.criminal)} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexGrow: 1 }}>
                            <Donut total={c.criminalTotal || 0} slices={[
                                { label: 'หมายจับ', value: c.warrantTotal || 0, color: NAVY },
                                { label: 'ซึ่งหน้า', value: c.flagrantTotal || 0, color: YELLOW }
                            ]} />
                            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                                <div style={{ height: 60, display: 'flex', alignItems: 'center', padding: '0 22px' }}>
                                    <div style={{ flexGrow: 1 }}><LegendRow color={NAVY} label="หมายจับ" value={c.warrantTotal} /></div>
                                </div>
                                <div style={{ background: '#FFF6D9', border: `2px solid ${YELLOW}`, borderRadius: 20, padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ height: 34, display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <Swatch color={YELLOW} />
                                        <span style={{ fontSize: 32, fontWeight: 500, flexGrow: 1 }}>ซึ่งหน้า <span style={{ fontSize: 24, color: MUTED }}>แยกตามฐานความผิด</span></span>
                                        <span style={{ fontSize: 46, fontWeight: 700, lineHeight: 1 }}>{fmt(c.flagrantTotal)}</span>
                                    </div>
                                    <FlagrantBreakdown items={flagrant} height={BREAKDOWN_H} />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <CardHeader title="จับกุมคดีจราจร" note={compareText(report.compare, c.trafficTotal || 0, avg.traffic)} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexGrow: 1 }}>
                            <Donut total={c.trafficTotal || 0} slices={trafficSlices} />
                            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                {trafficSlices.length
                                    ? trafficSlices.map(t => (
                                        <div key={t.label} style={{ height: trafficRowH, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <LegendRow {...t} labelSize={trafficLabelSize} valueSize={trafficValueSize} />
                                        </div>
                                    ))
                                    : <span style={{ fontSize: 28, color: MUTED }}>ไม่มีการจับกุม</span>}
                            </div>
                        </div>
                    </section>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: `minmax(0, 1fr) ${RIGHT_COL_W}px`, gap: 28, height: 337, flexShrink: 0 }}>
                    <section style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, height: 56 }}>
                            <span style={{ fontSize: 36, fontWeight: 700 }}>อาญา / รถน้ำหนักเกิน แยก กก.</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 30, fontWeight: 500 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Swatch color={NAVY} /><span>อาญา (ราย)</span></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Swatch color={YELLOW} /><span>รถหนัก (ราย)</span></div>
                            </div>
                        </div>
                        <UnitBars units={report.units || []} width={chartW} />
                    </section>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
                        <StatCard>
                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                                <span style={{ fontSize: 32, fontWeight: 700 }}>นำขบวน</span>
                                <span style={{ fontSize: 24, color: MUTED, whiteSpace: 'nowrap' }}>รวม {fmt(c.convoyTotal)} ขบวน</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                <Unit>ทั่วไป</Unit><Big>{fmt(c.convoyGeneral)}</Big>
                                <span style={{ width: 2, height: 40, background: RULE, margin: '0 8px', alignSelf: 'center' }} />
                                <Unit>ถปภ.</Unit><Big>{fmt(c.convoyRoyal)}</Big>
                            </div>
                        </StatCard>
                        <StatCard>
                            <span style={{ fontSize: 32, fontWeight: 700 }}>บริการประชาชน</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><Big>{fmt(c.serviceTotal)}</Big><Unit>ครั้ง</Unit></div>
                        </StatCard>
                        <SeizedCard items={seizedItems(c)} width={RIGHT_COL_W} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MorningReport;
