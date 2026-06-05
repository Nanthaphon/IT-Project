import React, { useState, useRef, useEffect } from 'react';
import { Pencil, ShieldCheck } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Field, SectionHeader, Button } from '../ui/primitives.jsx';
import { cls } from '../ui/theme.js';
import FieldOptionSelect from './FieldOptionSelect.jsx';

export default function EditEmpModal({
  editEmpModal,
  setEditEmpModal,
  handleUpdateEmployee,
  handleEditEmpChange,
  employees = [],
  fieldOptions = {},
}) {
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const managerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (managerRef.current && !managerRef.current.contains(event.target)) setIsManagerDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editEmpModal.isOpen || !editEmpModal.data) return null;
  const data = editEmpModal.data;
  const close = () => setEditEmpModal({ isOpen: false, data: null });

  return (
    <Modal open={editEmpModal.isOpen} onClose={close} size="xl">
      <ModalHeader
        icon={Pencil}
        title="แก้ไขข้อมูลพนักงาน"
        subtitle="อัปเดตข้อมูลส่วนตัว สังกัด และบัญชี Microsoft 365"
        onClose={close}
      />
      <form onSubmit={handleUpdateEmployee} className="flex flex-col flex-1 overflow-hidden">
        <ModalBody className="space-y-7">
          <section className="space-y-4">
            <SectionHeader>ข้อมูลพื้นฐาน</SectionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="รหัสพนักงาน" required>
                <input type="text" name="empId" value={data.empId || ''} onChange={handleEditEmpChange} required className={cls.input} />
              </Field>
              <Field label="ชื่อ-นามสกุล (TH)" required>
                <input type="text" name="fullName" value={data.fullName || ''} onChange={handleEditEmpChange} required className={cls.input} />
              </Field>
              <Field label="ชื่อ-นามสกุล (EN)">
                <input type="text" name="fullNameEng" value={data.fullNameEng || ''} onChange={handleEditEmpChange} className={cls.input} />
              </Field>
              <Field label="ชื่อเล่น">
                <input type="text" name="nickname" value={data.nickname || ''} onChange={handleEditEmpChange} className={cls.input} />
              </Field>
              <Field label="เบอร์โทร">
                <input type="tel" name="phone" value={data.phone || ''} onChange={handleEditEmpChange} className={cls.input} />
              </Field>
              <Field label="วันที่เริ่มงาน">
                <input type="date" name="startDate" value={data.startDate || ''} onChange={handleEditEmpChange} className={cls.input} />
              </Field>
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeader>สังกัด</SectionHeader>
            <Field label="บริษัท">
              <FieldOptionSelect
                name="company"
                value={data.company || ''}
                onChange={handleEditEmpChange}
                options={fieldOptions.companies || []}
                placeholder="เลือกหรือพิมพ์ใหม่"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="แผนก">
                <FieldOptionSelect
                  name="department"
                  value={data.department || ''}
                  onChange={handleEditEmpChange}
                  options={fieldOptions.departments || []}
                  placeholder="เลือกแผนก..."
                />
              </Field>
              <Field label="ตำแหน่ง">
                <FieldOptionSelect
                  name="position"
                  value={data.position || ''}
                  onChange={handleEditEmpChange}
                  options={fieldOptions.positions || []}
                  placeholder="เลือกตำแหน่ง..."
                />
              </Field>
            </div>

            <Field label="ชื่อหัวหน้างาน">
              <div ref={managerRef} className="relative">
                <input
                  type="text"
                  name="manager"
                  value={data.manager || ''}
                  onChange={handleEditEmpChange}
                  onFocus={() => setIsManagerDropdownOpen(true)}
                  className={cls.input}
                  placeholder="ค้นหาและเลือกหัวหน้างาน..."
                  autoComplete="off"
                />
                {isManagerDropdownOpen && (
                  <div className="absolute z-20 w-full mt-1.5 bg-white ring-1 ring-slate-200 rounded-xl shadow-xl shadow-slate-950/10 max-h-56 overflow-y-auto">
                    {employees.filter(emp =>
                      emp.fullName?.toLowerCase().includes((data.manager || '').toLowerCase()) ||
                      emp.empId?.toLowerCase().includes((data.manager || '').toLowerCase())
                    ).map(emp => (
                      <div
                        key={emp.id}
                        className="px-4 py-2.5 hover:bg-blue-50/60 cursor-pointer text-sm border-b border-slate-50 last:border-b-0 transition-colors"
                        onClick={() => {
                          handleEditEmpChange({ target: { name: 'manager', value: emp.fullName } });
                          setIsManagerDropdownOpen(false);
                        }}
                      >
                        <div className="font-medium text-slate-800">{emp.fullName}</div>
                        <div className="text-[12.5px] text-slate-500 mt-0.5">{emp.empId} • {emp.department || 'ไม่ระบุแผนก'}</div>
                      </div>
                    ))}
                    {employees.filter(emp =>
                      emp.fullName?.toLowerCase().includes((data.manager || '').toLowerCase()) ||
                      emp.empId?.toLowerCase().includes((data.manager || '').toLowerCase())
                    ).length === 0 && (
                      <div className="p-3 text-center text-[13px] text-slate-500 font-medium">ไม่พบข้อมูลพนักงานในระบบ</div>
                    )}
                  </div>
                )}
              </div>
            </Field>
          </section>

          <section className="rounded-xl ring-1 ring-blue-100 bg-blue-50/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-[#1E487A]">
              <ShieldCheck className="h-4 w-4" strokeWidth={2} />
              <p className="text-[13px] font-semibold tracking-wide">บัญชี Microsoft 365</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="อีเมล Microsoft 365">
                <input type="email" name="m365Email" value={data.m365Email || ''} onChange={handleEditEmpChange} className={cls.input} placeholder="user@domain.com" />
              </Field>
              <Field label="รหัสผ่าน Microsoft 365">
                <input type="text" name="m365Password" value={data.m365Password || ''} onChange={handleEditEmpChange} className={cls.inputMono} placeholder="รหัสผ่าน" />
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
