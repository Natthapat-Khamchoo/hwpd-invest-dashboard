import React from 'react';
import { Clock, CalendarDays } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const TimeAnalysisView = ({ peakHoursData, dayOfWeekData }) => {
    return (
        <div className="space-y-6 pb-6">
            {/* 1. Peak Hour Analysis (Area Chart) */}
            <div className="glass-liquid p-2 sm:p-6 rounded-xl">
                <h3 className="text-sm sm:text-xl font-bold flex items-center text-white mb-2">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-cyan-400" /> ช่วงเวลาการจับกุมบ่อย
                </h3>
                <p className="text-sm text-slate-400 mb-6">วิเคราะห์แนวโน้มการจับกุมตลอด 24 ชั่วโมง</p>

                <div className="h-48 sm:h-72 w-full overflow-hidden">
                    <ResponsiveContainer width="99%" height="100%">
                        <AreaChart data={peakHoursData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={2} />
                            <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }}
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
                        <h3 className="text-sm sm:text-xl font-bold flex items-center text-white mb-2">
                            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400" /> สถิติรายวัน
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">วันที่มีการจับกุมมากที่สุด</p>
                        <div className="h-48 sm:h-64 w-full overflow-hidden">
                            <ResponsiveContainer width="99%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dayOfWeekData}>
                                    <PolarGrid stroke="#334155" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#e2e8f0', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="#475569" />
                                    <Radar name="จำนวนคดี" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.5} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right/Bottom: Special Watch Time */}
                    <div className="flex-none md:w-64 flex flex-col justify-center items-center p-4 bg-slate-900/40 rounded-xl border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.1)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-red-500/5 animate-pulse-slow"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-3 animate-pulse">
                                <Clock className="w-6 h-6 text-red-500" />
                            </div>
                            <h4 className="text-sm font-bold text-white mb-1">เฝ้าระวังพิเศษ</h4>
                            <p className="text-2xl font-black text-red-400 tracking-wider mb-2">
                                {peakHoursData.length > 0 ? (
                                    peakHoursData.reduce((max, curr) => curr.count > max.count ? curr : max, peakHoursData[0]).name
                                ) : '--:--'}
                            </p>
                            <p className="text-slate-400 text-xs text-center leading-relaxed">
                                สถิติการจับกุมสูงสุดในช่วงเวลานี้
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            );
};

            export default TimeAnalysisView;
