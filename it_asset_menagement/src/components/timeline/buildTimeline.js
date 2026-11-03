/* สร้าง "ไทม์ไลน์" ของทรัพย์สิน / License จากข้อมูลที่ระบบมีอยู่แล้ว
   ซึ่งตอนนี้กระจายอยู่ 4 ที่ และไม่มีหน้าไหนรวมให้ดูเรียงตามเวลา:

     assets_transactions      เบิกจ่าย / รับคืน  (มี assetId + timestamp)
     licenses_transactions    ผูก / ถอด License กับเครื่อง (isAssetBound)
     asset.purchaseHistoryLog ประวัติจัดซื้อ (เก็บในเอกสาร asset เอง)
     repair_requests          งานแจ้งซ่อม

   ฟังก์ชันในไฟล์นี้เป็น pure ทั้งหมด — รับข้อมูลเข้า คืน array ออก
   ทดสอบได้โดยไม่ต้องต่อ Firestore (สำคัญ เพราะการเปิดแอปจริงแต่ละครั้ง
   อ่าน Firestore หลายร้อย docs) */

/* ── ชนิดเหตุการณ์ → โทนสีตาม TONE ใน src/ui/earth.js ────────── */
export const EVENT_KIND = {
  purchase: { label: 'จัดซื้อ',        tone: 'ochre'   },
  checkout: { label: 'เบิกจ่าย',       tone: 'clay'    },
  checkin:  { label: 'รับคืน',         tone: 'olive'   },
  licOn:    { label: 'ผูก License',    tone: 'clay'    },
  licOff:   { label: 'ถอด License',    tone: 'neutral' },
  repair:   { label: 'แจ้งซ่อม',       tone: 'brick'   },
  seatOn:   { label: 'จ่ายสิทธิ์',      tone: 'clay'    },
  seatOff:  { label: 'คืนสิทธิ์',       tone: 'olive'   },
};

/* ── แปลงค่าวันที่หลายรูปแบบให้เป็น ms ───────────────────────
   ระบบเก็บเวลาไว้ 3 แบบปนกัน: Date.now(), Firestore Timestamp
   และสตริง 'YYYY-MM-DD' — รวมให้เทียบกันได้ */
export function toMillis(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (typeof v?.seconds === 'number') return v.seconds * 1000;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? null : t;
}

const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/** วันที่แบบไทย: 5 ก.ย. 2569 */
export function thaiDate(ms) {
  if (ms == null) return '—';
  const d = new Date(ms);
  return `${d.getDate()} ${TH_MONTH[d.getMonth()]} ${d.getFullYear() + 543}`;
}

