import React from 'react';

export default function AddModal({
  isAddModalOpen, setIsAddModalOpen, activeMenu,
  handleAddEmployee, empForm, handleEmpChange,
  handleAddLicense, licenseForm, handleLicenseChange,
  handleAdd, name, setName, type, setType, cost, setCost, purchaseDate, setPurchaseDate, warrantyDate, setWarrantyDate, quantity, setQuantity,
  assetImage, setAssetImage, assetDepartment, setAssetDepartment,
  sn, setSn, company, setCompany, assetTag, setAssetTag, model, setModel, vendor, setVendor, assetDocument, setAssetDocument
}) {
  if (!isAddModalOpen) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAssetImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDocUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAssetDocument({ name: file.name, data: reader.result });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-opacity" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
        <div className="bg-indigo-600 text-white px-6 py-5 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="bg-white/20 p-1.5 rounded-lg text-sm">➕</span> เพิ่มรายการใหม่
          </h3>
          <button onClick={() => setIsAddModalOpen(false)} className="text-indigo-200 hover:text-white transition-colors focus:outline-none hover:bg-indigo-500 p-1.5 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          {activeMenu === 'employees' ? (
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
            <form onSubmit={handleAdd} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
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
                      className="flex-1 border border-slate-300 p-2 rounded-xl text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่ออุปกรณ์ / รุ่น <span className="text-red-500">*</span></label>
                  <input 
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm shadow-sm"
                    placeholder="ระบุชื่ออุปกรณ์..." required
                  />
                </div>

                {activeMenu === 'assets' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">รหัสทรัพย์สิน (Asset Tag)</label>
                      <input type="text" value={assetTag} onChange={(e) => setAssetTag(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm shadow-sm font-mono" placeholder="เช่น IT-NB-001" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Serial Number</label>
                      <input type="text" value={sn} onChange={(e) => setSn(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm shadow-sm font-mono" placeholder="SN อุปกรณ์" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">บริษัท</label>
                      <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm shadow-sm" placeholder="เช่น Globe Syndicate" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">แผนก <span className="text-red-500">*</span></label>
                      <select value={assetDepartment} onChange={(e) => setAssetDepartment(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white transition-all text-sm text-slate-700 shadow-sm cursor-pointer">
                        <option value="DX">DX</option><option value="BD">BD</option><option value="General">General</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">ยี่ห้อ / โมเดล (Model)</label>
                      <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm shadow-sm" placeholder="เช่น Lenovo ThinkPad T14" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">ผู้จัดจำหน่าย (Vendor)</label>
                      <input type="text" value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm shadow-sm" placeholder="ระบุชื่อร้านค้า/ผู้จัดจำหน่าย" />
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">ประเภท</label>
                  <select 
                    value={type} onChange={(e) => setType(e.target.value)}
                    className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white transition-all text-sm text-slate-700 shadow-sm cursor-pointer"
                  >
                    {activeMenu === 'assets' ? (
                      <><option value="คอมพิวเตอร์">คอมพิวเตอร์ (PC/Laptop)</option><option value="หน้าจอ">หน้าจอ (Monitor)</option><option value="แท็บเล็ต/มือถือ">แท็บเล็ต / มือถือ</option><option value="อุปกรณ์เครือข่าย">อุปกรณ์เครือข่าย (Network)</option><option value="อื่นๆ">อื่นๆ</option></>
                    ) : (
                      <><option value="เมาส์ (Mouse)">เมาส์ (Mouse)</option><option value="คีย์บอร์ด (Keyboard)">คีย์บอร์ด (Keyboard)</option><option value="สายชาร์จ (Adapter)">สายชาร์จ (Adapter)</option><option value="หูฟัง (Headset)">หูฟัง (Headset)</option><option value="กระเป๋า (Bag)">กระเป๋าใส่โน๊ตบุ๊ค</option><option value="อื่นๆ">อื่นๆ</option></>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">ราคา (บาท)</label>
                  <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm shadow-sm" placeholder="ระบุราคา..." />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่ซื้อ</label>
                  <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-600 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่หมด Warranty</label>
                  <input type="date" value={warrantyDate} onChange={(e) => setWarrantyDate(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-600 shadow-sm" />
                </div>

                {/* ช่องแนบไฟล์เอกสาร (แสดงเฉพาะหน้าทรัพย์สินหลัก) */}
                {activeMenu === 'assets' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">เอกสารที่เกี่ยวข้อง (PDF, ฯลฯ)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="file" onChange={handleDocUpload}
                        className="flex-1 border border-slate-300 p-2 rounded-xl text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                      />
                      {assetDocument && <span className="text-xs text-emerald-600 font-bold px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200 truncate max-w-[120px]" title={assetDocument.name}>✅ แนบสำเร็จ</span>}
                    </div>
                  </div>
                )}

                {activeMenu === 'accessories' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">จำนวน (ชิ้น) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                      className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm shadow-sm"
                      placeholder="ระบุจำนวน..." required
                    />
                  </div>
                )}
              </div>
              
              <div className="pt-4 shrink-0">
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]">
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