import React from 'react';
import { Gauge, BarChart3, Calculator } from 'lucide-react';
import { IndexFigure, CategoryRadar, Panel, ScoreBarChart } from './QualityParts';
import StationCompare from './StationCompare';
import { scoringStartDate } from '../../../lib/quality/scoringDates.js';
import { INDEX_DIMENSIONS } from '../../../lib/quality/scoringConfig.js';
import { dimensionRadarRows, formatThaiDate, indexBarItems, RADAR_COLORS, themed } from './qualityFormat.js';

// How the index is worked out, in the order a reader needs it. Weights come from the config; the per-case points
// (warrant 3, OP 2/1, award ranks) are typed here and must follow qualityIndexData.js and AWARD_POINTS.
const METHOD_LINES = [
    'คะแนนแต่ละด้าน = ค่าของ ส.ทล. ÷ ค่าสูงสุดของ ส.ทล. ทั้ง 43 ในช่วงเดียวกัน × น้ำหนักของด้าน (ค่าสูงสุดเป็น 0 ให้ 0 คะแนน)',
    'ดัชนีของ ส.ทล. = ผลรวมคะแนนทั้ง 6 ด้าน (เต็ม 100) · ดัชนีของ กก. และ บก.ทล. = ค่าเฉลี่ยของ ส.ทล. ในหน่วยนั้น',
    'คดีอาญาจับเอง นับทุกคดีเป็น 1 · หมายจับสำคัญนับเป็น 3 รวมหมายที่นับอยู่แล้ว',
    'คดีสำคัญ มีคะแนนความยาก 1 ถึง 3 ถ้าใช้ร่วมกันแบ่งเท่ากันระหว่างหน่วย',
    'ปฏิบัติการ (OP) หน่วยนำได้ 2 คะแนน หน่วยร่วมได้ 1 คะแนน',
    'รางวัล ลำดับ 1 ถึง 3 ได้ 10, 8 และ 6 คะแนน ลำดับถัดไปได้ 5 คะแนน',
    'ถวายความปลอดภัย (ถปภ.) นับเป็นวันที่เสด็จฯ ผ่านพื้นที่ ส.ทล.',
];

const HQPanel = ({ model, isDarkMode = true, onSelectDivision, onSelectStation }) => {
    const { hq, divisions } = model;
    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    const radar = dimensionRadarRows([{ name: 'บก.ทล.', scores: hq.scores }]);
    const divisionBars = indexBarItems(divisions, 'index', (division) => division.name);

    return (
        <div className="space-y-6">
            <Panel title="ดัชนีคุณภาพ บก.ทล." icon={Gauge} isDarkMode={isDarkMode}>
                <IndexFigure index={hq.index} delta={hq.delta} isDarkMode={isDarkMode} />
                <div className="mt-6">
                    <CategoryRadar
                        rows={radar}
                        series={[{ name: 'บก.ทล.', color: RADAR_COLORS.main }]}
                        subtitle="คะแนนเฉลี่ยต่อ ส.ทล. ของแต่ละด้าน เทียบกับน้ำหนักเต็มของด้านนั้น (= 100%)"
                        isDarkMode={isDarkMode}
                    />
                </div>
            </Panel>

            <Panel title="เปรียบเทียบดัชนี 8 กก." icon={BarChart3} isDarkMode={isDarkMode}>
                <p className={`mb-3 text-sm ${muted}`}>ดัชนีคุณภาพเฉลี่ยของแต่ละ กก. · กดแท่งเพื่อดูรายละเอียด</p>
                <ScoreBarChart
                    items={divisionBars}
                    onSelect={onSelectDivision}
                    isDarkMode={isDarkMode}
                    ariaLabel="เปรียบเทียบดัชนีคุณภาพของ 8 กก."
                    valueLabel="ดัชนี"
                    decimals={1}
                />
            </Panel>

            <StationCompare model={model} isDarkMode={isDarkMode} onSelectStation={onSelectStation} />

            <Panel title="วิธีคิดดัชนี" icon={Calculator} isDarkMode={isDarkMode}>
                <p className={`mb-4 text-sm ${muted}`}>ดัชนีคุณภาพเต็ม 100 แบ่งเป็น 6 ด้าน</p>
                <ul className="mb-5 space-y-2 text-sm">
                    {INDEX_DIMENSIONS.map(({ id, label, weight }) => (
                        <li key={id} className="flex flex-wrap justify-between gap-x-4">
                            <span>{label}</span>
                            <span className="whitespace-nowrap font-semibold tabular-nums">น้ำหนัก {weight}</span>
                        </li>
                    ))}
                </ul>
                <ul className="list-disc space-y-2 pl-5 text-sm">
                    {METHOD_LINES.map((line) => <li key={line}>{line}</li>)}
                </ul>
                <p className={`mt-5 text-sm ${muted}`}>เริ่มคิดคะแนนตั้งแต่ {formatThaiDate(scoringStartDate())}</p>
            </Panel>
        </div>
    );
};

export default HQPanel;