/** เวลาแบบสั้น: 14:05 — คืนค่าว่างถ้าเป็นวันที่ล้วน (เที่ยงคืนพอดี) */
export function thaiTime(ms, exact = true) {
  if (ms == null || !exact) return '';
  const d = new Date(ms);
  if (d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} น.`;
}

/** ระยะเวลาระหว่างสองจุด เช่น "1 ปี 2 เดือน" / "12 วัน" */
export function spanLabel(fromMs, toMs) {
  if (fromMs == null) return '';
  const end = toMs ?? Date.now();
  const days = Math.max(0, Math.floor((end - fromMs) / 86400000));
  if (days < 1) return 'ไม่ถึง 1 วัน';
  if (days < 31) return `${days} วัน`;
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const parts = [];
  if (years) parts.push(`${years} ปี`);
  if (months) parts.push(`${months} เดือน`);
  return parts.join(' ') || `${days} วัน`;
}

/** เอกสารรุ่นเก่าไม่มีฟิลด์ productKey เลย — ใช้แยกจากรุ่นใหม่ที่มีแต่ค่าว่าง */
const hasKeyField = (t) => Object.prototype.hasOwnProperty.call(t, 'productKey');

/* ── การ "ยืม" อุปกรณ์เสริม ──────────────────────────────────
   ยืมถูกบันทึกเป็น action 'เบิกจ่าย' เหมือนเบิกปกติ ไทม์ไลน์เลยแยกไม่ออก
   รายการใหม่มี t.isBorrow + t.returnDate · รายการเก่ามีแค่ข้อความ "ยืม: ..." ใน remarks
   (App เขียน remarks เป็น "SN: xxx | ยืม: เหตุผล") จึงดูจากทั้งสองอย่าง
   วันคืนของรายการเก่า หาได้จาก assignee ที่ checkoutId ตรงกัน (ถ้ายังถืออยู่) */
const BORROW_RE = /(^|\|)\s*ยืม:/;
export const isBorrowTx = (t) => t?.isBorrow === true || BORROW_RE.test(String(t?.remarks || ''));
const BORROW_CHIP = { label: 'ยืม', tone: 'ochre' };

/* ── SN ของชิ้นที่เบิก/คืน ─────────────────────────────────────
   อุปกรณ์เสริมมีหลายชิ้นต่อรายการ ต้องรู้ว่าคืน "ชิ้นไหน"
   รายการคืนรุ่นเก่าไม่ได้เก็บ SN ไว้ แต่มี checkoutId ตรงกับรายการเบิก
   ซึ่งเก็บ SN ไว้ใน t.sn (ใหม่) หรือใน remarks "SN: xxx | ..." (เก่า) → จับคู่กัน */
const SN_RE = /SN:\s*([^|]+?)\s*(?:\||$)/;
function snOfTx(t) {
  if (t?.sn) return String(t.sn);
  const m = SN_RE.exec(String(t?.remarks || ''));
  const v = m ? m[1].trim() : '';
  return v && v !== '-' ? v : '';
}
/** checkoutId → SN จากรายการเบิกจ่าย (+ ชิ้นที่ยังถืออยู่ใน assignees) */
function snByCheckout(transactions = [], assignees = []) {
  const map = new Map();
  assignees.forEach((a) => { if (a?.checkoutId && a.serialNumber) map.set(a.checkoutId, a.serialNumber); });
  transactions.forEach((t) => {
    if (t.action !== 'เบิกจ่าย' || !t.checkoutId || map.has(t.checkoutId)) return;
    const sn = snOfTx(t);
    if (sn) map.set(t.checkoutId, sn);
  });
  return map;
}
function borrowDetail(t, holder) {
  const due = t.returnDate || holder?.returnDate;
  const ms = toMillis(due);
  return ms == null ? '' : `กำหนดคืน ${thaiDate(ms)}`;
}

/** ชื่อคนในรายการ — รายการรุ่นเก่าบางอันเก็บแค่ empId (รหัสเอกสาร Firestore)
    ห้ามโชว์รหัสนั้นออกหน้าจอ (ผู้ใช้อ่านไม่ออก) ให้ไปหาชื่อจากรายชื่อพนักงานแทน */
const UNKNOWN_EMP = 'ไม่พบชื่อพนักงาน';
function nameLookup(employees = [], extra = []) {
  const byId = new Map();
  employees.forEach((e) => {
    if (!e?.fullName) return;
    const label = e.nickname ? `${e.fullName} (${e.nickname})` : e.fullName;
    if (e.id) byId.set(e.id, label);
    if (e.empId) byId.set(e.empId, label);
  });
  extra.forEach((x) => { if (x?.empId && x?.empName && !byId.has(x.empId)) byId.set(x.empId, x.empName); });
  return (t) => t.empName || (t.empId && byId.get(t.empId)) || (t.empId ? UNKNOWN_EMP : '—');
}

/* ── ไทม์ไลน์ของทรัพย์สิน 1 ชิ้น ─────────────────────────────
   @param {object}  asset         เอกสาร asset (ใช้ purchaseHistoryLog + วันที่ซื้อ)
   @param {array}   transactions  transactions ทั้งหมดที่โหลดมา
   @param {array}   repairs       repair_requests ทั้งหมด
   @returns {array} เหตุการณ์ เรียงใหม่ -> เก่า                     */
export function buildAssetTimeline(asset, transactions = [], repairs = [], licenses = [], employees = []) {
  if (!asset?.id) return [];
  const personOf = nameLookup(employees);
  // หาชื่อไม่เจอ = นับผู้ถือด้วยรหัสแทน ไม่งั้นทุกคนที่ไม่พบชื่อจะรวมเป็นคนเดียว
  const unknownId = (t) => (personOf(t) === UNKNOWN_EMP ? t.empId : undefined);

  /* Product Key ของสิทธิ์ที่ "ยังผูกอยู่" กับเครื่องนี้ ณ ตอนนี้
     ใช้เติมให้รายการเก่าที่บันทึกไว้ก่อนระบบจะเริ่มเก็บ key
     (รายการถอดออกไปแล้วเติมให้ไม่ได้ — key ถูกคืนเข้ากองว่างไปแล้ว) */
  const boundKeyOf = (licenseId, licenseName) => {
    const lic = licenses.find((l) =>
      (licenseId && l.id === licenseId) ||
      (!licenseId && String(l.name || '').trim() === String(licenseName || '').trim()));
    const seat = (lic?.assignees || []).find(
      (a) => a.isAssetBound && a.assignedAssetId === asset.id);
    return seat ? { productKey: seat.productKey || '', keyCode: seat.keyCode || '' } : null;
  };
  const out = [];
  const push = (kind, ms, data) => {
    if (ms == null) return;
    out.push({ kind, ms, exactTime: data.exactTime !== false, ...data });
  };

  /* 1) จัดซื้อ — จาก purchaseHistoryLog ถ้ามี ไม่งั้นใช้ purchaseDate ของตัวเครื่อง */
  const log = Array.isArray(asset.purchaseHistoryLog) ? asset.purchaseHistoryLog : [];
  if (log.length) {
    log.forEach((h) => push('purchase', toMillis(h.purchaseDate), {
      title: 'จัดซื้อ / เพิ่มเข้าระบบ',
      by: h.vendor || '',
      detail: [h.model, h.cost ? `${Number(h.cost).toLocaleString('th-TH')} บาท` : ''].filter(Boolean).join(' · '),
      note: h.note || '',
      docs: h.documents?.length || 0,
      exactTime: false,
    }));
  } else if (asset.purchaseDate) {
    push('purchase', toMillis(asset.purchaseDate), {
      title: 'จัดซื้อ / เพิ่มเข้าระบบ',
      by: asset.vendor || '',
      detail: asset.cost ? `${Number(asset.cost).toLocaleString('th-TH')} บาท` : '',
      exactTime: false,
    });
  }

  /* 2) เบิกจ่าย / รับคืน — จาก *_transactions ของเครื่องนี้
        (ตัด isAssetBound ออก เพราะนั่นคือรายการ License ไม่ใช่การถือครอง) */
  const mineTx = transactions.filter((t) => t.assetId === asset.id && !t.isAssetBound);
  const snOf = snByCheckout(mineTx, asset.assignees || []);
  mineTx
    .forEach((t) => {
      const ms = toMillis(t.timestamp);
      if (t.action === 'เบิกจ่าย') {
        const borrow = isBorrowTx(t);
        const holder = borrow && t.checkoutId
          ? (asset.assignees || []).find((a) => a.checkoutId === t.checkoutId) : null;
        push('checkout', ms, {
          title: borrow ? 'ให้พนักงานยืม' : 'เบิกจ่ายให้พนักงาน',
          chip: borrow ? BORROW_CHIP : undefined,
          by: personOf(t), who: unknownId(t),
          detail: [borrow ? borrowDetail(t, holder) : '', t.condition ? `สภาพ: ${t.condition}` : '']
            .filter(Boolean).join(' · '),
          note: t.remarks && t.remarks !== '-' ? t.remarks : '',
          checkoutId: t.checkoutId || null,
        });
      } else if (t.action === 'รับคืน' || t.action === 'ซ่อมเสร็จ/เข้าคลัง') {
        const sn = snOfTx(t) || (t.checkoutId && snOf.get(t.checkoutId)) || '';
        push('checkin', ms, {
          title: t.action === 'รับคืน' ? 'รับคืนจากพนักงาน' : 'ซ่อมเสร็จ / เข้าคลัง',
          by: personOf(t), who: unknownId(t),
          detail: [sn ? `SN: ${sn}` : '', t.condition ? `สภาพ: ${t.condition}` : ''].filter(Boolean).join(' · '),
          note: t.remarks && t.remarks !== '-' ? t.remarks : '',
          checkoutId: t.checkoutId || null,
        });
      }
    });

  /* 3) ผูก / ถอด License กับเครื่องนี้ */
  transactions
    .filter((t) => t.assetId === asset.id && t.isAssetBound)
    .forEach((t) => {
      const ms = toMillis(t.timestamp);
      const name = t.licenseName || t.assetName || 'License';
      if (t.action === 'เบิกจ่าย') {
        /* รายการเก่าไม่มี key — ถ้าสิทธิ์ยังผูกอยู่ ดึงจากของจริงมาแสดง */
        const fb = t.productKey ? null : boundKeyOf(t.licenseId, name);
        push('licOn', ms, {
          title: 'ผูก License กับเครื่อง', by: name, detail: t.empName || '',
          productKey: t.productKey || fb?.productKey || '',
          keyCode: t.keyCode || fb?.keyCode || '',
          keyFromCurrent: !t.productKey && !!fb?.productKey,
          keyMissing: !t.productKey && !fb?.productKey && !hasKeyField(t),
        });
      } else {
        push('licOff', ms, {
          title: 'ถอด License ออกจากเครื่อง', by: name, detail: '',
          productKey: t.productKey || '', keyCode: t.keyCode || '',
          keyMissing: !t.productKey && !hasKeyField(t),
        });
      }
    });

  /* 4) งานแจ้งซ่อม
        repair_requests ไม่ได้เก็บ assetId (พนักงานพิมพ์ชื่อเครื่องเอง)
        จึงจับคู่ด้วยชื่อ/Asset Tag/SN แบบหลวม ๆ และติดธง matchedByName
        ไว้ให้ UI บอกผู้ใช้ตรง ๆ ว่าอาจไม่ครบ */
  const keys = [asset.name, asset.assetTag, asset.sn]
    .filter(Boolean).map((s) => String(s).trim().toLowerCase());
  if (keys.length) {
    repairs
      .filter((r) => {
        if (r.assetId) return r.assetId === asset.id;
        const hay = String(r.assetName || '').trim().toLowerCase();
        return hay && keys.some((k) => hay.includes(k) || k.includes(hay));
      })
      .forEach((r) => push('repair', toMillis(r.timestamp ?? r.createdAt), {
        title: 'แจ้งซ่อม',
        by: r.empName || '—',
        detail: r.status || '',
        note: r.issue || r.problem || '',
        matchedByName: !r.assetId,
      }));
  }

  return out.sort((a, b) => b.ms - a.ms);
}

/* ── ไทม์ไลน์ของ License 1 รายการ ───────────────────────────
   ตอบคำถาม "สิทธิ์นี้เคยอยู่กับใคร / เครื่องไหน เมื่อไหร่"

   หมายเหตุสำคัญ: licenses_transactions รุ่นเก่าบางรายการไม่ได้เก็บ
   licenseId ไว้ จึงต้อง fallback มาจับคู่ด้วยชื่อ — รายการที่จับคู่
   ด้วยชื่อจะติดธง matchedByName                                  */
export function buildLicenseTimeline(license, transactions = [], employees = []) {
  if (!license?.id) return [];
  const personOf = nameLookup(employees, license.assignees || []);
  // หาชื่อไม่เจอ = นับผู้ถือด้วยรหัสแทน ไม่งั้นทุกคนที่ไม่พบชื่อจะรวมเป็นคนเดียว
  const unknownId = (t) => (personOf(t) === UNKNOWN_EMP ? t.empId : undefined);
  const name = String(license.name || '').trim().toLowerCase();
  const createdMs = toMillis(license.createdTs ?? license.createdAt);
  // รายการคืนสิทธิ์จากหน้าต่างรับคืน (ไม่ผูกเครื่อง) เก็บ id ของ License ไว้ที่ assetId แทน licenseId
  const ownById = (t) => !t.licenseId && !t.isAssetBound && t.assetId === license.id;

  const mine = transactions.filter((t) => {
    if (t.category !== 'licenses') return false;
    if (t.licenseId) return t.licenseId === license.id;
    if (!t.isAssetBound && t.assetId) return t.assetId === license.id;
    if (!name) return false;
    // จับด้วยชื่อ: รายการที่เกิดก่อนสร้าง License นี้ เป็นของ License ชื่อเดียวกันตัวเก่า
    // (ลบไปแล้วแต่ประวัติยังค้าง) — เคยเกิด: สร้าง "test" ใหม่แล้วเห็นประวัติ 25 รายการของตัวเก่า
    const ms = toMillis(t.timestamp);
    if (createdMs != null && ms != null && ms < createdMs - 60_000) return false;
    // รุ่นเก่า: ชื่อ license ถูกเก็บไว้ที่ licenseName หรือ assetName แล้วแต่เส้นทาง
    const a = String(t.licenseName || '').trim().toLowerCase();
    const b = String(t.assetName || '').trim().toLowerCase();
    return a === name || (!t.isAssetBound && b === name);
  });

  const out = [];
  mine.forEach((t) => {
    const ms = toMillis(t.timestamp);
    if (ms == null) return;
    const matchedByName = !t.licenseId && !ownById(t);
    if (t.isAssetBound) {
      out.push({
        kind: t.action === 'เบิกจ่าย' ? 'licOn' : 'licOff',
        ms, matchedByName,
        title: t.action === 'เบิกจ่าย' ? 'ผูกกับเครื่อง' : 'ถอดออกจากเครื่อง',
        by: t.assetName || '—',
        detail: t.empName ? `ผู้ถือเครื่อง: ${t.empName}` : '',
        productKey: t.productKey || '', keyCode: t.keyCode || '',
        keyMissing: !t.productKey && !hasKeyField(t),
        note: t.remarks && t.remarks !== '-' ? t.remarks : '',
      });
    } else {
      out.push({
        kind: t.action === 'เบิกจ่าย' ? 'seatOn' : 'seatOff',
        ms, matchedByName,
        title: t.action === 'เบิกจ่าย' ? 'จ่ายสิทธิ์ให้พนักงาน' : 'คืนสิทธิ์',
        by: personOf(t), who: unknownId(t),
        detail: '',
        productKey: t.productKey || '', keyCode: t.keyCode || '',
        keyMissing: !t.productKey && !hasKeyField(t),
        note: t.remarks && t.remarks !== '-' ? t.remarks : '',
      });
    }
  });

  /* ซื้อ License */
  if (license.purchaseDate) {
    const ms = toMillis(license.purchaseDate);
    if (ms != null) out.push({
      kind: 'purchase', ms, exactTime: false,
      title: 'จัดซื้อ License',
      by: license.supplier || '',
      detail: license.cost ? `${Number(license.cost).toLocaleString('th-TH')} บาท` : '',
    });
  }

  return out.sort((a, b) => b.ms - a.ms);
}

/* ── ไทม์ไลน์ของรายการย่อย (รายตัว) ─────────────────────────
   ตัวตนของสิทธิ์ 1 ตัว = Product Key · ชิ้นอุปกรณ์เสริม 1 ชิ้น = SN
   ตำแหน่งในอาร์เรย์ใช้ไม่ได้ (จ่าย/คืนแล้วสลับที่กันตลอด)
   ไม่มี Product Key / SN → เห็นได้แค่รอบที่ถืออยู่ตอนนี้ (จับคู่ด้วย checkoutId / ผู้ถือ)
   คืน { events, partial } — partial = ระบุตัวไม่ได้ ประวัติอาจไม่ครบ ให้ UI บอกผู้ใช้ */
const norm = (v) => String(v ?? '').trim().toLowerCase();

export function buildSeatTimeline(license, seat, transactions = [], employees = []) {
  if (!license?.id || !seat) return { events: [], partial: false };
  const key = norm(seat.productKey);
  // Key ซ้ำกันหลายสิทธิ์ (volume key) = ใช้ระบุตัวไม่ได้
  const allKeys = [...(license.availableKeys || []), ...(license.assignees || []).map((x) => x.productKey)];
  const byKey = !!key && allKeys.filter((k) => norm(k) === key).length <= 1;
  const a = seat.assignee;
  // seatId = รหัสประจำสิทธิ์ ติดไปทุกการจ่าย/คืน (utils/licenseSeats.js · บันทึกใน transaction ตั้งแต่ 11/2026)
  // ตามสิทธิ์ที่ไม่มี Product Key ได้ — เดิมสิทธิ์แบบนี้พอคืนจนว่าง ไทม์ไลน์ว่างเปล่า
  const seatId = seat.seatId || a?.seatId || '';
  const tx = transactions.filter((t) => {
    if (t.category !== 'licenses') return false;
    if (seatId && t.seatId) return t.seatId === seatId;
    if (byKey) return norm(t.productKey) === key;
    if (!a || norm(t.productKey) !== key) return false;
    if (t.checkoutId) return t.checkoutId === a.checkoutId;
    // รายการจ่ายรุ่นก่อนไม่ได้เก็บ checkoutId — ใช้ผู้ถือ/เครื่องเดียวกันแทน
    return t.action === 'เบิกจ่าย' && (a.isAssetBound
      ? !!t.isAssetBound && t.assetId === a.assignedAssetId
      : !t.isAssetBound && t.empId === a.empId);
  });
  const events = buildLicenseTimeline({
    ...license,
    purchaseDate: seat.seatPurchaseDate || license.purchaseDate,
    supplier: seat.seatSupplier || license.supplier,
    cost: seat.seatCost || '',
  }, tx, employees);
  // reason ให้ UI อธิบายได้ตรงสาเหตุ: ไม่มี Key เลย / Key ซ้ำกับสิทธิ์อื่น
  const partial = !byKey && !seatId;
  return { events, partial, reason: partial ? (key ? 'dupKey' : 'noKey') : '' };
}

export function buildAccessoryItemTimeline(accessory, item, transactions = [], employees = []) {
  if (!accessory?.id || !item) return { events: [], partial: false };
  const coId = item.assignee?.checkoutId;
  const mine = transactions.filter((t) => t.assetId === accessory.id && !t.isAssetBound);
  const snOf = snByCheckout(mine, accessory.assignees || []);
  const sn = norm(item.sn);
  const tx = mine.filter((t) => {
    if (sn) return norm(snOfTx(t) || (t.checkoutId && snOf.get(t.checkoutId))) === sn;
    return !!coId && t.checkoutId === coId;
  });
  const events = buildAssetTimeline({
    id: accessory.id,
    assignees: accessory.assignees,
    purchaseHistoryLog: [],
    purchaseDate: item.purchaseDate,
    cost: item.itemCost,
    vendor: accessory.vendor,
  }, tx, [], [], employees);
  return { events, partial: !sn };
}

/* ── ไทม์ไลน์ของพนักงาน 1 คน ────────────────────────────────
   ตอบคำถาม "คนนี้เคยถือของอะไร ได้สิทธิ์อะไร คืนเมื่อไหร่"
   ใช้แทนแท็บ "ประวัติเบิก-คืน" เดิม ซึ่งเป็นรายการแบน ๆ ไม่เห็นช่วงเวลา

   แต่ละเหตุการณ์ติด cat ไว้ให้ UI กรองตามหมวดได้
   และติด tx (เอกสารต้นทาง) ไว้ให้ปุ่มพิมพ์ใบรับคืนใช้ต่อ

   @param {object} employee     เอกสารพนักงาน
   @param {array}  transactions transactions ทั้งหมด
   @param {array}  assets       ใช้ lookup SN / Asset Tag (transaction เก่าไม่ได้เก็บไว้)
   @param {array}  repairs      repair_requests ทั้งหมด
   @returns {array} เหตุการณ์ เรียงใหม่ -> เก่า                     */
export function buildEmployeeTimeline(employee, transactions = [], assets = [], repairs = []) {
  if (!employee?.id) return [];
  const assetById = new Map(assets.map((a) => [a.id, a]));
  const out = [];

  const catOf = (c) => {
    if (c === 'assets' || c === 'asset') return 'assets';
    if (c === 'licenses' || c === 'license') return 'licenses';
    return 'accessories';
  };

  const empTx = transactions.filter((t) => t.empId === employee.id);
  const snOfCheckout = snByCheckout(empTx);
  empTx
    .forEach((t) => {
      const ms = toMillis(t.timestamp);
      if (ms == null) return;
      const cat = catOf(t.category);
      const isOut = t.action === 'เบิกจ่าย';
      const note = t.remarks && t.remarks !== '-' ? t.remarks : '';

      if (cat === 'licenses') {
        const name = t.licenseName || t.assetName || 'License';
        /* สิทธิ์ที่ผูกกับ "เครื่อง" ไม่ใช่ตัวคน — แยกชนิดไว้ให้เห็นต่างกัน */
        const bound = !!t.isAssetBound;
        out.push({
          kind: bound ? (isOut ? 'licOn' : 'licOff') : (isOut ? 'seatOn' : 'seatOff'),
          ms, cat, tx: t,
          title: bound
            ? (isOut ? 'ผูก License กับเครื่องที่ถือ' : 'ถอด License จากเครื่องที่ถือ')
            : (isOut ? 'รับสิทธิ์ License' : 'คืนสิทธิ์ License'),
          by: name,
          detail: bound && t.assetName ? 'เครื่อง: ' + t.assetName : '',
          productKey: t.productKey || '', keyCode: t.keyCode || '',
          keyMissing: !t.productKey && !hasKeyField(t),
          note,
        });
        return;
      }

      /* ทรัพย์สิน / อุปกรณ์เสริม — ดึง Tag + SN จากของจริงมาช่วยระบุตัว
         (transaction รุ่นเก่าไม่ได้เก็บ sn/assetTag ไว้ในตัวมันเอง) */
      const a = cat === 'assets' ? assetById.get(t.assetId) : null;
      // รายการเบิกมี SN อยู่ใน remarks (แสดงเป็นหมายเหตุอยู่แล้ว) — เติมจากการจับคู่เฉพาะรายการคืน
      const snText = t.sn || (!isOut && t.checkoutId && snOfCheckout.get(t.checkoutId)) || a?.sn || '';
      const detail = [
        a?.assetTag || '',
        snText ? 'SN: ' + snText : '',
        t.condition ? 'สภาพ: ' + t.condition : '',
      ].filter(Boolean).join(' · ');
      const what = cat === 'assets' ? 'ทรัพย์สิน' : 'อุปกรณ์เสริม';
      const borrow = isOut && isBorrowTx(t);
      out.push({
        kind: isOut ? 'checkout' : 'checkin',
        ms, cat, tx: t,
        title: (borrow ? 'ยืม' : isOut ? 'เบิก' : 'คืน') + what,
        chip: borrow ? BORROW_CHIP : undefined,
        by: t.assetName || '—',
        detail: [borrow ? borrowDetail(t) : '', detail].filter(Boolean).join(' · '),
        note,
        broken: t.condition === 'ชำรุด',
      });
    });

  /* งานแจ้งซ่อมที่พนักงานคนนี้เป็นคนแจ้ง */
  repairs
    .filter((r) => r.empId === employee.id)
    .forEach((r) => {
      const ms = toMillis(r.timestamp ?? r.createdAt);
      if (ms == null) return;
      out.push({
        kind: 'repair', ms, cat: 'repair', tx: r,
        title: 'แจ้งซ่อม',
        by: r.assetName || '—',
        detail: r.status || '',
        note: r.issue || r.problem || '',
      });
    });

  return out.sort((a, b) => b.ms - a.ms);
}

/* ── สรุปหัวการ์ด ────────────────────────────────────────────
   holderKinds ต่างกันตามบริบท:
     ทรัพย์สิน -> ['checkout']            = คนที่เคยถือเครื่อง
     License   -> ['seatOn', 'licOn']   = คน + เครื่องที่เคยใช้สิทธิ์  */
export function summarize(events, holderKinds = ['checkout']) {
  const assigns = events.filter((e) => holderKinds.includes(e.kind));
  const holders = new Set(assigns.map((e) => e.who || e.by).filter((x) => x && x !== '—'));
  const first = events.length ? events[events.length - 1].ms : null;
  return {
    total: events.length,
    holders: holders.size,
    assigns: assigns.length,
    firstMs: first,
    ageLabel: first ? spanLabel(first, Date.now()) : '',
  };
}
