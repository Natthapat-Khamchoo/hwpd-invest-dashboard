import { useState, useMemo, useEffect } from 'react';
import { DATE_RANGES } from '../utils/helpers';
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
            selectedMonth: now.getMonth() // Add selectedMonth for sync
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
            selectedMonth: now.getMonth()
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
                if (filters.period !== 'all') {
                    if (filters.rangeStart && item.date_obj < filters.rangeStart) dateMatch = false;
                    if (filters.rangeEnd && item.date_obj > filters.rangeEnd) dateMatch = false;
                }
            } else { if (filters.period !== 'all') dateMatch = false; }

            return searchMatch && kkMatch && stlMatch && dateMatch;
        });
    }, [filters.search, filters.unit_kk, filters.unit_s_tl, filters.period, filters.rangeStart, filters.rangeEnd, data]);

    /* --- 2. Final Filter (For Charts/Lists) --- */
    const filteredData = useMemo(() => {
        return baseFilteredData.filter(item => {
            const topicMatch = filters.topic.length === 0 || filters.topic.includes(item.topic);
            let subMatch = true;
            if (filters.subFilter) {
                if (filters.topic.includes('รถบรรทุก/น้ำหนัก')) {
                    const isJoint = item.captured_by && item.captured_by.includes('ร่วม');
                    if (filters.subFilter === 'joint' && !isJoint) subMatch = false;
                    if (filters.subFilter === 'self' && isJoint) subMatch = false;
                }
                if (filters.topic.includes('บุคคลตามหมายจับ')) {
                    const cleanSource = item.warrant_source ? item.warrant_source.toString().toLowerCase().replace(/\s/g, '') : '';
                    const isBigData = cleanSource.includes('bigdata') || cleanSource.includes('big');
                    if (filters.subFilter === 'bigdata' && !isBigData) subMatch = false;
                    if (filters.subFilter === 'general' && isBigData) subMatch = false;
                }
            }
            return topicMatch && subMatch;
        });
    }, [filters.topic, filters.subFilter, baseFilteredData]);

    const stats = useMemo(() => {
        const totalCases = baseFilteredData.length;
        const drugCases = baseFilteredData.filter(d => d.topic === 'ยาเสพติด').length;
        const weaponCases = baseFilteredData.filter(d => d.topic === 'อาวุธปืน/วัตถุระเบิด').length;
        const otherCases = baseFilteredData.filter(d => d.topic === 'อื่นๆ').length;

        const heavyTruckAll = baseFilteredData.filter(d => d.topic === 'รถบรรทุก/น้ำหนัก');
        const heavyTruckCases = heavyTruckAll.length;
        const heavyTruckJoint = heavyTruckAll.filter(d => d.captured_by && d.captured_by.includes('ร่วม')).length;
        const heavyTruckSelf = heavyTruckCases - heavyTruckJoint;

        const warrantAll = baseFilteredData.filter(d => d.topic === 'บุคคลตามหมายจับ');
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
            const unitData = filteredData.reduce((acc, curr) => { const key = `ส.ทล.${curr.unit_s_tl}`; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
            unitChartData = Object.entries(unitData)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => {
                    const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
                    const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
                    return numA - numB;
                });
        } else {
            unitChartTitle = "สถิติแยกตาม กองกำกับการ 1-8";
            const unitData = filteredData.reduce((acc, curr) => { const key = `กก.${curr.unit_kk}`; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
            const allKK = ['1', '2', '3', '4', '5', '6', '7', '8'];
            unitChartData = allKK.map(num => ({ name: `กก.${num}`, value: unitData[`กก.${num}`] || 0 }));
        }

        const monthsTH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        const yearlyData = data.filter(d => d.date_obj && d.date_obj.getFullYear() === parseInt(comparisonYear));
        const monthlyStats = Array(12).fill(0);
        yearlyData.forEach(d => { if (d.date_obj) monthlyStats[d.date_obj.getMonth()] += 1; });
        const monthlyChartData = monthsTH.map((m, i) => ({ name: m, cases: monthlyStats[i] }));

        return {
            totalCases, drugCases, weaponCases, heavyTruckCases, heavyTruckSelf, heavyTruckJoint,
            warrantCases, warrantGeneral, warrantBigData, otherCases,
            unitChartData, unitChartTitle, monthlyChartData
        };
    }, [baseFilteredData, filteredData, filters.unit_kk, data, comparisonYear]);

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
