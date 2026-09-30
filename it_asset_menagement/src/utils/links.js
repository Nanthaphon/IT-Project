/* ── ลิงก์ (ตั้งในเมนู "ตัวเลือกฟิลด์" แล้วเลือกใส่ให้พนักงาน) ──────────
   settings/fieldOptions.links = [{ id, name, url }]
   employees/{id}.links        = [{ label, url, id?, optionId?, addedAt? }]

   ⚠️ employees.links มีอยู่ก่อนแล้ว (พนักงานเพิ่มเองในหน้า "ข้อมูลของฉัน" + ฟอร์มแก้ไขฝั่ง admin)
   รูปแบบเดิมคือ { label, url } — ชื่อลิงก์ต้องอยู่ที่ label เสมอ
   ลิงก์ที่เลือกจากตัวเลือกฟิลด์มี optionId/id/addedAt เพิ่ม — ทุกที่ที่บันทึกต้องคงฟิลด์เหล่านี้ไว้
   (ใช้ cleanLinks) ไม่งั้นพนักงานกดบันทึกโปรไฟล์ครั้งเดียว ลิงก์ที่ admin ใส่ให้จะหลุดการเชื่อมโยง
   พนักงานเก็บสำเนา label/url ไว้ในตัว — ลบตัวเลือกทิ้งภายหลัง ลิงก์ของคนเดิมยังอยู่ */

/** เติม https:// ให้ถ้าพิมพ์มาแค่โดเมน · คืน '' ถ้าไม่ใช่ URL ที่ใช้ได้ */
export function normalizeUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    if (!u.hostname.includes('.') && u.hostname !== 'localhost') return '';
    return u.href;
  } catch {
    return '';
  }
}

/** โดเมนสั้น ๆ ไว้โชว์ใต้ชื่อ (ตัด www.) */
export function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

/** ชื่อที่ใช้แสดง — label ก่อน (name = รูปแบบชั่วคราวช่วงแรกของฟีเจอร์ตัวเลือกฟิลด์) แล้วค่อยโดเมน */
export function linkLabel(l) {
  return String(l?.label || l?.name || '').trim() || hostOf(normalizeUrl(l?.url)) || String(l?.url || '');
}

/** เตรียมก่อนบันทึก — ตัดช่องว่าง ทิ้งแถวที่ไม่มี URL ย้าย name -> label
    และคงฟิลด์อื่น (id / optionId / addedAt) ไว้ · ตัดค่า undefined (Firestore ไม่รับ) */
export function cleanLinks(list) {
  return (Array.isArray(list) ? list : [])
    .map((l) => {
      const { name, ...rest } = l || {};
      const out = { ...rest, label: String(l?.label || name || '').trim(), url: String(l?.url || '').trim() };
      Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
      return out;
    })
    .filter((l) => l.url);
}

export const newLinkId = () => `lnk_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
