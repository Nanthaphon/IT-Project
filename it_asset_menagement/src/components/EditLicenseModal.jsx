import React from 'react';
import { Pencil, Image as ImageIcon, X as XIcon } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Field, SectionHeader, Button } from '../ui/primitives.jsx';
import { cls } from '../ui/theme.js';

export default function EditLicenseModal({
  editLicenseModal,
  setEditLicenseModal,
  handleUpdateLicense,
  handleEditLicenseChange,
}) {
  if (!editLicenseModal.isOpen || !editLicenseModal.data) return null;

  const close = () => setEditLicenseModal({ isOpen: false, data: null });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditLicenseModal(prev => ({ ...prev, data: { ...prev.data, image: reader.result } }));
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal open={editLicenseModal.isOpen} onClose={close}>
      <ModalHeader
        icon={Pencil}
        title="แก้ไขข้อมูลโปรแกรม / License"
        subtitle="อัปเดต Product Key, Supplier และวันที่หมดอายุ"
        onClose={close}
      />
      <form onSubmit={handleUpdateLicense} className="flex flex-col flex-1 overflow-hidden">
        <ModalBody className="space-y-7">
          <section className="space-y-3">
            <SectionHeader>รูปภาพ</SectionHeader>
            <div className="flex items-center gap-4">
              {editLicenseModal.data.image ? (
                <div className="relative shrink-0">
                  <img src={editLicenseModal.data.image} alt="Preview" className="w-20 h-20 rounded-xl object-cover ring-1 ring-slate-200" />
                  <button
                    type="button"
                    onClick={() => setEditLicenseModal(prev => ({ ...prev, data: { ...prev.data, image: null } }))}
                    className="absolute -top-1.5 -right-1.5 bg-white text-rose-500 ring-1 ring-rose-200 rounded-full w-6 h-6 flex items-center justify-center hover:bg-rose-50 transition-colors focus:outline-none shadow-sm"
                  >
                    <XIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 ring-1 ring-dashed ring-slate-300 shrink-0">
                  <ImageIcon className="h-7 w-7" strokeWidth={1.5} />
                </div>
              )}
              <input
                type="file" accept="image/*" onChange={handleImageChange}
                className="flex-1 min-w-0 text-sm text-slate-500
                  file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0
                  file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700
                  hover:file:bg-slate-200 file:cursor-pointer file:transition-colors"
              />
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeader>ข้อมูลใบอนุญาต</SectionHeader>
            <Field label="ชื่อโปรแกรม" required>
              <input type="text" name="name" value={editLicenseModal.data.name || ''} onChange={handleEditLicenseChange} required className={cls.input} />
            </Field>
            <Field label="Product Key License">
              <input type="text" name="productKey" value={editLicenseModal.data.productKey || ''} onChange={handleEditLicenseChange} className={cls.inputMono} />
            </Field>
            <Field label="รหัสของ Product Key">
              <input type="text" name="keyCode" value={editLicenseModal.data.keyCode || ''} onChange={handleEditLicenseChange} className={cls.input} />
            </Field>
            <Field label="Supplier ที่ซื้อ">
              <input type="text" name="supplier" value={editLicenseModal.data.supplier || ''} onChange={handleEditLicenseChange} className={cls.input} />
            </Field>
          </section>

          <section className="space-y-4">
            <SectionHeader>การจัดซื้อและสถานะ</SectionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="วันที่ซื้อ">
                <input type="date" name="purchaseDate" value={editLicenseModal.data.purchaseDate || ''} onChange={handleEditLicenseChange} className={cls.input} />
              </Field>
              <Field label="วันที่หมดอายุ">
                <input type="date" name="expirationDate" value={editLicenseModal.data.expirationDate || ''} onChange={handleEditLicenseChange} className={cls.input} />
              </Field>
              <Field label="ราคา (บาท)">
                <div className="relative">
                  <input
                    type="number"
                    name="cost"
                    value={editLicenseModal.data.cost || ''}
                    onChange={handleEditLicenseChange}
                    className={cls.input + ' pr-12'}
                    placeholder="0.00"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">฿</span>
                </div>
              </Field>
              <Field label="สถานะ">
                <select
                  name="status"
                  value={editLicenseModal.data.status || 'พร้อมใช้งาน'}
                  onChange={handleEditLicenseChange}
                  className={cls.select}
                >
                  <option value="พร้อมใช้งาน">พร้อมใช้งาน</option>
                  <option value="ถูกใช้งาน">ถูกใช้งาน</option>
                  <option value="ชำรุดเสียหาย">ชำรุดเสียหาย</option>
                  <option value="ไม่สามารถใช้งานได้">ไม่สามารถใช้งานได้</option>
                  <option value="รอดำเนินการ">รอดำเนินการ</option>
                </select>
              </Field>
            </div>
          </section>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={close}>ยกเลิก</Button>
          <Button type="submit">บันทึกการแก้ไข</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
