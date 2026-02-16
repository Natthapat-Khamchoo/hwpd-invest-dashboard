import React from 'react';
import MultiSelectDropdown from '../ui/MultiSelectDropdown';
import { UNIT_HIERARCHY, DATE_RANGES } from '../../utils/helpers';

const FilterBar = ({
    show,
    localSearch, setLocalSearch,
    filters, setFilters,
    filterOptions
}) => {

    if (!show) return null;

    // --- Filter Logic Moved from App.jsx ---
    const handlePeriodChange = (period) => {
        const now = new Date();
        let start = new Date(); let end = new Date();
        start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);

        if (period === 'yesterday') { start.setDate(now.getDate() - 1); end.setDate(now.getDate() - 1); }
        else if (period === '7days') { start.setDate(now.getDate() - 7); }
        else if (period === '30days') { start.setDate(now.getDate() - 30); }
        else if (period === 'this_month') { start.setDate(1); }
        else if (period === 'all') { start = null; end = null; }
        else if (period === 'custom') { start = filters.rangeStart || start; end = filters.rangeEnd || end; }

        setFilters(prev => ({ ...prev, period, rangeStart: start, rangeEnd: end }));
    };

    const handleCustomDateChange = (type, val) => {
        if (!val) return;
        const d = new Date(val);
        if (type === 'start') { d.setHours(0, 0, 0, 0); setFilters(prev => ({ ...prev, rangeStart: d, period: 'custom' })); }
        else { d.setHours(23, 59, 59, 999); setFilters(prev => ({ ...prev, rangeEnd: d, period: 'custom' })); }
    };

    const formatDateForInput = (date) => {
        if (!date) return '';
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

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
                        value={filters.period}
                        onChange={(e) => handlePeriodChange(e.target.value)}
                    >
                        {DATE_RANGES.map((r) => <option key={r.value} value={r.value} className="dark:bg-slate-900 bg-white">{r.label}</option>)}
                    </select>
                </div>
                {filters.period === 'custom' && (
                    <>
                        <input type="date" className="w-full dark:bg-slate-900/50 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-lg text-base dark:text-white text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50" value={formatDateForInput(filters.rangeStart)} onChange={(e) => handleCustomDateChange('start', e.target.value)} />
                        <input type="date" className="w-full dark:bg-slate-900/50 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-lg text-base dark:text-white text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50" value={formatDateForInput(filters.rangeEnd)} onChange={(e) => handleCustomDateChange('end', e.target.value)} />
                    </>
                )}
            </div>
        </div>
    );
};

export default FilterBar;
