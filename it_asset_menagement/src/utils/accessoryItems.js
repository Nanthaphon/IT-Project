/* ── ชิ้นย่อยของอุปกรณ์เสริม (pure — ใช้ร่วม App / หน้าคำขออุปกรณ์เสริม) ──────
   รูปแบบปัจจุบัน: accessories.availableItems / brokenItems = [{ sn, model, cost, purchaseDate, warrantyDate }]
   ข้อมูลรุ่นเก่าเก็บเป็นอาร์เรย์แยกฟิลด์ (availableSNs, availableModels, ...) → แปลงให้เป็นรูปเดียวกัน */

export function getAvailableItems(acc) {
  if (!acc) return [];
  if (Array.isArray(acc.availableItems)) return [...acc.availableItems];
  const availCount = Math.max(0, Number(acc.quantity || 0) - (acc.assignees?.length || 0) - Number(acc.brokenQuantity || 0));
  return Array.from({ length: availCount }, (_, i) => ({
    sn: acc.availableSNs?.[i] || '',
    model: acc.availableModels?.[i] || '',
    cost: acc.availableCosts?.[i] || '',
    purchaseDate: acc.availablePurchaseDates?.[i] || '',
    warrantyDate: acc.availableWarrantyDates?.[i] || '',
  }));
}

export function getBrokenItems(acc) {
  if (!acc) return [];
  if (Array.isArray(acc.brokenItems)) return [...acc.brokenItems];
  const brokenCount = Number(acc.brokenQuantity || 0);
  return Array.from({ length: brokenCount }, (_, i) => ({
    sn: acc.brokenSNs?.[i] || '',
    model: acc.brokenModels?.[i] || '',
    cost: acc.brokenCosts?.[i] || '',
    purchaseDate: acc.brokenPurchaseDates?.[i] || '',
    warrantyDate: acc.brokenWarrantyDates?.[i] || '',
  }));
}

/** ดึงชิ้นที่ IT เลือกออกจากสต็อก
    picks = [{ index, sn }] — index ตามลำดับตอนเปิดหน้าต่างเลือก, sn ไว้ตรวจว่ายังเป็นชิ้นเดิม
    (ระหว่างเปิดหน้าต่าง อาจมีคนเบิกชิ้นอื่นไปแล้ว ลำดับเลื่อน → หาใหม่ด้วย SN)
    ไม่ส่ง picks = หยิบจากหัวแถวตามจำนวน (พฤติกรรมเดิม)
    @returns {{ picked: object[], remaining: object[], missing: number }} missing = หาชิ้นที่เลือกไม่เจอ */
export function takeItems(items, picks, qty) {
  const remaining = [...items];
  if (!Array.isArray(picks) || picks.length === 0) {
    const picked = remaining.splice(0, qty);
    return { picked, remaining, missing: Math.max(0, qty - picked.length) };
  }
  const chosen = new Set();
  let missing = 0;
  picks.forEach(({ index, sn }) => {
    let at = -1;
    if (index != null && remaining[index] && !chosen.has(index) && (remaining[index].sn || '') === (sn || '')) at = index;
    else if (sn) at = remaining.findIndex((it, i) => !chosen.has(i) && it.sn === sn);
    if (at === -1) { missing += 1; return; }
    chosen.add(at);
  });
  const picked = [...chosen].sort((a, b) => a - b).map((i) => remaining[i]);
  return { picked, remaining: remaining.filter((_, i) => !chosen.has(i)), missing };
}
