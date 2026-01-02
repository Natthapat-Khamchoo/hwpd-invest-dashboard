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
            {/* Background Digital Lines (Animated with Lasers) */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                {/* Vertical Line 1 */}
                <div className="absolute top-0 left-[10%] w-[1px] h-full bg-blue-500/30">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[4px] h-[50%] bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-scan-v shadow-[0_0_15px_#22d3ee]"></div>
                </div>
                {/* Vertical Line 2 */}
                <div className="absolute top-0 left-[90%] w-[1px] h-full bg-blue-500/30">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[4px] h-[50%] bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-scan-v shadow-[0_0_15px_#22d3ee]" style={{ animationDelay: '1.5s' }}></div>
                </div>
                {/* Horizontal Line 1 */}
                <div className="absolute top-[20%] left-0 w-full h-[1px] bg-purple-500/30">
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[50%] h-[4px] bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent animate-scan-h shadow-[0_0_15px_#e879f9]" style={{ animationDelay: '0.5s' }}></div>
                </div>
                {/* Horizontal Line 2 */}
                <div className="absolute top-[80%] left-0 w-full h-[1px] bg-purple-500/30">
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[50%] h-[4px] bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent animate-scan-h shadow-[0_0_15px_#e879f9]" style={{ animationDelay: '2s' }}></div>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="relative z-10 flex flex-col items-center">

                {/* Logo Container */}
                <div className="relative mb-12">
                    {/* Animated Rings */}
                    <div className="absolute inset-0 -m-8 border-2 border-blue-500/30 rounded-full animate-spin-slow" style={{ animationDuration: '3s' }}></div>
                    <div className="absolute inset-0 -m-4 border border-blue-400/20 rounded-full animate-reverse-spin" style={{ animationDirection: 'reverse', animationDuration: '5s' }}></div>

                    {/* Logo */}
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 filter drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        <img
                            src="https://cib.go.th/backend/uploads/medium_logo_cib_4_2x_9f2da10e9f_a7828c9ca0.png"
                            alt="CIB Logo"
                            className="w-full h-full object-contain animate-pulse"
                            style={{ animationDuration: '2s' }}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div class="text-6xl">👮‍♂️</div>';
                            }}
                        />
                    </div>
                </div>

                {/* Text */}
                <div className="text-center space-y-2 mb-8">
                    <h2 className="text-2xl font-bold text-white tracking-[0.2em]">
                        SYSTEM INITIALIZING...
                    </h2>
                    <p className="text-xs text-blue-400 tracking-widest uppercase opacity-70">
                        Secure Connection Establishing
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-64 sm:w-80 h-1 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
                    <div
                        className="h-full bg-blue-600 transition-all duration-100"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                </div>

                {/* Percentage */}
                <div className="mt-2 font-mono text-cyan-400 text-sm">
                    {Math.round(progress)}%
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
