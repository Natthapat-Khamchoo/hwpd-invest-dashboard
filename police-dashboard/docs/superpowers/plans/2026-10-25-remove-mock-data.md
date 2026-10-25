# Remove Mock Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Quality Score tab uses only real Google Sheets data: remove every mock input (manpower, case approval rate, shift data) from the calculation and the UI.

**Architecture:** Delete `mockData.js`; `rawDimensions` drops its mock inputs; divisions and HQ aggregate with plain means instead of manpower weights; UI loses every mock element.

**Tech Stack:** React 19, Tailwind 3, recharts 3; tests with `node --test`.

**Spec (user, 2026-10-25):** "อันไหนที่ยังเป็นข้อมูลสมมติอยู่ให้ตัดออกครับ และไม่ต้องเอามาคิด". Controller decisions:
- Count dimensions (suppression, roadSafety, service) = the unit's total points, no division by manpower; still scaled against P90 of peers (43 stations / 8 divisions).
- caseQuality = majorShare only (major cases ÷ all arrests). discipline = min(1, reportDays ÷ periodDays) only.
- Weights stay 35/20/20/10/15; grade thresholds unchanged.
- Division raw dims = plain mean of its stations' raw dims (count dims become points per station, so divisions with more stations are not favoured); then scoreGroup across the 8.
- HQ total and dimScores = plain mean of the 8 divisions' totals / dimScores.

## Global Constraints
- No new npm dependencies. No git add / git commit.
- Thai copy; lucide icons only; both themes via `isDarkMode`.
- `src/lib/quality/` imports nothing outside itself, explicit `.js` extensions.

## Review Focus
1. Nothing mock survives: no `mockData`, `stationProfile`, `manpower`, `approvalRate`, `shiftMissRate`, `shifts`, `MockTag`, "ข้อมูลสมมติ", "กำลังพล" anywhere in `src/lib/quality` or `src/components/dashboard/quality`.
2. Empty `rawData` still yields finite scores (now 0 for every dimension).
3. Copy in "วิธีคิดคะแนน" matches the new formulas.

---

### Task 1: Remove mock inputs end to end

**Files:**
- Delete: `src/lib/quality/mockData.js`
- Modify: `src/lib/quality/score.js` — `rawDimensions(raw, { periodDays }) -> { suppression, caseQuality, roadSafety, service, discipline }` with the formulas above (count dims = points, no manpower).
- Modify: `src/lib/quality/buildQualityModel.js` — no `stationProfile`, no `profile`/`manpower` fields; stations call `rawDimensions(raw, { periodDays })`; division dims = mean of station dims; HQ = plain mean of divisions; keep `delta`, `consistency`, `gradeCounts`, `averages.hq`, `averages.division`.
- Modify: `src/lib/quality/score.test.js` — drop stationProfile tests; update the shape test (no `profile`/`manpower` keys); update the fixture `rawDimensions` test to `rawDimensions(result['1-1'], { periodDays: 4 })` → suppression 45, roadSafety 17, service 6, caseQuality closeTo 0.4, discipline 0.5; zero-safety test `rawDimensions(emptyStationRaw(), { periodDays: 0 })` → all finite and 0; add `buildQualityModel({}, 'month', new Date(2026, 9, 24))` → every station and division total is 0.
- Modify: `src/components/dashboard/quality/QualityParts.jsx` — delete `MockTag`.
- Modify: `QualityView.jsx` — notice text becomes exactly "Mockup: คะแนนทั้งหมดคิดจากข้อมูลจริงในชีต" (neutral/cyan styling, not amber warning).
- Modify: `HQPanel.jsx` — remove the manpower line and all MockTags; METHOD_NOTES: caseQuality "สัดส่วนคดีสำคัญ (อาวุธปืน เอกสารปลอม ยาเสพติดตั้งแต่ขั้น 2) ต่อการจับกุมทั้งหมด", discipline "จำนวนวันที่ส่งรายงานผลเทียบกับจำนวนวันในช่วงที่ดู"; final sentence "มิติที่เป็นจำนวน (ปราบปราม ถนนปลอดภัย บริการ) เทียบกับ P90 ของหน่วยระดับเดียวกัน (หน่วยที่อยู่ Top 10% ได้ 100) ระดับ กก. ใช้ค่าเฉลี่ยต่อ ส.ทล."
- Modify: `DivisionPanel.jsx` — remove MockTags.
- Modify: `StationPanel.jsx` — remove the profile panel ("ข้อมูลกำลังพลและผลัด") and MockTags; keep everything else.

- [ ] **Step 1:** Update tests in `score.test.js` as listed; run `node --test "src/lib/quality/*.test.js"` → FAIL (old signature / mock still present).
- [ ] **Step 2:** Implement the library changes; tests → PASS.
- [ ] **Step 3:** Implement the UI changes.
- [ ] **Step 4:** `git grep -n -E "mockData|stationProfile|manpower|approvalRate|shiftMissRate|shiftsWithoutResult|MockTag|ข้อมูลสมมติ|กำลังพล" -- src/lib/quality src/components/dashboard/quality` → no matches.
- [ ] **Step 5:** `node --test "src/lib/quality/*.test.js" "src/components/dashboard/quality/*.test.js"` → all pass; `npx eslint src/lib/quality src/components/dashboard/quality` → no errors; `npm run build` → succeeds.
- [ ] **Step 6 (controller):** browser check of the three levels with real data.
