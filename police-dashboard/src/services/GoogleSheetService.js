import Papa from 'papaparse';

const SHEETS = {
    CRIME: {
        id: '18JZlu3gupikJxPWSrtzgqQ2xRx2MXAwF7tlLXTe6TMk',
        gid: '684351662',
        name: 'crime'
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
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;
    return null;
};

// Helper to filter data by date/month and unit
const filterRow = (row, filters) => {
    // 1. Filter by Unit (KK)
    if (filters.unit_kk) {
        const station = row.station || '';
        if (!station.includes(`กก.${filters.unit_kk}`)) return false;
    }

    // 1.1 Filter by Station (S.TL)
    if (filters.unit_s_tl) {
        const station = row.station || '';
        // Check for specific station string e.g. "ส.ทล.1"
        // Need to be careful about matching, usually user selects "1" or "ส.ทล.1"
        // Let's assume passed value is just the number "1", "2" etc.
        // And station string in CSV is like "ส.ทล.1 กก.1 .."
        if (!station.includes(`ส.ทล.${filters.unit_s_tl}`)) return false;
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

    // --- Aggregation ---
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
            others: { money: 0, account: 0, phone: 0, items: 0 }
        }
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
        media: units.map(u => ({ label: `ส.ทล.${u.split('.')[1] || '?'}`, values: Array(8).fill(0) }))
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

    const getUnitIndex = (stationStr) => {
        if (!stationStr) return -1;
        for (let i = 1; i <= 8; i++) {
            if (stationStr.includes(`กก.${i}`)) return i - 1;
        }
        return -1;
    };

    // --- Normalize Data for App.jsx (List/Map/Analytics) ---
    const allCases = [];

    const addCase = (source, item, topic, unitIdx, dateObj) => {
        if (!item || !dateObj) return;

        // Robust Lat/Long parsing
        let rawLat = item['ละติจูด'] || item['lat'] || item['LAT'] || '';
        let rawLong = item['ลองจิจูด'] || item['long'] || item['lng'] || item['LONG'] || '';

        if (typeof rawLat === 'string') rawLat = rawLat.replace(/\s/g, '').replace(',', '.');
        if (typeof rawLong === 'string') rawLong = rawLong.replace(/\s/g, '').replace(',', '.');

        const latVal = parseFloat(rawLat);
        const longVal = parseFloat(rawLong);
        const isValidCoord = !isNaN(latVal) && !isNaN(longVal) && latVal !== 0 && longVal !== 0;

        allCases.push({
            id: `${source}-${allCases.length + 1}`,
            unit_kk: (unitIdx + 1).toString(),
            unit_s_tl: (item.station || '').match(/ส\.ทล\.(\d+)/)?.[1] || (item.station || '').match(/(\d+)/)?.[0] || '',
            topic: topic || 'อื่นๆ',
            original_topic: topic || 'อื่นๆ',
            arrest_type: item.arrest_type || '', // Adjust field names if needed based on actual CSV headers
            captured_by: item.captured_by || '',
            warrant_source: item.warrant_source || '',
            date_capture: item.date || '',
            date_obj: dateObj,
            time_capture: item.time || '',
            suspect_name: item.suspect_name || '-',
            charge: item.charge || '',
            location: item.location || '',
            lat: isValidCoord ? latVal.toFixed(6) : null,
            long: isValidCoord ? longVal.toFixed(6) : null,
        });
    };

    // 1. Process CRIME data
    if (rawData.crime) {
        rawData.crime.forEach(row => {
            const rowDate = parseDate(row.date);
            const unitIdx = getUnitIndex(row.station);

            // Add to allCases for Analytics
            // Determine Main Topic based on columns
            // Determine Main Topic based on columns
            let mainTopic = 'คดีอาญา';
            let warrantSource = '';

            if (Number(row.CRIM_W_BIGDATA) > 0) {
                mainTopic = 'บุคคลตามหมายจับ';
                warrantSource = 'Big Data';
            } else if (Number(row.CRIM_W_BODYWARN) > 0) {
                mainTopic = 'บุคคลตามหมายจับ';
                warrantSource = 'Bodyworn';
            } else if (Number(row.CRIM_W_GENERAL) > 0) {
                mainTopic = 'บุคคลตามหมายจับ';
                warrantSource = 'General';
            } else if (Number(row.dir_drugs) > 0) mainTopic = 'ยาเสพติด';
            else if (Number(row.dir_gun) > 0) mainTopic = 'อาวุธปืน/วัตถุระเบิด';
            else if (Number(row.dir_immig) > 0) mainTopic = 'ต่างด้าว/ตม.';
            else if (Number(row.dir_weight) > 0) mainTopic = 'รถบรรทุก/น้ำหนัก';

            if (warrantSource && !row.warrant_source) {
                row.warrant_source = warrantSource;
            }

            if (unitIdx !== -1) {
                addCase('crime', row, mainTopic, unitIdx, rowDate);
            }

            // Global Filter Check (for Summary Cards)
            if (filterRow(row, filters)) {
                // Warrants
                // Warrants
                const w_big = Number(row.CRIM_W_BIGDATA) || 0;
                const w_body = Number(row.CRIM_W_BODYWARN) || 0;
                const w_gen = Number(row.CRIM_W_GENERAL) || 0;

                counts.warrantBigData += w_big;
                counts.warrantBodyworn += w_body;
                counts.warrantGeneral += w_gen;
                counts.warrantTotal += (w_big + w_body + w_gen);

                // Flagrant - Strict mapping from CRIM_FLAGRANTE
                const f_total = Number(row.CRIM_FLAGRANTE) || 0;
                counts.flagrantTotal += f_total;

                // Offenses Breakdown
                const o_drugs = Number(row.dir_drugs) || 0;
                const o_guns = Number(row.dir_gun) || 0;
                const o_immig = Number(row.dir_immig) || 0;
                const o_customs = Number(row.dir_customs) || 0;
                const o_disease = Number(row.dir_disease) || 0;
                const o_transport = Number(row.dir_transport) || 0;
                const o_docs = Number(row.dir_doc) || 0;
                const o_property = Number(row.dir_property) || 0;
                const o_sex = Number(row.dir_sex) || 0;
                const o_weight = Number(row.dir_weight) || 0;
                const o_drunk = Number(row.dir_drunk) || 0;
                const o_life = Number(row.dir_life) || 0;  // ความผิดเกี่ยวกับชีวิตและร่างกาย
                const o_com = Number(row.dir_com) || 0;    // ความผิดเกี่ยวกับคอมพิวเตอร์
                const o_other = Number(row.dir_other) || 0;

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

                // NOTE: removed fallback logic for flagrantTotal to strictly follow user requirement (CRIM_FLAGRANTE only)
            }

            // Charts Aggregation (Comparisons)
            if (unitIdx !== -1 && rowDate) {
                const monthKey = getMonthKey(rowDate);
                if (monthKey) {
                    counts.charts.comparison[unitIdx][monthKey] += 1;
                }
            }

            // Truck Chart (from Crime/Flagrant sheet?)
            if (unitIdx !== -1) {
                if (filterRow(row, filters)) {
                    // Assuming dir_weight corresponds to Truck/Weight cases
                    const f_truck = Number(row.dir_weight) || 0;
                    if (f_truck > 0) {
                        counts.charts.truck[unitIdx].arrested += f_truck;
                        // Assuming total inspected is not in this sheet or is same as arrested for now unless specified
                    }
                }
            }
        });
        counts.criminalTotal = counts.warrantTotal + counts.flagrantTotal;

        // Fix truckTotal to use dir_weight as well, as 'flagrantTruck' variable was removed/not mapped
        counts.truckTotal = counts.offenseWeight;
        counts.truckSelf = counts.offenseWeight; // Fallback since no specific breakdown for Self/Joint in this list
    }

    // 2. Process TRAFFIC data
    if (rawData.traffic) {
        rawData.traffic.forEach(row => {
            const rowDate = parseDate(row.date);
            const unitIdx = getUnitIndex(row.station);

            if (unitIdx !== -1) {
                addCase('traffic', row, 'จราจร/ขนส่ง', unitIdx, rowDate);
            }

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
            // Convoy usually doesn't count as "Cases" in the list, but if needed:
            // const rowDate = parseDate(row.date);
            // const unitIdx = getUnitIndex(row.station);
            // if (unitIdx !== -1) addCase('convoy', row, 'อำนวยความสะดวก/ขบวน', unitIdx, rowDate);

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

                // Helper to check keywords
                const has = (keyword) => itemName.includes(keyword);

                // --- Drugs ---
                if (has('ยาบ้า')) counts.seized.drugs.yaba += amount;
                else if (has('ไอซ์')) counts.seized.drugs.ice += amount;
                else if (has('เคตามีน')) counts.seized.drugs.ketamine += amount;
                else if (has('เฮโรอีน') || has('ยาอี') || has('ยาเสพติด')) counts.seized.drugs.other += amount;

                // --- Guns ---
                else if (has('อาวุธปืน')) {
                    // User didn't specify reg/unreg, so map to registered by default or sum?
                    // Let's assume registered if not specified, or checks for 'ทะเบียน'
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
                else counts.seized.others.items += amount;
            }
        });
    }

    return { counts, allCases };
};
