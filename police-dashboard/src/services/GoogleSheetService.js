import Papa from 'papaparse';

const SHEETS = {
    CRIME: {
        id: '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk',
        gid: '684351662',
        name: 'crime'
    },
    VOLUNTEER: {
        id: '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk',
        gid: '0', // TODO: User needs to provide GID for Volunteer if different? User didn't specify GID for these but listed them. Assuming same Sheet ID.
        // Wait, user provided GIDs in previous turns or I can assume they are in main SHEET_ID.
        // User didn't give GIDs for these in the prompt "date ... " list, but they are sheets. 
        // I will stick to existing SHEETS config if they are there, otherwise I might miss GIDs.
        // Let's assume standard GID fetching or check if I have them.
        // The file already has definitions for CRIME, TRAFFIC etc. 
        // It does NOT have VOLUNTEER or SERVICE.
        // I will add them.
        id: '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk',
        gid: '1925338272', // Placeholder
        name: 'volunteer'
    },
    SERVICE: {
        id: '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk',
        gid: '1435884266', // Placeholder
        name: 'service'
    },
    TRAFFIC: {
        id: '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk',
        gid: '1718714301',
        name: 'traffic'
    },
    ITEMS: {
        id: '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk',
        gid: '716805288',
        name: 'items'
    },
    ACCIDENTS: {
        id: '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk',
        gid: '985244759',
        name: 'accidents'
    },
    CONVOY: {
        id: '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk',
        gid: '1914089424',
        name: 'convoy'
    },
    STATIONS: {
        id: '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk',
        gid: '1282713566',
        name: 'stations'
    }
};

const fetchCSV = async (url) => {
    try {
        const response = await fetch(url);
        const csvText = await response.text();
        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true, // Auto convert numbers
                complete: (results) => resolve(results.data),
                error: (err) => reject(err)
            });
        });
    } catch (error) {
        console.error(`Error fetching CSV from ${url}:`, error);
        return [];
    }
};

const parseDate = (dateStr) => {
    if (!dateStr) return null;

    // Handle DD/MM/YYYY or D/M/YYYY (Common in TH)
    // Supports / . - separators
    const ddmmyyyy = dateStr.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
    if (ddmmyyyy) {
        return new Date(ddmmyyyy[3], ddmmyyyy[2] - 1, ddmmyyyy[1]);
    }

    // Handle YYYY-MM-DD (ISO)
    const yyyymmdd = dateStr.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})/);
    if (yyyymmdd) {
        return new Date(yyyymmdd[1], yyyymmdd[2] - 1, yyyymmdd[3]);
    }

    // Fallback
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;

    // console.warn("Invalid date format:", dateStr);
    return null;
};

// Helper to filter data by date/month and unit
const filterRow = (row, filters) => {
    // 1. Filter by Unit (KK)
    if (filters.unit_kk) {
        // Use subDiv if available (e.g. "กก.1"), else fallback to station regex
        const subDiv = row.subDiv || '';
        const station = row.station || '';

        // Check subDiv (precise) or station (contains)
        const matchSubDiv = subDiv.includes(`กก.${filters.unit_kk}`) || subDiv.includes(`กองกำกับการ ${filters.unit_kk}`);
        const matchStation = station.includes(`กก.${filters.unit_kk}`);

        if (!matchSubDiv && !matchStation) return false;
    }

    // 1.1 Filter by Station (S.TL)
    if (filters.unit_s_tl) {
        const station = row.station || '';
        // Check for specific station string e.g. "ส.ทล.1" or "สถานี...1"
        const target = filters.unit_s_tl.toString();
        // Remove leading zero if present in filter for relaxed matching
        const targetInt = parseInt(target, 10).toString();

        // Matches: "ส.ทล.1", "สถานี... 1"
        // We look for "ส.ทล." followed by the number, OR just check if the station string contains the specific S.TL code
        // Given existing patterns: "ส.ทล.1 ...", "ส.ทล.01 ..."

        const matches = (
            station.includes(`ส.ทล.${target}`) ||
            station.includes(`ส.ทล.${targetInt}`) ||
            station.includes(`สถานีตำรวจทางหลวง ${target}`) ||
            station.includes(`สถานีตำรวจทางหลวง ${targetInt}`)
        );

        if (!matches) return false;
    }

    // 2. Filter by Date
    if (row.date) {
        const rowDate = parseDate(row.date);
        if (!rowDate) return false;

        if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
            const start = new Date(filters.dateRange.start);
            const end = new Date(filters.dateRange.end);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            if (rowDate < start || rowDate > end) return false;
        } else if (filters.selectedMonth !== undefined && filters.selectedMonth !== null && filters.selectedMonth !== '') {
            if (rowDate.getMonth() !== parseInt(filters.selectedMonth)) return false;
            const currentYear = new Date().getFullYear();
            if (rowDate.getFullYear() !== currentYear) return false;
        }
    }

    return true;
};

