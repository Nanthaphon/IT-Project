import { useState, useEffect } from 'react'
import { db } from './firebase' 
import { collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import * as XLSX from 'xlsx' // เพิ่ม Import สำหรับจัดการ Excel
import CustomAlert from './components/CustomAlert'; // 👈 พิมพ์บรรทัดนี้เพิ่มเข้าไป
import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';
import AddModal from './components/AddModal';
import CheckoutModal from './components/CheckoutModal';
import EmployeeDetailsModal from './components/EmployeeDetailsModal';
import AssetDetailsModal from './components/AssetDetailsModal';
import EditEmpModal from './components/EditEmpModal';
import EditAssetModal from './components/EditAssetModal';
import EditLicenseModal from './components/EditLicenseModal';
import ImportModal from './components/ImportModal';
import ReturnModal from './components/ReturnModal';
import RepairModal from './components/RepairModal';

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
  const [cost, setCost] = useState(''); // เพิ่ม State สำหรับเก็บราคา
  const [quantity, setQuantity] = useState(1); // เพิ่ม State สำหรับเก็บจำนวนอุปกรณ์

  // State ฟอร์มพนักงาน
  const [empForm, setEmpForm] = useState({
    fullName: '', fullNameEng: '', empId: '', department: '', email: '',
    company: '', position: '', nickname: '', manager: '', phone: ''
  });

  // State ฟอร์มโปรแกรม/License
  const [licenseForm, setLicenseForm] = useState({
    name: '', productKey: '', keyCode: '', supplier: '', purchaseDate: '', expirationDate: '', cost: ''
  });

  // State สำหรับเก็บข้อมูลพนักงานที่ถูกคลิกเพื่อดูรายละเอียด (Modal)
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [empModalTab, setEmpModalTab] = useState('info'); // State สำหรับ Tab ใน Modal พนักงาน ('info', 'assets', หรือ 'history')

  // State สำหรับ Modal แสดงรายละเอียดทรัพย์สิน/อุปกรณ์/License
  const [selectedAssetDetail, setSelectedAssetDetail] = useState(null);
  const [selectedAssetCategory, setSelectedAssetCategory] = useState('');

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

  // State สำหรับ Modal แจ้งเตือนที่ออกแบบใหม่ (Custom Alert)
  const [customAlert, setCustomAlert] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  // State สำหรับ Filter อุปกรณ์เสริม (Accessories)
  const [accFilterType, setAccFilterType] = useState('ทั้งหมด');
  const [accFilterStatus, setAccFilterStatus] = useState('ทั้งหมด');

  // State สำหรับช่องค้นหาข้อมูล (Search)
  const [searchTerm, setSearchTerm] = useState('');
  const [checkoutSearchTerm, setCheckoutSearchTerm] = useState('');

  // State สำหรับประวัติการเบิกคืน
  const [transactions, setTransactions] = useState([]);

  // State สำหรับ Modal รับคืนระบุสภาพ (Return Modal)
  const [returnModal, setReturnModal] = useState({ isOpen: false, assetId: null, checkoutId: null, empId: null, empName: null, assetName: null });
  const [returnCondition, setReturnCondition] = useState('good');
  const [returnRemarks, setReturnRemarks] = useState('');

  // State สำหรับ Modal ซ่อมแซมอุปกรณ์ (Repair Modal)
  const [repairModal, setRepairModal] = useState({ isOpen: false, assetId: null, assetName: null, maxRepair: 0 });
  const [repairQuantity, setRepairQuantity] = useState(1);
  const [repairRemarks, setRepairRemarks] = useState('');

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

    // ดึงข้อมูลประวัติการเบิก-คืน (Transactions)
    const unsubTransactions = onSnapshot(collection(db, 'accessories_transactions'), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubAssets();
      unsubAccessories();
      unsubEmployees();
      unsubLicenses();
      unsubTransactions();
    };
  }, []);

  // อัปเดตค่าเริ่มต้นของ Type เมื่อเปลี่ยนเมนู
  useEffect(() => {
    setName('');
    setCost(''); // รีเซ็ตราคาเมื่อเปลี่ยนเมนู
    setQuantity(1); // รีเซ็ตจำนวนเมื่อเปลี่ยนเมนู
    setAccFilterType('ทั้งหมด');
    setAccFilterStatus('ทั้งหมด');
    setSearchTerm(''); // รีเซ็ตคำค้นหาเมื่อเปลี่ยนเมนู
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
      // บันทึกข้อมูลเพียง 1 record และเก็บค่า quantity (จำนวน) ไว้ใน record นั้น
      const qtyToSave = activeMenu === 'accessories' ? parseInt(quantity) || 1 : 1;

      await addDoc(collection(db, collectionName), {
        name: name,
        type: type,
        cost: cost,
        quantity: qtyToSave, // บันทึกจำนวนลงฐานข้อมูล
        brokenQuantity: 0, // ค่าเริ่มต้นสำหรับของที่ชำรุด
        status: 'พร้อมใช้งาน',
        assignedTo: null,
        assignedName: null,
        createdAt: serverTimestamp()
      });

      setName('');
      setCost(''); 
      setQuantity(1); // รีเซ็ตจำนวนให้กลับมาเป็น 1
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
    const trimmedEmpId = empForm.empId.trim();
    const trimmedFullName = empForm.fullName.trim();

    if (!trimmedFullName || !trimmedEmpId) return;

    // ตรวจสอบรหัสพนักงาน หรือ ชื่อพนักงาน ซ้ำในระบบ
    const isDuplicate = employees.some(
      emp => String(emp.empId).toLowerCase() === String(trimmedEmpId).toLowerCase() || 
             String(emp.fullName).toLowerCase() === String(trimmedFullName).toLowerCase()
    );

    if (isDuplicate) {
      setCustomAlert({
        isOpen: true,
        title: 'ข้อมูลซ้ำซ้อน!',
        message: `รหัสพนักงาน หรือ ชื่อ-นามสกุล นี้มีอยู่ในระบบแล้ว\nโปรดตรวจสอบข้อมูลใหม่อีกครั้ง`,
        type: 'error'
      });
      return; // ยกเลิกการบันทึกถ้าข้อมูลซ้ำ
    }

    try {
      await addDoc(collection(db, 'employees'), {
        ...empForm,
        createdAt: serverTimestamp()
      });
      // เคลียร์ฟอร์มและปิด Modal
      setEmpForm({
        fullName: '', fullNameEng: '', empId: '', department: '', email: '',
        company: '', position: '', nickname: '', manager: '', phone: ''
      });
      setIsAddModalOpen(false);
      setCustomAlert({ isOpen: true, title: 'บันทึกสำเร็จ!', message: 'เพิ่มข้อมูลพนักงานใหม่ลงระบบเรียบร้อยแล้ว', type: 'success' });
    } catch (error) {
      console.error("Error adding employee: ", error);
      setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' });
    }
  };

  // ฟังก์ชันสำหรับ Export ข้อมูลพนักงานเป็น CSV
  const handleExportEmployees = () => {
    if (employees.length === 0) {
      setCustomAlert({ isOpen: true, title: 'ไม่พบข้อมูล!', message: 'ไม่มีข้อมูลพนักงานในระบบสำหรับส่งออก', type: 'error' });
      return;
    }
    // แปลง Key ให้เป็นภาษาไทยเพื่อให้ CSV อ่านง่าย
    const exportData = employees.map(emp => ({
      'รหัสพนักงาน': emp.empId || '',
      'ชื่อ-นามสกุล': emp.fullName || '',
      'ชื่อ-นามสกุล (EN)': emp.fullNameEng || '',
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
    XLSX.writeFile(wb, "Employee_Data.csv"); // เปลี่ยนเป็น .csv
  };

  // ฟังก์ชันสำหรับ Export ข้อมูลอุปกรณ์เสริมเป็น CSV
  const handleExportAccessories = () => {
    // กรองข้อมูลตามที่เลือกใน Filter ก่อนส่งออก
    const filteredAccessories = accessories.filter(item => {
      const matchType = accFilterType === 'ทั้งหมด' || item.type === accFilterType;
      return matchType;
    });

    if (filteredAccessories.length === 0) {
      setCustomAlert({ isOpen: true, title: 'ไม่พบข้อมูล!', message: 'ไม่มีข้อมูลอุปกรณ์เสริมตามเงื่อนไขที่เลือกสำหรับส่งออก', type: 'error' });
      return;
    }
    
    const exportData = filteredAccessories.map(item => {
      // ดึงรายชื่อผู้ครอบครองทั้งหมดมาโชว์ใน CSV
      const assigneesStr = item.assignees && item.assignees.length > 0 
        ? item.assignees.map(a => a.empName).join(', ') 
        : (item.assignedName || '-');

      const remainingQty = item.quantity ? (Number(item.quantity) - (item.assignees?.length || 0)) : (1 - (item.assignees?.length || 0));
      const usedQty = item.assignees?.length || 0;

      return {
        'ชื่ออุปกรณ์': item.name || '',
        'ประเภท': item.type || '',
        'คงเหลือ': remainingQty, // เปลี่ยนชื่อคอลัมน์เป็น คงเหลือ
        'ใช้งานไป': usedQty,     // เพิ่มคอลัมน์ ใช้งานไป
        'ชำรุด/พัง': item.brokenQuantity || 0, // เพิ่มคอลัมน์ชำรุด
        'ราคา': item.cost ? `฿${item.cost}` : '-',
        // ลบคอลัมน์สถานะออกตาม Request
        'ผู้ครอบครอง': assigneesStr
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Accessories");
    XLSX.writeFile(wb, "Accessories_Data.csv");
  };

  // ฟังก์ชันดาวน์โหลดไฟล์ต้นแบบ (Template) สำหรับ Import
  const handleDownloadTemplate = () => {
    const templateData = [{
      'รหัสพนักงาน': '',
      'ชื่อ-นามสกุล': '',
      'ชื่อ-นามสกุล (EN)': '',
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
    XLSX.writeFile(wb, "Employee_Template.csv"); // เปลี่ยนเป็น .csv
  };

  // ฟังก์ชันสำหรับ Import ข้อมูลพนักงานจาก CSV
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

        // 1. ดึงรหัสพนักงานที่มีอยู่แล้ว และเตรียมตัวแปรเช็คซ้ำ
        const existingEmpIds = new Set(employees.map(emp => String(emp.empId)));
        const newEmpIdsInCSV = new Set();
        const duplicateIds = [];

        // 2. ตรวจสอบข้อมูลเพื่อหารหัสที่ซ้ำก่อนดำเนินการใดๆ
        for (const row of data) {
          const rawEmpId = row['รหัสพนักงาน'];
          if (rawEmpId) {
            const empIdStr = String(rawEmpId);
            // เช็คว่ารหัสซ้ำกับในระบบ หรือซ้ำกันเองในไฟล์ CSV หรือไม่
            if (existingEmpIds.has(empIdStr) || newEmpIdsInCSV.has(empIdStr)) {
              if (!duplicateIds.includes(empIdStr)) {
                duplicateIds.push(empIdStr);
              }
            } else {
              newEmpIdsInCSV.add(empIdStr);
            }
          }
        }

        // 3. ถ้าเจอตัวซ้ำ ให้แสดงแจ้งเตือนดีไซน์ใหม่และยกเลิกการนำเข้าทั้งหมด
        if (duplicateIds.length > 0) {
          setCustomAlert({
            isOpen: true,
            title: 'นำเข้าข้อมูลไม่ได้!',
            message: `พบรหัสพนักงานซ้ำซ้อนในระบบ หรือซ้ำกันเองในไฟล์:\n${duplicateIds.join(', ')}`,
            type: 'error'
          });
          e.target.value = null; // เคลียร์ input file เพื่อให้เลือกไฟล์เดิมซ้ำได้ใหม่
          return; 
        }

        let successCount = 0;
        // นำข้อมูลเข้า Firestore ทีละรายการ (จะทำงานก็ต่อเมื่อไม่มีข้อมูลซ้ำเลย)
        for (const row of data) {
          if (row['รหัสพนักงาน'] && row['ชื่อ-นามสกุล']) {
            await addDoc(collection(db, 'employees'), {
              empId: String(row['รหัสพนักงาน'] || ''),
              fullName: String(row['ชื่อ-นามสกุล'] || ''),
              fullNameEng: String(row['ชื่อ-นามสกุล (EN)'] || ''),
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
        
        setCustomAlert({ isOpen: true, title: 'นำเข้าสำเร็จ!', message: `บันทึกข้อมูลพนักงานเสร็จสิ้นทั้งหมด ${successCount} รายการ`, type: 'success' });
        setIsImportModalOpen(false); // ปิด Modal เมื่อนำเข้าสำเร็จ
      } catch (error) {
        console.error("Error importing excel:", error);
        setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: `ไม่สามารถนำเข้าข้อมูลได้: ${error.message}`, type: 'error' });
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
      try {
        await deleteDoc(doc(db, collectionName, id));

        // หากสิ่งที่ลบคือ "พนักงาน" ให้คืนค่าสถานะอุปกรณ์ทั้งหมดที่พนักงานคนนั้นถือครองอยู่ให้กลับมา "พร้อมใช้งาน"
        if (collectionName === 'employees') {
          // 1. คืนค่า ทรัพย์สินหลัก
          const userAssets = assets.filter(item => item.assignedTo === id);
          for (const asset of userAssets) {
            await updateDoc(doc(db, 'assets', asset.id), {
              status: 'พร้อมใช้งาน',
              assignedTo: null,
              assignedName: null
            });
          }
          // 2. คืนค่า อุปกรณ์เสริม (รองรับทั้งระบบเดิม และระบบกระจายหลายชิ้น)
          const userAccessories = accessories.filter(item => 
            item.assignedTo === id || (item.assignees && item.assignees.some(a => a.empId === id))
          );
          for (const acc of userAccessories) {
            if (acc.assignees) {
              const remainingAssignees = acc.assignees.filter(a => a.empId !== id);
              await updateDoc(doc(db, 'accessories', acc.id), {
                assignees: remainingAssignees // อัปเดตแค่รายชื่อ ไม่ต้องไปบวกจำนวนกลับแล้ว
              });
            } else {
              await updateDoc(doc(db, 'accessories', acc.id), {
                status: 'พร้อมใช้งาน',
                assignedTo: null,
                assignedName: null
              });
            }
          }
          // 3. คืนค่า โปรแกรม/License
          const userLicenses = licenses.filter(item => item.assignedTo === id);
          for (const lic of userLicenses) {
            await updateDoc(doc(db, 'licenses', lic.id), {
              status: 'พร้อมใช้งาน',
              assignedTo: null,
              assignedName: null
            });
          }
        }
      } catch (error) {
        console.error("Error deleting document: ", error);
        setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: `ไม่สามารถลบข้อมูลได้: ${error.message}`, type: 'error' });
      }
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
    // เพิ่มการตรวจสอบค่าว่างเพื่อป้องกัน Error
    if (!String(editEmpModal.data?.fullName || '').trim() || !String(editEmpModal.data?.empId || '').trim()) return;

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
    // เพิ่มการตรวจสอบค่าว่างเพื่อป้องกัน Error
    if (!String(editAssetModal.data?.name || '').trim()) return;

    try {
      const assetRef = doc(db, editAssetModal.collectionName, editAssetModal.data.id);
      const updatedData = { ...editAssetModal.data };
      delete updatedData.id; 

      // เพิ่มเงื่อนไขปรับจำนวนรวมตามจำนวนคงเหลือที่ผู้ใช้กรอก
      if (editAssetModal.collectionName === 'accessories' && updatedData.remainingQuantity !== undefined) {
        updatedData.quantity = Number(updatedData.remainingQuantity) + (updatedData.assignees?.length || 0);
        delete updatedData.remainingQuantity; // ลบฟิลด์ชั่วคราวทิ้งก่อนบันทึกลงฐานข้อมูล
      }

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
    // เพิ่มการตรวจสอบค่าว่างเพื่อป้องกัน Error
    if (!String(editLicenseModal.data?.name || '').trim()) return;

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
      if (checkoutModal.collectionName === 'accessories') {
        const item = accessories.find(a => a.id === checkoutModal.assetId);
        
        // คำนวณจำนวนคงเหลือปัจจุบัน
        const remainingQty = item ? (item.quantity ? (Number(item.quantity) - (item.assignees?.length || 0)) : (1 - (item.assignees?.length || 0))) : 0;
        
        if (item && remainingQty > 0) {
          const newAssignees = item.assignees ? [...item.assignees] : [];
          newAssignees.push({
            checkoutId: Date.now().toString(),
            empId: emp.id,
            empName: `${emp.fullName} ${emp.nickname ? `(${emp.nickname})` : ''}`
          });
          await updateDoc(doc(db, 'accessories', checkoutModal.assetId), {
            assignees: newAssignees // อัปเดตแค่คนยืม ไม่ต้องไปลบเลข quantity ในฐานข้อมูล
          });

          // บันทึกประวัติการเบิกจ่าย
          await addDoc(collection(db, 'accessories_transactions'), {
            empId: emp.id,
            assetName: item.name,
            action: 'เบิกจ่าย',
            condition: 'ปกติ',
            remarks: '-',
            timestamp: Date.now()
          });

        } else {
          setCustomAlert({ isOpen: true, title: 'ข้อผิดพลาด', message: 'จำนวนอุปกรณ์ไม่เพียงพอสำหรับการเบิกจ่าย', type: 'error' });
          return;
        }
      } else {
        await updateDoc(doc(db, checkoutModal.collectionName, checkoutModal.assetId), {
          status: 'ถูกใช้งาน',
          assignedTo: emp.id,
          // กำหนดให้แสดงชื่อไทยเป็นหลักในส่วนสถานะครอบครองตาม Request
          assignedName: `${emp.fullName} ${emp.nickname ? `(${emp.nickname})` : ''}`
        });
      }
      
      // ปิด Modal
      setCheckoutModal({ isOpen: false, assetId: null, collectionName: '' });
      setCheckoutEmpId('');
      setCheckoutSearchTerm(''); // เคลียร์คำค้นหาหลังจากเบิกจ่ายเสร็จ
    } catch (error) {
      console.error("Error checkout: ", error);
      alert("เกิดข้อผิดพลาดในการเบิกจ่าย: " + error.message);
    }
  };

  // ฟังก์ชันกดยืนยันในหน้าต่างรับคืนอุปกรณ์เสริมแบบระบุสภาพ
  const handleConfirmReturn = async (e) => {
    e.preventDefault();
    if (returnCondition === 'broken' && !returnRemarks.trim()) {
      setCustomAlert({ isOpen: true, title: 'แจ้งเตือน', message: 'กรุณากรอกหมายเหตุเมื่อระบุว่าอุปกรณ์ชำรุด/พัง', type: 'error' });
      return;
    }

    try {
      const item = accessories.find(a => a.id === returnModal.assetId);
      if (item && item.assignees) {
        const newAssignees = item.assignees.filter(a => a.checkoutId !== returnModal.checkoutId);
        
        const updateData = { assignees: newAssignees };
        
        // ถ้าแจ้งว่าชำรุด ให้ไปบวกที่ช่องชำรุดและตัดออกจากยอดคงเหลือ (โดยการลบยอดรวมตั้งต้น)
        if (returnCondition === 'broken') {
          updateData.brokenQuantity = Number(item.brokenQuantity || 0) + 1;
          updateData.quantity = Number(item.quantity || 1) - 1; // ตัดสต๊อกทิ้ง
        }
        // ถ้าสภาพปกติ ไม่ต้องแก้ไข quantity ปล่อยให้สูตรคงเหลือคำนวณกลับมาเองเมื่อ assignees หายไป

        await updateDoc(doc(db, 'accessories', returnModal.assetId), updateData);

        // บันทึกประวัติการรับคืน
        await addDoc(collection(db, 'accessories_transactions'), {
          empId: returnModal.empId,
          assetName: returnModal.assetName,
          action: 'รับคืน',
          condition: returnCondition === 'good' ? 'ปกติ' : 'ชำรุด',
          remarks: returnRemarks.trim() || '-',
          timestamp: Date.now()
        });
      }
      
      // ปิดหน้าต่างและล้างค่า
      setReturnModal({ isOpen: false, assetId: null, checkoutId: null, empId: null, empName: null, assetName: null });
      setReturnCondition('good');
      setReturnRemarks('');
      setCustomAlert({ isOpen: true, title: 'สำเร็จ', message: 'รับคืนอุปกรณ์เรียบร้อยแล้ว', type: 'success' });
    } catch (error) {
      console.error("Error confirming return: ", error);
      setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด', message: error.message, type: 'error' });
    }
  };

  // ฟังก์ชันกดยืนยันการซ่อมแซมอุปกรณ์
  const handleConfirmRepair = async (e) => {
    e.preventDefault();
    const qtyToRepair = parseInt(repairQuantity, 10);

    if (qtyToRepair < 1 || qtyToRepair > repairModal.maxRepair) {
      setCustomAlert({ isOpen: true, title: 'ข้อผิดพลาด', message: 'จำนวนที่ซ่อมไม่ถูกต้อง', type: 'error' });
      return;
    }

    try {
      const item = accessories.find(a => a.id === repairModal.assetId);
      if (item) {
        // 1. อัปเดตตาราง accessories (ลดของเสีย เพิ่มของดีกลับเข้าคลัง)
        const newBrokenQty = Number(item.brokenQuantity || 0) - qtyToRepair;
        const newTotalQty = Number(item.quantity || 0) + qtyToRepair;

        await updateDoc(doc(db, 'accessories', repairModal.assetId), {
          brokenQuantity: newBrokenQty,
          quantity: newTotalQty
        });

        // 2. บันทึกประวัติลง accessories_transactions (ไม่ต้องผูกกับพนักงาน)
        await addDoc(collection(db, 'accessories_transactions'), {
          empId: 'SYSTEM', // ใช้ SYSTEM เพราะเป็นการจัดการภายในสต๊อก
          assetName: item.name,
          action: 'ซ่อมแซม',
          condition: 'ปกติ', // ซ่อมเสร็จแล้วกลับมาปกติ
          remarks: repairRemarks.trim() || '-',
          timestamp: Date.now()
        });

        setRepairModal({ isOpen: false, assetId: null, assetName: null, maxRepair: 0 });
        setRepairQuantity(1);
        setRepairRemarks('');
        setCustomAlert({ isOpen: true, title: 'สำเร็จ', message: `บันทึกการซ่อมแซมและนำ ${item.name} กลับเข้าสต๊อก ${qtyToRepair} รายการเรียบร้อยแล้ว`, type: 'success' });
      }
    } catch (error) {
      console.error("Error confirming repair: ", error);
      setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด', message: error.message, type: 'error' });
    }
  };

  // ฟังก์ชันรับคืน (Check-in) สำหรับ ทรัพย์สินและโปรแกรม
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

  // ตัวแปรสำหรับแสดงข้อมูลตามเมนูที่เลือก (และใช้ค้นหา)
  let baseData = [];
  if (activeMenu === 'assets') {
    baseData = assets;
  } else if (activeMenu === 'licenses') {
    baseData = licenses;
  } else if (activeMenu === 'employees') {
    baseData = employees;
  } else if (activeMenu === 'accessories') {
    baseData = accessories.filter(item => {
      const matchType = accFilterType === 'ทั้งหมด' || item.type === accFilterType;
      return matchType;
    });
  }

  let currentData = baseData;
  if (searchTerm.trim() !== '') {
    const lowerCaseTerm = searchTerm.toLowerCase();
    currentData = baseData.filter(item => {
      if (activeMenu === 'employees') {
        return (item.fullName?.toLowerCase().includes(lowerCaseTerm) || 
                item.fullNameEng?.toLowerCase().includes(lowerCaseTerm) ||
                item.empId?.toLowerCase().includes(lowerCaseTerm) ||
                item.nickname?.toLowerCase().includes(lowerCaseTerm));
      } else {
        return (item.name?.toLowerCase().includes(lowerCaseTerm) ||
                item.type?.toLowerCase().includes(lowerCaseTerm) ||
                item.productKey?.toLowerCase().includes(lowerCaseTerm));
      }
    });
  }
  
  const menuTitle = activeMenu === 'dashboard' ? 'ภาพรวมระบบ (Dashboard)' :
                    activeMenu === 'assets' ? 'ทรัพย์สิน IT หลัก' : 
                    activeMenu === 'licenses' ? 'โปรแกรม/License' : 
                    activeMenu === 'accessories' ? 'อุปกรณ์เสริม (Accessories)' : 'ข้อมูลพนักงาน';

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans">
      
      {/* แถบเมนูด้านซ้าย (Sidebar) */}
  <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

      {/* พื้นที่เนื้อหาหลักด้านขวา */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header แถบด้านบน */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-4 md:px-8 py-4 md:py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 z-0 relative">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">{menuTitle}</h2>
          <div className="text-xs md:text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-full">
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
            <DashboardStats 
              assets={assets} 
              licenses={licenses} 
              accessories={accessories} 
              employees={employees} 
            />

          ) : (
            // ================= โซนตาราง (เต็มจอ) =================
            <div className="h-full flex flex-col">
              
              {/* กล่องตารางแสดงข้อมูล */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-4 gap-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
                    <span className="text-indigo-500">📦</span> รายการ {menuTitle}
                  </h3>
                  <div className="flex flex-wrap w-full sm:w-auto gap-2 items-center">
                    {/* ช่องค้นหา (แสดงทุกเมนู) */}
                    <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="ค้นหาชื่อ หรือ รหัส..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-56 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                      />
                    </div>

                    {/* แสดงปุ่ม Import/Export เฉพาะในหน้าข้อมูลพนักงาน */}
                    {activeMenu === 'employees' && (
                      <>
                        <button
                          onClick={() => setIsImportModalOpen(true)}
                          className="flex-1 sm:flex-none w-full sm:w-auto bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                          นำเข้า CSV
                        </button>
                        <button
                          onClick={handleExportEmployees}
                          className="flex-1 sm:flex-none w-full sm:w-auto bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          ส่งออก CSV
                        </button>
                      </>
                    )}
                    {/* แสดง Filter และปุ่ม Export เฉพาะในหน้าอุปกรณ์เสริม */}
                    {activeMenu === 'accessories' && (
                      <>
                        <select
                          value={accFilterType}
                          onChange={(e) => setAccFilterType(e.target.value)}
                          className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-sm font-bold hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                        >
                          <option value="ทั้งหมด">ประเภท: ทั้งหมด</option>
                          <option value="เมาส์ (Mouse)">เมาส์ (Mouse)</option>
                          <option value="คีย์บอร์ด (Keyboard)">คีย์บอร์ด (Keyboard)</option>
                          <option value="สายชาร์จ (Adapter)">สายชาร์จ (Adapter)</option>
                          <option value="หูฟัง (Headset)">หูฟัง (Headset)</option>
                          <option value="กระเป๋า (Bag)">กระเป๋าใส่โน๊ตบุ๊ค</option>
                          <option value="อื่นๆ">อื่นๆ</option>
                        </select>
                        <button
                          onClick={handleExportAccessories}
                          className="flex-1 sm:flex-none w-full sm:w-auto bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          ส่งออก CSV
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="flex-1 sm:flex-none w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-indigo-700 hover:shadow-lg transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                      เพิ่มรายการใหม่
                    </button>
                  </div>
                </div>
                
                {currentData.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
                    <span className="text-5xl mb-4 opacity-50">📂</span>
                    <p className="font-medium">ไม่พบข้อมูลที่ค้นหา</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto flex-1 rounded-lg border border-slate-200">
                    <table className="min-w-full text-left border-collapse w-full whitespace-nowrap">
                      <thead className="bg-slate-100">
                        <tr className="text-slate-600">
                          {activeMenu === 'employees' ? (
                            <>
                              <th className="p-4 text-sm font-bold rounded-tl-lg border-b border-slate-200">รหัสพนักงาน</th>
                              <th className="p-4 text-sm font-bold border-b border-slate-200">ชื่อ-นามสกุล</th>
                              <th className="p-4 text-sm font-bold border-b border-slate-200">แผนก / บริษัท</th>
                              <th className="p-4 text-sm font-bold border-b border-slate-200">ตำแหน่ง</th>
                              <th className="p-4 text-sm font-bold text-center rounded-tr-lg border-b border-slate-200">จัดการ</th>
                            </>
                          ) : activeMenu === 'licenses' ? (
                            <>
                              <th className="p-4 text-sm font-bold rounded-tl-lg border-b border-slate-200">ชื่อโปรแกรม</th>
                              <th className="p-4 text-sm font-bold border-b border-slate-200">Product Key</th>
                              <th className="p-4 text-sm font-bold border-b border-slate-200">วันหมดอายุ</th>
                              <th className="p-4 text-sm font-bold border-b border-slate-200">ราคา</th>
                              <th className="p-4 text-sm font-bold border-b border-slate-200">สถานะ</th>
                              <th className="p-4 text-sm font-bold text-center rounded-tr-lg border-b border-slate-200">จัดการ</th>
                            </>
                          ) : (
                            <>
                              <th className="p-4 text-sm font-bold rounded-tl-lg border-b border-slate-200">ชื่ออุปกรณ์</th>
                              <th className="p-4 text-sm font-bold border-b border-slate-200">ประเภท</th>
                              {activeMenu === 'accessories' && (
                                <>
                                  <th className="p-4 text-sm font-bold border-b border-slate-200 text-center">คงเหลือ</th>
                                  <th className="p-4 text-sm font-bold border-b border-slate-200 text-center">ใช้งานไป</th>
                                  <th className="p-4 text-sm font-bold border-b border-slate-200 text-center text-red-500">ชำรุด/พัง</th>
                                </>
                              )}
                              <th className="p-4 text-sm font-bold border-b border-slate-200">ราคา</th>
                              {activeMenu !== 'accessories' && (
                                <th className="p-4 text-sm font-bold border-b border-slate-200">สถานะ</th>
                              )}
                              <th className="p-4 text-sm font-bold text-center rounded-tr-lg border-b border-slate-200">จัดการ</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {currentData.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            {activeMenu === 'employees' ? (
                              <>
                                <td className="p-4 font-bold text-indigo-700">{item.empId}</td>
                                <td className="p-4 font-medium text-slate-800">
                                  <button 
                                    onClick={() => { setSelectedEmployee(item); setEmpModalTab('info'); }}
                                    className="text-left focus:outline-none flex items-center gap-2 group"
                                    title="คลิกเพื่อดูรายละเอียดเพิ่มเติม"
                                  >
                                    <span className="font-bold text-slate-800 group-hover:underline group-hover:text-indigo-600 transition-colors">
                                      {item.fullName}
                                    </span> 
                                    {item.nickname && <span className="text-slate-500 text-sm">({item.nickname})</span>}
                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                      ดูรายละเอียด
                                    </span>
                                  </button>
                                </td>
                                <td className="p-4 text-slate-600">
                                  <div className="text-sm font-bold">{item.department}</div>
                                  <div className="text-xs text-slate-500">{item.company}</div>
                                </td>
                                <td className="p-4 text-slate-700 text-sm font-medium">{item.position}</td>
                                <td className="p-4 text-center space-x-2">
                                  <button 
                                    onClick={() => openEditEmpModal(item)}
                                    title="แก้ไข"
                                    className="inline-flex items-center justify-center w-9 h-9 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-200 hover:border-amber-500 rounded-xl transition-all shadow-sm"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(item.id, 'employees')}
                                    title="ลบ"
                                    className="inline-flex items-center justify-center w-9 h-9 text-red-600 bg-red-50 hover:bg-red-500 hover:text-white border border-red-200 hover:border-red-500 rounded-xl transition-all shadow-sm"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </td>
                              </>
                            ) : activeMenu === 'licenses' ? (
                              <>
                                <td className="p-4">
                                  <button 
                                    onClick={() => { setSelectedAssetDetail(item); setSelectedAssetCategory(activeMenu); }}
                                    className="text-left focus:outline-none flex items-center gap-2 group"
                                    title="คลิกเพื่อดูรายละเอียดเพิ่มเติม"
                                  >
                                    <span className="font-bold text-slate-800 group-hover:underline group-hover:text-indigo-600 transition-colors">
                                      {item.name}
                                    </span> 
                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                      ดูรายละเอียด
                                    </span>
                                  </button>
                                </td>
                                <td className="p-4 text-slate-600">
                                  <div className="text-sm font-medium font-mono bg-slate-100 px-2 py-0.5 rounded w-fit">{item.productKey || '-'}</div>
                                  <div className="text-xs text-slate-400 mt-1">{item.keyCode || '-'}</div>
                                </td>
                                <td className="p-4 text-sm text-slate-600 font-medium">{item.expirationDate || '-'}</td>
                                <td className="p-4 text-sm font-bold text-emerald-600">{item.cost ? `฿${Number(item.cost).toLocaleString()}` : '-'}</td>
                                <td className="p-4">
                                  {!item.status || item.status === 'พร้อมใช้งาน' ? (
                                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1.5 border border-emerald-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> พร้อมใช้งาน
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-1">
                                      <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1.5 border border-amber-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> {item.status}
                                      </div>
                                      {item.assignedName && (
                                        <span className="text-xs text-slate-500 mt-0.5 ml-1 font-medium">👤 {item.assignedName}</span>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 text-center space-x-2">
                                  {!item.status || item.status === 'พร้อมใช้งาน' ? (
                                    <button 
                                      onClick={() => setCheckoutModal({ isOpen: true, assetId: item.id, collectionName: activeMenu })}
                                      title="เบิกจ่าย"
                                      className="inline-flex items-center justify-center w-9 h-9 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 rounded-xl transition-all shadow-sm"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => handleCheckin(item.id, activeMenu)}
                                      title="รับคืน"
                                      className="inline-flex items-center justify-center w-9 h-9 text-teal-600 bg-teal-50 hover:bg-teal-600 hover:text-white border border-teal-200 hover:border-teal-600 rounded-xl transition-all shadow-sm"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => openEditLicenseModal(item)}
                                    title="แก้ไข"
                                    className="inline-flex items-center justify-center w-9 h-9 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-200 hover:border-amber-500 rounded-xl transition-all shadow-sm"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(item.id, 'licenses')}
                                    title="ลบ"
                                    className="inline-flex items-center justify-center w-9 h-9 text-red-600 bg-red-50 hover:bg-red-500 hover:text-white border border-red-200 hover:border-red-500 rounded-xl transition-all shadow-sm"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-4">
                                  <button 
                                    onClick={() => { setSelectedAssetDetail(item); setSelectedAssetCategory(activeMenu); }}
                                    className="text-left focus:outline-none flex items-center gap-2 group"
                                    title="คลิกเพื่อดูรายละเอียดเพิ่มเติม"
                                  >
                                    <span className="font-bold text-slate-800 group-hover:underline group-hover:text-indigo-600 transition-colors">
                                      {item.name}
                                    </span> 
                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                      ดูรายละเอียด
                                    </span>
                                  </button>
                                </td>
                                <td className="p-4">
                                  <span className="bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-full font-bold border border-slate-200">
                                    {item.type}
                                  </span>
                                </td>
                                {activeMenu === 'accessories' && (
                                  <>
                                    <td className="p-4 text-sm font-bold text-slate-700 text-center">
                                      {/* คำนวณจำนวนคงเหลือ โดยเอาจำนวนทั้งหมด ลบด้วยจำนวนคนที่ยืมไป */}
                                      {item.quantity ? (Number(item.quantity) - (item.assignees?.length || 0)) : (1 - (item.assignees?.length || 0))}
                                    </td>
                                    <td className="p-4 text-sm font-bold text-slate-700 text-center">
                                      {item.assignees?.length || 0}
                                    </td>
                                    <td className="p-4 text-sm font-bold text-red-500 text-center">
                                      {item.brokenQuantity || 0}
                                    </td>
                                  </>
                                )}
                                <td className="p-4 text-sm font-bold text-emerald-600">
                                  {item.cost ? `฿${Number(item.cost).toLocaleString()}` : '-'}
                                </td>
                                {activeMenu !== 'accessories' && (
                                  <td className="p-4">
                                    {item.status === 'พร้อมใช้งาน' ? (
                                      <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1.5 border border-emerald-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {item.status}
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-1">
                                        <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1.5 border border-amber-200">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> {item.status}
                                        </div>
                                        {item.assignedName && (
                                          <span className="text-xs text-slate-500 mt-0.5 ml-1 font-medium">👤 {item.assignedName}</span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                )}
                                <td className="p-4 text-center space-x-2">
                                  {activeMenu !== 'accessories' && (
                                    item.status === 'พร้อมใช้งาน' ? (
                                      <button 
                                        onClick={() => setCheckoutModal({ isOpen: true, assetId: item.id, collectionName: activeMenu })}
                                        title="เบิกจ่าย"
                                        className="inline-flex items-center justify-center w-9 h-9 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 rounded-xl transition-all shadow-sm"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                      </button>
                                    ) : (
                                      <button 
                                        onClick={() => handleCheckin(item.id, activeMenu)}
                                        title="รับคืน"
                                        className="inline-flex items-center justify-center w-9 h-9 text-teal-600 bg-teal-50 hover:bg-teal-600 hover:text-white border border-teal-200 hover:border-teal-600 rounded-xl transition-all shadow-sm"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                      </button>
                                    )
                                  )}
                                  {activeMenu === 'accessories' && Number(item.brokenQuantity || 0) > 0 && (
                                    <button 
                                      onClick={() => {
                                        setRepairModal({ isOpen: true, assetId: item.id, assetName: item.name, maxRepair: item.brokenQuantity });
                                        setRepairQuantity(1);
                                        setRepairRemarks('');
                                      }}
                                      title="ซ่อมแซม"
                                      className="inline-flex items-center justify-center w-9 h-9 text-orange-600 bg-orange-50 hover:bg-orange-500 hover:text-white border border-orange-200 hover:border-orange-500 rounded-xl transition-all shadow-sm"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => openEditAssetModal(item, activeMenu)}
                                    title="แก้ไข"
                                    className="inline-flex items-center justify-center w-9 h-9 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-200 hover:border-amber-500 rounded-xl transition-all shadow-sm"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(item.id, activeMenu)}
                                    title="ลบ"
                                    className="inline-flex items-center justify-center w-9 h-9 text-red-600 bg-red-50 hover:bg-red-500 hover:text-white border border-red-200 hover:border-red-500 rounded-xl transition-all shadow-sm"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
      <AddModal 
        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
        activeMenu={activeMenu}
        handleAddEmployee={handleAddEmployee}
        empForm={empForm}
        handleEmpChange={handleEmpChange}
        handleAddLicense={handleAddLicense}
        licenseForm={licenseForm}
        handleLicenseChange={handleLicenseChange}
        handleAdd={handleAdd}
        name={name}
        setName={setName}
        type={type}
        setType={setType}
        cost={cost}
        setCost={setCost}
        quantity={quantity}
        setQuantity={setQuantity}
      />

      {/* Modal หน้าต่างเบิกจ่ายทรัพย์สิน (Checkout) */}
      <CheckoutModal 
        checkoutModal={checkoutModal}
        setCheckoutModal={setCheckoutModal}
        handleCheckout={handleCheckout}
        checkoutSearchTerm={checkoutSearchTerm}
        setCheckoutSearchTerm={setCheckoutSearchTerm}
        checkoutEmpId={checkoutEmpId}
        setCheckoutEmpId={setCheckoutEmpId}
        employees={employees}
      />

      {/* Modal หน้าต่างแสดงรายละเอียดพนักงาน */}
      <EmployeeDetailsModal
        selectedEmployee={selectedEmployee}
        setSelectedEmployee={setSelectedEmployee}
        empModalTab={empModalTab}
        setEmpModalTab={setEmpModalTab}
        assets={assets}
        licenses={licenses}
        accessories={accessories}
        transactions={transactions}
        openEditEmpModal={openEditEmpModal}
        handleCheckin={handleCheckin}
        setReturnModal={setReturnModal}
      />

      {/* Modal หน้าต่างแสดงรายละเอียด ทรัพย์สิน / อุปกรณ์เสริม / License */}
      <AssetDetailsModal
        selectedAssetDetail={selectedAssetDetail}
        setSelectedAssetDetail={setSelectedAssetDetail}
        selectedAssetCategory={selectedAssetCategory}
        setSelectedAssetCategory={setSelectedAssetCategory}
        accessories={accessories}
        assets={assets}
        licenses={licenses}
        setCheckoutModal={setCheckoutModal}
        setReturnModal={setReturnModal}
        handleCheckin={handleCheckin}
        openEditLicenseModal={openEditLicenseModal}
        openEditAssetModal={openEditAssetModal}
      />

      {/* Modal แก้ไขข้อมูลพนักงาน */}
      <EditEmpModal
        editEmpModal={editEmpModal}
        setEditEmpModal={setEditEmpModal}
        handleUpdateEmployee={handleUpdateEmployee}
        handleEditEmpChange={handleEditEmpChange}
      />

      {/* Modal แก้ไขข้อมูลทรัพย์สิน/อุปกรณ์เสริม */}
      <EditAssetModal
        editAssetModal={editAssetModal}
        setEditAssetModal={setEditAssetModal}
        handleUpdateAsset={handleUpdateAsset}
        handleEditAssetChange={handleEditAssetChange}
      />

      {/* Modal แก้ไขข้อมูลโปรแกรม/License */}
      {/* Modal แก้ไขข้อมูลโปรแกรม/License */}
      <EditLicenseModal
        editLicenseModal={editLicenseModal}
        setEditLicenseModal={setEditLicenseModal}
        handleUpdateLicense={handleUpdateLicense}
        handleEditLicenseChange={handleEditLicenseChange}
      />

      {/* Modal หน้าต่างนำเข้าข้อมูล (Import CSV) */}
      <ImportModal
        isImportModalOpen={isImportModalOpen}
        setIsImportModalOpen={setIsImportModalOpen}
        handleDownloadTemplate={handleDownloadTemplate}
        handleImportEmployees={handleImportEmployees}
      />

      {/* Modal รับคืนระบุสภาพ (Return Modal) */}
      <ReturnModal
        returnModal={returnModal}
        setReturnModal={setReturnModal}
        returnCondition={returnCondition}
        setReturnCondition={setReturnCondition}
        returnRemarks={returnRemarks}
        setReturnRemarks={setReturnRemarks}
        handleConfirmReturn={handleConfirmReturn}
      />

      {/* Modal บันทึกการซ่อมแซม (Repair Modal) */}
      <RepairModal
        repairModal={repairModal}
        setRepairModal={setRepairModal}
        repairQuantity={repairQuantity}
        setRepairQuantity={setRepairQuantity}
        repairRemarks={repairRemarks}
        setRepairRemarks={setRepairRemarks}
        handleConfirmRepair={handleConfirmRepair}
      />

 {/* เรียกใช้งาน Component แจ้งเตือนจากไฟล์ที่เราแยกไว้ */}
      <CustomAlert customAlert={customAlert} setCustomAlert={setCustomAlert} />

    </div>
  )
}

export default App