import React from 'react';
import { Menu, ChevronLeft, ClipboardCopy, RefreshCw, Download, Filter } from 'lucide-react';

export const Header = ({
    activeTab,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    desktopSidebarOpen,
    setDesktopSidebarOpen,
    onCopyReport,
    onResetFilters,
    onExportCSV,
    showFilterPanel,
    setShowFilterPanel
}) => {
    return (
        <header className="sticky top-0 z-20 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
                <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Menu className="w-6 h-6" /></button>
                <button onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)} className="hidden lg:block p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">{desktopSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
                <h1 className="text-base sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-wide uppercase animate-in fade-in slide-in-from-left-4">{activeTab}</h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                    onClick={onCopyReport}
                    className="bg-blue-600/80 hover:bg-blue-500 text-white px-2 py-2 sm:py-1.5 sm:px-3 rounded-lg text-xs flex items-center transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-500/30"
                    title="Copy Report"
                >
                    <ClipboardCopy className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Report</span>
                </button>

                <button
                    onClick={onResetFilters}
                    className="bg-slate-700/80 hover:bg-red-500/80 hover:text-white text-slate-300 px-2 py-2 sm:py-1.5 sm:px-3 rounded-lg text-xs flex items-center transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-white/10 hover:border-red-500/30"
                    title="Reset"
                >
                    <RefreshCw className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Reset</span>
                </button>

                <button
                    onClick={onExportCSV}
                    className="bg-emerald-600/80 hover:bg-emerald-500 text-white px-2 py-2 sm:py-1.5 sm:px-3 rounded-lg text-xs flex items-center transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] border border-emerald-500/30"
                    title="Export CSV"
                >
                    <Download className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">CSV</span>
                </button>

                <button
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                    className={`flex items-center px-2 py-2 sm:py-1.5 sm:px-3 rounded-lg text-xs font-medium transition-all duration-200 border ${showFilterPanel
                            ? 'bg-yellow-500 text-slate-900 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)]'
                            : 'bg-slate-800/80 text-slate-300 border-white/10 hover:bg-slate-700'
                        }`}
                    title="Filters"
                >
                    <Filter className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Filters</span>
                </button>
            </div>
        </header>
    );
};
