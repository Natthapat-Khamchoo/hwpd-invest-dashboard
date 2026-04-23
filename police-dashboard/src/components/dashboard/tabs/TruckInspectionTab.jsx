import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TruckInspectionTab = ({ data = [], monthNames = ["ม.ค.", "ก.พ."], isPrint = false }) => {
    return (
        <div className={isPrint ? "w-full" : "p-4 lg:p-10 flex flex-col gap-8"}>
            <div className={`bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-slate-200 ${isPrint ? 'p-4 md:p-6' : 'p-4 md:p-8'}`}>
                <div className={`flex items-center justify-between ${isPrint ? 'mb-4' : 'mb-8'}`}>
                    <h3 className="text-3xl font-bold text-[#1c2e4a] flex items-center gap-3">
                        <div className="w-2 h-10 bg-[#fbbf24] rounded-full"></div>
                        เปรียบเทียบสถิติการจับกุมรถบรรทุกน้ำหนักเกิน (2 เดือนย้อนหลัง)
                    </h3>
                </div>
                <div className={`w-full ${isPrint ? 'h-[600px] md:h-[650px]' : 'h-[600px] md:h-[850px]'}`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 40, right: 20, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 18, fill: '#334155', fontWeight: '700' }} />
                            <YAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 16, fill: '#64748b', fontWeight: 500 }} tickFormatter={(val) => val.toLocaleString()} width={60} />
                            <Tooltip formatter={(value) => value.toLocaleString()} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', color: '#1e293b' }} cursor={{ fill: '#f1f5f9' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} formatter={(value) => <span className="text-slate-700 font-bold text-lg ml-2">{value}</span>} />
                            <Bar dataKey="month1" name={monthNames[0]} fill="#cbd5e1" radius={[8, 8, 0, 0]} barSize={40} label={{ position: 'top', fill: '#475569', fontSize: 16, fontWeight: 'bold', formatter: (val) => val.toLocaleString() }} />
                            <Bar dataKey="month2" name={monthNames[1]} fill="#dc2626" radius={[8, 8, 0, 0]} barSize={40} label={{ position: 'top', fill: '#991b1b', fontSize: 16, fontWeight: 'bold', formatter: (val) => val.toLocaleString() }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center text-slate-500 text-sm">
                    * ข้อมูลเรียงจากซ้ายไปขวา: {monthNames[0]} ➜ {monthNames[1]}
                </div>
            </div>
        </div>
    );
};

export default TruckInspectionTab;
