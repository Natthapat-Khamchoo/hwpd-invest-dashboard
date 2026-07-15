import { useState, useEffect, useCallback } from 'react';
import { normalizeTopic, parseDateRobust } from '../utils/helpers';
import { fetchDashboardData } from '../services/GoogleSheetService';

export const usePoliceData = () => {
    const [data, setData] = useState({ allCases: [], rawData: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (options = {}) => {
        setLoading(true);
        setError(null);
        try {
            // Fetch from shared service
            const result = await fetchDashboardData({}, options);
            if (result && result.rawData && Object.keys(result.rawData).length > 0) {
                setData({
                    allCases: result.allCases || [],
                    rawData: result.rawData || {}
                });
            } else {
                throw new Error("Received empty or invalid data from Google Sheet Service");
            }
        } catch (err) {
            console.error("Failed to load police data:", err);
            setError(err.message || "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(() => fetchData(), 300000); // 5 minutes
        return () => clearInterval(intervalId);
    }, [fetchData]);

    const refetch = useCallback((options = {}) => {
        return fetchData(options);
    }, [fetchData]);

    return {
        data: data.allCases,
        rawData: data.rawData,
        loading,
        error,
        refetch
    };
};
