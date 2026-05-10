import React from 'react';

export default function DashboardStats({ assets = [], licenses = [], accessories = [], employees = [] }) {
  
  // โค้ดคำนวณสถิติระบบเดิม 100% ไม่มีการแก้ไข
  const totalAssets = assets.length;
  const assetAvailable = assets.filter(a => !a.status || a.status === 'พร้อมใช้งาน').length;
  const assetInUse = assets.filter(a => a.status === 'ถูกใช้งาน').length;
  const assetBroken = assets.filter(a => a.status === 'ชำรุดเสียหาย' || a.status === 'ไม่สามารถใช้งานได้').length;
  const assetMaintenance = assets.filter(a => a.status === 'รอดำเนินการ').length;

  const accTotal = accessories.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const accUsed = accessories.reduce((sum, item) => sum + (item.assignees?.length || 0), 0);
  const accBroken = accessories.reduce((sum, item) => sum + (Number(item.brokenQuantity) || 0), 0);
  const accRemain = Math.max(0, accTotal - accUsed - accBroken);

  const totalLicenses = licenses.length;
  const licAvailable = licenses.filter(l => !l.status || l.status === 'พร้อมใช้งาน').length;
  const licInUse = licenses.filter(l => l.status === 'ถูกใช้งาน').length;

  const calcValue = (arr) => arr.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const calcAccValue = (arr) => arr.reduce((sum, item) => sum + ((Number(item.cost) || 0) * (Number(item.quantity) || 0)), 0);

  const assetValue = calcValue(assets);
  const licValue = calcValue(licenses);
  const accValue = calcAccValue(accessories);
  const totalValue = assetValue + licValue + accValue;

  const formatCurrency = (val) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(val);
  const getPercent = (val, total) => total > 0 ? (val / total) * 100 : 0;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500" style={{ fontFamily: "'Prompt', sans-serif" }}>
      
      {/* 🟢 การ์ดสรุปจำนวนรวม (Theme: ขาวขอบน้ำเงิน + ไอคอนพื้นหลังแบบเก่า) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#1E487A] relative overflow-hidden flex items-center justify-between">
          <div className="relative z-10">
            <p className="text-slate-500 font-bold mb-1 text-sm tracking-wide">ทรัพย์สิน IT หลัก</p>
            <h4 className="text-4xl font-black text-[#1E487A]">{totalAssets} <span className="text-base font-medium text-slate-400">เครื่อง</span></h4>
          </div>
          <div className="text-7xl opacity-[0.08] absolute -right-4 -bottom-4 transform rotate-12 select-none pointer-events-none">🖥️</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#1E487A] relative overflow-hidden flex items-center justify-between">
          <div className="relative z-10">
            <p className="text-slate-500 font-bold mb-1 text-sm tracking-wide">โปรแกรม / ใบอนุญาต</p>
            <h4 className="text-4xl font-black text-[#1E487A]">{totalLicenses} <span className="text-base font-medium text-slate-400">รายการ</span></h4>
          </div>
          <div className="text-7xl opacity-[0.08] absolute -right-4 -bottom-4 transform -rotate-12 select-none pointer-events-none">🔑</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#1E487A] relative overflow-hidden flex items-center justify-between">
          <div className="relative z-10">
            <p className="text-slate-500 font-bold mb-1 text-sm tracking-wide">อุปกรณ์เสริมทั้งหมด</p>
            <h4 className="text-4xl font-black text-[#1E487A]">{accTotal} <span className="text-base font-medium text-slate-400">ชิ้น</span></h4>
          </div>
          <div className="text-7xl opacity-[0.08] absolute -right-4 -bottom-4 transform rotate-12 select-none pointer-events-none">🖱️</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#1E487A] relative overflow-hidden flex items-center justify-between">
          <div className="relative z-10">
            <p className="text-slate-500 font-bold mb-1 text-sm tracking-wide">พนักงานในระบบ</p>
            <h4 className="text-4xl font-black text-[#1E487A]">{employees.length} <span className="text-base font-medium text-slate-400">คน</span></h4>
          </div>
          <div className="text-7xl opacity-[0.08] absolute -right-4 -bottom-4 transform -rotate-12 select-none pointer-events-none">👥</div>
        </div>
      </div>

      {/* 🟢 สัดส่วนสถานะการใช้งาน */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* สัดส่วนทรัพย์สินหลัก */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
          <h3 className="text-lg font-bold text-[#1E487A] mb-6 flex items-center gap-2">
            <span className="p-2 bg-slate-100 rounded-lg">📊</span> สัดส่วนสถานะ: ทรัพย์สินหลัก
          </h3>
          
          <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden mb-8">
             <div style={{ width: `${getPercent(assetAvailable, totalAssets)}%` }} className="bg-emerald-500 hover:opacity-90 transition-all cursor-pointer"></div>
             <div style={{ width: `${getPercent(assetInUse, totalAssets)}%` }} className="bg-amber-500 hover:opacity-90 transition-all cursor-pointer"></div>
             <div style={{ width: `${getPercent(assetMaintenance, totalAssets)}%` }} className="bg-orange-500 hover:opacity-90 transition-all cursor-pointer"></div>
             <div style={{ width: `${getPercent(assetBroken, totalAssets)}%` }} className="bg-red-500 hover:opacity-90 transition-all cursor-pointer"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-auto">
             <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
               <div className="text-[10px] text-slate-500 font-bold mb-1 flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> พร้อมใช้</div>
               <div className="text-xl font-black text-slate-800">{assetAvailable}</div>
             </div>
             <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
               <div className="text-[10px] text-slate-500 font-bold mb-1 flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> ถูกใช้งาน</div>
               <div className="text-xl font-black text-slate-800">{assetInUse}</div>
             </div>
             <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
               <div className="text-[10px] text-slate-500 font-bold mb-1 flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> รอจัดการ</div>
               <div className="text-xl font-black text-slate-800">{assetMaintenance}</div>
             </div>
             <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
               <div className="text-[10px] text-slate-500 font-bold mb-1 flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> ชำรุด</div>
               <div className="text-xl font-black text-slate-800">{assetBroken}</div>
             </div>
          </div>
        </div>

        {/* สัดส่วนอุปกรณ์เสริม */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
          <h3 className="text-lg font-bold text-[#1E487A] mb-6 flex items-center gap-2">
            <span className="p-2 bg-slate-100 rounded-lg">📦</span> สัดส่วนสถานะ: อุปกรณ์เสริม
          </h3>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 mt-auto mb-auto">
            <div className="relative w-32 h-32 rounded-full flex items-center justify-center border-8 border-slate-50 shrink-0" 
                 style={{ background: `conic-gradient(#10b981 0% ${getPercent(accRemain, accTotal)}%, #f59e0b ${getPercent(accRemain, accTotal)}% ${getPercent(accRemain, accTotal) + getPercent(accUsed, accTotal)}%, #ef4444 ${getPercent(accRemain, accTotal) + getPercent(accUsed, accTotal)}% 100%)` }}>
               <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                 <span className="text-xl font-black text-slate-800">{accTotal}</span>
                 <span className="text-[9px] font-bold text-slate-400 uppercase">ทั้งหมด</span>
               </div>
            </div>

            <div className="flex-1 w-full space-y-3">
              <div className="flex justify-between items-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                <span className="text-sm font-bold text-slate-600 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> คงเหลือ (คลัง)</span>
                <span className="font-black text-slate-800 text-base">{accRemain}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                <span className="text-sm font-bold text-slate-600 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500"></span> ใช้งานไป</span>
                <span className="font-black text-slate-800 text-base">{accUsed}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                <span className="text-sm font-bold text-slate-600 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> ชำรุด / เสีย</span>
                <span className="font-black text-slate-800 text-base">{accBroken}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🟢 สรุปมูลค่าและการจัดสรร */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* มูลค่าทรัพย์สิน (ไฮไลต์สีน้ำเงินเข้มตามโลโก้) */}
        <div className="lg:col-span-2 bg-[#1E487A] p-6 md:p-8 rounded-2xl shadow-lg text-white relative overflow-hidden flex flex-col justify-center">
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span>💎</span> สรุปมูลค่าทรัพย์สินรวมในระบบ
            </h3>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 border-b border-white/20 pb-8 mb-6">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">มูลค่ารวมทั้งหมด (Total Value)</p>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
                  {formatCurrency(totalValue)}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-blue-200 bg-white/10 px-4 py-2 rounded-lg w-fit sm:ml-auto">คำนวณจากรายการที่มีการระบุราคา</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-blue-200 font-bold mb-1">💻 ทรัพย์สินหลัก</p>
                <p className="text-xl font-bold text-white">{formatCurrency(assetValue)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200 font-bold mb-1">🔑 ใบอนุญาต</p>
                <p className="text-xl font-bold text-white">{formatCurrency(licValue)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200 font-bold mb-1">🖱️ อุปกรณ์เสริม</p>
                <p className="text-xl font-bold text-white">{formatCurrency(accValue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* License Allocation */}
        <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-lg font-bold text-[#1E487A] mb-6 flex items-center gap-2">
            <span className="p-2 bg-slate-100 rounded-lg">🔑</span> การจัดสรรใบอนุญาต
          </h3>
          <div className="flex-1 flex flex-col justify-center gap-4">
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">ทั้งหมด</p>
                <p className="text-2xl font-black text-slate-800">{totalLicenses} <span className="text-sm font-medium text-slate-400">รายการ</span></p>
              </div>
              <div className="text-2xl opacity-30">📑</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ว่าง</p>
                <p className="text-2xl font-black text-slate-800">{licAvailable}</p>
              </div>
              <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> ถูกใช้งาน</p>
                <p className="text-2xl font-black text-slate-800">{licInUse}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}