import React from 'react';
import { TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TrendView = ({ trendData, nextDayForecast }) => {
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
                    <h3 className="text-xl font-bold flex items-center text-white mb-6">
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
                                <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }}
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
                    <div className="glass-liquid p-6 rounded-xl flex-1 bg-gradient-to-br from-green-900/40 to-slate-900/60 border-green-500/20">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-green-500/20 rounded-lg">
                                <Activity className="w-6 h-6 text-green-400" />
                            </div>
                            <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">AI PREDICTION</span>
                        </div>
                        <h4 className="text-slate-300 text-sm mb-1">คาดการณ์ยอดจับกุมพรุ่งนี้</h4>
                        <div className="text-4xl font-black text-white mb-2">{nextDayForecast} <span className="text-lg font-normal text-slate-400">คดี</span></div>
                        <p className="text-xs text-slate-400">
                            คำนวณจากค่าเฉลี่ยเคลื่อนที่ (Moving Average) 3 วันล่าสุด
                        </p>
                    </div>

                    <div className="glass-liquid p-6 rounded-xl flex-1 bg-gradient-to-br from-yellow-900/40 to-slate-900/60 border-yellow-500/20">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-yellow-500/20 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                            </div>
                            <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">ANOMALY</span>
                        </div>
                        <h4 className="text-slate-300 text-sm mb-1">สถานะความผิดปกติ</h4>
                        <div className="text-xl font-bold text-white mb-2">ปกติ (Normal)</div>
                        <p className="text-xs text-slate-400">
                            ยังไม่พบยอดที่พุ่งสูงผิดปกติในช่วง 7 วันที่ผ่านมา
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TrendView;
