import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Truck, Siren, Award, FileText, Zap, ChevronDown, BarChart as ChartIcon, Calendar, FileDown, Loader2, Image as ImageIcon } from 'lucide-react';

import { fetchDashboardData, fetchStationInfo } from '../../services/GoogleSheetService';
import { UNIT_HIERARCHY } from '../../utils/helpers';

// Import Tab Components
import OverviewTab from './tabs/OverviewTab';
import ComparisonTab from './tabs/ComparisonTab';
import TrafficComparisonTab from './tabs/TrafficComparisonTab';
import TruckInspectionTab from './tabs/TruckInspectionTab';
import PressReleaseTab from './tabs/PressReleaseTab';

const ResultDashboardView = ({ filteredData, filters, setFilters, onStatsUpdate }) => {
    // --- State ---
    const [sheetCounts, setSheetCounts] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState('default'); // 'default' | 'print_all'
    let startD = new Date();
    if (filters && filters.dateRange && filters.dateRange.startDate) {
        startD = new Date(filters.dateRange.startDate);
    }
    const selectedYear = startD.getFullYear();
    const selectedMonth = startD.getMonth();

    // --- Thai month names (full) for header & export ---
    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const yearBE = Number(selectedYear) + 543;
    const exportMonthName = months[selectedMonth];

    // Get initial values from URL if present
    const getInitialParams = () => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        const kkParam = params.get('kk') || '';
        const stlParam = params.get('stl') || '';
        return {
            tab: (tabParam && tabParam !== 'result') ? tabParam : 'overview',
            kk: kkParam,
            stl: stlParam
        };
    };

    const initialParams = getInitialParams();
    const [activeTab, setActiveTab] = useState(initialParams.tab);

    const [isPrintRequested, setIsPrintRequested] = useState(false); // Flag for print request
    const [isPdfExporting, setIsPdfExporting] = useState(false);
    const [isJpgExporting, setIsJpgExporting] = useState(false);
    const [isExportAllJpg, setIsExportAllJpg] = useState(false);

    // --- Local Filter State (กก. / ส.ทล.) ---
    const [localUnitKK, setLocalUnitKK] = useState(initialParams.kk);
    const [localUnitSTL, setLocalUnitSTL] = useState(initialParams.stl);
    const maxStations = localUnitKK ? (UNIT_HIERARCHY[localUnitKK] || 6) : 0;

    // --- Station/Commander Data ---
    const [stationData, setStationData] = useState([]);

    useEffect(() => {
        fetchStationInfo().then(data => setStationData(data || [])).catch(err => console.error('Failed to fetch station info:', err));
    }, []);

    // Look up commander info based on selected kk/stl
    const getCommanderInfo = () => {
        if (!stationData.length) return null;
        if (localUnitSTL && localUnitKK) {
            // Find specific station: S{stl}_KK{kk}
            const unitId = `S${localUnitSTL}_KK${localUnitKK}`;
            return stationData.find(row => row.Unit_ID === unitId) || null;
        }
        if (localUnitKK) {
            // Find division: KK{kk}
            const unitId = `KK${localUnitKK}`;
            return stationData.find(row => row.Unit_ID === unitId) || null;
        }
        // Default HQ
        return stationData.find(row => row.Unit_ID === 'TOTAL_HQ') || null;
    };
    const commanderInfo = getCommanderInfo();

    // --- Effect: Sync State to URL ---
    const updateUrlParams = (tab, kk, stl) => {
        const params = new URLSearchParams(window.location.search);
        if (tab) params.set('tab', tab); else params.delete('tab');
        // Sync kk/stl from arguments or current state
        const kkVal = kk !== undefined ? kk : localUnitKK;
        const stlVal = stl !== undefined ? stl : localUnitSTL;
        if (kkVal) params.set('kk', kkVal); else params.delete('kk');
        if (stlVal) params.set('stl', stlVal); else params.delete('stl');

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setViewMode('default');
        updateUrlParams(tab);
    };

    // --- Effect: Handle Popstate (Browser Back/Forward) ---
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab') || 'overview';
            setActiveTab(tab);
            setLocalUnitKK(params.get('kk') || '');
            setLocalUnitSTL(params.get('stl') || '');
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // --- Effect: Propagate sheetCounts to parent for copy report ---
    useEffect(() => {
        if (onStatsUpdate && sheetCounts) {
            onStatsUpdate(sheetCounts);
        }
    }, [sheetCounts, onStatsUpdate]);

    // --- Effect: Fetch Google Sheet Data ---
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Merge global filters with local unit filters
                const queryFilters = { ...filters };
                if (localUnitKK) queryFilters.unit_kk = localUnitKK;
                if (localUnitSTL) queryFilters.unit_s_tl = localUnitSTL;
                const data = await fetchDashboardData(queryFilters);
                // Fix: GoogleSheetService now returns { counts, allCases }, but this view expects just counts
                if (data && data.counts) {
                    setSheetCounts(data.counts);
                } else {
                    setSheetCounts(data);
                }
            } catch (error) {
                console.error("Failed to fetch sheet data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce slightly to avoid rapid refetch
        const timer = setTimeout(() => {
            loadData();
        }, 300);

        return () => clearTimeout(timer);
    }, [filters, localUnitKK, localUnitSTL]);

    // --- Effect: Handle Export Request ---
    useEffect(() => {
        if (isPrintRequested && viewMode === 'print_all') {
            // Wait for render cycle to complete
            const performExport = async () => {
                // Short delay to ensure DOM is ready
                await new Promise(resolve => setTimeout(resolve, 1500));

                const sections = [
                    { id: 'print-overview', name: 'Overview' },
                    { id: 'print-comparison', name: 'Comparison_Stats' },
                    { id: 'print-traffic', name: 'Traffic_Stats' },
                    { id: 'print-truck', name: 'Truck_Stats' },
                    { id: 'print-press', name: 'Press_Release' }
                ];

                try {
                    for (const section of sections) {
                        const element = document.getElementById(section.id);
                        if (element) {
                            const canvas = await html2canvas(element, {
                                scale: 2, // High quality
                                useCORS: true,
                                backgroundColor: '#ffffff',
                                logging: false,
                                windowWidth: 1920 // Enforce desktop width
                            });

                            const link = document.createElement('a');
                            link.download = `ผลการปฏิบัติ บก.ทล. ประจำเดือน${exportMonthName} ${yearBE} - ${section.name}.png`;
                            link.href = canvas.toDataURL('image/png');
                            link.click();

                            // Add delay to prevent browser blocking multiple downloads
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }
                } catch (error) {
                    console.error("Export failed:", error);
                    alert("Export failed. See console for details.");
                } finally {
                    setIsPrintRequested(false);
                }
            };

            performExport();
        }
    }, [isPrintRequested, viewMode]);

    // --- Viewport Helpers to force Desktop layout on mobile during export ---
    const setDesktopViewport = () => {
        const viewport = document.querySelector("meta[name=viewport]");
        if (viewport) {
            if (!window.__originalViewport) window.__originalViewport = viewport.getAttribute("content");
            viewport.setAttribute("content", "width=1920, initial-scale=1.0");
        }
        document.body.style.minWidth = '1920px';
        document.documentElement.style.minWidth = '1920px';

        // FORCE container to 1920px in the REAL DOM
        const container = document.getElementById('dashboard-container');
        if (container) {
            container.style.setProperty('width', '1920px', 'important');
            container.style.setProperty('max-width', '1920px', 'important');
            container.style.setProperty('min-width', '1920px', 'important');
        }
    };

    const restoreViewport = () => {
        const viewport = document.querySelector("meta[name=viewport]");
        if (viewport && window.__originalViewport) {
            viewport.setAttribute("content", window.__originalViewport);
        }
        document.body.style.minWidth = '';
        document.documentElement.style.minWidth = '';

        const container = document.getElementById('dashboard-container');
        if (container) {
            container.style.removeProperty('width');
            container.style.removeProperty('max-width');
            container.style.removeProperty('min-width');
        }
    };

    // --- PDF Export Handler ---
    const handleExportPDF = async () => {
        if (isPdfExporting) return;
        setIsPdfExporting(true);

        // Save current state
        const prevViewMode = viewMode;
        const prevTab = activeTab;

        setDesktopViewport();

        try {
            // STEP 1: Capture the First Page (Overview) in Default Mode (Portrait)
            if (activeTab !== 'overview' || viewMode !== 'default') {
                setActiveTab('overview');
                setViewMode('default');
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            const headerEl = document.getElementById('print-header');
            const contentEl = document.getElementById('overview-content');
            const container = document.getElementById('dashboard-container');

            if (container) container.style.overflow = 'visible';

            const filter = (node) => {
                const exclusionClasses = ['exclude-from-export', 'animate-pulse'];
                return !(node.classList && exclusionClasses.some(cls => node.classList.contains(cls)));
            };

            const captureOptsOverview = {
                quality: 1.0,
                pixelRatio: 2, // Match JPG export quality
                backgroundColor: '#ffffff',
                filter: filter,
                cacheBust: true,
                width: 1920,
                windowWidth: 1920,
                style: { width: '1920px' }
            };

            let headerDataUrl = null;
            if (headerEl) {
                headerDataUrl = await toPng(headerEl, captureOptsOverview);
            }
            const overviewDataUrl = await toPng(contentEl, captureOptsOverview);

            if (container) container.style.overflow = '';

            const loadImg = (src) => new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });

            let headerImgObj = null;
            if (headerDataUrl) headerImgObj = await loadImg(headerDataUrl);
            const overviewImgObj = await loadImg(overviewDataUrl);

            const canvasWidth = Math.max(
                headerImgObj ? headerImgObj.naturalWidth : 0,
                overviewImgObj.naturalWidth
            );

            const headerH = (headerImgObj && headerImgObj.naturalWidth > 0) ? Math.round((headerImgObj.naturalHeight / headerImgObj.naturalWidth) * canvasWidth) : 0;
            const contentH = (overviewImgObj && overviewImgObj.naturalWidth > 0) ? Math.round((overviewImgObj.naturalHeight / overviewImgObj.naturalWidth) * canvasWidth) : 0;
            const footerH = 32;

            const canvas = document.createElement('canvas');
            canvas.width = canvasWidth;
            canvas.height = headerH + contentH + footerH;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            let y = 0;
            if (headerImgObj) {
                ctx.drawImage(headerImgObj, 0, y, canvasWidth, headerH);
                y += headerH;
            }

            ctx.drawImage(overviewImgObj, 0, y, canvasWidth, contentH);
            y += contentH;

            ctx.fillStyle = '#004aad';
            ctx.fillRect(0, y, canvasWidth, footerH);

            const page1DataUrl = canvas.toDataURL('image/jpeg', 0.92);

            // Scale the PDF first page to have a uniform width of 1920 units 
            // so it matches all subsequent landscape pages exactly.
            const pdfPageWidth = 1920;
            const pdfHeightRatio = pdfPageWidth / canvas.width;
            const pdfPageHeight = canvas.height * pdfHeightRatio;

            let pdf = new jsPDF({ 
                orientation: pdfPageWidth > pdfPageHeight ? 'landscape' : 'portrait', 
                unit: 'px', 
                format: [pdfPageWidth, pdfPageHeight] 
            });

            pdf.addImage(page1DataUrl, 'JPEG', 0, 0, pdfPageWidth, pdfPageHeight);

            // STEP 2: Render remaining sections in print_all mode
            setViewMode('print_all');
            await new Promise(resolve => setTimeout(resolve, 2500));

            const remainingSections = [
                { id: 'print-comparison' },
                { id: 'print-traffic' },
                { id: 'print-truck' },
                { id: 'print-press' }
            ];

            const pageWidth = 1920;
            const pageHeight = 1080;

            for (let i = 0; i < remainingSections.length; i++) {
                const section = remainingSections[i];
                const element = document.getElementById(section.id);
                if (!element) continue;

                const dataUrl = await toPng(element, {
                    quality: 1.0,
                    pixelRatio: 1.0,
                    backgroundColor: '#ffffff',
                    filter: filter,
                    cacheBust: true,
                    width: 1920,
                    windowWidth: 1920,
                    style: { width: '1920px' }
                });

                const contentImg = await loadImg(dataUrl);

                pdf.addPage([pageWidth, pageHeight], 'landscape');

                const imgWidth = contentImg.naturalWidth;
                const imgHeight = contentImg.naturalHeight;

                const headerH_Landscape = 130;
                const bottomMargin = 20;
                const sideMargin = 20;
                const contentW = pageWidth - (sideMargin * 2);
                const contentH_Landscape = pageHeight - headerH_Landscape - bottomMargin;

                const scaleX = contentW / imgWidth;
                const scaleY = contentH_Landscape / imgHeight;
                const scale = Math.min(scaleX, scaleY);

                const drawW = imgWidth * scale;
                const drawH = imgHeight * scale;

                const offsetX = sideMargin + (contentW - drawW) / 2;
                const offsetY = headerH_Landscape + (contentH_Landscape - drawH) / 2;

                pdf.addImage(dataUrl, 'PNG', offsetX, offsetY, drawW, drawH);

                if (headerDataUrl) {
                    try {
                        pdf.addImage(headerDataUrl, 'PNG', 0, 0, pageWidth, headerH_Landscape);
                    } catch (e) {
                        pdf.setFillColor(255, 255, 255);
                        pdf.rect(0, 0, pageWidth, headerH_Landscape, 'F');
                        pdf.setFontSize(24);
                        pdf.setTextColor(0, 0, 0);
                        pdf.text('Highway Police Bureau', 30, 48);
                    }
                } else {
                    pdf.setFillColor(255, 255, 255);
                    pdf.rect(0, 0, pageWidth, headerH_Landscape, 'F');
                }

                pdf.setDrawColor(0, 74, 173);
                pdf.setLineWidth(2);
                pdf.line(0, headerH_Landscape, pageWidth, headerH_Landscape);

                pdf.setFillColor(0, 74, 173);
                pdf.rect(0, pageHeight - 10, pageWidth, 10, 'F');
            }

            const fileName = `ผลการปฏิบัติ บก.ทล. ประจำเดือน${exportMonthName} ${yearBE}.pdf`;
            if (pdf) {
                pdf.save(fileName);
            }

        } catch (error) {
            console.error('PDF Export failed:', error);
            alert('Export PDF failed. See console for details.');
        } finally {
            restoreViewport();
            setViewMode(prevViewMode);
            setActiveTab(prevTab);
            setIsPdfExporting(false);
        }
    };

    // --- Portrait JPG Export Handler ---
    const handleExportOverviewJPG = async () => {
        if (isJpgExporting) return;
        setIsJpgExporting(true);

        // Ensure we're on overview tab
        const prevTab = activeTab;
        
        setDesktopViewport();

        if (activeTab !== 'overview') {
            setActiveTab('overview');
            setViewMode('default');
            await new Promise(resolve => setTimeout(resolve, 2500));
        } else {
            // Wait for viewport DOM render
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        try {
            const headerEl = document.getElementById('print-header');
            const contentEl = document.getElementById('overview-content');
            const container = document.getElementById('dashboard-container');

            if (!contentEl) throw new Error('Overview content not found in DOM');

            // Temporarily remove overflow-hidden to prevent clipping
            if (container) container.style.overflow = 'visible';

            const filter = (node) => {
                const exclusionClasses = ['exclude-from-export', 'animate-pulse'];
                return !(node.classList && exclusionClasses.some(cls => node.classList.contains(cls)));
            };

            const captureOpts = {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                filter: filter,
                cacheBust: true,
                width: 1920,
                windowWidth: 1920,
                style: { width: '1920px' }
            };

            // Capture header and content separately
            let headerDataUrl = null;
            if (headerEl) {
                headerDataUrl = await toPng(headerEl, captureOpts);
            }
            const contentDataUrl = await toPng(contentEl, captureOpts);

            // Restore overflow
            if (container) container.style.overflow = '';

            // Load images
            const loadImg = (src) => new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });

            let headerImg = null;
            if (headerDataUrl) headerImg = await loadImg(headerDataUrl);
            const contentImg = await loadImg(contentDataUrl);

            // Use the wider of header/content as the canvas width
            const canvasWidth = Math.max(
                headerImg ? headerImg.naturalWidth : 0,
                contentImg.naturalWidth
            );

            // Scale each image to fill canvasWidth while maintaining aspect ratio
            const headerH = headerImg ? Math.round((headerImg.naturalHeight / headerImg.naturalWidth) * canvasWidth) : 0;
            const contentH = Math.round((contentImg.naturalHeight / contentImg.naturalWidth) * canvasWidth);
            const footerH = 32; // footer bar

            const canvas = document.createElement('canvas');
            canvas.width = canvasWidth;
            canvas.height = headerH + contentH + footerH;
            const ctx = canvas.getContext('2d');

            // White background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw header
            let y = 0;
            if (headerImg) {
                ctx.drawImage(headerImg, 0, y, canvasWidth, headerH);
                y += headerH;
            }

            // Draw content
            ctx.drawImage(contentImg, 0, y, canvasWidth, contentH);
            y += contentH;

            // Draw footer bar
            ctx.fillStyle = '#004aad';
            ctx.fillRect(0, y, canvasWidth, footerH);

            // Export as JPEG
            const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);

            // Download
            const now = new Date();
            const fileName = `ผลการปฏิบัติ บก.ทล. ประจำเดือน${exportMonthName} ${yearBE}.jpg`;
            const link = document.createElement('a');
            link.download = fileName;
            link.href = jpegDataUrl;
            link.click();

        } catch (error) {
            console.error('Portrait JPG Export failed:', error);
            alert('Export JPG failed. See console for details.');
        } finally {
            restoreViewport();
            setActiveTab(prevTab);
            setIsJpgExporting(false);
        }
    };

    // --- Export All JPG (Long Strip) Handler ---
    const handleExportAllJPG = async () => {
        if (isExportAllJpg) return;
        setIsExportAllJpg(true);

        const prevViewMode = viewMode;
        const prevTab = activeTab;

        setDesktopViewport();

        try {
            // STEP 1: Capture the First Page (Overview) in Default Mode (Portrait)
            if (activeTab !== 'overview' || viewMode !== 'default') {
                setActiveTab('overview');
                setViewMode('default');
                await new Promise(resolve => setTimeout(resolve, 2500));
            } else {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            const headerEl = document.getElementById('print-header');
            const contentEl = document.getElementById('overview-content');
            const container = document.getElementById('dashboard-container');

            if (container) container.style.overflow = 'visible';

            const filter = (node) => {
                const exclusionClasses = ['exclude-from-export', 'animate-pulse'];
                return !(node.classList && exclusionClasses.some(cls => node.classList.contains(cls)));
            };

            const captureOptsOverview = {
                quality: 1.0,
                pixelRatio: 2, // High quality
                backgroundColor: '#ffffff',
                filter: filter,
                cacheBust: true,
                width: 1920,
                windowWidth: 1920,
                style: { width: '1920px' }
            };

            let headerDataUrl = null;
            if (headerEl) {
                headerDataUrl = await toPng(headerEl, captureOptsOverview);
            }
            const overviewDataUrl = await toPng(contentEl, captureOptsOverview);

            if (container) container.style.overflow = '';

            const loadImg = (src) => new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });

            let headerImgObj = null;
            if (headerDataUrl) headerImgObj = await loadImg(headerDataUrl);
            const overviewImgObj = await loadImg(overviewDataUrl);

            const canvasWidth = Math.max(
                headerImgObj ? headerImgObj.naturalWidth : 0,
                overviewImgObj.naturalWidth
            );

            const headerH = (headerImgObj && headerImgObj.naturalWidth > 0) ? Math.round((headerImgObj.naturalHeight / headerImgObj.naturalWidth) * canvasWidth) : 0;
            const contentH = Math.round((overviewImgObj.naturalHeight / overviewImgObj.naturalWidth) * canvasWidth);
            const footerH = 32;

            // Render first page onto temporary canvas to get scaled data
            const firstPageCanvas = document.createElement('canvas');
            firstPageCanvas.width = canvasWidth;
            firstPageCanvas.height = headerH + contentH + footerH;
            const fpCtx = firstPageCanvas.getContext('2d');
            
            fpCtx.fillStyle = '#ffffff';
            fpCtx.fillRect(0, 0, firstPageCanvas.width, firstPageCanvas.height);
            let fpY = 0;
            if (headerImgObj) {
                fpCtx.drawImage(headerImgObj, 0, fpY, canvasWidth, headerH);
                fpY += headerH;
            }
            fpCtx.drawImage(overviewImgObj, 0, fpY, canvasWidth, contentH);
            fpY += contentH;
            fpCtx.fillStyle = '#004aad';
            fpCtx.fillRect(0, fpY, canvasWidth, footerH);

            const page1DataUrl = firstPageCanvas.toDataURL('image/jpeg', 0.92);

            // Calculate Landscape target dimensions
            const targetWidthLandscape = 1920;
            const targetHeightLandscape = 1080;

            // Trigger Download for Page 1
            const link1 = document.createElement('a');
            link1.download = `1_ผลการปฏิบัติภาพรวม_${exportMonthName}_${yearBE}.jpg`;
            link1.href = page1DataUrl;
            link1.click();

            await new Promise(resolve => setTimeout(resolve, 800));

            // STEP 2: Render remaining sections in print_all mode
            setViewMode('print_all');
            await new Promise(resolve => setTimeout(resolve, 2500));

            const remainingSections = [
                { id: 'print-comparison', title: 'สถิติการจับกุมอาญา' },
                { id: 'print-traffic', title: 'สถิติจราจร' },
                { id: 'print-truck', title: 'สถิติรถบรรทุก' },
                { id: 'print-press', title: 'แถลงข่าวและประชาสัมพันธ์' }
            ];
            
            let landscapeHeaderImg = null;
            if (headerDataUrl) {
                landscapeHeaderImg = await loadImg(headerDataUrl);
            }

            // 2. Draw Remaining Sections
            for (let i = 0; i < remainingSections.length; i++) {
                const section = remainingSections[i];
                const element = document.getElementById(section.id);
                if (!element) continue;

                const dataUrl = await toPng(element, {
                    quality: 1.0,
                    pixelRatio: 1.0,
                    backgroundColor: '#ffffff',
                    filter: filter,
                    cacheBust: true,
                    width: 1920,
                    windowWidth: 1920,
                    style: { width: '1920px' }
                });

                const contentImg = await loadImg(dataUrl);

                const imgWidth = contentImg.naturalWidth;
                const imgHeight = contentImg.naturalHeight;

                const headerH_Landscape = 130;
                const bottomMargin = 20;
                const sideMargin = 20;
                const contentW = targetWidthLandscape - (sideMargin * 2);
                const contentH_Landscape = targetHeightLandscape - headerH_Landscape - bottomMargin;

                const scaleX = contentW / imgWidth;
                const scaleY = contentH_Landscape / imgHeight;
                const scale = Math.min(scaleX, scaleY);

                const drawW = imgWidth * scale;
                const drawH = imgHeight * scale;

                const offsetX = sideMargin + (contentW - drawW) / 2;
                const offsetY = headerH_Landscape + (contentH_Landscape - drawH) / 2;

                // Create Canvas for THIS section
                const sectionCanvas = document.createElement('canvas');
                sectionCanvas.width = targetWidthLandscape;
                sectionCanvas.height = targetHeightLandscape;
                const ctx = sectionCanvas.getContext('2d');

                // Section Background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, targetWidthLandscape, targetHeightLandscape);

                // Section Content
                ctx.drawImage(contentImg, offsetX, offsetY, drawW, drawH);

                // Section Header
                if (landscapeHeaderImg) {
                    try {
                        ctx.drawImage(landscapeHeaderImg, 0, 0, targetWidthLandscape, headerH_Landscape);
                    } catch (e) { }
                }

                // Header Separator Line
                ctx.strokeStyle = '#004aad';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, headerH_Landscape);
                ctx.lineTo(targetWidthLandscape, headerH_Landscape);
                ctx.stroke();

                // Section Footer
                ctx.fillStyle = '#004aad';
                ctx.fillRect(0, targetHeightLandscape - 10, targetWidthLandscape, 10);

                // Trigger Download for this section
                const sectionDataUrl = sectionCanvas.toDataURL('image/jpeg', 0.90);
                const fileName = `${i + 2}_${section.title}_${exportMonthName}_${yearBE}.jpg`;
                const link = document.createElement('a');
                link.download = fileName;
                link.href = sectionDataUrl;
                link.click();

                await new Promise(resolve => setTimeout(resolve, 800));
            }

        } catch (error) {
            console.error('Export All JPG failed:', error);
            alert('Export JPG failed. See console for details.');
        } finally {
            restoreViewport();
            setViewMode(prevViewMode);
            setActiveTab(prevTab);
            setIsExportAllJpg(false);
        }
    };

    // --- Tab Components ---
    const renderContent = () => {
        if (viewMode === 'print_all') {
            return (
                <div className="flex flex-col gap-10 pb-20 print:block print:gap-0 print:pb-0">
                    {/* --- CSS ปรับปรุงใหม่ (Fix Layout & Height) --- */}
                    <style>{`
                        @media print {
                            @page { 
                                margin: 0.5cm; 
                                size: A4 landscape; 
                            }
                            
                            /* 1. บังคับให้ Browser คิดว่าเป็นจอ Desktop เสมอ */
                            body { 
                                min-width: 1200px !important; 
                                -webkit-print-color-adjust: exact !important; 
                                print-color-adjust: exact !important;
                                /* Font Stability */
                                font-variant-numeric: tabular-nums;
                                letter-spacing: normal !important;
                                font-feature-settings: "kern" 0;
                                -webkit-font-smoothing: antialiased;
                            }

                            /* 2. จัดการ Page Break ให้แม่นยำ */
                            .print-section { 
                                page-break-after: always; 
                                break-inside: avoid; 
                                display: block;
                                width: 100%;
                                margin-bottom: 2rem; /* Added margin */
                                padding-top: 1rem; /* Added padding */
                            }

                            /* ซ่อน Scrollbar */
                            ::-webkit-scrollbar { display: none; }
                            button { display: none !important; }
                            
                            /* แก้ไข Grid ให้บังคับแสดงผลแนวนอน */
                            .print-grid-force {
                                display: grid !important;
                                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                                gap: 2rem !important;
                            }
                        }
                    `}</style>

                    {/* --- ส่วนที่ 1: Overview --- */}
                    <div className="print-section flex flex-col items-center justify-center w-full" id="print-overview">
                        <div className="bg-blue-100 p-2 rounded-xl mb-2 text-center font-bold text-xl text-blue-800 border border-blue-200 w-full">
                            ส่วนที่ 1: ภาพรวม (Overview)
                        </div>
                        <div className="w-full">
                            <OverviewTab counts={sheetCounts} isPrint={true} isLoading={isLoading} />
                        </div>
                    </div>

                    {/* --- ส่วนที่ 2: Comparison --- */}
                    <div className="print-section flex flex-col items-center justify-center w-full" id="print-comparison">
                        <div className="bg-blue-100 p-2 rounded-xl mb-2 text-center font-bold text-xl text-blue-800 border border-blue-200 w-full">
                            ส่วนที่ 2: เปรียบเทียบสถิติการจับกุม (2 เดือน)
                        </div>
                        <div className="w-full">
                            <ComparisonTab data={sheetCounts?.charts?.comparison} monthNames={sheetCounts?.charts?.monthNames} isPrint={true} />
                        </div>
                    </div>

                    {/* --- ส่วนที่ 3: Traffic --- */}
                    <div className="print-section flex flex-col items-center justify-center w-full" id="print-traffic">
                        <div className="bg-blue-100 p-2 rounded-xl mb-2 text-center font-bold text-xl text-blue-800 border border-blue-200 w-full">
                            ส่วนที่ 3: เปรียบเทียบสถิติจราจร (2 เดือน)
                        </div>
                        <div className="w-full">
                            <TrafficComparisonTab data={sheetCounts?.charts?.traffic} monthNames={sheetCounts?.charts?.monthNames} isPrint={true} />
                        </div>
                    </div>

                    {/* --- ส่วนที่ 4: Truck --- */}
                    <div className="print-section flex flex-col items-center justify-center w-full" id="print-truck">
                        <div className="bg-blue-100 p-2 rounded-xl mb-2 text-center font-bold text-xl text-blue-800 border border-blue-200 w-full">
                            ส่วนที่ 4: สถิติรถบรรทุก
                        </div>
                        <div className="w-full">
                            <TruckInspectionTab data={sheetCounts?.charts?.truck} monthNames={sheetCounts?.charts?.monthNames} isPrint={true} />
                        </div>
                    </div>

                    {/* --- ส่วนที่ 5: Press --- */}
                    <div className="print-section flex flex-col items-center justify-center w-full" id="print-press">
                        <div className="bg-blue-100 p-2 rounded-xl mb-2 text-center font-bold text-xl text-blue-800 border border-blue-200 w-full">
                            ส่วนที่ 5: แถลงข่าวและสื่อประชาสัมพันธ์
                        </div>
                        <div className="w-full">
                            <PressReleaseTab qualityWork={sheetCounts?.charts?.qualityWork} media={sheetCounts?.charts?.media} isPrint={true} />
                        </div>
                    </div>
                </div>
            );
        }

        switch (activeTab) {
            case 'overview': return <OverviewTab counts={sheetCounts} isLoading={isLoading} forceDesktop={isPdfExporting || isJpgExporting || isExportAllJpg} />;
            case 'comparison': return <ComparisonTab data={sheetCounts?.charts?.comparison} monthNames={sheetCounts?.charts?.monthNames} />;
            case 'traffic-comparison': return <TrafficComparisonTab data={sheetCounts?.charts?.traffic} monthNames={sheetCounts?.charts?.monthNames} />;
            case 'press': return <PressReleaseTab qualityWork={sheetCounts?.charts?.qualityWork} media={sheetCounts?.charts?.media} />;
            case 'truck': return <TruckInspectionTab data={sheetCounts?.charts?.truck} monthNames={sheetCounts?.charts?.monthNames} />;
            default: return <OverviewTab counts={sheetCounts} isLoading={isLoading} forceDesktop={isPdfExporting || isJpgExporting || isExportAllJpg} />;
        }
    };

    // --- Helper for Header Date ---
    let headerDate = "";
    headerDate = `${exportMonthName} ${yearBE} `;

    return (
        <div className="h-full w-full overflow-y-auto bg-slate-100 font-sans p-4 sm:p-6 lg:p-10 print:p-0 print:bg-white">
            <div id="dashboard-container" className={`mx-auto min-h-[85vh] flex flex-col gap-6 bg-white shadow-2xl rounded-2xl md:rounded-[3rem] border border-slate-200 ${viewMode === 'print_all' ? 'max-w-[1920px] print-mode overflow-visible' : 'max-w-[1800px] overflow-hidden'} print:max-w-none print:w-full print:min-h-0 print:overflow-visible`}>

                {/* --- Header Section --- */}
                <div id="print-header" className="flex flex-col md:flex-row h-auto md:h-32 shadow-md relative overflow-hidden bg-white z-20">
                    {/* Left: Gray Section */}
                    <div className="bg-[#5e666e] w-full md:w-[45%] lg:w-[42%] flex flex-col md:flex-row items-center justify-center md:justify-start px-4 md:px-6 lg:px-10 py-4 md:py-0 gap-3 md:gap-4 lg:gap-6 relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
                        <img
                            src="https://cib.go.th/backend/uploads/medium_logo_cib_4_2x_9f2da10e9f_a7828c9ca0.png"
                            alt="Logo"
                            className="w-16 h-16 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 object-contain drop-shadow-md shrink-0"
                        />
                        <h2 className="text-xl md:text-xl lg:text-2xl xl:text-4xl font-normal text-white tracking-wide whitespace-nowrap leading-tight text-center md:text-left">
                            กองบังคับการตำรวจทางหลวง
                        </h2>
                        <div className="absolute top-0 right-[-40px] w-40 h-full bg-[#5e666e] transform skew-x-[-20deg] z-[-1] hidden md:block"></div>
                    </div>

                    {/* Right: Blue Section */}
                    <div className="bg-[#0047ba] flex-1 flex flex-col md:flex-row items-center justify-center md:justify-end md:pr-8 lg:pr-16 py-4 md:py-6 px-4 md:pl-16 relative z-10 text-center md:text-right border-t md:border-t-0 border-white/10">
                        <div className="flex flex-col items-center md:items-end w-full">
                            <h1 className="text-xl md:text-xl lg:text-2xl xl:text-4xl font-bold text-white flex flex-col md:flex-row items-center md:justify-end gap-2">
                                <span>ผลการปฏิบัติประจำเดือน</span>
                                <span className="text-[#fbbf24] font-extrabold bg-transparent text-xl md:text-xl lg:text-2xl xl:text-4xl shadow-none p-0 inline-block">{headerDate}</span>
                            </h1>
                            {commanderInfo && (
                                <p className="text-white/80 text-sm md:text-base lg:text-lg mt-1">
                                    {commanderInfo.Rank}{commanderInfo.Full_Name} {commanderInfo.Position}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- Navigation Filters --- */}
                <div className="px-4 md:px-10 py-4 flex flex-col xl:flex-row items-center justify-between gap-4 md:gap-6 border-b border-slate-100 print:hidden">
                    {/* Tabs - Mobile Dropdown + Export Icons */}
                    <div className="flex xl:hidden w-full gap-2 items-center">
                        <div className="relative flex-1">
                            <select
                                value={activeTab}
                                onChange={(e) => handleTabChange(e.target.value)}
                                className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-3 px-4 pr-8 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold"
                            >
                                <option value="overview">ภาพรวม</option>
                                <option value="comparison">เปรียบเทียบอาญา</option>
                                <option value="traffic-comparison">เปรียบเทียบจราจร</option>
                                <option value="truck">สถิติรถบรรทุก</option>
                                <option value="press">ประชาสัมพันธ์</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                                <ChevronDown size={20} />
                            </div>
                        </div>
                        {/* Mobile Export JPG Icon */}
                        <button
                            onClick={handleExportOverviewJPG}
                            disabled={isJpgExporting}
                            title="Export ภาพรวม"
                            className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 shadow-sm ${isJpgExporting
                                ? 'bg-gray-300 text-gray-500 cursor-wait'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/30'
                                }`}
                        >
                            {isJpgExporting ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                        </button>
                        {/* Mobile Export All JPG Icon */}
                        <button
                            onClick={handleExportAllJPG}
                            disabled={isExportAllJpg}
                            title="Export ทั้งหมด 5 ภาพ"
                            className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 shadow-sm ${isExportAllJpg
                                ? 'bg-gray-300 text-gray-500 cursor-wait'
                                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-500/30'
                                }`}
                        >
                            {isExportAllJpg ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                        </button>
                        {/* Mobile Export PDF Icon */}
                        <button
                            onClick={handleExportPDF}
                            disabled={isPdfExporting}
                            title="Export PDF"
                            className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 shadow-sm ${isPdfExporting
                                ? 'bg-gray-300 text-gray-500 cursor-wait'
                                : 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/30'
                                }`}
                        >
                            {isPdfExporting ? <Loader2 size={20} className="animate-spin" /> : <FileDown size={20} />}
                        </button>
                    </div>

                    {/* Tabs - Desktop Buttons */}
                    <div className="hidden xl:flex bg-slate-100 p-1.5 rounded-2xl shadow-inner gap-2 overflow-x-auto w-full xl:w-auto no-scrollbar">
                        <TabButton
                            active={activeTab === 'overview' && viewMode !== 'print_all'}
                            onClick={() => handleTabChange('overview')}
                            label="ภาพรวม"
                            icon={<Award size={18} />}
                        />
                        <TabButton
                            active={activeTab === 'comparison' && viewMode !== 'print_all'}
                            onClick={() => handleTabChange('comparison')}
                            label="เปรียบเทียบอาญา"
                            icon={<ChartIcon size={18} />}
                        />
                        <TabButton
                            active={activeTab === 'traffic-comparison' && viewMode !== 'print_all'}
                            onClick={() => handleTabChange('traffic-comparison')}
                            label="เปรียบเทียบจราจร"
                            icon={<Siren size={18} />}
                        />
                        <TabButton
                            active={activeTab === 'truck' && viewMode !== 'print_all'}
                            onClick={() => handleTabChange('truck')}
                            label="สถิติรถบรรทุก"
                            icon={<Truck size={18} />}
                        />
                        <TabButton
                            active={activeTab === 'press' && viewMode !== 'print_all'}
                            onClick={() => handleTabChange('press')}
                            label="ประชาสัมพันธ์"
                            icon={<Zap size={18} />}
                        />

                        {/* Export Portrait JPG Button */}
                        <button
                            onClick={handleExportOverviewJPG}
                            disabled={isJpgExporting}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm whitespace-nowrap ${isJpgExporting
                                ? 'bg-gray-300 text-gray-500 cursor-wait'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/30'
                                }`}
                        >
                            {isJpgExporting ? (
                                <><Loader2 size={18} className="animate-spin" /> กำลัง Export...</>
                            ) : (
                                <><ImageIcon size={18} /> Export ภาพรวม</>
                            )}
                        </button>

                        {/* Export Long Strip JPG Button */}
                        <button
                            onClick={handleExportAllJPG}
                            disabled={isExportAllJpg}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm whitespace-nowrap ${isExportAllJpg
                                ? 'bg-gray-300 text-gray-500 cursor-wait'
                                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-500/30'
                                }`}
                        >
                            {isExportAllJpg ? (
                                <><Loader2 size={18} className="animate-spin" /> กำลัง Export...</>
                            ) : (
                                <><ImageIcon size={18} /> Export 5 ภาพ</>
                            )}
                        </button>

                        {/* Export PDF Button */}
                        <button
                            onClick={handleExportPDF}
                            disabled={isPdfExporting}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm whitespace-nowrap ${isPdfExporting
                                ? 'bg-gray-300 text-gray-500 cursor-wait'
                                : 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/30'
                                }`}
                        >
                            {isPdfExporting ? (
                                <><Loader2 size={18} className="animate-spin" /> กำลัง Export...</>
                            ) : (
                                <><FileDown size={18} /> Export PDF</>
                            )}
                        </button>
                    </div>


                </div>

                {/* --- Local Unit Filters (กก. / ส.ทล.) --- */}
                <div className="px-4 md:px-10 py-3 flex flex-wrap items-center gap-3 border-b border-slate-100 print:hidden bg-slate-50/50">
                    <span className="text-sm font-semibold text-slate-500">กรองหน่วย:</span>
                    <select
                        value={localUnitKK}
                        onChange={(e) => { const kk = e.target.value; setLocalUnitKK(kk); setLocalUnitSTL(''); updateUrlParams(activeTab, kk, ''); }}
                        className="pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer min-w-[140px]"
                    >
                        <option value="">🏢 ทุก กก.</option>
                        {Object.keys(UNIT_HIERARCHY).map(kk => <option key={kk} value={kk}>กก.{kk}</option>)}
                    </select>
                    <select
                        value={localUnitSTL}
                        onChange={(e) => { const stl = e.target.value; setLocalUnitSTL(stl); updateUrlParams(activeTab, localUnitKK, stl); }}
                        disabled={!localUnitKK}
                        className={`pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer min-w-[160px] ${!localUnitKK ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <option value="">🏛️ ทุก ส.ทล.</option>
                        {localUnitKK && Array.from({ length: maxStations }, (_, i) => i + 1).map(s => (
                            <option key={s} value={s}>ส.ทล.{s}</option>
                        ))}
                    </select>
                </div>

                {/* --- Content Area --- */}
                <div id="overview-content" className={`${isPdfExporting || isJpgExporting || isExportAllJpg ? '' : 'flex-1'} w-full bg-white min-h-[600px]`}>
                    {renderContent()}
                </div>

                {/* Footer Design Line (Global) */}
                <div className="h-4 w-full bg-[#004aad] mt-auto"></div>
            </div>
        </div >
    );
};

// --- Sub-Components ---
const TabButton = ({ active, onClick, label, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 md:px-6 py-2 md:py-3 rounded-xl font-bold text-sm md:text-lg transition-all duration-300 whitespace-nowrap ${active
            ? 'bg-white text-[#004aad] shadow-md scale-105 ring-1 md:ring-2 ring-[#004aad]/10'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
    >
        {icon}
        {label}
    </button>
);

export default ResultDashboardView;