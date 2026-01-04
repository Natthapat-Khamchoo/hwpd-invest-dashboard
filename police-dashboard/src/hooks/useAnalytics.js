import { useMemo } from 'react';

export const useAnalytics = (data, filters) => {
    return useMemo(() => {
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
            let matchesDate = true;
            if (filters.period !== 'all') {
                if (!item.date_obj) {
                    matchesDate = false;
                } else {
                    const itemDate = new Date(item.date_obj); // Clone to avoid mutation
                    itemDate.setHours(0, 0, 0, 0);

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (filters.period === 'today') {
                        matchesDate = itemDate.getTime() === today.getTime();
                    } else if (filters.period === 'yesterday') {
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        matchesDate = itemDate.getTime() === yesterday.getTime();
                    } else if (filters.period === 'this_month') {
                        matchesDate = itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
                    } else if (filters.period === 'custom' && filters.rangeStart && filters.rangeEnd) {
                        // Range check needs original time or normalized time? 
                        // useDashboardLogic uses raw timestamp comparison with rangeStart/End
                        // Let's stick to simple day comparison for consistency with 'today' logic if strict mode
                        // But for range, usually we compare timestamps. 
                        // Re-using item.date_obj for range comparison (assuming rangeStart/End are set correctly)
                        const d = item.date_obj;
                        matchesDate = d >= filters.rangeStart && d <= filters.rangeEnd;
                    }
                }
            }

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
                .slice(0, 3); // Top 3
        };

        // Overall
        const overallRankings = calculateTopUnits(filteredData);

        // Drugs
        const drugsData = filteredData.filter(item => item.topic === 'ยาเสพติด');
        const drugsRankings = calculateTopUnits(drugsData);

        // Weapons
        const weaponsData = filteredData.filter(item => item.topic === 'อาวุธปืน/วัตถุระเบิด');
        const weaponsRankings = calculateTopUnits(weaponsData);

        // Warrants
        const warrantsData = filteredData.filter(item => item.topic === 'บุคคลตามหมายจับ');
        const warrantsRankings = calculateTopUnits(warrantsData);

        const unitRankings = {
            overall: overallRankings,
            drugs: drugsRankings,
            weapons: weaponsRankings,
            warrants: warrantsRankings
        };

        // -------------------------------------------------------------
        // 2. Time Analysis Logic
        // -------------------------------------------------------------
        const hourMap = new Array(24).fill(0);
        const dayMap = { 'อาทิตย์': 0, 'จันทร์': 0, 'อังคาร': 0, 'พุธ': 0, 'พฤหัสบดี': 0, 'ศุกร์': 0, 'เสาร์': 0 };
        const dayOrder = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

        filteredData.forEach(item => {
            // Hourly
            if (item.time_capture) {
                // Assume time format HH:MM or HH.MM
                const parts = item.time_capture.replace('.', ':').split(':');
                if (parts.length >= 1) {
                    const hour = parseInt(parts[0], 10);
                    if (!isNaN(hour) && hour >= 0 && hour < 24) {
                        hourMap[hour]++;
                    }
                }
            }

            // Daily
            if (item.date_obj) {
                const dayIndex = item.date_obj.getDay(); // 0 = Sunday
                const dayName = dayOrder[dayIndex];
                dayMap[dayName]++;
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

    }, [data, filters]);
};
