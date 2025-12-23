import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LabelList 
} from 'recharts';
import { MousePointerClick, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { getUnitColor, getCrimeColor } from '../utils/helpers';

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
              {/* ✅ เพิ่ม Label บนกราฟ */}
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
                    {/* ✅ เพิ่ม Label บนกราฟ */}
                    <LabelList dataKey="cases" position="top" fill="#ffffff" fontSize={12} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
  </div>
);