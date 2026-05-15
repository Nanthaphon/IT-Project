import React, { useState, useRef, useEffect } from 'react';

export default function AddModal({
  isAddModalOpen, setIsAddModalOpen, activeMenu,
  handleAddEmployee, empForm, handleEmpChange,
  handleAddLicense, licenseForm, handleLicenseChange,
  handleAdd, name, setName, type, setType, cost, setCost, 
  purchaseDate, setPurchaseDate, warrantyDate, setWarrantyDate, 
  quantity, setQuantity, unit, setUnit, 
  assetImage, setAssetImage, assetDepartment, setAssetDepartment,
  sn, setSn, company, setCompany, assetTag, setAssetTag, model, setModel, vendor, setVendor,
  employees = [] // 🟢 รับข้อมูลพนักงานเข้ามาเพื่อใช้ใน Dropdown
}) {
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const managerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (managerRef.current && !managerRef.current.contains(event.target)) setIsManagerDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAddModalOpen) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAssetImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-opacity" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
        <div className="bg-[#1E487A] text-white px-6 py-5 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="bg-white/20 p-1.5 rounded-lg text-sm">➕</span> 
            เพิ่มรายการใหม่ ({activeMenu === 'employees' ? 'พนักงาน' : activeMenu === 'licenses' ? 'โปรแกรม/ใบอนุญาต' : activeMenu === 'accessories' ? 'อุปกรณ์เสริม' : activeMenu === 'office_supplies' ? 'อุปกรณ์สำนักงาน' : 'ทรัพย์สินหลัก'})
          </h3>
          <button onClick={() => setIsAddModalOpen(false)} className="text-blue-200 hover:text-white transition-colors focus:outline-none bg-[#133257]/50 hover:bg-[#133257] p-1.5 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          
          {activeMenu === 'employees' ? (
            <form onSubmit={handleAddEmployee} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">รหัสพนักงาน <span className="text-red-500">*</span></label>
                  <input type="text" name="empId" value={empForm.empId || ''} onChange={handleEmpChange} required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" placeholder="เช่น EMP001" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">รหัสบัตรประชาชน (ใช้เข้าสู่ระบบ) <span className="text-red-500">*</span></label>
                  <input type="password" name="nationalId" value={empForm.nationalId || ''} onChange={handleEmpChange} required maxLength="13" className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" placeholder="เลข 13 หลัก" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อ นามสกุล (TH) <span className="text-red-500">*</span></label>
                  <input type="text" name="fullName" value={empForm.fullName || ''} onChange={handleEmpChange} required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" placeholder="ชื่อ-นามสกุล" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อ นามสกุล (EN)</label>
                  <input type="text" name="fullNameEng" value={empForm.fullNameEng || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" placeholder="Firstname Lastname" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อเล่น</label>
                  <input type="text" name="nickname" value={empForm.nickname || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" placeholder="ชื่อเล่น" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">เบอร์โทร</label>
                  <input type="tel" name="phone" value={empForm.phone || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" placeholder="เบอร์โทรศัพท์" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                <input type="email" name="email" value={empForm.email || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" placeholder="อีเมลบริษัท" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">บริษัท</label>
                <input type="text" name="company" value={empForm.company || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" placeholder="ชื่อบริษัท" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">แผนก</label>
                  <input type="text" name="department" value={empForm.department || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" placeholder="แผนก" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">ตำแหน่ง</label>
                  <input type="text" name="position" value={empForm.position || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" placeholder="ตำแหน่งงาน" />
                </div>
              </div>

              {/* 🟢 อัปเดตช่องเลือกหัวหน้างานให้เป็นแบบค้นหารายชื่อจากระบบ */}
              <div ref={managerRef} className="relative">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อหัวหน้างาน</label>
                <div className="relative">
                  <input 
                    type="text" 
                    name="manager" 
                    value={empForm.manager || ''} 
                    onChange={handleEmpChange} 
                    onFocus={() => setIsManagerDropdownOpen(true)}
                    className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" 
                    placeholder="ค้นหาและเลือกหัวหน้างาน..." 
                    autoComplete="off"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                {isManagerDropdownOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {employees.filter(emp => emp.fullName?.toLowerCase().includes((empForm.manager || '').toLowerCase()) || emp.empId?.toLowerCase().includes((empForm.manager || '').toLowerCase())).map(emp => (
                      <div 
                        key={emp.id} 
                        className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm border-b border-slate-50 last:border-b-0 flex justify-between items-center"
                        onClick={() => {
                          handleEmpChange({ target: { name: 'manager', value: emp.fullName } });
                          setIsManagerDropdownOpen(false);
                        }}
                      >
                        <div>
                          <div className="font-bold text-slate-800">{emp.fullName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{emp.empId} • {emp.department || 'ไม่ระบุแผนก'}</div>
                        </div>
                      </div>
                    ))}
                    {employees.filter(emp => emp.fullName?.toLowerCase().includes((empForm.manager || '').toLowerCase()) || emp.empId?.toLowerCase().includes((empForm.manager || '').toLowerCase())).length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-500 font-medium">ไม่พบข้อมูลพนักงานในระบบ</div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Microsoft 365 ── */}
              <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-[#1E487A] flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                  บัญชี Microsoft 365
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">อีเมล Microsoft 365</label>
                    <input type="email" name="m365Email" value={empForm.m365Email || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm bg-white" placeholder="user@domain.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">รหัสผ่าน Microsoft 365</label>
                    <input type="text" name="m365Password" value={empForm.m365Password || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm bg-white font-mono" placeholder="รหัสผ่าน" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-[#1E487A] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#133257] shadow-lg shadow-[#1E487A]/30 transition-all active:scale-[0.98]">
                  บันทึกข้อมูลพนักงาน
                </button>
              </div>
            </form>
          ) : activeMenu === 'licenses' ? (
            <form onSubmit={handleAddLicense} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อโปรแกรม <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={licenseForm.name || ''} onChange={handleLicenseChange} required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" placeholder="ระบุชื่อโปรแกรม..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">จำนวนสิทธิ์ (Volume) <span className="text-red-500">*</span></label>
                  <input type="number" min="1" name="quantity" value={licenseForm.quantity || 1} onChange={handleLicenseChange} required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Product Key ใบอนุญาต</label>
                <input type="text" name="productKey" value={licenseForm.productKey || ''} onChange={handleLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all font-mono shadow-sm" placeholder="เช่น A1B2-C3D4-E5F6" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">รหัสของ Product Key (อ้างอิง)</label>
                <input type="text" name="keyCode" value={licenseForm.keyCode || ''} onChange={handleLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" placeholder="รหัสอ้างอิงของ Key" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Supplier ที่ซื้อ</label>
                <input type="text" name="supplier" value={licenseForm.supplier || ''} onChange={handleLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" placeholder="ชื่อร้านค้า/ตัวแทนจำหน่าย" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่ซื้อ</label>
                  <input type="date" name="purchaseDate" value={licenseForm.purchaseDate || ''} onChange={handleLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all text-slate-600 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่หมดอายุ</label>
                  <input type="date" name="expirationDate" value={licenseForm.expirationDate || ''} onChange={handleLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all text-slate-600 shadow-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ราคา (บาท)</label>
                <input type="number" step="any" min="0" name="cost" value={licenseForm.cost || ''} onChange={handleLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" placeholder="ระบุราคา..." />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-[#1E487A] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#133257] shadow-lg shadow-[#1E487A]/30 transition-all active:scale-[0.98]">
                  บันทึกข้อมูลใบอนุญาต
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdd} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">รูปภาพอ้างอิง</label>
                <div className="flex items-center gap-4">
                  {assetImage ? (
                    <img src={assetImage} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 border-dashed">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                  <input 
                    type="file" accept="image/*" onChange={handleImageUpload} 
                    className="flex-1 border border-slate-300 p-2 rounded-xl text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#1E487A] hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่ออุปกรณ์ / รุ่น <span className="text-red-500">*</span></label>
                <input 
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none transition-all text-sm shadow-sm"
                  placeholder="ระบุชื่ออุปกรณ์..." required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ประเภท</label>
                <select 
                  value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none bg-white transition-all text-sm text-slate-700 shadow-sm cursor-pointer"
                >
                  {activeMenu === 'assets' ? (
                    <><option value="คอมพิวเตอร์">คอมพิวเตอร์ (PC/Laptop)</option><option value="หน้าจอ">หน้าจอ (Monitor)</option><option value="แท็บเล็ต/มือถือ">แท็บเล็ต / มือถือ</option><option value="อุปกรณ์เครือข่าย">อุปกรณ์เครือข่าย (Network)</option><option value="อื่นๆ">อื่นๆ</option></>
                  ) : activeMenu === 'office_supplies' ? (
                    <><option value="เครื่องเขียน">เครื่องเขียน</option><option value="กระดาษ">กระดาษ</option><option value="แฟ้มและอุปกรณ์จัดเก็บ">แฟ้มและอุปกรณ์จัดเก็บ</option><option value="เบ็ดเตล็ด">เบ็ดเตล็ด</option></>
                  ) : (
                    <><option value="เมาส์ (Mouse)">เมาส์ (Mouse)</option><option value="คีย์บอร์ด (Keyboard)">คีย์บอร์ด (Keyboard)</option><option value="สายชาร์จ (Adapter)">สายชาร์จ (Adapter)</option><option value="หูฟัง (Headset)">หูฟัง (Headset)</option><option value="กระเป๋า (Bag)">กระเป๋าใส่โน๊ตบุ๊ค</option><option value="อื่นๆ">อื่นๆ</option></>
                  )}
                </select>
              </div>

              {activeMenu === 'assets' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">รหัสทรัพย์สิน</label>
                      <input type="text" value={assetTag} onChange={(e) => setAssetTag(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm font-mono" placeholder="เช่น AST-001" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Serial Number</label>
                      <input type="text" value={sn} onChange={(e) => setSn(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm font-mono" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">ยี่ห้อ/รุ่น (Model)</label>
                      <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">บริษัท</label>
                      <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">แผนก <span className="text-red-500">*</span></label>
                      <select 
                        value={assetDepartment} onChange={(e) => setAssetDepartment(e.target.value)}
                        className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none bg-white transition-all text-sm text-slate-700 shadow-sm cursor-pointer"
                      >
                        <option value="DX">DX</option>
                        <option value="BD">BD</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">ผู้จัดจำหน่าย (Vendor)</label>
                      <input type="text" value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5 mt-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่ซื้อ</label>
                      <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all text-slate-600 shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่หมด Warranty</label>
                      <input type="date" value={warrantyDate} onChange={(e) => setWarrantyDate(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all text-slate-600 shadow-sm" />
                    </div>
                  </div>
                </>
              )}

              {activeMenu !== 'office_supplies' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">ราคา (บาท)</label>
                  <input type="number" step="any" min="0" value={cost} onChange={(e) => setCost(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none transition-all text-sm shadow-sm" placeholder="ระบุราคา..." />
                </div>
              )}

              {activeMenu === 'office_supplies' ? (
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">จำนวนเริ่มต้น <span className="text-red-500">*</span></label>
                    <input 
                      type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                      className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none transition-all text-sm shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">หน่วยนับ <span className="text-red-500">*</span></label>
                    <input 
                      type="text" value={unit} onChange={(e) => setUnit(e.target.value)}
                      className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none transition-all text-sm shadow-sm"
                      placeholder="เช่น ชิ้น, กล่อง, ด้าม..." required
                    />
                  </div>
                </div>
              ) : activeMenu === 'accessories' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">จำนวน (ชิ้น) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                    className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none transition-all text-sm shadow-sm"
                    placeholder="ระบุจำนวน..." required
                  />
                </div>
              )}
              
              <div className="pt-2 shrink-0">
                <button type="submit" className="w-full bg-[#1E487A] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#133257] shadow-lg shadow-[#1E487A]/30 transition-all active:scale-[0.98]">
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}