import React from 'react';

// Card ปกติ (Single Value)
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

// Card แบบ 3 ช่อง (Triple Value)
export const SplitStatCard = ({ title, icon: Icon, mainValue, subValues, colorClass, delay, onClick, isActive }) => (
  <div 
    onClick={onClick}
    className={`
      relative backdrop-blur-md p-3 sm:p-4 rounded-xl border shadow-lg flex flex-col justify-between transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards
      ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl' : ''}
      ${isActive 
        ? 'bg-slate-700/90 border-yellow-400 ring-1 ring-yellow-400' 
        : 'bg-slate-800/80 border-slate-700/50 hover:border-slate-500'
      }
    `} 
    style={{ animationDelay: `${delay}ms` }}
  >
    {isActive && <div className="absolute top-0 right-0 p-1"><div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div></div>}

    <div className="flex items-center space-x-3 mb-3">
      <div className={`p-2 rounded-lg ${colorClass} bg-opacity-20 flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{title}</p>
    </div>
    
    <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-700">
      <div>
        <p className="text-[10px] text-slate-500 mb-1">{subValues[0].label}</p>
        <h3 className="text-lg font-bold text-white">{mainValue}</h3>
      </div>
      <div>
        <p className="text-[10px] text-green-500 mb-1">{subValues[1].label}</p>
        <h3 className="text-lg font-bold text-green-400">{subValues[1].value}</h3>
      </div>
      <div>
        <p className="text-[10px] text-pink-500 mb-1">{subValues[2].label}</p>
        <h3 className="text-lg font-bold text-pink-400">{subValues[2].value}</h3>
      </div>
    </div>
  </div>
);