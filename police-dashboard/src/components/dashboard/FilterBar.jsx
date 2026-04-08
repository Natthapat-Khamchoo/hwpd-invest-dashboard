import React from 'react';
import MultiSelectDropdown from '../ui/MultiSelectDropdown';
import { UNIT_HIERARCHY } from '../../utils/helpers';
import Datepicker from "react-tailwindcss-datepicker";

const FilterBar = ({
    show,
    localSearch, setLocalSearch,
    filters, setFilters,
    filterOptions
}) => {

    if (!show) return null;

    return (
        <div className="dark:bg-slate-800/60 bg-white/90 backdrop-blur-xl border-b dark:border-white/5 border-slate-200 p-4 animate-in slide-in-from-top-2 duration-200 shadow-xl z-[100] relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="sm:col-span-2 lg:col-span-2">
                    <input
                        type="text"
                        className="w-full pl-3 pr-3 py-2.5 dark:bg-slate-900/50 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-lg text-base dark:text-white text-slate-900 dark:placeholder-slate-400 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner"
                        placeholder="🔍 ค้นหา ชื่อ/ข้อหา..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                    />
                </div>
                <div className="lg:col-span-1">
                    <select
                        className="w-full pl-2 pr-2 py-2.5 dark:bg-slate-900/50 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-lg text-base dark:text-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all dark:hover:bg-slate-800/80 hover:bg-slate-100 cursor-pointer"
                        value={filters.unit_kk}
                        onChange={(e) => setFilters(p => ({ ...p, unit_kk: e.target.value, unit_s_tl: '' }))}
                    >
                        <option value="" className="dark:bg-slate-900 bg-white">🏢 ทุก กก.</option>
                        {Object.keys(UNIT_HIERARCHY).map(kk => <option key={kk} value={kk} className="dark:bg-slate-900 bg-white">กก.{kk}</option>)}
                    </select>
                </div>
                <div className="lg:col-span-1">
                    <MultiSelectDropdown
                        options={filterOptions.topics}
                        selected={filters.topic}
                        onChange={(newVal) => setFilters(prev => ({ ...prev, topic: newVal }))}
                        className="glass-input"
                    />
                </div>
                <div className="sm:col-span-2 lg:col-span-2 relative z-30">
                    <Datepicker 
                        i18n={"th"}
                        displayFormat={"DD/MM/YYYY"}
                        value={filters.dateRange}
                        onChange={(newValue) => setFilters(prev => ({ ...prev, dateRange: newValue, period: 'custom' }))}
                        showShortcuts={true}
                        configs={{
                            shortcuts: {
                                today: "วันนี้",
                                yesterday: "เมื่อวาน",
                                past: period => `${period} วันย้อนหลัง`,
                                currentMonth: "เดือนนี้",
                                pastMonth: "เดือนที่แล้ว"
                            }
                        }}
                        placeholder="📅 เลือกห้วงเวลา"
                        inputClassName="w-full pl-3 pr-3 py-2.5 dark:bg-slate-900/50 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-lg text-base dark:text-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all dark:hover:bg-slate-800/80 hover:bg-slate-100 cursor-pointer shadow-inner"
                    />
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
