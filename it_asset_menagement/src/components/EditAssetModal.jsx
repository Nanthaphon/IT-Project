import React from 'react';

export default function EditAssetModal({
  editAssetModal,
  setEditAssetModal,
  handleUpdateAsset,
  handleEditAssetChange
}) {
  if (!editAssetModal.isOpen || !editAssetModal.data) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] transition-opacity" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
        <div className="bg-amber-500 text-white px-6 py-5 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="bg-black/10 p-1.5 rounded-lg text-sm">✏️</span> แก้ไขข้อมูล{editAssetModal.collectionName === 'assets' ? 'ทรัพย์สินหลัก' : 'อุปกรณ์เสริม'}
          </h3>
          <button onClick={() => setEditAssetModal({ isOpen: false, data: null, collectionName: '' })} className="text-amber-100 hover:text-white focus:outline-none bg-amber-600/50 hover:bg-amber-600 p-1.5 rounded-xl transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleUpdateAsset} className="p-6 md:p-8 overflow-y-auto space-y-5 flex-1">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่ออุปกรณ์ / รุ่น <span className="text-red-500">*</span></label>
            <input type="text" name="name" value={editAssetModal.data.name || ''} onChange={handleEditAssetChange} required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">ประเภท</label>
            <select name="type" value={editAssetModal.data.type || ''} onChange={handleEditAssetChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white text-sm text-slate-700 transition-all shadow-sm cursor-pointer">
              {editAssetModal.collectionName === 'assets' ? (
                <><option value="คอมพิวเตอร์">คอมพิวเตอร์ (PC/Laptop)</option><option value="หน้าจอ">หน้าจอ (Monitor)</option><option value="แท็บเล็ต/มือถือ">แท็บเล็ต / มือถือ</option><option value="อุปกรณ์เครือข่าย">อุปกรณ์เครือข่าย (Network)</option><option value="อื่นๆ">อื่นๆ</option></>
              ) : (
                <><option value="เมาส์ (Mouse)">เมาส์ (Mouse)</option><option value="คีย์บอร์ด (Keyboard)">คีย์บอร์ด (Keyboard)</option><option value="สายชาร์จ (Adapter)">สายชาร์จ (Adapter)</option><option value="หูฟัง (Headset)">หูฟัง (Headset)</option><option value="กระเป๋า (Bag)">กระเป๋าใส่โน๊ตบุ๊ค</option><option value="อื่นๆ">อื่นๆ</option></>
              )}
            </select>
          </div>

          {/* ฟิลด์ข้อมูลเพิ่มเติมสำหรับทรัพย์สินหลัก */}
          {editAssetModal.collectionName === 'assets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">รหัสทรัพย์สิน</label>
                <input type="text" name="assetTag" value={editAssetModal.data.assetTag || ''} onChange={handleEditAssetChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm font-mono" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Serial Number</label>
                <input type="text" name="sn" value={editAssetModal.data.sn || ''} onChange={handleEditAssetChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm font-mono" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">บริษัท</label>
                <input type="text" name="company" value={editAssetModal.data.company || ''} onChange={handleEditAssetChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">แผนก <span className="text-red-500">*</span></label>
                <select 
                  name="department" 
                  value={editAssetModal.data.department || 'DX'} 
                  onChange={handleEditAssetChange} 
                  className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white text-sm text-slate-700 transition-all shadow-sm cursor-pointer"
                >
                  <option value="DX">DX</option>
                  <option value="BD">BD</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ยี่ห้อ / โมเดล</label>
                <input type="text" name="model" value={editAssetModal.data.model || ''} onChange={handleEditAssetChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ผู้จัดจำหน่าย (Vendor)</label>
                <input type="text" name="vendor" value={editAssetModal.data.vendor || ''} onChange={handleEditAssetChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">ราคา (บาท)</label>
            <input type="number" name="cost" value={editAssetModal.data.cost || ''} onChange={handleEditAssetChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่ซื้อ</label>
              <input type="date" name="purchaseDate" value={editAssetModal.data.purchaseDate || ''} onChange={handleEditAssetChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all text-slate-600 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่หมด Warranty</label>
              <input type="date" name="warrantyDate" value={editAssetModal.data.warrantyDate || ''} onChange={handleEditAssetChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all text-slate-600 shadow-sm" />
            </div>
          </div>
          
          {editAssetModal.collectionName === 'accessories' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">จำนวนคงเหลือปัจจุบัน (แก้ไขได้)</label>
              <input type="number" min="0" name="remainingQuantity" value={editAssetModal.data.remainingQuantity !== undefined ? editAssetModal.data.remainingQuantity : (editAssetModal.data.quantity ? (Number(editAssetModal.data.quantity) - (editAssetModal.data.assignees?.length || 0)) : (1 - (editAssetModal.data.assignees?.length || 0)))} onChange={handleEditAssetChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
              <p className="text-xs text-slate-500 mt-1">ระบุเฉพาะจำนวนที่ "อยู่ในคลังพร้อมเบิก" (ไม่รวมของที่พนักงานถืออยู่)</p>
            </div>
          )}

          {editAssetModal.collectionName === 'assets' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">สถานะ</label>
              <select name="status" value={editAssetModal.data.status || 'พร้อมใช้งาน'} onChange={handleEditAssetChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white text-sm text-slate-700 transition-all shadow-sm cursor-pointer">
                <option value="พร้อมใช้งาน">พร้อมใช้งาน</option>
                <option value="ถูกใช้งาน">ถูกใช้งาน</option>
                <option value="ชำรุดเสียหาย">ชำรุดเสียหาย</option>
                <option value="ไม่สามารถใช้งานได้">ไม่สามารถใช้งานได้</option>
                <option value="รอดำเนินการ">รอดำเนินการ</option>
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-5 border-t border-slate-100 shrink-0 mt-auto">
            <button type="button" onClick={() => setEditAssetModal({ isOpen: false, data: null, collectionName: '' })} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-all shadow-sm">
              ยกเลิก
            </button>
            <button type="submit" className="flex-1 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-bold transition-all shadow-lg shadow-amber-500/30">
              บันทึกการแก้ไข
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}