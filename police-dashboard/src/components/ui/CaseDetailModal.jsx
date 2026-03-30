import React from 'react';
import { X, Building2, Calendar, Users } from 'lucide-react';
import { getCrimeColor } from '../../utils/helpers';

export default function CaseDetailModal({ selectedCase, onClose }) {
  if (!selectedCase) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-liquid w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 rounded-2xl border border-slate-700/50 shadow-2xl">
        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-slate-900/80 backdrop-blur z-10">
          <div>
            <h2 className="text-xl font-bold text-white">รายละเอียดการจับกุม</h2>
            <p className="text-sm text-slate-400">Case ID: #{selectedCase.id || 'N/A'}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30">
            <h3 className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wider">หน่วยงานรับผิดชอบ</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">กองกำกับการ</p>
                <p className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  กก.{selectedCase.unit_kk} บก.ทล.
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">สถานีตำรวจทางหลวง</p>
                <p className="text-lg font-bold text-white">ส.ทล.{selectedCase.unit_s_tl}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-yellow-500" />ข้อมูลเหตุการณ์
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-slate-500 text-xs">วัน/เวลา</dt>
                  <dd className="text-slate-200 font-medium">{selectedCase.date_capture} เวลา {selectedCase.time_capture || '-'} น.</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">สถานที่</dt>
                  <dd className="text-slate-200">{selectedCase.location || 'ไม่ระบุ'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">พิกัด</dt>
                  <dd className="text-slate-200 font-mono text-xs">{selectedCase.lat && selectedCase.long ? `${selectedCase.lat}, ${selectedCase.long}` : '-'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">หัวข้อเรื่อง</dt>
                  <dd 
                    className="inline-block px-2 py-1 rounded text-xs font-bold text-white mt-1 shadow-sm" 
                    style={{ backgroundColor: getCrimeColor(selectedCase.topic) }}
                  >
                    {selectedCase.topic}
                  </dd>
                </div>
                {selectedCase.arrest_type && (
                  <div>
                    <dt className="text-slate-500 text-xs mt-2">ประเภทการจับกุม</dt>
                    <dd className="text-emerald-400 font-medium">{selectedCase.arrest_type}</dd>
                  </div>
                )}
                {selectedCase.captured_by && (
                  <div>
                    <dt className="text-slate-500 text-xs mt-2">จับโดย</dt>
                    <dd className="text-emerald-400">{selectedCase.captured_by}</dd>
                  </div>
                )}
              </dl>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2 text-yellow-500" />ข้อมูลผู้ต้องหา
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-slate-500 text-xs">ชื่อ-สกุล</dt>
                  <dd className="text-slate-200 font-medium text-lg">{selectedCase.suspect_name}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">ข้อหา</dt>
                  <dd className="text-slate-200 bg-slate-800/80 p-3 rounded border border-slate-700 mt-1 shadow-inner">
                    {selectedCase.charge || '-'}
                  </dd>
                </div>
                {selectedCase.warrant_source && (
                  <div>
                    <dt className="text-slate-500 text-xs mt-2">ประเภทหมายจับ/ที่มา</dt>
                    <dd className="text-pink-400 font-medium">{selectedCase.warrant_source}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
