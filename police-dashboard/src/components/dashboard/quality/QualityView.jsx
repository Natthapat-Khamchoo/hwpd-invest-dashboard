import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardCheck, ChevronRight } from 'lucide-react';
import { buildQualityModel } from '../../../lib/quality/buildQualityModel.js';
import { formatPeriodRange, themed } from './qualityFormat.js';
import HQPanel from './HQPanel';
import DivisionPanel from './DivisionPanel';
import StationPanel from './StationPanel';

const PERIOD_OPTIONS = [
    { id: 'month', label: 'เดือนนี้' },
    { id: 'fy', label: 'สะสมปีงบประมาณ' },
];

const navTo = (level, fields = {}) => ({ level, kk: null, stationKey: null, ...fields });

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400';

const QualityView = ({ rawData, isDarkMode = true }) => {
    const [period, setPeriod] = useState('month');
    const [nav, setNav] = useState(navTo('hq'));
    const model = useMemo(() => buildQualityModel(rawData || {}, period), [rawData, period]);
    const rootRef = useRef(null);
    const shownNav = useRef(nav);

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

    return (
        <div ref={rootRef} className="mx-auto w-full max-w-6xl space-y-6">
            <header className="space-y-3">
                <h2 className="flex items-center gap-2 text-2xl font-bold">
                    <ClipboardCheck className={`h-7 w-7 ${themed(isDarkMode, 'text-cyan-400', 'text-cyan-600')}`} aria-hidden="true" />
                    ประเมินคุณภาพงาน
                </h2>
                <p className={`rounded-lg border p-3 text-sm ${themed(isDarkMode, 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200', 'border-cyan-300 bg-cyan-50 text-cyan-900')}`}>
                    Mockup: คะแนนทั้งหมดคิดจากข้อมูลจริงในชีต
                </p>
            </header>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div
                    role="group"
                    aria-label="ช่วงเวลา"
                    className={`inline-flex w-fit gap-1 rounded-lg border p-1 ${themed(isDarkMode, 'border-white/10 bg-slate-900/40', 'border-slate-200 bg-white')}`}
                >
                    {PERIOD_OPTIONS.map((option) => {
                        const active = period === option.id;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setPeriod(option.id)}
                                className={`min-h-[44px] cursor-pointer rounded-md px-4 text-sm font-semibold transition-colors duration-200 ${focusRing} ${active
                                    ? 'bg-cyan-500 text-white'
                                    : themed(isDarkMode, 'text-slate-300 hover:bg-white/10', 'text-slate-700 hover:bg-slate-100')}`}
                            >
                                {option.label}
                            </button>
                        );
                    })}
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

            {nav.level === 'hq' && <HQPanel model={model} isDarkMode={isDarkMode} onSelectDivision={selectDivision} />}
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
