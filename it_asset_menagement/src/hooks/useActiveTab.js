import { useEffect, useState, useRef } from 'react';

/* ════════════════════════════════════════════════════════════════════════
   useActiveTab()
   ────────────────────────────────────────────────────────────────────────
   คืน `true` เฉพาะแท็บที่ "active" — คือแท็บที่ user โฟกัสล่าสุดในบรรดา
   แท็บที่เปิดเว็บนี้อยู่
   ใช้สำหรับ guard side-effect ที่ไม่ควรทำซ้ำในหลายแท็บ เช่น
     - แสดง toast / auto-popup modal
     - ส่ง LINE notification (license expiry alert)
     - เด้ง satisfaction survey modal
   ════════════════════════════════════════════════════════════════════════ */

const CHANNEL_NAME = 'gb-asset-active-tab';

// id ของแท็บนี้ — random ตอน module load
const TAB_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

let leaderId = TAB_ID;       // module-level leader id
let lastClaim = Date.now();
let listeners = new Set();   // setters ที่ subscribe

const broadcast = (() => {
  try {
    return ('BroadcastChannel' in window) ? new BroadcastChannel(CHANNEL_NAME) : null;
  } catch { return null; }
})();

function notifyAll() {
  listeners.forEach(setter => {
    try { setter(leaderId === TAB_ID); } catch {}
  });
}

function claimLeadership() {
  leaderId = TAB_ID;
  lastClaim = Date.now();
  if (broadcast) {
    try { broadcast.postMessage({ type: 'claim', tabId: TAB_ID, ts: lastClaim }); } catch {}
  }
  notifyAll();
}

if (broadcast) {
  broadcast.onmessage = (event) => {
    const msg = event.data;
    if (!msg || !msg.tabId || msg.tabId === TAB_ID) return;
    if (msg.type === 'claim') {
      // ยอมแพ้ leadership ถ้าแท็บอื่น claim ใหม่กว่า
      if (msg.ts > lastClaim) {
        leaderId = msg.tabId;
        lastClaim = msg.ts;
        notifyAll();
      }
    }
  };
}

// ตอน module load — แท็บใหม่ที่เปิดมา = claim ทันที (ทำให้ active tab = แท็บล่าสุด)
if (typeof window !== 'undefined') {
  setTimeout(claimLeadership, 0);

  // โฟกัส/visibility → claim ใหม่
  const reclaim = () => {
    if (document.visibilityState === 'visible') claimLeadership();
  };
  window.addEventListener('focus', reclaim);
  document.addEventListener('visibilitychange', reclaim);
  window.addEventListener('pointerdown', reclaim, { passive: true });
}

export function useActiveTab() {
  const [isActive, setIsActive] = useState(leaderId === TAB_ID);
  const setterRef = useRef(setIsActive);
  setterRef.current = setIsActive;

  useEffect(() => {
    const wrapped = (v) => setterRef.current(v);
    listeners.add(wrapped);
    // sync ค่าปัจจุบัน
    wrapped(leaderId === TAB_ID);
    return () => { listeners.delete(wrapped); };
  }, []);

  return isActive;
}

export default useActiveTab;
