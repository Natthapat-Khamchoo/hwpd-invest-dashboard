# Quality Mockup Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove individual (บุคคล) scoring so the Quality Score tab stops at ส.ทล., and redesign the บก.ทล. and กก. views per the user's feedback.

**Architecture:** Task 1 deletes the person layer and the unused "watch" concept from the library and UI. Task 2 rebuilds `HQPanel.jsx` and `DivisionPanel.jsx` around a shared vertical bar chart.

**Tech Stack:** React 19, Tailwind 3, recharts 3, lucide-react. Tests: `node --test`.

**Spec (user feedback, 2026-10-25):**
- Remove individual scoring; keep ส.ทล. and above.
- บก.ทล. page: (1) "คะแนนรวม บก.ทล." and "มิติการประเมิน" in ONE card, dimensions shown as a pentagon (radar) chart; (2) "อันดับ กก. ทั้ง 8 หน่วย" renamed "เปรียบเทียบคะแนน 8 กก.", shown as a vertical bar chart, "ติดตาม ส.ทล." removed; (3) remove the "ช่องว่างระหว่าง กก." card.
- กก. page: (1) "คะแนนรวม กก." and "มิติการประเมินเทียบค่าเฉลี่ย บก.ทล." in ONE card; (2) "ส.ทล. ใน กก." gets a vertical bar chart comparing stations, with KPI cards the user clicks to choose which metric the chart shows (instead of a filter); (3) remove the "ส.ทล. ที่ต้องติดตาม" card.
- Controller readings: the กก. stations table stays below the chart (not asked to remove); the grade-distribution and "วิธีคิดคะแนน" cards on บก.ทล. stay; bars are clickable to drill down (they replace the old clickable rows).

## Global Constraints
- No new npm dependencies. Do not run git add / git commit.
- Thai copy; lucide-react icons only, no emoji; both themes via `isDarkMode` using the `themed` helper.
- Grade tones emerald/sky/amber/rose; grade always available as text too (tooltip + legend for charts).
- Clickable elements: real `<button>` (or recharts bar with an equivalent keyboard-reachable button list), `cursor-pointer`, `focus-visible:ring-2`, min 44px touch target, `transition-colors duration-200`.
- 375px width without horizontal page scroll; charts in `ResponsiveContainer`.
- Every element showing mock-derived data keeps its `MockTag`.

## Review Focus
1. No reference to people/persons/watch survives anywhere (imports, model fields, crumbs, banner text, tests).
2. Bar charts with all-zero data render without NaN and still allow drill-down.
3. KPI card selection re-sorts the station bars by the selected metric and is keyboard operable (`aria-pressed`).
4. 375px: the 8-bar and up-to-6-bar charts keep readable labels.

---

### Task 1: Remove the person layer and the watch concept

