import React, { useState, useEffect } from 'react';

// Simple CountUp Component
const CountUp = ({ end, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const endVal = parseInt(String(end).replace(/,/g, ''), 10) || 0;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * endVal));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  // Format with commas
  return <>{count.toLocaleString()}</>;
};

// Helper: Extract color name from class string (e.g., "bg-blue-500" -> "blue")
const getColorName = (str) => {
  const match = str.match(/bg-(\w+)-500/);
  return match ? match[1] : 'blue';
};

// Card ปกติ (Single Value)
export const StatCard = ({ title, value, icon: Icon, colorClass, delay, onClick, isActive }) => {
  const colorName = getColorName(colorClass);

  // Base glow color classes map
  const glowClasses = {
    blue: 'hover:shadow-blue-500/30 hover:border-blue-400/50',
    red: 'hover:shadow-red-500/30 hover:border-red-400/50',
    orange: 'hover:shadow-orange-500/30 hover:border-orange-400/50',
    purple: 'hover:shadow-purple-500/30 hover:border-purple-400/50',
    pink: 'hover:shadow-pink-500/30 hover:border-pink-400/50',
    gray: 'hover:shadow-slate-500/30 hover:border-slate-400/50',
  };

  const activeGlow = {
    blue: 'shadow-[0_0_20px_rgba(59,130,246,0.5)] border-blue-400',
    red: 'shadow-[0_0_20px_rgba(239,68,68,0.5)] border-red-400',
    orange: 'shadow-[0_0_20px_rgba(249,115,22,0.5)] border-orange-400',
    purple: 'shadow-[0_0_20px_rgba(168,85,247,0.5)] border-purple-400',
    pink: 'shadow-[0_0_20px_rgba(236,72,153,0.5)] border-pink-400',
    gray: 'shadow-[0_0_20px_rgba(100,116,139,0.5)] border-slate-400',
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl border flex items-center space-x-4 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards
        backdrop-blur-xl bg-slate-800/40 
        ${onClick ? 'cursor-pointer hover:scale-[1.03] hover:-translate-y-1' : ''}
        ${isActive
          ? `${activeGlow[colorName] || activeGlow.blue} bg-slate-800/80 ring-1`
          : `border-white/10 ${glowClasses[colorName] || glowClasses.blue}`
        }
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Dynamic Background Gradient */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 bg-${colorName}-500/10 rounded-full blur-3xl transition-opacity group-hover:opacity-100 opacity-50`}></div>

      {/* Active Indicator Pulse */}
      {isActive && <div className={`absolute top-2 right-2 w-2 h-2 bg-${colorName}-400 rounded-full animate-pulse shadow-[0_0_10px_currentColor]`}></div>}

      <div className={`p-4 rounded-xl ${colorClass} bg-opacity-20 flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative z-10`}>
        <Icon className={`w-8 h-8 ${colorClass.replace('bg-', 'text-')} drop-shadow-lg`} />
      </div>

      <div className="min-w-0 relative z-10">
        <p className="text-sm text-slate-400 font-medium uppercase tracking-wider group-hover:text-slate-300 transition-colors">{title}</p>
        <h3 className={`text-3xl font-bold text-white tracking-tight ${isActive ? 'neon-text' : ''}`}>
          <CountUp end={value} />
        </h3>
      </div>
    </div>
  );
};

// ✅ Card แบบ 3 ช่อง (Updated)
export const SplitStatCard = ({ title, icon: Icon, subValues, colorClass, delay }) => {
  const colorName = getColorName(colorClass);

  return (
    <div
      className={`
        relative backdrop-blur-xl bg-slate-800/40 p-4 sm:p-5 rounded-xl border border-white/10 shadow-lg flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards
        hover:border-${colorName}-400/30 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,0,0,0.3)]
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background decoration */}
      <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity rounded-xl pointer-events-none`}></div>

      {/* Header */}
      <div className="flex items-center space-x-3 mb-4 relative z-10">
        <div className={`p-2.5 rounded-lg ${colorClass} bg-opacity-20 flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">{title}</p>
      </div>

      {/* 3 Clickable Slots */}
      <div className="grid grid-cols-3 gap-2 text-center divide-x divide-white/10 relative z-10">
        {subValues.map((item, index) => (
          <div
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              if (item.onClick) item.onClick();
            }}
            className={`
              cursor-pointer rounded-lg py-1 transition-all duration-200 group/item relative overflow-hidden
              ${item.isActive
                ? `bg-${colorName}-500/20 ring-1 ring-${colorName}-400 shadow-[0_0_10px_rgba(0,0,0,0.2)] transform scale-105`
                : 'hover:bg-white/5'
              }
            `}
          >
            <p className={`text-[10px] mb-1 ${item.labelColor || 'text-slate-400'} group-hover/item:text-white transition-colors`}>{item.label}</p>
            <h3 className={`text-lg font-bold ${item.valueColor || 'text-white'}`}>
              <CountUp end={item.value} />
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
};