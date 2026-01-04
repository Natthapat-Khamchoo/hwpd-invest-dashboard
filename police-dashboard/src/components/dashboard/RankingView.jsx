import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Medal, Award, Star, Shield, Siren, Gavel, Target, Sparkles, Crown, Pill, FileText, ArrowLeft, X } from 'lucide-react';

const getRankIcon = (index) => {
    switch (index) {
        case 0: return <Trophy className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse-slow" />;
        case 1: return <Medal className="w-5 h-5 text-slate-300 drop-shadow-[0_0_5px_rgba(203,213,225,0.5)]" />;
        case 2: return <Medal className="w-5 h-5 text-amber-700 drop-shadow-[0_0_5px_rgba(180,83,9,0.5)]" />;
        default: return <div className="w-5 h-5 flex items-center justify-center font-bold text-slate-500 text-xs">{index + 1}</div>;
    }
};

const RankingCard = ({ title, icon: Icon, data, colorClass, isPremium = false, onClick, isSelected = false, onClose, disableHover = false }) => {
    return (
        <div
            onClick={onClick}
            className={`
      relative overflow-hidden group transition-all duration-700
      rounded-xl border backdrop-blur-md
      ${isPremium
                    ? 'bg-gradient-to-b from-slate-800/60 to-slate-900/80 border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)]'
                    : 'glass-liquid border-white/10 hover:border-white/20'}
      ${isSelected
                    ? 'shadow-2xl z-50'
                    : disableHover
                        ? ''
                        : 'cursor-pointer hover:-translate-y-1'}
    `}
            style={{ height: '100%' }}
        >
            {/* Close Button (Only when selected) */}
            {onClose && (
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/20 hover:bg-red-500/20 text-slate-400 hover:text-white transition-all z-20"
                >
                    <X className="w-5 h-5" />
                </button>
            )}

            {/* Background Glow Effect */}
            <div className={`absolute -right-10 -top-10 w-40 h-40 ${colorClass} opacity-10 rounded-full blur-[60px] transition-opacity duration-700 ${isSelected ? 'opacity-30' : 'group-hover:opacity-20'}`}></div>
            {isPremium && <div className={`absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent transition-opacity duration-500 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>}

            <div className="p-3 sm:p-6 relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 border border-white/10 shadow-lg transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>
                        <Icon className={`w-7 h-7 ${colorClass.replace('bg-', 'text-')} drop-shadow-md`} />
                    </div>
                    <div>
                        <h3 className={`text-base sm:text-lg font-bold ${isPremium ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500' : 'text-white'}`}>
                            {title}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                            {isPremium && <Crown className="w-3 h-3 text-yellow-500" />} Top 3 Units
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {data.length > 0 ? (
                        data.map((item, index) => (
                            <div key={index}
                                className={`
                   flex items-center justify-between p-3 rounded-lg border transition-all duration-300
                   ${index === 0 && isPremium
                                        ? 'bg-gradient-to-r from-yellow-900/20 to-slate-900/40 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                                        : 'bg-slate-900/40 border-white/5 hover:bg-slate-800/60'}
                 `}>
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-8 flex justify-center">
                                        {getRankIcon(index)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-semibold ${index === 0 ? 'text-white' : 'text-slate-300'}`}>
                                            {item.name}
                                        </span>
                                        {index === 0 && (
                                            <span className={`text-[10px] uppercase tracking-wider font-bold ${isPremium ? 'text-yellow-400' : 'text-slate-500'}`}>
                                                {isPremium ? '★ Champion ★' : 'Winner'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-lg font-bold ${colorClass.replace('bg-', 'text-')}`}>{item.count}</span>
                                    <span className="text-xs text-slate-500 ml-1">เคส</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                            <div className="w-12 h-12 mb-2 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                                <Sparkles className="w-6 h-6 text-slate-600" />
                            </div>
                            <span className="text-sm">ไม่มีข้อมูลการจัดอันดับ</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const RankingView = ({ unitRankings }) => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [originRect, setOriginRect] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);

    if (!unitRankings) return null;
    const { overall, drugs, weapons, warrants } = unitRankings;

    const cards = [
        { id: 'overall', title: "ยอดเยี่ยมรวม", icon: Crown, data: overall, colorClass: "bg-yellow-500", isPremium: true },
        { id: 'drugs', title: "ปราบปรามยาเสพติด", icon: Pill, data: drugs, colorClass: "bg-red-500" },
        { id: 'weapons', title: "อาวุธปืน/วัตถุระเบิด", icon: Target, data: weapons, colorClass: "bg-orange-500" },
        { id: 'warrants', title: "ติดตามจับกุมหมายจับ", icon: FileText, data: warrants, colorClass: "bg-pink-500" }
    ];

    const selectedCard = cards.find(c => c.id === selectedCategory);

    const handleCardClick = (id, e) => {
        if (selectedCategory || isAnimating) return;

        // Get the wrapper (stable, non-transformed) position
        // This is where the card will RETURN to
        const wrapperEl = document.getElementById(`card-wrapper-${id}`);
        const wrapperRect = wrapperEl.getBoundingClientRect();

        setOriginRect({
            top: wrapperRect.top,
            left: wrapperRect.left,
            width: wrapperRect.width,
            height: wrapperRect.height
        });
        setSelectedCategory(id);

        // Trigger animation on next frame
        requestAnimationFrame(() => {
            setIsAnimating(true);
        });
    };

    const handleClose = () => {
        setIsAnimating(false);
        // Wait for return animation to complete (1s) before removing overlay
        setTimeout(() => {
            setSelectedCategory(null);
            setOriginRect(null);
        }, 1000);
    };

    return (
        <div className="relative min-h-screen -m-4 sm:-m-6 p-4 sm:p-6 overflow-hidden flex flex-col">
            {/* --- Ambient Background Effects --- */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-blue-900/20 blur-[120px] rounded-full mix-blend-screen"></div>
                <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[40%] h-[40%] bg-yellow-600/10 blur-[100px] rounded-full mix-blend-screen animate-pulse-slow"></div>
                <div className="absolute top-20 left-[20%] w-2 h-2 bg-yellow-400/40 rounded-full blur-[1px] animate-float"></div>
                <div className="absolute top-40 right-[25%] w-3 h-3 bg-blue-400/40 rounded-full blur-[2px] animate-float-delayed"></div>
                <div className="absolute bottom-40 left-[10%] w-2 h-2 bg-white/20 rounded-full blur-[1px] animate-pulse"></div>
            </div>

            <div className="relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 flex-1 flex flex-col">

                {/* --- Header Section --- */}
                <div className={`text-center space-y-2 py-4 transition-all duration-500 ${selectedCategory ? 'blur-sm opacity-50' : ''}`}>
                    <div className="inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-t from-yellow-500/20 to-transparent border border-yellow-500/30 mb-2 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                        <Trophy className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-100 to-yellow-500 drop-shadow-sm tracking-tight uppercase">
                        HWPD Hall of Fame
                    </h2>
                    <p className="text-slate-400 text-sm font-medium tracking-wide">
                        ทำเนียบเกียรติยศหน่วยงานปฏิบัติการยอดเยี่ยมแห่งปี
                    </p>
                </div>

                {/* --- Grid View --- */}
                <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto w-full transition-all duration-500 ${isAnimating ? 'blur-md opacity-40' : ''} ${selectedCategory ? 'pointer-events-none' : ''}`}>
                    {cards.map(card => (
                        <div
                            key={card.id}
                            id={`card-wrapper-${card.id}`}
                            // Only hide during expansion animation, not during return
                            className={selectedCategory === card.id && isAnimating ? 'opacity-0' : ''}
                        >
                            <RankingCard
                                {...card}
                                onClick={(e) => handleCardClick(card.id, e)}
                            />
                        </div>
                    ))}
                </div>

                {/* --- Animated Overlay Card --- */}
                {selectedCategory && selectedCard && originRect && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                        {/* Backdrop */}
                        <div
                            className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-1000 pointer-events-auto ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
                            onClick={handleClose}
                        ></div>

                        {/* Flying Card */}
                        <div
                            className={`absolute shadow-2xl transition-all duration-1000 ease-in-out pointer-events-auto ${!isAnimating ? 'opacity-0' : ''}`}
                            style={{
                                top: isAnimating ? '50%' : originRect.top,
                                left: isAnimating ? '50%' : originRect.left,
                                width: isAnimating ? '400px' : originRect.width,
                                height: isAnimating ? 'auto' : originRect.height,
                                transform: isAnimating
                                    ? 'translate(-50%, -50%) rotateY(720deg) scale(1.4)'
                                    : 'translate(0, 0) rotateY(0deg) scale(1)',
                                maxWidth: '90vw'
                            }}
                        >
                            <RankingCard
                                {...selectedCard}
                                isSelected={true}
                                disableHover={true}
                                onClose={handleClose}
                                onClick={() => { }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RankingView;
