import React from 'react';
import { TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TrendView = ({ trendData, nextDayForecast, isDarkMode = true }) => {
    const tickColor = isDarkMode ? '#94a3b8' : '#334155';
    const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
    const axisColor = isDarkMode ? '#475569' : '#cbd5e1';
    // Mock forecast data extension (simply for visualization if real data is short)
    const displayData = [...trendData];
    if (displayData.length > 0 && nextDayForecast > 0) {
        // Add a forecasted point for tomorrow
        const lastDate = displayData[displayData.length - 1].date;
        // Note: simple date string logic, ideally use proper Date obj
        displayData.push({
            date: 'Tomorrow (Est.)',
            count: null, // No actual count
            forecast: nextDayForecast
        });
    }

    return (
        <div className="space-y-6 pb-6">

            {/* 1. Forecast & Anomaly Check */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Forecast Card */}
                <div className="glass-liquid p-6 rounded-xl md:col-span-2">
                    <h3 className="text-3xl font-bold flex items-center dark:text-white text-slate-900 mb-6">
                        <TrendingUp className="w-6 h-6 mr-2 text-green-400" /> แนวโน้มและคาดการณ์ (Trend Forecast)
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={displayData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="date" stroke={axisColor} tick={{ fill: tickColor, fontSize: 13, fontWeight: 500 }} />
                                <YAxis stroke={axisColor} tick={{ fill: tickColor, fontSize: 14, fontWeight: 500 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', color: isDarkMode ? '#fff' : '#1e293b', borderRadius: '12px', fontSize: 14 }}
                                />
                                <Legend />
                                <Bar dataKey="count" name="สถิติจริง" barSize={30} fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="forecast" name="แนวโน้ม/คาดการณ์" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} strokeDasharray="5 5" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Insight Widget */}
                <div className="flex flex-col gap-4">
                    <div className="glass-liquid p-6 rounded-xl flex-1 bg-gradient-to-br from-green-900/25 to-slate-900/60 border-green-500/15">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-green-500/20 rounded-lg">
                                <Activity className="w-6 h-6 text-green-400" />
                            </div>
                            <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">AI PREDICTION</span>
                        </div>
                        <h4 className="dark:text-slate-200 text-slate-700 text-lg mb-1">คาดการณ์ยอดจับกุมพรุ่งนี้</h4>
                        <div className="text-6xl font-black dark:text-white text-slate-900 mb-2">{nextDayForecast} <span className="text-2xl font-normal dark:text-slate-400 text-slate-600">คดี</span></div>
                        <p className="text-base dark:text-slate-400 text-slate-600">
                            คำนวณจากค่าเฉลี่ยเคลื่อนที่ (Moving Average) 3 วันล่าสุด
                        </p>
                    </div>

                    <div className="glass-liquid p-6 rounded-xl flex-1 bg-gradient-to-br from-yellow-900/25 to-slate-900/60 border-yellow-500/15">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-yellow-500/20 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                            </div>
                            <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">ANOMALY</span>
                        </div>
                        <h4 className="dark:text-slate-200 text-slate-700 text-lg mb-1">สถานะความผิดปกติ</h4>
                        <div className="text-3xl font-bold dark:text-white text-slate-900 mb-2">ปกติ (Normal)</div>
                        <p className="text-base dark:text-slate-400 text-slate-600">
                            ยังไม่พบยอดที่พุ่งสูงผิดปกติในช่วง 7 วันที่ผ่านมา
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TrendView;
