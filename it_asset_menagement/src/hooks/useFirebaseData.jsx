import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, getFirestore, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { planCollections } from './firebaseNeeds.js';

/**
 * useFirebaseData
 *
 * @param {string|null} authRole    admin / hr / staff / null
 * @param {string}      activeMenu  เมนูที่เปิดอยู่ — ใช้เลือกว่าจะ subscribe อะไร
 *
 * subscribe เท่าที่หน้าปัจจุบันต้องใช้ และไม่ถอดออกเมื่อเปลี่ยนหน้า
 * ตารางว่าเมนูไหนใช้ก้อนไหน + เหตุผล อยู่ที่ firebaseNeeds.js
 */
export default function useFirebaseData(authRole = null, activeMenu = 'dashboard') {
  const db = getFirestore();
  const auth = getAuth();
  const isSignedIn = authRole === 'admin' || authRole === 'hr' || authRole === 'staff';

  // 🆕 รอจนกว่า Firebase Auth SDK จะ ready จริง (มี currentUser) ก่อน subscribe
  //    แก้บั๊ก: login ครั้งแรก authRole='staff' แต่ Firestore SDK ยังไม่มี token
  //    → subscription ถูก reject เงียบๆ → ต้อง refresh page
  const [authUserReady, setAuthUserReady] = useState(!!auth.currentUser);
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setAuthUserReady(!!user);
    });
    return () => unsubAuth();
  }, [auth]);

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
  const [accessoryRequests, setAccessoryRequests] = useState([]);
  const [fieldOptions, setFieldOptions] = useState({});
  const [bundledItems, setBundledItems] = useState([]);  // ของแถม เช่น กระเป๋า/สายชาร์จ (ไม่ track stock)

  /* listener ที่เปิดอยู่: key -> unsubscribe (ไม่ถอดจนกว่าจะออกจากระบบ/unmount) */
  const subsRef = useRef(new Map());
  /* transactions 3 collection รวมเป็น state เดียว — เก็บแยกไว้ก่อนค่อย merge */
  const emptyTx = () => ({ accessories_transactions: [], assets_transactions: [], licenses_transactions: [] });
  const txRef = useRef(emptyTx());

  useEffect(() => {
    const subs = subsRef.current;

    // 🆕 BUG FIX: รอจนกว่าจะ login เสร็จ + Firebase Auth SDK propagate token แล้ว
    //   - isSignedIn = React state ของเรา (จาก authRole)
    //   - authUserReady = Firebase Auth client ยืนยันแล้วว่ามี currentUser
    //   ถ้า subscribe ก่อน 2 อย่างนี้ทั้งคู่ → Firestore rules reject → listener fail เงียบ
    //   → ผู้ใช้เห็นข้อมูลว่าง ต้อง refresh ถึงจะมาเจอ
    if (!isSignedIn || !authUserReady) {
      subs.forEach((off) => { try { off(); } catch { /* ข้าม */ } });
      subs.clear();
      txRef.current = emptyTx();
      setDeletedEmployees([]);
      setTransactions([]);
      return;
    }

    const onErr = (label) => (err) => {
      // ไม่ throw — แค่ log เพื่อ debug (เกิดได้ตอน staff ไม่มีสิทธิ์)
      console.warn('[useFirebaseData] subscription failed: ' + label, err.code || err.message);
    };

    const rows = (s) => s.docs?.map((d) => ({ id: d.id, ...d.data() })) || [];
    const byNewest = (a, b) => b.timestamp - a.timestamp;

    const mergeTx = () => {
      const t = txRef.current;
      setTransactions([
        ...t.accessories_transactions,
        ...t.assets_transactions,
        ...t.licenses_transactions,
      ].sort(byNewest));
    };
    const txSub = (name, category) => onSnapshot(collection(db, name),
      (s) => {
        txRef.current[name] = s.docs?.map((d) => ({ id: d.id, category, ...d.data() })) || [];
        mergeTx();
      },
      onErr(name));

    /* key -> ฟังก์ชันเปิด listener */
    const OPEN = {
      assets: () => onSnapshot(collection(db, 'assets'),
        (s) => setAssets(rows(s)), onErr('assets')),
      accessories: () => onSnapshot(collection(db, 'accessories'),
        (s) => setAccessories(rows(s)), onErr('accessories')),
      employees: () => onSnapshot(collection(db, 'employees'),
        (s) => setEmployees(rows(s).sort((a, b) => {
          // ใหม่สุดอยู่บน — ใช้ createdAt; ถ้า server timestamp ยังไม่มา fallback เป็น doc id
          const ta = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds * 1000 ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds * 1000 ?? 0;
          if (ta !== tb) return tb - ta;
          return (b.id || '').localeCompare(a.id || '');
        })),
        onErr('employees')),
      licenses: () => onSnapshot(collection(db, 'licenses'),
        (s) => setLicenses(rows(s)), onErr('licenses')),
      repair_requests: () => onSnapshot(collection(db, 'repair_requests'),
        (s) => setRepairRequests(rows(s).sort(byNewest)), onErr('repair_requests')),
      office_supplies: () => onSnapshot(collection(db, 'office_supplies'),
        (s) => setOfficeSupplies(rows(s)), onErr('office_supplies')),
      supply_requests: () => onSnapshot(collection(db, 'supply_requests'),
        (s) => setSupplyRequests(rows(s).sort(byNewest)), onErr('supply_requests')),
      replacement_requests: () => onSnapshot(collection(db, 'replacement_requests'),
        (s) => setReplacementRequests(rows(s).sort(byNewest)), onErr('replacement_requests')),
      accessory_requests: () => onSnapshot(collection(db, 'accessory_requests'),
        (s) => setAccessoryRequests(rows(s).sort(byNewest)), onErr('accessory_requests')),
      fieldOptions: () => onSnapshot(doc(db, 'settings', 'fieldOptions'),
        (snap) => setFieldOptions(snap.exists() ? snap.data() : {}), onErr('settings/fieldOptions')),
      bundled_items: () => onSnapshot(collection(db, 'bundled_items'),
        (s) => setBundledItems(rows(s)), onErr('bundled_items')),
      deleted_employees: () => onSnapshot(collection(db, 'deleted_employees'),
        (s) => setDeletedEmployees(rows(s)), onErr('deleted_employees')),
      accessories_transactions: () => txSub('accessories_transactions', 'accessories'),
      assets_transactions: () => txSub('assets_transactions', 'assets'),
      licenses_transactions: () => txSub('licenses_transactions', 'licenses'),
    };

    /* เปิดเฉพาะก้อนที่ยังไม่เคยเปิด */
    planCollections(activeMenu, { role: authRole }).forEach((key) => {
      if (subs.has(key) || !OPEN[key]) return;
      subs.set(key, OPEN[key]());
    });

    // ไม่ถอด listener ตอนเปลี่ยนเมนู — เหตุผลอยู่ที่ firebaseNeeds.js
  }, [db, authRole, isSignedIn, authUserReady, activeMenu]);

  /* ถอดทั้งหมดตอน unmount จริง ๆ เท่านั้น */
  useEffect(() => {
    const subs = subsRef.current;
    return () => {
      subs.forEach((off) => { try { off(); } catch { /* ข้าม */ } });
      subs.clear();
    };
  }, []);

  return {
    assets, accessories, employees, deletedEmployees, licenses,
    repairRequests, officeSupplies, supplyRequests, transactions, replacementRequests,
    accessoryRequests,
    fieldOptions, bundledItems,
  };
}
