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
            // New Schema: Station_Name, Rank, Full_Name, Position, etc.
            const stationStr = row.Station_Name || row.Station || '';
            const rank = row.Rank || '';
            const fullName = row.Full_Name || row.Name || '';
            const position = row.Position || '';

            if (!stationStr || !fullName) return;

            // Combine Rank + Name
            const commanderName = `${rank} ${fullName}`.trim();

            // Parse ID
            let unitId = null;
            let stationId = null;
            let key = null;

            // 1. Try to get Unit ID from explicit column first
            if (row.Unit_ID) {
                // Remove non-digits just in case
                const uMatch = row.Unit_ID.toString().match(/(\d+)/);
                if (uMatch) {
                    unitId = parseInt(uMatch[1], 10).toString();
                }
            }

            const val = stationStr.trim();

            // 2. Parse Station ID from Name (e.g. "ส.ทล.1 ...")
            // Relaxed regex: Just look for S.TL followed by number
            const stationMatch = val.match(/(?:ส\.?ทล\.?|สถานี.*?)\s*(\d+)/);
            if (stationMatch) {
                stationId = parseInt(stationMatch[1], 10).toString();
            }

            // 3. Fallback: Parse Unit ID from Name if missing
            if (!unitId) {
                const unitMatch = val.match(/(?:กก\.?|กอง.*?)\s*(\d+)/);
                if (unitMatch) {
                    unitId = parseInt(unitMatch[1], 10).toString();
                }
            }

            // Construct Key
            if (unitId && stationId) {
                key = `${unitId}-${stationId}`;
            } else if (unitId) {
                key = unitId;
            } else if (val.includes('บก.') || val.includes('ส่วนกลาง') || val.includes('Command')) {
                key = '0';
            }


            if (key && key !== '0') {
                map[key] = {
                    commander: commanderName,
                    unitName: stationStr,
                    unitId: unitId,
                    stationId: stationId,
                    position: position
                };
            }
        });

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
        }

        // 2. Try Unit
        if (stationMap[uId]) return stationMap[uId];

        // 3. Fallback to constant
        return UNIT_COMMANDERS[uId] || UNIT_COMMANDERS['0'];
    };

    return { stationMap, getCommanderInfo };
};
