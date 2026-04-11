import React from 'react';

export default function ImportModal({
  isImportModalOpen,
  setIsImportModalOpen,
  handleDownloadTemplate,
  handleImportEmployees
}) {
  // ถ้า State เป็น false ไม่ต้องแสดงผล
  if (!isImportModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-opacity">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all flex flex-col border border-slate-100">
        <div className="bg-emerald-600 text-white px-6 py-5 flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="bg-white/20 p-1.5 rounded-lg text-sm">⬇️</span> นำเข้าข้อมูลพนักงาน
          </h3>
          <button onClick={() => setIsImportModalOpen(false)} className="text-emerald-100 hover:text-white focus:outline-none bg-emerald-700/50 hover:bg-emerald-700 p-1.5 rounded-xl transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 md:p-8 space-y-6">
          
          {/* ขั้นตอนที่ 1: โหลด Template */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-blue-100 text-blue-700 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shadow-sm">1</span>
              <h4 className="font-bold text-slate-800 text-base">ดาวน์โหลดไฟล์ต้นแบบ</h4>
            </div>
            <p className="text-sm text-slate-500 mb-4 pl-10">โหลดไฟล์ CSV (.csv) ที่มีหัวคอลัมน์ถูกต้อง เพื่อนำไปกรอกข้อมูลพนักงาน</p>
            <div className="pl-10">
              <button 
                onClick={handleDownloadTemplate}
                className="w-full bg-white border-2 border-blue-500 text-blue-600 px-4 py-3 rounded-xl text-sm font-bold hover:bg-blue-50 hover:border-blue-600 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                โหลด Template.csv
              </button>
            </div>
          </div>

          {/* ขั้นตอนที่ 2: อัปโหลดไฟล์ */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-emerald-100 text-emerald-700 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shadow-sm">2</span>
              <h4 className="font-bold text-slate-800 text-base">อัปโหลดไฟล์ข้อมูล</h4>
            </div>
            <p className="text-sm text-slate-500 mb-4 pl-10">เลือกไฟล์ CSV ที่กรอกข้อมูลเสร็จแล้ว ระบบจะนำเข้าข้อมูลทันที</p>
            <div className="pl-10">
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                id="excel-upload-modal" 
                onChange={handleImportEmployees}
              />
              <label 
                htmlFor="excel-upload-modal"
                className="w-full bg-emerald-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center justify-center gap-2 text-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                เลือกไฟล์เพื่อนำเข้า
              </label>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}