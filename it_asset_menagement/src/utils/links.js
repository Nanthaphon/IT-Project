/* ── ลิงก์ (ตั้งในเมนู "ตัวเลือกฟิลด์" แล้วเลือกใส่ให้พนักงาน) ──────────
   settings/fieldOptions.links = [{ id, name, url }]
   employees/{id}.links        = [{ id, optionId, name, url, addedAt }]
   พนักงานเก็บสำเนา name/url ไว้ในตัว — ลบตัวเลือกทิ้งภายหลัง ลิงก์ของคนเดิมยังอยู่ */

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

export const newLinkId = () => `lnk_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
