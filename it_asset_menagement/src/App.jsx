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
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
            <div className="bg-indigo-600 text-white px-6 py-5 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="bg-white/20 p-1.5 rounded-lg">➕</span> เพิ่มรายการใหม่
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-indigo-200 hover:text-white transition-colors focus:outline-none bg-indigo-700/50 hover:bg-indigo-700 p-1.5 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto">
              {activeMenu === 'employees' ? (
                // ฟอร์มพนักงาน
                <form onSubmit={handleAddEmployee} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">รหัสพนักงาน <span className="text-red-500">*</span></label>
                    <input type="text" name="empId" value={empForm.empId || ''} onChange={handleEmpChange} required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="เช่น EMP001" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อ นามสกุล (TH) <span className="text-red-500">*</span></label>
                      <input type="text" name="fullName" value={empForm.fullName || ''} onChange={handleEmpChange} required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="ชื่อ-นามสกุล" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อ นามสกุล (EN)</label>
                      <input type="text" name="fullNameEng" value={empForm.fullNameEng || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="Firstname Lastname" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อเล่น</label>
                      <input type="text" name="nickname" value={empForm.nickname || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="ชื่อเล่น" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">เบอร์โทร</label>
                      <input type="tel" name="phone" value={empForm.phone || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="เบอร์โทรศัพท์" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                    <input type="email" name="email" value={empForm.email || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="อีเมลบริษัท" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">บริษัท</label>
                    <input type="text" name="company" value={empForm.company || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="ชื่อบริษัท" />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">แผนก</label>
                      <input type="text" name="department" value={empForm.department || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="แผนก" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">ตำแหน่ง</label>
                      <input type="text" name="position" value={empForm.position || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="ตำแหน่งงาน" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อหัวหน้างาน</label>
                    <input type="text" name="manager" value={empForm.manager || ''} onChange={handleEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="หัวหน้างาน" />
                  </div>
                  <div className="pt-2">
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]">
                      บันทึกข้อมูลพนักงาน
                    </button>
                  </div>
                </form>
              ) : activeMenu === 'licenses' ? (
                // ฟอร์มโปรแกรม/License
                <form onSubmit={handleAddLicense} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อโปรแกรม <span className="text-red-500">*</span></label>
                    <input type="text" name="name" value={licenseForm.name || ''} onChange={handleLicenseChange} required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="ระบุชื่อโปรแกรม..." />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Product Key License</label>
                    <input type="text" name="productKey" value={licenseForm.productKey || ''} onChange={handleLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all font-mono shadow-sm" placeholder="เช่น A1B2-C3D4-E5F6" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">รหัสของ Product Key</label>
                    <input type="text" name="keyCode" value={licenseForm.keyCode || ''} onChange={handleLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="รหัสอ้างอิงของ Key" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Supplier ที่ซื้อ</label>
                    <input type="text" name="supplier" value={licenseForm.supplier || ''} onChange={handleLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="ชื่อร้านค้า/ตัวแทนจำหน่าย" />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่ซื้อ</label>
                      <input type="date" name="purchaseDate" value={licenseForm.purchaseDate || ''} onChange={handleLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all text-slate-600 shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่หมดอายุ</label>
                      <input type="date" name="expirationDate" value={licenseForm.expirationDate || ''} onChange={handleLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all text-slate-600 shadow-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">ราคา (บาท)</label>
                    <input type="number" name="cost" value={licenseForm.cost || ''} onChange={handleLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" placeholder="ระบุราคา..." />
                  </div>
                  <div className="pt-2">
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]">
                      บันทึกข้อมูล License
                    </button>
                  </div>
                </form>
              ) : (
                // ฟอร์มทรัพย์สิน / อุปกรณ์เสริม
                <form onSubmit={handleAdd} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่ออุปกรณ์ / รุ่น <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm shadow-sm"
                      placeholder="ระบุชื่ออุปกรณ์..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">ประเภท</label>
                    <select 
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white transition-all text-sm text-slate-700 shadow-sm cursor-pointer"
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

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">ราคา (บาท)</label>
                    <input 
                      type="number" 
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm shadow-sm"
                      placeholder="ระบุราคา..."
                    />
                  </div>

                  {/* แสดงช่องกรอก "จำนวน" เฉพาะในเมนูอุปกรณ์เสริมเท่านั้น */}
                  {activeMenu === 'accessories' && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">จำนวน (ชิ้น) <span className="text-red-500">*</span></label>
                      <input 
                        type="number" 
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm shadow-sm"
                        placeholder="ระบุจำนวน..."
                        required
                      />
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <button 
                      type="submit" 
                      className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all border border-slate-100">
            <div className="bg-indigo-600 text-white px-6 py-5 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="bg-white/20 p-1.5 rounded-lg">📤</span> ระบุพนักงานที่เบิกจ่าย
              </h3>
              <button onClick={() => { setCheckoutModal({ isOpen: false, assetId: null, collectionName: '' }); setCheckoutEmpId(''); setCheckoutSearchTerm(''); }} className="text-indigo-200 hover:text-white transition-colors focus:outline-none bg-indigo-700/50 hover:bg-indigo-700 p-1.5 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCheckout} className="p-6 md:p-8 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">ค้นหาพนักงาน</label>
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อ หรือ รหัสพนักงาน..."
                    value={checkoutSearchTerm}
                    onChange={(e) => setCheckoutSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-sm transition-all shadow-sm"
                  />
                </div>
                <label className="block text-sm font-bold text-slate-700 mb-2">เลือกพนักงาน</label>
                <select 
                  value={checkoutEmpId}
                  onChange={(e) => setCheckoutEmpId(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-sm text-slate-700 transition-all shadow-sm cursor-pointer"
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
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => { setCheckoutModal({ isOpen: false, assetId: null, collectionName: '' }); setCheckoutEmpId(''); setCheckoutSearchTerm(''); }}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-all"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-all shadow-lg shadow-indigo-600/30"
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
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
            <div className="bg-slate-800 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="bg-white/20 p-1.5 rounded-lg text-sm">📋</span> ข้อมูลพนักงาน
              </h3>
              <button 
                onClick={() => setSelectedEmployee(null)} 
                className="text-slate-400 hover:text-white transition-colors focus:outline-none bg-slate-700 hover:bg-slate-600 p-1.5 rounded-xl"
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
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${empModalTab === 'info' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
              >
                ข้อมูลทั่วไป
              </button>
              <button
                onClick={() => setEmpModalTab('assets')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${empModalTab === 'assets' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
              >
                ครอบครองปัจจุบัน
              </button>
              <button
                onClick={() => setEmpModalTab('history')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${empModalTab === 'history' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
              >
                ประวัติการเบิก-คืน
              </button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto space-y-4 text-sm md:text-base text-slate-800 flex-1">
              {empModalTab === 'info' ? (
                <div className="bg-white rounded-xl">
                  {/* ข้อมูลทั่วไป */}
                  <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 mt-2">
                    <span className="text-slate-500 font-bold text-sm md:text-base">รหัสพนักงาน:</span>
                    <span className="col-span-2 font-black text-indigo-700 text-lg md:text-xl">{selectedEmployee.empId}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                    <span className="text-slate-500 font-bold text-sm md:text-base">ชื่อ-นามสกุล (TH):</span>
                    <span className="col-span-2 font-bold text-slate-800">
                      {selectedEmployee.fullName} {selectedEmployee.nickname ? <span className="text-slate-400 font-medium">({selectedEmployee.nickname})</span> : ''}
                    </span>
                  </div>
                  {selectedEmployee.fullNameEng && (
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                      <span className="text-slate-500 font-bold text-sm md:text-base">ชื่อ-นามสกุล (EN):</span>
                      <span className="col-span-2 font-medium text-slate-800">
                        {selectedEmployee.fullNameEng}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                    <span className="text-slate-500 font-bold text-sm md:text-base">ตำแหน่ง:</span>
                    <span className="col-span-2 font-medium">{selectedEmployee.position || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                    <span className="text-slate-500 font-bold text-sm md:text-base">แผนก:</span>
                    <span className="col-span-2 font-medium">{selectedEmployee.department || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                    <span className="text-slate-500 font-bold text-sm md:text-base">บริษัท:</span>
                    <span className="col-span-2 font-medium">{selectedEmployee.company || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                    <span className="text-slate-500 font-bold text-sm md:text-base">อีเมล (Email):</span>
                    <span className="col-span-2 font-medium text-blue-600">{selectedEmployee.email || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                    <span className="text-slate-500 font-bold text-sm md:text-base">เบอร์โทรศัพท์:</span>
                    <span className="col-span-2 font-medium">{selectedEmployee.phone || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 pt-3 md:pt-4">
                    <span className="text-slate-500 font-bold text-sm md:text-base">หัวหน้างาน:</span>
                    <span className="col-span-2 font-medium">{selectedEmployee.manager || '-'}</span>
                  </div>
                </div>
              ) : empModalTab === 'assets' ? (
                <>
                  {/* ทรัพย์สินที่ครอบครอง */}
                  <div className="space-y-3">
                    {(() => {
                      const empAssets = assets.filter(item => item.assignedTo === selectedEmployee.id);
                      const empLicenses = licenses.filter(item => item.assignedTo === selectedEmployee.id);
                      
                      // ดึงอุปกรณ์เสริมที่พนักงานคนนี้ยืมไปทั้งหมด
                      const empAccessories = accessories.reduce((accList, acc) => {
                        if (acc.assignees) {
                          acc.assignees.filter(a => a.empId === selectedEmployee.id).forEach(checkout => {
                            accList.push({ ...acc, uniqueKey: checkout.checkoutId });
                          });
                        } else if (acc.assignedTo === selectedEmployee.id) {
                          accList.push({ ...acc, uniqueKey: acc.id }); // รองรับระบบเดิม
                        }
                        return accList;
                      }, []);
                      
                      const allHeldItems = [...empAssets, ...empLicenses, ...empAccessories];
                      
                      if (allHeldItems.length === 0) {
                        return (
                          <div className="text-center text-slate-400 py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <span className="text-4xl block mb-3 opacity-50">📦</span>
                            <p className="font-medium text-base">ยังไม่มีทรัพย์สินที่ถือครองในระบบ</p>
                          </div>
                        );
                      }

                      return (
                        <ul className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-100 shadow-sm">
                          {allHeldItems.map(item => (
                            <li key={item.uniqueKey || item.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                              <div>
                                <p className="font-bold text-slate-800 text-lg">{item.name}</p>
                                <p className="text-sm text-slate-500 mt-1">{item.type || 'License'}</p>
                              </div>
                              <span className="text-xs uppercase tracking-wider bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 font-bold">
                                {assets.some(a => a.id === item.id) ? 'ทรัพย์สินหลัก' : 
                                 accessories.some(a => a.id === item.id) ? 'อุปกรณ์เสริม' : 'โปรแกรม/License'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <>
                  {/* ประวัติการเบิก-คืน อุปกรณ์ */}
                  <div className="space-y-3">
                    {(() => {
                      // กรองประวัติเฉพาะของพนักงานคนนี้ และเรียงจากใหม่ไปเก่า
                      const empHistory = transactions
                        .filter(t => t.empId === selectedEmployee.id)
                        .sort((a, b) => b.timestamp - a.timestamp);

                      if (empHistory.length === 0) {
                        return (
                          <div className="text-center text-slate-400 py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <span className="text-4xl block mb-3 opacity-50">🕒</span>
                            <p className="font-medium text-base">ยังไม่มีประวัติการทำรายการ</p>
                          </div>
                        );
                      }

                      return (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                          <table className="min-w-full text-left border-collapse w-full whitespace-nowrap text-sm">
                            <thead className="bg-slate-100">
                              <tr className="text-slate-600">
                                <th className="p-3 md:p-4 font-bold border-b border-slate-200">วันที่ทำรายการ</th>
                                <th className="p-3 md:p-4 font-bold border-b border-slate-200">รายการ/รุ่นอุปกรณ์</th>
                                <th className="p-3 md:p-4 font-bold border-b border-slate-200">ประเภททำรายการ</th>
                                <th className="p-3 md:p-4 font-bold border-b border-slate-200">สภาพ</th>
                                <th className="p-3 md:p-4 font-bold border-b border-slate-200">หมายเหตุ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {empHistory.map(record => {
                                const dateObj = new Date(record.timestamp);
                                const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
                                
                                return (
                                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3 md:p-4 text-slate-500 font-medium">{formattedDate}</td>
                                    <td className="p-3 md:p-4 text-slate-800 font-bold text-base">{record.assetName}</td>
                                    <td className="p-3 md:p-4 text-slate-700 font-medium">{record.action}</td>
                                    <td className="p-3 md:p-4">
                                      {record.condition === 'ปกติ' ? (
                                        <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> ปกติ
                                        </span>
                                      ) : (
                                        <span className="text-red-500 font-bold flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full bg-red-500"></span> ชำรุด
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 md:p-4 text-slate-500 max-w-[200px] truncate" title={record.remarks}>{record.remarks}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
            
            <div className="p-5 md:p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-200">
               <button 
                 onClick={() => openEditEmpModal(selectedEmployee)} 
                 className="px-6 py-3 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 font-bold transition-colors border border-amber-200 text-sm md:text-base"
               >
                 แก้ไขข้อมูล
               </button>
               <button 
                 onClick={() => setSelectedEmployee(null)} 
                 className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-bold transition-colors shadow-md text-sm md:text-base"
               >
                 ปิดหน้าต่าง
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal หน้าต่างแสดงรายละเอียด ทรัพย์สิน / อุปกรณ์เสริม / License */}
      {selectedAssetDetail && (() => {
        // หาข้อมูลล่าสุดจาก state เพื่อให้จำนวนและสถานะอัปเดตแบบเรียลไทม์ทันทีที่กดเบิกจ่าย/รับคืน
        const currentAssetDetail = 
          selectedAssetCategory === 'accessories' ? (accessories.find(a => a.id === selectedAssetDetail.id) || selectedAssetDetail) :
          selectedAssetCategory === 'assets' ? (assets.find(a => a.id === selectedAssetDetail.id) || selectedAssetDetail) :
          (licenses.find(l => l.id === selectedAssetDetail.id) || selectedAssetDetail);

        return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
            <div className="bg-slate-800 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="bg-white/20 p-1.5 rounded-lg text-sm">📋</span> รายละเอียด{selectedAssetCategory === 'assets' ? 'ทรัพย์สินหลัก' : selectedAssetCategory === 'accessories' ? 'อุปกรณ์เสริม' : 'โปรแกรม/License'}
              </h3>
              <button 
                onClick={() => { setSelectedAssetDetail(null); setSelectedAssetCategory(''); }} 
                className="text-slate-400 hover:text-white transition-colors focus:outline-none bg-slate-700 hover:bg-slate-600 p-1.5 rounded-xl"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto space-y-4 text-sm md:text-base text-slate-800 flex-1">
              <div className="bg-white rounded-xl">
                {selectedAssetCategory === 'licenses' ? (
                  <>
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 mt-2">
                      <span className="text-slate-500 font-bold text-sm md:text-base">ชื่อโปรแกรม:</span>
                      <span className="col-span-2 font-black text-indigo-700 text-lg md:text-xl">{currentAssetDetail.name}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                      <span className="text-slate-500 font-bold text-sm md:text-base">Product Key:</span>
                      <span className="col-span-2 font-mono bg-slate-100 px-3 py-1 rounded-lg w-fit text-slate-700 text-base">{currentAssetDetail.productKey || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                      <span className="text-slate-500 font-bold text-sm md:text-base">รหัสอ้างอิง Key:</span>
                      <span className="col-span-2 font-medium">{currentAssetDetail.keyCode || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                      <span className="text-slate-500 font-bold text-sm md:text-base">Supplier ที่ซื้อ:</span>
                      <span className="col-span-2 font-medium">{currentAssetDetail.supplier || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                      <span className="text-slate-500 font-bold text-sm md:text-base">วันที่ซื้อ:</span>
                      <span className="col-span-2 font-medium">{currentAssetDetail.purchaseDate || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                      <span className="text-slate-500 font-bold text-sm md:text-base">วันที่หมดอายุ:</span>
                      <span className="col-span-2 font-medium">{currentAssetDetail.expirationDate || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                      <span className="text-slate-500 font-bold text-sm md:text-base">ราคา:</span>
                      <span className="col-span-2 font-bold text-emerald-600 text-lg">{currentAssetDetail.cost ? `฿${Number(currentAssetDetail.cost).toLocaleString()}` : '-'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 mt-2 items-center">
                      <span className="text-slate-500 font-bold text-sm md:text-base">ชื่ออุปกรณ์:</span>
                      <span className="col-span-2 font-black text-indigo-700 text-lg md:text-xl">{currentAssetDetail.name}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center">
                      <span className="text-slate-500 font-bold text-sm md:text-base">ประเภท:</span>
                      <span className="col-span-2 font-medium">
                        <span className="bg-slate-100 text-slate-600 text-sm px-4 py-2 rounded-full font-bold border border-slate-200">
                          {currentAssetDetail.type}
                        </span>
                      </span>
                    </div>
                    {selectedAssetCategory === 'accessories' && (
                      <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center">
                        <span className="text-slate-500 font-bold text-sm md:text-base">จำนวนคงเหลือ:</span>
                        {/* คำนวณจำนวนคงเหลือในหน้ารายละเอียดด้วยเช่นกัน */}
                        <span className="col-span-2 font-medium text-lg">
                          {currentAssetDetail.quantity ? (Number(currentAssetDetail.quantity) - (currentAssetDetail.assignees?.length || 0)) : (1 - (currentAssetDetail.assignees?.length || 0))} ชิ้น
                        </span>
                      </div>
                    )}
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center">
                      <span className="text-slate-500 font-bold text-sm md:text-base">ราคา:</span>
                      <span className="col-span-2 font-bold text-emerald-600 text-lg">
                        {currentAssetDetail.cost ? `฿${Number(currentAssetDetail.cost).toLocaleString()}` : '-'}
                      </span>
                    </div>
                  </>
                )}
                
                {selectedAssetCategory !== 'accessories' && (
                  <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center">
                    <span className="text-slate-500 font-bold text-sm md:text-base">สถานะ:</span>
                    <span className="col-span-2">
                      {(!currentAssetDetail.status || currentAssetDetail.status === 'พร้อมใช้งาน') ? (
                        <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-bold inline-flex items-center gap-1.5 border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> พร้อมใช้งาน
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-bold inline-flex items-center gap-1.5 border border-amber-200">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span> {currentAssetDetail.status}
                        </span>
                      )}
                    </span>
                  </div>
                )}
                
                {selectedAssetCategory === 'accessories' ? (
                  <div className="grid grid-cols-3 pt-3 md:pt-4">
                    <span className="text-slate-500 font-bold text-sm md:text-base pt-2">ผู้ครอบครอง:</span>
                    <span className="col-span-2 font-medium space-y-3">
                      {currentAssetDetail.assignees && currentAssetDetail.assignees.length > 0 ? (
                        currentAssetDetail.assignees.map((assignee) => (
                          <div key={assignee.checkoutId} className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <span className="text-base text-slate-800 font-bold">👤 {assignee.empName}</span>
                            <button 
                              onClick={() => {
                                setReturnModal({
                                  isOpen: true,
                                  assetId: currentAssetDetail.id,
                                  checkoutId: assignee.checkoutId,
                                  empId: assignee.empId,
                                  empName: assignee.empName,
                                  assetName: currentAssetDetail.name
                                });
                              }}
                              className="text-sm bg-teal-50 text-teal-700 hover:bg-teal-500 hover:text-white border border-teal-200 hover:border-teal-500 px-4 py-2 rounded-lg font-bold transition-all shadow-sm"
                            >
                              รับคืน
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400 block mt-2">- ไม่มีผู้ครอบครอง -</span>
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 pt-3 md:pt-4">
                    <span className="text-slate-500 font-bold text-sm md:text-base">ผู้ครอบครอง:</span>
                    <span className="col-span-2 font-medium">
                      {currentAssetDetail.assignedName ? `👤 ${currentAssetDetail.assignedName}` : '-'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-5 md:p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-200">
               {/* ปุ่มเบิกจ่าย-รับคืน เฉพาะของอุปกรณ์เสริม */}
               {selectedAssetCategory === 'accessories' ? (
                 // ตรวจสอบว่ายังมีจำนวนคงเหลือให้เบิกจ่ายหรือไม่
                 ((currentAssetDetail.quantity ? (Number(currentAssetDetail.quantity) - (currentAssetDetail.assignees?.length || 0)) : (1 - (currentAssetDetail.assignees?.length || 0))) > 0) && (
                   <button 
                     onClick={() => {
                       setCheckoutModal({ isOpen: true, assetId: currentAssetDetail.id, collectionName: selectedAssetCategory });
                     }} 
                     className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 font-bold transition-colors border border-indigo-200 mr-auto flex items-center gap-2 text-sm md:text-base"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                     เบิกจ่าย ({(currentAssetDetail.quantity ? (Number(currentAssetDetail.quantity) - (currentAssetDetail.assignees?.length || 0)) : (1 - (currentAssetDetail.assignees?.length || 0)))})
                   </button>
                 )
               ) : (
                 (!currentAssetDetail.status || currentAssetDetail.status === 'พร้อมใช้งาน') ? (
                   <button 
                     onClick={() => {
                       setCheckoutModal({ isOpen: true, assetId: currentAssetDetail.id, collectionName: selectedAssetCategory });
                       setSelectedAssetDetail(null);
                       setSelectedAssetCategory('');
                     }} 
                     className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 font-bold transition-colors border border-indigo-200 mr-auto flex items-center gap-2 text-sm md:text-base"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                     เบิกจ่าย
                   </button>
                 ) : (
                   <button 
                     onClick={() => {
                       handleCheckin(currentAssetDetail.id, selectedAssetCategory);
                       setSelectedAssetDetail(null);
                       setSelectedAssetCategory('');
                     }} 
                     className="px-6 py-3 bg-teal-100 text-teal-700 rounded-xl hover:bg-teal-200 font-bold transition-colors border border-teal-200 mr-auto flex items-center gap-2 text-sm md:text-base"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                     รับคืน
                   </button>
                 )
               )}
               
               <button 
                 onClick={() => {
                   if (selectedAssetCategory === 'licenses') {
                     openEditLicenseModal(currentAssetDetail);
                   } else {
                     openEditAssetModal(currentAssetDetail, selectedAssetCategory);
                   }
                   setSelectedAssetDetail(null);
                   setSelectedAssetCategory('');
                 }} 
                 className="px-6 py-3 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 font-bold transition-colors border border-amber-200 text-sm md:text-base"
               >
                 แก้ไขข้อมูล
               </button>
               <button 
                 onClick={() => { setSelectedAssetDetail(null); setSelectedAssetCategory(''); }} 
                 className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-bold transition-colors shadow-md text-sm md:text-base"
               >
                 ปิดหน้าต่าง
               </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Modal แก้ไขข้อมูลพนักงาน */}
      {editEmpModal.isOpen && editEmpModal.data && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
            <div className="bg-amber-500 text-white px-6 py-5 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="bg-black/10 p-1.5 rounded-lg text-sm">✏️</span> แก้ไขข้อมูลพนักงาน
              </h3>
              <button onClick={() => setEditEmpModal({ isOpen: false, data: null })} className="text-amber-100 hover:text-white focus:outline-none bg-amber-600/50 hover:bg-amber-600 p-1.5 rounded-xl transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateEmployee} className="p-6 md:p-8 overflow-y-auto space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">รหัสพนักงาน <span className="text-red-500">*</span></label>
                <input type="text" name="empId" value={editEmpModal.data.empId || ''} onChange={handleEditEmpChange} required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อ นามสกุล (TH) <span className="text-red-500">*</span></label>
                  <input type="text" name="fullName" value={editEmpModal.data.fullName || ''} onChange={handleEditEmpChange} required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อ นามสกุล (EN)</label>
                  <input type="text" name="fullNameEng" value={editEmpModal.data.fullNameEng || ''} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" placeholder="Firstname Lastname" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อเล่น</label>
                  <input type="text" name="nickname" value={editEmpModal.data.nickname || ''} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">เบอร์โทร</label>
                  <input type="tel" name="phone" value={editEmpModal.data.phone || ''} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                <input type="email" name="email" value={editEmpModal.data.email || ''} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">บริษัท</label>
                <input type="text" name="company" value={editEmpModal.data.company || ''} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">แผนก</label>
                  <input type="text" name="department" value={editEmpModal.data.department || ''} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">ตำแหน่ง</label>
                  <input type="text" name="position" value={editEmpModal.data.position || ''} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อหัวหน้างาน</label>
                <input type="text" name="manager" value={editEmpModal.data.manager || ''} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
              </div>
              <div className="flex gap-3 pt-5 border-t border-slate-100">
                <button type="button" onClick={() => setEditEmpModal({ isOpen: false, data: null })} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-all">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-bold transition-all shadow-lg shadow-amber-500/30">
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
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
            <div className="bg-amber-500 text-white px-6 py-5 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="bg-black/10 p-1.5 rounded-lg text-sm">✏️</span> แก้ไข{editAssetModal.collectionName === 'assets' ? 'ทรัพย์สินหลัก' : 'อุปกรณ์เสริม'}
              </h3>
              <button onClick={() => setEditAssetModal({ isOpen: false, data: null, collectionName: '' })} className="text-amber-100 hover:text-white focus:outline-none bg-amber-600/50 hover:bg-amber-600 p-1.5 rounded-xl transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateAsset} className="p-6 md:p-8 overflow-y-auto space-y-5">
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
              {/* ซ่อนช่องสถานะหากเป็นเมนูอุปกรณ์เสริม */}
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
                <button type="button" onClick={() => setEditAssetModal({ isOpen: false, data: null, collectionName: '' })} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-all">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-bold transition-all shadow-lg shadow-amber-500/30">
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
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
            <div className="bg-amber-500 text-white px-6 py-5 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="bg-black/10 p-1.5 rounded-lg text-sm">✏️</span> แก้ไขข้อมูลโปรแกรม/License
              </h3>
              <button onClick={() => setEditLicenseModal({ isOpen: false, data: null })} className="text-amber-100 hover:text-white focus:outline-none bg-amber-600/50 hover:bg-amber-600 p-1.5 rounded-xl transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateLicense} className="p-6 md:p-8 overflow-y-auto space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อโปรแกรม <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={editLicenseModal.data.name || ''} onChange={handleEditLicenseChange} required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Product Key License</label>
                <input type="text" name="productKey" value={editLicenseModal.data.productKey || ''} onChange={handleEditLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all font-mono shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">รหัสของ Product Key</label>
                <input type="text" name="keyCode" value={editLicenseModal.data.keyCode || ''} onChange={handleEditLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Supplier ที่ซื้อ</label>
                <input type="text" name="supplier" value={editLicenseModal.data.supplier || ''} onChange={handleEditLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่ซื้อ</label>
                  <input type="date" name="purchaseDate" value={editLicenseModal.data.purchaseDate || ''} onChange={handleEditLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all text-slate-600 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่หมดอายุ</label>
                  <input type="date" name="expirationDate" value={editLicenseModal.data.expirationDate || ''} onChange={handleEditLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all text-slate-600 shadow-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ราคา (บาท)</label>
                <input type="number" name="cost" value={editLicenseModal.data.cost || ''} onChange={handleEditLicenseChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">สถานะ</label>
                <select 
                  name="status" 
                  value={editLicenseModal.data.status || 'พร้อมใช้งาน'} 
                  onChange={handleEditLicenseChange} 
                  className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white text-sm text-slate-700 transition-all shadow-sm cursor-pointer"
                >
                  <option value="พร้อมใช้งาน">พร้อมใช้งาน</option>
                  <option value="ถูกใช้งาน">ถูกใช้งาน</option>
                  <option value="ชำรุดเสียหาย">ชำรุดเสียหาย</option>
                  <option value="ไม่สามารถใช้งานได้">ไม่สามารถใช้งานได้</option>
                  <option value="รอดำเนินการ">รอดำเนินการ</option>
                </select>
              </div>
              <div className="flex gap-3 pt-5 border-t border-slate-100">
                <button type="button" onClick={() => setEditLicenseModal({ isOpen: false, data: null })} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-all">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-bold transition-all shadow-lg shadow-amber-500/30">
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
      )}

      {/* Modal รับคืนระบุสภาพ (Return Modal) */}
      {returnModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80] transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all border border-slate-100">
            <div className="bg-slate-800 text-white px-6 py-5 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="bg-white/20 p-1.5 rounded-lg text-sm">📥</span> ยืนยันการรับคืนอุปกรณ์
              </h3>
              <button onClick={() => {
                    setReturnModal({ isOpen: false, assetId: null, checkoutId: null, empId: null, empName: null, assetName: null });
                    setReturnCondition('good');
                    setReturnRemarks('');
                  }} className="text-slate-400 hover:text-white transition-colors focus:outline-none bg-slate-700 hover:bg-slate-600 p-1.5 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleConfirmReturn} className="p-6 md:p-8 space-y-6">
              
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 font-medium mb-1">อุปกรณ์ที่รับคืน</p>
                <p className="text-base font-bold text-slate-800">{returnModal.assetName}</p>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-1">รับคืนจาก</p>
                  <p className="text-sm font-bold text-indigo-700 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {returnModal.empName}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">ระบุสภาพอุปกรณ์ที่รับคืน</label>
                <div className="space-y-3">
                  <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all shadow-sm ${returnCondition === 'good' ? 'bg-emerald-50 border-emerald-500' : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
                    <input 
                      type="radio" 
                      name="condition" 
                      value="good" 
                      checked={returnCondition === 'good'} 
                      onChange={() => setReturnCondition('good')}
                      className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                    />
                    <span className="ml-4 flex flex-col">
                      <span className="text-base font-bold text-slate-800 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> สภาพปกติ (Good)</span>
                      <span className="text-sm text-slate-500 mt-1">นำกลับเข้าคลังเพื่อพร้อมใช้งานต่อ</span>
                    </span>
                  </label>
                  
                  <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all shadow-sm ${returnCondition === 'broken' ? 'bg-red-50 border-red-500' : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
                    <input 
                      type="radio" 
                      name="condition" 
                      value="broken" 
                      checked={returnCondition === 'broken'} 
                      onChange={() => setReturnCondition('broken')}
                      className="w-5 h-5 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                    <span className="ml-4 flex flex-col">
                      <span className="text-base font-bold text-slate-800 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> ชำรุด/ตัดจำหน่าย (Broken)</span>
                      <span className="text-sm text-slate-500 mt-1">บันทึกเป็นของเสีย ไม่นำกลับเข้าคลัง</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* ช่องกรอกหมายเหตุ (จำเป็นเมื่อเลือกชำรุด) */}
              <div className={`transition-all duration-300 overflow-hidden ${returnCondition === 'broken' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <label className="block text-sm font-bold text-slate-700 mb-2">หมายเหตุ <span className="text-red-500">*</span></label>
                <textarea 
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm transition-all resize-none shadow-sm"
                  placeholder="เช่น สายขาด, ลูกกลิ้งเลื่อนไม่ได้, เปิดไม่ติด..."
                  rows="2"
                  required={returnCondition === 'broken'}
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => {
                    setReturnModal({ isOpen: false, assetId: null, checkoutId: null, empId: null, empName: null, assetName: null });
                    setReturnCondition('good');
                    setReturnRemarks('');
                  }}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-all"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className={`flex-1 py-3 text-white rounded-xl font-bold transition-all shadow-lg ${returnCondition === 'good' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30' : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'}`}
                >
                  ยืนยันการรับคืน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal บันทึกการซ่อมแซม (Repair Modal) */}
      {repairModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80] transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all border border-slate-100">
            <div className="bg-orange-500 text-white px-6 py-5 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="bg-black/10 p-1.5 rounded-lg text-sm">🛠️</span> บันทึกการซ่อมแซมอุปกรณ์
              </h3>
              <button onClick={() => setRepairModal({ isOpen: false, assetId: null, assetName: null, maxRepair: 0 })} className="text-orange-100 hover:text-white focus:outline-none bg-orange-600/50 hover:bg-orange-600 p-1.5 rounded-xl transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleConfirmRepair} className="p-6 md:p-8 space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 font-medium mb-1">อุปกรณ์ที่กำลังซ่อมแซม</p>
                <p className="text-base font-bold text-slate-800">{repairModal.assetName}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">จำนวนที่ซ่อมเสร็จ (รายการ) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  max={repairModal.maxRepair}
                  value={repairQuantity}
                  onChange={(e) => setRepairQuantity(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-base transition-all shadow-sm"
                  required
                />
                <p className="text-sm text-slate-500 mt-2 font-medium bg-orange-50 p-2 rounded-lg border border-orange-100">
                  * สามารถซ่อมได้สูงสุด <span className="text-orange-600 font-bold">{repairModal.maxRepair}</span> รายการ
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">หมายเหตุ</label>
                <textarea
                  value={repairRemarks}
                  onChange={(e) => setRepairRemarks(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm transition-all resize-none shadow-sm"
                  placeholder="เช่น เปลี่ยนสวิตช์เมาส์ใหม่..."
                  rows="3"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRepairModal({ isOpen: false, assetId: null, assetName: null, maxRepair: 0 })}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-bold transition-all shadow-lg shadow-orange-500/30"
                >
                  ยืนยันเข้าสต๊อก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal แจ้งเตือน Custom Alert แทนการใช้ alert() ของเบราว์เซอร์ */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80] transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all border border-slate-100 text-center p-8">
            <div className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full ${customAlert.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'} mb-6`}>
              {customAlert.type === 'error' ? (
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              ) : (
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">{customAlert.title}</h3>
            <p className="text-base text-slate-500 mb-8 whitespace-pre-line leading-relaxed">
              {customAlert.message}
            </p>
            <button 
              onClick={() => setCustomAlert({ ...customAlert, isOpen: false })}
              className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg ${
                customAlert.type === 'error' 
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
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