import React from 'react';
import { Wrench, Check } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Field, Button } from '../ui/primitives.jsx';
import { cls, BRAND } from '../ui/theme.js';

export default function RepairModal({
  repairModal,
  setRepairModal,
  repairQuantity,
  setRepairQuantity,
  repairRemarks,
  setRepairRemarks,
  handleConfirmRepair,
}) {
  if (!repairModal.isOpen) return null;

  const close = () => {
    setRepairModal({ isOpen: false, assetId: null, assetName: null, maxRepair: 0, collectionName: '' });
    setRepairQuantity(1);
    setRepairRemarks('');
  };

  return (
    <Modal open={repairModal.isOpen} onClose={close} size="md">
      <ModalHeader
        icon={Wrench}
        title="บันทึกนำอุปกรณ์กลับเข้าคลัง"
        subtitle="ซ่อมเสร็จแล้ว — ระบุจำนวนและรายละเอียดการซ่อม"
        onClose={close}
      />
      <form onSubmit={handleConfirmRepair} className="flex flex-col flex-1 overflow-hidden">
        <ModalBody className="space-y-5">
          <div
            className="rounded-xl ring-1 p-5"
            style={{ background: `${BRAND.primary}08`, borderColor: `${BRAND.primary}25`, '--tw-ring-color': `${BRAND.primary}25` }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: BRAND.primary }}>
              อุปกรณ์ที่ซ่อมเสร็จแล้ว
            </p>
            <p className="text-[17px] font-bold" style={{ color: BRAND.primary }}>{repairModal.assetName}</p>
          </div>

          {repairModal.maxRepair > 1 && (
            <Field
              label="จำนวนที่นำกลับเข้าคลัง (ชิ้น)"
              required
              hint={`นำกลับเข้าคลังได้สูงสุด ${repairModal.maxRepair} ชิ้น (จากรายการที่ชำรุด)`}
            >
              <input
                type="number"
                min="1"
                max={repairModal.maxRepair}
                value={repairQuantity}
                onChange={(e) => setRepairQuantity(e.target.value)}
                className={cls.input}
                required
              />
            </Field>
          )}

          <Field label="รายละเอียดการซ่อม / หมายเหตุ" required>
            <textarea
              value={repairRemarks}
              onChange={(e) => setRepairRemarks(e.target.value)}
              className={cls.input + ' resize-none'}
              placeholder="ระบุรายละเอียดการแก้ไข เช่น เปลี่ยนสายใหม่, ซ่อมบอร์ด, เปลี่ยนหน้าจอ..."
              rows="3"
              required
            />
          </Field>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={close}>ยกเลิก</Button>
          <Button type="submit">
            <Check className="h-4 w-4" strokeWidth={2.4} />
            ยืนยันนำกลับเข้าคลัง
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
