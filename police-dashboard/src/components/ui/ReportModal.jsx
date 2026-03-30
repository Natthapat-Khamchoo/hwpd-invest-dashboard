import React from 'react';
import { ClipboardCopy, X } from 'lucide-react';

export default function ReportModal({ show, reportText, onClose, onCopy }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-liquid w-full max-w-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ClipboardCopy className="w-5 h-5 text-blue-400" /> ตัวอย่างรายงาน
            </h2>
            <p className="text-sm text-slate-400">ตรวจสอบความถูกต้องก่อนคัดลอก</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-slate-900/50 rounded-xl border border-white/5 p-4 max-h-[60vh] overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 leading-relaxed">
              {reportText}
            </pre>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-slate-900/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
          >
            ปิดหน้าต่าง
          </button>
          <button
            onClick={() => onCopy(reportText)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
          >
            <ClipboardCopy className="w-4 h-4 mr-2" />
            คัดลอกรายงาน
          </button>
        </div>
      </div>
    </div>
  );
}
