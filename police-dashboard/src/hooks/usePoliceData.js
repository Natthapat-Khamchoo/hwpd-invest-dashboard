import { useState, useEffect } from 'react';
import { normalizeTopic, parseDateRobust } from '../utils/helpers';
import { fetchDashboardData } from '../services/GoogleSheetService';

export const usePoliceData = () => {
    const [data, setData] = useState({ allCases: [], rawData: {} });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch from shared service
                // Note: fetchDashboardData fetches ALL data. 
                // We might want to optimize this later if App only needs specific parts, 
                // but for now we need the 'allCases' array it generates.
                const result = await fetchDashboardData({}); // Pass empty filters initially
                if (result) {
                    setData({
                        allCases: result.allCases || [],
                        rawData: result.rawData || {}
                    });
                } else {
                    console.warn("fetchDashboardData returned empty result", result);
                    setData({ allCases: [], rawData: {} });
                }
            } catch (err) {
                console.error("Failed to load police data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const intervalId = setInterval(fetchData, 300000); // 5 minutes
        return () => clearInterval(intervalId);
    }, []);

    return {
        data: data.allCases,
        rawData: data.rawData,
        loading
    };
};
