import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LabelList, Legend 
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, MousePointerClick, ArrowRightLeft } from 'lucide-react';
import { getUnitColor, getCrimeColor } from '../utils/helpers';

// --------------------------------------------------------
// 1. กราฟแท่งแสดงสถิติหน่วยงาน (UnitBarChart)
// --------------------------------------------------------
export const UnitBarChart = ({ data, title, onBarClick }) => (
  <div className="bg-slate-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/50">
    <div className="flex justify-between items-start mb-6">
      <h3 className="text-base sm:text-lg font-bold flex items-center text-white">
        <BarChart3 className="w-5 h-5 mr-2 text-yellow-400" />{title}
      </h3>
      <div className="text-xs text-yellow-500/80 flex items-center bg-yellow-500/10 px-2 py-1 rounded">
        <MousePointerClick className="w-3 h-3 mr-1" /> กดกราฟเพื่อกรอง
      </div>
    </div>
    {data.length > 0 ? (
      <div className="h-72 sm:h-96 w-full cursor-pointer">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 20 }} onClick={onBarClick}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
            <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={60} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={{ stroke: '#475569' }} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} allowDecimals={false} />
            <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getUnitColor(entry.name)} className="hover:opacity-80 transition-opacity" />
              ))}
              <LabelList dataKey="value" position="top" fill="#ffffff" fontSize={10} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <div className="h-64 flex items-center justify-center text-slate-500">ไม่พบข้อมูล</div>
    )}
  </div>
);

// --------------------------------------------------------
// 2. กราฟวงกลม (CrimePieChart) - เก็บไว้เผื่อใช้
// --------------------------------------------------------
export const CrimePieChart = ({ data, onClick }) => (
  <div className="bg-slate-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/50">
    <div className="flex justify-between items-start mb-6">
      <h3 className="text-base sm:text-lg font-bold flex items-center text-white">
        <PieChartIcon className="w-5 h-5 mr-2 text-yellow-400" />สัดส่วนประเภทคดี
      </h3>
    </div>
    {data.length > 0 ? (
      <>
        <div className="h-64 sm:h-80 flex justify-center w-full cursor-pointer">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={4} dataKey="value" stroke="none" onClick={onClick}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getCrimeColor(entry.name)} className="hover:opacity-80 transition-opacity" />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center text-[10px] sm:text-xs text-slate-300 bg-slate-900/50 px-2 py-1 rounded-full border border-slate-700">
              <div className="w-2 h-2 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: getCrimeColor(entry.name) }}></div>
              <span className="truncate max-w-[100px]">{entry.name}</span>
              <span className="font-bold ml-1 text-white">({entry.value})</span>
            </div>
          ))}
        </div>
      </>
    ) : (
      <div className="h-64 flex items-center justify-center text-slate-500">ไม่พบข้อมูล</div>
    )}
  </div>
);

// --------------------------------------------------------
// 3. กราฟแท่งรายเดือน (MonthlyBarChart)
// --------------------------------------------------------
export const MonthlyBarChart = ({ data, year, onYearChange }) => (
  <div className="mt-6 bg-slate-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/50">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-base sm:text-lg font-bold flex items-center text-white">
            <BarChart3 className="w-5 h-5 mr-2 text-yellow-400" />
            สถิติการจับกุมรายเดือน (Monthly Trend)
        </h3>
        <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-lg border border-slate-700">
             <span className="text-xs text-slate-400 px-2">เลือกปี (ค.ศ.):</span>
             <select value={year} onChange={(e) => onYearChange(e.target.value)} className="bg-slate-800 text-white text-sm rounded border border-slate-600 px-3 py-1 focus:ring-2 focus:ring-yellow-500 outline-none">
                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
             </select>
        </div>
    </div>
    <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" axisLine={{ stroke: '#475569' }} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="cases" name="จำนวนคดี" fill="url(#colorCases)" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    <LabelList dataKey="cases" position="top" fill="#ffffff" fontSize={12} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
  </div>
);

// --------------------------------------------------------
// 4. กราฟเปรียบเทียบผลการจับกุม (ComparativeCrimeChart)
// --------------------------------------------------------
export const ComparativeCrimeChart = ({ rawData, globalFilters }) => {
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
    })).sort((a, b) => (b.period1 + b.period2) - (a.period1 + a.period2)); 

  }, [rawData, globalFilters.unit_kk, globalFilters.unit_s_tl, dateRange1, dateRange2]);

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h3 className="text-base sm:text-lg font-bold flex items-center text-white">
          <ArrowRightLeft className="w-5 h-5 mr-2 text-yellow-400" />
          เปรียบเทียบผลการจับกุม
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
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