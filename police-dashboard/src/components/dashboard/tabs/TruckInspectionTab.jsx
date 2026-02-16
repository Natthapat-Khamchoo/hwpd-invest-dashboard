import React, { useState } from 'react';
import { Truck, ShieldAlert, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TruckInspectionTab = ({ data = [] }) => {
    // Use prop data or default to empty structure if null, ensuring safe access
    const truckData = data.length > 0 ? data : [
        { name: 'กก.1', inspected: 0, arrested: 0 },
        { name: 'กก.2', inspected: 0, arrested: 0 },
        { name: 'กก.3', inspected: 0, arrested: 0 },
        { name: 'กก.4', inspected: 0, arrested: 0 },
        { name: 'กก.5', inspected: 0, arrested: 0 },
        { name: 'กก.6', inspected: 0, arrested: 0 },
        { name: 'กก.7', inspected: 0, arrested: 0 },
        { name: 'กก.8', inspected: 0, arrested: 0 },
    ];

    // Calc totals for cards
    const totalInspected = truckData.reduce((acc, curr) => acc + (curr.inspected || 0), 0);
    const totalArrested = truckData.reduce((acc, curr) => acc + (curr.arrested || 0), 0);
    const percentArrest = totalInspected > 0 ? ((totalArrested / totalInspected) * 100).toFixed(2) : "0.00";

    return (
        <div className="p-4 lg:p-10 flex flex-col gap-8">
            <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-slate-200 p-4 md:p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-bold text-[#1c2e4a] flex items-center gap-3">
                        <div className="w-2 h-10 bg-[#fbbf24] rounded-full"></div>
                        สถิติการตรวจสอบรถบรรทุกน้ำหนักเกิน (ประจำเดือน)
                    </h3>
                </div>

                <div className="h-[600px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={truckData} margin={{ top: 20, right: 80, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 18, fill: '#64748b', fontWeight: 500 }} />
                            <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 22, fill: '#334155', fontWeight: '700' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} cursor={{ fill: '#f1f5f9' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="inspected" name="จำนวนที่ตรวจสอบ (คัน)" fill="#94a3b8" radius={[0, 8, 8, 0]} barSize={40} label={{ position: 'right', fill: '#475569', fontSize: 24, fontWeight: 'bold' }} />
                            <Bar dataKey="arrested" name="จับกุมน้ำหนักเกิน (ราย)" fill="#dc2626" radius={[0, 8, 8, 0]} barSize={40} label={{ position: 'right', fill: '#991b1b', fontSize: 24, fontWeight: 'bold' }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1c2e4a] rounded-3xl p-6 text-white shadow-lg flex items-center gap-6">
                    <div className="bg-white/10 p-4 rounded-2xl"><Truck size={40} className="text-[#fbbf24]" /></div>
                    <div>
                        <div className="text-gray-300 text-lg">ตรวจสอบทั้งหมด</div>
                        <div className="text-4xl font-bold">{totalInspected.toLocaleString()}</div>
                    </div>
                </div>
                <div className="bg-[#dc2626] rounded-3xl p-6 text-white shadow-lg flex items-center gap-6">
                    <div className="bg-white/10 p-4 rounded-2xl"><ShieldAlert size={40} className="text-white" /></div>
                    <div>
                        <div className="text-gray-100 text-lg">จับกุมน้ำหนักเกิน</div>
                        <div className="text-4xl font-bold">{totalArrested.toLocaleString()}</div>
                    </div>
                </div>
                <div className="bg-white rounded-3xl p-6 text-slate-800 shadow-lg border border-slate-200 flex items-center gap-6">
                    <div className="bg-blue-100 p-4 rounded-2xl"><Zap size={40} className="text-[#004aad]" /></div>
                    <div>
                        <div className="text-slate-500 text-lg">เปอร์เซ็นต์การจับกุม</div>
                        <div className="text-4xl font-bold text-[#004aad]">{percentArrest}%</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TruckInspectionTab;
