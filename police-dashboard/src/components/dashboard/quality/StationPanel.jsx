import React from 'react';
import { Gauge, BarChart3, Calculator } from 'lucide-react';
import { CATEGORIES } from '../../../lib/quality/scoringConfig.js';
import { DeltaTag, CategoryTable, Panel, PointsBreakdownTable, Stat } from './QualityParts';
import { formatCount, pointsBreakdown, placingOf, toPercent, themed } from './qualityFormat.js';

const StationPanel = ({ model, stationKey, isDarkMode = true }) => {
    const station = model.stations.find((item) => item.key === stationKey);
    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    if (!station) {
        return <Panel title="ไม่พบข้อมูล" isDarkMode={isDarkMode}><p className={muted}>ไม่พบข้อมูล ส.ทล. ที่เลือก</p></Panel>;
    }

    const stationName = `ส.ทล.${station.stl}`;
    const divisionStations = model.stations.filter((item) => item.kk === station.kk);
    const placingRows = divisionStations.map((item) => ({ key: item.key, value: item.total }));
    const categoryRows = CATEGORIES.map(({ id, label }) => {
        const { quantity, quality, total } = station.points.categories[id];
        return { label, quantity, quality, total };
    });

    return (
        <div className="space-y-6">
            <Panel title={`คะแนนรวม ${stationName} กก.${station.kk}`} icon={Gauge} isDarkMode={isDarkMode}>
                <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Stat label="คะแนนรวม" value={formatCount(station.total)} emphasis isDarkMode={isDarkMode} />
                    <Stat label="ปริมาณ" value={formatCount(station.points.quantity)} isDarkMode={isDarkMode} />
                    <Stat label="คุณภาพ" value={formatCount(station.points.quality)} isDarkMode={isDarkMode} />
                    <Stat label={`อันดับใน กก.${station.kk}`} value={`ที่ ${placingOf(placingRows, stationKey)} จาก ${divisionStations.length}`} isDarkMode={isDarkMode} />
                </dl>
                <div className="mt-3"><DeltaTag delta={station.delta} isDarkMode={isDarkMode} /></div>
            </Panel>

            <Panel title="คะแนนแยกตามเรื่อง" icon={BarChart3} isDarkMode={isDarkMode}>
                <CategoryTable rows={categoryRows} isDarkMode={isDarkMode} />
            </Panel>

            <Panel title="ที่มาของคะแนน" icon={Calculator} isDarkMode={isDarkMode}>
                <PointsBreakdownTable rows={pointsBreakdown(station.raw)} isDarkMode={isDarkMode} />
                <p className={`mt-4 text-sm ${muted}`}>
                    รายงานครบ <span className="font-semibold tabular-nums">{station.info.reportDays}</span> จาก {model.period.days} วัน
                    {' · '}มีผลงาน <span className="font-semibold tabular-nums">{toPercent(station.consistency)}%</span> ของวัน
                    {' · '}สัดส่วนคดีสำคัญ <span className="font-semibold tabular-nums">{toPercent(station.info.majorShare)}%</span>
                </p>
            </Panel>
        </div>
    );
};

export default StationPanel;
