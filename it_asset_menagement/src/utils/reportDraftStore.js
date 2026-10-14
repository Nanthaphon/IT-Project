/* ── ที่เก็บร่าง IT Monthly Report ────────────────────────────────────
   เดิมเก็บใน localStorage อย่างเดียว ซึ่งแยกตามโดเมน + พอร์ต
   (เว็บที่ deploy / localhost:5175 / localhost:5180 = คนละก้อน, เปลี่ยนเครื่องก็หาย)
   ตอนนี้เก็บที่ Firestore it_report/shared เป็นหลัก — ทุกที่เห็นชุดเดียวกัน
   (rules: admin อ่าน/เขียนได้เท่านั้น — ไม่ใช้ settings/ เพราะนั่นอ่านได้สาธารณะ)

   localStorage ยังเขียนคู่ไว้เป็นสำรอง (ออฟไลน์ / Firestore ล้ม) และใช้ย้ายข้อมูลครั้งแรก
   ทุกร่างมี _savedAt (ms) — โหลดแล้วเลือกก้อนที่ใหม่กว่า
   ร่างเก่าใน localStorage ไม่มี _savedAt → ถือว่าเก่ากว่าของใน Firestore เสมอ */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { pickDraft } from './reportDraftPick.js';
export { hasContent } from './reportDraftPick.js';

const LOCAL_KEY = 'it_report_shared';
const REMOTE = () => doc(db, 'it_report', 'shared');

function readLocal() {
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
  const shared = read(LOCAL_KEY);
  if (shared) return shared;
  // ระบบเก่ากว่านั้น: ร่างรายเดือน → เอาเดือนล่าสุด
  let best = null, bestKey = '';
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('it_report_draft:') && k > bestKey) {
        const v = read(k); if (v) { best = v; bestKey = k; }
      }
    }
  } catch { /* localStorage ใช้ไม่ได้ */ }
  return best || read('it_report_draft');
}

/* Firestore ไม่รับ undefined — ผ่าน JSON ก่อนเขียนเสมอ */
const plain = (d) => JSON.parse(JSON.stringify(d));

export const firestoreDraftStore = {
  /** @returns {{ draft: object|null, source: 'remote'|'local'|'none', pushLocal: boolean, error?: Error }}
      pushLocal = ร่างในเครื่องใหม่กว่า/ยังไม่เคยขึ้น Firestore → ควรเขียนขึ้นทันที */
  async load() {
    const local = readLocal();
    let remote = null;
    try {
      const snap = await getDoc(REMOTE());
      remote = snap.exists() ? snap.data() : null;
    } catch (error) {
      return { draft: local, source: local ? 'local' : 'none', pushLocal: false, error };
    }
    return pickDraft(local, remote);
  },

  saveLocal(draft) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(draft)); } catch { /* เต็ม / ถูกบล็อก */ }
  },

  async saveRemote(draft) {
    await setDoc(REMOTE(), plain(draft));
  },

  async clear() {
    try { localStorage.removeItem(LOCAL_KEY); } catch { /* ข้าม */ }
    await setDoc(REMOTE(), { _savedAt: Date.now() });
  },
};
