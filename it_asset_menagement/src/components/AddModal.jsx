import React from 'react';

export default function AddModal({
  isAddModalOpen, setIsAddModalOpen, activeMenu,
  // Props สำหรับพนักงาน
  handleAddEmployee, empForm, handleEmpChange,
  // Props สำหรับ License
  handleAddLicense, licenseForm, handleLicenseChange,
  // Props สำหรับ ทรัพย์สินและอุปกรณ์
  handleAdd, name, setName, type, setType, cost, setCost, quantity, setQuantity
}) {
  
  // ถ้า State เป็น false ไม่ต้องแสดง Modal
  if (!isAddModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-opacity">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
        <div className="bg-indigo-600 text-white px-6 py-5 flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="bg-white/20 p-1.5 rounded-lg">➕</span> เพิ่มรายการใหม่
          </h3>
          <button onClick={() => setIsAddModalOpen(false)} className="text-indigo-200 hover:text-white transition-colors focus:outline-none bg-indigo-700/50 hover:bg-indigo-700 p-1.5 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 md:p-8 overflow-y-auto">
          {activeMenu === 'employees' ? (
            // ฟอร์มพนักงาน
            <form onSubmit={handleAddEmployee} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">รหัสพนักงาน <span className="text-red-500">*</span></label>
                <input type="text" name="empId" value={empForm.empId || ''} onChange={handleEmpChange} required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="เช่น EMP001" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อ นามสกุล (TH) <span className="text-red-500">*</span></label>
                  <input type="text" name="fullName" value={empForm.fullName || ''} onChange={handleEmpChange} required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="ชื่อ-นามสกุล" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อ นามสกุล (EN)</label>
                  <input type="text" name="fullNameEng" value={empForm.fullNameEng || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="Firstname Lastname" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อเล่น</label>
                  <input type="text" name="nickname" value={empForm.nickname || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="ชื่อเล่น" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">เบอร์โทร</label>
                  <input type="tel" name="phone" value={empForm.phone || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="เบอร์โทรศัพท์" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                <input type="email" name="email" value={empForm.email || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="อีเมลบริษัท" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">บริษัท</label>
                <input type="text" name="company" value={empForm.company || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="ชื่อบริษัท" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">แผนก</label>
                  <input type="text" name="department" value={empForm.department || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="แผนก" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">ตำแหน่ง</label>
                  <input type="text" name="position" value={empForm.position || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="ตำแหน่งงาน" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อหัวหน้างาน</label>
                <input type="text" name="manager" value={empForm.manager || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="หัวหน้างาน" />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]">
                  บันทึกข้อมูลพนักงาน
                </button>
              </div>
            </form>
          ) : activeMenu === 'licenses' ? (
            // ฟอร์มโปรแกรม/License
            <form onSubmit={handleAddLicense} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อโปรแกรม <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={licenseForm.name || ''} onChange={handleLicenseChange} required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="ระบุชื่อโปรแกรม..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Product Key License</label>
                <input type="text" name="productKey" value={licenseForm.productKey || ''} onChange={handleLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all font-mono shadow-sm" placeholder="เช่น A1B2-C3D4-E5F6" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">รหัสของ Product Key</label>
                <input type="text" name="keyCode" value={licenseForm.keyCode || ''} onChange={handleLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="รหัสอ้างอิงของ Key" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Supplier ที่ซื้อ</label>
                <input type="text" name="supplier" value={licenseForm.supplier || ''} onChange={handleLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="ชื่อร้านค้า/ตัวแทนจำหน่าย" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่ซื้อ</label>
                  <input type="date" name="purchaseDate" value={licenseForm.purchaseDate || ''} onChange={handleLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all text-slate-600 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่หมดอายุ</label>
                  <input type="date" name="expirationDate" value={licenseForm.expirationDate || ''} onChange={handleLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all text-slate-600 shadow-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ราคา (บาท)</label>
                <input type="number" name="cost" value={licenseForm.cost || ''} onChange={handleLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="ระบุราคา..." />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]">
                  บันทึกข้อมูล License
                </button>
              </div>
            </form>
          ) : (
            // ฟอร์มทรัพย์สิน / อุปกรณ์เสริม
            <form onSubmit={handleAdd} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่ออุปกรณ์ / รุ่น <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm shadow-sm"
                  placeholder="ระบุชื่ออุปกรณ์..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ประเภท</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white transition-all text-sm text-slate-700 shadow-sm cursor-pointer"
                >
                  {activeMenu === 'assets' ? (
                    <>
                      <option value="คอมพิวเตอร์">คอมพิวเตอร์ (PC/Laptop)</option>
                      <option value="หน้าจอ">หน้าจอ (Monitor)</option>
                      <option value="แท็บเล็ต/มือถือ">แท็บเล็ต / มือถือ</option>
                      <option value="อุปกรณ์เครือข่าย">อุปกรณ์เครือข่าย (Network)</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </>
                  ) : (
                    <>
                      <option value="เมาส์ (Mouse)">เมาส์ (Mouse)</option>
                      <option value="คีย์บอร์ด (Keyboard)">คีย์บอร์ด (Keyboard)</option>
                      <option value="สายชาร์จ (Adapter)">สายชาร์จ (Adapter)</option>
                      <option value="หูฟัง (Headset)">หูฟัง (Headset)</option>
                      <option value="กระเป๋า (Bag)">กระเป๋าใส่โน๊ตบุ๊ค</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ราคา (บาท)</label>
                <input 
                  type="number" 
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm shadow-sm"
                  placeholder="ระบุราคา..."
                />
              </div>

              {/* แสดงช่องกรอก "จำนวน" เฉพาะในเมนูอุปกรณ์เสริมเท่านั้น */}
              {activeMenu === 'accessories' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">จำนวน (ชิ้น) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm shadow-sm"
                    placeholder="ระบุจำนวน..."
                    required
                  />
                </div>
              )}
              
              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
                >
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