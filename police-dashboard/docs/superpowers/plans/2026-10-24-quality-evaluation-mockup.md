# Quality Evaluation Mockup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Quality Score" tab to police-dashboard that scores work quality on 5 weighted dimensions and lets the viewer drill down บก.ทล. → กก. → ส.ทล. → บุคคล.

**Architecture:** A pure, dependency-free scoring library in `src/lib/quality/` turns the existing Google Sheets `rawData` into per-station raw counts, adds deterministic mock data (manpower, case approval, shifts, individuals), scores every level, and returns one model object. React components in `src/components/dashboard/quality/` render that model. `App.jsx` gets one new tab.

**Tech Stack:** React 19, Tailwind 3, recharts 3, lucide-react, Vite 7. Library tests use Node's built-in `node:test` (no new dependencies).

**Spec (agreed with the user, 2026-10-24):**
- 5 dimensions, same set at every level, weights: ผลงานปราบปราม 35 / คุณภาพคดี 20 / ถนนปลอดภัย 20 / บริการและภาพลักษณ์ 10 / วินัยและความพร้อม 15 (total 100).
- ผลงานปราบปราม = criminal arrests only (warrants, flagrant arrests, drugs by tier). ถนนปลอดภัย = enforcement only: tickets (points per ticket) + truck-overweight and drunk-driving arrests. No item counts in both.
- Count dimensions are divided by manpower, then scaled against the P90 of peers at the same level (P90 or above = 100, others proportional). Comparison with the unit's own previous month is shown as a delta, not scored.
- Grades: ดีเยี่ยม ≥ 90 / ดี 75–89.9 / พอใช้ 60–74.9 / ต้องปรับปรุง < 60.
- Periods: this month to date (with delta vs previous full month) and fiscal year to date (from 1 ต.ค.).
- Real sheet data for arrests, tickets, service, convoy, volunteer and report submission days. Mock (labelled "ข้อมูลสมมติ" in the UI): manpower, case approval rate, shift data, all individuals.
- Navigation: drill-down with breadcrumb. Individuals are ranked only within their own ส.ทล.
- Point values (from the user's scoring settings screen): ticket 1 per ticket for พ.ร.บ.ขนส่ง / รถยนต์ / จราจร; warrant 10; flagrant general 10; flagrant gun 15; flagrant forged document 20; ยาบ้า tiers ≤20 / ≤100 / >100 pills = 5 / 10 / 15; ไอซ์ tiers ≤5 / ≤50 / >50 g = 5 / 10 / 15; other drug 10 per case; no evidence / user 3 per case; several drug types → highest tier; convoy 2; help/accident 1; volunteer 2.

## Global Constraints

- No new npm dependencies. Do not commit; the user reviews the mockup first.
- Files under `src/lib/quality/` import nothing outside `src/lib/quality/` and always use explicit `.js` extensions, so `node --test` can run them.
- All UI copy is Thai. Icons from lucide-react only, no emoji.
- Every UI element showing mock data carries the `MockTag` chip ("ข้อมูลสมมติ").
- Support both themes through the `isDarkMode` prop, matching `RankingView.jsx` (dark: `glass-liquid`, `text-white`, `text-slate-300/400`; light: `bg-white border-slate-200`, `text-slate-900`, muted text no lighter than `text-slate-600`).
- Grade tones: ดีเยี่ยม emerald, ดี sky, พอใช้ amber, ต้องปรับปรุง rose. Grade is always shown as text too, never by color alone.
- Clickable rows/buttons: `cursor-pointer`, visible `focus-visible:ring-2`, min height 44px, `transition-colors duration-200`, no scale-on-hover.
- Must work at 375px width without horizontal page scroll; wide tables sit in `overflow-x-auto`.

## Review Focus

1. Empty or partial `rawData` (`{}`, a tab missing, a tab empty during the first load) must give finite scores (0), never `NaN` or a crash. Test in Task 2.
2. Sheet dates in Buddhist-era years (`05/10/2569`) or ISO form must parse to the same day. Test in Task 1.
3. Rows whose `station` names only a กก. (no ส.ทล. number) must be ignored, not create a bogus station. Test in Task 1.
4. The 1st day of a month (period of 1 day) and October (month and fiscal-year periods identical) must not divide by zero. Test in Task 2.
5. Light mode contrast and 375px layout of tables/radar. Checked by the controller in a browser after Task 4.

---

### Task 1: Scoring config and per-station raw aggregation

**Files:**
- Create: `src/lib/quality/scoringConfig.js`
- Create: `src/lib/quality/stationRaw.js`
- Test: `src/lib/quality/stationRaw.test.js`, fixture in `src/lib/quality/testFixture.js` (exports `rawData`)

**Interfaces:**
- Produces (`scoringConfig.js`):
  - `STATIONS_PER_DIVISION = { "1": 6, "2": 6, "3": 5, "4": 5, "5": 6, "6": 6, "7": 5, "8": 4 }` (comment: mirrors `UNIT_HIERARCHY` in `src/utils/helpers.js`, copied so this folder stays importable from Node).
  - `POINTS = { ticket: { transport: 1, vehicle: 1, traffic: 1 }, warrant: 10, flagrantGeneral: 10, flagrantByOffense: { gun: 15, doc: 20 }, drug: { yaba: [20, 100], ice: [5, 50], tierPoints: [5, 10, 15], otherDrug: 10, noEvidence: 3 }, service: { convoy: 2, help: 1, traffic: 1, volunteer: 2 } }`
  - `TICKET_COLUMNS = { transport: ['traf_cover', 'traf_part'], vehicle: ['traf_modify', 'traf_tax', 'traf_plate'], traffic: ['traf_left', 'traf_sign', 'traf_light', 'traf_speed', 'traf_other'] }`
  - `SUPPRESSION_OFFENSES = ['drugs', 'gun', 'immig', 'customs', 'disease', 'transport', 'doc', 'property', 'sex', 'life', 'com', 'other']`, `ROAD_OFFENSES = ['weight', 'drunk']` (sheet column = `dir_f_<key>`).
  - `DIMENSIONS = [{ id: 'suppression', label: 'ผลงานปราบปราม', weight: 35, kind: 'count' }, { id: 'caseQuality', label: 'คุณภาพคดี', weight: 20, kind: 'ratio' }, { id: 'roadSafety', label: 'ถนนปลอดภัย', weight: 20, kind: 'count' }, { id: 'service', label: 'บริการและภาพลักษณ์', weight: 10, kind: 'count' }, { id: 'discipline', label: 'วินัยและความพร้อม', weight: 15, kind: 'ratio' }]`
  - `GRADES = [{ min: 90, label: 'ดีเยี่ยม', tone: 'emerald' }, { min: 75, label: 'ดี', tone: 'sky' }, { min: 60, label: 'พอใช้', tone: 'amber' }, { min: 0, label: 'ต้องปรับปรุง', tone: 'rose' }]`
- Produces (`stationRaw.js`):
  - `parseSheetDate(value: string|number|null) -> Date|null` — accepts `D/M/YYYY` (also `.`/`-` separators) and `YYYY-MM-DD`; a year > 2400 is Buddhist era, subtract 543; returns local-midnight `Date`.
  - `stationKeyOf(row) -> string|null` — reads `row.station || row.subDiv`; kk from `/(?:กก\.?|กองกำกับการ)\s*(\d+)/`, stl from `/(?:ส\.?ทล\.?|สถานีตำรวจทางหลวง)\s*(\d+)/`; returns `` `${kk}-${stl}` `` only when both are found and the pair exists in `STATIONS_PER_DIVISION`.
  - `pointsPerDrugCase(yabaPills: number, iceGrams: number, hasOtherDrug: boolean) -> number` — tier per drug from `POINTS.drug` (0 when amount is 0), take the max; if max is 0 → `otherDrug` when `hasOtherDrug`, else `noEvidence`.
  - `emptyStationRaw() -> StationRaw` where `StationRaw = { warrants, flagrant: { [each SUPPRESSION_OFFENSES and ROAD_OFFENSES key]: number }, drugCasePoints, majorCases, tickets: { transport, vehicle, traffic }, convoy, serviceHelp, serviceTraffic, volunteer, reportDays, activeDays }` all zero.
  - `aggregateStationRaw(rawData: object, start: Date, end: Date) -> Record<stationKey, StationRaw>` — contains every station in `STATIONS_PER_DIVISION` (43 keys), zero-filled.

Aggregation rules (rows outside `[start, end]` inclusive by day, or without a station key, are skipped; missing tabs are treated as empty arrays):
- `crime`: warrants += `CRIM_W_BIGDATA + CRIM_W_BODYWARN + CRIM_W_GENERAL`. `dir_f_*` offense counts are added only when `CRIM_FLAGRANTE > 0` (same rule as `flagrantOffense` in `GoogleSheetService.js`). Each crime row's date counts toward `reportDays` (distinct dates).
- Drugs, per station-day: sum `items` rows of that station and date: `ยาบ้า`/`ยาอี` → yaba pills, `ไอซ์` → ice grams, `เคตามีน`/`โคเคน` → other drug. With d = that day's `dir_f_drugs`, avg yaba = pills/d, avg ice = grams/d; `drugCasePoints += d * pointsPerDrugCase(...)`.
- `majorCases` = gun + doc offenses + drug cases whose per-case points ≥ 10.
- `traffic`: tickets by `TICKET_COLUMNS`. `convoy`: `convoy_royal + convoy_route + convoy_vip + convoy_safety`. `service`: `service_help` → serviceHelp, `service_traffic` → serviceTraffic. `volunteer`: `volunteer_task`.
- `activeDays` = distinct dates on which that station had any arrest (warrant or flagrant) or ticket > 0.

- [ ] **Step 1: Write the failing tests** in `src/lib/quality/stationRaw.test.js` (`import { test } from 'node:test'; import assert from 'node:assert/strict';`):
  - `parseSheetDate`: `'05/10/2026'`, `'2026-10-05'`, `'05/10/2569'` all equal `new Date(2026, 9, 5)`; `''` and `null` → `null`.
  - `stationKeyOf`: `{ station: 'ส.ทล.3 กก.2 บก.ทล.' }` → `'2-3'`; `{ station: 'กก.2 บก.ทล.' }` → `null`; `{ station: 'ส.ทล.9 กก.8' }` → `null` (กก.8 has 4 stations).
  - `pointsPerDrugCase`: `(15,0,false)`→5, `(21,0,false)`→10, `(101,0,false)`→15, `(0,6,false)`→10, `(10,60,false)`→15, `(0,0,true)`→10, `(0,0,false)`→3.
  - `aggregateStationRaw` with this fixture (`testFixture.js`, `export const rawData`) and range 2026-10-01..2026-10-24:
    ```js
    const rawData = {
      crime: [
        { date: '03/10/2026', station: 'ส.ทล.1 กก.1', CRIM_FLAGRANTE: 3, dir_f_drugs: 1, dir_f_gun: 1, dir_f_weight: 1, CRIM_W_BIGDATA: 2 },
        { date: '04/10/2026', station: 'ส.ทล.1 กก.1', CRIM_FLAGRANTE: 0, dir_f_gun: 5 },
        { date: '30/09/2026', station: 'ส.ทล.1 กก.1', CRIM_W_GENERAL: 9 },
        { date: '03/10/2026', station: 'กก.1 บก.ทล.', CRIM_W_GENERAL: 4 },
      ],
      items: [{ date: '03/10/2026', station: 'ส.ทล.1 กก.1', item_name: 'ยาบ้า', amount: 50 }],
      traffic: [{ date: '05/10/2026', station: 'ส.ทล.1 กก.1', traf_speed: 4, traf_tax: 2, traf_cover: 1 }],
      convoy: [{ date: '05/10/2026', station: 'ส.ทล.1 กก.1', convoy_royal: 1 }],
      service: [{ date: '05/10/2026', station: 'ส.ทล.1 กก.1', service_help: 2 }],
      volunteer: [{ date: '05/10/2026', station: 'ส.ทล.1 กก.1', volunteer_task: 1 }],
    };
    ```
    Expect `Object.keys(result).length === 43`; `result['1-1']`: `warrants 2`, `flagrant.gun 1`, `flagrant.weight 1`, `flagrant.drugs 1`, `drugCasePoints 10`, `majorCases 2`, `tickets { transport: 1, vehicle: 2, traffic: 4 }`, `convoy 1`, `serviceHelp 2`, `volunteer 1`, `reportDays 2`, `activeDays 2`; `result['8-4']` deep-equals `emptyStationRaw()`.
  - `aggregateStationRaw({}, start, end)['1-1']` deep-equals `emptyStationRaw()`.

- [ ] **Step 2: Run to verify failure**
  Run: `node --test "src/lib/quality/*.test.js"`
  Expected: FAIL (module not found).

- [ ] **Step 3: Implement `scoringConfig.js` and `stationRaw.js`** with the exports above.

- [ ] **Step 4: Run to verify pass**
  Run: `node --test "src/lib/quality/*.test.js"` → all pass. Then `npx eslint src/lib/quality` → no errors.

---

### Task 2: Scoring, mock data and the quality model

**Files:**
- Create: `src/lib/quality/score.js`
- Create: `src/lib/quality/mockData.js`
- Create: `src/lib/quality/buildQualityModel.js`
- Test: `src/lib/quality/score.test.js`

**Interfaces:**
- Consumes: everything Task 1 produces.
- Produces (`score.js`):
  - `rawDimensions(raw: StationRaw, ctx: { manpower, approvalRate, shiftMissRate, periodDays }) -> { suppression, caseQuality, roadSafety, service, discipline }`
    - suppression = (warrants·10 + Σ non-drug SUPPRESSION_OFFENSES·(gun 15, doc 20, else 10) + drugCasePoints) / manpower
    - roadSafety = (Σ tickets·1 + (weight + drunk)·10) / manpower
    - service = (convoy·2 + serviceHelp·1 + serviceTraffic·1 + volunteer·2) / manpower
    - caseQuality = 0.6·approvalRate + 0.4·majorShare, majorShare = min(1, majorCases / totalArrests), 0 when totalArrests = 0 (totalArrests = warrants + all flagrant offenses)
    - discipline = 0.6·min(1, reportDays / periodDays) + 0.4·(1 − shiftMissRate)
    - manpower or periodDays of 0 must not produce NaN/Infinity (treat the quotient as 0).
  - `percentile(values: number[], p: number) -> number` — linear interpolation on the sorted copy; `[]` → 0.
  - `gradeFor(total: number) -> { min, label, tone }` from `GRADES`.
  - `scoreGroup(items: Array<{ id, dims }>) -> Array<{ id, dims, dimScores, total, grade }>` — count dims: `p90 > 0 ? min(100, v / p90 · 100) : 0`; ratio dims: `v · 100`; `total = Σ weight · score / 100` rounded to 1 decimal; input order kept.
- Produces (`mockData.js`), all deterministic from the station key via a seeded PRNG (mulberry32 over a string hash):
  - `stationProfile(key) -> { manpower: int 20–45, approvalRate: 0.70–0.98, shiftMissRate: 0–0.08, shifts: 90, shiftsWithoutResult: int 0–15 }`
  - `mockPeople(key, raw: StationRaw, profile) -> Array<{ id, rank, name, share, raw: StationRaw, approvalRate, shiftMissRate, missedShifts }>` — exactly 8 people; random shares summing to 1; each person's numeric raw fields = station field × share (not rounded); `reportDays`/`activeDays` copied from the station; fictional names built from fixed Thai given-name and surname lists, ranks from `['ร.ต.อ.', 'ด.ต.', 'จ.ส.ต.', 'ส.ต.อ.', 'ส.ต.ท.']`; `id` = `` `${key}-p${i + 1}` ``.
- Produces (`buildQualityModel.js`):
  - `periodRange(kind: 'month'|'fy', today: Date) -> { start, end, days }` — month: 1st of today's month; fy: 1 ต.ค. of `month >= 9 ? year : year - 1`; `end` = today; `days` = inclusive day count.
  - `previousMonthRange(today: Date) -> { start, end, days }` — full previous calendar month.
  - `buildQualityModel(rawData: object, kind: 'month'|'fy', today = new Date()) -> QualityModel`:
    ```
    QualityModel = {
      period: { kind, start, end, days },
      hq: { total, grade, dimScores, delta, manpower, best: {kk,total}, worst: {kk,total}, gradeCounts: { [label]: n } },
      divisions: [{ kk, name: 'กก.N', total, grade, dimScores, delta, manpower, stationCount, watchCount }],   // kk '1'..'8'
      stations: [{ key, kk, stl, name: 'ส.ทล.S กก.K', total, grade, dimScores, dims, raw, profile, delta, consistency, watch }],
      people: { [stationKey]: [{ id, rank, name, total, grade, dimScores, raw, placing, diversity, missedShifts }] }, // sorted by total desc, placing 1..8
      averages: { hq: dimScores, division: { [kk]: dimScores }, station: { [key]: dimScores of its people averaged } },
    }
    ```
    - Stations: `rawDimensions` with the station profile, then `scoreGroup` across all 43.
    - Divisions: count dims = Σ station points ÷ Σ manpower (equivalently, rawDimensions on the summed raw with summed manpower); ratio dims = manpower-weighted mean of station ratio dims; `scoreGroup` across the 8.
    - HQ: manpower-weighted mean of division `total` and `dimScores`; grade from that total; `gradeCounts` over the 43 stations; best/worst division by total.
    - People: `rawDimensions` with `manpower: 1`, the person's approval/miss rates and the station's `periodDays`; `scoreGroup` within the station only. `diversity` = number of non-zero groups among [warrants, suppression flagrant, tickets, road arrests, service + convoy + volunteer] (0–5). `missedShifts` = round(shiftMissRate × 22).
    - `delta` (stations, divisions, hq) = this total − total computed the same way for `previousMonthRange(today)`, rounded to 1 decimal, only when `kind === 'month'`; otherwise `null`.
    - `consistency` = activeDays / days (0 when days is 0). `watch` = grade label `'ต้องปรับปรุง'` or `delta <= -10`. Division `watchCount` = its stations with `watch`.

- [ ] **Step 1: Write the failing tests** in `src/lib/quality/score.test.js`:
  - `percentile([0,1,2,3,4,5,6,7,8,9,10], 0.9)` → 9; `percentile([], 0.9)` → 0.
  - `scoreGroup` over 11 items whose `dims.suppression` is 0..10 and other dims 0: item with 10 → `dimScores.suppression` 100, with 9 → 100, with 3 → closeTo 33.3, with 0 → 0. An item with `caseQuality: 0.8` → `dimScores.caseQuality` 80.
  - Item with every count dim at the group max and both ratio dims 1 → `total` 100, `grade.label` `'ดีเยี่ยม'`. `gradeFor(89.9).label` `'ดี'`, `gradeFor(60).label` `'พอใช้'`, `gradeFor(59.9).label` `'ต้องปรับปรุง'`.
  - `rawDimensions(result['1-1'] from Task 1's fixture, { manpower: 10, approvalRate: 0.9, shiftMissRate: 0.05, periodDays: 4 })` → suppression 4.5, roadSafety 1.7, service 0.6, caseQuality closeTo 0.70, discipline closeTo 0.68 (`rawData` from `testFixture.js`).
  - `rawDimensions(emptyStationRaw(), { manpower: 0, approvalRate: 0.9, shiftMissRate: 0, periodDays: 0 })` → every value finite.
  - `periodRange('fy', new Date(2026, 9, 24)).start` and `periodRange('fy', new Date(2027, 2, 15)).start` both equal `new Date(2026, 9, 1)`; `periodRange('month', new Date(2026, 9, 24)).days` → 24; `periodRange('month', new Date(2026, 9, 1)).days` → 1; `previousMonthRange(new Date(2026, 9, 24))` → start `new Date(2026, 8, 1)`, days 30.
  - `stationProfile('1-1')` deep-equals a second call; manpower within 20–45.
  - `buildQualityModel(fixture, 'month', new Date(2026, 9, 24))`: `divisions.length` 8, `stations.length` 43, `people['1-1'].length` 8 with `placing` 1..8 and totals non-increasing, `hq.total` between 0 and 100, `stations[0].delta` is a number.
  - `buildQualityModel({}, 'fy', new Date(2026, 9, 1))`: every station `total` is `Number.isFinite` and every `delta` is `null`.

- [ ] **Step 2: Run to verify failure**
  Run: `node --test "src/lib/quality/*.test.js"` → the new tests FAIL (modules not found).

- [ ] **Step 3: Implement `score.js`, `mockData.js`, `buildQualityModel.js`** with the signatures above.

- [ ] **Step 4: Run to verify pass**
  Run: `node --test "src/lib/quality/*.test.js"` → all pass. `npx eslint src/lib/quality` → no errors.

---

### Task 3: Quality tab shell, บก.ทล. and กก. views

**Files:**
- Create: `src/components/dashboard/quality/QualityParts.jsx`
- Create: `src/components/dashboard/quality/QualityView.jsx`
- Create: `src/components/dashboard/quality/HQPanel.jsx`
- Create: `src/components/dashboard/quality/DivisionPanel.jsx`
- Modify: `src/App.jsx` (imports at lines 2–7 and 20–22; tab lists at lines 74 and 131; sidebar list at lines 365–368; render block after line 614)

**Interfaces:**
- Consumes: `buildQualityModel`, `DIMENSIONS`, `GRADES` from Tasks 1–2.
- Produces (`QualityParts.jsx`, named exports, every component takes `isDarkMode`):
  - `GradeBadge({ grade, isDarkMode })` — pill with `grade.label`, tone colors from `grade.tone`.
  - `ScoreRing({ score, grade, size = 120, isDarkMode })` — SVG ring 0–100 in the grade tone, score number in the middle.
  - `DimensionBars({ dimScores, compare, compareLabel, isDarkMode })` — one row per `DIMENSIONS` entry: label, "น้ำหนัก N", bar 0–100, score; optional `compare` drawn as a marker line with `compareLabel` in a legend.
  - `DimensionRadar({ dimScores, compare, label, compareLabel, isDarkMode })` — recharts `RadarChart` in a `ResponsiveContainer` height 260.
  - `DeltaTag({ delta })` — `null` renders nothing; ▲/▼ via lucide `TrendingUp`/`TrendingDown`, text "+3.2 จากเดือนก่อน".
  - `MockTag()` — small amber chip "ข้อมูลสมมติ".
  - `Panel({ title, icon: Icon, action, children, isDarkMode })` — card wrapper (dark `glass-liquid rounded-xl`, light `bg-white border border-slate-200 rounded-xl shadow-sm`), padding `p-4 sm:p-6`.
- Produces (`QualityView.jsx`, default export): `QualityView({ rawData, isDarkMode })`. State: `period` (`'month' | 'fy'`, default `'month'`), `nav` `{ level: 'hq' | 'division' | 'station' | 'person', kk, stationKey, personId }`. `model = useMemo(() => buildQualityModel(rawData || {}, period), [rawData, period])`. Renders: heading "ประเมินคุณภาพงาน" with lucide `ClipboardCheck`; an amber notice "Mockup: กำลังพล คุณภาพคดี ข้อมูลผลัด และข้อมูลรายบุคคลเป็นข้อมูลสมมติ ส่วนผลงานคิดจากชีตจริง"; period toggle "เดือนนี้" / "สะสมปีงบประมาณ" showing the date range in Thai (พ.ศ.); breadcrumb `บก.ทล. › กก.K › ส.ทล.S › ชื่อ` where each earlier crumb navigates back; then the panel for `nav.level`. Task 3 renders `StationPanel`/`PersonPanel` levels as a placeholder `Panel` "กำลังพัฒนา" — Task 4 replaces them.
- Produces (`HQPanel.jsx`, default export): `HQPanel({ model, isDarkMode, onSelectDivision })` with:
  1. Summary: `ScoreRing` (hq), grade, `DeltaTag`, total manpower (`MockTag`).
  2. `DimensionBars` of `model.hq.dimScores`.
  3. Division leaderboard: 8 rows sorted by total, each row a `<button>` calling `onSelectDivision(kk)`: placing, name, score bar, `GradeBadge`, `DeltaTag`, "ติดตาม N ส.ทล." when `watchCount > 0`.
  4. "ช่องว่างระหว่าง กก.": best and worst division with the gap in points.
  5. "การกระจายเกรด ส.ทล. (43 หน่วย)": 4 chips with counts from `hq.gradeCounts`.
  6. "วิธีคิดคะแนน": the 5 dimensions with weights and a one-line description each, the grade thresholds, and the sentence "มิติที่เป็นจำนวน หารด้วยกำลังพลแล้วเทียบกับ P90 ของหน่วยระดับเดียวกัน (หน่วยที่อยู่ Top 10% ได้ 100)".
- Produces (`DivisionPanel.jsx`, default export): `DivisionPanel({ model, kk, isDarkMode, onSelectStation })` with: summary (ring, grade, delta, placing among 8); `DimensionRadar` of the division vs `model.averages.hq` ("ค่าเฉลี่ย บก.ทล."); stations table (placing within the กก., ส.ทล., total, 5 dimension scores, consistency "มีผลงาน X% ของวัน", grade, delta) in `overflow-x-auto`, rows clickable → `onSelectStation(key)`; "ส.ทล. ที่ต้องติดตาม" list of `watch` stations with the reason (grade or delta), or "ไม่มี" when empty.
- App.jsx: import `QualityView` and lucide `ClipboardCheck`; add `'quality'` to both top-level tab arrays (lines 74 and 131); add `{ id: 'quality', label: 'Quality Score', icon: ClipboardCheck, ... }` to the Advanced Analytics list using cyan tones in the same shape as the existing items; render `{activeTab === 'quality' && <QualityView rawData={rawData} isDarkMode={isDarkMode} />}`.

- [ ] **Step 1: Implement `QualityParts.jsx`, `QualityView.jsx`, `HQPanel.jsx`, `DivisionPanel.jsx` and the App.jsx changes.**

- [ ] **Step 2: Verify lint and build**
  Run: `npx eslint src/components/dashboard/quality src/App.jsx` → no errors in the quality folder; for App.jsx the problem count must not rise above what `npx eslint src/App.jsx` reported before your edit (run it first).
  Run: `npm run build` → succeeds.

- [ ] **Step 3: Verify the library tests still pass**
  Run: `node --test "src/lib/quality/*.test.js"` → all pass.

---

### Task 4: ส.ทล. and บุคคล views

**Files:**
- Create: `src/components/dashboard/quality/StationPanel.jsx`
- Create: `src/components/dashboard/quality/PersonPanel.jsx`
- Modify: `src/components/dashboard/quality/QualityView.jsx` (replace the Task 3 placeholders)

**Interfaces:**
- Consumes: `QualityParts.jsx` exports, `QualityModel`, `POINTS`, `TICKET_COLUMNS`, `DIMENSIONS`.
- Produces (`StationPanel.jsx`, default export): `StationPanel({ model, stationKey, isDarkMode, onSelectPerson })` with:
  1. Summary: ring, grade, delta, placing among the stations of its กก.
  2. Profile (each with `MockTag`): กำลังพล, ผลัดทั้งหมด, ผลัดที่ไม่มีผลงาน, อัตราคดีอนุมัติ.
  3. "ที่มาของคะแนน": table of items → count × points = subtotal, grouped by dimension (warrants, each non-zero flagrant offense, drug points, tickets by act, truck/drunk arrests, convoy, help, traffic service, volunteer), plus "รายงานครบ X จาก Y วัน".
  4. `DimensionRadar` station vs `model.averages.division[kk]` ("ค่าเฉลี่ย กก.").
  5. "อันดับบุคคลใน ส.ทล." (`MockTag`): rows from `model.people[stationKey]` (placing, rank + name, total, grade), each a button → `onSelectPerson(id)`.
- Produces (`PersonPanel.jsx`, default export): `PersonPanel({ model, stationKey, personId, isDarkMode })` with: header (rank + name, station, `MockTag`); ring, grade, "อันดับ X จาก 8 ใน ส.ทล."; `DimensionBars` with `compare = model.averages.station[stationKey]`, `compareLabel` "ค่าเฉลี่ย ส.ทล."; points breakdown (same item list as the station, values rounded to 1 decimal); "ความหลากหลายของงาน X/5 ด้าน" with the 5 group names marked done/not done; "ขาดเวร N ผลัด".

- [ ] **Step 1: Implement `StationPanel.jsx`, `PersonPanel.jsx` and wire them in `QualityView.jsx`.**

- [ ] **Step 2: Verify**
  Run: `npx eslint src/components/dashboard/quality` → no errors. `npm run build` → succeeds. `node --test "src/lib/quality/*.test.js"` → all pass.

- [ ] **Step 3 (controller): Render check** — `npm run dev`, open `?tab=quality`, drill บก.ทล. → กก. → ส.ทล. → บุคคล and back via breadcrumb, in dark and light mode, at 375px and 1440px; switch period to สะสมปีงบประมาณ.
