import React from 'react';
import MultiSelectDropdown from '../ui/MultiSelectDropdown';
import { UNIT_HIERARCHY } from '../../utils/helpers';

const FilterBar = ({
    show,
    localSearch, setLocalSearch,
    filters, setFilters,
    filterOptions
}) => {

    if (!show) return null;

    // --- Filter Logic Moved from App.jsx ---
    const handleMonthChange = (monthVal) => {
        setFilters(prev => ({ 
            ...prev, 
            selectedMonth: monthVal,
            period: 'custom' // Override period logic
        }));
    };

    const handleYearChange = (yearVal) => {
        setFilters(prev => ({ 
            ...prev, 
            selectedYear: yearVal,
            period: 'custom'
        }));
    };

    const handleCustomDateChange = (type, val) => {
        if (!val) return;
        const d = new Date(val);
        if (type === 'start') { d.setHours(0, 0, 0, 0); setFilters(prev => ({ ...prev, rangeStart: d, period: 'custom' })); }
        else { d.setHours(23, 59, 59, 999); setFilters(prev => ({ ...prev, rangeEnd: d, period: 'custom' })); }
    };

    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 5}, (_, i) => currentYear - i);

    return (
        <div className="dark:bg-slate-800/60 bg-white/90 backdrop-blur-xl border-b dark:border-white/5 border-slate-200 p-4 animate-in slide-in-from-top-2 duration-200 shadow-xl z-20 relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div className="sm:col-span-2">
                    <input
                        type="text"
                        className="w-full pl-3 pr-3 py-2.5 dark:bg-slate-900/50 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-lg text-base dark:text-white text-slate-900 dark:placeholder-slate-400 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner"
                        placeholder="🔍 ค้นหา ชื่อ/ข้อหา..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                    />
                </div>
                <div>
                    <select
                        className="w-full pl-2 pr-2 py-2.5 dark:bg-slate-900/50 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-lg text-base dark:text-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all dark:hover:bg-slate-800/80 hover:bg-slate-100 cursor-pointer"
                        value={filters.unit_kk}
                        onChange={(e) => setFilters(p => ({ ...p, unit_kk: e.target.value, unit_s_tl: '' }))}
                    >
                        <option value="" className="dark:bg-slate-900 bg-white">🏢 ทุก กก.</option>
                        {Object.keys(UNIT_HIERARCHY).map(kk => <option key={kk} value={kk} className="dark:bg-slate-900 bg-white">กก.{kk}</option>)}
                    </select>
                </div>
                <div>
                    <MultiSelectDropdown
                        options={filterOptions.topics}
                        selected={filters.topic}
                        onChange={(newVal) => setFilters(prev => ({ ...prev, topic: newVal }))}
                        className="glass-input"
                    />
                </div>
                <div>
                    <select
                        className="w-full pl-2 pr-2 py-2.5 dark:bg-slate-900/50 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-lg text-base dark:text-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all dark:hover:bg-slate-800/80 hover:bg-slate-100 cursor-pointer"
                        value={filters.selectedMonth !== undefined ? filters.selectedMonth : ''}
                        onChange={(e) => handleMonthChange(e.target.value)}
                    >
                        <option value="" className="dark:bg-slate-900 bg-white">📅 ทุกเดือน</option>
                        {months.map((m, i) => <option key={i} value={i} className="dark:bg-slate-900 bg-white">{m}</option>)}
                    </select>
                </div>
                <div>
                    <select
                        className="w-full pl-2 pr-2 py-2.5 dark:bg-slate-900/50 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-lg text-base dark:text-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all dark:hover:bg-slate-800/80 hover:bg-slate-100 cursor-pointer"
                        value={filters.selectedYear || ''}
                        onChange={(e) => handleYearChange(e.target.value)}
                    >
                        <option value="" className="dark:bg-slate-900 bg-white">🗓️ ทุกปี</option>
                        {years.map((y) => <option key={y} value={y} className="dark:bg-slate-900 bg-white">{y + 543}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
