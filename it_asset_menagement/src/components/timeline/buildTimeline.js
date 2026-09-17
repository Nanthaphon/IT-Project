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

/* ── ไทม์ไลน์ของทรัพย์สิน 1 ชิ้น ─────────────────────────────
   @param {object}  asset         เอกสาร asset (ใช้ purchaseHistoryLog + วันที่ซื้อ)
   @param {array}   transactions  transactions ทั้งหมดที่โหลดมา
   @param {array}   repairs       repair_requests ทั้งหมด
   @returns {array} เหตุการณ์ เรียงใหม่ -> เก่า                     */
export function buildAssetTimeline(asset, transactions = [], repairs = [], licenses = []) {
  if (!asset?.id) return [];

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
  transactions
    .filter((t) => t.assetId === asset.id && !t.isAssetBound)
    .forEach((t) => {
      const ms = toMillis(t.timestamp);
      if (t.action === 'เบิกจ่าย') {
        push('checkout', ms, {
          title: 'เบิกจ่ายให้พนักงาน',
          by: t.empName || t.empId || '—',
          detail: t.condition ? `สภาพ: ${t.condition}` : '',
          note: t.remarks && t.remarks !== '-' ? t.remarks : '',
          checkoutId: t.checkoutId || null,
        });
      } else if (t.action === 'รับคืน' || t.action === 'ซ่อมเสร็จ/เข้าคลัง') {
        push('checkin', ms, {
          title: t.action === 'รับคืน' ? 'รับคืนจากพนักงาน' : 'ซ่อมเสร็จ / เข้าคลัง',
          by: t.empName || t.empId || '—',
          detail: t.condition ? `สภาพ: ${t.condition}` : '',
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
export function buildLicenseTimeline(license, transactions = []) {
  if (!license?.id) return [];
  const name = String(license.name || '').trim().toLowerCase();

  const mine = transactions.filter((t) => {
    if (t.category !== 'licenses') return false;
    if (t.licenseId) return t.licenseId === license.id;
    if (!name) return false;
    // รุ่นเก่า: ชื่อ license ถูกเก็บไว้ที่ licenseName หรือ assetName แล้วแต่เส้นทาง
    const a = String(t.licenseName || '').trim().toLowerCase();
    const b = String(t.assetName || '').trim().toLowerCase();
    return a === name || (!t.isAssetBound && b === name);
  });

  const out = [];
  mine.forEach((t) => {
    const ms = toMillis(t.timestamp);
    if (ms == null) return;
    const matchedByName = !t.licenseId;
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
        by: t.empName || t.empId || '—',
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

/* ── สรุปหัวการ์ด ────────────────────────────────────────────
   holderKinds ต่างกันตามบริบท:
     ทรัพย์สิน -> ['checkout']            = คนที่เคยถือเครื่อง
     License   -> ['seatOn', 'licOn']   = คน + เครื่องที่เคยใช้สิทธิ์  */
export function summarize(events, holderKinds = ['checkout']) {
  const assigns = events.filter((e) => holderKinds.includes(e.kind));
  const holders = new Set(assigns.map((e) => e.by).filter((x) => x && x !== '—'));
  const first = events.length ? events[events.length - 1].ms : null;
  return {
    total: events.length,
    holders: holders.size,
    assigns: assigns.length,
    firstMs: first,
    ageLabel: first ? spanLabel(first, Date.now()) : '',
  };
}
