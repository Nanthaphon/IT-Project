/* ════════════════════════════════════════════════════════════════════════
   companyInfo — ดึงโลโก้ + ชื่อบริษัท (EN/TH) จากฟิลด์ `employee.company`
   เพื่อให้ฟอร์มพิมพ์แสดงข้อมูลบริษัทตรงกับพนักงานคนนั้นจริงๆ
   ════════════════════════════════════════════════════════════════════════ */

/**
 * @param {string} company - ข้อความบริษัทจาก employee.company
 * @returns {{ key: string, logoUrl: string, nameEn: string, nameTh: string }}
 */
export function getCompanyInfo(company) {
  const c = String(company || '').toLowerCase();

  // ── Best HRM ─────────────────────────────────────────────
  if (c.includes('best') || c.includes('hrm') || c.includes('เบสท์')) {
    return {
      key:     'besthrm',
      logoUrl: '/besthrm_logo.webp',
      nameEn:  'Best HRM<br/>Co., Ltd.',
      nameTh:  'บริษัท เบสท์ เอชอาร์เอ็ม จำกัด',
    };
  }

  // ── Globe Syndicate (default) ────────────────────────────
  return {
    key:     'globe',
    logoUrl: '/gb_logo.webp',
    nameEn:  'Globe Syndicate<br/>(Thailand) Co., Ltd.',
    nameTh:  'บริษัท โกลบ ซินดิเคท (ประเทศไทย) จำกัด',
  };
}

/** Backward-compat — old code calls just for the logo path */
export function getCompanyLogo(company) {
  return getCompanyInfo(company).logoUrl;
}
