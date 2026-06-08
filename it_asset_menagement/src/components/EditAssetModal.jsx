import React from 'react';
import FieldOptionSelect from './FieldOptionSelect.jsx';

const BRAND = '#1E487A';

function SectionHeader({ children }) {
  return (
    <div className="flex items-center gap-3 pt-2 first:pt-0">
      <span className="text-[12px] font-semibold tracking-[0.14em] text-slate-500 uppercase">{children}</span>
      <span className="flex-1 h-px bg-slate-200/80" />
    </div>
  );
}

function Field({ label, required, hint, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-[14px] font-medium text-slate-600 mb-1.5">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[12px] text-slate-400 mt-1.5 leading-snug">{hint}</p>}
    </div>
  );
}

const inputCls =
  'w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 ' +
  'placeholder:text-slate-400 outline-none transition-all ' +
  'hover:border-slate-300 focus:border-[#1E487A] focus:ring-2 focus:ring-[#1E487A]/15';

const monoCls = inputCls + ' font-mono tracking-tight';

const selectCls = inputCls + ' cursor-pointer pr-9 appearance-none bg-no-repeat bg-[right_0.75rem_center] ' +
  "bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 20 20' fill='none' stroke='%2364748b' stroke-width='2'><path d='M5 7l5 5 5-5'/></svg>\")]";

