import React, { useState, useRef, useEffect } from 'react';
import { Plus, Image as ImageIcon, X as XIcon, ShieldCheck } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Field, SectionHeader, Button } from '../ui/primitives.jsx';
import { cls } from '../ui/theme.js';
import FieldOptionSelect from './FieldOptionSelect.jsx';

export default function AddModal({
  isAddModalOpen, setIsAddModalOpen, activeMenu,
  handleAddEmployee, empForm, handleEmpChange,
  handleAddLicense, licenseForm, handleLicenseChange, licenseImage, setLicenseImage,
  handleAdd, name, setName, type, setType, cost, setCost,
  purchaseDate, setPurchaseDate, warrantyDate, setWarrantyDate,
  quantity, setQuantity, unit, setUnit,
  assetImage, setAssetImage, assetDepartment, setAssetDepartment,
  sn, setSn, company, setCompany, assetTag, setAssetTag, model, setModel, vendor, setVendor, note, setNote,
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

  if (!isAddModalOpen) return null;

  const close = () => setIsAddModalOpen(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAssetImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleLicenseImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLicenseImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const titleLabel =
    activeMenu === 'employees'      ? 'พนักงาน' :
    activeMenu === 'licenses'       ? 'โปรแกรม / ใบอนุญาต' :
    activeMenu === 'accessories'    ? 'อุปกรณ์เสริม' :
    activeMenu === 'office_supplies'? 'อุปกรณ์สำนักงาน' :
    'ทรัพย์สินหลัก';

  const subtitle = `กรอกข้อมูลรายการใหม่ให้ครบ จากนั้นกด "บันทึก" เพื่อเพิ่มเข้าสู่ระบบ`;

  return (
    <Modal open={isAddModalOpen} onClose={close} size="xl">
      <ModalHeader icon={Plus} title={`เพิ่ม${titleLabel}`} subtitle={subtitle} onClose={close} />

      {activeMenu === 'employees' ? (
        <form onSubmit={handleAddEmployee} className="flex flex-col flex-1 overflow-hidden">
          <ModalBody className="space-y-7">
            <section className="space-y-4">
              <SectionHeader>ข้อมูลพื้นฐาน</SectionHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="รหัสพนักงาน" required>
                  <input type="text" name="empId" value={empForm.empId || ''} onChange={handleEmpChange} required className={cls.input} placeholder="เช่น EMP001" />
                </Field>
                <Field label="รหัสบัตรประชาชน">
                  <input type="text" name="nationalId" value={empForm.nationalId || ''} onChange={handleEmpChange} maxLength="13" className={cls.input} placeholder="เลข 13 หลัก (ไม่บังคับ)" />
                </Field>
                <Field label="ชื่อ-นามสกุล (TH)" required>
                  <input type="text" name="fullName" value={empForm.fullName || ''} onChange={handleEmpChange} required className={cls.input} placeholder="ชื่อ-นามสกุล" />
                </Field>
                <Field label="ชื่อ-นามสกุล (EN)">
                  <input type="text" name="fullNameEng" value={empForm.fullNameEng || ''} onChange={handleEmpChange} className={cls.input} placeholder="Firstname Lastname" />
                </Field>
                <Field label="ชื่อเล่น">
                  <input type="text" name="nickname" value={empForm.nickname || ''} onChange={handleEmpChange} className={cls.input} placeholder="ชื่อเล่น" />
                </Field>
                <Field label="เบอร์โทร">
                  <input type="tel" name="phone" value={empForm.phone || ''} onChange={handleEmpChange} className={cls.input} placeholder="เบอร์โทรศัพท์" />
                </Field>
              </div>
            </section>

            <section className="space-y-4">
              <SectionHeader>สังกัด</SectionHeader>
              <Field label="บริษัท">
                <FieldOptionSelect
                  name="company"
                  value={empForm.company || ''}
                  onChange={handleEmpChange}
                  options={fieldOptions.companies || []}
                  placeholder="ชื่อบริษัท"
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="แผนก">
                  <FieldOptionSelect
                    name="department"
                    value={empForm.department || ''}
                    onChange={handleEmpChange}
                    options={fieldOptions.departments || []}
                    placeholder="เลือกแผนก..."
                  />
                </Field>
                <Field label="ตำแหน่ง">
                  <FieldOptionSelect
                    name="position"
                    value={empForm.position || ''}
                    onChange={handleEmpChange}
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
                    value={empForm.manager || ''}
                    onChange={handleEmpChange}
                    onFocus={() => setIsManagerDropdownOpen(true)}
                    className={cls.input}
                    placeholder="ค้นหาและเลือกหัวหน้างาน..."
                    autoComplete="off"
                  />
                  {isManagerDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1.5 bg-white ring-1 ring-slate-200 rounded-xl shadow-xl shadow-slate-950/10 max-h-56 overflow-y-auto">
                      {employees.filter(emp =>
                        emp.fullName?.toLowerCase().includes((empForm.manager || '').toLowerCase()) ||
                        emp.empId?.toLowerCase().includes((empForm.manager || '').toLowerCase())
                      ).map(emp => (
                        <div
                          key={emp.id}
                          className="px-4 py-2.5 hover:bg-blue-50/60 cursor-pointer text-sm border-b border-slate-50 last:border-b-0 transition-colors"
                          onClick={() => {
                            handleEmpChange({ target: { name: 'manager', value: emp.fullName } });
                            setIsManagerDropdownOpen(false);
                          }}
                        >
                          <div className="font-medium text-slate-800">{emp.fullName}</div>
                          <div className="text-[12.5px] text-slate-500 mt-0.5">{emp.empId} • {emp.department || 'ไม่ระบุแผนก'}</div>
                        </div>
                      ))}
                      {employees.filter(emp =>
                        emp.fullName?.toLowerCase().includes((empForm.manager || '').toLowerCase()) ||
                        emp.empId?.toLowerCase().includes((empForm.manager || '').toLowerCase())
                      ).length === 0 && (
                        <div className="p-3 text-center text-[13px] text-slate-500 font-medium">ไม่พบข้อมูลพนักงานในระบบ</div>
                      )}
                    </div>
                  )}
                </div>
              </Field>
            </section>

            {/* Microsoft 365 */}
            <section className="rounded-xl ring-1 ring-blue-100 bg-blue-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-[#1E487A]">
                <ShieldCheck className="h-4 w-4" strokeWidth={2} />
                <p className="text-[13px] font-semibold tracking-wide">บัญชี Microsoft 365</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="อีเมล Microsoft 365">
                  <input type="email" name="m365Email" value={empForm.m365Email || ''} onChange={handleEmpChange} className={cls.input} placeholder="user@domain.com" />
                </Field>
                <Field label="รหัสผ่าน Microsoft 365">
                  <input type="text" name="m365Password" value={empForm.m365Password || ''} onChange={handleEmpChange} className={cls.inputMono} placeholder="รหัสผ่าน" />
                </Field>
              </div>
            </section>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={close}>ยกเลิก</Button>
            <Button type="submit">บันทึกข้อมูลพนักงาน</Button>
          </ModalFooter>
        </form>
      ) : activeMenu === 'licenses' ? (
        <form onSubmit={handleAddLicense} className="flex flex-col flex-1 overflow-hidden">
          <ModalBody className="space-y-7">
            <section className="space-y-3">
              <SectionHeader>รูปภาพ</SectionHeader>
              <ImagePicker image={licenseImage} onRemove={() => setLicenseImage(null)} onUpload={handleLicenseImageUpload} />
            </section>

            <section className="space-y-4">
              <SectionHeader>ข้อมูลใบอนุญาต</SectionHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="ชื่อโปรแกรม" required>
                  <input type="text" name="name" value={licenseForm.name || ''} onChange={handleLicenseChange} required className={cls.input} placeholder="ระบุชื่อโปรแกรม..." />
                </Field>
                <Field label="จำนวนสิทธิ์ (Volume)" required>
                  <input type="number" min="1" name="quantity" value={licenseForm.quantity || 1} onChange={handleLicenseChange} required className={cls.input} />
                </Field>
              </div>
              <Field label="Product Key ใบอนุญาต">
                <input type="text" name="productKey" value={licenseForm.productKey || ''} onChange={handleLicenseChange} className={cls.inputMono} placeholder="เช่น A1B2-C3D4-E5F6" />
              </Field>
              <Field label="รหัสของ Product Key (อ้างอิง)">
                <input type="text" name="keyCode" value={licenseForm.keyCode || ''} onChange={handleLicenseChange} className={cls.input} placeholder="รหัสอ้างอิงของ Key" />
              </Field>
              <Field label="Supplier ที่ซื้อ">
                <input type="text" name="supplier" value={licenseForm.supplier || ''} onChange={handleLicenseChange} className={cls.input} placeholder="ชื่อร้านค้า/ตัวแทนจำหน่าย" />
              </Field>
            </section>

            <section className="space-y-4">
              <SectionHeader>การจัดซื้อ</SectionHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="วันที่ซื้อ">
                  <input type="date" name="purchaseDate" value={licenseForm.purchaseDate || ''} onChange={handleLicenseChange} className={cls.input} />
                </Field>
                <Field label="วันที่หมดอายุ">
                  <input type="date" name="expirationDate" value={licenseForm.expirationDate || ''} onChange={handleLicenseChange} className={cls.input} />
                </Field>
              </div>
              <Field label="ราคา (บาท)">
                <CostInput name="cost" value={licenseForm.cost || ''} onChange={handleLicenseChange} />
              </Field>
            </section>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={close}>ยกเลิก</Button>
            <Button type="submit">บันทึกข้อมูลใบอนุญาต</Button>
          </ModalFooter>
        </form>
      ) : (
        <form onSubmit={handleAdd} className="flex flex-col flex-1 overflow-hidden">
          <ModalBody className="space-y-7">
            <section className="space-y-3">
              <SectionHeader>รูปภาพอ้างอิง</SectionHeader>
              <ImagePicker image={assetImage} onRemove={() => setAssetImage(null)} onUpload={handleImageUpload} />
            </section>

            <section className="space-y-4">
              <SectionHeader>ข้อมูลทั่วไป</SectionHeader>
              <Field label="ชื่ออุปกรณ์ / รุ่น" required>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={cls.input} placeholder="ระบุชื่ออุปกรณ์..." required />
              </Field>
              <Field label="ประเภท">
                <FieldOptionSelect
                  value={type}
                  onChange={setType}
                  options={
                    activeMenu === 'assets'
                      ? ['คอมพิวเตอร์', 'หน้าจอ', 'แท็บเล็ต/มือถือ', 'อุปกรณ์เครือข่าย', 'อื่นๆ']
                      : activeMenu === 'office_supplies'
                        ? ['เครื่องเขียน', 'กระดาษ', 'แฟ้มและอุปกรณ์จัดเก็บ', 'เบ็ดเตล็ด']
                        : ['เมาส์ (Mouse)', 'คีย์บอร์ด (Keyboard)', 'สายชาร์จ (Adapter)', 'หูฟัง (Headset)', 'กระเป๋า (Bag)', 'อื่นๆ']
                  }
                  placeholder="เลือกประเภท..."
                  allowCustom={false}
                />
              </Field>
            </section>

            {activeMenu === 'assets' && (
              <section className="space-y-4">
                <SectionHeader>รายละเอียดทะเบียน</SectionHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="รหัสทรัพย์สิน">
                    <input type="text" value={assetTag} onChange={(e) => setAssetTag(e.target.value)} className={cls.inputMono} placeholder="เช่น AST-001" />
                  </Field>
                  <Field label="Serial Number">
                    <input type="text" value={sn} onChange={(e) => setSn(e.target.value)} className={cls.inputMono} />
                  </Field>
                  <Field label="ยี่ห้อ / รุ่น (Model)">
                    <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className={cls.input} />
                  </Field>
                  <Field label="บริษัท / ผู้ผลิต">
                    <FieldOptionSelect
                      value={company}
                      onChange={setCompany}
                      options={fieldOptions.companies || []}
                      placeholder="เลือกหรือพิมพ์ใหม่"
                    />
                  </Field>
                  <Field label="แผนก" required>
                    <FieldOptionSelect
                      value={assetDepartment}
                      onChange={setAssetDepartment}
                      options={fieldOptions.departments || []}
                      placeholder="เลือกหรือพิมพ์ใหม่"
                      required
                    />
                  </Field>
                  <Field label="ผู้จัดจำหน่าย (Vendor)">
                    <FieldOptionSelect
                      value={vendor}
                      onChange={setVendor}
                      options={fieldOptions.vendors || []}
                      placeholder="เลือกหรือพิมพ์ใหม่"
                    />
                  </Field>
                </div>
              </section>
            )}

            {activeMenu === 'assets' && (
              <section className="space-y-4">
                <SectionHeader>การจัดซื้อ</SectionHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="วันที่ซื้อ">
                    <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className={cls.input} />
                  </Field>
                  <Field label="วันที่หมด Warranty">
                    <input type="date" value={warrantyDate} onChange={(e) => setWarrantyDate(e.target.value)} className={cls.input} />
                  </Field>
                </div>
              </section>
            )}

            {activeMenu !== 'office_supplies' && (
              <section className="space-y-4">
                {activeMenu !== 'assets' && <SectionHeader>ราคา / จำนวน</SectionHeader>}
                <Field label="ราคา (บาท)">
                  <CostInput value={cost} onChange={(e) => setCost(e.target.value)} />
                </Field>
              </section>
            )}

            {activeMenu === 'office_supplies' ? (
              <section className="space-y-4">
                <SectionHeader>สต็อก</SectionHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="จำนวนเริ่มต้น" required>
                    <input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={cls.input} required />
                  </Field>
                  <Field label="หน่วยนับ" required>
                    <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className={cls.input} placeholder="เช่น ชิ้น, กล่อง, ด้าม..." required />
                  </Field>
                </div>
              </section>
            ) : activeMenu === 'accessories' && (
              <section className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="จำนวน (ชิ้น)" required>
                    <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={cls.input} placeholder="ระบุจำนวน..." required />
                  </Field>
                  <Field label="วันที่ซื้อ">
                    <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className={cls.input + ' text-slate-700'} />
                  </Field>
                </div>
                <Field label="ผู้จัดจำหน่าย (Vendor)" hint="ชื่อร้าน/บริษัทที่ซื้อมา">
                  <FieldOptionSelect
                    value={vendor || ''}
                    onChange={setVendor}
                    options={fieldOptions.vendors || []}
                    placeholder="เลือกหรือพิมพ์ใหม่"
                  />
                </Field>
                <Field label="หมายเหตุ / รายละเอียดเพิ่มเติม" hint="เช่น ข้อมูลการรับประกัน, ผู้ติดต่อ ฯลฯ">
                  <textarea value={note || ''} onChange={(e) => setNote(e.target.value)} rows={3} className={cls.input + ' resize-none'} placeholder="ใส่รายละเอียดที่ต้องการบันทึก..." />
                </Field>
              </section>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={close}>ยกเลิก</Button>
            <Button type="submit">บันทึกข้อมูล</Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/* ── Helpers ── */
function ImagePicker({ image, onRemove, onUpload }) {
  return (
    <div className="flex items-center gap-4">
      {image ? (
        <div className="relative shrink-0">
          <img src={image} alt="Preview" className="w-20 h-20 rounded-xl object-cover ring-1 ring-slate-200" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-1.5 -right-1.5 bg-white text-rose-500 ring-1 ring-rose-200 rounded-full w-6 h-6 flex items-center justify-center hover:bg-rose-50 transition-colors focus:outline-none shadow-sm"
            title="ลบรูปภาพ"
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
        type="file"
        accept="image/*"
        onChange={onUpload}
        className="flex-1 min-w-0 text-sm text-slate-500
          file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0
          file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700
          hover:file:bg-slate-200 file:cursor-pointer file:transition-colors"
      />
    </div>
  );
}

function CostInput({ value, onChange, name }) {
  return (
    <div className="relative">
      <input
        type="number"
        step="any"
        min="0"
        name={name}
        value={value}
        onChange={onChange}
        onWheel={(e) => e.target.blur()}
        onKeyDown={(e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
        className={cls.input + ' pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'}
        placeholder="0.00"
      />
      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">฿</span>
    </div>
  );
}
