/* Dev harness ดู Sidebar ของจริง โดยไม่ต้องล็อกอิน
   เปิดที่ /sidebar-preview.html — ไม่เข้า production build
   ลองย่อความสูงหน้าต่างให้เมนูล้น เพื่อตรวจการเลื่อน/แถบเลื่อน */
import './index.css';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Sidebar from './components/Sidebar.jsx';

function Harness() {
  const [menu, setMenu] = useState('replacement_requests');
  return (
    <div className="flex h-screen bg-sand-50 font-sans text-stone-900">
      <Sidebar
        activeMenu={menu} setActiveMenu={setMenu}
        onChangePassword={() => {}} authRole="admin" isSuperAdmin canManageUsers
        sidebarOpen={false} setSidebarOpen={() => {}}
        menuCounts={{ licenses: 14, repairs: 2, supply_requests: 3 }}
      />
      <main className="flex-1 overflow-auto p-5">
        <p className="text-sm text-stone-500">เมนูที่เลือก: {menu}</p>
        <div className="h-[2000px]" />
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Harness />);
export default Harness;
