import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardCheck, ChevronRight } from 'lucide-react';
import { buildQualityModel } from '../../../lib/quality/buildQualityModel.js';
import { latestScoredMonth } from '../../../lib/quality/scoringDates.js';
import { fiscalYearLabel, formatPeriodRange, monthOptions, sourceNotice, themed } from './qualityFormat.js';
import HQPanel from './HQPanel';
import DivisionPanel from './DivisionPanel';
import StationPanel from './StationPanel';

// The newest workbook month is the default period. With no workbook at all, the fiscal year view is shown.
const NEWEST_MONTH = latestScoredMonth();
const DEFAULT_PERIOD = NEWEST_MONTH ? { kind: 'pastMonth', month: NEWEST_MONTH } : { kind: 'fy' };
const FY_LABEL = NEWEST_MONTH ? fiscalYearLabel(NEWEST_MONTH) : 'ปีงบประมาณ';

const navTo = (level, fields = {}) => ({ level, kk: null, stationKey: null, ...fields });

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400';

const QualityView = ({ isDarkMode = true }) => {
    const [period, setPeriod] = useState(DEFAULT_PERIOD);
    const [nav, setNav] = useState(navTo('hq'));
    const model = useMemo(() => buildQualityModel(null, period), [period]);
    const rootRef = useRef(null);
    const shownNav = useRef(nav);
    const months = monthOptions();

    // The page scrolls inside App's <main> container, so a drill-down or breadcrumb would otherwise open mid-page
    useEffect(() => {
        if (shownNav.current === nav) return;
        shownNav.current = nav;
        rootRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
    }, [nav]);

    const muted = themed(isDarkMode, 'text-slate-400', 'text-slate-600');
    const selectDivision = (kk) => setNav(navTo('division', { kk }));
    const selectStation = (stationKey) => {
        const station = model.stations.find((item) => item.key === stationKey);
        setNav(navTo('station', { kk: station?.kk ?? null, stationKey }));
    };

    const crumbs = [{ label: 'บก.ทล.', target: navTo('hq') }];
    if (nav.kk) crumbs.push({ label: `กก.${nav.kk}`, target: navTo('division', { kk: nav.kk }) });
    if (nav.stationKey) {
        const station = model.stations.find((item) => item.key === nav.stationKey);
        if (station) crumbs.push({ label: `ส.ทล.${station.stl}`, target: navTo('station', { kk: nav.kk, stationKey: nav.stationKey }) });
    }

    const fyActive = period.kind === 'fy';

    return (
        <div ref={rootRef} className="mx-auto w-full max-w-6xl space-y-6">
            <header className="space-y-3">
                <h2 className="flex items-center gap-2 text-2xl font-bold">
                    <ClipboardCheck className={`h-7 w-7 ${themed(isDarkMode, 'text-cyan-400', 'text-cyan-600')}`} aria-hidden="true" />
                    ประเมินคุณภาพงาน
                </h2>
                {NEWEST_MONTH && (
                    <p className={`rounded-lg border p-3 text-sm ${themed(isDarkMode, 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200', 'border-cyan-300 bg-cyan-50 text-cyan-900')}`}>
                        {sourceNotice(NEWEST_MONTH)}
                    </p>
                )}
            </header>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <div
                        role="group"
                        aria-label="ช่วงเวลา"
                        className={`inline-flex max-w-full flex-wrap gap-1 rounded-lg border p-1 ${themed(isDarkMode, 'border-white/10 bg-slate-900/40', 'border-slate-200 bg-white')}`}
                    >
                        <button
                            type="button"
                            aria-pressed={fyActive}
                            onClick={() => setPeriod({ kind: 'fy' })}
                            className={`min-h-[44px] cursor-pointer rounded-md px-4 text-sm font-semibold transition-colors duration-200 ${focusRing} ${fyActive
                                ? 'bg-cyan-500 text-white'
                                : themed(isDarkMode, 'text-slate-300 hover:bg-white/10', 'text-slate-700 hover:bg-slate-100')}`}
                        >
                            {FY_LABEL}
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="quality-month" className={`text-sm font-medium ${muted}`}>เลือกเดือน</label>
                        <select
                            id="quality-month"
                            value={period.kind === 'pastMonth' ? period.month : ''}
                            onChange={(event) => setPeriod({ kind: 'pastMonth', month: event.target.value })}
                            style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                            className={`min-h-[44px] cursor-pointer rounded-md border px-3 text-sm font-semibold ${focusRing} ${themed(isDarkMode, 'border-white/10 bg-slate-900/40 text-white', 'border-slate-200 bg-white text-slate-900')}`}
                        >
                            <option value="" disabled>ยังไม่เลือก</option>
                            {months.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <p className={`text-sm ${muted}`}>{formatPeriodRange(model.period)}</p>
            </div>

            <nav aria-label="เส้นทางการดู">
                <ol className="flex flex-wrap items-center gap-1 text-sm">
                    {crumbs.map((crumb, index) => {
                        const isCurrent = index === crumbs.length - 1;
                        return (
                            <li key={index} className="flex items-center gap-1">
                                {index > 0 && <ChevronRight className={`h-4 w-4 ${muted}`} aria-hidden="true" />}
                                {isCurrent ? (
                                    <span aria-current="page" className="px-2 py-2 font-semibold">{crumb.label}</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setNav(crumb.target)}
                                        className={`min-h-[44px] cursor-pointer rounded-md px-2 font-medium underline-offset-4 transition-colors duration-200 hover:underline ${focusRing} ${themed(isDarkMode, 'text-cyan-300', 'text-cyan-700')}`}
                                    >
                                        {crumb.label}
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>

            {nav.level === 'hq' && <HQPanel model={model} isDarkMode={isDarkMode} onSelectDivision={selectDivision} onSelectStation={selectStation} />}
            {nav.level === 'division' && (
                <DivisionPanel model={model} kk={nav.kk} isDarkMode={isDarkMode} onSelectStation={selectStation} />
            )}
            {nav.level === 'station' && (
                <StationPanel model={model} stationKey={nav.stationKey} isDarkMode={isDarkMode} />
            )}
        </div>
    );
};

export default QualityView;