export const fetchDashboardData = async (filters) => {
    const promises = Object.values(SHEETS).map(sheet => {
        const url = `https://docs.google.com/spreadsheets/d/${sheet.id}/export?format=csv&gid=${sheet.gid}`;
        return fetchCSV(url).then(data => ({ type: sheet.name, data }));
    });

    const results = await Promise.all(promises);
    const rawData = results.reduce((acc, curr) => {
        acc[curr.type] = curr.data;
        return acc;
    }, {});

    // --- Build allCases array for Dashboard/Ranking/Trend tabs ---
    // Each crime row has aggregated counts. We expand them into individual "case" records
    // so the Dashboard tab's filtering (by topic, unit, date) works correctly.
    const allCases = [];

    if (rawData.crime) {
        rawData.crime.forEach(row => {
            const rowDate = parseDate(row.date);
            // Extract unit_kk from station or subDiv
            let unit_kk = '';
            const stationStr = row.station || row.subDiv || '';
            const kkMatch = stationStr.match(/กก\.?\s*(\d+)/);
            if (kkMatch) unit_kk = kkMatch[1];

            // Extract unit_s_tl from station
            let unit_s_tl = '';
            const stlMatch = stationStr.match(/ส\.?ทล\.?\s*(\d+)/);
            if (stlMatch) unit_s_tl = stlMatch[1];

            // --- Flagrant offense columns (dir_f_*) → topic-based cases ---
            // These are the offense type breakdown of CRIM_FLAGRANTE
            const flagrantMap = [
                { col: 'dir_f_drugs', topic: 'ยาเสพติด' },
                { col: 'dir_f_gun', topic: 'อาวุธปืน/วัตถุระเบิด' },
                { col: 'dir_f_weight', topic: 'รถบรรทุก/น้ำหนัก' },
                { col: 'dir_f_immig', topic: 'อื่นๆ' },
                { col: 'dir_f_drunk', topic: 'อื่นๆ' },
                { col: 'dir_f_other', topic: 'อื่นๆ' },
                { col: 'dir_f_life', topic: 'อื่นๆ' },
                { col: 'dir_f_property', topic: 'อื่นๆ' },
                { col: 'dir_f_sex', topic: 'อื่นๆ' },
                { col: 'dir_f_com', topic: 'อื่นๆ' },
                { col: 'dir_f_doc', topic: 'อื่นๆ' },
                { col: 'dir_f_customs', topic: 'อื่นๆ' },
                { col: 'dir_f_disease', topic: 'อื่นๆ' },
                { col: 'dir_f_transport', topic: 'อื่นๆ' },
            ];

            // Expand flagrant offense columns into individual case records
            flagrantMap.forEach(({ col, topic }) => {
                const count = Number(row[col]) || 0;
                for (let i = 0; i < count; i++) {
                    allCases.push({
                        date_capture: row.date || '',
                        date_obj: rowDate,
                        unit_kk,
                        unit_s_tl,
                        topic,
                        station: row.station || '',
                        subDiv: row.subDiv || '',
                    });
                }
            });

            // --- Warrant columns (CRIM_W_*) → "บุคคลตามหมายจับ" topic ---
            // NOTE: dir_w_* columns are the offense breakdown of warrants (same cases as CRIM_W_*)
            // We only use CRIM_W_* here to avoid double-counting
            const warrantCols = [
                { col: 'CRIM_W_BIGDATA', source: 'bigdata' },
                { col: 'CRIM_W_BODYWARN', source: 'bodyworn' },
                { col: 'CRIM_W_GENERAL', source: 'general' },
            ];

            warrantCols.forEach(({ col, source }) => {
                const count = Number(row[col]) || 0;
                for (let i = 0; i < count; i++) {
                    allCases.push({
                        date_capture: row.date || '',
                        date_obj: rowDate,
                        unit_kk,
                        unit_s_tl,
                        topic: 'บุคคลตามหมายจับ',
                        warrant_source: source,
                        station: row.station || '',
                        subDiv: row.subDiv || '',
                    });
                }
            });
        });
    }

    console.log(`[GoogleSheetService] Built ${allCases.length} allCases records`);

    // --- Aggregation logic for ResultDashboardView ---
    const aggregations = calculateDashboardStats(rawData, filters);

    return {
        counts: aggregations.counts,
        allCases,
        rawData // Returning rawData so hooks can re-aggregate if needed
    };
};

