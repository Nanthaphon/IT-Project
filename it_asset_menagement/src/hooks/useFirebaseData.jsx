import { useState, useEffect } from 'react';
import { collection, onSnapshot, getFirestore, doc } from 'firebase/firestore';

/**
 * useFirebaseData
 *
 * @param {string|null} authRole  - 'admin' | 'staff' | null
 *                                  ใช้กรอง subscription ที่เฉพาะ admin อ่านได้
 *                                  (transactions, deleted_employees) เพื่อไม่ให้เกิด
 *                                  permission errors บน console ฝั่ง staff
 */
export default function useFirebaseData(authRole = null) {
  const db = getFirestore();
  const isAdmin = authRole === 'admin';
  const isSignedIn = authRole === 'admin' || authRole === 'hr' || authRole === 'staff';

  const [assets, setAssets] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [deletedEmployees, setDeletedEmployees] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [repairRequests, setRepairRequests] = useState([]);
  const [officeSupplies, setOfficeSupplies] = useState([]);
  const [supplyRequests, setSupplyRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [replacementRequests, setReplacementRequests] = useState([]);
  const [fieldOptions, setFieldOptions] = useState({});

  useEffect(() => {
    const unsubs = [];
    const onErr = (label) => (err) => {
      // ไม่ throw — แค่ log เพื่อ debug (เกิดได้ตอน staff ไม่มีสิทธิ์)
      console.warn(`[useFirebaseData] subscription failed: ${label}`, err.code || err.message);
    };

    // ── Collections ที่ public read ได้ ──
    unsubs.push(onSnapshot(collection(db, 'assets'),
      (s) => setAssets(s.docs?.map(d => ({ id: d.id, ...d.data() })) || []),
      onErr('assets')));
    unsubs.push(onSnapshot(collection(db, 'accessories'),
      (s) => setAccessories(s.docs?.map(d => ({ id: d.id, ...d.data() })) || []),
      onErr('accessories')));
    unsubs.push(onSnapshot(collection(db, 'employees'),
      (s) => setEmployees(s.docs?.map(d => ({ id: d.id, ...d.data() })) || []),
      onErr('employees')));
    unsubs.push(onSnapshot(collection(db, 'licenses'),
      (s) => setLicenses(s.docs?.map(d => ({ id: d.id, ...d.data() })) || []),
      onErr('licenses')));
    unsubs.push(onSnapshot(collection(db, 'repair_requests'),
      (s) => setRepairRequests(s.docs?.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp) || []),
      onErr('repair_requests')));
    unsubs.push(onSnapshot(collection(db, 'office_supplies'),
      (s) => setOfficeSupplies(s.docs?.map(d => ({ id: d.id, ...d.data() })) || []),
      onErr('office_supplies')));
    unsubs.push(onSnapshot(collection(db, 'supply_requests'),
      (s) => setSupplyRequests(s.docs?.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp) || []),
      onErr('supply_requests')));
    unsubs.push(onSnapshot(collection(db, 'replacement_requests'),
      (s) => setReplacementRequests(s.docs?.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp) || []),
      onErr('replacement_requests')));
    unsubs.push(onSnapshot(doc(db, 'settings', 'fieldOptions'),
      (snap) => setFieldOptions(snap.exists() ? snap.data() : {}),
      onErr('settings/fieldOptions')));

    // ── Collections ที่ admin เท่านั้น (ตาม firestore.rules) ──
    if (isAdmin) {
      unsubs.push(onSnapshot(collection(db, 'deleted_employees'),
        (s) => setDeletedEmployees(s.docs?.map(d => ({ id: d.id, ...d.data() })) || []),
        onErr('deleted_employees')));

      let accData = []; let assetData = []; let licData = [];
      const updateTransactionsState = () => {
        const combined = [...accData, ...assetData, ...licData];
        combined.sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(combined);
      };

      unsubs.push(onSnapshot(collection(db, 'accessories_transactions'),
        (s) => { accData = s.docs?.map(d => ({ id: d.id, category: 'accessories', ...d.data() })) || []; updateTransactionsState(); },
        onErr('accessories_transactions')));
      unsubs.push(onSnapshot(collection(db, 'assets_transactions'),
        (s) => { assetData = s.docs?.map(d => ({ id: d.id, category: 'assets', ...d.data() })) || []; updateTransactionsState(); },
        onErr('assets_transactions')));
      unsubs.push(onSnapshot(collection(db, 'licenses_transactions'),
        (s) => { licData = s.docs?.map(d => ({ id: d.id, category: 'licenses', ...d.data() })) || []; updateTransactionsState(); },
        onErr('licenses_transactions')));
    } else {
      // เมื่อไม่ใช่ admin (logout / staff) ให้ clear state
      setDeletedEmployees([]);
      setTransactions([]);
    }

    return () => unsubs.forEach((u) => { try { u(); } catch {} });
  }, [db, isAdmin, isSignedIn, authRole]);

  return {
    assets, accessories, employees, deletedEmployees, licenses,
    repairRequests, officeSupplies, supplyRequests, transactions, replacementRequests,
    fieldOptions,
  };
}
