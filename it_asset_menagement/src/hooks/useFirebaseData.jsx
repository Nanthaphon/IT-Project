import { useState, useEffect } from 'react';
import { collection, onSnapshot, getFirestore } from 'firebase/firestore';

export default function useFirebaseData() {
  const db = getFirestore();
  const [assets, setAssets] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [employees, setEmployees] = useState([]); 
  const [deletedEmployees, setDeletedEmployees] = useState([]); 
  const [licenses, setLicenses] = useState([]); 
  const [repairRequests, setRepairRequests] = useState([]); 
  const [officeSupplies, setOfficeSupplies] = useState([]);
  const [supplyRequests, setSupplyRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // 1. ดึงข้อมูลทรัพย์สินและคำขอต่างๆ
    const unsubAssets = onSnapshot(collection(db, 'assets'), (snapshot) => setAssets(snapshot.docs?.map(doc => ({ id: doc.id, ...doc.data() })) || []));
    const unsubAccessories = onSnapshot(collection(db, 'accessories'), (snapshot) => setAccessories(snapshot.docs?.map(doc => ({ id: doc.id, ...doc.data() })) || []));
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => setEmployees(snapshot.docs?.map(doc => ({ id: doc.id, ...doc.data() })) || []));
    const unsubDeletedEmployees = onSnapshot(collection(db, 'deleted_employees'), (snapshot) => setDeletedEmployees(snapshot.docs?.map(doc => ({ id: doc.id, ...doc.data() })) || [])); 
    const unsubLicenses = onSnapshot(collection(db, 'licenses'), (snapshot) => setLicenses(snapshot.docs?.map(doc => ({ id: doc.id, ...doc.data() })) || []));
    const unsubRepairReqs = onSnapshot(collection(db, 'repair_requests'), (snapshot) => setRepairRequests(snapshot.docs?.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.timestamp - a.timestamp) || []));
    const unsubOfficeSupplies = onSnapshot(collection(db, 'office_supplies'), (snapshot) => setOfficeSupplies(snapshot.docs?.map(doc => ({ id: doc.id, ...doc.data() })) || []));
    const unsubSupplyReqs = onSnapshot(collection(db, 'supply_requests'), (snapshot) => setSupplyRequests(snapshot.docs?.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.timestamp - a.timestamp) || []));

    // 2. ดึงข้อมูลประวัติการทำรายการ (Transactions)
    let accData = []; let assetData = []; let licData = [];
    const updateTransactionsState = () => {
      const combined = [...accData, ...assetData, ...licData];
      combined.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(combined);
    };

    const unsubAccTx = onSnapshot(collection(db, 'accessories_transactions'), (snapshot) => { accData = snapshot.docs?.map(doc => ({ id: doc.id, category: 'accessories', ...doc.data() })) || []; updateTransactionsState(); });
    const unsubAssetTx = onSnapshot(collection(db, 'assets_transactions'), (snapshot) => { assetData = snapshot.docs?.map(doc => ({ id: doc.id, category: 'assets', ...doc.data() })) || []; updateTransactionsState(); });
    const unsubLicTx = onSnapshot(collection(db, 'licenses_transactions'), (snapshot) => { licData = snapshot.docs?.map(doc => ({ id: doc.id, category: 'licenses', ...doc.data() })) || []; updateTransactionsState(); });

    // 3. คืนค่าการเชื่อมต่อเมื่อ Component ถูกทำลาย
    return () => { 
      unsubAssets(); unsubAccessories(); unsubEmployees(); unsubDeletedEmployees(); 
      unsubLicenses(); unsubRepairReqs(); unsubOfficeSupplies(); unsubSupplyReqs(); 
      unsubAccTx(); unsubAssetTx(); unsubLicTx(); 
    }; 
  }, [db]);

  return {
    assets, accessories, employees, deletedEmployees, licenses, 
    repairRequests, officeSupplies, supplyRequests, transactions
  };
}