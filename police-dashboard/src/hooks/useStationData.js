import { useMemo } from 'react';
import { UNIT_COMMANDERS } from '../utils/constants'; // Fallback

export const useStationData = (rawData) => {
    const stationMap = useMemo(() => {
        const map = {};

        // Initialize with constants as fallback
        Object.keys(UNIT_COMMANDERS).forEach(key => {
            map[key] = { ...UNIT_COMMANDERS[key] };
        });

        if (!rawData || !rawData.stations || !Array.isArray(rawData.stations)) {
            return map;
        }

        rawData.stations.forEach(row => {
            // Try multiple possible column names for station name
            const stationStr = row.Station_Name || row.Station || row.station_name || row.station || '';
            const rank = row.Rank || row.rank || '';
            const fullName = row.Full_Name || row.Name || row.full_name || row.name || '';
            const position = row.Position || row.position || '';

            if (!stationStr || !fullName) return;

            // Combine Rank + Name + Position
            const commanderName = `${rank} ${fullName}${position ? ' ' + position : ''}`.trim();

            const val = stationStr.trim();

            // 1. Parse Station ID from Name (e.g. "ส.ทล.1 ...")
            let stationId = null;
            const stationMatch = val.match(/(?:ส\.?ทล\.?|สถานี.*?)\s*(\d+)/);
            if (stationMatch) {
                stationId = parseInt(stationMatch[1], 10).toString();
            }

            // 2. Parse Unit ID (กก.) from the station name string — ALWAYS from name, not from Unit_ID column
            //    because Unit_ID column contains station sequence number, not กก. number
            let unitId = null;
            const unitMatch = val.match(/(?:กก\.?|กอง.*?)\s*(\d+)/);
            if (unitMatch) {
                unitId = parseInt(unitMatch[1], 10).toString();
            }

            // 3. If no กก. in name, check for HQ
            if (!unitId && (val.includes('บก.') || val.includes('ส่วนกลาง') || val.includes('Command'))) {
                unitId = '0';
            }

            // Construct Key
            let key = null;
            if (unitId && stationId && unitId !== '0') {
                key = `${unitId}-${stationId}`;
            } else if (unitId && unitId !== '0') {
                key = unitId;
            }

            if (key) {
                map[key] = {
                    commander: commanderName,
                    unitName: stationStr,
                    unitId: unitId,
                    stationId: stationId,
                    position: position
                };
            }
        });

        console.log('[useStationData] Built stationMap keys:', Object.keys(map));

        return map;
    }, [rawData]);

    const getCommanderInfo = (unitId, stationId) => {
        // Normalize inputs
        const uId = unitId ? parseInt(unitId, 10).toString() : '0';

        // 1. Try Specific Station: Unit-Station
        if (stationId) {
            const sId = parseInt(stationId, 10).toString();
            const key = `${uId}-${sId}`;
            if (stationMap[key]) return stationMap[key];

            // 2. Search all entries for matching BOTH unitId AND stationId
            for (const k of Object.keys(stationMap)) {
                const entry = stationMap[k];
                if (entry.unitId === uId && entry.stationId === sId) return entry;
            }
        }

        // 3. Try Unit
        if (stationMap[uId]) return stationMap[uId];

        // 4. Fallback to constant
        return UNIT_COMMANDERS[uId] || UNIT_COMMANDERS['0'];
    };

    return { stationMap, getCommanderInfo };
};
