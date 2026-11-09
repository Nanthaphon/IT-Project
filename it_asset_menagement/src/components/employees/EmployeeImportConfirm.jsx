import React, { useState } from 'react';
import { Upload, ArrowRight } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '../../ui/primitives.jsx';

/* สรุปก่อนนำเข้าพนักงาน — ถามทุกครั้ง กันนำเข้าผิดไฟล์/ทับข้อมูลโดยไม่ตั้งใจ
   plan มาจาก planEmployeeImport (utils/employeeImport.js)
   onConfirm(true)  = อัปเดตคนที่รหัสซ้ำ + เพิ่มคนใหม่
   onConfirm(false) = เพิ่มเฉพาะคนใหม่ */

const Stat = ({ label, value, tone = 'text-stone-900' }) => (
  <div className="rounded-xl bg-sand-50 px-4 py-3">
    <p className="text-xs text-stone-500">{label}</p>
    <p className={`mt-0.5 text-[22px] font-medium tabular-nums ${tone}`}>{value}</p>
  </div>
);

const MAX_SHOW = 200;

export default function EmployeeImportConfirm({ plan, onCancel, onConfirm }) {
  const [tab, setTab] = useState('updates');
  if (!plan) return null;
  const { creates, updates, unchanged, skippedNoName, dupInFile, unknownManagers } = plan;
  const skipped = skippedNoName.length + dupInFile.length;
  const nothing = creates.length === 0 && updates.length === 0;
  const activeTab = updates.length ? tab : 'creates';

  return (
    <Modal open onClose={onCancel} size="lg">
      <ModalHeader icon={Upload} title="ยืนยันการนำเข้าพนักงาน" onClose={onCancel} />
      <ModalBody className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="อัปเดต (รหัสซ้ำ)" value={updates.length} tone={updates.length ? 'text-ochre-700' : 'text-stone-900'} />
          <Stat label="เพิ่มใหม่" value={creates.length} tone={creates.length ? 'text-olive-700' : 'text-stone-900'} />
          <Stat label="ไม่มีอะไรเปลี่ยน" value={unchanged.length} />
          <Stat label="ข้าม" value={skipped} />
        </div>

        {updates.length > 0 && (
          <p className="rounded-xl bg-ochre-50 px-4 py-3 text-sm text-ochre-700">
            มีรหัสพนักงานซ้ำกับในระบบ {updates.length} คน — ต้องการอัปเดตข้อมูลของคนเหล่านี้ตามไฟล์หรือไม่
            (แก้เฉพาะช่องที่ต่าง · ช่องว่างในไฟล์ไม่ลบข้อมูลเดิม)
          </p>
        )}

        {(updates.length > 0 || creates.length > 0) && (
          <div className="space-y-3">
            {updates.length > 0 && creates.length > 0 && (
              <div className="flex gap-1.5">
                {[['updates', `อัปเดต ${updates.length}`], ['creates', `เพิ่มใหม่ ${creates.length}`]].map(([k, label]) => (
                  <button key={k} type="button" onClick={() => setTab(k)}
                    className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${activeTab === k ? 'bg-clay-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/60'}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="max-h-[42vh] overflow-y-auto rounded-xl border border-stone-200/60">
              {activeTab === 'updates' ? (
                <ul className="divide-y divide-stone-100">
                  {updates.slice(0, MAX_SHOW).map((u) => (
                    <li key={u.id} className="px-4 py-3">
                      <p className="text-sm font-medium text-stone-900">
                        {u.name || '—'} <span className="font-normal text-stone-500">· {u.empId}{u.removed ? ' · ออกแล้ว' : ''}</span>
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {u.changes.map((c) => (
                          <li key={c.field} className="flex flex-wrap items-center gap-x-1.5 text-[13px]">
                            <span className="w-28 shrink-0 text-stone-500">{c.label}</span>
                            <span className="text-stone-500 line-through decoration-stone-300">{c.from || 'ว่าง'}</span>
                            <ArrowRight className="size-3.5 text-stone-400" strokeWidth={2} />
                            <span className="text-stone-900">{c.to}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {creates.slice(0, MAX_SHOW).map((c) => (
                    <li key={c.row} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="truncate text-stone-900">{c.rec.fullName || '—'}</span>
                      <span className="shrink-0 text-[13px] text-stone-500 tabular-nums">{c.rec.empId || 'ไม่มีรหัส'}</span>
                    </li>
                  ))}
                </ul>
              )}
              {(activeTab === 'updates' ? updates : creates).length > MAX_SHOW && (
                <p className="px-4 py-2.5 text-[13px] text-stone-500">…และอีก {(activeTab === 'updates' ? updates : creates).length - MAX_SHOW} คน</p>
              )}
            </div>
          </div>
        )}

        {(unknownManagers.length > 0 || skipped > 0) && (
          <ul className="space-y-1 text-[13px] text-stone-600">
            {unknownManagers.length > 0 && (
              <li>ไม่พบรหัสหัวหน้า {unknownManagers.length} แถว (นำเข้าได้ แต่ยังไม่มีหัวหน้า): {unknownManagers.slice(0, 5).map((u) => `แถว ${u.row} (${u.code})`).join(', ')}{unknownManagers.length > 5 ? ' …' : ''}</li>
            )}
            {dupInFile.length > 0 && (
              <li>รหัสซ้ำกันในไฟล์ ใช้แถวแรก ข้าม {dupInFile.length} แถว: {dupInFile.slice(0, 5).map((d) => `แถว ${d.row} (${d.empId})`).join(', ')}{dupInFile.length > 5 ? ' …' : ''}</li>
            )}
            {skippedNoName.length > 0 && (
              <li>ไม่มีชื่อ ข้าม {skippedNoName.length} แถว: {skippedNoName.slice(0, 8).join(', ')}{skippedNoName.length > 8 ? ' …' : ''}</li>
            )}
          </ul>
        )}

        {nothing && <p className="text-sm text-stone-600">ข้อมูลในไฟล์ตรงกับในระบบทั้งหมด ไม่มีอะไรต้องนำเข้า</p>}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onCancel}>{nothing ? 'ปิด' : 'ยกเลิก'}</Button>
        {updates.length > 0 && creates.length > 0 && (
          <Button variant="secondary" onClick={() => onConfirm(false)}>เพิ่มเฉพาะคนใหม่</Button>
        )}
        {!nothing && (
          <Button onClick={() => onConfirm(true)}>
            {updates.length ? `ยืนยันอัปเดต ${updates.length} คน${creates.length ? ` · เพิ่ม ${creates.length}` : ''}` : `ยืนยันเพิ่ม ${creates.length} คน`}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
