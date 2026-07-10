import React from 'react';
import { Inbox, User, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '../ui/primitives.jsx';
import { cls } from '../ui/theme.js';
import AssetAssessmentSection from './AssetAssessmentSection.jsx';

export default function ReturnModal({
  returnModal, setReturnModal, returnCondition, setReturnCondition,
  returnRemarks, setReturnRemarks, handleConfirmReturn,
  returnConditionData, setReturnConditionData,
}) {
  if (!returnModal.isOpen) return null;
  const isLicense   = returnModal.collectionName === 'licenses';
  const isAccessory = returnModal.collectionName === 'accessories';

  const close = () => {
    setReturnModal({ isOpen: false, assetId: null, checkoutId: null, empId: null, empName: null, assetName: null });
    setReturnCondition('good');
    setReturnRemarks('');
  };

  const submitClass = isLicense || returnCondition === 'good'
    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-200'
    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-200';

  return (
    <Modal open={returnModal.isOpen} onClose={close} size="md">
      <ModalHeader
        icon={Inbox}
        title="รับคืน"
        onClose={close}
      />
      <form onSubmit={handleConfirmReturn} className="flex flex-col flex-1 overflow-hidden">
        <ModalBody className="space-y-5">
          {/* Asset card */}
          <div className="bg-slate-50/70 ring-1 ring-slate-200 p-5 rounded-xl">
            <p className="text-[12px] text-slate-500 font-semibold uppercase tracking-wide mb-1">อุปกรณ์ที่รับคืน</p>
            <p className="text-[16px] font-semibold text-slate-900">{returnModal.assetName}</p>

            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className="text-[12px] text-slate-500 font-semibold uppercase tracking-wide mb-1">รับคืนจาก</p>
              <p className="text-[14.5px] font-semibold text-[#1E487A] flex items-center gap-1.5">
                <User className="h-4 w-4" strokeWidth={2} />
                {returnModal.empName}
              </p>
            </div>
          </div>

          {!isLicense && (
            <div>
              <p className="text-[14px] font-medium text-slate-600 mb-3">ระบุสภาพอุปกรณ์ที่รับคืน</p>
              <div className="space-y-2.5">
                <ConditionOption
                  selected={returnCondition === 'good'}
                  onClick={() => setReturnCondition('good')}
                  Icon={CheckCircle2}
                  color="emerald"
                  title="สภาพปกติ (Good)"
                  description="นำกลับเข้าคลังเพื่อพร้อมใช้งานต่อ"
                />
                <ConditionOption
                  selected={returnCondition === 'broken'}
                  onClick={() => setReturnCondition('broken')}
                  Icon={AlertTriangle}
                  color="rose"
                  title="ชำรุด / ตัดจำหน่าย (Broken)"
                  description="บันทึกเป็นของเสีย ไม่นำกลับเข้าคลัง"
                />
              </div>

              <div className={`transition-colors overflow-hidden ${returnCondition === 'broken' ? 'max-h-[220px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
                <label className="block text-[14px] font-medium text-slate-600 mb-1.5">
                  หมายเหตุ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  className={cls.input + ' resize-none focus:ring-rose-500/15 focus:border-rose-500'}
                  placeholder="เช่น สายขาด, ลูกกลิ้งเลื่อนไม่ได้, เปิดไม่ติด..."
                  rows="3"
                  required={returnCondition === 'broken'}
                />
              </div>
            </div>
          )}

          {isLicense && (
            <div>
              <label className="block text-[14px] font-medium text-slate-600 mb-1.5">หมายเหตุ (ถ้ามี)</label>
              <textarea
                value={returnRemarks}
                onChange={(e) => setReturnRemarks(e.target.value)}
                className={cls.input + ' resize-none'}
                placeholder="หมายเหตุเพิ่มเติม..."
                rows="3"
              />
            </div>
          )}

          {/* 🆕 100-point checklist ตอนรับคืน — เก็บสภาพหลังใช้งาน + ใช้พิมพ์ใบรับคืน */}
          {!isLicense && !isAccessory && returnConditionData && setReturnConditionData && (
            <div className="border-t border-slate-200 pt-4">
              <AssetAssessmentSection
                assessment={returnConditionData.assessment || {}}
                setAssessment={(fnOrValue) => {
                  const next = typeof fnOrValue === 'function' ? fnOrValue(returnConditionData.assessment || {}) : fnOrValue;
                  setReturnConditionData({ ...returnConditionData, assessment: next });
                }}
                photos={returnConditionData.photos || {}}
                setPhotos={(fnOrValue) => {
                  const next = typeof fnOrValue === 'function' ? fnOrValue(returnConditionData.photos || {}) : fnOrValue;
                  setReturnConditionData({ ...returnConditionData, photos: next });
                }}
                defectsNote={returnConditionData.defectsNote || ''}
                setDefectsNote={(val) => setReturnConditionData({ ...returnConditionData, defectsNote: val })}
              />
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={close}>ยกเลิก</Button>
          <button
            type="submit"
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 ${submitClass}`}
          >
            ยืนยันการรับคืน
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function ConditionOption({ selected, onClick, Icon, color, title, description }) {
  const colorMap = {
    emerald: {
      selectedBg: 'bg-emerald-50 ring-emerald-400',
      iconBg: 'bg-emerald-100 text-emerald-600',
      dot: 'bg-emerald-500',
    },
    rose: {
      selectedBg: 'bg-rose-50 ring-rose-400',
      iconBg: 'bg-rose-100 text-rose-600',
      dot: 'bg-rose-500',
    },
  }[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-4 rounded-xl ring-1 ring-inset transition-colors text-left
        ${selected ? colorMap.selectedBg + ' ring-2' : 'bg-white ring-slate-200 hover:ring-slate-300 hover:bg-slate-50/60'}`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selected ? colorMap.iconBg : 'bg-slate-100 text-slate-400'}`}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
          {selected && <span className={`w-1.5 h-1.5 rounded-full ${colorMap.dot}`} />}
          {title}
        </div>
        <p className="text-[13.5px] text-slate-500 mt-0.5">{description}</p>
      </div>
      {selected && (
        <div className={`w-5 h-5 rounded-full ${colorMap.iconBg} flex items-center justify-center shrink-0`}>
          <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
        </div>
      )}
    </button>
  );
}
