import React from 'react';
import { ChevronDown } from 'lucide-react';

export const safeNumber = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "0";
    return val.toLocaleString();
};

export const NodeCard = ({ color, label, value, valueColor, textColor, scale, onClick, isInteractive }) => (
    <div onClick={onClick} className={`relative ${color} rounded-[2rem] p-4 w-full text-center shadow-[0_10px_30px_rgba(0,0,0,0.15)] border-[4px] border-white flex flex-col xl:flex-row items-center justify-between gap-4 px-6 ${scale} transition-transform ${isInteractive ? 'cursor-pointer hover:brightness-105 active:scale-95' : ''}`}>
        <div className="flex-1 min-w-0 text-center xl:text-left">
            <h3 className={`text-2xl xl:text-4xl font-extrabold ${textColor} whitespace-nowrap`}>{label}</h3>
        </div>
        <div className={`${valueColor} text-white font-black text-4xl xl:text-6xl px-6 py-2 rounded-2xl shadow-inner min-w-[120px] whitespace-nowrap flex-shrink-0`}>{safeNumber(value)}</div>
        {isInteractive && (<div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 p-2 rounded-full transition-transform hover:scale-110"><ChevronDown className="w-6 h-6 text-slate-700" /></div>)}
    </div>
);

export const SubNodeHeader = ({ label, value, badgeColor }) => (
    <div className="bg-slate-200 rounded-full pl-6 pr-2 py-2 flex items-center justify-between gap-3 w-full shadow-lg border-[3px] border-white hover:shadow-xl transition-shadow">
        <span className="font-bold text-slate-800 text-xl xl:text-2xl whitespace-nowrap">{label}</span>
        <span className={`${badgeColor} text-white rounded-full px-5 py-2 font-bold text-2xl xl:text-3xl min-w-[60px] text-center whitespace-nowrap`}>
            {safeNumber(value)}
        </span>
    </div>
);

export const ListItem = ({ label, value, highlight }) => (
    <div className="flex items-center gap-3 text-slate-600 py-1.5 pr-4">
        <div className={`w-4 h-4 rounded-full ${highlight ? 'bg-[#dc2626]' : 'bg-slate-400'}`}></div>
        <span className={`text-xl xl:text-2xl ${highlight ? 'font-bold text-slate-900' : ''}`}>{label}</span>
        <span className={`ml-auto font-bold text-xl xl:text-2xl ${highlight ? 'text-[#dc2626]' : 'text-slate-500'} whitespace-nowrap`}>{value}</span>
    </div>
);

export const SimpleItem = ({ text, value }) => (
    <div className="flex justify-between items-center py-1.5 pr-4">
        <span className="text-slate-700 font-medium text-xl xl:text-2xl">• {text}</span>
        <span className="text-[#dc2626] font-bold text-xl xl:text-2xl whitespace-nowrap">{value}</span>
    </div>
);

export const SimpleItemCompact = ({ text, value }) => (
    <div className="flex justify-between items-center text-xs border-b border-dashed border-slate-200 py-1 last:border-0 leading-none">
        <span className="text-slate-600 truncate mr-2 pt-[1px]">{text}</span>
        <span className="font-bold text-slate-900">{value}</span>
    </div>
);
