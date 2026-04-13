import React from 'react';

export default function EditAssetModal({
  editAssetModal,
  setEditAssetModal,
  handleUpdateAsset,
  handleEditAssetChange
}) {
  // ถ้า State เป็น false หรือไม่มีข้อมูลส่งมา จะไม่แสดงผล
  if (!editAssetModal.isOpen || !editAssetModal.data) return null;

  // ✅ ฟังก์ชันสำหรับเปลี่ยนรูปภาพตอนกดแก้ไข
  const handleEditImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // อัปเดต State รูปใหม่เข้าไปใน editAssetModal.data
        setEditAssetModal(prev => ({
          ...prev,
          data: { ...prev.data, image: reader.result }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] transition-opacity">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
        <div className="bg-amber-500 text-white px-6 py-5 flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="bg-black/10 p-1.5 rounded-lg text-sm">✏️</span> แก้ไข{editAssetModal.collectionName === 'assets' ? 'ทรัพย์สินหลัก' : 'อุปกรณ์เสริม'}
          </h3>
          <button 
            onClick={() => setEditAssetModal({ isOpen: false, data: null, collectionName: '' })} 
            className="text-amber-100 hover:text-white focus:outline-none bg-amber-600/50 hover:bg-amber-600 p-1.5 rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleUpdateAsset} className="p-6 md:p-8 overflow-y-auto space-y-5">
          
          {/* ✅ อัปโหลดหรือเปลี่ยนรูปภาพในหน้าแก้ไข */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">เปลี่ยนรูปภาพอ้างอิง</label>
            <div className="flex items-center gap-4">
              {editAssetModal.data.image ? (
                <img src={editAssetModal.data.image} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 border-dashed">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleEditImageUpload} 
                className="flex-1 border border-slate-300 p-2 rounded-xl text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่ออุปกรณ์ / รุ่น <span className="text-red-500">*</span></label>
            <input type="text" name="name" value={editAssetModal.data.name || ''} onChange={handleEditAssetChange} required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">ประเภท</label>
            <select name="type" value={editAssetModal.data.type || ''} onChange={handleEditAssetChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white text-sm text-slate-700 transition-all shadow-sm cursor-pointer">
              {editAssetModal.collectionName === 'assets' ? (
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
              name="cost"
              value={editAssetModal.data.cost || ''} 
              onChange={handleEditAssetChange} 
              className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" 
              placeholder="ระบุราคา..."
            />
          </div>
          {editAssetModal.collectionName === 'accessories' && (() => {
            const checkedOutCount = editAssetModal.data.assignees?.length || 0;
            const currentRemaining = Math.max(0, Number(editAssetModal.data.quantity || 1) - checkedOutCount);
            // ดึงค่า remainingQuantity ถ้ามีการพิมพ์แก้ หรือใช้ currentRemaining เป็นค่าตั้งต้น
            const displayValue = editAssetModal.data.remainingQuantity !== undefined ? editAssetModal.data.remainingQuantity : currentRemaining;
            const totalQuantity = Number(displayValue) + checkedOutCount;

            return (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">จำนวนคงเหลือ (ชิ้น)</label>
                <input 
                  type="number" 
                  name="remainingQuantity"
                  min="0"
                  value={displayValue || ''} 
                  onChange={handleEditAssetChange} 
                  className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" 
                  placeholder="ระบุจำนวนคงเหลือ..."
                />
                <p className="text-xs text-slate-500 mt-2 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                  * เบิกจ่ายไปแล้ว <span className="text-indigo-600 font-bold">{checkedOutCount}</span> ชิ้น (มีอุปกรณ์รวมทั้งหมด <span className="font-bold">{totalQuantity}</span> ชิ้น)
                </p>
              </div>
            );
          })()}
          {editAssetModal.collectionName !== 'accessories' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">สถานะ</label>
              <select 
                name="status" 
                value={editAssetModal.data.status || 'พร้อมใช้งาน'} 
                onChange={handleEditAssetChange} 
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white text-sm text-slate-700 transition-all shadow-sm cursor-pointer"
              >
                <option value="พร้อมใช้งาน">พร้อมใช้งาน</option>
                <option value="ถูกใช้งาน">ถูกใช้งาน</option>
                <option value="ชำรุดเสียหาย">ชำรุดเสียหาย</option>
                <option value="ไม่สามารถใช้งานได้">ไม่สามารถใช้งานได้</option>
                <option value="รอดำเนินการ">รอดำเนินการ</option>
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-5 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setEditAssetModal({ isOpen: false, data: null, collectionName: '' })} 
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-all"
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-bold transition-all shadow-lg shadow-amber-500/30"
            >
              บันทึกการแก้ไข
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}