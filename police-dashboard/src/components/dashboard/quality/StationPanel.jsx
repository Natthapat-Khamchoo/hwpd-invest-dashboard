import React from 'react';
import { Gauge, BarChart3, Calculator } from 'lucide-react';
import { DeltaTag, CategoryRadar, Panel, PointsBreakdownTable, Stat } from './QualityParts';
import { bestByCategory, formatCount, perStationCategories, pointsBreakdown, placingOf, RADAR_COLORS, radarRows, toPercent, themed } from './qualityFormat.js';

const StationPanel = ({ model, stationKey, isDarkMode = true }) => {
    const station = model.stations.find((item) => item.key === stationKey);
    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    if (!station) {
        return <Panel title="ไม่พบข้อมูล" isDarkMode={isDarkMode}><p className={muted}>ไม่พบข้อมูล ส.ทล. ที่เลือก</p></Panel>;
    }

    const stationName = `ส.ทล.${station.stl}`;
    const divisionStations = model.stations.filter((item) => item.kk === station.kk);
    const placingRows = divisionStations.map((item) => ({ key: item.key, value: item.total }));
    // Each category as a percent of the best of all stations; the division's per-station average is the compare series
    const best = bestByCategory(model.stations.map((item) => item.points.categories));
    const division = model.divisions.find((item) => item.kk === station.kk);
    const radar = radarRows([
        { name: stationName, categories: station.points.categories },
        { name: 'เฉลี่ย กก.', categories: perStationCategories(division.points.categories, division.stationCount) },
    ], best);

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
                <CategoryRadar
                    rows={radar}
                    series={[
                        { name: stationName, color: RADAR_COLORS.main },
                        { name: 'เฉลี่ย กก.', color: RADAR_COLORS.compare, dashed: true, decimals: 1 },
                    ]}
                    subtitle="แต่ละแกนเทียบกับ ส.ทล. ที่ทำได้สูงสุดในเรื่องนั้น (= 100%)"
                    isDarkMode={isDarkMode}
                />
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
