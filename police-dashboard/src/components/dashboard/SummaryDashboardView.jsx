import React, { useRef, useState } from 'react';
import { ClipboardCopy, Image as ImageIcon, FileText, Siren, Truck, Scale, ShieldAlert, Award, Activity, AlertTriangle, Eye, FileSearch, Copy, Sparkles, Zap, Fingerprint, Pill, Crosshair, User, LayoutTemplate, Monitor, Square } from 'lucide-react';
import { toPng } from 'html-to-image';

const SummaryDashboardView = ({ filteredData, filters }) => {
  const printRef = useRef(null);
  const [template, setTemplate] = useState('default'); // 'default' | 'infographic' | 'square'
  const [scale, setScale] = useState(1);
  const [wrapperSize, setWrapperSize] = useState({ width: '100%', height: 'auto' });

  // --- Scale & Resize Logic ---
  React.useEffect(() => {
    const calculateSize = () => {
      if (template === 'default') {
        setScale(1);
        setWrapperSize({ width: '100%', height: 'auto' });
        return;
      }

      const width = window.innerWidth;
      const padding = 80; // Larger padding to accommodate big shadows + ease breathing room
      const targetWidth = template === 'square' ? 1080 : 800; // Base widths

      // 1. Calculate Scale
      let newScale = 1;
      // Use more aggressive padding for safety on small mobile screens
      if (width < targetWidth + padding) {
        newScale = (width - padding) / targetWidth;
      }
      setScale(newScale);

      // 2. Calculate Wrapper Height Only (width handled by flex)
      if (printRef.current) {
        // We use scrollHeight/Width to get the full unscaled size of the content
        const contentHeight = printRef.current.offsetHeight; // Using offsetHeight is usually safer for "visual" height excluding some overflows
        // Just reserve vertical space. Width will be centered by flex.

        setWrapperSize({
          width: '100%',
          height: `${contentHeight * newScale}px`
        });
      }
    };

    // Run initially and on resize
    // Add small delay to allow DOM to render new template before measuring
    const timer = setTimeout(calculateSize, 0);
    window.addEventListener('resize', calculateSize);

    return () => {
      window.removeEventListener('resize', calculateSize);
      clearTimeout(timer);
    };
  }, [template, filteredData]); // Recalc if data changes (height might change)

  if (!filteredData) {
    return <div className="p-10 text-white text-center animate-pulse">Loading Data...</div>;
  }

  // --- Calculate Stats ---
  const counts = {
    trafficAct: 0, carAct: 0, transportAct: 0, highwayAct: 0, weight: 0,
    checkWeight: 0, checkSticker: 0,
    warrantGeneral: 0, warrantBigData: 0, forgery: 0, drugs: 0, guns: 0, immigration: 0, others: 0,
    accidents: 0, deaths: 0, injuries: 0, damages: 0
  };

  filteredData.forEach(item => {
    const topic = item.topic;
    const textSearch = ((item.charge || "") + " " + (item.original_topic || "")).toLowerCase();

    if (topic === 'รถบรรทุก/น้ำหนัก') counts.weight++;
    else if (topic === 'บุคคลตามหมายจับ') {
      const source = (item.warrant_source || "").toLowerCase().replace(/\s/g, '');
      if (source.includes('bigdata') || source.includes('big')) counts.warrantBigData++;
      else counts.warrantGeneral++;
    }
    else if (topic === 'ยาเสพติด') counts.drugs++;
    else if (topic === 'อาวุธปืน/วัตถุระเบิด') counts.guns++;
    else if (topic === 'ต่างด้าว/ตม.') counts.immigration++;
    else if (textSearch.includes('ปลอม')) counts.forgery++;
    else if (topic === 'จราจร/ขนส่ง' || topic === 'เมาแล้วขับ') {
      if (textSearch.includes('รถยนต์') || textSearch.includes('ทะเบียน')) counts.carAct++;
      else if (textSearch.includes('ขนส่ง')) counts.transportAct++;
      else if (textSearch.includes('ทางหลวง')) counts.highwayAct++;
      else counts.trafficAct++;
    } else if (textSearch.includes('ทางหลวง')) counts.highwayAct++;
    else {
      if (textSearch.includes('ตรวจสอบน้ำหนัก')) counts.checkWeight++;
      else if (textSearch.includes('สติกเกอร์') || textSearch.includes('สัญลักษณ์')) counts.checkSticker++;
      else counts.others++;
    }
  });

  const totalWarrant = counts.warrantGeneral + counts.warrantBigData;
  const totalTraffic = counts.trafficAct + counts.carAct + counts.transportAct + counts.highwayAct + counts.weight;
  const totalCriminal = totalWarrant + counts.forgery + counts.drugs + counts.guns + counts.immigration + counts.others;
  const grandTotal = totalCriminal + totalTraffic;

  // --- Date Helper ---
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const formatThDate = (date) => (!date ? '-' : `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`);

  let headerDateText = "";
  if (filters.period === 'today') headerDateText = `ประจำวันที่ ${formatThDate(new Date())}`;
  else if (filters.period === 'yesterday') {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    headerDateText = `(เมื่อวาน) ประจำวันที่ ${formatThDate(yest)}`;
  } else if (filters.rangeStart && filters.rangeEnd) headerDateText = `ประจำห้วงวันที่ ${formatThDate(filters.rangeStart)} ถึง ${formatThDate(filters.rangeEnd)}`;
  else headerDateText = `ข้อมูลทั้งหมด`;

  const todayDate = `${new Date().getDate()} ${months[new Date().getMonth()]} ${new Date().getFullYear() + 543}`;

  // --- Actions ---
  const handleCopyReport = async () => {
    const fullReportText = `เรียน ผู้บังคับบัญชา
       วันที่ ${todayDate} ขออนุญาตส่งสรุปผลการปฏิบัติของ บก.ทล. ${headerDateText} ดังนี้
🔹 ภายใต้การบังคับบัญชาของ 
พล.ต.ต.พรศักดิ์ เลารุจิราลัย ผบก.ทล.



🔺 สถิติผลการจับกุมคดีจราจร (รวม ${totalTraffic} ราย)
- พ.ร.บ.จราจรฯ ${counts.trafficAct} ราย
- พ.ร.บ.รถยนต์ฯ ${counts.carAct} ราย
- พ.ร.บ.ขนส่งฯ ${counts.transportAct} ราย
- พ.ร.บ.ทางหลวง(ทั่วไป) ${counts.highwayAct} ราย
- จับกุมรถบรรทุกน้ำหนักเกินฯ ${counts.weight} ราย

🔺ตรวจสอบ
- ตรวจสอบน้ำหนักรถบรรทุก ${counts.checkWeight} ราย
- ตรวจสอบรถใช้สติกเกอร์/สัญลักษณ์ ${counts.checkSticker} ราย

🔺 สถิติจับกุมคดีอาญา (รวม ${totalCriminal} ราย)
▪️ความผิดตามประมาณกฎหมายอาญา
- หมายจับ ${totalWarrant} ราย (ทั่วไป ${counts.warrantGeneral}, Big Data ${counts.warrantBigData})
- ปลอมและใช้เอกสารราชการปลอม ${counts.forgery} ราย
▪️ความผิดตาม พ.ร.บ.ต่างๆ
- พ.ร.บ.ยาเสพติด ${counts.drugs} ราย
- พ.ร.บ.อาวุธปืน ${counts.guns} ราย
- พ.ร.บ.คนเข้าเมือง ${counts.immigration} ราย
- อื่นๆ ${counts.others} ราย

🔺 สถิติการเกิดอุบัติเหตุ
เกิดอุบัติเหตุ ${counts.accidents} ราย
เสียชีวิต ${counts.deaths} ราย
บาดเจ็บ ${counts.injuries} ราย
ทรัพย์สินเสียหาย ${counts.damages} ราย

       จึงเรียนมาเพื่อโปรดทราบ`;

    try {
      await navigator.clipboard.writeText(fullReportText);
      return true;
    } catch (err) {
      console.error("Failed to copy text: ", err);
      return false;
    }
  };

  const handleSaveImage = async (forceDownload = false) => {
    if (!printRef.current) return false;
    const container = printRef.current;

    // Force specific dimensions if needed, though class logic handles it
    container.classList.add('export-mode');
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const filter = (node) => {
        const exclusionClasses = ['exclude-from-export', 'animate-pulse'];
        return !(node.classList && exclusionClasses.some(cls => node.classList.contains(cls)));
      };

      const dataUrl = await toPng(printRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: '#020617',
        filter: filter,
        cacheBust: true,
        // Ensure dimensions are respected
        width: template === 'square' ? 1080 : template === 'infographic' ? 800 : undefined,
        height: template === 'square' ? 1350 : template === 'infographic' ? undefined : undefined // Classic is auto height
      });

      container.classList.remove('export-mode');
      const fileName = `summary-${template}-${Date.now()}.png`;

      const downloadFile = (url) => {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = url;
        link.click();
      };

      if (forceDownload) { downloadFile(dataUrl); return true; }

      try {
        const blob = await (await fetch(dataUrl)).blob();
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        return true;
      } catch (err) {
        downloadFile(dataUrl);
        return true;
      }

    } catch (error) {
      console.error("Error generating image:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
      container.classList.remove('export-mode');
      return false;
    }
  };

  const handleCopyAll = async () => {
    await handleCopyReport();
    alert("คัดลอกข้อวามรายงานเรียบร้อยแล้ว (กำลังบันทึกรูปภาพ...)");
    await handleSaveImage(true);
  };

  // Dynamic Container Class
  const getContainerClass = () => {
    const base = "transition-all duration-500 bg-gradient-to-br from-[#020617] via-[#0F172A] to-[#020617] rounded-3xl border-4 border-white shadow-2xl relative overflow-hidden text-slate-100 flex flex-col mx-auto";
    if (template === 'infographic') return `${base} w-[800px] min-h-[1400px] p-8`;
    if (template === 'square') return `${base} w-[1080px] h-[1350px] p-6`;
    return `${base} w-full max-w-full 2xl:max-w-[2600px] p-4 sm:p-8 lg:p-10`; // Default
  };

  return (
    <div className="h-full flex flex-col p-2 sm:p-4 md:p-6 overflow-hidden bg-slate-950 relative liquid-bg-anim">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="exclude-from-export absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] mix-blend-screen opacity-60 animate-pulse"></div>
        <div className="exclude-from-export absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-purple-600/30 rounded-full blur-[100px] mix-blend-screen opacity-60 animate-pulse delay-700"></div>
      </div>

      {/* Top Action Bar */}
      <div className="relative z-20 flex flex-wrap items-center justify-between mb-4 gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-400/30 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-white to-purple-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
              Summary Dashboard
            </span>
          </h1>
          <p className="text-slate-400 text-xs mt-1 ml-9">{headerDateText}</p>
        </div>

        <div className="grid grid-cols-3 bg-slate-900/50 p-1 rounded-xl border border-white/10 w-full sm:w-auto">
          <button
            onClick={() => setTemplate('default')}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${template === 'default' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Monitor className="w-4 h-4 hidden sm:block" /> Default
          </button>
          <button
            onClick={() => setTemplate('infographic')}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${template === 'infographic' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutTemplate className="w-4 h-4 hidden sm:block" /> <span className="sm:hidden">Info</span><span className="hidden sm:inline">Infographic</span>
          </button>
          <button
            onClick={() => setTemplate('square')}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${template === 'square' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Square className="w-4 h-4 hidden sm:block" /> <span className="sm:hidden">Square</span><span className="hidden sm:inline">Square (IG)</span>
          </button>
        </div>

        <div className="flex gap-2 text-xs sm:text-sm">
          <button onClick={handleCopyAll} className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 font-medium border border-blue-400/30">
            <Copy className="w-4 h-4" /> Copy All
          </button>
          <button onClick={() => handleSaveImage(true)} className="flex items-center gap-2 px-3 py-1.5 glass-card text-slate-300 rounded-lg hover:text-white">
            <ImageIcon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Image</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center p-2 sm:p-4 relative z-10 scrollbar-hide">
        {/* Container Wrapper with Scale */}
        <div
          style={{
            // Outer Frame: Flex centering. No overflow hidden to allow shadows.
            width: '100%',
            height: template !== 'default' ? wrapperSize.height : 'auto',
            display: 'flex',
            justifyContent: 'center',
            // overflowX: 'hidden' // Optional: prevent horizontal scroll if shadow really pushes it, but try without first
          }}
          className={template !== 'default' ? "transition-all duration-300 mx-auto" : "w-full flex justify-center"}
        >
          {/* Inner Scaler: Visual shrinking */}
          <div
            style={{
              transform: template !== 'default' ? `scale(${scale})` : 'none',
              transformOrigin: 'top center', // Scale from center
              width: template === 'square' ? '1080px' : template === 'infographic' ? '800px' : '100%',
              // Force flex shrink to 0 to prevent it from forcing parent width? 
              // No, transform takes it out of flow visually but layout size is fixed.
              // Just ensure it doesn't wrap or interact weirdly.
            }}
          >
            <div
              id="report-container"
              ref={printRef}
              className={getContainerClass()}
              style={template !== 'default' ? {
                // Ensure fixed dimensions are enforced strictly here if scaling
                // The class logic already does w-[1080px] etc.
              } : {}}
            >
              {/* Background Effects Common to All */}
              <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
              <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light pointer-events-none"></div>

              {/* Circuit Lines - Excluded in Square to save space or kept? Let's keep but maybe simple */}
              {template !== 'square' && (
                <div className="absolute top-0 left-0 right-0 h-[250px] overflow-hidden pointer-events-none exclude-in-export-mode z-0" style={{ maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)' }}>
                  <svg className="w-full h-full opacity-50" viewBox="0 0 1200 250" preserveAspectRatio="xMidYMid slice">
                    <defs>
                      <filter id="glow-trace">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <g stroke="#1e40af" strokeWidth="1" fill="none" opacity="0.3">
                      <path d="M50,40 L120,40 L150,70 L250,70 L280,40" />
                      <path d="M0,60 L80,60 L100,40 L300,40" />
                    </g>
                    <g fill="none" strokeWidth="2" strokeLinecap="round">
                      <path d="M0,60 L80,60 L100,40 L300,40" className="beam-path stroke-blue-400" />
                    </g>
                  </svg>
                </div>
              )}

              {/* Render Layout Based on Template */}
              {template === 'default' && (
                <DefaultLayout
                  counts={counts}
                  headerDateText={headerDateText}
                  grandTotal={grandTotal}
                  totalTraffic={totalTraffic}
                  totalCriminal={totalCriminal}
                  totalWarrant={totalWarrant}
                />
              )}

              {template === 'infographic' && (
                <InfographicLayout
                  counts={counts}
                  headerDateText={headerDateText}
                  grandTotal={grandTotal}
                  totalTraffic={totalTraffic}
                  totalCriminal={totalCriminal}
                  totalWarrant={totalWarrant}
                />
              )}

              {template === 'square' && (
                <SquareLayout
                  counts={counts}
                  headerDateText={headerDateText}
                  grandTotal={grandTotal}
                  totalTraffic={totalTraffic}
                  totalCriminal={totalCriminal}
                  totalWarrant={totalWarrant}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Layouts ---

const DefaultLayout = ({ counts, headerDateText, grandTotal, totalTraffic, totalCriminal, totalWarrant }) => {
  return (
    <>
      <div className="flex flex-col lg:flex-row items-center justify-between mb-8 sm:mb-10 pb-6 sm:pb-8 relative z-10 gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-center sm:text-left">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full group-hover:bg-blue-500/40 transition-all duration-500"></div>
            <img src="https://cib.go.th/backend/uploads/medium_logo_cib_4_2x_9f2da10e9f_a7828c9ca0.png" alt="CIB Logo" className="relative w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-2xl hover-rotate-y-360" />
          </div>

          <div>
            <div className="relative">
              <svg className="w-[900px] h-auto max-w-full overflow-visible" viewBox="0 0 1100 80" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="textGradientDt" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="50%" stopColor="#dbeafe" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                  </linearGradient>
                </defs>
                <text x="50%" y="40" textAnchor="middle" fontFamily="'IBM Plex Sans Thai', sans-serif" fontWeight="800" fontSize="84" fill="url(#textGradientDt)" className="drop-shadow-md">
                  สรุปผลการปฏิบัติงาน บก.ทล.
                </text>
                <text x="50%" y="40" textAnchor="middle" fontFamily="'IBM Plex Sans Thai', sans-serif" fontWeight="800" fontSize="84" fill="transparent" stroke="#3b82f6" className="text-stroke-neon pointer-events-none mix-blend-screen">
                  สรุปผลการปฏิบัติงาน บก.ทล.
                </text>
              </svg>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-1">
              <span className="px-6 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-300 text-xl font-medium backdrop-blur-sm shadow-[0_0_10px_rgba(59,130,246,0.2)] duration-1000">
                {headerDateText}
              </span>
              <span className="text-slate-500 text-sm flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                ข้อมูล ณ: {new Date().toLocaleTimeString('th-TH')}
              </span>
            </div>
          </div>
        </div>


      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 hightech-border bg-slate-900/40 rounded-2xl p-4 sm:p-6 lg:p-8 h-full flex flex-col backdrop-blur-[2px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold flex items-center gap-4 text-white">
              <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <Truck className="text-blue-400 w-8 h-8" />
              </div>
              ผลการจับกุมคดีจราจร
            </h3>
            <span className="text-5xl font-bold text-blue-100 bg-blue-600/20 border border-blue-500/30 px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.2)]">รวม {totalTraffic}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 flex-1">
            <StatCardModern label="พ.ร.บ.จราจรฯ" value={counts.trafficAct} />
            <StatCardModern label="พ.ร.บ.รถยนต์ฯ" value={counts.carAct} />
            <StatCardModern label="พ.ร.บ.ขนส่งฯ" value={counts.transportAct} />
            <StatCardModern label="พ.ร.บ.ทางหลวง" value={counts.highwayAct} />
            <StatCardModern label="น้ำหนักเกินฯ" value={counts.weight} />
          </div>
        </div>

        <div className="xl:col-span-1 hightech-border bg-slate-900/40 rounded-2xl p-4 sm:p-6 lg:p-8 backdrop-blur-[2px] flex flex-col justify-center">
          <h3 className="text-3xl font-bold mb-8 flex items-center gap-4 text-white">
            <div className="p-3 bg-teal-500/10 rounded-full border border-teal-500/20 shadow-[0_0_15px_rgba(45,212,191,0.3)]">
              <Eye className="text-teal-400 w-8 h-8" />
            </div>
            การตรวจสอบ
          </h3>
          <div className="flex flex-col gap-6">
            <InspectionBox label="ตรวจน้ำหนัก" value={counts.checkWeight} icon={<Scale />} />
            <InspectionBox label="ตรวจสติกเกอร์" value={counts.checkSticker} icon={<FileSearch />} />
          </div>
        </div>
      </div>

      <div className="mt-8 hightech-border bg-slate-900/40 rounded-2xl p-4 sm:p-6 lg:p-8 backdrop-blur-[2px]">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-bold flex items-center gap-4 text-white">
            <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse-slow">
              <Siren className="text-red-400 w-8 h-8" />
            </div>
            ผลการจับกุมคดีอาญา
          </h3>
          <span className="text-5xl font-bold text-red-100 bg-red-600/20 border border-red-500/30 px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.2)]">รวม {totalCriminal}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900/60 backdrop-blur-sm p-6 rounded-xl border border-orange-500/10 h-full flex flex-col relative overflow-hidden group hover:border-orange-500/30 transition-all">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-[50px] pointer-events-none group-hover:bg-orange-500/30 transition-colors opacity-60"></div>

            <h4 className="text-2xl text-orange-200 mb-6 font-semibold flex items-center gap-3 relative z-10"><Fingerprint className="w-6 h-6 text-orange-400" /> หมายจับ (รวม {totalWarrant})</h4>
            <div className="flex gap-6 flex-1 relative z-10">
              <div className="flex-1 bg-black/20 p-6 rounded-xl border border-white/5 text-center shadow-inner hover:bg-black/40 transition-colors">
                <div className="text-xl text-slate-400 mb-2">หมายจับทั่วไป</div>
                <div className="text-5xl font-black text-orange-400 drop-shadow-sm">{counts.warrantGeneral}</div>
              </div>
              <div className="flex-1 bg-gradient-to-br from-pink-500/10 to-transparent p-6 rounded-xl border border-pink-500/10 text-center shadow-inner relative overflow-hidden">
                <div className="text-xl text-slate-300 mb-2 relative z-10">Big Data</div>
                <div className="text-5xl font-black text-pink-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.3)] relative z-10">{counts.warrantBigData}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 h-full">
            <MiniStatBox label="ยาเสพติด" value={counts.drugs} color="text-red-400" borderColor="border-red-500/10" icon={<Pill />} />
            <MiniStatBox label="อาวุธปืน" value={counts.guns} color="text-orange-400" borderColor="border-orange-500/10" icon={<Crosshair />} />
            <MiniStatBox label="ต่างด้าว" value={counts.immigration} color="text-yellow-400" borderColor="border-yellow-500/10" icon={<User />} />
            <MiniStatBox label="อื่นๆ" value={counts.others} color="text-slate-300" borderColor="border-slate-500/10" icon={<FileText />} />
          </div>
        </div>
      </div>

      <div className="mt-8 hightech-border bg-slate-900/40 rounded-2xl p-4 sm:p-6 lg:p-8 backdrop-blur-[2px]">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-bold flex items-center gap-4 text-white">
            <div className="p-3 bg-yellow-500/10 rounded-full border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
              <AlertTriangle className="text-yellow-400 w-8 h-8" />
            </div>
            อุบัติเหตุ
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <AccidentCard label="เกิดเหตุ" value={counts.accidents} color="text-white" />
          <AccidentCard label="เสียชีวิต" value={counts.deaths} color="text-red-500" />
          <AccidentCard label="บาดเจ็บ" value={counts.injuries} color="text-orange-400" />
          <AccidentCard label="เสียหาย" value={counts.damages} color="text-slate-400" />
        </div>
      </div>
    </>
  );
};

// --- Infographic Vertical Layout ---
const InfographicLayout = ({ counts, headerDateText, grandTotal, totalTraffic, totalCriminal, totalWarrant }) => {
  return (
    <div className="flex flex-col h-full items-center text-center relative z-10">
      {/* Header / Brand */}
      <div className="mt-10 mb-8 flex flex-col items-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full"></div>
          <img src="https://cib.go.th/backend/uploads/medium_logo_cib_4_2x_9f2da10e9f_a7828c9ca0.png" alt="CIB Logo" className="relative w-40 h-40 object-contain drop-shadow-2xl" />
        </div>
        <h1 className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white via-blue-200 to-blue-500 drop-shadow-lg mb-4 leading-normal">
          สรุปผลการปฏิบัติ
        </h1>
        <h2 className="text-4xl font-bold text-blue-200 mb-8 tracking-wide">กองบังคับการตำรวจทางหลวง</h2>
        <span className="px-8 py-3 bg-white/5 border border-white/20 rounded-full text-white text-2xl backdrop-blur-md">
          {headerDateText}
        </span>
      </div>

      {/* Hero Stat: Total Arrests */}


      {/* Content Grid */}
      <div className="w-full flex-1 flex flex-col gap-8 px-4">

        {/* Traffic + Inspection Row */}
        <div className="bg-slate-900/50 rounded-3xl p-8 border border-blue-500/20">
          <div className="flex items-center justify-center gap-4 mb-8">
            <Truck className="w-12 h-12 text-blue-400" />
            <h3 className="text-5xl font-bold text-white">คดีจราจร</h3>
            <span className="ml-4 px-6 py-2 bg-blue-600 rounded-xl text-3xl font-bold">{totalTraffic}</span>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <StatCardModern label="จราจรฯ" value={counts.trafficAct} />
            <StatCardModern label="รถยนต์" value={counts.carAct} />
            <StatCardModern label="ขนส่งฯ" value={counts.transportAct} />
            <StatCardModern label="ทางหลวง" value={counts.highwayAct} />
            <StatCardModern label="น้ำหนัก" value={counts.weight} />
            <StatCardModern label="ตรวจสอบ" value={counts.checkWeight + counts.checkSticker} />
          </div>
        </div>

        {/* Criminal Row */}
        <div className="bg-slate-900/50 rounded-3xl p-8 border border-red-500/20">
          <div className="flex items-center justify-center gap-4 mb-8">
            <Siren className="w-12 h-12 text-red-400 animate-pulse" />
            <h3 className="text-5xl font-bold text-white">คดีอาญา</h3>
            <span className="ml-4 px-6 py-2 bg-red-600 rounded-xl text-3xl font-bold">{totalCriminal}</span>
          </div>
          <div className="flex flex-col gap-6">
            <div className="bg-slate-800/50 p-6 rounded-2xl flex justify-between items-center px-10">
              <div className="flex items-center gap-4 text-orange-300">
                <Fingerprint className="w-10 h-10" />
                <span className="text-3xl font-bold">หมายจับ</span>
              </div>
              <span className="text-6xl font-bold text-white">{totalWarrant}</span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <MiniStatBox label="ยาเสพติด" value={counts.drugs} color="text-red-400" borderColor="border-red-500/10" icon={<Pill />} />
              <MiniStatBox label="อาวุธปืน" value={counts.guns} color="text-orange-400" borderColor="border-orange-500/10" icon={<Crosshair />} />
              <MiniStatBox label="ต่างด้าว" value={counts.immigration} color="text-yellow-400" borderColor="border-yellow-500/10" icon={<User />} />
              <MiniStatBox label="อื่นๆ" value={counts.others} color="text-slate-300" borderColor="border-slate-500/10" icon={<FileText />} />
            </div>
          </div>
        </div>

        {/* Accidents Footer */}
        <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-3xl p-6 border border-yellow-500/10 mt-4">
          <div className="flex items-center justify-center gap-3 mb-6 opacity-80">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <span className="text-3xl font-bold text-yellow-100">สถิติอุบัติเหตุ</span>
          </div>
          <div className="flex justify-around items-end">
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">{counts.accidents}</div>
              <div className="text-xl text-slate-400">ครั้ง</div>
            </div>
            <div className="h-12 w-px bg-white/10"></div>
            <div className="text-center">
              <div className="text-5xl font-bold text-red-500 mb-2">{counts.deaths}</div>
              <div className="text-xl text-slate-400">เสียชีวิต</div>
            </div>
            <div className="h-12 w-px bg-white/10"></div>
            <div className="text-center">
              <div className="text-5xl font-bold text-orange-400 mb-2">{counts.injuries}</div>
              <div className="text-xl text-slate-400">บาดเจ็บ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Credit */}
      <div className="mt-10 mb-4 opacity-40 text-xl font-light tracking-widest">
        HIGHWAY POLICE DIVISION
      </div>
    </div>
  );
};

// --- Square (IG) Layout ---
const SquareLayout = ({ counts, headerDateText, grandTotal, totalTraffic, totalCriminal, totalWarrant }) => {
  return (
    <div className="flex flex-col h-full relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <img src="https://cib.go.th/backend/uploads/medium_logo_cib_4_2x_9f2da10e9f_a7828c9ca0.png" alt="CIB Logo" className="w-24 h-24 object-contain" />
          <div className="flex flex-col">
            <h1 className="text-5xl font-black text-white leading-tight">สรุปผลการปฏิบัติ</h1>
            <h2 className="text-3xl text-blue-300 font-bold">กองบังคับการตำรวจทางหลวง</h2>
            <span className="text-lg text-slate-400 mt-1 bg-white/5 px-3 py-0.5 rounded-full inline-block w-fit">{headerDateText}</span>
          </div>
        </div>
        {/* Grand Total Hero (Top Right) */}

      </div>

      {/* Content - 2 Columns */}
      <div className="grid grid-cols-2 gap-8 flex-1 mb-10">
        {/* Traffic Column */}
        <div className="flex flex-col h-full">
          <div className="bg-slate-900/50 rounded-3xl p-8 border border-blue-500/20 flex flex-col h-full relative overflow-visible mt-8">

            {/* Centered Nested Card for Total */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl border border-blue-500/40 rounded-3xl px-12 py-6 shadow-[0_8px_40px_rgba(0,0,0,0.6)] flex flex-col items-center z-20 min-w-[280px]">
              <div className="flex items-center gap-2 text-blue-300 text-base font-bold uppercase tracking-wider mb-1">
                <Truck className="w-5 h-5" /> คดีจราจร
              </div>
              <span className="text-8xl font-black text-white drop-shadow-2xl leading-none">{totalTraffic}</span>
            </div>

            <div className="mt-20 flex flex-col gap-6 pt-4 flex-1">
              {/* Main Acts Group */}
              <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 shadow-inner flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-4 pl-1">
                  <Truck className="w-8 h-8 text-blue-400" />
                  <span className="text-3xl text-blue-300 font-semibold">ข้อหาหลัก</span>
                </div>
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <StatCardCompact label="พ.ร.บ.จราจรฯ" value={counts.trafficAct} />
                  <StatCardCompact label="พ.ร.บ.รถยนต์ฯ" value={counts.carAct} />
                  <StatCardCompact label="พ.ร.บ.ขนส่งฯ" value={counts.transportAct} />
                  <StatCardCompact label="พ.ร.บ.ทางหลวง" value={counts.highwayAct} />
                </div>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-3 gap-3 h-[160px]">
                <StatCardCompact label="น้ำหนักเกิน" value={counts.weight} />
                <StatCardCompact label="ตรวจน้ำหนัก" value={counts.checkWeight} highlight={true} />
                <StatCardCompact label="ตรวจสติกเกอร์" value={counts.checkSticker} highlight={true} />
              </div>
            </div>
          </div>
        </div>

        {/* Criminal Column */}
        <div className="flex flex-col h-full">
          <div className="bg-slate-900/50 rounded-3xl p-8 border border-red-500/20 flex flex-col h-full relative overflow-visible mt-8">

            {/* Centered Nested Card for Total */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl border border-red-500/40 rounded-3xl px-12 py-6 shadow-[0_8px_40px_rgba(0,0,0,0.6)] flex flex-col items-center z-20 min-w-[280px]">
              <div className="flex items-center gap-2 text-red-300 text-base font-bold uppercase tracking-wider mb-1">
                <Siren className="w-5 h-5" /> คดีอาญา
              </div>
              <span className="text-8xl font-black text-white drop-shadow-2xl leading-none">{totalCriminal}</span>
            </div>

            <div className="mt-20 flex flex-col gap-6 pt-4 flex-1">
              {/* Warrant Compact Split */}
              <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 shadow-inner flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4 pl-1">
                  <Fingerprint className="w-8 h-8 text-orange-400" />
                  <span className="text-3xl text-orange-300 font-semibold">หมายจับ ({totalWarrant})</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5">
                    <div className="text-slate-400 text-lg mb-1">ทั่วไป</div>
                    <div className="text-4xl font-bold text-white">{counts.warrantGeneral}</div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-500/10 to-transparent rounded-xl p-3 text-center border border-pink-500/10">
                    <div className="text-pink-300 text-lg mb-1">Big Data</div>
                    <div className="text-4xl font-bold text-pink-400">{counts.warrantBigData}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 flex-1">
                <StatCardCompact label="ยาเสพติด" value={counts.drugs} color="text-red-400" />
                <StatCardCompact label="อาวุธปืน" value={counts.guns} color="text-orange-400" />
                <StatCardCompact label="ต่างด้าว" value={counts.immigration} color="text-yellow-400" />
                <StatCardCompact label="อื่นๆ" value={counts.others} color="text-slate-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accidents Footer Row */}
      <div className="h-[220px] bg-slate-900/50 rounded-3xl p-8 border border-yellow-500/20 flex items-center justify-between">
        <div className="flex items-center gap-4 pl-4 border-r border-white/10 pr-10">
          <div className="p-3 bg-yellow-500/20 rounded-xl"><AlertTriangle className="w-8 h-8 text-yellow-500" /></div>
          <div>
            <h3 className="text-4xl font-bold text-white mb-1">อุบัติเหตุ</h3>
            <div className="text-slate-400 text-xl">ภาพรวมการเกิดเหตุ</div>
          </div>
        </div>
        <div className="flex gap-8 flex-1 justify-around px-8">
          <AccidentCompact label="เกิดเหตุ" value={counts.accidents} />
          <AccidentCompact label="เสียชีวิต" value={counts.deaths} color="text-red-500" />
          <AccidentCompact label="บาดเจ็บ" value={counts.injuries} color="text-orange-400" />
        </div>
      </div>

      {/* Simple Footer */}
      <div className="mt-6 text-center text-slate-500 text-lg font-light tracking-widest opacity-60">
        HIGHWAY POLICE DIVISION • DATA CENTER
      </div>
    </div>
  );
};


// --- Compact Components for Square Layout ---
const StatCardCompact = ({ label, value, color, highlight }) => (
  <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center h-full min-h-[140px] ${highlight ? 'bg-blue-500/20 border-blue-500/40 shadow-lg shadow-blue-500/10' : 'bg-slate-800/40 border-white/5 hover:bg-slate-800/60 transition-colors'}`}>
    <span className="text-slate-400 text-xl mb-2 font-medium whitespace-nowrap text-center">{label}</span>
    <span className={`text-6xl font-bold ${color || 'text-white'} drop-shadow-sm`}>{value}</span>
  </div>
);

const AccidentCompact = ({ label, value, color }) => (
  <div className="text-center">
    <div className={`text-7xl font-black ${color || 'text-white'} mb-3 drop-shadow-md leading-none`}>{value}</div>
    <div className="text-slate-400 text-2xl uppercase tracking-wider font-semibold">{label}</div>
  </div>
);

// --- Modern Components (Existing) ---

const MiniStatBox = ({ label, value, color, borderColor, icon }) => (
  <div className={`bg-slate-900/60 backdrop-blur-sm border ${borderColor || 'border-white/5'} rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center h-full min-h-[120px] sm:min-h-[140px] duration-300 hover:bg-gradient-to-b hover:from-blue-900/40 hover:to-blue-950/40 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(30,58,138,0.2)] hover:-translate-y-1 cursor-default`}>
    <div className={`mb-2 sm:mb-3 ${color} opacity-80 scale-125 sm:scale-150`}>{icon}</div>
    <span className="text-lg sm:text-xl text-slate-400 font-medium mb-1 sm:mb-2 text-center">{label}</span>
    <span className={`text-4xl sm:text-5xl font-bold ${color} drop-shadow-sm`}>{value}</span>
  </div>
);

const StatCardModern = ({ label, value, sub }) => (
  <div className="p-4 sm:p-6 rounded-xl flex flex-col items-center justify-center border h-full transition-all duration-300 bg-slate-900/60 backdrop-blur-sm border-white/5 hover:bg-gradient-to-b hover:from-blue-900/40 hover:to-blue-950/40 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(30,58,138,0.2)] hover:-translate-y-1">
    <span className="text-slate-300 text-xl sm:text-2xl font-medium text-center">{label} {sub}</span>
    <span className="text-5xl sm:text-6xl font-bold text-white mt-3 sm:mt-4 drop-shadow-md">{value}</span>
  </div>
);

const InspectionBox = ({ label, value, icon }) => (
  <div className="flex justify-between items-center p-6 bg-slate-900/60 backdrop-blur-sm rounded-xl border border-teal-500/10 hover:border-teal-500/30 transition-all">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-teal-500/10 rounded-lg text-teal-400 scale-125">{icon}</div>
      <span className="text-teal-100 text-2xl font-medium opacity-90">{label}</span>
    </div>
    <span className="text-5xl font-bold text-teal-400 drop-shadow-[0_0_5px_rgba(45,212,191,0.3)]">{value}</span>
  </div>
);

const AccidentCard = ({ label, value, color }) => (
  <div className="bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-white/5 hover:border-white/20 hover:bg-slate-800/60 transition-all duration-300">
    <div className="text-lg sm:text-xl text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 font-semibold">{label}</div>
    <div className={`text-5xl sm:text-7xl font-black ${color} drop-shadow-md`}>{value}</div>
  </div>
);

export default SummaryDashboardView;