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

                <div className="h-48 sm:h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="glass-liquid p-3 sm:p-6 rounded-xl">
                    <div className="flex flex-col justify-center h-full">
                        <h3 className="text-base sm:text-xl font-bold flex items-center text-white mb-2">
                            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400" /> สถิติรายวัน
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">วันที่มีการจับกุมมากที่สุด</p>
                        <div className="h-48 sm:h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
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
                </div>

                <div className="glass-liquid p-2 sm:p-6 rounded-xl flex items-center justify-center bg-slate-900/40">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <Clock className="w-8 h-8 text-red-500" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">ช่วงเวลาเฝ้าระวังพิเศษ</h4>
                        <p className="text-3xl font-black text-red-400 tracking-wider mb-2">
                            {peakHoursData.length > 0 ? (
                                peakHoursData.reduce((max, curr) => curr.count > max.count ? curr : max, peakHoursData[0]).name
                            ) : '--:--'}
                        </p>
                        <p className="text-slate-400 text-sm max-w-xs mx-auto">
                            แนะนำให้เพิ่มความเข้มงวดในการตั้งด่านตรวจในช่วงเวลานี้ เนื่องจากสถิติการจับกุมสูงกว่าปกติ
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeAnalysisView;
