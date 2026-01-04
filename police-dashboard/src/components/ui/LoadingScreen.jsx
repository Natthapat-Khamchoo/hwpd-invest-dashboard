import React, { useState, useEffect } from 'react';

// STEP 7: RESTORED STRUCTURE (STATIC - NO IMAGES)
const LoadingScreen = ({ onFinished }) => {
    // Simple self-completing timer for testing
    const [progress, setProgress] = useState(0);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    // Start Exit Animation
                    setIsExiting(true);
                    setTimeout(() => {
                        onFinished();
                    }, 800); // Wait for transition
                    return 100;
                }
                return prev + 2;
            });
        }, 50);
        return () => clearInterval(interval);
    }, [onFinished]);

    return (
        <div className={`fixed inset-0 z-[9999] bg-[#0f172a] flex flex-col items-center justify-center overflow-hidden font-sans transition-all duration-700 ease-in-out ${isExiting ? 'opacity-0 scale-110 filter blur-sm pointer-events-none' : 'opacity-100 scale-100'}`}>

            {/* Siren Background Animation (Grid Layer) */}
            <div className="absolute inset-0 z-0 animate-siren-bg opacity-50"></div>

            {/* Top/Bottom Siren Glow */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-transparent to-red-600 opacity-60 blur-md animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-transparent to-blue-600 opacity-60 blur-md animate-pulse"></div>

            {/* Razor Beam Grid Background */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none perspective-[500px] overflow-hidden">
                {/* 3D Grid */}
                <div className="absolute inset-x-0 bottom-0 h-[200%] origin-bottom bg-gradient-to-t from-blue-900/20 to-transparent razor-grid animate-razor-grid"></div>

                {/* Moving Beam Line */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-blue-400 shadow-[0_0_20px_#60a5fa] animate-beam-sweep opacity-70"></div>
                <div className="absolute inset-x-0 top-0 h-[50px] bg-gradient-to-b from-blue-500/10 to-transparent animate-beam-sweep z-0"></div>
            </div>

            {/* Digital Overlay Subtlety */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none digital-bg"></div>

            {/* Main Content Container */}
            <div className="relative z-10 flex flex-col items-center justify-center">

                {/* Central Emblem/Scanner */}
                <div className="relative mb-12 group">
                    {/* Rotating Siren Borders */}
                    <div className="absolute inset-0 -m-8 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-red-500 border-l-transparent animate-spin" style={{ animationDuration: '2s' }}></div>
                    <div className="absolute inset-0 -m-4 rounded-full border-2 border-r-blue-400 border-b-transparent border-l-red-400 border-t-transparent animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}></div>

                    {/* Glowing Pulse Behind */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/10 to-red-500/10 animate-pulse blur-xl"></div>

                    {/* Logo Area */}
                    <div className="relative w-24 h-24 sm:w-40 sm:h-40 flex items-center justify-center">
                        <img
                            src="https://cib.go.th/backend/uploads/medium_logo_cib_4_2x_9f2da10e9f_a7828c9ca0.png"
                            alt="CIB Logo"
                            className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div class="text-6xl animate-bounce">🚨</div>';
                            }}
                        />

                        {/* Overlay Scanning Grid on Logo */}
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBoNDBWMDBIMHoiIGZpbGw9InVybCgjYSkiLz4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJhIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgo8cGF0aCBkPSJNMTAgMEwwIDEwaDEwVjB6IiBmaWxsPSJyZ2JhKDAsMjU1LDI1NSwwLjEpIi8+CjwvcGF0dGVybj4KPC9kZWZzPgo8L3N2Zz4=')] opacity-30 mix-blend-overlay rounded-full"></div>
                    </div>
                </div>

                {/* Text Cluster */}
                <div className="text-center space-y-4 mb-10 z-20">
                    <h2 className="text-base sm:text-3xl font-black tracking-normal sm:tracking-[0.25em] animate-siren-text uppercase px-2">
                        Investigation In Progress
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-[10px] sm:text-xs font-mono tracking-widest">
                        <span className="text-blue-400 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                            ACCESSING DATABASE
                        </span>
                        <span className="hidden sm:inline text-slate-500">|</span>
                        <span className="text-red-400 flex items-center gap-2">
                            DECRYPTING
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping delay-75"></span>
                        </span>
                    </div>
                </div>

                {/* Active Progress Bar */}
                <div className="relative w-[85%] max-w-[300px] sm:max-w-md h-2 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/50 backdrop-blur-sm">
                    {/* Moving Gradient Bar */}
                    <div
                        className="h-full bg-gradient-to-r from-blue-600 via-purple-500 to-red-600 transition-all duration-100 ease-linear shadow-[0_0_15px_currentColor]"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    >
                        {/* Leading Edge Highlight */}
                        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white shadow-[0_0_8px_#ffffff]"></div>
                    </div>
                </div>

                {/* Percentage & Status Code */}
                <div className="mt-4 flex justify-between w-[85%] max-w-[300px] sm:max-w-md font-mono text-[9px] sm:text-xs">
                    <span className="text-blue-500">SECURE: TLS_1.3</span>
                    <span className="text-white font-bold">{Math.round(progress)}%</span>
                    <span className="text-red-500">ID: XJ-992</span>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
