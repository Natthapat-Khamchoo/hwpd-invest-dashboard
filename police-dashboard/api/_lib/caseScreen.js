// AI screen for the "เหตุการณ์ที่น่าสนใจ" section of the LINE morning report.
// Units pick an event type when they file a case (first filter); this asks the CIB model (gpt.cib.go.th,
// Open WebUI) which of the day's cases the commander should see and for a one-line summary of each.
// Env: CIB_AI_API_KEY; optional CIB_AI_MODEL (else the first model whose id contains "gemma4"),
//      CIB_AI_BASE_URL (default https://gpt.cib.go.th).
// Returns null when the key is unset or the call fails; the report then lists every case as filed.
import { candidateCases, caseId } from '../../src/lib/reportCutoff.js';

const MAX_PICKS = 5;
const MAX_LINE = 200;
const TIMEOUT_MS = 45_000;

const baseUrl = () => (process.env.CIB_AI_BASE_URL || 'https://gpt.cib.go.th').replace(/\/$/, '');

const callApi = async (path, init = {}) => {
    const res = await fetch(`${baseUrl()}${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.CIB_AI_API_KEY}`, ...init.headers },
        signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`CIB AI ${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return res.json();
};

const pickModel = async () => {
    if (process.env.CIB_AI_MODEL) return process.env.CIB_AI_MODEL;
    const ids = ((await callApi('/api/models')).data || []).map(m => m.id);
    const id = ids.find(i => /gemma-?4/i.test(i));
    if (!id) throw new Error(`No gemma4 model; available: ${ids.join(', ')}`);
    return id;
};

const PROMPT = `คุณเป็นนายตำรวจฝ่ายอำนวยการ บก.ทล. (ตำรวจทางหลวง) คัดเลือกเหตุการณ์ที่น่าสนใจประจำวันเพื่อรายงาน ผบก.ทล. ทาง LINE
เลือกไม่เกิน ${MAX_PICKS} เหตุที่สำคัญที่สุด เรียงจากสำคัญมากไปน้อย พิจารณาจาก ความร้ายแรงของคดี ปริมาณของกลาง ความสูญเสียต่อชีวิต และผลกระทบต่อสาธารณะ
ตัดเหตุที่เป็นงานประจำทั่วไป ซ้ำกัน หรือข้อมูลไม่พอ
เขียน line เป็นภาษาไทย 1 ประโยค ไม่เกิน ${MAX_LINE} ตัวอักษร ระบุ สิ่งที่เกิด สถานที่ และตัวเลขสำคัญ ห้ามใส่ชื่อหน่วย (ระบบเติมให้) ห้ามแต่งข้อมูลที่ไม่มีในต้นฉบับ
ตอบเป็น JSON อย่างเดียว รูปแบบ {"picks":[{"id":"<id>","line":"<สรุป>","reason":"<เหตุผลสั้นๆ>"}]}`;

// Only the fields the model needs; no names of officers or suspects are sent
const caseForModel = (c) => ({
    id: caseId(c), type: c.event_type, time: c.event_time, location: c.location,
    suspects: c.suspects, seized: c.seized, summary: String(c.summary).trim(),
});

const parseJson = (text) => {
    const m = /\{[\s\S]*\}/.exec(String(text ?? ''));
    if (!m) throw new Error(`Model did not return JSON: ${String(text).slice(0, 200)}`);
    return JSON.parse(m[0]);
};

// tables: the snapshot tabs ({ cols, rows }); day: report day as a local Date.
// Returns { model, table } where table is the cases_ai tab to store in the snapshot, or { error }.
export const screenCases = async (tables, day) => {
    if (!process.env.CIB_AI_API_KEY) return { error: 'CIB_AI_API_KEY is not set' };
    const { cols = [], rows = [] } = tables.cases || {};
    const cases = candidateCases(rows.map(r => Object.fromEntries(cols.map((c, i) => [c, r[i]]))), day);
    if (!cases.length) return { error: 'no cases' };
    if (cases.some(c => !caseId(c))) return { error: 'a case has no CaseID' };
    try {
        const model = await pickModel();
        const json = await callApi('/api/chat/completions', {
            method: 'POST',
            body: JSON.stringify({
                model, stream: false, temperature: 0.2,
                messages: [
                    { role: 'system', content: PROMPT },
                    { role: 'user', content: JSON.stringify(cases.map(caseForModel)) },
                ],
            }),
        });
        const ids = new Set(cases.map(caseId));
        const seen = new Set();
        const picks = (parseJson(json.choices?.[0]?.message?.content).picks || [])
            .map(p => ({ id: String(p.id ?? '').trim(), line: String(p.line ?? '').trim().slice(0, MAX_LINE), reason: String(p.reason ?? '').trim() }))
            .filter(p => ids.has(p.id) && !seen.has(p.id) && seen.add(p.id))
            .slice(0, MAX_PICKS);
        return { model, considered: cases.length, table: { cols: ['CaseID', 'line', 'reason'], rows: picks.map(p => [p.id, p.line, p.reason]) } };
    } catch (err) {
        console.error('Case screen failed:', err);
        return { error: err.message };
    }
};