**Files:**
- Delete: `src/components/dashboard/quality/PersonPanel.jsx`
- Modify: `src/lib/quality/mockData.js` (remove `mockPeople` and anything only it uses)
- Modify: `src/lib/quality/buildQualityModel.js` (remove `people`, `averages.station`, `diversityOf`, person scoring, `watch`, `watchCount`, `WATCH_DROP`; keep everything else, including `delta`, `consistency`, `averages.hq`, `averages.division`)
- Modify: `src/lib/quality/score.test.js` (drop person/mockPeople/watch assertions; keep the rest)
- Modify: `src/components/dashboard/quality/qualityFormat.js` (remove `diversityGroups`, the `'person'` variant of `pointsBreakdown`, `formatBreakdownCells`' person path — or the whole helper if only person used it — and `watchReasons`/watch helpers)
- Modify: `src/components/dashboard/quality/qualityFormat.test.js` (drop tests for removed helpers)
- Modify: `src/components/dashboard/quality/QualityParts.jsx` (`PointsBreakdownTable` loses the `variant` prop and person caption)
- Modify: `src/components/dashboard/quality/StationPanel.jsx` (remove the "อันดับบุคคลใน ส.ทล." panel and `onSelectPerson`)
- Modify: `src/components/dashboard/quality/QualityView.jsx` (remove the `'person'` level, `personId`, `selectPerson`, person crumb; notice text becomes exactly "Mockup: กำลังพล คุณภาพคดี และข้อมูลผลัดเป็นข้อมูลสมมติ ส่วนผลงานคิดจากชีตจริง")
- Modify: `src/components/dashboard/quality/HQPanel.jsx`, `DivisionPanel.jsx` only as far as needed to stop reading `watchCount`/`watch` (Task 2 rebuilds them)

**Interfaces:**
- Produces: `buildQualityModel(...)` returns `{ period, hq, divisions, stations, averages: { hq, division } }`; `divisions[]` without `watchCount`; `stations[]` without `watch`.

- [ ] **Step 1:** Remove the code and tests listed above.
- [ ] **Step 2:** Verify no leftovers: `git grep -n -i -E "people|person|mockPeople|diversity|watch|บุคคล" -- src/lib/quality src/components/dashboard/quality` → no matches.
- [ ] **Step 3:** `node --test "src/lib/quality/*.test.js" "src/components/dashboard/quality/*.test.js"` → all pass; `npx eslint src/lib/quality src/components/dashboard/quality` → no errors; `npm run build` → succeeds.

---

### Task 2: Redesign บก.ทล. and กก. views

**Files:**
- Modify: `src/components/dashboard/quality/QualityParts.jsx` (add `ScoreBarChart`)
- Modify: `src/components/dashboard/quality/HQPanel.jsx`
- Modify: `src/components/dashboard/quality/DivisionPanel.jsx`
- Test: `src/components/dashboard/quality/qualityFormat.test.js` (for the pure helper below)

**Interfaces:**
- Consumes: the Task 1 model; existing `ScoreRing`, `GradeBadge`, `DeltaTag`, `DimensionRadar`, `MockTag`, `Panel`, `placingOf`, `themed`; `gradeFor` from `src/lib/quality/score.js`; `DIMENSIONS` from `scoringConfig.js`.
- Produces:
  - `barItems(units: Array, metric: 'total' | dimensionId) -> Array<{ key, label, value, grade }>` in `qualityFormat.js` — `value` = `unit.total` or `unit.dimScores[metric]` rounded to 1 decimal; `grade = gradeFor(value)`; sorted by `value` descending, ties by `label`. Callers pass `label` via a mapping (see below); signature: `barItems(units, metric, labelOf)`.
  - `ScoreBarChart({ items, onSelect, isDarkMode, ariaLabel })` in `QualityParts.jsx` — recharts vertical `BarChart` (bars rise from the x-axis) in `ResponsiveContainer` height 280, y-axis 0–100, each bar filled with its grade tone color, value label on top of each bar (1 decimal), x-axis tick = `label`, tooltip shows label, value and grade label; a legend row of the 4 grades (text + swatch). Clicking a bar calls `onSelect(key)`. Below the chart, a visually hidden (`sr-only`) list of `<button>`s, one per item, calling `onSelect(key)` so keyboard users can drill down.

**HQPanel layout (top to bottom):**
1. One `Panel` "คะแนนรวม บก.ทล." (MockTag): left/top = `ScoreRing`, `GradeBadge`, `DeltaTag`, กำลังพลรวม; right/bottom = `DimensionRadar` of `hq.dimScores` (no compare) titled in-card "มิติการประเมิน". Two columns at `lg`, stacked below.
2. `Panel` "เปรียบเทียบคะแนน 8 กก." (MockTag): `ScoreBarChart` with `barItems(divisions, 'total', d => d.name)`, `onSelect` → `onSelectDivision(kk)`. No watch info.
3. Grade-distribution panel (unchanged).
4. "วิธีคิดคะแนน" panel (unchanged).
The "ช่องว่างระหว่าง กก." panel and `scoreGap` usage are removed (remove `scoreGap` from qualityFormat.js and its test if nothing else uses it).

**DivisionPanel layout:**
1. One `Panel` "คะแนนรวม {division.name}" (MockTag): summary (ring, grade, placing among 8, delta, station count) and `DimensionRadar` vs `model.averages.hq` ("ค่าเฉลี่ย บก.ทล.") side by side at `lg`, stacked below.
2. `Panel` "ส.ทล. ใน {division.name}" (MockTag):
   - KPI cards row: 6 `<button aria-pressed>` cards — "คะแนนรวม" + each `DIMENSIONS` label — each showing the division's own value (`division.total` / `division.dimScores[id]`, 1 decimal) and, for dimensions, "น้ำหนัก N". Selected card highlighted (cyan border/background). Default `'total'`. Grid: 2 columns at 375px, 3 at `sm`, 6 at `xl`.
   - `ScoreBarChart` of `barItems(stationsOfDivision, selectedMetric, s => 'ส.ทล.' + s.stl)`, `onSelect` → `onSelectStation(key)`; caption above the chart naming the selected metric.
   - The existing stations table below (unchanged columns, keeps drill-down rows).
3. The "ส.ทล. ที่ต้องติดตาม" panel is removed.

- [ ] **Step 1: Failing tests for `barItems`** in `qualityFormat.test.js`: given units `[{kk:'1', name:'กก.1', total: 50, dimScores:{suppression: 90}}, {kk:'2', name:'กก.2', total: 80, dimScores:{suppression: 10}}]` with `labelOf = u => u.name` and key = `u.key ?? u.kk`: metric `'total'` → keys `['2','1']`, values `[80, 50]`, grade labels `['ดี', 'ต้องปรับปรุง']`; metric `'suppression'` → keys `['1','2']`, values `[90, 10]`. All-zero units → values all 0, no NaN.
- [ ] **Step 2:** Run `node --test "src/components/dashboard/quality/*.test.js"` → FAIL (missing export).
- [ ] **Step 3:** Implement `barItems`, `ScoreBarChart`, the new HQPanel and DivisionPanel.
- [ ] **Step 4:** `node --test "src/lib/quality/*.test.js" "src/components/dashboard/quality/*.test.js"` → all pass; `npx eslint src/lib/quality src/components/dashboard/quality` → no errors; `npm run build` → succeeds.
- [ ] **Step 5 (controller):** browser check: บก.ทล. and กก. pages, dark + light, 375px, KPI card switching, bar click drill-down.
