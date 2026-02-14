import React from 'react';

export const SeizedItem = ({ label, value, unit }) => (
    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
        <span className="text-slate-600 font-medium text-xl xl:text-2xl">{label}</span>
        <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-[#1c2e4a]">{value}</span>
            <span className="text-slate-400 text-lg">{unit}</span>
        </div>
    </div>
);

export const SeizedBox = ({ title, items }) => (
    <div className="bg-white rounded-lg p-2 border border-slate-200 shadow-sm">
        <div className="font-bold text-xs text-slate-500 mb-1 border-b border-slate-100 pb-1">{title}</div>
        {items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs py-0.5 leading-none">
                <span className="text-slate-600 pt-[1px]">{item.l}</span>
                <span>
                    <span className="font-bold text-slate-900">{item.v}</span>
                    {item.u && <span className="text-[10px] text-slate-400 ml-1">{item.u}</span>}
                </span>
            </div>
        ))}
    </div>
);