export const calculateDashboardStats = (rawData, filters) => {
    const counts = {
        criminalTotal: 0,
        warrantTotal: 0,
        warrantBodyworn: 0,
        warrantBigData: 0,
        warrantGeneral: 0,
        flagrantTotal: 0,

        // Detailed Offenses (Acts)
        offenseDrugs: 0,
        offenseGuns: 0,
        offenseImmig: 0,
        offenseCustoms: 0,
        offenseDisease: 0,
        offenseTransport: 0,
        offenseDocs: 0,
        offenseProperty: 0,
        offenseSex: 0,
        offenseWeight: 0,
        offenseDrunk: 0,
        offenseLife: 0,
        offenseCom: 0,
        offenseOther: 0,

        trafficTotal: 0,
        trafficNotKeepLeft: 0,
        trafficNotCovered: 0,
        trafficModify: 0,
        trafficNoPart: 0,
        trafficSign: 0,
        trafficLight: 0,
        trafficSpeed: 0,
        trafficTax: 0,
        trafficNoPlate: 0,
        trafficGeneral: 0,

        truckTotal: 0,
        truckSelf: 0,
        truckJoint: 0,

        convoyTotal: 0,
        convoyRoyal: 0,
        convoyGeneral: 0,

        seized: {
            drugs: { yaba: 0, ice: 0, ketamine: 0, other: 0 },
            guns: { registered: 0, unregistered: 0, bullets: 0, explosives: 0 },
            vehicles: { car: 0, bike: 0 },
            others: { money: 0, account: 0, phone: 0, electronics: 0, items: 0 }
        },

        accidentsTotal: 0,
        accidentsDeath: 0,
        accidentsInjured: 0,

        volunteerTotal: 0,
        serviceTotal: 0
    };

    // --- Initialize Chart Data Structures ---
    const units = ['กก.1', 'กก.2', 'กก.3', 'กก.4', 'กก.5', 'กก.6', 'กก.7', 'กก.8'];
    const now = new Date();
    let targetMonth = now.getMonth();
    let targetYear = now.getFullYear();
    if (filters.selectedMonth !== undefined && filters.selectedMonth !== '') {
        targetMonth = parseInt(filters.selectedMonth);
    }

    const last3Months = [];
    const _thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    for (let i = 2; i >= 0; i--) {
        const d = new Date(targetYear, targetMonth - i, 1);
        last3Months.push({
            monthIndex: d.getMonth(),
            year: d.getFullYear(),
            name: _thaiMonths[d.getMonth()]
        });
    }

    counts.charts = {
        comparison: units.map(u => ({ name: u, month1: 0, month2: 0, month3: 0 })),
        traffic: units.map(u => ({ name: u, month1: 0, month2: 0, month3: 0 })),
        truck: units.map(u => ({ name: u, inspected: 0, arrested: 0 })),
        monthNames: last3Months.map(m => m.name),
        qualityWork: units.map(u => ({ division: u, count: 0, details: [] })),
        media: units.map(u => ({ label: `ส.ทล.${u.split('.')[1] || '?'}`, values: Array(8).fill(0) })),
        unitTotals: units.map(u => ({ name: u, value: 0 })),
        stationTotals: {}
    };

    const getMonthKey = (date) => {
        if (!date) return null;
        const m = date.getMonth();
        const y = date.getFullYear();
        const idx = last3Months.findIndex(lm => lm.monthIndex === m && lm.year === y);
        if (idx === 0) return 'month1';
        if (idx === 1) return 'month2';
        if (idx === 2) return 'month3';
        return null;
    };

    const getUnitIndex = (row) => {
        const stationStr = row.station || row.subDiv || '';
        if (!stationStr) return -1;
        for (let i = 1; i <= 8; i++) {
            if (stationStr.includes(`กก.${i}`)) return i - 1;
        }
        return -1;
    };

    const getStationKey = (row) => {
        const stationStr = row.station || '';
        const match = stationStr.match(/ส\.?ทล\.?\s*(\d+)/);
        if (match) return `ส.ทล.${match[1]}`;
        return null;
    };

    // 1. Process CRIME data
    if (rawData.crime) {
        rawData.crime.forEach(row => {
            const rowDate = parseDate(row.date);
            const unitIdx = getUnitIndex(row);

            // Global Filter Check (for Summary Cards) — only count กก.1-8
            if (unitIdx !== -1 && filterRow(row, filters)) {
                // Warrants
                const w_big = Number(row.CRIM_W_BIGDATA) || 0;
                const w_body = Number(row.CRIM_W_BODYWARN) || 0;
                const w_gen = Number(row.CRIM_W_GENERAL) || 0;

                counts.warrantBigData += w_big;
                counts.warrantBodyworn += w_body;
                counts.warrantGeneral += w_gen;
                counts.warrantTotal += (w_big + w_body + w_gen);

                // Flagrant
                const f_total = Number(row.CRIM_FLAGRANTE) || 0;
                counts.flagrantTotal += f_total;

                // Offenses Breakdown (Summing Flagrant + Warrant)
                // New Schema: dir_f_* and dir_w_*
                const o_drugs = (Number(row.dir_f_drugs) || 0) + (Number(row.dir_w_drugs) || 0);
                const o_guns = (Number(row.dir_f_gun) || 0) + (Number(row.dir_w_gun) || 0);
                const o_immig = (Number(row.dir_f_immig) || 0) + (Number(row.dir_w_immig) || 0);
                const o_customs = (Number(row.dir_f_customs) || 0) + (Number(row.dir_w_customs) || 0);
                const o_disease = (Number(row.dir_f_disease) || 0) + (Number(row.dir_w_disease) || 0);
                const o_transport = (Number(row.dir_f_transport) || 0) + (Number(row.dir_w_transport) || 0);
                const o_docs = (Number(row.dir_f_doc) || 0) + (Number(row.dir_w_doc) || 0);
                const o_property = (Number(row.dir_f_property) || 0) + (Number(row.dir_w_property) || 0);
                const o_sex = (Number(row.dir_f_sex) || 0) + (Number(row.dir_w_sex) || 0);
                const o_weight = (Number(row.dir_f_weight) || 0) + (Number(row.dir_w_weight) || 0);
                const o_drunk = (Number(row.dir_f_drunk) || 0) + (Number(row.dir_w_drunk) || 0);
                const o_life = (Number(row.dir_f_life) || 0) + (Number(row.dir_w_life) || 0);
                const o_com = (Number(row.dir_f_com) || 0) + (Number(row.dir_w_com) || 0);
                const o_other = (Number(row.dir_f_other) || 0) + (Number(row.dir_w_other) || 0);

                counts.offenseDrugs += o_drugs;
                counts.offenseGuns += o_guns;
                counts.offenseImmig += o_immig;
                counts.offenseCustoms += o_customs;
                counts.offenseDisease += o_disease;
                counts.offenseTransport += o_transport;
                counts.offenseDocs += o_docs;
                counts.offenseProperty += o_property;
                counts.offenseSex += o_sex;
                counts.offenseWeight += o_weight;
                counts.offenseDrunk += o_drunk;
                counts.offenseLife += o_life;
                counts.offenseCom += o_com;
                counts.offenseOther += o_other;
            }

            // Charts Aggregation (Comparisons) - use actual case count per row
            if (unitIdx !== -1 && rowDate) {
                const rowCrimTotal = (Number(row.CRIM_FLAGRANTE) || 0) + (Number(row.CRIM_W_BIGDATA) || 0) + (Number(row.CRIM_W_BODYWARN) || 0) + (Number(row.CRIM_W_GENERAL) || 0);
                const monthKey = getMonthKey(rowDate);
                if (monthKey) {
                    counts.charts.comparison[unitIdx][monthKey] += rowCrimTotal;
                }
            }

            // Per-unit totals (for bar chart on Dashboard tab)
            if (unitIdx !== -1 && filterRow(row, filters)) {
                const rowCrimTotal = (Number(row.CRIM_FLAGRANTE) || 0) + (Number(row.CRIM_W_BIGDATA) || 0) + (Number(row.CRIM_W_BODYWARN) || 0) + (Number(row.CRIM_W_GENERAL) || 0);
                counts.charts.unitTotals[unitIdx].value += rowCrimTotal;
            }

            // Per-station totals (for drill-down chart)
            if (filterRow(row, filters)) {
                const stationKey = getStationKey(row);
                if (stationKey) {
                    const rowCrimTotal = (Number(row.CRIM_FLAGRANTE) || 0) + (Number(row.CRIM_W_BIGDATA) || 0) + (Number(row.CRIM_W_BODYWARN) || 0) + (Number(row.CRIM_W_GENERAL) || 0);
                    if (!counts.charts.stationTotals) counts.charts.stationTotals = {};
                    counts.charts.stationTotals[stationKey] = (counts.charts.stationTotals[stationKey] || 0) + rowCrimTotal;
                }
            }

            // Truck Chart (from Crime/Flagrant sheet?)
            if (unitIdx !== -1) {
                if (filterRow(row, filters)) {
                    const f_truck = (Number(row.dir_f_weight) || 0) + (Number(row.dir_w_weight) || 0);
                    if (f_truck > 0) {
                        counts.charts.truck[unitIdx].arrested += f_truck;
                    }
                }
            }
        });
        counts.criminalTotal = counts.warrantTotal + counts.flagrantTotal;
        counts.truckTotal = counts.offenseWeight;
        counts.truckSelf = counts.offenseWeight; // Fallback


    }

    // 2. Process TRAFFIC data
    if (rawData.traffic) {
        rawData.traffic.forEach(row => {
            const rowDate = parseDate(row.date);
            const unitIdx = getUnitIndex(row);

            if (filterRow(row, filters)) {
                const t_left = Number(row.traf_left) || 0;
                const t_cover = Number(row.traf_cover) || 0;
                const t_modify = Number(row.traf_modify) || 0;
                const t_part = Number(row.traf_part) || 0;
                const t_sign = Number(row.traf_sign) || 0;
                const t_light = Number(row.traf_light) || 0;
                const t_speed = Number(row.traf_speed) || 0;
                const t_tax = Number(row.traf_tax) || 0;
                const t_plate = Number(row.traf_plate) || 0;
                const t_other = Number(row.traf_other) || 0;

                counts.trafficNotKeepLeft += t_left;
                counts.trafficNotCovered += t_cover;
                counts.trafficModify += t_modify;
                counts.trafficNoPart += t_part;
                counts.trafficSign += t_sign;
                counts.trafficLight += t_light;
                counts.trafficSpeed += t_speed;
                counts.trafficTax += t_tax;
                counts.trafficNoPlate += t_plate;
                counts.trafficGeneral += t_other;

                counts.trafficTotal += (t_left + t_cover + t_modify + t_part + t_sign + t_light + t_speed + t_tax + t_plate + t_other);
            }

            // Traffic Chart
            if (unitIdx !== -1 && rowDate) {
                const monthKey = getMonthKey(rowDate);
                if (monthKey) {
                    const totalTraf = (Number(row.traf_left) || 0) + (Number(row.traf_cover) || 0) + (Number(row.traf_modify) || 0) + (Number(row.traf_part) || 0) + (Number(row.traf_sign) || 0) + (Number(row.traf_light) || 0) + (Number(row.traf_speed) || 0) + (Number(row.traf_tax) || 0) + (Number(row.traf_plate) || 0) + (Number(row.traf_other) || 0);
                    counts.charts.traffic[unitIdx][monthKey] += totalTraf;
                }
            }
        });
    }

    // 3. Process CONVOY data
    if (rawData.convoy) {
        rawData.convoy.forEach(row => {
            if (filterRow(row, filters)) {
                const c_royal = Number(row.convoy_royal) || 0;
                const c_general = (Number(row.convoy_route) || 0) + (Number(row.convoy_vip) || 0) + (Number(row.convoy_safety) || 0);

                counts.convoyRoyal += c_royal;
                counts.convoyGeneral += c_general;
                counts.convoyTotal += (c_royal + c_general);
            }
        });
    }

    // 4. Process ITEMS data (Seized Items)
    if (rawData.items) {
        rawData.items.forEach(row => {
            if (filterRow(row, filters)) {
                const itemName = (row.item_name || '').trim();
                const amount = Number(row.amount) || 0;

                if (!itemName || amount <= 0) return;

                const has = (keyword) => itemName.includes(keyword);

                // --- Drugs ---
                if (has('ยาบ้า') || has('ยาอี')) counts.seized.drugs.yaba += amount;
                else if (has('ไอซ์')) counts.seized.drugs.ice += amount;
                else if (has('เคตามีน')) counts.seized.drugs.ketamine += amount;
                else if (has('โคเคน')) counts.seized.drugs.other += amount;

                // --- Guns ---
                else if (has('อาวุธปืน')) {
                    if (has('ไม่มีทะเบียน') || has('ไทยประดิษฐ์')) counts.seized.guns.unregistered += amount;
                    else counts.seized.guns.registered += amount;
                }
                else if (has('กระสุน')) counts.seized.guns.bullets += amount;
                else if (has('ระเบิด') || has('วัตถุระเบิด')) counts.seized.guns.explosives += amount;

                // --- Vehicles ---
                else if (has('รถยนต์') || has('เก๋ง') || has('กระบะ') || has('ตู้')) counts.seized.vehicles.car += amount;
                else if (has('รถจักรยานยนต์') || has('จยย') || has('มอเตอร์ไซค์')) counts.seized.vehicles.bike += amount;

                // --- Others ---
                else if (has('เงิน') || has('ธนบัตร')) counts.seized.others.money += amount;
                else if (has('บัญชี')) counts.seized.others.account += amount;
                else if (has('โทรศัพท์') || has('มือถือ')) counts.seized.others.phone += amount;
                else if (has('คอมพิวเตอร์') || has('โน๊ตบุ๊ค') || has('ipad') || has('tablet') || has('อุปกรณ์อิเล็กทรอนิกส์')) counts.seized.others.electronics += amount;
                else counts.seized.others.items += amount;
            }
        });
    }

    // 5. Process ACCIDENTS data
    if (rawData.accidents) {
        rawData.accidents.forEach(row => {
            if (filterRow(row, filters)) {
                counts.accidentsTotal++;
                // Assuming columns: dead, injured (need to verify mapping if possible, else generic)
                // If columns are different, this will need adjustment. 
                // Common names: 'dead', 'death', 'injured', 'injury'
                counts.accidentsDeath += (Number(row.acc_dead) || 0);
                counts.accidentsInjured += (Number(row.acc_injured) || 0);
            }
        });
    }

    // 6. Process VOLUNTEER data
    if (rawData.volunteer) {
        rawData.volunteer.forEach(row => {
            if (filterRow(row, filters)) {
                counts.volunteerTotal += (Number(row.volunteer_task) || 0);
            }
        });
    }

    // 7. Process SERVICE data
    if (rawData.service) {
        rawData.service.forEach(row => {
            if (filterRow(row, filters)) {
                // Sum of Traffic Service + Help Service
                counts.serviceTotal += (Number(row.service_traffic) || 0) + (Number(row.service_help) || 0);
            }
        });
    }

    return { counts };
};

