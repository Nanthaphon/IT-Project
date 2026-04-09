import { useState, useEffect } from 'react'
import { db } from './firebase' 
import { collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import * as XLSX from 'xlsx' // เพิ่ม Import สำหรับจัดการ Excel

function App() {
  // สร้าง State สำหรับเมนูที่เลือก (เพิ่ม 'dashboard' เป็นค่าเริ่มต้น)
  const [activeMenu, setActiveMenu] = useState('dashboard');
  
  // State สำหรับเก็บข้อมูล
  const [assets, setAssets] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [employees, setEmployees] = useState([]); // เพิ่ม State ข้อมูลพนักงาน
  const [licenses, setLicenses] = useState([]); // เพิ่ม State ข้อมูล License

  // State ฟอร์มทรัพย์สิน/อุปกรณ์
  const [name, setName] = useState('');
  const [type, setType] = useState('คอมพิวเตอร์');

  // State ฟอร์มพนักงาน
  const [empForm, setEmpForm] = useState({
    fullName: '', empId: '', department: '', email: '',
    company: '', position: '', nickname: '', manager: '', phone: ''
  });

  // State ฟอร์มโปรแกรม/License
  const [licenseForm, setLicenseForm] = useState({
    name: '', productKey: '', keyCode: '', supplier: '', purchaseDate: '', expirationDate: '', cost: ''
  });

  // State สำหรับเก็บข้อมูลพนักงานที่ถูกคลิกเพื่อดูรายละเอียด (Modal)
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [empModalTab, setEmpModalTab] = useState('info'); // State สำหรับ Tab ใน Modal พนักงาน ('info' หรือ 'assets')

  // State สำหรับ Modal เพิ่มรายการใหม่
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // State สำหรับ Modal แก้ไขข้อมูลพนักงาน
  const [editEmpModal, setEditEmpModal] = useState({ isOpen: false, data: null });

  // State สำหรับ Modal แก้ไขข้อมูลทรัพย์สิน/อุปกรณ์เสริม
  const [editAssetModal, setEditAssetModal] = useState({ isOpen: false, data: null, collectionName: '' });

  // State สำหรับ Modal แก้ไขข้อมูลโปรแกรม/License
  const [editLicenseModal, setEditLicenseModal] = useState({ isOpen: false, data: null });

  // State สำหรับ Modal นำเข้าข้อมูล (Import)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // State สำหรับ Modal เบิกจ่าย (Checkout)
  const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, assetId: null, collectionName: '' });
  const [checkoutEmpId, setCheckoutEmpId] = useState('');

  // ดึงข้อมูลจาก Firestore
  useEffect(() => {
    // ดึงข้อมูลทรัพย์สินหลัก
    const unsubAssets = onSnapshot(collection(db, 'assets'), (snapshot) => {
      setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // ดึงข้อมูลอุปกรณ์เสริม
    const unsubAccessories = onSnapshot(collection(db, 'accessories'), (snapshot) => {
      setAccessories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // ดึงข้อมูลพนักงาน
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // ดึงข้อมูลโปรแกรม/License
    const unsubLicenses = onSnapshot(collection(db, 'licenses'), (snapshot) => {
      setLicenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubAssets();
      unsubAccessories();
      unsubEmployees();
      unsubLicenses();
    };
  }, []);

  // อัปเดตค่าเริ่มต้นของ Type เมื่อเปลี่ยนเมนู
  useEffect(() => {
    setName('');
    if (activeMenu === 'assets') {
      setType('คอมพิวเตอร์');
    } else if (activeMenu === 'accessories') {
      setType('เมาส์ (Mouse)');
    }
  }, [activeMenu]);

  // ฟังก์ชันสำหรับบันทึกข้อมูล (ทรัพย์สิน และ อุปกรณ์เสริม)
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const collectionName = activeMenu === 'assets' ? 'assets' : 'accessories';

    try {
      await addDoc(collection(db, collectionName), {
        name: name,
        type: type,
        status: 'พร้อมใช้งาน',
        assignedTo: null,
        assignedName: null,
        createdAt: serverTimestamp()
      });
      setName('');
      setIsAddModalOpen(false); // ปิด Modal หลังจากบันทึกเสร็จ
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  // จัดการพิมพ์ข้อมูลฟอร์มพนักงาน
  const handleEmpChange = (e) => {
    const { name, value } = e.target;
    setEmpForm(prev => ({ ...prev, [name]: value }));
  };

  // ฟังก์ชันสำหรับบันทึกข้อมูลพนักงาน
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!empForm.fullName.trim() || !empForm.empId.trim()) return;

    try {
      await addDoc(collection(db, 'employees'), {
        ...empForm,
        createdAt: serverTimestamp()
      });
      // เคลียร์ฟอร์มและปิด Modal
      setEmpForm({
        fullName: '', empId: '', department: '', email: '',
        company: '', position: '', nickname: '', manager: '', phone: ''
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding employee: ", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  // ฟังก์ชันสำหรับ Export ข้อมูลพนักงานเป็น Excel
  const handleExportEmployees = () => {
    if (employees.length === 0) {
      alert("ไม่มีข้อมูลพนักงานสำหรับส่งออก");
      return;
    }
    // แปลง Key ให้เป็นภาษาไทยเพื่อให้ Excel อ่านง่าย
    const exportData = employees.map(emp => ({
      'รหัสพนักงาน': emp.empId || '',
      'ชื่อ-นามสกุล': emp.fullName || '',
      'ชื่อเล่น': emp.nickname || '',
      'เบอร์โทร': emp.phone || '',
      'Email': emp.email || '',
      'บริษัท': emp.company || '',
      'แผนก': emp.department || '',
      'ตำแหน่ง': emp.position || '',
      'หัวหน้างาน': emp.manager || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "Employee_Data.xlsx");
  };

  // ฟังก์ชันดาวน์โหลดไฟล์ต้นแบบ (Template) สำหรับ Import
  const handleDownloadTemplate = () => {
    const templateData = [{
      'รหัสพนักงาน': '',
      'ชื่อ-นามสกุล': '',
      'ชื่อเล่น': '',
      'เบอร์โทร': '',
      'Email': '',
      'บริษัท': '',
      'แผนก': '',
      'ตำแหน่ง': '',
      'หัวหน้างาน': ''
    }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Employee_Template.xlsx");
  };

  // ฟังก์ชันสำหรับ Import ข้อมูลพนักงานจาก Excel
  const handleImportEmployees = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        let successCount = 0;
        // นำข้อมูลเข้า Firestore ทีละรายการ
        for (const row of data) {
          if (row['รหัสพนักงาน'] && row['ชื่อ-นามสกุล']) {
            await addDoc(collection(db, 'employees'), {
              empId: String(row['รหัสพนักงาน'] || ''),
              fullName: String(row['ชื่อ-นามสกุล'] || ''),
              nickname: String(row['ชื่อเล่น'] || ''),
              phone: String(row['เบอร์โทร'] || ''),
              email: String(row['Email'] || ''),
              company: String(row['บริษัท'] || ''),
              department: String(row['แผนก'] || ''),
              position: String(row['ตำแหน่ง'] || ''),
              manager: String(row['หัวหน้างาน'] || ''),
              createdAt: serverTimestamp()
            });
            successCount++;
          }
        }
        alert(`นำเข้าข้อมูลพนักงานสำเร็จ ${successCount} รายการ!`);
        setIsImportModalOpen(false); // ปิด Modal เมื่อนำเข้าสำเร็จ
      } catch (error) {
        console.error("Error importing excel:", error);
        alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = null; // เคลียร์ค่า input file เพื่อให้เลือกไฟล์เดิมซ้ำได้
  };

  // จัดการพิมพ์ข้อมูลฟอร์ม License
  const handleLicenseChange = (e) => {
    const { name, value } = e.target;
    setLicenseForm(prev => ({ ...prev, [name]: value }));
  };

  // ฟังก์ชันสำหรับบันทึกข้อมูล License
  const handleAddLicense = async (e) => {
    e.preventDefault();
    if (!licenseForm.name.trim()) return;

    try {
      await addDoc(collection(db, 'licenses'), {
        ...licenseForm,
        status: 'พร้อมใช้งาน', // กำหนดสถานะตั้งต้น
        assignedTo: null,
        assignedName: null,
        createdAt: serverTimestamp()
      });
      // เคลียร์ฟอร์มและปิด Modal
      setLicenseForm({
        name: '', productKey: '', keyCode: '', supplier: '', purchaseDate: '', expirationDate: '', cost: ''
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding license: ", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  // ฟังก์ชันลบข้อมูล
  const handleDelete = async (id, collectionName) => {
    if(window.confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) {
      await deleteDoc(doc(db, collectionName, id));
    }
  }

  // เปิด Modal แก้ไขข้อมูลพนักงาน
  const openEditEmpModal = (emp) => {
    setEditEmpModal({ isOpen: true, data: { ...emp } });
  };

  // จัดการพิมพ์ข้อมูลฟอร์มแก้ไขพนักงาน
  const handleEditEmpChange = (e) => {
    const { name, value } = e.target;
    setEditEmpModal(prev => ({ ...prev, data: { ...prev.data, [name]: value } }));
  };

  // ฟังก์ชันสำหรับบันทึกการแก้ไขข้อมูลพนักงาน
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!editEmpModal.data.fullName.trim() || !editEmpModal.data.empId.trim()) return;

    try {
      const empRef = doc(db, 'employees', editEmpModal.data.id);
      const updatedData = { ...editEmpModal.data };
      delete updatedData.id; // ลบ id ออกก่อนบันทึกลงฐานข้อมูล

      await updateDoc(empRef, updatedData);
      
      // ถ้าเปิด Modal รายละเอียดค้างไว้ ให้อัปเดตข้อมูลที่แสดงด้วย
      if (selectedEmployee && selectedEmployee.id === editEmpModal.data.id) {
        setSelectedEmployee({ ...selectedEmployee, ...updatedData, id: editEmpModal.data.id });
      }
      
      setEditEmpModal({ isOpen: false, data: null });
    } catch (error) {
      console.error("Error updating employee: ", error);
      alert("เกิดข้อผิดพลาดในการแก้ไขข้อมูล: " + error.message);
    }
  };

  // เปิด Modal แก้ไขข้อมูลทรัพย์สิน/อุปกรณ์เสริม
  const openEditAssetModal = (asset, collectionName) => {
    setEditAssetModal({ isOpen: true, data: { ...asset }, collectionName });
  };

  // จัดการพิมพ์ข้อมูลฟอร์มแก้ไขทรัพย์สิน
  const handleEditAssetChange = (e) => {
    const { name, value } = e.target;
    setEditAssetModal(prev => ({ ...prev, data: { ...prev.data, [name]: value } }));
  };

  // ฟังก์ชันสำหรับบันทึกการแก้ไขข้อมูลทรัพย์สิน
  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    if (!editAssetModal.data.name.trim()) return;

    try {
      const assetRef = doc(db, editAssetModal.collectionName, editAssetModal.data.id);
      const updatedData = { ...editAssetModal.data };
      delete updatedData.id; 

      await updateDoc(assetRef, updatedData);
      setEditAssetModal({ isOpen: false, data: null, collectionName: '' });
    } catch (error) {
      console.error("Error updating asset: ", error);
      alert("เกิดข้อผิดพลาดในการแก้ไขข้อมูล: " + error.message);
    }
  };

  // เปิด Modal แก้ไขข้อมูลโปรแกรม/License
  const openEditLicenseModal = (license) => {
    setEditLicenseModal({ isOpen: true, data: { ...license } });
  };

  // จัดการพิมพ์ข้อมูลฟอร์มแก้ไขโปรแกรม/License
  const handleEditLicenseChange = (e) => {
    const { name, value } = e.target;
    setEditLicenseModal(prev => ({ ...prev, data: { ...prev.data, [name]: value } }));
  };

  // ฟังก์ชันสำหรับบันทึกการแก้ไขข้อมูลโปรแกรม/License
  const handleUpdateLicense = async (e) => {
    e.preventDefault();
    if (!editLicenseModal.data.name.trim()) return;

    try {
      const licenseRef = doc(db, 'licenses', editLicenseModal.data.id);
      const updatedData = { ...editLicenseModal.data };
      delete updatedData.id; 

      await updateDoc(licenseRef, updatedData);
      setEditLicenseModal({ isOpen: false, data: null });
    } catch (error) {
      console.error("Error updating license: ", error);
      alert("เกิดข้อผิดพลาดในการแก้ไขข้อมูล: " + error.message);
    }
  };

  // ฟังก์ชันเบิกจ่าย (Checkout)
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!checkoutEmpId) return;
    
    const emp = employees.find(e => e.id === checkoutEmpId);
    if (!emp) return;

    try {
      await updateDoc(doc(db, checkoutModal.collectionName, checkoutModal.assetId), {
        status: 'ถูกใช้งาน',
        assignedTo: emp.id,
        assignedName: `${emp.fullName} ${emp.nickname ? `(${emp.nickname})` : ''}`
      });
      // ปิด Modal
      setCheckoutModal({ isOpen: false, assetId: null, collectionName: '' });
      setCheckoutEmpId('');
    } catch (error) {
      console.error("Error checkout: ", error);
      alert("เกิดข้อผิดพลาดในการเบิกจ่าย: " + error.message);
    }
  };

  // ฟังก์ชันรับคืน (Check-in)
  const handleCheckin = async (id, collectionName) => {
    if(window.confirm("ต้องการรับคืนทรัพย์สินรายการนี้ใช่หรือไม่?")) {
      try {
        await updateDoc(doc(db, collectionName, id), {
          status: 'พร้อมใช้งาน',
          assignedTo: null,
          assignedName: null
        });
      } catch (error) {
        console.error("Error checkin: ", error);
        alert("เกิดข้อผิดพลาดในการรับคืน: " + error.message);
      }
    }
  };

  // ตัวแปรสำหรับแสดงข้อมูลตามเมนูที่เลือก
  const currentData = activeMenu === 'assets' ? assets : 
                      activeMenu === 'licenses' ? licenses : 
                      activeMenu === 'accessories' ? accessories : employees;
  
  const menuTitle = activeMenu === 'dashboard' ? 'ภาพรวมระบบ (Dashboard)' :
                    activeMenu === 'assets' ? 'ทรัพย์สิน IT หลัก' : 
                    activeMenu === 'licenses' ? 'โปรแกรม/License' : 
                    activeMenu === 'accessories' ? 'อุปกรณ์เสริม (Accessories)' : 'ข้อมูลพนักงาน';

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">
      
      {/* แถบเมนูด้านซ้าย (Sidebar) ปรับให้เลื่อนขึ้นด้านบนเมื่อเป็นจอมือถือ */}
      <aside className="w-full md:w-64 bg-black text-white flex flex-col shadow-xl z-10 flex-shrink-0">
        <div className="p-4 md:p-6 text-left md:text-center border-b border-gray-800 flex justify-between items-center md:block">
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">💻 IT Admin</h1>
            <p className="text-gray-400 text-xs md:text-sm mt-1 hidden md:block">Asset Management</p>
          </div>
          <div className="md:hidden">
            <span className="text-[10px] bg-gray-800 text-gray-300 border border-gray-700 px-2 py-1 rounded-full font-medium shadow-sm">
              ● ออนไลน์
            </span>
          </div>
        </div>
        
        <nav className="flex flex-row md:flex-col md:flex-1 p-2 md:p-4 space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto whitespace-nowrap">
          {/* เพิ่มเมนู แดชบอร์ด */}
          <button 
            onClick={() => setActiveMenu('dashboard')}
            className={`w-auto md:w-full flex items-center p-2 md:p-3 rounded-lg transition-colors ${
              activeMenu === 'dashboard' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="mr-2 md:mr-3 text-lg md:text-xl">📊</span>
            <span className="font-medium text-sm md:text-base">หน้าหลักแดชบอร์ด</span>
          </button>

          <button 
            onClick={() => setActiveMenu('assets')}
            className={`w-auto md:w-full flex items-center p-2 md:p-3 rounded-lg transition-colors ${
              activeMenu === 'assets' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="mr-2 md:mr-3 text-lg md:text-xl">🖥️</span>
            <span className="font-medium text-sm md:text-base">ทรัพย์สินหลัก</span>
          </button>
          
          <button 
            onClick={() => setActiveMenu('licenses')}
            className={`w-auto md:w-full flex items-center p-2 md:p-3 rounded-lg transition-colors ${
              activeMenu === 'licenses' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="mr-2 md:mr-3 text-lg md:text-xl">🔑</span>
            <span className="font-medium text-sm md:text-base">โปรแกรม/License</span>
          </button>

          <button 
            onClick={() => setActiveMenu('accessories')}
            className={`w-auto md:w-full flex items-center p-2 md:p-3 rounded-lg transition-colors ${
              activeMenu === 'accessories' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="mr-2 md:mr-3 text-lg md:text-xl">🖱️</span>
            <span className="font-medium text-sm md:text-base">อุปกรณ์เสริม</span>
          </button>

          <button 
            onClick={() => setActiveMenu('employees')}
            className={`w-auto md:w-full flex items-center p-2 md:p-3 rounded-lg transition-colors ${
              activeMenu === 'employees' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="mr-2 md:mr-3 text-lg md:text-xl">👥</span>
            <span className="font-medium text-sm md:text-base">ข้อมูลพนักงาน</span>
          </button>
        </nav>
        
        <div className="hidden md:block p-4 border-t border-gray-800 text-center">
          <span className="text-xs bg-gray-800 text-gray-300 border border-gray-700 px-3 py-1 rounded-full font-medium shadow-sm">
            ● ระบบออนไลน์
          </span>
        </div>
      </aside>

      {/* พื้นที่เนื้อหาหลักด้านขวา */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header แถบด้านบน */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-8 py-4 md:py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">{menuTitle}</h2>
          <div className="text-xs md:text-sm text-gray-500 font-medium">
            {activeMenu === 'dashboard' 
              ? `ข้อมูลทั้งหมด ${assets.length + licenses.length + accessories.length + employees.length} รายการ`
              : `มีรายการทั้งหมด ${currentData.length} รายการ`
            }
          </div>
        </header>

        {/* พื้นที่ Content เลื่อนได้ */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          
          {activeMenu === 'dashboard' ? (
            // ================= โซนแดชบอร์ด =================
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                
                {/* การ์ดสรุปทรัพย์สินหลัก */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">ทรัพย์สินหลัก</p>
                    <h4 className="text-3xl font-bold text-black">
                      {assets.length} <span className="text-sm font-normal text-gray-500">เครื่อง</span>
                    </h4>
                  </div>
                  <div className="text-5xl opacity-80">🖥️</div>
                </div>

                {/* การ์ดสรุปโปรแกรม/License */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">โปรแกรม/License</p>
                    <h4 className="text-3xl font-bold text-black">
                      {licenses.length} <span className="text-sm font-normal text-gray-500">รายการ</span>
                    </h4>
                  </div>
                  <div className="text-5xl opacity-80">🔑</div>
                </div>

                {/* การ์ดสรุปอุปกรณ์เสริม */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">อุปกรณ์เสริม</p>
                    <h4 className="text-3xl font-bold text-black">
                      {accessories.length} <span className="text-sm font-normal text-gray-500">ชิ้น</span>
                    </h4>
                  </div>
                  <div className="text-5xl opacity-80">🖱️</div>
                </div>

                {/* การ์ดสรุปพนักงาน */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">พนักงานในระบบ</p>
                    <h4 className="text-3xl font-bold text-black">
                      {employees.length} <span className="text-sm font-normal text-gray-500">คน</span>
                    </h4>
                  </div>
                  <div className="text-5xl opacity-80">👥</div>
                </div>
              </div>
            </div>

          ) : (
            // ================= โซนตาราง (เต็มจอ) =================
            <div className="h-full flex flex-col">
              
              {/* กล่องตารางแสดงข้อมูล */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col flex-1">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-3 gap-3">
                  <h3 className="text-lg font-bold text-gray-800">📦 รายการ {menuTitle}</h3>
                  <div className="flex flex-wrap w-full sm:w-auto gap-2">
                    {/* แสดงปุ่ม Import/Export เฉพาะในหน้าข้อมูลพนักงาน */}
                    {activeMenu === 'employees' && (
                      <>
                        <button
                          onClick={() => setIsImportModalOpen(true)}
                          className="flex-1 sm:flex-none w-full sm:w-auto bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                          <span>⬇️</span> นำเข้า Excel
                        </button>
                        <button
                          onClick={handleExportEmployees}
                          className="flex-1 sm:flex-none w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                          <span>⬆️</span> ส่งออก Excel
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="flex-1 sm:flex-none w-full sm:w-auto bg-black text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <span>➕</span> เพิ่มรายการใหม่
                    </button>
                  </div>
                </div>
                
                {currentData.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-12">
                    <span className="text-4xl mb-3">📁</span>
                    <p>ยังไม่มีข้อมูลในหมวดหมู่นี้</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto flex-1">
                    <table className="min-w-full text-left border-collapse w-full whitespace-nowrap">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                          {activeMenu === 'employees' ? (
                            <>
                              <th className="p-4 text-sm font-semibold rounded-tl-lg">รหัสพนักงาน</th>
                              <th className="p-4 text-sm font-semibold">ชื่อ-นามสกุล</th>
                              <th className="p-4 text-sm font-semibold">แผนก / บริษัท</th>
                              <th className="p-4 text-sm font-semibold">ตำแหน่ง</th>
                              <th className="p-4 text-sm font-semibold text-center rounded-tr-lg">จัดการ</th>
                            </>
                          ) : activeMenu === 'licenses' ? (
                            <>
                              <th className="p-4 text-sm font-semibold rounded-tl-lg">ชื่อโปรแกรม</th>
                              <th className="p-4 text-sm font-semibold">Product Key</th>
                              <th className="p-4 text-sm font-semibold">วันหมดอายุ</th>
                              <th className="p-4 text-sm font-semibold">ราคา</th>
                              <th className="p-4 text-sm font-semibold">สถานะ</th>
                              <th className="p-4 text-sm font-semibold text-center rounded-tr-lg">จัดการ</th>
                            </>
                          ) : (
                            <>
                              <th className="p-4 text-sm font-semibold rounded-tl-lg">ชื่ออุปกรณ์</th>
                              <th className="p-4 text-sm font-semibold">ประเภท</th>
                              <th className="p-4 text-sm font-semibold">สถานะ</th>
                              <th className="p-4 text-sm font-semibold text-center rounded-tr-lg">จัดการ</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {currentData.map((item) => (
                          <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            {activeMenu === 'employees' ? (
                              <>
                                <td className="p-4 font-semibold text-black">{item.empId}</td>
                                <td className="p-4 font-medium text-gray-800">
                                  <button 
                                    onClick={() => { setSelectedEmployee(item); setEmpModalTab('info'); }}
                                    className="text-left focus:outline-none flex items-center gap-2 group"
                                    title="คลิกเพื่อดูรายละเอียดเพิ่มเติม"
                                  >
                                    <span className="font-bold text-black group-hover:underline group-hover:text-gray-600 transition-colors">
                                      {item.fullName}
                                    </span> 
                                    {item.nickname && <span className="text-gray-500 text-sm">({item.nickname})</span>}
                                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                      ดูรายละเอียด
                                    </span>
                                  </button>
                                </td>
                                <td className="p-4 text-gray-600">
                                  <div className="text-sm font-medium">{item.department}</div>
                                  <div className="text-xs text-gray-500">{item.company}</div>
                                </td>
                                <td className="p-4 text-gray-700 text-sm">{item.position}</td>
                                <td className="p-4 text-center space-x-2">
                                  <button 
                                    onClick={() => openEditEmpModal(item)}
                                    className="text-gray-600 hover:text-white bg-gray-200 hover:bg-gray-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                  >
                                    แก้ไข
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(item.id, 'employees')}
                                    className="text-gray-600 hover:text-white bg-gray-200 hover:bg-black px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                  >
                                    ลบ
                                  </button>
                                </td>
                              </>
                            ) : activeMenu === 'licenses' ? (
                              <>
                                <td className="p-4 font-bold text-black">{item.name}</td>
                                <td className="p-4 text-gray-600">
                                  <div className="text-sm font-medium">{item.productKey || '-'}</div>
                                  <div className="text-xs text-gray-500">{item.keyCode || '-'}</div>
                                </td>
                                <td className="p-4 text-sm text-gray-700">{item.expirationDate || '-'}</td>
                                <td className="p-4 text-sm text-gray-700">{item.cost ? `฿${item.cost}` : '-'}</td>
                                <td className="p-4">
                                  {!item.status || item.status === 'พร้อมใช้งาน' ? (
                                    <span className="text-black font-semibold text-sm flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-full bg-black inline-block"></span>
                                      พร้อมใช้งาน
                                    </span>
                                  ) : (
                                    <div className="flex flex-col">
                                      <span className="text-gray-600 font-semibold text-sm flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-gray-500 inline-block"></span>
                                        {item.status}
                                      </span>
                                      <span className="text-xs text-gray-500 mt-1">👤 {item.assignedName}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 text-center space-x-2">
                                  {!item.status || item.status === 'พร้อมใช้งาน' ? (
                                    <button 
                                      onClick={() => setCheckoutModal({ isOpen: true, assetId: item.id, collectionName: activeMenu })}
                                      className="text-gray-800 hover:text-white bg-white border border-gray-300 hover:bg-black hover:border-black px-3 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                                    >
                                      เบิกจ่าย
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => handleCheckin(item.id, activeMenu)}
                                      className="text-gray-600 hover:text-white bg-gray-200 border border-gray-300 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                                    >
                                      รับคืน
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => openEditLicenseModal(item)}
                                    className="text-gray-600 hover:text-white bg-gray-200 hover:bg-gray-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                  >
                                    แก้ไข
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(item.id, 'licenses')}
                                    className="text-gray-600 hover:text-white bg-gray-200 hover:bg-black px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                  >
                                    ลบ
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-4 font-medium text-gray-800">{item.name}</td>
                                <td className="p-4">
                                  <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full font-medium border border-gray-200">
                                    {item.type}
                                  </span>
                                </td>
                                <td className="p-4">
                                  {item.status === 'พร้อมใช้งาน' ? (
                                    <span className="text-black font-semibold text-sm flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-full bg-black inline-block"></span>
                                      {item.status}
                                    </span>
                                  ) : (
                                    <div className="flex flex-col">
                                      <span className="text-gray-600 font-semibold text-sm flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-gray-500 inline-block"></span>
                                        {item.status}
                                      </span>
                                      <span className="text-xs text-gray-500 mt-1">👤 {item.assignedName}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 text-center space-x-2">
                                  {item.status === 'พร้อมใช้งาน' ? (
                                    <button 
                                      onClick={() => setCheckoutModal({ isOpen: true, assetId: item.id, collectionName: activeMenu })}
                                      className="text-gray-800 hover:text-white bg-white border border-gray-300 hover:bg-black hover:border-black px-3 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                                    >
                                      เบิกจ่าย
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => handleCheckin(item.id, activeMenu)}
                                      className="text-gray-600 hover:text-white bg-gray-200 border border-gray-300 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                                    >
                                      รับคืน
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => openEditAssetModal(item, activeMenu)}
                                    className="text-gray-600 hover:text-white bg-gray-200 hover:bg-gray-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                  >
                                    แก้ไข
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(item.id, activeMenu)}
                                    className="text-gray-600 hover:text-white bg-gray-200 hover:bg-black px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                  >
                                    ลบ
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </main>

      {/* Modal หน้าต่างเพิ่มรายการใหม่ (Add New Item) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60] transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            <div className="bg-black text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span>➕</span> เพิ่มรายการใหม่
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {activeMenu === 'employees' ? (
                // ฟอร์มพนักงาน
                <form onSubmit={handleAddEmployee} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">รหัสพนักงาน *</label>
                    <input type="text" name="empId" value={empForm.empId} onChange={handleEmpChange} required className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="เช่น EMP001" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อ นามสกุล *</label>
                    <input type="text" name="fullName" value={empForm.fullName} onChange={handleEmpChange} required className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="ชื่อ-นามสกุล" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อเล่น</label>
                      <input type="text" name="nickname" value={empForm.nickname} onChange={handleEmpChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="ชื่อเล่น" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">เบอร์โทร</label>
                      <input type="tel" name="phone" value={empForm.phone} onChange={handleEmpChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="เบอร์โทรศัพท์" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" value={empForm.email} onChange={handleEmpChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="อีเมลบริษัท" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">บริษัท</label>
                    <input type="text" name="company" value={empForm.company} onChange={handleEmpChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="ชื่อบริษัท" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">แผนก</label>
                      <input type="text" name="department" value={empForm.department} onChange={handleEmpChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="แผนก" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">ตำแหน่ง</label>
                      <input type="text" name="position" value={empForm.position} onChange={handleEmpChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="ตำแหน่งงาน" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อหัวหน้างาน</label>
                    <input type="text" name="manager" value={empForm.manager} onChange={handleEmpChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="หัวหน้างาน" />
                  </div>
                  <button type="submit" className="w-full bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 shadow-md transition-all mt-4">
                    บันทึกข้อมูลพนักงาน
                  </button>
                </form>
              ) : activeMenu === 'licenses' ? (
                // ฟอร์มโปรแกรม/License
                <form onSubmit={handleAddLicense} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อโปรแกรม *</label>
                    <input type="text" name="name" value={licenseForm.name} onChange={handleLicenseChange} required className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="ระบุชื่อโปรแกรม..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Product Key License</label>
                    <input type="text" name="productKey" value={licenseForm.productKey} onChange={handleLicenseChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="เช่น A1B2-C3D4-E5F6" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">รหัสของ Product Key</label>
                    <input type="text" name="keyCode" value={licenseForm.keyCode} onChange={handleLicenseChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="รหัสอ้างอิงของ Key" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Supplier ที่ซื้อ</label>
                    <input type="text" name="supplier" value={licenseForm.supplier} onChange={handleLicenseChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="ชื่อร้านค้า/ตัวแทนจำหน่าย" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">วันที่ซื้อ (Purchase Date)</label>
                      <input type="date" name="purchaseDate" value={licenseForm.purchaseDate} onChange={handleLicenseChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">วันที่หมดอายุ (Exp. Date)</label>
                      <input type="date" name="expirationDate" value={licenseForm.expirationDate} onChange={handleLicenseChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">ราคา (Purchase Cost)</label>
                    <input type="number" name="cost" value={licenseForm.cost} onChange={handleLicenseChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="ระบุราคา..." />
                  </div>
                  <button type="submit" className="w-full bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 shadow-md transition-all mt-4">
                    บันทึกข้อมูล License
                  </button>
                </form>
              ) : (
                // ฟอร์มทรัพย์สิน / อุปกรณ์เสริม
                <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่ออุปกรณ์ / รุ่น</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition"
                      placeholder="ระบุชื่ออุปกรณ์..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">ประเภท</label>
                    <select 
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none bg-white transition"
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
                  
                  <button 
                    type="submit" 
                    className="w-full bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 shadow-md transition-all active:scale-95 mt-4"
                  >
                    บันทึกข้อมูล
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal หน้าต่างเบิกจ่ายทรัพย์สิน (Checkout) */}
      {checkoutModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all">
            <div className="bg-black text-white p-4">
              <h3 className="font-bold text-lg">ระบุพนักงานที่เบิกจ่าย</h3>
            </div>
            <form onSubmit={handleCheckout} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">เลือกพนักงาน</label>
                <select 
                  value={checkoutEmpId}
                  onChange={(e) => setCheckoutEmpId(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white text-sm"
                  required
                >
                  <option value="" disabled>-- เลือกพนักงาน --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.empId} - {emp.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => { setCheckoutModal({ isOpen: false, assetId: null, collectionName: '' }); setCheckoutEmpId(''); }}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-bold transition-colors"
                >
                  ยืนยันเบิกจ่าย
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal หน้าต่างแสดงรายละเอียดพนักงาน */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            <div className="bg-black text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span>📋</span> ข้อมูลพนักงาน
              </h3>
              <button 
                onClick={() => setSelectedEmployee(null)} 
                className="text-gray-400 hover:text-white transition-colors focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* แท็บเมนู (Tabs) */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setEmpModalTab('info')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${empModalTab === 'info' ? 'border-black text-black bg-white' : 'border-transparent text-gray-500 hover:text-black bg-gray-50'}`}
              >
                ข้อมูลทั่วไป
              </button>
              <button
                onClick={() => setEmpModalTab('assets')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${empModalTab === 'assets' ? 'border-black text-black bg-white' : 'border-transparent text-gray-500 hover:text-black bg-gray-50'}`}
              >
                ทรัพย์สินที่ครอบครอง
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-800 flex-1">
              {empModalTab === 'info' ? (
                <>
                  {/* ข้อมูลทั่วไป */}
                  <div className="grid grid-cols-3 border-b border-gray-100 pb-3">
                    <span className="text-gray-500 font-medium">รหัสพนักงาน:</span>
                    <span className="col-span-2 font-bold text-black text-base">{selectedEmployee.empId}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-gray-100 pb-3">
                    <span className="text-gray-500 font-medium">ชื่อ-นามสกุล:</span>
                    <span className="col-span-2 font-medium">
                      {selectedEmployee.fullName} {selectedEmployee.nickname ? `(${selectedEmployee.nickname})` : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-gray-100 pb-3">
                    <span className="text-gray-500 font-medium">ตำแหน่ง:</span>
                    <span className="col-span-2">{selectedEmployee.position || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-gray-100 pb-3">
                    <span className="text-gray-500 font-medium">แผนก:</span>
                    <span className="col-span-2">{selectedEmployee.department || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-gray-100 pb-3">
                    <span className="text-gray-500 font-medium">บริษัท:</span>
                    <span className="col-span-2">{selectedEmployee.company || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-gray-100 pb-3">
                    <span className="text-gray-500 font-medium">อีเมล (Email):</span>
                    <span className="col-span-2">{selectedEmployee.email || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-gray-100 pb-3">
                    <span className="text-gray-500 font-medium">เบอร์โทรศัพท์:</span>
                    <span className="col-span-2">{selectedEmployee.phone || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 pb-1">
                    <span className="text-gray-500 font-medium">หัวหน้างาน:</span>
                    <span className="col-span-2">{selectedEmployee.manager || '-'}</span>
                  </div>
                </>
              ) : (
                <>
                  {/* ทรัพย์สินที่ครอบครอง */}
                  <div className="space-y-3">
                    {[...assets, ...accessories, ...licenses].filter(item => item.assignedTo === selectedEmployee.id).length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <span className="text-4xl block mb-2">📦</span>
                        ยังไม่มีทรัพย์สินที่ถือครองในระบบ
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {[...assets, ...accessories, ...licenses].filter(item => item.assignedTo === selectedEmployee.id).map(item => (
                          <li key={item.id} className="py-3 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-black text-base">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.type || 'License'}</p>
                            </div>
                            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full border border-gray-200 font-medium">
                              {assets.some(a => a.id === item.id) ? 'ทรัพย์สินหลัก' : 
                               accessories.some(a => a.id === item.id) ? 'อุปกรณ์เสริม' : 'โปรแกรม/License'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t border-gray-200">
               <button 
                 onClick={() => openEditEmpModal(selectedEmployee)} 
                 className="px-5 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 font-bold transition-colors"
               >
                 แก้ไขข้อมูล
               </button>
               <button 
                 onClick={() => setSelectedEmployee(null)} 
                 className="px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-bold transition-colors"
               >
                 ปิดหน้าต่าง
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal แก้ไขข้อมูลพนักงาน */}
      {editEmpModal.isOpen && editEmpModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60] transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            <div className="bg-black text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">✏️ แก้ไขข้อมูลพนักงาน</h3>
              <button onClick={() => setEditEmpModal({ isOpen: false, data: null })} className="text-gray-400 hover:text-white focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateEmployee} className="p-6 overflow-y-auto space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">รหัสพนักงาน *</label>
                <input type="text" name="empId" value={editEmpModal.data.empId} onChange={handleEditEmpChange} required className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อ นามสกุล *</label>
                <input type="text" name="fullName" value={editEmpModal.data.fullName} onChange={handleEditEmpChange} required className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อเล่น</label>
                  <input type="text" name="nickname" value={editEmpModal.data.nickname} onChange={handleEditEmpChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">เบอร์โทร</label>
                  <input type="tel" name="phone" value={editEmpModal.data.phone} onChange={handleEditEmpChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                <input type="email" name="email" value={editEmpModal.data.email} onChange={handleEditEmpChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">บริษัท</label>
                <input type="text" name="company" value={editEmpModal.data.company} onChange={handleEditEmpChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">แผนก</label>
                  <input type="text" name="department" value={editEmpModal.data.department} onChange={handleEditEmpChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ตำแหน่ง</label>
                  <input type="text" name="position" value={editEmpModal.data.position} onChange={handleEditEmpChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อหัวหน้างาน</label>
                <input type="text" name="manager" value={editEmpModal.data.manager} onChange={handleEditEmpChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setEditEmpModal({ isOpen: false, data: null })} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-bold transition-colors">
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal แก้ไขข้อมูลทรัพย์สิน/อุปกรณ์เสริม */}
      {editAssetModal.isOpen && editAssetModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60] transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            <div className="bg-black text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">✏️ แก้ไข{editAssetModal.collectionName === 'assets' ? 'ทรัพย์สินหลัก' : 'อุปกรณ์เสริม'}</h3>
              <button onClick={() => setEditAssetModal({ isOpen: false, data: null, collectionName: '' })} className="text-gray-400 hover:text-white focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateAsset} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่ออุปกรณ์ / รุ่น *</label>
                <input type="text" name="name" value={editAssetModal.data.name} onChange={handleEditAssetChange} required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">ประเภท</label>
                <select name="type" value={editAssetModal.data.type} onChange={handleEditAssetChange} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white text-sm">
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
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditAssetModal({ isOpen: false, data: null, collectionName: '' })} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-bold transition-colors">
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal แก้ไขข้อมูลโปรแกรม/License */}
      {editLicenseModal.isOpen && editLicenseModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60] transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            <div className="bg-black text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">✏️ แก้ไขข้อมูลโปรแกรม/License</h3>
              <button onClick={() => setEditLicenseModal({ isOpen: false, data: null })} className="text-gray-400 hover:text-white focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateLicense} className="p-6 overflow-y-auto space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อโปรแกรม *</label>
                <input type="text" name="name" value={editLicenseModal.data.name} onChange={handleEditLicenseChange} required className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Product Key License</label>
                <input type="text" name="productKey" value={editLicenseModal.data.productKey} onChange={handleEditLicenseChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">รหัสของ Product Key</label>
                <input type="text" name="keyCode" value={editLicenseModal.data.keyCode} onChange={handleEditLicenseChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Supplier ที่ซื้อ</label>
                <input type="text" name="supplier" value={editLicenseModal.data.supplier} onChange={handleEditLicenseChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">วันที่ซื้อ (Purchase Date)</label>
                  <input type="date" name="purchaseDate" value={editLicenseModal.data.purchaseDate} onChange={handleEditLicenseChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">วันที่หมดอายุ (Exp. Date)</label>
                  <input type="date" name="expirationDate" value={editLicenseModal.data.expirationDate} onChange={handleEditLicenseChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ราคา (Purchase Cost)</label>
                <input type="number" name="cost" value={editLicenseModal.data.cost} onChange={handleEditLicenseChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setEditLicenseModal({ isOpen: false, data: null })} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-bold transition-colors">
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal หน้าต่างนำเข้าข้อมูล (Import Excel) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60] transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all flex flex-col">
            <div className="bg-black text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span>⬇️</span> นำเข้าข้อมูลพนักงาน
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-white focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              
              {/* ขั้นตอนที่ 1: โหลด Template */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                  <h4 className="font-bold text-gray-800 text-sm">ดาวน์โหลดไฟล์ต้นแบบ</h4>
                </div>
                <p className="text-xs text-gray-500 mb-3 ml-8">โหลดไฟล์ Excel (.xlsx) ที่มีหัวคอลัมน์ถูกต้อง เพื่อนำไปกรอกข้อมูลพนักงาน</p>
                <div className="ml-8">
                  <button 
                    onClick={handleDownloadTemplate}
                    className="w-full bg-white border-2 border-blue-600 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>📥</span> โหลด Template.xlsx
                  </button>
                </div>
              </div>

              {/* ขั้นตอนที่ 2: อัปโหลดไฟล์ */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-100 text-green-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                  <h4 className="font-bold text-gray-800 text-sm">อัปโหลดไฟล์ข้อมูล</h4>
                </div>
                <p className="text-xs text-gray-500 mb-3 ml-8">เลือกไฟล์ Excel ที่กรอกข้อมูลเสร็จแล้ว ระบบจะนำเข้าข้อมูลทันที</p>
                <div className="ml-8">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    className="hidden" 
                    id="excel-upload-modal" 
                    onChange={handleImportEmployees}
                  />
                  <label 
                    htmlFor="excel-upload-modal"
                    className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 text-center"
                  >
                    <span>📤</span> เลือกไฟล์เพื่อนำเข้า
                  </label>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App