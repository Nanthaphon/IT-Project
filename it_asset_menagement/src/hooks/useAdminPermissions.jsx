import { useState, useEffect } from 'react';
import { db } from '../firebase.js';
import {
  doc, getDoc, setDoc, getDocs, collection, serverTimestamp,
} from 'firebase/firestore';

export const ALL_MENU_IDS = [
  'dashboard', 'assets', 'licenses', 'accessories', 'office_supplies',
  'supply_requests', 'employees', 'repairs', 'replacement_requests',
  'kpi_dashboard', 'field_options', 'it_report',
];

export default function useAdminPermissions(uid, authRole) {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminPermissions, setAdminPermissions] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [permLoading, setPermLoading] = useState(true);

  useEffect(() => {
    if (authRole !== 'admin') {
      setIsSuperAdmin(false);
      setAdminPermissions(null);
      setDisplayName('');
      setPermLoading(false);
      return;
    }

    if (!uid) {
      setPermLoading(true);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setPermLoading(true);
        const docRef = doc(db, 'admin_users', uid);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();
          if (!cancelled) {
            setIsSuperAdmin(data.isSuperAdmin === true);
            setAdminPermissions(data.permissions || { menus: [], level: 'view' });
            setDisplayName(data.displayName || '');
          }
        } else {
          // Check if the collection is empty
          const colSnap = await getDocs(collection(db, 'admin_users'));
          if (colSnap.empty) {
            // First admin ever — auto-create as SuperAdmin
            const profile = {
              uid,
              email: '',
              displayName: 'Super Admin',
              isSuperAdmin: true,
              permissions: { menus: ALL_MENU_IDS, level: 'full' },
              createdAt: serverTimestamp(),
            };
            await setDoc(docRef, profile);
            if (!cancelled) {
              setIsSuperAdmin(true);
              setAdminPermissions({ menus: ALL_MENU_IDS, level: 'full' });
              setDisplayName('Super Admin');
            }
          } else {
            // Known collection but this user has no doc — no access
            if (!cancelled) {
              setIsSuperAdmin(false);
              setAdminPermissions({ menus: [], level: 'view' });
            }
          }
        }
      } catch (err) {
        console.error('useAdminPermissions error:', err);
        if (!cancelled) {
          setIsSuperAdmin(false);
          setAdminPermissions({ menus: [], level: 'view' });
        }
      } finally {
        if (!cancelled) setPermLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [uid, authRole]);

  return { isSuperAdmin, adminPermissions, displayName, permLoading };
}
