import { useState, useMemo, useEffect } from 'react';
import { DATE_RANGES, UNIT_HIERARCHY } from '../utils/helpers';
import { calculateDashboardStats } from '../services/GoogleSheetService';

export const useDashboardLogic = (data, rawData) => {
    const [comparisonYear, setComparisonYear] = useState(new Date().getFullYear().toString());
    const [localSearch, setLocalSearch] = useState('');

    // default filter state
    const [filters, setFilters] = useState(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        return {
            search: '',
            period: 'this_month',
            rangeStart: startOfMonth,
            rangeEnd: endOfMonth,
            unit_kk: '', unit_s_tl: '', topic: [], charge: '',
            subFilter: null,
            selectedMonth: now.getMonth(),
            selectedYear: now.getFullYear()
        };
    });

    // Sync localSearch to filters.search with debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: localSearch }));
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [localSearch]);

    // --- Handlers ---
    const resetFilters = () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        setFilters({
            search: '',
            period: 'this_month',
            rangeStart: startOfMonth,
            rangeEnd: endOfMonth,
            unit_kk: '', unit_s_tl: '', topic: [], charge: '',
            subFilter: null,
            selectedMonth: now.getMonth(),
            selectedYear: now.getFullYear()
        });
        setLocalSearch('');
        setComparisonYear(new Date().getFullYear().toString());
    };

    const filterOptions = useMemo(() => {
        const topics = [...new Set(data.map(d => d.topic))].filter(Boolean).sort();
        return { topics };
    }, [data]);

    /* --- 1. Base Filter (For KPI Cards) --- */
    const baseFilteredData = useMemo(() => {
        return data.filter(item => {
            const searchMatch = !filters.search ||
                (item.charge && item.charge.toLowerCase().includes(filters.search.toLowerCase())) ||
                (item.suspect_name && item.suspect_name.toLowerCase().includes(filters.search.toLowerCase())) ||
                (item.location && item.location.toLowerCase().includes(filters.search.toLowerCase()));

            const kkMatch = !filters.unit_kk || String(item.unit_kk) === String(filters.unit_kk);
            const stlMatch = !filters.unit_s_tl || String(item.unit_s_tl) === String(filters.unit_s_tl);

            let dateMatch = true;
            if (item.date_obj) {
                // If selectedMonth and selectedYear are explicitly set, prioritize them
                if (filters.selectedMonth !== undefined && filters.selectedMonth !== null && filters.selectedMonth !== '') {
                    if (item.date_obj.getMonth() !== parseInt(filters.selectedMonth)) dateMatch = false;
                }
                if (filters.selectedYear !== undefined && filters.selectedYear !== null && filters.selectedYear !== '') {
                    if (item.date_obj.getFullYear() !== parseInt(filters.selectedYear)) dateMatch = false;
                }
                
                // Fallback to range checks for compatibility if period is not 'all'
                if (filters.period !== 'all' && (filters.selectedMonth === '' || filters.selectedYear === '')) {
                    if (filters.rangeStart && item.date_obj < filters.rangeStart) dateMatch = false;
                    if (filters.rangeEnd && item.date_obj > filters.rangeEnd) dateMatch = false;
                }
            } else { if (filters.period !== 'all') dateMatch = false; }

            return searchMatch && kkMatch && stlMatch && dateMatch;
        });
    }, [filters.search, filters.unit_kk, filters.unit_s_tl, filters.period, filters.rangeStart, filters.rangeEnd, filters.selectedMonth, filters.selectedYear, data]);

    /* --- 2. Final Filter (For Charts/Lists) --- */
    const filteredData = useMemo(() => {
        return baseFilteredData.filter(item => {
            let topicMatch = true;
            if (filters.topic && filters.topic.length > 0) {
                topicMatch = filters.topic.includes(item.topic);
            } else {
                // If no specific topic is selected, exclude isWarrantOffense from the general view
                if (item.isWarrantOffense) return false;
            }

            let subMatch = true;
            if (filters.topic.includes('รถบรรทุก/น้ำหนัก')) {
                const isJoint = item.captured_by && item.captured_by.includes('ร่วม');
                if (filters.subFilter === 'joint' && !isJoint) subMatch = false;
                if (filters.subFilter === 'self' && isJoint) subMatch = false;
            } else if (filters.topic.includes('บุคคลตามหมายจับ')) {
                // If it's a specific offense warrant (isWarrantOffense), it doesn't belong to the 'บุคคลตามหมายจับ' filtering view
                if (item.isWarrantOffense) return false;

                if (filters.subFilter) {
                    const isBigData = item.warrant_source === 'bigdata';
                    if (filters.subFilter === 'bigdata' && !isBigData) subMatch = false;
                    if (filters.subFilter === 'general' && isBigData) subMatch = false;
                }
            }
            return topicMatch && subMatch;
        });
    }, [filters.topic, filters.subFilter, baseFilteredData]);

    const stats = useMemo(() => {
        // Exclude isWarrantOffense from these base metrics to avoid double counting baseline totals
        const realFilteredData = baseFilteredData.filter(d => !d.isWarrantOffense);

        const totalCases = realFilteredData.length;
        const drugCases = realFilteredData.filter(d => d.topic === 'ยาเสพติด').length;
        const weaponCases = realFilteredData.filter(d => d.topic === 'อาวุธปืน/วัตถุระเบิด').length;
        const otherCases = realFilteredData.filter(d => d.topic === 'อื่นๆ').length;

        const heavyTruckAll = realFilteredData.filter(d => d.topic === 'รถบรรทุก/น้ำหนัก');
        const heavyTruckCases = heavyTruckAll.length;
        const heavyTruckJoint = heavyTruckAll.filter(d => d.captured_by && d.captured_by.includes('ร่วม')).length;
        const heavyTruckSelf = heavyTruckCases - heavyTruckJoint;

        const warrantAll = realFilteredData.filter(d => d.topic === 'บุคคลตามหมายจับ');
        const warrantCases = warrantAll.length;
        const warrantBigData = warrantAll.filter(d => {
            if (!d.warrant_source) return false;
            const cleanSource = d.warrant_source.toString().toLowerCase().replace(/\s/g, '');
            return cleanSource.includes('bigdata') || cleanSource.includes('big');
        }).length;
        const warrantGeneral = warrantCases - warrantBigData;

        let unitChartData = [];
        let unitChartTitle = "";
        if (filters.unit_kk) {
            unitChartTitle = `สถิติ ส.ทล. (กก.${filters.unit_kk})`;
            const maxStations = UNIT_HIERARCHY[filters.unit_kk] || 6;
            
            // Generate base array of all stations for this KK (e.g., 1 to 6)
            const allStationsForKK = Array.from({ length: maxStations }, (_, i) => `ส.ทล.${i + 1}`);
            
            // Count actual data
            const countsMap = filteredData.reduce((acc, curr) => { 
                if (curr.unit_s_tl) {
                    const key = `ส.ทล.${curr.unit_s_tl}`;
                    acc[key] = (acc[key] || 0) + 1; 
                }
                return acc; 
            }, {});

            // Map base array to counts to ensure missing units show 0
            unitChartData = allStationsForKK.map(name => ({
                name,
                value: countsMap[name] || 0
            }));
        } else {
            unitChartTitle = "สถิติแยกตาม กองกำกับการ 1-8";
            const unitData = filteredData.reduce((acc, curr) => {
                const key = curr.unit_kk ? `กก.${curr.unit_kk}` : null;
                if (key) acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});
            const allKK = ['1', '2', '3', '4', '5', '6', '7', '8'];
            unitChartData = allKK.map(num => ({ name: `กก.${num}`, value: unitData[`กก.${num}`] || 0 }));
        }

        const targetYear = comparisonYear || filters.selectedYear || new Date().getFullYear();
        const targetYearInt = parseInt(targetYear);
        const monthlyStats = Array(12).fill(0);

        if ((!filters.topic || filters.topic.length === 0) && rawData && rawData.crime) {
            // Compute from rawData directly to match the KPI card's CRIM_FLAGRANTE total
            const parseDateLocal = (dateStr) => {
                if (!dateStr) return null;
                const parts = dateStr.split(/[-/]/);
                if (parts.length === 3) {
                    if (parts[0].length === 4) return new Date(parts[0], parts[1] - 1, parts[2]);
                    if (parts[2].length === 4) return new Date(parts[2], parts[1] - 1, parts[0]);
                }
                const d = new Date(dateStr);
                return isNaN(d.getTime()) ? null : d;
            };

            rawData.crime.forEach(row => {
                const rowDate = parseDateLocal(row.date);
                if (!rowDate || rowDate.getFullYear() !== targetYearInt) return;

                // Match Search
                const searchStr = ((row.charge || "") + " " + (row.suspect_name || "") + " " + (row.location || "")).toLowerCase();
                if (filters.search && !searchStr.includes(filters.search.toLowerCase())) return;

                // Match Unit
                const stationStr = row.station || row.subDiv || '';
                let unit_kk = '', unit_s_tl = '';
                const kkMatch = stationStr.match(/(?:กก\.?|กองกำกับการ)\s*(\d+)/);
                if (kkMatch) unit_kk = kkMatch[1];
                const stlMatch = stationStr.match(/(?:ส\.?ทล\.?|สถานีตำรวจทางหลวง)\s*(\d+)/);
                if (stlMatch) unit_s_tl = stlMatch[1];

                if (filters.unit_kk && String(unit_kk) !== String(filters.unit_kk)) return;
                if (filters.unit_s_tl && String(unit_s_tl) !== String(filters.unit_s_tl)) return;

                // Accumulate Grand Total (flagrant + warrants)
                const crimTotal = (Number(row.CRIM_FLAGRANTE) || 0) + (Number(row.CRIM_W_BIGDATA) || 0) + (Number(row.CRIM_W_BODYWARN) || 0) + (Number(row.CRIM_W_GENERAL) || 0);
                monthlyStats[rowDate.getMonth()] += crimTotal;
            });
        } else {
            // When a topic is active, filter allCases (data)
            const yearlyData = data.filter(item => {
                if (!item.date_obj || item.date_obj.getFullYear() !== targetYearInt) return false;

                const searchMatch = !filters.search ||
                    (item.charge && item.charge.toLowerCase().includes(filters.search.toLowerCase())) ||
                    (item.suspect_name && item.suspect_name.toLowerCase().includes(filters.search.toLowerCase())) ||
                    (item.location && item.location.toLowerCase().includes(filters.search.toLowerCase()));
                if (!searchMatch) return false;

                const kkMatch = !filters.unit_kk || String(item.unit_kk) === String(filters.unit_kk);
                const stlMatch = !filters.unit_s_tl || String(item.unit_s_tl) === String(filters.unit_s_tl);
                if (!kkMatch || !stlMatch) return false;

                let topicMatch = true;
                if (filters.topic && filters.topic.length > 0) {
                    topicMatch = filters.topic.includes(item.topic);
                } else {
                    if (item.isWarrantOffense) return false;
                }

                let subMatch = true;
                if (filters.topic && filters.topic.includes('รถบรรทุก/น้ำหนัก')) {
                    const isJoint = item.captured_by && item.captured_by.includes('ร่วม');
                    if (filters.subFilter === 'joint' && !isJoint) subMatch = false;
                    if (filters.subFilter === 'self' && isJoint) subMatch = false;
                } else if (filters.topic && filters.topic.includes('บุคคลตามหมายจับ')) {
                    if (item.isWarrantOffense) return false;
                    if (filters.subFilter) {
                        const isBigData = item.warrant_source && (item.warrant_source.toString().toLowerCase().includes('bigdata') || item.warrant_source.toString().toLowerCase().includes('big'));
                        if (filters.subFilter === 'bigdata' && !isBigData) subMatch = false;
                        if (filters.subFilter === 'general' && isBigData) subMatch = false;
                    }
                }

                return topicMatch && subMatch;
            });
            yearlyData.forEach(d => { if (d.date_obj) monthlyStats[d.date_obj.getMonth()] += 1; });
        }

        const monthsTH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        const monthlyChartData = monthsTH.map((m, i) => ({ name: m, cases: monthlyStats[i] }));

        return {
            totalCases, drugCases, weaponCases, heavyTruckCases, heavyTruckSelf, heavyTruckJoint,
            warrantCases, warrantGeneral, warrantBigData, otherCases,
            unitChartData, unitChartTitle, monthlyChartData
        };
    }, [baseFilteredData, filteredData, filters, data, comparisonYear, rawData]);

    const detailedStats = useMemo(() => {
        if (!rawData || Object.keys(rawData).length === 0) return null;
        const result = calculateDashboardStats(rawData, filters);
        return result.counts;
    }, [rawData, filters]);

    return {
        filters, setFilters,
        localSearch, setLocalSearch,
        comparisonYear, setComparisonYear,
        filterOptions,
        baseFilteredData,
        filteredData,
        stats,
        detailedStats,
        resetFilters
    };
};
