import { useMemo } from 'react';

export const useAnalytics = (data, filters, rawData = null) => {
    return useMemo(() => {
        // Helper: Parse date from string
        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            const ddmmyyyy = dateStr.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
            if (ddmmyyyy) return new Date(ddmmyyyy[3], ddmmyyyy[2] - 1, ddmmyyyy[1]);
            const yyyymmdd = dateStr.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})/);
            if (yyyymmdd) return new Date(yyyymmdd[1], yyyymmdd[2] - 1, yyyymmdd[3]);
            const d = new Date(dateStr);
            return !isNaN(d.getTime()) ? d : null;
        };

        // Helper: Check date filter for a given date object
        const matchDateFilter = (dateObj) => {
            if (!dateObj) return false;
            const itemDate = new Date(dateObj);
            itemDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (filters.selectedMonth !== undefined && filters.selectedMonth !== null && filters.selectedMonth !== '') {
                return itemDate.getMonth() === parseInt(filters.selectedMonth) && itemDate.getFullYear() === today.getFullYear();
            }
            if (filters.period === 'all' || !filters.period) return true;
            if (filters.period === 'today') return itemDate.getTime() === today.getTime();
            if (filters.period === 'yesterday') {
                const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
                return itemDate.getTime() === yesterday.getTime();
            }
            if (filters.period === 'this_month') return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
            if (filters.period === 'custom' && filters.rangeStart && filters.rangeEnd) return dateObj >= filters.rangeStart && dateObj <= filters.rangeEnd;
            return true;
        };

        // 0. Filter Data based on global filters (same logic as dashboard)
        const filteredData = data.filter(item => {
            // Basic Filters
            const matchesTopic = filters.topic.length === 0 || filters.topic.includes(item.topic);
            const matchesSearch = !filters.search ||
                (item.suspect_name && item.suspect_name.includes(filters.search)) ||
                (item.charge && item.charge.includes(filters.search));

            const matchesUnitKK = !filters.unit_kk || String(item.unit_kk) === String(filters.unit_kk);
            const matchesUnitSTL = !filters.unit_s_tl || String(item.unit_s_tl) === String(filters.unit_s_tl);

            // Date Filter
            const matchesDate = matchDateFilter(item.date_obj);

            return matchesTopic && matchesSearch && matchesUnitKK && matchesUnitSTL && matchesDate;
        });

        // -------------------------------------------------------------
        // 1. Ranking Logic (Units by Category)
        // -------------------------------------------------------------
        const calculateTopUnits = (dataset) => {
            const unitMap = {};
            dataset.forEach(item => {
                if (item.unit_kk && item.unit_s_tl) {
                    const unitName = `ส.ทล.${item.unit_s_tl} กก.${item.unit_kk}`;
                    unitMap[unitName] = (unitMap[unitName] || 0) + 1;
                }
            });
            return Object.entries(unitMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5); // Top 5
        };

        // Overall
        const overallRankings = calculateTopUnits(filteredData);

        // Drugs
        const drugsData = filteredData.filter(item => item.topic === 'ยาเสพติด');
        const drugsRankings = calculateTopUnits(drugsData);

        // Weapons
        const weaponsData = filteredData.filter(item => item.topic === 'อาวุธปืน/วัตถุระเบิด');
        const weaponsRankings = calculateTopUnits(weaponsData);

        // Warrants - General (or Total? Users asked for separate cards, maybe keep total warrant card?)
        // User asked to replace Weapons with Big Data and Bodyworn.
        // Existing "Warrants" card might be kept or user only mentioned Big Data and Bodyworn?
        // "เพิ่ม การจัดลำดับของ หมายจับจาก big data 1 card และ หมายจับจาก bodyworn 1 card"
        // "เอา card อาวุธปืน/วัตถุระเบิดออก"
        // So we will have: Overall, Drugs, Big Data, Bodyworn. (Total 4 cards to fit grid)

        // Warrants (Total) - Restore this for safety
        const warrantsData = filteredData.filter(item => item.topic === 'บุคคลตามหมายจับ');
        const warrantsRankings = calculateTopUnits(warrantsData);

        // Warrants (Big Data)
        const warrantsBigData = filteredData.filter(item => item.topic === 'บุคคลตามหมายจับ' && item.warrant_source === 'bigdata');
        const warrantsBigDataRankings = calculateTopUnits(warrantsBigData);

        // Warrants (Bodyworn)
        const warrantsBodyworn = filteredData.filter(item => item.topic === 'บุคคลตามหมายจับ' && item.warrant_source === 'bodyworn');
        const warrantsBodywornRankings = calculateTopUnits(warrantsBodyworn);

        // Drug Seizure Ranking (from rawData.items)
        let drugSeizureRankings = [];
        if (rawData && rawData.items && Array.isArray(rawData.items)) {
            const drugSeizureMap = {};
            rawData.items.forEach(row => {
                const itemName = (row.item_name || '').trim();
                const amount = Number(row.amount) || 0;
                if (!itemName || amount <= 0) return;

                // Only count drug items
                const isDrug = itemName.includes('ยาบ้า') || itemName.includes('ยาอี') ||
                    itemName.includes('ไอซ์') || itemName.includes('เคตามีน') ||
                    itemName.includes('โคเคน') || itemName.includes('ยาเสพติด') ||
                    itemName.includes('กัญชา') || itemName.includes('เฮโรอีน');
                if (!isDrug) return;

                // Date filter
                const rowDate = parseDate(row.date);
                if (!matchDateFilter(rowDate)) return;

                // Unit filter
                const stationStr = row.station || row.subDiv || '';
                const kkMatch = stationStr.match(/(?:กก\.?|กองกำกับการ)\s*(\d+)/);
                const stlMatch = stationStr.match(/(?:ส\.?ทล\.?|สถานีตำรวจทางหลวง)\s*(\d+)/);
                const unitKK = kkMatch ? kkMatch[1] : '';
                const unitSTL = stlMatch ? stlMatch[1] : '';

                if (filters.unit_kk && unitKK !== String(filters.unit_kk)) return;
                if (filters.unit_s_tl && unitSTL !== String(filters.unit_s_tl)) return;

                if (unitKK && unitSTL) {
                    const unitName = `ส.ทล.${unitSTL} กก.${unitKK}`;
                    drugSeizureMap[unitName] = (drugSeizureMap[unitName] || 0) + amount;
                }
            });
            drugSeizureRankings = Object.entries(drugSeizureMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
        }

        const unitRankings = {
            overall: overallRankings,
            drugs: drugsRankings,
            drugSeizure: drugSeizureRankings,
            weapons: weaponsRankings,
            warrants: warrantsRankings,
            warrantsBigData: warrantsBigDataRankings,
            warrantsBodyworn: warrantsBodywornRankings
        };

        // -------------------------------------------------------------
        // 2. Time Analysis Logic
        // -------------------------------------------------------------
        const hourMap = new Array(24).fill(0);
        const dayMap = { 'อาทิตย์': 0, 'จันทร์': 0, 'อังคาร': 0, 'พุธ': 0, 'พฤหัสบดี': 0, 'ศุกร์': 0, 'เสาร์': 0 };
        const dayOrder = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

        filteredData.forEach(item => {
            // Hourly
            if (item.time_capture && typeof item.time_capture === 'string') {
                // Assume time format HH:MM or HH.MM
                try {
                    const parts = item.time_capture.replace('.', ':').split(':');
                    if (parts.length >= 1) {
                        const hour = parseInt(parts[0], 10);
                        if (!isNaN(hour) && hour >= 0 && hour < 24) {
                            hourMap[hour]++;
                        }
                    }
                } catch (e) {
                    // Ignore bad time format
                }
            }

            // Daily
            if (item.date_obj && item.date_obj instanceof Date && !isNaN(item.date_obj)) {
                const dayIndex = item.date_obj.getDay(); // 0 = Sunday
                const dayName = dayOrder[dayIndex];
                if (dayName) dayMap[dayName]++;
            }
        });

        const peakHoursData = hourMap.map((count, hour) => ({
            name: `${hour.toString().padStart(2, '0')}:00`,
            count
        }));

        const dayOfWeekData = dayOrder.map(day => ({
            subject: day,
            A: dayMap[day],
            fullMark: Math.max(...Object.values(dayMap)) * 1.2 || 10
        }));

        // -------------------------------------------------------------
        // 3. Trend Logic (Simple)
        // -------------------------------------------------------------
        const trendMap = {};
        filteredData.forEach(item => {
            if (item.date_capture) {
                trendMap[item.date_capture] = (trendMap[item.date_capture] || 0) + 1;
            }
        });

        // Create sorted trend data
        // Note: 'date_capture' is string DD/MM/YYYY, need robust sorting logic if relying on it directly.
        // Better to sort by date_obj
        const sortedTrend = filteredData
            .reduce((acc, curr) => {
                // Basic day grouping
                const d = curr.date_obj;
                if (d) {
                    const key = d.toISOString().split('T')[0]; // YYYY-MM-DD for sorting
                    if (!acc[key]) acc[key] = { date: key, displayDate: curr.date_capture, count: 0 };
                    acc[key].count++;
                }
                return acc;
            }, {});

        // Fill in gaps if needed, but for now just show active days
        // Calculate Moving Average (Trend)
        const trendData = Object.values(sortedTrend)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((item, index, array) => {
                // Determine Moving Average (Trend) based on window of 3 days (current + 2 previous)
                let sum = item.count;
                let count = 1;

                if (index > 0) { sum += array[index - 1].count; count++; }
                if (index > 1) { sum += array[index - 2].count; count++; }

                const movingAvg = count > 0 ? (sum / count).toFixed(1) : item.count;

                return {
                    date: item.displayDate,
                    count: item.count,
                    forecast: parseFloat(movingAvg)
                };
            });

        // Calculate simple forecast for "Next Day" based on last 3 days avg
        let nextDayForecast = 0;
        if (trendData.length >= 3) {
            const last3 = trendData.slice(-3);
            const avg = last3.reduce((sum, item) => sum + item.count, 0) / 3;
            nextDayForecast = Math.round(avg);
        }

        return {
            unitRankings,
            peakHoursData,
            dayOfWeekData,
            trendData,
            nextDayForecast
        };

    }, [data, filters, rawData]);
};
