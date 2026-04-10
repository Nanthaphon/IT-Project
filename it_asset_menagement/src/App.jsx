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
    fullName: '', fullNameEng: '', empId: '', department: '', email: '',
    company: '', position: '', nickname: '', manager: '', phone: ''
  });

  // State ฟอร์มโปรแกรม/License
  const [licenseForm, setLicenseForm] = useState({
    name: '', productKey: '', keyCode: '', supplier: '', purchaseDate: '', expirationDate: '', cost: ''
  });

  // State สำหรับเก็บข้อมูลพนักงานที่ถูกคลิกเพื่อดูรายละเอียด (Modal)
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [empModalTab, setEmpModalTab] = useState('info'); // State สำหรับ Tab ใน Modal พนักงาน ('info' หรือ 'assets')

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
      const itemStatus = item.status || 'พร้อมใช้งาน';
      const matchType = accFilterType === 'ทั้งหมด' || item.type === accFilterType;
      const matchStatus = accFilterStatus === 'ทั้งหมด' || itemStatus === accFilterStatus;
      return matchType && matchStatus;
    });

    if (filteredAccessories.length === 0) {
      setCustomAlert({ isOpen: true, title: 'ไม่พบข้อมูล!', message: 'ไม่มีข้อมูลอุปกรณ์เสริมตามเงื่อนไขที่เลือกสำหรับส่งออก', type: 'error' });
      return;
    }
    
    const exportData = filteredAccessories.map(item => ({
      'ชื่ออุปกรณ์': item.name || '',
      'ประเภท': item.type || '',
      'สถานะ': item.status || '',
      'ผู้ครอบครอง': item.assignedName || '-'
    }));

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
          // 2. คืนค่า อุปกรณ์เสริม
          const userAccessories = accessories.filter(item => item.assignedTo === id);
          for (const acc of userAccessories) {
            await updateDoc(doc(db, 'accessories', acc.id), {
              status: 'พร้อมใช้งาน',
              assignedTo: null,
              assignedName: null
            });
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
        // กำหนดให้แสดงชื่อไทยเป็นหลักในส่วนสถานะครอบครองตาม Request
        assignedName: `${emp.fullName} ${emp.nickname ? `(${emp.nickname})` : ''}`
      });
      // ปิด Modal
      setCheckoutModal({ isOpen: false, assetId: null, collectionName: '' });
      setCheckoutEmpId('');
      setCheckoutSearchTerm(''); // เคลียร์คำค้นหาหลังจากเบิกจ่ายเสร็จ
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
      const itemStatus = item.status || 'พร้อมใช้งาน';
      const matchType = accFilterType === 'ทั้งหมด' || item.type === accFilterType;
      const matchStatus = accFilterStatus === 'ทั้งหมด' || itemStatus === accFilterStatus;
      return matchType && matchStatus;
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
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-10 flex-shrink-0">
        <div className="p-4 md:p-6 text-left md:text-center border-b border-slate-800 flex justify-between items-center md:block">
          <div>
            <h1 className="text-xl md:text-2xl font-black flex items-center gap-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              💻 IT Admin
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 hidden md:block font-medium">Asset Management</p>
          </div>
          <div className="md:hidden">
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-full font-medium shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> ออนไลน์
            </span>
          </div>
        </div>
        
        <nav className="flex flex-row md:flex-col md:flex-1 p-2 md:p-4 space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button 
            onClick={() => setActiveMenu('dashboard')}
            className={`w-auto md:w-full flex items-center p-2 md:p-3 rounded-xl transition-all duration-200 ${
              activeMenu === 'dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="mr-2 md:mr-3 text-lg md:text-xl">📊</span>
            <span className="font-semibold text-sm md:text-base">หน้าหลักแดชบอร์ด</span>
          </button>

          <button 
            onClick={() => setActiveMenu('assets')}
            className={`w-auto md:w-full flex items-center p-2 md:p-3 rounded-xl transition-all duration-200 ${
              activeMenu === 'assets' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="mr-2 md:mr-3 text-lg md:text-xl">🖥️</span>
            <span className="font-semibold text-sm md:text-base">ทรัพย์สินหลัก</span>
          </button>
          
          <button 
            onClick={() => setActiveMenu('licenses')}
            className={`w-auto md:w-full flex items-center p-2 md:p-3 rounded-xl transition-all duration-200 ${
              activeMenu === 'licenses' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="mr-2 md:mr-3 text-lg md:text-xl">🔑</span>
            <span className="font-semibold text-sm md:text-base">โปรแกรม/License</span>
          </button>

          <button 
            onClick={() => setActiveMenu('accessories')}
            className={`w-auto md:w-full flex items-center p-2 md:p-3 rounded-xl transition-all duration-200 ${
              activeMenu === 'accessories' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="mr-2 md:mr-3 text-lg md:text-xl">🖱️</span>
            <span className="font-semibold text-sm md:text-base">อุปกรณ์เสริม</span>
          </button>

          <button 
            onClick={() => setActiveMenu('employees')}
            className={`w-auto md:w-full flex items-center p-2 md:p-3 rounded-xl transition-all duration-200 ${
              activeMenu === 'employees' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="mr-2 md:mr-3 text-lg md:text-xl">👥</span>
            <span className="font-semibold text-sm md:text-base">ข้อมูลพนักงาน</span>
          </button>
        </nav>
        
        <div className="hidden md:block p-4 border-t border-slate-800 text-center">
          <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 rounded-full font-medium shadow-sm flex items-center justify-center gap-2 mx-auto w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ระบบออนไลน์
          </span>
        </div>
      </aside>

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
                      {accessories.length} <span className="text-sm font-normal text-slate-400">ชิ้น</span>
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
                        <select
                          value={accFilterStatus}
                          onChange={(e) => setAccFilterStatus(e.target.value)}
                          className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-sm font-bold hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                        >
                          <option value="ทั้งหมด">สถานะ: ทั้งหมด</option>
                          <option value="พร้อมใช้งาน">พร้อมใช้งาน</option>
                          <option value="ถูกใช้งาน">ถูกใช้งาน</option>
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
                      className="flex-1 sm:flex-none w-full sm:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 hover:shadow-lg transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
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
                              <th className="p-4 text-sm font-bold border-b border-slate-200">สถานะ</th>
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
                                      <span className="text-xs text-slate-500 mt-0.5 ml-1 font-medium">👤 {item.assignedName}</span>
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
                                      <span className="text-xs text-slate-500 mt-0.5 ml-1 font-medium">👤 {item.assignedName}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 text-center space-x-2">
                                  {item.status === 'พร้อมใช้งาน' ? (
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
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
            <div className="bg-indigo-600 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="bg-white/20 p-1 rounded-md">➕</span> เพิ่มรายการใหม่
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-indigo-200 hover:text-white transition-colors focus:outline-none bg-indigo-700/50 hover:bg-indigo-700 p-1.5 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {activeMenu === 'employees' ? (
                // ฟอร์มพนักงาน
                <form onSubmit={handleAddEmployee} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">รหัสพนักงาน <span className="text-red-500">*</span></label>
                    <input type="text" name="empId" value={empForm.empId} onChange={handleEmpChange} required className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all" placeholder="เช่น EMP001" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อ นามสกุล (TH) <span className="text-red-500">*</span></label>
                      <input type="text" name="fullName" value={empForm.fullName} onChange={handleEmpChange} required className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all" placeholder="ชื่อ-นามสกุล" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อ นามสกุล (EN)</label>
                      <input type="text" name="fullNameEng" value={empForm.fullNameEng} onChange={handleEmpChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all" placeholder="Firstname Lastname" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อเล่น</label>
                      <input type="text" name="nickname" value={empForm.nickname} onChange={handleEmpChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all" placeholder="ชื่อเล่น" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">เบอร์โทร</label>
                      <input type="tel" name="phone" value={empForm.phone} onChange={handleEmpChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all" placeholder="เบอร์โทรศัพท์" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
                    <input type="email" name="email" value={empForm.email} onChange={handleEmpChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all" placeholder="อีเมลบริษัท" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">บริษัท</label>
                    <input type="text" name="company" value={empForm.company} onChange={handleEmpChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all" placeholder="ชื่อบริษัท" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">แผนก</label>
                      <input type="text" name="department" value={empForm.department} onChange={handleEmpChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all" placeholder="แผนก" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">ตำแหน่ง</label>
                      <input type="text" name="position" value={empForm.position} onChange={handleEmpChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all" placeholder="ตำแหน่งงาน" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อหัวหน้างาน</label>
                    <input type="text" name="manager" value={empForm.manager} onChange={handleEmpChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all" placeholder="หัวหน้างาน" />
                  </div>
                  <div className="pt-2">
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]">
                      บันทึกข้อมูลพนักงาน
                    </button>
                  </div>
                </form>
              ) : activeMenu === 'licenses' ? (
                // ฟอร์มโปรแกรม/License
                <form onSubmit={handleAddLicense} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อโปรแกรม <span className="text-red-500">*</span></label>
                    <input type="text" name="name" value={licenseForm.name} onChange={handleLicenseChange} required className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all" placeholder="ระบุชื่อโปรแกรม..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Product Key License</label>
                    <input type="text" name="productKey" value={licenseForm.productKey} onChange={handleLicenseChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all font-mono" placeholder="เช่น A1B2-C3D4-E5F6" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">รหัสของ Product Key</label>
                    <input type="text" name="keyCode" value={licenseForm.keyCode} onChange={handleLicenseChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all" placeholder="รหัสอ้างอิงของ Key" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Supplier ที่ซื้อ</label>
                    <input type="text" name="supplier" value={licenseForm.supplier} onChange={handleLicenseChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all" placeholder="ชื่อร้านค้า/ตัวแทนจำหน่าย" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">วันที่ซื้อ</label>
                      <input type="date" name="purchaseDate" value={licenseForm.purchaseDate} onChange={handleLicenseChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all text-slate-600" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">วันที่หมดอายุ</label>
                      <input type="date" name="expirationDate" value={licenseForm.expirationDate} onChange={handleLicenseChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all text-slate-600" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">ราคา (บาท)</label>
                    <input type="number" name="cost" value={licenseForm.cost} onChange={handleLicenseChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all" placeholder="ระบุราคา..." />
                  </div>
                  <div className="pt-2">
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]">
                      บันทึกข้อมูล License
                    </button>
                  </div>
                </form>
              ) : (
                // ฟอร์มทรัพย์สิน / อุปกรณ์เสริม
                <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่ออุปกรณ์ / รุ่น <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                      placeholder="ระบุชื่ออุปกรณ์..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">ประเภท</label>
                    <select 
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white transition-all text-sm text-slate-700"
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
                  
                  <div className="pt-2">
                    <button 
                      type="submit" 
                      className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
                    >
                      บันทึกข้อมูล
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal หน้าต่างเบิกจ่ายทรัพย์สิน (Checkout) */}
      {checkoutModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all border border-slate-100">
            <div className="bg-indigo-600 text-white p-5">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="bg-white/20 p-1 rounded-md">📤</span> ระบุพนักงานที่เบิกจ่าย
              </h3>
            </div>
            <form onSubmit={handleCheckout} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">ค้นหาพนักงาน</label>
                <div className="relative mb-3">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อ หรือ รหัสพนักงาน..."
                    value={checkoutSearchTerm}
                    onChange={(e) => setCheckoutSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm transition-all"
                  />
                </div>
                <label className="block text-sm font-bold text-slate-700 mb-2">เลือกพนักงาน</label>
                <select 
                  value={checkoutEmpId}
                  onChange={(e) => setCheckoutEmpId(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm text-slate-700 transition-all"
                  required
                >
                  <option value="" disabled>-- เลือกพนักงาน --</option>
                  {employees.filter(emp => {
                    const term = checkoutSearchTerm.toLowerCase();
                    return (emp.fullName?.toLowerCase().includes(term) || 
                            emp.fullNameEng?.toLowerCase().includes(term) ||
                            emp.empId?.toLowerCase().includes(term) ||
                            emp.nickname?.toLowerCase().includes(term));
                  }).map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.empId} - {emp.fullName} {emp.nickname ? `(${emp.nickname})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => { setCheckoutModal({ isOpen: false, assetId: null, collectionName: '' }); setCheckoutEmpId(''); setCheckoutSearchTerm(''); }}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-colors shadow-md shadow-indigo-600/20"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
            <div className="bg-slate-800 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="bg-white/20 p-1 rounded-md text-sm">📋</span> ข้อมูลพนักงาน
              </h3>
              <button 
                onClick={() => setSelectedEmployee(null)} 
                className="text-slate-400 hover:text-white transition-colors focus:outline-none bg-slate-700 hover:bg-slate-600 p-1.5 rounded-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* แท็บเมนู (Tabs) */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => setEmpModalTab('info')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${empModalTab === 'info' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
              >
                ข้อมูลทั่วไป
              </button>
              <button
                onClick={() => setEmpModalTab('assets')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${empModalTab === 'assets' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
              >
                ทรัพย์สินที่ครอบครอง
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-800 flex-1">
              {empModalTab === 'info' ? (
                <div className="bg-white rounded-xl">
                  {/* ข้อมูลทั่วไป */}
                  <div className="grid grid-cols-3 border-b border-slate-100 pb-3 mt-2">
                    <span className="text-slate-500 font-bold">รหัสพนักงาน:</span>
                    <span className="col-span-2 font-black text-indigo-700 text-base">{selectedEmployee.empId}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-100 pb-3 mt-3">
                    <span className="text-slate-500 font-bold">ชื่อ-นามสกุล (TH):</span>
                    <span className="col-span-2 font-bold text-slate-800">
                      {selectedEmployee.fullName} {selectedEmployee.nickname ? <span className="text-slate-400 font-medium">({selectedEmployee.nickname})</span> : ''}
                    </span>
                  </div>
                  {selectedEmployee.fullNameEng && (
                    <div className="grid grid-cols-3 border-b border-slate-100 pb-3 mt-3">
                      <span className="text-slate-500 font-bold">ชื่อ-นามสกุล (EN):</span>
                      <span className="col-span-2 font-medium text-slate-800">
                        {selectedEmployee.fullNameEng}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 border-b border-slate-100 pb-3 mt-3">
                    <span className="text-slate-500 font-bold">ตำแหน่ง:</span>
                    <span className="col-span-2 font-medium">{selectedEmployee.position || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-100 pb-3 mt-3">
                    <span className="text-slate-500 font-bold">แผนก:</span>
                    <span className="col-span-2 font-medium">{selectedEmployee.department || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-100 pb-3 mt-3">
                    <span className="text-slate-500 font-bold">บริษัท:</span>
                    <span className="col-span-2 font-medium">{selectedEmployee.company || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-100 pb-3 mt-3">
                    <span className="text-slate-500 font-bold">อีเมล (Email):</span>
                    <span className="col-span-2 font-medium text-blue-600">{selectedEmployee.email || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-100 pb-3 mt-3">
                    <span className="text-slate-500 font-bold">เบอร์โทรศัพท์:</span>
                    <span className="col-span-2 font-medium">{selectedEmployee.phone || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 mt-3">
                    <span className="text-slate-500 font-bold">หัวหน้างาน:</span>
                    <span className="col-span-2 font-medium">{selectedEmployee.manager || '-'}</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* ทรัพย์สินที่ครอบครอง */}
                  <div className="space-y-3">
                    {[...assets, ...accessories, ...licenses].filter(item => item.assignedTo === selectedEmployee.id).length === 0 ? (
                      <div className="text-center text-slate-400 py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <span className="text-4xl block mb-3 opacity-50">📦</span>
                        <p className="font-medium">ยังไม่มีทรัพย์สินที่ถือครองในระบบ</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-100">
                        {[...assets, ...accessories, ...licenses].filter(item => item.assignedTo === selectedEmployee.id).map(item => (
                          <li key={item.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                            <div>
                              <p className="font-bold text-slate-800 text-base">{item.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{item.type || 'License'}</p>
                            </div>
                            <span className="text-[10px] uppercase tracking-wider bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 font-bold">
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
            
            <div className="p-5 bg-slate-50 flex justify-end gap-3 border-t border-slate-200">
               <button 
                 onClick={() => openEditEmpModal(selectedEmployee)} 
                 className="px-5 py-2.5 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 font-bold transition-colors border border-amber-200"
               >
                 แก้ไขข้อมูล
               </button>
               <button 
                 onClick={() => setSelectedEmployee(null)} 
                 className="px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-bold transition-colors shadow-md"
               >
                 ปิดหน้าต่าง
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal หน้าต่างแสดงรายละเอียด ทรัพย์สิน / อุปกรณ์เสริม / License */}
      {selectedAssetDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
            <div className="bg-slate-800 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="bg-white/20 p-1 rounded-md text-sm">📋</span> รายละเอียด{selectedAssetCategory === 'assets' ? 'ทรัพย์สินหลัก' : selectedAssetCategory === 'accessories' ? 'อุปกรณ์เสริม' : 'โปรแกรม/License'}
              </h3>
              <button 
                onClick={() => { setSelectedAssetDetail(null); setSelectedAssetCategory(''); }} 
                className="text-slate-400 hover:text-white transition-colors focus:outline-none bg-slate-700 hover:bg-slate-600 p-1.5 rounded-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-800 flex-1">
              <div className="bg-white rounded-xl">
                {selectedAssetCategory === 'licenses' ? (
                  <>
                    <div className="grid grid-cols-3 border-b border-slate-100 pb-3 mt-2">
                      <span className="text-slate-500 font-bold">ชื่อโปรแกรม:</span>
                      <span className="col-span-2 font-black text-indigo-700 text-base">{selectedAssetDetail.name}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-slate-100 pb-3 mt-3">
                      <span className="text-slate-500 font-bold">Product Key:</span>
                      <span className="col-span-2 font-mono bg-slate-100 px-2 py-0.5 rounded w-fit text-slate-700">{selectedAssetDetail.productKey || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-slate-100 pb-3 mt-3">
                      <span className="text-slate-500 font-bold">รหัสอ้างอิง Key:</span>
                      <span className="col-span-2 font-medium">{selectedAssetDetail.keyCode || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-slate-100 pb-3 mt-3">
                      <span className="text-slate-500 font-bold">Supplier ที่ซื้อ:</span>
                      <span className="col-span-2 font-medium">{selectedAssetDetail.supplier || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-slate-100 pb-3 mt-3">
                      <span className="text-slate-500 font-bold">วันที่ซื้อ:</span>
                      <span className="col-span-2 font-medium">{selectedAssetDetail.purchaseDate || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-slate-100 pb-3 mt-3">
                      <span className="text-slate-500 font-bold">วันที่หมดอายุ:</span>
                      <span className="col-span-2 font-medium">{selectedAssetDetail.expirationDate || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-slate-100 pb-3 mt-3">
                      <span className="text-slate-500 font-bold">ราคา:</span>
                      <span className="col-span-2 font-bold text-emerald-600">{selectedAssetDetail.cost ? `฿${Number(selectedAssetDetail.cost).toLocaleString()}` : '-'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-3 border-b border-slate-100 pb-3 mt-2">
                      <span className="text-slate-500 font-bold">ชื่ออุปกรณ์:</span>
                      <span className="col-span-2 font-black text-indigo-700 text-base">{selectedAssetDetail.name}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-slate-100 pb-3 mt-3">
                      <span className="text-slate-500 font-bold">ประเภท:</span>
                      <span className="col-span-2 font-medium">
                        <span className="bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-full font-bold border border-slate-200">
                          {selectedAssetDetail.type}
                        </span>
                      </span>
                    </div>
                  </>
                )}
                
                <div className="grid grid-cols-3 border-b border-slate-100 pb-3 mt-3">
                  <span className="text-slate-500 font-bold">สถานะ:</span>
                  <span className="col-span-2">
                    {(!selectedAssetDetail.status || selectedAssetDetail.status === 'พร้อมใช้งาน') ? (
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> พร้อมใช้งาน
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> {selectedAssetDetail.status}
                      </span>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 mt-3">
                  <span className="text-slate-500 font-bold">ผู้ครอบครอง:</span>
                  <span className="col-span-2 font-medium">
                    {selectedAssetDetail.assignedName ? `👤 ${selectedAssetDetail.assignedName}` : '-'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-5 bg-slate-50 flex justify-end gap-3 border-t border-slate-200">
               <button 
                 onClick={() => {
                   if (selectedAssetCategory === 'licenses') {
                     openEditLicenseModal(selectedAssetDetail);
                   } else {
                     openEditAssetModal(selectedAssetDetail, selectedAssetCategory);
                   }
                   setSelectedAssetDetail(null);
                   setSelectedAssetCategory('');
                 }} 
                 className="px-5 py-2.5 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 font-bold transition-colors border border-amber-200"
               >
                 แก้ไขข้อมูล
               </button>
               <button 
                 onClick={() => { setSelectedAssetDetail(null); setSelectedAssetCategory(''); }} 
                 className="px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-bold transition-colors shadow-md"
               >
                 ปิดหน้าต่าง
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal แก้ไขข้อมูลพนักงาน */}
      {editEmpModal.isOpen && editEmpModal.data && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
            <div className="bg-amber-500 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="bg-black/10 p-1 rounded-md text-sm">✏️</span> แก้ไขข้อมูลพนักงาน
              </h3>
              <button onClick={() => setEditEmpModal({ isOpen: false, data: null })} className="text-amber-100 hover:text-white focus:outline-none bg-amber-600/50 hover:bg-amber-600 p-1.5 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateEmployee} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">รหัสพนักงาน <span className="text-red-500">*</span></label>
                <input type="text" name="empId" value={editEmpModal.data.empId} onChange={handleEditEmpChange} required className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อ นามสกุล (TH) <span className="text-red-500">*</span></label>
                  <input type="text" name="fullName" value={editEmpModal.data.fullName} onChange={handleEditEmpChange} required className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อ นามสกุล (EN)</label>
                  <input type="text" name="fullNameEng" value={editEmpModal.data.fullNameEng || ''} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all" placeholder="Firstname Lastname" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อเล่น</label>
                  <input type="text" name="nickname" value={editEmpModal.data.nickname} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">เบอร์โทร</label>
                  <input type="tel" name="phone" value={editEmpModal.data.phone} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
                <input type="email" name="email" value={editEmpModal.data.email} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">บริษัท</label>
                <input type="text" name="company" value={editEmpModal.data.company} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">แผนก</label>
                  <input type="text" name="department" value={editEmpModal.data.department} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ตำแหน่ง</label>
                  <input type="text" name="position" value={editEmpModal.data.position} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อหัวหน้างาน</label>
                <input type="text" name="manager" value={editEmpModal.data.manager} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditEmpModal({ isOpen: false, data: null })} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-bold transition-colors shadow-md shadow-amber-500/30">
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal แก้ไขข้อมูลทรัพย์สิน/อุปกรณ์เสริม */}
      {editAssetModal.isOpen && editAssetModal.data && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
            <div className="bg-amber-500 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="bg-black/10 p-1 rounded-md text-sm">✏️</span> แก้ไข{editAssetModal.collectionName === 'assets' ? 'ทรัพย์สินหลัก' : 'อุปกรณ์เสริม'}
              </h3>
              <button onClick={() => setEditAssetModal({ isOpen: false, data: null, collectionName: '' })} className="text-amber-100 hover:text-white focus:outline-none bg-amber-600/50 hover:bg-amber-600 p-1.5 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateAsset} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่ออุปกรณ์ / รุ่น <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={editAssetModal.data.name} onChange={handleEditAssetChange} required className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ประเภท</label>
                <select name="type" value={editAssetModal.data.type} onChange={handleEditAssetChange} className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white text-sm text-slate-700 transition-all">
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
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditAssetModal({ isOpen: false, data: null, collectionName: '' })} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-bold transition-colors shadow-md shadow-amber-500/30">
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal แก้ไขข้อมูลโปรแกรม/License */}
      {editLicenseModal.isOpen && editLicenseModal.data && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
            <div className="bg-amber-500 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="bg-black/10 p-1 rounded-md text-sm">✏️</span> แก้ไขข้อมูลโปรแกรม/License
              </h3>
              <button onClick={() => setEditLicenseModal({ isOpen: false, data: null })} className="text-amber-100 hover:text-white focus:outline-none bg-amber-600/50 hover:bg-amber-600 p-1.5 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateLicense} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อโปรแกรม <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={editLicenseModal.data.name} onChange={handleEditLicenseChange} required className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Product Key License</label>
                <input type="text" name="productKey" value={editLicenseModal.data.productKey} onChange={handleEditLicenseChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">รหัสของ Product Key</label>
                <input type="text" name="keyCode" value={editLicenseModal.data.keyCode} onChange={handleEditLicenseChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Supplier ที่ซื้อ</label>
                <input type="text" name="supplier" value={editLicenseModal.data.supplier} onChange={handleEditLicenseChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">วันที่ซื้อ (Purchase Date)</label>
                  <input type="date" name="purchaseDate" value={editLicenseModal.data.purchaseDate} onChange={handleEditLicenseChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all text-slate-600" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">วันที่หมดอายุ (Exp. Date)</label>
                  <input type="date" name="expirationDate" value={editLicenseModal.data.expirationDate} onChange={handleEditLicenseChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all text-slate-600" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ราคา (Purchase Cost)</label>
                <input type="number" name="cost" value={editLicenseModal.data.cost} onChange={handleEditLicenseChange} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditLicenseModal({ isOpen: false, data: null })} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-bold transition-colors shadow-md shadow-amber-500/30">
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal หน้าต่างนำเข้าข้อมูล (Import CSV) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all flex flex-col border border-slate-100">
            <div className="bg-emerald-600 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="bg-white/20 p-1 rounded-md text-sm">⬇️</span> นำเข้าข้อมูลพนักงาน
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-emerald-100 hover:text-white focus:outline-none bg-emerald-700/50 hover:bg-emerald-700 p-1.5 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              
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
                    className="w-full bg-white border-2 border-blue-500 text-blue-600 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 hover:border-blue-600 transition-all shadow-sm flex items-center justify-center gap-2"
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
                    className="w-full bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2 text-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    เลือกไฟล์เพื่อนำเข้า
                  </label>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal แจ้งเตือน Custom Alert แทนการใช้ alert() ของเบราว์เซอร์ */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80] transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all border border-slate-100 text-center p-6">
            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${customAlert.type === 'error' ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'} mb-4`}>
              {customAlert.type === 'error' ? (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              ) : (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{customAlert.title}</h3>
            <p className="text-sm text-slate-500 mb-6 whitespace-pre-line leading-relaxed">
              {customAlert.message}
            </p>
            <button 
              onClick={() => setCustomAlert({ ...customAlert, isOpen: false })}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md ${
                customAlert.type === 'error' 
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default App