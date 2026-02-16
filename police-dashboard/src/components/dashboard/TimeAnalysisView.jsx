import React from 'react';
import { Clock, CalendarDays } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const TimeAnalysisView = ({ peakHoursData, dayOfWeekData, isDarkMode = true }) => {
    const tickColor = isDarkMode ? '#94a3b8' : '#334155';
    const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
    const axisColor = isDarkMode ? '#475569' : '#cbd5e1';
    return (
        <div className="space-y-6 pb-6">
            {/* 1. Peak Hour Analysis (Area Chart) */}
            <div className="glass-liquid p-2 sm:p-6 rounded-xl">
                <h3 className="text-lg sm:text-3xl font-bold flex items-center dark:text-white text-slate-900 mb-2">
                    <Clock className="w-6 h-6 sm:w-7 sm:h-7 mr-2 text-cyan-400" /> ช่วงเวลาการจับกุมบ่อย
                </h3>
                <p className="text-lg dark:text-slate-300 text-slate-600 mb-6">วิเคราะห์แนวโน้มการจับกุมตลอด 24 ชั่วโมง</p>

                <div className="h-48 sm:h-72 w-full overflow-hidden">
                    <ResponsiveContainer width="99%" height="100%">
                        <AreaChart data={peakHoursData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke={axisColor} tick={{ fill: tickColor, fontSize: 13, fontWeight: 500 }} interval={2} />
                            <YAxis stroke={axisColor} tick={{ fill: tickColor, fontSize: 13, fontWeight: 500 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', color: isDarkMode ? '#fff' : '#1e293b', borderRadius: '12px', fontSize: 14 }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#22d3ee" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2. Day of Week Analysis (Radar Chart or Bar) */}
            {/* 2. Day of Week Analysis (Unified Card) */}
            <div className="glass-liquid p-3 sm:p-6 rounded-xl">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left: Chart */}
                    <div className="flex-1 flex flex-col">
                        <h3 className="text-lg sm:text-3xl font-bold flex items-center dark:text-white text-slate-900 mb-2">
                            <CalendarDays className="w-6 h-6 sm:w-7 sm:h-7 mr-2 text-purple-400" /> สถิติรายวัน
                        </h3>
                        <p className="text-lg dark:text-slate-300 text-slate-600 mb-4">วันที่มีการจับกุมมากที่สุด</p>
                        <div className="h-48 sm:h-64 w-full overflow-hidden">
                            <ResponsiveContainer width="99%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dayOfWeekData}>
                                    <PolarGrid stroke={gridColor} />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: tickColor, fontSize: 13, fontWeight: 500 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke={axisColor} />
                                    <Radar name="จำนวนคดี" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.5} />
                                    <Tooltip contentStyle={{ backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', color: isDarkMode ? '#fff' : '#1e293b', borderRadius: '12px', fontSize: 14 }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right/Bottom: Special Watch Time */}
                    <div className={`flex-none md:w-64 flex flex-col justify-center items-center p-4 rounded-xl border shadow-[0_0_10px_rgba(220,38,38,0.05)] relative overflow-hidden ${isDarkMode ? 'bg-slate-900/40 border-red-500/15' : 'bg-red-50/80 border-red-200/50'}`}>
                        <div className="absolute inset-0 bg-red-500/3 animate-pulse-slow"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-3 animate-pulse">
                                <Clock className="w-6 h-6 text-red-400" />
                            </div>
                            <h4 className="text-lg font-bold dark:text-white text-slate-900 mb-1">เฝ้าระวังพิเศษ</h4>
                            <p className="text-4xl font-black text-red-400 tracking-wider mb-2">
                                {peakHoursData.length > 0 ? (
                                    peakHoursData.reduce((max, curr) => curr.count > max.count ? curr : max, peakHoursData[0]).name
                                ) : '--:--'}
                            </p>
                            <p className="dark:text-slate-300 text-slate-600 text-base text-center leading-relaxed">
                                สถิติการจับกุมสูงสุดในช่วงเวลานี้
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeAnalysisView;
