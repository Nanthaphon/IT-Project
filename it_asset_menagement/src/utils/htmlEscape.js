/* ════════════════════════════════════════════════════════════════════════
   htmlEscape — แปลงตัวอักษรพิเศษเป็น HTML entities เพื่อกัน XSS
   ใช้กับค่าทุกค่าที่มาจาก user input / database ก่อน inject เข้า HTML
   ════════════════════════════════════════════════════════════════════════ */

export function htmlEscape(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Alias สั้น ๆ ใช้ใน template string
export const e = htmlEscape;

/**
 * safeUrl — escape URL ใส่ใน href/src ของ tag, กัน javascript:/vbscript:
 * อนุญาต: http(s), data:image/*, blob:, mailto:, แบบ relative
 */
export function safeUrl(url) {
  const raw = (url === null || url === undefined) ? '' : String(url).trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:') || lower.startsWith('file:')) return '';
  // data: scheme — อนุญาตเฉพาะรูปภาพ (กัน data:text/html ที่รัน JS ได้)
  if (lower.startsWith('data:') && !lower.startsWith('data:image/')) return '';
  return htmlEscape(raw);
}
