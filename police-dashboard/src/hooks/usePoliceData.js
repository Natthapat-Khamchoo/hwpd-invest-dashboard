import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { normalizeTopic, parseDateRobust } from '../utils/helpers';

export const usePoliceData = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = () => {
            const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT7T6Y-YtzckfCVfL1revX_qX4J90QMF3oVZhI54bKwGxCcDS4h-YjlSHrAjZu3_X5Ie_ENzuAXhMN5/pub?output=csv';

            Papa.parse(GOOGLE_SHEET_CSV_URL, {
                download: true,
                header: true,
                complete: (results) => {
                    console.log('📂 [usePoliceData] Raw CSV Headers:', results.meta.fields);

                    // Inspect unique values in 'กก.' column
                    const uniqueUnits = new Set();
                    results.data.forEach(row => {
                        if (row['กก.']) uniqueUnits.add(`"${row['กก.']}"`);
                    });
                    console.log('🏢 [usePoliceData] Found Units in Raw Data:', Array.from(uniqueUnits));

                    const formattedData = results.data
                        .filter(item => {
                            const hasTopic = !!item['หัวข้อ'];
                            const hasUnit = !!item['กก.'];
                            if (!hasUnit && item['หัวข้อ']) {
                                // Log items that are skipped due to missing unit
                                console.warn('⚠️ [usePoliceData] Skipping row with topic but no unit:', item);
                            }
                            return hasTopic && hasUnit;
                        })
                        .map((item, index) => {
                            const rawDate = item['วันที่'] ? item['วันที่'].trim() : '';
                            const { dateObj, thaiYear } = parseDateRobust(rawDate);
                            const rawTopic = item['หัวข้อ']?.toString().trim() || '';

                            const arrestVal = item['ประเภทการจับกุม'] || '';
                            const capturedByVal = item['จับโดย'] || '';
                            const warrantVal = item['ประเภทการจับกุม'] || item['ประเภทหมายจับ'] || item['หมายเหตุ'] || item['ที่มาข้อมูล'] || '';

                            // Robust Lat/Long parsing
                            let rawLat = item['ละติจูด'] || item['lat'] || item['LAT'] || '';
                            let rawLong = item['ลองจิจูด'] || item['long'] || item['lng'] || item['LONG'] || '';

                            // Clean strings (remove spaces, handle commas)
                            if (typeof rawLat === 'string') rawLat = rawLat.replace(/\s/g, '').replace(',', '.');
                            if (typeof rawLong === 'string') rawLong = rawLong.replace(/\s/g, '').replace(',', '.');

                            const latVal = parseFloat(rawLat);
                            const longVal = parseFloat(rawLong);

                            const isValidCoord = !isNaN(latVal) && !isNaN(longVal) && latVal !== 0 && longVal !== 0;

                            return {
                                id: index + 1,
                                unit_kk: item['กก.']?.toString().trim() || 'Unknown',
                                unit_s_tl: item['ส.ทล.']?.toString().trim() || '',
                                topic: normalizeTopic(rawTopic),
                                original_topic: rawTopic,
                                arrest_type: arrestVal,
                                captured_by: capturedByVal,
                                warrant_source: warrantVal,
                                date_capture: rawDate, date_obj: dateObj, year: thaiYear,
                                time_capture: item['เวลา'] || '', suspect_name: item['ชื่อ'] || '-',
                                charge: item['ข้อหา'] || '', location: item['สถานที่จับกุม'] || '',
                                lat: isValidCoord ? latVal.toFixed(6) : null,
                                long: isValidCoord ? longVal.toFixed(6) : null,
                            };
                        });
                    setData(formattedData);
                    setLoading(false);
                },
                error: (err) => {
                    console.error(err);
                    setLoading(false);
                }
            });
        };

        fetchData();
        const intervalId = setInterval(fetchData, 300000); // 5 minutes
        return () => clearInterval(intervalId);
    }, []);

    return { data, loading };
};
