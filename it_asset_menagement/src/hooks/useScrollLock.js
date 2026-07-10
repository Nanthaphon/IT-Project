import { useEffect } from 'react';

/* ════════════════════════════════════════════════════════════════════════
   useScrollLock(isOpen)
   ────────────────────────────────────────────────────────────────────────
   ล็อกการ scroll พื้นหลังเมื่อ modal เปิด — เพื่อกันการเลื่อน + กระทำกับพื้นหลัง
   • ใช้ counter pattern — รองรับ modal ซ้อนกันได้
   • ล็อก body + html + #main-scroll-container (admin shell)
   • รีสโตรค่าเดิมตอน unmount หรือ isOpen = false
   ════════════════════════════════════════════════════════════════════════ */

let lockCount = 0;
let saved = null;

function applyLock() {
  if (lockCount === 0) {
    const scrollContainer = document.getElementById('main-scroll-container');
    saved = {
      bodyOverflow:   document.body.style.overflow,
      htmlOverflow:   document.documentElement.style.overflow,
      bodyPaddingR:   document.body.style.paddingRight,
      mainOverflow:   scrollContainer?.style.overflow ?? null,
    };
    // กัน layout shift จาก scrollbar ที่หายไป
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    if (scrollContainer) scrollContainer.style.overflow = 'hidden';
  }
  lockCount += 1;
}

function releaseLock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0 && saved) {
    document.body.style.overflow = saved.bodyOverflow;
    document.documentElement.style.overflow = saved.htmlOverflow;
    document.body.style.paddingRight = saved.bodyPaddingR;
    const scrollContainer = document.getElementById('main-scroll-container');
    if (scrollContainer && saved.mainOverflow !== null) {
      scrollContainer.style.overflow = saved.mainOverflow;
    }
    saved = null;
  }
}

export function useScrollLock(isOpen) {
  useEffect(() => {
    if (!isOpen) return;
    applyLock();
    return releaseLock;
  }, [isOpen]);
}

export default useScrollLock;
