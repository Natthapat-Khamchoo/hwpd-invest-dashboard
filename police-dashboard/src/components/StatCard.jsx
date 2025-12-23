import React from 'react';

// Card ปกติ (Single Value) - คงเดิม
export const StatCard = ({ title, value, icon: Icon, colorClass, delay, onClick, isActive }) => (
  <div 
    onClick={onClick}
    className={`
      relative overflow-hidden backdrop-blur-md p-4 sm:p-5 rounded-xl border shadow-lg flex items-center space-x-4 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards
      ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl' : ''}
      ${isActive 
        ? 'bg-slate-700/90 border-yellow-400 ring-1 ring-yellow-400' 
        : 'bg-slate-800/80 border-slate-700/50 hover:border-slate-500'
      }
    `} 
    style={{ animationDelay: `${delay}ms` }}
  >
    {isActive && <div className="absolute top-0 right-0 p-1"><div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div></div>}
    
    <div className={`p-3 rounded-lg ${colorClass} bg-opacity-20 flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
      <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
    </div>
  </div>
);

// ✅ Card แบบ 3 ช่อง (Updated): แต่ละช่องกดแยกกันได้
export const SplitStatCard = ({ title, icon: Icon, subValues, colorClass, delay }) => (
  <div 
    className="relative backdrop-blur-md p-3 sm:p-4 rounded-xl border border-slate-700/50 shadow-lg flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards bg-slate-800/80"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Header */}
    <div className="flex items-center space-x-3 mb-3">
      <div className={`p-2 rounded-lg ${colorClass} bg-opacity-20 flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{title}</p>
    </div>
    
    {/* 3 Clickable Slots */}
    <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-700">
      {subValues.map((item, index) => (
        <div 
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            if (item.onClick) item.onClick();
          }}
          className={`
            cursor-pointer rounded-lg py-1 transition-all duration-200
            ${item.isActive 
              ? 'bg-slate-600/80 ring-1 ring-yellow-400 shadow-md transform scale-105' 
              : 'hover:bg-slate-700/50'
            }
          `}
        >
          <p className={`text-[10px] mb-1 ${item.labelColor || 'text-slate-500'}`}>{item.label}</p>
          <h3 className={`text-lg font-bold ${item.valueColor || 'text-white'}`}>{item.value}</h3>
        </div>
      ))}
    </div>
  </div>
);