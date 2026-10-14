/* ── เลือกร่าง IT Monthly Report ระหว่าง "ในระบบ" กับ "ในเครื่องนี้" (pure — เทสต์ได้) ──
   แยกจาก reportDraftStore.js เพราะไฟล์นั้น import firebase (ใช้ในเทสต์ node ไม่ได้)

   กติกา:
   1. ในระบบมีร่าง และในเครื่องไม่ได้ใหม่กว่า → ใช้ของในระบบ
      (ร่างเก่าใน localStorage ก่อนย้ายไม่มี _savedAt → นับเป็น 0 = เก่ากว่าเสมอ)
   2. ในเครื่องมีเนื้อหา (ใหม่กว่า หรือในระบบยังไม่มี) → ใช้ของในเครื่อง + เขียนขึ้นระบบ
   3. นอกนั้น → ของในระบบ (อาจเป็น null = เริ่มใหม่)
   ร่างว่างของเครื่องใหม่ไม่ถูกเขียนขึ้นไปทับของจริงเด็ดขาด (hasContent) */

export function hasContent(d) {
  if (!d) return false;
  return ['bigIssues', 'rdProjects', 'followUps'].some((k) => Array.isArray(d[k]) && d[k].length > 0)
    || ['stats', 'hw', 'sw', 'exp'].some((k) => d[k] != null);
}

/** @returns {{ draft: object|null, source: 'remote'|'local'|'none', pushLocal: boolean }} */
export function pickDraft(local, remote) {
  if (remote && !(local && (local._savedAt || 0) > (remote._savedAt || 0))) {
    return { draft: remote, source: 'remote', pushLocal: false };
  }
  if (hasContent(local)) return { draft: local, source: 'local', pushLocal: true };
  return { draft: remote || null, source: remote ? 'remote' : 'none', pushLocal: false };
}
