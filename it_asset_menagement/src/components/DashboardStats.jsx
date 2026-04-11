import React from 'react';

export default function DashboardStats({ assets, licenses, accessories, employees }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* การ์ดสรุปทรัพย์สินหลัก */}
        <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border border-slate-100 border-l-4 border-l-blue-500 flex items-center justify-between transition-all duration-300 transform hover:-translate-y-1">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">ทรัพย์สินหลัก</p>
            <h4 className="text-3xl font-black text-slate-800">
              {assets.length} <span className="text-sm font-normal text-slate-400">เครื่อง</span>
            </h4>
          </div>
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-3xl shadow-inner">🖥️</div>
        </div>

        {/* การ์ดสรุปโปรแกรม/License */}
        <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border border-slate-100 border-l-4 border-l-purple-500 flex items-center justify-between transition-all duration-300 transform hover:-translate-y-1">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">โปรแกรม/License</p>
            <h4 className="text-3xl font-black text-slate-800">
              {licenses.length} <span className="text-sm font-normal text-slate-400">รายการ</span>
            </h4>
          </div>
          <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center text-3xl shadow-inner">🔑</div>
        </div>

        {/* การ์ดสรุปอุปกรณ์เสริม */}
        <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border border-slate-100 border-l-4 border-l-orange-500 flex items-center justify-between transition-all duration-300 transform hover:-translate-y-1">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">อุปกรณ์เสริม</p>
            <h4 className="text-3xl font-black text-slate-800">
              {accessories.length} <span className="text-sm font-normal text-slate-400">รายการ</span>
            </h4>
          </div>
          <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-3xl shadow-inner">🖱️</div>
        </div>

        {/* การ์ดสรุปพนักงาน */}
        <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border border-slate-100 border-l-4 border-l-emerald-500 flex items-center justify-between transition-all duration-300 transform hover:-translate-y-1">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">พนักงานในระบบ</p>
            <h4 className="text-3xl font-black text-slate-800">
              {employees.length} <span className="text-sm font-normal text-slate-400">คน</span>
            </h4>
          </div>
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-3xl shadow-inner">👥</div>
        </div>

      </div>
    </div>
  );
}