import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TrafficComparisonTab = ({ data = [], monthNames = ["ม.ค.", "ก.พ.", "มี.ค."] }) => {
    return (
        <div className="p-4 lg:p-10 flex flex-col gap-8">
            <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-slate-200 p-4 md:p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-bold text-[#1c2e4a] flex items-center gap-3">
                        <div className="w-2 h-10 bg-[#fbbf24] rounded-full"></div>
                        เปรียบเทียบสถิติ 'จราจร' (3 เดือนย้อนหลัง)
                    </h3>
                </div>
                <div className="h-[600px] md:h-[850px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={data} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: '#64748b' }} />
                            <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 16, fill: '#334155', fontWeight: '500' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', color: '#1e293b' }} cursor={{ fill: '#f1f5f9' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} formatter={(value) => <span className="text-slate-700 font-bold text-lg ml-2">{value}</span>} />
                            <Bar dataKey="month1" name={monthNames[0]} fill="#cbd5e1" radius={[0, 8, 8, 0]} barSize={20} label={{ position: 'right', fill: '#475569', fontSize: 14, fontWeight: 'bold' }} />
                            <Bar dataKey="month2" name={monthNames[1]} fill="#94a3b8" radius={[0, 8, 8, 0]} barSize={20} label={{ position: 'right', fill: '#475569', fontSize: 14, fontWeight: 'bold' }} />
                            <Bar dataKey="month3" name={monthNames[2]} fill="#fbbf24" radius={[0, 8, 8, 0]} barSize={20} label={{ position: 'right', fill: '#b45309', fontSize: 14, fontWeight: 'bold' }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center text-slate-500 text-sm">
                    * ข้อมูลเรียงจากซ้ายไปขวา: {monthNames[0]} ➜ {monthNames[1]} ➜ {monthNames[2]}
                </div>
            </div>
        </div>
    );
};

export default TrafficComparisonTab;
