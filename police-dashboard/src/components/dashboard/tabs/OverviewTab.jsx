import React, { useState } from 'react';
import { Zap, ShieldAlert, Truck, FileText } from 'lucide-react';
import { NodeCard, SubNodeHeader, ListItem, SimpleItem, SimpleItemCompact } from '../shared/StatCards';
import { SeizedItem, SeizedBox } from '../shared/SeizedItems';

const OverviewTab = ({ counts, isPrint = false, isLoading = false }) => {
    const [isTruckExpanded, setIsTruckExpanded] = useState(true);

    const defaultCounts = {
        criminalTotal: 0,
        warrantTotal: 0,
        warrantBodyworn: 0,
        warrantBigData: 0,
        warrantGeneral: 0,
        flagrantTotal: 0,
        flagrantAlien: 0,
        flagrantDrugs: 0,
        flagrantGuns: 0,
        flagrantTruck: 0,
        flagrantDocs: 0,
        flagrantOther: 0,
        trafficTotal: 0,
        trafficNotKeepLeft: 0,
        trafficNotCovered: 0,
        trafficModify: 0,
        trafficNoPart: 0,
        trafficSign: 0,
        trafficLight: 0,
        trafficSpeed: 0,
        trafficTax: 0,
        trafficNoPlate: 0,
        trafficGeneral: 0,
        truckTotal: 0,
        truckSelf: 0,
        truckJoint: 0,
        convoyTotal: 0,
        convoyRoyal: 0,
        convoyGeneral: 0,
        offenseDrugs: 0,
        offenseGuns: 0,
        offenseImmig: 0,
        offenseCustoms: 0,
        offenseDisease: 0,
        offenseTransport: 0,
        offenseDocs: 0,
        offenseProperty: 0,
        offenseSex: 0,
        offenseWeight: 0,
        offenseDrunk: 0,
        offenseLife: 0,
        offenseCom: 0,
        offenseOther: 0,
        seized: {
            drugs: { yaba: 0, ice: 0, ketamine: 0, other: 0 },
            guns: { registered: 0, unregistered: 0, bullets: 0, explosives: 0 },
            vehicles: { car: 0, bike: 0 },
            others: { money: 0, account: 0, phone: 0, items: 0 }
        }
    };

    const safeCounts = counts ? {
        ...defaultCounts,
        ...counts,
        seized: {
            drugs: { ...defaultCounts.seized.drugs, ...(counts.seized?.drugs || {}) },
            guns: { ...defaultCounts.seized.guns, ...(counts.seized?.guns || {}) },
            vehicles: { ...defaultCounts.seized.vehicles, ...(counts.seized?.vehicles || {}) },
            others: { ...defaultCounts.seized.others, ...(counts.seized?.others || {}) }
        }
    } : defaultCounts;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="text-slate-500 font-bold animate-pulse">กำลังดึงข้อมูลจากฐานข้อมูล...</span>
                </div>
            </div>
        );
    }

    // --- Print Components ---
    const PrintItem = ({ text, value }) => (
        <div className="grid grid-cols-2 items-center border-b border-dashed border-slate-300 py-2 last:border-0 gap-4">
            <span className="text-2xl text-slate-700 font-medium truncate">{text}</span>
            <span className="text-3xl font-bold text-slate-900 text-right">{value}</span>
        </div>
    );

    const PrintSeizedBox = ({ title, items }) => (
        <div className="bg-white rounded-lg p-3 border border-slate-300 shadow-sm">
            <div className="font-bold text-2xl text-slate-600 mb-3 border-b border-slate-200 pb-2">{title}</div>
            <div className="flex flex-col gap-2">
                {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1.2fr_0.8fr] items-center py-1">
                        <span className="text-xl text-slate-700 font-medium">{item.l}</span>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-slate-900">{item.v}</span>
                            {item.u && <span className="text-base text-slate-500 ml-1">{item.u}</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // ★★★ Print Layout Logic ★★★
    if (isPrint) {
        return (
            <div className="w-full text-base">
                <div className="grid grid-cols-3 gap-6 items-start">
                    {/* --- Column 1: Criminal --- */}
                    <div className="flex flex-col gap-4">
                        <div className="border border-slate-300 rounded-xl p-4 bg-white shadow-sm">
                            <div className="mb-4">
                                <NodeCard color="bg-[#fbbf24]" label="จับกุมทั้งหมด (คดี)" value={safeCounts.criminalTotal} valueColor="bg-[#dc2626]" textColor="text-[#1c2e4a]" scale="" />
                            </div>

                            <div className="space-y-4">
                                {/* Warrant */}
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                    <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-2">
                                        <span className="font-bold text-2xl text-slate-800">หมายจับ</span>
                                        <span className="bg-[#dc2626] text-white px-3 py-1 rounded-lg text-2xl font-bold">{safeCounts.warrantTotal}</span>
                                    </div>
                                    <PrintItem text="Bodyworn" value={safeCounts.warrantBodyworn} />
                                    <PrintItem text="Bigdata" value={safeCounts.warrantBigData} />
                                    <PrintItem text="ทั่วไป" value={safeCounts.warrantGeneral} />
                                </div>

                                {/* Flagrant */}
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                    <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-2">
                                        <span className="font-bold text-2xl text-slate-800">ซึ่งหน้า</span>
                                        <span className="bg-[#dc2626] text-white px-3 py-1 rounded-lg text-2xl font-bold">{safeCounts.flagrantTotal}</span>
                                    </div>
                                </div>

                                {/* Offense Types */}
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                    <div className="font-bold text-2xl text-slate-800 mb-2 border-b border-slate-200 pb-2">ฐานความผิด</div>
                                    <PrintItem text="ยาเสพติด" value={safeCounts.offenseDrugs} />
                                    <PrintItem text="อาวุธปืน" value={safeCounts.offenseGuns} />
                                    <PrintItem text="ตม." value={safeCounts.offenseImmig} />
                                    <PrintItem text="ศุลกากร" value={safeCounts.offenseCustoms} />
                                    <PrintItem text="ทรัพย์" value={safeCounts.offenseProperty} />
                                    <PrintItem text="อื่นๆ" value={safeCounts.offenseOther} />
                                    {/* Combine less critical items if needed, or list all if space permits */}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Column 2: Traffic --- */}
                    <div className="flex flex-col gap-4">
                        <div className="border border-slate-300 rounded-xl p-4 bg-white shadow-sm h-full">
                            <div className="mb-4">
                                <NodeCard color="bg-[#fbbf24]" label="จับกุมคดีจราจร" value={safeCounts.trafficTotal} valueColor="bg-[#dc2626]" textColor="text-[#1c2e4a]" scale="" />
                            </div>
                            <div className="grid grid-cols-1 gap-y-2">
                                <PrintItem text="ความเร็ว" value={safeCounts.trafficSpeed} />
                                <PrintItem text="ฝ่าฝืนป้าย" value={safeCounts.trafficSign} />
                                <PrintItem text="ฝ่าฝืนไฟ" value={safeCounts.trafficLight} />
                                <PrintItem text="ไม่ชิดซ้าย" value={safeCounts.trafficNotKeepLeft} />
                                <PrintItem text="ไม่ปกคลุม" value={safeCounts.trafficNotCovered} />
                                <PrintItem text="ดัดแปลงสภาพ" value={safeCounts.trafficModify} />
                                <PrintItem text="อุปกรณ์ไม่ครบ" value={safeCounts.trafficNoPart} />
                                <PrintItem text="ภาษี/พรบ." value={safeCounts.trafficTax} />
                                <PrintItem text="ไม่ติดป้าย" value={safeCounts.trafficNoPlate} />
                                <PrintItem text="อื่นๆ" value={safeCounts.trafficGeneral} />
                            </div>
                        </div>
                    </div>

                    {/* --- Column 3: Truck, Convoy, Seized --- */}
                    <div className="flex flex-col gap-4">
                        {/* Truck & Convoy */}
                        <div className="border border-slate-300 rounded-xl p-4 bg-white shadow-sm space-y-4">
                            <div>
                                <NodeCard color="bg-[#fbbf24]" label="รถหนัก" value={safeCounts.truckTotal} valueColor="bg-[#dc2626]" textColor="text-[#1c2e4a]" scale="" />
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="bg-slate-100 p-2 rounded border border-slate-200 text-center">
                                        <div className="text-xl text-slate-600">จับเอง</div>
                                        <div className="text-3xl font-bold text-red-600">{safeCounts.truckSelf}</div>
                                    </div>
                                    <div className="bg-slate-100 p-2 rounded border border-slate-200 text-center">
                                        <div className="text-xl text-slate-600">จับร่วม</div>
                                        <div className="text-3xl font-bold text-red-600">{safeCounts.truckJoint}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-slate-200">
                                <NodeCard color="bg-[#fbbf24]" label="ขบวน" value={safeCounts.convoyTotal} valueColor="bg-[#dc2626]" textColor="text-[#1c2e4a]" scale="" />
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="bg-slate-100 p-2 rounded border border-slate-200 text-center">
                                        <div className="text-xl text-slate-600">เสด็จ</div>
                                        <div className="text-3xl font-bold text-red-600">{safeCounts.convoyRoyal}</div>
                                    </div>
                                    <div className="bg-slate-100 p-2 rounded border border-slate-200 text-center">
                                        <div className="text-xl text-slate-600">ทั่วไป</div>
                                        <div className="text-3xl font-bold text-red-600">{safeCounts.convoyGeneral}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Seized Items */}
                        <div className="border border-blue-300 bg-blue-50/40 rounded-xl p-4">
                            <h3 className="text-2xl font-bold text-blue-800 mb-3 flex items-center gap-2">
                                <span className="w-2 h-6 bg-blue-600 rounded"></span> ของกลาง (Seized Items)
                            </h3>
                            <div className="flex flex-col gap-4">
                                <PrintSeizedBox title="ยาเสพติด" items={[
                                    { l: "ยาบ้า", v: safeCounts.seized.drugs.yaba.toLocaleString(), u: "เม็ด" },
                                    { l: "ไอซ์", v: safeCounts.seized.drugs.ice.toLocaleString(), u: "กรัม" }
                                ]} />
                                <PrintSeizedBox title="อาวุธปืน" items={[
                                    { l: "มีทะเบียน", v: safeCounts.seized.guns.registered.toLocaleString(), u: "กระบอก" },
                                    { l: "ไม่มีทะเบียน", v: safeCounts.seized.guns.unregistered.toLocaleString(), u: "กระบอก" }
                                ]} />
                                <PrintSeizedBox title="ยานพาหนะ" items={[
                                    { l: "รถยนต์", v: safeCounts.seized.vehicles.car.toLocaleString(), u: "คัน" },
                                    { l: "จยย.", v: safeCounts.seized.vehicles.bike.toLocaleString(), u: "คัน" }
                                ]} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Original Layout (For Screen) ---
    return (
        <div className="flex flex-col gap-10">
            {/* --- Main Grid Content --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 lg:gap-10 p-4 md:p-6 xl:p-10 items-start flex-1">
                {/* 1. Criminal */}
                <div className="flex flex-col items-center w-full">
                    <NodeCard color="bg-[#fbbf24]" label="จับกุมทั้งหมด (คดี)" value={safeCounts.criminalTotal} valueColor="bg-[#dc2626]" textColor="text-[#1c2e4a]" scale="hover:scale-105" />

                    <div className="w-full flex flex-col mt-0 gap-4 relative px-0">
                        {/* Top Row: Warrant & Flagrant */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
                            <div className="flex flex-col items-center w-full pt-8 relative">
                                {/* Connecting Line Top (Left) */}
                                <div className="absolute top-0 left-1/2 w-[calc(50%+1rem)] h-8 border-t-4 border-l-4 border-slate-300 rounded-tl-3xl hidden xl:block"></div>

                                <SubNodeHeader label="หมายจับ" value={safeCounts.warrantTotal} badgeColor="bg-[#dc2626]" />
                                <div className="flex flex-col gap-3 w-full mt-4 pl-2 md:pl-6 border-l-0 md:border-l-[3px] border-slate-200 ml-0 md:ml-8">
                                    <ListItem label="Bodyworn" value={safeCounts.warrantBodyworn || 0} highlight />
                                    <ListItem label="Bigdata" value={safeCounts.warrantBigData} highlight />
                                    <ListItem label="ทั่วไป" value={safeCounts.warrantGeneral} />
                                </div>
                            </div>
                            <div className="flex flex-col items-center w-full pt-8 relative">
                                {/* Connecting Line Top (Right) */}
                                <div className="absolute top-0 right-1/2 w-[calc(50%+1rem)] h-8 border-t-4 border-r-4 border-slate-300 rounded-tr-3xl hidden xl:block"></div>

                                <SubNodeHeader label="ความผิดซึ่งหน้า" value={safeCounts.flagrantTotal} badgeColor="bg-[#dc2626]" />
                                <div className="flex flex-col gap-3 w-full mt-4 pl-2 md:pl-6 border-l-0 md:border-l-[3px] border-slate-200 ml-0 md:ml-8">
                                    <span className="text-slate-400 text-sm italic">รวมสถิติการจับกุมซึ่งหน้าทั้งหมด</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row: Offense Base */}
                        <div className="flex flex-col items-center w-full mt-4 pt-4 border-t-2 border-dashed border-slate-100 relative">
                            <SubNodeHeader label="ฐานความผิด" value={null} badgeColor="bg-slate-500" />
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-3 w-full mt-4 pl-2 md:pl-6 border-l-0 md:border-l-[3px] border-slate-200 ml-0 md:ml-8">
                                <ListItem label="พ.ร.บ.ยาเสพติด" value={safeCounts.offenseDrugs} highlight />
                                <ListItem label="พ.ร.บ.อาวุธปืน" value={safeCounts.offenseGuns} highlight />
                                <ListItem label="พ.ร.บ.คนเข้าเมือง" value={safeCounts.offenseImmig} highlight />
                                <ListItem label="พ.ร.บ.ศุลกากร" value={safeCounts.offenseCustoms} highlight />
                                <ListItem label="พ.ร.บ.โรคติดต่อ" value={safeCounts.offenseDisease} highlight />
                                <ListItem label="พ.ร.บ.ขนส่ง" value={safeCounts.offenseTransport} highlight />
                                <ListItem label="ความผิดเกี่ยวกับเอกสาร" value={safeCounts.offenseDocs} highlight />
                                <ListItem label="ความผิดเกี่ยวกับทรัพย์" value={safeCounts.offenseProperty} highlight />
                                <ListItem label="ความผิดเกี่ยวกับเพศ" value={safeCounts.offenseSex} highlight />
                                <ListItem label="รถหนัก" value={safeCounts.offenseWeight} highlight />
                                <ListItem label="ขับรถขณะเมาสุรา" value={safeCounts.offenseDrunk} highlight />
                                <ListItem label="ความผิดเกี่ยวกับชีวิตและร่างกาย" value={safeCounts.offenseLife} highlight />
                                <ListItem label="ความผิดเกี่ยวกับคอมพิวเตอร์" value={safeCounts.offenseCom} highlight />
                                <ListItem label="อื่นๆ" value={safeCounts.offenseOther} highlight />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Traffic */}
                <div className="flex flex-col items-center w-full">
                    <NodeCard color="bg-[#fbbf24]" label="จับกุมคดีจราจร" value={safeCounts.trafficTotal} valueColor="bg-[#dc2626]" textColor="text-[#1c2e4a]" scale="hover:scale-105" />
                    <div className="hidden xl:flex flex-col items-center w-full relative">
                        <div className="h-8 w-1 bg-slate-300"></div>
                        <div className="absolute top-8 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-slate-300 -z-10"></div>
                    </div>
                    <div className="w-full flex flex-col items-center mt-0 px-0 relative z-10">
                        <div className="flex flex-col items-center flex-1 w-full pt-8">
                            <div className="flex flex-col gap-3 w-full pl-2 md:pl-6 border-l-0 md:border-l-[3px] border-slate-200 ml-0 md:ml-8">
                                <SimpleItem text="ไม่ชิดซ้าย" value={safeCounts.trafficNotKeepLeft} />
                                <SimpleItem text="ไม่ปกคลุม" value={safeCounts.trafficNotCovered} />
                                <SimpleItem text="ดัดแปลงสภาพรถ" value={safeCounts.trafficModify} />
                                <SimpleItem text="อุปกรณ์ส่วนควบไม่ครบ" value={safeCounts.trafficNoPart} />
                                <SimpleItem text="ฝ่าฝืนเครื่องหมายจราจร" value={safeCounts.trafficSign} />
                                <SimpleItem text="ฝ่าฝืนเครื่องสัญญาณไฟจราจร" value={safeCounts.trafficLight} />
                                <SimpleItem text="ขับรถเร็วเกินกำหนด" value={safeCounts.trafficSpeed} />
                                <SimpleItem text="ขาดต่อภาษี/พ.ร.บ.ฯ" value={safeCounts.trafficTax} />
                                <SimpleItem text="ไม่ติดแผ่นป้ายทะเบียน" value={safeCounts.trafficNoPlate} />
                                <SimpleItem text="อื่นๆ" value={safeCounts.trafficGeneral} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Convoy & Heavy Truck */}
                <div className="col-span-1 md:col-span-2 xl:col-span-2 bg-white/50 rounded-[2.5rem] border-2 border-slate-200 shadow-sm p-4 xl:p-8 flex flex-col xl:flex-row gap-8 xl:gap-16">
                    <div className="flex flex-col items-center flex-1 w-full">
                        <NodeCard color="bg-[#fbbf24]" label="ขบวน" value={safeCounts.convoyTotal} valueColor="bg-[#dc2626]" textColor="text-[#1c2e4a]" scale="hover:scale-105" />
                        <div className="hidden xl:flex flex-col items-center w-full">
                            <div className="h-6 w-1 bg-slate-300"></div>
                            <div className="w-[85%] h-1 bg-slate-300 relative">
                                <div className="absolute left-0 top-0 h-6 w-1 bg-slate-300"></div>
                                <div className="absolute right-0 top-0 h-6 w-1 bg-slate-300"></div>
                            </div>
                        </div>
                        <div className="w-full flex justify-between mt-0 gap-2 px-1 pt-6 text-center">
                            <div className="bg-slate-200 rounded-xl px-4 py-2 flex flex-col items-center flex-1 shadow-sm border border-white">
                                <span className="font-bold text-slate-700 text-lg xl:text-xl">ขบวนเสด็จ</span>
                                <span className="text-[#dc2626] font-bold text-xl xl:text-2xl">{safeCounts.convoyRoyal}</span>
                            </div>
                            <div className="bg-slate-200 rounded-xl px-4 py-2 flex flex-col items-center flex-1 shadow-sm border border-white">
                                <span className="font-bold text-slate-700 text-lg xl:text-xl">ขบวนทั่วไป</span>
                                <span className="text-[#dc2626] font-bold text-xl xl:text-2xl">{safeCounts.convoyGeneral}</span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden xl:block w-[2px] bg-slate-200 rounded-full h-auto"></div>
                    <div className="flex flex-col items-center flex-1 w-full transition-all duration-300">
                        <NodeCard color="bg-[#fbbf24]" label="รถหนัก" value={safeCounts.truckTotal} valueColor="bg-[#dc2626]" textColor="text-[#1c2e4a]" scale="hover:scale-105" isInteractive onClick={() => setIsTruckExpanded(!isTruckExpanded)} />
                        <div className={`w-full overflow-hidden transition-all duration-500 ease-in-out ${isTruckExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="hidden xl:flex flex-col items-center w-full">
                                <div className="h-6 w-1 bg-slate-300"></div>
                                <div className="w-[85%] h-1 bg-slate-300 relative">
                                    <div className="absolute left-0 top-0 h-6 w-1 bg-slate-300"></div>
                                    <div className="absolute right-0 top-0 h-6 w-1 bg-slate-300"></div>
                                </div>
                            </div>
                            <div className="w-full flex justify-between mt-0 gap-2 px-1 pt-6">
                                <div className="bg-slate-200 rounded-xl px-4 py-2 flex flex-col items-center flex-1 shadow-sm border border-white">
                                    <span className="font-bold text-slate-700 text-lg xl:text-xl">จับกุมเอง</span>
                                    <span className="text-[#dc2626] font-bold text-xl xl:text-2xl">{safeCounts.truckSelf}</span>
                                </div>
                                <div className="bg-slate-200 rounded-xl px-4 py-2 flex flex-col items-center flex-1 shadow-sm border border-white">
                                    <span className="font-bold text-slate-700 text-lg xl:text-xl">ร่วมจับกุม</span>
                                    <span className="text-[#dc2626] font-bold text-xl xl:text-2xl">{safeCounts.truckJoint}</span>
                                </div>
                            </div>
                        </div>
                        {!isTruckExpanded && <div className="mt-2 text-slate-400 text-sm xl:text-base animate-pulse">กดเพื่อดูรายละเอียด</div>}
                    </div>
                </div>
            </div>

            {/* --- Seized Items Section --- */}
            <div className="mx-4 md:mx-10 mb-6 md:mb-10 bg-blue-50/50 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 border border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-[80px] -z-10 opacity-60"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-100 rounded-full blur-[80px] -z-10 opacity-60"></div>
                <h3 className="text-3xl font-bold text-[#1c2e4a] mb-8 flex items-center gap-4">
                    <div className="w-2 h-10 bg-[#004aad] rounded-full"></div>
                    ของกลาง (Seized Items)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-blue-50/50 flex flex-col relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-[4rem] group-hover:scale-110 transition-transform"></div>
                        <h4 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2"><span className="bg-blue-100 p-2 rounded-xl text-blue-600"><Zap size={24} /></span>ยาเสพติด</h4>
                        <div className="space-y-4">
                            <SeizedItem label="ยาบ้า/ยาอี" value={safeCounts.seized.drugs.yaba.toLocaleString()} unit="เม็ด" />
                            <SeizedItem label="ยาไอซ์" value={safeCounts.seized.drugs.ice.toLocaleString()} unit="กรัม" />
                            <SeizedItem label="เคตามีน" value={safeCounts.seized.drugs.ketamine.toLocaleString()} unit="กรัม" />
                            <SeizedItem label="โคเคน" value={safeCounts.seized.drugs.other.toLocaleString()} unit="กรัม" />
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-blue-50/50 flex flex-col relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-100 to-transparent rounded-bl-[4rem] group-hover:scale-110 transition-transform"></div>
                        <h4 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2"><span className="bg-red-100 p-2 rounded-xl text-red-600"><ShieldAlert size={24} /></span>อาวุธปืน/เครื่องกระสุนปืน</h4>
                        <div className="space-y-4">
                            <SeizedItem label="อาวุธปืนมีทะเบียน" value={safeCounts.seized.guns.registered.toLocaleString()} unit="กระบอก" />
                            <SeizedItem label="อาวุธปืนไม่มีทะเบียน" value={safeCounts.seized.guns.unregistered.toLocaleString()} unit="กระบอก" />
                            <SeizedItem label="เครื่องกระสุนปืน" value={safeCounts.seized.guns.bullets.toLocaleString()} unit="นัด" />
                            <SeizedItem label="วัตถุระเบิด" value={safeCounts.seized.guns.explosives.toLocaleString()} unit="ลูก" />
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-blue-50/50 flex flex-col relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-yellow-100 to-transparent rounded-bl-[4rem] group-hover:scale-110 transition-transform"></div>
                        <h4 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2"><span className="bg-yellow-100 p-2 rounded-xl text-yellow-600"><Truck size={24} /></span>รถยนต์</h4>
                        <div className="space-y-4">
                            <SeizedItem label="รถยนต์" value={safeCounts.seized.vehicles.car.toLocaleString()} unit="คัน" />
                            <SeizedItem label="รถจักรยานยนต์" value={safeCounts.seized.vehicles.bike.toLocaleString()} unit="คัน" />
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-blue-50/50 flex flex-col relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-100 to-transparent rounded-bl-[4rem] group-hover:scale-110 transition-transform"></div>
                        <h4 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2"><span className="bg-gray-100 p-2 rounded-xl text-gray-600"><FileText size={24} /></span>ของกลางอื่นๆ</h4>
                        <div className="space-y-4">
                            <SeizedItem label="เงินสด" value={safeCounts.seized.others.money.toLocaleString()} unit="บาท" />
                            <SeizedItem label="บัญชีธนาคาร" value={safeCounts.seized.others.account.toLocaleString()} unit="บัญชี" />
                            <SeizedItem label="โทรศัพท์มือถือ" value={safeCounts.seized.others.phone.toLocaleString()} unit="เครื่อง" />
                            <SeizedItem label="รายการอื่นๆ" value={safeCounts.seized.others.items.toLocaleString()} unit="รายการ" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
