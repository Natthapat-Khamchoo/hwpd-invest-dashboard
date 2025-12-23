import { LayoutDashboard, Table as TableIcon, Activity, Siren, Radar, Truck, FileWarning, FileText, Building2, MousePointerClick } from 'lucide-react';

// --- Configuration & Constants ---
export const UNIT_HIERARCHY = { "1": 6, "2": 6, "3": 5, "4": 5, "5": 6, "6": 6, "7": 5, "8": 4 };

export const FALLBACK_PALETTE = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#84cc16'];
export const UNIT_COLORS_MAP = { "1": "#ef4444", "2": "#f97316", "3": "#eab308", "4": "#22c55e", "5": "#06b6d4", "6": "#3b82f6", "7": "#a855f7", "8": "#ec4899" };

export const CRIME_KEYWORDS = [
  { keys: ["ยาเสพติด", "ยาบ้า", "ไอซ์"], color: "#ef4444" },
  { keys: ["อาวุธ", "ปืน", "ระเบิด"], color: "#f97316" },
  { keys: ["รถบรรทุก", "น้ำหนัก", "บรรทุก"], color: "#a855f7" },
  { keys: ["หมายจับ", "ตามหมาย"], color: "#3b82f6" },
  { keys: ["เมา", "แอลกอฮอล์"], color: "#eab308" },
  { keys: ["จราจร", "ป้าย", "ใบขับขี่", "ความเร็ว"], color: "#22c55e" },
  { keys: ["ทางหลวง", "สอบสวน"], color: "#06b6d4" },
  { keys: ["ต่างด้าว", "หลบหนีเข้าเมือง"], color: "#ec4899" },
  { keys: ["ลักทรัพย์", "โจรกรรม"], color: "#64748b" }
];

export const TOPIC_GROUPING = [
  { name: "ยาเสพติด", keywords: ["ยาเสพติด", "ยาบ้า", "ไอซ์", "เมท", "ครอบครอง"] },
  { name: "อาวุธปืน/วัตถุระเบิด", keywords: ["อาวุธ", "ปืน", "ระเบิด", "กระสุน"] },
  { name: "รถบรรทุก/น้ำหนัก", keywords: ["รถบรรทุก", "น้ำหนัก", "บรรทุก"] },
  { name: "บุคคลตามหมายจับ", keywords: ["หมายจับ", "ตามหมาย"] }, 
  { name: "เมาแล้วขับ", keywords: ["เมา", "แอลกอฮอล์", "สุรา"] },
  { name: "จราจร/ขนส่ง", keywords: ["จราจร", "ใบขับขี่", "ป้าย", "ความเร็ว", "ขนส่ง", "สวมทะเบียน"] },
  { name: "ต่างด้าว/ตม.", keywords: ["ต่างด้าว", "หลบหนีเข้าเมือง", "passport", "พาสปอร์ต"] }
];

export const DATE_RANGES = [
  { label: 'วันนี้ (Today)', value: 'today' },
  { label: 'เมื่อวาน (Yesterday)', value: 'yesterday' },
  { label: '7 วันย้อนหลัง', value: '7days' },
  { label: '30 วันย้อนหลัง', value: '30days' },
  { label: 'เดือนนี้ (This Month)', value: 'this_month' },
  { label: 'ทั้งหมด (All Time)', value: 'all' },
  { label: 'กำหนดเอง (Custom)', value: 'custom' }
];

// --- Helper Functions ---
export const getConsistentColor = (str) => {
  if (!str) return '#94a3b8';
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
};

export const getUnitColor = (name) => {
  const match = name.match(/(\d+)/); 
  if (match) return UNIT_COLORS_MAP[match[0]] || getConsistentColor(name);
  return getConsistentColor(name);
};

export const getCrimeColor = (topic) => {
  if (!topic) return '#94a3b8';
  const lowerTopic = topic.toLowerCase();
  for (const group of CRIME_KEYWORDS) {
    if (group.keys.some(k => lowerTopic.includes(k))) return group.color;
  }
  return getConsistentColor(topic);
};

export const normalizeTopic = (rawTopic) => {
  if (!rawTopic) return "อื่นๆ";
  const str = rawTopic.trim();
  for (const group of TOPIC_GROUPING) {
    if (group.keywords.some(k => str.includes(k))) {
      return group.name;
    }
  }
  return "อื่นๆ"; 
};

export const parseDateRobust = (dateStr) => {
  if (!dateStr) return { dateObj: null, thaiYear: '' };
  const cleanDateStr = dateStr.trim().split(' ')[0];
  let day, month, year;
  let parts = [];
  if (cleanDateStr.includes('-')) parts = cleanDateStr.split('-');
  else if (cleanDateStr.includes('/')) parts = cleanDateStr.split('/');
  else return { dateObj: null, thaiYear: '' };

  if (parts.length !== 3) return { dateObj: null, thaiYear: '' };
  const v1 = parseInt(parts[0], 10);
  const v2 = parseInt(parts[1], 10);
  const v3 = parseInt(parts[2], 10);

  if (v1 > 1000) { year = v1; month = v2 - 1; day = v3; } 
  else if (v3 > 1000) { day = v1; month = v2 - 1; year = v3; } 
  else return { dateObj: null, thaiYear: '' };

  if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
    const isThaiYearInput = year > 2400; 
    const adYear = isThaiYearInput ? year - 543 : year; 
    const dateObj = new Date(adYear, month, day);
    dateObj.setHours(0, 0, 0, 0); 
    if (isNaN(dateObj.getTime())) return { dateObj: null, thaiYear: '' };
    const thYear = isThaiYearInput ? year : year + 543; 
    return { dateObj, thaiYear: thYear.toString() };
  }
  return { dateObj: null, thaiYear: '' };
};