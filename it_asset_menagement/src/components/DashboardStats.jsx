import React from 'react';

export default function DashboardStats({ assets = [], licenses = [], accessories = [], employees = [] }) {
  
  // ==============================
  // 1. คำนวณสถิติ ทรัพย์สินหลัก
  // ==============================
  const totalAssets = assets.length;
  const assetAvailable = assets.filter(a => !a.status || a.status === 'พร้อมใช้งาน').length;
  const assetInUse = assets.filter(a => a.status === 'ถูกใช้งาน').length;
  const assetBroken = assets.filter(a => a.status === 'ชำรุดเสียหาย' || a.status === 'ไม่สามารถใช้งานได้').length;
  const assetMaintenance = assets.filter(a => a.status === 'รอดำเนินการ').length;

  // ==============================
  // 2. คำนวณสถิติ อุปกรณ์เสริม
  // ==============================
  const accTotal = accessories.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const accUsed = accessories.reduce((sum, item) => sum + (item.assignees?.length || 0), 0);
  const accBroken = accessories.reduce((sum, item) => sum + (Number(item.brokenQuantity) || 0), 0);
  const accRemain = Math.max(0, accTotal - accUsed - accBroken);

  // ==============================
  // 3. คำนวณสถิติ โปรแกรม/License
  // ==============================
  const totalLicenses = licenses.length;
  const licAvailable = licenses.filter(l => !l.status || l.status === 'พร้อมใช้งาน').length;
  const licInUse = licenses.filter(l => l.status === 'ถูกใช้งาน').length;

  // ==============================
  // 4. คำนวณมูลค่าทรัพย์สินรวม
  // ==============================
  const calcValue = (arr) => arr.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  // สำหรับ Accessories เอา ราคา x จำนวนทั้งหมด
  const calcAccValue = (arr) => arr.reduce((sum, item) => sum + ((Number(item.cost) || 0) * (Number(item.quantity) || 0)), 0);

  const assetValue = calcValue(assets);
  const licValue = calcValue(licenses);
  const accValue = calcAccValue(accessories);
  const totalValue = assetValue + licValue + accValue;

  const formatCurrency = (val) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(val);
  const getPercent = (val, total) => total > 0 ? (val / total) * 100 : 0;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500" style={{ fontFamily: "'Prompt', sans-serif" }}>
      
      {/* 🟢 ส่วนที่ 1: การ์ดสรุปจำนวนรวม (Top Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* ทรัพย์สินหลัก */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-3xl shadow-lg shadow-blue-500/30 text-white flex items-center justify-between relative overflow-hidden transform hover:-translate-y-1 transition-all">
          <div className="relative z-10">
            <p className="text-blue-100 font-bold mb-1 text-sm tracking-wide">ทรัพย์สิน IT หลัก</p>
            <h4 className="text-4xl font-black">{totalAssets} <span className="text-base font-medium text-blue-200">เครื่อง</span></h4>
          </div>
          <div className="text-6xl opacity-20 absolute -right-2 -bottom-2 transform rotate-12 select-none">🖥️</div>
        </div>

        {/* License */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-6 rounded-3xl shadow-lg shadow-purple-500/30 text-white flex items-center justify-between relative overflow-hidden transform hover:-translate-y-1 transition-all">
          <div className="relative z-10">
            <p className="text-purple-100 font-bold mb-1 text-sm tracking-wide">โปรแกรม / License</p>
            <h4 className="text-4xl font-black">{totalLicenses} <span className="text-base font-medium text-purple-200">รายการ</span></h4>
          </div>
          <div className="text-6xl opacity-20 absolute -right-2 -bottom-2 transform -rotate-12 select-none">🔑</div>
        </div>

        {/* อุปกรณ์เสริม */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-6 rounded-3xl shadow-lg shadow-orange-500/30 text-white flex items-center justify-between relative overflow-hidden transform hover:-translate-y-1 transition-all">
          <div className="relative z-10">
            <p className="text-orange-100 font-bold mb-1 text-sm tracking-wide">อุปกรณ์เสริมทั้งหมด</p>
            <h4 className="text-4xl font-black">{accTotal} <span className="text-base font-medium text-orange-200">ชิ้น</span></h4>
          </div>
          <div className="text-6xl opacity-20 absolute -right-2 -bottom-2 transform rotate-12 select-none">🖱️</div>
        </div>

        {/* พนักงาน */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-3xl shadow-lg shadow-emerald-500/30 text-white flex items-center justify-between relative overflow-hidden transform hover:-translate-y-1 transition-all">
          <div className="relative z-10">
            <p className="text-emerald-100 font-bold mb-1 text-sm tracking-wide">พนักงานในระบบ</p>
            <h4 className="text-4xl font-black">{employees.length} <span className="text-base font-medium text-emerald-200">คน</span></h4>
          </div>
          <div className="text-6xl opacity-20 absolute -right-2 -bottom-2 transform -rotate-12 select-none">👥</div>
        </div>

      </div>

      {/* 🟢 ส่วนที่ 2: สัดส่วนสถานะการใช้งาน (Breakdown Details) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* สัดส่วนทรัพย์สินหลัก */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">📊</span> สัดส่วนสถานะ ทรัพย์สินหลัก
          </h3>
          
          {/* Progress Bar */}
          <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden mb-8 shadow-inner">
             <div style={{ width: `${getPercent(assetAvailable, totalAssets)}%` }} className="bg-emerald-500 hover:opacity-90 transition-all cursor-pointer" title={`พร้อมใช้งาน ${assetAvailable}`}></div>
             <div style={{ width: `${getPercent(assetInUse, totalAssets)}%` }} className="bg-amber-500 hover:opacity-90 transition-all cursor-pointer" title={`ถูกใช้งาน ${assetInUse}`}></div>
             <div style={{ width: `${getPercent(assetMaintenance, totalAssets)}%` }} className="bg-orange-500 hover:opacity-90 transition-all cursor-pointer" title={`รอดำเนินการ ${assetMaintenance}`}></div>
             <div style={{ width: `${getPercent(assetBroken, totalAssets)}%` }} className="bg-red-500 hover:opacity-90 transition-all cursor-pointer" title={`ชำรุดเสียหาย ${assetBroken}`}></div>
          </div>

          {/* Legend / Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-auto">
             <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center">
               <div className="text-[10px] text-emerald-600 font-bold mb-1 uppercase tracking-wide flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> พร้อมใช้</div>
               <div className="text-2xl font-black text-emerald-700">{assetAvailable}</div>
             </div>
             <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-center">
               <div className="text-[10px] text-amber-600 font-bold mb-1 uppercase tracking-wide flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> ถูกใช้งาน</div>
               <div className="text-2xl font-black text-amber-700">{assetInUse}</div>
             </div>
             <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 text-center">
               <div className="text-[10px] text-orange-600 font-bold mb-1 uppercase tracking-wide flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> รอจัดการ</div>
               <div className="text-2xl font-black text-orange-700">{assetMaintenance}</div>
             </div>
             <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 text-center">
               <div className="text-[10px] text-red-600 font-bold mb-1 uppercase tracking-wide flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> ชำรุด</div>
               <div className="text-2xl font-black text-red-700">{assetBroken}</div>
             </div>
          </div>
        </div>

        {/* สัดส่วนอุปกรณ์เสริม */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="p-2 bg-orange-50 text-orange-600 rounded-xl">📦</span> สัดส่วนสถานะ อุปกรณ์เสริม
          </h3>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 mt-auto mb-auto">
            {/* โดนัทชาร์ตจำลอง (ใช้ CSS วาด) */}
            <div className="relative w-32 h-32 rounded-full flex items-center justify-center border-[12px] border-slate-50 shadow-inner shrink-0" 
                 style={{
                   background: `conic-gradient(#10b981 0% ${getPercent(accRemain, accTotal)}%, #f59e0b ${getPercent(accRemain, accTotal)}% ${getPercent(accRemain, accTotal) + getPercent(accUsed, accTotal)}%, #ef4444 ${getPercent(accRemain, accTotal) + getPercent(accUsed, accTotal)}% 100%)`
                 }}>
               <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                 <span className="text-2xl font-black text-slate-800">{accTotal}</span>
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">ทั้งหมด</span>
               </div>
            </div>

            <div className="flex-1 w-full space-y-4">
              <div className="flex justify-between items-center bg-emerald-50/50 px-4 py-2.5 rounded-xl border border-emerald-100">
                <span className="text-sm font-bold text-emerald-700 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> คงเหลือ (คลัง)</span>
                <span className="font-black text-emerald-700 text-lg">{accRemain}</span>
              </div>
              <div className="flex justify-between items-center bg-amber-50/50 px-4 py-2.5 rounded-xl border border-amber-100">
                <span className="text-sm font-bold text-amber-700 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> ใช้งานไป</span>
                <span className="font-black text-amber-700 text-lg">{accUsed}</span>
              </div>
              <div className="flex justify-between items-center bg-red-50/50 px-4 py-2.5 rounded-xl border border-red-100">
                <span className="text-sm font-bold text-red-700 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> ชำรุด / เสีย</span>
                <span className="font-black text-red-700 text-lg">{accBroken}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 🟢 ส่วนที่ 3: สรุปมูลค่าและการจัดสรร (Bottom Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* มูลค่าทรัพย์สิน (กว้าง 2 ส่วน) */}
        <div className="lg:col-span-2 bg-slate-900 p-6 md:p-8 rounded-3xl shadow-xl text-white relative overflow-hidden flex flex-col justify-center">
          {/* วงกลมตกแต่งพื้นหลัง */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-32 w-48 h-48 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

          <div className="relative z-10">
            <h3 className="text-lg font-bold text-slate-300 mb-6 flex items-center gap-2">
              <span>💎</span> สรุปมูลค่าทรัพย์สินรวมในระบบ
            </h3>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 border-b border-slate-700 pb-8 mb-6">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">มูลค่ารวมทั้งหมด (Total Value)</p>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  {formatCurrency(totalValue)}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-indigo-400 mb-1 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 w-fit sm:ml-auto">คำนวณจากรายการที่มีการระบุราคา</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">💻 ทรัพย์สินหลัก</p>
                <p className="text-xl font-bold text-white">{formatCurrency(assetValue)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">🔑 License</p>
                <p className="text-xl font-bold text-white">{formatCurrency(licValue)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">🖱️ อุปกรณ์เสริม</p>
                <p className="text-xl font-bold text-white">{formatCurrency(accValue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* License Allocation */}
        <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">🔑</span> การจัดสรร License
          </h3>
          <div className="flex-1 flex flex-col justify-center gap-5">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">ทั้งหมด</p>
                <p className="text-xl font-black text-slate-700">{totalLicenses} รายการ</p>
              </div>
              <div className="text-2xl opacity-50">📑</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1 mb-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ว่าง</p>
                <p className="text-2xl font-black text-emerald-700">{licAvailable}</p>
              </div>
              <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wide flex items-center gap-1 mb-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> ถูกใช้งาน</p>
                <p className="text-2xl font-black text-purple-700">{licInUse}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}