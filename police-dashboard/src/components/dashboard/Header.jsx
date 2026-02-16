import React from 'react';
import { Menu, ChevronLeft, ClipboardCopy, RefreshCw, Download, Filter, Sun, Moon } from 'lucide-react';

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
    setShowFilterPanel,
    isDarkMode,
    toggleDarkMode
}) => {
    return (
        <header className={`sticky top-0 z-20 border-x-0 border-t-0 border-b px-4 py-3 flex items-center justify-between transition-all duration-300 ${isDarkMode ? 'glass-liquid-bar border-white/10' : 'bg-white/80 backdrop-blur-md border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-3">
                <button onClick={() => setMobileSidebarOpen(true)} className={`xl:hidden p-2 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}><Menu className="w-6 h-6" /></button>
                <button onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)} className={`hidden xl:block p-2 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}>{desktopSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
                <h1 className={`text-xl sm:text-3xl font-bold tracking-wide uppercase animate-in fade-in slide-in-from-left-4 ${isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400' : 'text-slate-900'}`}>{activeTab}</h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Day/Night Toggle */}
                <button
                    onClick={toggleDarkMode}
                    className={`p-2 sm:py-1.5 sm:px-3 rounded-lg text-xs flex items-center transition-all duration-300 border ${isDarkMode
                        ? 'bg-slate-800/80 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/10 hover:border-yellow-500/30'
                        : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                        }`}
                    title={isDarkMode ? 'Switch to Day Mode' : 'Switch to Night Mode'}
                >
                    {isDarkMode ? <Sun className="w-4 h-4 sm:mr-1" /> : <Moon className="w-4 h-4 sm:mr-1" />}
                    <span className="hidden sm:inline">{isDarkMode ? 'Day' : 'Night'}</span>
                </button>

                <button
                    onClick={onCopyReport}
                    className={`px-2 py-2 sm:py-1.5 sm:px-3 rounded-lg text-xs flex items-center transition-all border ${isDarkMode
                        ? 'bg-blue-600/80 hover:bg-blue-500 text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] border-blue-500/30'
                        : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-sm'
                        }`}
                    title="Copy Report"
                >
                    <ClipboardCopy className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Report</span>
                </button>

                <button
                    onClick={onResetFilters}
                    className={`px-2 py-2 sm:py-1.5 sm:px-3 rounded-lg text-xs flex items-center transition-all border ${isDarkMode
                        ? 'bg-slate-700/80 hover:bg-red-500/80 hover:text-white text-slate-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] border-white/10 hover:border-red-500/30'
                        : 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border-slate-200 hover:border-red-200'
                        }`}
                    title="Reset"
                >
                    <RefreshCw className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Reset</span>
                </button>

                <button
                    onClick={onExportCSV}
                    className={`px-2 py-2 sm:py-1.5 sm:px-3 rounded-lg text-xs flex items-center transition-all border ${isDarkMode
                        ? 'bg-emerald-600/80 hover:bg-emerald-500 text-white hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] border-emerald-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        }`}
                    title="Export CSV"
                >
                    <Download className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">CSV</span>
                </button>

                <button
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                    className={`flex items-center px-2 py-2 sm:py-1.5 sm:px-3 rounded-lg text-xs font-medium transition-all duration-200 border ${showFilterPanel
                        ? isDarkMode
                            ? 'bg-yellow-500 text-slate-900 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)]'
                            : 'bg-yellow-400 text-slate-900 border-yellow-500 shadow-sm'
                        : isDarkMode
                            ? 'bg-slate-800/80 text-slate-300 border-white/10 hover:bg-slate-700'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
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
