# Quantity + Quality Points Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 5-dimension 0–100 scoring with raw points split into ปริมาณ (quantity) and คุณภาพ (quality) per category, summed into a total, using only real sheet data.

**Architecture:** `stationRaw.js` collects the extra raw counts (Big Data warrants, per-case drug base/extra, seized items, every `traf_*` column). A new `points.js` turns a StationRaw into `{ categories, quantity, quality, total }`. `buildQualityModel.js` sums stations into divisions and HQ, ranks divisions by average per station, and computes deltas against the same days of the previous month. The UI drops grades, rings, radars and P90.

**Tech Stack:** React 19, Tailwind 3, recharts 3; `node --test`.

**Spec (user decisions, 2026-10-25):**
- Total = quantity + quality, raw points, ranked by total; no grades, no 0–100.
- Categories: หมายจับ, ซึ่งหน้า, ยาเสพติด, ใบสั่ง, บริการ, ของกลาง.
- Quality = the excess in the existing point table (gun +5, forged document +10, drug tier 2 +5 / tier 3 +10) plus: Big Data warrant +5 each; ยาบ้า +1 per 1,000 pills; ไอซ์ +1 per 100 g; other drugs +1 per 100 units; seized gun +5 each; bullets +1 per 50; explosives +5 each; car +3 each; motorcycle +1 each; cash +1 per 10,000 baht.
- Camera tickets count in full (1 point each, every `traf_*` column).
- กก.: show the sum and the average per ส.ทล.; rank by the average.
- สัดส่วนคดีสำคัญ and report completeness are shown as information only, not scored.
- Bar charts are single-colour totals; the quantity/quality split lives in tables.
- No mock data anywhere (already removed, unreviewed; this plan's reviews cover it).
- Controller ruling: the delta compares this month to date with the same number of days from the start of the previous month (was: whole previous month). `fy` has no delta.

## Global Constraints
- No new npm dependencies. No git add / git commit.
- Thai copy; lucide icons only; both themes via `isDarkMode` + `themed`.
- `src/lib/quality/` imports nothing outside itself; explicit `.js` extensions.
- All point values live in `scoringConfig.js` (one place to edit).

## Review Focus
1. Totals reconcile: for every unit, Σ category quantity = quantity, Σ category quality = quality, quantity + quality = total; division sums equal the sum of their stations.
2. Empty or partial `rawData` → all zeros, no NaN; drill-down still works.
3. `traf_*` columns not in the known map (e.g. `traf_overhang`, `traf_overheight`) are counted as จราจร tickets.
4. Item names classify in the same order as `GoogleSheetService.js:719-743` (drugs first, so "ยาบ้า" never counts as seized cash, etc.).
5. No leftovers of grades/P90/dimensions/weights in UI copy or code.

---

### Task 1: Points library

**Files:**
- Modify: `src/lib/quality/scoringConfig.js` — replace `DIMENSIONS`, `GRADES` with:
  - `CATEGORIES = [{ id: 'warrant', label: 'หมายจับ' }, { id: 'flagrant', label: 'ซึ่งหน้า' }, { id: 'drugs', label: 'ยาเสพติด' }, { id: 'tickets', label: 'ใบสั่ง' }, { id: 'service', label: 'บริการ' }, { id: 'seized', label: 'ของกลาง' }]`
  - `QUANTITY = { warrant: 10, flagrant: 10, drugCaseBase: 5, ticket: 1, convoy: 2, help: 1, trafficService: 1, volunteer: 2 }`
  - `QUALITY = { bigDataWarrant: 5, flagrantExtra: { gun: 5, doc: 10 }, drugPer: { yaba: 1000, ice: 100, other: 100 }, seizedEach: { gun: 5, explosive: 5, car: 3, motorcycle: 1 }, seizedPer: { bullets: 50, cash: 10000 } }`
  - keep `POINTS.drug` tiers (used for per-case drug points), `STATIONS_PER_DIVISION`, `TICKET_COLUMNS`, `SUPPRESSION_OFFENSES`, `ROAD_OFFENSES` only if still used.
- Modify: `src/lib/quality/stationRaw.js` — StationRaw gains `bigDataWarrants`, `drugCaseBase`, `drugCaseExtra` (per case: base = min(casePoints, 5), extra = casePoints − base; summed), `drugSeized: { yaba, ice, other }`, `seized: { gun, bullets, explosive, car, motorcycle, cash }`; tickets count every row key starting with `traf_` (known columns by `TICKET_COLUMNS`, unknown → `traffic`). Items classification order: ยาบ้า/ยาอี → yaba; ไอซ์ → ice; เคตามีน/โคเคน → other drug; อาวุธปืน → gun; กระสุน → bullets; ระเบิด/วัตถุระเบิด → explosive; รถยนต์/เก๋ง/กระบะ/ตู้ → car; รถจักรยานยนต์/จยย/มอเตอร์ไซค์ → motorcycle; เงิน/ธนบัตร → cash; else ignored.
- Create: `src/lib/quality/points.js`
  - `unitPoints(raw: StationRaw) -> { categories: { [categoryId]: { quantity, quality, total } }, quantity, quality, total }`
    - warrant: quantity = warrants × 10; quality = bigDataWarrants × 5
    - flagrant (every non-drug flagrant offense incl. weight and drunk): quantity = count × 10; quality = gun × 5 + doc × 10
    - drugs: quantity = drugCaseBase; quality = drugCaseExtra + ⌊yaba/1000⌋ + ⌊ice/100⌋ + ⌊other/100⌋
    - tickets: quantity = all tickets × 1; quality 0
    - service: quantity = convoy × 2 + serviceHelp × 1 + serviceTraffic × 1 + volunteer × 2; quality 0
    - seized: quantity 0; quality = gun × 5 + explosive × 5 + car × 3 + motorcycle × 1 + ⌊bullets/50⌋ + ⌊cash/10000⌋
  - `unitInfo(raw, periodDays) -> { majorShare, reportDays, reportRatio, activeDays }` (majorShare = majorCases ÷ all arrests, 0 when none; reportRatio = min(1, reportDays ÷ periodDays), 0 when periodDays 0)
  - `addPoints(a, b)` and `emptyPoints()` helpers for summing.
- Modify: `src/lib/quality/buildQualityModel.js` — returns
  ```
  { period, hq: { points, total, average, delta }, divisions: [{ kk, name, stationCount, points, total, average, delta, info }], stations: [{ key, kk, stl, name, raw, points, total, delta, info, consistency }] }
  ```
  `average` = total ÷ station count (1 decimal); divisions sorted by `kk`; HQ `average` = HQ total ÷ 43. Delta: `kind === 'month'` → current minus the same computation over `previousPeriodRange(today)` (stations/divisions on total, HQ on total); otherwise `null`. Division `info` = pooled majorShare (Σ majorCases ÷ Σ arrests) and mean reportRatio.
  - `previousPeriodRange(today) -> { start, end, days }`: start = 1st of previous month; end = start + (today's day-of-month − 1) days, clamped to the previous month's last day.
- Delete: `src/lib/quality/score.js` and the 0–100 parts of `score.test.js`; move surviving tests (periodRange etc.) into `src/lib/quality/points.test.js`.

- [ ] **Step 1: Tests** in `src/lib/quality/points.test.js` (and update `stationRaw.test.js`):
  - From the fixture station `'1-1'` (range 2026-10-01..2026-10-24): categories warrant {20, 10}, flagrant {20, 5}, drugs {5, 5}, tickets {7, 0}, service {6, 0}, seized {0, 0}; quantity 58, quality 20, total 78.
  - `stationRaw`: a traffic row `{ traf_overhang: 3, traf_overheight: 2 }` adds 5 to `tickets.traffic`; items `อาวุธปืนไม่มีทะเบียน` 2, `กระสุน` 120, `รถยนต์กระบะ` 1, `รถจักรยานยนต์` 2, `เงินสด` 25000 → seized quality = 10 + 2 + 3 + 2 + 2 = 19.
  - drug extras: 2,500 ยาบ้า over one case → tier 3 (15 → base 5, extra 10) + ⌊2500/1000⌋ = 2 → drugs {5, 12}.
  - `previousPeriodRange(new Date(2026, 9, 24))` → 2026-09-01..2026-09-24, days 24; `previousPeriodRange(new Date(2026, 2, 31))` → 2026-02-01..2026-02-28.
  - `buildQualityModel(fixture, 'month', new Date(2026, 9, 24))`: 43 stations, 8 divisions; division '1' total = Σ its stations' totals; division '1' average = total ÷ 6; HQ total = Σ division totals; every unit satisfies quantity + quality = total.
  - `buildQualityModel({}, 'fy', new Date(2026, 9, 1))`: every total 0, every delta null, no NaN.
- [ ] **Step 2:** `node --test "src/lib/quality/*.test.js"` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `node --test "src/lib/quality/*.test.js"` → PASS; `npx eslint src/lib/quality` → no errors.

---

### Task 2: UI on raw points

**Files:** `src/components/dashboard/quality/` — `QualityParts.jsx`, `qualityFormat.js` (+ test), `HQPanel.jsx`, `DivisionPanel.jsx`, `StationPanel.jsx`, `QualityView.jsx`.

**Interfaces:**
- Consumes the Task 1 model and `CATEGORIES`, `QUANTITY`, `QUALITY` from `scoringConfig.js`.
- `ScoreBarChart({ items, onSelect, isDarkMode, ariaLabel, valueLabel })` — single colour (cyan `#06b6d4`), y-axis auto from 0, value labels formatted with thousands separators, tooltip label + value; keep the sr-only drill-down button list. Remove grade legend and grade colouring.
- `barItems(units, metric, labelOf)` — metric is `'total' | 'quantity' | 'quality' | categoryId | 'average'`; values from `unit.points` (`average` from `unit.average`); sort descending, ties by label.
- `CategoryTable({ rows: Array<{ label, quantity, quality, total }>, compare?, compareLabel?, isDarkMode })` — table with columns เรื่อง / ปริมาณ / คุณภาพ / รวม (and the compare column when given), a total row at the bottom; numbers with thousands separators; inside `overflow-x-auto`.
- Remove: `ScoreRing`, `GradeBadge`, `DimensionRadar`, grade helpers, `METHOD_NOTES` about dimensions, the 8-vs-43 caption, the grade-distribution panel.

**HQPanel:** (1) Panel "คะแนนรวม บก.ทล.": big numbers คะแนนรวม, ปริมาณ, คุณภาพ, เฉลี่ยต่อ ส.ทล., `DeltaTag` ("จากช่วงเดียวกันเดือนก่อน"), and `CategoryTable` of HQ categories. (2) Panel "เปรียบเทียบคะแนน 8 กก.": bar chart of division `average` (caption "คะแนนเฉลี่ยต่อ ส.ทล."), tooltip also shows the division total; click → division. (3) Panel "วิธีคิดคะแนน": lists every quantity and quality rule with its points, generated from `QUANTITY`/`QUALITY` so it never drifts from the config.

**DivisionPanel:** (1) Panel "คะแนนรวม {name}": คะแนนรวม, เฉลี่ยต่อ ส.ทล., อันดับที่ N จาก 8 (by average), delta, and `CategoryTable` of the division's per-station average per category with compare = HQ per-station average ("เฉลี่ย บก.ทล."); info line: สัดส่วนคดีสำคัญ X%, ส่งรายงานเฉลี่ย X%. (2) Panel "ส.ทล. ใน {name}": KPI cards (`aria-pressed`) — คะแนนรวม, ปริมาณ, คุณภาพ, then each category — showing the division's sum for that metric; bar chart of stations by the selected metric; table of stations (ส.ทล., ปริมาณ, คุณภาพ, รวม, each category total, ส่งรายงาน X/Y วัน, มีผลงาน X% ของวัน, สัดส่วนคดีสำคัญ, delta) with drill-down rows.

**StationPanel:** summary (คะแนนรวม, ปริมาณ, คุณภาพ, อันดับใน กก. by total, delta), `CategoryTable`, the itemised breakdown with columns รายการ / จำนวน / ปริมาณ / คุณภาพ / รวม (pointsBreakdown rewritten to the new rules, one row per non-zero item, incl. seized items and drug seizure amounts), and info: รายงานครบ X จาก Y วัน, มีผลงาน X% ของวัน, สัดส่วนคดีสำคัญ X%.

**QualityView:** notice stays "Mockup: คะแนนทั้งหมดคิดจากข้อมูลจริงในชีต"; period labels unchanged.

- [ ] **Step 1: Tests** in `qualityFormat.test.js`: `barItems` for `'total'`, `'quality'`, a category and `'average'` (ordering + values); `pointsBreakdown(raw)` on the Task 1 fixture station → rows' quantity sum 58, quality sum 20; every row has quantity + quality = total.
- [ ] **Step 2:** run → FAIL. **Step 3:** implement. **Step 4:** `node --test "src/lib/quality/*.test.js" "src/components/dashboard/quality/*.test.js"` → PASS; `npx eslint src/lib/quality src/components/dashboard/quality` → no errors; `npm run build` → succeeds; `git grep -n -i -E "grade|เกรด|P90|DIMENSIONS|dimScores|ScoreRing|Radar|น้ำหนัก" -- src/components/dashboard/quality src/lib/quality` → no matches.
- [ ] **Step 5 (controller):** browser check of the three levels, KPI switching, drill-down, 375px.
