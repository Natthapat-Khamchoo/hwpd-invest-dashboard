import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell, LabelList, Legend 
} from 'recharts';
import { BarChart3, MousePointerClick, Calendar, ArrowRightLeft } from 'lucide-react';
import { getUnitColor, getCrimeColor } from '../utils/helpers';

// ... (UnitBarChart และ MonthlyBarChart ของเดิมเก็บไว้) ...

// ✅ Component ใหม่: กราฟเปรียบเทียบผลการจับกุม (เลือกช่วงเวลาได้เอง)
export const ComparativeCrimeChart = ({ rawData, globalFilters }) => {
  // ตั้งค่า Default: ช่วงที่ 2 = เดือนปัจจุบัน, ช่วงที่ 1 = เดือนก่อนหน้า
  const today = new Date();
  const startCurrent = new Date(today.getFullYear(), today.getMonth(), 1);
  const endCurrent = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const startPrev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endPrev = new Date(today.getFullYear(), today.getMonth(), 0);

  const formatDate = (d) => d.toISOString().split('T')[0];

  const [dateRange1, setDateRange1] = useState({ start: formatDate(startPrev), end: formatDate(endPrev) });
  const [dateRange2, setDateRange2] = useState({ start: formatDate(startCurrent), end: formatDate(endCurrent) });

  const chartData = useMemo(() => {
    // 1. กรองข้อมูลตาม Unit (KK/STL) จาก Global Filter ก่อนเสมอ
    const unitFiltered = rawData.filter(item => {
        const kkMatch = !globalFilters.unit_kk || String(item.unit_kk) === String(globalFilters.unit_kk);
        const stlMatch = !globalFilters.unit_s_tl || String(item.unit_s_tl) === String(globalFilters.unit_s_tl);
        return kkMatch && stlMatch;
    });

    // 2. ฟังก์ชันนับจำนวนแยกตาม Topic ในช่วงวันที่กำหนด
    const countByPeriod = (startStr, endStr) => {
        const start = new Date(startStr); start.setHours(0,0,0,0);
        const end = new Date(endStr); end.setHours(23,59,59,999);
        
        const counts = {};
        unitFiltered.forEach(d => {
            if (d.date_obj >= start && d.date_obj <= end) {
                const topic = d.topic || 'อื่นๆ';
                counts[topic] = (counts[topic] || 0) + 1;
            }
        });
        return counts;
    };

    const data1 = countByPeriod(dateRange1.start, dateRange1.end);
    const data2 = countByPeriod(dateRange2.start, dateRange2.end);

    // 3. รวม Topic ทั้งหมดที่เกิดขึ้นในทั้ง 2 ช่วง
    const allTopics = [...new Set([...Object.keys(data1), ...Object.keys(data2)])].sort();

    // 4. สร้าง Data สำหรับกราฟ
    return allTopics.map(topic => ({
        name: topic,
        period1: data1[topic] || 0,
        period2: data2[topic] || 0,
    })).sort((a, b) => (b.period1 + b.period2) - (a.period1 + a.period2)); // เรียงตามยอดรวมมากไปน้อย

  }, [rawData, globalFilters.unit_kk, globalFilters.unit_s_tl, dateRange1, dateRange2]);

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h3 className="text-base sm:text-lg font-bold flex items-center text-white">
          <ArrowRightLeft className="w-5 h-5 mr-2 text-yellow-400" />
          เปรียบเทียบผลการจับกุม
        </h3>
      </div>

      {/* ส่วนเลือกวันที่สำหรับการเปรียบเทียบ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
        
        {/* ช่วงเวลาที่ 1 (ซ้าย) */}
        <div className="flex flex-col space-y-2">
            <div className="flex items-center text-xs text-blue-400 font-bold uppercase">
                <div className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></div> ช่วงเวลาที่ 1 (อดีต)
            </div>
            <div className="flex space-x-2">
                <input type="date" className="w-full bg-slate-800 border border-slate-600 rounded text-xs text-white p-1.5 focus:ring-1 focus:ring-blue-500" 
                    value={dateRange1.start} onChange={(e) => setDateRange1(p => ({...p, start: e.target.value}))} />
                <span className="text-slate-500 self-center">-</span>
                <input type="date" className="w-full bg-slate-800 border border-slate-600 rounded text-xs text-white p-1.5 focus:ring-1 focus:ring-blue-500" 
                    value={dateRange1.end} onChange={(e) => setDateRange1(p => ({...p, end: e.target.value}))} />
            </div>
        </div>

        {/* ช่วงเวลาที่ 2 (ขวา) */}
        <div className="flex flex-col space-y-2">
            <div className="flex items-center text-xs text-yellow-400 font-bold uppercase">
                <div className="w-3 h-3 bg-yellow-500 rounded-sm mr-2"></div> ช่วงเวลาที่ 2 (ปัจจุบัน)
            </div>
            <div className="flex space-x-2">
                <input type="date" className="w-full bg-slate-800 border border-slate-600 rounded text-xs text-white p-1.5 focus:ring-1 focus:ring-yellow-500" 
                    value={dateRange2.start} onChange={(e) => setDateRange2(p => ({...p, start: e.target.value}))} />
                <span className="text-slate-500 self-center">-</span>
                <input type="date" className="w-full bg-slate-800 border border-slate-600 rounded text-xs text-white p-1.5 focus:ring-1 focus:ring-yellow-500" 
                    value={dateRange2.end} onChange={(e) => setDateRange2(p => ({...p, end: e.target.value}))} />
            </div>
        </div>
      </div>

      {/* ตัวกราฟ */}
      {chartData.length > 0 ? (
        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
              <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={80} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={{ stroke: '#475569' }} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} allowDecimals={false} />
              <RechartsTooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }}
                formatter={(value, name) => [value, name === 'period1' ? 'ช่วงเวลาที่ 1' : 'ช่วงเวลาที่ 2']}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} formatter={(value) => <span className="text-slate-300 text-xs ml-1">{value === 'period1' ? 'ช่วงเวลาที่ 1' : 'ช่วงเวลาที่ 2'}</span>} />
              
              <Bar dataKey="period1" name="period1" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30}>
                 <LabelList dataKey="period1" position="top" fill="#93c5fd" fontSize={10} formatter={(val) => val > 0 ? val : ''} />
              </Bar>
              <Bar dataKey="period2" name="period2" fill="#eab308" radius={[4, 4, 0, 0]} maxBarSize={30}>
                 <LabelList dataKey="period2" position="top" fill="#fde047" fontSize={10} formatter={(val) => val > 0 ? val : ''} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-slate-500 flex-col">
           <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
           <span>ไม่พบข้อมูลในช่วงเวลาที่เลือก</span>
        </div>
      )}
    </div>
  );
};