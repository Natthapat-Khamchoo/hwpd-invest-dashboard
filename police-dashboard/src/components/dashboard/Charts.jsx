import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LabelList, Legend
} from 'recharts';
import {
  BarChart3, PieChart as PieChartIcon, MousePointerClick, ChevronLeft,
  ArrowRightLeft, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { getUnitColor, getCrimeColor } from '../../utils/helpers';

// --- Shared Gradients & Filters Definition ---
const ChartDefinitions = () => (
  <defs>
    {/* Blue Gradient */}
    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
    </linearGradient>

    {/* Yellow Gradient */}
    <linearGradient id="yellowGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#facc15" stopOpacity={1} />
      <stop offset="100%" stopColor="#eab308" stopOpacity={0.6} />
    </linearGradient>

    {/* Cyan Gradient */}
    <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.6} />
    </linearGradient>
  </defs>
);

// --------------------------------------------------------
// 1. กราฟแท่งแสดงสถิติหน่วยงาน (UnitBarChart)
// --------------------------------------------------------
export const UnitBarChart = ({ data, title, onBarClick, onBack, isDarkMode = true }) => {
  const tickColor = isDarkMode ? '#94a3b8' : '#334155';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
  const labelColor = isDarkMode ? '#ffffff' : '#1e293b';
  const axisColor = isDarkMode ? '#475569' : '#cbd5e1';

  return (
    <div className="glass-liquid p-4 sm:p-6 rounded-xl transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <h3 className={`text-lg sm:text-xl font-bold flex items-center ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          <BarChart3 className="w-6 h-6 mr-2 text-yellow-400" />{title}
        </h3>
        <div className={`text-xs flex items-center px-2 py-1 rounded ${isDarkMode ? 'text-yellow-500/80 bg-yellow-500/10' : 'text-yellow-700 bg-yellow-100'}`}>
          {onBack && (
            <button onClick={onBack} className={`mr-2 flex items-center px-2 py-0.5 rounded transition-colors border ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600' : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'}`}>
              <ChevronLeft className="w-3 h-3 mr-1" /> ย้อนกลับ
            </button>
          )}
          <MousePointerClick className="w-3 h-3 mr-1" /> กดกราฟเพื่อดูรายละเอียด
        </div>
      </div>
      {data.length > 0 ? (
        <div className="h-72 sm:h-96 w-full cursor-pointer">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 20 }}>
              <ChartDefinitions />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} opacity={0.3} />
              <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={60} tick={{ fontSize: 13, fill: tickColor, fontWeight: 600 }} axisLine={{ stroke: axisColor }} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: tickColor, fontWeight: 500 }} allowDecimals={false} />
              <RechartsTooltip cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', color: isDarkMode ? '#fff' : '#1e293b', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', fontSize: 14 }} />
              <Bar dataKey="value" radius={[6, 6, 2, 2]} maxBarSize={50} onClick={onBarClick} cursor="pointer">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getUnitColor(entry.name)} className="hover:opacity-80 transition-opacity" style={{ filter: isDarkMode ? 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' : 'none' }} />
                ))}
                <LabelList dataKey="value" position="top" fill={labelColor} fontSize={20} fontWeight="bold" style={{ textShadow: isDarkMode ? '0 0 10px rgba(0,0,0,0.8)' : 'none' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className={`h-64 flex items-center justify-center ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>ไม่พบข้อมูล</div>
      )}
    </div>
  );
};

// --------------------------------------------------------
// 2. กราฟวงกลม (CrimePieChart)
// --------------------------------------------------------
export const CrimePieChart = ({ data, onClick }) => (
  <div className="glass-liquid p-4 sm:p-6 rounded-xl transition-all duration-300">
    <div className="flex justify-between items-start mb-6">
      <h3 className="text-base sm:text-lg font-bold flex items-center text-white">
        <PieChartIcon className="w-6 h-6 mr-2 text-yellow-400" />สัดส่วนประเภทคดี
      </h3>
    </div>
    {data.length > 0 ? (
      <>
        <div className="h-64 sm:h-80 flex justify-center w-full cursor-pointer">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={4} dataKey="value" stroke="none" onClick={onClick}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getCrimeColor(entry.name)} className="hover:opacity-80 transition-opacity" style={{ filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.5))' }} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center text-[10px] sm:text-xs text-slate-300 bg-slate-900/50 px-2 py-1 rounded-full border border-slate-700/50 shadow-sm transition-transform hover:scale-105">
              <div className="w-2 h-2 rounded-full mr-2 flex-shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.4)]" style={{ backgroundColor: getCrimeColor(entry.name) }}></div>
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
export const MonthlyBarChart = ({ data, year, onYearChange, isDarkMode = true }) => {
  const tickColor = isDarkMode ? '#94a3b8' : '#334155';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
  const labelColor = isDarkMode ? '#67e8f9' : '#0e7490';
  const axisColor = isDarkMode ? '#475569' : '#cbd5e1';

  return (
    <div className="mt-6 glass-liquid p-4 sm:p-6 rounded-xl transition-all duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className={`text-lg sm:text-xl font-bold flex items-center ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          <BarChart3 className="w-6 h-6 mr-2 text-yellow-400" />
          สถิติการจับกุมรายเดือน (Monthly Trend)
        </h3>
        <div className={`flex items-center space-x-2 p-1.5 rounded-lg border backdrop-blur-sm ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-100 border-slate-300'}`}>
          <span className={`text-sm px-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>เลือกปี (ค.ศ.):</span>
          <select value={year} onChange={(e) => onYearChange(e.target.value)} className={`text-sm rounded border px-3 py-1 outline-none ${isDarkMode ? 'bg-slate-800 text-white border-slate-600 focus:ring-2 focus:ring-yellow-500' : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-blue-400'}`}>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <ChartDefinitions />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} opacity={0.3} />
            <XAxis dataKey="name" axisLine={{ stroke: axisColor }} tickLine={false} tick={{ fill: tickColor, fontSize: 14, fontWeight: 500 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 14, fontWeight: 500 }} />
            <RechartsTooltip contentStyle={{ backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', color: isDarkMode ? '#fff' : '#1e293b', borderRadius: '12px', fontSize: 14 }} cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
            <Bar dataKey="cases" name="จำนวนคดี" fill="url(#cyanGradient)" radius={[6, 6, 2, 2]} maxBarSize={60}>
              <LabelList dataKey="cases" position="top" fill={labelColor} fontSize={20} fontWeight="bold" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --------------------------------------------------------
// 4. กราฟเปรียบเทียบผลการจับกุม พร้อม Summary Card (Updated)
// --------------------------------------------------------
export const ComparativeCrimeChart = ({ rawData, globalFilters, isDarkMode = true }) => {
  const tickColor = isDarkMode ? '#94a3b8' : '#334155';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
  const axisColor = isDarkMode ? '#475569' : '#cbd5e1';
  const label1Color = isDarkMode ? '#93c5fd' : '#2563eb';
  const label2Color = isDarkMode ? '#fde047' : '#ca8a04';

  const today = new Date();
  const startCurrent = new Date(today.getFullYear(), today.getMonth(), 1);
  const endCurrent = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const startPrev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endPrev = new Date(today.getFullYear(), today.getMonth(), 0);

  const formatDate = (d) => d.toISOString().split('T')[0];

  const [dateRange1, setDateRange1] = useState({ start: formatDate(startPrev), end: formatDate(endPrev) });
  const [dateRange2, setDateRange2] = useState({ start: formatDate(startCurrent), end: formatDate(endCurrent) });

  const { chartData, totals } = useMemo(() => {
    const unitFiltered = rawData.filter(item => {
      const kkMatch = !globalFilters.unit_kk || String(item.unit_kk) === String(globalFilters.unit_kk);
      const stlMatch = !globalFilters.unit_s_tl || String(item.unit_s_tl) === String(globalFilters.unit_s_tl);
      return kkMatch && stlMatch;
    });

    const countByPeriod = (startStr, endStr) => {
      const start = new Date(startStr); start.setHours(0, 0, 0, 0);
      const end = new Date(endStr); end.setHours(23, 59, 59, 999);

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

    const total1 = Object.values(data1).reduce((a, b) => a + b, 0);
    const total2 = Object.values(data2).reduce((a, b) => a + b, 0);
    const diff = total2 - total1;
    const percentChange = total1 === 0 ? (total2 > 0 ? 100 : 0) : ((diff / total1) * 100);

    const allTopics = [...new Set([...Object.keys(data1), ...Object.keys(data2)])].sort();
    const sortedData = allTopics.map(topic => ({
      name: topic,
      period1: data1[topic] || 0,
      period2: data2[topic] || 0,
    })).sort((a, b) => (b.period1 + b.period2) - (a.period1 + a.period2));

    return {
      chartData: sortedData,
      totals: { total1, total2, diff, percentChange }
    };

  }, [rawData, globalFilters.unit_kk, globalFilters.unit_s_tl, dateRange1, dateRange2]);

  return (
    <div className="glass-liquid p-4 sm:p-6 rounded-xl transition-all duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h3 className={`text-lg sm:text-xl font-bold flex items-center ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          <ArrowRightLeft className="w-6 h-6 mr-2 text-yellow-400" />
          เปรียบเทียบผลการจับกุม
        </h3>
      </div>

      {/* Input เลือกวันที่ */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-3 rounded-lg border ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center text-xs text-blue-400 font-bold uppercase">
            <div className="w-3 h-3 bg-blue-500 rounded-sm mr-2 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> ช่วงเวลาที่ 1 (อดีต)
          </div>
          <div className="flex space-x-2">
            <input type="date" className={`w-full rounded text-sm p-1.5 focus:ring-1 focus:ring-blue-500 border ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              value={dateRange1.start} onChange={(e) => setDateRange1(p => ({ ...p, start: e.target.value }))} />
            <span className="text-slate-500 self-center">-</span>
            <input type="date" className={`w-full rounded text-sm p-1.5 focus:ring-1 focus:ring-blue-500 border ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              value={dateRange1.end} onChange={(e) => setDateRange1(p => ({ ...p, end: e.target.value }))} />
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex items-center text-xs text-yellow-400 font-bold uppercase">
            <div className="w-3 h-3 bg-yellow-500 rounded-sm mr-2 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div> ช่วงเวลาที่ 2 (ปัจจุบัน)
          </div>
          <div className="flex space-x-2">
            <input type="date" className={`w-full rounded text-sm p-1.5 focus:ring-1 focus:ring-yellow-500 border ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              value={dateRange2.start} onChange={(e) => setDateRange2(p => ({ ...p, start: e.target.value }))} />
            <span className="text-slate-500 self-center">-</span>
            <input type="date" className={`w-full rounded text-sm p-1.5 focus:ring-1 focus:ring-yellow-500 border ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              value={dateRange2.end} onChange={(e) => setDateRange2(p => ({ ...p, end: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Grid: ซ้าย=กราฟ, ขวา=Summary Card */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* กราฟ */}
        <div className="flex-1 h-72 sm:h-80 w-full min-w-0">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 20 }}>
                <ChartDefinitions />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} opacity={0.3} />
                <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12, fill: tickColor, fontWeight: 500 }} axisLine={{ stroke: axisColor }} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: tickColor, fontWeight: 500 }} allowDecimals={false} />
                <RechartsTooltip
                  cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', color: isDarkMode ? '#fff' : '#1e293b', borderRadius: '12px', fontSize: 14 }}
                  formatter={(value, name) => [value, name === 'period1' ? 'ช่วงเวลาที่ 1' : 'ช่วงเวลาที่ 2']}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} formatter={(value) => <span className={`text-sm ml-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{value === 'period1' ? 'ช่วงเวลาที่ 1' : 'ช่วงเวลาที่ 2'}</span>} />

                <Bar dataKey="period1" name="period1" fill="url(#blueGradient)" radius={[6, 6, 2, 2]} maxBarSize={30}>
                  <LabelList dataKey="period1" position="top" fill={label1Color} fontSize={18} fontWeight="bold" formatter={(val) => val > 0 ? val : ''} />
                </Bar>
                <Bar dataKey="period2" name="period2" fill="url(#yellowGradient)" radius={[6, 6, 2, 2]} maxBarSize={30}>
                  <LabelList dataKey="period2" position="top" fill={label2Color} fontSize={18} fontWeight="bold" formatter={(val) => val > 0 ? val : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-full flex items-center justify-center flex-col ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
              <span>ไม่พบข้อมูล</span>
            </div>
          )}
        </div>

        {/* ✅ Summary Card (อยู่ด้านขวา) */}
        <div className={`w-full lg:w-64 flex-shrink-0 p-5 rounded-xl border flex flex-col justify-center shadow-inner relative overflow-hidden group ${isDarkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h4 className={`text-base font-semibold mb-4 border-b pb-2 relative z-10 ${isDarkMode ? 'text-slate-300 border-slate-700' : 'text-slate-700 border-slate-200'}`}>สรุปผลการเปรียบเทียบ</h4>

          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-sm text-blue-400 mb-0.5 font-medium">รวมช่วงเวลาที่ 1</p>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-slate-900'}`}>{totals.total1} <span className={`text-base font-normal ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>คดี</span></div>
            </div>
            <div>
              <p className="text-sm text-yellow-400 mb-0.5 font-medium">รวมช่วงเวลาที่ 2</p>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'text-slate-900'}`}>{totals.total2} <span className={`text-base font-normal ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>คดี</span></div>
            </div>

            <div className={`pt-2 border-t ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <p className={`text-sm mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>ความเปลี่ยนแปลง</p>
              <div className={`flex items-baseline space-x-2 ${totals.diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`text-3xl font-bold ${isDarkMode ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]' : ''}`}>
                  {totals.diff > 0 ? '+' : ''}{totals.diff}
                </div>
                <div className={`flex items-center text-sm font-medium px-2 py-0.5 rounded-md ${totals.diff >= 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  {totals.diff > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : totals.diff < 0 ? <TrendingDown className="w-4 h-4 mr-1" /> : <Minus className="w-4 h-4 mr-1" />}
                  {Math.abs(totals.percentChange).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};