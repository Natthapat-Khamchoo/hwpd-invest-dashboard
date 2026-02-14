import React from 'react';

const PressReleaseTab = ({ qualityWork = [], media = [] }) => {
    const qualityWorkData = qualityWork.length > 0 ? qualityWork : Array(8).fill({ division: "กก.-", count: 0, details: [] });

    const mediaTableData = (media.length > 0 ? media : Array(6).fill({ label: "ส.ทล.-", values: Array(8).fill(0) })).slice(0, 6);

    // Calculate totals for table footer
    const totals = Array(8).fill(0);
    mediaTableData.forEach(row => {
        row.values.forEach((val, idx) => {
            if (val !== null) totals[idx] += (val || 0);
        });
    });

    return (
        <div className="p-4 flex flex-col xl:flex-row gap-8 min-h-[700px]">
            {/* Left Column: Quality Work */}
            <div className="w-full xl:w-2/5 flex flex-col">
                <div className="bg-[#fbbf24] text-[#1c2e4a] text-center font-bold text-2xl py-3 rounded-full mb-4 shadow-md mx-4 md:mx-8 relative z-10">
                    งานคุณภาพเชิงลึกระดับ กก.
                </div>
                <div className="bg-blue-100 rounded-2xl md:rounded-[3rem] p-4 pt-8 md:p-8 md:pt-12 -mt-8 flex-1 border border-blue-200 shadow-inner">
                    <div className="space-y-4 pl-4">
                        {qualityWorkData.map((item, idx) => (
                            <div key={idx} className="flex flex-col items-start text-[#1c2e4a]">
                                <div className="font-bold text-xl mb-1">
                                    <span className="underline decoration-2 underline-offset-4">{item.division}</span> : {item.count > 0 ? `${item.count} เรื่อง` : '- เรื่อง'}
                                </div>
                                {item.details.length > 0 && (
                                    <ul className="list-disc pl-8 space-y-0.5">
                                        {item.details.map((detail, dIdx) => (
                                            <li key={dIdx} className="text-lg font-medium">{detail}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Media Table */}
            <div className="w-full xl:w-3/5 flex flex-col">
                <div className="bg-[#fbbf24] text-[#1c2e4a] text-center font-bold text-2xl py-3 rounded-full mb-4 shadow-md mx-4 md:mx-24 relative z-10">
                    ระดับ ส.ทล. ออกสื่อประชาสัมพันธ์
                </div>
                <div className="overflow-x-auto rounded-xl border-2 border-slate-900 shadow-xl mt-4">
                    <table className="w-full border-collapse bg-white text-center">
                        <thead>
                            <tr className="bg-[#00004d] text-white h-14 text-lg">
                                <th className="border border-slate-400"></th>
                                {[...Array(8)].map((_, i) => (
                                    <th key={i} className="border border-slate-400 font-bold px-2">กก.{i + 1}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {mediaTableData.map((row, rIdx) => (
                                <tr key={rIdx} className="h-12 text-lg font-bold text-slate-800">
                                    <td className="bg-[#00004d] text-white border border-slate-400">{row.label}</td>
                                    {row.values.map((val, cIdx) => (
                                        <td key={cIdx} className={`border border-slate-400 ${val === null ? 'bg-black' : 'bg-white'}`}>
                                            {val !== null ? val : ''}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="h-14 font-bold text-xl bg-slate-200 text-slate-800">
                                <td className="border border-slate-400 bg-slate-300">รวม</td>
                                {totals.map((total, tIdx) => (
                                    <td key={tIdx} className="border border-slate-400">{total}</td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PressReleaseTab;
