import React from 'react';
import { Gauge, BarChart3, Calculator, ListChecks } from 'lucide-react';
import { BreakdownTable, CategoryRadar, IndexFigure, ItemGroupsList, Panel, Stat } from './QualityParts';
import { breakdownRows, dimensionRadarRows, formatAverage, itemGroupsOf, placingOf, RADAR_COLORS, themed } from './qualityFormat.js';

const StationPanel = ({ model, stationKey, isDarkMode = true }) => {
    const station = model.stations.find((item) => item.key === stationKey);
    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    if (!station) {
        return <Panel title="ไม่พบข้อมูล" isDarkMode={isDarkMode}><p className={muted}>ไม่พบข้อมูล ส.ทล. ที่เลือก</p></Panel>;
    }

    const stationName = `ส.ทล.${station.stl}`;
    const divisionStations = model.stations.filter((item) => item.kk === station.kk);
    const placingRows = divisionStations.map((item) => ({ key: item.key, value: item.index }));
    const division = model.divisions.find((item) => item.kk === station.kk);
    const radar = dimensionRadarRows([
        { name: stationName, scores: station.scores },
        { name: division.name, scores: division.scores },
    ]);
    const breakdown = breakdownRows(station.raw, model.max, station.scores);

    return (
        <div className="space-y-6">
            <Panel title={`ดัชนีคุณภาพ ${stationName} กก.${station.kk}`} icon={Gauge} isDarkMode={isDarkMode}>
                <IndexFigure index={station.index} delta={station.delta} isDarkMode={isDarkMode} />
                <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Stat label={`อันดับใน ${division.name}`} value={`ที่ ${placingOf(placingRows, stationKey)} จาก ${divisionStations.length}`} isDarkMode={isDarkMode} />
                    <Stat label={`ดัชนีเฉลี่ยของ ${division.name}`} value={formatAverage(division.index)} isDarkMode={isDarkMode} />
                </dl>
            </Panel>

            <Panel title="คะแนนแยกตามด้าน" icon={BarChart3} isDarkMode={isDarkMode}>
                <CategoryRadar
                    rows={radar}
                    series={[
                        { name: stationName, color: RADAR_COLORS.main },
                        { name: division.name, color: RADAR_COLORS.compare, dashed: true },
                    ]}
                    subtitle={`แต่ละด้านเทียบกับน้ำหนักเต็มของด้านนั้น (= 100%) เส้นประคือ ${division.name} โดยเฉลี่ย`}
                    isDarkMode={isDarkMode}
                />
            </Panel>

            <Panel title="ที่มาของดัชนี" icon={Calculator} isDarkMode={isDarkMode}>
                <BreakdownTable rows={breakdown} isDarkMode={isDarkMode} />
            </Panel>

            <Panel title="รายการที่นับคะแนน" icon={ListChecks} isDarkMode={isDarkMode}>
                <ItemGroupsList groups={itemGroupsOf(station.items)} isDarkMode={isDarkMode} />
            </Panel>
        </div>
    );
};

export default StationPanel;