export default function EditAssetModal({
  editAssetModal,
  setEditAssetModal,
  handleUpdateAsset,
  handleEditAssetChange,
  fieldOptions = {},
}) {
  if (!editAssetModal.isOpen || !editAssetModal.data) return null;

  const isAssets = editAssetModal.collectionName === 'assets';
  const isSupplies = editAssetModal.collectionName === 'office_supplies';
  const isAccessories = editAssetModal.collectionName === 'accessories';

  const title = isAssets ? 'ทรัพย์สินหลัก' : isSupplies ? 'อุปกรณ์สำนักงาน' : 'อุปกรณ์เสริม';
  const subtitle = isAssets
    ? 'อัปเดตข้อมูลทะเบียนทรัพย์สิน รายละเอียดผู้ผลิต และสถานะ'
    : isSupplies
    ? 'อัปเดตจำนวนสต็อกและรายละเอียดสินค้า'
    : 'อัปเดตจำนวนคงเหลือและรายละเอียดอุปกรณ์';

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAssetModal(prev => ({ ...prev, data: { ...prev.data, image: reader.result } }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setEditAssetModal(prev => ({ ...prev, data: { ...prev.data, image: null } }));
  };

  const close = () => setEditAssetModal({ isOpen: false, data: null, collectionName: '' });

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] ring-1 ring-slate-200/60">
        {/* Header */}
        <div className="px-7 py-5 flex items-start justify-between border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${BRAND}10`, color: BRAND }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM19.5 13.5V19a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h5.5" />
              </svg>
            </div>
            <div>
              <h3 className="text-[18px] font-semibold text-slate-900 leading-tight">แก้ไข{title}</h3>
              <p className="text-[13.5px] text-slate-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={close}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors focus:outline-none"
            aria-label="ปิด"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleUpdateAsset} className="overflow-y-auto flex-1">
          <div className="px-7 py-6 space-y-7">

            {/* รูปภาพ */}
            <section className="space-y-3">
              <SectionHeader>รูปภาพอ้างอิง</SectionHeader>
              <div className="flex items-center gap-4">
                {editAssetModal.data.image ? (
                  <div className="relative shrink-0">
                    <img
                      src={editAssetModal.data.image}
                      alt="Preview"
                      className="w-20 h-20 rounded-xl object-cover ring-1 ring-slate-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-1.5 -right-1.5 bg-white text-rose-500 ring-1 ring-rose-200 rounded-full w-6 h-6 flex items-center justify-center hover:bg-rose-50 transition-colors focus:outline-none shadow-sm"
                      title="ลบรูปภาพ"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 ring-1 ring-dashed ring-slate-300 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="flex-1 min-w-0 text-sm text-slate-500
                    file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0
                    file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700
                    hover:file:bg-slate-200 file:cursor-pointer file:transition-colors"
                />
              </div>
            </section>

            {/* ข้อมูลทั่วไป */}
            <section className="space-y-4">
              <SectionHeader>ข้อมูลทั่วไป</SectionHeader>

              <Field label="ชื่ออุปกรณ์ / รุ่น" required>
                <input
                  type="text"
                  name="name"
                  value={editAssetModal.data.name || ''}
                  onChange={handleEditAssetChange}
                  required
                  className={inputCls}
                  placeholder="เช่น Dell Latitude 5520"
                />
              </Field>

              <Field label="ประเภท">
                <FieldOptionSelect
                  name="type"
                  value={editAssetModal.data.type || ''}
                  onChange={handleEditAssetChange}
                  options={
                    isAssets
                      ? ['คอมพิวเตอร์', 'โน๊ตบุ๊ค', 'หน้าจอ', 'แท็บเล็ต/มือถือ', 'อุปกรณ์สำนักงาน', 'อุปกรณ์เครือข่าย', 'อื่นๆ']
                      : isSupplies
                        ? ['เครื่องเขียน', 'กระดาษ', 'แฟ้มและอุปกรณ์จัดเก็บ', 'เบ็ดเตล็ด']
                        : ['เมาส์ (Mouse)', 'คีย์บอร์ด (Keyboard)', 'สายชาร์จ (Adapter)', 'หูฟัง (Headset)', 'กระเป๋า (Bag)', 'อื่นๆ']
                  }
                  placeholder="เลือกประเภท..."
                  allowCustom={false}
                />
              </Field>
            </section>

            {/* รายละเอียดทะเบียน (assets only) */}
            {isAssets && (
              <section className="space-y-4">
                <SectionHeader>รายละเอียดทะเบียน</SectionHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="รหัสทรัพย์สิน">
                    <input
                      type="text"
                      name="assetTag"
                      value={editAssetModal.data.assetTag || ''}
                      onChange={handleEditAssetChange}
                      className={monoCls}
                      placeholder="ASSET-0001"
                    />
                  </Field>
                  <Field label="Serial Number">
                    <input
                      type="text"
                      name="sn"
                      value={editAssetModal.data.sn || ''}
                      onChange={handleEditAssetChange}
                      className={monoCls}
                      placeholder="SN-XXXXXX"
                    />
                  </Field>
                  <Field label="ยี่ห้อ / รุ่น (Model)">
                    <input
                      type="text"
                      name="model"
                      value={editAssetModal.data.model || ''}
                      onChange={handleEditAssetChange}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="บริษัท / ผู้ผลิต">
                    <FieldOptionSelect
                      name="company"
                      value={editAssetModal.data.company || ''}
                      onChange={handleEditAssetChange}
                      options={fieldOptions.companies || []}
                      placeholder="เลือกหรือพิมพ์ใหม่"
                    />
                  </Field>
                  <Field label="สำหรับแผนก">
                    <FieldOptionSelect
                      name="forDepartment"
                      value={editAssetModal.data.forDepartment || ''}
                      onChange={handleEditAssetChange}
                      options={fieldOptions.forDepartments || []}
                      placeholder="เลือกหรือพิมพ์ใหม่"
                    />
                  </Field>
                  <Field label="ผู้จัดจำหน่าย (Vendor)">
                    <FieldOptionSelect
                      name="vendor"
                      value={editAssetModal.data.vendor || ''}
                      onChange={handleEditAssetChange}
                      options={fieldOptions.vendors || []}
                      placeholder="เลือกหรือพิมพ์ใหม่"
                    />
                  </Field>
                  {isAssets && (
                    <Field label="สถานะเครื่อง">
                      <div className="flex gap-2">
                        <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ring-1 ring-inset text-sm font-medium ${
                          (editAssetModal.data.purchaseCondition || 'new') === 'new'
                            ? 'bg-emerald-50 ring-2 ring-emerald-500 text-emerald-700'
                            : 'bg-white ring-slate-200 text-slate-600 hover:ring-slate-300 hover:bg-slate-50'
                        }`}>
                          <input type="radio" name="purchaseCondition" value="new" checked={(editAssetModal.data.purchaseCondition || 'new') === 'new'} onChange={handleEditAssetChange} className="sr-only" />
                          <span>✨ เครื่องใหม่</span>
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ring-1 ring-inset text-sm font-medium ${
                          editAssetModal.data.purchaseCondition === 'used'
                            ? 'bg-amber-50 ring-2 ring-amber-500 text-amber-700'
                            : 'bg-white ring-slate-200 text-slate-600 hover:ring-slate-300 hover:bg-slate-50'
                        }`}>
                          <input type="radio" name="purchaseCondition" value="used" checked={editAssetModal.data.purchaseCondition === 'used'} onChange={handleEditAssetChange} className="sr-only" />
                          <span>♻️ เครื่องเก่า / มือสอง</span>
                        </label>
                      </div>
                    </Field>
                  )}
                </div>
              </section>
            )}

            {/* การจัดซื้อและสถานะ (assets only) */}
            {isAssets && (
              <section className="space-y-4">
                <SectionHeader>การจัดซื้อและสถานะ</SectionHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="วันที่ซื้อ">
                    <input
                      type="date"
                      name="purchaseDate"
                      value={editAssetModal.data.purchaseDate || ''}
                      onChange={handleEditAssetChange}
                      className={inputCls + ' text-slate-700'}
                    />
                  </Field>
                  <Field label="วันที่หมด Warranty">
                    <input
                      type="date"
                      name="warrantyDate"
                      value={editAssetModal.data.warrantyDate || ''}
                      onChange={handleEditAssetChange}
                      className={inputCls + ' text-slate-700'}
                    />
                  </Field>
                  <Field label="ราคา (บาท)">
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        name="cost"
                        value={editAssetModal.data.cost || ''}
                        onChange={handleEditAssetChange}
                        onWheel={(e) => e.target.blur()}
                        onKeyDown={(e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                        className={inputCls + ' pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'}
                        placeholder="0.00"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">฿</span>
                    </div>
                  </Field>
                  <Field label="สถานะ">
                    <select
                      name="status"
                      value={editAssetModal.data.status || 'พร้อมใช้งาน'}
                      onChange={handleEditAssetChange}
                      className={selectCls}
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
            )}

            {/* office_supplies: stock */}
            {isSupplies && (
              <section className="space-y-4">
                <SectionHeader>สต็อก</SectionHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="สต็อกคงเหลือปัจจุบัน">
                    <input
                      type="number"
                      min="0"
                      name="quantity"
                      value={editAssetModal.data.quantity || 0}
                      onChange={handleEditAssetChange}
                      onWheel={(e) => e.target.blur()}
                      onKeyDown={(e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                      className={inputCls + ' [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'}
                    />
                  </Field>
                  <Field label="หน่วยนับ">
                    <input
                      type="text"
                      name="unit"
                      value={editAssetModal.data.unit || ''}
                      onChange={handleEditAssetChange}
                      className={inputCls}
                      placeholder="เช่น ชิ้น, กล่อง..."
                    />
                  </Field>
                </div>
              </section>
            )}

            {/* accessories: remaining */}
            {isAccessories && (
              <section className="space-y-4">
                <SectionHeader>คลังอุปกรณ์</SectionHeader>
                <Field
                  label="จำนวนคงเหลือปัจจุบัน (แก้ไขได้)"
                  hint='ระบุเฉพาะจำนวนที่ "อยู่ในคลังพร้อมเบิก" (ไม่รวมของที่พนักงานถืออยู่)'
                >
                  <input
                    type="number"
                    min="0"
                    name="remainingQuantity"
                    value={
                      editAssetModal.data.remainingQuantity !== undefined
                        ? editAssetModal.data.remainingQuantity
                        : (editAssetModal.data.quantity
                            ? (Number(editAssetModal.data.quantity) - (editAssetModal.data.assignees?.length || 0))
                            : (1 - (editAssetModal.data.assignees?.length || 0)))
                    }
                    onChange={handleEditAssetChange}
                    className={inputCls}
                  />
                </Field>
              </section>
            )}

            {/* accessories: vendor + note */}
            {isAccessories && (
              <section className="space-y-4">
                <SectionHeader>ข้อมูลผู้จัดจำหน่ายและหมายเหตุ</SectionHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="ผู้จัดจำหน่าย (Vendor)" hint="ชื่อร้านค้าหรือบริษัทที่ซื้อมา">
                    <FieldOptionSelect
                      name="vendor"
                      value={editAssetModal.data.vendor || ''}
                      onChange={handleEditAssetChange}
                      options={fieldOptions.vendors || []}
                      placeholder="เลือกหรือพิมพ์ใหม่"
                    />
                  </Field>
                  <Field label="วันที่ซื้อ">
                    <input
                      type="date"
                      name="purchaseDate"
                      value={editAssetModal.data.purchaseDate || ''}
                      onChange={handleEditAssetChange}
                      className={inputCls + ' text-slate-700'}
                    />
                  </Field>
                </div>
                <Field label="หมายเหตุ / รายละเอียดเพิ่มเติม" hint="เช่น ข้อมูลการรับประกัน, เงื่อนไขพิเศษ, ผู้ติดต่อ ฯลฯ">
                  <textarea
                    name="note"
                    value={editAssetModal.data.note || ''}
                    onChange={handleEditAssetChange}
                    rows={3}
                    className={inputCls + ' resize-none'}
                    placeholder="ใส่รายละเอียดที่ต้องการบันทึก..."
                  />
                </Field>
              </section>
            )}

            {/* ── หมายเหตุสำหรับ assets ── */}
            {isAssets && (
              <section className="space-y-4">
                <SectionHeader>หมายเหตุ</SectionHeader>
                <Field label="หมายเหตุ / รายละเอียดเพิ่มเติม" hint="เช่น ข้อมูลการรับประกัน, สภาพเครื่อง, ผู้ติดต่อ ฯลฯ">
                  <textarea
                    name="note"
                    value={editAssetModal.data.note || ''}
                    onChange={handleEditAssetChange}
                    rows={3}
                    className={inputCls + ' resize-none'}
                    placeholder="ใส่รายละเอียดที่ต้องการบันทึก..."
                  />
                </Field>
              </section>
            )}
          </div>

          {/* Footer */}
          <div className="px-7 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={close}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1"
              style={{ background: BRAND, boxShadow: `0 4px 14px ${BRAND}33` }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#163963')}
              onMouseLeave={(e) => (e.currentTarget.style.background = BRAND)}
            >
              บันทึกการแก้ไข
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
