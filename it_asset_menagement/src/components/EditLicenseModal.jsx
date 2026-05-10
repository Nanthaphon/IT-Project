import React from 'react';

export default function EditLicenseModal({
  editLicenseModal,
  setEditLicenseModal,
  handleUpdateLicense,
  handleEditLicenseChange
}) {
  if (!editLicenseModal.isOpen || !editLicenseModal.data) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] transition-opacity" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
        <div className="bg-[#1E487A] text-white px-6 py-5 flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="bg-white/20 p-1.5 rounded-lg text-sm">✏️</span> แก้ไขข้อมูลโปรแกรม/License
          </h3>
          <button onClick={() => setEditLicenseModal({ isOpen: false, data: null })} className="text-blue-200 hover:text-white focus:outline-none bg-[#133257]/50 hover:bg-[#133257] p-1.5 rounded-xl transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleUpdateLicense} className="p-6 md:p-8 overflow-y-auto space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อโปรแกรม <span className="text-red-500">*</span></label>
            <input type="text" name="name" value={editLicenseModal.data.name || ''} onChange={handleEditLicenseChange} required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Product Key License</label>
            <input type="text" name="productKey" value={editLicenseModal.data.productKey || ''} onChange={handleEditLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all font-mono shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">รหัสของ Product Key</label>
            <input type="text" name="keyCode" value={editLicenseModal.data.keyCode || ''} onChange={handleEditLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Supplier ที่ซื้อ</label>
            <input type="text" name="supplier" value={editLicenseModal.data.supplier || ''} onChange={handleEditLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่ซื้อ</label>
              <input type="date" name="purchaseDate" value={editLicenseModal.data.purchaseDate || ''} onChange={handleEditLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all text-slate-600 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่หมดอายุ</label>
              <input type="date" name="expirationDate" value={editLicenseModal.data.expirationDate || ''} onChange={handleEditLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all text-slate-600 shadow-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">ราคา (บาท)</label>
            <input type="number" name="cost" value={editLicenseModal.data.cost || ''} onChange={handleEditLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">สถานะ</label>
            <select 
              name="status" 
              value={editLicenseModal.data.status || 'พร้อมใช้งาน'} 
              onChange={handleEditLicenseChange} 
              className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none bg-white text-sm text-slate-700 transition-all shadow-sm cursor-pointer"
            >
              <option value="พร้อมใช้งาน">พร้อมใช้งาน</option>
              <option value="ถูกใช้งาน">ถูกใช้งาน</option>
              <option value="ชำรุดเสียหาย">ชำรุดเสียหาย</option>
              <option value="ไม่สามารถใช้งานได้">ไม่สามารถใช้งานได้</option>
              <option value="รอดำเนินการ">รอดำเนินการ</option>
            </select>
          </div>
          <div className="flex gap-3 pt-5 border-t border-slate-100 mt-auto">
            <button type="button" onClick={() => setEditLicenseModal({ isOpen: false, data: null })} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-all shadow-sm">
              ยกเลิก
            </button>
            <button type="submit" className="flex-1 py-3 bg-[#1E487A] text-white rounded-xl hover:bg-[#133257] font-bold transition-all shadow-lg shadow-[#1E487A]/30">
              บันทึกการแก้ไข
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}